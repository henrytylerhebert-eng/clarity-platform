import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type { AuditActor } from "@clarity/domain-contracts";
import { domainToCreateRow, rowToDomain, WORKSTREAM_COLUMNS, type PersistedCase } from "./mappers.js";
import { caseStateHash } from "./stateHash.js";
import { CaseNotFoundError } from "./prismaCaseRepository.js";
import { PrismaCaseAuditWriter, type CaseAuditWriter } from "./auditWriter.js";

/** Thrown when expectedVersion is stale or another writer won the race. */
export class ConcurrencyConflictError extends Error {
  constructor(caseKey: string) {
    super(`Case "${caseKey}" was modified by someone else; refresh and retry with the current version`);
    this.name = "ConcurrencyConflictError";
  }
}

/** Thrown when an idempotency key is reused with a different command. */
export class IdempotencyConflictError extends Error {
  constructor(key: string) {
    super(`Idempotency key "${key}" was already used by a different command`);
    this.name = "IdempotencyConflictError";
  }
}

/** Column-level changes a command may apply. Empty object = audit-only command. */
export interface CaseChanges {
  status?: PersistedCase["status"];
  urgency?: PersistedCase["urgency"];
  currentLocation?: string | null;
  assignedUserId?: string | null;
  workstream?: { workstream: keyof typeof WORKSTREAM_COLUMNS; to: string };
  closedAt?: Date | null;
}

/** What a command decided, given the fresh in-transaction case state. */
export interface CommandDecision {
  changes: CaseChanges;
  auditAction: string;
  auditMetadata?: Record<string, unknown>;
}

export interface ExecuteCommandParams {
  organizationId: string;
  caseKey: string;
  /** Stale value → ConcurrencyConflictError before any write. */
  expectedVersion?: number;
  actor: AuditActor;
  commandType: string;
  correlationId?: string;
  idempotencyKey?: string;
  reason?: string;
  /**
   * When set, the command only commits if this user exists in the SAME
   * organization with status ACTIVE. Checked twice, both inside the
   * transaction: an early scoped read (non-revealing CaseNotFoundError on
   * miss), and again as a relation predicate on the conditional UPDATE
   * itself, so a membership/status change committed between the read and
   * the write makes the UPDATE match zero rows and the whole command roll
   * back (ConcurrencyConflictError) — no TOCTOU window outside the
   * database's own visibility rules.
   */
  requireActiveAssignee?: string;
  /**
   * Pure decision function, called INSIDE the transaction with the freshly
   * read case. All domain validation (state machine, permissions, terminal
   * rules) throws from here; the transaction then rolls back untouched.
   * May be async (used by tests to deterministically interleave concurrent
   * writes into the transaction window).
   */
  decide: (current: PersistedCase) => CommandDecision | Promise<CommandDecision>;
}

export interface CommandResult {
  case: PersistedCase;
  /** True when an idempotency key replayed a previously completed command. */
  replayed: boolean;
}

export interface CreateCaseParams {
  organizationId: string;
  data: PersistedCase;
  actor: AuditActor;
  commandType: string;
  correlationId?: string;
  idempotencyKey?: string;
  reason?: string;
  auditAction: string;
  auditMetadata?: Record<string, unknown>;
}

function changesToColumns(changes: CaseChanges, now: () => Date): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (changes.status !== undefined) {
    data.status = changes.status;
    if (changes.status === "CLOSED") data.closedAt = now();
  }
  if (changes.urgency !== undefined) data.urgency = changes.urgency;
  if (changes.currentLocation !== undefined) data.currentLocation = changes.currentLocation;
  if (changes.assignedUserId !== undefined) data.assignedUserId = changes.assignedUserId;
  if (changes.closedAt !== undefined) data.closedAt = changes.closedAt;
  if (changes.workstream) data[WORKSTREAM_COLUMNS[changes.workstream.workstream]] = changes.workstream.to;
  return data;
}

function isIdempotencyUniqueViolation(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError &&
    e.code === "P2002" &&
    String(e.meta?.modelName ?? "").includes("CommandIdempotencyRecord")
  );
}

/**
 * The single approved Prisma adapter for case commands.
 *
 * Every command runs in ONE transaction:
 *   idempotency check → scoped versioned read → decide (domain validation)
 *   → conditional write { id, organizationId, version } → audit insert with
 *   previous/new state hashes → idempotency record → scoped re-read.
 *
 * Tenancy is in every predicate; the version predicate makes concurrent
 * writers fail with ConcurrencyConflictError instead of overwriting.
 */
