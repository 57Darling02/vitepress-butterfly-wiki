/**
 * Paths that must never leave the device (publish) and must never be
 * overwritten by a pull. Kept in sync with the template repository's
 * `.gitignore`: the vault is the repository, so what Git ignores is what we
 * ignore too.
 */
export function isExcludedPath(path: string): boolean {
  const segments = path.split("/");

  // Whole directories.
  if (segments.some((segment) => segment === ".git" || segment === ".trash" || segment === "node_modules")) {
    return true;
  }

  // Device-local Obsidian state: window layout and caches.
  if (path === ".obsidian/workspace.json") {
    return true;
  }
  if (path === ".obsidian/cache" || path.startsWith(".obsidian/cache/")) {
    return true;
  }

  // Plugin settings hold secrets (PAT), never publish them.
  if (
    segments.length >= 3
    && segments[0] === ".obsidian"
    && segments[1] === "plugins"
    && segments[segments.length - 1] === "data.json"
  ) {
    return true;
  }

  return false;
}
