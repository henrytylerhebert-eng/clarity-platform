import { describe, expect, it } from "vitest";
import {
  ClinicalDischargeReadinessDecisionSchema,
  DischargePlanVersionSchema,
  LevelOfCareRecommendationSchema,
  TransitionBarrierSchema,
  canTransitionCareTransitionSlice,
  canTransitionDischargePlan,
  canTransitionTransitionBarrier,
  deriveBarrierAging,
  deriveContinuityWindow,
  deriveLevelOfCareProfile,
  deriveLongitudinalCareJourneyProjection,
  derivePendingDischarge,
  deriveTransitionReadiness,
  evaluateLongitudinalAuthority,
} from "@clarity/domain-contracts";
import { DAY_1_TO_39 } from "../data/longitudinal-day1-day39.js";

const ref = (type: string, id: string) => ({ type, id, version: null });

describe("longitudinal vertical slice v0.1", () => {
  it("validates the Day 1 discharge plan without treating target date as actual discharge", () => {
    const parsed = DischargePlanVersionSchema.parse(DAY_1_TO_39.dischargePlan);
    expect(parsed.targetDischargeDate).toBe("2026-09-07");
    expect("actualDischargeAt" in parsed).toBe(false);
  });

  it("keeps clinical level-of-care recommendation append-only and separate from payer/actual truth", () => {
    const recs = DAY_1_TO_39.locRecommendations.map((record) =>
      LevelOfCareRecommendationSchema.parse(record),
    );
    expect(recs.map((record) => record.recommendedLevelCode)).toEqual(["INPATIENT", "IOP"]);
    expect(recs[1]?.supersedesRecommendationId).toBe(recs[0]?.id);

    const profile = deriveLevelOfCareProfile({
      clinicalRecommendation: { levelCode: "IOP", sourceDecisionId: "loc-rec-iop" },
      payerAuthorization: { levelCode: "IOP", sourceRef: ref("SYNTHETIC_PAYER", "payer-day7") },
      availability: {
        levelCode: "IOP",
        state: "UNAVAILABLE",
        sourceRef: ref("SYNTHETIC_AVAILABILITY", "iop-availability-day6"),
      },
      patientPreference: { levelCode: "IOP", sourceRef: ref("SYNTHETIC_PREFERENCE", "pref-iop") },
      actual: { levelCode: "INPATIENT", sourceRef: ref("SYNTHETIC_SETTING", "inpatient-day6") },
    });

    expect(profile.clinicalRecommendation?.levelCode).toBe("IOP");
    expect(profile.payerAuthorization?.levelCode).toBe("IOP");
    expect(profile.availability?.state).toBe("UNAVAILABLE");
    expect(profile.patientPreference?.levelCode).toBe("IOP");
    expect(profile.actual?.levelCode).toBe("INPATIENT");
    expect("score" in profile).toBe(false);
  });

  it("derives pending discharge from the human readiness decision rather than persisting a status", () => {
    DAY_1_TO_39.readinessDecisions.forEach((decision) =>
      ClinicalDischargeReadinessDecisionSchema.parse(decision),
    );

    const day6 = derivePendingDischarge({
      readinessDecisions: DAY_1_TO_39.readinessDecisions,
      actualDischargeFacts: [],
      evaluationAt: DAY_1_TO_39.day6,
    });
    expect(day6).toMatchObject({
      state: "PENDING",
      intervalStartAt: DAY_1_TO_39.day6,
      intervalEndAt: null,
    });

    const day9 = derivePendingDischarge({
      readinessDecisions: DAY_1_TO_39.readinessDecisions,
      actualDischargeFacts: DAY_1_TO_39.actualDischargeFacts,
      evaluationAt: DAY_1_TO_39.day9,
    });
    expect(day9).toMatchObject({
      state: "ENDED_BY_DISCHARGE",
      intervalStartAt: DAY_1_TO_39.day6,
      intervalEndAt: DAY_1_TO_39.day9,
      sourceDischargeFactId: "discharge-fact-day9",
    });
  });

  it("does not infer actual discharge from the plan target date", () => {
    const onTargetDate = derivePendingDischarge({
      readinessDecisions: DAY_1_TO_39.readinessDecisions,
      actualDischargeFacts: [],
      evaluationAt: DAY_1_TO_39.day7,
    });
    expect(onTargetDate.state).toBe("PENDING");
    expect(onTargetDate.sourceDischargeFactId).toBeNull();
  });

  it("derives barrier age and caps it at the observed resolution time", () => {
    TransitionBarrierSchema.parse(DAY_1_TO_39.barrierDay6);
    TransitionBarrierSchema.parse(DAY_1_TO_39.barrierDay8);

    expect(deriveBarrierAging(DAY_1_TO_39.barrierDay6, DAY_1_TO_39.day7).ageDays).toBe(1);
    expect(deriveBarrierAging(DAY_1_TO_39.barrierDay8, DAY_1_TO_39.day16)).toMatchObject({
      ageDays: 2,
      resolved: true,
    });
  });

  it("keeps barrier waiting-state evidence separate from causal blame", () => {
    const parsed = TransitionBarrierSchema.parse(DAY_1_TO_39.barrierDay6);
    expect(parsed.waitingOnPartyRef?.id).toBe("iop-provider-001");
    expect("causedBy" in parsed).toBe(false);
    expect("primaryBarrier" in parsed).toBe(false);
  });

  it("derives transition readiness from independent components", () => {
    expect(deriveTransitionReadiness(DAY_1_TO_39.readinessDay6)).toEqual({
      executionState: "BLOCKED",
      blockedComponents: ["DESTINATION"],
      unknownComponents: [],
    });
    expect(deriveTransitionReadiness(DAY_1_TO_39.readinessDay8)).toEqual({
      executionState: "READY",
      blockedComponents: [],
      unknownComponents: [],
    });
  });

  it("preserves unknown continuity when source coverage is incomplete", () => {
    const projection = deriveContinuityWindow({
      events: DAY_1_TO_39.continuityEvents,
      eventType: "READMISSION_RECORDED",
      windowStartAt: DAY_1_TO_39.day9,
      windowEndAt: DAY_1_TO_39.day39,
      sourceCoverageCompleteness: "PARTIAL",
    });
    expect(projection.status).toBe("UNKNOWN");
    expect(projection.observedEventIds).toEqual([]);
  });

  it("can say none observed only when coverage is explicitly complete for the window", () => {
    const projection = deriveContinuityWindow({
      events: DAY_1_TO_39.continuityEvents,
      eventType: "ED_VISIT_RECORDED",
      windowStartAt: DAY_1_TO_39.day9,
      windowEndAt: DAY_1_TO_39.day16,
      sourceCoverageCompleteness: "COMPLETE_FOR_WINDOW",
    });
    expect(projection.status).toBe("NONE_OBSERVED_WITH_COMPLETE_COVERAGE");
  });

  it("observes the next level of care without converting it into a continuity score", () => {
    const projection = deriveContinuityWindow({
      events: DAY_1_TO_39.continuityEvents,
      eventType: "NEXT_LEVEL_OF_CARE_STARTED",
      windowStartAt: DAY_1_TO_39.day9,
      windowEndAt: DAY_1_TO_39.day16,
      sourceCoverageCompleteness: "PARTIAL",
    });
    expect(projection.status).toBe("OBSERVED");
    expect(projection.observedEventIds).toEqual(["continuity-iop-start-day10"]);
    expect("score" in projection).toBe(false);
  });

  it("evaluates clinical authority from a configured policy instead of hard-coding a qualified role", () => {
    const allowed = evaluateLongitudinalAuthority({
      actorId: "actor-clinician-001",
      actorRoleCodes: ["CLINICAL_REVIEWER"],
      policy: DAY_1_TO_39.clinicalAuthorityPolicy,
    });
    expect(allowed.allowed).toBe(true);

    const denied = evaluateLongitudinalAuthority({
      actorId: "actor-intake-001",
      actorRoleCodes: ["INTAKE_COORDINATOR"],
      policy: DAY_1_TO_39.clinicalAuthorityPolicy,
    });
    expect(denied.allowed).toBe(false);
  });

  it("proves only the intended candidate lifecycle transitions", () => {
    expect(canTransitionDischargePlan("ACTIVE", "READY_FOR_EXECUTION")).toBe(true);
    expect(canTransitionDischargePlan("COMPLETED", "ACTIVE")).toBe(false);
    expect(canTransitionTransitionBarrier("RESOLVED", "REOPENED")).toBe(true);
    expect(canTransitionTransitionBarrier("CANCELLED", "OPEN")).toBe(false);
    expect(canTransitionCareTransitionSlice("PREPARING", "READY")).toBe(true);
    expect(canTransitionCareTransitionSlice("EXECUTED", "PREPARING")).toBe(false);
  });

  it("builds a projection-first longitudinal journey without a parent aggregate id", () => {
    const journey = deriveLongitudinalCareJourneyProjection({
      patientToken: DAY_1_TO_39.patientToken,
      accessCaseIds: [DAY_1_TO_39.accessCaseId],
      inpatientEpisodeIds: [DAY_1_TO_39.episodeId],
      careTransitionIds: [DAY_1_TO_39.careTransitionId],
      continuityEventIds: DAY_1_TO_39.continuityEvents.map((event) => event.eventId),
    });
    expect(journey.inpatientEpisodeIds).toEqual([DAY_1_TO_39.episodeId]);
    expect("id" in journey).toBe(false);
    expect("status" in journey).toBe(false);
  });
});
