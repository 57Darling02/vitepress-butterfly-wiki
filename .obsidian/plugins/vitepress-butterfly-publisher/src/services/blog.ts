import { App, Notice } from "obsidian";

import { GitHubApiError, GitHubClient, GitHubRepositoryRef } from "./github";
import type { PluginSettings } from "../settings";

const BLOG_TEMPLATE: GitHubRepositoryRef = {
  owner: "57Darling02",
  name: "VitePress_butterfly",
};
const DEFAULT_BRANCH = "main";

export interface BlogServiceDeps {
  app: App;
  getSettings(): PluginSettings;
  saveSettings(changes: Partial<PluginSettings>): Promise<void>;
}

export interface PatCheckResult {
  login: string;
  suggestedArticleRepoName: string;
  suggestedBlogRepoName: string;
}

export interface RepoCheckResult {
  exists: boolean;
  repository: GitHubRepositoryRef | null;
  private: boolean;
  /** True when a previous creation was interrupted and can be resumed. */
  pendingResume: boolean;
}

export interface RepositoryConfigurationResult {
  repository: GitHubRepositoryRef;
  created: boolean;
  initialized: boolean;
  warning?: string;
  /** True when the optional VERCEL_* secrets were written with this action. */
  vercelConfigured?: boolean;
}

