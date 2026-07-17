import type { LegalStatusRecord as LegalStatusRecordRow } from "@prisma/client";
import { LEGAL_STATUS_TYPES, type LegalStatusRecordSummary, type LegalStatusType } from "@clarity/domain-contracts";

function parseEnum<T extends string>(value: string, allowed: readonly T[], field: string): T {
  if ((allowed as readonly string[]).includes(value)) return value as T;
  throw new Error(`Row field ${field} has value "${value}" outside the domain contract`);
}

/**
 * LegalStatusRecord has no organizationId column of its own (only via its case
 * relation), so the caller — which already read the owning case row for the
 * tenant-ownership check — supplies it here rather than the mapper reading it
 * off the row.
 */
export function legalStatusRowToDomain(row: LegalStatusRecordRow, organizationId: string): LegalStatusRecordSummary {
  return {
    id: row.id,
    caseId: row.caseId,
    organizationId,
    jurisdiction: row.jurisdiction,
    statusType: parseEnum<LegalStatusType>(row.statusType, LEGAL_STATUS_TYPES, "statusType"),
    authorizingAuthority: row.authorizingAuthority,
    authorizingLicenseBoard: row.authorizingLicenseBoard,
    authorizingLicenseNumber: row.authorizingLicenseNumber,
    initiatedAt: row.initiatedAt,
    expiresAt: row.expiresAt,
    formDocumentId: row.formDocumentId,
    signatureStatus: row.signatureStatus,
    reviewStatus: row.reviewStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
