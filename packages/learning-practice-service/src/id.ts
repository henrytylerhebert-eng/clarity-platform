import { createHash } from "node:crypto";

/** Stable identity of an ordered tuple. This is identity, not an authorization token. */
export function stableId(prefix: string, parts: readonly string[]): string {
  return `${prefix}-${createHash("sha256").update(JSON.stringify(parts)).digest("hex")}`;
}
