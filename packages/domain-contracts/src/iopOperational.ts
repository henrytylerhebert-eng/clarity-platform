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
}).strict();

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
