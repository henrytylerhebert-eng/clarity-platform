import { z } from "zod";
import {
  DATE_ONLY_SCHEMA,
  DOMAIN_ID_SCHEMA,
  FacilityTimezoneConfigSchema,
  ISO_DATETIME_SCHEMA,
} from "./episode.js";
import { DENIAL_REASON_CODES } from "./utilizationReview.js";

export const EPISODE_DAY_COVERAGE_STATUSES = [
  "NOT_REQUIRED",
  "APPROVED",
  "DENIED",
  "PENDING",
  "EXPIRED",
  "UNREQUESTED",
  "UNKNOWN",
] as const;
export type EpisodeDayCoverageStatus = (typeof EPISODE_DAY_COVERAGE_STATUSES)[number];

export const EPISODE_DAY_RISK_CODES = [
  "REVIEW_DUE_SOON",
  "REVIEW_OVERDUE",
  "AUTH_EXPIRES_SOON",
  "AUTH_EXPIRED",
  "DOCUMENTATION_GAP",
  "SOURCE_DISAGREEMENT",
  "DATA_INCOMPLETE",
] as const;
export type EpisodeDayRiskCode = (typeof EPISODE_DAY_RISK_CODES)[number];

export const DATA_QUALITY_STATES = [
  "VALID",
  "VALID_WITH_WARNINGS",
  "PENDING_REVIEW",
  "QUARANTINED",
  "REJECTED",
  "CORRECTED",
  "SUPERSEDED",
] as const;
export type DataQualityState = (typeof DATA_QUALITY_STATES)[number];

export const METRIC_ELIGIBILITY_STATES = [
  "ELIGIBLE",
  "ELIGIBLE_WITH_WARNING",
  "PENDING_REVIEW",
  "EXCLUDED_CORRECTED",
  "EXCLUDED_SUPERSEDED",
  "EXCLUDED_QUALITY",
  "EXCLUDED_POLICY",
] as const;
export type MetricEligibilityState = (typeof METRIC_ELIGIBILITY_STATES)[number];

const StrictId = DOMAIN_ID_SCHEMA;

const ActiveDecisionRangeSchema = z
  .object({
    startDate: DATE_ONLY_SCHEMA,
    endDate: DATE_ONLY_SCHEMA,
    outcome: z.enum(["APPROVED", "DENIED", "PENDING"]),
    sourceEventId: StrictId,
    supersededByEventId: StrictId.nullable(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.startDate > value.endDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endDate"], message: "Range must start on or before it ends" });
    }
  });
export type ActiveDecisionRange = z.infer<typeof ActiveDecisionRangeSchema>;

export const EpisodeDayDerivationInputSchema = z
  .object({
    serviceDate: DATE_ONLY_SCHEMA,
    facilityTimezone: FacilityTimezoneConfigSchema,
    requirement: z.enum(["REQUIRED", "NOT_REQUIRED", "UNKNOWN"]),
    activeDecisionRanges: z.array(ActiveDecisionRangeSchema),
    latestApprovedEndDate: DATE_ONLY_SCHEMA.nullable(),
    reviewDueAt: ISO_DATETIME_SCHEMA.nullable(),
    openDocumentationGapIds: z.array(StrictId),
    sourceDisagreement: z.boolean(),
    dataIncomplete: z.boolean(),
    lineageSourceEventIds: z.array(StrictId),
    evaluationAt: ISO_DATETIME_SCHEMA,
    thresholds: z
      .object({
        reviewDueSoonHours: z.number().int().nonnegative(),
        authorizationExpiresSoonDays: z.number().int().nonnegative(),
      })
      .strict(),
    derivationVersion: z.string().min(1).max(100),
  })
  .strict();
export type EpisodeDayDerivationInput = z.infer<typeof EpisodeDayDerivationInputSchema>;

export interface EpisodeDayAuthorizationState {
  readonly serviceDate: string;
  readonly coverageStatus: EpisodeDayCoverageStatus;
  readonly riskCodes: readonly EpisodeDayRiskCode[];
  readonly atRisk: boolean;
  readonly qualityState: DataQualityState;
  readonly activeSourceEventIds: readonly string[];
  readonly excludedSupersededEventIds: readonly string[];
  readonly facilityTimezone: string;
  readonly derivationVersion: string;
  readonly calculatedAt: string;
}

