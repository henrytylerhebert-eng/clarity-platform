import { z } from "zod";
import { DOMAIN_ID_SCHEMA, ISO_DATETIME_SCHEMA } from "./episode.js";

/**
 * Prescreen Phase 1 contracts.
 *
 * Repo-native adoption of the contracts proposed by
 * reference/source-packages/clarity-prescreen-integration-package-v1.0.0
 * (code/src + contracts/). Pure types, Zod schemas, deterministic state
 * machines, and configured-rule evaluators only — no I/O, no persistence,
 * no clinical or legal decision-making. Possible pathways are workflow
 * routing hints; legal status, admission, placement, and transport
 * decisions remain human commands recorded elsewhere.
 */

// ---------------------------------------------------------------------------
// Willingness and orientation
// ---------------------------------------------------------------------------

export const PATIENT_WILLINGNESS_STATES = [
  "WILLING",
  "NON_OPPOSED",
  "OPPOSED",
  "UNABLE_TO_EXPRESS",
  "FLUCTUATING",
  "UNKNOWN",
  "NOT_ASSESSED",
] as const;
export type PatientWillingness = (typeof PATIENT_WILLINGNESS_STATES)[number];

export const ORIENTATION_STATUSES = [
  "ORIENTED",
  "NOT_ORIENTED",
  "UNABLE_TO_ASSESS",
  "NOT_ASSESSED",
  "UNKNOWN",
] as const;
export type OrientationStatus = (typeof ORIENTATION_STATUSES)[number];

export const OrientationDomainFindingSchema = z
  .object({
    status: z.enum(ORIENTATION_STATUSES),
    observation: z.string().min(1).max(2000).optional(),
  })
  .strict();
export type OrientationDomainFinding = z.infer<typeof OrientationDomainFindingSchema>;

/** Orientation is recorded for person, place, time, and situation (owner decision #5). */
export const OrientationObservationSchema = z
  .object({
    observedAt: ISO_DATETIME_SCHEMA,
    sourceId: DOMAIN_ID_SCHEMA.optional(),
    person: OrientationDomainFindingSchema,
    place: OrientationDomainFindingSchema,
    time: OrientationDomainFindingSchema,
    situation: OrientationDomainFindingSchema,
  })
  .strict();
export type OrientationObservation = z.infer<typeof OrientationObservationSchema>;

export type OrientationGate = "PASS" | "FAIL" | "UNKNOWN";

export function evaluateOrientationGate(observation: OrientationObservation): OrientationGate {
  const statuses = [
    observation.person.status,
    observation.place.status,
    observation.time.status,
    observation.situation.status,
  ];
  if (statuses.every((status) => status === "ORIENTED")) return "PASS";
  if (statuses.some((status) => status === "NOT_ORIENTED")) return "FAIL";
  return "UNKNOWN";
}

// ---------------------------------------------------------------------------
// Possible pathways (routing hints, never legal/admission decisions)
// ---------------------------------------------------------------------------

export const POSSIBLE_PATHWAYS = [
  "POSSIBLE_FORMAL_VOLUNTARY_REVIEW",
  "POSSIBLE_NONCONTESTED_PATHWAY",
  "EMERGENCY_OR_LEGAL_REVIEW_REQUIRED",
  "MEDICAL_STABILIZATION_REQUIRED",
  "COMMUNITY_OR_OTHER_DISPOSITION",
  "UNDETERMINED",
] as const;
export type PossiblePathway = (typeof POSSIBLE_PATHWAYS)[number];

export interface PathwayInput {
  readonly willingness: PatientWillingness;
  readonly orientation: OrientationObservation;
  readonly immediateMedicalStabilizationRequired?: boolean;
  readonly activeEmergencyOrLegalProcess?: boolean;
}

export interface PathwayResult {
  readonly pathway: PossiblePathway;
  readonly orientationGate: OrientationGate;
  readonly reasons: readonly string[];
  readonly requiresAuthorizedReview: boolean;
}

/**
 * Deterministic routing derivation. Medical stabilization takes precedence
 * over every other pathway; a patient not oriented to all four domains never
 * derives the formal-voluntary pathway (owner decision #6).
 */
