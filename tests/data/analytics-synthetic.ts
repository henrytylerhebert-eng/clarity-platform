import type {
  EpisodeDayDerivationInput,
  GovernedEventEnvelope,
} from "@clarity/domain-contracts";

export const syntheticEpisodeDayInput: EpisodeDayDerivationInput = {
  serviceDate: "2026-07-18",
  facilityTimezone: {
    facilityTimezone: "America/Chicago",
    source: "FACILITY_CONFIGURATION",
    sourceReferenceId: "facility-config-syn-1",
  },
  requirement: "REQUIRED",
  activeDecisionRanges: [],
  latestApprovedEndDate: null,
  reviewDueAt: null,
  openDocumentationGapIds: [],
  sourceDisagreement: false,
  dataIncomplete: false,
  lineageSourceEventIds: ["event-source-syn-1"],
  evaluationAt: "2026-07-18T15:00:00-05:00",
  thresholds: {
    reviewDueSoonHours: 24,
    authorizationExpiresSoonDays: 1,
  },
  derivationVersion: "s1.0.0-draft",
};

export const syntheticOriginalEvent: GovernedEventEnvelope = {
  eventId: "event-original-syn-1",
  schema: { name: "clarity.governed-event", version: "1.0.0" },
  eventType: { name: "AUTHORIZATION_REVIEW_RECORDED", version: 1 },
  aggregate: { type: "AUTHORIZATION_REVIEW", id: "review-syn-1", version: 1 },
  tenant: { organizationId: "org-syn-1", facilityId: "facility-syn-1", programId: "program-syn-1", unitId: null },
  subject: { caseId: "case-syn-1", episodeId: "episode-syn-1", episodeDayId: null, personToken: "person-syn-1" },
  times: {
    effectiveAt: "2026-07-18T14:00:00-05:00",
    recordedAt: "2026-07-18T14:05:00-05:00",
    receivedAt: null,
  },
  actor: { type: "USER", id: "actor-syn-1", displayRole: "UTILIZATION_REVIEWER", sessionId: "session-syn-1" },
  source: {
    kind: "HUMAN_ATTESTATION",
    system: "synthetic-clinical-workflow",
    sourceTenantKey: null,
    sourceEventId: "source-review-syn-1",
    sourceEventVersion: "1",
    adapterName: "synthetic-fixture",
    adapterVersion: "1",
    method: "SYNTHETIC_TEST",
    provenanceRefs: [],
  },
  correlation: { correlationId: "correlation-syn-1", causationId: null, commandId: "command-syn-1" },
  classification: "PUBLIC_SYNTHETIC",
  quality: { state: "VALID", issues: [] },
  review: { state: "ATTESTED", reviewedByActorId: "actor-syn-1", reviewedAt: "2026-07-18T14:05:00-05:00", attestationCode: "SYNTHETIC" },
  correction: { kind: "ORIGINAL", supersedesEventId: null, reasonCode: null },
  metricEligibility: "ELIGIBLE_WITH_WARNING",
  payloadHash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  payload: { decisionStatus: "PENDING", synthetic: true },
};
