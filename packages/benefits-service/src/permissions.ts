import type { UserRole } from "@clarity/domain-contracts";
import { PermissionDeniedError } from "./errors.js";

/**
 * Benefits role policy (ADR-0009), aligned with the case service's
 * workstream policy: `benefits` belongs to BENEFITS_VERIFICATION_SPECIALIST;
 * `patientEducation` is shared with INTAKE_COORDINATOR.
 *
 * Deliberate exclusions: READ_ONLY_AUDITOR and COMPLIANCE_REVIEWER inspect
 * only; SYSTEM_ADMIN has no case-level operational rights (ADR-0003 posture).
 */
export const BENEFITS_COMMAND_ROLE_POLICY = {
  // Intake often captures the card at the door; the specialist verifies.
  RecordInsuranceCoverage: ["BENEFITS_VERIFICATION_SPECIALIST", "INTAKE_COORDINATOR"],
  VerifyEligibility: ["BENEFITS_VERIFICATION_SPECIALIST"],
  RecordBenefitVerification: ["BENEFITS_VERIFICATION_SPECIALIST"],
  RecordFinancialEducation: ["BENEFITS_VERIFICATION_SPECIALIST", "INTAKE_COORDINATOR"],
} as const satisfies Record<string, readonly UserRole[]>;

export type BenefitsCommandName = keyof typeof BENEFITS_COMMAND_ROLE_POLICY;

export function assertBenefitsPermitted(command: BenefitsCommandName, roles: readonly UserRole[]): void {
  const allowed = BENEFITS_COMMAND_ROLE_POLICY[command];
  if (!roles.some((r) => (allowed as readonly UserRole[]).includes(r))) {
    throw new PermissionDeniedError(command, roles);
  }
}
