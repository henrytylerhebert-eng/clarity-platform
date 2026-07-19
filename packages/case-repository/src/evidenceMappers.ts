import type { ContradictionGroup as GroupRow, EvidenceItem as EvidenceRow } from "@prisma/client";
import {
  CONTRADICTION_CLASSIFICATIONS,
  EVIDENCE_CATEGORIES,
  EVIDENCE_CREATION_METHODS,
  EVIDENCE_STATUSES,
  type ClarityContradictionGroup,
  type ClarityEvidence,
  type ContradictionClassification,
  type EvidenceCategory,
  type EvidenceCreationMethod,
  type EvidenceStatus,
} from "@clarity/domain-contracts";

function parseEnum<T extends string>(value: string, allowed: readonly T[], field: string): T {
  if ((allowed as readonly string[]).includes(value)) return value as T;
  throw new Error(`Row field ${field} has value "${value}" outside the domain contract`);
}

export function evidenceRowToDomain(row: EvidenceRow): ClarityEvidence {
  return {
    evidenceId: row.id,
    caseId: row.caseId,
    organizationId: row.organizationId,
    documentId: row.documentId,
    category: parseEnum<EvidenceCategory>(row.category, EVIDENCE_CATEGORIES, "category"),
    subcategory: row.subcategory,
    originalText: row.originalText,
    normalizedValue: row.normalizedValue,
    pageNumber: row.pageNumber,
    sectionLabel: row.sectionLabel,
    sourceAuthor: row.sourceAuthor,
    sourceTimestamp: row.sourceTimestamp,
    extractionConfidence: row.extractionConfidence,
    status: parseEnum<EvidenceStatus>(row.status, EVIDENCE_STATUSES, "status"),
    creationMethod: parseEnum<EvidenceCreationMethod>(
      row.creationMethod,
      EVIDENCE_CREATION_METHODS,
      "creationMethod",
    ),
    createdBy: row.createdBy,
    reviewerNote: row.reviewerNote,
    reviewedBy: row.reviewedBy,
    reviewedAt: row.reviewedAt,
    evidenceFamilyId: row.evidenceFamilyId,
    supersededById: row.supersededById,
    contradictionGroupId: row.contradictionGroupId,
    version: row.version,
    createdAt: row.createdAt,
  };
}

export function contradictionGroupRowToDomain(
  row: GroupRow & { items?: Array<{ id: string }> },
): ClarityContradictionGroup {
  return {
    groupId: row.id,
    organizationId: row.organizationId,
    caseId: row.caseId,
    classification: row.classification
      ? parseEnum<ContradictionClassification>(
          row.classification,
          CONTRADICTION_CLASSIFICATIONS,
          "classification",
        )
      : null,
    reviewNote: row.reviewNote,
    createdBy: row.createdBy,
    version: row.version,
    evidenceIds: (row.items ?? []).map((i) => i.id),
  };
}
