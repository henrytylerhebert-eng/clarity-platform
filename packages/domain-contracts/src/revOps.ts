import { z } from "zod";

export const REV_OPS_PERMISSIONS = [
  "view",
  "receiptExport",
  "budgetImport",
  "budgetApprove",
  "actualEnter",
  "actualCorrect",
  "periodClose",
  "periodReopen",
] as const;
export type RevOpsPermission = (typeof REV_OPS_PERMISSIONS)[number];
const text = z.string().trim().min(1).max(160);
export const RevOpsPeriod = z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])$/);
export const RevOpsDate = z
  .string()
  .regex(/^20\d{2}-(0[1-9]|1[0-2])-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return (
      Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  }, "Invalid calendar date");
export const RevOpsCount = z.number().int().min(0).max(100000);
export const RevOpsSetupSchema = z
  .object({
    name: text,
    unit: text,
    timezone: text.refine((value) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: value });
        return true;
      } catch {
        return false;
      }
    }),
    costCenterLabel: text,
    costCenterOptions: z
      .array(text)
      .min(1)
      .max(100)
      .refine((a) => new Set(a).size === a.length),
  })
  .strict();

export const RevOpsFieldScopeSchema = z.enum(["setup", "budget", "actual"]);
export const RevOpsFieldValuesSchema = z
  .array(
    z
      .object({
        fieldId: z.string().uuid(),
        value: z.string().trim().max(160),
      })
      .strict(),
  )
  .max(20)
  .refine(
    (values) => new Set(values.map((v) => v.fieldId)).size === values.length,
    "Duplicate field",
  );
export const RevOpsFieldDefinitionSchema = z
  .object({
    action: z.literal("defineField"),
    id: z.string().uuid().optional(),
    scope: RevOpsFieldScopeSchema,
    type: z.enum(["text", "select"]),
    label: text,
    required: z.boolean(),
    archived: z.boolean(),
    options: z
      .array(
        z
          .object({
            id: z.string().uuid().optional(),
            label: text,
            archived: z.boolean(),
          })
          .strict(),
      )
      .max(50),
  })
  .strict();
export type RevOpsFieldValues = z.infer<typeof RevOpsFieldValuesSchema>;
export type RevOpsFieldScope = z.infer<typeof RevOpsFieldScopeSchema>;
export interface RevOpsCustomField {
  id: string;
  scope: RevOpsFieldScope;
  type: "text" | "select";
  label: string;
  required: boolean;
  archived: boolean;
  version: number;
  options: { id: string; label: string; archived: boolean }[];
}
export interface RevOpsFieldSnapshot {
  fieldId: string;
  version: number;
  label: string;
  type: "text" | "select";
  value: string;
  optionLabel?: string;
}

export const RevOpsCommandSchema = z.discriminatedUnion("action", [
  RevOpsFieldDefinitionSchema,
  z
    .object({
      action: z.literal("setupValues"),
      values: RevOpsFieldValuesSchema,
    })
    .strict(),
  z
    .object({
      action: z.literal("grant"),
      userId: text,
      permissions: z.array(z.enum(REV_OPS_PERMISSIONS)).max(REV_OPS_PERMISSIONS.length),
    })
    .strict(),
  z
    .object({
      action: z.literal("field"),
      label: text,
      options: z
        .array(text)
        .min(1)
        .max(100)
        .refine((a) => new Set(a).size === a.length),
      archived: z.boolean(),
    })
    .strict(),
  z
    .object({
      action: z.literal("budget"),
      period: RevOpsPeriod,
      total: z.number().min(0).max(1000000),
      dailyTargets: z.array(z.number().min(0).max(100000)).max(31).optional(),
      costCenter: text,
      fields: RevOpsFieldValuesSchema.optional(),
    })
    .strict(),
  z.object({ action: z.literal("approve"), budgetId: text }).strict(),
  z
    .object({
      action: z.literal("actual"),
      date: RevOpsDate,
      count: RevOpsCount,
      fields: RevOpsFieldValuesSchema.optional(),
    })
    .strict(),
  z
    .object({
      action: z.literal("correct"),
      date: RevOpsDate,
      count: RevOpsCount,
      fields: RevOpsFieldValuesSchema.optional(),
      reason: z.string().trim().min(3).max(1000),
    })
    .strict(),
  z
    .object({
      action: z.literal("close"),
      period: RevOpsPeriod,
      budgetId: text.optional(),
      reason: z.string().trim().min(3).max(1000),
    })
    .strict(),
  z
    .object({
      action: z.literal("reopen"),
      period: RevOpsPeriod,
      reason: z.string().trim().min(3).max(1000),
    })
    .strict(),
]);
export type RevOpsCommand = z.infer<typeof RevOpsCommandSchema>;
export type RevOpsSetup = z.infer<typeof RevOpsSetupSchema>;
export interface RevOpsSource {
  kind: "manual" | "upload";
  name: string;
  sha256?: string;
  rows?: number[];
  sheet?: string;
  mapping?: Record<string, string | undefined>;
  fieldMapping?: { fieldId: string; column: string }[];
}
export interface RevOpsBudget {
  fields?: RevOpsFieldSnapshot[];
  id: string;
  period: string;
  total: number;
  dailyTargets: number[];
  costCenter: string;
  costCenterLabel: string;
  fieldVersion: number;
  status: "draft" | "approved";
  source: RevOpsSource;
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  approvalOrder?: number;
}
export interface RevOpsActual {
  fields?: RevOpsFieldSnapshot[];
  count: number;
  source: RevOpsSource;
  actorId: string;
  at: string;
  cutoffInstant: string;
  reason?: string;
}
export interface RevOpsCloseReadiness {
  period: string;
  through: string;
  expectedDays: number;
  recordedDays: number;
  missingDates: string[];
  knownActuals: number;
  actuals: number | null;
  budget: RevOpsBudget | null;
  variance: number | null;
  closed: boolean;
  ready: boolean;
}
export interface RevOpsClosingReceipt {
  /** Absent on legacy receipts; never backfilled from current configuration. */
  hospitalId?: string;
  hospitalName?: string;
  metric?: RevOpsMetricSnapshot;
  workspaceId: string;
  unit: string;
  timezone: string;
  dateConvention: "end-of-day";
  period: string;
  through: string;
  expectedDays: number;
  actuals: number;
  budget: RevOpsBudget;
  variance: number;
  days: { date: string; actualRevision: number; actual: RevOpsActual }[];
  actorId: string;
  at: string;
  reason: string;
  revision: number;
  closingNumber: number;
  previousClosingRevision?: number;
}