export function derivePossiblePathway(input: PathwayInput): PathwayResult {
  const gate = evaluateOrientationGate(input.orientation);
  if (input.immediateMedicalStabilizationRequired) {
    return {
      pathway: "MEDICAL_STABILIZATION_REQUIRED",
      orientationGate: gate,
      reasons: ["IMMEDIATE_MEDICAL_STABILIZATION_REQUIRED"],
      requiresAuthorizedReview: true,
    };
  }
  if (input.activeEmergencyOrLegalProcess || input.willingness === "OPPOSED") {
    const reasons: string[] = [];
    if (input.activeEmergencyOrLegalProcess) reasons.push("ACTIVE_LEGAL_PROCESS");
    if (input.willingness === "OPPOSED") reasons.push("PATIENT_OPPOSED");
    return {
      pathway: "EMERGENCY_OR_LEGAL_REVIEW_REQUIRED",
      orientationGate: gate,
      reasons,
      requiresAuthorizedReview: true,
    };
  }
  if (input.willingness === "WILLING" && gate === "PASS") {
    return {
      pathway: "POSSIBLE_FORMAL_VOLUNTARY_REVIEW",
      orientationGate: gate,
      reasons: ["PATIENT_WILLING", "ORIENTATION_GATE_PASS"],
      requiresAuthorizedReview: true,
    };
  }
  // Deliberate deviation from the reference package (external review, PR #19):
  // a NON_OPPOSED patient routes to the possible noncontested pathway at any
  // orientation gate — owner decision #7 puts the final status with hospital
  // intake and an authorized practitioner, so this never derives UNDETERMINED
  // with no review for an oriented, non-opposed patient.
  if (input.willingness === "NON_OPPOSED" || (input.willingness === "WILLING" && gate !== "PASS")) {
    return {
      pathway: "POSSIBLE_NONCONTESTED_PATHWAY",
      orientationGate: gate,
      reasons: ["PATIENT_NOT_OPPOSED", `ORIENTATION_GATE_${gate}`],
      requiresAuthorizedReview: true,
    };
  }
  return {
    pathway: "UNDETERMINED",
    orientationGate: gate,
    reasons: ["INSUFFICIENT_INFORMATION_OR_UNRESOLVED_PATHWAY"],
    requiresAuthorizedReview: false,
  };
}

// ---------------------------------------------------------------------------
// Encounter and assessment lifecycle
// ---------------------------------------------------------------------------

export const PRESCREEN_ENCOUNTER_STATUSES = [
  "DRAFT",
  "ATTESTED",
  "SUBMITTED",
  "CENTRAL_INTAKE_REVIEW",
  "NEEDS_INFORMATION",
  "AUTHORIZED_REVIEW",
  "FACILITY_ROUTING",
  "TRANSPORT_PLANNING",
  "HANDED_OFF",
  "REDIRECTED",
  "DECLINED",
  "CANCELLED",
] as const;
export type PrescreenEncounterStatus = (typeof PRESCREEN_ENCOUNTER_STATUSES)[number];

const PRESCREEN_ENCOUNTER_TRANSITIONS: Record<
  PrescreenEncounterStatus,
  readonly PrescreenEncounterStatus[]
> = {
  DRAFT: ["ATTESTED", "CANCELLED"],
  ATTESTED: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["CENTRAL_INTAKE_REVIEW", "NEEDS_INFORMATION", "CANCELLED"],
  CENTRAL_INTAKE_REVIEW: [
    "NEEDS_INFORMATION",
    "AUTHORIZED_REVIEW",
    "FACILITY_ROUTING",
    "REDIRECTED",
    "DECLINED",
    "CANCELLED",
  ],
  NEEDS_INFORMATION: ["CENTRAL_INTAKE_REVIEW", "CANCELLED"],
  AUTHORIZED_REVIEW: [
    "NEEDS_INFORMATION",
    "FACILITY_ROUTING",
    "TRANSPORT_PLANNING",
    "REDIRECTED",
    "DECLINED",
    "CANCELLED",
  ],
  FACILITY_ROUTING: ["NEEDS_INFORMATION", "TRANSPORT_PLANNING", "REDIRECTED", "DECLINED", "CANCELLED"],
  TRANSPORT_PLANNING: ["HANDED_OFF", "REDIRECTED", "CANCELLED"],
  HANDED_OFF: [],
  REDIRECTED: [],
  DECLINED: [],
  CANCELLED: [],
};

export function canTransitionPrescreenEncounter(
  from: PrescreenEncounterStatus,
  to: PrescreenEncounterStatus,
): boolean {
  return PRESCREEN_ENCOUNTER_TRANSITIONS[from]?.includes(to) ?? false;
}

export class PrescreenTransitionError extends Error {
  readonly code = "INVALID_ENCOUNTER_TRANSITION";
  constructor(from: PrescreenEncounterStatus, to: PrescreenEncounterStatus) {
    super(`Cannot transition prescreen from ${from} to ${to}.`);
    this.name = "PrescreenTransitionError";
  }
}

export function assertPrescreenEncounterTransition(
  from: PrescreenEncounterStatus,
  to: PrescreenEncounterStatus,
): void {
  if (!canTransitionPrescreenEncounter(from, to)) throw new PrescreenTransitionError(from, to);
}

