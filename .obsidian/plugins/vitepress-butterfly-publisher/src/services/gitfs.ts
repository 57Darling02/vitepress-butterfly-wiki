import type { Vault } from "obsidian";

/**
 * The file-system interface isomorphic-git requires, backed by the Obsidian
 * Vault adapter. Works identically on desktop and mobile.
 *
 * Files under `.git/` are written directly through the adapter so they never
 * enter the Obsidian index; everything else goes through the Vault API so
 * the file explorer and metadata stay in sync.
 */
export interface GitFs {
  readFile(filepath: string, options?: { encoding?: string }): Promise<Uint8Array | string>;
  writeFile(filepath: string, data: Uint8Array | string): Promise<void>;
  unlink(filepath: string): Promise<void>;
  mkdir(filepath: string): Promise<void>;
  readdir(filepath: string): Promise<string[]>;
  stat(filepath: string): Promise<GitFsStat>;
  lstat(filepath: string): Promise<GitFsStat>;
  readlink(filepath: string): Promise<string>;
  symlink(filepath: string): Promise<void>;
  rmdir(filepath: string): Promise<void>;
}

export interface GitFsStat {
  type: "file" | "dir" | "symlink";
  mode: number;
  size: number;
  mtimeMs: number;
  ctimeMs: number;
  mtimeSeconds: number;
  mtimeNanoseconds: number;
  ctimeSeconds: number;
  ctimeNanoseconds: number;
  dev: number;
  ino: number;
  uid: number;
  gid: number;
  isDirectory(): boolean;
  isFile(): boolean;
  isSymbolicLink(): boolean;
}

export function createGitFs(vault: Vault): GitFs {
  return {
    async readFile(filepath: string, options?: { encoding?: string }): Promise<Uint8Array | string> {
      const path = normalize(filepath);
      const data = await vault.adapter.readBinary(path);
      if (options?.encoding === "utf8") {
        return new TextDecoder().decode(data);
      }
      return new Uint8Array(data);
    },

    async writeFile(filepath: string, data: Uint8Array | string): Promise<void> {
      const path = normalize(filepath);
      await ensureParent(vault, path);
      const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;

      if (isGitInternal(path)) {
        await vault.adapter.writeBinary(path, toArrayBuffer(bytes));
        return;
      }

      const existing = vault.getFileByPath(path);
      if (existing) {
        await vault.modifyBinary(existing, toArrayBuffer(bytes));
      } else {
        await vault.createBinary(path, toArrayBuffer(bytes));
      }
    },

    async unlink(filepath: string): Promise<void> {
      await vault.adapter.remove(normalize(filepath));
    },

    async mkdir(filepath: string): Promise<void> {
      const path = normalize(filepath);
      if (await vault.adapter.exists(path)) {
        return;
      }
      await vault.adapter.mkdir(path);
    },

    async readdir(filepath: string): Promise<string[]> {
      const listed = await vault.adapter.list(normalize(filepath));
      return [...listed.folders, ...listed.files]
        .map((path) => basename(path))
        .sort();
    },

    async stat(filepath: string): Promise<GitFsStat> {
      const path = normalize(filepath);
      if (path === "" || path === ".") {
        return toStat({ type: "folder", size: 0, mtime: Date.now() });
      }
      const stat = await vault.adapter.stat(path);
      if (!stat) {
        throw enoent(filepath);
      }
      return toStat(stat);
    },

    lstat(filepath: string): Promise<GitFsStat> {
      // The vault never contains symlinks.
      return this.stat(filepath);
    },

    readlink(): Promise<string> {
      throw new Error("EINVAL: symlinks are not supported in a vault");
    },

    symlink(): Promise<void> {
      throw new Error("EINVAL: symlinks are not supported in a vault");
    },

    async rmdir(filepath: string): Promise<void> {
      const path = normalize(filepath);
      await vault.adapter.rmdir(path, false).catch(async () => {
        await vault.adapter.remove(path);
      });
    },
  };
}

function isGitInternal(path: string): boolean {
  return path === ".git" || path.startsWith(".git/");
}

function normalize(path: string): string {
  return path.replace(/^\/+|\/+$/g, "");
}

function basename(path: string): string {
  return path.includes("/") ? path.slice(path.lastIndexOf("/") + 1) : path;
}

async function ensureParent(vault: Vault, path: string): Promise<void> {
  const parent = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
  if (!parent) {
    return;
  }

  if (isGitInternal(path)) {
    const segments = parent.split("/");
    let current = "";
    for (const segment of segments) {
      current = current ? `${current}/${segment}` : segment;
      if (!(await vault.adapter.exists(current))) {
        await vault.adapter.mkdir(current);
      }
    }
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

function toArrayBuffer(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

function toStat(stat: { type: "file" | "folder"; size: number; mtime: number }): GitFsStat {
  const isDir = stat.type === "folder";
  const mtime = stat.mtime ?? Date.now();
  return {
    type: isDir ? "dir" : "file",
    mode: isDir ? 0o777 : 0o644,
    size: stat.size,
    mtimeMs: mtime,
    ctimeMs: mtime,
    mtimeSeconds: Math.floor(mtime / 1000),
    mtimeNanoseconds: (mtime % 1000) * 1e6,
    ctimeSeconds: Math.floor(mtime / 1000),
    ctimeNanoseconds: (mtime % 1000) * 1e6,
    dev: 1,
    ino: 1,
    uid: 1,
    gid: 1,
    isDirectory: () => isDir,
    isFile: () => !isDir,
    isSymbolicLink: () => false,
  };
}

function enoent(path: string): Error & { code: string } {
  return Object.assign(new Error(`ENOENT: no such file or directory '${path}'`), {
    code: "ENOENT",
  });
}
