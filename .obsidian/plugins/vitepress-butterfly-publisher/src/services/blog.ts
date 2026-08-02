import { Notice, App, Platform } from "obsidian";

import { GitHubApiError, GitHubClient, GitHubRepositoryRef } from "./github";
import type { PluginSettings } from "../settings";

const DEFAULT_THEME_REPO = "57Darling02/VitePress_butterfly";

/**
 * The deploy workflow installed on the blog repository. It is a thin shell:
 * every build first force-syncs the theme source (git reset --hard upstream),
 * so the blog repository never drifts from the theme — its own content does
 * not matter. The workflow file itself is restored after the reset, keeping
 * it owned by this plugin (single source of truth, no drift).
 */
const BLOG_DEPLOY_WORKFLOW = `name: Deploy Site

on:
  push:
    branches: [main]
  workflow_dispatch:
  repository_dispatch:
    types: [contents-updated]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: site-deploy
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Sync theme source
        env:
          THEME_REPO: \${{ secrets.THEME_REPO }}
        run: |
          set -euo pipefail
          THEME_REPO="\${THEME_REPO:-57Darling02/VitePress_butterfly}"
          cp .github/workflows/deploy.yml /tmp/vpb-deploy.yml
          git remote add upstream "https://github.com/$THEME_REPO.git"
          git fetch --depth=1 upstream main
          git reset --hard upstream/main
          mkdir -p .github/workflows
          cp /tmp/vpb-deploy.yml .github/workflows/deploy.yml

      - name: Install pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build with VitePress
        env:
          WIKI_URL: \${{ secrets.WIKI_URL }}
          PAT: \${{ secrets.PAT }}
        run: pnpm docs:build

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: .vitepress/dist

  deploy-pages:
    name: Deploy GitHub Pages
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`;

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
  /** Resolved repository reference, or `null` when the name is undetermined. */
  repository: GitHubRepositoryRef | null;
  /** Whether deploying can proceed for this repository. */
  ready: boolean;
}

