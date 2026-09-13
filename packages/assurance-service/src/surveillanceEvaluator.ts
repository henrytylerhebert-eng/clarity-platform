import type {
  AssuranceEvaluationResult,
  MedicationRoomBlueprintDefinition,
  SurveillanceAssessmentProposal,
  SurveillanceEvidenceRequestStatus,
  SurveillanceEvidenceType,
  SurveillanceVerificationMode,
} from "@clarity/domain-contracts";
import { evaluateSurveillanceRule, type SurveillanceFacts } from "./surveillanceRuleEngine.js";

export interface SubmittedEvidenceDescriptor {
  readonly requestId: string;
  readonly requirementCode: string;
  readonly evidenceType: SurveillanceEvidenceType;
  readonly verificationMode: SurveillanceVerificationMode;
  readonly status: "AVAILABLE" | "ACCEPTED" | "REJECTED_QUALITY" | "SUPERSEDED";
  readonly payload: Readonly<Record<string, unknown>>;
}

export interface RuntimeEvidenceRequestDescriptor {
  readonly requestId: string;
  readonly criterionCode: string;
  readonly requirementCode: string;
  readonly evidenceType: SurveillanceEvidenceType;
  readonly verificationMode: SurveillanceVerificationMode;
  readonly status: SurveillanceEvidenceRequestStatus;
}

export function assessMedicationRoomCriterion(
  blueprint: MedicationRoomBlueprintDefinition,
  criterionCode: "C1" | "C2" | "C3" | "C4",
  facts: SurveillanceFacts,
  requests: readonly RuntimeEvidenceRequestDescriptor[],
  evidence: readonly SubmittedEvidenceDescriptor[],
): SurveillanceAssessmentProposal {
  const criterion = blueprint.criteria.find((item) => item.code === criterionCode);
  if (!criterion || !evaluateSurveillanceRule(criterion.activationRule, facts)) {
    return { criterionCode, result: "UNKNOWN", reasonCodes: ["CRITERION_INACTIVE"], missingRequirementCodes: [] };
  }

  const activeRequirementCodes = new Set(
    blueprint.evidenceRequirements
      .filter((requirement) => requirement.criterionCode === criterionCode)
      .filter((requirement) => {
        if (requirement.requirementLevel !== "CONDITIONAL") return true;
        return requirement.conditionalRule ? evaluateSurveillanceRule(requirement.conditionalRule, facts) : false;
      })
      .filter((requirement) => requirement.requirementLevel !== "OPTIONAL")
      .map((requirement) => requirement.code),
  );

  const acceptedByRequirement = new Map<string, SubmittedEvidenceDescriptor[]>();
  for (const item of evidence) {
    if (!activeRequirementCodes.has(item.requirementCode)) continue;
    if (item.status !== "AVAILABLE" && item.status !== "ACCEPTED") continue;
    const prior = acceptedByRequirement.get(item.requirementCode) ?? [];
    prior.push(item);
    acceptedByRequirement.set(item.requirementCode, prior);
  }

  const missing = [...activeRequirementCodes].filter((code) => !acceptedByRequirement.has(code));
  if (missing.length === 0) {
    return { criterionCode, result: "SUPPORTED", reasonCodes: ["EVIDENCE_COMPLETE"], missingRequirementCodes: [] };
  }

  const requestCodes = new Set(requests.filter((request) => request.criterionCode === criterionCode).map((request) => request.requirementCode));
  const submittedCount = [...activeRequirementCodes].filter((code) => acceptedByRequirement.has(code)).length;
  const result: AssuranceEvaluationResult = submittedCount > 0 ? "PARTIALLY_SUPPORTED" : "MISSING_EVIDENCE";
  return {
    criterionCode,
    result,
    reasonCodes: [submittedCount > 0 ? "EVIDENCE_PARTIAL" : "EVIDENCE_NOT_SUBMITTED"],
    missingRequirementCodes: missing.filter((code) => requestCodes.has(code)),
  };
}
