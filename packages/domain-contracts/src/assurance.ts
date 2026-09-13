export const ASSURANCE_PARTICIPANT_ROLES = [
  "OWNER",
  "EVIDENCE_CONTRIBUTOR",
  "QUALIFIED_REVIEWER",
] as const;
export type AssuranceParticipantRole = (typeof ASSURANCE_PARTICIPANT_ROLES)[number];

export const ASSURANCE_APPLICABILITY_STATUSES = [
  "PENDING",
  "APPROVED",
  "NOT_APPLICABLE",
  "CONDITIONAL",
] as const;
export type AssuranceApplicabilityStatus = (typeof ASSURANCE_APPLICABILITY_STATUSES)[number];

export const ASSURANCE_AUTHORITY_CLASSES = [
  "FEDERAL_REGULATION",
  "CMS_CERTIFICATION",
  "CMS_GUIDANCE",
  "STATE_LICENSING",
  "ACCREDITATION",
  "INCORPORATED_STANDARD",
  "PUBLIC_HEALTH_GUIDANCE",
  "OTHER_EXTERNAL_AUTHORITY",
] as const;
export type AssuranceAuthorityClass = (typeof ASSURANCE_AUTHORITY_CLASSES)[number];

export const ASSURANCE_SOURCE_CURRENTNESS = [
  "CURRENT",
  "STALE",
  "SUPERSEDED",
  "UNKNOWN",
] as const;
export type AssuranceSourceCurrentness = (typeof ASSURANCE_SOURCE_CURRENTNESS)[number];

export const ASSURANCE_SOURCE_RIGHTS = [
  "PERMITTED",
  "RESTRICTED",
  "UNKNOWN",
] as const;
export type AssuranceSourceRightsStatus = (typeof ASSURANCE_SOURCE_RIGHTS)[number];

export const ASSURANCE_REFERENCE_KINDS = ["POLICY", "SOP"] as const;
export type AssuranceReferenceKind = (typeof ASSURANCE_REFERENCE_KINDS)[number];

export const ASSURANCE_EVIDENCE_STATUSES = [
  "SUBMITTED",
  "ACCEPTED",
  "REJECTED",
  "NEEDS_CLARIFICATION",
  "SUPERSEDED",
] as const;
export type AssuranceEvidenceStatus = (typeof ASSURANCE_EVIDENCE_STATUSES)[number];

export const ASSURANCE_EVALUATION_RESULTS = [
  "SUPPORTED",
  "PARTIALLY_SUPPORTED",
  "MISSING_EVIDENCE",
  "CONFLICT",
  "STALE_SOURCE",
  "APPLICABILITY_PENDING",
  "RIGHTS_RESTRICTED",
  "REVIEW_REQUIRED",
  "UNKNOWN",
] as const;
export type AssuranceEvaluationResult = (typeof ASSURANCE_EVALUATION_RESULTS)[number];

export const ASSURANCE_REVIEW_DECISIONS = [
  "ACCEPT",
  "REJECT",
  "REQUEST_MORE_EVIDENCE",
  "REVIEW_REQUIRED",
] as const;
export type AssuranceReviewDecision = (typeof ASSURANCE_REVIEW_DECISIONS)[number];

export const ASSURANCE_CONFLICT_STATUSES = ["OPEN", "RESOLVED"] as const;
export type AssuranceConflictStatus = (typeof ASSURANCE_CONFLICT_STATUSES)[number];

export const ASSURANCE_EVALUATION_REASON_CODES = [
  "APPLICABILITY_NOT_APPROVED",
  "SOURCE_METADATA_INCOMPLETE",
  "SOURCE_RIGHTS_RESTRICTED",
  "SOURCE_RIGHTS_UNKNOWN",
  "SOURCE_STALE",
  "SOURCE_CURRENTNESS_UNKNOWN",
  "SOURCE_CONFLICT_OPEN",
  "EVIDENCE_EXPECTATION_EMPTY",
  "EVIDENCE_NOT_SUBMITTED",
  "EVIDENCE_MISSING",
  "EVIDENCE_PARTIAL",
  "EVIDENCE_COMPLETE",
] as const;
export type AssuranceEvaluationReasonCode = (typeof ASSURANCE_EVALUATION_REASON_CODES)[number];

export interface AssuranceApplicabilitySnapshot {
  readonly status: AssuranceApplicabilityStatus;
  readonly decisionId?: string;
}

export type AssuranceEvaluationSourceSnapshot = Readonly<{
  sourceId: string;
  /** True only when the fixture/source record has the metadata required by the trust contract. */
  hasRequiredMetadata: boolean;
  currentness: AssuranceSourceCurrentness;
  rights: AssuranceSourceRightsStatus;
}>;

export type AssuranceConflictSnapshot = Readonly<{
  conflictId: string;
  status: AssuranceConflictStatus;
}>;

export interface AssuranceEvidenceExpectationSnapshot {
  readonly requiredKeys: readonly string[];
}

export interface AssuranceEvidenceSubmissionSnapshot {
  readonly submissionId: string;
  readonly payload: Readonly<Record<string, unknown>>;
}

export interface AssuranceEvaluationInput {
  readonly applicability: AssuranceApplicabilitySnapshot;
  /** Mutable container for persistence/serialization compatibility; snapshot members remain readonly. */
  readonly sources: AssuranceEvaluationSourceSnapshot[];
  /** Mutable container for persistence/serialization compatibility; snapshot members remain readonly. */
  readonly conflicts: AssuranceConflictSnapshot[];
  readonly expectation: AssuranceEvidenceExpectationSnapshot;
  readonly submission?: AssuranceEvidenceSubmissionSnapshot;
}

export interface AssuranceEvaluationOutput {
  readonly result: AssuranceEvaluationResult;
  readonly reasonCodes: readonly AssuranceEvaluationReasonCode[];
  readonly requiresHumanReview: true;
  readonly sourceIds: readonly string[];
  readonly evidenceSubmissionId?: string;
}
