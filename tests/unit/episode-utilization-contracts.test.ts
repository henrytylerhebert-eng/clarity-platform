import { describe, expect, it } from "vitest";
import {
  AdmissionHandoffCommandSchema,
  AuthorizationDayDecisionSchema,
  AuthorizationReviewCorrectionSchema,
  AuthorizationReviewSchema,
  CaseEpisodeLinkSchema,
  canTransitionDocumentationGap,
  canTransitionEpisodeStatus,
  DocumentationGapSchema,
  EpisodeAuthorizationSchema,
  EpisodeSchema,
  FacilityTimezoneConfigSchema,
  InclusiveDateRangeSchema,
  serviceDateForInstant,
} from "@clarity/domain-contracts";

const handoff = {
  sourceCaseId: "case-syn-1",
  acceptedFacilityResponseId: "facility-response-syn-1",
  facilityId: "facility-syn-1",
  programId: "program-syn-1",
  unitId: "unit-syn-1",
  admittedAt: "2026-07-19T04:30:00Z",
  facilityTimezone: {
    facilityTimezone: "America/Chicago",
    source: "FACILITY_CONFIGURATION" as const,
    sourceReferenceId: "facility-config-syn-1",
  },
  sourcePacketVersionId: null,
  sourceCustodyEventId: null,
  attestation: { code: "AUTHORIZED_ADMISSION_RECORDED" as const, method: "FACILITY_WORKFLOW" as const },
};

describe("episode contracts", () => {
  it("accepts a synthetic handoff and rejects caller-owned envelope fields", () => {
    expect(AdmissionHandoffCommandSchema.parse(handoff)).toEqual(handoff);
    expect(AdmissionHandoffCommandSchema.parse({ ...handoff, programId: null }).programId).toBeNull();
    for (const field of ["organizationId", "actorId", "roles", "acceptanceDecision"]) {
      expect(AdmissionHandoffCommandSchema.safeParse({ ...handoff, [field]: "forbidden" }).success).toBe(false);
    }
  });

  it("requires facility-owned timezone configuration and derives the facility service date", () => {
    expect(FacilityTimezoneConfigSchema.safeParse({ facilityTimezone: "America/Chicago" }).success).toBe(false);
    expect(serviceDateForInstant(handoff.admittedAt, handoff.facilityTimezone)).toBe("2026-07-18");
    expect(FacilityTimezoneConfigSchema.safeParse({ ...handoff.facilityTimezone, facilityTimezone: "Not/AZone" }).success).toBe(false);
  });

  it("keeps episode lifecycle transitions explicit", () => {
    expect(canTransitionEpisodeStatus("ACTIVE", "DISCHARGED")).toBe(true);
    expect(canTransitionEpisodeStatus("CLOSED", "ACTIVE")).toBe(false);
    expect(
      EpisodeSchema.parse({
        id: "episode-syn-1",
        organizationId: "org-syn-1",
        sourceCaseId: "case-syn-1",
        facilityId: "facility-syn-1",
        programId: "program-syn-1",
        unitId: "unit-syn-1",
        facilityTimezone: handoff.facilityTimezone,
        admittedAt: handoff.admittedAt,
        serviceDate: "2026-07-18",
        status: "ACTIVE",
        version: 1,
        createdAt: "2026-07-19T04:30:00Z",
        updatedAt: "2026-07-19T04:30:00Z",
      }).status,
    ).toBe("ACTIVE");
    expect(
      EpisodeSchema.parse({
        id: "episode-syn-null-program",
        organizationId: "org-syn-1",
        sourceCaseId: "case-syn-1",
        facilityId: "facility-syn-1",
        programId: null,
        unitId: null,
        facilityTimezone: handoff.facilityTimezone,
        admittedAt: handoff.admittedAt,
        serviceDate: "2026-07-18",
        status: "ACTIVE",
        version: 1,
        createdAt: "2026-07-19T04:30:00Z",
        updatedAt: "2026-07-19T04:30:00Z",
      }).programId,
    ).toBeNull();
  });

  it("validates the case-to-episode link shape", () => {
    expect(
      CaseEpisodeLinkSchema.parse({
        organizationId: "org-syn-1",
        caseId: "case-syn-1",
        episodeId: "episode-syn-1",
        relationship: "ADMISSION_SOURCE",
        linkedAt: "2026-07-19T04:35:00Z",
        linkedByActorId: "actor-syn-1",
        sourceAcceptanceId: "facility-response-syn-1",
        sourcePacketVersionId: null,
        sourceCustodyEventId: null,
      }).relationship,
    ).toBe("ADMISSION_SOURCE");
  });
});

