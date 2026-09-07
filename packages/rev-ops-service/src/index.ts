import { randomUUID } from "node:crypto";
import type { AuthenticatedPrincipal } from "@clarity/domain-contracts";
import {
  REV_OPS_PERMISSIONS,
  type RevOpsCommand,
  type RevOpsSetup,
  type RevOpsState,
  type RevOpsPermission,
  type RevOpsSource,
} from "../../domain-contracts/src/revOps.js";

export class RevOpsError extends Error {
  constructor(
    readonly code: string,
    readonly status = 409,
  ) {
    super(code);
  }
}
export function isRevOpsAdmin(actor: AuthenticatedPrincipal): boolean {
  return actor.roles.includes("ORGANIZATION_ADMIN");
}
export function permissionsFor(
  state: RevOpsState,
  actor: AuthenticatedPrincipal,
): RevOpsPermission[] {
  return isRevOpsAdmin(actor)
    ? [...REV_OPS_PERMISSIONS]
    : (state.grants[actor.userId] ?? []);
}
export function requirePermission(
  state: RevOpsState,
  actor: AuthenticatedPrincipal,
  permission: RevOpsPermission,
): void {
  if (!permissionsFor(state, actor).includes(permission))
    throw new RevOpsError("permission_denied", 403);
}
export function createRevOpsState(input: RevOpsSetup): RevOpsState {
  return {
    unit: input.unit,
    timezone: input.timezone,
    field: {
      id: "cost-center",
      label: input.costCenterLabel,
      options: input.costCenterOptions,
      archived: false,
      version: 1,
    },
    grants: {},
    budgets: [],
    actuals: {},
    closedPeriods: [],
    acceptedImports: [],
  };
}
export function daysInPeriod(period: string): number {
  const [year, month] = period.split("-").map(Number);
  return new Date(Date.UTC(year!, month!, 0)).getUTCDate();
}
export function midnightEnding(date: string, timezone: string): string {
  const target = Date.parse(`${date}T00:00:00Z`) + 86400000;
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  let guess = target;
  for (let i = 0; i < 4; i++) {
    const p = Object.fromEntries(
      formatter.formatToParts(new Date(guess)).map((p) => [p.type, p.value]),
    );
    const local = Date.UTC(
      Number(p.year),
      Number(p.month) - 1,
      Number(p.day),
      Number(p.hour),
      Number(p.minute),
      Number(p.second),
    );
    if (local === target) return new Date(guess).toISOString();
    guess += target - local;
  }
  throw new RevOpsError("midnight_cutoff_requires_timezone_review", 400);
}
export function assertOpen(state: RevOpsState, period: string): void {
  if (state.closedPeriods.includes(period))
    throw new RevOpsError("period_closed");
}
export function applyRevOpsCommand(
  state: RevOpsState,
  command: RevOpsCommand,
  actor: AuthenticatedPrincipal,
  source: RevOpsSource,
  at: string,
): boolean {
  if (command.action === "grant" || command.action === "field") {
    if (!isRevOpsAdmin(actor)) throw new RevOpsError("permission_denied", 403);
    if (command.action === "grant")
      state.grants[command.userId] = command.permissions.length
        ? [...new Set(["view" as const, ...command.permissions])]
        : [];
    else
      state.field = {
        ...state.field,
        label: command.label,
        options: command.options,
        archived: command.archived,
        version: state.field.version + 1,
      };
    return true;
  }
  if (command.action === "budget") {
    requirePermission(state, actor, "budgetImport");
    assertOpen(state, command.period);
    if (
      state.field.archived ||
      !state.field.options.includes(command.costCenter)
    )
      throw new RevOpsError("invalid_cost_center", 400);
    const n = daysInPeriod(command.period);
    const targets =
      command.dailyTargets ??
      Array.from({ length: n }, () => command.total / n);
    if (
      targets.length !== n ||
      Math.abs(targets.reduce((a, b) => a + b, 0) - command.total) > 0.000001
    )
      throw new RevOpsError("daily_targets_must_match_month", 400);
    const latest = state.budgets
      .filter((b) => b.period === command.period)
      .at(-1);
    const existing =
      latest &&
      latest.total === command.total &&
      latest.costCenter === command.costCenter &&
      latest.fieldVersion === state.field.version &&
      latest.dailyTargets.every((v, i) => v === targets[i]);
    if (existing) return false;
    if (state.budgets.length >= 240)
      throw new RevOpsError("workspace_budget_limit");
    state.budgets.push({
      id: randomUUID(),
      period: command.period,
      total: command.total,
      dailyTargets: targets,
      costCenter: command.costCenter,
      costCenterLabel: state.field.label,
      fieldVersion: state.field.version,
      status: "draft",
      source,
      createdAt: at,
      createdBy: actor.userId,
    });
    return true;
  }
  if (command.action === "approve") {
    requirePermission(state, actor, "budgetApprove");
    const b = state.budgets.find((b) => b.id === command.budgetId);
    if (!b) throw new RevOpsError("resource_not_found", 404);
    assertOpen(state, b.period);
    if (b.status === "approved") return false;
    b.status = "approved";
    b.approvedAt = at;
    b.approvedBy = actor.userId;
    b.approvalOrder =
      Math.max(0, ...state.budgets.map((b) => b.approvalOrder ?? 0)) + 1;
    return true;
  }
  if (command.action === "actual" || command.action === "correct") {
    requirePermission(
      state,
      actor,
      command.action === "actual" ? "actualEnter" : "actualCorrect",
    );
    assertOpen(state, command.date.slice(0, 7));
    const history = state.actuals[command.date] ?? [];
    const current = history.at(-1);
    if (
      command.action === "actual" &&
      current &&
      current.count !== command.count
    )
      throw new RevOpsError("actual_conflict_requires_correction");
    if (command.action === "correct" && !current)
      throw new RevOpsError("actual_not_found", 404);
    if (current?.count === command.count) return false;
    if (Object.keys(state.actuals).length >= 3660 && !current)
      throw new RevOpsError("workspace_day_limit");
    if (history.length >= 100) throw new RevOpsError("day_revision_limit");
    history.push({
      count: command.count,
      actorId: actor.userId,
      at,
      cutoffInstant: midnightEnding(command.date, state.timezone),
      source,
      ...(command.action === "correct" ? { reason: command.reason } : {}),
    });
    state.actuals[command.date] = history;
    return true;
  }
  requirePermission(
    state,
    actor,
    command.action === "close" ? "periodClose" : "periodReopen",
  );
  const closed = state.closedPeriods.includes(command.period);
  if (command.action === "close" && !closed)
    state.closedPeriods.push(command.period);
  else if (command.action === "reopen" && closed)
    state.closedPeriods = state.closedPeriods.filter(
      (p) => p !== command.period,
    );
  else return false;
  return true;
}

