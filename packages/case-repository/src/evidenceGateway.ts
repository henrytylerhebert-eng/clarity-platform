import { createHash, randomUUID } from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import {
  canTransitionEvidence,
  type AuditActor,
  type ClarityContradictionGroup,
  type ClarityEvidence,
  type ContradictionClassification,
  type EvidenceCategory,
  type EvidenceStatus,
} from "@clarity/domain-contracts";
import { contradictionGroupRowToDomain, evidenceRowToDomain } from "./evidenceMappers.js";
import { CaseNotFoundError } from "./prismaCaseRepository.js";
import { DocumentNotFoundError } from "./documentGateway.js";
import { PrismaCaseAuditWriter, type CaseAuditWriter, type TxClient } from "./auditWriter.js";

/** Non-revealing miss: same error whether the item is absent, another tenant's, or another case's. */
export class EvidenceNotFoundError extends Error {
  constructor(evidenceId: string) {
    super(`Evidence "${evidenceId}" not found for this case`);
    this.name = "EvidenceNotFoundError";
  }
}

export class EvidenceConcurrencyConflictError extends Error {
  constructor(evidenceId: string) {
    super(`Evidence "${evidenceId}" was modified by someone else; refresh and retry`);
    this.name = "EvidenceConcurrencyConflictError";
  }
}

/** Thrown when the requested review action is not legal from the item's current status. */
export class EvidenceStateError extends Error {
  constructor(evidenceId: string, from: EvidenceStatus, to: EvidenceStatus) {
    super(`Evidence "${evidenceId}" cannot move ${from} -> ${to}`);
    this.name = "EvidenceStateError";
  }
}

/** Policy: evidence may not cite a document whose classification is REJECTED. */
export class RejectedSourceDocumentError extends Error {
  constructor(documentId: string) {
    super(`Document "${documentId}" was rejected during classification and cannot source evidence`);
    this.name = "RejectedSourceDocumentError";
  }
}

export class ContradictionGroupNotFoundError extends Error {
  constructor(groupId: string) {
    super(`Contradiction group "${groupId}" not found for this case`);
    this.name = "ContradictionGroupNotFoundError";
  }
}

export class ContradictionMembershipError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContradictionMembershipError";
  }
}

const EVIDENCE_OBJECT_TYPE = "EvidenceItem";
const GROUP_OBJECT_TYPE = "ContradictionGroup";

/** Hash stands in for source text in audit rows — never the text itself. */
function textHash(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function isIdempotencyUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    (e as { code?: string }).code === "P2002" &&
    String((e as { meta?: { modelName?: string } }).meta?.modelName ?? "").includes(
      "CommandIdempotencyRecord",
    )
  );
}

export interface EvidenceSourceFields {
  documentId: string;
  category: EvidenceCategory;
  subcategory?: string | null;
  originalText: string;
  normalizedValue?: unknown;
  pageNumber?: number | null;
  sectionLabel?: string | null;
  sourceAuthor?: string | null;
  sourceTimestamp?: Date | null;
}

export interface CreateEvidenceParams {
  organizationId: string;
  caseId: string;
  source: EvidenceSourceFields;
  createdBy: string;
  actor: AuditActor;
  commandType: string;
  correlationId?: string;
  idempotencyKey?: string;
  reason?: string;
  auditAction: string;
}

/**
 * Reviewable mutations a command may apply. `originalText` is deliberately
 * NOT representable here — source-text immutability is enforced by
 * construction, not by convention (ADR-0008).
 */
export interface EvidenceChanges {
  status?: EvidenceStatus;
  normalizedValue?: unknown;
  subcategory?: string | null;
  pageNumber?: number | null;
  sectionLabel?: string | null;
  reviewerNote?: string | null;
  /** Set on review decisions; stamped with the gateway clock. */
  markReviewed?: boolean;
}

export interface EvidenceCommandDecision {
  changes: EvidenceChanges;
  auditAction: string;
  auditMetadata?: Record<string, unknown>;
}

export interface ExecuteEvidenceCommandParams {
  organizationId: string;
  caseId: string;
  evidenceId: string;
  expectedVersion?: number;
  actor: AuditActor;
  commandType: string;
  correlationId?: string;
  idempotencyKey?: string;
  reason?: string;
  decide: (current: ClarityEvidence) => EvidenceCommandDecision;
}

