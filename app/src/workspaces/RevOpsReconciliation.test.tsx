import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ReconciliationReview } from "./RevOpsReconciliation";
import type {
  RevOpsImportRow,
  RevOpsState,
} from "../../../packages/domain-contracts/src/revOps";
afterEach(cleanup);
const state: RevOpsState = {
  unit: "Geriatric",
  timezone: "America/Chicago",
  grants: {},
  budgets: [],
  actuals: {},
  closedPeriods: [],
  acceptedImports: [],
  field: {
    id: "cost-center",
    label: "Cost center",
    version: 1,
    archived: false,
    options: ["Inpatient"],
  },
  customFields: [
    {
      id: "field",
      scope: "actual",
      type: "text",
      label: "Review",
      version: 1,
      required: false,
      archived: false,
      options: [],
    },
  ],
};
const row: RevOpsImportRow = {
  row: 2,
  date: "2028-02-06",
  status: "conflict",
  issues: ["Metadata conflict"],
  saved: {
    count: 8,
    fields: [
      {
        fieldId: "field",
        type: "text",
        label: "Review",
        version: 1,
        value: "Reviewed",
      },
    ],
    source: { kind: "manual", name: "Signed census" },
    actorId: "staff",
    at: "2028-02-07",
    cutoffInstant: "2028-02-07T06:00:00Z",
  },
  incoming: { count: 8, fields: [] },
};
const props = () => ({
  rows: [row],
  state,
  busy: false,
  canEnter: true,
  canCorrect: true,
  stale: false,
  replayed: false,
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
});
it("requires explicit whole-row choice and reason and makes optional-field clearing visible", () => {
  const p = props();
  render(<ReconciliationReview {...p} />);
  const confirm = screen.getByRole("button", { name: "Confirm import" });
  expect(confirm).toBeDisabled();
  expect(
    screen.getByText(/blank \(cleared if uploaded values are used\)/),
  ).toBeVisible();
  fireEvent.change(screen.getByLabelText("Decision for 2028-02-06"), {
    target: { value: "use" },
  });
  expect(confirm).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Reason for 2028-02-06"), {
    target: { value: "  Verified missing review  " },
  });
  expect(confirm).toBeEnabled();
  expect(screen.getByText("Expected patient-day change: 0")).toBeVisible();
  fireEvent.click(confirm);
  expect(p.onConfirm).toHaveBeenCalledWith([
    {
      row: 2,
      date: "2028-02-06",
      choice: "use",
      reason: "Verified missing review",
    },
  ]);
});
it("blocks stale, invalid and entry-only confirmation even for a keep decision", () => {
  const p = props();
  const { rerender } = render(<ReconciliationReview {...p} />);
  fireEvent.change(screen.getByLabelText("Decision for 2028-02-06"), {
    target: { value: "keep" },
  });
  fireEvent.change(screen.getByLabelText("Reason for 2028-02-06"), {
    target: { value: "Signed census" },
  });
  const confirm = screen.getByRole("button", { name: "Confirm import" });
  for (const override of [
    { stale: true },
    { canCorrect: false },
    {
      rows: [
        row,
        { row: 3, status: "invalid" as const, issues: ["Missing count"] },
      ],
    },
  ]) {
    rerender(<ReconciliationReview {...p} {...override} />);
    expect(confirm).toBeDisabled();
    fireEvent.click(confirm);
  }
  expect(p.onConfirm).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Discard preview" }));
  expect(p.onCancel).toHaveBeenCalledOnce();
});
it("allows an authorized replay without correction authority or fresh-write readiness", () => {
  const p = props();
  render(
    <ReconciliationReview {...p} rows={[]} replayed stale canCorrect={false} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Confirm import" }));
  expect(p.onConfirm).toHaveBeenCalledWith([]);
  expect(
    screen.getByText(/This earlier import has no reconciliation receipt/),
  ).toBeVisible();
});
