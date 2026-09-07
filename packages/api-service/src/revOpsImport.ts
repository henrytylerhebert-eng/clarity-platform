import { createHash } from "node:crypto";
import { inflateRawSync } from "node:zlib";
import { parse } from "csv-parse/sync";
import ExcelJS from "exceljs";
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

// Validate the same complete directory ExcelJS/JSZip will read, then bound
// actual decompression. Only ordinary single-disk ZIP containers are supported.
function checkZip(bytes: Buffer) {
  // JSZip selects the last signature, including any inside a ZIP comment.
  const end = bytes.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (
    end < 0 ||
    end + 22 > bytes.length ||
    end + 22 + bytes.readUInt16LE(end + 20) !== bytes.length ||
    bytes.readUInt16LE(end + 4) !== 0 ||
    bytes.readUInt16LE(end + 6) !== 0
  )
    throw new RevOpsError("invalid_workbook", 400);
  const entries = bytes.readUInt16LE(end + 10);
  const directory = bytes.readUInt32LE(end + 16);
  if (
    bytes.readUInt16LE(end + 8) !== entries ||
    directory + bytes.readUInt32LE(end + 12) !== end
  )
    throw new RevOpsError("invalid_workbook", 400);
  let offset = directory;
  let count = 0;
  let size = 0;
  const limit = 10 * 1024 * 1024;
  if (entries > 200 || entries === 0)
    throw new RevOpsError("workbook_too_large", 413);
  while (offset < end) {
    if (
      ++count > entries ||
      offset + 46 > end ||
      bytes.readUInt32LE(offset) !== 0x02014b50
    )
      throw new RevOpsError("invalid_workbook", 400);
    const extraStart = offset + 46 + bytes.readUInt16LE(offset + 28);
    const extraEnd = extraStart + bytes.readUInt16LE(offset + 30);
    const next = extraEnd + bytes.readUInt16LE(offset + 32);
    if (next > end || bytes.readUInt16LE(offset + 34) !== 0)
      throw new RevOpsError("invalid_workbook", 400);
    // Reject ZIP64 overrides and malformed extra fields before a second parser
    // can interpret sizes or offsets differently.
    for (let extra = extraStart; extra < extraEnd; ) {
      if (extra + 4 > extraEnd || bytes.readUInt16LE(extra) === 0x0001)
        throw new RevOpsError("invalid_workbook", 400);
      extra += 4 + bytes.readUInt16LE(extra + 2);
      if (extra > extraEnd) throw new RevOpsError("invalid_workbook", 400);
    }
    const declaredSize = bytes.readUInt32LE(offset + 24);
    const compressedSize = bytes.readUInt32LE(offset + 20);
    const local = bytes.readUInt32LE(offset + 42);
    const method = bytes.readUInt16LE(offset + 10);
    if (declaredSize > limit - size)
      throw new RevOpsError("workbook_too_large", 413);
    if (
      local + 30 > directory ||
      bytes.readUInt32LE(local) !== 0x04034b50 ||
      ![0, 8].includes(method) ||
      bytes.readUInt16LE(local + 8) !== method ||
      bytes.readUInt16LE(local + 6) !== bytes.readUInt16LE(offset + 8) ||
      (bytes.readUInt16LE(offset + 8) & 1) !== 0
    )
      throw new RevOpsError("invalid_workbook", 400);
    const start =
      local +
      30 +
      bytes.readUInt16LE(local + 26) +
      bytes.readUInt16LE(local + 28);
    if (start + compressedSize > directory)
      throw new RevOpsError("invalid_workbook", 400);
    const compressed = bytes.subarray(start, start + compressedSize);
    let actualSize: number;
    try {
      actualSize =
        method === 0
          ? compressed.length
          : inflateRawSync(compressed, {
              maxOutputLength: Math.max(1, limit - size),
            }).length;
    } catch {
      throw new RevOpsError("invalid_or_oversized_workbook", 400);
    }
    if (actualSize !== declaredSize)
      throw new RevOpsError("invalid_workbook", 400);
    size += actualSize;
    if (size > limit) throw new RevOpsError("workbook_too_large", 413);
    offset = next;
  }
  if (count !== entries) throw new RevOpsError("invalid_workbook", 400);
}
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
      checkZip(bytes);
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(bytes as never);
      const sheet = input.sheet
        ? wb.getWorksheet(input.sheet)
        : wb.worksheets[0];
      if (!sheet || sheet.rowCount > 401 || sheet.columnCount > 40)
        throw new RevOpsError("worksheet_missing_or_too_large", 400);
      selectedSheet = sheet.name;
      const cell = (value: ExcelJS.CellValue): unknown => {
        if (value instanceof Date) return value.toISOString().slice(0, 10);
        if (typeof value === "object" && value !== null)
          return "[formula or object: export reviewed values]";
        return value ?? "";
      };
      headers = Array.from({ length: sheet.columnCount }, (_, i) =>
        String(cell(sheet.getRow(1).getCell(i + 1).value)),
      );
      records = Array.from({ length: sheet.rowCount - 1 }, (_, r) =>
        Array.from({ length: headers.length }, (_, c) =>
          cell(sheet.getRow(r + 2).getCell(c + 1).value),
        ),
      );
      sourceRows = records.map((_, i) => i + 2);
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
