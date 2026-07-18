import type {
  EpisodeAuthorization,
  AuthorizationReview,
  AuthorizationDayDecision,
  DocumentationGap,
} from "@clarity/domain-contracts";
import type { PrismaClient } from "@prisma/client";
import {
  rowToEpisodeAuthorization,
  rowToAuthorizationReview,
  rowToAuthorizationDayDecision,
  rowToDocumentationGap,
} from "./utilizationReviewMappers.js";

/**
 * Read-side query gateway for episode-owned utilization-review facts.
 *
 * All WRITES go through PrismaEpisodePersistenceGateway, which owns the
 * approved S2 invariants (organization predicates, optimistic concurrency,
 * append-only correction chains with one active branch, controlled
 * documentation-gap transitions, and atomic source/audit/event/outbox
 * transactions). The earlier scaffold write methods were removed during
 * MSG-0045: supersedeAuthorizationReview had no version predicate and no
 * already-superseded guard (a double correction would fork the chain),
 * updateDocumentationGapStatus cast the status without validating the
 * controlled transition table, and none of the writes produced audit or
 * governed events.
 */
export class UtilizationReviewGateway {
  constructor(private readonly prisma: PrismaClient) {}

  async getEpisodeAuthorization(organizationId: string, id: string): Promise<EpisodeAuthorization | null> {
    const row = await this.prisma.episodeAuthorization.findUnique({
      where: { id, organizationId },
    });
    return row ? rowToEpisodeAuthorization(row) : null;
  }

  async getAuthorizationReview(organizationId: string, id: string): Promise<AuthorizationReview | null> {
    const row = await this.prisma.authorizationReview.findUnique({
      where: { id, organizationId },
    });
    return row ? rowToAuthorizationReview(row) : null;
  }

  async getAuthorizationDayDecisions(organizationId: string, episodeId: string): Promise<AuthorizationDayDecision[]> {
    const rows = await this.prisma.authorizationDayDecision.findMany({
      where: { episodeId, organizationId },
      orderBy: { startDate: "asc" },
    });
    return rows.map(rowToAuthorizationDayDecision);
  }

  async getDocumentationGap(organizationId: string, id: string): Promise<DocumentationGap | null> {
    const row = await this.prisma.documentationGap.findUnique({
      where: { id, organizationId },
    });
    return row ? rowToDocumentationGap(row) : null;
  }
}
