import { Vault } from "obsidian";
import { unzip, Unzipped } from "fflate";

import { GitHubClient, GitHubRepositoryRef } from "./github";
import { isExcludedPath } from "../utils/paths";

export interface PullLatestOptions {
  /** The Vault whose files will be replaced by the repository content. */
  vault: Vault;
  /** Authenticated client for GitHub's API. */
  client: GitHubClient;
  /** The content repository. Pulling always targets its `main` branch. */
  repository: GitHubRepositoryRef;
}

export interface PullLatestResult {
  /** Whether any file changed locally. */
  changed: boolean;
  /** Vault-relative paths written or updated. */
  updated: string[];
  /** Vault-relative paths moved to the vault trash. */
  deleted: string[];
}

/**
 * Replaces the Vault with the repository's `main` branch content, without
 * requiring a local Git installation. Works from any device: the private
 * repository zipball is fetched through the authenticated API and extracted
 * with fflate.
 *
 * Device-local files (`.obsidian` state, plugin settings) are kept, mirroring
 * the publish-side exclusion list. Everything else not present on the remote
 * is moved to the vault trash so the pull stays recoverable.
 */
export async function pullLatest(options: PullLatestOptions): Promise<PullLatestResult> {
  const zip = await options.client.downloadZipball(options.repository);
  const files = await unzipAsync(zip);
  const updated: string[] = [];
  const deleted: string[] = [];
  const remotePaths = new Set<string>();

  for (const [zipPath, content] of Object.entries(files)) {
    const path = stripRootDirectory(zipPath);
    if (!path || isExcludedPath(path)) {
      continue;
    }

    remotePaths.add(path);
    const data = toArrayBuffer(content);
    const existing = options.vault.getFileByPath(path);
    if (existing) {
      await options.vault.modifyBinary(existing, data);
    } else {
      await ensureParentFolder(options.vault, path);
      await options.vault.createBinary(path, data);
    }
    updated.push(path);
  }

  for (const file of options.vault.getFiles()) {
    if (remotePaths.has(file.path) || isExcludedPath(file.path)) {
      continue;
    }

    // Keep un-published local work recoverable instead of deleting it.
    await options.vault.trash(file, false);
    deleted.push(file.path);
  }

  return { changed: updated.length > 0 || deleted.length > 0, updated, deleted };
}

function unzipAsync(data: ArrayBuffer): Promise<Unzipped> {
  return new Promise((resolve, reject) => {
    unzip(new Uint8Array(data), (error, files) => {
      if (error) {
        reject(error);
      } else {
        resolve(files);
      }
    });
  });
}

/** Copies a typed-array slice into a standalone ArrayBuffer. */
function toArrayBuffer(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

/**
 * GitHub zipballs contain a single root directory named `<repo>-<sha>`.
 * Strips it so every entry becomes vault-relative. Directory entries end
 * with "/" and are ignored.
 */
function stripRootDirectory(path: string): string | null {
  const withoutTrailingSlash = path.endsWith("/") ? path.slice(0, -1) : path;
  if (!withoutTrailingSlash.includes("/")) {
    return null;
  }

  const relative = withoutTrailingSlash.slice(withoutTrailingSlash.indexOf("/") + 1);
  return relative || null;
}

async function ensureParentFolder(vault: Vault, path: string): Promise<void> {
  const parent = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
  if (!parent) {
    return;
  }

  const segments = parent.split("/");
  for (let index = 1; index <= segments.length; index += 1) {
    const folder = segments.slice(0, index).join("/");
    if (!vault.getFolderByPath(folder)) {
      await vault.createFolder(folder);
    }
  }
}
