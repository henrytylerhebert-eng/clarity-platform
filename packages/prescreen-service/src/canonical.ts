import { createHash } from "node:crypto";

/**
 * Canonical JSON: object keys sorted recursively at every depth, arrays in
 * order. This closes the reference-package defect where a top-level
 * key-whitelist replacer serialized nested command bodies as {} and let a
 * changed body replay under the same idempotency key.
 */
export function canonicalStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  const toJSON = (value as { toJSON?: unknown }).toJSON;
  if (typeof toJSON === "function") {
    return canonicalStringify((value as { toJSON: () => unknown }).toJSON());
  }
  if (Array.isArray(value)) return `[${value.map((item) => canonicalStringify(item)).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${JSON.stringify(k)}:${canonicalStringify(v)}`);
  return `{${entries.join(",")}}`;
}

export function sha256Hex(value: unknown): string {
  return createHash("sha256").update(canonicalStringify(value)).digest("hex");
}
