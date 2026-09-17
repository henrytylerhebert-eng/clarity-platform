import { describe, expect, it } from "vitest";
import { IopOperationalRecordsSchema, calculateIopOperationalMeasures } from "../../packages/domain-contracts/src/iopOperational.js";

const records = {
  privacy: "SYNTHETIC_ONLY", programId: "IOP_PROGRAM_001", asOfDate: "2028-02-07",
  enrollments: [
    { enrollmentId: "ENR_OLD", personToken: "PERSON_001", status: "ENDED", startsOn: "2028-01-01", endsOn: "2028-01-05" },
    { enrollmentId: "ENR_001", personToken: "PERSON_001", status: "ENROLLED", startsOn: "2028-02-01", priorEnrollmentId: "ENR_OLD" },
    { enrollmentId: "REF_001", personToken: "PERSON_002", status: "PENDING_REFERRAL", startsOn: "2028-02-01" },
  ],
  planVersions: [
    { planId: "PLAN_3", enrollmentId: "ENR_001", version: "1.0.0", effectiveFrom: "2028-02-01", effectiveThrough: "2028-02-03", prescribedDaysPerWeek: 3 },
    { planId: "PLAN_2", enrollmentId: "ENR_001", version: "1.1.0", effectiveFrom: "2028-02-03", effectiveThrough: "2028-02-05", prescribedDaysPerWeek: 2 },
    { planId: "PLAN_1", enrollmentId: "ENR_001", version: "1.2.0", effectiveFrom: "2028-02-05", prescribedDaysPerWeek: 1 },
  ],
  attendance: Array.from({ length: 8 }, (_, index) => ({ attendanceId: `ATT_${index + 1}`, enrollmentId: "ENR_001", planId: "PLAN_1", serviceDate: "2028-02-07", scheduled: true, outcome: "ATTENDED" as const })).concat([
    { attendanceId: "ATT_CANCEL", enrollmentId: "ENR_001", planId: "PLAN_1", serviceDate: "2028-02-07", scheduled: true, outcome: "APPROVED_CANCELED" as const },
    { attendanceId: "ATT_NO_1", enrollmentId: "ENR_001", planId: "PLAN_1", serviceDate: "2028-02-07", scheduled: true, outcome: "NO_SHOW" as const },
    { attendanceId: "ATT_NO_2", enrollmentId: "ENR_001", planId: "PLAN_1", serviceDate: "2028-02-07", scheduled: true, outcome: "NO_SHOW" as const },
    { attendanceId: "ATT_UNSCHEDULED", enrollmentId: "ENR_001", serviceDate: "2028-02-07", scheduled: false, outcome: "UNSCHEDULED" as const },
  ]),
  services: [
    { serviceId: "SERVICE_1", sessionId: "SESSION_1", attendanceId: "ATT_1", enrollmentId: "ENR_001", serviceDate: "2028-02-07", category: "GROUP" as const, units: 1 },
    { serviceId: "SERVICE_2", sessionId: "SESSION_1", attendanceId: "ATT_2", enrollmentId: "ENR_001", serviceDate: "2028-02-07", category: "GROUP" as const, units: 1 },
    { serviceId: "SERVICE_3", sessionId: "SESSION_2", attendanceId: "ATT_3", enrollmentId: "ENR_001", serviceDate: "2028-02-07", category: "NON_GROUP" as const, units: 1 },
    { serviceId: "SERVICE_4", sessionId: "SESSION_2", attendanceId: "ATT_4", enrollmentId: "ENR_003", serviceDate: "2028-02-07", category: "GROUP" as const, units: 1 },
    { serviceId: "SERVICE_5", sessionId: "SESSION_2", attendanceId: "ATT_5", enrollmentId: "ENR_003", serviceDate: "2028-02-07", category: "GROUP" as const, units: 1 },
  ],
  groupCapacityReviews: [{ sessionId: "SESSION_1", participantCount: 8, target: 10, targetOwner: "DIRECTOR_001", targetVersion: "v1", reviewedBy: "DIRECTOR_001", reviewedAt: "2028-02-08T00:00:00.000Z" }],
  mealDeliveries: [{ mealDeliveryId: "MEAL_001", serviceDate: "2028-02-07", deliveredCount: 12, reviewedNonpayableCount: 2, contractEligible: true }],
};

describe("synthetic IOP P2 operating records", () => {
  it("preserves enrollment history and derives AT13 through AT16 without billing inference", () => {
    const result = calculateIopOperationalMeasures(records);
    expect(result).toMatchObject({ enrolledCensus: 1, pendingReferralCount: 1, attendedScheduledVisits: 8, eligibleScheduledVisits: 10, noShows: 2, sessions: 2, patientDays: 2, groupUnits: 4, totalUnits: 5, nonGroupUnits: 1, payableMeals: 10 });
    expect(result.attendanceRate).toBe(0.8);
    expect(result.groupCapacity[0]).toMatchObject({ participantCount: 8, target: 10, utilization: 0.8, targetOwner: "DIRECTOR_001", targetVersion: "v1" });
  });

  it("rejects negative and over-delivered nonpayable meal records", () => {
    expect(() => IopOperationalRecordsSchema.parse({ ...records, mealDeliveries: [{ ...records.mealDeliveries[0], reviewedNonpayableCount: 13 }] })).toThrow("cannot exceed");
    expect(() => IopOperationalRecordsSchema.parse({ ...records, mealDeliveries: [{ ...records.mealDeliveries[0], deliveredCount: -1 }] })).toThrow();
  });
});
