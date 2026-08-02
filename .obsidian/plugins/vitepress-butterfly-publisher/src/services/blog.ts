import { Modal, Notice, App } from "obsidian";

import { GitHubClient, GitHubRepositoryRef, GitHubApiError } from "./github";
import { publishVault, PublishVaultResult } from "./publisher";
import {
  applyPull,
  findOverwritten,
  planPull,
  unzipAsync,
  PullPlan,
} from "./fetcher";
import type { PluginSettings } from "../settings";

const DEFAULT_THEME_REPO = "57Darling02/VitePress_butterfly";
const DEFAULT_TEMPLATE_REPO = "57Darling02/vitepress-butterfly-wiki";
const SETUP_SECRETS = ["SETUP_PAT", "BLOG_REPO_NAME", "THEME_REPO", "CONFIGURE_PAGES"] as const;
const SETUP_WORKFLOW = "setup.yml";
const TRIGGER_WORKFLOW = "trigger.yml";
const DEPLOY_WORKFLOW = "deploy.yml";

/** Secrets the content repository needs after Setup (trigger chain). */
const CONTENT_REQUIRED_SECRETS = ["PAT", "BLOG_REPO"] as const;
/** Secrets the blog repository needs after Setup (build pulls the wiki). */
const BLOG_REQUIRED_SECRETS = ["WIKI_URL", "PAT"] as const;

export interface BlogServiceDeps {
  app: App;
  getSettings(): PluginSettings;
  saveSettings(changes: Partial<PluginSettings>): Promise<void>;
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

