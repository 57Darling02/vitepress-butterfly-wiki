import nacl from "tweetnacl";

import { bytesToBase64 } from "./git";

const SEAL_NONCE = new Uint8Array(24); // crypto_box_seal uses an all-zero nonce.

/**
 * Encrypts a value for the GitHub Actions secrets API using libsodium's
 * sealed box scheme (X25519-XSalsa20-Poly1305), implemented with tweetnacl:
 * an ephemeral keypair encrypts to the repository's public key and the
 * ephemeral public key is prepended to the ciphertext. This is the exact
 * layout GitHub's API accepts and is interoperable with libsodium's
 * crypto_box_seal.
 */
export async function encryptGitHubSecret(
  value: string,
  publicKey: string,
): Promise<string> {
  if (!value) {
    throw new Error("A GitHub Actions secret cannot be empty.");
  }

  const recipient = base64ToBytes(publicKey);
  const ephemeral = nacl.box.keyPair();
  const message = new TextEncoder().encode(value);
  const ciphertext = nacl.box(message, SEAL_NONCE, recipient, ephemeral.secretKey);

  const sealed = new Uint8Array(ephemeral.publicKey.length + ciphertext.length);
  sealed.set(ephemeral.publicKey);
  sealed.set(ciphertext, ephemeral.publicKey.length);

  return bytesToBase64(sealed);
}

function base64ToBytes(input: string): Uint8Array {
  const binary = atob(input);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
