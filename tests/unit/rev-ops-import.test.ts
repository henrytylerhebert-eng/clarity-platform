import { expect, it } from "vitest";
import ExcelJS from "exceljs";
import { parseRevOpsUpload } from "../../packages/api-service/src/revOpsImport.js";
import { createRevOpsState } from "../../packages/rev-ops-service/src/index.js";

const state = () =>
  createRevOpsState({
    name: "Synthetic",
    unit: "Adult",
    timezone: "America/Chicago",
    costCenterLabel: "Cost center",
    costCenterOptions: ["Inpatient"],
  });
const csv = (text: string) => ({
  kind: "actuals" as const,
  name: "actuals.csv",
  content: Buffer.from(text).toString("base64"),
  mapping: {},
});

it("rejects whitespace and non-decimal counts instead of manufacturing zero or one", async () => {
  const result = await parseRevOpsUpload(
    csv(
      "activity_date,patient_days\n2028-02-01,   \n2028-02-02,0x10\n2028-02-03,0\n",
    ),
    state(),
  );
  expect(result.issues.map((i) => i.row)).toEqual([2, 3]);
  expect(result.commands).toEqual([
    { action: "actual", date: "2028-02-03", count: 0 },
  ]);
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("Actuals");
  sheet.addRow(["activity_date", "patient_days"]);
  sheet.addRow(["2028-02-01", true]);
  const parsed = await parseRevOpsUpload(
    {
      ...csv(""),
      name: "actuals.xlsx",
      content: Buffer.from(await wb.xlsx.writeBuffer()).toString("base64"),
    },
    state(),
  );
  expect(parsed.issues).toHaveLength(1);
});

it("preserves physical CSV line references through blank lines and quoted newlines", async () => {
  const result = await parseRevOpsUpload(
    csv(
      'activity_date,patient_days,note\n\n2028-02-01,9,"two\nlines"\n2028-02-02,10,ok\n',
    ),
    state(),
  );
  expect(result.source.rows).toEqual([3, 5]);
});

it("previews closed periods as unresolved rows before commit", async () => {
  const s = state();
  s.closedPeriods.push("2028-02");
  const result = await parseRevOpsUpload(
    csv("activity_date,patient_days\n2028-02-01,9\n"),
    s,
  );
  expect(result.issues).toEqual([
    { row: 2, message: "Period is closed; authorized reopening required" },
  ]);
});

it("rejects forged ZIP expansion sizes before loading workbook cells", async () => {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("Actuals");
  sheet.addRow(["activity_date", "patient_days", "note"]);
  sheet.addRow(["2028-02-01", 9, "x".repeat(11 * 1024 * 1024)]);
  const bytes = Buffer.from(await wb.xlsx.writeBuffer());
  for (let i = 0; i < bytes.length - 46; i++)
    if (
      bytes.readUInt32LE(i) === 0x02014b50 &&
      bytes.readUInt32LE(i + 24) > 10 * 1024 * 1024
    )
      bytes.writeUInt32LE(1, i + 24);
  await expect(
    parseRevOpsUpload(
      { ...csv(""), name: "forged.xlsx", content: bytes.toString("base64") },
      state(),
    ),
  ).rejects.toMatchObject({ status: 400 });
});