function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const result = new Date(Date.UTC(year!, month! - 1, day! + days));
  return `${result.getUTCFullYear().toString().padStart(4, "0")}-${(result.getUTCMonth() + 1)
    .toString()
    .padStart(2, "0")}-${result.getUTCDate().toString().padStart(2, "0")}`;
}

function coversDate(range: ActiveDecisionRange, serviceDate: string): boolean {
  return range.startDate <= serviceDate && range.endDate >= serviceDate;
}

function orderedRiskCodes(codes: Iterable<EpisodeDayRiskCode>): EpisodeDayRiskCode[] {
  const unique = new Set(codes);
  return EPISODE_DAY_RISK_CODES.filter((code) => unique.has(code));
}

export function deriveEpisodeDayAuthorizationState(
  input: EpisodeDayDerivationInput,
): EpisodeDayAuthorizationState {
  const parsed = EpisodeDayDerivationInputSchema.parse(input);
  const activeRanges = parsed.activeDecisionRanges.filter((range) => range.supersededByEventId === null);
  const supersededEventIds = parsed.activeDecisionRanges
    .filter((range) => range.supersededByEventId !== null)
    .map((range) => range.sourceEventId)
    .sort();
  const approved = activeRanges.filter((range) => range.outcome === "APPROVED" && coversDate(range, parsed.serviceDate));
  const denied = activeRanges.filter((range) => range.outcome === "DENIED" && coversDate(range, parsed.serviceDate));
  const pending = activeRanges.filter((range) => range.outcome === "PENDING" && coversDate(range, parsed.serviceDate));
  const conflictingOverlap = approved.length > 0 && denied.length > 0;

  let coverageStatus: EpisodeDayCoverageStatus;
  if (parsed.sourceDisagreement || parsed.dataIncomplete || conflictingOverlap) {
    coverageStatus = "UNKNOWN";
  } else if (denied.length > 0) {
    coverageStatus = "DENIED";
  } else if (approved.length > 0) {
    coverageStatus = "APPROVED";
  } else if (pending.length > 0) {
    coverageStatus = "PENDING";
  } else if (parsed.requirement === "NOT_REQUIRED") {
    coverageStatus = "NOT_REQUIRED";
  } else if (
    parsed.requirement === "REQUIRED" &&
    parsed.latestApprovedEndDate !== null &&
    parsed.latestApprovedEndDate < parsed.serviceDate
  ) {
    coverageStatus = "EXPIRED";
  } else if (parsed.requirement === "REQUIRED") {
    coverageStatus = "UNREQUESTED";
  } else {
    coverageStatus = "UNKNOWN";
  }

  const evaluationTime = new Date(parsed.evaluationAt).getTime();
  const reviewDueTime = parsed.reviewDueAt === null ? null : new Date(parsed.reviewDueAt).getTime();
  const riskCodes: EpisodeDayRiskCode[] = [];
  if (reviewDueTime !== null && reviewDueTime < evaluationTime) {
    riskCodes.push("REVIEW_OVERDUE");
  } else if (
    reviewDueTime !== null &&
    reviewDueTime <= evaluationTime + parsed.thresholds.reviewDueSoonHours * 60 * 60 * 1000
  ) {
    riskCodes.push("REVIEW_DUE_SOON");
  }
  if (
    coverageStatus === "APPROVED" &&
    parsed.latestApprovedEndDate !== null &&
    parsed.latestApprovedEndDate <= addDays(parsed.serviceDate, parsed.thresholds.authorizationExpiresSoonDays)
  ) {
    riskCodes.push("AUTH_EXPIRES_SOON");
  }
  if (coverageStatus === "EXPIRED") riskCodes.push("AUTH_EXPIRED");
  if (parsed.openDocumentationGapIds.length > 0) riskCodes.push("DOCUMENTATION_GAP");
  if (parsed.sourceDisagreement || conflictingOverlap) riskCodes.push("SOURCE_DISAGREEMENT");
  if (parsed.dataIncomplete) riskCodes.push("DATA_INCOMPLETE");

  const sortedRiskCodes = orderedRiskCodes(riskCodes);
  const qualityState: DataQualityState =
    sortedRiskCodes.includes("SOURCE_DISAGREEMENT")
      ? "QUARANTINED"
      : sortedRiskCodes.includes("DATA_INCOMPLETE")
        ? "PENDING_REVIEW"
        : sortedRiskCodes.length > 0
          ? "VALID_WITH_WARNINGS"
          : "VALID";

  return {
    serviceDate: parsed.serviceDate,
    coverageStatus,
    riskCodes: sortedRiskCodes,
    atRisk: sortedRiskCodes.length > 0,
    qualityState,
    activeSourceEventIds: [...new Set([...parsed.lineageSourceEventIds, ...activeRanges.map((range) => range.sourceEventId)])].sort(),
    excludedSupersededEventIds: [...new Set(supersededEventIds)],
    facilityTimezone: parsed.facilityTimezone.facilityTimezone,
    derivationVersion: parsed.derivationVersion,
    calculatedAt: parsed.evaluationAt,
  };
}

