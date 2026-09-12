import type {
  OperatingMetrics, OperatingMonthSummary, OperatingWorkbook, OperatingWorkbookSummary,
  WorkbookAppend, WorkbookComparison, WorkbookEdit, WorkbookIssue, WorkbookRow,
} from "../../domain-contracts/src/operatingWorkbook.js";
import { WORKBOOK_APPEND_REQUIRED_FIELDS } from "../../domain-contracts/src/operatingWorkbook.js";

const DAY = 86_400_000;
const n = (r: WorkbookRow, key: string): number | null => typeof r.values[key] === "number" && Number.isFinite(r.values[key]) ? r.values[key] as number : null;
const s = (r: WorkbookRow, key: string): string => typeof r.values[key] === "string" ? r.values[key] as string : "";
const money = (v: number): number => Math.round((v + Number.EPSILON) * 100) / 100;
const isoDate = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const ratio = (a: number, b: number): number | null => b ? a / b : null;
const rows = (w: OperatingWorkbook, key: string): WorkbookRow[] => w.tables.find(t => t.key === key)?.rows ?? [];
const sum = (rs: WorkbookRow[], key: string): number => rs.reduce((a, r) => a + (n(r, key) ?? 0), 0);

function blank(): OperatingMetrics {
  return { days: 0, admissions: 0, discharges: 0, ipPatientDays: 0, adc: null, occupancy: null, alos: null,
    iopPatientDays: 0, iopScheduled: 0, iopNoShows: 0, iopCancelled: 0, iopAttendanceRate: null,
    groupUnits: 0, sessions: 0, servicesDelivered: 0, staffHours: 0, ipStaffHours: 0, iopStaffHours: 0,
    laborCost: 0, ancillaryExpense: 0, cashReceived: 0, allocatedReceipts: 0, modeledRevenue: 0,
    revenueBudget: 0, forecastRevenue: 0, modeledOutstanding: 0, revenueVariance: 0, laborBudget: 0,
    staffBudgetHours: 0, lease: 0, invoiceBalance: 0, completedLosSum: 0, iopEnrolledAvg: null, iopPendingAvg: null,
    nonGroupServices: 0, mealsPayable: 0, ipRevenue: 0, iopRevenue: 0, revenueVariancePct: null,
    phasedRevenueBudget: 0, phasedRevenueVariance: 0, hoursVariance: 0, laborVariance: 0, agencyHours: 0,
    agencyCost: 0, oneToOneHours: 0, oneToOneCost: 0, trainingHours: 0, ptoHours: 0, ipHppd: null };
}

