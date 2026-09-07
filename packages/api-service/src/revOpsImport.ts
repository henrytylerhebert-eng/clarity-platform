import { createHash } from "node:crypto";
import { parse } from "csv-parse/sync";
import { readRevOpsXlsx } from "./revOpsXlsx.js";
import { z } from "zod";
import {
  RevOpsCommandSchema,
  RevOpsDate,
  type RevOpsCommand,
  type RevOpsSource,
  type RevOpsState,
} from "../../domain-contracts/src/revOps.js";
import { RevOpsError } from "../../rev-ops-service/src/index.js";

export const RevOpsUploadSchema = z
  .object({
    kind: z.enum(["budget", "actuals"]),
    name: z.string().trim().min(1).max(160),
    content: z.string().max(1400000),
    sheet: z.string().max(100).optional(),
    // Explicit column mapping is saved in audit alongside the source hash.
    mapping: z
      .object({
        date: z.string().max(100).optional(),
        count: z.string().max(100).optional(),
        period: z.string().max(100).optional(),
        total: z.string().max(100).optional(),
        costCenter: z.string().max(100).optional(),
      })
      .strict(),
  })
  .strict();
export type RevOpsUpload = z.infer<typeof RevOpsUploadSchema>;
const number = (v: unknown) => {
  if (typeof v === "number") return v;
  if (typeof v !== "string" || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(v.trim()))
    return NaN;
  return Number(v.trim());
};

export async function parseRevOpsUpload(
  input: RevOpsUpload,
  state: RevOpsState,
) {
  const bytes = Buffer.from(input.content, "base64");
  if (!bytes.length || bytes.length > 1024 * 1024)
    throw new RevOpsError("upload_too_large_or_empty", 413);
  let headers: string[];
  let records: unknown[][];
  let sourceRows: number[];
  let selectedSheet: string | undefined;
  try {
    if (/\.csv$/i.test(input.name)) {
      const rows = parse(bytes.toString("utf8"), {
        bom: true,
        skip_empty_lines: true,
        max_record_size: 10000,
        relax_column_count: false,
        info: true,
        raw: true,
      }) as unknown as {
        record: string[];
        raw: string;
        info: { lines: number };
      }[];
      headers = rows.shift()?.record ?? [];
      records = rows.map((r) => r.record);
      sourceRows = rows.map(
        (r) =>
          r.info.lines -
          (r.raw
            .replace(/^(?:\r\n|\n|\r)+/, "")
            .trimEnd()
            .match(/\r\n|\n|\r/g)?.length ?? 0),
      );
    } else if (/\.xlsx$/i.test(input.name)) {
      const table = readRevOpsXlsx(bytes, input.sheet);
      headers = table.headers;
      records = table.records;
      sourceRows = table.sourceRows;
      selectedSheet = table.sheet;
    } else throw new RevOpsError("csv_or_xlsx_required", 400);
  } catch (e) {
    if (e instanceof RevOpsError) throw e;
    throw new RevOpsError("invalid_upload", 400);
  }
  headers = headers.map((h) => h.trim());
  if (
    !records.length ||
    records.length > 366 ||
    headers.length > 40 ||
    new Set(headers).size !== headers.length
  )
    throw new RevOpsError("invalid_upload_shape", 400);
  const issues: { row: number; message: string }[] = [];
  const commands: RevOpsCommand[] = [];
  const commandRows: number[] = [];
  const seen = new Set<string>();
  const get = (
    row: unknown[],
    key: keyof RevOpsUpload["mapping"],
    fallback: string,
  ) => row[headers.indexOf(input.mapping[key] ?? fallback)];
  records.forEach((row, i) => {
    const sourceRow = sourceRows[i]!;
    const raw =
      input.kind === "budget"
        ? {
            action: "budget",
            period: String(get(row, "period", "period") ?? ""),
            total: number(get(row, "total", "monthly_budget")),
            costCenter: String(get(row, "costCenter", "cost_center") ?? ""),
          }
        : {
            action: "actual",
            date: String(get(row, "date", "activity_date") ?? ""),
            count: number(get(row, "count", "patient_days")),
          };
    const parsed = RevOpsCommandSchema.safeParse(raw);
    if (!parsed.success) {
      issues.push({
        row: sourceRow,
        message: "Missing or invalid mapped value",
      });
      return;
    }
    const cmd = parsed.data;
    const key =
      cmd.action === "budget"
        ? cmd.period
        : cmd.action === "actual"
          ? cmd.date
          : "";
    if (seen.has(key))
      issues.push({
        row: sourceRow,
        message:
          "Duplicate period/date; upload detail or a single monthly total, not both",
      });
    seen.add(key);
    if (state.closedPeriods.includes(key.slice(0, 7)))
      issues.push({
        row: sourceRow,
        message: "Period is closed; authorized reopening required",
      });
    if (
      cmd.action === "budget" &&
      (state.field.archived || !state.field.options.includes(cmd.costCenter))
    )
      issues.push({
        row: sourceRow,
        message: "Unmapped or archived cost center",
      });
    if (cmd.action === "actual") {
      RevOpsDate.parse(cmd.date);
      const current = state.actuals[cmd.date]?.at(-1);
      if (current && current.count !== cmd.count)
        issues.push({
          row: sourceRow,
          message:
            "Conflicts with existing actual; use correction with a reason",
        });
    }
    commands.push(cmd);
    commandRows.push(sourceRow);
  });
  const hash = createHash("sha256").update(bytes).digest("hex");
  const importKey = createHash("sha256")
    .update(
      JSON.stringify({
        hash,
        kind: input.kind,
        sheet: input.sheet ?? "",
        mapping: input.mapping,
      }),
    )
    .digest("hex");
  const replayed = state.acceptedImports.includes(importKey);
  const source: RevOpsSource = {
    kind: "upload",
    name: input.name,
    sha256: hash,
    rows: commandRows,
    ...(selectedSheet ? { sheet: selectedSheet } : {}),
    mapping: input.mapping,
  };
  return {
    headers,
    commands,
    issues: replayed ? [] : issues,
    source,
    importKey,
    replayed,
    mapping: input.mapping,
  };
}
