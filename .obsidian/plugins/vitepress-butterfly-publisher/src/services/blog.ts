import { Modal, Notice, App } from "obsidian";

import { GitHubClient, GitHubRepositoryRef, GitHubApiError, WorkflowRun } from "./github";
import { publishVault, PublishVaultResult } from "./publisher";
import { pullLatest, PullLatestResult } from "./fetcher";
import type { PluginSettings } from "../settings";

const DEFAULT_THEME_REPO = "57Darling02/VitePress_butterfly";
const SETUP_SECRETS = ["SETUP_PAT", "BLOG_REPO_NAME", "THEME_REPO", "CONFIGURE_PAGES"] as const;
const SETUP_WORKFLOW = "setup.yml";
const TRIGGER_WORKFLOW = "trigger.yml";
const DEPLOY_WORKFLOW = "deploy.yml";

export interface BlogServiceDeps {
  app: App;
  getSettings(): PluginSettings;
  savePublishedPaths(paths: string[]): Promise<void>;
}

export interface ValidateResult {
  login: string;
  repository: GitHubRepositoryRef;
  setupSecretsPresent: boolean;
}

export class BlogService {
  constructor(private readonly deps: BlogServiceDeps) {}

  /** Checks the token, resolves the current repository, and reports setup state. */
  async validate(): Promise<ValidateResult> {
    const { pat } = this.requireSettings("验证");
    const client = new GitHubClient(pat);
    const user = await client.getAuthenticatedUser();
    const repository = { owner: user.login, name: this.requireRepositoryName() };
    await client.getRepository(repository);

    const secrets = await client.listSecrets(repository);
    const setupSecretsPresent = secrets.includes("SETUP_PAT") && secrets.includes("BLOG_REPO_NAME");

    return { login: user.login, repository, setupSecretsPresent };
  }

  /**
   * Writes the setup inputs into Actions secrets (never into workflow
   * dispatch inputs), runs the Setup Blog workflow, then removes the
   * one-time secrets. The PAT therefore never appears in workflow run logs.
   */
  async setup(): Promise<void> {
    const { pat, blogRepoName, themeRepo, configurePages } = this.requireSettings("触发 Setup");
    if (!blogRepoName.trim()) {
      throw new Error("请先填写博客仓库名（例如 yourname.github.io）。");
    }

    const client = new GitHubClient(pat);
    const { repository } = await this.validate();

    await client.setActionsSecret(repository, "SETUP_PAT", pat);
    await client.setActionsSecret(repository, "BLOG_REPO_NAME", blogRepoName.trim());
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

      new Notice(`Setup 完成！博客仓库：${blogRepoName.trim()}，首次部署已触发。`);
    } finally {
      for (const name of SETUP_SECRETS) {
        await client.deleteActionsSecret(repository, name).catch(() => undefined);
      }
    }
  }

  /** Manually dispatches the rebuild trigger workflow. */
  async triggerDeploy(): Promise<void> {
    const client = this.client();
    const { repository } = await this.validate();
    await client.dispatchWorkflow(repository, TRIGGER_WORKFLOW);
    new Notice("已触发博客重建。");
  }

  /** Replaces the Vault with the latest repository content. */
  async pull(): Promise<PullLatestResult> {
    const client = this.client();
    const { repository } = await this.validate();
    const result = await pullLatest({ vault: this.deps.app.vault, client, repository });
    new Notice(
      result.changed
        ? `拉取完成：更新 ${result.updated.length} 个文件，移除 ${result.deleted.length} 个。`
        : "云端与本地已一致。",
    );
    return result;
  }

  /**
   * Publishes the Vault. When the remote has moved ahead, the ref update
   * fails and the user chooses between pulling or force-pushing.
   */
  async push(): Promise<PublishVaultResult> {
    try {
      const result = await this.publishOnce(false);
      await this.notifyAndWaitDeploy();
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
      await this.notifyAndWaitDeploy();
      return result;
    }
  }

  /** Force-publishes, discarding any remote changes. */
  async forcePush(): Promise<PublishVaultResult> {
    const result = await this.publishOnce(true);
    await this.notifyAndWaitDeploy();
    return result;
  }

  private async publishOnce(force: boolean): Promise<PublishVaultResult> {
    const client = this.client();
    const { repository } = await this.validate();
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

    await this.deps.savePublishedPaths(result.publishedPaths);
    new Notice(`已发布 ${result.publishedPaths.length} 个文件${force ? "（覆盖云端）" : ""}。`);
    return result;
  }

  private async notifyAndWaitDeploy(): Promise<void> {
    const { pat, blogRepoName } = this.requireSettings("发布");
    const client = new GitHubClient(pat);
    const { repository } = await this.validate();

    new Notice("已发布，正在触发博客构建...");
    const startedAfter = new Date();
    await client.dispatchWorkflow(repository, TRIGGER_WORKFLOW);

    if (!blogRepoName.trim()) {
      new Notice("发布成功。博客仓库名未填写，请到 GitHub Actions 查看构建状态。");
      return;
    }

    const blogRepo = { owner: repository.owner, name: blogRepoName.trim() };
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

  private requireRepositoryName(): string {
    const name = this.deps.getSettings().repoName.trim();
    if (!name) {
      throw new Error("请先在设置中填写仓库名（当前文章仓库名）。");
    }
    return name;
  }
}

/** GitHub rejects a non-force ref update when the remote has moved ahead. */
function isRefRejected(error: unknown): boolean {
  return error instanceof GitHubApiError && error.status === 422;
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

export function runConclusionText(run: WorkflowRun): string {
  return run.conclusion ?? run.status;
}
