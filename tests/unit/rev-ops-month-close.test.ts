import { expect, it } from "vitest";
import { RevOpsCommandSchema } from "../../packages/domain-contracts/src/revOps.js";
import {
  applyRevOpsCommand,
  createRevOpsState,
  monthCloseReadiness,
  staffingComparison,
} from "../../packages/rev-ops-service/src/index.js";
import type { AuthenticatedPrincipal } from "@clarity/domain-contracts";
const actor: AuthenticatedPrincipal = {
  userId: "synthetic-admin",
  organizationId: "synthetic-org",
  roles: ["ORGANIZATION_ADMIN"],
  displayName: "Synthetic Admin",
  sessionId: "synthetic-calendar-session",
  expiresAt: new Date("2099-01-01"),
};
const source = { kind: "manual" as const, name: "Synthetic calendar fixture" };
const setup = () =>
  createRevOpsState({
    name: "Synthetic",
    unit: "Geriatric",
    timezone: "America/Chicago",
    costCenterLabel: "Cost center",
    costCenterOptions: ["Inpatient"],
  });
it.each([
  ["2027-02", 28],
  ["2028-02", 29],
  ["2000-02", 29],
  ["2028-04", 30],
  ["2028-01", 31],
] as const)(
  "requires exactly %s calendar dates and preserves zero (%i)",
  (period, days) => {
    const state = setup();
    const run = (command: unknown) =>
      applyRevOpsCommand(
        state,
        RevOpsCommandSchema.parse(command),
        actor,
        source,
        "2028-03-01T06:00:00.000Z",
      );
    run({
      action: "budget",
      period,
      total: days * 10,
      costCenter: "Inpatient",
    });
    run({ action: "approve", budgetId: state.budgets[0]!.id });
    expect(state.budgets[0]!.dailyTargets).toHaveLength(days);
    expect(
      state.budgets[0]!.dailyTargets.reduce((a, b) => a + b, 0),
    ).toBeCloseTo(days * 10);
    for (let day = 1; day < days; day++)
      run({
        action: "actual",
        date: `${period}-${String(day).padStart(2, "0")}`,
        count: 10,
      });
    expect(monthCloseReadiness(state, period)).toMatchObject({
      expectedDays: days,
      recordedDays: days - 1,
      missingDates: [`${period}-${days}`],
      actuals: null,
      variance: null,
      ready: false,
    });
    expect(() =>
      run({ action: "close", period, reason: "Reviewed month" }),
    ).toThrow("complete_month_required_for_close");
    expect(state.closedPeriods).toEqual([]);
    run({ action: "actual", date: `${period}-${days}`, count: 0 });
    expect(monthCloseReadiness(state, period)).toMatchObject({
      recordedDays: days,
      actuals: (days - 1) * 10,
      variance: -10,
      ready: true,
    });
    run({ action: "close", period, reason: "Reviewed month" });
    expect(state.closedPeriods).toEqual([period]);
    expect(() =>
      run({
        action: "correct",
        date: `${period}-${days}`,
        count: 5,
        reason: "Late correction",
      }),
    ).toThrow("period_closed");
    run({ action: "reopen", period, reason: "Late correction" });
    expect(monthCloseReadiness(state, period).ready).toBe(true);
  },
);
it("rejects impossible February dates and incorrect daily-target lengths", () => {
  for (const date of ["2027-02-29", "2028-02-30", "2028-04-31"])
    expect(
      RevOpsCommandSchema.safeParse({ action: "actual", date, count: 0 })
        .success,
    ).toBe(false);
  const state = setup();
  expect(() =>
    applyRevOpsCommand(
      state,
      {
        action: "budget",
        period: "2028-02",
        total: 280,
        dailyTargets: Array(28).fill(10),
        costCenter: "Inpatient",
      },
      actor,
      source,
      "2028-03-01",
    ),
  ).toThrow();
});
it("requires an approved budget and rejects the wrong month's approved version", () => {
  const state = setup();
  expect(() =>
    applyRevOpsCommand(
      state,
      { action: "close", period: "2028-02", reason: "Review" },
      actor,
      source,
      "2028-03-01",
    ),
  ).toThrow("approved_budget_required_for_close");
  applyRevOpsCommand(
    state,
    {
      action: "budget",
      period: "2028-01",
      total: 310,
      costCenter: "Inpatient",
    },
    actor,
    source,
    "2028-03-01",
  );
  applyRevOpsCommand(
    state,
    { action: "approve", budgetId: state.budgets[0]!.id },
    actor,
    source,
    "2028-03-01",
  );
  expect(() =>
    monthCloseReadiness(state, "2028-02", state.budgets[0]!.id),
  ).toThrow("approved_budget_not_found");
});
it("preserves approved staffing-plan inputs in the deterministic close loop", () => {
  const state = setup();
  const period = "2028-02";
  const run = (command: unknown) =>
    applyRevOpsCommand(
      state,
      RevOpsCommandSchema.parse(command),
      actor,
      source,
      "2028-03-01T06:00:00.000Z",
    );
  run({ action: "budget", period, total: 290, costCenter: "Inpatient" });
  run({ action: "approve", budgetId: state.budgets[0]!.id });
  run({
    action: "defineStaffingMetric",
    code: "RN_WORKED_HOURS",
    label: "Synthetic RN worked hours",
    definition: "Synthetic test measure for worked nursing hours.",
    unit: "hours",
    version: "1.0.0",
    effectiveFrom: "2028-02-01",
  });
  run({
    action: "approveStaffingMetric",
    code: "RN_WORKED_HOURS",
    version: "1.0.0",
  });
  run({
    action: "staffingRule",
    metricCode: "RN_WORKED_HOURS",
    effectiveFrom: "2028-02-01",
    targetHoursPerCensus: 2,
  });
  run({ action: "approveStaffingRule", ruleId: state.staffingRules![0]!.id });
  for (let day = 1; day <= 29; day++) {
    const date = `${period}-${String(day).padStart(2, "0")}`;
    run({ action: "actual", date, count: 10 });
    run({ action: "staffingActual", date, hours: 20 });
  }
  expect(staffingComparison(state, period, "2028-02-29")).toMatchObject({
    metric: { code: "RN_WORKED_HOURS", status: "approved" },
    expectedHours: 580,
    actualHours: 580,
    variance: 0,
    missingCensusDates: [],
    missingStaffingDates: [],
    missingRuleDates: [],
  });
  run({
    action: "staffingRule",
    metricCode: "RN_WORKED_HOURS",
    effectiveFrom: "2028-02-15",
    targetHoursPerCensus: 3,
  });
  run({ action: "approveStaffingRule", ruleId: state.staffingRules![1]!.id });
  expect(staffingComparison(state, period, "2028-02-29")).toMatchObject({
    expectedHours: 730,
    actualHours: 580,
    variance: -150,
  });
  expect(monthCloseReadiness(state, period)).toMatchObject({
    staffing: { variance: -150 },
    ready: true,
  });
  run({ action: "close", period, reason: "Reviewed synthetic staffing close" });
  expect(() =>
    run({
      action: "correctStaffingActual",
      date: "2028-02-29",
      hours: 21,
      reason: "Late synthetic correction",
    }),
  ).toThrow("period_closed");
  run({ action: "reopen", period, reason: "Late synthetic correction" });
  run({
    action: "correctStaffingActual",
    date: "2028-02-29",
    hours: 21,
    reason: "Late synthetic correction",
  });
  expect(state.staffingActuals!["2028-02-29"]).toHaveLength(2);
});
