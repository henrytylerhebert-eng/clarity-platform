import type { AuthenticatedPrincipal } from "@clarity/domain-contracts";
import type { AccessQueryGateway } from "@clarity/case-repository";
import { assertAccessCaseReadPermitted } from "./permissions.js";
import { deriveAccessGuidance } from "@clarity/domain-contracts";
import type { AccessCaseReadModel } from "@clarity/domain-contracts";

export class AccessQueryService {
  constructor(private readonly gateway: AccessQueryGateway) {}

  async getCaseAccessModel(
    principal: AuthenticatedPrincipal,
    caseKey: string
  ): Promise<AccessCaseReadModel> {
    assertAccessCaseReadPermitted(principal.roles);

    const snapshot = await this.gateway.getAccessSnapshot(
      principal.organizationId,
      caseKey,
      principal
    );

    const { caseRecord, prescreenSelection, prescreen, packetRequirementEvidence, packetRequirements, episodeRelationships } = snapshot;

    let guidanceInputPrescreenStatus = undefined;
    let guidanceInputPacketRequirements = undefined;

    if (prescreenSelection === "SELECTED" && prescreen) {
      guidanceInputPrescreenStatus = prescreen.status;
      if (packetRequirements) {
        guidanceInputPacketRequirements = packetRequirements;
      }
    }

    const guidanceProjection = deriveAccessGuidance({
      caseStatus: caseRecord.status,
      urgency: caseRecord.urgency,
      workstreams: caseRecord.workstreams,
      episodeRelationships: episodeRelationships,
      prescreenStatus: guidanceInputPrescreenStatus,
      packetRequirements: guidanceInputPacketRequirements,
    });

    const { journey, ...guidance } = guidanceProjection;

    return {
      caseKey: caseRecord.caseKey,
      caseVersion: caseRecord.version,
      journey,
      guidance,
      sourceState: {
        caseStatus: caseRecord.status,
        urgency: caseRecord.urgency,
        workstreams: caseRecord.workstreams,
        prescreenSelection,
        packetRequirementEvidence,
        prescreen: prescreen ? {
          status: prescreen.status,
          version: prescreen.version
        } : undefined,
        episodeRelationships,
      }
    };
  }
}