const UuidLike = DOMAIN_ID_SCHEMA;

const EventSchemaDescriptor = z
  .object({
    name: z.string().min(1).max(200),
    version: z.string().regex(/^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/),
  })
  .strict();

const EventTypeDescriptor = z
  .object({
    name: z.string().regex(/^[A-Z][A-Z0-9_]+$/),
    version: z.number().int().positive(),
  })
  .strict();

const GovernedEventEnvelopeSchema = z
  .object({
    eventId: UuidLike,
    schema: EventSchemaDescriptor,
    eventType: EventTypeDescriptor,
    aggregate: z
      .object({
        type: z.enum([
          "CASE",
          "EPISODE",
          "EPISODE_DAY",
          "EPISODE_AUTHORIZATION",
          "AUTHORIZATION_REVIEW",
          "DOCUMENTATION_GAP",
          "METRIC_SNAPSHOT",
          "DATA_QUALITY_ISSUE",
        ]),
        id: UuidLike,
        version: z.number().int().positive(),
      })
      .strict(),
    tenant: z
      .object({
        organizationId: UuidLike,
        facilityId: UuidLike.nullable(),
        programId: UuidLike.nullable(),
        unitId: UuidLike.nullable(),
      })
      .strict(),
    subject: z
      .object({
        caseId: UuidLike.nullable(),
        episodeId: UuidLike.nullable(),
        episodeDayId: UuidLike.nullable(),
        personToken: z.string().min(8).max(200).nullable(),
      })
      .strict(),
    times: z
      .object({
        effectiveAt: ISO_DATETIME_SCHEMA,
        recordedAt: ISO_DATETIME_SCHEMA,
        receivedAt: ISO_DATETIME_SCHEMA.nullable(),
      })
      .strict(),
    actor: z
      .object({
        type: z.enum(["USER", "SYSTEM", "EXTERNAL_SYSTEM"]),
        id: UuidLike,
        displayRole: z.string().max(100).nullable(),
        sessionId: UuidLike.nullable(),
      })
      .strict(),
    source: z
      .object({
        kind: z.enum([
          "NATIVE_CLARITY",
          "HUMAN_ATTESTATION",
          "FHIR",
          "HL7",
          "PAYER",
          "STAFFING_PAYROLL",
          "BATCH_FILE",
          "AGENCY",
        ]),
        system: z.string().min(1).max(200),
        sourceTenantKey: z.string().max(200).nullable(),
        sourceEventId: z.string().max(300).nullable(),
        sourceEventVersion: z.string().max(100).nullable(),
        adapterName: z.string().min(1).max(200),
        adapterVersion: z.string().min(1).max(100),
        method: z.string().min(1).max(100),
        provenanceRefs: z
          .array(
            z
              .object({
                type: z.string().min(1).max(100),
                id: z.string().min(1).max(300),
                version: z.string().max(100).nullable(),
                hash: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
              })
              .strict(),
          )
          .max(50),
      })
      .strict(),
    correlation: z
      .object({
        correlationId: UuidLike,
        causationId: UuidLike.nullable(),
        commandId: UuidLike.nullable(),
      })
      .strict(),
    classification: z.enum([
      "PHI_RESTRICTED",
      "PHI_OPERATIONAL",
      "PSEUDONYMIZED",
      "DEIDENTIFIED_AGGREGATE",
      "PUBLIC_SYNTHETIC",
    ]),
    quality: z
      .object({
        state: z.enum(DATA_QUALITY_STATES),
        issues: z
          .array(
            z
              .object({
                code: z.string().regex(/^[A-Z][A-Z0-9_]+$/),
                severity: z.enum(["INFO", "WARNING", "ERROR"]),
                field: z.string().max(300).nullable(),
                message: z.string().min(1).max(500),
              })
              .strict(),
          )
          .max(100),
      })
      .strict(),
    review: z
      .object({
        state: z.enum(["NOT_REQUIRED", "REQUIRED", "ATTESTED", "REJECTED"]),
        reviewedByActorId: UuidLike.nullable(),
        reviewedAt: ISO_DATETIME_SCHEMA.nullable(),
        attestationCode: z.string().max(100).nullable(),
      })
      .strict(),
    correction: z
      .object({
        kind: z.enum(["ORIGINAL", "CORRECTION", "REVERSAL"]),
        supersedesEventId: UuidLike.nullable(),
        reasonCode: z.string().max(100).nullable(),
      })
      .strict()
      .superRefine((value, ctx) => {
        if (value.kind === "ORIGINAL" && (value.supersedesEventId !== null || value.reasonCode !== null)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["supersedesEventId"], message: "Original events cannot supersede another event" });
        }
        if (value.kind !== "ORIGINAL" && (value.supersedesEventId === null || value.reasonCode === null)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["supersedesEventId"], message: "Corrections and reversals require a superseded event and reason code" });
        }
      }),
    metricEligibility: z.enum(METRIC_ELIGIBILITY_STATES),
    payloadHash: z.string().regex(/^[a-f0-9]{64}$/),
    payload: z.record(z.unknown()),
  })
  .strict();

