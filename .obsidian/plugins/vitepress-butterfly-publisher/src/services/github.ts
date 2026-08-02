const API_URL = "https://api.github.com";
const API_VERSION = "2022-11-28";
const REQUEST_TIMEOUT_MS = 15_000;

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type QueryValue = string | number | boolean | undefined;

export interface RepoRef {
  readonly owner: string;
  readonly name: string;
}

export type GitHubRepositoryRef = RepoRef;

export interface GitHubUser {
  readonly login: string;
  readonly avatarUrl: string;
  readonly htmlUrl: string;
}

export interface GitHubRepository {
  readonly id: number;
  readonly name: string;
  readonly fullName: string;
  readonly private: boolean;
  readonly defaultBranch: string;
  readonly htmlUrl: string;
}

export class GitHubApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly url: string,
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

export class GitHubRequestTimeoutError extends Error {
  constructor(
    readonly timeoutMs: number,
    readonly url: string,
  ) {
    super(`连接 GitHub 超时（${Math.round(timeoutMs / 1000)} 秒），请检查网络后重试。`);
    this.name = "GitHubRequestTimeoutError";
  }
}

interface GitHubUserResponse {
  login: string;
  avatar_url: string;
  html_url: string;
}

interface GitHubRepositoryResponse {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
  html_url: string;
}

interface GitHubSecretPublicKeyResponse {
  key_id: string;
  key: string;
}

interface RequestOptions {
  readonly method?: HttpMethod;
  readonly query?: Readonly<Record<string, QueryValue>>;
  readonly body?: unknown;
}

export class GitHubClient {
  private readonly token: string;
  private authenticatedUser?: Promise<GitHubUser>;

  constructor(token: string) {
    this.token = token.trim();
    if (!this.token) {
      throw new Error("请先填写 GitHub PAT。");
    }
  }

  getAuthenticatedUser(): Promise<GitHubUser> {
    if (!this.authenticatedUser) {
      this.authenticatedUser = this.loadAuthenticatedUser().catch((error) => {
        // A transient network failure must not poison every later retry.
        this.authenticatedUser = undefined;
        throw error;
      });
    }
    return this.authenticatedUser;
  }

  private async loadAuthenticatedUser(): Promise<GitHubUser> {
    const user = await this.request<GitHubUserResponse>("/user");
    return {
      login: user.login,
      avatarUrl: user.avatar_url,
      htmlUrl: user.html_url,
    };
  }

  async getRepository(repository: RepoRef): Promise<GitHubRepository> {
    const result = await this.request<GitHubRepositoryResponse>(this.repositoryPath(repository));
    return this.toRepository(result);
  }

  /** Force-updates an existing branch or creates it when the repository is empty. */
  async forceUpdateBranch(repository: RepoRef, branch: string, sha: string): Promise<void> {
    try {
      await this.request<void>(this.branchRefsPath(repository, branch), {
        method: "PATCH",
        body: { sha, force: true },
      });
    } catch (error) {
      if (!(error instanceof GitHubApiError && error.status === 404)) {
        throw error;
      }
      await this.request<void>(`${this.repositoryPath(repository)}/git/refs`, {
        method: "POST",
        body: { ref: `refs/heads/${branch}`, sha },
      });
    }
  }

  async deleteBranch(repository: RepoRef, branch: string): Promise<void> {
    await this.request<void>(this.branchRefsPath(repository, branch), { method: "DELETE" });
  }

  async createRepository(options: {
    name: string;
    private: boolean;
    autoInit?: boolean;
  }): Promise<GitHubRepository> {
    const result = await this.request<GitHubRepositoryResponse>("/user/repos", {
      method: "POST",
      body: {
        name: options.name,
        private: options.private,
        auto_init: options.autoInit ?? true,
      },
    });
    return this.toRepository(result);
  }

  async createRepositoryFromTemplate(
    template: RepoRef,
    options: {
      owner: string;
      name: string;
      private: boolean;
    },
  ): Promise<GitHubRepository> {
    const result = await this.request<GitHubRepositoryResponse>(
      `${this.repositoryPath(template)}/generate`,
      {
        method: "POST",
        body: {
          owner: options.owner,
          name: options.name,
          private: options.private,
          include_all_branches: false,
        },
      },
    );
    return this.toRepository(result);
  }