export class PrismaCaseCommandGateway {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly auditWriter: CaseAuditWriter = new PrismaCaseAuditWriter(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  private async replayFromRecord(
    record: { commandType: string; caseId: string | null; idempotencyKey: string },
    organizationId: string,
    commandType: string,
  ): Promise<CommandResult> {
    if (record.commandType !== commandType || !record.caseId) {
      throw new IdempotencyConflictError(record.idempotencyKey);
    }
    const row = await this.prisma.behavioralHealthCase.findFirst({
      where: { id: record.caseId, organizationId },
    });
    if (!row) throw new CaseNotFoundError(record.caseId);
    return { case: rowToDomain(row), replayed: true };
  }

  async executeCreate(params: CreateCaseParams): Promise<CommandResult> {
    const { organizationId, idempotencyKey, commandType } = params;
    if (idempotencyKey) {
      const existing = await this.prisma.commandIdempotencyRecord.findUnique({
        where: { organizationId_idempotencyKey: { organizationId, idempotencyKey } },
      });
      if (existing) return this.replayFromRecord(existing, organizationId, commandType);
    }
    try {
      const row = await this.prisma.$transaction(async (tx) => {
        const created = await tx.behavioralHealthCase.create({
          data: domainToCreateRow(organizationId, params.data),
        });
        await this.auditWriter.write(tx, {
          organizationId,
          caseId: created.id,
          action: params.auditAction,
          actor: params.actor,
          objectType: "BehavioralHealthCase",
          objectId: created.id,
          reason: params.reason,
          metadata: {
            ...params.auditMetadata,
            command: commandType,
            correlationId: params.correlationId,
            status: created.status,
            urgency: created.urgency,
          },
          newStateHash: caseStateHash(rowToDomain(created)),
          occurredAt: this.now(),
        });
        if (idempotencyKey) {
          await tx.commandIdempotencyRecord.create({
            data: {
              organizationId,
              idempotencyKey,
              commandType,
              caseId: created.id,
              resultVersion: created.version,
            },
          });
        }
        return created;
      });
      return { case: rowToDomain(row), replayed: false };
    } catch (e) {
      if (idempotencyKey && isIdempotencyUniqueViolation(e)) {
        // Lost a same-key race: the other attempt committed; replay it.
        const record = await this.prisma.commandIdempotencyRecord.findUnique({
          where: { organizationId_idempotencyKey: { organizationId, idempotencyKey } },
        });
        if (record) return this.replayFromRecord(record, organizationId, commandType);
      }
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new Error(`Case key "${params.data.caseKey}" is unavailable`, { cause: e });
      }
      throw e;
    }
  }

  async executeCommand(params: ExecuteCommandParams): Promise<CommandResult> {
    const { organizationId, caseKey, idempotencyKey, commandType } = params;
    if (idempotencyKey) {
      const existing = await this.prisma.commandIdempotencyRecord.findUnique({
        where: { organizationId_idempotencyKey: { organizationId, idempotencyKey } },
      });
      if (existing) return this.replayFromRecord(existing, organizationId, commandType);
    }
    try {
      const row = await this.prisma.$transaction(async (tx) => {
        const currentRow = await tx.behavioralHealthCase.findFirst({
          where: { id: caseKey, organizationId },
        });
        if (!currentRow) throw new CaseNotFoundError(caseKey);
        const current = rowToDomain(currentRow);
        if (params.expectedVersion !== undefined && params.expectedVersion !== current.version) {
          throw new ConcurrencyConflictError(caseKey);
        }
        if (params.requireActiveAssignee) {
          // Same non-revealing miss semantics as a case lookup: a caller
          // cannot distinguish "no such user", "other tenant's user", and
          // "inactive user".
          const assignee = await tx.user.findFirst({
            where: { id: params.requireActiveAssignee, organizationId, status: "ACTIVE" },
            select: { id: true },
          });
          if (!assignee) throw new CaseNotFoundError(params.requireActiveAssignee);
        }
        const decision = await params.decide(current);
        const previousStateHash = caseStateHash(current);

        const updated = await tx.behavioralHealthCase.updateMany({
          where: {
            id: caseKey,
            organizationId,
            version: current.version,
            // Re-asserted at write time: the UPDATE's own predicate (an EXISTS
            // subquery in SQL) must still see an ACTIVE same-org assignee.
            ...(params.requireActiveAssignee
              ? {
                  organization: {
                    users: { some: { id: params.requireActiveAssignee, status: "ACTIVE" } },
                  },
                }
              : {}),
          },
          data: { ...changesToColumns(decision.changes, this.now), version: { increment: 1 } },
        });
        if (updated.count !== 1) throw new ConcurrencyConflictError(caseKey);

        const freshRow = await tx.behavioralHealthCase.findFirst({
          where: { id: caseKey, organizationId },
        });
        if (!freshRow) throw new CaseNotFoundError(caseKey);
        const fresh = rowToDomain(freshRow);

        await this.auditWriter.write(tx, {
          organizationId,
          caseId: caseKey,
          action: decision.auditAction,
          actor: params.actor,
          objectType: "BehavioralHealthCase",
          objectId: caseKey,
          reason: params.reason,
          metadata: {
            ...decision.auditMetadata,
            command: commandType,
            correlationId: params.correlationId,
          },
          previousStateHash,
          newStateHash: caseStateHash(fresh),
          occurredAt: this.now(),
        });
        if (idempotencyKey) {
          await tx.commandIdempotencyRecord.create({
            data: {
              organizationId,
              idempotencyKey,
              commandType,
              caseId: caseKey,
              resultVersion: freshRow.version,
            },
          });
        }
        return freshRow;
      });
      return { case: rowToDomain(row), replayed: false };
    } catch (e) {
      if (idempotencyKey && isIdempotencyUniqueViolation(e)) {
        const record = await this.prisma.commandIdempotencyRecord.findUnique({
          where: { organizationId_idempotencyKey: { organizationId, idempotencyKey } },
        });
        if (record) return this.replayFromRecord(record, organizationId, commandType);
      }
      throw e;
    }
  }
}
