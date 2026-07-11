/**
 * Organization-isolation contract: every repository query is organization-scoped.
 * This is the interface future persistence layers must implement; the guard
 * makes cross-organization reads a thrown error, not a silent empty result.
 */
export interface OrgScoped {
  readonly organizationId: string;
}

export function assertSameOrganization(scopeOrgId: string, record: OrgScoped): void {
  if (record.organizationId !== scopeOrgId) {
    throw new Error("Cross-organization access denied: record belongs to a different organization");
  }
}

/** Filter helper for in-memory stores and tests. */
export function scopeToOrganization<T extends OrgScoped>(scopeOrgId: string, records: readonly T[]): T[] {
  return records.filter((r) => r.organizationId === scopeOrgId);
}

/** Identifies who performed a mutation, for the mandatory audit event. */
export interface AuditActor {
  readonly actorType: "USER" | "AGENT" | "SYSTEM";
  readonly actorId: string;
}

/** Optional audit context for a mutation. Metadata passes the restricted-field guard. */
export interface MutationOptions {
  readonly reason?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Contract correction 2026-07-10 (feat/tenant-scoped-case-repository):
 * the original interface was synchronous and read-only-plus-create, which is
 * impossible to implement against Prisma (async I/O) and impossible to port
 * the persisted state-transition baselines to. Methods are now async, take an
 * AuditActor (every mutation must produce an audit event atomically), and the
 * two mutation methods mirror the EXISTING pure state machines
 * (transitionCase / updateWorkstream) — no new domain semantics.
 * See docs/implementation/CASE_REPOSITORY_IMPLEMENTATION.md.
 */
export interface CaseRepository<TCase extends OrgScoped> {
  create(organizationId: string, data: TCase, actor: AuditActor, options?: MutationOptions): Promise<TCase>;
  findByKey(organizationId: string, caseKey: string): Promise<TCase | undefined>;
  listForOrganization(organizationId: string): Promise<TCase[]>;
  transitionStatus(
    organizationId: string,
    caseKey: string,
    to: string,
    actor: AuditActor,
    options?: MutationOptions,
  ): Promise<TCase>;
  updateWorkstream(
    organizationId: string,
    caseKey: string,
    workstream: string,
    to: string,
    actor: AuditActor,
    options?: MutationOptions,
  ): Promise<TCase>;
}
