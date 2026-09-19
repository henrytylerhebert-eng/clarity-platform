import { z } from "zod";

const token = z.string().regex(/^[A-Z][A-Z0-9_-]{2,79}$/);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timestamp = z.string().datetime();

export const IopReconciliationSampleSchema = z
  .object({
    privacy: z.literal("SYNTHETIC_ONLY"),
    sampleId: token,
    serviceDate: date,
    programId: token,
    enrollments: z
      .array(
        z
          .object({
            enrollmentId: token,
            personToken: token,
            status: z.enum(["ACTIVE", "PENDING_TREATMENT_PLAN", "CLOSED"]),
            enrolledOn: date,
          })
          .strict(),
      )
      .min(1)
      .max(100),
    treatmentPlans: z
      .array(
        z
          .object({
            planId: token,
            enrollmentId: token,
            version: z.string().regex(/^\d+\.\d+\.\d+$/),
            effectiveFrom: date,
            prescribedDaysPerWeek: z.number().int().min(1).max(7),
            status: z.literal("ACTIVE"),
          })
          .strict(),
      )
      .max(100),
    attendanceEvents: z
      .array(
        z
          .object({
            attendanceId: token,
            enrollmentId: token,
            planId: token.optional(),
            groupType: z.string().trim().min(1).max(120),
            outcome: z.enum(["ATTENDED", "ABSENT", "EXCUSED", "CANCELED"]),
          })
          .strict(),
      )
      .max(500),
    noteAudits: z
      .array(
        z
          .object({
            attendanceId: token,
            noteId: token,
            auditId: token,
            authoredBy: token,
            auditStatus: z.enum(["COMPLETE", "PENDING", "FAILED"]),
            reviewedBy: token.optional(),
            reviewedAt: timestamp.optional(),
          })
          .strict(),
      )
      .max(500),
    chargeLines: z
      .array(
        z
          .object({
            chargeLineId: token,
            attendanceId: token,
            noteId: token,
            units: z.number().positive().max(100),
            status: z.enum(["CREATED", "HELD", "VOIDED"]),
          })
          .strict(),
      )
      .max(500),
    emrBillableLines: z
      .array(
        z
          .object({
            billableLineId: token,
            chargeLineId: token,
            status: z.enum(["POSTED", "HELD", "DENIED"]),
          })
          .strict(),
      )
      .max(500),
    exceptionReviews: z
      .array(
        z
          .object({
            issueKey: z.string().regex(/^(enrollment|attendance|charge):[A-Z][A-Z0-9_-]{2,79}:[a-z_]+$/),
            state: z.literal("REVIEWED"),
            reviewerToken: token,
            reviewedAt: timestamp,
            disposition: z.enum(["ACCEPTED_EXCEPTION", "HOLD", "REJECTED"]),
            reason: z.string().trim().min(3).max(1000),
          })
          .strict(),
      )
      .max(500),
  })
  .strict();

export type IopReconciliationSample = z.infer<
  typeof IopReconciliationSampleSchema
>;

export interface IopReconciliationIssue {
  issueKey: string;
  reason:
    | "plan_missing"
    | "attendance_plan_mismatch"
    | "note_audit_missing"
    | "note_audit_not_independent"
    | "note_audit_orphan"
    | "charge_missing_or_note_mismatch"
    | "charge_attendance_missing"
    | "emr_billable_orphan"
    | "emr_billable_missing";
}

/**
 * Reports source-link gaps only. It does not decide eligibility, billability,
 * clinical compliance, or the disposition of a human-reviewed exception.
 */
export function validateIopReconciliationSample(
  input: unknown,
): { issues: IopReconciliationIssue[]; unresolved: IopReconciliationIssue[] } {
  const sample = IopReconciliationSampleSchema.parse(input);
  const effectivePlans = sample.treatmentPlans.filter(
    (plan) => plan.effectiveFrom <= sample.serviceDate,
  );
  const plans = new Map(effectivePlans.map((plan) => [plan.planId, plan]));
  const planByEnrollment = new Map<string, (typeof effectivePlans)[number]>();
  for (const plan of effectivePlans) {
    const current = planByEnrollment.get(plan.enrollmentId);
    if (!current || plan.effectiveFrom > current.effectiveFrom)
      planByEnrollment.set(plan.enrollmentId, plan);
  }
  const audits = new Map(sample.noteAudits.map((audit) => [audit.attendanceId, audit]));
  const attendance = new Map(
    sample.attendanceEvents.map((event) => [event.attendanceId, event]),
  );
  const charges = new Map(
    sample.chargeLines.map((charge) => [charge.attendanceId, charge]),
  );
  const billables = new Set(
    sample.emrBillableLines.map((billable) => billable.chargeLineId),
  );
  const issues: IopReconciliationIssue[] = [];
  for (const enrollment of sample.enrollments) {
    if (enrollment.status !== "CLOSED" && !planByEnrollment.has(enrollment.enrollmentId))
      issues.push({
        issueKey: `enrollment:${enrollment.enrollmentId}:plan_missing`,
        reason: "plan_missing",
      });
  }
  for (const event of sample.attendanceEvents) {
    if (event.outcome !== "ATTENDED") continue;
    const plan = event.planId ? plans.get(event.planId) : undefined;
    if (!plan || plan.enrollmentId !== event.enrollmentId)
      issues.push({
        issueKey: `attendance:${event.attendanceId}:attendance_plan_mismatch`,
        reason: "attendance_plan_mismatch",
      });
    const audit = audits.get(event.attendanceId);
    if (
      !audit ||
      audit.auditStatus !== "COMPLETE" ||
      !audit.reviewedBy ||
      !audit.reviewedAt
    )
      issues.push({
        issueKey: `attendance:${event.attendanceId}:note_audit_missing`,
        reason: "note_audit_missing",
      });
    else if (audit.authoredBy === audit.reviewedBy)
      issues.push({
        issueKey: `attendance:${event.attendanceId}:note_audit_not_independent`,
        reason: "note_audit_not_independent",
      });
    const charge = charges.get(event.attendanceId);
    if (!charge || (audit && charge.noteId !== audit.noteId))
      issues.push({
        issueKey: `attendance:${event.attendanceId}:charge_missing`,
        reason: "charge_missing_or_note_mismatch",
      });
    else if (!billables.has(charge.chargeLineId))
      issues.push({
        issueKey: `charge:${charge.chargeLineId}:emr_billable_missing`,
        reason: "emr_billable_missing",
      });
  }
  for (const audit of sample.noteAudits) {
    if (!attendance.has(audit.attendanceId))
      issues.push({
        issueKey: `attendance:${audit.attendanceId}:note_audit_orphan`,
        reason: "note_audit_orphan",
      });
  }
  for (const charge of sample.chargeLines) {
    if (!attendance.has(charge.attendanceId))
      issues.push({
        issueKey: `charge:${charge.chargeLineId}:charge_attendance_missing`,
        reason: "charge_attendance_missing",
      });
  }
  for (const billable of sample.emrBillableLines) {
    if (!sample.chargeLines.some((charge) => charge.chargeLineId === billable.chargeLineId))
      issues.push({
        issueKey: `charge:${billable.chargeLineId}:emr_billable_orphan`,
        reason: "emr_billable_orphan",
      });
  }
  const reviewed = new Set(sample.exceptionReviews.map((review) => review.issueKey));
  return { issues, unresolved: issues.filter((issue) => !reviewed.has(issue.issueKey)) };
}
