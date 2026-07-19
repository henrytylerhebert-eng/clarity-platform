import type { OrgScoped } from "./organizationScope.js";
import type { WorkstreamStatus } from "./workstreams.js";

/**
 * Legal-status type vocabulary. Values mirror prisma/schema.prisma enum
 * LegalStatusType — keep in sync.
 *
 * Per docs/legal/LEGAL_STATUS_ARCHITECTURE.md's binding non-enforcement rule,
 * a LegalStatusRecord captures documented legal-status data — it does not
 * declare a hold valid, decide competency, or authorize transfer.
 */
export const LEGAL_STATUS_TYPES = [
  "VOLUNTARY",
  "INVOLUNTARY_EMERGENCY",
  "COURT_ORDERED",
  "PROTECTIVE_CUSTODY",
  "GUARDIAN_CONSENT",
  "MINOR_CONSENT",
  "CORRECTIONAL_CUSTODY",
  "UNKNOWN",
] as const;
export type LegalStatusType = (typeof LEGAL_STATUS_TYPES)[number];

/** Domain shape persisted by the case repository layer for a LegalStatusRecord row. */
export interface LegalStatusRecordSummary extends OrgScoped {
  readonly id: string;
  readonly caseId: string;
  readonly jurisdiction: string;
  readonly statusType: LegalStatusType;
  readonly authorizingAuthority?: string | null;
  /**
   * (board, number) is the stable key for tracking how often a licensed
   * professional issues these instruments — a license persists across
   * facilities/organizations even though this schema has no cross-organization
   * "professional" entity. Populated only for forms that carry a license number
   * (OBH-1/1A/2); OBH-19/20 signers (peace officer, judge) are not license-bearing.
   */
  readonly authorizingLicenseBoard?: string | null;
  readonly authorizingLicenseNumber?: string | null;
  readonly initiatedAt?: Date | null;
  readonly expiresAt?: Date | null;
  /** Points at the ClarityDocument (e.g. a rendered OBH-1/1A/2/19/20 PDF) that evidences this record. */
  readonly formDocumentId?: string | null;
  readonly signatureStatus?: string | null;
  readonly reviewStatus: WorkstreamStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
