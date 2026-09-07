import { createRequire } from "node:module";
import { expect, it, vi } from "vitest";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import { parseRevOpsUpload } from "../../packages/api-service/src/revOpsImport.js";
import { createRevOpsState } from "../../packages/rev-ops-service/src/index.js";

const state = () =>
  createRevOpsState({
    name: "Synthetic",
    unit: "Geriatric",
    timezone: "America/Chicago",
    costCenterLabel: "Cost center",
    costCenterOptions: ["Inpatient"],
  });
async function fixture() {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("Actuals");
  sheet.addRow(["activity_date", "patient_days"]);
  sheet.addRow([new Date("2028-02-01T00:00:00Z"), 9]);
  sheet.getCell("A2").numFmt = "yyyy-mm-dd";
  wb.addWorksheet("Notes").getCell("A1").value = "Synthetic";
  return JSZip.loadAsync(await wb.xlsx.writeBuffer());
}
async function parse(zip: JSZip) {
  return parseRevOpsUpload(
    {
      kind: "actuals",
      name: "synthetic.xlsx",
      sheet: "Actuals",
      content: (
        await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" })
      ).toString("base64"),
      mapping: {},
    },
    state(),
  );
}

it("rejects huge merges in an unselected worksheet before model expansion", async () => {
  const zip = await fixture();
  const path = "xl/worksheets/sheet2.xml";
  zip.file(
    path,
    (await zip.file(path)!.async("string")).replace(
      "</sheetData>",
      '</sheetData><mergeCells count="1"><mergeCell ref="A1:XFD1048576"/></mergeCells>',
    ),
  );
  // Safety guard keeps this regression safe even when run against old code.
  const require = createRequire(import.meta.url);
  const Worksheet = require("exceljs/lib/doc/worksheet.js");
  const guard = vi
    .spyOn(Worksheet.prototype, "_mergeCellsInternal")
    .mockImplementation(() => {
      throw new Error("Test guard: unsafe expansion reached");
    });
  try {
    await expect(parse(zip)).rejects.toMatchObject({
      code: "worksheet_missing_or_too_large",
    });
    expect(guard).not.toHaveBeenCalled();
  } finally {
    guard.mockRestore();
  }
});

it("accepts prefixed spreadsheet namespaces without rewriting the uploaded file", async () => {
  const zip = await fixture();
  for (const name of [
    "xl/workbook.xml",
    "xl/styles.xml",
    "xl/sharedStrings.xml",
    "xl/worksheets/sheet1.xml",
    "xl/worksheets/sheet2.xml",
  ]) {
    const xml = await zip.file(name)!.async("string");
    zip.file(
      name,
      xml
        .replace(
          'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"',
          'xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main"',
        )
        .replace(/<(\/?)([A-Za-z][\w-]*)(?=[\s/>])/g, "<$1x:$2"),
    );
  }
  const result = await parse(zip);
  expect(result.issues).toEqual([]);
  expect(result.commands).toEqual([
    { action: "actual", date: "2028-02-01", count: 9 },
  ]);
  expect(result.source.rows).toEqual([2]);
});

it.each([
  [
    "merge",
    '<mergeCells count="1"><mergeCell ref="A1:XFD1048576"/></mergeCells>',
  ],
  ["dimension", '<dimension ref="A1:XFD1048576"/>'],
  ["columns", '<cols><col min="1" max="16384" width="10"/></cols>'],
  [
    "validation",
    '<dataValidations><dataValidation sqref="A1:XFD1048576"/></dataValidations>',
  ],
  [
    "row",
    '<sheetData><row r="1048576"><c r="A1048576"><v>1</v></c></row></sheetData>',
  ],
  [
    "column",
    '<sheetData><row r="1"><c r="XFD1"><v>1</v></c></row></sheetData>',
  ],
])("bounds unused worksheet %s declarations", async (_name, content) => {
  const zip = await fixture();
  zip.file(
    "xl/worksheets/sheet2.xml",
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${content}</worksheet>`,
  );
  await expect(parse(zip)).rejects.toMatchObject({
    code: "worksheet_missing_or_too_large",
    status: 400,
  });
});

it("ignores declared string counts and reads only actual strings", async () => {
  const zip = await fixture();
  const path = "xl/sharedStrings.xml";
  zip.file(
    path,
    (await zip.file(path)!.async("string")).replace(
      /uniqueCount="\d+"/,
      'uniqueCount="4294967295"',
    ),
  );
  expect((await parse(zip)).commands).toEqual([
    { action: "actual", date: "2028-02-01", count: 9 },
  ]);
});

it.each([
  "doctype",
  "depth",
  "duplicate cell",
  "invalid shared string",
  "invalid number",
])("rejects %s without model loading", async (variant) => {
  const zip = await fixture();
  const path = "xl/worksheets/sheet1.xml";
  let xml = await zip.file(path)!.async("string");
  if (variant === "doctype")
    xml = xml.replace(
      "<worksheet",
      '<!DOCTYPE worksheet [<!ENTITY example "bad">]><worksheet',
    );
  if (variant === "depth")
    xml = xml.replace(
      "</worksheet>",
      "<ext>".repeat(33) + "</ext>".repeat(33) + "</worksheet>",
    );
  if (variant === "duplicate cell")
    xml = xml.replace("</row>", '<c r="A1"><v>9</v></c></row>');
  if (variant === "invalid shared string")
    xml = xml.replace(/(<c[^>]*t="s"[^>]*><v>)\d+/, "$1999999999");
  if (variant === "invalid number")
    xml = xml.replace("<v>9</v>", "<v>0x10</v>");
  zip.file(path, xml);
  await expect(parse(zip)).rejects.toMatchObject({ status: 400 });
});

it("preserves Excel dates in the 1904 epoch and rejects cached formula values", async () => {
  const wb = new ExcelJS.Workbook();
  wb.properties.date1904 = true;
  const sheet = wb.addWorksheet("Actuals");
  sheet.addRow(["activity_date", "patient_days"]);
  sheet.addRow([new Date("2028-02-01T00:00:00Z"), 0]);
  sheet.addRow([
    new Date("2028-02-02T00:00:00Z"),
    { formula: "1+1", result: 2 },
  ]);
  sheet.getCell("A2").numFmt = "mm/dd/yyyy";
  sheet.getCell("A3").numFmt = "mm/dd/yyyy";
  const result = await parse(
    await JSZip.loadAsync(await wb.xlsx.writeBuffer()),
  );
  expect(result.commands).toEqual([
    { action: "actual", date: "2028-02-01", count: 0 },
  ]);
  expect(result.issues).toEqual([
    { row: 3, message: "Missing or invalid mapped value" },
  ]);
});

it("reads inline text and ISO dates while preserving blank versus zero", async () => {
  const zip = await fixture();
  zip.file(
    "xl/worksheets/sheet1.xml",
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>
    <row r="1"><c r="A1" t="inlineStr"><is><t>activity_date</t></is></c><c r="B1" t="inlineStr"><is><t>patient_days</t></is></c></row>
    <row r="2"><c r="A2" t="d"><v>2028-02-01</v></c><c r="B2"><v>0</v></c></row>
    <row r="3"><c r="A3" t="d"><v>2028-02-02</v></c><c r="B3"/></row>
    </sheetData></worksheet>`,
  );
  const result = await parse(zip);
  expect(result.commands).toEqual([
    { action: "actual", date: "2028-02-01", count: 0 },
  ]);
  expect(result.issues).toHaveLength(1);
});