export { GovernedEventEnvelopeSchema };
export type GovernedEventEnvelope = z.infer<typeof GovernedEventEnvelopeSchema>;

export function parseGovernedEvent<TSchema extends z.ZodTypeAny>(
  input: unknown,
  payloadSchema: TSchema,
): GovernedEventEnvelope & { payload: z.output<TSchema> } {
  return GovernedEventEnvelopeSchema.extend({ payload: payloadSchema }).parse(input) as GovernedEventEnvelope & {
    payload: z.output<TSchema>;
  };
}

export function activeGovernedEvents(events: readonly GovernedEventEnvelope[]): GovernedEventEnvelope[] {
  const superseded = new Set(
    events
      .map((event) => event.correction.supersedesEventId)
      .filter((eventId): eventId is string => eventId !== null),
  );
  return events.filter((event) => !superseded.has(event.eventId));
}

export function appendGovernedEventCorrection(
  history: readonly GovernedEventEnvelope[],
  correction: GovernedEventEnvelope,
): readonly GovernedEventEnvelope[] {
  const parsedCorrection = GovernedEventEnvelopeSchema.parse(correction);
  if (parsedCorrection.correction.kind === "ORIGINAL") {
    throw new Error("An appended correction must identify a superseded event");
  }
  if (history.some((event) => event.eventId === parsedCorrection.eventId)) {
    throw new Error("Event IDs must be unique within an event history");
  }
  const targetId = parsedCorrection.correction.supersedesEventId;
  const target = history.find((event) => event.eventId === targetId);
  if (target === undefined) throw new Error("Correction target event was not found");
  if (!activeGovernedEvents(history).some((event) => event.eventId === target.eventId)) {
    throw new Error("Correction target event is already superseded");
  }
  return Object.freeze([...history, Object.freeze(parsedCorrection)]);
}

