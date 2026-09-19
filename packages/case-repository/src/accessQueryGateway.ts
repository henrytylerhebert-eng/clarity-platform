import type { PrismaClient } from "@prisma/client";
import { CaseNotFoundError } from "./prismaCaseRepository.js";
import { withTenantContext } from "./tenantContext.js";
import { rowToDomain as caseRowToDomain, type PersistedCase } from "./mappers.js";
import { rowToCaseEpisodeLink } from "./episodeMappers.js";
import { encounterRowToDomain, requirementRowToDomain } from "./prescreenGateway.js";
import type { AuthenticatedPrincipal, PrescreenEncounter, PacketRequirement, CaseEpisodeRelationship } from "@clarity/domain-contracts";
import type { CaseAuditWriter } from "./auditWriter.js";
import { isTerminalPrescreenEncounterStatus } from "@clarity/domain-contracts";

export interface AccessQuerySnapshot {
  caseRecord: PersistedCase;
  prescreenSelection: "NONE" | "SELECTED" | "AMBIGUOUS";
  prescreen?: PrescreenEncounter;
  packetRequirementEvidence: "NOT_AVAILABLE" | "LOADED_EMPTY" | "LOADED";
  packetRequirements?: PacketRequirement[];
  episodeRelationships: CaseEpisodeRelationship[];
}

export class AccessQueryGateway {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly auditWriter: CaseAuditWriter,
  ) {}

  async getAccessSnapshot(
    organizationId: string,
    caseKey: string,
    principal: AuthenticatedPrincipal,
  ): Promise<AccessQuerySnapshot> {
    return withTenantContext(
      this.prisma,
      organizationId,
      async (tx) => {
        const caseRow = await tx.behavioralHealthCase.findFirst({
          where: { organizationId, id: caseKey },
        });

        if (!caseRow) {
          throw new CaseNotFoundError(caseKey);
        }

        const encounterRows = await tx.prescreenEncounter.findMany({
          where: { organizationId, caseId: caseRow.id },
        });

        const encounters = encounterRows.map(encounterRowToDomain);
        const activeEncounters = encounters.filter((e) => !isTerminalPrescreenEncounterStatus(e.status));

        let prescreenSelection: "NONE" | "SELECTED" | "AMBIGUOUS" = "NONE";
        let selectedEncounter: PrescreenEncounter | undefined = undefined;
        let packetRequirementEvidence: "NOT_AVAILABLE" | "LOADED_EMPTY" | "LOADED" = "NOT_AVAILABLE";
        let packetRequirements: PacketRequirement[] | undefined = undefined;

        if (activeEncounters.length === 1) {
          prescreenSelection = "SELECTED";
          selectedEncounter = activeEncounters[0];

          const reqRows = await tx.prescreenPacketRequirement.findMany({
            where: { organizationId, encounterId: selectedEncounter!.encounterId },
          });

          packetRequirements = reqRows.map(requirementRowToDomain);
          packetRequirementEvidence = packetRequirements.length > 0 ? "LOADED" : "LOADED_EMPTY";
        } else if (activeEncounters.length > 1) {
          prescreenSelection = "AMBIGUOUS";
        }

        const episodeRows = await tx.caseEpisodeLink.findMany({
          where: { organizationId, caseId: caseRow.id },
        });

        const episodeLinks = episodeRows.map(rowToCaseEpisodeLink);
        const episodeRelationships = episodeLinks.map(link => link.relationship);

        await this.auditWriter.write(tx, {
          action: "ACCESS_CASE_VIEWED",
          objectType: "AccessCaseReadModel",
          objectId: caseKey,
          caseId: caseRow.id,
          organizationId: organizationId,
          actor: { actorType: "USER", actorId: principal.userId },
          occurredAt: new Date(),
        });

        return {
          caseRecord: caseRowToDomain(caseRow),
          prescreenSelection,
          prescreen: selectedEncounter,
          packetRequirementEvidence,
          packetRequirements,
          episodeRelationships,
        };
      },
      "RepeatableRead"
    );
  }
}