/** Recompute from entered records. Original formula caches are used only for comparison. */
export function summarizeOperatingWorkbook(workbook: OperatingWorkbook, period: string): OperatingWorkbookSummary {
  const year = workbook.source.year;
  if (period !== String(year) && !new RegExp(`^${year}-(0[1-9]|1[0-2])$`).test(period)) throw new Error("Invalid workbook period");
  const cutoff = workbook.settings?.reportingCutoff ?? `${year}-12-31`;
  const beds = workbook.settings?.licensedBeds ?? 0;
  const issues: WorkbookIssue[] = [];
  const issue = (tableKey: string, row: WorkbookRow | undefined, code: string, message: string) => {
    issues.push({ tableKey, ...(row ? { rowId: row.id } : {}), code, message });
  };
  const months: OperatingMonthSummary[] = Array.from({ length: 12 }, (_, i) => ({
    ...blank(), period: `${year}-${String(i + 1).padStart(2, "0")}`,
    label: new Date(Date.UTC(year, i, 1)).toLocaleString("en-US", { month: "short", timeZone: "UTC" }),
    days: Math.max(0, Math.min(Date.UTC(year, i + 1, 1), Date.parse(cutoff) + DAY) - Date.UTC(year, i, 1)) / DAY,
  }));
  const index = (date: string): number => isoDate(date) && date.startsWith(`${year}-`) && date <= cutoff ? Number(date.slice(5, 7)) - 1 : -1;
  const monthOf = (r: WorkbookRow, key: string): OperatingMonthSummary | undefined => months[index(s(r, key))];
  const byMonthNumber = (r: WorkbookRow, key = "month"): OperatingMonthSummary | undefined => months[(n(r, key) ?? 0) - 1];
  const add = (m: OperatingMetrics, key: keyof OperatingMetrics, value: number | null) => {
    const old = m[key];
    Object.assign(m, { [key]: old === null || value === null ? null : old + value });
  };
  const encounters = rows(workbook, "encounters");
  const visits = rows(workbook, "iopVisits");
  const encMap = new Map(encounters.map(r => [s(r, "encounterId"), r]));
  const visitMap = new Map(visits.map(r => [s(r, "visitId"), r]));
  const receipts = new Map(rows(workbook, "collections").map(r => [s(r, "receiptId"), r]));
  const completedLos = Array<number>(12).fill(0);
  const meals = Array<number>(12).fill(0);
  const enrolledDays = Array<number>(12).fill(0);
  const pendingDays = Array<number>(12).fill(0);
  const expectedServiceDays = new Map<string, number>();
  const actualServiceDays = new Map<string, number>();
  for (const r of encounters) {
    const admit = s(r, "admitDate"), discharge = s(r, "dischargeDate");
    if (!isoDate(admit) || (discharge && (!isoDate(discharge) || discharge < admit))) {
      issue("encounters", r, "INVALID_ENCOUNTER_DATES", "Admission/discharge dates require review."); continue;
    }
    const am = monthOf(r, "admitDate"), dm = monthOf(r, "dischargeDate");
    if (am) am.admissions++;
    if (dm) { dm.discharges++; completedLos[index(discharge)]! += (Date.parse(discharge) - Date.parse(admit)) / DAY; }
    let expected = 0;
    for (let i = 0; i < 12; i++) {
      const start = Math.max(Date.parse(admit), Date.UTC(year, i, 1));
      const end = Math.min(discharge ? Date.parse(discharge) : Date.parse(cutoff) + DAY, Date.UTC(year, i + 1, 1), Date.parse(cutoff) + DAY);
      const days = Math.max(0, end - start) / DAY;
      months[i]!.ipPatientDays += days; expected += days;
    }
    expectedServiceDays.set(s(r, "encounterId"), expected);
  }
  for (const r of rows(workbook, "inpatient")) {
    const date = s(r, "date");
    if (index(date) < 0) continue;
    const observed = n(r, "observedCensus");
    const computed = encounters.filter(e => s(e, "admitDate") <= date && (!s(e, "dischargeDate") || s(e, "dischargeDate") > date)).length;
    if (observed === null || observed !== computed) issue("inpatient", r, "CENSUS_RECONCILIATION", `Observed census ${observed ?? "unknown"} differs from ${computed} encounter-derived patient-days.`);
    const override = n(r, "openingOverride");
    if (override !== null) {
      const opening = encounters.filter(e => s(e, "admitDate") < date && (!s(e, "dischargeDate") || s(e, "dischargeDate") >= date)).length;
      if (!s(r, "openingEvidence").trim() || override !== opening) issue("inpatient", r, "OPENING_CENSUS_RECONCILIATION", `Opening override ${override} requires evidence and reconciliation to ${opening} encounter-derived opening census.`);
    }
  }
  for (const r of rows(workbook, "iopRoster")) {
    if (!isoDate(s(r, "startDate"))) { issue("iopRoster", r, "INVALID_ENROLLMENT_DATE", "Enrollment requires a valid start date."); continue; }
    for (let i = 0; i < 12; i++) {
      const start = Math.max(Date.parse(s(r, "startDate")), Date.UTC(year, i, 1));
      const end = Math.min(s(r, "endDate") ? Date.parse(s(r, "endDate")) : Date.parse(cutoff) + DAY, Date.UTC(year, i + 1, 1), Date.parse(cutoff) + DAY);
      const duration = Math.max(0, end - start) / DAY;
      if (s(r, "status") === "ENROLLED") enrolledDays[i]! += duration;
      else if (s(r, "status") === "PENDING") pendingDays[i]! += duration;
    }
  }
  for (const r of visits) {
    const m = monthOf(r, "serviceDate"); if (!m) continue;
    const enrollment = rows(workbook, "iopRoster").find(e => s(e, "enrollmentId") === s(r, "enrollmentId"));
    if (!enrollment || s(enrollment, "patientId") !== s(r, "patientId") || s(enrollment, "status") !== "ENROLLED" || s(enrollment, "startDate") > s(r, "serviceDate") || (s(enrollment, "endDate") && s(enrollment, "endDate") <= s(r, "serviceDate"))) issue("iopVisits", r, "VISIT_ENROLLMENT_RECONCILIATION", "Booked visit falls outside this patient's active enrollment; reconcile the roster and visits.");
    m.iopScheduled++;
    const attendance = s(r, "attendance");
    if (attendance === "NO SHOW") m.iopNoShows++;
    else if (attendance === "CANCELLED") m.iopCancelled++;
    else if (attendance === "ATTENDED") {
      m.iopPatientDays++; m.groupUnits += n(r, "groupServices") ?? 0; m.servicesDelivered += n(r, "servicesDelivered") ?? 0;
      meals[index(s(r, "serviceDate"))]! += Math.max(0, (n(r, "meals") ?? 0) - (n(r, "nonpayableMeals") ?? 0));
    } else issue("iopVisits", r, "INVALID_ATTENDANCE", "Attendance must be attended, no-show, or cancelled.");
  }
  for (const r of rows(workbook, "iopSessions")) { const m = monthOf(r, "date"); if (m) m.sessions += n(r, "countSession") ?? 0; }
  const linkedUnits = new Map<string, number>();
  for (const r of rows(workbook, "sessionAttendance")) linkedUnits.set(s(r, "visitId"), (linkedUnits.get(s(r, "visitId")) ?? 0) + (n(r, "units") ?? 0));
  for (const r of visits) if (index(s(r, "serviceDate")) >= 0 && (linkedUnits.get(s(r, "visitId")) ?? 0) !== (n(r, "groupServices") ?? 0)) issue("iopVisits", r, "SESSION_LINK_MISMATCH", "Participant links differ from delivered group units; reconcile both records.");
  const laborStandards = rows(workbook, "staffStandards");
  for (const r of rows(workbook, "staffDetail")) {
    const m = monthOf(r, "date"); if (!m) continue;
    const productive = n(r, "productiveHours"), agency = n(r, "agencyHours"), pto = n(r, "ptoHours"), training = n(r, "trainingHours");
    const standards = laborStandards.filter(rate => s(rate, "role") === s(r, "role") && s(rate, "program") === s(r, "program") && s(rate, "effectiveFrom") <= s(r, "date") && s(rate, "effectiveTo") >= s(r, "date"));
    const standard = standards.length === 1 ? standards[0]! : undefined;
    const regularRate = standard ? n(standard, "hourlyRate") : null, agencyRate = standard ? n(standard, "agencyHourlyRate") : null;
    if (productive !== null) { m.staffHours += productive; if (s(r, "program") === "IP") m.ipStaffHours += productive; else if (s(r, "program") === "IOP") m.iopStaffHours += productive; }
    m.agencyHours += agency ?? 0; m.oneToOneHours += n(r, "oneToOneHours") ?? 0; m.trainingHours += training ?? 0; m.ptoHours += pto ?? 0;
    add(m, "agencyCost", agency === null || agencyRate === null ? null : agency * agencyRate);
    add(m, "oneToOneCost", regularRate === null || n(r, "oneToOneHours") === null ? null : regularRate * n(r, "oneToOneHours")!);
    if (productive === null || agency === null || pto === null || training === null || regularRate === null || agencyRate === null || agency > productive) {
      m.laborCost = null; issue("staffDetail", r, "LABOR_INPUT_OR_RATE_MISSING", "Labor requires entered hours and exactly one effective role/program standard.");
    } else add(m, "laborCost", money((productive - agency) * regularRate + agency * agencyRate) + money((pto + training) * regularRate));
  }
  const rates = rows(workbook, "contractRates");
  const serviceKeys = new Set<string>();
  for (const r of rows(workbook, "serviceLedger")) {
    const m = monthOf(r, "serviceDate"); if (!m) continue;
    const encounter = encMap.get(s(r, "encounterId")), visit = visitMap.get(s(r, "visitId"));
    const parent = encounter ?? visit;
    const date = s(r, "serviceDate");
    const pricingDate = encounter ? s(encounter, "dischargeDate") : date;
    const payer = parent ? s(parent, "payerId") : "";
    const service = s(r, "serviceId");
    const unitKey = encounter ? `${s(encounter, "encounterId")}|${date}` : s(r, "visitId");
    const invalidParent = !parent || (!!encounter && !!visit) || (encounter ? service !== "IP" || date < s(encounter, "admitDate") || (!!s(encounter, "dischargeDate") && date >= s(encounter, "dischargeDate")) : !visit || s(visit, "attendance") !== "ATTENDED" || s(visit, "serviceDate") !== date || s(visit, "serviceId") !== service);
    if (encounter && !invalidParent) actualServiceDays.set(s(encounter, "encounterId"), (actualServiceDays.get(s(encounter, "encounterId")) ?? 0) + 1);
    const match = rates.filter(rate => s(rate, "payerId") === payer && s(rate, "serviceId") === service && s(rate, "status") === "APPROVED" && pricingDate && s(rate, "effectiveFrom") <= pricingDate && s(rate, "effectiveTo") >= pricingDate);
    const rate = match.length === 1 ? match[0]! : undefined;
    const amount = rate ? n(rate, "rateValue") : null;
    const units = n(r, "units"), charges = n(r, "grossCharges"), adjustment = n(r, "signedAllowanceAdjustment");
    if (invalidParent || !unitKey || serviceKeys.has(unitKey) || amount === null || units !== 1 || charges === null || adjustment === null || !rate || !["PER UNIT", "PCT CHARGES"].includes(s(rate, "method"))) {
      m.modeledRevenue = null;
      if (service === "IP") m.ipRevenue = null; else m.iopRevenue = null;
      issue("serviceLedger", r, "SERVICE_REVENUE_REVIEW", "Service parent/date, duplicate unit, entered values or unique effective contract needs reconciliation.");
    } else {
      const allowance = money(s(rate, "method") === "PER UNIT" ? units * amount : charges * amount) + adjustment;
      add(m, "modeledRevenue", allowance); add(m, service === "IP" ? "ipRevenue" : "iopRevenue", allowance);
    }
    serviceKeys.add(unitKey);
  }
  for (const r of encounters) {
    const expected = expectedServiceDays.get(s(r, "encounterId"));
    if (expected !== (actualServiceDays.get(s(r, "encounterId")) ?? 0)) issue("encounters", r, "SERVICE_DAYS_DIFFER", "Encounter-derived patient-days differ from service lines; reconcile after date corrections.");
  }
  for (const r of rows(workbook, "budget")) {
    const m = byMonthNumber(r); if (!m) continue;
    add(m, "revenueBudget", n(r, "revenueBudget")); add(m, "laborBudget", n(r, "laborBudget")); add(m, "staffBudgetHours", n(r, "staffHoursBudget"));
    if (n(r, "revenueBudget") === null || n(r, "laborBudget") === null || n(r, "staffHoursBudget") === null) issue("budget", r, "MISSING_BUDGET", "A blank approved budget remains unknown; enter explicit zero when appropriate.");
  }
  for (const r of rows(workbook, "forecast")) {
    const m = byMonthNumber(r); if (!m) continue;
    let rate = n(r, "blendedRate");
    if (s(r, "rateMethod") === "PAYER MIX") {
      const mix = rows(workbook, "forecastMix").filter(x => n(x, "month") === n(r, "month") && s(x, "program") === s(r, "program"));
      rate = mix.length && Math.abs(sum(mix, "share") - 1) < 0.000001 && mix.every(x => n(x, "rate") !== null && n(x, "share") !== null) ? mix.reduce((total, x) => total + n(x, "rate")! * n(x, "share")!, 0) : null;
    }
    const units = n(r, "forecastUnits");
    const valid = units !== null && rate !== null && !!s(r, "assumptionEvidence") && !!s(r, "forecastVersion") && isoDate(s(r, "asOfDate"));
    add(m, "forecastRevenue", valid ? money(units! * rate!) : null);
    if (!valid) issue("forecast", r, "FORECAST_ASSUMPTIONS_MISSING", "Forecast requires units, reviewed rate or complete payer mix, version and dated evidence.");
  }
  const invoiceExpenses = new Map<string, number | null>();
  for (const r of rows(workbook, "ancillary")) {
    const m = monthOf(r, "date"); if (!m) continue;
    let quantity = n(r, "quantity");
    if (r.formulaKeys?.includes("quantity")) {
      if (["Patient meals", "Laundry", "Housekeeping"].includes(s(r, "category"))) quantity = m.ipPatientDays;
      else if (s(r, "category") === "IOP meals") quantity = meals[index(s(r, "date"))]!;
      else quantity = null;
    }
    const cost = n(r, "unitCost");
    const expense = quantity === null || cost === null ? null : money(quantity * cost);
    if (s(r, "category") === "Lease") add(m, "lease", expense); else add(m, "ancillaryExpense", expense);
    if (expense === null) issue("ancillary", r, "MISSING_ANCILLARY_INPUT", "Expense quantity or unit cost needs an explicit value.");
    if (s(r, "serviceInvoiceEligible") === "YES") {
      const priorExpense = invoiceExpenses.get(s(r, "invoiceId"));
      invoiceExpenses.set(s(r, "invoiceId"), expense === null || priorExpense === null ? null : (priorExpense ?? 0) + expense);
    }
  }
  for (const r of rows(workbook, "invoices")) {
    const m = byMonthNumber(r); if (!m) continue;
    const adjustment = n(r, "signedAdjustment"), paid = n(r, "vendorPaid");
    const expense = invoiceExpenses.get(s(r, "invoiceId"));
    add(m, "invoiceBalance", adjustment === null || paid === null || expense === null ? null : (expense ?? 0) + adjustment - paid);
  }
  for (const r of rows(workbook, "collections")) { const m = monthOf(r, "receiptDate"); if (m) add(m, "cashReceived", n(r, "signedAmount")); }
  for (const r of rows(workbook, "receiptAllocations")) {
    const receipt = receipts.get(s(r, "receiptId"));
    const m = byMonthNumber(r, "serviceMonth");
    if (m && receipt && s(receipt, "receiptDate") <= cutoff) add(m, "allocatedReceipts", n(r, "amount"));
  }
  for (const r of rows(workbook, "urPayer")) {
    const submitted = n(r, "submittedDays"), authorized = n(r, "authorizedDays"), denied = n(r, "deniedDays"), pending = n(r, "pendingDays");
    if (submitted === null || authorized === null || denied === null || pending === null || authorized + denied + pending !== submitted) issue("urPayer", r, "UR_DAY_RECONCILIATION", "Submitted days must equal authorized, denied and pending days before this period can be treated as reconciled.");
  }
  const unavailableComparisons = new Set<keyof OperatingMetrics>();
  const feedMetrics: Record<string, (keyof OperatingMetrics)[]> = {
    IP: ["admissions", "discharges", "ipPatientDays", "adc", "occupancy", "completedLosSum", "alos", "ipHppd", "ipRevenue", "modeledRevenue", "ancillaryExpense"],
    IOP: ["iopPatientDays", "iopScheduled", "iopNoShows", "iopEnrolledAvg", "iopPendingAvg", "groupUnits", "sessions", "servicesDelivered", "nonGroupServices", "mealsPayable", "iopRevenue", "modeledRevenue", "ancillaryExpense"],
    PAYER: ["ipRevenue", "iopRevenue", "modeledRevenue", "modeledOutstanding", "revenueVariance", "revenueVariancePct", "phasedRevenueVariance"],
    STAFFING: ["staffHours", "ipStaffHours", "iopStaffHours", "laborCost", "laborVariance", "hoursVariance", "agencyHours", "agencyCost", "oneToOneHours", "oneToOneCost", "trainingHours", "ptoHours", "ipHppd"],
    CASH: ["cashReceived", "allocatedReceipts", "modeledOutstanding"],
  };
  let incompleteCash = false;
  for (let i = 0; i < 12; i++) for (const feed of Object.keys(feedMetrics)) {
    const m = months[i]!;
    const controls = rows(workbook, "coverage").filter(r => n(r, "month") === i + 1 && s(r, "feed") === feed);
    const control = controls[0];
    if (controls.length === 1 && control && s(control, "status") === "COMPLETE" && s(control, "reviewer").trim() && s(control, "evidence").trim()) continue;
    issue("coverage", control, "INCOMPLETE_FEED", `${m.period} ${feed}: complete coverage, reviewer and evidence are required. Record totals remain partial and cannot support a reviewed close.`);
    if (period.length === 4 || period === m.period) for (const key of feedMetrics[feed]!) unavailableComparisons.add(key);
    if (feed === "IP") { m.ipRevenue = null; m.modeledRevenue = null; m.ancillaryExpense = null; m.invoiceBalance = null; }
    if (feed === "IOP") { m.iopRevenue = null; m.modeledRevenue = null; m.ancillaryExpense = null; m.invoiceBalance = null; }
    if (feed === "PAYER") { m.ipRevenue = null; m.iopRevenue = null; m.modeledRevenue = null; }
    if (feed === "STAFFING") { m.laborCost = null; m.agencyCost = null; m.oneToOneCost = null; }
    if (feed === "CASH") { m.cashReceived = null; incompleteCash = true; }
  }
  // Missing receipt coverage also prevents a complete allocation balance by service month.
  if (incompleteCash) for (const m of months) m.allocatedReceipts = null;
  for (let i = 0; i < 12; i++) {
    const m = months[i]!;
    m.adc = ratio(m.ipPatientDays, m.days); m.occupancy = ratio(m.ipPatientDays, m.days * beds);
    m.alos = ratio(completedLos[i]!, m.discharges); m.iopAttendanceRate = ratio(m.iopPatientDays, m.iopScheduled - m.iopCancelled);
    m.completedLosSum = completedLos[i]!;
    m.iopEnrolledAvg = ratio(enrolledDays[i]!, m.days); m.iopPendingAvg = ratio(pendingDays[i]!, m.days);
    m.mealsPayable = meals[i]!; m.nonGroupServices = m.servicesDelivered - m.groupUnits;
    m.ipHppd = ratio(m.ipStaffHours, m.ipPatientDays);
    m.modeledOutstanding = m.modeledRevenue === null || m.allocatedReceipts === null ? null : money(m.modeledRevenue - m.allocatedReceipts);
    m.revenueVariance = m.modeledRevenue === null || m.revenueBudget === null ? null : money(m.modeledRevenue - m.revenueBudget);
    m.revenueVariancePct = m.revenueVariance === null || m.revenueBudget === null ? null : ratio(m.revenueVariance, m.revenueBudget);
    m.phasedRevenueBudget = m.revenueBudget === null ? null : m.revenueBudget * m.days / ((Date.UTC(year, i + 1, 1) - Date.UTC(year, i, 1)) / DAY);
    m.phasedRevenueVariance = m.modeledRevenue === null || m.phasedRevenueBudget === null ? null : m.modeledRevenue - m.phasedRevenueBudget;
    m.hoursVariance = m.staffBudgetHours === null ? null : m.staffHours - m.staffBudgetHours;
    m.laborVariance = m.laborCost === null || m.laborBudget === null ? null : m.laborCost - m.laborBudget;
    for (const key of ["modeledRevenue", "cashReceived", "allocatedReceipts", "laborCost", "ancillaryExpense", "forecastRevenue", "invoiceBalance"] as const) if (m[key] !== null) m[key] = money(m[key]);
  }
  let metrics: OperatingMetrics;
  if (period.length === 7) metrics = { ...months[Number(period.slice(5)) - 1]! };
  else {
    metrics = blank();
    for (const key of Object.keys(metrics) as (keyof OperatingMetrics)[]) {
      if (["adc", "occupancy", "alos", "iopAttendanceRate", "iopEnrolledAvg", "iopPendingAvg", "ipHppd", "revenueVariancePct"].includes(key)) continue;
      for (const m of months) add(metrics, key, m[key]);
    }
    metrics.adc = ratio(metrics.ipPatientDays, metrics.days); metrics.occupancy = ratio(metrics.ipPatientDays, metrics.days * beds);
    metrics.alos = ratio(completedLos.reduce((a, b) => a + b, 0), metrics.discharges);
    metrics.iopAttendanceRate = ratio(metrics.iopPatientDays, metrics.iopScheduled - metrics.iopCancelled);
    metrics.iopEnrolledAvg = ratio(enrolledDays.reduce((a, b) => a + b, 0), metrics.days);
    metrics.iopPendingAvg = ratio(pendingDays.reduce((a, b) => a + b, 0), metrics.days);
    metrics.ipHppd = ratio(metrics.ipStaffHours, metrics.ipPatientDays);
    metrics.revenueVariancePct = metrics.revenueVariance === null || metrics.revenueBudget === null ? null : ratio(metrics.revenueVariance, metrics.revenueBudget);
  }
  const originals = rows(workbook, "monthlySnapshot").filter(r => period.length === 4 || n(r, "month") === Number(period.slice(5)));
  const crosswalk: Partial<Record<keyof OperatingMetrics, string>> = {
    days: "days", admissions: "admissions", discharges: "discharges", ipPatientDays: "ipPatientDays", adc: "adc", occupancy: "occupancy", alos: "alos",
    iopPatientDays: "iopPatientDays", iopScheduled: "iopScheduled", iopNoShows: "iopAbsent", groupUnits: "groupUnits", sessions: "sessions", servicesDelivered: "iopServicesDelivered",
    staffHours: "staffHours", ipStaffHours: "ipStaffHours", iopStaffHours: "iopStaffHours", laborCost: "laborCost", ancillaryExpense: "ancillaryExpense", cashReceived: "cashReceived",
    allocatedReceipts: "allocatedReceipts", modeledRevenue: "modeledAllowed", revenueBudget: "revenueBudget", forecastRevenue: "forecast", modeledOutstanding: "modeledOutstanding",
    revenueVariance: "revenueVariance", laborBudget: "laborBudget", staffBudgetHours: "staffBudgetHours", lease: "lease",
    completedLosSum: "completedLosSum", iopEnrolledAvg: "iopEnrolledAvg", iopPendingAvg: "iopPendingAvg", mealsPayable: "mealsPayable",
    ipRevenue: "ipRevenue", iopRevenue: "iopRevenue", revenueVariancePct: "revenueVariancePct", phasedRevenueBudget: "phasedRevenueBudget",
    phasedRevenueVariance: "phasedRevenueVariance", hoursVariance: "hoursVariance", laborVariance: "laborVariance", agencyHours: "agencyHours",
    agencyCost: "agencyCost", oneToOneHours: "oneToOneHours", oneToOneCost: "oneToOneCost", trainingHours: "trainingHours", ptoHours: "ptoHours",
    ipHppd: "ipHppd", nonGroupServices: "iopNonGroupServices",
  };
  const comparisons: WorkbookComparison[] = Object.entries(crosswalk).map(([rawKey, sourceKey]) => {
    const metric = rawKey as keyof OperatingMetrics;
    let snapshot: number | null = originals.length && originals.every(r => n(r, sourceKey) !== null) ? sum(originals, sourceKey) : null;
    if (metric === "adc") snapshot = ratio(sum(originals, "ipPatientDays"), sum(originals, "days"));
    if (metric === "occupancy") snapshot = ratio(sum(originals, "ipPatientDays"), sum(originals, "days") * beds);
    if (metric === "alos") snapshot = ratio(sum(originals, "completedLosSum"), sum(originals, "discharges"));
    if (metric === "iopEnrolledAvg" || metric === "iopPendingAvg") snapshot = ratio(originals.reduce((a, r) => a + (n(r, sourceKey) ?? 0) * (n(r, "days") ?? 0), 0), sum(originals, "days"));
    if (metric === "ipHppd") snapshot = ratio(sum(originals, "ipStaffHours"), sum(originals, "ipPatientDays"));
    if (metric === "revenueVariancePct") snapshot = ratio(sum(originals, "revenueVariance"), sum(originals, "revenueBudget"));
    const calculated = metrics[metric];
    const difference = calculated === null || snapshot === null || unavailableComparisons.has(metric) ? null : calculated - snapshot;
    return { metric, label: sourceKey.replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase()), calculated, workbookSnapshot: snapshot,
      difference, status: difference === null ? "unavailable" : Math.abs(difference) < 0.011 ? "match" : "changed" };
  });
  return { period, metrics, months, comparisons, issues };
}

