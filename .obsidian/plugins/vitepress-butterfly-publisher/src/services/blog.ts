import { App, Notice } from "obsidian";

import {
  GitHubApiError,
  GitHubClient,
  GitHubRepositoryRef,
  GitHubWorkflowRun,
} from "./github";
import { ObsidianGitVaultGit } from "./vault-git";
import { ensureTemplateFiles } from "./template";
import type { PluginSettings } from "../settings";

const BLOG_TEMPLATE: GitHubRepositoryRef = {
  owner: "57Darling02",
  name: "VitePress_butterfly",
};
const DEFAULT_BRANCH = "main";
const DEPLOY_WORKFLOW_PATH = ".github/workflows/deploy.yml";

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

/**
 * Each repository has an explicit two-step flow: a read-only check first,
 * then a write action. Article repository configuration deliberately takes
 * ownership of the target branch and force-pushes the current Vault; blog
 * repository configuration only updates secrets. Every action is idempotent
 * and can be retried safely after a network interruption.
 */
export class BlogService {
  private cachedClient?: { pat: string; client: GitHubClient };
  private gitEngine?: ObsidianGitVaultGit | null;
  private verifiedPat = "";

  constructor(private readonly deps: BlogServiceDeps) {}

  /** Validates the PAT, persists the GitHub connection and syncs credentials. */
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
    // The PAT is now verified: persist the connection and sync it into
    // obsidian-git so daily pushes use the same validated credential. A
    // missing git plugin is not an error.
    await this.deps.saveSettings({
      githubConnection: { login: user.login, verifiedAt: Date.now() },
    });
    this.getGitEngine()?.setCredentials(user.login, pat);
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
    const settings = this.requireConnectedRepositoryNames("检测文章仓库");
    const client = this.client();
    const user = await client.getAuthenticatedUser();
    const article = { owner: user.login, name: validateRepoName(settings.repoName, "文章仓库") };
    return this.probeRepository(client, article, settings.pendingArticleRepo);
  }

  async checkBlogRepository(): Promise<RepoCheckResult> {
    const settings = this.requireConnectedRepositoryNames("检测博客仓库");
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

  /**
   * Creates the template files (site_config.yml, public/, trigger workflow)
   * so a fresh vault can publish without the template repository. Idempotent.
   */
  async ensureTemplateFiles(): Promise<string[]> {
    return ensureTemplateFiles(this.deps.app);
  }

  /**
   * Reports whether the local article repository already has commit history.
   * A vault opened from a ZIP download has no Git history at all.
   */
  async checkLocalArticleGit(): Promise<{ hasHistory: boolean }> {
    const settings = this.requireConnectedRepositoryNames("检测本地 Git");
    const user = await this.client().getAuthenticatedUser();
    const article = { owner: user.login, name: validateRepoName(settings.repoName, "文章仓库") };
    const git = this.getGitEngine();
    if (!git) {
      return { hasHistory: false };
    }
    try {
      await git.ensureReady();
      return { hasHistory: await git.hasCommit() };
    } catch {
      return { hasHistory: false };
    }
  }

  /**
   * Pulls an existing article repository into a vault that has no Git
   * history (for example after unzipping the template). It initializes Git,
   * pins origin to the authenticated URL, fetches and checks out the remote
   * main branch: files that exist locally are replaced by the remote
   * version, while files that only exist locally stay untouched.
   */
  async syncArticleFromRemote(): Promise<RepositoryConfigurationResult> {
    const settings = this.requireConnectedRepositoryNames("从远端同步文章仓库");
    const client = this.client();
    const user = await client.getAuthenticatedUser();
    const article = { owner: user.login, name: validateRepoName(settings.repoName, "文章仓库") };

    const git = await this.requireGitEngine(article, settings.pat);
    await git.init();
    await git.setRemote("origin", authenticatedGitHubUrl(article, settings.pat));
    await git.fetch("origin");
    await git.checkoutRemote(DEFAULT_BRANCH, "origin");
    await git.setConfig("branch.main.remote", "origin");
    await git.setConfig("branch.main.merge", `refs/heads/${DEFAULT_BRANCH}`);

    return { repository: article, created: false, initialized: true };
  }

  /** Existing article repository: update BLOG_REPO and PAT only. */
  async configureArticleSecretsOnly(): Promise<RepositoryConfigurationResult> {
    const settings = this.requireConnectedRepositoryNames("配置文章仓库");
    const client = this.client();
    const user = await client.getAuthenticatedUser();
    const article = { owner: user.login, name: validateRepoName(settings.repoName, "文章仓库") };
    const blogName = validateRepoName(settings.blogRepoName, "博客仓库");

    // The repository already exists: never touch its content, but make sure
    // the local Git repository exists and its origin carries the PAT. Without
    // this, pulls and pushes fall back to the system credential helper, which
    // pops a multi-account picker despite the PAT already being configured.
    await this.ensureLocalRepository(article, settings.pat);
    await this.writeArticleSecrets(client, article, user.login, blogName, settings.pat);
    if (settings.pendingArticleRepo) {
      await this.deps.saveSettings({ pendingArticleRepo: "" });
    }
    return { repository: article, created: false, initialized: false };
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
    const settings = this.requireConnectedRepositoryNames("配置文章仓库");
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
    const settings = this.requireConnectedRepositoryNames("配置博客仓库");
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
    const settings = this.requireConnectedRepositoryNames("创建博客仓库");
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

  /**
   * Dispatches a rebuild to the blog repository and returns the trigger
   * timestamp so the console can match the resulting workflow run.
   */
  async triggerDeploy(): Promise<number> {
    const settings = this.requireConnectedPat("触发部署");
    const blogName = validateRepoName(settings.blogRepoName, "博客仓库");
    const client = this.client();
    const user = await client.getAuthenticatedUser();
    await client.dispatchRepositoryEvent(
      { owner: user.login, name: blogName },
      "contents-updated",
    );
    return Date.now();
  }

  /** True when the console has finished repository initialization. */
  isInitialized(): boolean {
    const init = this.deps.getSettings().initialization;
    return Boolean(init && init.articleReady && init.blogReady && init.pagesReady && init.completedAt);
  }

  /** Lists recent Deploy Site runs from the blog repository. */
  async getDeploymentRuns(): Promise<GitHubWorkflowRun[]> {
    const settings = this.requirePat("读取部署状态");
    const blogName = validateRepoName(settings.blogRepoName, "博客仓库");
    const client = this.client();
    const user = await client.getAuthenticatedUser();
    return client.getWorkflowRuns(
      { owner: user.login, name: blogName },
      { branch: DEFAULT_BRANCH, path: DEPLOY_WORKFLOW_PATH, perPage: 20 },
    );
  }

  /** Ensures the blog repository serves GitHub Pages from GitHub Actions. */
  async ensurePagesConfigured(): Promise<void> {
    const settings = this.requireConnectedRepositoryNames("配置 Pages");
    const client = this.client();
    const user = await client.getAuthenticatedUser();
    const blog = { owner: user.login, name: validateRepoName(settings.blogRepoName, "博客仓库") };
    await client.configurePages(blog);
  }

  /**
   * Exposes the obsidian-git engine to the console. The returned adapter is
   * lazy and may still require `ensureReady()` before use.
   */
  getGitEngine(): ObsidianGitVaultGit | null {
    if (!this.gitEngine) {
      this.gitEngine = ObsidianGitVaultGit.fromApp(this.deps.app);
    }
    return this.gitEngine;
  }

  private async requireGitEngine(
    repository: GitHubRepositoryRef,
    pat: string,
  ): Promise<ObsidianGitVaultGit> {
    const git = this.getGitEngine();
    if (!git) {
      throw new Error("未检测到已启用的 obsidian-git，请先在第三方插件中启用 Git 插件。");
    }

    git.setCredentials(repository.owner, pat);
    await git.ensureReady();
    return git;
  }

  /**
   * Prepares the local Git repository without touching the remote content:
   * initializes Git, writes the committer identity, and pins the origin URL
   * to the authenticated PAT URL. Idempotent, safe on any device.
   */
  private async ensureLocalRepository(
    repository: GitHubRepositoryRef,
    pat: string,
  ): Promise<ObsidianGitVaultGit> {
    const git = await this.requireGitEngine(repository, pat);

    await git.init();
    await git.setConfig("user.name", repository.owner);
    await git.setConfig("user.email", `${repository.owner}@users.noreply.github.com`);
    await git.setRemote("origin", authenticatedGitHubUrl(repository, pat));

    if (!(await git.hasCommit())) {
      throw new Error(
        "本地 Git 还没有提交历史：请先 git clone 文章仓库后用 Obsidian 打开，或在初始化方案中勾选覆盖后重试。",
      );
    }
    const branch = await git.branchInfo();
    if (!branch.current) {
      throw new Error("本地 Git 未生成有效分支，请重启 Obsidian 后重试。");
    }
    return git;
  }

  private async prepareLocalRepository(
    repository: GitHubRepositoryRef,
    pat: string,
  ): Promise<ObsidianGitVaultGit> {
    const git = await this.requireGitEngine(repository, pat);

    await git.init();
    await git.setConfig("user.name", repository.owner);
    await git.setConfig("user.email", `${repository.owner}@users.noreply.github.com`);

    const status = await git.status();
    if (status.all.length > 0) {
      await git.commitAll("Initialize article repository");
    }
    if (!(await git.hasCommit())) {
      throw new Error("当前 Vault 没有可上传的文件，请至少保留一个未被 .gitignore 排除的文件。");
    }

    const branch = await git.branchInfo();
    if (!branch.current) {
      throw new Error("本地 Git 未生成有效分支，请重启 Obsidian 后重试。");
    }
    if (branch.current !== DEFAULT_BRANCH) {
      if (branch.branches.includes(DEFAULT_BRANCH)) {
        throw new Error(
          `当前位于 ${branch.current} 分支，但本地已存在 main 分支；请先在 obsidian-git 中切换到 main 后重试。`,
        );
      }
      await git.createBranch(DEFAULT_BRANCH);
      // git init may have created a master branch; switch to main so the
      // local branch, upstream config and pushes all agree on main.
      await git.checkout(DEFAULT_BRANCH);
    }

    return git;
  }

  private async pushPreparedLocalRepository(
    git: ObsidianGitVaultGit,
    repository: GitHubRepositoryRef,
    pat: string,
    force: boolean,
  ): Promise<void> {
    try {
      await git.setRemote("origin", authenticatedGitHubUrl(repository, pat));
      if (force) {
        await this.forcePushPreparedLocalRepository(git, repository);
      } else {
        await git.updateUpstreamBranch(`origin/${DEFAULT_BRANCH}`);
      }
    } catch (error) {
      throw new Error(`文章仓库配置中断：${errorMessage(error)}。请直接重新点击配置按钮重试。`);
    }

    // The remote push is already complete. Reload failure should not make the
    // user repeat a successful upload; restarting Obsidian is sufficient.
    try {
      await git.reload();
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
    git: ObsidianGitVaultGit,
    repository: GitHubRepositoryRef,
  ): Promise<void> {
    const localSha = await git.resolveHead();
    const temporaryBranch = `vpb-sync-${DEFAULT_BRANCH}-${localSha.slice(0, 12)}`;
    const client = this.client();

    try {
      await client.deleteBranch(repository, temporaryBranch).catch((error: unknown) => {
        if (!(error instanceof GitHubApiError && error.status === 404)) {
          throw error;
        }
      });
      await git.push("origin", DEFAULT_BRANCH, temporaryBranch);
      await client.forceUpdateBranch(repository, DEFAULT_BRANCH, localSha);
      await git.setConfig("branch.main.remote", "origin");
      await git.setConfig("branch.main.merge", `refs/heads/${DEFAULT_BRANCH}`);
    } finally {
      // A failed cleanup is harmless: the same commit retry removes this
      // reserved branch before uploading again.
      await client.deleteBranch(repository, temporaryBranch).catch(() => undefined);
    }
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

  private requireConnectedPat(action: string): PluginSettings {
    const settings = this.requirePat(action);
    if (!settings.githubConnection) {
      throw new Error(`请先连接 GitHub，再${action}。`);
    }
    return settings;
  }

  private requireConnectedRepositoryNames(action: string): PluginSettings {
    const settings = this.requireConnectedPat(action);
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

export function authenticatedGitHubUrl(repository: GitHubRepositoryRef, pat: string): string {
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
