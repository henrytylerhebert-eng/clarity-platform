import type { CandidateField, ReviewState } from "./types";

export interface ReviewRequirement {
  roles: string[];
  mode: "ANY" | "ALL_DISTINCT";
}

const SENSITIVE_ROUTES: Array<{ prefix: string; requirement: ReviewRequirement }> = [
  { prefix: "facilityAdmissionProfiles.acceptanceAuthority", requirement: { roles: ["FACILITY_CLINICAL_GOVERNANCE", "FACILITY_LEGAL_COMPLIANCE"], mode: "ALL_DISTINCT" } },
  { prefix: "facilityAdmissionProfiles.labRequirements", requirement: { roles: ["FACILITY_CLINICAL_GOVERNANCE"], mode: "ANY" } },
  { prefix: "facilityAdmissionProfiles.inclusionCriteria", requirement: { roles: ["FACILITY_CLINICAL_GOVERNANCE"], mode: "ANY" } },
  { prefix: "facilityAdmissionProfiles.exclusionCriteria", requirement: { roles: ["FACILITY_CLINICAL_GOVERNANCE"], mode: "ANY" } },
  { prefix: "facilityAdmissionProfiles.legalStatuses", requirement: { roles: ["FACILITY_LEGAL_COMPLIANCE"], mode: "ANY" } },
  { prefix: "facilityAdmissionProfiles.guardianRequirements", requirement: { roles: ["FACILITY_LEGAL_COMPLIANCE"], mode: "ANY" } },
  { prefix: "transportCapabilityProfiles", requirement: { roles: ["FACILITY_OPERATIONS", "FACILITY_LEGAL_COMPLIANCE"], mode: "ALL_DISTINCT" } },
  { prefix: "payerParticipation", requirement: { roles: ["PAYER_BENEFITS_REVIEWER"], mode: "ANY" } },
  { prefix: "organization.license", requirement: { roles: ["COMPLIANCE_REVIEWER"], mode: "ANY" } }
];

export function reviewRequirement(fieldPath: string): ReviewRequirement {
  return SENSITIVE_ROUTES.find(x => fieldPath.startsWith(x.prefix))?.requirement ?? { roles: ["NETWORK_REVIEWER"], mode: "ANY" };
}

export function requiredReviewerRoles(fieldPath: string): string[] {
  return reviewRequirement(fieldPath).roles;
}

export function canAgentReplace(reviewState: ReviewState): boolean {
  return reviewState !== "HUMAN_CONFIRMED";
}

export function enforceCandidatePolicy(candidate: CandidateField): string[] {
  const errors: string[] = [];
  if (candidate.reviewState === "HUMAN_CONFIRMED") errors.push("Agents cannot create HUMAN_CONFIRMED candidate fields.");
  const required = requiredReviewerRoles(candidate.fieldPath);
  for (const role of required) if (!candidate.proposedReviewerRoles.includes(role)) errors.push(`Missing required reviewer role ${role}.`);
  if (required.some(r => r !== "NETWORK_REVIEWER") && candidate.operationalUseStatus !== "REQUIRES_REVIEW") {
    errors.push("Sensitive fields must remain REQUIRES_REVIEW until an authorized human decision.");
  }
  return errors;
}
