import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  closeIopReconciliationImport,
  previewIopReconciliationImport,
} from "../../packages/domain-contracts/src/iopReconciliationImport.js";

const fixturePath = new URL(
  "../../docs/product/evidence/IOP_ATTENDANCE_RECONCILIATION_SYNTHETIC_IMPORT.json",
  import.meta.url,
);

function importFixture() {
  return JSON.parse(readFileSync(fixturePath, "utf8"));
}

describe("synthetic IOP source-import adapter", () => {
  it("preserves source cutoff and permits close only when every exception is reviewed", () => {
    const input = importFixture();
    const preview = previewIopReconciliationImport(input);

    expect(preview.closeReady).toBe(true);
    expect(preview.source.cutoffAt).toBe("2028-02-07T23:59:59.999Z");
    expect(
      closeIopReconciliationImport(input, {
        reviewerToken: "REVIEWER_002",
        reviewedAt: "2028-02-08T15:30:00.000Z",
      }),
    ).toMatchObject({
      importId: "IOP_IMPORT_001",
      sourceCutoffAt: "2028-02-07T23:59:59.999Z",
      reviewerToken: "REVIEWER_002",
      issueCount: 5,
      reviewedExceptionCount: 5,
    });
  });

  it("rejects a close when one unmatched item lacks its reviewed exception", () => {
    const input = importFixture();
    input.reconciliation.exceptionReviews.pop();

    expect(() =>
      closeIopReconciliationImport(input, {
        reviewerToken: "REVIEWER_002",
        reviewedAt: "2028-02-08T15:30:00.000Z",
      }),
    ).toThrow("iop_reconciliation_has_unreviewed_exceptions");
  });
});
