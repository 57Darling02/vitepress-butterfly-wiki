import { Notice, App, Platform } from "obsidian";

import { GitHubApiError, GitHubClient, GitHubRepositoryRef } from "./github";
import type { PluginSettings } from "../settings";

const DEFAULT_THEME_REPO = "57Darling02/VitePress_butterfly";
const DEFAULT_TEMPLATE_REPO = "57Darling02/vitepress-butterfly-wiki";
const SETUP_SECRETS = ["SETUP_PAT", "BLOG_REPO_NAME", "THEME_REPO", "CONFIGURE_PAGES"] as const;
const SETUP_WORKFLOW = "setup.yml";
const TRIGGER_WORKFLOW = "trigger.yml";

/** Secrets the content repository needs after Setup (trigger chain). */
const CONTENT_REQUIRED_SECRETS = ["PAT", "BLOG_REPO"] as const;
/** Secrets the blog repository needs after Setup (build pulls the wiki). */
const BLOG_REQUIRED_SECRETS = ["WIKI_URL", "PAT"] as const;

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

export interface RepoCheckResult {
  /** Resolved repository reference, or `null` when it could not be detected. */
  repository: GitHubRepositoryRef | null;
  /** Whether the repository exists and is accessible. */
  accessible: boolean;
}

export interface ReadyCheckResult {
  /** Missing secrets in the content repository. */
  contentMissing: string[];
  /** Missing secrets in the blog repository. */
  blogMissing: string[];
  /** Whether the whole publish chain is ready. */
  ready: boolean;
}

