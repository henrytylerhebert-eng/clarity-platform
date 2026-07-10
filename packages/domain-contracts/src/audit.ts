/**
 * Append-only audit helper.
 * Sensitive insurance identifiers are structurally excluded from audit payloads
 * (SECURITY_AND_PRIVACY data rules; risk R-8).
 */

export interface AuditEvent {
  readonly sequence: number;
  readonly action: string;
  readonly actorType: "USER" | "AGENT" | "SYSTEM";
  readonly actorId: string;
  readonly organizationId: string;
  readonly caseKey?: string;
  readonly occurredAt: string; // ISO-8601, supplied by caller
  readonly payload?: Readonly<Record<string, unknown>>;
}

/** Field names that must never appear in an audit payload, at any depth. */
export const RESTRICTED_AUDIT_FIELDS = [
  "memberId",
  "subscriberMemberId",
  "medicareId",
  "medicareNumber",
  "medicaidId",
  "policyNumber",
  "ssn",
  "socialSecurityNumber",
  "password",
  "apiKey",
  "token",
  "credential",
] as const;

function assertNoRestrictedFields(value: unknown, path = "payload"): void {
  if (value === null || typeof value !== "object") return;
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const lower = k.toLowerCase();
    if (RESTRICTED_AUDIT_FIELDS.some((f) => lower === f.toLowerCase())) {
      throw new Error(`Restricted identifier "${k}" must not be written to audit logs (${path}.${k})`);
    }
    assertNoRestrictedFields(v, `${path}.${k}`);
  }
}

export class AppendOnlyAuditLog {
  #events: AuditEvent[] = [];

  append(event: Omit<AuditEvent, "sequence">): AuditEvent {
    assertNoRestrictedFields(event.payload);
    const sealed: AuditEvent = Object.freeze({ ...event, sequence: this.#events.length + 1 });
    this.#events.push(sealed);
    return sealed;
  }

  /** Snapshot copy — the internal log cannot be mutated or truncated through it. */
  list(): readonly AuditEvent[] {
    return [...this.#events];
  }

  get length(): number {
    return this.#events.length;
  }
}
