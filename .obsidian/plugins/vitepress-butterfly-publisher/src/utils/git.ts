/**
 * Returns the object name Git assigns to a blob containing `content`.
 *
 * Git hashes a blob's byte length together with its contents, rather than the
 * contents alone. Matching this value lets the publisher skip files that are
 * already present in the target tree.
 */
export async function gitBlobSha1(
	content: ArrayBuffer | Uint8Array,
): Promise<string> {
	const bytes = toUint8Array(content);
	const header = new TextEncoder().encode(`blob ${bytes.byteLength}\0`);
	const blob = new Uint8Array(header.byteLength + bytes.byteLength);

	blob.set(header);
	blob.set(bytes, header.byteLength);

	const digest = await crypto.subtle.digest("SHA-1", blob);
	return [...new Uint8Array(digest)]
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

/** Encodes binary Vault content for GitHub's Git Data blob endpoint. */
export function bytesToBase64(content: ArrayBuffer | Uint8Array): string {
	const bytes = toUint8Array(content);
	let binary = "";
	const chunkSize = 0x8000;

	for (let offset = 0; offset < bytes.byteLength; offset += chunkSize) {
		binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
	}

	return btoa(binary);
}

function toUint8Array(content: ArrayBuffer | Uint8Array): Uint8Array {
	return content instanceof Uint8Array
		? content
		: new Uint8Array(content);
}
