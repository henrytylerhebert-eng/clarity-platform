import type { Prisma } from "@prisma/client";
import { assertNoRestrictedFields, type AuditActor } from "@clarity/domain-contracts";

/** The transaction-scoped Prisma client surface the writer needs. */
export type TxClient = Prisma.TransactionClient;

export interface CaseAuditRecord {
  readonly organizationId: string;
  readonly caseId: string;
  readonly action: string;
  readonly actor: AuditActor;
  readonly objectType: string;
  readonly objectId: string;
  readonly reason?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly previousStateHash?: string;
  readonly newStateHash?: string;
  readonly occurredAt: Date;
}

/**
 * Injectable so tests can prove atomicity (a failing audit write must roll
 * back the case mutation it belongs to).
 */
export interface CaseAuditWriter {
  write(tx: TxClient, record: CaseAuditRecord): Promise<void>;
}

/**
 * Append-only by construction: this package exposes create only — no update
 * or delete of audit rows exists anywhere in the repository layer.
 * The restricted-field guard runs BEFORE the insert, inside the transaction,
 * so a payload carrying member IDs / policy numbers / credentials aborts the
 * whole mutation (docs/governance + tests/security).
 */
export class PrismaCaseAuditWriter implements CaseAuditWriter {
  async write(tx: TxClient, record: CaseAuditRecord): Promise<void> {
    assertNoRestrictedFields(record.metadata);
    await tx.auditEvent.create({
      data: {
        organizationId: record.organizationId,
        caseId: record.caseId,
        actorType: record.actor.actorType,
        actorId: record.actor.actorId,
        action: record.action,
        objectType: record.objectType,
        objectId: record.objectId,
        reason: record.reason,
        modelMetadata: record.metadata as Prisma.InputJsonValue | undefined,
        previousStateHash: record.previousStateHash,
        newStateHash: record.newStateHash,
        timestamp: record.occurredAt,
      },
    });
  }
}
