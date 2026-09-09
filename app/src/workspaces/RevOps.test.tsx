import {
  fireEvent,
  render,
  screen,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { RevOps } from "./RevOps";
import type { RevOpsView } from "../../../packages/domain-contracts/src/revOps";
import { apiRevOps } from "../domain/api";

vi.mock("../domain/api", () => ({
  apiLogin: vi.fn(async () => ({
    displayName: "Synthetic admin",
    organizationId: "test-org",
    roles: ["ORGANIZATION_ADMIN"],
  })),
  apiLogout: vi.fn(async () => {}),
  apiRevOps: vi.fn(),
}));
const workspace = (id: string, label: string): RevOpsView => ({
  id,
  name: id,
  revision: 1,
  isAdmin: true,
  permissions: ["view", "actualEnter", "budgetImport"],
  state: {
    unit: "Adult",
    timezone: "America/Chicago",
    field: {
      id: "cost-center",
      label,
      options: ["Inpatient"],
      archived: false,
      version: 1,
    },
    grants: {},
    budgets: [],
    actuals: {},
    closedPeriods: [],
    acceptedImports: [],
  },
});
const rows = [
  workspace("Hospital A", "Cost center A"),
  workspace("Hospital B", "Cost center B"),
];
beforeEach(() => {
  vi.mocked(apiRevOps).mockImplementation(async (path) => {
    if (path === "/workspaces") return structuredClone(rows);
    if (path === "/members") return [];
    if (path.includes("/operating-workbook")) return { revision: 1, workbook: null, summary: null, history: [], closings: [] };
    if (path.includes("/history"))
      return [
        {
          id: path,
          revision: 1,
          actorId: path.includes("Hospital B") ? "operator-b" : "operator-a",
          action: "setup",
          occurredAt: "2028-02-01",
          details: {},
        },
      ];
    if (path.includes("/comparison")) {
      if (path.includes("through=2028-03"))
        throw new Error("cutoff_period_mismatch");
      return {
        actuals: 0,
        knownActuals: 0,
        fullMonthBudget: null,
        phasedTarget: null,
        fullMonthVariance: null,
        phasedVariance: null,
        missingDates: [],
        budget: null,
      };
    }
    if (path.includes("/import"))
      return { headers: [], commands: [], issues: [], replayed: false };
    return {};
  });
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
async function login() {
  render(<RevOps />);
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  fireEvent.click(await screen.findByRole("button", { name: "Comparison" }));
  await screen.findByText("Actual patient days through cutoff");
}

it("opens working operations after sign-in and provides rate tools", async () => {
  render(<RevOps />);
  expect(
    screen.getByText("DUNDER MIFFLIN HOSPITAL · RESTORED OPERATIONS 2026"),
  ).toBeInTheDocument();
  expect(apiRevOps).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  expect(await screen.findByRole("button", { name: "Operations" })).toHaveAttribute("aria-current", "page");
  await waitFor(() => expect(vi.mocked(apiRevOps).mock.calls.some(([path]) => path.includes("/operating-workbook"))).toBe(true));
  fireEvent.click(screen.getByRole("button", { name: "Rates" }));
  expect(await screen.findByRole("heading", { name: "Payment scenarios" })).toBeVisible();
});

it("opens the accepted 2026 reporting year and retains access to other years", async () => {
  await login();
  expect(screen.getByLabelText("Month", { exact: true })).toHaveValue("2026-01");
  expect(screen.getByLabelText("Through date")).toHaveValue("2026-01-07");
  fireEvent.change(screen.getByLabelText("Month", { exact: true }), { target: { value: "2028-02" } });
  expect(screen.getByLabelText("Through date")).toHaveValue("2028-02-01");
  await waitFor(() => expect(vi.mocked(apiRevOps).mock.calls.some(([path]) =>
    path.includes("period=2028-02&through=2028-02-01"))).toBe(true));
});

it("resets unsaved actuals and field defaults when switching hospitals", async () => {
  await login();
  fireEvent.click(screen.getByRole("button", { name: "Daily actuals" }));
  fireEvent.change(screen.getByLabelText("Patient days", { exact: true }), {
    target: { value: "23" },
  });
  fireEvent.change(screen.getByLabelText("Hospital / unit"), {
    target: { value: "Hospital B" },
  });
  expect(screen.getByLabelText("Patient days", { exact: true })).toHaveValue(
    null,
  );
  fireEvent.click(screen.getByRole("button", { name: "Setup & access" }));
  expect(screen.getByLabelText("Field label", { exact: true })).toHaveValue(
    "Cost center B",
  );
  fireEvent.change(screen.getByLabelText("Hospital / unit"), {
    target: { value: "Hospital A" },
  });
  await waitFor(() =>
    expect(screen.getByLabelText("Field label", { exact: true })).toHaveValue(
      "Cost center A",
    ),
  );
});

it("discards the previous upload when a replacement file is rejected", async () => {
  await login();
  fireEvent.click(screen.getByRole("button", { name: "Upload" }));
  const file = new File(
    ["activity_date,patient_days\n2028-02-01,9"],
    "valid.csv",
  );
  Object.defineProperty(file, "arrayBuffer", {
    value: async () =>
      new TextEncoder().encode("activity_date,patient_days\n2028-02-01,9")
        .buffer,
  });
  fireEvent.change(screen.getByLabelText("File", { exact: true }), {
    target: { files: [file] },
  });
  await screen.findByRole("button", { name: "Preview import" });
  fireEvent.change(screen.getByLabelText("File", { exact: true }), {
    target: {
      files: [new File([new Uint8Array(1024 * 1024 + 1)], "large.csv")],
    },
  });
  await waitFor(() =>
    expect(
      screen.queryByRole("button", { name: "Preview import" }),
    ).not.toBeInTheDocument(),
  );
});

it("loads the selected hospital history even when comparison dates are invalid", async () => {
  await login();
  fireEvent.click(screen.getByRole("button", { name: "History" }));
  await screen.findByText(/operator-a/);
  fireEvent.change(screen.getByLabelText("Through date"), {
    target: { value: "2028-03-01" },
  });
  fireEvent.change(screen.getByLabelText("Hospital / unit"), {
    target: { value: "Hospital B" },
  });
  await screen.findByText(/operator-b/);
  expect(screen.queryByText(/operator-a/)).not.toBeInTheDocument();
});

it("confirms an import with its preview revision even after a refresh", async () => {
  let revision = 1;
  const original = vi.mocked(apiRevOps).getMockImplementation()!;
  vi.mocked(apiRevOps).mockImplementation(async (path, body) => {
    if (path === "/workspaces")
      return [{ ...structuredClone(rows[0]!), revision }];
    if (path.includes("/import"))
      return {
        revision: 1,
        headers: ["activity_date", "patient_days"],
        commands: [],
        issues: [],
        replayed: false,
      };
    return original(path, body);
  });
  await login();
  fireEvent.click(screen.getByRole("button", { name: "Upload" }));
  const file = new File(
    ["activity_date,patient_days\n2028-02-01,9"],
    "preview.csv",
  );
  Object.defineProperty(file, "arrayBuffer", {
    value: async () =>
      new TextEncoder().encode("activity_date,patient_days\n2028-02-01,9")
        .buffer,
  });
  fireEvent.change(screen.getByLabelText("File", { exact: true }), {
    target: { files: [file] },
  });
  fireEvent.click(
    await screen.findByRole("button", { name: "Preview import" }),
  );
  await screen.findByRole("button", { name: "Confirm import" });
  revision = 2;
  fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
  await screen.findByText("Refreshed from server.");
  fireEvent.click(screen.getByRole("button", { name: "Confirm import" }));
  await waitFor(() =>
    expect(
      vi
        .mocked(apiRevOps)
        .mock.calls.some(
          ([path, body]) =>
            path.endsWith("/import") &&
            (body as { commit?: boolean; revision?: number })?.commit &&
            (body as { revision: number }).revision === 1,
        ),
    ).toBe(true),
  );
});

it("removes the previous close review while a newly selected budget is loading", async () => {
  const fallback = vi.mocked(apiRevOps).getMockImplementation()!;
  const w = workspace("Hospital A", "Cost center A");
  w.permissions.push("periodClose");
  const budget = {
    id: "approved-a",
    period: "2028-02",
    total: 290,
    dailyTargets: Array(29).fill(10),
    costCenter: "Inpatient",
    costCenterLabel: "Cost center",
    fieldVersion: 1,
    status: "approved" as const,
    source: { kind: "manual" as const, name: "Synthetic" },
    createdBy: "admin",
    createdAt: "2028-01-01",
  };
  w.state.budgets = [budget, { ...budget, id: "approved-b", total: 300 }];
  vi.mocked(apiRevOps).mockImplementation(async (path, body) => {
    if (path === "/workspaces") return [w];
    if (path.includes("/comparison")) {
      if (path.includes("budgetId=")) return new Promise(() => {});
      return {
        actuals: 280,
        knownActuals: 280,
        fullMonthBudget: 290,
        phasedTarget: 70,
        fullMonthVariance: -10,
        phasedVariance: 210,
        missingDates: [],
        budget,
        revision: 1,
        closeReadiness: {
          period: "2028-02",
          through: "2028-02-29",
          expectedDays: 29,
          recordedDays: 29,
          missingDates: [],
          knownActuals: 280,
          actuals: 280,
          budget,
          variance: -10,
          ready: true,
          closed: false,
        },
        closingReceipt: null,
      };
    }
    return fallback(path, body);
  });
  await login();
  fireEvent.change(screen.getByLabelText("Month", { exact: true }), { target: { value: "2028-02" } });
  await screen.findByLabelText("Reason to close period");
  fireEvent.change(screen.getByLabelText("Reason to close period"), {
    target: { value: "Reviewed first budget" },
  });
  expect(screen.getByRole("button", { name: "Close period" })).toBeEnabled();
  fireEvent.change(screen.getByLabelText("Approved baseline"), {
    target: { value: "approved-b" },
  });
  expect(
    screen.queryByRole("button", { name: "Close period" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByLabelText("Reason to close period"),
  ).not.toBeInTheDocument();
});
