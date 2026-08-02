import type { Vault } from "obsidian";

import type {
  GitHubClient,
  GitHubRepositoryRef,
  GitTreeEntry,
} from "./github";
import { bytesToBase64, gitBlobSha1 } from "../utils/git";
import { isExcludedPath } from "../utils/paths";

const MAIN_REF = "heads/main";
const DEFAULT_COMMIT_MESSAGE = "Publish from Obsidian";

export interface PublishVaultOptions {
  /** The Vault whose files will be published. */
  vault: Vault;
  /** Authenticated client for GitHub's Git Data API. */
  client: GitHubClient;
  /** The content repository. Publishing always targets its `main` branch. */
  repository: GitHubRepositoryRef;
  /**
   * Paths returned by the previous successful publish. Only these paths may
   * be removed when they no longer exist locally.
   */
  previouslyPublishedPaths: readonly string[];
  /**
   * When true, the branch ref is force-updated and any remote commits are
   * discarded. Defaults to false: a remote that moved ahead surfaces as an
   * error instead of being overwritten.
   */
  force?: boolean;
  /** Defaults to `Publish from Obsidian`. */
  message?: string;
}

export interface PublishVaultResult {
  /** Whether a new commit was created. */
  changed: boolean;
  /** The new commit SHA, or `null` when the remote already matched the Vault. */
  commitSha: string | null;
  /** Paths to retain as `previouslyPublishedPaths` after a successful run. */
  publishedPaths: string[];
  /** Paths removed from the repository by this commit. */
  deletedPaths: string[];
}

interface VaultFile {
  path: string;
  content: ArrayBuffer;
  sha: string;
}

interface RemoteBlob {
  sha: string;
  mode: string;
}

/**
 * Publishes the Vault through one Git Data API commit.
 *
 * The base tree is retained, so files outside the published path list remain
 * untouched. Excluded paths mirror the template `.gitignore`: device-local
 * Obsidian state and plugin settings never leave the device.
 */
export async function publishVault(
  options: PublishVaultOptions,
): Promise<PublishVaultResult> {
  const previousPaths = new Set(options.previouslyPublishedPaths);
  const vaultFiles = await readVaultFiles(options.vault);
  const publishedPaths = vaultFiles.map((file) => file.path);
  const publishedPathSet = new Set(publishedPaths);

  const ref = await options.client.getRef(options.repository, MAIN_REF);
  const commit = await options.client.getCommit(options.repository, ref.sha);
  const tree = await options.client.getTree(
    options.repository,
    commit.tree.sha,
  );
  const remoteBlobs = new Map<string, RemoteBlob>();

  for (const entry of tree.entries) {
    if (entry.type === "blob") {
      remoteBlobs.set(entry.path, { sha: entry.sha, mode: entry.mode });
    }
  }

  const entries: GitTreeEntry[] = [];
  for (const file of vaultFiles) {
    if (remoteBlobs.get(file.path)?.sha === file.sha) {
      continue;
    }

    const blob = await options.client.createBlob(
      options.repository,
      bytesToBase64(file.content),
      "base64",
    );
    if (blob.sha !== file.sha) {
      throw new Error(`Git blob SHA mismatch for "${file.path}".`);
    }

    entries.push({
      path: file.path,
      mode: "100644",
      type: "blob",
      sha: blob.sha,
    });
  }

  const deletedPaths = [...previousPaths]
    .filter((path) => !publishedPathSet.has(path) && remoteBlobs.has(path))
    .sort();
  for (const path of deletedPaths) {
    entries.push({ path, mode: "100644", type: "blob", sha: null });
  }

  if (entries.length === 0) {
    return {
      changed: false,
      commitSha: null,
      publishedPaths,
      deletedPaths: [],
    };
  }

  const nextTree = await options.client.createTree(
    options.repository,
    entries,
    commit.tree.sha,
  );
  const nextCommit = await options.client.createCommit(
    options.repository,
    options.message?.trim() || DEFAULT_COMMIT_MESSAGE,
    nextTree.sha,
    [ref.sha],
  );
  await options.client.updateRef(
    options.repository,
    MAIN_REF,
    nextCommit.sha,
    options.force ?? false,
  );

  return {
    changed: true,
    commitSha: nextCommit.sha,
    publishedPaths,
    deletedPaths,
  };
}

async function readVaultFiles(vault: Vault): Promise<VaultFile[]> {
  const files: VaultFile[] = [];

  for (const file of vault.getFiles()) {
    if (isExcludedPath(file.path)) {
      continue;
    }

    const content = await vault.readBinary(file);
    files.push({
      path: file.path,
      content,
      sha: await gitBlobSha1(content),
    });
  }

  return files.sort((left, right) => left.path.localeCompare(right.path));
}
