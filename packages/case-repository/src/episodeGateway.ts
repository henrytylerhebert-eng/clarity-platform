import type { Episode, CaseEpisodeLink } from "@clarity/domain-contracts";
import type { PrismaClient } from "@prisma/client";
import { rowToEpisode, rowToCaseEpisodeLink } from "./episodeMappers.js";
import { withTenantContext } from "./tenantContext.js";

/**
 * Read-side query gateway for episodes and case-to-episode links.
 *
 * All WRITES go through PrismaEpisodePersistenceGateway, which owns the
 * approved S2 invariants (organization predicates, idempotent replay,
 * single-active-admission, facility-owned timezone lineage, and atomic
 * source/audit/event/outbox transactions). The earlier scaffold write methods
 * were removed during MSG-0045: they created a fresh timezone-configuration
 * row per admission (colliding with the facility/version unique constraint
 * and bypassing lineage), accepted caller-authored server-owned fields, and
 * wrote no audit events.
 */
export class EpisodeGateway {
  constructor(private readonly prisma: PrismaClient) {}

  async getEpisode(organizationId: string, episodeId: string): Promise<Episode | null> {
    const row = await withTenantContext(this.prisma, organizationId, (tx) => tx.episode.findUnique({
      where: {
        id: episodeId,
        organizationId,
      },
    }));
    return row ? rowToEpisode(row) : null;
  }

  async getCaseEpisodeLinks(organizationId: string, caseId: string): Promise<CaseEpisodeLink[]> {
    const rows = await withTenantContext(this.prisma, organizationId, (tx) => tx.caseEpisodeLink.findMany({
      where: {
        organizationId,
        caseId,
      },
      orderBy: { linkedAt: "asc" },
    }));
    return rows.map(rowToCaseEpisodeLink);
  }
}
