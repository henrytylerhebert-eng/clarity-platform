import { describe, expect, it } from "vitest";
import { validateIopReconciliationSample } from "../../packages/domain-contracts/src/iopReconciliation.js";

describe("IOP note-audit independence", () => {
  it("keeps a self-reviewed note as an explicit exception instead of audit proof", () => {
    const sample = {
      privacy: "SYNTHETIC_ONLY", sampleId: "IOP_SELF_AUDIT", serviceDate: "2028-02-07", programId: "IOP_PROGRAM_001",
      enrollments: [{ enrollmentId: "ENR_001", personToken: "PERSON_001", status: "ACTIVE", enrolledOn: "2028-02-01" }],
      treatmentPlans: [{ planId: "PLAN_001", enrollmentId: "ENR_001", version: "1.0.0", effectiveFrom: "2028-02-01", prescribedDaysPerWeek: 3, status: "ACTIVE" }],
      attendanceEvents: [{ attendanceId: "ATT_001", enrollmentId: "ENR_001", planId: "PLAN_001", groupType: "Group", outcome: "ATTENDED" }],
      noteAudits: [{ attendanceId: "ATT_001", noteId: "NOTE_001", authoredBy: "THERAPIST_001", auditStatus: "COMPLETE", reviewedBy: "THERAPIST_001", reviewedAt: "2028-02-08T00:00:00.000Z" }],
      chargeLines: [], emrBillableLines: [], exceptionReviews: [],
    };
    expect(validateIopReconciliationSample(sample).unresolved).toContainEqual({ issueKey: "attendance:ATT_001:note_audit_not_independent", reason: "note_audit_not_independent" });
  });
});
