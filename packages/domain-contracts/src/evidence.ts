import type { OrgScoped } from "./organizationScope.js";

/**
 * Evidence contracts. Values mirror prisma/schema.prisma enums
 * EvidenceCategory / EvidenceStatus — keep in sync.
 */
export const EVIDENCE_CATEGORIES = [
  "PRESENTING_PROBLEM",
  "SUICIDE_RISK",
  "VIOLENCE_RISK",
  "PSYCHOSIS",
  "MANIA",
  "SUBSTANCE_USE",
  "WITHDRAWAL",
  "COGNITION",
  "MEDICAL",
  "MEDICATION",
  "ALLERGY",
  "LEGAL_STATUS",
  "CUSTODY",
  "INSURANCE",
  "AUTHORIZATION",
  "GUARDIANSHIP",
  "PLACEMENT",
  "TRANSPORT",
  "OTHER",
] as const;
export type EvidenceCategory = (typeof EVIDENCE_CATEGORIES)[number];

export const EVIDENCE_STATUSES = [
  "CANDIDATE",
  "APPROVED",
  "REJECTED",
  "NEEDS_CLARIFICATION",
  "SUPERSEDED",
] as const;
export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number];

/**
 * Review state machine. Every new item begins as CANDIDATE — nothing is
 * approved at creation. APPROVED items cannot be edited; the only exit is
 * an explicit, audited supersession. REJECTED and SUPERSEDED are terminal:
 * a rejected item is answered by new evidence, not resurrection, and a
 * superseded item's history must stay frozen.
 */
const EVIDENCE_TRANSITIONS: Record<EvidenceStatus, readonly EvidenceStatus[]> = {
  CANDIDATE: ["APPROVED", "REJECTED", "NEEDS_CLARIFICATION", "SUPERSEDED"],
  NEEDS_CLARIFICATION: ["CANDIDATE", "APPROVED", "REJECTED", "SUPERSEDED"],
  APPROVED: ["SUPERSEDED"],
  REJECTED: [],
  SUPERSEDED: [],
};

export function canTransitionEvidence(from: EvidenceStatus, to: EvidenceStatus): boolean {
  return EVIDENCE_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Only creation method until automated extraction exists (deliberately singular). */
export const EVIDENCE_CREATION_METHODS = ["HUMAN_ENTRY"] as const;
export type EvidenceCreationMethod = (typeof EVIDENCE_CREATION_METHODS)[number];

/**
 * What kind of discrepancy a reviewer judged a contradiction group to be.
 * Classifying never approves, rejects, or erases any member item.
 */
export const CONTRADICTION_CLASSIFICATIONS = [
  "DIRECT_CONFLICT",
  "TEMPORAL_CHANGE",
  "SOURCE_DISAGREEMENT",
  "UNCLEAR",
] as const;
export type ContradictionClassification = (typeof CONTRADICTION_CLASSIFICATIONS)[number];

/** Domain shape persisted by the evidence repository layer. */
export interface ClarityEvidence extends OrgScoped {
  readonly evidenceId: string;
  readonly caseId: string;
  /** Exact SourceDocument row — a specific version, not just a family. */
  readonly documentId: string;
  readonly category: EvidenceCategory;
  readonly subcategory?: string | null;
  /** Verbatim source text; immutable after creation by construction. */
  readonly originalText: string;
  readonly normalizedValue?: unknown;
  readonly pageNumber?: number | null;
  readonly sectionLabel?: string | null;
  readonly sourceAuthor?: string | null;
  readonly sourceTimestamp?: Date | null;
  /** Null for HUMAN_ENTRY; reserved for future automation. */
  readonly extractionConfidence?: number | null;
  readonly status: EvidenceStatus;
  readonly creationMethod: EvidenceCreationMethod;
  readonly createdBy: string;
  readonly reviewerNote?: string | null;
  readonly reviewedBy?: string | null;
  readonly reviewedAt?: Date | null;
  readonly evidenceFamilyId: string;
  readonly supersededById?: string | null;
  readonly contradictionGroupId?: string | null;
  readonly version: number;
  readonly createdAt: Date;
}

export interface ClarityContradictionGroup extends OrgScoped {
  readonly groupId: string;
  readonly caseId: string;
  readonly classification?: ContradictionClassification | null;
  readonly reviewNote?: string | null;
  readonly createdBy: string;
  readonly version: number;
  readonly evidenceIds: readonly string[];
}
