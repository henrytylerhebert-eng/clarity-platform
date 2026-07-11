import type { ClarityDocument, DocumentStorage } from "@clarity/domain-contracts";
import type { PrismaDocumentGateway, UploadDocumentResult } from "@clarity/case-repository";
import {
  AccessDocumentCommandSchema,
  ClassifyDocumentCommandSchema,
  RATIONALE_REQUIRED_CLASSIFICATIONS,
  UploadDocumentCommandSchema,
  type AccessDocumentCommand,
  type ClassifyDocumentCommand,
  type UploadDocumentCommand,
} from "./commands.js";
import { assertDocumentPermitted } from "./permissions.js";
import { RationaleRequiredError } from "./errors.js";
import { InMemoryDocumentStorage } from "./storage.js";

/** Audit action vocabulary for document commands (REQ-005/REQ-006). */
export const DOCUMENT_AUDIT_ACTIONS = {
  UploadDocument: "DOCUMENT_UPLOADED",
  ClassifyDocument: "DOCUMENT_CLASSIFIED",
  AccessDocument: "DOCUMENT_ACCESSED",
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
 *   2. role permission check           — before any storage/database access
 *   3. rationale requirement (Classify → REJECTED)
 *   4. gateway transaction: case-ownership check → SHA-256 dedupe / state
 *      machine / optimistic concurrency → atomic audit event
 *
 * This service never touches Prisma; all persistence goes through the
 * approved PrismaDocumentGateway adapter (packages/case-repository — the one
 * package permitted to import @prisma/client, per ADR-0003).
 */
export class DocumentCommandService {
  constructor(
    private readonly gateway: PrismaDocumentGateway,
    private readonly storage: DocumentStorage = new InMemoryDocumentStorage(),
  ) {}

  async uploadDocument(input: UploadDocumentCommand): Promise<UploadDocumentResult> {
    const cmd = UploadDocumentCommandSchema.parse(input);
    assertDocumentPermitted("UploadDocument", cmd.actor.roles);
    const stored = await this.storage.put(cmd.caseId, cmd.content);
    return this.gateway.uploadDocument({
      organizationId: cmd.organizationId,
      caseId: cmd.caseId,
      documentType: cmd.documentType,
      filename: cmd.filename,
      mimeType: cmd.mimeType,
      storageKey: stored.storageKey,
      sha256: stored.sha256,
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
      auditAction: DOCUMENT_AUDIT_ACTIONS.ClassifyDocument,
    });
  }

  async accessDocument(input: AccessDocumentCommand): Promise<AccessDocumentResult> {
    const cmd = AccessDocumentCommandSchema.parse(input);
    assertDocumentPermitted("AccessDocument", cmd.actor.roles);
    const document = await this.gateway.accessDocument({
      organizationId: cmd.organizationId,
      caseId: cmd.caseId,
      documentId: cmd.documentId,
      actor: { actorType: cmd.actor.actorType, actorId: cmd.actor.actorId },
      commandType: "AccessDocument",
      correlationId: cmd.correlationId,
      reason: cmd.reason,
      auditAction: DOCUMENT_AUDIT_ACTIONS.AccessDocument,
    });
    const content = await this.storage.get(document.storageKey);
    return { document, content };
  }
}
