import { PrescreenPermissionDeniedError } from "./errors.js";

/**
 * Prescreen role policy — explicit, injected configuration.
 *
 * The repository's UserRole enum has no roles for the prescreen actors the
 * source package describes (crisis-response officers, prescreen assessors,
 * Central Intake staff, authorized practitioners), and silently mapping
 * them onto existing unrelated roles is prohibited by the approved Phase 2
 * constraints. Until the owner records the role-mapping decision
 * (docs/decisions/PRESCREEN_ROLE_MAPPING_DECISION_PACKET.md), the service
 * takes its policy as an explicit constructor input and only the clearly
 * synthetic policy below exists. No production role taxonomy is asserted.
 */

export const PRESCREEN_COMMAND_NAMES = [
  "StartPrescreenEncounter",
  "SaveAssessmentDraft",
  "AttestAssessment",
  "CreateAssessmentSupplement",
  "SubmitPrescreen",
  "UpdatePacketRequirement",
  "EvaluateTargetReadiness",
] as const;
export type PrescreenCommandName = (typeof PRESCREEN_COMMAND_NAMES)[number];

export type PrescreenRolePolicy = Readonly<Record<PrescreenCommandName, readonly string[]>>;

/** Synthetic-only role codes. The SYNTHETIC_ prefix marks them as non-production by construction. */
export const SYNTHETIC_PRESCREEN_ROLES = {
  fieldAssessor: "SYNTHETIC_PRESCREEN_FIELD_ASSESSOR",
  centralIntake: "SYNTHETIC_CENTRAL_INTAKE_COORDINATOR",
  readOnly: "SYNTHETIC_PRESCREEN_OBSERVER",
} as const;

export const SYNTHETIC_PRESCREEN_TEST_POLICY: PrescreenRolePolicy = {
  StartPrescreenEncounter: [SYNTHETIC_PRESCREEN_ROLES.fieldAssessor],
  SaveAssessmentDraft: [SYNTHETIC_PRESCREEN_ROLES.fieldAssessor],
  AttestAssessment: [SYNTHETIC_PRESCREEN_ROLES.fieldAssessor],
  CreateAssessmentSupplement: [SYNTHETIC_PRESCREEN_ROLES.fieldAssessor],
  SubmitPrescreen: [SYNTHETIC_PRESCREEN_ROLES.fieldAssessor],
  UpdatePacketRequirement: [
    SYNTHETIC_PRESCREEN_ROLES.fieldAssessor,
    SYNTHETIC_PRESCREEN_ROLES.centralIntake,
  ],
  EvaluateTargetReadiness: [
    SYNTHETIC_PRESCREEN_ROLES.fieldAssessor,
    SYNTHETIC_PRESCREEN_ROLES.centralIntake,
    SYNTHETIC_PRESCREEN_ROLES.readOnly,
  ],
};

/** Raised before any read, so authorization failures disclose nothing about resources. */
export function assertPrescreenPermitted(
  policy: PrescreenRolePolicy,
  command: PrescreenCommandName,
  roleCodes: readonly string[],
): void {
  const allowed = policy[command];
  if (!roleCodes.some((code) => allowed.includes(code))) {
    throw new PrescreenPermissionDeniedError(command, roleCodes);
  }
}
