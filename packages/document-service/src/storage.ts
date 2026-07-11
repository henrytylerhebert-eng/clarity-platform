import { createHash } from "node:crypto";
import type { DocumentStorage, StoredDocument } from "@clarity/domain-contracts";

/** Thrown when a storage key has no stored bytes (should not happen for keys the service itself issued). */
export class StoredDocumentNotFoundError extends Error {
  constructor(storageKey: string) {
    super(`No stored bytes for storage key "${storageKey}"`);
    this.name = "StoredDocumentNotFoundError";
  }
}

/**
 * Synthetic, in-memory, content-addressed document storage — the seam a real
 * object-storage adapter (S3/Blob) will implement later (docs/01-project-architecture.md).
 * storageKey = `${caseId}/${sha256}`: re-storing identical bytes for the same
 * case overwrites the same key with identical content, so accidental
 * re-upload of the same file never grows storage.
 */
export class InMemoryDocumentStorage implements DocumentStorage {
  #blobs = new Map<string, Uint8Array>();

  async put(caseId: string, content: Uint8Array): Promise<StoredDocument> {
    const sha256 = createHash("sha256").update(content).digest("hex");
    const storageKey = `${caseId}/${sha256}`;
    this.#blobs.set(storageKey, content);
    return { storageKey, sha256, size: content.byteLength };
  }

  async get(storageKey: string): Promise<Uint8Array> {
    const blob = this.#blobs.get(storageKey);
    if (!blob) throw new StoredDocumentNotFoundError(storageKey);
    return blob;
  }
}
