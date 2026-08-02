import { Notice, App, Platform } from "obsidian";

import { GitHubApiError, GitHubClient, GitHubRepositoryRef } from "./github";
import type { PluginSettings } from "../settings";

const DEFAULT_THEME_REPO = "57Darling02/VitePress_butterfly";
const DEFAULT_TEMPLATE_REPO = "57Darling02/vitepress-butterfly-wiki";

export interface BlogServiceDeps {
  app: App;
  getSettings(): PluginSettings;
  saveSettings(changes: Partial<PluginSettings>): Promise<void>;
}

interface ObsidianGitManager {
  init(): Promise<void>;
  setRemote(remote: string, url: string): Promise<void>;
  fetch(remote?: string): Promise<void>;
  checkout(ref: string, remote?: string): Promise<unknown>;
  setConfig(path: string, value: string): Promise<unknown>;
  /** simple-git instance exposed by obsidian-git on desktop. */
  git?: {
    checkout(options: string[]): Promise<unknown>;
  };
}

interface ObsidianGitPlugin {
  gitManager?: ObsidianGitManager;
  localStorage?: {
    setUsername(value: string): unknown;
    setPassword(value: string): unknown;
  };
  init(options?: { fromReload?: boolean }): Promise<void>;
  unloadPlugin?(): void;
}

interface AppWithPluginRegistry extends App {
  plugins?: {
    getPlugin(id: string): unknown;
  };
}

export type RepoStatus = "create" | "configure";

export interface RepoCheckResult {
  /**
   * `create`    — the repository does not exist yet; Setup will create it.
   * `configure` — the repository exists and is accessible; Setup will reuse it.
   */
  status: RepoStatus;
  /** Resolved repository reference, or `null` when it is not available yet. */
  repository: GitHubRepositoryRef | null;
}

/**
 * Initialization and deployment helper. Daily content sync (commit, push,
 * pull) is handled by the obsidian-git plugin, which works on desktop and
 * mobile alike; this service covers everything git does not: repository
 * creation, Actions secrets, Pages configuration, and rebuild triggers.
 *
 * Setup is executed directly by the plugin through the GitHub API (no
 * workflow round-trip, no fork requirement): it creates whatever repository
 * is missing, always (re)writes both repositories' secrets, enables Actions
 * and Pages on the blog repository, then kicks off the first build.
 */
export class BlogService {
  constructor(private readonly deps: BlogServiceDeps) {}

  // ------------------------------------------------------------------
  // Step checks: each is independent and only verifies its own concern.
  // ------------------------------------------------------------------

  /** 1. PAT connectivity only. Returns the authenticated login. */
  async checkPat(): Promise<string> {
    const client = this.client();
    const user = await client.getAuthenticatedUser();
    return user.login;
  }

  /**
   * 2. Content repository: resolve it against the current user's account.
   *    A local `.git` remote that matches a repository of the user maps to
   *    `configure`; everything else maps to `create`.
   */
  async checkContentRepo(): Promise<RepoCheckResult> {
    const client = this.client();
    const { repository } = await this.detectContentRepository(client);
    return { status: repository ? "configure" : "create", repository };
  }

  /**
   * 3. Blog repository: existence check only (no fork relationship is
   *    required anymore).
   */
  async checkBlogRepo(): Promise<RepoCheckResult> {
    const client = this.client();
    const user = await client.getAuthenticatedUser();
    const repository = {
      owner: user.login,
      name: this.resolveBlogRepoName(this.deps.getSettings().blogRepoName, user.login),
    };
    const exists = await this.repositoryExists(client, repository);
    return { status: exists ? "configure" : "create", repository };
  }

  /**
   * 4. Readiness: both repositories must be in a usable state
   *    (`create` or `configure`) before Setup can run.
   */
  async checkReady(): Promise<void> {
    await this.checkContentRepo();
    await this.checkBlogRepo();
  }

  // ------------------------------------------------------------------
  // Actions.
  // ------------------------------------------------------------------

