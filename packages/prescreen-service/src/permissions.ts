import type { UserRole } from "@clarity/domain-contracts";
import { PrescreenPermissionDeniedError } from "./errors.js";

/**
 * Prescreen role policy — explicit, injected configuration.
 *
 * The owner resolved the role-mapping decision packet on 2026-07-19
 * (ADR-0014): exactly two equivalences are ruled for the same-organization
 * slice — INTAKE_COORDINATOR ≡ Central Intake coordinator and
 * PHYSICIAN_REVIEWER ≡ authorized practitioner (PMHNP signer authority is
 * configured policy, not enum membership). External/field actors are
 * deferred to the cross-organization design, not mapped. The policy stays
 * an explicit constructor input: the production constant below encodes the
 * ruling, and the synthetic policy remains for tests.
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

/**
 * Production policy per the ADR-0014 ruling, derived fail-closed from the
 * package's role-permission matrix: matrix "conditional" capabilities are
 * not granted. Attestation is held by the authorized practitioner in this
 * slice; the external assessor's attest capability arrives only with the
 * cross-organization design. No other role — including SYSTEM_ADMIN and
 * ORGANIZATION_ADMIN — receives any prescreen capability.
 */
export const PRESCREEN_PRODUCTION_POLICY = {
  StartPrescreenEncounter: ["INTAKE_COORDINATOR"],
  SaveAssessmentDraft: ["INTAKE_COORDINATOR"],
  AttestAssessment: ["PHYSICIAN_REVIEWER"],
  CreateAssessmentSupplement: ["INTAKE_COORDINATOR"],
  SubmitPrescreen: ["INTAKE_COORDINATOR"],
  UpdatePacketRequirement: ["INTAKE_COORDINATOR"],
  EvaluateTargetReadiness: ["INTAKE_COORDINATOR", "PHYSICIAN_REVIEWER"],
} as const satisfies Readonly<Record<PrescreenCommandName, readonly UserRole[]>>;

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
