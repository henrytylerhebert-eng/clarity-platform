import { z } from "zod";
import { CommandActorSchema, DOCUMENT_CLASSIFICATION_STATUSES, DOCUMENT_TYPES } from "@clarity/domain-contracts";

/**
 * Command envelopes. Every command carries tenant, actor identity + roles,
 * optional correlation, optional reason, and the case + document identifiers
 * it acts on. No idempotency-key mechanism here: SHA-256 content dedupe is
 * UploadDocument's own retry-safety net (a retried upload with identical
 * bytes always resolves to the same existing row), and Classify/Access act on
 * an existing document id, so replay is naturally idempotent or a no-op.
 */

const baseEnvelope = {
  organizationId: z.string().min(1),
  actor: CommandActorSchema,
  correlationId: z.string().min(1).optional(),
  reason: z.string().min(1).optional(),
};

export const UploadDocumentCommandSchema = z
  .object({
    ...baseEnvelope,
    caseId: z.string().min(1),
    documentType: z.enum(DOCUMENT_TYPES),
    filename: z.string().min(1),
    mimeType: z.string().min(1),
    // z.instanceof(Uint8Array) infers an over-narrow ArrayBuffer-backed generic
    // under TS 5.7's typed-array generics; z.custom avoids that inference path.
    content: z.custom<Uint8Array>((v) => v instanceof Uint8Array, { message: "content must be a Uint8Array" }),
    sourceOrganization: z.string().min(1).optional(),
    authorName: z.string().min(1).optional(),
    serviceDate: z.date().optional(),
  })
  .strict();
export type UploadDocumentCommand = z.input<typeof UploadDocumentCommandSchema>;

export const ClassifyDocumentCommandSchema = z
  .object({
    ...baseEnvelope,
    caseId: z.string().min(1),
    documentId: z.string().min(1),
    to: z.enum(DOCUMENT_CLASSIFICATION_STATUSES),
    /** Stale value (vs. the freshly-read row) → DocumentConcurrencyConflictError before any write. */
    expectedClassificationStatus: z.enum(DOCUMENT_CLASSIFICATION_STATUSES).optional(),
  })
  .strict();
export type ClassifyDocumentCommand = z.input<typeof ClassifyDocumentCommandSchema>;

export const AccessDocumentCommandSchema = z
  .object({
    ...baseEnvelope,
    caseId: z.string().min(1),
    documentId: z.string().min(1),
    /**
     * Recorded in the DOCUMENT_ACCESSED audit event's metadata. VIEW and
     * DOWNLOAD are the same read at this layer; the distinction exists for
     * the audit trail (maps the required DOCUMENT_VIEWED / DOCUMENT_DOWNLOADED
     * vocabulary onto the canonical DOCUMENT_ACCESSED action).
     */
    accessMode: z.enum(["VIEW", "DOWNLOAD"]).default("VIEW"),
  })
  .strict();
export type AccessDocumentCommand = z.input<typeof AccessDocumentCommandSchema>;

export const CreateDocumentVersionCommandSchema = z
  .object({
    ...baseEnvelope,
    caseId: z.string().min(1),
    /** Any existing version of the family being corrected/updated. */
    documentId: z.string().min(1),
    filename: z.string().min(1),
    mimeType: z.string().min(1),
    content: z.custom<Uint8Array>((v) => v instanceof Uint8Array, { message: "content must be a Uint8Array" }),
    /** Mandatory: why the document needed a new version. */
    reason: z.string().min(1),
  })
  .strict();
export type CreateDocumentVersionCommand = z.input<typeof CreateDocumentVersionCommandSchema>;

/**
 * Rejecting a document (permanent, terminal) is a high-impact classification
 * outcome and requires a documented rationale, mirroring case-service's
 * rationale rules for exit/exception states.
 */
export const RATIONALE_REQUIRED_CLASSIFICATIONS = ["REJECTED"] as const;