export function compareRevOps(
  state: RevOpsState,
  period: string,
  through: string,
  budgetId?: string,
) {
  if (through.slice(0, 7) !== period)
    throw new RevOpsError("cutoff_period_mismatch", 400);
  const budget = budgetId
    ? state.budgets.find(
        (b) =>
          b.id === budgetId && b.period === period && b.status === "approved",
      )
    : state.budgets
        .filter((b) => b.period === period && b.status === "approved")
        .sort((a, b) => (b.approvalOrder ?? 0) - (a.approvalOrder ?? 0))
        .at(0);
  if (budgetId && !budget)
    throw new RevOpsError("approved_budget_not_found", 404);
  const days = Number(through.slice(8));
  const dates = Array.from(
    { length: days },
    (_, i) => `${period}-${String(i + 1).padStart(2, "0")}`,
  );
  const missing = dates.filter((d) => !state.actuals[d]?.length);
  const knownActuals = dates.reduce(
    (sum, d) => sum + (state.actuals[d]?.at(-1)?.count ?? 0),
    0,
  );
  const phased = budget
    ? budget.dailyTargets.slice(0, days).reduce((a, b) => a + b, 0)
    : null;
  return {
    period,
    through,
    timezone: state.timezone,
    dateConvention: "end-of-day",
    budget: budget ?? null,
    missingDates: missing,
    knownActuals,
    actuals: missing.length ? null : knownActuals,
    fullMonthBudget: budget?.total ?? null,
    phasedTarget: phased,
    fullMonthVariance:
      budget && !missing.length ? knownActuals - budget.total : null,
    phasedVariance:
      phased !== null && !missing.length ? knownActuals - phased : null,
    forecast: null,
    collections: null,
  };
}
