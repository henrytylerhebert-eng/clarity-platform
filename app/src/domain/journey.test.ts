import { describe, expect, it } from "vitest";
import { deriveHandoffFeed, deriveJourney, monitoredPhases } from "./journey";
import type { AppState, Case } from "./types";

const NOW = "2026-07-18T12:00:00.000Z";

function emptyState(): AppState {
  return {
    cases: [],
    encounters: [],
    assessments: [],
    sourceReferences: [],
    riskFindings: [],
    medicalNecessitySnapshots: [],
    legalInstruments: [],
    custodyLedgerEvents: [],
    referralPackets: [],
    facilityReferrals: [],
    facilityResponses: [],
    complianceClocks: [],
    units: [],
    beds: [],
    placementRecommendations: [],
    auditLogs: [],
    analyticsEvents: [],
  };
}

function syntheticCase(id: string): Case {
  return {
    id,
    patientToken: { id: `pt-${id}`, displayName: `Synthetic ${id}`, ageBand: "Adult", location: "Synthetic ED" },
    currentStage: "Intake",
    priority: "Urgent",
    openedAt: "2026-07-18T10:00:00.000Z",
    assignedOwner: "synthetic-owner",
    legalStatus: "Unknown",
    packetCompleteness: 0,
    routingStatus: "Draft",
  };
}

function fullPreadmitState(): AppState {
  const state = emptyState();
  const caseId = "case-synthetic-full";
  state.cases.push(syntheticCase(caseId));
  state.encounters.push({
    id: "enc-1",
    caseId,
    mode: "Field",
    startedAt: "2026-07-18T10:05:00.000Z",
    referralSource: "Synthetic ED",
    insuranceStatus: "Verified",
  });
  state.assessments.push({
    id: "as-1",
    caseId,
    mode: "Field",
    presentingProblem: "Synthetic presenting problem",
    precipitatingEvents: "",
    dangerToSelf: "",
    dangerToOthers: "",
    graveDisability: "",
    orientation: "",
    psychosis: "",
    moodSleepAppetite: "",
    psychiatricHistory: "",
    treatmentHistory: "",
    substanceUse: "",
    medicalConcerns: "",
    environmentalStressors: "",
    collateralContacts: "",
    protectiveFactors: "",
    lowerLevelConsidered: "",
    mentalStatus: "",
    collateralStatus: "Documented",
    formulation: "",
    reviewStatus: "Clinician reviewed",
  });
  state.riskFindings.push({
    id: "rf-1",
    caseId,
    type: "Danger to self",
    summary: "Synthetic finding",
    sourceReferenceIds: ["src-1"],
    severity: "High",
    reviewStatus: "Clinician reviewed",
  });
  state.medicalNecessitySnapshots.push({
    id: "mn-1",
    caseId,
    severityEvidence: [],
    functionalImpairment: [],
    lowerLevelConsidered: "",
    missingItems: [],
    draftNarrative: "",
    reviewStatus: "Clinician reviewed",
  });
  state.legalInstruments.push({
    id: "li-1",
    caseId,
    legalStatus: "PEC",
    requiredFactsComplete: true,
    clockStatus: "Active",
    draftText: "",
    reviewStatus: "Counsel validation required",
  });
  state.referralPackets.push({
    id: "pk-1",
    caseId,
    status: "Sent",
    completeness: 96,
    includedArtifactLabels: [],
    packetHash: "hash",
  });
  state.facilityReferrals.push({
    id: "ref-1",
    caseId,
    packetId: "pk-1",
    facilityName: "Synthetic Facility",
    status: "Accepted",
  });
  state.placementRecommendations.push({
    id: "pl-1",
    caseId,
    bedId: "bed-1",
    candidateAcuity: {
      acuityLevel: 3,
      aggressionRisk: "Low",
      elopementRisk: "Low",
      siPrecautions: false,
      vulnerableAdult: false,
      observationLevel: "Routine",
    },
    rationale: "Synthetic",
    status: "Accepted",
  });
  return state;
}

