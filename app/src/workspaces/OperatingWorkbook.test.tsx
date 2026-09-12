import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { WorkbookOperations } from "./OperatingWorkbook";
import { apiRevOps } from "../domain/api";
import type { OperatingWorkbook, OperatingWorkbookSummary } from "../../../packages/domain-contracts/src/operatingWorkbook";

vi.mock("../domain/api", () => ({ apiRevOps: vi.fn() }));
const source: OperatingWorkbook["source"] = { name: "Dunder Mifflin Hospital - Restored Operations 2026.xlsx", sha256: "accepted-source-hash", year: 2026, importedAt: "2026-09-09T12:00:00Z" };
const workbook: OperatingWorkbook = {
  schemaVersion: 1,
  source,
  tables: [{
    key: "encounters", title: "Encounter register", sheet: "ENCOUNTERS", dateKey: "admissionDate",
    columns: [
      { key: "patient", label: "Patient", type: "text", editable: true, required: true },
      { key: "admissionDate", label: "Admission date", type: "date", editable: true },
      { key: "units", label: "Units", type: "number", editable: true },
      { key: "derived", label: "Derived value", type: "number", editable: false, snapshot: true },
    ],
    rows: Array.from({ length: 27 }, (_, index) => ({ id: `enc-${index}`, sourceRow: index + 5, values: { patient: index === 0 ? "Michael Scott" : `Patient ${index}`, admissionDate: index < 26 ? "2026-01-03" : "2026-02-04", units: 10, derived: 30 }, formulaKeys: index === 1 ? ["units"] : [] })),
  }],
};
const summary: OperatingWorkbookSummary = {
  period: "2026", months: [], comparisons: [], issues: [],
  metrics: { days: 365, admissions: 27, discharges: 0, ipPatientDays: 270, adc: 0.74, occupancy: 0.2, alos: null, completedLosSum: 0, iopPatientDays: 0, iopScheduled: 0, iopNoShows: 0, iopCancelled: 0, iopAttendanceRate: null, iopEnrolledAvg: 0, iopPendingAvg: 0, groupUnits: 0, sessions: 0, servicesDelivered: 27, nonGroupServices: 0, mealsPayable: 0, staffHours: 0, ipStaffHours: 0, iopStaffHours: 0, laborCost: 0, ancillaryExpense: 0, cashReceived: 200, allocatedReceipts: 100, modeledRevenue: 1000, ipRevenue: 1000, iopRevenue: 0, revenueBudget: 900, forecastRevenue: 1200, modeledOutstanding: 900, revenueVariance: 100, revenueVariancePct: 0.11, phasedRevenueBudget: 900, phasedRevenueVariance: 100, laborBudget: 0, staffBudgetHours: 0, hoursVariance: 0, laborVariance: 0, agencyHours: 0, agencyCost: 0, oneToOneHours: 0, oneToOneCost: 0, trainingHours: 0, ptoHours: 0, ipHppd: null, lease: 0, invoiceBalance: 0 },
};
const fixture = () => ({ revision: 4, workbook: structuredClone(workbook), summary: structuredClone(summary), history: [], closings: [] });

beforeEach(() => { vi.mocked(apiRevOps).mockResolvedValue(fixture()); });
afterEach(() => { cleanup(); vi.resetAllMocks(); });
async function openInpatient() {
  await screen.findByRole("button", { name: "Inpatient" });
  fireEvent.click(screen.getByRole("button", { name: "Inpatient" }));
}

