import type { UserRole, Workstream } from "@clarity/domain-contracts";
import { PermissionDeniedError } from "./errors.js";

/**
 * Role policy for case commands (docs/governance/HUMAN_APPROVAL_GATES.md).
 *
 * Deliberate exclusions:
 * - READ_ONLY_AUDITOR may execute no command (inspect-only).
 * - COMPLIANCE_REVIEWER may record rationale (inspection notes) but may not
 *   alter case state, statuses, or workstream conclusions.
 * - SYSTEM_ADMIN is platform administration, not clinical operations — it has
 *   no case-command rights.
 */
export const COMMAND_ROLE_POLICY = {
  CreateCase: ["INTAKE_COORDINATOR", "ORGANIZATION_ADMIN"],
  AssignCase: ["INTAKE_COORDINATOR", "ORGANIZATION_ADMIN"],
  UpdateCaseUrgency: ["INTAKE_COORDINATOR", "CLINICAL_REVIEWER", "PHYSICIAN_REVIEWER"],
  UpdateCaseLocation: ["INTAKE_COORDINATOR", "TRANSPORT_COORDINATOR"],
  TransitionCase: ["INTAKE_COORDINATOR", "ORGANIZATION_ADMIN"],
  UpdateWorkstreamStatus: [], // resolved per-workstream below
  RecordDecisionRationale: [
    "ORGANIZATION_ADMIN",
    "INTAKE_COORDINATOR",
    "CLINICAL_REVIEWER",
    "PHYSICIAN_REVIEWER",
    "UTILIZATION_REVIEWER",
    "LEGAL_REVIEWER",
    "BENEFITS_VERIFICATION_SPECIALIST",
    "AUTHORIZATION_SPECIALIST",
    "FACILITY_REVIEWER",
    "TRANSPORT_COORDINATOR",
    "COMPLIANCE_REVIEWER",
  ],
  CloseCase: ["INTAKE_COORDINATOR", "ORGANIZATION_ADMIN"],
  ReopenCase: ["ORGANIZATION_ADMIN"],
} as const satisfies Record<string, readonly UserRole[]>;

export type CommandName = keyof typeof COMMAND_ROLE_POLICY;

/** Which roles may move each parallel workstream. */
export const WORKSTREAM_ROLE_POLICY: Record<Workstream, readonly UserRole[]> = {
  clinical: ["CLINICAL_REVIEWER", "PHYSICIAN_REVIEWER"],
  legalReview: ["LEGAL_REVIEWER"],
  medicalScreening: ["PHYSICIAN_REVIEWER", "CLINICAL_REVIEWER"],
  benefits: ["BENEFITS_VERIFICATION_SPECIALIST"],
  authorization: ["AUTHORIZATION_SPECIALIST", "UTILIZATION_REVIEWER"],
  placement: ["INTAKE_COORDINATOR", "FACILITY_REVIEWER"],
  transportation: ["TRANSPORT_COORDINATOR", "INTAKE_COORDINATOR"],
  patientEducation: ["BENEFITS_VERIFICATION_SPECIALIST", "INTAKE_COORDINATOR"],
};

export function assertPermitted(command: CommandName, roles: readonly UserRole[]): void {
  const allowed = COMMAND_ROLE_POLICY[command];
  if (!roles.some((r) => (allowed as readonly UserRole[]).includes(r))) {
    throw new PermissionDeniedError(command, roles);
  }
}

export function assertWorkstreamPermitted(workstream: Workstream, roles: readonly UserRole[]): void {
  const allowed = WORKSTREAM_ROLE_POLICY[workstream];
  if (!roles.some((r) => allowed.includes(r))) {
    throw new PermissionDeniedError(`UpdateWorkstreamStatus(${workstream})`, roles);
  }
}