export const EpisodeCreatedEventPayloadSchema = z
  .object({
    episodeId: UuidLike,
    sourceCaseId: UuidLike,
    relationship: z.literal("ADMISSION_SOURCE"),
    facilityId: UuidLike,
    programId: UuidLike,
    unitId: UuidLike.nullable(),
    facilityTimezone: z.string().min(1).max(100),
    status: z.literal("ACTIVE"),
    resultingEpisodeVersion: z.number().int().positive(),
  })
  .strict();

export const AdmissionRecordedEventPayloadSchema = z
  .object({
    episodeId: UuidLike,
    sourceCaseId: UuidLike,
    admissionRecordId: UuidLike,
    acceptedFacilityResponseId: UuidLike,
    facilityId: UuidLike,
    programId: UuidLike,
    unitId: UuidLike.nullable(),
    facilityTimezone: z.string().min(1).max(100),
    admittedAt: ISO_DATETIME_SCHEMA,
    serviceDate: DATE_ONLY_SCHEMA,
    sourcePacketVersionId: UuidLike.nullable(),
    sourceCustodyEventId: UuidLike.nullable(),
    attestationCode: z.literal("AUTHORIZED_ADMISSION_RECORDED"),
  })
  .strict();

export const AuthorizationDayDecisionRecordedEventPayloadSchema = z
  .object({
    authorizationDayDecisionId: UuidLike,
    authorizationReviewId: UuidLike,
    episodeAuthorizationId: UuidLike,
    episodeId: UuidLike,
    decisionRange: z
      .object({ startDate: DATE_ONLY_SCHEMA, endDate: DATE_ONLY_SCHEMA })
      .strict(),
    outcome: z.enum(["APPROVED", "DENIED", "PENDING"]),
    denialReasonCode: z.enum(DENIAL_REASON_CODES).nullable(),
    sourceReviewEventId: UuidLike,
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.decisionRange.startDate > value.decisionRange.endDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["decisionRange"], message: "Range must start on or before it ends" });
    }
    if (value.outcome === "DENIED" && value.denialReasonCode === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["denialReasonCode"], message: "Denied decisions require a reason" });
    }
  });

export const DocumentationGapRecordedEventPayloadSchema = z
  .object({
    documentationGapId: UuidLike,
    episodeId: UuidLike,
    sourceAuthorizationReviewId: UuidLike.nullable(),
    categoryCode: z.string().min(1).max(100),
    status: z.literal("OPEN"),
    dueAt: ISO_DATETIME_SCHEMA.nullable(),
    assignedRole: z.string().max(100).nullable(),
    assignedUserId: UuidLike.nullable(),
    hasOperationalSummary: z.boolean(),
  })
  .strict();

export const EpisodeDayAuthorizationStateDerivedEventPayloadSchema = z
  .object({
    episodeDayId: UuidLike,
    episodeId: UuidLike,
    serviceDate: DATE_ONLY_SCHEMA,
    coverageStatus: z.enum(EPISODE_DAY_COVERAGE_STATUSES),
    riskCodes: z.array(z.enum(EPISODE_DAY_RISK_CODES)).refine((codes) => new Set(codes).size === codes.length),
    approvedThroughDate: DATE_ONLY_SCHEMA.nullable(),
    nextReviewDueAt: ISO_DATETIME_SCHEMA.nullable(),
    openDocumentationGapCount: z.number().int().nonnegative(),
    activeSourceEventIds: z.array(UuidLike),
    activeSourceChainHash: z.string().regex(/^[a-f0-9]{64}$/),
    derivationVersion: z.string().min(1).max(100),
    calculatedAt: ISO_DATETIME_SCHEMA,
  })
  .strict();

export const METRIC_STATUSES = [
  "CALCULATED",
  "NO_MEASUREMENTS_FOUND",
  "INSUFFICIENT_DENOMINATOR",
  "SUPPRESSED",
  "PENDING_REVIEW",
] as const;
export type MetricStatus = (typeof METRIC_STATUSES)[number];

export const METRIC_VALUE_TYPES = ["COUNT", "RATE", "DURATION", "CURRENCY", "PERCENT"] as const;
export const METRIC_DEFINITION_STATUSES = ["DRAFT", "IN_REVIEW", "APPROVED", "RETIRED"] as const;

