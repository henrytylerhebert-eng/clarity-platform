import type { PrismaClient } from "@prisma/client";
import { CaseNotFoundError } from "./prismaCaseRepository.js";
import { withTenantContext } from "./tenantContext.js";
import { rowToDomain as caseRowToDomain, type PersistedCase } from "./mappers.js";
import { rowToCaseEpisodeLink } from "./episodeMappers.js";
import { encounterRowToDomain, requirementRowToDomain } from "./prescreenGateway.js";
import type { PrescreenEncounter, PacketRequirement, CaseEpisodeLink } from "@clarity/domain-contracts";
import type { CaseAuditWriter } from "./auditWriter.js";

export interface AccessQuerySnapshot {
  caseRecord: PersistedCase;
  encounters: PrescreenEncounter[];
  packetRequirements: (PacketRequirement & { encounterId: string })[];
  episodeLinks: CaseEpisodeLink[];
}

export interface AuditActor {
  actorType: "USER" | "SYSTEM";
  actorId: string;
}

export class AccessQueryGateway {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly auditWriter: CaseAuditWriter,
  ) {}

  async getAccessSnapshot(
    organizationId: string,
    caseKey: string,
    actor: AuditActor,
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

        const encounterIds = encounters.map((e) => e.encounterId);
        let packetRequirements: (PacketRequirement & { encounterId: string })[] = [];
        if (encounterIds.length > 0) {
          const reqRows = await tx.prescreenPacketRequirement.findMany({
            where: { organizationId, encounterId: { in: encounterIds } },
          });
          packetRequirements = reqRows.map(r => ({ ...requirementRowToDomain(r), encounterId: r.encounterId }));
        }

        const episodeRows = await tx.caseEpisodeLink.findMany({
          where: { organizationId, caseId: caseRow.id },
        });
        const episodeLinks = episodeRows.map(rowToCaseEpisodeLink);

        await this.auditWriter.write(tx, {
          action: "ACCESS_CASE_VIEWED",
          objectType: "AccessCaseReadModel",
          objectId: caseKey,
          caseId: caseRow.id,
          organizationId: organizationId,
          actor: actor,
          occurredAt: new Date(),
        });

        return {
          caseRecord: caseRowToDomain(caseRow),
          encounters,
          packetRequirements,
          episodeLinks,
        };
      },
      "RepeatableRead"
    );
  }
}