    try {
      const repository = { owner: user.login, name };
      await client.getRepository(repository);
      return { repository, accessible: true };
    } catch {
      return { repository: { owner: user.login, name }, accessible: false };
    }
  }

  /** 4. Readiness: are both repositories' secrets fully configured? */
  async checkReady(): Promise<ReadyCheckResult> {
    const client = this.client();
    const user = await client.getAuthenticatedUser();

    const content = await this.detectRepository(client);
    const contentMissing = content
      ? missingSecrets(await client.listSecrets(content), CONTENT_REQUIRED_SECRETS)
      : [...CONTENT_REQUIRED_SECRETS];

    const blogName = this.resolveBlogRepoName(this.deps.getSettings().blogRepoName, user.login);
    const blog = { owner: user.login, name: blogName };
    let blogMissing: string[];
    try {
      blogMissing = missingSecrets(await client.listSecrets(blog), BLOG_REQUIRED_SECRETS);
    } catch {
      blogMissing = [...BLOG_REQUIRED_SECRETS];
    }

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
   * Replaces the Vault with the latest repository content. Local-only files
   * are always kept; if the remote would overwrite locally modified files,
   * the user is asked first (conflict option).
   */
  async pull(): Promise<void> {
    const client = this.client();
    const repository = await this.requireRepository(client);

    new Notice("正在拉取云端内容...");
    const zip = await client.downloadZipball(repository);
    const files = await unzipAsync(zip);
    const plan: PullPlan = planPull(this.deps.app.vault, files);
    const overwritten = await findOverwritten(this.deps.app.vault, files);

    if (overwritten.length > 0) {
      const confirmed = await confirmOverwrite(this.deps.app, overwritten);
      if (!confirmed) {
        new Notice("已取消拉取，本地修改未受影响。");
        return;
      }
    }

    const result = await applyPull(this.deps.app.vault, files, { ...plan, overwritten });
    new Notice(
      `拉取完成：更新 ${result.updated.length} 个文件`
      + (result.overwritten.length > 0 ? `，覆盖本地修改 ${result.overwritten.length} 个` : "")
      + (plan.keptLocal.length > 0 ? `，保留本地独有 ${plan.keptLocal.length} 个` : "")
      + "。",
    );
  }

  /**
   * Publishes the Vault. When the remote has moved ahead, the ref update
   * fails and the user chooses between pulling or force-pushing.
   */
  async push(): Promise<PublishVaultResult> {
    try {
      const result = await this.publishOnce(false);
      if (result.changed) {
        await this.notifyAndWaitDeploy();
      }
      return result;
    } catch (error) {
      if (!isRefRejected(error)) {
        throw error;
      }

      const confirmed = await confirmForcePush(this.deps.app);
      if (!confirmed) {
        throw new Error("已取消。请先「拉取最新」或手动处理冲突后再发布。");
      }

      const result = await this.publishOnce(true);
      if (result.changed) {
        await this.notifyAndWaitDeploy();
      }
      return result;
    }
  }

  private async publishOnce(force: boolean): Promise<PublishVaultResult> {
    const client = this.client();
    const repository = await this.requireRepository(client);
    const previousPaths = this.deps.getSettings().publishedPaths;
    const result = await publishVault({
      vault: this.deps.app.vault,
      client,
      repository,
      previouslyPublishedPaths: previousPaths,
      force,
    });

    if (!result.changed) {
      new Notice("没有需要发布的变更。");
      return result;
    }

    await this.deps.saveSettings({ publishedPaths: result.publishedPaths });
    new Notice(`已发布 ${result.publishedPaths.length} 个文件${force ? "（覆盖云端）" : ""}。`);
    return result;
  }

  private async notifyAndWaitDeploy(): Promise<void> {
    const { pat, blogRepoName } = this.requireSettings("发布");
    const client = new GitHubClient(pat);
    const repository = await this.requireRepository(client);
    const user = await client.getAuthenticatedUser();

    // The API commit triggers a push event, which runs trigger.yml and
    // dispatches the blog repository. Wait for the resulting deploy run.
    new Notice("已发布，等待博客构建...");
    const startedAfter = new Date();

    const blogRepo = { owner: repository.owner, name: this.resolveBlogRepoName(blogRepoName, user.login) };
    try {
      const run = await client.waitForWorkflowRun(blogRepo, DEPLOY_WORKFLOW, {
        event: "repository_dispatch",
        startedAfter,
        timeoutMs: 600_000,
        intervalMs: 5_000,
      });
      if (run.conclusion === "success") {
        new Notice("博客部署成功！");
      } else {
        new Notice(`博客构建未成功（${run.conclusion}），请到博客仓库 Actions 查看日志。`);
      }
    } catch (error) {
      new Notice(`发布成功，但等待构建结果超时：${error instanceof Error ? error.message : String(error)}`);
    }
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
   * content matches a fresh template zip, so the first publish is a no-op.
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
      } catch {
        // The manually entered name does not exist yet; Setup will create it.
        return null;
      }
    }

    const config = await this.deps.app.vault.adapter
      .read(".git/config")
      .catch(() => null);
    if (config) {
      const match = config.match(
        /url\s*=\s*(?:https?:\/\/|git:\/\/|git@)(?:www\.)?github\.com[:/]([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\s*$/m,
      );
      if (match) {
        return { owner: match[1], name: match[2] };
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

function missingSecrets(actual: readonly string[], required: readonly string[]): string[] {
  return required.filter((name) => !actual.includes(name));
}

/** GitHub rejects a non-force ref update when the remote has moved ahead. */
function isRefRejected(error: unknown): boolean {
  return error instanceof GitHubApiError && error.status === 422;
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

function confirmOverwrite(app: App, paths: string[]): Promise<boolean> {
  return new Promise((resolve) => {
    const modal = new Modal(app);
    modal.titleEl.setText("云端将覆盖本地修改");
    modal.contentEl.createEl("p", {
      text: `以下 ${paths.length} 个文件在本地有修改，拉取会用云端版本覆盖：`,
    });
    const listEl = modal.contentEl.createEl("ul");
    for (const path of paths.slice(0, 8)) {
      listEl.createEl("li", { text: path });
    }
    if (paths.length > 8) {
      listEl.createEl("li", { text: `... 等共 ${paths.length} 个` });
    }

    const actionsEl = modal.contentEl.createDiv({ cls: "modal-button-container" });
    const cancelButton = actionsEl.createEl("button", { text: "取消", type: "button" });
    cancelButton.addEventListener("click", () => {
      modal.close();
      resolve(false);
    });
    const overwriteButton = actionsEl.createEl("button", {
      text: "拉取并舍弃本地修改",
      cls: "mod-warning",
      type: "button",
    });
    overwriteButton.addEventListener("click", () => {
      modal.close();
      resolve(true);
    });

    modal.open();
  });
}

function confirmForcePush(app: App): Promise<boolean> {
  return new Promise((resolve) => {
    const modal = new Modal(app);
    modal.titleEl.setText("云端有更新");
    modal.contentEl.createEl("p", {
      text: "远端仓库存在本地没有的提交。请选择如何处理：",
    });
    modal.contentEl.createEl("p", {
      cls: "vitepress-butterfly-publisher-hint",
      text: "提示：如果其他设备写过内容，建议先「拉取最新」再发布，避免丢失。",
    });

    const actionsEl = modal.contentEl.createDiv({ cls: "modal-button-container" });
    const cancelButton = actionsEl.createEl("button", { text: "取消", type: "button" });
    cancelButton.addEventListener("click", () => {
      modal.close();
      resolve(false);
    });
    const forceButton = actionsEl.createEl("button", {
      text: "强制推送（覆盖云端）",
      cls: "mod-warning",
      type: "button",
    });
    forceButton.addEventListener("click", () => {
      modal.close();
      resolve(true);
    });

    modal.open();
  });
}
