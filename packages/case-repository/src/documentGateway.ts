import type { PrismaClient } from "@prisma/client";
import {
  canTransitionDocumentClassification,
  type AuditActor,
  type ClarityDocument,
  type DocumentClassificationStatus,
  type DocumentType,
} from "@clarity/domain-contracts";
import { documentRowToDomain } from "./documentMappers.js";
import { CaseNotFoundError } from "./prismaCaseRepository.js";
import { PrismaCaseAuditWriter, type CaseAuditWriter, type TxClient } from "./auditWriter.js";

/** Thrown when a document does not exist for the given case + organization. Non-revealing miss semantics. */
export class DocumentNotFoundError extends Error {
  constructor(documentId: string) {
    super(`Document "${documentId}" not found for this case`);
    this.name = "DocumentNotFoundError";
  }
}

/** Thrown when a classification transition lost a race with another writer. */
export class DocumentConcurrencyConflictError extends Error {
  constructor(documentId: string) {
    super(`Document "${documentId}" was modified by someone else; refresh and retry`);
    this.name = "DocumentConcurrencyConflictError";
  }
}

export interface UploadDocumentParams {
  organizationId: string;
  caseId: string;
  documentType: DocumentType;
  filename: string;
  mimeType: string;
  storageKey: string;
  sha256: string;
  uploadedBy: string;
  sourceOrganization?: string | null;
  authorName?: string | null;
  serviceDate?: Date | null;
  actor: AuditActor;
  commandType: string;
  correlationId?: string;
  reason?: string;
  auditAction: string;
}

export interface UploadDocumentResult {
  document: ClarityDocument;
  /** True when a document with the same sha256 already existed for this case; no new row was created. */
  duplicate: boolean;
}

export interface ClassifyDocumentParams {
  organizationId: string;
  caseId: string;
  documentId: string;
  to: DocumentClassificationStatus;
  /** Stale value (vs. the freshly-read row) → DocumentConcurrencyConflictError before any write. */
  expectedClassificationStatus?: DocumentClassificationStatus;
  actor: AuditActor;
  commandType: string;
  correlationId?: string;
  reason?: string;
  auditAction: string;
}

export interface AccessDocumentParams {
  organizationId: string;
  caseId: string;
  documentId: string;
  actor: AuditActor;
  commandType: string;
  correlationId?: string;
  reason?: string;
  auditAction: string;
}

const OBJECT_TYPE = "SourceDocument";

/**
 * The single approved Prisma adapter for document commands (mirrors
 * PrismaCaseCommandGateway). Every command verifies case ownership
 * ({ id: caseId, organizationId }) before touching a document, and every
 * mutation commits atomically with its audit event.
 */
