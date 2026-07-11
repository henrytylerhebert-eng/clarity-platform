import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import {
  canTransitionCase,
  canTransitionWorkstream,
  CASE_STATUSES,
  WORKSTREAM_STATUSES,
  WORKSTREAMS,
  type AuditActor,
  type CaseRepository,
  type CaseStatus,
  type MutationOptions,
  type Workstream,
  type WorkstreamStatus,
} from "@clarity/domain-contracts";
import { domainToCreateRow, rowToDomain, WORKSTREAM_COLUMNS, type PersistedCase } from "./mappers.js";
import { PrismaCaseAuditWriter, type CaseAuditWriter } from "./auditWriter.js";

/**
 * Audit action vocabulary from REQUIREMENTS_TRACEABILITY.md (REQ-001…REQ-003).
 */
export const CASE_AUDIT_ACTIONS = {
  created: "CASE_CREATED",
  statusChanged: "CASE_STATUS_CHANGED",
  workstreamChanged: "CASE_WORKSTREAM_CHANGED",
} as const;

const OBJECT_TYPE = "BehavioralHealthCase";

/**
 * Uniform miss error. The same message is thrown whether the case does not
 * exist at all or exists in another organization — a cross-tenant caller
 * learns nothing about other tenants' data.
 */
export class CaseNotFoundError extends Error {
  constructor(caseKey: string) {
    super(`Case "${caseKey}" not found in this organization`);
    this.name = "CaseNotFoundError";
  }
}

function assertActor(actor: AuditActor): void {
  if (!actor.actorId || !["USER", "AGENT", "SYSTEM"].includes(actor.actorType)) {
    throw new Error("A valid audit actor (actorType, actorId) is required for every mutation");
  }
}

/**
 * Tenant-scoped, Prisma-backed CaseRepository.
 *
 * Invariants:
 * - every query and write carries `organizationId` in the database predicate;
 *   a case ID alone is never sufficient (reads use findFirst{id, organizationId};
 *   writes use updateMany{id, organizationId, <expected prior state>})
 * - every mutation and its audit event commit in ONE transaction
 * - state changes revalidate the domain state machines inside the transaction
 *   and the prior state is part of the UPDATE predicate (optimistic concurrency)
 */
export class PrismaCaseRepository implements CaseRepository<PersistedCase> {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly auditWriter: CaseAuditWriter = new PrismaCaseAuditWriter(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  async create(
    organizationId: string,
    data: PersistedCase,
    actor: AuditActor,
    options?: MutationOptions,
  ): Promise<PersistedCase> {
    assertActor(actor);
    const createInput = domainToCreateRow(organizationId, data);
    try {
      const row = await this.prisma.$transaction(async (tx) => {
        const created = await tx.behavioralHealthCase.create({ data: createInput });
        await this.auditWriter.write(tx, {
          organizationId,
          caseId: created.id,
          action: CASE_AUDIT_ACTIONS.created,
          actor,
          objectType: OBJECT_TYPE,
          objectId: created.id,
          reason: options?.reason,
          metadata: { ...options?.metadata, status: created.status, urgency: created.urgency },
          occurredAt: this.now(),
        });
        return created;
      });
      return rowToDomain(row);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        // Deliberately does not confirm where the key is in use (no cross-tenant leak).
        throw new Error(`Case key "${data.caseKey}" is unavailable`);
      }
      throw e;
    }
  }

  async findByKey(organizationId: string, caseKey: string): Promise<PersistedCase | undefined> {
    const row = await this.prisma.behavioralHealthCase.findFirst({
      where: { id: caseKey, organizationId },
    });
    return row ? rowToDomain(row) : undefined;
  }

  async listForOrganization(organizationId: string): Promise<PersistedCase[]> {
    const rows = await this.prisma.behavioralHealthCase.findMany({
      where: { organizationId },
      orderBy: [{ openedAt: "asc" }, { id: "asc" }],
    });
    return rows.map(rowToDomain);
  }