describe("deriveJourney", () => {
  it("orders phases pre-admit through post-discharge and monitors the first three", () => {
    const state = emptyState();
    state.cases.push(syntheticCase("case-a"));
    const reading = deriveJourney(state, "case-a", NOW);
    expect(reading.phases.map((phase) => phase.phase)).toEqual([
      "preadmit",
      "intake",
      "admitted",
      "discharge",
      "postdischarge",
    ]);
    expect(monitoredPhases).toEqual(["preadmit", "intake", "admitted"]);
  });

  it("gives a bare case only the referral milestone and routes next action to the assessment", () => {
    const state = emptyState();
    state.cases.push(syntheticCase("case-a"));
    const reading = deriveJourney(state, "case-a", NOW);
    const preadmit = reading.phases[0];
    expect(preadmit.completed).toBe(1);
    expect(preadmit.percent).toBe(Math.round((1 / preadmit.built) * 100));
    expect(reading.nextAction?.id).toBe("assessment-captured");
    expect(reading.nextAction?.responsibleLabel).toContain("Field responder");
  });

  it("reports 100% pre-admit when every pre-admit artifact is complete and moves next action into intake", () => {
    const state = fullPreadmitState();
    const reading = deriveJourney(state, "case-synthetic-full", NOW);
    const preadmit = reading.phases[0];
    expect(preadmit.percent).toBe(100);
    expect(preadmit.completed).toBe(preadmit.built);
    expect(reading.nextAction?.id).toBe("custody-handoff");
    expect(reading.nextAction?.phase).toBe("intake");
  });

  it("never selects a Not built milestone as the next action", () => {
    const state = fullPreadmitState();
    // Complete the only built intake milestone so the pointer must skip the CIA gap.
    state.custodyLedgerEvents.push({
      id: "cl-1",
      caseId: "case-synthetic-full",
      eventType: "CUSTODY_TRANSFER_RECORDED",
      actor: "Synthetic facility",
      occurredAt: NOW,
      payload: {},
      previousHash: null,
      eventHash: "hash",
    });
    const reading = deriveJourney(state, "case-synthetic-full", NOW);
    expect(reading.nextAction?.status).not.toBe("Not built");
    expect(reading.nextAction?.id).toBe("cec-review");
    expect(reading.buildGaps.some((item) => item.id === "cia-stage-1")).toBe(true);
  });

  it("treats a running CEC clock as in-progress and a CEC record as complete", () => {
    const state = fullPreadmitState();
    state.complianceClocks.push({
      id: "clock-1",
      caseId: "case-synthetic-full",
      label: "CEC review window",
      lane: "Legal",
      startedAt: "2026-07-18T11:00:00.000Z",
      targetMinutes: 4320,
      counselValidationRequired: true,
    });
    let reading = deriveJourney(state, "case-synthetic-full", NOW);
    const cec = () => reading.phases[2].milestones.find((item) => item.id === "cec-review");
    expect(cec()?.status).toBe("In progress");

    state.legalInstruments[0].cec = {
      examinerName: "Synthetic Examiner",
      findings: [],
      conditions: [],
      outcome: "Discharged",
      executedAt: NOW,
      recordFrozenAt: NOW,
    };
    reading = deriveJourney(state, "case-synthetic-full", NOW);
    expect(cec()?.status).toBe("Complete");
    const disposition = reading.phases[3].milestones.find((item) => item.id === "cec-disposition");
    expect(disposition?.status).toBe("Complete");
  });
});

describe("deriveHandoffFeed", () => {
  it("groups next actions by responsible role across cases", () => {
    const state = emptyState();
    state.cases.push(syntheticCase("case-a"), syntheticCase("case-b"));
    const groups = deriveHandoffFeed(state, NOW);
    expect(groups).toHaveLength(1);
    expect(groups[0].responsibleLabel).toContain("Field responder");
    expect(groups[0].items.map((item) => item.caseId).sort()).toEqual(["case-a", "case-b"]);
  });

  it("routes fully pre-admitted cases to the receiving facility for custody handoff", () => {
    const state = fullPreadmitState();
    const groups = deriveHandoffFeed(state, NOW);
    expect(groups[0].responsibleLabel).toBe("Receiving facility");
    expect(groups[0].items[0].milestone.id).toBe("custody-handoff");
  });
});
