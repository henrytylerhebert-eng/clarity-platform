import { describe, expect, it } from "vitest";
import { createDefaultNursingAssessment, isNursingAssessmentComplete } from "./nursingAssessment";
import { deriveJourney, getAdmissionReadiness, getDischargePlan, getPrescreenRecord } from "./journey";
import type { AppState } from "./types";

const NOW = "2026-07-19T12:00:00.000Z";

function state(): AppState {
  return {
    cases: [{
      id: "case-journey",
      patientToken: { id: "pt-journey", displayName: "Synthetic Journey", ageBand: "Adult", location: "Synthetic ED" },
      currentStage: "Intake",
      priority: "Urgent",
      openedAt: NOW,
      assignedOwner: "Intake Coordinator",
      legalStatus: "Unknown",
      packetCompleteness: 0,
      routingStatus: "Draft",
    }],
    encounters: [{ id: "enc-journey", caseId: "case-journey", mode: "Field", startedAt: NOW, referralSource: "Synthetic referral", insuranceStatus: "Pending verification" }],
    assessments: [{
      id: "assessment-journey",
      caseId: "case-journey",
      mode: "Field",
      presentingProblem: "Synthetic presenting concern",
      precipitatingEvents: "Unknown",
      dangerToSelf: "Not assessed",
      dangerToOthers: "Not assessed",
      graveDisability: "Unknown",
      orientation: "Unknown",
      psychosis: "Not assessed",
      moodSleepAppetite: "Unknown",
      psychiatricHistory: "Unknown",
      treatmentHistory: "Unknown",
      substanceUse: "Not assessed",
      medicalConcerns: "Unknown",
      environmentalStressors: "Unknown",
      collateralContacts: "Missing",
      protectiveFactors: "Not assessed",
      lowerLevelConsidered: "Unknown",
      mentalStatus: "Unknown",
      collateralStatus: "Missing",
      formulation: "",
      reviewStatus: "Draft",
    }],
    sourceReferences: [],
    riskFindings: [],
    medicalNecessitySnapshots: [{ id: "mn-journey", caseId: "case-journey", severityEvidence: [], functionalImpairment: [], lowerLevelConsidered: "", missingItems: [], draftNarrative: "Synthetic draft", reviewStatus: "Clinician reviewed" }],
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

describe("journey contracts", () => {
  it("keeps prescreen facts separate from human triage and disposition", () => {
    const current = state();
    current.prescreenRecords = [{
      id: "prescreen-journey",
      caseId: "case-journey",
      referralSource: "Synthetic referral",
      referralReceivedAt: NOW,
      currentLocation: "Synthetic ED",
      presentingConcern: "Synthetic presenting concern",
      immediateSafety: "No immediate concern reported",
      medicalConcerns: "No instability reported",
      custodyContext: "No custody context reported",
      urgency: "Urgent",
      collateralStatus: "Partial",
      triageStatus: "Not started",
      humanDisposition: "Not recorded",
      assignedOwner: "Intake Coordinator",
      nextAction: "Record authorized triage",
      sourceReferenceIds: [],
      updatedAt: NOW,
    }];
    const record = getPrescreenRecord(current, "case-journey");
    expect(record.presentingConcern).toBe("Synthetic presenting concern");
    expect(record.triageStatus).toBe("Not started");
    expect(record.humanDisposition).toBe("Not recorded");
    expect(deriveJourney(current, "case-journey", NOW).nextAction?.id).toBe("human-triage-disposition");
  });

  it("does not count unknown prescreen facts as a completed screen", () => {
    expect(deriveJourney(state(), "case-journey", NOW).nextAction?.id).toBe("initial-screen");
  });

  it("does not infer medical clearance from a reviewed medical-necessity snapshot", () => {
    const current = state();
    const readiness = getAdmissionReadiness(current, "case-journey");
    expect(readiness.medicalClearance.status).toBe("Pending");
    expect(readiness.checkpoints.find((item) => item.kind === "medical-clearance")?.status).toBe("Pending");
    expect(readiness.checkpoints.find((item) => item.kind === "psychiatrist-acceptance")?.status).toBe("Pending");
  });

  it("keeps Stage 2 incomplete until the RN review gates are explicit", () => {
    const current = state();
    current.sourceReferences = [{ id: "source-journey", caseId: "case-journey", type: "Clinician observation", label: "Synthetic nursing source", excerpt: "Synthetic source", confidence: "High" }];
    const record = createDefaultNursingAssessment(current, "case-journey", NOW);
    record.status = "Complete";
    record.completionAttestation = true;
    record.nurseId = "Synthetic RN";
    record.nurseCredentials = "RN";
    record.stage1HandoffStatus = "Reviewed";
    record.reconciliationStatus = "Reconciled";
    record.currentMedicalStability = "Stable for current setting";
    record.medicationReconciliationStatus = "Complete and verified";
    current.nursingAssessments = [record];
    expect(isNursingAssessmentComplete(record)).toBe(true);
    expect(deriveJourney(current, "case-journey", NOW).phases.find((phase) => phase.phase === "intake")?.milestones.find((item) => item.id === "intake-stage-2")?.status).toBe("Complete");

    record.conflictNotes = ["Synthetic unresolved medication conflict"];
    expect(isNursingAssessmentComplete(record)).toBe(false);
  });

  it("keeps discharge planning available before admission and leaves defaults unconfirmed", () => {
    const plan = getDischargePlan(state(), "case-journey");
    expect(plan.status).toBe("In progress");
    expect(plan.domains.map((item) => item.kind)).toEqual(expect.arrayContaining([
      "family-supports",
      "housing",
      "step-down-level",
      "primary-care",
      "psychiatric-medication-management",
    ]));
    expect(plan.domains.find((item) => item.kind === "primary-care")?.status).toBe("Not started");
    expect(plan.domains.find((item) => item.kind === "step-down-level")?.selectedLevelOfCare).toBe("Unknown");
  });

  it("keeps Admit incomplete until each separate checkpoint is satisfied", () => {
    const current = state();
    current.admissionCheckpoints = [
      { id: "acceptance", caseId: "case-journey", kind: "psychiatrist-acceptance", status: "Accepted", owner: "Receiving psychiatrist", reviewAuthority: "Psychiatrist", note: "Synthetic acceptance", sourceArtifactIds: [], updatedAt: NOW },
      { id: "clearance", caseId: "case-journey", kind: "medical-clearance", status: "Approved", owner: "Medical reviewer", reviewAuthority: "Medical reviewer", note: "Synthetic clearance", sourceArtifactIds: [], updatedAt: NOW },
      { id: "operational", caseId: "case-journey", kind: "operational-readiness", status: "Complete", owner: "Facility", reviewAuthority: "Facility", note: "Synthetic operational readiness", sourceArtifactIds: [], updatedAt: NOW },
      { id: "arrival", caseId: "case-journey", kind: "arrival-handoff", status: "Complete", owner: "Receiving nurse", reviewAuthority: "Receiving nurse", note: "Synthetic arrival", sourceArtifactIds: [], updatedAt: NOW },
    ];
    const admit = deriveJourney(current, "case-journey", NOW).phases.find((phase) => phase.phase === "admit");
    expect(admit?.milestones.find((item) => item.id === "admit-psychiatrist-acceptance")?.status).toBe("Complete");
    expect(admit?.milestones.find((item) => item.id === "admit-medical-clearance")?.status).toBe("Complete");
    expect(admit?.milestones.find((item) => item.id === "admit-admission-episode")?.status).toBe("Pending");
    expect(admit?.percent).toBeLessThan(100);

    current.admissionEpisodes = [{
      id: "episode-case-journey",
      caseId: "case-journey",
      sourceAcceptanceId: "acceptance",
      relationship: "ADMISSION_SOURCE",
      facilityId: "facility-synthetic",
      facilityName: "Synthetic Facility",
      unitId: "unit-synthetic",
      facilityTimezone: "America/Chicago",
      timezoneSourceReferenceId: "facility-config-synthetic",
      admittedAt: NOW,
      serviceDate: "2026-07-19",
      status: "ACTIVE",
      admissionOrdersStatus: "Recorded",
      initialPostAdmissionReviewStatus: "Recorded",
      sourceReferenceIds: [],
      linkedAt: NOW,
      linkedBy: "Synthetic receiving nurse",
      updatedAt: NOW,
    }];
    const completeAdmit = deriveJourney(current, "case-journey", NOW).phases.find((phase) => phase.phase === "admit");
    expect(completeAdmit?.milestones.find((item) => item.id === "admit-admission-episode")?.status).toBe("Complete");
  });

  it("uses review-gated language for regulated transitions", () => {
    const text = JSON.stringify(deriveJourney(state(), "case-journey", NOW));
    expect(text).toMatch(/authorized|review|separate/i);
    expect(text).not.toMatch(/automatically admitted|medically cleared by the system|level of care determined/i);
  });
});
