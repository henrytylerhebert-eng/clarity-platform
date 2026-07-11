import { PermissionDeniedError, type UserRole } from "@clarity/domain-contracts";

/**
 * Role policy for document commands (mirrors case-service's permissions.ts).
 *
 * Deliberate exclusions:
 * - READ_ONLY_AUDITOR and COMPLIANCE_REVIEWER may not upload or classify
 *   documents (inspection roles do not create or judge case content) but MAY
 *   access/download them — oversight requires being able to read what it
 *   audits.
 * - SYSTEM_ADMIN is platform administration, not clinical/legal/financial
 *   operations — it has no document-command rights and no document-access
 *   right either (same exclusion as case commands).
 */
export const DOCUMENT_ROLE_POLICY = {
  UploadDocument: [
    "INTAKE_COORDINATOR",
    "ORGANIZATION_ADMIN",
    "CLINICAL_REVIEWER",
    "PHYSICIAN_REVIEWER",
    "LEGAL_REVIEWER",
    "BENEFITS_VERIFICATION_SPECIALIST",
    "AUTHORIZATION_SPECIALIST",
    "FACILITY_REVIEWER",
    "TRANSPORT_COORDINATOR",
  ],
  ClassifyDocument: ["INTAKE_COORDINATOR", "ORGANIZATION_ADMIN", "CLINICAL_REVIEWER", "PHYSICIAN_REVIEWER"],
  AccessDocument: [
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
    "READ_ONLY_AUDITOR",
  ],
} as const satisfies Record<string, readonly UserRole[]>;

export type DocumentCommandName = keyof typeof DOCUMENT_ROLE_POLICY;

export function assertDocumentPermitted(command: DocumentCommandName, roles: readonly UserRole[]): void {
  const allowed = DOCUMENT_ROLE_POLICY[command];
  if (!roles.some((r) => (allowed as readonly UserRole[]).includes(r))) {
    throw new PermissionDeniedError(command, roles);
  }
}
