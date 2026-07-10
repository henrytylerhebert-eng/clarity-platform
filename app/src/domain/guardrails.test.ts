import { describe, expect, it } from "vitest";
import { evaluatePitfallGuards, hasProhibitedLanguage, validateFacilityResponse } from "./guardrails";
import type { Assessment, Case, LegalInstrument, MedicalNecessitySnapshot, RiskFinding } from "./types";

const baseCase: Case = {
  id: "case-test",
  patientToken: { id: "pt-test", displayName: "Demo", ageBand: "Adult", location: "ED" },
  currentStage: "Assessment",
  priority: "Urgent",
  openedAt: "2026-07-08T00:00:00.000Z",
  assignedOwner: "Tester",
  legalStatus: "Unknown",
  packetCompleteness: 20,
  routingStatus: "Draft",
};

const baseAssessment: Assessment = {
  id: "assessment-test",
  caseId: "case-test",
  mode: "Clinical",
  presentingProblem: "Safety concern",
  precipitatingEvents: "Unknown",
  dangerToSelf: "Not assessed",
  dangerToOthers: "Not assessed",
  graveDisability: "Unknown",
  orientation: "Unknown",
  psychosis: "Not assessed",
  moodSleepAppetite: "No measurements found",
  psychiatricHistory: "Unknown",
  treatmentHistory: "Unknown",
  substanceUse: "Not assessed",
  medicalConcerns: "Unknown",
  environmentalStressors: "Unknown",
  collateralContacts: "Missing",
  protectiveFactors: "Not assessed",
  lowerLevelConsidered: "Unknown",
  mentalStatus: "Unknown",
  collateralStatus: "Partial",
  formulation: "",
  reviewStatus: "Draft",
};

const selfHarmRisk: RiskFinding = {
  id: "risk-test",
  caseId: "case-test",
  type: "Danger to self",
  summary: "Suicidal statements",
  sourceReferenceIds: ["src-test"],
  severity: "High",
  reviewStatus: "Draft",
};

const baseMedicalNecessity: MedicalNecessitySnapshot = {
  id: "mn-test",
  caseId: "case-test",
  severityEvidence: ["Documented risk of harm"],
  functionalImpairment: ["Documented functional impairment"],
  lowerLevelConsidered: "Unknown",
  missingItems: ["Protective factors"],
  draftNarrative: "The documentation may support clinician review for inpatient level of care.",
  reviewStatus: "Needs clinician review",
};

const baseLegalInstrument: LegalInstrument = {
  id: "legal-test",
  caseId: "case-test",
  legalStatus: "PEC",
  requiredFactsComplete: true,
  clockStatus: "Display only",
  draftText: "Draft only.",
  reviewStatus: "Counsel validation required",
};

describe("guardrails", () => {
  it("triggers adult SI missing formulation guard", () => {
    const guards = evaluatePitfallGuards({
      caseRecord: baseCase,
      assessment: baseAssessment,
      riskFindings: [selfHarmRisk],
    });
    expect(guards.some((guard) => guard.id.includes("risk-formulation"))).toBe(true);
  });

  it("triggers geriatric delirium/capacity guard", () => {
    const guards = evaluatePitfallGuards({
      caseRecord: { ...baseCase, patientToken: { ...baseCase.patientToken, ageBand: "Geriatric" } },
      assessment: { ...baseAssessment, presentingProblem: "Abrupt confusion and disoriented behavior", formulation: "Long enough formulation text for this test." },
      riskFindings: [],
    });
    expect(guards.some((guard) => guard.id.includes("delirium-capacity"))).toBe(true);
  });

  it("triggers youth collateral guard", () => {
    const guards = evaluatePitfallGuards({
      caseRecord: { ...baseCase, patientToken: { ...baseCase.patientToken, ageBand: "Youth" } },
      assessment: { ...baseAssessment, collateralStatus: "Missing", formulation: "Long enough formulation text for this test." },
      riskFindings: [],
    });
    expect(guards.some((guard) => guard.id.includes("youth-collateral"))).toBe(true);
  });

  it("flags prohibited criteria language", () => {
    expect(hasProhibitedLanguage("Patient meets InterQual criteria.")).toBe(true);
    expect(hasProhibitedLanguage("Patient meets criteria.")).toBe(true);
    expect(hasProhibitedLanguage("This is final medical necessity.")).toBe(true);
    expect(hasProhibitedLanguage("Documentation supports clinician review.")).toBe(false);
  });

  it("requires decline reason code", () => {
    expect(validateFacilityResponse("Decline", "")).toBe("Decline response requires a reason code.");
    expect(validateFacilityResponse("Decline", "acuity_too_high")).toBeNull();
  });

  it("keeps medical necessity output review-gated", () => {
    expect(baseMedicalNecessity.reviewStatus).toBe("Needs clinician review");
    expect(baseMedicalNecessity.draftNarrative).toContain("clinician review");
  });

  it("keeps legal draft counsel-review gated", () => {
    expect(baseLegalInstrument.reviewStatus).toBe("Counsel validation required");
    expect(baseLegalInstrument.clockStatus).toBe("Display only");
  });
});
