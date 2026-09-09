/** Accepted synthetic workbook records. Formula cells retain original, read-only snapshots. */
export type WorkbookCell = string | number | boolean | null;
export interface WorkbookColumn {
  key: string;
  label: string;
  type: "text" | "number" | "date";
  editable: boolean;
  snapshot?: boolean;
  required?: boolean;
  signed?: boolean;
  options?: string[];
}
export interface WorkbookRow {
  id: string;
  sourceRow: number;
  values: Record<string, WorkbookCell>;
  /** Some columns mix entered values and formulas; editing a formula is always prohibited. */
  formulaKeys?: string[];
}
export interface WorkbookTable {
  key: string;
  title: string;
  sheet: string;
  columns: WorkbookColumn[];
  rows: WorkbookRow[];
  dateKey?: string;
  snapshot?: boolean;
}
export interface OperatingWorkbook {
  schemaVersion: 1;
  source: { name: string; sha256: string; year: number; importedAt: string };
  settings?: { licensedBeds: number; reportingCutoff: string; hospital: string };
  tables: WorkbookTable[];
}
export interface WorkbookEdit {
  tableKey: string;
  rowId: string;
  columnKey: string;
  value: WorkbookCell;
  reason: string;
}
export const WORKBOOK_APPEND_REQUIRED_FIELDS = {
  payers: ["payerId", "payerAdministrator", "planProduct", "lineOfBusiness", "network", "funding", "active"],
  services: ["serviceId", "program", "setting", "code", "billableUnit", "description", "pricingDateBasis"],
  contractRates: ["rateId", "payerId", "serviceId", "method", "rateValue", "effectiveFrom", "effectiveTo", "status", "evidence", "reviewer", "version", "pricingBasis", "scope"],
} as const;
export interface WorkbookAppend {
  tableKey: keyof typeof WORKBOOK_APPEND_REQUIRED_FIELDS;
  values: Record<string, WorkbookCell>;
  reason: string;
}
export interface OperatingMetrics {
  days: number;
  admissions: number;
  discharges: number;
  ipPatientDays: number;
  adc: number | null;
  occupancy: number | null;
  alos: number | null;
  completedLosSum: number;
  iopPatientDays: number;
  iopScheduled: number;
  iopNoShows: number;
  iopCancelled: number;
  iopAttendanceRate: number | null;
  iopEnrolledAvg: number | null;
  iopPendingAvg: number | null;
  groupUnits: number;
  sessions: number;
  servicesDelivered: number;
  nonGroupServices: number;
  mealsPayable: number;
  staffHours: number;
  ipStaffHours: number;
  iopStaffHours: number;
  laborCost: number | null;
  ancillaryExpense: number | null;
  cashReceived: number | null;
  allocatedReceipts: number | null;
  modeledRevenue: number | null;
  ipRevenue: number | null;
  iopRevenue: number | null;
  revenueBudget: number | null;
  forecastRevenue: number | null;
  modeledOutstanding: number | null;
  revenueVariance: number | null;
  revenueVariancePct: number | null;
  phasedRevenueBudget: number | null;
  phasedRevenueVariance: number | null;
  laborBudget: number | null;
  staffBudgetHours: number | null;
  hoursVariance: number | null;
  laborVariance: number | null;
  agencyHours: number;
  agencyCost: number | null;
  oneToOneHours: number;
  oneToOneCost: number | null;
  trainingHours: number;
  ptoHours: number;
  ipHppd: number | null;
  lease: number | null;
  invoiceBalance: number | null;
}
export interface OperatingMonthSummary extends OperatingMetrics { period: string; label: string }
export interface WorkbookComparison {
  metric: keyof OperatingMetrics;
  label: string;
  calculated: number | null;
  workbookSnapshot: number | null;
  difference: number | null;
  status: "match" | "changed" | "unavailable";
}
export interface WorkbookIssue { code: string; tableKey: string; rowId?: string; message: string }
export interface OperatingWorkbookSummary {
  period: string;
  metrics: OperatingMetrics;
  months: OperatingMonthSummary[];
  comparisons: WorkbookComparison[];
  issues: WorkbookIssue[];
}
