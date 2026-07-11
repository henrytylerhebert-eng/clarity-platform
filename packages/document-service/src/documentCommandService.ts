import type { ClarityDocument, DocumentStorage } from "@clarity/domain-contracts";
import { CaseNotFoundError } from "@clarity/case-repository";
import type { PrismaDocumentGateway, UploadDocumentResult } from "@clarity/case-repository";
import {
  AccessDocumentCommandSchema,
  ClassifyDocumentCommandSchema,
  CreateDocumentVersionCommandSchema,
  RATIONALE_REQUIRED_CLASSIFICATIONS,
  UploadDocumentCommandSchema,
  type AccessDocumentCommand,
  type ClassifyDocumentCommand,
  type CreateDocumentVersionCommand,
  type UploadDocumentCommand,
} from "./commands.js";
import { assertDocumentPermitted } from "./permissions.js";
import { RationaleRequiredError } from "./errors.js";
import { InMemoryDocumentStorage } from "./storage.js";
import { DocumentValidationPolicy } from "./validation.js";

/**
 * Audit action vocabulary for document commands (REQ-005/REQ-006).
 * Mapping notes vs. the requirement's event list:
 * - DOCUMENT_VIEWED / DOCUMENT_DOWNLOADED map onto the canonical
 *   DOCUMENT_ACCESSED with metadata.accessMode = VIEW | DOWNLOAD.
 * - DOCUMENT_REJECTED is emitted when classification lands on REJECTED
 *   (instead of the generic DOCUMENT_CLASSIFIED).
 * - DOCUMENT_UPLOAD_STARTED is deliberately not emitted: the audit log is
 *   append-only rows in the same database the upload transaction targets, so
 *   a "started" row would double every successful upload's audit volume
 *   without adding information the correlation id doesn't already provide.
 *   Failure visibility comes from DOCUMENT_UPLOAD_FAILED instead.
 */
export const DOCUMENT_AUDIT_ACTIONS = {
  UploadDocument: "DOCUMENT_UPLOADED",
  ClassifyDocument: "DOCUMENT_CLASSIFIED",
  RejectDocument: "DOCUMENT_REJECTED",
  AccessDocument: "DOCUMENT_ACCESSED",
  CreateDocumentVersion: "DOCUMENT_VERSION_CREATED",
  UploadFailed: "DOCUMENT_UPLOAD_FAILED",
  StorageCleanupCompleted: "DOCUMENT_STORAGE_CLEANUP_COMPLETED",
} as const;

export interface AccessDocumentResult {
  document: ClarityDocument;
  content: Uint8Array;
}

/**
 * The single controlled path for every document action.
 *
 * Order of enforcement for every command:
 *   1. envelope validation (Zod, strict)
 *   2. role permission check            — before any storage/database access
 *   3. file validation policy / rationale rules
 *   4. storage write (content-addressed), THEN the gateway transaction:
 *      case-ownership check → dedupe / state machine / optimistic
 *      concurrency → metadata write → atomic audit event
 *
 * PostgreSQL and the object store cannot commit atomically together, and
 * this service does not pretend they can (ADR-0007). The metadata
 * transaction is the source of truth; the stored object is written first
 * and COMPENSATED (deleted) if the transaction fails. Compensation never
 * deletes an object that any committed row still references, so a failed
 * duplicate or cross-tenant attempt cannot destroy another record's bytes.
 *
 * This service never touches Prisma; all persistence goes through the
 * approved PrismaDocumentGateway adapter (packages/case-repository — the one
 * package permitted to import @prisma/client, per ADR-0003).
 */
export class DocumentCommandService {
  constructor(
    private readonly gateway: PrismaDocumentGateway,
    private readonly storage: DocumentStorage = new InMemoryDocumentStorage(),
    private readonly validation: DocumentValidationPolicy = new DocumentValidationPolicy(),
  ) {}

  async uploadDocument(input: UploadDocumentCommand): Promise<UploadDocumentResult> {
    const cmd = UploadDocumentCommandSchema.parse(input);
    assertDocumentPermitted("UploadDocument", cmd.actor.roles);
    this.validation.validate({ filename: cmd.filename, mimeType: cmd.mimeType, content: cmd.content });
    const stored = await this.storage.put(cmd.caseId, cmd.content);
    try {
      return await this.gateway.uploadDocument({
        organizationId: cmd.organizationId,
        caseId: cmd.caseId,
        documentType: cmd.documentType,
        filename: cmd.filename,
        mimeType: cmd.mimeType,
        storageKey: stored.storageKey,
        sha256: stored.sha256,
        fileSizeBytes: stored.size,
        uploadedBy: cmd.actor.actorId,
        sourceOrganization: cmd.sourceOrganization ?? null,
        authorName: cmd.authorName ?? null,
        serviceDate: cmd.serviceDate ?? null,
        actor: { actorType: cmd.actor.actorType, actorId: cmd.actor.actorId },
        commandType: "UploadDocument",
        correlationId: cmd.correlationId,
        reason: cmd.reason,
        auditAction: DOCUMENT_AUDIT_ACTIONS.UploadDocument,
      });
    } catch (e) {
      await this.compensateStorage(e, stored.storageKey, cmd, "UploadDocument");
      throw e;
    }
  }

