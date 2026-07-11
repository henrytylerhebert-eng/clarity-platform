import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import {
  canTransitionDocumentClassification,
  sanitizeFilenameForAudit,
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
  /** Measured from the stored bytes by the caller's storage adapter. */
  fileSizeBytes: number;
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

export interface CreateDocumentVersionParams {
  organizationId: string;
  caseId: string;
  /** Any existing version of the family; the new version extends its family. */
  documentId: string;
  filename: string;
  mimeType: string;
  storageKey: string;
  sha256: string;
  fileSizeBytes: number;
  uploadedBy: string;
  actor: AuditActor;
  commandType: string;
  correlationId?: string;
  reason?: string;
  auditAction: string;
}

/** Thrown when a "new version" carries bytes identical to an existing version in the family. */
export class DuplicateDocumentContentError extends Error {
  constructor(documentId: string) {
    super(`New version of document "${documentId}" has content identical to an existing version`);
    this.name = "DuplicateDocumentContentError";
  }
}

export interface DocumentFailureAuditParams {
  organizationId: string;
  caseId: string;
  action: string;
  actor: AuditActor;
  commandType: string;
  correlationId?: string;
  /** Short, non-sensitive failure classification (error name, not message contents). */
  failureKind: string;
  storageKeyCleaned?: string;
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
  /** VIEW | DOWNLOAD — recorded in audit metadata (same read either way). */
  accessMode?: string;
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
            filename: sanitizeFilenameForAudit(params.filename),
            documentType: params.documentType,
            sha256: params.sha256,
            duplicate: true,
            existingDocumentId: existing.id,
          },
          occurredAt: this.now(),
        });
        return { row: existing, duplicate: true };
      }

      // Generated here (not by a column default) so the first version can be
      // its own family root in a single INSERT.
      const documentId = randomUUID();
      const created = await tx.sourceDocument.create({
        data: {
          id: documentId,
          documentFamilyId: documentId,
          caseId,
          organizationId,
          documentType: params.documentType,
          filename: params.filename,
          mimeType: params.mimeType,
          storageKey: params.storageKey,
          sha256: params.sha256,
          fileSizeBytes: params.fileSizeBytes,
          sourceOrganization: params.sourceOrganization ?? null,
          authorName: params.authorName ?? null,
          serviceDate: params.serviceDate ?? null,
          uploadedBy: params.uploadedBy,
          classificationStatus: "PENDING",
          version: 1,
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
          filename: sanitizeFilenameForAudit(params.filename),
          documentType: params.documentType,
          sha256: params.sha256,
          fileSizeBytes: params.fileSizeBytes,
          version: 1,
          duplicate: false,
        },
        occurredAt: this.now(),
      });
      return { row: created, duplicate: false };
    });
    return { document: documentRowToDomain(row.row), duplicate: row.duplicate };
  }

  /**
   * A corrected/updated document never overwrites its predecessor: it becomes
   * a new row in the same version family with version = family max + 1. The
   * prior version's row and bytes are untouched.
   */
  async createDocumentVersion(params: CreateDocumentVersionParams): Promise<ClarityDocument> {
    const { organizationId, caseId, documentId } = params;
    const row = await this.prisma.$transaction(async (tx) => {
      await this.assertCaseOwnership(tx, organizationId, caseId);

      const prior = await tx.sourceDocument.findFirst({
        where: { id: documentId, caseId, organizationId },
      });
      if (!prior) throw new DocumentNotFoundError(documentId);

      const family = prior.documentFamilyId;
      const sameBytes = await tx.sourceDocument.findFirst({
        where: { documentFamilyId: family, caseId, organizationId, sha256: params.sha256 },
        select: { id: true },
      });
      if (sameBytes) throw new DuplicateDocumentContentError(documentId);

      const latest = await tx.sourceDocument.aggregate({
        where: { documentFamilyId: family, caseId, organizationId },
        _max: { version: true },
      });
      const nextVersion = (latest._max.version ?? prior.version) + 1;

      const created = await tx.sourceDocument.create({
        data: {
          id: randomUUID(),
          documentFamilyId: family,
          caseId,
          organizationId,
          documentType: prior.documentType,
          filename: params.filename,
          mimeType: params.mimeType,
          storageKey: params.storageKey,
          sha256: params.sha256,
          fileSizeBytes: params.fileSizeBytes,
          sourceOrganization: prior.sourceOrganization,
          authorName: prior.authorName,
          serviceDate: prior.serviceDate,
          uploadedBy: params.uploadedBy,
          classificationStatus: "PENDING",
          version: nextVersion,
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
          documentFamilyId: family,
          previousDocumentId: prior.id,
          previousVersion: prior.version,
          version: nextVersion,
          filename: sanitizeFilenameForAudit(params.filename),
          sha256: params.sha256,
          fileSizeBytes: params.fileSizeBytes,
        },
        occurredAt: this.now(),
      });
      return created;
    });
    return documentRowToDomain(row);
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
          filename: sanitizeFilenameForAudit(current.filename),
          documentType: current.documentType,
          accessMode: params.accessMode ?? "VIEW",
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

  /**
   * How many committed metadata rows reference a storage key — deliberately
   * NOT tenant-scoped. Upload compensation only deletes a stored object when
   * no row at all references it: a duplicate upload shares its object with
   * the original row, and a failed cross-tenant upload attempt must never be
   * able to delete an object another tenant's row legitimately references.
   * Returns a bare count; no document data crosses the tenant boundary.
   */
  async countReferencesToStorageKey(storageKey: string): Promise<number> {
    return this.prisma.sourceDocument.count({ where: { storageKey } });
  }

  /**
   * Append-only failure/cleanup audit, written OUTSIDE the failed command
   * transaction (which rolled back). Metadata carries only a failure
   * classification — never error message contents, filenames, or bytes.
   */
  async recordDocumentFailureAudit(params: DocumentFailureAuditParams): Promise<void> {
    await this.auditWriter.write(this.prisma as unknown as TxClient, {
      organizationId: params.organizationId,
      caseId: params.caseId,
      action: params.action,
      actor: params.actor,
      objectType: OBJECT_TYPE,
      objectId: params.storageKeyCleaned ?? "none",
      metadata: {
        command: params.commandType,
        correlationId: params.correlationId,
        failureKind: params.failureKind,
        ...(params.storageKeyCleaned ? { storageKeyCleaned: params.storageKeyCleaned } : {}),
      },
      occurredAt: this.now(),
    });
  }
}