export interface RevOpsMetricSnapshot {
  metric_code: string;
  metric_label: string;
  definition_version: string;
  definition: string;
  timezone: string;
  census_local_time: string;
  service_date_rule: string;
  validation_status: "unverified";
  inclusion_rule_version: null;
  effective_from: null;
  hospital_rules: Record<"included_statuses" | "observation" | "leave_pass" | "transfer_at_midnight" | "unit_assignment" | "admission_discharge_at_midnight" | "temporary_closure", null>;
}
export const REV_OPS_CENSUS_METRIC = {
  metric_code: "DAILY_MIDNIGHT_CENSUS",
  definition_version: "1.0",
  metric_label: "Daily Midnight Census Count",
  definition: "Number of inpatients assigned to the selected hospital/unit at the facility's designated local midnight census time, attributed to the calendar day that just ended.",
  census_local_time: "00:00",
  service_date_rule: "PRIOR_CALENDAR_DAY",
  validation_status: "unverified",
  inclusion_rule_version: null,
  effective_from: null,
  hospital_rules: { included_statuses: null, observation: null, leave_pass: null, transfer_at_midnight: null, unit_assignment: null, admission_discharge_at_midnight: null, temporary_closure: null },
} as const;

export interface RevOpsExportDocument {
  templateVersion: string;
  receiptHash: string;
  receiptRevision: number;
  workspaceRevision: number;
  period: string;
  filename: string;
  sheets: { name: string; rows: (string | number | null)[][] }[];
}
export const RevOpsReconciliationSchema = z
  .object({
    period: RevOpsPeriod,
    importKey: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .optional(),
    decisions: z
      .array(
        z
          .object({
            row: z.number().int().positive(),
            date: RevOpsDate,
            choice: z.enum(["keep", "use"]),
            reason: z.string().trim().min(3).max(1000),
          })
          .strict(),
      )
      .max(366)
      .default([]),
  })
  .strict();
export type RevOpsReconciliation = z.infer<typeof RevOpsReconciliationSchema>;
export interface RevOpsImportRow {
  row: number;
  date?: string;
  status: "new" | "unchanged" | "conflict" | "invalid";
  saved?: RevOpsActual;
  incoming?: { count: number; fields: RevOpsFieldSnapshot[] };
  issues: string[];
}
export type RevOpsReconciliationOutcome =
  | "inserted"
  | "corrected"
  | "unchanged"
  | "kept";
export interface RevOpsReconciliationPlan {
  period: string;
  commands: RevOpsCommand[];
  commandRows: number[];
  rows: (Omit<RevOpsImportRow, "status" | "issues"> & {
    date: string;
    outcome: RevOpsReconciliationOutcome;
    reason?: string;
  })[];
  counts: Record<RevOpsReconciliationOutcome, number>;
  patientDayChange: number;
}
export interface RevOpsReconciliationReceipt {
  importKey: string;
  period: string;
  source: RevOpsSource;
  actorId: string;
  at: string;
  revision: number;
  rows: (RevOpsReconciliationPlan["rows"][number] & {
    actualRevision: number;
  })[];
  counts: RevOpsReconciliationPlan["counts"];
  patientDayChange: number;
}
export interface RevOpsState {
  customFields?: RevOpsCustomField[];
  setupValues?: RevOpsFieldSnapshot[];
  unit: string;
  timezone: string;
  field: {
    id: "cost-center";
    label: string;
    options: string[];
    archived: boolean;
    version: number;
  };
  grants: Record<string, RevOpsPermission[]>;
  budgets: RevOpsBudget[];
  actuals: Record<string, RevOpsActual[]>;
  closedPeriods: string[];
  acceptedImports: string[];
}
export interface RevOpsView {
  id: string;
  name: string;
  revision: number;
  state: RevOpsState;
  permissions: RevOpsPermission[];
  isAdmin: boolean;
}
