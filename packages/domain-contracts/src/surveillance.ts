import { z } from "zod";
import type { AssuranceEvaluationResult, AssuranceSourceCurrentness, AssuranceSourceRightsStatus } from "./assurance.js";

export const SURVEILLANCE_BLUEPRINT_STATUSES = [
  "DRAFT",
  "UNDER_REVIEW",
  "APPROVED",
  "ACTIVE",
  "UNDER_RE_REVIEW",
  "SUPERSEDED",
  "RETIRED",
] as const;
export type SurveillanceBlueprintStatus = (typeof SURVEILLANCE_BLUEPRINT_STATUSES)[number];

export const SURVEILLANCE_ROUND_STATUSES = ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;
export type SurveillanceRoundStatus = (typeof SURVEILLANCE_ROUND_STATUSES)[number];

export const SURVEILLANCE_SCENE_STATUSES = [
  "PENDING_RESOLUTION",
  "AWAITING_EVIDENCE",
  "REVIEW_READY",
  "UNDER_REVIEW",
  "COMPLETED",
  "BLOCKED",
] as const;
export type SurveillanceSceneStatus = (typeof SURVEILLANCE_SCENE_STATUSES)[number];

export const SURVEILLANCE_ACTIVATION_STATUSES = ["ACTIVE", "INACTIVE", "PENDING"] as const;
export type SurveillanceActivationStatus = (typeof SURVEILLANCE_ACTIVATION_STATUSES)[number];

export const SURVEILLANCE_EVIDENCE_REQUEST_STATUSES = [
  "REQUIRED_PENDING",
  "SUBMITTED",
  "ACCEPTED_FOR_ASSESSMENT",
  "REJECTED_QUALITY",
  "WAIVED",
  "NOT_APPLICABLE",
] as const;
export type SurveillanceEvidenceRequestStatus = (typeof SURVEILLANCE_EVIDENCE_REQUEST_STATUSES)[number];

export const SURVEILLANCE_EVIDENCE_TYPES = [
  "CONTEXT_PHOTO",
  "DETAIL_PHOTO",
  "FUNCTIONAL_OBSERVATION",
  "POLICY_DOCUMENT",
  "SPATIAL_CONTEXT",
  "ITEM_CLASSIFICATION",
] as const;
export type SurveillanceEvidenceType = (typeof SURVEILLANCE_EVIDENCE_TYPES)[number];

export const SURVEILLANCE_VERIFICATION_MODES = [
  "VISUAL",
  "FUNCTIONAL",
  "DOCUMENTARY",
  "MEASUREMENT",
  "BEHAVIORAL",
  "COMBINED",
] as const;
export type SurveillanceVerificationMode = (typeof SURVEILLANCE_VERIFICATION_MODES)[number];

export const SURVEILLANCE_REQUIREMENT_LEVELS = ["REQUIRED", "CONDITIONAL", "SUPPORTING", "OPTIONAL"] as const;
export type SurveillanceRequirementLevel = (typeof SURVEILLANCE_REQUIREMENT_LEVELS)[number];

export const SURVEILLANCE_OBSERVATION_SOURCES = ["HUMAN", "AI"] as const;
export type SurveillanceObservationSource = (typeof SURVEILLANCE_OBSERVATION_SOURCES)[number];

export const SURVEILLANCE_CANDIDATE_STATUSES = [
  "CANDIDATE",
  "NEEDS_MORE_EVIDENCE",
  "SUBMITTED_FOR_REVIEW",
  "ACCEPTED_FOR_FINDING",
  "REJECTED",
] as const;
export type SurveillanceCandidateStatus = (typeof SURVEILLANCE_CANDIDATE_STATUSES)[number];

export const SURVEILLANCE_DECISION_TYPES = [
  "OBSERVATION_ACCEPTANCE",
  "FINDING_DISPOSITION",
  "CITATION_APPROVAL",
  "SCOPE",
  "EXCEPTION",
  "CLOSURE",
  "REOPEN",
  "EVIDENCE_WAIVER",
] as const;
export type SurveillanceDecisionType = (typeof SURVEILLANCE_DECISION_TYPES)[number];

export const SURVEILLANCE_FINDING_STATUSES = [
  "OPEN",
  "ACTION_IN_PROGRESS",
  "COMPLETION_SUBMITTED",
  "CLOSED",
  "REOPENED",
] as const;
export type SurveillanceFindingStatus = (typeof SURVEILLANCE_FINDING_STATUSES)[number];

export const SURVEILLANCE_ACTION_STATUSES = ["OPEN", "IN_PROGRESS", "COMPLETION_SUBMITTED", "ACCEPTED_COMPLETE"] as const;
export type SurveillanceActionStatus = (typeof SURVEILLANCE_ACTION_STATUSES)[number];

export const SURVEILLANCE_TREND_OUTCOMES = [
  "UNRESOLVED",
  "CORRECTED_DURING_ROUND",
  "CORRECTED_AFTER_ACTION",
  "ACCEPTED_CLOSED",
  "NO_FINDING",
] as const;
export type SurveillanceTrendOutcome = (typeof SURVEILLANCE_TREND_OUTCOMES)[number];