/**
 * Initialization and deployment helper. Daily content sync (commit, push,
 * pull) is handled by the obsidian-git plugin; this service covers everything
 * git does not: repository creation, force-pushing the local vault content,
 * Actions secrets, Pages configuration, and rebuild triggers.
 *
 * "Deploy theme" runs entirely from the plugin through the GitHub API:
 * the content repository is overwritten with the local vault content (the
 * local folder is the single source of truth and always ends up with a full
 * `.git` working copy), the blog repository is a pure deployment shell whose
 * content is force-synced to the theme on every build.
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
   * 2. Content repository: resolve the target name (manual, local Git
   *    remote, or Vault name). Existence does not matter — deploying will
   *    create it and overwrite it with the local content.
   */
  async checkContentRepo(): Promise<RepoCheckResult> {
    const client = this.client();
    const { repository } = await this.detectContentRepository(client);
    return { repository, ready: repository !== null };
  }

  /**
   * 3. Blog repository: resolve the name only. Existence and content do not
   *    matter — deploying creates it when missing, and every build overwrites
   *    it with the latest theme.
   */
  async checkBlogRepo(): Promise<RepoCheckResult> {
    const client = this.client();
    const user = await client.getAuthenticatedUser();
    const repository = {
      owner: user.login,
      name: this.resolveBlogRepoName(this.deps.getSettings().blogRepoName, user.login),
    };
    return { repository, ready: true };
  }

  /** 4. Readiness: both repositories must be resolvable before deploying. */
  async checkReady(): Promise<void> {
    await this.checkContentRepo();
    await this.checkBlogRepo();
  }

  // ------------------------------------------------------------------
  // Actions.
  // ------------------------------------------------------------------

  /**
   * Deploys the theme:
   *
   * 1. ensure the content repository exists (private, empty) and overwrite
   *    its default branch with the local vault content (API force push);
   * 2. ensure the blog repository exists (public, empty) — an existing one
   *    is reused as-is, its content is irrelevant;
   * 3. enable Actions, write all secrets and configure Pages;
   * 4. install the thin deploy workflow on the blog repository — this push
   *    itself triggers the first build, which force-syncs the theme;
   * 5. turn the local vault into a full Git working copy (obsidian-git).
   *
   * Rerunning is safe: everything is idempotent, and the local content
   * always wins on the content repository.
   */
  async setup(): Promise<void> {
    const { pat, blogRepoName, themeRepo, configurePages } = this.requireSettings("部署主题");
    const client = this.client();
    const user = await client.getAuthenticatedUser();

    // 1. Content repository: create when missing, then force-push local content.
    const content = await this.detectContentRepository(client);
    if (!content.repository) {
      throw new Error("未解析出文章仓库名：请先在设置中填写文章仓库名，或从 Git 克隆打开本目录。");
    }
    if (!(await this.repositoryExists(client, content.repository))) {
      content.repository = await this.createContentRepository(
        client,
        user.login,
        content.repository.name,
      );
    }
    const contentBranch = (await client.getRepository(content.repository)).defaultBranch;
    const files = await this.collectVaultFiles();
    new Notice(`正在推送本地内容到 ${content.repository.owner}/${content.repository.name} ...`);
    await client.pushFiles(content.repository, contentBranch, files, {
      message: "Deploy theme: sync local vault content",
      authorName: user.login,
      authorEmail: `${user.login}@users.noreply.github.com`,
    });

    // 2. Blog repository: create when missing; existing ones are reused
    //    without any content check (every build overwrites them anyway).
    const blog = {
      owner: user.login,
      name: this.resolveBlogRepoName(blogRepoName, user.login),
    };
    if (!(await this.repositoryExists(client, blog))) {
      new Notice(`博客仓库不存在，正在创建 ${blog.name} ...`);
      await client.createRepository({ name: blog.name, private: false });
    }

    // 3. Wire everything: Actions, secrets, Pages.
    await client.enableActions(blog);
    await client.setActionsSecret(blog, "WIKI_URL", `https://github.com/${content.repository.owner}/${content.repository.name}.git`);
    await client.setActionsSecret(blog, "PAT", pat);
    await client.setActionsSecret(blog, "THEME_REPO", themeRepo.trim() || DEFAULT_THEME_REPO);
    await client.setActionsSecret(content.repository, "BLOG_REPO", `${blog.owner}/${blog.name}`);
    await client.setActionsSecret(content.repository, "PAT", pat);
    if (configurePages) {
      await client.configurePages(blog);
    }

    // 4. Install the deploy workflow; this push triggers the first build.
    await client.putFile(blog, ".github/workflows/deploy.yml", BLOG_DEPLOY_WORKFLOW, "Deploy theme: install deploy workflow");

    // 5. Make the local vault a full Git working copy for obsidian-git.
    await this.ensureLocalGit(content.repository, contentBranch, pat);

    new Notice(`部署完成！博客仓库：${blog.name}，首次构建已触发。`);
  }

  /** Directly asks the blog repository to rebuild. */
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
        throw new Error("博客仓库不存在，请先「部署主题」。");
      }
      throw error;
    }
    new Notice("已触发博客仓库重建。");
  }

  /**
   * Ensures the local vault is a complete Git working copy pointing at the
   * content repository, so obsidian-git can Commit / Push / Pull directly.
   */
  private async ensureLocalGit(
    repository: GitHubRepositoryRef,
    branch: string,
    pat: string,
  ): Promise<void> {
    const existingConfig = await this.deps.app.vault.adapter
      .read(".git/config")
      .catch(() => null);
    if (existingConfig) {
      const existingRepository = parseGitHubRemote(existingConfig);
      if (existingRepository && !sameRepository(existingRepository, repository)) {
        throw new Error(
          `当前 Vault 已连接 ${existingRepository.owner}/${existingRepository.name}，不会覆盖为 ${repository.owner}/${repository.name}。`,
        );
      }
    }

    const { plugin, manager } = await this.getObsidianGit(repository, pat);
    const remote = "origin";

    await manager.init();
    await manager.setRemote(remote, authenticatedGitHubUrl(repository, pat));
    await manager.fetch(remote);

    if (Platform.isDesktopApp) {
      if (!manager.git) {
        throw new Error("当前 obsidian-git 桌面端接口不兼容，请更新模板后重试。");
      }
      // Force checkout aligns local HEAD/index with the branch we just wrote.
      await manager.git.checkout(["-f", "-B", branch, `${remote}/${branch}`]);
    } else {
      // obsidian-git's mobile manager uses isomorphic-git and forces the checkout.
      await manager.checkout(branch, remote);
    }

    await manager.setConfig(`branch.${branch}.remote`, remote);
    await manager.setConfig(`branch.${branch}.merge`, `refs/heads/${branch}`);
    plugin.unloadPlugin?.();
    await plugin.init({ fromReload: true });
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

  /**
   * Collects the vault files to push, honoring the vault's `.gitignore`
   * (so plugin data containing the PAT never leaves the device).
   */
  private async collectVaultFiles(): Promise<Map<string, Uint8Array>> {
    const rawRules = await this.deps.app.vault.adapter
      .read(".gitignore")
      .catch(() => null);
    const rules = parseGitignore(rawRules ?? "");

    const files = new Map<string, Uint8Array>();
    for (const file of this.deps.app.vault.getFiles()) {
      if (file.path.startsWith(".git/") || isIgnored(file.path, rules)) {
        continue;
      }
      const data = await this.deps.app.vault.adapter.readBinary(file.path);
      files.set(file.path, new Uint8Array(data));
    }
    return files;
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

  /** Creates the private content repository (empty; content is pushed next). */
  private async createContentRepository(
    client: GitHubClient,
    owner: string,
    name: string,
  ): Promise<GitHubRepositoryRef> {
    const safeName = sanitizeRepoName(name);

    new Notice(`未识别到文章仓库，正在创建 ${safeName} ...`);
    const created = await client.createRepository({ name: safeName, private: true });

    const repository = { owner, name: created.name };
    await this.deps.saveSettings({ repoName: created.name });
    new Notice(`文章仓库已创建：${owner}/${created.name}`);
    return repository;
  }

  /**
   * Resolves the content repository target:
   * 1. the manually entered repository name;
   * 2. the `origin` remote from `.git/config`, when it points at the current
   *    user's own account (desktop clones);
   * 3. a repository whose name matches the Vault folder (zip downloads).
   * Returns the resolved repository (or `null`) plus the preferred name to
   * create when deploying.
   */
  private async detectContentRepository(
    client: GitHubClient,
  ): Promise<{ repository: GitHubRepositoryRef | null; preferredName: string }> {
    const manual = this.deps.getSettings().repoName.trim();
    if (manual) {
      const user = await client.getAuthenticatedUser();
      return { repository: { owner: user.login, name: manual }, preferredName: manual };
    }

    const config = await this.deps.app.vault.adapter
      .read(".git/config")
      .catch(() => null);
    if (config) {
      const remote = parseGitHubRemote(config);
      if (remote) {
        const user = await client.getAuthenticatedUser();
        if (remote.owner.toLowerCase() === user.login.toLowerCase()) {
          return { repository: remote, preferredName: remote.name };
        }
        // The remote points at someone else's repository: not usable.
        return { repository: null, preferredName: remote.name };
      }
    }

    const vaultName = this.deps.app.vault.getName();
    if (vaultName) {
      const user = await client.getAuthenticatedUser();
      return {
        repository: { owner: user.login, name: vaultName },
        preferredName: vaultName,
      };
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

// ----------------------------------------------------------------------
// .gitignore support (subset: comments, `*` globs, trailing `/` for
// directories; negation is not needed by the template's rules).
// ----------------------------------------------------------------------

interface IgnoreRule {
  regex: RegExp;
}

function parseGitignore(content: string): IgnoreRule[] {
  const rules: IgnoreRule[] = [];
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("!")) {
      continue;
    }
    const pattern = trimmed.replace(/\/$/, "");
    rules.push({ regex: gitignoreRegex(pattern) });
  }
  return rules;
}

function gitignoreRegex(pattern: string): RegExp {
  const body = pattern.replace(/^\//, "");
  const hasSlash = body.includes("/");
  const escaped = body
    .split("/")
    .map((segment) => segment.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*"))
    .join("/");
  if (hasSlash) {
    return new RegExp(`^${escaped}(/.*)?$`);
  }
  // A bare name matches at any depth.
  return new RegExp(`(^|/)${escaped}(/.*)?$`);
}

function isIgnored(path: string, rules: IgnoreRule[]): boolean {
  return rules.some((rule) => rule.regex.test(path));
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