  /**
   * Runs the whole initialization directly from the plugin, so every step
   * has clear feedback and rerunning Setup is always safe:
   *
   * 1. create the content repository (private, from the wiki template) if missing;
   * 2. create the blog repository (public, from the theme template) if missing —
   *    existing repositories are reused as-is, no fork is ever required;
   * 3. always (re)write the secrets of both repositories;
   * 4. enable Actions and configure Pages on the blog repository;
   * 5. dispatch the first build directly;
   * 6. initialize the local Git working copy for obsidian-git.
   */
  async setup(): Promise<void> {
    const { pat, blogRepoName, themeRepo, configurePages } = this.requireSettings("触发 Setup");
    const client = this.client();
    const user = await client.getAuthenticatedUser();

    // 1. Content repository.
    const content = await this.detectContentRepository(client);
    if (!content.repository) {
      content.repository = await this.createRepository(client, user.login, content.preferredName);
    }

    // 2. Blog repository (plain repository from the theme template; no fork).
    const blog = {
      owner: user.login,
      name: this.resolveBlogRepoName(blogRepoName, user.login),
    };
    if (!(await this.repositoryExists(client, blog))) {
      const theme = parseRepoRef(themeRepo.trim() || DEFAULT_THEME_REPO);
      new Notice(`博客仓库不存在，正在从主题模板创建 ${blog.name} ...`);
      await client.createRepositoryFromTemplate(theme, {
        owner: user.login,
        name: blog.name,
        private: false,
      });
    }

    // 3. Secrets are always (re)written, keeping reruns idempotent.
    await client.setActionsSecret(blog, "WIKI_URL", `https://github.com/${content.repository.owner}/${content.repository.name}.git`);
    await client.setActionsSecret(blog, "PAT", pat);
    await client.setActionsSecret(content.repository, "BLOG_REPO", `${blog.owner}/${blog.name}`);
    await client.setActionsSecret(content.repository, "PAT", pat);

    // 4. Enable Actions and GitHub Pages on the blog repository.
    await client.enableActions(blog);
    if (configurePages) {
      await client.configurePages(blog);
    }

    // 5. Kick off the first build directly.
    await client.dispatchRepositoryEvent(blog, "contents-updated");
    new Notice(`Setup 完成！博客仓库：${blog.name}，首次部署已触发。`);

    // 6. Initialize the local Git working copy for obsidian-git.
    await this.cloneToVault().catch((error: unknown) => {
      new Notice(`Setup 完成，但本地 Git 初始化失败：${error instanceof Error ? error.message : String(error)}。可在操作区点击「克隆到本地」重试。`);
    });
  }

  /** Directly asks the blog repository to rebuild (no workflow round-trip). */
  async triggerDeploy(): Promise<void> {
    const client = this.client();
    const user = await client.getAuthenticatedUser();
    const blog = {
      owner: user.login,
      name: this.resolveBlogRepoName(this.deps.getSettings().blogRepoName, user.login),
    };

    try {
      await client.dispatchRepositoryEvent(blog, "contents-updated");
    } catch (error) {
      if (isNotFound(error)) {
        throw new Error("博客仓库不存在，请先「触发 Setup」。");
      }
      throw error;
    }
    new Notice("已触发博客仓库重建。");
  }

  /**
   * Clones the content repository into the Vault root (creates `.git`), so
   * obsidian-git can Commit / Push / Pull without manual setup.
   */
  async cloneToVault(): Promise<void> {
    const { pat } = this.requireSettings("克隆");
    const client = new GitHubClient(pat);
    const repository = await this.requireRepository(client);

    const existingConfig = await this.deps.app.vault.adapter.read(".git/config").catch(() => null);
    if (existingConfig) {
      const existingRepository = parseGitHubRemote(existingConfig);
      if (!existingRepository) {
        throw new Error("当前 Vault 已有无法识别的 Git 远程配置，为避免覆盖已停止初始化。");
      }
      if (!sameRepository(existingRepository, repository)) {
        throw new Error(
          `当前 Vault 已连接 ${existingRepository.owner}/${existingRepository.name}，不会覆盖为 ${repository.owner}/${repository.name}。`,
        );
      }

      const [hasHead, hasIndex] = await Promise.all([
        this.deps.app.vault.adapter.exists(".git/HEAD"),
        this.deps.app.vault.adapter.exists(".git/index"),
      ]);
      if (hasHead && hasIndex) {
        await this.updateObsidianGitCredentials(repository, pat);
        new Notice("当前 Vault 的 Git 工作副本已就绪，凭据已更新。");
        return;
      }
    }

    new Notice(`正在初始化 ${repository.owner}/${repository.name} 的 Git 工作副本...`);
    await yieldToUi();
    await this.initializeWithObsidianGit(repository, pat);
    new Notice("初始化完成！现在可以用 obsidian-git 进行 Commit / Push / Pull。");
  }