interface ObsidianGitManager {
  init(): Promise<void>;
  status(): Promise<{ all: readonly unknown[] }>;
  setRemote(remote: string, url: string): Promise<void>;
  setConfig(path: string, value: string): Promise<unknown>;
  commitAll(options: { message: string }): Promise<unknown>;
  branchInfo(): Promise<{ current?: string; branches: readonly string[] }>;
  createBranch(name: string): Promise<unknown>;
  updateUpstreamBranch(tracking: string): Promise<unknown>;
  resolveRef?(ref: string): Promise<string>;
  /** simple-git instance exposed by obsidian-git on desktop. */
  git?: {
    revparse(options: string[]): Promise<string>;
    push(remote: string, refspec: string): Promise<unknown>;
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

/**
 * Each repository has an explicit two-step flow: a read-only check first,
 * then a write action. Article repository configuration deliberately takes
 * ownership of the target branch and force-pushes the current Vault; blog
 * repository configuration only updates secrets. Every action is idempotent
 * and can be retried safely after a network interruption.
 */
export class BlogService {
  private cachedClient?: { pat: string; client: GitHubClient };
  private verifiedPat = "";

  constructor(private readonly deps: BlogServiceDeps) {}

  /** Validates the PAT and supplies low-friction default repository names. */
  async checkPat(): Promise<PatCheckResult> {
    const settings = this.requirePat("检测连通性");
    const pat = settings.pat.trim();
    this.verifiedPat = "";
    // Connectivity checks must always hit GitHub instead of reusing a cached
    // authenticated user from an earlier successful request.
    const client = this.client(true);
    const user = await client.getAuthenticatedUser();
    if (this.deps.getSettings().pat.trim() !== pat) {
      throw new Error("PAT 已在检测过程中修改，请重新检测。");
    }
    this.verifiedPat = pat;
    return {
      login: user.login,
      suggestedArticleRepoName: sanitizeRepoName(this.deps.app.vault.getName(), "my-blog-wiki"),
      suggestedBlogRepoName: `${user.login}.github.io`,
    };
  }

  invalidatePat(): void {
    this.verifiedPat = "";
    this.cachedClient = undefined;
  }

  // ------------------------------------------------------------------
  // Repository checks (read-only).
  // ------------------------------------------------------------------

  async checkArticleRepository(): Promise<RepoCheckResult> {
    const settings = this.requireVerifiedRepositoryNames("检测文章仓库");
    const client = this.client();
    const user = await client.getAuthenticatedUser();
    const article = { owner: user.login, name: validateRepoName(settings.repoName, "文章仓库") };
    return this.probeRepository(client, article, settings.pendingArticleRepo);
  }

  async checkBlogRepository(): Promise<RepoCheckResult> {
    const settings = this.requireVerifiedRepositoryNames("检测博客仓库");
    const client = this.client();
    const user = await client.getAuthenticatedUser();
    const blog = { owner: user.login, name: validateRepoName(settings.blogRepoName, "博客仓库") };
    return this.probeRepository(client, blog, settings.pendingBlogRepo);
  }

  private async probeRepository(
    client: GitHubClient,
    repository: GitHubRepositoryRef,
    pendingMarker: string,
  ): Promise<RepoCheckResult> {
    try {
      const info = await client.getRepository(repository);
      return {
        exists: true,
        repository,
        private: info.private,
        pendingResume: pendingMarker === repositoryFullName(repository),
      };
    } catch (error) {
      if (error instanceof GitHubApiError && error.status === 404) {
        return { exists: false, repository, private: false, pendingResume: false };
      }
      throw error;
    }
  }

  // ------------------------------------------------------------------
  // Article repository.
  // ------------------------------------------------------------------

  /** Existing article repository: overwrite its main branch and configure it. */
  async configureArticleRepository(): Promise<RepositoryConfigurationResult> {
    return this.syncArticleRepository();
  }

  /** Creates or force-syncs the article repository from the current Vault. */
  async createArticleRepository(): Promise<RepositoryConfigurationResult> {
    return this.syncArticleRepository();
  }

  /**
   * Prepares the local Git repository, writes secrets, then uploads or
   * force-syncs the current Vault to the target branch.
   */
  private async syncArticleRepository(): Promise<RepositoryConfigurationResult> {
    const settings = this.requireVerifiedRepositoryNames("配置文章仓库");
    const client = this.client();
    const user = await client.getAuthenticatedUser();
    const article = { owner: user.login, name: validateRepoName(settings.repoName, "文章仓库") };
    const blogName = validateRepoName(settings.blogRepoName, "博客仓库");
    const fullName = repositoryFullName(article);
    const pending = settings.pendingArticleRepo === fullName;

    const exists = await this.repositoryExists(client, article);
    const overwrite = exists && !pending;
    const git = await this.prepareLocalRepository(article, settings.pat);
    let created = false;

    if (!exists) {
      // Save intent before the request. If GitHub creates the repository but
      // the response is lost, retrying continues the upload instead of
      // mistaking it for a pre-existing repository.
      await this.deps.saveSettings({ pendingArticleRepo: fullName });
      try {
        await client.createRepository({
          name: article.name,
          private: true,
          autoInit: false,
        });
        created = true;
      } catch (error) {
        if (!(await this.createdDespiteError(client, article, error, pending))) {
          throw error;
        }
        created = true;
      }
    }

    // Write secrets before the force-push so trigger.yml sees a complete
    // configuration immediately; this avoids one skipped first deployment.
    await this.writeArticleSecrets(client, article, user.login, blogName, settings.pat);
    await this.pushPreparedLocalRepository(git, article, settings.pat, overwrite);
    await this.deps.saveSettings({ pendingArticleRepo: "" });

    return {
      repository: article,
      created,
      initialized: true,
    };
  }

  private async writeArticleSecrets(
    client: GitHubClient,
    article: GitHubRepositoryRef,
    owner: string,
    blogName: string,
    pat: string,
  ): Promise<void> {
    try {
      await client.setActionsSecrets(article, {
        BLOG_REPO: `${owner}/${blogName}`,
        PAT: pat,
      });
    } catch (error) {
      if (error instanceof GitHubApiError && error.status === 404) {
        throw new Error("文章仓库不存在或无权访问，请重新检测后再试。");
      }
      throw error;
    }
  }

  // ------------------------------------------------------------------
  // Blog repository.
  // ------------------------------------------------------------------

  /** Existing blog repository: update WIKI_URL and PAT only. */
  async configureBlogSecretsOnly(): Promise<RepositoryConfigurationResult> {
    const settings = this.requireVerifiedRepositoryNames("配置博客仓库");
    const client = this.client();
    const user = await client.getAuthenticatedUser();
    const articleName = validateRepoName(settings.repoName, "文章仓库");
    const blog = { owner: user.login, name: validateRepoName(settings.blogRepoName, "博客仓库") };

    const vercel = this.readVercelSecrets(settings);
    const vercelConfigured = await this.writeBlogSecrets(
      client, blog, user.login, articleName, settings.pat, vercel,
    );
    const warning = await this.dispatchBlogBuild(client, blog);

    if (settings.pendingBlogRepo) {
      await this.deps.saveSettings({ pendingBlogRepo: "" });
    }
    return { repository: blog, created: false, initialized: false, warning, vercelConfigured };
  }

  /**
   * Missing blog repository: create it once from the official GitHub
   * template, then configure secrets, Pages and the first build. A previous
   * interrupted creation is resumed instead of duplicated.
   */
  async createBlogRepository(): Promise<RepositoryConfigurationResult> {
    const settings = this.requireVerifiedRepositoryNames("创建博客仓库");
    const client = this.client();
    const user = await client.getAuthenticatedUser();
    const articleName = validateRepoName(settings.repoName, "文章仓库");
    const blog = { owner: user.login, name: validateRepoName(settings.blogRepoName, "博客仓库") };
    const fullName = repositoryFullName(blog);
    const pending = settings.pendingBlogRepo === fullName;

    let exists = await this.repositoryExists(client, blog);
    let created = false;

    if (exists && !pending) {
      throw new Error("博客仓库已存在。请重新检测，并选择「仅配置变量」（不会修改仓库内容）。");
    }

    if (!exists) {
      await this.deps.saveSettings({ pendingBlogRepo: fullName });
      try {
        await client.createRepositoryFromTemplate(BLOG_TEMPLATE, {
          owner: user.login,
          name: blog.name,
          private: false,
        });
        created = true;
      } catch (error) {
        if (!(await this.createdDespiteError(client, blog, error, pending))) {
          throw error;
        }
        created = true;
      }
      exists = true;
    }

    const vercel = this.readVercelSecrets(settings);
    const vercelConfigured = await this.writeBlogSecrets(
      client, blog, user.login, articleName, settings.pat, vercel,
    );

    let warning: string | undefined;
    if (created || pending) {
      try {
        await client.configurePages(blog);
      } catch (error) {
        warning = `Pages 未能自动配置：${errorMessage(error)}。可稍后在 GitHub 仓库 Settings → Pages 中选择 GitHub Actions。`;
      }

      const dispatchWarning = await this.dispatchBlogBuild(client, blog);
      warning = warning && dispatchWarning
        ? `${warning} ${dispatchWarning}`
        : warning ?? dispatchWarning;
      await this.deps.saveSettings({ pendingBlogRepo: "" });
    }

    return {
      repository: blog,
      created,
      initialized: created || pending,
      warning,
      vercelConfigured,
    };
  }

  private async dispatchBlogBuild(
    client: GitHubClient,
    blog: GitHubRepositoryRef,
  ): Promise<string | undefined> {
    try {
      await client.dispatchRepositoryEvent(blog, "contents-updated");
    } catch (error) {
      return `构建未能自动触发：${errorMessage(error)}。可稍后点击「触发构建」。`;
    }
    return undefined;
  }

  private async writeBlogSecrets(
    client: GitHubClient,
    blog: GitHubRepositoryRef,
    owner: string,
    articleName: string,
    pat: string,
    vercel: Readonly<{ token: string; orgId: string; projectId: string }>,
  ): Promise<boolean> {
    const secrets: Record<string, string> = {
      WIKI_URL: `https://github.com/${owner}/${articleName}.git`,
      PAT: pat,
    };
    // Optional Vercel deployment: only write VERCEL_* secrets when all three
    // values are provided, so existing repository secrets stay untouched.
    if (vercel.token && vercel.orgId && vercel.projectId) {
      secrets.VERCEL_TOKEN = vercel.token;
      secrets.VERCEL_ORG_ID = vercel.orgId;
      secrets.VERCEL_PROJECT_ID = vercel.projectId;
    }
    try {
      await client.setActionsSecrets(blog, secrets);
    } catch (error) {
      if (error instanceof GitHubApiError && error.status === 404) {
        throw new Error("博客仓库不存在或无权访问，请重新检测后再试。");
      }
      throw error;
    }
    return Boolean(vercel.token && vercel.orgId && vercel.projectId);
  }

  private readVercelSecrets(
    settings: PluginSettings,
  ): Readonly<{ token: string; orgId: string; projectId: string }> {
    return {
      token: settings.vercelToken.trim(),
      orgId: settings.vercelOrgId.trim(),
      projectId: settings.vercelProjectId.trim(),
    };
  }

  // ------------------------------------------------------------------
  // Shared helpers.
  // ------------------------------------------------------------------

  async triggerDeploy(): Promise<void> {
    const settings = this.requireVerifiedPat("触发部署");
    const blogName = validateRepoName(settings.blogRepoName, "博客仓库");
    const client = this.client();
    const user = await client.getAuthenticatedUser();
    await client.dispatchRepositoryEvent(
      { owner: user.login, name: blogName },
      "contents-updated",
    );
    new Notice("已触发博客重新构建。", 4_000);
  }

  private async prepareLocalRepository(
    repository: GitHubRepositoryRef,
    pat: string,
  ): Promise<{ plugin: ObsidianGitPlugin; manager: ObsidianGitManager }> {
    const git = await this.getObsidianGit(repository, pat);
    const { manager } = git;

    await manager.init();
    await manager.setConfig("user.name", repository.owner);
    await manager.setConfig("user.email", `${repository.owner}@users.noreply.github.com`);

    const status = await manager.status();
    if (status.all.length > 0) {
      await manager.commitAll({ message: "Initialize article repository" });
    }
    if (!(await this.hasLocalCommit(manager))) {
      throw new Error("当前 Vault 没有可上传的文件，请至少保留一个未被 .gitignore 排除的文件。");
    }

    const branch = await manager.branchInfo();
    if (!branch.current) {
      throw new Error("本地 Git 未生成有效分支，请重启 Obsidian 后重试。");
    }
    if (branch.current !== DEFAULT_BRANCH) {
      if (branch.branches.includes(DEFAULT_BRANCH)) {
        throw new Error(
          `当前位于 ${branch.current} 分支，但本地已存在 main 分支；请先在 obsidian-git 中切换到 main 后重试。`,
        );
      }
      await manager.createBranch(DEFAULT_BRANCH);
    }

    return git;
  }

  private async pushPreparedLocalRepository(
    git: { plugin: ObsidianGitPlugin; manager: ObsidianGitManager },
    repository: GitHubRepositoryRef,
    pat: string,
    force: boolean,
  ): Promise<void> {
    try {
      await git.manager.setRemote("origin", authenticatedGitHubUrl(repository, pat));
      if (force) {
        await this.forcePushPreparedLocalRepository(git.manager, repository);
      } else {
        await git.manager.updateUpstreamBranch(`origin/${DEFAULT_BRANCH}`);
      }
    } catch (error) {
      throw new Error(`文章仓库配置中断：${errorMessage(error)}。请直接重新点击配置按钮重试。`);
    }

    // The remote push is already complete. Reload failure should not make the
    // user repeat a successful upload; restarting Obsidian is sufficient.
    try {
      git.plugin.unloadPlugin?.();
      await git.plugin.init({ fromReload: true });
    } catch {
      new Notice("文章已上传；obsidian-git 刷新失败，请稍后重启 Obsidian。", 8_000);
    }
  }

  /**
   * Uploads the local commit to a temporary branch, then force-updates main
   * through the GitHub ref API. This works with both obsidian-git's desktop
   * and mobile engines without bundling another Git implementation.
   */
  private async forcePushPreparedLocalRepository(
    manager: ObsidianGitManager,
    repository: GitHubRepositoryRef,
  ): Promise<void> {
    const localSha = await this.resolveLocalHead(manager);
    const temporaryBranch = `vpb-sync-${DEFAULT_BRANCH}-${localSha.slice(0, 12)}`;
    const client = this.client();

    try {
      await client.deleteBranch(repository, temporaryBranch).catch((error: unknown) => {
        if (!(error instanceof GitHubApiError && error.status === 404)) {
          throw error;
        }
      });
      if (manager.git) {
        await manager.git.push("origin", `main:${temporaryBranch}`);
      } else {
        await manager.updateUpstreamBranch(`origin/${temporaryBranch}`);
      }
      await client.forceUpdateBranch(repository, DEFAULT_BRANCH, localSha);
      await manager.setConfig("branch.main.remote", "origin");
      await manager.setConfig("branch.main.merge", `refs/heads/${DEFAULT_BRANCH}`);
    } finally {
      // A failed cleanup is harmless: the same commit retry removes this
      // reserved branch before uploading again.
      await client.deleteBranch(repository, temporaryBranch).catch(() => undefined);
    }
  }

  private async resolveLocalHead(manager: ObsidianGitManager): Promise<string> {
    try {
      const head = manager.resolveRef
        ? await manager.resolveRef("HEAD")
        : manager.git
          ? await manager.git.revparse(["--verify", "HEAD"])
          : "";
      const normalized = head.trim();
      if (/^[0-9a-f]{40}$/i.test(normalized)) {
        return normalized;
      }
    } catch {
      // Fall through to the user-facing error below.
    }
    throw new Error("无法读取本地 Git 提交，请重启 Obsidian 后重试。");
  }

  private async hasLocalCommit(manager: ObsidianGitManager): Promise<boolean> {
    try {
      if (manager.resolveRef) {
        return Boolean(await manager.resolveRef("HEAD"));
      }
      if (manager.git) {
        return Boolean((await manager.git.revparse(["--verify", "HEAD"])).trim());
      }
    } catch {
      return false;
    }
    return false;
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

    plugin.localStorage.setUsername(repository.owner);
    plugin.localStorage.setPassword(pat);

    if (!plugin.gitManager) {
      await plugin.init({ fromReload: true });
    }
    const manager = plugin.gitManager;
    if (!manager) {
      throw new Error("无法初始化 obsidian-git，请重启 Obsidian 后重试。");
    }
    return { plugin, manager };
  }

  private async createdDespiteError(
    client: GitHubClient,
    repository: GitHubRepositoryRef,
    error: unknown,
    pending: boolean,
  ): Promise<boolean> {
    // 422 with a matching pending marker means a previous timed-out creation
    // actually succeeded; probe once and resume. Without the marker, a 422 is
    // a real conflict and the user must re-check.
    if (error instanceof GitHubApiError && error.status !== 422) {
      return false;
    }
    if (!pending) {
      return false;
    }
    await wait(600);
    try {
      return await this.repositoryExists(client, repository);
    } catch {
      return false;
    }
  }

  private async repositoryExists(
    client: GitHubClient,
    repository: GitHubRepositoryRef,
  ): Promise<boolean> {
    try {
      await client.getRepository(repository);
      return true;
    } catch (error) {
      if (error instanceof GitHubApiError && error.status === 404) {
        return false;
      }
      throw error;
    }
  }

  private client(forceNew = false): GitHubClient {
    const { pat } = this.requirePat("操作");
    const normalized = pat.trim();
    if (forceNew || !this.cachedClient || this.cachedClient.pat !== normalized) {
      this.cachedClient = { pat: normalized, client: new GitHubClient(normalized) };
    }
    return this.cachedClient.client;
  }

  private requirePat(action: string): PluginSettings {
    const settings = this.deps.getSettings();
    if (!settings.pat.trim()) {
      throw new Error(`请先填写 GitHub PAT，再${action}。`);
    }
    return settings;
  }

  private requireVerifiedPat(action: string): PluginSettings {
    const settings = this.requirePat(action);
    if (this.verifiedPat !== settings.pat.trim()) {
      throw new Error(`请先点击「检测连通性」验证当前 PAT，再${action}。`);
    }
    return settings;
  }

  private requireVerifiedRepositoryNames(action: string): PluginSettings {
    const settings = this.requireVerifiedPat(action);
    if (!settings.repoName.trim()) {
      throw new Error("请先填写文章仓库名。");
    }
    if (!settings.blogRepoName.trim()) {
      throw new Error("请先填写博客仓库名。");
    }
    return settings;
  }
}

function validateRepoName(value: string, label: string): string {
  const name = value.trim();
  if (!name) {
    throw new Error(`请先填写${label}名。`);
  }
  if (!/^[A-Za-z0-9._-]+$/.test(name)) {
    throw new Error(`${label}名只能包含字母、数字、点、下划线和连字符。`);
  }
  return name;
}

function sanitizeRepoName(value: string, fallback: string): string {
  const cleaned = value
    .trim()
    .replace(/[^A-Za-z0-9._-]/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || fallback;
}

function repositoryFullName(repository: GitHubRepositoryRef): string {
  return `${repository.owner}/${repository.name}`;
}

function authenticatedGitHubUrl(repository: GitHubRepositoryRef, pat: string): string {
  const owner = encodeURIComponent(repository.owner);
  const token = encodeURIComponent(pat);
  return `https://${owner}:${token}@github.com/${repository.owner}/${repository.name}.git`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : String(error);
}

function wait(durationMs: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, durationMs));
}