export class PrismaDocumentGateway {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly auditWriter: CaseAuditWriter = new PrismaCaseAuditWriter(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  private async assertCaseOwnership(tx: TxClient, organizationId: string, caseId: string): Promise<void> {
    const owned = await tx.behavioralHealthCase.findFirst({
      where: { id: caseId, organizationId },
      select: { id: true },
    });
    if (!owned) throw new CaseNotFoundError(caseId);
  }

  async uploadDocument(params: UploadDocumentParams): Promise<UploadDocumentResult> {
    const { organizationId, caseId } = params;
    const row = await this.prisma.$transaction(async (tx) => {
      await this.assertCaseOwnership(tx, organizationId, caseId);

      const existing = await tx.sourceDocument.findFirst({
        where: { caseId, organizationId, sha256: params.sha256 },
      });
      if (existing) {
        await this.auditWriter.write(tx, {
          organizationId,
          caseId,
          action: params.auditAction,
          actor: params.actor,
          objectType: OBJECT_TYPE,
          objectId: existing.id,
          reason: params.reason,
          metadata: {
            command: params.commandType,
            correlationId: params.correlationId,
            filename: params.filename,
            documentType: params.documentType,
            sha256: params.sha256,
            duplicate: true,
            existingDocumentId: existing.id,
          },
          occurredAt: this.now(),
        });
        return { row: existing, duplicate: true };
      }

      const created = await tx.sourceDocument.create({
        data: {
          caseId,
          organizationId,
          documentType: params.documentType,
          filename: params.filename,
          mimeType: params.mimeType,
          storageKey: params.storageKey,
          sha256: params.sha256,
          sourceOrganization: params.sourceOrganization ?? null,
          authorName: params.authorName ?? null,
          serviceDate: params.serviceDate ?? null,
          uploadedBy: params.uploadedBy,
          classificationStatus: "PENDING",
        },
      });
      await this.auditWriter.write(tx, {
        organizationId,
        caseId,
        action: params.auditAction,
        actor: params.actor,
        objectType: OBJECT_TYPE,
        objectId: created.id,
        reason: params.reason,
        metadata: {
          command: params.commandType,
          correlationId: params.correlationId,
          filename: params.filename,
          documentType: params.documentType,
          sha256: params.sha256,
          duplicate: false,
        },
        occurredAt: this.now(),
      });
      return { row: created, duplicate: false };
    });
    return { document: documentRowToDomain(row.row), duplicate: row.duplicate };
  }

  async classifyDocument(params: ClassifyDocumentParams): Promise<ClarityDocument> {
    const { organizationId, caseId, documentId } = params;
    const row = await this.prisma.$transaction(async (tx) => {
      await this.assertCaseOwnership(tx, organizationId, caseId);

      const current = await tx.sourceDocument.findFirst({
        where: { id: documentId, caseId, organizationId },
      });
      if (!current) throw new DocumentNotFoundError(documentId);

      const from = current.classificationStatus as DocumentClassificationStatus;
      if (params.expectedClassificationStatus !== undefined && params.expectedClassificationStatus !== from) {
        throw new DocumentConcurrencyConflictError(documentId);
      }
      if (!canTransitionDocumentClassification(from, params.to)) {
        throw new Error(`Invalid document classification transition: ${from} -> ${params.to}`);
      }

      const updated = await tx.sourceDocument.updateMany({
        where: { id: documentId, caseId, organizationId, classificationStatus: current.classificationStatus },
        data: { classificationStatus: params.to },
      });
      if (updated.count !== 1) throw new DocumentConcurrencyConflictError(documentId);

      await this.auditWriter.write(tx, {
        organizationId,
        caseId,
        action: params.auditAction,
        actor: params.actor,
        objectType: OBJECT_TYPE,
        objectId: documentId,
        reason: params.reason,
        metadata: {
          command: params.commandType,
          correlationId: params.correlationId,
          from: current.classificationStatus,
          to: params.to,
        },
        occurredAt: this.now(),
      });

      const fresh = await tx.sourceDocument.findFirst({ where: { id: documentId, caseId, organizationId } });
      if (!fresh) throw new DocumentNotFoundError(documentId);
      return fresh;
    });
    return documentRowToDomain(row);
  }

  async accessDocument(params: AccessDocumentParams): Promise<ClarityDocument> {
    const { organizationId, caseId, documentId } = params;
    const row = await this.prisma.$transaction(async (tx) => {
      await this.assertCaseOwnership(tx, organizationId, caseId);

      const current = await tx.sourceDocument.findFirst({
        where: { id: documentId, caseId, organizationId },
      });
      if (!current) throw new DocumentNotFoundError(documentId);

      await this.auditWriter.write(tx, {
        organizationId,
        caseId,
        action: params.auditAction,
        actor: params.actor,
        objectType: OBJECT_TYPE,
        objectId: documentId,
        reason: params.reason,
        metadata: {
          command: params.commandType,
          correlationId: params.correlationId,
          filename: current.filename,
          documentType: current.documentType,
        },
        occurredAt: this.now(),
      });
      return current;
    });
    return documentRowToDomain(row);
  }

  async listDocumentsForCase(organizationId: string, caseId: string): Promise<ClarityDocument[]> {
    const rows = await this.prisma.sourceDocument.findMany({
      where: { organizationId, caseId },
      orderBy: [{ uploadedAt: "asc" }, { id: "asc" }],
    });
    return rows.map(documentRowToDomain);
  }
}
