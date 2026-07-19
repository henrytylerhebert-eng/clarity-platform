import { describe, expect, it } from "vitest";
import {
  activeGovernedEvents,
  AdmissionRecordedEventPayloadSchema,
  appendGovernedEventCorrection,
  classifyMetricMeasurement,
  DRAFT_METRIC_DEFINITIONS,
  deriveEpisodeDayAuthorizationState,
  EpisodeDayAuthorizationStateDerivedEventPayloadSchema,
  EpisodeCreatedEventPayloadSchema,
  GovernedEventEnvelopeSchema,
  MetricDefinitionSchema,
  parseGovernedEvent,
} from "@clarity/domain-contracts";
import { syntheticEpisodeDayInput, syntheticOriginalEvent } from "../data/analytics-synthetic.js";

function derive(overrides: Partial<typeof syntheticEpisodeDayInput> = {}) {
  return deriveEpisodeDayAuthorizationState({ ...syntheticEpisodeDayInput, ...overrides });
}

function range(
  outcome: "APPROVED" | "DENIED" | "PENDING",
  sourceEventId: string,
  supersededByEventId: string | null = null,
) {
  return { startDate: "2026-07-18", endDate: "2026-07-18", outcome, sourceEventId, supersededByEventId } as const;
}

describe("deterministic episode-day authorization derivation", () => {
  it.each([
    ["APPROVED", range("APPROVED", "approved-syn-1")],
    ["DENIED", range("DENIED", "denied-syn-1")],
    ["PENDING", range("PENDING", "pending-syn-1")],
  ] as const)("derives %s coverage", (expected, decision) => {
    const result = derive({ activeDecisionRanges: [decision], latestApprovedEndDate: expected === "APPROVED" ? "2026-07-18" : null });
    expect(result.coverageStatus).toBe(expected);
  });

  it("derives expired, unrequested, not-required, and unknown states", () => {
    expect(derive({ latestApprovedEndDate: "2026-07-17" }).coverageStatus).toBe("EXPIRED");
    expect(derive().coverageStatus).toBe("UNREQUESTED");
    expect(derive({ requirement: "NOT_REQUIRED" }).coverageStatus).toBe("NOT_REQUIRED");
    expect(derive({ requirement: "UNKNOWN" }).coverageStatus).toBe("UNKNOWN");
  });

  it("returns unknown plus source disagreement for conflicting active overlap", () => {
    const result = derive({ activeDecisionRanges: [range("APPROVED", "approved-syn-1"), range("DENIED", "denied-syn-1")] });
    expect(result.coverageStatus).toBe("UNKNOWN");
    expect(result.riskCodes).toEqual(["SOURCE_DISAGREEMENT"]);
    expect(result.qualityState).toBe("QUARANTINED");
  });

  it("keeps risk flags separate and allows them to overlap an approved outcome", () => {
    const result = derive({
      activeDecisionRanges: [range("APPROVED", "approved-syn-1")],
      latestApprovedEndDate: "2026-07-18",
      reviewDueAt: "2026-07-18T16:00:00-05:00",
      openDocumentationGapIds: ["gap-syn-1"],
    });
    expect(result.coverageStatus).toBe("APPROVED");
    expect(result.atRisk).toBe(true);
    expect(result.riskCodes).toEqual(["REVIEW_DUE_SOON", "AUTH_EXPIRES_SOON", "DOCUMENTATION_GAP"]);
  });

  it("supports multiple risk flags without duplicates and marks overdue/expired facts", () => {
    const result = derive({
      latestApprovedEndDate: "2026-07-17",
      reviewDueAt: "2026-07-17T15:00:00-05:00",
      openDocumentationGapIds: ["gap-syn-1", "gap-syn-2"],
      sourceDisagreement: true,
      dataIncomplete: true,
    });
    expect(result.coverageStatus).toBe("UNKNOWN");
    expect(result.riskCodes).toEqual(["REVIEW_OVERDUE", "DOCUMENTATION_GAP", "SOURCE_DISAGREEMENT", "DATA_INCOMPLETE"]);
    expect(new Set(result.riskCodes).size).toBe(result.riskCodes.length);
  });

  it("excludes superseded facts from active derivation and is deterministic", () => {
    const first = derive({
      activeDecisionRanges: [range("APPROVED", "approved-superseded", "correction-syn-1"), range("PENDING", "pending-active")],
    });
    const second = derive({
      activeDecisionRanges: [range("APPROVED", "approved-superseded", "correction-syn-1"), range("PENDING", "pending-active")],
    });
    expect(first.coverageStatus).toBe("PENDING");
    expect(first.excludedSupersededEventIds).toEqual(["approved-superseded"]);
    expect(first).toEqual(second);
  });
});

