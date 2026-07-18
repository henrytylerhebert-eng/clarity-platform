import type {
  Episode as EpisodeRow,
  CaseEpisodeLink as CaseEpisodeLinkRow,
} from "@prisma/client";
import {
  EPISODE_STATUSES,
  CASE_EPISODE_RELATIONSHIPS,
  type Episode,
  type CaseEpisodeLink,
  type EpisodeStatus,
  type CaseEpisodeRelationship
} from "@clarity/domain-contracts";

function parseEnum<T extends string>(value: string, allowed: readonly T[], field: string): T {
  if ((allowed as readonly string[]).includes(value)) return value as T;
  throw new Error(`Row field ${field} has value "${value}" outside the domain contract`);
}
export function rowToEpisode(row: EpisodeRow): Episode {
  return {
    id: row.id,
    organizationId: row.organizationId,
    sourceCaseId: row.sourceCaseId,
    facilityId: row.facilityId,
    programId: row.programId!,
    unitId: row.unitId,
    facilityTimezone: {
      facilityTimezone: row.facilityTimezone,
      source: row.timezoneSource as "FACILITY_CONFIGURATION",
      sourceReferenceId: row.timezoneSourceReferenceId!
    },
    admittedAt: row.admittedAt.toISOString(),
    serviceDate: row.serviceDate,
    status: parseEnum<EpisodeStatus>(row.status, EPISODE_STATUSES, "status"),
    version: row.version,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function rowToCaseEpisodeLink(row: CaseEpisodeLinkRow): CaseEpisodeLink {
  return {
    organizationId: row.organizationId,
    caseId: row.caseId,
    episodeId: row.episodeId,
    relationship: parseEnum<CaseEpisodeRelationship>(row.relationship, CASE_EPISODE_RELATIONSHIPS, "relationship"),
    linkedAt: row.linkedAt.toISOString(),
    linkedByActorId: row.linkedByActorId,
    sourceAcceptanceId: row.sourceAcceptanceId,
    sourcePacketVersionId: row.sourcePacketVersionId,
    sourceCustodyEventId: row.sourceCustodyEventId,
  };
}