export const MetricFilterSchema = z
  .object({
    field: z.string().min(1).max(200),
    operator: z.enum(["EQ", "NEQ", "IN", "NOT_IN", "GT", "GTE", "LT", "LTE", "IS_NULL", "NOT_NULL"]),
    value: z.unknown(),
  })
  .strict();

export const MetricTermSchema = z
  .object({
    fact: z.string().min(1).max(200),
    operation: z.enum(["COUNT", "COUNT_DISTINCT", "SUM", "AVG", "MIN", "MAX"]),
    field: z.string().min(1).max(200),
    filters: z.array(MetricFilterSchema),
  })
  .strict();

export const MetricDefinitionSchema = z
  .object({
    metricKey: z.string().regex(/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/),
    version: z.string().regex(/^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/),
    name: z.string().min(1).max(200),
    description: z.string().min(1).max(2000),
    status: z.enum(METRIC_DEFINITION_STATUSES),
    ownerRole: z.string().min(1).max(100),
    stewardUserId: StrictId.nullable(),
    reviewerUserId: StrictId.nullable(),
    effectiveStart: DATE_ONLY_SCHEMA.nullable(),
    effectiveEnd: DATE_ONLY_SCHEMA.nullable(),
    subjectArea: z.enum(["UTILIZATION_REVIEW", "OPERATIONS", "QUALITY", "FINANCE"]),
    valueType: z.enum(METRIC_VALUE_TYPES),
    unit: z.string().min(1).max(100),
    grain: z.array(z.enum(["DAY", "WEEK", "MONTH", "FACILITY", "PROGRAM", "UNIT", "PAYER"])).min(1),
    numerator: MetricTermSchema,
    denominator: MetricTermSchema.nullable(),
    inclusions: z.array(MetricFilterSchema),
    exclusions: z.array(MetricFilterSchema),
    sourceEventTypes: z.array(z.string().regex(/^[A-Z][A-Z0-9_]+\.v[0-9]+$/)).min(1),
    sourceFactTables: z.array(z.string().min(1).max(200)).min(1),
    calculationRef: z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/),
    calculationVersion: z.string().min(1).max(100),
    requiredQualityStates: z.array(z.enum(["VALID", "VALID_WITH_WARNINGS"])).min(1),
    lateArrivalPolicyRef: z.string().min(1).max(200),
    suppressionPolicyRef: z.string().max(200).nullable(),
    minimumDenominator: z.number().nonnegative().nullable(),
    display: z
      .object({
        emptyState: z.literal("NO_MEASUREMENTS_FOUND"),
        insufficientDenominatorLabel: z.string().min(1).max(500),
        caveat: z.string().max(1000).nullable(),
      })
      .strict(),
    governance: z
      .object({
        approvedAt: ISO_DATETIME_SCHEMA.nullable(),
        evidenceRefs: z.array(z.string().min(1).max(500)),
        changeSummary: z.string().min(1).max(2000),
      })
      .strict(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (new Set(value.grain).size !== value.grain.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["grain"], message: "Metric grain values must be unique" });
    }
    if (["RATE", "PERCENT"].includes(value.valueType) && value.denominator === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["denominator"], message: "Rate and percent metrics require a denominator" });
    }
    if (value.status === "APPROVED") {
      if (value.stewardUserId === null || value.reviewerUserId === null || value.effectiveStart === null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["status"], message: "Approved metrics require steward, reviewer, and effective start" });
      }
      if (value.governance.approvedAt === null || value.governance.evidenceRefs.length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["governance"], message: "Approved metrics require approval evidence" });
      }
    }
  });
export type MetricDefinition = z.infer<typeof MetricDefinitionSchema>;

