import type { AuthenticatedPrincipal, AssuranceParticipantRole } from "@clarity/domain-contracts";
import { AssurancePermissionDeniedError } from "./errors.js";

export interface AssuranceParticipantGrant {
  readonly userId: string;
  readonly role: AssuranceParticipantRole;
  readonly authorityBasis: string | null;
  readonly active: boolean;
}

export interface AssuranceParticipantLookup {
  findActiveParticipant(
    organizationId: string,
    assuranceCaseId: string,
    userId: string,
    role?: AssuranceParticipantRole,
  ): Promise<AssuranceParticipantGrant | undefined>;
}

export async function requireAssignedParticipant(
  gateway: AssuranceParticipantLookup,
  principal: AuthenticatedPrincipal,
  assuranceCaseId: string,
): Promise<AssuranceParticipantGrant> {
  const grant = await gateway.findActiveParticipant(
    principal.organizationId,
    assuranceCaseId,
    principal.userId,
  );
  if (!grant) throw new AssurancePermissionDeniedError();
  return grant;
}

export async function requireEvidenceContributor(
  gateway: AssuranceParticipantLookup,
  principal: AuthenticatedPrincipal,
  assuranceCaseId: string,
): Promise<AssuranceParticipantGrant> {
  const grant = await gateway.findActiveParticipant(
    principal.organizationId,
    assuranceCaseId,
    principal.userId,
    "EVIDENCE_CONTRIBUTOR",
  );
  if (!grant) throw new AssurancePermissionDeniedError();
  return grant;
}

export async function requireQualifiedReviewer(
  gateway: AssuranceParticipantLookup,
  principal: AuthenticatedPrincipal,
  assuranceCaseId: string,
): Promise<AssuranceParticipantGrant> {
  if (!principal.roles.includes("COMPLIANCE_REVIEWER")) {
    throw new AssurancePermissionDeniedError();
  }

  const grant = await gateway.findActiveParticipant(
    principal.organizationId,
    assuranceCaseId,
    principal.userId,
    "QUALIFIED_REVIEWER",
  );
  if (!grant?.authorityBasis?.trim()) throw new AssurancePermissionDeniedError();
  return grant;
}