describe("governed event envelopes and append-only corrections", () => {
  it("allows source-owned admission events to omit an unresolved program", () => {
    expect(
      EpisodeCreatedEventPayloadSchema.parse({
        episodeId: "episode-syn-1",
        sourceCaseId: "case-syn-1",
        relationship: "ADMISSION_SOURCE",
        facilityId: "facility-syn-1",
        programId: null,
        unitId: null,
        facilityTimezone: "America/Chicago",
        status: "ACTIVE",
        resultingEpisodeVersion: 1,
      }).programId,
    ).toBeNull();
    expect(
      AdmissionRecordedEventPayloadSchema.parse({
        episodeId: "episode-syn-1",
        sourceCaseId: "case-syn-1",
        admissionRecordId: "link-syn-1",
        acceptedFacilityResponseId: "response-syn-1",
        facilityId: "facility-syn-1",
        programId: null,
        unitId: null,
        facilityTimezone: "America/Chicago",
        admittedAt: "2026-07-19T04:30:00Z",
        serviceDate: "2026-07-18",
        sourcePacketVersionId: null,
        sourceCustodyEventId: null,
        attestationCode: "AUTHORIZED_ADMISSION_RECORDED",
      }).programId,
    ).toBeNull();
  });

  it("validates an event envelope separately from its payload schema", () => {
    const parsed = GovernedEventEnvelopeSchema.parse(syntheticOriginalEvent);
    expect(parsed.eventType.name).toBe("AUTHORIZATION_REVIEW_RECORDED");
    expect(() => parseGovernedEvent({ ...syntheticOriginalEvent, payload: { ...syntheticOriginalEvent.payload, forbidden: true } }, EpisodeDayAuthorizationStateDerivedEventPayloadSchema)).toThrow();
    expect(
      GovernedEventEnvelopeSchema.safeParse({
        ...syntheticOriginalEvent,
        correction: { kind: "CORRECTION", supersedesEventId: null, reasonCode: null },
      }).success,
    ).toBe(false);
  });

  it("appends a correction while preserving the original event shape", () => {
    const correction = {
      ...syntheticOriginalEvent,
      eventId: "event-correction-syn-1",
      aggregate: { ...syntheticOriginalEvent.aggregate, version: 2 },
      correction: { kind: "CORRECTION" as const, supersedesEventId: syntheticOriginalEvent.eventId, reasonCode: "DATA_ENTRY_ERROR" },
      payloadHash: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      payload: { decisionStatus: "APPROVED", synthetic: true },
    };
    const history = appendGovernedEventCorrection([syntheticOriginalEvent], correction);
    expect(history).toHaveLength(2);
    expect(syntheticOriginalEvent.correction.kind).toBe("ORIGINAL");
    expect(activeGovernedEvents(history).map((event) => event.eventId)).toEqual(["event-correction-syn-1"]);
    expect(() => appendGovernedEventCorrection(history, correction)).toThrow(/unique/i);
  });
});

describe("draft metric definitions", () => {
  it("keeps all checked-in definitions draft and schema-valid", () => {
    expect(DRAFT_METRIC_DEFINITIONS.length).toBeGreaterThanOrEqual(7);
    for (const definition of DRAFT_METRIC_DEFINITIONS) {
      expect(MetricDefinitionSchema.parse(definition).status).toBe("DRAFT");
    }
  });

  it("requires a denominator for rates and preserves no-measurement state", () => {
    const rate = DRAFT_METRIC_DEFINITIONS.find((definition) => definition.valueType === "RATE")!;
    expect(rate.denominator).not.toBeNull();
    expect(MetricDefinitionSchema.safeParse({ ...rate, denominator: null }).success).toBe(false);
    expect(classifyMetricMeasurement(rate, { numeratorValue: 0, denominatorValue: 0, sourceFactCount: 0 })).toEqual({ status: "NO_MEASUREMENTS_FOUND", value: null });
    expect(classifyMetricMeasurement(rate, { numeratorValue: 0, denominatorValue: 3, sourceFactCount: 3 })).toEqual({ status: "CALCULATED", value: 0 });
  });
});