  /**
   * Reuses the bundled obsidian-git engine instead of shipping a second copy
   * of isomorphic-git. The vault is non-empty, so this initializes, fetches,
   * then checks out the generated template repository in place.
   */
  private async initializeWithObsidianGit(
    repository: GitHubRepositoryRef,
    pat: string,
  ): Promise<void> {
    const { plugin, manager } = await this.getObsidianGit(repository, pat);
    const ref = "main";
    const remote = "origin";

    await manager.init();
    await manager.setRemote(remote, authenticatedGitHubUrl(repository, pat));
    await manager.fetch(remote);

    if (Platform.isDesktopApp) {
      if (!manager.git) {
        throw new Error("当前 obsidian-git 桌面端接口不兼容，请更新模板后重试。");
      }
      // Force checkout is required because a downloaded template vault is not empty.
      await manager.git.checkout(["-f", "-B", ref, `${remote}/${ref}`]);
    } else {
      // obsidian-git's mobile manager uses isomorphic-git and forces the checkout.
      await manager.checkout(ref, remote);
    }

    await manager.setConfig(`branch.${ref}.remote`, remote);
    await manager.setConfig(`branch.${ref}.merge`, `refs/heads/${ref}`);
    plugin.unloadPlugin?.();
    await plugin.init({ fromReload: true });
  }

  private async updateObsidianGitCredentials(
    repository: GitHubRepositoryRef,
    pat: string,
  ): Promise<void> {
    const { manager } = await this.getObsidianGit(repository, pat);
    await manager.setRemote("origin", authenticatedGitHubUrl(repository, pat));
  }

  private async getObsidianGit(
    repository: GitHubRepositoryRef,
    pat: string,
  ): Promise<{ plugin: ObsidianGitPlugin; manager: ObsidianGitManager }> {
    const registry = (this.deps.app as AppWithPluginRegistry).plugins;
    const plugin = registry?.getPlugin("obsidian-git") as ObsidianGitPlugin | null | undefined;
    if (!plugin) {
      throw new Error("未检测到已启用的 obsidian-git，请先启用它再重试。");
    }
    if (!plugin.localStorage) {
      throw new Error("obsidian-git 尚未初始化，请重启 Obsidian 后重试。");
    }

    // GitHub Basic authentication accepts the account login and PAT.
    plugin.localStorage.setUsername(repository.owner);
    plugin.localStorage.setPassword(pat);

    if (!plugin.gitManager) {
      await plugin.init({ fromReload: true });
    }
    const manager = plugin.gitManager;
    if (!manager) {
      throw new Error("无法初始化 obsidian-git，请确认内置插件版本完整。");
    }

    return { plugin, manager };
  }

  private client(): GitHubClient {
    const { pat } = this.requireSettings("操作");
    return new GitHubClient(pat);
  }

  private requireSettings(action: string): PluginSettings {
    const settings = this.deps.getSettings();
    if (!settings.pat.trim()) {
      throw new Error(`请先在设置中填写 GitHub PAT 再${action}。`);
    }
    return settings;
  }

  private resolveBlogRepoName(value: string, login: string): string {
    return value.trim() || `${login}.github.io`;
  }

  private async requireRepository(client: GitHubClient): Promise<GitHubRepositoryRef> {
    const { repository } = await this.detectContentRepository(client);
    if (!repository) {
      throw new Error("未识别到文章仓库。请先在设置中填写文章仓库名，或「触发 Setup」自动创建。");
    }
    return repository;
  }

