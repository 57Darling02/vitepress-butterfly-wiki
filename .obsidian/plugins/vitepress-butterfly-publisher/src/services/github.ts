const API_URL = "https://api.github.com";
const API_VERSION = "2022-11-28";
const REQUEST_TIMEOUT_MS = 15_000;
const WORKFLOW_MATCH_TOLERANCE_MS = 5_000;

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

export interface GitHubSecretPublicKey {
  readonly keyId: string;
  readonly key: string;
}

export type WorkflowInput = string | number | boolean;
export type WorkflowInputs = Readonly<Record<string, WorkflowInput>>;

export interface WorkflowDispatch {
  readonly dispatchedAt: Date;
}

export interface WorkflowRun {
  readonly id: number;
  readonly name: string;
  readonly status: string;
  readonly conclusion: string | null;
  readonly event: string;
  readonly headBranch: string;
  readonly htmlUrl: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface WorkflowRunListOptions {
  readonly branch?: string;
  readonly event?: string;
  readonly status?: string;
  readonly perPage?: number;
}

export interface WorkflowRunPollOptions extends WorkflowRunListOptions {
  readonly startedAfter?: Date;
  readonly timeoutMs?: number;
  readonly intervalMs?: number;
  readonly signal?: AbortSignal;
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
    super(`连接 GitHub 超时（${Math.round(timeoutMs / 1000)} 秒），请检查网络或代理后重试。`);
    this.name = "GitHubRequestTimeoutError";
  }
}

export class WorkflowRunTimeoutError extends Error {
  constructor(
    readonly workflow: string | number,
    readonly timeoutMs: number,
    readonly lastRun?: WorkflowRun,
  ) {
    super(`等待工作流 ${workflow} 超时（${Math.round(timeoutMs / 1000)} 秒）。`);
    this.name = "WorkflowRunTimeoutError";
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
  owner: { login: string };
}

interface GitHubSecretPublicKeyResponse {
  key_id: string;
  key: string;
}

interface GitHubWorkflowRunResponse {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  event: string;
  head_branch: string;
  html_url: string;
  created_at: string;
  updated_at: string;
}

interface GitHubWorkflowRunsResponse {
  workflow_runs: GitHubWorkflowRunResponse[];
}

interface RequestOptions {
  readonly method?: HttpMethod;
  readonly query?: Readonly<Record<string, QueryValue>>;
  readonly body?: unknown;
}

interface GitTreeEntry {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
}

export class GitHubClient {
  private readonly token: string;
  private authenticatedUser?: Promise<GitHubUser>;

  constructor(token: string) {
    this.token = token.trim();

    if (!this.token) {
      throw new Error("A GitHub personal access token is required.");
    }
  }

