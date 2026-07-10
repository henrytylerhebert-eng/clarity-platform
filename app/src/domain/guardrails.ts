import type { Assessment, Case, LegalInstrument, MedicalNecessitySnapshot, RiskFinding } from "./types";

const prohibitedCriteriaPatterns = [
  /meets\s+interqual/i,
  /meets\s+mcg/i,
  /meets\s+criteria/i,
  /meets\s+asam/i,
  /meets\s+locus/i,
  /admission\s+is\s+medically\s+necessary/i,
  /final\s+medical\s+necessity/i,
];

export function findProhibitedLanguage(text: string): string[] {
  return prohibitedCriteriaPatterns
    .filter((pattern) => pattern.test(text))
    .map((pattern) => pattern.source.replace(/\\s\+/g, " "));
}

export function hasProhibitedLanguage(text: string): boolean {
  return findProhibitedLanguage(text).length > 0;
}

export interface PitfallGuard {
  id: string;
  caseId: string;
  severity: "Info" | "Warning" | "Hard stop";
  title: string;
  message: string;
}

interface GuardInput {
  caseRecord: Case;
  assessment?: Assessment;
  riskFindings: RiskFinding[];
  medicalNecessity?: MedicalNecessitySnapshot;
  legalInstrument?: LegalInstrument;
}

export function evaluatePitfallGuards(input: GuardInput): PitfallGuard[] {
  const guards: PitfallGuard[] = [];
  const { caseRecord, assessment, riskFindings, medicalNecessity, legalInstrument } = input;
  const selfHarm = riskFindings.find((risk) => risk.type === "Danger to self");

  if (selfHarm && (!assessment?.formulation || assessment.formulation.trim().length < 24)) {
    guards.push({
      id: `${caseRecord.id}-risk-formulation`,
      caseId: caseRecord.id,
      severity: "Hard stop",
      title: "Risk formulation missing",
      message: "Danger-to-self facts need ideation, plan, intent, means, protective factors, and collateral before final review.",
    });
  }

  if (caseRecord.patientToken.ageBand === "Geriatric" && /confusion|disoriented|abrupt/i.test(assessment?.presentingProblem ?? "")) {
    guards.push({
      id: `${caseRecord.id}-delirium-capacity`,
      caseId: caseRecord.id,
      severity: "Warning",
      title: "Delirium and capacity prompt",
      message: "Abrupt confusion in a geriatric case should prompt delirium differential, baseline cognition, ADL/IADL change, and decision-specific capacity review.",
    });
  }

  if (caseRecord.patientToken.ageBand === "Youth" && assessment?.collateralStatus !== "Documented") {
    guards.push({
      id: `${caseRecord.id}-youth-collateral`,
      caseId: caseRecord.id,
      severity: "Hard stop",
      title: "Youth collateral incomplete",
      message: "Youth cases need guardian/caregiver collateral and means-restriction documentation before discharge or final level-of-care review.",
    });
  }

  if (medicalNecessity && hasProhibitedLanguage(medicalNecessity.draftNarrative)) {
    guards.push({
      id: `${caseRecord.id}-prohibited-language`,
      caseId: caseRecord.id,
      severity: "Hard stop",
      title: "Proprietary criteria language",
      message: "Draft language must not claim InterQual, MCG, ASAM, LOCUS, or final medical necessity without qualified review.",
    });
  }

  if (legalInstrument && legalInstrument.legalStatus !== "Unknown" && !legalInstrument.requiredFactsComplete) {
    guards.push({
      id: `${caseRecord.id}-legal-facts`,
      caseId: caseRecord.id,
      severity: "Warning",
      title: "Legal facts incomplete",
      message: "Legal drafts require source-linked trigger facts. Statutory clocks and attestation language remain counsel-validation required.",
    });
  }

  return guards;
}

export function validateFacilityResponse(response: string, reasonCode?: string): string | null {
  if (response === "Decline" && !reasonCode?.trim()) {
    return "Decline response requires a reason code.";
  }
  return null;
}