export interface EvidenceCommandResult {
  evidence: ClarityEvidence;
  replayed: boolean;
}

export interface SupersedeEvidenceParams {
  organizationId: string;
  caseId: string;
  evidenceId: string;
  expectedVersion?: number;
  replacement: EvidenceSourceFields;
  createdBy: string;
  actor: AuditActor;
  commandType: string;
  correlationId?: string;
  idempotencyKey?: string;
  reason: string;
}

export interface SupersedeEvidenceResult {
  superseded: ClarityEvidence;
  replacement: ClarityEvidence;
  replayed: boolean;
}

/**
 * The single approved Prisma adapter for evidence commands (ADR-0008).
 * Same discipline as the case/document gateways: tenancy in every predicate
 * (case, document, and evidence ownership checked together, inside the
 * transaction), optimistic concurrency via a version predicate on every
 * UPDATE, one atomic audit event per mutation, idempotency records with
 * `objectId` so replays rehydrate the exact object without re-executing.
 */
export class PrismaEvidenceGateway {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly auditWriter: CaseAuditWriter = new PrismaCaseAuditWriter(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  private async findIdempotencyRecord(organizationId: string, idempotencyKey: string) {
    return this.prisma.commandIdempotencyRecord.findUnique({
      where: { organizationId_idempotencyKey: { organizationId, idempotencyKey } },
    });
  }

  private async replayEvidence(
    record: { commandType: string; objectId: string | null; idempotencyKey: string },
    organizationId: string,
    commandType: string,
  ): Promise<EvidenceCommandResult> {
    if (record.commandType !== commandType || !record.objectId) {
      throw new Error(`Idempotency key "${record.idempotencyKey}" was already used by a different command`);
    }
    const row = await this.prisma.evidenceItem.findFirst({
      where: { id: record.objectId, organizationId },
    });
    if (!row) throw new EvidenceNotFoundError(record.objectId);
    return { evidence: evidenceRowToDomain(row), replayed: true };
  }

  /** Case + document + tenant ownership checked together, inside the transaction. */
  private async assertSourceOwnership(
    tx: TxClient,
    organizationId: string,
    caseId: string,
    documentId: string,
  ): Promise<void> {
    const caseRow = await tx.behavioralHealthCase.findFirst({
      where: { id: caseId, organizationId },
      select: { id: true },
    });
    if (!caseRow) throw new CaseNotFoundError(caseId);
    const doc = await tx.sourceDocument.findFirst({
      where: { id: documentId, caseId, organizationId },
      select: { id: true, classificationStatus: true },
    });
    if (!doc) throw new DocumentNotFoundError(documentId);
    if (doc.classificationStatus === "REJECTED") throw new RejectedSourceDocumentError(documentId);
  }

  private sourceToRow(
    organizationId: string,
    caseId: string,
    source: EvidenceSourceFields,
    createdBy: string,
    ids: { id: string; evidenceFamilyId: string },
  ) {
    return {
      id: ids.id,
      evidenceFamilyId: ids.evidenceFamilyId,
      caseId,
      organizationId,
      documentId: source.documentId,
      category: source.category,
      subcategory: source.subcategory ?? null,
      originalText: source.originalText,
      normalizedValue: (source.normalizedValue ?? undefined) as Prisma.InputJsonValue | undefined,
      pageNumber: source.pageNumber ?? null,
      sectionLabel: source.sectionLabel ?? null,
      sourceAuthor: source.sourceAuthor ?? null,
      sourceTimestamp: source.sourceTimestamp ?? null,
      extractionConfidence: null, // human entry: confidence is reserved for future automation
      status: "CANDIDATE" as const, // nothing is approved at creation
      creationMethod: "HUMAN_ENTRY",
      createdBy,
      version: 0,
    };
  }

  async createEvidence(params: CreateEvidenceParams): Promise<EvidenceCommandResult> {
    const { organizationId, caseId, idempotencyKey, commandType } = params;
    if (idempotencyKey) {
      const existing = await this.findIdempotencyRecord(organizationId, idempotencyKey);
      if (existing) return this.replayEvidence(existing, organizationId, commandType);
    }
    try {
      const row = await this.prisma.$transaction(async (tx) => {
        await this.assertSourceOwnership(tx, organizationId, caseId, params.source.documentId);
        const id = randomUUID();
        const created = await tx.evidenceItem.create({
          data: this.sourceToRow(organizationId, caseId, params.source, params.createdBy, {
            id,
            evidenceFamilyId: id,
          }),
        });
        await this.auditWriter.write(tx, {
          organizationId,
          caseId,
          action: params.auditAction,
          actor: params.actor,
          objectType: EVIDENCE_OBJECT_TYPE,
          objectId: created.id,
          reason: params.reason,
          metadata: {
            command: commandType,
            correlationId: params.correlationId,
            category: created.category,
            documentId: created.documentId,
            originalTextSha256: textHash(created.originalText),
            creationMethod: created.creationMethod,
          },
          occurredAt: this.now(),
        });
        if (idempotencyKey) {
          await tx.commandIdempotencyRecord.create({
            data: {
              organizationId,
              idempotencyKey,
              commandType,
              caseId,
              objectId: created.id,
              resultVersion: created.version,
            },
          });
        }
        return created;
      });
      return { evidence: evidenceRowToDomain(row), replayed: false };
    } catch (e) {
      if (idempotencyKey && isIdempotencyUniqueViolation(e)) {
        const record = await this.findIdempotencyRecord(organizationId, idempotencyKey);
        if (record) return this.replayEvidence(record, organizationId, commandType);
      }
      throw e;
    }
  }

  async executeEvidenceCommand(params: ExecuteEvidenceCommandParams): Promise<EvidenceCommandResult> {
    const { organizationId, caseId, evidenceId, idempotencyKey, commandType } = params;
    if (idempotencyKey) {
      const existing = await this.findIdempotencyRecord(organizationId, idempotencyKey);
      if (existing) return this.replayEvidence(existing, organizationId, commandType);
    }
    try {
      const row = await this.prisma.$transaction(async (tx) => {
        const currentRow = await tx.evidenceItem.findFirst({
          where: { id: evidenceId, organizationId, caseId },
        });
        if (!currentRow) throw new EvidenceNotFoundError(evidenceId);
        const current = evidenceRowToDomain(currentRow);
        if (params.expectedVersion !== undefined && params.expectedVersion !== current.version) {
          throw new EvidenceConcurrencyConflictError(evidenceId);
        }
        const decision = params.decide(current);
        const c = decision.changes;
        const data: Record<string, unknown> = {};
        if (c.status !== undefined) data.status = c.status;
        if (c.normalizedValue !== undefined) data.normalizedValue = c.normalizedValue as Prisma.InputJsonValue;
        if (c.subcategory !== undefined) data.subcategory = c.subcategory;
        if (c.pageNumber !== undefined) data.pageNumber = c.pageNumber;
        if (c.sectionLabel !== undefined) data.sectionLabel = c.sectionLabel;
        if (c.reviewerNote !== undefined) data.reviewerNote = c.reviewerNote;
        if (c.markReviewed) {
          data.reviewedBy = params.actor.actorId;
          data.reviewedAt = this.now();
        }
        const updated = await tx.evidenceItem.updateMany({
          where: { id: evidenceId, organizationId, caseId, version: current.version },
          data: { ...data, version: { increment: 1 } },
        });
        if (updated.count !== 1) throw new EvidenceConcurrencyConflictError(evidenceId);

        const fresh = await tx.evidenceItem.findFirst({ where: { id: evidenceId, organizationId, caseId } });
        if (!fresh) throw new EvidenceNotFoundError(evidenceId);

        await this.auditWriter.write(tx, {
          organizationId,
          caseId,
          action: decision.auditAction,
          actor: params.actor,
          objectType: EVIDENCE_OBJECT_TYPE,
          objectId: evidenceId,
          reason: params.reason,
          metadata: {
            ...decision.auditMetadata,
            command: commandType,
            correlationId: params.correlationId,
          },
          occurredAt: this.now(),
        });
        if (idempotencyKey) {
          await tx.commandIdempotencyRecord.create({
            data: {
              organizationId,
              idempotencyKey,
              commandType,
              caseId,
              objectId: evidenceId,
              resultVersion: fresh.version,
            },
          });
        }
        return fresh;
      });
      return { evidence: evidenceRowToDomain(row), replayed: false };
    } catch (e) {
      if (idempotencyKey && isIdempotencyUniqueViolation(e)) {
        const record = await this.findIdempotencyRecord(organizationId, idempotencyKey);
        if (record) return this.replayEvidence(record, organizationId, commandType);
      }
      throw e;
    }
  }

  /**
   * A material correction of reviewed evidence: the old item is frozen as
   * SUPERSEDED (never edited) and a NEW candidate item joins the same
   * evidence family — one transaction, two audit events (EVIDENCE_CREATED
   * for the replacement, EVIDENCE_SUPERSEDED for the original).
   */
  async supersedeEvidence(params: SupersedeEvidenceParams): Promise<SupersedeEvidenceResult> {
    const { organizationId, caseId, evidenceId, idempotencyKey, commandType } = params;
    if (idempotencyKey) {
      const existing = await this.findIdempotencyRecord(organizationId, idempotencyKey);
      if (existing) {
        const replacement = await this.replayEvidence(existing, organizationId, commandType);
        const oldRow = await this.prisma.evidenceItem.findFirst({
          where: { supersededById: replacement.evidence.evidenceId, organizationId, caseId },
        });
        if (!oldRow) throw new EvidenceNotFoundError(evidenceId);
        return { superseded: evidenceRowToDomain(oldRow), replacement: replacement.evidence, replayed: true };
      }
    }
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const oldRow = await tx.evidenceItem.findFirst({
          where: { id: evidenceId, organizationId, caseId },
        });
        if (!oldRow) throw new EvidenceNotFoundError(evidenceId);
        const old = evidenceRowToDomain(oldRow);
        if (params.expectedVersion !== undefined && params.expectedVersion !== old.version) {
          throw new EvidenceConcurrencyConflictError(evidenceId);
        }
        if (!canTransitionEvidence(old.status, "SUPERSEDED")) {
          throw new EvidenceStateError(evidenceId, old.status, "SUPERSEDED");
        }
        await this.assertSourceOwnership(tx, organizationId, caseId, params.replacement.documentId);

        const newId = randomUUID();
        const created = await tx.evidenceItem.create({
          data: this.sourceToRow(organizationId, caseId, params.replacement, params.createdBy, {
            id: newId,
            evidenceFamilyId: old.evidenceFamilyId, // correction chain preserved
          }),
        });
        const updated = await tx.evidenceItem.updateMany({
          where: { id: evidenceId, organizationId, caseId, version: old.version },
          data: { status: "SUPERSEDED", supersededById: newId, version: { increment: 1 } },
        });
        if (updated.count !== 1) throw new EvidenceConcurrencyConflictError(evidenceId);

        await this.auditWriter.write(tx, {
          organizationId,
          caseId,
          action: "EVIDENCE_CREATED",
          actor: params.actor,
          objectType: EVIDENCE_OBJECT_TYPE,
          objectId: newId,
          reason: params.reason,
          metadata: {
            command: commandType,
            correlationId: params.correlationId,
            category: created.category,
            documentId: created.documentId,
            originalTextSha256: textHash(created.originalText),
            creationMethod: created.creationMethod,
            replacesEvidenceId: evidenceId,
            evidenceFamilyId: old.evidenceFamilyId,
          },
          occurredAt: this.now(),
        });
        await this.auditWriter.write(tx, {
          organizationId,
          caseId,
          action: "EVIDENCE_SUPERSEDED",
          actor: params.actor,
          objectType: EVIDENCE_OBJECT_TYPE,
          objectId: evidenceId,
          reason: params.reason,
          metadata: {
            command: commandType,
            correlationId: params.correlationId,
            supersededById: newId,
            previousStatus: old.status,
            evidenceFamilyId: old.evidenceFamilyId,
          },
          occurredAt: this.now(),
        });
        if (idempotencyKey) {
          await tx.commandIdempotencyRecord.create({
            data: {
              organizationId,
              idempotencyKey,
              commandType,
              caseId,
              objectId: newId,
              resultVersion: created.version,
            },
          });
        }
        const frozen = await tx.evidenceItem.findFirst({ where: { id: evidenceId, organizationId, caseId } });
        if (!frozen) throw new EvidenceNotFoundError(evidenceId);
        return { frozen, created };
      });
      return {
        superseded: evidenceRowToDomain(result.frozen),
        replacement: evidenceRowToDomain(result.created),
        replayed: false,
      };
    } catch (e) {
      if (idempotencyKey && isIdempotencyUniqueViolation(e)) {
        return this.supersedeEvidence(params); // record now exists; replay path runs
      }
      throw e;
    }
  }

  async createContradictionGroup(params: {
    organizationId: string;
    caseId: string;
    evidenceIds: readonly string[];
    createdBy: string;
    actor: AuditActor;
    commandType: string;
    correlationId?: string;
    reason?: string;
  }): Promise<ClarityContradictionGroup> {
    const { organizationId, caseId } = params;
    const row = await this.prisma.$transaction(async (tx) => {
      const caseRow = await tx.behavioralHealthCase.findFirst({
        where: { id: caseId, organizationId },
        select: { id: true },
      });
      if (!caseRow) throw new CaseNotFoundError(caseId);

      // Every member must be this tenant's, this case's, and ungrouped.
      const members = await tx.evidenceItem.findMany({
        where: { id: { in: [...params.evidenceIds] }, organizationId, caseId },
        select: { id: true, contradictionGroupId: true },
      });
      const found = new Set(members.map((m) => m.id));
      const missing = params.evidenceIds.find((id) => !found.has(id));
      if (missing) throw new EvidenceNotFoundError(missing);
      const grouped = members.find((m) => m.contradictionGroupId !== null);
      if (grouped) {
        throw new ContradictionMembershipError(
          `Evidence "${grouped.id}" already belongs to a contradiction group`,
        );
      }

      const group = await tx.contradictionGroup.create({
        data: { id: randomUUID(), organizationId, caseId, createdBy: params.createdBy },
      });
      // Re-asserted at write time: every member must STILL be ungrouped when
      // the UPDATE runs, and every requested member must be claimed. If a
      // concurrent transaction grouped any member after the pre-read, the
      // count falls short and the whole transaction (group row included)
      // rolls back — no silent membership overwrite.
      const claimed = await tx.evidenceItem.updateMany({
        where: { id: { in: [...params.evidenceIds] }, organizationId, caseId, contradictionGroupId: null },
        data: { contradictionGroupId: group.id, version: { increment: 1 } },
      });
      if (claimed.count !== params.evidenceIds.length) {
        throw new ContradictionMembershipError(
          "One or more evidence items were grouped concurrently; refresh and retry",
        );
      }
      await this.auditWriter.write(tx, {
        organizationId,
        caseId,
        action: "CONTRADICTION_GROUP_CREATED",
        actor: params.actor,
        objectType: GROUP_OBJECT_TYPE,
        objectId: group.id,
        reason: params.reason,
        metadata: {
          command: params.commandType,
          correlationId: params.correlationId,
          evidenceIds: [...params.evidenceIds],
        },
        occurredAt: this.now(),
      });
      return tx.contradictionGroup.findFirstOrThrow({
        where: { id: group.id },
        include: { items: { select: { id: true } } },
      });
    });
    return contradictionGroupRowToDomain(row);
  }

  async addEvidenceToContradictionGroup(params: {
    organizationId: string;
    caseId: string;
    groupId: string;
    evidenceId: string;
    expectedGroupVersion?: number;
    actor: AuditActor;
    commandType: string;
    correlationId?: string;
    reason?: string;
  }): Promise<ClarityContradictionGroup> {
    const { organizationId, caseId, groupId, evidenceId } = params;
    const row = await this.prisma.$transaction(async (tx) => {
      const group = await tx.contradictionGroup.findFirst({
        where: { id: groupId, organizationId, caseId },
      });
      if (!group) throw new ContradictionGroupNotFoundError(groupId);
      if (params.expectedGroupVersion !== undefined && params.expectedGroupVersion !== group.version) {
        throw new EvidenceConcurrencyConflictError(groupId);
      }
      const member = await tx.evidenceItem.findFirst({
        where: { id: evidenceId, organizationId, caseId },
        select: { id: true, contradictionGroupId: true },
      });
      if (!member) throw new EvidenceNotFoundError(evidenceId);
      if (member.contradictionGroupId !== null) {
        throw new ContradictionMembershipError(
          `Evidence "${evidenceId}" already belongs to a contradiction group`,
        );
      }
      const claimed = await tx.evidenceItem.updateMany({
        where: { id: evidenceId, organizationId, caseId, contradictionGroupId: null },
        data: { contradictionGroupId: groupId, version: { increment: 1 } },
      });
      // A lost membership race must fail the command, not bump the group
      // version and write a misleading audit event.
      if (claimed.count !== 1) {
        throw new ContradictionMembershipError(
          `Evidence "${evidenceId}" was grouped concurrently; refresh and retry`,
        );
      }
      const bumped = await tx.contradictionGroup.updateMany({
        where: { id: groupId, organizationId, caseId, version: group.version },
        data: { version: { increment: 1 } },
      });
      if (bumped.count !== 1) throw new EvidenceConcurrencyConflictError(groupId);
      await this.auditWriter.write(tx, {
        organizationId,
        caseId,
        action: "EVIDENCE_ADDED_TO_CONTRADICTION",
        actor: params.actor,
        objectType: GROUP_OBJECT_TYPE,
        objectId: groupId,
        reason: params.reason,
        metadata: {
          command: params.commandType,
          correlationId: params.correlationId,
          evidenceId,
        },
        occurredAt: this.now(),
      });
      return tx.contradictionGroup.findFirstOrThrow({
        where: { id: groupId },
        include: { items: { select: { id: true } } },
      });
    });
    return contradictionGroupRowToDomain(row);
  }

  /**
   * Records what KIND of discrepancy a reviewer judged this to be. Never
   * touches any member item's status — grouping and classification make
   * conflicts visible; they do not resolve which side is correct.
   */
  async resolveContradictionReview(params: {
    organizationId: string;
    caseId: string;
    groupId: string;
    classification: ContradictionClassification;
    reviewNote?: string;
    expectedGroupVersion?: number;
    actor: AuditActor;
    commandType: string;
    correlationId?: string;
    reason?: string;
  }): Promise<ClarityContradictionGroup> {
    const { organizationId, caseId, groupId } = params;
    const row = await this.prisma.$transaction(async (tx) => {
      const group = await tx.contradictionGroup.findFirst({
        where: { id: groupId, organizationId, caseId },
      });
      if (!group) throw new ContradictionGroupNotFoundError(groupId);
      if (params.expectedGroupVersion !== undefined && params.expectedGroupVersion !== group.version) {
        throw new EvidenceConcurrencyConflictError(groupId);
      }
      const updated = await tx.contradictionGroup.updateMany({
        where: { id: groupId, organizationId, caseId, version: group.version },
        data: {
          classification: params.classification,
          reviewNote: params.reviewNote ?? group.reviewNote,
          version: { increment: 1 },
        },
      });
      if (updated.count !== 1) throw new EvidenceConcurrencyConflictError(groupId);
      await this.auditWriter.write(tx, {
        organizationId,
        caseId,
        action: "CONTRADICTION_REVIEW_UPDATED",
        actor: params.actor,
        objectType: GROUP_OBJECT_TYPE,
        objectId: groupId,
        reason: params.reason,
        metadata: {
          command: params.commandType,
          correlationId: params.correlationId,
          classification: params.classification,
          previousClassification: group.classification,
        },
        occurredAt: this.now(),
      });
      return tx.contradictionGroup.findFirstOrThrow({
        where: { id: groupId },
        include: { items: { select: { id: true } } },
      });
    });
    return contradictionGroupRowToDomain(row);
  }

  async findEvidence(
    organizationId: string,
    caseId: string,
    evidenceId: string,
  ): Promise<ClarityEvidence | undefined> {
    const row = await this.prisma.evidenceItem.findFirst({
      where: { id: evidenceId, organizationId, caseId },
    });
    return row ? evidenceRowToDomain(row) : undefined;
  }

  async listEvidenceForCase(organizationId: string, caseId: string): Promise<ClarityEvidence[]> {
    const rows = await this.prisma.evidenceItem.findMany({
      where: { organizationId, caseId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    return rows.map(evidenceRowToDomain);
  }
}
