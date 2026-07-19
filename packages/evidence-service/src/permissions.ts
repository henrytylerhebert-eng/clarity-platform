import type { EvidenceCategory, UserRole } from "@clarity/domain-contracts";
import { PermissionDeniedError } from "./errors.js";

/**
 * Evidence role policy (per the evidence issue's role boundaries).
 *
 * Deliberate exclusions:
 * - READ_ONLY_AUDITOR and COMPLIANCE_REVIEWER inspect; they mutate nothing
 *   (compliance has no explicitly granted review authority yet).
 * - SYSTEM_ADMIN has no case-level operational rights (ADR-0003 posture).
 * - Approval is domain-scoped by category — no broad cross-domain approval
 *   for convenience.
 */
export const EVIDENCE_CREATE_ROLES: readonly UserRole[] = [
  "INTAKE_COORDINATOR",
  "CLINICAL_REVIEWER",
  "PHYSICIAN_REVIEWER",
  "UTILIZATION_REVIEWER",
  "LEGAL_REVIEWER",
  "BENEFITS_VERIFICATION_SPECIALIST",
  "AUTHORIZATION_SPECIALIST",
];

const CLINICAL: readonly UserRole[] = ["CLINICAL_REVIEWER", "PHYSICIAN_REVIEWER"];
const LEGAL: readonly UserRole[] = ["LEGAL_REVIEWER"];
const BENEFITS: readonly UserRole[] = ["BENEFITS_VERIFICATION_SPECIALIST"];
const AUTHORIZATION: readonly UserRole[] = ["AUTHORIZATION_SPECIALIST", "UTILIZATION_REVIEWER"];
const PLACEMENT: readonly UserRole[] = ["FACILITY_REVIEWER", "INTAKE_COORDINATOR"];
const TRANSPORT: readonly UserRole[] = ["TRANSPORT_COORDINATOR"];
const GENERAL: readonly UserRole[] = ["INTAKE_COORDINATOR", "ORGANIZATION_ADMIN"];

/** Which roles may approve/reject/request-clarification/supersede evidence, per category. */
export const EVIDENCE_REVIEW_POLICY: Record<EvidenceCategory, readonly UserRole[]> = {
  PRESENTING_PROBLEM: CLINICAL,
  SUICIDE_RISK: CLINICAL,
  VIOLENCE_RISK: CLINICAL,
  PSYCHOSIS: CLINICAL,
  MANIA: CLINICAL,
  SUBSTANCE_USE: CLINICAL,
  WITHDRAWAL: CLINICAL,
  COGNITION: CLINICAL,
  MEDICAL: CLINICAL,
  MEDICATION: CLINICAL,
  ALLERGY: CLINICAL,
  LEGAL_STATUS: LEGAL,
  CUSTODY: LEGAL,
  GUARDIANSHIP: LEGAL,
  INSURANCE: BENEFITS,
  AUTHORIZATION: AUTHORIZATION,
  PLACEMENT: PLACEMENT,
  TRANSPORT: TRANSPORT,
  OTHER: GENERAL,
};

/** Reviewer union — used for contradiction commands (any domain reviewer may group/classify). */
export const CONTRADICTION_REVIEW_ROLES: readonly UserRole[] = [
  ...new Set(Object.values(EVIDENCE_REVIEW_POLICY).flat()),
];

export function assertEvidenceCreatePermitted(command: string, roles: readonly UserRole[]): void {
  if (!roles.some((r) => EVIDENCE_CREATE_ROLES.includes(r))) {
    throw new PermissionDeniedError(command, roles);
  }
}

/**
 * Domain-scoped review permission: the actor must hold a role authorized for
 * the evidence item's OWN category (read inside the transaction, so a caller
 * cannot lie about the category).
 */
export function assertEvidenceReviewPermitted(
  command: string,
  category: EvidenceCategory,
  roles: readonly UserRole[],
): void {
  const allowed = EVIDENCE_REVIEW_POLICY[category];
  if (!roles.some((r) => allowed.includes(r))) {
    throw new PermissionDeniedError(`${command}(${category})`, roles);
  }
}

export function assertContradictionReviewPermitted(command: string, roles: readonly UserRole[]): void {
  if (!roles.some((r) => CONTRADICTION_REVIEW_ROLES.includes(r))) {
    throw new PermissionDeniedError(command, roles);
  }
}