  getAuthenticatedUser(): Promise<GitHubUser> {
    this.authenticatedUser ??= this.loadAuthenticatedUser();
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

  /** Lists the authenticated user's repositories, most recently updated first. */
  async listUserRepos(): Promise<readonly GitHubRepositoryRef[]> {
    const result = await this.request<GitHubRepositoryResponse[]>("/user/repos", {
      query: { per_page: 100, sort: "updated" },
    });

    return result.map((repo) => ({
      owner: repo.owner.login,
      name: repo.name,
    }));
  }

  /**
   * Creates an empty repository (with a README so a default branch exists)
   * under the authenticated user. No template and no fork relationship.
   */
  async createRepository(options: {
    name: string;
    private: boolean;
  }): Promise<GitHubRepository> {
    const result = await this.request<GitHubRepositoryResponse>("/user/repos", {
      method: "POST",
      body: {
        name: options.name,
        private: options.private,
        auto_init: true,
      },
    });

    return this.toRepository(result);
  }

  /** Reads a file via the Contents API; returns `null` when it does not exist. */
  async getFileContent(
    repository: RepoRef,
    path: string,
  ): Promise<{ sha: string; content: string } | null> {
    try {
      return await this.request<{ sha: string; content: string }>(
        `${this.repositoryPath(repository)}/contents/${encodeURIComponent(path)}`,
      );
    } catch (error) {
      if (error instanceof GitHubApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async createBlob(repository: RepoRef, data: Uint8Array): Promise<{ sha: string }> {
    return this.request<{ sha: string }>(
      `${this.repositoryPath(repository)}/git/blobs`,
      {
        method: "POST",
        body: { content: base64Encode(data), encoding: "base64" },
      },
    );
  }

  /** Creates a blob from already-encoded content (used when copying repos). */
  async createBlobRaw(
    repository: RepoRef,
    content: string,
    encoding: string,
  ): Promise<{ sha: string }> {
    return this.request<{ sha: string }>(
      `${this.repositoryPath(repository)}/git/blobs`,
      {
        method: "POST",
        body: { content, encoding },
      },
    );
  }

  async createTree(
    repository: RepoRef,
    entries: readonly GitTreeEntry[],
  ): Promise<{ sha: string }> {
    return this.request<{ sha: string }>(
      `${this.repositoryPath(repository)}/git/trees`,
      {
        method: "POST",
        body: { tree: entries },
      },
    );
  }

  async createCommit(
    repository: RepoRef,
    options: {
      message: string;
      tree: string;
      parents?: readonly string[];
      author: { name: string; email: string; date: string };
    },
  ): Promise<{ sha: string }> {
    return this.request<{ sha: string }>(
      `${this.repositoryPath(repository)}/git/commits`,
      {
        method: "POST",
        body: {
          message: options.message,
          tree: options.tree,
          parents: options.parents ?? [],
          author: options.author,
        },
      },
    );
  }

  /** Moves (or creates, with force) the branch ref to a commit. */
  async updateRef(repository: RepoRef, branch: string, sha: string): Promise<void> {
    await this.request<void>(
      `${this.repositoryPath(repository)}/git/refs/heads/${encodeURIComponent(branch)}`,
      { method: "PATCH", body: { sha, force: true } },
    );
  }

  /**
   * Overwrites the default branch with the given files: builds blobs/trees,
   * creates a root commit and force-moves the branch ref. This is the API
   * equivalent of a force push and works identically on desktop and mobile.
   */
  async pushFiles(
    repository: RepoRef,
    branch: string,
    files: ReadonlyMap<string, Uint8Array>,
    options: {
      message: string;
      authorName: string;
      authorEmail: string;
    },
  ): Promise<void> {
    const buildTree = async (dir: string): Promise<string> => {
      const entries: GitTreeEntry[] = [];
      const children = new Map<string, string>();

      for (const [path, data] of files) {
        if (!path.startsWith(dir)) {
          continue;
        }
        const rest = dir ? path.slice(dir.length) : path;
        const slash = rest.indexOf("/");
        if (slash === -1) {
          entries.push({
            path: rest,
            mode: "100644",
            type: "blob",
            sha: (await this.createBlob(repository, data)).sha,
          });
        } else {
          const name = rest.slice(0, slash);
          if (!children.has(name)) {
            children.set(name, dir + name + "/");
          }
        }
      }

      for (const [name, childDir] of children) {
        entries.push({
          path: name,
          mode: "040000",
          type: "tree",
          sha: await buildTree(childDir),
        });
      }

      return (await this.createTree(repository, entries)).sha;
    };

    const treeSha = await buildTree("");
    const commit = await this.createCommit(repository, {
      message: options.message,
      tree: treeSha,
      author: {
        name: options.authorName,
        email: options.authorEmail,
        date: new Date().toISOString(),
      },
    });
    await this.updateRef(repository, branch, commit.sha);
  }

  /**
   * Copies the source repository's default branch into the target
   * repository, overwriting its default branch with the same file content
   * (a one-time snapshot — the target does not track the source afterwards).
   * Implemented purely with the Git Data API, so it works on any device.
   */
  async copyRepositoryBranch(
    from: RepoRef,
    to: RepoRef,
    options: {
      message: string;
      authorName: string;
      authorEmail: string;
    },
  ): Promise<void> {
    const fromRepo = await this.getRepository(from);
    const branch = fromRepo.defaultBranch;

    // The Git Data API's commit endpoint only accepts SHAs, not branch
    // names; the regular commits endpoint resolves branch names fine.
    const headCommit = await this.request<{
      sha: string;
      commit: { tree: { sha: string } };
    }>(`${this.repositoryPath(from)}/commits/${encodeURIComponent(branch)}`);
    const tree = await this.request<{
      tree: readonly {
        path: string;
        mode: string;
        type: string;
        sha: string;
      }[];
    }>(`${this.repositoryPath(from)}/git/trees/${headCommit.commit.tree.sha}?recursive=1`);

    // Copy every blob to the target repository.
    const blobShas = new Map<string, string>();
    for (const entry of tree.tree) {
      if (entry.type !== "blob") {
        continue;
      }
      const blob = await this.request<{ content: string; encoding: string }>(
        `${this.repositoryPath(from)}/git/blobs/${entry.sha}`,
      );
      const created = await this.createBlobRaw(to, blob.content, blob.encoding);
      blobShas.set(entry.sha, created.sha);
    }

    // Rebuild the directory tree bottom-up.
    const buildTree = async (dir: string): Promise<string> => {
      const entries: GitTreeEntry[] = [];
      const children = new Map<string, string>();

      for (const entry of tree.tree) {
        if (entry.type !== "blob" || !entry.path.startsWith(dir)) {
          continue;
        }
        const rest = dir ? entry.path.slice(dir.length) : entry.path;
        const slash = rest.indexOf("/");
        if (slash === -1) {
          entries.push({
            path: rest,
            mode: entry.mode as GitTreeEntry["mode"],
            type: "blob",
            sha: blobShas.get(entry.sha) ?? "",
          });
        } else {
          const name = rest.slice(0, slash);
          if (!children.has(name)) {
            children.set(name, dir + name + "/");
          }
        }
      }

      for (const [name, childDir] of children) {
        entries.push({
          path: name,
          mode: "040000",
          type: "tree",
          sha: await buildTree(childDir),
        });
      }

      return (await this.createTree(to, entries)).sha;
    };

    const treeSha = await buildTree("");
    const commit = await this.createCommit(to, {
      message: options.message,
      tree: treeSha,
      author: {
        name: options.authorName,
        email: options.authorEmail,
        date: new Date().toISOString(),
      },
    });

    const toRepo = await this.getRepository(to);
    await this.updateRef(to, toRepo.defaultBranch, commit.sha);
  }

  async listSecrets(repository: RepoRef): Promise<string[]> {
    const result = await this.request<{ secrets: { name: string }[] }>(
      `${this.repositoryPath(repository)}/actions/secrets`,
    );

    return result.secrets.map((secret) => secret.name);
  }

  async getActionsSecretPublicKey(repository: RepoRef): Promise<GitHubSecretPublicKey> {
    const result = await this.request<GitHubSecretPublicKeyResponse>(
      `${this.repositoryPath(repository)}/actions/secrets/public-key`,
    );

    return {
      keyId: result.key_id,
      key: result.key,
    };
  }

  async setActionsSecret(repository: RepoRef, name: string, value: string): Promise<void> {
    const key = await this.getActionsSecretPublicKey(repository);
    const { encryptGitHubSecret } = await import("../utils/secret");
    const encryptedValue = await encryptGitHubSecret(value, key.key);

    await this.request<void>(
      `${this.repositoryPath(repository)}/actions/secrets/${encodeURIComponent(name)}`,
      {
        method: "PUT",
        body: {
          encrypted_value: encryptedValue,
          key_id: key.keyId,
        },
      },
    );
  }

  async deleteActionsSecret(repository: RepoRef, name: string): Promise<void> {
    await this.request<void>(
      `${this.repositoryPath(repository)}/actions/secrets/${encodeURIComponent(name)}`,
      { method: "DELETE" },
    );
  }

  /** Enables GitHub Actions on a repository (works for plain repos and forks). */
  async enableActions(repository: RepoRef): Promise<void> {
    await this.request<void>(
      `${this.repositoryPath(repository)}/actions/permissions`,
      {
        method: "PUT",
        body: {
          enabled: true,
          allowed_actions: "all",
        },
      },
    );
  }

  /**
   * Points the repository's GitHub Pages at Actions-built artifacts.
   * Idempotent: creates the Pages site when missing, updates it otherwise.
   */
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

  /** Dispatches a repository_dispatch event (used to trigger rebuilds). */
  async dispatchRepositoryEvent(repository: RepoRef, eventType: string): Promise<void> {
    await this.request<void>(`${this.repositoryPath(repository)}/dispatches`, {
      method: "POST",
      body: { event_type: eventType },
    });
  }

  async dispatchWorkflow(
    repository: RepoRef,
    workflow: string | number,
    ref = "main",
    inputs: WorkflowInputs = {},
  ): Promise<WorkflowDispatch> {
    await this.request<void>(
      `${this.repositoryPath(repository)}/actions/workflows/${encodeURIComponent(String(workflow))}/dispatches`,
      {
        method: "POST",
        body: {
          ref,
          inputs: stringifyInputs(inputs),
        },
      },
    );

    return { dispatchedAt: new Date() };
  }

  async getWorkflowRun(repository: RepoRef, runId: number): Promise<WorkflowRun> {
    const result = await this.request<GitHubWorkflowRunResponse>(
      `${this.repositoryPath(repository)}/actions/runs/${runId}`,
    );

    return toWorkflowRun(result);
  }

  async listWorkflowRuns(
    repository: RepoRef,
    workflow: string | number,
    options: WorkflowRunListOptions = {},
  ): Promise<readonly WorkflowRun[]> {
    const result = await this.request<GitHubWorkflowRunsResponse>(
      `${this.repositoryPath(repository)}/actions/workflows/${encodeURIComponent(String(workflow))}/runs`,
      {
        query: {
          branch: options.branch,
          event: options.event,
          status: options.status,
          per_page: options.perPage ?? 20,
        },
      },
    );

    return result.workflow_runs.map(toWorkflowRun);
  }

  async waitForWorkflowRun(
    repository: RepoRef,
    workflow: string | number,
    options: WorkflowRunPollOptions = {},
  ): Promise<WorkflowRun> {
    const timeoutMs = options.timeoutMs ?? 300_000;
    const intervalMs = options.intervalMs ?? 2_500;
    const startedAfter = options.startedAfter?.getTime() ?? Date.now();
    const deadline = Date.now() + timeoutMs;
    let lastRun: WorkflowRun | undefined;

    while (Date.now() < deadline) {
      throwIfAborted(options.signal);

      const runs = await this.listWorkflowRuns(repository, workflow, {
        branch: options.branch,
        event: options.event ?? "workflow_dispatch",
        status: options.status,
        perPage: options.perPage,
      });
      const run = runs.find((candidate) => isNewEnough(candidate, startedAfter));

      if (run) {
        lastRun = run;

        if (run.status === "completed") {
          return run;
        }
      }

      await wait(Math.min(intervalMs, Math.max(0, deadline - Date.now())));
    }

    throw new WorkflowRunTimeoutError(workflow, timeoutMs, lastRun);
  }

  private repositoryPath(repository: RepoRef): string {
    if (!repository.owner || !repository.name) {
      throw new Error("A GitHub repository requires both an owner and a name.");
    }

    return `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`;
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
        throw new GitHubApiError(
          apiMessage(text, response.status),
          response.status,
          url,
        );
      }

      // 204 No Content (e.g. workflow dispatches, secret deletion) has no body.
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
      const networkError = new Error("无法连接 GitHub，请检查网络、代理或 DNS 设置后重试。");
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

function stringifyInputs(inputs: WorkflowInputs): Record<string, string> {
  return Object.fromEntries(
    Object.entries(inputs).map(([name, value]) => [name, String(value)]),
  );
}

function toWorkflowRun(result: GitHubWorkflowRunResponse): WorkflowRun {
  return {
    id: result.id,
    name: result.name,
    status: result.status,
    conclusion: result.conclusion,
    event: result.event,
    headBranch: result.head_branch,
    htmlUrl: result.html_url,
    createdAt: result.created_at,
    updatedAt: result.updated_at,
  };
}

function isNewEnough(run: WorkflowRun, startedAfter: number): boolean {
  const createdAt = Date.parse(run.createdAt);
  return Number.isNaN(createdAt) || createdAt >= startedAfter - WORKFLOW_MATCH_TOLERANCE_MS;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new Error("Workflow polling was cancelled.");
  }
}

function wait(durationMs: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, durationMs));
}

function base64Encode(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.byteLength; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function apiMessage(body: string, status: number): string {
  if (status === 401) {
    return "PAT 无效、已过期或权限不足。";
  }
  if (status === 403) {
    return "GitHub 拒绝访问，请检查 PAT 权限或 API 限额。";
  }
  if (status === 404) {
    return "GitHub 资源不存在或当前 PAT 无权访问。";
  }
  if (status === 422) {
    return "仓库名已被占用或请求无法处理，请更换名称后重试。";
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
    // Non-JSON error body; fall through to the generic message.
  }

  return `GitHub 请求失败（HTTP ${status}）。`;
}