/** Apply an explicitly reasoned correction while preserving all source snapshots and IDs. */
export function applyWorkbookEdit(workbook: OperatingWorkbook, edit: WorkbookEdit): OperatingWorkbook {
  if (!edit || typeof edit.reason !== "string" || !edit.reason.trim()) throw new Error("A correction reason is required");
  if (edit.reason.length > 2000) throw new Error("Correction reason must be at most 2000 characters");
  const table = workbook.tables.find(t => t.key === edit.tableKey);
  const row = table?.rows.find(r => r.id === edit.rowId);
  const column = table?.columns.find(c => c.key === edit.columnKey);
  if (!table || !row || !column) throw new Error("Unknown workbook table, row or column");
  if (!column.editable || table.snapshot || row.formulaKeys?.includes(column.key)) throw new Error("Identity, receipt history and formula snapshot cells are read-only");
  const value = edit.value;
  if (value !== null && typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") throw new Error("Unsupported workbook value");
  if (column.required && (value === null || (typeof value === "string" && !value.trim()))) throw new Error("Required field cannot be blank");
  if (value !== null && value !== "") {
    if (column.type === "number" && (typeof value !== "number" || !Number.isFinite(value))) throw new Error("Enter a finite number");
    if (column.type === "date" && !isoDate(value)) throw new Error("Enter a valid date as YYYY-MM-DD");
    if (column.type === "text" && typeof value !== "string") throw new Error("Enter text");
    if (typeof value === "number" && !column.signed && value < 0) throw new Error("Value must be nonnegative");
    if (typeof value === "string" && value.length > 4000) throw new Error("Field is too long");
    if (column.options && !column.options.includes(String(value))) throw new Error("Value must be one of the listed options");
  }
  const updatedRow: WorkbookRow = { ...row, values: { ...row.values, [column.key]: value === "" ? null : value } };
  const next: OperatingWorkbook = { ...workbook, tables: workbook.tables.map(t => t === table ? { ...t, rows: t.rows.map(r => r === row ? updatedRow : r) } : t) };
  validateChangedRow(next, table.key, updatedRow, column.key);
  return next;
}

/** Add a payer, service or effective contract while keeping the accepted workbook immutable. */
export function applyWorkbookAppend(workbook: OperatingWorkbook, command: WorkbookAppend): OperatingWorkbook {
  if (!command || typeof command.reason !== "string" || !command.reason.trim() || command.reason.length > 2000) throw new Error("A correction reason of at most 2000 characters is required");
  if (!Object.hasOwn(WORKBOOK_APPEND_REQUIRED_FIELDS, command.tableKey)) throw new Error("Only payer, service and contract registries support new records");
  const table = workbook.tables.find(t => t.key === command.tableKey);
  if (!table || !command.values || typeof command.values !== "object" || Array.isArray(command.values)) throw new Error("Unknown registry or invalid record values");
  const identityKey = WORKBOOK_APPEND_REQUIRED_FIELDS[command.tableKey][0];
  const identity = command.values[identityKey];
  if (typeof identity !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/.test(identity)) throw new Error("Registry ID must be 1–80 letters, numbers, dots, underscores, colons or hyphens");
  if (table.rows.some(r => s(r, identityKey).toLowerCase() === identity.toLowerCase())) throw new Error("Duplicate registry ID");
  for (const key of WORKBOOK_APPEND_REQUIRED_FIELDS[command.tableKey]) {
    const value = command.values[key];
    if (value === null || value === undefined || (typeof value === "string" && !value.trim())) throw new Error(`Required registry field ${key} cannot be blank`);
  }
  const values: WorkbookRow["values"] = {};
  for (const column of table.columns) values[column.key] = null;
  for (const [key, value] of Object.entries(command.values)) {
    const column = table.columns.find(c => c.key === key);
    if (!column || (key !== identityKey && !column.editable) || column.snapshot) throw new Error(`Unknown or calculated registry field ${key}`);
    if (value !== null && value !== "") {
      if (column.type === "number" && (typeof value !== "number" || !Number.isFinite(value) || (!column.signed && value < 0))) throw new Error(`Registry field ${key} requires a finite nonnegative number`);
      if (column.type === "date" && !isoDate(value)) throw new Error(`Registry field ${key} requires a valid YYYY-MM-DD date`);
      if (column.type === "text" && (typeof value !== "string" || value.length > 4000)) throw new Error(`Registry field ${key} requires text of at most 4000 characters`);
      if (column.options && !column.options.includes(String(value))) throw new Error(`Invalid registry option for ${key}`);
    }
    values[key] = typeof value === "string" ? value.trim() || null : value;
  }
  const newRow: WorkbookRow = { id: `platform:${command.tableKey}:${identity}`, sourceRow: 0, values,
    formulaKeys: table.columns.filter(c => c.snapshot).map(c => c.key) };
  const next: OperatingWorkbook = { ...workbook, tables: workbook.tables.map(t => t === table ? { ...t, rows: [...t.rows, newRow] } : t) };
  for (const key of Object.keys(values)) validateChangedRow(next, table.key, newRow, key);
  return next;
}

function validateChangedRow(workbook: OperatingWorkbook, tableKey: string, row: WorkbookRow, key: string): void {
  const requiredJoin: Record<string, [string, string]> = { patientId: ["patients", "patientId"], payerId: ["payers", "payerId"], serviceId: ["services", "serviceId"], encounterId: ["encounters", "encounterId"], visitId: ["iopVisits", "visitId"], enrollmentId: ["iopRoster", "enrollmentId"], sessionId: ["iopSessions", "sessionId"], invoiceId: ["invoices", "invoiceId"], receiptId: ["collections", "receiptId"] };
  const join = requiredJoin[key];
  if (join && s(row, key) && !rows(workbook, join[0]).some(r => s(r, join[1]) === s(row, key))) throw new Error(`Unknown ${key}`);
  const ensure = (condition: boolean, message: string) => { if (!condition) throw new Error(message); };
  const explicitNumbers: Record<string, string[]> = {
    staffDetail: ["productiveHours", "agencyHours", "oneToOneHours", "ptoHours", "trainingHours"],
    iopVisits: ["servicesDelivered", "meals", "groupServices", "nonpayableMeals"],
    iopSessions: ["countSession"], sessionAttendance: ["units"],
    serviceLedger: ["units", "grossCharges", "signedAllowanceAdjustment"],
    invoices: ["signedAdjustment", "vendorPaid"],
    urPayer: ["submittedDays", "authorizedDays", "deniedDays", "pendingDays"],
  };
  if (explicitNumbers[tableKey]?.includes(key)) ensure(n(row, key) !== null, "Enter an explicit nonnegative number, including zero when appropriate");
  for (const [startKey, endKey] of [["admitDate", "dischargeDate"], ["startDate", "endDate"], ["effectiveFrom", "effectiveTo"], ["periodStart", "periodEnd"]]) {
    const start = s(row, startKey!), end = s(row, endKey!);
    if (start && end) ensure(start <= end, "End/discharge date cannot precede the start/admission date");
  }
  const integerKeys = ["month", "serviceMonth", "syntheticAge", "ageAtAdmission", "servicesDelivered", "meals", "groupServices", "nonpayableMeals", "countSession", "submittedDays", "authorizedDays", "deniedDays", "pendingDays"];
  if (integerKeys.includes(key) && n(row, key) !== null) ensure(Number.isInteger(n(row, key)), "This count must be a whole number");
  if (["month", "serviceMonth"].includes(key)) ensure(n(row, key)! >= 1 && n(row, key)! <= 12, "Month must be 1 through 12");
  if (tableKey === "staffDetail") {
    const productive = n(row, "productiveHours");
    if (productive !== null) ensure((n(row, "agencyHours") ?? 0) <= productive && (n(row, "oneToOneHours") ?? 0) <= productive, "Agency and one-to-one hours are subsets of productive hours");
    ensure(rows(workbook, tableKey).filter(r => s(r, "date") === s(row, "date") && s(r, "role") === s(row, "role") && s(r, "program") === s(row, "program")).length === 1, "Duplicate date, role and program");
  }
  if (tableKey === "iopVisits") {
    ensure((n(row, "groupServices") ?? 0) <= (n(row, "servicesDelivered") ?? 0), "Group services cannot exceed total delivered services");
    ensure((n(row, "nonpayableMeals") ?? 0) <= (n(row, "meals") ?? 0), "Nonpayable meals cannot exceed meals");
    ensure(s(row, "attendance") === "ATTENDED" || ["servicesDelivered", "meals", "groupServices"].every(k => (n(row, k) ?? 0) === 0), "Non-attended visits cannot have delivered services or meals; correct quantities first");
    ensure(rows(workbook, tableKey).filter(r => s(r, "patientId") === s(row, "patientId") && s(r, "serviceDate") === s(row, "serviceDate")).length === 1, "Duplicate patient service date");
    const enrollment = rows(workbook, "iopRoster").find(r => s(r, "enrollmentId") === s(row, "enrollmentId"));
    ensure(!!enrollment && s(enrollment, "patientId") === s(row, "patientId"), "Visit enrollment must belong to the same patient");
    const service = rows(workbook, "services").find(r => s(r, "serviceId") === s(row, "serviceId"));
    ensure(!!service && s(service, "program") === "IOP" && s(service, "billableUnit") === "patient day", "Booked IOP visits require an IOP patient-day service");
  }
  if (tableKey === "serviceLedger") {
    ensure(!!s(row, "encounterId") !== !!s(row, "visitId"), "Service must reference exactly one encounter or visit");
    ensure(n(row, "units") === 1, "One inpatient midnight or attended IOP patient-day per service line");
    const unitKey = (r: WorkbookRow) => s(r, "encounterId") ? `${s(r, "encounterId")}|${s(r, "serviceDate")}` : s(r, "visitId");
    ensure(rows(workbook, tableKey).filter(r => unitKey(r) === unitKey(row)).length === 1, "Duplicate service unit");
  }
  if (tableKey === "contractRates" || tableKey === "staffStandards") {
    const fields = tableKey === "contractRates" ? ["payerId", "serviceId"] : ["role", "program"];
    const overlaps = rows(workbook, tableKey).filter(r => r.id !== row.id && fields.every(k => s(r, k) === s(row, k)) && s(r, "effectiveFrom") <= s(row, "effectiveTo") && s(r, "effectiveTo") >= s(row, "effectiveFrom"));
    ensure(overlaps.length === 0, "Effective rate intervals must not overlap");
    if (tableKey === "contractRates" && s(row, "method") === "PCT CHARGES" && n(row, "rateValue") !== null) ensure(n(row, "rateValue")! >= 0 && n(row, "rateValue")! <= 1, "PCT CHARGES rate must be a fraction from 0 to 1 (for example 0.60 for 60%)");
  }
  if (["budget", "forecast"].includes(tableKey)) ensure(rows(workbook, tableKey).filter(r => n(r, "month") === n(row, "month") && s(r, "program") === s(row, "program")).length === 1, "Duplicate month and program");
  if (tableKey === "coverage") {
    ensure(["IP", "IOP", "PAYER", "STAFFING", "CASH"].includes(s(row, "feed")), "Unknown completeness feed");
    ensure(rows(workbook, tableKey).filter(r => n(r, "month") === n(row, "month") && s(r, "feed") === s(row, "feed")).length === 1, "Duplicate month and feed");
  }
  if (tableKey === "invoices" && n(row, "signedAdjustment") !== 0) ensure(!!s(row, "adjustmentReason"), "Signed invoice adjustments require a reason");
}