  /** Writes all secrets using one public-key request; retries are safe. */
  async setActionsSecrets(
    repository: RepoRef,
    secrets: Readonly<Record<string, string>>,
  ): Promise<void> {
    const key = await this.request<GitHubSecretPublicKeyResponse>(
      `${this.repositoryPath(repository)}/actions/secrets/public-key`,
    );
    const { encryptGitHubSecret } = await import("../utils/secret");

    await Promise.all(
      Object.entries(secrets).map(async ([name, value]) => {
        const encryptedValue = await encryptGitHubSecret(value, key.key);
        await this.request<void>(
          `${this.repositoryPath(repository)}/actions/secrets/${encodeURIComponent(name)}`,
          {
            method: "PUT",
            body: {
              encrypted_value: encryptedValue,
              key_id: key.key_id,
            },
          },
        );
      }),
    );
  }

  /** Creates the Pages site when missing and selects GitHub Actions. */
  async configurePages(repository: RepoRef): Promise<void> {
    const path = `${this.repositoryPath(repository)}/pages`;
    try {
      await this.request(path);
      await this.request<void>(path, {
        method: "PUT",
        body: { build_type: "workflow" },
      });
    } catch (error) {
      if (error instanceof GitHubApiError && error.status === 404) {
        await this.request<void>(path, {
          method: "POST",
          body: { build_type: "workflow" },
        });
        return;
      }
      throw error;
    }
  }

  async dispatchRepositoryEvent(repository: RepoRef, eventType: string): Promise<void> {
    await this.request<void>(`${this.repositoryPath(repository)}/dispatches`, {
      method: "POST",
      body: { event_type: eventType },
    });
  }

  private repositoryPath(repository: RepoRef): string {
    if (!repository.owner || !repository.name) {
      throw new Error("GitHub 仓库必须包含用户名和仓库名。");
    }
    return `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`;
  }

  private branchRefsPath(repository: RepoRef, branch: string): string {
    return `${this.repositoryPath(repository)}/git/refs/heads/${encodeURIComponent(branch)}`;
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = this.url(path, options.query);
    const controller = new AbortController();
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: options.method ?? "GET",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": API_VERSION,
        },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
      });
      const text = await response.text();

      if (!response.ok) {
        throw new GitHubApiError(apiMessage(text, response.status), response.status, url);
      }
      if (response.status === 204 || text.length === 0) {
        return undefined as T;
      }

      try {
        return JSON.parse(text) as T;
      } catch {
        throw new GitHubApiError("GitHub 返回了无法解析的响应。", response.status, url);
      }
    } catch (error) {
      if (error instanceof GitHubApiError) {
        throw error;
      }
      if (timedOut || isAbortError(error)) {
        throw new GitHubRequestTimeoutError(REQUEST_TIMEOUT_MS, url);
      }
      const networkError = new Error("无法连接 GitHub，请检查网络、代理或 DNS 后重试。");
      (networkError as Error & { cause?: unknown }).cause = error;
      throw networkError;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  private url(path: string, query?: Readonly<Record<string, QueryValue>>): string {
    const url = new URL(path, API_URL);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }

  private toRepository(result: GitHubRepositoryResponse): GitHubRepository {
    return {
      id: result.id,
      name: result.name,
      fullName: result.full_name,
      private: result.private,
      defaultBranch: result.default_branch,
      htmlUrl: result.html_url,
    };
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function apiMessage(body: string, status: number): string {
  if (status === 401) {
    return "PAT 无效、已过期或权限不足。";
  }
  if (status === 403) {
    return "GitHub 拒绝访问；请使用具有 repo + workflow 权限的 Classic PAT。";
  }
  if (status === 404) {
    return "GitHub 资源不存在，或当前 PAT 无权访问。";
  }
  if (status === 422) {
    return "仓库名已被占用或请求无法处理，请检查仓库名后重试。";
  }

  try {
    const payload = JSON.parse(body);
    if (
      payload
      && typeof payload === "object"
      && "message" in payload
      && typeof payload.message === "string"
    ) {
      return `GitHub 请求失败：${payload.message}`;
    }
  } catch {
    // Ignore non-JSON error bodies.
  }

  return `GitHub 请求失败（HTTP ${status}）。`;
}