const draftMetricBase = {
  version: "1.0.0-draft",
  status: "DRAFT" as const,
  ownerRole: "UR_METRIC_STEWARD",
  stewardUserId: null,
  reviewerUserId: null,
  effectiveStart: null,
  effectiveEnd: null,
  subjectArea: "UTILIZATION_REVIEW" as const,
  inclusions: [],
  exclusions: [
    { field: "metric_eligibility", operator: "NEQ" as const, value: "EXCLUDED_SUPERSEDED" },
    { field: "quality_state", operator: "IN" as const, value: ["QUARANTINED", "REJECTED"] },
  ],
  sourceEventTypes: ["EPISODE_DAY_AUTHORIZATION_STATE_DERIVED.v1"],
  sourceFactTables: ["analytics.fact_episode_day_authorization"],
  requiredQualityStates: ["VALID", "VALID_WITH_WARNINGS"] as const,
  lateArrivalPolicyRef: "ur.standard.v1",
  suppressionPolicyRef: null,
  minimumDenominator: null,
  display: {
    emptyState: "NO_MEASUREMENTS_FOUND" as const,
    insufficientDenominatorLabel: "Not enough decisioned days.",
    caveat: "Draft definition; operator and metric-owner validation required.",
  },
  governance: {
    approvedAt: null,
    evidenceRefs: [],
    changeSummary: "Initial proposed definition; approval required before operational use.",
  },
};

function draftMetric(
  definition: Omit<MetricDefinition, keyof typeof draftMetricBase> & Partial<typeof draftMetricBase>,
): MetricDefinition {
  return MetricDefinitionSchema.parse({ ...draftMetricBase, ...definition });
}

