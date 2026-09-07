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

it("rejects understated ZIP entry counts that hide oversized workbook data", async () => {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("Actuals");
  sheet.addRow(["activity_date", "patient_days", "note"]);
  sheet.addRow(["2028-02-01", 9, "x".repeat(11 * 1024 * 1024)]);
  const bytes = Buffer.from(await wb.xlsx.writeBuffer());
  const end = bytes.length - 22;
  expect(bytes.readUInt16LE(end + 10)).toBeGreaterThan(1);
  bytes.writeUInt16LE(1, end + 8);
  bytes.writeUInt16LE(1, end + 10);
  await expect(
    parseRevOpsUpload(
      {
        ...csv(""),
        name: "forged-count.xlsx",
        content: bytes.toString("base64"),
      },
      state(),
    ),
  ).rejects.toBeDefined();
});

async function workbookBytes(compression: "STORE" | "DEFLATE" = "DEFLATE") {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("Actuals");
  sheet.addRow(["activity_date", "patient_days"]);
  sheet.addRow(["2028-02-01", 9]);
  return Buffer.from(await wb.xlsx.writeBuffer({ zip: { compression } }));
}

it.each(["STORE", "DEFLATE"] as const)(
  "accepts a valid %s workbook with a ZIP comment",
  async (compression) => {
    const original = await workbookBytes(compression);
    const comment = Buffer.from("Synthetic compatibility fixture");
    original.writeUInt16LE(comment.length, original.length - 2);
    const result = await parseRevOpsUpload(
      {
        ...csv(""),
        name: "valid.xlsx",
        content: Buffer.concat([original, comment]).toString("base64"),
      },
      state(),
    );
    expect(result.issues).toEqual([]);
    expect(result.commands).toEqual([
      { action: "actual", date: "2028-02-01", count: 9 },
    ]);
  },
);

it.each([
  "overstated count",
  "inconsistent disk count",
  "short directory",
  "shifted directory",
  "multiple disks",
  "ZIP64 offset",
  "truncated record",
  "trailing bytes",
  "comment signature",
])("rejects ambiguous ZIP metadata: %s", async (variant) => {
  let bytes = await workbookBytes();
  const end = bytes.length - 22;
  const directory = bytes.readUInt32LE(end + 16);
  switch (variant) {
    case "overstated count":
      bytes.writeUInt16LE(bytes.readUInt16LE(end + 10) + 1, end + 8);
      bytes.writeUInt16LE(bytes.readUInt16LE(end + 8), end + 10);
      break;
    case "inconsistent disk count":
      bytes.writeUInt16LE(1, end + 8);
      break;
    case "short directory":
      bytes.writeUInt32LE(bytes.readUInt32LE(end + 12) - 1, end + 12);
      break;
    case "shifted directory":
      bytes.writeUInt32LE(directory - 1, end + 16);
      bytes.writeUInt32LE(bytes.readUInt32LE(end + 12) + 1, end + 12);
      break;
    case "multiple disks":
      bytes.writeUInt16LE(1, end + 4);
      break;
    case "ZIP64 offset":
      bytes.writeUInt32LE(0xffffffff, directory + 42);
      break;
    case "truncated record":
      bytes.writeUInt16LE(0xffff, directory + 30);
      break;
    case "trailing bytes":
      bytes = Buffer.concat([bytes, Buffer.from("trailing")]);
      break;
    case "comment signature":
      bytes.writeUInt16LE(4, end + 20);
      bytes = Buffer.concat([bytes, Buffer.from([0x50, 0x4b, 0x05, 0x06])]);
      break;
  }
  await expect(
    parseRevOpsUpload(
      { ...csv(""), name: "ambiguous.xlsx", content: bytes.toString("base64") },
      state(),
    ),
  ).rejects.toMatchObject({ status: 400 });
});
