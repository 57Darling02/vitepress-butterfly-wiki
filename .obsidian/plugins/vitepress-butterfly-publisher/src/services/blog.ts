import { Notice, App } from "obsidian";

import { GitHubClient, GitHubRepositoryRef } from "./github";
import { cloneRepository } from "./gitclone";
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

    if (await this.deps.app.vault.adapter.exists(".git")) {
      new Notice("当前 Vault 已有 .git 目录，无需克隆。");
      return;
    }

    new Notice(`正在克隆 ${repository.owner}/${repository.name} 到本地...`);
    await cloneRepository({
      vault: this.deps.app.vault,
      url: `https://${pat}@github.com/${repository.owner}/${repository.name}.git`,
      token: pat,
    });
    new Notice("克隆完成！现在可以用 obsidian-git 进行 Commit / Push / Pull。");
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
