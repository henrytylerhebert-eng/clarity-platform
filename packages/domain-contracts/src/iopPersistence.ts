import { z } from "zod";
import { IopReconciliationSampleSchema } from "./iopReconciliation.js";
import type { AuthenticatedPrincipal } from "./authentication.js";

const text = z.string().trim().min(1).max(160);
const timestamp = z.string().datetime();
export const IOP_SOURCE_RECORD_TYPES = [
  "ENROLLMENT",
  "TREATMENT_PLAN",
  "ATTENDANCE",
  "NOTE_AUDIT",
  "CHARGE_LINE",
  "EMR_BILLABLE_LINE",
] as const;

export const IopPersistedImportRequestSchema = z
  .object({
    facilityId: text,
    programId: text,
    integrationKey: z.string().regex(/^[A-Z][A-Z0-9_]{2,79}$/),
    idempotencyKey: z.string().trim().min(8).max(200),
    source: z
      .object({
        fileName: z.string().trim().min(3).max(160).optional(),
        exportedAt: timestamp,
        cutoffAt: timestamp,
      })
      .strict()
      .refine((source) => source.cutoffAt <= source.exportedAt, {
        path: ["cutoffAt"],
        message: "Source cutoff cannot be after export time",
      }),
    sourceRecords: z
      .array(
        z
          .object({
            type: z.enum(IOP_SOURCE_RECORD_TYPES),
            sourceRecordId: text,
            sourceVersion: text,
          })
          .strict(),
      )
      .min(1)
      .max(1000)
      .refine(
        (records) =>
          new Set(
            records.map(
              (record) =>
                `${record.type}:${record.sourceRecordId}:${record.sourceVersion}`,
            ),
          ).size === records.length,
        "Duplicate source record version",
      ),
    reconciliation: IopReconciliationSampleSchema,
  })
  .strict()
  .superRefine((request, context) => {
    if (request.programId !== request.reconciliation.programId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["programId"],
        message: "Request program must match the reconciliation program",
      });
    }
    const expectedSourceIds = {
      ENROLLMENT: request.reconciliation.enrollments.map((entry) => entry.enrollmentId),
      TREATMENT_PLAN: request.reconciliation.treatmentPlans.map((entry) => entry.planId),
      ATTENDANCE: request.reconciliation.attendanceEvents.map((entry) => entry.attendanceId),
      NOTE_AUDIT: request.reconciliation.noteAudits.map((entry) => entry.auditId),
      CHARGE_LINE: request.reconciliation.chargeLines.map((entry) => entry.chargeLineId),
      EMR_BILLABLE_LINE: request.reconciliation.emrBillableLines.map((entry) => entry.billableLineId),
    } as const;
    for (const [type, sourceIds] of Object.entries(expectedSourceIds)) {
      for (const sourceRecordId of sourceIds) {
        if (!request.sourceRecords.some((record) => record.type === type && record.sourceRecordId === sourceRecordId)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["sourceRecords"],
            message: `Missing stable ${type} source record for ${sourceRecordId}`,
          });
        }
      }
    }
  });
export type IopPersistedImportRequest = z.infer<
  typeof IopPersistedImportRequestSchema
>;

export const IopCloseRequestSchema = z
  .object({
    expectedRevision: z.number().int().positive(),
    idempotencyKey: z.string().trim().min(8).max(200),
    reason: z.string().trim().min(3).max(1000),
  })
  .strict();

export const IopExceptionReviewRequestSchema = z
  .object({
    expectedRevision: z.number().int().positive(),
    idempotencyKey: z.string().trim().min(8).max(200),
    disposition: z.enum(["RESOLVED", "ACCEPTED_EXCEPTION"]),
    reason: z.string().trim().min(3).max(1000),
  })
  .strict();

export type IopPermission = "view" | "import" | "review" | "close";
export function iopPermissionsFor(
  principal: AuthenticatedPrincipal,
): readonly IopPermission[] {
  if (principal.roles.includes("ORGANIZATION_ADMIN"))
    return ["view", "import", "review", "close"];
  if (
    principal.roles.includes("UTILIZATION_REVIEWER") ||
    principal.roles.includes("COMPLIANCE_REVIEWER")
  )
    return ["view", "review"];
  return [];
}
