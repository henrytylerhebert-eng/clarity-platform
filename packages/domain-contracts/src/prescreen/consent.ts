import { z } from "zod";
import { DATE_ONLY_SCHEMA, DOMAIN_ID_SCHEMA } from "../episode.js";

export const CONSENT_AGE_BANDS = ["UNDER_12", "AGE_12_TO_15", "AGE_16_TO_17", "ADULT", "ALL"] as const;
export type ConsentAgeBand = (typeof CONSENT_AGE_BANDS)[number];

export const CONSENT_SIGNER_TYPES = [
  "PATIENT",
  "MINOR_PATIENT",
  "PARENT",
  "TUTOR",
  "LEGAL_GUARDIAN",
  "CARETAKER",
  "PUBLIC_CUSTODIAN",
  "PHYSICIAN",
  "PMHNP",
  "CORONER",
  "JUDGE",
  "COURT",
  "OTHER_AUTHORIZED_ROLE",
] as const;
export type ConsentSignerType = (typeof CONSENT_SIGNER_TYPES)[number];

export const CONSENT_RULE_APPROVAL_STATUSES = [
  "DRAFT_UNVERIFIED",
  "PENDING_REVIEW",
  "APPROVED",
  "SUSPENDED",
  "SUPERSEDED",
] as const;

export const CONSENT_SOURCE_TYPES = [
  "STATUTE",
  "REGULATION",
  "FACILITY_POLICY",
  "COURT_ORDER",
  "COUNSEL_GUIDANCE",
  "OTHER",
] as const;

export const ConsentRuleSourceSchema = z
  .object({
    sourceType: z.enum(CONSENT_SOURCE_TYPES),
    citation: z.string().min(1),
    sourceDocumentVersionId: DOMAIN_ID_SCHEMA.nullable().optional(),
    location: z.string().min(1).nullable().optional(),
  })
  .strict();

export const ConsentAuthorityRuleSchema = z
  .object({
    ruleId: DOMAIN_ID_SCHEMA,
    version: z.number().int().positive(),
    jurisdiction: z.string().min(1),
    facilityId: DOMAIN_ID_SCHEMA.nullable(),
    programId: DOMAIN_ID_SCHEMA.nullable().optional(),
    ageBand: z.enum(CONSENT_AGE_BANDS),
    actionCode: DOMAIN_ID_SCHEMA,
    documentType: DOMAIN_ID_SCHEMA.nullable().optional(),
    treatmentCategory: DOMAIN_ID_SCHEMA.nullable().optional(),
    admissionPathways: z.array(DOMAIN_ID_SCHEMA).min(1),
    authorizedSignerTypes: z.array(z.enum(CONSENT_SIGNER_TYPES)).min(1),
    minorSignatureRequired: z.boolean().default(false),
    minorAssentRecorded: z.boolean().default(false),
    relationshipEvidenceRequired: z.boolean().default(false),
    courtApprovalRequired: z.boolean().default(false),
    clinicianReviewRequired: z.boolean().default(false),
    coSignerTypes: z.array(DOMAIN_ID_SCHEMA).default([]),
    privacyRegimes: z.array(z.enum(["HIPAA", "PART_2", "STATE_CONFIDENTIALITY", "OTHER"])).default([]),
    conditions: z.array(z.string().min(1)).default([]),
    prohibitedWhen: z.array(z.string().min(1)).default([]),
    effectiveFrom: DATE_ONLY_SCHEMA,
    effectiveTo: DATE_ONLY_SCHEMA.nullable().optional(),
    approvalStatus: z.enum(CONSENT_RULE_APPROVAL_STATUSES),
    sourceReferences: z.array(ConsentRuleSourceSchema).min(1),
    approvedBy: z.array(DOMAIN_ID_SCHEMA).default([]),
  })
  .strict()
  .refine((rule) => !rule.effectiveTo || rule.effectiveFrom <= rule.effectiveTo, {
    path: ["effectiveTo"],
    message: "effectiveTo must be on or after effectiveFrom",
  });
export type ConsentAuthorityRule = Readonly<z.infer<typeof ConsentAuthorityRuleSchema>>;

