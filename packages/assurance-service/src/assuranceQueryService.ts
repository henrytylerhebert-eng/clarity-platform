import type { AuthenticatedPrincipal } from "@clarity/domain-contracts";
import { PrismaAssuranceGateway } from "@clarity/case-repository";
import { AssuranceServiceNotFoundError } from "./errors.js";
import { requireAssignedParticipant } from "./permissions.js";

async function requireCase(
  gateway: PrismaAssuranceGateway,
  principal: AuthenticatedPrincipal,
  caseKey: string,
) {
  const assuranceCase = await gateway.findCaseByKey(principal.organizationId, caseKey);
  if (!assuranceCase) throw new AssuranceServiceNotFoundError();
  return assuranceCase;
}

export class AssuranceQueryService {
  constructor(private readonly gateway: PrismaAssuranceGateway) {}

  async getCaseView(principal: AuthenticatedPrincipal, caseKey: string) {
    const assuranceCase = await requireCase(this.gateway, principal, caseKey);
    await requireAssignedParticipant(this.gateway, principal, assuranceCase.id);
    const view = await this.gateway.getCaseViewByKey(principal.organizationId, caseKey);
    if (!view) throw new AssuranceServiceNotFoundError();
    return view;
  }

  async getCaseHistory(principal: AuthenticatedPrincipal, caseKey: string) {
    const assuranceCase = await requireCase(this.gateway, principal, caseKey);
    await requireAssignedParticipant(this.gateway, principal, assuranceCase.id);
    return this.gateway.getCaseHistory(principal.organizationId, assuranceCase.id);
  }
}
