import { GovernedEventEnvelopeSchema, type GovernedEventEnvelope } from "@clarity/domain-contracts";
import type { PrismaClient } from "@prisma/client";

/**
 * Read-side query gateway for governed events.
 *
 * Event WRITES happen only inside PrismaEpisodePersistenceGateway, in the
 * same transaction as the source mutation, audit event, and outbox row
 * (S2 decision 7). The earlier scaffold appendEvent method was removed during
 * MSG-0045: it accepted a fully caller-authored envelope — including the
 * server-owned classification and metricEligibility fields the S2 packet's
 * security gates forbid callers from authoring — and it wrote events in a
 * separate transaction from the facts they describe.
 */
export class GovernedEventGateway {
  constructor(private readonly prisma: PrismaClient) {}

  async getEvent(organizationId: string, eventId: string): Promise<GovernedEventEnvelope | null> {
    const row = await this.prisma.governedEvent.findUnique({
      where: {
        id: eventId,
        organizationId,
      },
    });
    if (!row) return null;
    // Re-validate on the way out so a hand-edited row cannot masquerade as a
    // governed envelope.
    return GovernedEventEnvelopeSchema.parse(row.envelope);
  }
}
