import { z } from "zod";

export const REV_OPS_PERMISSIONS = [
  "view",
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

export const RevOpsCommandSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("grant"),
      userId: text,
      permissions: z.array(z.enum(REV_OPS_PERMISSIONS)).max(7),
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
    })
    .strict(),
  z.object({ action: z.literal("approve"), budgetId: text }).strict(),
  z
    .object({
      action: z.literal("actual"),
      date: RevOpsDate,
      count: RevOpsCount,
    })
    .strict(),
  z
    .object({
      action: z.literal("correct"),
      date: RevOpsDate,
      count: RevOpsCount,
      reason: z.string().trim().min(3).max(1000),
    })
    .strict(),
  z
    .object({
      action: z.literal("close"),
      period: RevOpsPeriod,
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
}
export interface RevOpsBudget {
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
  count: number;
  source: RevOpsSource;
  actorId: string;
  at: string;
  cutoffInstant: string;
  reason?: string;
}
export interface RevOpsState {
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