it("shows distinct operating, modeled-value, and cash metrics and filters source records by month", async () => {
  render(<WorkbookOperations workspaceId="hospital-a" canEdit />);
  await screen.findByText("Modeled service value", { selector: "dt" });
  expect(screen.getByText("$1,000")).toBeInTheDocument();
  expect(screen.getByText("Cash received", { selector: "dt" })).toBeInTheDocument();
  expect(screen.getByText("$200")).toBeInTheDocument();
  expect(screen.getByText("20%")).toBeInTheDocument();
  await openInpatient();
  expect(screen.getByText("27 records", { selector: ".ow-record-count" })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Reporting period"), { target: { value: "2026-02" } });
  await waitFor(() => expect(apiRevOps).toHaveBeenCalledWith("/workspaces/hospital-a/operating-workbook?period=2026-02"));
  expect(screen.getByText("1 record", { selector: ".ow-record-count" })).toBeInTheDocument();
  expect(await screen.findByRole("button", { name: "Edit Patient, row 31" })).toBeInTheDocument();
  expect(screen.queryByText("Michael Scott")).not.toBeInTheDocument();
});

it("paginates and searches the full year, while formula cells remain read-only", async () => {
  render(<WorkbookOperations workspaceId="hospital-a" canEdit />);
  await openInpatient();
  expect(screen.queryByRole("button", { name: "Edit Derived value, row 5" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Edit Units, row 6" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Edit Units, row 5" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByText("26–27 of 27")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Search records"), { target: { value: "michael" } });
  expect(screen.getByText("Michael Scott")).toBeInTheDocument();
  expect(screen.getByText("Page 1 / 1")).toBeInTheDocument();
});

it("requires a correction reason and submits typed value with current revision before refreshing", async () => {
  const onSaved = vi.fn();
  render(<WorkbookOperations workspaceId="hospital-a" canEdit onSaved={onSaved} />);
  await openInpatient();
  fireEvent.click(screen.getByRole("button", { name: "Edit Units, row 5" }));
  const dialog = screen.getByRole("dialog");
  expect(within(dialog).getByLabelText("Units")).toHaveFocus();
  fireEvent.change(within(dialog).getByLabelText("Units"), { target: { value: "11" } });
  expect(within(dialog).getByRole("button", { name: "Save correction" })).toBeDisabled();
  fireEvent.change(within(dialog).getByLabelText("Reason for correction"), { target: { value: "Reviewed source correction" } });
  const changed = fixture();
  changed.revision = 5;
  changed.workbook.tables[0].rows[0].values.units = 11;
  vi.mocked(apiRevOps).mockResolvedValueOnce(changed);
  fireEvent.click(within(dialog).getByRole("button", { name: "Save correction" }));
  await screen.findByText("Correction saved. The operating summary has been recalculated.");
  expect(apiRevOps).toHaveBeenLastCalledWith("/workspaces/hospital-a/operating-workbook/edit", { revision: 4, tableKey: "encounters", rowId: "enc-0", columnKey: "units", value: 11, reason: "Reviewed source correction", period: "2026" });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Edit Units, row 5" })).toHaveTextContent("11");
  expect(onSaved).toHaveBeenCalledOnce();
});

it("keeps conflicting edits in the dialog with the server error and does not claim success", async () => {
  render(<WorkbookOperations workspaceId="hospital-a" canEdit />);
  await openInpatient();
  fireEvent.click(screen.getByRole("button", { name: "Edit Units, row 5" }));
  fireEvent.change(screen.getByLabelText("Units", { exact: true }), { target: { value: "12" } });
  fireEvent.change(screen.getByLabelText("Reason for correction"), { target: { value: "Correct source" } });
  vi.mocked(apiRevOps).mockRejectedValueOnce(new Error("version_conflict_refresh_required"));
  fireEvent.click(screen.getByRole("button", { name: "Save correction" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("This workbook changed after you opened it.");
  expect(screen.getByRole("alert")).toHaveTextContent("refresh the workbook and retry");
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.queryByText("Correction saved. The operating summary has been recalculated.")).not.toBeInTheDocument();
});

it("loads the accepted sample into an empty authorized workspace without overwriting existing data", async () => {
  vi.mocked(apiRevOps).mockResolvedValueOnce({ revision: 0, workbook: null, history: [], closings: [] });
  render(<WorkbookOperations workspaceId="hospital-a" canEdit />);
  fireEvent.click(await screen.findByRole("button", { name: "Load accepted workbook" }));
  await screen.findByText("Accepted 2026 synthetic workbook loaded.");
  expect(apiRevOps).toHaveBeenLastCalledWith("/workspaces/hospital-a/operating-workbook", { action: "loadSample", period: "2026" });
  expect(screen.queryByRole("button", { name: "Load accepted workbook" })).not.toBeInTheDocument();
});

it("provides read-only records without mutation controls for viewers", async () => {
  render(<WorkbookOperations workspaceId="hospital-a" canEdit={false} />);
  await openInpatient();
  expect(screen.getByText("Michael Scott")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Edit Patient/ })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Save report snapshot" })).not.toBeInTheDocument();
});

it("saves report snapshots with a review note and no period-close claim", async () => {
  render(<WorkbookOperations workspaceId="hospital-a" canEdit />);
  fireEvent.click(await screen.findByRole("button", { name: "Save report snapshot" }));
  fireEvent.change(screen.getByLabelText("Snapshot review note"), { target: { value: "Reviewed annual operating totals" } });
  fireEvent.click(screen.getByRole("button", { name: "Save snapshot" }));
  await screen.findByText("Report snapshot saved with source and data provenance.");
  expect(apiRevOps).toHaveBeenLastCalledWith("/workspaces/hospital-a/operating-workbook/snapshot", { revision: 4, reason: "Reviewed annual operating totals", period: "2026" });
  fireEvent.click(screen.getByRole("button", { name: "History" }));
  expect(screen.getByText(/does not close or lock/)).toBeInTheDocument();
});

it("ignores an old workspace response after switching hospitals", async () => {
  let completeOld!: (value: unknown) => void;
  vi.mocked(apiRevOps).mockImplementationOnce(() => new Promise((resolve) => { completeOld = resolve; }));
  const { rerender } = render(<WorkbookOperations workspaceId="hospital-a" canEdit />);
  vi.mocked(apiRevOps).mockResolvedValueOnce({ revision: 0, workbook: null, history: [], closings: [] });
  rerender(<WorkbookOperations workspaceId="hospital-b" canEdit />);
  await screen.findByRole("button", { name: "Load accepted workbook" });
  completeOld(fixture());
  await waitFor(() => expect(screen.getByRole("button", { name: "Load accepted workbook" })).toBeInTheDocument());
  expect(screen.queryByText("27 records")).not.toBeInTheDocument();
});

it("labels immutable workbook reports clearly and filters month-number tables for snapshots and budgets", async () => {
  const view = fixture();
  const monthlyRows = Array.from({ length: 12 }, (_, index) => ({ id: `month-${index + 1}`, sourceRow: index + 5, values: { month: index + 1, revenueBudget: (index + 1) * 1000 } }));
  const columns = [{ key: "month", label: "Month number", type: "number" as const, editable: false }, { key: "revenueBudget", label: "Revenue budget input", type: "number" as const, editable: true }];
  view.workbook.tables.push({ key: "monthlySnapshot", title: "Monthly reference report", sheet: "MONTHLY", snapshot: true, columns, rows: monthlyRows });
  view.workbook.tables.push({ key: "budget", title: "Monthly budget", sheet: "BUDGET", columns, rows: monthlyRows });
  vi.mocked(apiRevOps).mockResolvedValue(view);
  render(<WorkbookOperations workspaceId="hospital-a" canEdit />);
  await screen.findByText("Accepted workbook snapshot · does not recalculate after corrections");
  expect(screen.queryByText(/Select an input value to correct it/)).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Edit Revenue budget input, row 5" })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Reporting period"), { target: { value: "2026-02" } });
  await waitFor(() => expect(screen.getByText("1 record", { selector: ".ow-record-count" })).toBeVisible());
  expect(screen.getByText("2,000", { selector: ".ow-value" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Budget & forecast" }));
  expect(screen.getByText("1 record", { selector: ".ow-record-count" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Edit Revenue budget input, row 6" })).toHaveTextContent("2,000");
  expect(screen.queryByRole("button", { name: "Edit Revenue budget input, row 5" })).not.toBeInTheDocument();
  expect(screen.getByText(/formula reference cells stay fixed/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Reporting period"), { target: { value: "2026" } });
  await waitFor(() => expect(screen.getByText("12 records", { selector: ".ow-record-count" })).toBeVisible());
});

it("adds a payer with all required business fields and shows its saved platform record", async () => {
  const view = fixture();
  const fields = ["payerId", "payerAdministrator", "planProduct", "lineOfBusiness", "network", "funding", "active"];
  view.workbook.tables.push({ key: "payers", title: "Payer registry", sheet: "PAYERS", columns: [...fields.map((key) => ({ key, label: key, type: "text" as const, editable: key !== "payerId" })), { key: "state", label: "Derived state", type: "text", editable: false, snapshot: true }], rows: [] });
  vi.mocked(apiRevOps).mockResolvedValue(view);
  const onSaved = vi.fn();
  render(<WorkbookOperations workspaceId="hospital-a" canEdit onSaved={onSaved} />);
  fireEvent.click(await screen.findByRole("button", { name: "Payers & services" }));
  fireEvent.click(screen.getByRole("button", { name: "Add record" }));
  const dialog = screen.getByRole("dialog");
  expect(within(dialog).queryByLabelText("Derived state")).not.toBeInTheDocument();
  fireEvent.change(within(dialog).getByLabelText(/^payerId/), { target: { value: "SYN-NEW-PLAN" } });
  fireEvent.change(within(dialog).getByLabelText("Reason for new record"), { target: { value: "Add synthetic commercial plan" } });
  expect(within(dialog).getByRole("button", { name: "Add record" })).toBeDisabled();
  const values = { payerId: "SYN-NEW-PLAN", payerAdministrator: "Test administrator", planProduct: "Example PPO", lineOfBusiness: "Commercial", network: "PPO", funding: "Fully insured", active: "YES" };
  for (const [key, value] of Object.entries(values)) fireEvent.change(within(dialog).getByLabelText(new RegExp(`^${key}`)), { target: { value } });
  const saved = structuredClone(view);
  saved.revision = 5;
  saved.workbook.tables.find((table) => table.key === "payers")!.rows.push({ id: "platform:payers:SYN-NEW-PLAN", sourceRow: 0, values });
  vi.mocked(apiRevOps).mockResolvedValueOnce(saved);
  fireEvent.click(within(dialog).getByRole("button", { name: "Add record" }));
  await screen.findByText("Platform record added with source history.");
  expect(apiRevOps).toHaveBeenLastCalledWith("/workspaces/hospital-a/operating-workbook/append", { revision: 4, period: "2026", tableKey: "payers", values, reason: "Add synthetic commercial plan" });
  expect(screen.getByText("Platform", { selector: "th" })).toBeInTheDocument();
  expect(screen.getByText("SYN-NEW-PLAN", { selector: ".ow-value" })).toBeInTheDocument();
  await waitFor(() => expect(screen.getByLabelText("Search records")).toHaveValue("SYN-NEW-PLAN"));
  expect(onSaved).toHaveBeenCalledOnce();
});

it("requires contract provenance and sends the entered rate as a number without computed fields", async () => {
  const view = fixture();
  const fields = ["rateId", "payerId", "serviceId", "method", "rateValue", "effectiveFrom", "effectiveTo", "status", "evidence", "reviewer", "version", "pricingBasis", "scope"];
  view.workbook.tables.push({ key: "contractRates", title: "Contract registry", sheet: "CONTRACT_RATES", columns: [...fields.map((key) => ({ key, label: key, type: key === "rateValue" ? "number" as const : key === "effectiveFrom" || key === "effectiveTo" ? "date" as const : "text" as const, editable: key !== "rateId", ...(key === "method" ? { options: ["PER UNIT", "PCT CHARGES"] } : {}) })), { key: "overlapCount", label: "Overlap count", type: "number", editable: false, snapshot: true }], rows: [] });
  vi.mocked(apiRevOps).mockResolvedValue(view);
  render(<WorkbookOperations workspaceId="hospital-a" canEdit />);
  fireEvent.click(await screen.findByRole("button", { name: "Payers & services" }));
  fireEvent.click(screen.getByRole("button", { name: "Add record" }));
  const dialog = screen.getByRole("dialog");
  const values = { rateId: "SYN-NEW-RATE", payerId: "SYN-NEW-PLAN", serviceId: "IP", method: "PCT CHARGES", rateValue: "0.6", effectiveFrom: "2027-01-01", effectiveTo: "2027-12-31", status: "DRAFT", evidence: "Synthetic contract example", reviewer: "Test reviewer", version: "1", pricingBasis: "DISCHARGE", scope: "Synthetic scenario" };
  for (const [key, value] of Object.entries(values)) fireEvent.change(within(dialog).getByLabelText(new RegExp(`^${key}`)), { target: { value } });
  expect(within(dialog).queryByLabelText("Overlap count")).not.toBeInTheDocument();
  expect(within(dialog).getByRole("button", { name: "Add record" })).toBeDisabled();
  fireEvent.change(within(dialog).getByLabelText("Reason for new record"), { target: { value: "Extend planning contract" } });
  vi.mocked(apiRevOps).mockRejectedValueOnce(new Error("invalid_registry_record"));
  fireEvent.click(within(dialog).getByRole("button", { name: "Add record" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Percentage rates use a fraction from 0 to 1");
  expect(screen.getByRole("alert")).toHaveTextContent("without overlapping an existing rate");
  expect(within(dialog).getByLabelText(/^rateValue/)).toHaveValue(0.6);
  fireEvent.click(within(dialog).getByRole("button", { name: "Add record" }));
  await screen.findByText("Platform record added with source history.");
  expect(apiRevOps).toHaveBeenLastCalledWith("/workspaces/hospital-a/operating-workbook/append", { revision: 4, period: "2026", tableKey: "contractRates", values: { ...values, rateValue: 0.6 }, reason: "Extend planning contract" });
});
