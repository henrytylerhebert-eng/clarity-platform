import { z } from "zod";
import { DATA_QUALITY_STATES } from "./analytics.js";

type DataQualityStateName = (typeof DATA_QUALITY_STATES)[number];
import {
  DATE_ONLY_SCHEMA,
  DOMAIN_ID_SCHEMA,
  ISO_DATETIME_SCHEMA,
} from "./episode.js";
import { USER_ROLES } from "./roles.js";

/**
 * Longitudinal vertical-slice contracts.
 *
 * These contracts implement the pre-persistence proof authorized by IA-001.
 * They do not authorize Prisma changes, repositories, command services, APIs,
 * or production UI mutations.
 */

export const LongitudinalSourceRefSchema = z
  .object({
    type: z.string().min(1).max(100),
    id: z.string().min(1).max(300),
    version: z.string().max(100).nullable(),
  })
  .strict();
export type LongitudinalSourceRef = z.infer<typeof LongitudinalSourceRefSchema>;

export const DISCHARGE_PLAN_STATUSES = [
  "DRAFT",
  "ACTIVE",
  "READY_FOR_EXECUTION",
  "COMPLETED",
  "SUPERSEDED",
  "CANCELLED",
] as const;
export type DischargePlanStatus = (typeof DISCHARGE_PLAN_STATUSES)[number];

const DISCHARGE_PLAN_TRANSITIONS: Record<DischargePlanStatus, readonly DischargePlanStatus[]> = {
  DRAFT: ["ACTIVE", "CANCELLED", "SUPERSEDED"],
  ACTIVE: ["READY_FOR_EXECUTION", "CANCELLED", "SUPERSEDED"],
  READY_FOR_EXECUTION: ["COMPLETED", "ACTIVE", "CANCELLED", "SUPERSEDED"],
  COMPLETED: [],
  SUPERSEDED: [],
  CANCELLED: [],
};

export function canTransitionDischargePlan(
  from: DischargePlanStatus,
  to: DischargePlanStatus,
): boolean {
  return DISCHARGE_PLAN_TRANSITIONS[from].includes(to);
}

/**
 * Contract for one version of a discharge plan.
 * Cardinality (one logical plan vs concurrent plans) remains LONG-GAP-01.
 */
export const DischargePlanVersionSchema = z
  .object({
    id: DOMAIN_ID_SCHEMA,
    organizationId: DOMAIN_ID_SCHEMA,
    episodeId: DOMAIN_ID_SCHEMA,
    status: z.enum(DISCHARGE_PLAN_STATUSES),
    version: z.number().int().positive(),
    initiatedAt: ISO_DATETIME_SCHEMA,
    effectiveAt: ISO_DATETIME_SCHEMA,
    targetDischargeDate: DATE_ONLY_SCHEMA.nullable(),
    patientGoalRefs: z.array(LongitudinalSourceRefSchema),
    treatmentPreferenceRefs: z.array(LongitudinalSourceRefSchema),
    intendedLevelOfCareRecommendationId: DOMAIN_ID_SCHEMA.nullable(),
    intendedDestinationTypeCode: z.string().min(1).max(100).nullable(),
    intendedDestinationRef: LongitudinalSourceRefSchema.nullable(),
    supportPersonRefs: z.array(LongitudinalSourceRefSchema),
    medicationPlanRef: LongitudinalSourceRefSchema.nullable(),
    followUpPlanRefs: z.array(LongitudinalSourceRefSchema),
    transportPlanRef: LongitudinalSourceRefSchema.nullable(),
    environmentNeedRefs: z.array(LongitudinalSourceRefSchema),
    sourceRefs: z.array(LongitudinalSourceRefSchema),
    createdByActorId: DOMAIN_ID_SCHEMA,
    recordedAt: ISO_DATETIME_SCHEMA,
  })
  .strict();
export type DischargePlanVersion = z.infer<typeof DischargePlanVersionSchema>;

