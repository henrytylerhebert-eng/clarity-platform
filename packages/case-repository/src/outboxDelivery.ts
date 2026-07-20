import { GovernedEventEnvelopeSchema, type GovernedEventEnvelope } from "@clarity/domain-contracts";
import type { PrismaClient } from "@prisma/client";
import { withTenantContext } from "./tenantContext.js";

export const SYNTHETIC_DELIVERY_EVENT_TYPES = [
  "ADMISSION_RECORDED",
  "AUTHORIZATION_DAY_DECISION_RECORDED",
  "DOCUMENTATION_GAP_RECORDED",
  "NETWORK_REVIEW_SUBMITTED",
  "NETWORK_REVIEW_APPROVED",
  "NETWORK_REVIEW_REJECTED",
  "NETWORK_PACKAGE_RECONCILED",
] as const;

export interface OutboxDeliveryRecord {
  readonly id: string;
  readonly organizationId: string;
  readonly governedEventId: string;
  readonly eventTypeName: string;
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly status: string;
  readonly createdAt: Date;
}

export interface OutboxDeliveryMessage {
  readonly outbox: OutboxDeliveryRecord;
  readonly envelope: GovernedEventEnvelope;
}

export interface OutboxConsumer {
  consume(message: OutboxDeliveryMessage): Promise<void>;
}

export interface OutboxDispatchResult {
  readonly deliveredIds: string[];
}

/**
 * Synthetic in-process consumer for the accepted event vocabulary. It has no
 * external side effect and exists to prove the delivery boundary only.
 */
export class SyntheticOutboxConsumer implements OutboxConsumer {
  readonly messages: OutboxDeliveryMessage[] = [];

  async consume(message: OutboxDeliveryMessage): Promise<void> {
    if (!SYNTHETIC_DELIVERY_EVENT_TYPES.includes(message.outbox.eventTypeName as (typeof SYNTHETIC_DELIVERY_EVENT_TYPES)[number])) {
      throw new Error(`Synthetic consumer rejected event type ${message.outbox.eventTypeName}`);
    }
    if (message.envelope.eventType.name !== message.outbox.eventTypeName) {
      throw new Error(`Outbox event type mismatch for ${message.outbox.id}`);
    }
    if (message.envelope.tenant.organizationId !== message.outbox.organizationId) {
      throw new Error(`Outbox tenant mismatch for ${message.outbox.id}`);
    }
    this.messages.push(message);
  }
}

/**
 * Local synthetic dispatcher. A row is locked before consumer execution, so
 * concurrent dispatchers do not select the same pending row. Consumer failure
 * rolls back the status update and leaves the row pending for retry. The
 * transaction-held consumer call is intentionally limited to this in-process
 * proof; external delivery requires a separately approved lease protocol.
 */
export class SyntheticOutboxDispatcher {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly consumer: OutboxConsumer,
  ) {}

  async dispatchPending(organizationId: string, limit = 10): Promise<OutboxDispatchResult> {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new Error("Outbox dispatch limit must be an integer between 1 and 100");
    }

    return withTenantContext(this.prisma, organizationId, async (tx) => {
      const pending = await tx.$queryRaw<OutboxDeliveryRecord[]>`
        SELECT
          "id",
          "organizationId",
          "governedEventId",
          "eventTypeName",
          "aggregateType",
          "aggregateId",
          "status",
          "createdAt"
        FROM "OutboxRecord"
        WHERE "organizationId" = ${organizationId}
          AND "status" = 'PENDING'
        ORDER BY "createdAt" ASC, "id" ASC
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      `;
      const deliveredIds: string[] = [];

      for (const outbox of pending) {
        const event = await tx.governedEvent.findFirst({
          where: { id: outbox.governedEventId, organizationId },
        });
        if (!event) throw new Error(`Governed event ${outbox.governedEventId} is missing for outbox ${outbox.id}`);

        const envelope = GovernedEventEnvelopeSchema.parse(event.envelope);
        await this.consumer.consume({ outbox, envelope });

        const updated = await tx.outboxRecord.updateMany({
          where: { id: outbox.id, organizationId, status: "PENDING" },
          data: { status: "DELIVERED" },
        });
        if (updated.count !== 1) throw new Error(`Outbox row ${outbox.id} changed during delivery`);
        deliveredIds.push(outbox.id);
      }

      return { deliveredIds };
    });
  }
}
