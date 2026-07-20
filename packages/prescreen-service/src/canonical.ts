import { createHash } from "node:crypto";
import { canonicalStringify, prescreenFingerprintBody } from "@clarity/domain-contracts";

/**
 * Canonical serialization lives in @clarity/domain-contracts
 * (prescreenCommands.ts) so both prescreen gateways share it; this package
 * keeps only the SHA-256 wrapper because domain-contracts stays
 * runtime-pure (no node:crypto).
 */
export { canonicalStringify } from "@clarity/domain-contracts";

export function sha256Hex(value: unknown): string {
  return createHash("sha256").update(canonicalStringify(value)).digest("hex");
}

/**
 * SHA-256 over the shared canonical fingerprint body (command minus
 * correlationId/idempotencyKey/occurredAt — ADR-0014 §5). Byte-identical
 * to the PrismaPrescreenGateway's computation because both hash exactly
 * prescreenFingerprintBody(cmd).
 */
export function prescreenRequestFingerprint(cmd: Record<string, unknown>): string {
  return createHash("sha256").update(prescreenFingerprintBody(cmd)).digest("hex");
}
