import type { UserRole } from "@clarity/domain-contracts";
import { PermissionDeniedError } from "./errors.js";

/**
 * Authorization role policy (ADR-0010), aligned with the case service's
 * `authorization` workstream policy: AUTHORIZATION_SPECIALIST and
 * UTILIZATION_REVIEWER own the work. The readiness VIEW is readable by the
 * roles that feed or consume it. READ_ONLY_AUDITOR and COMPLIANCE_REVIEWER
 * inspect via audit; SYSTEM_ADMIN has no case-level rights (ADR-0003).
 */
export const AUTHORIZATION_COMMAND_ROLE_POLICY = {
  RecordAuthorization: ["AUTHORIZATION_SPECIALIST", "UTILIZATION_REVIEWER"],
  TransitionAuthorizationPreparation: ["AUTHORIZATION_SPECIALIST", "UTILIZATION_REVIEWER"],
  AssessAuthorizationReadiness: [
    "AUTHORIZATION_SPECIALIST",
    "UTILIZATION_REVIEWER",
    "BENEFITS_VERIFICATION_SPECIALIST",
    "INTAKE_COORDINATOR",
    "ORGANIZATION_ADMIN",
  ],
} as const satisfies Record<string, readonly UserRole[]>;

export type AuthorizationCommandName = keyof typeof AUTHORIZATION_COMMAND_ROLE_POLICY;

export function assertAuthorizationPermitted(
  command: AuthorizationCommandName,
  roles: readonly UserRole[],
): void {
  const allowed = AUTHORIZATION_COMMAND_ROLE_POLICY[command];
  if (!roles.some((r) => (allowed as readonly UserRole[]).includes(r))) {
    throw new PermissionDeniedError(command, roles);
  }
}