export interface ConsentAuthorityContext {
  readonly jurisdiction: string;
  readonly facilityId: string | null;
  readonly programId?: string | null;
  readonly age: number;
  readonly actionCode: string;
  readonly documentType?: string | null;
  readonly treatmentCategory?: string | null;
  readonly admissionPathway: string;
  readonly signerType: ConsentSignerType;
  readonly relationshipEvidencePresent: boolean;
  readonly minorSignaturePresent: boolean;
  readonly courtApprovalPresent: boolean;
  readonly clinicianReviewPresent: boolean;
  readonly privacyRegime?: "HIPAA" | "PART_2" | "STATE_CONFIDENTIALITY" | "OTHER";
  readonly evaluatedOn: string;
}

export interface ConsentAuthorityEvaluation {
  readonly allowed: boolean;
  readonly ruleId?: string;
  readonly ruleVersion?: number;
  readonly unmetRequirements: readonly string[];
  readonly reasons: readonly string[];
}

export function consentAgeBandFor(age: number): Exclude<ConsentAgeBand, "ALL"> {
  if (!Number.isInteger(age) || age < 0 || age > 125) {
    throw new RangeError("Age must be an integer from 0 through 125.");
  }
  if (age < 12) return "UNDER_12";
  if (age < 16) return "AGE_12_TO_15";
  if (age < 18) return "AGE_16_TO_17";
  return "ADULT";
}

function matchesNullableScope(ruleValue: string | null | undefined, contextValue: string | null | undefined): boolean {
  return ruleValue == null || ruleValue === contextValue;
}

export function evaluateConsentAuthority(
  rules: readonly ConsentAuthorityRule[],
  context: ConsentAuthorityContext,
): ConsentAuthorityEvaluation {
  const evaluatedOn = DATE_ONLY_SCHEMA.parse(context.evaluatedOn);
  const ageBand = consentAgeBandFor(context.age);
  const candidates = rules
    .map((rule) => ConsentAuthorityRuleSchema.parse(rule))
    .filter(
      (rule) =>
        rule.approvalStatus === "APPROVED" &&
        rule.jurisdiction === context.jurisdiction &&
        matchesNullableScope(rule.facilityId, context.facilityId) &&
        matchesNullableScope(rule.programId, context.programId) &&
        (rule.ageBand === "ALL" || rule.ageBand === ageBand) &&
        rule.actionCode === context.actionCode &&
        matchesNullableScope(rule.documentType, context.documentType) &&
        matchesNullableScope(rule.treatmentCategory, context.treatmentCategory) &&
        rule.admissionPathways.includes(context.admissionPathway) &&
        rule.effectiveFrom <= evaluatedOn &&
        (!rule.effectiveTo || rule.effectiveTo >= evaluatedOn),
    )
    .sort((left, right) => {
      const specificity = (rule: ConsentAuthorityRule) =>
        Number(rule.facilityId !== null) +
        Number(rule.programId != null) +
        Number(rule.documentType != null) +
        Number(rule.treatmentCategory != null);
      return specificity(right) - specificity(left) || right.version - left.version || left.ruleId.localeCompare(right.ruleId);
    });

  const rule = candidates[0];
  if (!rule) {
    return { allowed: false, unmetRequirements: ["NO_APPROVED_RULE"], reasons: [] };
  }
  const unmetRequirements: string[] = [];
  if (!rule.authorizedSignerTypes.includes(context.signerType)) unmetRequirements.push("SIGNER_TYPE_NOT_AUTHORIZED");
  if (rule.relationshipEvidenceRequired && !context.relationshipEvidencePresent) {
    unmetRequirements.push("RELATIONSHIP_EVIDENCE_REQUIRED");
  }
  if (rule.minorSignatureRequired && !context.minorSignaturePresent) {
    unmetRequirements.push("MINOR_SIGNATURE_REQUIRED");
  }
  if (rule.courtApprovalRequired && !context.courtApprovalPresent) {
    unmetRequirements.push("COURT_APPROVAL_REQUIRED");
  }
  if (rule.clinicianReviewRequired && !context.clinicianReviewPresent) {
    unmetRequirements.push("CLINICIAN_REVIEW_REQUIRED");
  }
  if (
    context.privacyRegime &&
    rule.privacyRegimes.length > 0 &&
    !rule.privacyRegimes.includes(context.privacyRegime)
  ) {
    unmetRequirements.push("PRIVACY_REGIME_NOT_COVERED");
  }
  return {
    allowed: unmetRequirements.length === 0,
    ruleId: rule.ruleId,
    ruleVersion: rule.version,
    unmetRequirements,
    reasons: [`MATCHED_APPROVED_RULE:${rule.ruleId}:v${rule.version}`],
  };
}
