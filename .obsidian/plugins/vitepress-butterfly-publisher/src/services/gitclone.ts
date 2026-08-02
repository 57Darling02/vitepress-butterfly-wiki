import type { Vault } from "obsidian";
import git from "isomorphic-git";
import http from "isomorphic-git/http/web";

import { createGitFs } from "./gitfs";

export interface CloneRepositoryOptions {
  vault: Vault;
  /** Repository URL; the token is embedded so obsidian-git can reuse it. */
  url: string;
  /** Personal access token used for authentication. */
  token: string;
  /** Branch to clone. Defaults to `main`. */
  ref?: string;
}

/**
 * Initializes a Git working copy of the repository inside the Vault root,
 * using isomorphic-git (pure JavaScript — works on desktop and mobile).
 *
 * The vault is not empty (it holds the template content), so clone is
 * performed step by step: init, remote, fetch, checkout. Because the remote
 * content matches the vault content, checkout only writes what is missing.
 */
export async function cloneRepository(options: CloneRepositoryOptions): Promise<void> {
  const fs = createGitFs(options.vault);
  const dir = "";
  const ref = options.ref ?? "main";

  await git.init({ fs, dir });
  await git.addRemote({ fs, dir, remote: "origin", url: options.url });
  await git.fetch({
    fs,
    http,
    dir,
    remote: "origin",
    ref,
    singleBranch: true,
    onAuth: () => ({ username: options.token, password: "" }),
  });
  await git.checkout({ fs, dir, ref });

  // isomorphic-git strips credentials from the stored URL. Re-embed the
  // token so obsidian-git can authenticate out of the box on mobile.
  const config = (await fs.readFile(".git/config", { encoding: "utf8" })) as string;
  await fs.writeFile(".git/config", config.replace(
    /(url\s*=\s*https?:\/\/)/,
    `$1${options.token}@`,
  ));
}