describe("episode-owned utilization review contracts", () => {
  it("treats ranges as inclusive and requires start <= end", () => {
    expect(InclusiveDateRangeSchema.parse({ startDate: "2026-07-18", endDate: "2026-07-18" })).toEqual({ startDate: "2026-07-18", endDate: "2026-07-18" });
    expect(InclusiveDateRangeSchema.safeParse({ startDate: "2026-07-19", endDate: "2026-07-18" }).success).toBe(false);
  });

  it("requires controlled denial reasons and rejects reasons on non-denials", () => {
    const base = {
      id: "decision-syn-1",
      organizationId: "org-syn-1",
      authorizationReviewId: "review-syn-1",
      episodeAuthorizationId: "episode-auth-syn-1",
      episodeId: "episode-syn-1",
      startDate: "2026-07-18",
      endDate: "2026-07-18",
      sourceEventId: "event-decision-syn-1",
      supersededByEventId: null,
    };
    expect(AuthorizationDayDecisionSchema.safeParse({ ...base, outcome: "DENIED", denialReasonCode: null }).success).toBe(false);
    expect(AuthorizationDayDecisionSchema.safeParse({ ...base, outcome: "DENIED", denialReasonCode: "DOCUMENTATION_GAP" }).success).toBe(true);
    expect(AuthorizationDayDecisionSchema.safeParse({ ...base, outcome: "APPROVED", denialReasonCode: "DOCUMENTATION_GAP" }).success).toBe(false);
  });

  it("allows only reviewable documentation-gap transitions", () => {
    expect(canTransitionDocumentationGap("OPEN", "ACKNOWLEDGED")).toBe(true);
    expect(canTransitionDocumentationGap("RESOLVED", "REOPENED")).toBe(true);
    expect(canTransitionDocumentationGap("CANCELLED", "OPEN")).toBe(false);
    expect(canTransitionDocumentationGap("SUPERSEDED", "REOPENED")).toBe(false);
    expect(
      EpisodeAuthorizationSchema.parse({
        id: "episode-auth-syn-1",
        organizationId: "org-syn-1",
        episodeId: "episode-syn-1",
        sourceCoverageId: "coverage-syn-1",
        sourcePreAdmissionAuthorizationId: null,
        levelOfCare: "INPATIENT_PSYCHIATRIC",
        requirement: "REQUIRED",
        effectiveStartDate: "2026-07-18",
        status: "OPEN",
        version: 1,
      }).status,
    ).toBe("OPEN");
    expect(
      AuthorizationReviewSchema.parse({
        id: "review-syn-1",
        organizationId: "org-syn-1",
        episodeAuthorizationId: "episode-auth-syn-1",
        episodeId: "episode-syn-1",
        reviewType: "CONCURRENT",
        requestedStartDate: "2026-07-18",
        requestedEndDate: "2026-07-19",
        dueAt: null,
        decisionStatus: "PENDING",
        payerReferenceToken: "synthetic-reference",
        recordedByActorId: "actor-syn-1",
        recordedAt: "2026-07-18T15:00:00-05:00",
        version: 1,
      }).decisionStatus,
    ).toBe("PENDING");
    expect(
      DocumentationGapSchema.parse({
        id: "gap-syn-1",
        organizationId: "org-syn-1",
        episodeId: "episode-syn-1",
        sourceAuthorizationReviewId: "review-syn-1",
        categoryCode: "MISSING_PROGRESS_NOTE",
        operationalSummary: null,
        status: "OPEN",
        dueAt: null,
        assignedRole: "UTILIZATION_REVIEWER",
        assignedUserId: null,
        recordedByActorId: "actor-syn-1",
        resolvedByActorId: null,
        version: 1,
      }).categoryCode,
    ).toBe("MISSING_PROGRESS_NOTE");
  });

  it("requires a superseded event and reason for a review correction", () => {
    const valid = {
      correctionEventId: "event-correction-syn-1",
      authorizationReviewId: "review-syn-1",
      episodeAuthorizationId: "episode-auth-syn-1",
      episodeId: "episode-syn-1",
      supersedesEventId: "event-original-syn-1",
      reasonCode: "PAYER_DATE_RANGE_CORRECTED" as const,
      replacement: {
        id: "review-syn-1-replacement",
        organizationId: "org-syn-1",
        episodeAuthorizationId: "episode-auth-syn-1",
        episodeId: "episode-syn-1",
        reviewType: "CONCURRENT" as const,
        requestedStartDate: "2026-07-18",
        requestedEndDate: "2026-07-19",
        dueAt: null,
        decisionStatus: "APPROVED" as const,
        payerReferenceToken: "synthetic-reference",
        recordedByActorId: "actor-syn-1",
        recordedAt: "2026-07-18T15:00:00-05:00",
        version: 2,
      },
    };
    expect(AuthorizationReviewCorrectionSchema.parse(valid).supersedesEventId).toBe("event-original-syn-1");
    expect(AuthorizationReviewCorrectionSchema.safeParse({ ...valid, supersedesEventId: "" }).success).toBe(false);
  });
});