  async createDocumentVersion(input: CreateDocumentVersionCommand): Promise<ClarityDocument> {
    const cmd = CreateDocumentVersionCommandSchema.parse(input);
    assertDocumentPermitted("CreateDocumentVersion", cmd.actor.roles);
    this.validation.validate({ filename: cmd.filename, mimeType: cmd.mimeType, content: cmd.content });
    const stored = await this.storage.put(cmd.caseId, cmd.content);
    try {
      return await this.gateway.createDocumentVersion({
        organizationId: cmd.organizationId,
        caseId: cmd.caseId,
        documentId: cmd.documentId,
        filename: cmd.filename,
        mimeType: cmd.mimeType,
        storageKey: stored.storageKey,
        sha256: stored.sha256,
        fileSizeBytes: stored.size,
        uploadedBy: cmd.actor.actorId,
        actor: { actorType: cmd.actor.actorType, actorId: cmd.actor.actorId },
        commandType: "CreateDocumentVersion",
        correlationId: cmd.correlationId,
        reason: cmd.reason,
        auditAction: DOCUMENT_AUDIT_ACTIONS.CreateDocumentVersion,
      });
    } catch (e) {
      await this.compensateStorage(e, stored.storageKey, cmd, "CreateDocumentVersion");
      throw e;
    }
  }

  async classifyDocument(input: ClassifyDocumentCommand): Promise<ClarityDocument> {
    const cmd = ClassifyDocumentCommandSchema.parse(input);
    assertDocumentPermitted("ClassifyDocument", cmd.actor.roles);
    if ((RATIONALE_REQUIRED_CLASSIFICATIONS as readonly string[]).includes(cmd.to) && !cmd.reason) {
      throw new RationaleRequiredError(`ClassifyDocument to ${cmd.to}`);
    }
    return this.gateway.classifyDocument({
      organizationId: cmd.organizationId,
      caseId: cmd.caseId,
      documentId: cmd.documentId,
      to: cmd.to,
      expectedClassificationStatus: cmd.expectedClassificationStatus,
      actor: { actorType: cmd.actor.actorType, actorId: cmd.actor.actorId },
      commandType: "ClassifyDocument",
      correlationId: cmd.correlationId,
      reason: cmd.reason,
      auditAction:
        cmd.to === "REJECTED"
          ? DOCUMENT_AUDIT_ACTIONS.RejectDocument
          : DOCUMENT_AUDIT_ACTIONS.ClassifyDocument,
    });
  }

  async accessDocument(input: AccessDocumentCommand): Promise<AccessDocumentResult> {
    const cmd = AccessDocumentCommandSchema.parse(input);
    assertDocumentPermitted("AccessDocument", cmd.actor.roles);
    const document = await this.gateway.accessDocument({
      organizationId: cmd.organizationId,
      caseId: cmd.caseId,
      documentId: cmd.documentId,
      accessMode: cmd.accessMode,
      actor: { actorType: cmd.actor.actorType, actorId: cmd.actor.actorId },
      commandType: "AccessDocument",
      correlationId: cmd.correlationId,
      reason: cmd.reason,
      auditAction: DOCUMENT_AUDIT_ACTIONS.AccessDocument,
    });
    const content = await this.storage.get(document.storageKey);
    return { document, content };
  }

  /**
   * Compensating cleanup after a failed metadata transaction. The stored
   * object is deleted ONLY when no committed row references it (a duplicate
   * shares its object with the original; a cross-tenant attempt must not
   * touch the victim's bytes). Failure + cleanup audit rows are written
   * outside the rolled-back transaction — skipped when the failure was
   * case-scoping itself (no tenant-owned case exists to attach them to).
   * Compensation is best-effort: its own failure is surfaced by rethrowing
   * the ORIGINAL error with the cleanup error attached as `cause`.
   */
  private async compensateStorage(
    originalError: unknown,
    storageKey: string,
    cmd: { organizationId: string; caseId: string; correlationId?: string; actor: { actorId: string; actorType?: "USER" | "AGENT" | "SYSTEM" } },
    commandType: string,
  ): Promise<void> {
    const failureKind = originalError instanceof Error ? originalError.name : "UnknownError";
    let cleaned = false;
    try {
      const references = await this.gateway.countReferencesToStorageKey(storageKey);
      if (references === 0) {
        await this.storage.delete(storageKey);
        cleaned = true;
      }
      if (!(originalError instanceof CaseNotFoundError)) {
        const actor = { actorType: cmd.actor.actorType ?? ("USER" as const), actorId: cmd.actor.actorId };
        await this.gateway.recordDocumentFailureAudit({
          organizationId: cmd.organizationId,
          caseId: cmd.caseId,
          action: DOCUMENT_AUDIT_ACTIONS.UploadFailed,
          actor,
          commandType,
          correlationId: cmd.correlationId,
          failureKind,
        });
        if (cleaned) {
          await this.gateway.recordDocumentFailureAudit({
            organizationId: cmd.organizationId,
            caseId: cmd.caseId,
            action: DOCUMENT_AUDIT_ACTIONS.StorageCleanupCompleted,
            actor,
            commandType,
            correlationId: cmd.correlationId,
            failureKind,
            storageKeyCleaned: storageKey,
          });
        }
      }
    } catch (cleanupError) {
      if (originalError instanceof Error) {
        originalError.cause ??= cleanupError;
      }
    }
  }
}