export const PRESCREEN_ASSESSMENT_STATUSES = ["DRAFT", "ATTESTED", "CORRECTED", "SUPERSEDED"] as const;
export type PrescreenAssessmentStatus = (typeof PRESCREEN_ASSESSMENT_STATUSES)[number];

export const ANSWER_VALUE_STATES = [
  "ANSWERED",
  "UNKNOWN",
  "NOT_ASSESSED",
  "DECLINED_TO_ANSWER",
  "NOT_APPLICABLE",
] as const;
export type AnswerValueState = (typeof ANSWER_VALUE_STATES)[number];

export const PRESCREEN_SOURCE_TYPES = [
  "DIRECT_OBSERVATION",
  "PATIENT_REPORT",
  "FAMILY_SUPPORT_REPORT",
  "FACILITY_STAFF_REPORT",
  "LAW_ENFORCEMENT_REPORT",
  "CLINICIAN_REPORT",
  "DOCUMENT",
  "SYSTEM_DERIVED",
  "UNKNOWN",
] as const;
export type PrescreenSourceType = (typeof PRESCREEN_SOURCE_TYPES)[number];

export const PrescreenSourceReferenceSchema = z
  .object({
    sourceId: DOMAIN_ID_SCHEMA,
    sourceType: z.enum(PRESCREEN_SOURCE_TYPES),
    label: z.string().min(1).max(300).optional(),
    documentVersionId: DOMAIN_ID_SCHEMA.optional(),
    recordedAt: ISO_DATETIME_SCHEMA,
  })
  .strict();
export type PrescreenSourceReference = z.infer<typeof PrescreenSourceReferenceSchema>;

export const AssessmentAnswerSchema = z
  .object({
    answerId: DOMAIN_ID_SCHEMA,
    questionCode: z.string().min(1).max(200),
    valueState: z.enum(ANSWER_VALUE_STATES),
    value: z.unknown().optional(),
    narrative: z.string().min(1).max(10000).optional(),
    sourceIds: z.array(DOMAIN_ID_SCHEMA),
    recordedAt: ISO_DATETIME_SCHEMA,
    recordedBy: DOMAIN_ID_SCHEMA,
  })
  .strict();
export type AssessmentAnswer = z.infer<typeof AssessmentAnswerSchema>;

export const PrescreenAssessmentVersionSchema = z
  .object({
    assessmentVersionId: DOMAIN_ID_SCHEMA,
    encounterId: DOMAIN_ID_SCHEMA,
    organizationId: DOMAIN_ID_SCHEMA,
    versionNumber: z.number().int().positive(),
    status: z.enum(PRESCREEN_ASSESSMENT_STATUSES),
    createdAt: ISO_DATETIME_SCHEMA,
    createdBy: DOMAIN_ID_SCHEMA,
    attestedAt: ISO_DATETIME_SCHEMA.optional(),
    attestedBy: DOMAIN_ID_SCHEMA.optional(),
    parentVersionId: DOMAIN_ID_SCHEMA.optional(),
    changeReason: z.string().min(1).max(2000).optional(),
    willingness: z.enum(PATIENT_WILLINGNESS_STATES),
    orientation: OrientationObservationSchema,
    /** Routing inputs persist with the version so the derived pathway stays reconstructable after attestation. */
    immediateMedicalStabilizationRequired: z.boolean().default(false),
    activeEmergencyOrLegalProcess: z.boolean().default(false),
    possiblePathway: z.enum(POSSIBLE_PATHWAYS),
    answers: z.array(AssessmentAnswerSchema),
    sources: z.array(PrescreenSourceReferenceSchema),
    contentHash: z.string().min(1).max(200).optional(),
  })
  .strict();
export type PrescreenAssessmentVersion = z.infer<typeof PrescreenAssessmentVersionSchema>;

export const PrescreenEncounterSchema = z
  .object({
    encounterId: DOMAIN_ID_SCHEMA,
    caseId: DOMAIN_ID_SCHEMA,
    organizationId: DOMAIN_ID_SCHEMA,
    status: z.enum(PRESCREEN_ENCOUNTER_STATUSES),
    version: z.number().int().positive(),
    currentLocation: z.string().min(1).max(500),
    presentingConcern: z.string().min(1).max(5000),
    currentAssessmentVersionId: DOMAIN_ID_SCHEMA.optional(),
    possiblePathway: z.enum(POSSIBLE_PATHWAYS),
    createdBy: DOMAIN_ID_SCHEMA,
    createdAt: ISO_DATETIME_SCHEMA,
    updatedAt: ISO_DATETIME_SCHEMA,
  })
  .strict();
export type PrescreenEncounter = z.infer<typeof PrescreenEncounterSchema>;

