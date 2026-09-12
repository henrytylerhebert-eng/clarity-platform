import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { OperatingWorkbook, WorkbookCell } from "../../packages/domain-contracts/src/operatingWorkbook.js";
import { applyWorkbookAppend, applyWorkbookEdit, summarizeOperatingWorkbook } from "../../packages/rev-ops-service/src/operatingWorkbook.js";

const workbook = JSON.parse(readFileSync(new URL("../../data/synthetic-revops/dunder-mifflin-2026.json", import.meta.url), "utf8")) as OperatingWorkbook;
const table = (key: string) => workbook.tables.find(t => t.key === key)!;
const edit = (tableKey: string, rowIndex: number, columnKey: string, value: WorkbookCell, source = workbook) => applyWorkbookEdit(source, {
  tableKey, rowId: table(tableKey).rows[rowIndex]!.id, columnKey, value, reason: "Synthetic acceptance test correction",
});

describe("accepted Dunder Mifflin operating workbook", () => {
  it("imports accepted source provenance and actual synthetic records, preserving formula snapshots", () => {
    expect(workbook.source.sha256).toBe("6e81bd61950c244e607ed03f8b0f13e1a4d0bea366ee7ad7cc54c053ef90de26");
    expect(table("encounters").rows).toHaveLength(325);
    expect(table("iopVisits").rows).toHaveLength(3238);
    expect(table("serviceLedger").rows).toHaveLength(7238);
    expect(table("inpatient").rows).toHaveLength(365);
    expect(table("encounters").rows[0]!.formulaKeys).toContain("2026PatientDays");
  });

  it.each(Array.from({ length: 12 }, (_, i) => `2026-${String(i + 1).padStart(2, "0")}`).concat("2026"))(
    "independently reproduces every implemented original monthly comparison in %s", (period) => {
      const summary = summarizeOperatingWorkbook(workbook, period);
      expect(summary.issues).toEqual([]);
      expect(summary.comparisons).toHaveLength(47);
      expect(summary.comparisons.filter(c => c.status !== "match")).toEqual([]);
    },
  );

  it("keeps annual denominators weighted and cash, budgets, forecast, earned model separate", () => {
    const { metrics, months } = summarizeOperatingWorkbook(workbook, "2026");
    expect(metrics).toMatchObject({ admissions: 312, discharges: 312, ipPatientDays: 4392, iopPatientDays: 2846, sessions: 783, groupUnits: 6956, servicesDelivered: 9802, staffHours: 38580, laborCost: 1070356, cashReceived: 4381784.17, modeledRevenue: 5149422.62, forecastRevenue: 6033470, revenueBudget: 5914825 });
    expect(metrics.adc).toBeCloseTo(4392 / 365);
    expect(metrics.occupancy).toBeCloseTo(4392 / (365 * 20));
    expect(months[0]!.cashReceived).toBe(0);
    expect(months[0]!.allocatedReceipts).toBeGreaterThan(400000);
  });

  it("recalculates staffing and labor after an edit while retaining original formula caches", () => {
    const before = summarizeOperatingWorkbook(workbook, "2026-01");
    const updated = edit("staffDetail", 0, "productiveHours", 25);
    const after = summarizeOperatingWorkbook(updated, "2026-01");
    expect(after.metrics.staffHours).toBe(before.metrics.staffHours + 1);
    expect(after.metrics.laborCost).toBe(before.metrics.laborCost! + 42);
    expect(after.comparisons.find(c => c.metric === "laborCost")!.status).toBe("changed");
    expect(table("staffDetail").rows[0]!.values.productiveHours).toBe(24);
    expect(updated.tables.find(t => t.key === "staffDetail")!.rows[0]!.values.totalCost).toBe(table("staffDetail").rows[0]!.values.totalCost);
  });

  it("preserves unknown blank budget separately from explicit zero", () => {
    const missing = summarizeOperatingWorkbook(edit("budget", 0, "revenueBudget", null), "2026-01");
    const zero = summarizeOperatingWorkbook(edit("budget", 0, "revenueBudget", 0), "2026-01");
    expect(missing.metrics.revenueBudget).toBeNull();
    expect(missing.metrics.revenueVariance).toBeNull();
    expect(missing.issues.some(i => i.code === "MISSING_BUDGET")).toBe(true);
    expect(zero.metrics.revenueBudget).toBe(81375);
  });

  it("uses discharge-date rate changes across service months and leaves receipt cash unchanged", () => {
    const baseline = summarizeOperatingWorkbook(workbook, "2026");
    const firstRate = table("contractRates").rows[0]!;
    const updated = edit("contractRates", 0, "rateValue", Number(firstRate.values.rateValue) + 1);
    const after = summarizeOperatingWorkbook(updated, "2026");
    expect(after.metrics.modeledRevenue).toBeGreaterThan(baseline.metrics.modeledRevenue!);
    expect(after.metrics.cashReceived).toBe(baseline.metrics.cashReceived);
    expect(after.metrics.forecastRevenue).toBe(baseline.metrics.forecastRevenue);
  });

  it("recalculates census and census-driven expenses and surfaces stale service reconciliation", () => {
    const before = summarizeOperatingWorkbook(workbook, "2026-01");
    const after = summarizeOperatingWorkbook(edit("encounters", 0, "dischargeDate", "2026-01-18"), "2026-01");
    expect(after.metrics.ipPatientDays).toBe(before.metrics.ipPatientDays + 1);
    expect(after.metrics.ancillaryExpense).toBeGreaterThan(before.metrics.ancillaryExpense!);
    expect(after.issues.some(i => i.code === "SERVICE_DAYS_DIFFER")).toBe(true);
    expect(after.issues.some(i => i.code === "CENSUS_RECONCILIATION")).toBe(true);
  });

  it("excludes cancellation from attendance denominator and does not count unscheduled people absent", () => {
    const before = summarizeOperatingWorkbook(workbook, "2026-01").metrics;
    const after = summarizeOperatingWorkbook(edit("iopVisits", 0, "attendance", "CANCELLED"), "2026-01").metrics;
    expect(after.iopPatientDays).toBe(before.iopPatientDays);
    expect(after.iopNoShows).toBe(before.iopNoShows - 1);
    expect(after.iopCancelled).toBe(1);
    expect(after.iopAttendanceRate).toBeCloseTo(after.iopPatientDays / (after.iopScheduled - 1));
  });

  it("requires a complete reviewed payer mix before it contributes forecast revenue", () => {
    const switched = edit("forecast", 0, "rateMethod", "PAYER MIX");
    expect(summarizeOperatingWorkbook(switched, "2026-01").metrics.forecastRevenue).toBe(502030);
    const invalid = edit("forecastMix", 0, "share", 0, switched);
    expect(summarizeOperatingWorkbook(invalid, "2026-01").metrics.forecastRevenue).toBeNull();
    expect(summarizeOperatingWorkbook(invalid, "2026-01").issues.some(i => i.code === "FORECAST_ASSUMPTIONS_MISSING")).toBe(true);
  });

  it("rejects unknown keys, formula, identity and receipt-history mutations", () => {
    expect(() => applyWorkbookEdit(workbook, { tableKey: "missing", rowId: "x", columnKey: "x", value: 1, reason: "test" })).toThrow("Unknown");
    expect(() => edit("encounters", 0, "encounterId", "duplicate")).toThrow("read-only");
    expect(() => edit("staffDetail", 0, "totalCost", 0)).toThrow("read-only");
    expect(() => edit("ancillary", 0, "quantity", 0)).toThrow("read-only");
    expect(() => edit("collections", 0, "signedAmount", 0)).toThrow("read-only");
    expect(() => edit("receiptAllocations", 0, "amount", 0)).toThrow("read-only");
  });

  it("rejects invalid dates, negative inputs, unknown joins and impossible hour subsets", () => {
    expect(() => edit("encounters", 0, "dischargeDate", "2026-02-30")).toThrow("valid date");
    expect(() => edit("encounters", 0, "dischargeDate", "2025-12-29")).toThrow("precede");
    expect(() => edit("encounters", 0, "payerId", "UNKNOWN")).toThrow("Unknown payerId");
    expect(() => edit("encounters", 0, "patientId", "")).toThrow("blank");
    expect(() => edit("staffDetail", 0, "productiveHours", -1)).toThrow("nonnegative");
    expect(() => edit("staffDetail", 0, "agencyHours", 25)).toThrow("subsets");
    expect(() => edit("staffDetail", 0, "productiveHours", Number.NaN)).toThrow("finite");
  });

  it("rejects duplicate staffing, patient dates, service units and overlapping rates", () => {
    expect(() => edit("staffDetail", 0, "date", "2026-01-02")).toThrow("Duplicate");
    expect(() => edit("serviceLedger", 1, "serviceDate", "2026-01-01")).toThrow("Duplicate");
    const first = table("iopVisits").rows[0]!;
    const duplicate = table("iopVisits").rows.find(r => r.values.patientId === first.values.patientId && r.values.serviceDate !== first.values.serviceDate)!;
    expect(() => edit("iopVisits", 0, "serviceDate", duplicate.values.serviceDate!)).toThrow("Duplicate");
    expect(() => edit("contractRates", 0, "effectiveTo", "2026-10-01")).toThrow("overlap");
  });

  it("propagates missing invoice-eligible expense through the invoice balance", () => {
    const before = summarizeOperatingWorkbook(workbook, "2026-01").metrics;
    const missing = summarizeOperatingWorkbook(edit("ancillary", 0, "unitCost", null), "2026-01");
    expect(missing.metrics.ancillaryExpense).toBeNull();
    expect(missing.metrics.invoiceBalance).toBeNull();
    expect(missing.issues.some(i => i.code === "MISSING_ANCILLARY_INPUT")).toBe(true);
    const zero = summarizeOperatingWorkbook(edit("ancillary", 0, "unitCost", 0), "2026-01").metrics;
    expect(zero.ancillaryExpense).toBeCloseTo(before.ancillaryExpense! - 6789.5);
    expect(zero.invoiceBalance).toBeCloseTo(before.invoiceBalance! - 6789.5);
  });

  it("requires explicit operational numbers so blank hours and counts never become zero", () => {
    expect(() => edit("staffDetail", 0, "productiveHours", null)).toThrow();
    expect(() => edit("staffDetail", 0, "agencyHours", null)).toThrow();
    expect(() => edit("iopVisits", 0, "groupServices", null)).toThrow();
    expect(() => edit("iopSessions", 0, "countSession", null)).toThrow();
    const zero = summarizeOperatingWorkbook(edit("staffDetail", 0, "productiveHours", 0), "2026-01");
    expect(zero.metrics.staffHours).toBe(3228 - 24);
  });

  it("invalidates affected monthly financial totals when coverage or its review evidence is incomplete", () => {
    const missingPayer = summarizeOperatingWorkbook(edit("coverage", 2, "status", "MISSING"), "2026-01");
    expect(missingPayer.metrics.modeledRevenue).toBeNull();
    expect(missingPayer.metrics.revenueVariance).toBeNull();
    expect(missingPayer.issues.some(i => i.code === "INCOMPLETE_FEED" && i.message.includes("2026-01 PAYER"))).toBe(true);
    expect(missingPayer.months[1]!.modeledRevenue).toBe(367345.36);
    const missingCash = summarizeOperatingWorkbook(edit("coverage", 4, "status", "MISSING"), "2026-01");
    expect(missingCash.metrics.cashReceived).toBeNull();
    expect(missingCash.metrics.allocatedReceipts).toBeNull();
    expect(missingCash.metrics.modeledOutstanding).toBeNull();
    const noReview = summarizeOperatingWorkbook(edit("coverage", 3, "reviewer", ""), "2026-01");
    expect(noReview.metrics.laborCost).toBeNull();
    expect(noReview.comparisons.find(c => c.metric === "staffHours")!.status).toBe("unavailable");
  });

  it("requires percentage-of-charges rates to be entered as fractions", () => {
    const rateIndex = table("contractRates").rows.findIndex(r => r.values.method === "PCT CHARGES");
    expect(() => edit("contractRates", rateIndex, "rateValue", 55)).toThrow("fraction from 0 to 1");
    expect(() => edit("contractRates", rateIndex, "rateValue", 0.55)).not.toThrow();
  });

  it("appends an expandable payer/plan registry and a versioned contract used by live valuation", () => {
    const payer = { payerId: "COM-NEW", payerAdministrator: "New synthetic administrator", planProduct: "New PPO", lineOfBusiness: "Commercial", network: "PPO", funding: "Fully insured", active: "YES" };
    const withPayer = applyWorkbookAppend(workbook, { tableKey: "payers", values: payer, reason: "Add future payer example" });
    expect(withPayer.tables.find(t => t.key === "payers")!.rows).toHaveLength(11);
    expect(withPayer.tables.find(t => t.key === "payers")!.rows.at(-1)).toMatchObject({ id: "platform:payers:COM-NEW", sourceRow: 0, values: payer });
    const withRate = applyWorkbookAppend(withPayer, { tableKey: "contractRates", reason: "Synthetic per-day rate for new plan", values: {
      rateId: "NEW-IP-2026", payerId: "COM-NEW", serviceId: "IP", method: "PER UNIT", rateValue: 1000,
      effectiveFrom: "2026-01-01", effectiveTo: "2026-12-31", status: "APPROVED", evidence: "SYNTHETIC rate; no payer contract",
      reviewer: "Synthetic reviewer", version: "1", pricingBasis: "Discharge date", scope: "Synthetic expected allowance",
    } });
    const valued = summarizeOperatingWorkbook(edit("encounters", 0, "payerId", "COM-NEW", withRate), "2026-01");
    expect(valued.metrics.modeledRevenue).toBeCloseTo(433780.96 - 16 * 50);
    expect(workbook.tables.find(t => t.key === "payers")!.rows).toHaveLength(10);
    expect(withRate.source).toEqual(workbook.source);
    expect(withRate.tables.find(t => t.key === "monthlySnapshot")).toBe(table("monthlySnapshot"));
  });

  it("appends new service distinctions without manufacturing original formula snapshots", () => {
    const result = applyWorkbookAppend(workbook, { tableKey: "services", reason: "Add future service example", values: {
      serviceId: "IOP-NEW", program: "IOP", setting: "Hospital outpatient", code: "TEST", billableUnit: "patient day",
      description: "Synthetic future IOP distinction", pricingDateBasis: "Service date",
    } });
    expect(result.tables.find(t => t.key === "services")!.rows).toHaveLength(9);
    expect(result.tables.find(t => t.key === "services")!.rows.at(-1)!.sourceRow).toBe(0);
    expect(summarizeOperatingWorkbook(result, "2026").comparisons.every(c => c.status === "match")).toBe(true);
  });

  it("rejects incomplete, duplicate, calculated and invalid append inputs", () => {
    const payer = { payerId: "COM-NEW", payerAdministrator: "Test", planProduct: "PPO", lineOfBusiness: "Commercial", network: "PPO", funding: "Self-funded", active: "YES" };
    expect(() => applyWorkbookAppend(workbook, { tableKey: "payers", reason: "test", values: { payerId: "X" } })).toThrow("Required registry");
    expect(() => applyWorkbookAppend(workbook, { tableKey: "payers", reason: "test", values: { ...payer, payerId: "mcr-ffs" } })).toThrow("Duplicate");
    expect(() => applyWorkbookAppend(workbook, { tableKey: "payers", reason: "test", values: { ...payer, state: "ACTIVE" } })).toThrow("calculated");
    expect(() => applyWorkbookAppend(workbook, { tableKey: "payers", reason: "test", values: { ...payer, payerId: "bad id" } })).toThrow("Registry ID");
    const rate = { rateId: "NEW-RATE", payerId: "MCR-FFS", serviceId: "IP", method: "PER UNIT", rateValue: 100, effectiveFrom: "2026-01-01", effectiveTo: "2026-12-31", status: "APPROVED", evidence: "Synthetic", reviewer: "Tester", version: "1", pricingBasis: "Discharge", scope: "Synthetic" };
    expect(() => applyWorkbookAppend(workbook, { tableKey: "contractRates", reason: "test", values: rate })).toThrow("overlap");
    expect(() => applyWorkbookAppend(workbook, { tableKey: "contractRates", reason: "test", values: { ...rate, payerId: "MISSING" } })).toThrow("Unknown payerId");
  });

  it("types dates by date values and date labels rather than explanatory date text", () => {
    expect(table("services").columns.find(c => c.key === "pricingDateBasis")!.type).toBe("text");
    expect(table("iopVisits").columns.find(c => c.key === "patientDateKey")!.type).toBe("text");
    expect(table("staffDetail").columns.find(c => c.key === "dateRoleKey")!.type).toBe("text");
  });

  it("supports incremental UR corrections while identifying unreconciled day buckets", () => {
    const firstCorrection = edit("urPayer", 0, "authorizedDays", 12);
    expect(summarizeOperatingWorkbook(firstCorrection, "2026").issues.some(i => i.code === "UR_DAY_RECONCILIATION")).toBe(true);
    const reconciled = edit("urPayer", 0, "pendingDays", 1, firstCorrection);
    expect(summarizeOperatingWorkbook(reconciled, "2026").issues.some(i => i.code === "UR_DAY_RECONCILIATION")).toBe(false);
  });

  it("surfaces an unsupported opening-census override and out-of-enrollment visits", () => {
    const override = summarizeOperatingWorkbook(edit("inpatient", 0, "openingOverride", 99), "2026");
    expect(override.issues.some(i => i.code === "OPENING_CENSUS_RECONCILIATION")).toBe(true);
    const roster = summarizeOperatingWorkbook(edit("iopRoster", 0, "endDate", "2026-01-01"), "2026");
    expect(roster.issues.some(i => i.code === "VISIT_ENROLLMENT_RECONCILIATION")).toBe(true);
    expect(roster.metrics.iopEnrolledAvg).toBe(37);
  });
});
