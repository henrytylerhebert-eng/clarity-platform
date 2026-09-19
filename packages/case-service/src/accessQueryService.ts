import type { AuthenticatedPrincipal, PrescreenEncounterStatus, PacketRequirement, AuditActor } from "@clarity/domain-contracts";
import type { AccessQueryGateway } from "@clarity/case-repository";
import { assertAccessCaseReadPermitted } from "./permissions.js";
import { deriveAccessGuidance, isTerminalPrescreenEncounterStatus } from "@clarity/domain-contracts";
import type { AccessCaseReadModel, PacketRequirementEvidenceState } from "@clarity/domain-contracts";

export class AccessQueryService {
  constructor(private readonly gateway: AccessQueryGateway) {}

  async getCaseAccessModel(
    principal: AuthenticatedPrincipal,
    caseKey: string
  ): Promise<AccessCaseReadModel> {
    assertAccessCaseReadPermitted(principal.roles);

    const actor: AuditActor = { actorType: "USER", actorId: principal.userId };

    const snapshot = await this.gateway.getAccessSnapshot(
      principal.organizationId,
      caseKey,
      actor
    );

    const { caseRecord, encounters, packetRequirements, episodeLinks } = snapshot;

    const activeEncounters = encounters.filter(e => !isTerminalPrescreenEncounterStatus(e.status));

    let prescreenSelection: "NONE" | "SELECTED" | "AMBIGUOUS" = "NONE";
    let selectedPrescreenStatus: PrescreenEncounterStatus | undefined = undefined;
    let selectedPrescreenVersion: number | undefined = undefined;
    let packetRequirementEvidence: PacketRequirementEvidenceState = "NOT_AVAILABLE";
    let guidanceInputPacketRequirements: PacketRequirement[] | undefined = undefined;

    if (activeEncounters.length === 1) {
      prescreenSelection = "SELECTED";
      const selectedEncounter = activeEncounters[0]!;
      if (!selectedEncounter) throw new Error("Unexpected empty array");
      selectedPrescreenStatus = selectedEncounter.status;
      selectedPrescreenVersion = selectedEncounter.version;

      const filteredReqs = packetRequirements.filter(r => r.encounterId === selectedEncounter.encounterId);
      guidanceInputPacketRequirements = filteredReqs;

      packetRequirementEvidence = filteredReqs.length > 0 ? "LOADED" : "LOADED_EMPTY";
    } else if (activeEncounters.length > 1) {
      prescreenSelection = "AMBIGUOUS";
    }

    const episodeRelationships = episodeLinks.map(link => link.relationship);

    const guidanceProjection = deriveAccessGuidance({
      caseStatus: caseRecord.status,
      urgency: caseRecord.urgency,
      workstreams: caseRecord.workstreams,
      episodeRelationships: episodeRelationships,
      prescreenStatus: selectedPrescreenStatus,
      packetRequirements: guidanceInputPacketRequirements,
    });

    const { journey, ...guidance } = guidanceProjection;

    if (typeof caseRecord.version !== "number") {
      throw new Error(`BehavioralHealthCase.version is missing on caseKey ${caseRecord.caseKey}`);
    }
    const version = caseRecord.version;

    return {
      caseKey: caseRecord.caseKey,
      caseVersion: version,
      journey,
      guidance,
      sourceState: {
        caseStatus: caseRecord.status,
        urgency: caseRecord.urgency,
        workstreams: caseRecord.workstreams,
        prescreenSelection,
        packetRequirementEvidence,
        prescreen: selectedPrescreenStatus !== undefined ? {
          status: selectedPrescreenStatus,
          version: selectedPrescreenVersion!
        } : undefined,
        episodeRelationships,
      }
    };
  }
}
