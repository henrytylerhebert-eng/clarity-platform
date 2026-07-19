/**
 * Local operations configuration for the synthetic POC.
 *
 * These profiles describe which verification questions an operations team may
 * want to ask. They are not payer policy, current-patient verification, or an
 * authorization decision. The backend PayerProfile/PlanProfile management
 * boundary remains deferred until the revenue-cycle owner approves it.
 */

export type OperationsPayerProfileId = "medicare" | "medicaid" | "va" | "commercial";

export type OperationsPayerProfileReviewStatus = "Pending domain-owner review";

export const OPERATIONS_PAYER_CANONICAL_REFERENCES = [
  "prisma/schema.prisma — PayerProfile, PlanProfile, InsuranceCoverage",
  "packages/domain-contracts/src/benefits.ts — evidence, verification, and disclaimer contract",
  "docs/architecture/ADR-0009-manual-insurance-benefits-verification.md — manual verification boundary",
  "docs/architecture/ADR-0010-authorization-readiness.md — readiness and human-submission boundary",
] as const;

export interface OperationsPayerConfigurationProfile {
  readonly id: OperationsPayerProfileId;
  readonly label: string;
  readonly coverageTypeLabel: string;
  /** The existing shared enum has no VA value; VA stays local until that contract is approved. */
  readonly coverageTypes: readonly string[];
  readonly version: "operations-poc-v1";
  readonly reviewStatus: OperationsPayerProfileReviewStatus;
  readonly verificationPrompts: readonly string[];
  readonly escalationLanguage: string;
}

export const OPERATIONS_PAYER_CONFIGURATION_PROFILES: readonly OperationsPayerConfigurationProfile[] = [
  {
    id: "medicare",
    label: "Medicare operations profile",
    coverageTypeLabel: "Medicare",
    coverageTypes: ["MEDICARE", "MEDICARE_ADVANTAGE"],
    version: "operations-poc-v1",
    reviewStatus: "Pending domain-owner review",
    verificationPrompts: [
      "Confirm the current coverage category and eligibility source.",
      "Confirm the inpatient behavioral-health benefit for this case.",
      "Confirm any service-specific authorization or notification requirement.",
    ],
    escalationLanguage: "Escalate unresolved eligibility, benefit, or authorization questions to the authorized benefits/UR reviewer.",
  },
  {
    id: "medicaid",
    label: "Medicaid operations profile",
    coverageTypeLabel: "Medicaid",
    coverageTypes: ["MEDICAID"],
    version: "operations-poc-v1",
    reviewStatus: "Pending domain-owner review",
    verificationPrompts: [
      "Confirm the state or managed-plan identity and current eligibility source.",
      "Confirm the behavioral-health administrator or carve-out, if applicable.",
      "Confirm any service-specific authorization or notification requirement.",
    ],
    escalationLanguage: "Escalate unresolved plan, carve-out, or authorization questions to the authorized benefits/UR reviewer.",
  },
  {
    id: "va",
    label: "VA operations profile",
    coverageTypeLabel: "VA care pathway",
    // VA is not silently represented as TRICARE. The shared persistence enum
    // needs an owner decision before a durable VA category is introduced.
    coverageTypes: ["OTHER"],
    version: "operations-poc-v1",
    reviewStatus: "Pending domain-owner review",
    verificationPrompts: [
      "Confirm VA eligibility and the applicable referral or authorization pathway.",
      "Confirm the receiving service and facility relationship for this case.",
      "Record the current source and unresolved requirements before transfer planning.",
    ],
    escalationLanguage: "Escalate unresolved VA eligibility or referral-pathway questions to the designated benefits/UR and facility reviewers.",
  },
  {
    id: "commercial",
    label: "Commercial operations profile",
    coverageTypeLabel: "Commercial",
    coverageTypes: ["COMMERCIAL"],
    version: "operations-poc-v1",
    reviewStatus: "Pending domain-owner review",
    verificationPrompts: [
      "Confirm the exact payer and plan identity from approved source evidence.",
      "Confirm network relationship for the proposed service and facility.",
      "Confirm the service-specific benefit and authorization or notification requirement.",
    ],
    escalationLanguage: "Escalate unresolved plan, network, or authorization questions to the authorized benefits/UR reviewer.",
  },
];

export function getOperationsPayerProfile(
  profileId: OperationsPayerProfileId,
): OperationsPayerConfigurationProfile {
  const profile = OPERATIONS_PAYER_CONFIGURATION_PROFILES.find((item) => item.id === profileId);
  if (!profile) throw new Error(`Unknown operations payer profile: ${profileId}`);
  return profile;
}