export const TRANSITION_BARRIER_STATUSES = [
  "OPEN",
  "ACKNOWLEDGED",
  "IN_PROGRESS",
  "RESOLVED",
  "DISPUTED",
  "REOPENED",
  "CANCELLED",
  "SUPERSEDED",
] as const;
export type TransitionBarrierStatus = (typeof TRANSITION_BARRIER_STATUSES)[number];

const TRANSITION_BARRIER_TRANSITIONS: Record<
  TransitionBarrierStatus,
  readonly TransitionBarrierStatus[]
> = {
  OPEN: ["ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "DISPUTED", "CANCELLED", "SUPERSEDED"],
  ACKNOWLEDGED: ["IN_PROGRESS", "RESOLVED", "DISPUTED", "CANCELLED", "SUPERSEDED"],
  IN_PROGRESS: ["RESOLVED", "DISPUTED", "CANCELLED", "SUPERSEDED"],
  RESOLVED: ["REOPENED"],
  DISPUTED: ["IN_PROGRESS", "RESOLVED", "REOPENED", "CANCELLED", "SUPERSEDED"],
  REOPENED: ["ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "DISPUTED", "CANCELLED", "SUPERSEDED"],
  CANCELLED: [],
  SUPERSEDED: [],
};

export function canTransitionTransitionBarrier(
  from: TransitionBarrierStatus,
  to: TransitionBarrierStatus,
): boolean {
  return TRANSITION_BARRIER_TRANSITIONS[from].includes(to);
}

export const TransitionBarrierSchema = z
  .object({
    id: DOMAIN_ID_SCHEMA,
    organizationId: DOMAIN_ID_SCHEMA,
    episodeId: DOMAIN_ID_SCHEMA,
    dischargePlanId: DOMAIN_ID_SCHEMA,
    careTransitionId: DOMAIN_ID_SCHEMA.nullable(),
    /** Taxonomy intentionally remains open under LONG-GAP-05. */
    categoryCode: z.string().min(1).max(100),
    operationalSummary: z.string().max(2000).nullable(),
    identifiedAt: ISO_DATETIME_SCHEMA,
    effectiveAt: ISO_DATETIME_SCHEMA,
    sourceRefs: z.array(LongitudinalSourceRefSchema),
    status: z.enum(TRANSITION_BARRIER_STATUSES),
    responsibilityKind: z.string().min(1).max(100).nullable(),
    responsibleRoleCode: z.string().min(1).max(100).nullable(),
    assignedUserId: DOMAIN_ID_SCHEMA.nullable(),
    waitingOnPartyRef: LongitudinalSourceRefSchema.nullable(),
    targetResolutionAt: ISO_DATETIME_SCHEMA.nullable(),
    resolvedAt: ISO_DATETIME_SCHEMA.nullable(),
    resolvedByActorId: DOMAIN_ID_SCHEMA.nullable(),
    resolutionCode: z.string().min(1).max(100).nullable(),
    version: z.number().int().positive(),
  })
  .strict();
export type TransitionBarrier = z.infer<typeof TransitionBarrierSchema>;

/**
 * Candidate slice lifecycle only. Destination-attempt persistence remains LONG-GAP-02.
 */
export const CARE_TRANSITION_SLICE_STATES = [
  "PROPOSED",
  "PREPARING",
  "READY",
  "EXECUTED",
  "CANCELLED",
  "SUPERSEDED",
] as const;
export type CareTransitionSliceState = (typeof CARE_TRANSITION_SLICE_STATES)[number];

const CARE_TRANSITION_SLICE_TRANSITIONS: Record<
  CareTransitionSliceState,
  readonly CareTransitionSliceState[]
> = {
  PROPOSED: ["PREPARING", "CANCELLED", "SUPERSEDED"],
  PREPARING: ["READY", "CANCELLED", "SUPERSEDED"],
  READY: ["PREPARING", "EXECUTED", "CANCELLED", "SUPERSEDED"],
  EXECUTED: [],
  CANCELLED: [],
  SUPERSEDED: [],
};

export function canTransitionCareTransitionSlice(
  from: CareTransitionSliceState,
  to: CareTransitionSliceState,
): boolean {
  return CARE_TRANSITION_SLICE_TRANSITIONS[from].includes(to);
}

export const CareTransitionSliceSchema = z
  .object({
    id: DOMAIN_ID_SCHEMA,
    organizationId: DOMAIN_ID_SCHEMA,
    episodeId: DOMAIN_ID_SCHEMA,
    dischargePlanId: DOMAIN_ID_SCHEMA,
    state: z.enum(CARE_TRANSITION_SLICE_STATES),
    currentSettingRef: LongitudinalSourceRefSchema,
    currentActualLevelOfCareCode: z.string().min(1).max(100),
    recommendedTargetLevelOfCareRecommendationId: DOMAIN_ID_SCHEMA.nullable(),
    currentIntendedDestinationRef: LongitudinalSourceRefSchema.nullable(),
    patientPreferenceRef: LongitudinalSourceRefSchema.nullable(),
    targetDate: DATE_ONLY_SCHEMA.nullable(),
    sourceRefs: z.array(LongitudinalSourceRefSchema),
    version: z.number().int().positive(),
  })
  .strict();
export type CareTransitionSlice = z.infer<typeof CareTransitionSliceSchema>;

export const LevelOfCareRecommendationSchema = z
  .object({
    id: DOMAIN_ID_SCHEMA,
    organizationId: DOMAIN_ID_SCHEMA,
    episodeId: DOMAIN_ID_SCHEMA,
    recommendedLevelCode: z.string().min(1).max(100),
    effectiveAt: ISO_DATETIME_SCHEMA,
    decidedAt: ISO_DATETIME_SCHEMA,
    decidedByActorId: DOMAIN_ID_SCHEMA,
    decidedByRoleCode: z.string().min(1).max(100),
    rationale: z.string().max(4000).nullable(),
    evidenceRefs: z.array(LongitudinalSourceRefSchema),
    criteriaRefs: z.array(LongitudinalSourceRefSchema),
    supersedesRecommendationId: DOMAIN_ID_SCHEMA.nullable(),
    withdrawalReasonCode: z.string().min(1).max(100).nullable(),
    recordedAt: ISO_DATETIME_SCHEMA,
  })
  .strict();
export type LevelOfCareRecommendation = z.infer<typeof LevelOfCareRecommendationSchema>;

export const CLINICAL_DISCHARGE_READINESS_OUTCOMES = [
  "READY_FOR_LOWER_INTENSITY_OR_DISCHARGE",
  "CONTINUE_INPATIENT_LEVEL",
  "UNDETERMINED",
] as const;
export type ClinicalDischargeReadinessOutcome =
  (typeof CLINICAL_DISCHARGE_READINESS_OUTCOMES)[number];

export const ClinicalDischargeReadinessDecisionSchema = z
  .object({
    id: DOMAIN_ID_SCHEMA,
    organizationId: DOMAIN_ID_SCHEMA,
    episodeId: DOMAIN_ID_SCHEMA,
    outcome: z.enum(CLINICAL_DISCHARGE_READINESS_OUTCOMES),
    effectiveAt: ISO_DATETIME_SCHEMA,
    decidedAt: ISO_DATETIME_SCHEMA,
    decidedByActorId: DOMAIN_ID_SCHEMA,
    decidedByRoleCode: z.string().min(1).max(100),
    rationale: z.string().max(4000).nullable(),
    evidenceRefs: z.array(LongitudinalSourceRefSchema),
    criteriaRefs: z.array(LongitudinalSourceRefSchema),
    relatedLocRecommendationId: DOMAIN_ID_SCHEMA.nullable(),
    supersedesDecisionId: DOMAIN_ID_SCHEMA.nullable(),
    recordedAt: ISO_DATETIME_SCHEMA,
  })
  .strict();
export type ClinicalDischargeReadinessDecision = z.infer<
  typeof ClinicalDischargeReadinessDecisionSchema
>;

export const CONTINUITY_EVENT_TYPES = [
  "FOLLOW_UP_SCHEDULED",
  "FOLLOW_UP_COMPLETED",
  "FOLLOW_UP_MISSED_REPORTED",
  "NEXT_LEVEL_OF_CARE_STARTED",
  "MEDICATION_ACCESS_CONFIRMED",
  "PRESCRIPTION_FILL_RECORDED",
  "ED_VISIT_RECORDED",
  "READMISSION_RECORDED",
] as const;
export type ContinuityEventType = (typeof CONTINUITY_EVENT_TYPES)[number];

export const ContinuityEventSchema = z
  .object({
    eventId: DOMAIN_ID_SCHEMA,
    eventType: z.enum(CONTINUITY_EVENT_TYPES),
    eventVersion: z.number().int().positive(),
    organizationId: DOMAIN_ID_SCHEMA,
    personToken: z.string().min(8).max(200),
    episodeId: DOMAIN_ID_SCHEMA,
    careTransitionId: DOMAIN_ID_SCHEMA.nullable(),
    effectiveAt: ISO_DATETIME_SCHEMA,
    recordedAt: ISO_DATETIME_SCHEMA,
    receivedAt: ISO_DATETIME_SCHEMA.nullable(),
    sourceSystem: z.string().min(1).max(200),
    sourceRecordRef: LongitudinalSourceRefSchema,
    providerServiceRef: LongitudinalSourceRefSchema.nullable(),
    provenanceRefs: z.array(LongitudinalSourceRefSchema),
    qualityState: z.enum(DATA_QUALITY_STATES),
  })
  .strict();
export type ContinuityEvent = z.infer<typeof ContinuityEventSchema>;

/**
 * Candidate event payloads for the vertical slice. These payloads do not
 * authorize a command or persistence shape.
 */
export const LevelOfCareRecommendationRecordedPayloadSchema = z
  .object({
    recommendationId: DOMAIN_ID_SCHEMA,
    episodeId: DOMAIN_ID_SCHEMA,
    recommendedLevelCode: z.string().min(1).max(100),
    effectiveAt: ISO_DATETIME_SCHEMA,
    decidedByActorId: DOMAIN_ID_SCHEMA,
    decidedByRoleCode: z.string().min(1).max(100),
    supersedesRecommendationId: DOMAIN_ID_SCHEMA.nullable(),
  })
  .strict();

export const ClinicalDischargeReadinessRecordedPayloadSchema = z
  .object({
    decisionId: DOMAIN_ID_SCHEMA,
    episodeId: DOMAIN_ID_SCHEMA,
    outcome: z.enum(CLINICAL_DISCHARGE_READINESS_OUTCOMES),
    effectiveAt: ISO_DATETIME_SCHEMA,
    decidedByActorId: DOMAIN_ID_SCHEMA,
    decidedByRoleCode: z.string().min(1).max(100),
    supersedesDecisionId: DOMAIN_ID_SCHEMA.nullable(),
  })
  .strict();

export const TransitionBarrierIdentifiedPayloadSchema = z
  .object({
    barrierId: DOMAIN_ID_SCHEMA,
    episodeId: DOMAIN_ID_SCHEMA,
    dischargePlanId: DOMAIN_ID_SCHEMA,
    careTransitionId: DOMAIN_ID_SCHEMA.nullable(),
    categoryCode: z.string().min(1).max(100),
    effectiveAt: ISO_DATETIME_SCHEMA,
  })
  .strict();

export const TransitionBarrierResolvedPayloadSchema = z
  .object({
    barrierId: DOMAIN_ID_SCHEMA,
    episodeId: DOMAIN_ID_SCHEMA,
    resolvedAt: ISO_DATETIME_SCHEMA,
    resolvedByActorId: DOMAIN_ID_SCHEMA,
    resolutionCode: z.string().min(1).max(100),
  })
  .strict();

/**
 * Candidate fact payload only. The command/source/correction contract remains LONG-GAP-07.
 */
export const DischargeRecordedSlicePayloadSchema = z
  .object({
    dischargeFactId: DOMAIN_ID_SCHEMA,
    episodeId: DOMAIN_ID_SCHEMA,
    dischargedAt: ISO_DATETIME_SCHEMA,
    recordedAt: ISO_DATETIME_SCHEMA,
    recordedByActorId: DOMAIN_ID_SCHEMA,
    sourceRef: LongitudinalSourceRefSchema,
  })
  .strict();

export const ContinuityObservedPayloadSchema = z
  .object({
    eventId: DOMAIN_ID_SCHEMA,
    eventType: z.enum(CONTINUITY_EVENT_TYPES),
    personToken: z.string().min(8).max(200),
    episodeId: DOMAIN_ID_SCHEMA,
    careTransitionId: DOMAIN_ID_SCHEMA.nullable(),
    effectiveAt: ISO_DATETIME_SCHEMA,
    sourceRecordRef: LongitudinalSourceRefSchema,
  })
  .strict();

export const LONGITUDINAL_AUTHORITY_ACTIONS = [
  "RECORD_LEVEL_OF_CARE_RECOMMENDATION",
  "RECORD_CLINICAL_DISCHARGE_READINESS",
  "RECORD_ACTUAL_DISCHARGE",
] as const;
export type LongitudinalAuthorityAction = (typeof LONGITUDINAL_AUTHORITY_ACTIONS)[number];

/**
 * Facility-configured policy snapshot. This deliberately does not choose which
 * roles are qualified; LONG-GAP-03 and LONG-GAP-07 remain open.
 */
export const LongitudinalAuthorityPolicySchema = z
  .object({
    organizationId: DOMAIN_ID_SCHEMA,
    facilityId: DOMAIN_ID_SCHEMA.nullable(),
    action: z.enum(LONGITUDINAL_AUTHORITY_ACTIONS),
    authorizedRoleCodes: z.array(z.enum(USER_ROLES)).min(1),
    policyRef: LongitudinalSourceRefSchema,
    effectiveAt: ISO_DATETIME_SCHEMA,
  })
  .strict();
export type LongitudinalAuthorityPolicy = z.infer<typeof LongitudinalAuthorityPolicySchema>;

export const LongitudinalAuthorityCheckSchema = z
  .object({
    actorId: DOMAIN_ID_SCHEMA,
    actorRoleCodes: z.array(z.enum(USER_ROLES)),
    policy: LongitudinalAuthorityPolicySchema,
  })
  .strict();
export type LongitudinalAuthorityCheck = z.infer<typeof LongitudinalAuthorityCheckSchema>;

export interface LongitudinalAuthorityResult {
  readonly allowed: boolean;
  readonly matchedRoleCodes: readonly string[];
  readonly policyRef: LongitudinalSourceRef;
}

export function evaluateLongitudinalAuthority(
  input: LongitudinalAuthorityCheck,
): LongitudinalAuthorityResult {
  const parsed = LongitudinalAuthorityCheckSchema.parse(input);
  const allowed = new Set(parsed.policy.authorizedRoleCodes);
  const matchedRoleCodes = parsed.actorRoleCodes.filter((role) => allowed.has(role));
  return {
    allowed: matchedRoleCodes.length > 0,
    matchedRoleCodes,
    policyRef: parsed.policy.policyRef,
  };
}

export const ActualDischargeFactSchema = z
  .object({
    id: DOMAIN_ID_SCHEMA,
    episodeId: DOMAIN_ID_SCHEMA,
    effectiveAt: ISO_DATETIME_SCHEMA,
    recordedAt: ISO_DATETIME_SCHEMA,
    sourceRef: LongitudinalSourceRefSchema,
  })
  .strict();
export type ActualDischargeFact = z.infer<typeof ActualDischargeFactSchema>;

function isoMs(value: string): number {
  return new Date(value).getTime();
}

function activeUnsuperseded<T extends { id: string; supersedesDecisionId?: string | null }>(
  records: readonly T[],
): readonly T[] {
  const superseded = new Set(
    records
      .map((record) => record.supersedesDecisionId ?? null)
      .filter((value): value is string => value !== null),
  );
  return records.filter((record) => !superseded.has(record.id));
}

export type PendingDischargeState = "UNKNOWN" | "NOT_PENDING" | "PENDING" | "ENDED_BY_DISCHARGE";

export interface PendingDischargeProjection {
  readonly state: PendingDischargeState;
  readonly intervalStartAt: string | null;
  readonly intervalEndAt: string | null;
  readonly sourceReadinessDecisionId: string | null;
  readonly sourceDischargeFactId: string | null;
}

export function derivePendingDischarge(input: {
  readinessDecisions: readonly ClinicalDischargeReadinessDecision[];
  actualDischargeFacts: readonly ActualDischargeFact[];
  evaluationAt: string;
}): PendingDischargeProjection {
  const evaluationMs = isoMs(ISO_DATETIME_SCHEMA.parse(input.evaluationAt));
  const applicable = activeUnsuperseded(input.readinessDecisions)
    .filter((decision) => isoMs(decision.effectiveAt) <= evaluationMs)
    .sort((a, b) => isoMs(a.effectiveAt) - isoMs(b.effectiveAt));
  const latest = applicable.at(-1);

  if (!latest || latest.outcome === "UNDETERMINED") {
    return {
      state: "UNKNOWN",
      intervalStartAt: null,
      intervalEndAt: null,
      sourceReadinessDecisionId: latest?.id ?? null,
      sourceDischargeFactId: null,
    };
  }

  if (latest.outcome !== "READY_FOR_LOWER_INTENSITY_OR_DISCHARGE") {
    return {
      state: "NOT_PENDING",
      intervalStartAt: null,
      intervalEndAt: null,
      sourceReadinessDecisionId: latest.id,
      sourceDischargeFactId: null,
    };
  }

  const discharge = [...input.actualDischargeFacts]
    .filter((fact) => isoMs(fact.effectiveAt) >= isoMs(latest.effectiveAt))
    .sort((a, b) => isoMs(a.effectiveAt) - isoMs(b.effectiveAt))[0];

  if (discharge && isoMs(discharge.effectiveAt) <= evaluationMs) {
    return {
      state: "ENDED_BY_DISCHARGE",
      intervalStartAt: latest.effectiveAt,
      intervalEndAt: discharge.effectiveAt,
      sourceReadinessDecisionId: latest.id,
      sourceDischargeFactId: discharge.id,
    };
  }

  return {
    state: "PENDING",
    intervalStartAt: latest.effectiveAt,
    intervalEndAt: null,
    sourceReadinessDecisionId: latest.id,
    sourceDischargeFactId: null,
  };
}

export interface BarrierAgingProjection {
  readonly barrierId: string;
  readonly ageDays: number;
  readonly agedThrough: string;
  readonly resolved: boolean;
}

export function deriveBarrierAging(
  barrier: TransitionBarrier,
  evaluationAt: string,
): BarrierAgingProjection {
  const parsedBarrier = TransitionBarrierSchema.parse(barrier);
  const parsedEvaluationAt = ISO_DATETIME_SCHEMA.parse(evaluationAt);
  const start = isoMs(parsedBarrier.effectiveAt);
  const evaluation = isoMs(parsedEvaluationAt);
  const end = parsedBarrier.resolvedAt
    ? Math.min(isoMs(parsedBarrier.resolvedAt), evaluation)
    : evaluation;
  const ageDays = Math.max(0, Math.floor((end - start) / 86_400_000));
  return {
    barrierId: parsedBarrier.id,
    ageDays,
    agedThrough: new Date(end).toISOString(),
    resolved: parsedBarrier.resolvedAt !== null && isoMs(parsedBarrier.resolvedAt) <= evaluation,
  };
}

export const TRANSITION_READINESS_SLICE_COMPONENTS = [
  "CLINICAL",
  "MEDICATION",
  "DESTINATION",
  "FOLLOW_UP",
  "TRANSPORTATION",
  "SUPPORT_ENVIRONMENT",
  "HANDOFF_DOCUMENTATION",
] as const;
export type TransitionReadinessSliceComponent =
  (typeof TRANSITION_READINESS_SLICE_COMPONENTS)[number];

export const TRANSITION_READINESS_COMPONENT_STATES = [
  "READY",
  "BLOCKED",
  "UNKNOWN",
  "NOT_APPLICABLE",
] as const;
export type TransitionReadinessComponentState =
  (typeof TRANSITION_READINESS_COMPONENT_STATES)[number];

export const TransitionReadinessComponentSchema = z
  .object({
    component: z.enum(TRANSITION_READINESS_SLICE_COMPONENTS),
    state: z.enum(TRANSITION_READINESS_COMPONENT_STATES),
    sourceRefs: z.array(LongitudinalSourceRefSchema),
  })
  .strict();
export type TransitionReadinessComponent = z.infer<typeof TransitionReadinessComponentSchema>;

export interface TransitionReadinessProjection {
  readonly executionState: "READY" | "BLOCKED" | "UNKNOWN";
  readonly blockedComponents: readonly TransitionReadinessSliceComponent[];
  readonly unknownComponents: readonly TransitionReadinessSliceComponent[];
}

/**
 * LSR-10: no single flag may substitute for the seven independently governed
 * components. A component nobody reported is **unknown**, never implicitly
 * satisfied — absence of evidence is not readiness.
 */
export function deriveTransitionReadiness(
  components: readonly TransitionReadinessComponent[],
): TransitionReadinessProjection {
  const parsed = components.map((component) => TransitionReadinessComponentSchema.parse(component));

  // Collect every state reported for each component. Reducing to a single value
  // by array order would let the caller decide the answer by ordering its input:
  // [BLOCKED, READY] and [READY, BLOCKED] must not disagree.
  const reported = new Map<TransitionReadinessSliceComponent, Set<TransitionReadinessComponentState>>();
  for (const component of parsed) {
    const states = reported.get(component.component) ?? new Set<TransitionReadinessComponentState>();
    states.add(component.state);
    reported.set(component.component, states);
  }

  // One distinct state is the answer; repeats of the same state are safely deduplicated.
  // Conflicting states are a contradiction, and a contradiction is not an answer.
  const settled = (component: TransitionReadinessSliceComponent) => {
    const states = reported.get(component);
    if (states === undefined || states.size !== 1) return undefined;
    return [...states][0];
  };

  const blockedComponents = TRANSITION_READINESS_SLICE_COMPONENTS.filter(
    (component) => settled(component) === "BLOCKED",
  );
  const unknownComponents = TRANSITION_READINESS_SLICE_COMPONENTS.filter((component) => {
    const state = settled(component);
    // Unreported, explicitly UNKNOWN, and contradicted are the same answer: we do
    // not know. NOT_APPLICABLE is an answer, so it is neither blocked nor unknown.
    return state === undefined || state === "UNKNOWN";
  });

  return {
    executionState: blockedComponents.length > 0 ? "BLOCKED" : unknownComponents.length > 0 ? "UNKNOWN" : "READY",
    blockedComponents,
    unknownComponents,
  };
}

export const LOC_AVAILABILITY_STATES = ["AVAILABLE", "UNAVAILABLE", "UNKNOWN"] as const;
export type LocAvailabilityState = (typeof LOC_AVAILABILITY_STATES)[number];

export const LevelOfCareProfileInputSchema = z
  .object({
    clinicalRecommendation: z
      .object({ levelCode: z.string().min(1).max(100), sourceDecisionId: DOMAIN_ID_SCHEMA })
      .strict()
      .nullable(),
    payerAuthorization: z
      .object({ levelCode: z.string().min(1).max(100), sourceRef: LongitudinalSourceRefSchema })
      .strict()
      .nullable(),
    availability: z
      .object({
        levelCode: z.string().min(1).max(100),
        state: z.enum(LOC_AVAILABILITY_STATES),
        sourceRef: LongitudinalSourceRefSchema,
      })
      .strict()
      .nullable(),
    patientPreference: z
      .object({ levelCode: z.string().min(1).max(100), sourceRef: LongitudinalSourceRefSchema })
      .strict()
      .nullable(),
    actual: z
      .object({ levelCode: z.string().min(1).max(100), sourceRef: LongitudinalSourceRefSchema })
      .strict()
      .nullable(),
  })
  .strict();
export type LevelOfCareProfileInput = z.infer<typeof LevelOfCareProfileInputSchema>;

export function deriveLevelOfCareProfile(input: LevelOfCareProfileInput): LevelOfCareProfileInput {
  return LevelOfCareProfileInputSchema.parse(input);
}

export const SOURCE_COVERAGE_COMPLETENESS = [
  "COMPLETE_FOR_WINDOW",
  "PARTIAL",
  "UNKNOWN",
] as const;
export type SourceCoverageCompleteness = (typeof SOURCE_COVERAGE_COMPLETENESS)[number];

export interface ContinuityWindowProjection {
  readonly eventType: ContinuityEventType;
  readonly status: "OBSERVED" | "NONE_OBSERVED_WITH_COMPLETE_COVERAGE" | "UNKNOWN";
  readonly observedEventIds: readonly string[];
  readonly sourceCoverageCompleteness: SourceCoverageCompleteness;
}

/**
 * Quality states that may stand as current evidence. This mirrors the metric
 * rule already established for analytics — `requiredQualityStates` in
 * `analytics.ts` — rather than introducing a second, divergent notion of what
 * counts. Everything else is either retracted (CORRECTED, SUPERSEDED),
 * untrusted (QUARANTINED, REJECTED) or not yet adjudicated (PENDING_REVIEW).
 */
const ACTIVE_CONTINUITY_QUALITY_STATES: readonly DataQualityStateName[] = [
  "VALID",
  "VALID_WITH_WARNINGS",
];

export function deriveContinuityWindow(input: {
  events: readonly ContinuityEvent[];
  eventType: ContinuityEventType;
  windowStartAt: string;
  windowEndAt: string;
  sourceCoverageCompleteness: SourceCoverageCompleteness;
}): ContinuityWindowProjection {
  const start = isoMs(ISO_DATETIME_SCHEMA.parse(input.windowStartAt));
  const end = isoMs(ISO_DATETIME_SCHEMA.parse(input.windowEndAt));
  if (start > end) throw new Error("Continuity window must start on or before it ends");

  const inWindow = input.events
    .map((event) => ContinuityEventSchema.parse(event))
    .filter((event) => {
      const effective = isoMs(event.effectiveAt);
      return event.eventType === input.eventType && effective >= start && effective <= end;
    });

  const observedEventIds = inWindow
    .filter((event) =>
      ACTIVE_CONTINUITY_QUALITY_STATES.includes(event.qualityState as DataQualityStateName),
    )
    .map((event) => event.eventId);

  if (observedEventIds.length > 0) {
    return {
      eventType: input.eventType,
      status: "OBSERVED",
      observedEventIds,
      sourceCoverageCompleteness: input.sourceCoverageCompleteness,
    };
  }

  // LSR-17: a retracted, untrusted or unreviewed observation is not proof that
  // the event did not occur. It is proof that we no longer know, so it must not
  // license a complete-coverage claim of absence.
  const hasInactiveEvidence = inWindow.length > 0;

  return {
    eventType: input.eventType,
    status:
      input.sourceCoverageCompleteness === "COMPLETE_FOR_WINDOW" && !hasInactiveEvidence
        ? "NONE_OBSERVED_WITH_COMPLETE_COVERAGE"
        : "UNKNOWN",
    observedEventIds: [],
    sourceCoverageCompleteness: input.sourceCoverageCompleteness,
  };
}

export const LongitudinalCareJourneyProjectionInputSchema = z
  .object({
    patientToken: z.string().min(8).max(200),
    accessCaseIds: z.array(DOMAIN_ID_SCHEMA),
    inpatientEpisodeIds: z.array(DOMAIN_ID_SCHEMA),
    careTransitionIds: z.array(DOMAIN_ID_SCHEMA),
    continuityEventIds: z.array(DOMAIN_ID_SCHEMA),
  })
  .strict();
export type LongitudinalCareJourneyProjection = z.infer<
  typeof LongitudinalCareJourneyProjectionInputSchema
>;

export function deriveLongitudinalCareJourneyProjection(
  input: LongitudinalCareJourneyProjection,
): LongitudinalCareJourneyProjection {
  return LongitudinalCareJourneyProjectionInputSchema.parse(input);
}
