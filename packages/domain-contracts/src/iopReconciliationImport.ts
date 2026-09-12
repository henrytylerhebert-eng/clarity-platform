import { z } from "zod";
import {
  IopReconciliationSampleSchema,
  validateIopReconciliationSample,
  type IopReconciliationIssue,
  type IopReconciliationSample,
} from "./iopReconciliation.js";

const token = z.string().regex(/^[A-Z][A-Z0-9_-]{2,79}$/);
const timestamp = z.string().datetime();

export const IopReconciliationImportSchema = z
  .object({
    importId: token,
    source: z
      .object({
        systemLabel: z.string().trim().min(3).max(160),
        fileName: z.string().trim().min(3).max(160),
        exportedAt: timestamp,
        cutoffAt: timestamp,
      })
      .strict()
      .refine((source) => source.cutoffAt <= source.exportedAt, {
        message: "Source cutoff cannot be after export time",
        path: ["cutoffAt"],
      }),
    reconciliation: IopReconciliationSampleSchema,
  })
  .strict();

export type IopReconciliationImport = z.infer<
  typeof IopReconciliationImportSchema
>;

export interface IopReconciliationPreview {
  importId: string;
  sample: IopReconciliationSample;
  source: IopReconciliationImport["source"];
  issues: IopReconciliationIssue[];
  unresolved: IopReconciliationIssue[];
  closeReady: boolean;
}

export interface IopReconciliationCloseReceipt {
  importId: string;
  sourceCutoffAt: string;
  reviewerToken: string;
  reviewedAt: string;
  issueCount: number;
  reviewedExceptionCount: number;
}

/**
 * Bounded adapter for a source-owned synthetic export. It validates record
 * linkage only; it does not decide treatment, documentation, charge, or EMR
 * billing status.
 */
export function previewIopReconciliationImport(
  input: unknown,
): IopReconciliationPreview {
  const parsed = IopReconciliationImportSchema.parse(input);
  const result = validateIopReconciliationSample(parsed.reconciliation);
  return {
    importId: parsed.importId,
    sample: parsed.reconciliation,
    source: parsed.source,
    ...result,
    closeReady: result.unresolved.length === 0,
  };
}

export function closeIopReconciliationImport(
  input: unknown,
  close: { reviewerToken: string; reviewedAt: string },
): IopReconciliationCloseReceipt {
  const preview = previewIopReconciliationImport(input);
  if (!preview.closeReady)
    throw new Error("iop_reconciliation_has_unreviewed_exceptions");
  return {
    importId: preview.importId,
    sourceCutoffAt: preview.source.cutoffAt,
    reviewerToken: token.parse(close.reviewerToken),
    reviewedAt: timestamp.parse(close.reviewedAt),
    issueCount: preview.issues.length,
    reviewedExceptionCount: preview.sample.exceptionReviews.length,
  };
}
