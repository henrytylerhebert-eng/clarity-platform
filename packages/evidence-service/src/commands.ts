import { z } from "zod";
import {
  CommandActorSchema,
  CONTRADICTION_CLASSIFICATIONS,
  EVIDENCE_CATEGORIES,
} from "@clarity/domain-contracts";

/**
 * Evidence command envelopes. Same conventions as case/document commands:
 * strict schemas, caller-supplied actor roles (authentication is upstream
 * and does not exist yet — documented assumption), optional correlation and
 * idempotency, rationale where required.
 */

const baseEnvelope = {
  organizationId: z.string().min(1),
  caseId: z.string().min(1),
  actor: CommandActorSchema,
  correlationId: z.string().min(1).optional(),
  idempotencyKey: z.string().min(8).optional(),
  reason: z.string().min(1).optional(),
};

/** Source fields shared by creation and supersession replacements. */
const sourceFields = {
  documentId: z.string().min(1),
  category: z.enum(EVIDENCE_CATEGORIES),
  subcategory: z.string().min(1).optional(),
  /** Verbatim source text — immutable after creation. */
  originalText: z.string().min(1),
  normalizedValue: z.unknown().optional(),
  pageNumber: z.number().int().positive().optional(),
  sectionLabel: z.string().min(1).optional(),
  sourceAuthor: z.string().min(1).optional(),
  sourceTimestamp: z.coerce.date().optional(),
};

export const CreateCandidateEvidenceCommandSchema = z
  .object({ ...baseEnvelope, ...sourceFields })
  .strict();
export type CreateCandidateEvidenceCommand = z.input<typeof CreateCandidateEvidenceCommandSchema>;

const evidenceTarget = {
  ...baseEnvelope,
  evidenceId: z.string().min(1),
  expectedVersion: z.number().int().nonnegative().optional(),
};

/**
 * Pre-approval correction: interpretation fields only. `originalText` is
 * deliberately absent — source text cannot be corrected, only superseded.
 */
export const CorrectCandidateEvidenceCommandSchema = z
  .object({
    ...evidenceTarget,
    normalizedValue: z.unknown().optional(),
    subcategory: z.string().min(1).optional(),
    pageNumber: z.number().int().positive().optional(),
    sectionLabel: z.string().min(1).optional(),
    reviewerNote: z.string().min(1).optional(),
  })
  .strict();
export type CorrectCandidateEvidenceCommand = z.input<typeof CorrectCandidateEvidenceCommandSchema>;

export const ApproveEvidenceCommandSchema = z
  .object({ ...evidenceTarget, reviewerNote: z.string().min(1).optional() })
  .strict();
export type ApproveEvidenceCommand = z.input<typeof ApproveEvidenceCommandSchema>;

export const RejectEvidenceCommandSchema = z
  .object({ ...evidenceTarget, reason: z.string().min(1) })
  .strict();
export type RejectEvidenceCommand = z.input<typeof RejectEvidenceCommandSchema>;

export const RequestEvidenceClarificationCommandSchema = z
  .object({ ...evidenceTarget, note: z.string().min(1) })
  .strict();
export type RequestEvidenceClarificationCommand = z.input<
  typeof RequestEvidenceClarificationCommandSchema
>;

export const SupersedeEvidenceCommandSchema = z
  .object({
    ...evidenceTarget,
    reason: z.string().min(1),
    replacement: z.object(sourceFields).strict(),
  })
  .strict();
export type SupersedeEvidenceCommand = z.input<typeof SupersedeEvidenceCommandSchema>;

export const CreateContradictionGroupCommandSchema = z
  .object({ ...baseEnvelope, evidenceIds: z.array(z.string().min(1)).min(2) })
  .strict();
export type CreateContradictionGroupCommand = z.input<typeof CreateContradictionGroupCommandSchema>;

export const AddEvidenceToContradictionGroupCommandSchema = z
  .object({
    ...baseEnvelope,
    groupId: z.string().min(1),
    evidenceId: z.string().min(1),
    expectedGroupVersion: z.number().int().nonnegative().optional(),
  })
  .strict();
export type AddEvidenceToContradictionGroupCommand = z.input<
  typeof AddEvidenceToContradictionGroupCommandSchema
>;

export const ResolveContradictionReviewCommandSchema = z
  .object({
    ...baseEnvelope,
    groupId: z.string().min(1),
    classification: z.enum(CONTRADICTION_CLASSIFICATIONS),
    reviewNote: z.string().min(1).optional(),
    expectedGroupVersion: z.number().int().nonnegative().optional(),
  })
  .strict();
export type ResolveContradictionReviewCommand = z.input<typeof ResolveContradictionReviewCommandSchema>;