// ---------------------------------------------------------------------------
// Target-specific packet readiness (named gaps; no aggregate score)
// ---------------------------------------------------------------------------

export const PRESCREEN_READINESS_TARGETS = [
  "CENTRAL_INTAKE_REVIEW",
  "AUTHORIZED_PRACTITIONER_REVIEW",
  "FACILITY_ROUTING",
  "TRANSPORT_PLANNING",
  "RECEIVING_HANDOFF",
] as const;
export type PrescreenReadinessTarget = (typeof PRESCREEN_READINESS_TARGETS)[number];

export const PACKET_REQUIREMENT_STATES = [
  "NOT_STARTED",
  "REQUESTED",
  "RECEIVED",
  "UNDER_REVIEW",
  "ACCEPTED_FOR_PACKET",
  "MISSING",
  "UNAVAILABLE_WITH_REASON",
  "NOT_APPLICABLE_WITH_AUTHORITY",
  "NEEDS_CLARIFICATION",
  "STALE",
  "SUPERSEDED",
] as const;
export type PacketRequirementState = (typeof PACKET_REQUIREMENT_STATES)[number];

export const PacketRequirementSchema = z
  .object({
    requirementCode: z.string().min(1).max(200),
    label: z.string().min(1).max(300),
    state: z.enum(PACKET_REQUIREMENT_STATES),
    blockingTargets: z.array(z.enum(PRESCREEN_READINESS_TARGETS)),
    responsibleRoleCode: z.string().min(1).max(200).optional(),
    resolutionWorkspace: z.string().min(1).max(200),
    sourceRuleId: DOMAIN_ID_SCHEMA,
    sourceRuleVersion: z.number().int().positive(),
  })
  .strict();
export type PacketRequirement = z.infer<typeof PacketRequirementSchema>;

export interface PacketReadinessBlocker {
  readonly requirementCode: string;
  readonly label: string;
  readonly state: PacketRequirementState;
  readonly responsibleRoleCode?: string;
  readonly resolutionWorkspace: string;
  readonly sourceRuleId: string;
  readonly sourceRuleVersion: number;
}

export interface PacketReadinessResult {
  readonly target: PrescreenReadinessTarget;
  readonly ready: boolean;
  readonly blockers: readonly PacketReadinessBlocker[];
  readonly warnings: readonly PacketReadinessBlocker[];
}

const BLOCKING_REQUIREMENT_STATES = new Set<PacketRequirementState>([
  "NOT_STARTED",
  "REQUESTED",
  "MISSING",
  "NEEDS_CLARIFICATION",
  "STALE",
  "SUPERSEDED",
]);
const WARNING_REQUIREMENT_STATES = new Set<PacketRequirementState>([
  "RECEIVED",
  "UNDER_REVIEW",
  "UNAVAILABLE_WITH_REASON",
]);

export function evaluatePacketReadiness(
  target: PrescreenReadinessTarget,
  requirements: readonly PacketRequirement[],
): PacketReadinessResult {
  const relevant = requirements.filter((requirement) => requirement.blockingTargets.includes(target));
  const toBlocker = (requirement: PacketRequirement): PacketReadinessBlocker => ({
    requirementCode: requirement.requirementCode,
    label: requirement.label,
    state: requirement.state,
    ...(requirement.responsibleRoleCode === undefined
      ? {}
      : { responsibleRoleCode: requirement.responsibleRoleCode }),
    resolutionWorkspace: requirement.resolutionWorkspace,
    sourceRuleId: requirement.sourceRuleId,
    sourceRuleVersion: requirement.sourceRuleVersion,
  });
  const blockers = relevant
    .filter((requirement) => BLOCKING_REQUIREMENT_STATES.has(requirement.state))
    .map(toBlocker);
  const warnings = relevant
    .filter((requirement) => WARNING_REQUIREMENT_STATES.has(requirement.state))
    .map(toBlocker);
  return { target, ready: blockers.length === 0, blockers, warnings };
}

// ---------------------------------------------------------------------------
// Consent authority (configured-rule evaluation; rules require approval)
// ---------------------------------------------------------------------------

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

export const CONSENT_RULE_STATUSES = [
  "DRAFT_UNVERIFIED",
  "PENDING_REVIEW",
  "APPROVED",
  "SUSPENDED",
  "SUPERSEDED",
] as const;
export type ConsentRuleStatus = (typeof CONSENT_RULE_STATUSES)[number];