export const SURVEILLANCE_SOURCE_ROLES = [
  "BINDING_REGULATION",
  "ACCREDITATION_REQUIREMENT",
  "INTERPRETIVE_GUIDANCE",
  "NATIONALLY_RECOGNIZED_GUIDELINE",
  "MODEL_CODE",
  "ASSESSMENT_TOOL",
  "RISK_REDUCTION_GUIDANCE",
  "MANUFACTURER_INSTRUCTION",
  "ORGANIZATION_POLICY",
  "CONSULTANT_INTERPRETATION",
  "HISTORICAL_CONTEXT",
] as const;
export type SurveillanceSourceRole = (typeof SURVEILLANCE_SOURCE_ROLES)[number];

export const SURVEILLANCE_BASIS_STRENGTHS = [
  "EXTERNAL_REQUIREMENT",
  "NATIONALLY_RECOGNIZED_PRACTICE",
  "MANUFACTURER_INSTRUCTION",
  "ORGANIZATION_REQUIREMENT",
  "RISK_REDUCTION_PRACTICE",
  "CONSULTANT_RECOMMENDATION",
  "ILLUSTRATIVE_ONLY",
  "PRODUCT_GOVERNANCE_RULE",
] as const;
export type SurveillanceBasisStrength = (typeof SURVEILLANCE_BASIS_STRENGTHS)[number];

export const SURVEILLANCE_ABSTENTION_REASONS = [
  "INSUFFICIENT_RESOLUTION",
  "UNKNOWN_MATERIAL",
  "HIDDEN_SUBSTRATE",
  "TACTILE_ASSESSMENT_NEEDED",
  "MEASUREMENT_NEEDED",
  "CAUSATION_NOT_VISIBLE",
  "VIEW_GEOMETRY_INVALID",
  "SOURCE_NOT_RESOLVED",
  "SUBJECT_IDENTITY_UNRESOLVED",
  "SPECIALIST_JUDGMENT_REQUIRED",
] as const;
export type SurveillanceAbstentionReason = (typeof SURVEILLANCE_ABSTENTION_REASONS)[number];

export type SurveillanceFactValue = string | number | boolean | null | readonly string[];
export type SurveillanceRuleOperator = "eq" | "ne" | "in" | "not_in" | "exists" | "gt" | "gte" | "lt" | "lte" | "contains";
export type SurveillanceRuleExpression =
  | { readonly all: readonly SurveillanceRuleExpression[] }
  | { readonly any: readonly SurveillanceRuleExpression[] }
  | { readonly not: SurveillanceRuleExpression }
  | { readonly fact: string; readonly op: SurveillanceRuleOperator; readonly value?: SurveillanceFactValue };

export interface MedicationRoomCriterionDefinition {
  readonly code: "C1" | "C2" | "C3" | "C4";
  readonly canonicalQuestion: string;
  readonly plainLanguageExpectation: string;
  readonly activationRule: SurveillanceRuleExpression;
  readonly materiality: "ROUTINE_ASSURANCE" | "ELEVATED_ATTENTION";
  readonly trendKey: string;
}

export interface MedicationRoomEvidenceRequirementDefinition {
  readonly code: string;
  readonly criterionCode: MedicationRoomCriterionDefinition["code"];
  readonly evidenceType: SurveillanceEvidenceType;
  readonly requirementLevel: SurveillanceRequirementLevel;
  readonly verificationMode: SurveillanceVerificationMode;
  readonly acceptanceRule: string;
  readonly conditionalRule?: SurveillanceRuleExpression;
}

export interface MedicationRoomExpectedStateDefinition {
  readonly code: string;
  readonly criterionCode: MedicationRoomCriterionDefinition["code"];
  readonly statement: string;
  readonly basisStrength: SurveillanceBasisStrength;
}

export interface MedicationRoomAuthorityBindingDefinition {
  readonly criterionCode: MedicationRoomCriterionDefinition["code"];
  readonly sourceFamilyKey: string;
  readonly versionLabel: string;
  readonly title: string;
  readonly citation: string;
  readonly sourceRole: SurveillanceSourceRole;
  readonly currentness: AssuranceSourceCurrentness;
  readonly rightsStatus: AssuranceSourceRightsStatus;
  readonly relationshipType: string;
}

export interface MedicationRoomOrganizationRuleDefinition {
  readonly criterionCode: MedicationRoomCriterionDefinition["code"];
  readonly title: string;
  readonly versionLabel: string;
  readonly statement: string;
}

export interface MedicationRoomBlueprintDefinition {
  readonly code: "BP-MED-HH-001";
  readonly canonicalName: string;
  readonly sceneFamily: "medication_room_environment";
  readonly versionLabel: "0.1-slice";
  readonly applicabilityRule: SurveillanceRuleExpression;
  readonly variants: readonly {
    readonly code: "A" | "B";
    readonly name: string;
    readonly selectionRule: SurveillanceRuleExpression;
  }[];
  readonly criteria: readonly MedicationRoomCriterionDefinition[];
  readonly expectedStates: readonly MedicationRoomExpectedStateDefinition[];
  readonly evidenceRequirements: readonly MedicationRoomEvidenceRequirementDefinition[];
  readonly authorityBindings: readonly MedicationRoomAuthorityBindingDefinition[];
  readonly organizationRules: readonly MedicationRoomOrganizationRuleDefinition[];
}

