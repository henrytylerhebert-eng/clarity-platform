import type { SourceDocument as DocumentRow } from "@prisma/client";
import {
  DOCUMENT_CLASSIFICATION_STATUSES,
  DOCUMENT_TYPES,
  type ClarityDocument,
  type DocumentClassificationStatus,
  type DocumentType,
} from "@clarity/domain-contracts";

function parseEnum<T extends string>(value: string, allowed: readonly T[], field: string): T {
  if ((allowed as readonly string[]).includes(value)) return value as T;
  throw new Error(`Row field ${field} has value "${value}" outside the domain contract`);
}

export function documentRowToDomain(row: DocumentRow): ClarityDocument {
  return {
    documentId: row.id,
    caseId: row.caseId,
    organizationId: row.organizationId,
    documentType: parseEnum<DocumentType>(row.documentType, DOCUMENT_TYPES, "documentType"),
    filename: row.filename,
    mimeType: row.mimeType,
    storageKey: row.storageKey,
    sha256: row.sha256,
    classificationStatus: parseEnum<DocumentClassificationStatus>(
      row.classificationStatus,
      DOCUMENT_CLASSIFICATION_STATUSES,
      "classificationStatus",
    ),
    version: row.version,
    uploadedBy: row.uploadedBy,
    uploadedAt: row.uploadedAt,
    sourceOrganization: row.sourceOrganization,
    authorName: row.authorName,
    serviceDate: row.serviceDate,
  };
}
