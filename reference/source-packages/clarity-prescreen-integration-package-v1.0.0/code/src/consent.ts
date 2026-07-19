export type AgeBand = "UNDER_12" | "AGE_12_TO_15" | "AGE_16_TO_17" | "ADULT" | "ALL";
export type SignerType =
  | "PATIENT"
  | "MINOR_PATIENT"
  | "PARENT"
  | "TUTOR"
  | "LEGAL_GUARDIAN"
  | "CARETAKER"
  | "PUBLIC_CUSTODIAN"
  | "PHYSICIAN"
  | "PMHNP"
  | "CORONER"
  | "JUDGE"
  | "COURT"
  | "OTHER_AUTHORIZED_ROLE";

export interface ConsentAuthorityRule {
  readonly ruleId: string;
  readonly version: number;
  readonly status: "DRAFT_UNVERIFIED" | "PENDING_REVIEW" | "APPROVED" | "SUSPENDED" | "SUPERSEDED";
  readonly jurisdictionCode: string;
  readonly facilityId?: string;
  readonly programId?: string;
  readonly ageBand: AgeBand;
  readonly actionCode: string;
  readonly admissionPathways: readonly string[];
  readonly authorizedSignerTypes: readonly SignerType[];
  readonly minorSignatureRequired: boolean;
  readonly relationshipEvidenceRequired: boolean;
  readonly courtApprovalRequired: boolean;
  readonly clinicianReviewRequired: boolean;
  readonly privacyRegimes: readonly string[];
}

export interface ConsentContext {
  readonly jurisdictionCode: string;
  readonly facilityId?: string;
  readonly programId?: string;
  readonly age: number;
  readonly actionCode: string;
  readonly admissionPathway: string;
  readonly signerType: SignerType;
  readonly relationshipEvidencePresent: boolean;
  readonly minorSignaturePresent: boolean;
  readonly courtApprovalPresent: boolean;
  readonly clinicianReviewPresent: boolean;
  readonly privacyRegime?: string;
}

export interface ConsentEvaluation {
  readonly allowed: boolean;
  readonly ruleId?: string;
  readonly ruleVersion?: number;
  readonly unmetRequirements: readonly string[];
  readonly reasons: readonly string[];
}

export function ageBandFor(age: number): AgeBand {
  if (!Number.isInteger(age) || age < 0 || age > 125) throw new RangeError("Age must be an integer from 0 through 125.");
  if (age < 12) return "UNDER_12";
  if (age < 16) return "AGE_12_TO_15";
  if (age < 18) return "AGE_16_TO_17";
  return "ADULT";
}

export function evaluateConsentAuthority(
  rules: readonly ConsentAuthorityRule[],
  context: ConsentContext,
): ConsentEvaluation {
  const ageBand = ageBandFor(context.age);
  const candidates = rules.filter((rule) =>
    rule.status === "APPROVED" &&
    rule.jurisdictionCode === context.jurisdictionCode &&
    (rule.facilityId === undefined || rule.facilityId === context.facilityId) &&
    (rule.programId === undefined || rule.programId === context.programId) &&
    (rule.ageBand === "ALL" || rule.ageBand === ageBand) &&
    rule.actionCode === context.actionCode &&
    rule.admissionPathways.includes(context.admissionPathway),
  );
  if (candidates.length === 0) return { allowed: false, unmetRequirements: ["NO_APPROVED_RULE"], reasons: [] };
  const rule = candidates[0];
  if (!rule) return { allowed: false, unmetRequirements: ["NO_APPROVED_RULE"], reasons: [] };
  const unmet: string[] = [];
  if (!rule.authorizedSignerTypes.includes(context.signerType)) unmet.push("SIGNER_TYPE_NOT_AUTHORIZED");
  if (rule.relationshipEvidenceRequired && !context.relationshipEvidencePresent) unmet.push("RELATIONSHIP_EVIDENCE_REQUIRED");
  if (rule.minorSignatureRequired && !context.minorSignaturePresent) unmet.push("MINOR_SIGNATURE_REQUIRED");
  if (rule.courtApprovalRequired && !context.courtApprovalPresent) unmet.push("COURT_APPROVAL_REQUIRED");
  if (rule.clinicianReviewRequired && !context.clinicianReviewPresent) unmet.push("CLINICIAN_REVIEW_REQUIRED");
  if (context.privacyRegime && rule.privacyRegimes.length > 0 && !rule.privacyRegimes.includes(context.privacyRegime)) unmet.push("PRIVACY_REGIME_NOT_COVERED");
  return {
    allowed: unmet.length === 0,
    ruleId: rule.ruleId,
    ruleVersion: rule.version,
    unmetRequirements: unmet,
    reasons: [`MATCHED_APPROVED_RULE:${rule.ruleId}:v${rule.version}`],
  };
}