export const ConsentAuthorityRuleSchema = z
  .object({
    ruleId: DOMAIN_ID_SCHEMA,
    version: z.number().int().positive(),
    status: z.enum(CONSENT_RULE_STATUSES),
    jurisdictionCode: z.string().min(1).max(50),
    facilityId: DOMAIN_ID_SCHEMA.optional(),
    programId: DOMAIN_ID_SCHEMA.optional(),
    ageBand: z.enum(CONSENT_AGE_BANDS),
    actionCode: z.string().min(1).max(200),
    admissionPathways: z.array(z.string().min(1).max(200)),
    authorizedSignerTypes: z.array(z.enum(CONSENT_SIGNER_TYPES)),
    minorSignatureRequired: z.boolean(),
    relationshipEvidenceRequired: z.boolean(),
    courtApprovalRequired: z.boolean(),
    clinicianReviewRequired: z.boolean(),
    privacyRegimes: z.array(z.string().min(1).max(100)),
  })
  .strict();
export type ConsentAuthorityRule = z.infer<typeof ConsentAuthorityRuleSchema>;

export interface ConsentContext {
  readonly jurisdictionCode: string;
  readonly facilityId?: string;
  readonly programId?: string;
  readonly age: number;
  readonly actionCode: string;
  readonly admissionPathway: string;
  readonly signerType: ConsentSignerType;
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

export function consentAgeBandFor(age: number): ConsentAgeBand {
  if (!Number.isInteger(age) || age < 0 || age > 125) {
    throw new RangeError("Age must be an integer from 0 through 125.");
  }
  if (age < 12) return "UNDER_12";
  if (age < 16) return "AGE_12_TO_15";
  if (age < 18) return "AGE_16_TO_17";
  return "ADULT";
}

/**
 * Fails closed: only APPROVED rules can authorize, and no matching rule means
 * not allowed. The evaluator applies configured rules; it never encodes
 * jurisdictional law itself (rule content requires counsel/facility review).
 */
export function evaluateConsentAuthority(
  rules: readonly ConsentAuthorityRule[],
  context: ConsentContext,
): ConsentEvaluation {
  const ageBand = consentAgeBandFor(context.age);
  const candidates = rules.filter(
    (rule) =>
      rule.status === "APPROVED" &&
      rule.jurisdictionCode === context.jurisdictionCode &&
      (rule.facilityId === undefined || rule.facilityId === context.facilityId) &&
      (rule.programId === undefined || rule.programId === context.programId) &&
      (rule.ageBand === "ALL" || rule.ageBand === ageBand) &&
      rule.actionCode === context.actionCode &&
      rule.admissionPathways.includes(context.admissionPathway),
  );
  if (candidates.length > 1) {
    return {
      allowed: false,
      unmetRequirements: ["AMBIGUOUS_APPROVED_RULES"],
      reasons: candidates
        .map((candidate) => `MATCHED_APPROVED_RULE:${candidate.ruleId}:v${candidate.version}`)
        .sort(),
    };
  }
  const rule = candidates[0];
  if (!rule) return { allowed: false, unmetRequirements: ["NO_APPROVED_RULE"], reasons: [] };
  const unmet: string[] = [];
  if (!rule.authorizedSignerTypes.includes(context.signerType)) unmet.push("SIGNER_TYPE_NOT_AUTHORIZED");
  if (rule.relationshipEvidenceRequired && !context.relationshipEvidencePresent) {
    unmet.push("RELATIONSHIP_EVIDENCE_REQUIRED");
  }
  if (rule.minorSignatureRequired && !context.minorSignaturePresent) unmet.push("MINOR_SIGNATURE_REQUIRED");
  if (rule.courtApprovalRequired && !context.courtApprovalPresent) unmet.push("COURT_APPROVAL_REQUIRED");
  if (rule.clinicianReviewRequired && !context.clinicianReviewPresent) unmet.push("CLINICIAN_REVIEW_REQUIRED");
  // Deliberate deviation from the reference package (external review, PR #19):
  // a rule scoped to privacy regimes fails closed when the context does not
  // supply one, instead of skipping the check.
  if (
    rule.privacyRegimes.length > 0 &&
    (!context.privacyRegime || !rule.privacyRegimes.includes(context.privacyRegime))
  ) {
    unmet.push("PRIVACY_REGIME_NOT_COVERED");
  }
  return {
    allowed: unmet.length === 0,
    ruleId: rule.ruleId,
    ruleVersion: rule.version,
    unmetRequirements: unmet,
    reasons: [`MATCHED_APPROVED_RULE:${rule.ruleId}:v${rule.version}`],
  };
}

// ---------------------------------------------------------------------------
// Transport qualification (configured-rule evaluation)
// ---------------------------------------------------------------------------

export const TRANSPORT_CATEGORIES = [
  "LAW_ENFORCEMENT_CUSTODY",
  "LICENSED_AMBULANCE_EMS",
  "CONTRACTED_SECURE_BEHAVIORAL_TRANSPORT",
  "INTERFACILITY_CLINICAL_TRANSPORT",
  "TRANSPORTATION_BROKER",
  "NEMT_CARRIER",
  "FAMILY_OR_SUPPORT_TRANSPORT",
  "SELF_TRANSPORT",
] as const;
export type TransportCategory = (typeof TRANSPORT_CATEGORIES)[number];

export const PRESCREEN_LEGAL_STATUSES = [
  "VOLUNTARY",
  "NONCONTESTED",
  "OPC",
  "PEC",
  "CEC",
  "COURT_ORDER",
  "OTHER",
] as const;
export type PrescreenLegalStatus = (typeof PRESCREEN_LEGAL_STATUSES)[number];

export const TRANSPORT_PROVIDER_STATUSES = [
  "CANDIDATE",
  "ACTIVE",
  "SUSPENDED",
  "EXPIRED",
  "RESTRICTED",
  "INACTIVE",
] as const;
export type TransportProviderStatus = (typeof TRANSPORT_PROVIDER_STATUSES)[number];

export const TRANSPORT_VERIFICATION_STATUSES = ["VERIFIED", "PARTIAL", "STALE", "BLOCKED", "UNKNOWN"] as const;
export type TransportVerificationStatus = (typeof TRANSPORT_VERIFICATION_STATUSES)[number];

export const TransportRuleProfileSchema = z
  .object({
    ruleId: DOMAIN_ID_SCHEMA,
    version: z.number().int().positive(),
    legalStatuses: z.array(z.enum(PRESCREEN_LEGAL_STATUSES)),
    allowedCategories: z.array(z.enum(TRANSPORT_CATEGORIES)),
    blockedCategories: z.array(z.enum(TRANSPORT_CATEGORIES)),
    requiresConfirmedDestination: z.boolean(),
    requiresInstrument: z.boolean(),
  })
  .strict();
export type TransportRuleProfile = z.infer<typeof TransportRuleProfileSchema>;

export const TransportProviderSchema = z
  .object({
    providerId: DOMAIN_ID_SCHEMA,
    legalName: z.string().min(1).max(300),
    category: z.enum(TRANSPORT_CATEGORIES),
    status: z.enum(TRANSPORT_PROVIDER_STATUSES),
    verificationStatus: z.enum(TRANSPORT_VERIFICATION_STATUSES),
    supportedLegalStatuses: z.array(z.enum(PRESCREEN_LEGAL_STATUSES)),
    serviceAreas: z.array(z.string().min(1).max(200)),
    capabilities: z.array(z.string().min(1).max(200)),
    restrictions: z.array(z.string().min(1).max(500)),
    facilityApprovals: z.array(DOMAIN_ID_SCHEMA),
    jurisdictionApprovals: z.array(z.string().min(1).max(50)),
  })
  .strict();
export type TransportProvider = z.infer<typeof TransportProviderSchema>;

export interface TransportContext {
  readonly legalStatus: PrescreenLegalStatus;
  readonly instrumentId?: string;
  readonly sendingFacilityId: string;
  readonly destinationFacilityId?: string;
  readonly jurisdictionCode: string;
  readonly serviceArea: string;
  readonly requiredCapabilities: readonly string[];
}

export interface TransportProviderQualification {
  readonly providerId: string;
  readonly status: "QUALIFIED" | "CONDITIONAL" | "NOT_QUALIFIED";
  readonly disqualifiers: readonly string[];
  readonly conditions: readonly string[];
  readonly ruleVersionIds: readonly string[];
}

export function qualifyTransportProvider(
  provider: TransportProvider,
  context: TransportContext,
  rule: TransportRuleProfile,
): TransportProviderQualification {
  const disqualifiers: string[] = [];
  const conditions: string[] = [];
  if (!rule.legalStatuses.includes(context.legalStatus)) disqualifiers.push("RULE_NOT_APPLICABLE_TO_LEGAL_STATUS");
  if (rule.blockedCategories.includes(provider.category)) disqualifiers.push("TRANSPORT_CATEGORY_BLOCKED");
  if (!rule.allowedCategories.includes(provider.category)) disqualifiers.push("TRANSPORT_CATEGORY_NOT_ALLOWED");
  if (rule.requiresInstrument && !context.instrumentId) disqualifiers.push("TRANSPORT_AUTHORITY_MISSING");
  if (rule.requiresConfirmedDestination && !context.destinationFacilityId) {
    disqualifiers.push("TRANSPORT_DESTINATION_NOT_CONFIRMED");
  }
  if (provider.status !== "ACTIVE") disqualifiers.push("PROVIDER_NOT_ACTIVE");
  if (
    provider.verificationStatus === "STALE" ||
    provider.verificationStatus === "BLOCKED" ||
    provider.verificationStatus === "UNKNOWN"
  ) {
    disqualifiers.push("PROVIDER_VERIFICATION_NOT_CURRENT");
  }
  if (!provider.supportedLegalStatuses.includes(context.legalStatus)) disqualifiers.push("LEGAL_STATUS_NOT_SUPPORTED");
  if (!provider.serviceAreas.includes(context.serviceArea)) disqualifiers.push("SERVICE_AREA_NOT_SUPPORTED");
  // Restrictions have no resolution state in this bounded contract, so any
  // entry remains unresolved and must fail closed.
  if (provider.restrictions.length > 0) disqualifiers.push("UNRESOLVED_PROVIDER_RESTRICTION");
  for (const capability of context.requiredCapabilities) {
    if (!provider.capabilities.includes(capability)) disqualifiers.push(`MISSING_CAPABILITY:${capability}`);
  }
  if (!provider.facilityApprovals.includes(context.sendingFacilityId)) {
    disqualifiers.push("SENDING_FACILITY_APPROVAL_MISSING");
  }
  if (
    context.destinationFacilityId &&
    !provider.facilityApprovals.includes(context.destinationFacilityId)
  ) {
    disqualifiers.push("RECEIVING_FACILITY_APPROVAL_MISSING");
  }
  if (provider.jurisdictionApprovals.length > 0 && !provider.jurisdictionApprovals.includes(context.jurisdictionCode)) {
    disqualifiers.push("JURISDICTION_APPROVAL_MISSING");
  }
  if (provider.category === "TRANSPORTATION_BROKER") conditions.push("ACTUAL_CARRIER_REQUIRED");
  if (provider.verificationStatus === "PARTIAL") conditions.push("MANUAL_CREDENTIAL_REVIEW_REQUIRED");
  return {
    providerId: provider.providerId,
    status: disqualifiers.length > 0 ? "NOT_QUALIFIED" : conditions.length > 0 ? "CONDITIONAL" : "QUALIFIED",
    disqualifiers,
    conditions,
    ruleVersionIds: [`${rule.ruleId}:v${rule.version}`],
  };
}

/**
 * Synthetic default carried from the source package (owner decision #8):
 * OPC/PEC/CEC transport uses ambulance, law enforcement, or an approved
 * secured pathway; family/self/rideshare-style transport is blocked. This is
 * a configured synthetic rule, not verified jurisdictional law (counsel
 * review remains a release blocker per the package).
 */
export function syntheticSecuredInstrumentTransportRule(): TransportRuleProfile {
  return {
    ruleId: "OWNER_LA_SECURED_INSTRUMENT_TRANSPORT",
    version: 1,
    legalStatuses: ["OPC", "PEC", "CEC"],
    allowedCategories: [
      "LAW_ENFORCEMENT_CUSTODY",
      "LICENSED_AMBULANCE_EMS",
      "CONTRACTED_SECURE_BEHAVIORAL_TRANSPORT",
    ],
    blockedCategories: [
      "FAMILY_OR_SUPPORT_TRANSPORT",
      "SELF_TRANSPORT",
      "NEMT_CARRIER",
      "TRANSPORTATION_BROKER",
      "INTERFACILITY_CLINICAL_TRANSPORT",
    ],
    requiresConfirmedDestination: true,
    requiresInstrument: true,
  };
}

// ---------------------------------------------------------------------------
// Stable error and event vocabularies
// ---------------------------------------------------------------------------

/** Stable public error codes from the package error catalog (transport-layer mapping is API-phase work). */
export const PRESCREEN_ERROR_CODES = [
  "AUTHENTICATION_REQUIRED",
  "PERMISSION_DENIED",
  "RESOURCE_NOT_FOUND",
  "INVALID_COMMAND",
  "DOMAIN_VALIDATION_FAILED",
  "PRESCREEN_VERSION_CONFLICT",
  "IDEMPOTENCY_KEY_REUSED",
  "ASSESSMENT_NOT_DRAFT",
  "ASSESSMENT_ATTESTATION_BLOCKED",
  "ASSESSMENT_VERSION_REQUIRED",
  "FORMAL_VOLUNTARY_GATE_NOT_MET",
  "AUTHORIZED_REVIEW_REQUIRED",
  "FACILITY_PROFILE_MISSING",
  "FACILITY_PROFILE_STALE",
  "PACKET_REQUIREMENT_BLOCKING",
  "DOCUMENT_VERSION_INVALID",
  "CONSENT_AUTHORITY_UNRESOLVED",
  "TRANSPORT_AUTHORITY_MISSING",
  "TRANSPORT_CATEGORY_BLOCKED",
  "TRANSPORT_PROVIDER_NOT_QUALIFIED",
  "TRANSPORT_DESTINATION_NOT_CONFIRMED",
  "CUSTODY_SEQUENCE_CONFLICT",
  "EXTERNAL_CHANNEL_FAILED",
  "INTEGRATION_MAPPING_FAILED",
  "RATE_LIMITED",
  "SERVICE_UNAVAILABLE",
] as const;
export type PrescreenErrorCode = (typeof PRESCREEN_ERROR_CODES)[number];

/**
 * Adopted prescreen event types: only the events coupled to the six approved
 * Phase 2 commands. The remainder of the package event catalog is NOT adopted
 * here — event-vocabulary expansion stays gated on named consumers and domain
 * review, per the accepted governance posture.
 */
export const PRESCREEN_EVENT_TYPES = [
  "PRESCREEN_ENCOUNTER_STARTED",
  "ASSESSMENT_DRAFT_SAVED",
  "ASSESSMENT_ATTESTED",
  "ASSESSMENT_SUPPLEMENTED",
  "PRESCREEN_SUBMITTED",
  "PACKET_REQUIREMENT_STATE_CHANGED",
] as const;
export type PrescreenEventType = (typeof PRESCREEN_EVENT_TYPES)[number];

export const PRESCREEN_PHI_CLASSIFICATIONS = [
  "RESTRICTED_PHI",
  "SENSITIVE_OPERATIONAL",
  "DEIDENTIFIED_OPERATIONAL",
  "PUBLIC_REFERENCE",
] as const;
export type PrescreenPhiClassification = (typeof PRESCREEN_PHI_CLASSIFICATIONS)[number];

export const PRESCREEN_DATA_QUALITY_STATES = [
  "VALIDATED",
  "PARTIAL",
  "DISPUTED",
  "CORRECTED",
  "LATE",
  "INVALID",
] as const;
export type PrescreenDataQualityState = (typeof PRESCREEN_DATA_QUALITY_STATES)[number];

export const PRESCREEN_REVIEW_STATES = ["NOT_REQUIRED", "DRAFT", "PENDING", "APPROVED", "REJECTED"] as const;
export type PrescreenReviewState = (typeof PRESCREEN_REVIEW_STATES)[number];

export const PrescreenEventActorSchema = z
  .object({
    actorType: z.enum(["USER", "SOURCE_SYSTEM", "SERVICE"]),
    actorId: DOMAIN_ID_SCHEMA,
    roleCodes: z.array(z.string().min(1).max(200)),
  })
  .strict();
export type PrescreenEventActor = z.infer<typeof PrescreenEventActorSchema>;

export const PrescreenEventSourceSchema = z
  .object({
    sourceSystem: z.string().min(1).max(200),
    sourceObjectId: DOMAIN_ID_SCHEMA.optional(),
    sourceVersion: z.string().min(1).max(100).optional(),
    mappingVersion: z.string().min(1).max(100).optional(),
  })
  .strict();
export type PrescreenEventSource = z.infer<typeof PrescreenEventSourceSchema>;

export const PrescreenEventEnvelopeSchema = z
  .object({
    eventId: DOMAIN_ID_SCHEMA,
    schemaName: z.literal("clarity.prescreen.event"),
    schemaVersion: z.literal("1.0.0"),
    eventType: z.enum(PRESCREEN_EVENT_TYPES),
    organizationId: DOMAIN_ID_SCHEMA,
    facilityId: DOMAIN_ID_SCHEMA.optional(),
    programId: DOMAIN_ID_SCHEMA.optional(),
    caseId: DOMAIN_ID_SCHEMA.optional(),
    encounterId: DOMAIN_ID_SCHEMA.optional(),
    aggregateType: z.string().min(1).max(200),
    aggregateId: DOMAIN_ID_SCHEMA,
    aggregateVersion: z.number().int().positive(),
    eventTime: ISO_DATETIME_SCHEMA,
    recordedTime: ISO_DATETIME_SCHEMA,
    actor: PrescreenEventActorSchema,
    source: PrescreenEventSourceSchema,
    correlationId: DOMAIN_ID_SCHEMA,
    causationId: DOMAIN_ID_SCHEMA.optional(),
    idempotencyKey: z.string().min(8).max(200).optional(),
    phiClassification: z.enum(PRESCREEN_PHI_CLASSIFICATIONS),
    dataQualityState: z.enum(PRESCREEN_DATA_QUALITY_STATES),
    reviewState: z.enum(PRESCREEN_REVIEW_STATES),
    supersedesEventId: DOMAIN_ID_SCHEMA.optional(),
    payload: z.record(z.unknown()),
  })
  .strict();
export type PrescreenEventEnvelope = z.infer<typeof PrescreenEventEnvelopeSchema>;