export interface SurveillanceCriterionRuntimeView {
  readonly criterionCode: string;
  readonly activationStatus: SurveillanceActivationStatus;
  readonly activationReason: string;
  readonly evidenceAssessment: AssuranceEvaluationResult | null;
  readonly evidenceRequests: readonly {
    readonly requestId: string;
    readonly requirementCode: string;
    readonly evidenceType: SurveillanceEvidenceType;
    readonly verificationMode: SurveillanceVerificationMode;
    readonly status: SurveillanceEvidenceRequestStatus;
  }[];
}

export interface SurveillanceSceneView {
  readonly sceneId: string;
  readonly roundId: string;
  readonly blueprintCode: string;
  readonly blueprintVersion: string;
  readonly variantCode: string | null;
  readonly status: SurveillanceSceneStatus;
  readonly applicabilityStatus: string;
  readonly criteria: readonly SurveillanceCriterionRuntimeView[];
}

export interface SurveillanceAssessmentProposal {
  readonly criterionCode: string;
  readonly result: AssuranceEvaluationResult;
  readonly reasonCodes: readonly string[];
  readonly missingRequirementCodes: readonly string[];
}

export interface SurveillanceAiObservationProposal {
  readonly objectiveDescription: string;
  readonly features: readonly string[];
  readonly detectionConfidence: number;
  readonly interpretationConfidence: number;
  readonly impactConfidence: number;
  readonly abstentionReason: SurveillanceAbstentionReason | null;
  readonly evidenceIds: readonly string[];
}

export const SURVEILLANCE_FORBIDDEN_AI_FINAL_STATE_PHRASES = [
  "compliant",
  "noncompliant",
  "violation",
  "immediate jeopardy",
  "cms tag",
] as const;

export const SURVEILLANCE_EVENT_TYPES = [
  "SURVEILLANCE_BLUEPRINT_ACTIVATED",
  "SURVEILLANCE_ROUND_STARTED",
  "SURVEILLANCE_SCENE_RESOLVED",
  "SURVEILLANCE_SCENE_FACTS_UPDATED",
  "SURVEILLANCE_EVIDENCE_SUBMITTED",
  "SURVEILLANCE_EVIDENCE_DERIVED",
  "SURVEILLANCE_SCENE_ASSESSED",
  "SURVEILLANCE_OBSERVATION_CREATED",
  "SURVEILLANCE_CANDIDATE_CREATED",
  "SURVEILLANCE_REVIEW_PACKET_ASSEMBLED",
  "SURVEILLANCE_DECISION_RECORDED",
  "SURVEILLANCE_FINDING_CONFIRMED",
  "SURVEILLANCE_IMMEDIATE_CORRECTION_RECORDED",
  "SURVEILLANCE_CORRECTIVE_ACTION_CREATED",
  "SURVEILLANCE_CLOSURE_EVIDENCE_SUBMITTED",
  "SURVEILLANCE_FINDING_CLOSED",
  "SURVEILLANCE_FINDING_REOPENED",
  "SURVEILLANCE_TREND_OCCURRENCE_RECORDED",
] as const;
export type SurveillanceEventType = (typeof SURVEILLANCE_EVENT_TYPES)[number];

export const SurveillanceEventEnvelopeSchema = z.object({
  eventId: z.string().min(1).max(200),
  schema: z.object({ name: z.literal("clarity.surveillance-event"), version: z.literal("1.0.0") }).strict(),
  eventType: z.object({ name: z.enum(SURVEILLANCE_EVENT_TYPES), version: z.literal(1) }).strict(),
  aggregate: z.object({
    type: z.enum(["SURVEILLANCE_BLUEPRINT", "SURVEILLANCE_ROUND", "SURVEILLANCE_SCENE", "SURVEILLANCE_FINDING"]),
    id: z.string().min(1).max(200),
    version: z.number().int().positive(),
  }).strict(),
  tenant: z.object({ organizationId: z.string().min(1).max(200), facilityId: z.string().min(1).max(200).nullable() }).strict(),
  actor: z.object({ type: z.enum(["USER", "SYSTEM", "AI"]), id: z.string().min(1).max(200) }).strict(),
  times: z.object({ effectiveAt: z.string().datetime(), recordedAt: z.string().datetime() }).strict(),
  correlationId: z.string().min(1).max(200),
  causationId: z.string().min(1).max(200).nullable(),
  classification: z.literal("PUBLIC_SYNTHETIC"),
  payloadHash: z.string().regex(/^[a-f0-9]{64}$/),
  payload: z.record(z.unknown()),
}).strict();
export type SurveillanceEventEnvelope = z.infer<typeof SurveillanceEventEnvelopeSchema>;
