import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MonthClose, ClosingReceipt } from "./RevOpsMonthClose";
import type {
  RevOpsCloseReadiness,
  RevOpsClosingReceipt,
} from "../../../packages/domain-contracts/src/revOps";
afterEach(cleanup);
const readiness: RevOpsCloseReadiness = {
  period: "2028-02",
  through: "2028-02-29",
  expectedDays: 29,
  recordedDays: 29,
  missingDates: [],
  knownActuals: 280,
  actuals: 280,
  variance: -10,
  closed: false,
  ready: true,
  budget: {
    id: "reviewed-budget",
    period: "2028-02",
    total: 290,
    dailyTargets: Array(29).fill(10),
    costCenter: "Inpatient",
    costCenterLabel: "Cost center",
    fieldVersion: 1,
    status: "approved",
    source: { kind: "manual", name: "Synthetic budget" },
    createdBy: "admin",
    createdAt: "2028-01-01",
    approvedBy: "finance",
    approvedAt: "2028-01-02",
  },
};
const props = () => ({
  readiness,
  receipt: null,
  revision: 10,
  currentRevision: 10,
  busy: false,
  canClose: true,
  canReopen: true,
  onCommand: vi.fn(),
});
it("submits the reviewed budget and revision with an explicit trimmed close reason", () => {
  const p = props();
  render(<MonthClose {...p} />);
  const close = screen.getByRole("button", { name: "Close period" });
  expect(close).toBeDisabled();
  expect(screen.getByText(/29 of 29 calendar dates/)).toBeVisible();
  fireEvent.change(screen.getByLabelText("Reason to close period"), {
    target: { value: "  Signed month reviewed  " },
  });
  fireEvent.click(close);
  expect(p.onCommand).toHaveBeenCalledWith(
    {
      action: "close",
      period: "2028-02",
      budgetId: "reviewed-budget",
      reason: "Signed month reviewed",
    },
    10,
  );
});
it("blocks missing days, missing budgets, stale reviews and insufficient authority", () => {
  const p = props();
  const { rerender } = render(<MonthClose {...p} />);
  fireEvent.change(screen.getByLabelText("Reason to close period"), {
    target: { value: "Signed month" },
  });
  for (const override of [
    {
      readiness: {
        ...readiness,
        recordedDays: 28,
        missingDates: ["2028-02-29"],
        actuals: null,
        variance: null,
        ready: false,
      },
    },
    { readiness: { ...readiness, budget: null, ready: false } },
    { currentRevision: 11 },
    { canClose: false },
    { busy: true },
  ]) {
    rerender(<MonthClose {...p} {...override} />);
    expect(screen.getByRole("button", { name: "Close period" })).toBeDisabled();
  }
  expect(p.onCommand).not.toHaveBeenCalled();
});
it("labels legacy closes and allows an authorized reopen without inventing a receipt", () => {
  const p = props();
  render(
    <MonthClose
      {...p}
      readiness={{ ...readiness, closed: true, ready: false, budget: null }}
    />,
  );
  expect(screen.getByText(/No historical receipt exists/)).toBeVisible();
  fireEvent.change(screen.getByLabelText("Reason to reopen period"), {
    target: { value: "Review legacy close" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Reopen period" }));
  expect(p.onCommand).toHaveBeenCalledWith(
    { action: "reopen", period: "2028-02", reason: "Review legacy close" },
    10,
  );
});
it("renders frozen closing values and historical labels without current definitions", () => {
  const receipt: RevOpsClosingReceipt = {
    workspaceId: "synthetic",
    unit: "Geriatric",
    timezone: "America/Chicago",
    dateConvention: "end-of-day",
    period: "2028-02",
    through: "2028-02-29",
    expectedDays: 29,
    actuals: 280,
    budget: readiness.budget!,
    variance: -10,
    closingNumber: 1,
    revision: 11,
    actorId: "finance",
    at: "2028-03-01",
    reason: "Reviewed month",
    days: [
      {
        date: "2028-02-29",
        actualRevision: 1,
        actual: {
          count: 0,
          source: { kind: "manual", name: "Signed zero census" },
          actorId: "staff",
          at: "2028-03-01",
          cutoffInstant: "2028-03-01T06:00:00Z",
          fields: [
            {
              fieldId: "review",
              label: "Original review label",
              type: "text",
              version: 1,
              value: "Signed",
            },
          ],
        },
      },
    ],
  };
  render(<ClosingReceipt receipt={receipt} />);
  fireEvent.click(screen.getByText("Closing budget and daily sources"));
  expect(screen.getByText(/Original review label: Signed/)).toBeVisible();
  expect(
    screen.getByText(/2028-02-29 · 0 patient days · actual revision 1/),
  ).toBeVisible();
  expect(screen.getByText(/Fixed closing record/)).toBeVisible();
});
