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

export interface CaseRepository<TCase extends OrgScoped> {
  create(organizationId: string, data: TCase): TCase;
  findByKey(organizationId: string, caseKey: string): TCase | undefined;
  listForOrganization(organizationId: string): TCase[];
}
