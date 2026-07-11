import { createHash } from "node:crypto";
import { WORKSTREAMS } from "@clarity/domain-contracts";
import type { PersistedCase } from "./mappers.js";

/**
 * Deterministic SHA-256 of the command-relevant case state, written to
 * AuditEvent.previousStateHash / newStateHash so every audit row pins the
 * exact state it moved between. Key order is fixed by construction.
 */
export function caseStateHash(c: PersistedCase): string {
  const canonical = {
    caseKey: c.caseKey,
    organizationId: c.organizationId,
    status: c.status,
    urgency: c.urgency,
    assignedUserId: c.assignedUserId ?? null,
    currentLocation: c.currentLocation ?? null,
    closedAt: c.closedAt ? c.closedAt.toISOString() : null,
    workstreams: WORKSTREAMS.map((w) => [w, c.workstreams[w]]),
  };
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}