/**
 * Initialization and deployment helper. Daily content sync (commit, push,
 * pull) is handled by the obsidian-git plugin, which works on desktop and
 * mobile alike; this service covers everything git does not: repository
 * creation, Actions secrets, Setup workflow, and rebuild triggers.
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

  /** 2. Content repository: resolve it, then verify access. */
  async checkContentRepo(): Promise<RepoCheckResult> {
    const client = this.client();
    const repository = await this.detectRepository(client);
    return { repository, accessible: repository !== null };
  }

  /** 3. Blog (theme) repository: resolve the name, then verify access. */
  async checkBlogRepo(): Promise<RepoCheckResult> {
    const client = this.client();
    const user = await client.getAuthenticatedUser();
    const name = this.resolveBlogRepoName(this.deps.getSettings().blogRepoName, user.login);

    const repository = { owner: user.login, name };
    try {
      await client.getRepository(repository);
      return { repository, accessible: true };
    } catch (error) {
      if (isNotFound(error)) {
        return { repository, accessible: false };
      }
      throw error;
    }
  }

  /** 4. Readiness: are both repositories' secrets fully configured? */
  async checkReady(): Promise<ReadyCheckResult> {
    const client = this.client();
    const user = await client.getAuthenticatedUser();

    const content = await this.detectRepository(client);
    const blogName = this.resolveBlogRepoName(this.deps.getSettings().blogRepoName, user.login);
    const blog = { owner: user.login, name: blogName };

    const [contentMissing, blogMissing] = await Promise.all([
      content
        ? getMissingSecrets(client, content, CONTENT_REQUIRED_SECRETS)
        : Promise.resolve([...CONTENT_REQUIRED_SECRETS]),
      getMissingSecrets(client, blog, BLOG_REQUIRED_SECRETS),
    ]);

    return {
      contentMissing,
      blogMissing,
      ready: contentMissing.length === 0 && blogMissing.length === 0,
    };
  }

  // ------------------------------------------------------------------
  // Actions.
  // ------------------------------------------------------------------

  /**
   * Writes the setup inputs into Actions secrets (never into workflow
   * dispatch inputs), runs the Setup Blog workflow, then removes the
   * one-time secrets. The PAT therefore never appears in workflow run logs.
   * When no repository exists yet, one is created from the template first.
   */
  async setup(): Promise<void> {
    const { pat, blogRepoName, themeRepo, configurePages } = this.requireSettings("触发 Setup");
    const client = new GitHubClient(pat);
    const user = await client.getAuthenticatedUser();

    let repository = await this.detectRepository(client);
    if (!repository) {
      repository = await this.createRepository(client, user.login);
    }
    const resolvedBlogRepoName = this.resolveBlogRepoName(blogRepoName, user.login);

    await client.setActionsSecret(repository, "SETUP_PAT", pat);
    await client.setActionsSecret(repository, "BLOG_REPO_NAME", resolvedBlogRepoName);
    await client.setActionsSecret(repository, "THEME_REPO", themeRepo.trim() || DEFAULT_THEME_REPO);
    await client.setActionsSecret(repository, "CONFIGURE_PAGES", String(configurePages));

    new Notice("Setup 工作流已启动，等待博客仓库创建完成...");
    try {
      const startedAfter = new Date();
      await client.dispatchWorkflow(repository, SETUP_WORKFLOW);
      const run = await client.waitForWorkflowRun(repository, SETUP_WORKFLOW, {
        event: "workflow_dispatch",
        startedAfter,
        timeoutMs: 600_000,
      });

      if (run.conclusion !== "success") {
        throw new Error(`Setup 工作流未成功完成（${run.conclusion}），请到仓库 Actions 页面查看日志。`);
      }

      new Notice(`Setup 完成！博客仓库：${resolvedBlogRepoName}，首次部署已触发。`);
      await this.cloneToVault().catch((error: unknown) => {
        new Notice(`Setup 完成，但自动克隆失败：${error instanceof Error ? error.message : String(error)}。可在操作区点击「克隆到本地」重试。`);
      });
    } finally {
      for (const name of SETUP_SECRETS) {
        await client.deleteActionsSecret(repository, name).catch(() => undefined);
      }
    }
  }

  /** Manually dispatches the rebuild trigger workflow. */
  async triggerDeploy(): Promise<void> {
    const client = this.client();
    const repository = await this.requireRepository(client);
    await client.dispatchWorkflow(repository, TRIGGER_WORKFLOW);
    new Notice("已触发博客重建。");
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
    const repository = await this.detectRepository(client);
    if (!repository) {
      throw new Error("未识别到文章仓库。请先在设置中填写文章仓库名，或「触发 Setup」自动创建。");
    }
    return repository;
  }

  /**
   * Creates the private content repository from the template. The template
   * content matches a fresh template zip, so cloning it yields the same
   * files the user already has.
   */
  private async createRepository(
    client: GitHubClient,
    owner: string,
  ): Promise<GitHubRepositoryRef> {
    const { repoName, templateRepo } = this.deps.getSettings();
    const name = sanitizeRepoName(repoName || this.deps.app.vault.getName());
    const template = parseRepoRef(templateRepo || DEFAULT_TEMPLATE_REPO);

    new Notice(`未识别到文章仓库，正在从模板创建 ${name} ...`);
    const created = await client.createRepositoryFromTemplate(template, {
      owner,
      name,
      private: true,
    });

    const repository = { owner, name: created.name };
    await this.deps.saveSettings({ repoName: created.name });
    new Notice(`文章仓库已创建：${owner}/${created.name}`);
    return repository;
  }

  /**
   * Resolves the content repository without requiring manual input:
   * 1. the manually entered repository name, if it exists;
   * 2. the `origin` remote from `.git/config` (desktop clones);
   * 3. a repository whose name matches the Vault folder (zip downloads).
   * Returns `null` when none of these match — Setup will create one.
   */
  private async detectRepository(client: GitHubClient): Promise<GitHubRepositoryRef | null> {
    const manual = this.deps.getSettings().repoName.trim();
    if (manual) {
      const user = await client.getAuthenticatedUser();
      try {
        await client.getRepository({ owner: user.login, name: manual });
        return { owner: user.login, name: manual };
      } catch (error) {
        if (isNotFound(error)) {
          // The manually entered name does not exist yet; Setup will create it.
          return null;
        }
        throw error;
      }
    }

    const config = await this.deps.app.vault.adapter
      .read(".git/config")
      .catch(() => null);
    if (config) {
      const repository = parseGitHubRemote(config);
      if (repository) {
        try {
          await client.getRepository(repository);
          return repository;
        } catch (error) {
          if (isNotFound(error)) {
            return null;
          }
          throw error;
        }
      }
    }

    const vaultName = this.deps.app.vault.getName();
    if (vaultName) {
      const repos = await client.listUserRepos();
      const hit = repos.find((repo) => repo.name === vaultName);
      if (hit) {
        return hit;
      }
    }

    return null;
  }
}

function yieldToUi(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, 0));
}

async function getMissingSecrets(
  client: GitHubClient,
  repository: GitHubRepositoryRef,
  required: readonly string[],
): Promise<string[]> {
  try {
    return missingSecrets(await client.listSecrets(repository), required);
  } catch (error) {
    if (isNotFound(error)) {
      return [...required];
    }
    throw error;
  }
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

function missingSecrets(actual: readonly string[], required: readonly string[]): string[] {
  return required.filter((name) => !actual.includes(name));
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
