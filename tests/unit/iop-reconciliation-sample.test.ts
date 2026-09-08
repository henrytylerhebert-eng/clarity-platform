import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  IopReconciliationSampleSchema,
  validateIopReconciliationSample,
} from "../../packages/domain-contracts/src/iopReconciliation.js";

const fixturePath = new URL(
  "../../docs/product/evidence/IOP_ATTENDANCE_RECONCILIATION_SYNTHETIC_SAMPLE.json",
  import.meta.url,
);

function sampleFixture() {
  return JSON.parse(readFileSync(fixturePath, "utf8"));
}

describe("synthetic IOP attendance reconciliation", () => {
  it("accepts a de-identified source-link sample only when every derived gap is reviewed", () => {
    const sample = sampleFixture();

    expect(IopReconciliationSampleSchema.parse(sample).privacy).toBe(
      "SYNTHETIC_ONLY",
    );
    expect(validateIopReconciliationSample(sample)).toEqual({
      issues: expect.arrayContaining([
        {
          issueKey: "enrollment:ENR_003:plan_missing",
          reason: "plan_missing",
        },
        {
          issueKey: "attendance:ATT_002:note_audit_missing",
          reason: "note_audit_missing",
        },
        {
          issueKey: "attendance:ATT_002:charge_missing",
          reason: "charge_missing_or_note_mismatch",
        },
        {
          issueKey: "attendance:ATT_004:charge_missing",
          reason: "charge_missing_or_note_mismatch",
        },
        {
          issueKey: "charge:CHARGE_005:emr_billable_missing",
          reason: "emr_billable_missing",
        },
      ]),
      unresolved: [],
    });
  });

  it("requires a separate reviewed exception for each unmatched event", () => {
    const sample = sampleFixture();
    sample.exceptionReviews = sample.exceptionReviews.filter(
      (review: { issueKey: string }) =>
        review.issueKey !== "attendance:ATT_004:charge_missing",
    );

    expect(validateIopReconciliationSample(sample).unresolved).toEqual([
      {
        issueKey: "attendance:ATT_004:charge_missing",
        reason: "charge_missing_or_note_mismatch",
      },
    ]);
  });

  it("also exposes unmatched downstream source events for review", () => {
    const sample = sampleFixture();
    sample.emrBillableLines.push({
      billableLineId: "BILLABLE_ORPHAN",
      chargeLineId: "CHARGE_UNKNOWN",
      status: "HELD",
    });

    expect(validateIopReconciliationSample(sample).unresolved).toContainEqual({
      issueKey: "charge:CHARGE_UNKNOWN:emr_billable_orphan",
      reason: "emr_billable_orphan",
    });
  });
});