  /**
   * Creates the private content repository from the wiki template. The
   * template content matches a fresh template zip, so cloning it yields the
   * same files the user already has.
   */
  private async createRepository(
    client: GitHubClient,
    owner: string,
    name: string,
  ): Promise<GitHubRepositoryRef> {
    const { templateRepo } = this.deps.getSettings();
    const template = parseRepoRef(templateRepo || DEFAULT_TEMPLATE_REPO);
    const safeName = sanitizeRepoName(name);

    new Notice(`未识别到文章仓库，正在从模板创建 ${safeName} ...`);
    const created = await client.createRepositoryFromTemplate(template, {
      owner,
      name: safeName,
      private: true,
    });

    const repository = { owner, name: created.name };
    await this.deps.saveSettings({ repoName: created.name });
    new Notice(`文章仓库已创建：${owner}/${created.name}`);
    return repository;
  }

  /**
   * Resolves the content repository against the current user's account:
   * 1. the manually entered repository name (exists → `configure`, missing → `create`);
   * 2. the `origin` remote from `.git/config`, but only when it points at a
   *    repository of the current user (desktop clones);
   * 3. a repository whose name matches the Vault folder (zip downloads).
   * Returns the resolved repository (or `null`) together with the preferred
   * name to use when Setup needs to create one.
   */
  private async detectContentRepository(
    client: GitHubClient,
  ): Promise<{ repository: GitHubRepositoryRef | null; preferredName: string }> {
    const manual = this.deps.getSettings().repoName.trim();
    if (manual) {
      const user = await client.getAuthenticatedUser();
      const candidate = { owner: user.login, name: manual };
      const exists = await this.repositoryExists(client, candidate);
      return { repository: exists ? candidate : null, preferredName: manual };
    }

    const config = await this.deps.app.vault.adapter
      .read(".git/config")
      .catch(() => null);
    if (config) {
      const remote = parseGitHubRemote(config);
      if (remote) {
        const user = await client.getAuthenticatedUser();
        if (remote.owner.toLowerCase() === user.login.toLowerCase()) {
          const exists = await this.repositoryExists(client, remote);
          return { repository: exists ? remote : null, preferredName: remote.name };
        }
        // The remote points at someone else's repository: nothing usable.
        return { repository: null, preferredName: remote.name };
      }
    }

    const vaultName = this.deps.app.vault.getName();
    if (vaultName) {
      const repos = await client.listUserRepos();
      const hit = repos.find((repo) => repo.name === vaultName);
      if (hit) {
        return { repository: hit, preferredName: vaultName };
      }
      return { repository: null, preferredName: vaultName };
    }

    return { repository: null, preferredName: "my-blog" };
  }

  private async repositoryExists(
    client: GitHubClient,
    repository: GitHubRepositoryRef,
  ): Promise<boolean> {
    try {
      await client.getRepository(repository);
      return true;
    } catch (error) {
      if (isNotFound(error)) {
        return false;
      }
      throw error;
    }
  }
}

function yieldToUi(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, 0));
}

function isNotFound(error: unknown): boolean {
  return error instanceof GitHubApiError && error.status === 404;
}

function parseGitHubRemote(config: string): GitHubRepositoryRef | null {
  const match = config.match(
    /url\s*=\s*(?:https?:\/\/(?:[^@\s/]+@)?|git:\/\/|git@)(?:www\.)?github\.com[:/]([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\s*$/m,
  );
  return match ? { owner: match[1], name: match[2] } : null;
}

function sameRepository(left: GitHubRepositoryRef, right: GitHubRepositoryRef): boolean {
  return left.owner.toLowerCase() === right.owner.toLowerCase()
    && left.name.toLowerCase() === right.name.toLowerCase();
}

function authenticatedGitHubUrl(repository: GitHubRepositoryRef, pat: string): string {
  const owner = encodeURIComponent(repository.owner);
  const token = encodeURIComponent(pat);
  return `https://${owner}:${token}@github.com/${repository.owner}/${repository.name}.git`;
}

function sanitizeRepoName(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[^A-Za-z0-9._-]/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "my-blog";
}

function parseRepoRef(value: string): GitHubRepositoryRef {
  const match = value.trim().match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
  if (!match) {
    throw new Error(`模板仓库格式应为 owner/repository：${value}`);
  }
  return { owner: match[1], name: match[2] };
}