  async transitionStatus(
    organizationId: string,
    caseKey: string,
    to: string,
    actor: AuditActor,
    options?: MutationOptions,
  ): Promise<PersistedCase> {
    assertActor(actor);
    if (!(CASE_STATUSES as readonly string[]).includes(to)) {
      throw new Error(`Unknown case status "${to}"`);
    }
    const target = to as CaseStatus;
    const row = await this.prisma.$transaction(async (tx) => {
      const current = await tx.behavioralHealthCase.findFirst({
        where: { id: caseKey, organizationId },
        select: { id: true, status: true },
      });
      if (!current) throw new CaseNotFoundError(caseKey);
      if (!canTransitionCase(current.status as CaseStatus, target)) {
        throw new Error(`Invalid case transition: ${current.status} -> ${target}`);
      }
      const updated = await tx.behavioralHealthCase.updateMany({
        where: { id: caseKey, organizationId, status: current.status },
        data: {
          status: target,
          version: { increment: 1 },
          ...(target === "CLOSED" ? { closedAt: this.now() } : {}),
        },
      });
      if (updated.count !== 1) {
        throw new Error(`Case "${caseKey}" was modified concurrently; transition aborted`);
      }
      await this.auditWriter.write(tx, {
        organizationId,
        caseId: caseKey,
        action: CASE_AUDIT_ACTIONS.statusChanged,
        actor,
        objectType: OBJECT_TYPE,
        objectId: caseKey,
        reason: options?.reason,
        metadata: { ...options?.metadata, from: current.status, to: target },
        occurredAt: this.now(),
      });
      const fresh = await tx.behavioralHealthCase.findFirst({ where: { id: caseKey, organizationId } });
      if (!fresh) throw new CaseNotFoundError(caseKey);
      return fresh;
    });
    return rowToDomain(row);
  }

  async updateWorkstream(
    organizationId: string,
    caseKey: string,
    workstream: string,
    to: string,
    actor: AuditActor,
    options?: MutationOptions,
  ): Promise<PersistedCase> {
    assertActor(actor);
    if (!(WORKSTREAMS as readonly string[]).includes(workstream)) {
      throw new Error(`Unknown workstream "${workstream}"`);
    }
    if (!(WORKSTREAM_STATUSES as readonly string[]).includes(to)) {
      throw new Error(`Unknown workstream status "${to}"`);
    }
    const ws = workstream as Workstream;
    const target = to as WorkstreamStatus;
    const column = WORKSTREAM_COLUMNS[ws];
    const row = await this.prisma.$transaction(async (tx) => {
      const current = await tx.behavioralHealthCase.findFirst({
        where: { id: caseKey, organizationId },
        select: { id: true, [column]: true } as never,
      });
      if (!current) throw new CaseNotFoundError(caseKey);
      const from = (current as Record<string, unknown>)[column] as WorkstreamStatus;
      if (!canTransitionWorkstream(from, target)) {
        throw new Error(`Invalid ${ws} transition: ${from} -> ${target}`);
      }
      const updated = await tx.behavioralHealthCase.updateMany({
        where: { id: caseKey, organizationId, [column]: from },
        data: { [column]: target, version: { increment: 1 } },
      });
      if (updated.count !== 1) {
        throw new Error(`Case "${caseKey}" was modified concurrently; workstream update aborted`);
      }
      await this.auditWriter.write(tx, {
        organizationId,
        caseId: caseKey,
        action: CASE_AUDIT_ACTIONS.workstreamChanged,
        actor,
        objectType: OBJECT_TYPE,
        objectId: caseKey,
        reason: options?.reason,
        metadata: { ...options?.metadata, workstream: ws, from, to: target },
        occurredAt: this.now(),
      });
      const fresh = await tx.behavioralHealthCase.findFirst({ where: { id: caseKey, organizationId } });
      if (!fresh) throw new CaseNotFoundError(caseKey);
      return fresh;
    });
    return rowToDomain(row);
  }
}