export const DRAFT_METRIC_DEFINITIONS: readonly MetricDefinition[] = [
  draftMetric({
    metricKey: "ur.approved_patient_days",
    name: "Approved patient days",
    description: "Distinct eligible patient episode days with an active approved authorization outcome.",
    valueType: "COUNT",
    unit: "patient_day",
    grain: ["DAY", "FACILITY", "PROGRAM", "UNIT", "PAYER"],
    numerator: { fact: "fact_episode_day_authorization", operation: "COUNT_DISTINCT", field: "episode_day_key", filters: [{ field: "coverage_status", operator: "EQ", value: "APPROVED" }] },
    denominator: null,
    calculationRef: "urApprovedPatientDays",
    calculationVersion: "1",
  }),
  draftMetric({
    metricKey: "ur.denied_patient_days",
    name: "Denied patient days",
    description: "Distinct eligible patient episode days with an active denied authorization outcome.",
    valueType: "COUNT",
    unit: "patient_day",
    grain: ["DAY", "FACILITY", "PROGRAM", "UNIT", "PAYER"],
    numerator: { fact: "fact_episode_day_authorization", operation: "COUNT_DISTINCT", field: "episode_day_key", filters: [{ field: "coverage_status", operator: "EQ", value: "DENIED" }] },
    denominator: null,
    calculationRef: "urDeniedPatientDays",
    calculationVersion: "1",
  }),
  draftMetric({
    metricKey: "ur.pending_patient_days",
    name: "Pending patient days",
    description: "Distinct eligible patient episode days covered by a pending review without an approved or denied active decision.",
    valueType: "COUNT",
    unit: "patient_day",
    grain: ["DAY", "FACILITY", "PROGRAM", "UNIT", "PAYER"],
    numerator: { fact: "fact_episode_day_authorization", operation: "COUNT_DISTINCT", field: "episode_day_key", filters: [{ field: "coverage_status", operator: "EQ", value: "PENDING" }] },
    denominator: null,
    calculationRef: "urPendingPatientDays",
    calculationVersion: "1",
  }),
  draftMetric({
    metricKey: "ur.expired_patient_days",
    name: "Expired patient days",
    description: "Distinct eligible required-authorization patient days after the latest approved-through date without an active covering decision.",
    valueType: "COUNT",
    unit: "patient_day",
    grain: ["DAY", "FACILITY", "PROGRAM", "UNIT", "PAYER"],
    numerator: { fact: "fact_episode_day_authorization", operation: "COUNT_DISTINCT", field: "episode_day_key", filters: [{ field: "coverage_status", operator: "EQ", value: "EXPIRED" }] },
    denominator: null,
    calculationRef: "urExpiredPatientDays",
    calculationVersion: "1",
  }),
  draftMetric({
    metricKey: "ur.at_risk_patient_days",
    name: "At-risk patient days",
    description: "Distinct eligible patient days with one or more authorization-risk flags; risk overlaps coverage outcomes.",
    valueType: "COUNT",
    unit: "patient_day",
    grain: ["DAY", "FACILITY", "PROGRAM", "UNIT", "PAYER"],
    numerator: { fact: "fact_episode_day_authorization", operation: "COUNT_DISTINCT", field: "episode_day_key", filters: [{ field: "at_risk", operator: "EQ", value: true }] },
    denominator: null,
    calculationRef: "urAtRiskPatientDays",
    calculationVersion: "1",
  }),
  draftMetric({
    metricKey: "ur.open_documentation_gap_count",
    name: "Open documentation gaps",
    description: "Active documentation gaps excluding resolved, cancelled, and superseded gaps.",
    valueType: "COUNT",
    unit: "gap",
    grain: ["DAY", "FACILITY", "PROGRAM", "UNIT"],
    numerator: { fact: "fact_documentation_gap", operation: "COUNT_DISTINCT", field: "documentation_gap_id", filters: [{ field: "status", operator: "IN", value: ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "DISPUTED", "REOPENED"] }] },
    denominator: null,
    calculationRef: "urOpenDocumentationGapCount",
    calculationVersion: "1",
  }),
  draftMetric({
    metricKey: "ur.concurrent_reviews_due_count",
    name: "Concurrent reviews due",
    description: "Open episode authorizations with a concurrent review due within the configured window or already overdue.",
    valueType: "COUNT",
    unit: "review",
    grain: ["DAY", "FACILITY", "PROGRAM", "UNIT"],
    numerator: { fact: "fact_authorization_review", operation: "COUNT_DISTINCT", field: "episode_authorization_id", filters: [{ field: "review_type", operator: "EQ", value: "CONCURRENT" }] },
    denominator: null,
    calculationRef: "urConcurrentReviewsDueCount",
    calculationVersion: "1",
  }),
  draftMetric({
    metricKey: "ur.denied_decisioned_day_rate",
    name: "Denied decisioned-day rate",
    description: "Draft rate of denied patient days among approved and denied decisioned patient days; denominator remains an explicit owner decision.",
    valueType: "RATE",
    unit: "ratio",
    grain: ["DAY", "WEEK", "MONTH", "FACILITY", "PROGRAM", "UNIT", "PAYER"],
    numerator: { fact: "fact_episode_day_authorization", operation: "COUNT_DISTINCT", field: "episode_day_key", filters: [{ field: "coverage_status", operator: "EQ", value: "DENIED" }] },
    denominator: { fact: "fact_episode_day_authorization", operation: "COUNT_DISTINCT", field: "episode_day_key", filters: [{ field: "coverage_status", operator: "IN", value: ["APPROVED", "DENIED"] }] },
    calculationRef: "urDeniedDecisionedDayRate",
    calculationVersion: "1",
    display: { ...draftMetricBase.display, insufficientDenominatorLabel: "Denominator not approved or sufficient for display." },
  }),
];

export const MetricMeasurementInputSchema = z
  .object({
    numeratorValue: z.number().nonnegative().nullable(),
    denominatorValue: z.number().nonnegative().nullable(),
    sourceFactCount: z.number().int().nonnegative(),
  })
  .strict();
export type MetricMeasurementInput = z.infer<typeof MetricMeasurementInputSchema>;

export function classifyMetricMeasurement(
  definition: MetricDefinition,
  input: MetricMeasurementInput,
): { status: MetricStatus; value: number | null } {
  const parsed = MetricMeasurementInputSchema.parse(input);
  if (parsed.sourceFactCount === 0) return { status: "NO_MEASUREMENTS_FOUND", value: null };
  if (["RATE", "PERCENT"].includes(definition.valueType)) {
    if (parsed.denominatorValue === null || parsed.denominatorValue === 0 || parsed.numeratorValue === null) {
      return { status: "INSUFFICIENT_DENOMINATOR", value: null };
    }
    return {
      status: "CALCULATED",
      value: definition.valueType === "PERCENT" ? (parsed.numeratorValue / parsed.denominatorValue) * 100 : parsed.numeratorValue / parsed.denominatorValue,
    };
  }
  return { status: "CALCULATED", value: parsed.numeratorValue ?? 0 };
}
