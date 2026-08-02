import { TFile, Vault } from "obsidian";
import { unzip, Unzipped } from "fflate";

import { isExcludedPath } from "../utils/paths";

export interface PullPlan {
  /** Files to write or update: remote exists and local matches or is absent. */
  toWrite: string[];
  /**
   * Files where the remote version differs from a modified local file.
   * Applying the pull discards those local changes — needs confirmation.
   */
  overwritten: string[];
  /** Local files that do not exist remotely; kept untouched. */
  keptLocal: string[];
}

export interface PullResult {
  /** Files written or updated. */
  updated: string[];
  /** Files whose local modifications were replaced by the remote version. */
  overwritten: string[];
}

/**
 * Compares the remote archive (unzipped) against the Vault without touching
 * anything. Local-only files are always kept, so a pull can never lose
 * unpublished drafts; the only destructive case is a modified local file
 * that the remote also has, which is reported as `overwritten`.
 */
export function planPull(vault: Vault, files: Unzipped): PullPlan {
  const remotePaths = new Set<string>();
  const toWrite: string[] = [];

  for (const [zipPath] of Object.entries(files)) {
    const path = stripRootDirectory(zipPath);
    if (!path || isExcludedPath(path)) {
      continue;
    }
    remotePaths.add(path);

    if (!vault.getFileByPath(path)) {
      toWrite.push(path);
    }
  }

  const keptLocal = vault
    .getFiles()
    .map((file) => file.path)
    .filter((path) => !remotePaths.has(path) && !isExcludedPath(path))
    .sort();

  return { toWrite, overwritten: [], keptLocal };
}

/**
 * Classifies files whose local content differs from the remote version.
 * Requires reading local files, so it runs separately from the cheap
 * existence-based `planPull`.
 */
export async function findOverwritten(
  vault: Vault,
  files: Unzipped,
): Promise<string[]> {
  const overwritten: string[] = [];

  for (const [zipPath, content] of Object.entries(files)) {
    const path = stripRootDirectory(zipPath);
    if (!path || isExcludedPath(path)) {
      continue;
    }

    const existing = vault.getFileByPath(path);
    if (existing && !(await fileMatches(existing, content))) {
      overwritten.push(path);
    }
  }

  return overwritten.sort();
}

/** Applies a plan produced by `planPull` to the Vault. */
export async function applyPull(
  vault: Vault,
  files: Unzipped,
  plan: PullPlan,
): Promise<PullResult> {
  const updated: string[] = [];

  for (const [zipPath, content] of Object.entries(files)) {
    const path = stripRootDirectory(zipPath);
    if (!path || isExcludedPath(path)) {
      continue;
    }

    const existing = vault.getFileByPath(path);
    if (!existing) {
      await ensureParentFolder(vault, path);
      await vault.createBinary(path, toArrayBuffer(content));
      updated.push(path);
    } else if (
      plan.overwritten.includes(path)
      || !(await fileMatches(existing, content))
    ) {
      await vault.modifyBinary(existing, toArrayBuffer(content));
      updated.push(path);
    }
  }

  return { updated, overwritten: plan.overwritten };
}

async function fileMatches(file: TFile, content: Uint8Array): Promise<boolean> {
  const local = new Uint8Array(await file.vault.readBinary(file));
  if (local.byteLength !== content.byteLength) {
    return false;
  }
  for (let index = 0; index < local.byteLength; index += 1) {
    if (local[index] !== content[index]) {
      return false;
    }
  }
  return true;
}

export function unzipAsync(data: ArrayBuffer): Promise<Unzipped> {
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

/** Copies a typed-array slice into a standalone ArrayBuffer. */
function toArrayBuffer(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}
