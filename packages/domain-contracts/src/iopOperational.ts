import { z } from "zod";

const token = z.string().regex(/^[A-Z][A-Z0-9_-]{2,79}$/);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timestamp = z.string().datetime();

export const IopOperationalRecordsSchema = z.object({
  privacy: z.literal("SYNTHETIC_ONLY"),
  programId: token,
  asOfDate: date,
  enrollments: z.array(z.object({
    enrollmentId: token, personToken: token,
    status: z.enum(["PENDING_REFERRAL", "ENROLLED", "ENDED", "INPATIENT"]),
    startsOn: date, endsOn: date.optional(), priorEnrollmentId: token.optional(),
  }).strict()),
  planVersions: z.array(z.object({
    planId: token, enrollmentId: token, version: z.string().regex(/^\d+\.\d+\.\d+$/),
    effectiveFrom: date, effectiveThrough: date.optional(), prescribedDaysPerWeek: z.number().int().min(1).max(7),
  }).strict()),
  attendance: z.array(z.object({
    attendanceId: token, enrollmentId: token, planId: token.optional(), serviceDate: date,
    scheduled: z.boolean(), outcome: z.enum(["ATTENDED", "NO_SHOW", "APPROVED_CANCELED", "UNSCHEDULED"]),
  }).strict()),
  services: z.array(z.object({
    serviceId: token, sessionId: token, attendanceId: token, enrollmentId: token, serviceDate: date,
    category: z.enum(["GROUP", "NON_GROUP"]), units: z.number().positive().max(100),
  }).strict()),
  groupCapacityReviews: z.array(z.object({
    sessionId: token, participantCount: z.number().int().nonnegative(), target: z.number().int().positive(),
    targetOwner: token, targetVersion: z.string().min(1).max(80), reviewedBy: token, reviewedAt: timestamp,
  }).strict()),
  mealDeliveries: z.array(z.object({
    mealDeliveryId: token, serviceDate: date, deliveredCount: z.number().int().nonnegative(),
    reviewedNonpayableCount: z.number().int().nonnegative(), contractEligible: z.boolean(),
  }).strict().refine((row) => row.reviewedNonpayableCount <= row.deliveredCount, "Reviewed nonpayable meals cannot exceed delivered meals")),
}).strict().superRefine((records, context) => {
  const enrollmentById = new Map(records.enrollments.map((entry) => [entry.enrollmentId, entry]));
  const planById = new Map(records.planVersions.map((entry) => [entry.planId, entry]));
  const attendanceById = new Map(records.attendance.map((entry) => [entry.attendanceId, entry]));

  for (const enrollment of records.enrollments) {
    if (enrollment.endsOn && enrollment.endsOn <= enrollment.startsOn) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["enrollments"], message: "Enrollment end must be after enrollment start under the exclusive-end rule" });
    }
    if (enrollment.priorEnrollmentId) {
      const prior = enrollmentById.get(enrollment.priorEnrollmentId);
      if (!prior || prior.personToken !== enrollment.personToken) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["enrollments"], message: "Prior enrollment must exist for the same person" });
      } else if (prior.endsOn && prior.endsOn > enrollment.startsOn) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["enrollments"], message: "A new enrollment cannot begin before its prior enrollment ends" });
      }
    }
  }

  for (const plan of records.planVersions) {
    const enrollment = enrollmentById.get(plan.enrollmentId);
    if (!enrollment) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["planVersions"], message: "Plan version must reference an enrollment" });
      continue;
    }
    if (plan.effectiveThrough && plan.effectiveThrough <= plan.effectiveFrom) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["planVersions"], message: "Plan effective-through date must be after its effective-from date" });
    }
    if (plan.effectiveFrom < enrollment.startsOn || (enrollment.endsOn && plan.effectiveFrom >= enrollment.endsOn)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["planVersions"], message: "Plan effective-from date must be within its enrollment" });
    }
  }

  for (const attendance of records.attendance) {
    const enrollment = enrollmentById.get(attendance.enrollmentId);
    if (!enrollment || attendance.serviceDate < enrollment.startsOn || (enrollment.endsOn && attendance.serviceDate >= enrollment.endsOn)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["attendance"], message: "Attendance must occur within its enrollment" });
    }
    if (attendance.scheduled === (attendance.outcome === "UNSCHEDULED")) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["attendance"], message: "Scheduled state must agree with the attendance outcome" });
    }
    if (attendance.planId) {
      const plan = planById.get(attendance.planId);
      if (!plan || plan.enrollmentId !== attendance.enrollmentId || plan.effectiveFrom > attendance.serviceDate || (plan.effectiveThrough && plan.effectiveThrough <= attendance.serviceDate)) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["attendance"], message: "Attendance plan must belong to the enrollment and be effective on the service date" });
      }
    }
  }

  for (const service of records.services) {
    const attendance = attendanceById.get(service.attendanceId);
    if (!attendance || attendance.enrollmentId !== service.enrollmentId || attendance.serviceDate !== service.serviceDate) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["services"], message: "Service must reconcile to attendance for the same enrollment and service date" });
    } else if (attendance.outcome !== "ATTENDED") {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["services"], message: "Services can only be recorded for attended visits" });
    }
  }
});

export type IopOperationalRecords = z.infer<typeof IopOperationalRecordsSchema>;

/** Derives operational measures only. It never determines clinical eligibility or billing. */
export function calculateIopOperationalMeasures(input: unknown) {
  const records = IopOperationalRecordsSchema.parse(input);
  const active = records.enrollments.filter((entry) => entry.status === "ENROLLED" && entry.startsOn <= records.asOfDate && (!entry.endsOn || entry.endsOn > records.asOfDate));
  const eligible = records.attendance.filter((entry) => entry.scheduled && entry.outcome !== "APPROVED_CANCELED");
  const attended = eligible.filter((entry) => entry.outcome === "ATTENDED");
  const sessions = new Set(records.services.map((entry) => entry.sessionId));
  const patientDays = new Set(records.services.map((entry) => `${entry.enrollmentId}:${entry.serviceDate}`));
  const groupUnits = records.services.filter((entry) => entry.category === "GROUP").reduce((total, entry) => total + entry.units, 0);
  const totalUnits = records.services.reduce((total, entry) => total + entry.units, 0);
  const nonGroupUnits = totalUnits - groupUnits;
  const payableMeals = records.mealDeliveries.reduce((total, entry) => total + (entry.contractEligible ? entry.deliveredCount - entry.reviewedNonpayableCount : 0), 0);
  return {
    enrolledCensus: active.length,
    pendingReferralCount: records.enrollments.filter((entry) => entry.status === "PENDING_REFERRAL").length,
    attendanceRate: eligible.length ? attended.length / eligible.length : null,
    attendedScheduledVisits: attended.length, eligibleScheduledVisits: eligible.length,
    noShows: records.attendance.filter((entry) => entry.scheduled && entry.outcome === "NO_SHOW").length,
    sessions: sessions.size, patientDays: patientDays.size, groupUnits, totalUnits, nonGroupUnits,
    groupCapacity: records.groupCapacityReviews.map((entry) => ({ ...entry, utilization: entry.participantCount / entry.target })),
    payableMeals,
  };
}
