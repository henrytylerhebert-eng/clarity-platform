import type { OrgScoped } from "./organizationScope.js";

/**
 * Document type and classification vocabulary.
 * Values mirror prisma/schema.prisma enums DocumentType / DocumentClassificationStatus — keep in sync.
 */
export const DOCUMENT_TYPES = [
  "REFERRAL_FORM",
  "EMERGENCY_DEPARTMENT_NOTE",
  "PSYCHIATRIC_EVALUATION",
  "NURSING_NOTE",
  "LAB_REPORT",
  "MEDICATION_LIST",
  "LEGAL_HOLD_DOCUMENT",
  "INSURANCE_CARD",
  "BENEFITS_VERIFICATION",
  "AUTHORIZATION_RECORD",
  "DISCHARGE_SUMMARY",
  "TRANSPORT_RECORD",
  "OTHER",
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_CLASSIFICATION_STATUSES = ["PENDING", "CLASSIFIED", "NEEDS_REVIEW", "REJECTED"] as const;
export type DocumentClassificationStatus = (typeof DOCUMENT_CLASSIFICATION_STATUSES)[number];

/**
 * Classification moves forward from intake triage (PENDING) to a settled
 * outcome. CLASSIFIED may be reopened for correction (NEEDS_REVIEW); REJECTED
 * is terminal — a rejected document is superseded by a fresh upload, not
 * reclassified, mirroring the case state machine's terminal-state rule.
 */
const DOCUMENT_CLASSIFICATION_TRANSITIONS: Record<
  DocumentClassificationStatus,
  readonly DocumentClassificationStatus[]
> = {
  PENDING: ["CLASSIFIED", "NEEDS_REVIEW", "REJECTED"],
  NEEDS_REVIEW: ["CLASSIFIED", "REJECTED"],
  CLASSIFIED: ["NEEDS_REVIEW"],
  REJECTED: [],
};

export function canTransitionDocumentClassification(
  from: DocumentClassificationStatus,
  to: DocumentClassificationStatus,
): boolean {
  return DOCUMENT_CLASSIFICATION_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Domain shape persisted by the document repository layer. */
export interface ClarityDocument extends OrgScoped {
  readonly documentId: string;
  readonly caseId: string;
  readonly documentType: DocumentType;
  readonly filename: string;
  readonly mimeType: string;
  readonly storageKey: string;
  readonly sha256: string;
  readonly classificationStatus: DocumentClassificationStatus;
  readonly version: number;
  readonly uploadedBy: string;
  readonly uploadedAt: Date;
  readonly sourceOrganization?: string | null;
  readonly authorName?: string | null;
  readonly serviceDate?: Date | null;
}

/**
 * Storage abstraction for document bytes. Content-addressed by construction
 * (implementations key storage by the content's own sha256), so re-storing
 * identical bytes is a harmless idempotent overwrite rather than real
 * duplication — the repository layer still applies its own dedupe check
 * against the database so a duplicate upload never creates a second row.
 * No concrete object-storage integration exists yet (docs/01-project-architecture.md
 * "Object storage for documents and media" is future work); this interface is
 * the seam a real S3/Blob adapter will implement later.
 */
export interface StoredDocument {
  readonly storageKey: string;
  readonly sha256: string;
  readonly size: number;
}

export interface DocumentStorage {
  put(caseId: string, content: Uint8Array): Promise<StoredDocument>;
  get(storageKey: string): Promise<Uint8Array>;
}
