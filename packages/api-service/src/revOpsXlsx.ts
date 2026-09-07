import { inflateRawSync } from "node:zlib";
import { posix } from "node:path";
import { SaxesParser, type SaxesTagNS } from "saxes";
import { RevOpsError } from "../../rev-ops-service/src/index.js";

// Decode once from the validated complete directory. No second ZIP/model parser
// can reinterpret unchecked records. Only single-disk, non-ZIP64 files are supported.
function readZip(bytes: Buffer): Map<string, Buffer> {
  const files = new Map<string, Buffer>();
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
    const nameBytes = bytes.subarray(offset + 46, extraStart);
    const name = nameBytes.toString("utf8");
    if (
      !name ||
      name.includes("\\") ||
      name.startsWith("/") ||
      name.includes("\0") ||
      name.split("/").includes("..") ||
      files.has(name) ||
      !nameBytes.equals(
        bytes.subarray(local + 30, local + 30 + bytes.readUInt16LE(local + 26)),
      )
    )
      throw new RevOpsError("invalid_workbook", 400);
    let content: Buffer;
    try {
      content =
        method === 0
          ? compressed
          : inflateRawSync(compressed, {
              maxOutputLength: Math.max(1, limit - size),
            });
    } catch {
      throw new RevOpsError("invalid_or_oversized_workbook", 400);
    }
    if (content.length !== declaredSize)
      throw new RevOpsError("invalid_workbook", 400);
    size += content.length;
    if (size > limit) throw new RevOpsError("workbook_too_large", 413);
    files.set(name, content);
    offset = next;
  }
  if (count !== entries) throw new RevOpsError("invalid_workbook", 400);
  return files;
}

const MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const REL =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const PACKAGE_REL =
  "http://schemas.openxmlformats.org/package/2006/relationships";
const INVALID_CELL = "[formula or object: export reviewed values]";
const MAX_ROWS = 401;
const MAX_COLS = 40;
const attr = (tag: SaxesTagNS, name: string, uri = "") =>
  Object.values(tag.attributes).find((a) => a.local === name && a.uri === uri)
    ?.value;
function integer(value: string | undefined, max: number, min = 0): number {
  if (!value || !/^\d+$/.test(value))
    throw new RevOpsError("invalid_workbook", 400);
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < min || n > max)
    throw new RevOpsError("worksheet_missing_or_too_large", 400);
  return n;
}
function cellAddress(value: string): [number, number] {
  const m = /^\$?([A-Z]{1,3})\$?([1-9]\d{0,6})$/.exec(value);
  if (!m) throw new RevOpsError("worksheet_missing_or_too_large", 400);
  const col = [...m[1]!].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0);
  return [integer(m[2], MAX_ROWS, 1), integer(String(col), MAX_COLS, 1)];
}
function boundedRanges(value: string) {
  const ranges = value.trim().split(/\s+/);
  if (ranges.length > 1000)
    throw new RevOpsError("worksheet_missing_or_too_large", 400);
  for (const range of ranges) {
    const ends = range.split(":");
    if (ends.length > 2) throw new RevOpsError("invalid_workbook", 400);
    const start = cellAddress(ends[0]!);
    const end = cellAddress(ends[1] ?? ends[0]!);
    if (start[0] > end[0] || start[1] > end[1])
      throw new RevOpsError("invalid_workbook", 400);
  }
}

// Namespace-aware SAX callbacks never materialize formatting, merges, validation
// ranges, drawings or relationships as workbook objects. XML work is bounded too.
export function readRevOpsXlsx(bytes: Buffer, selected?: string) {
  const files = readZip(bytes);
  let nodes = 0,
    totalCells = 0;
  function xml(
    name: string,
    rootName: string,
    namespace: string,
    open: (tag: SaxesTagNS, path: string) => void,
    text?: (value: string, path: string) => void,
    close?: (tag: SaxesTagNS, path: string) => void,
  ) {
    const content = files.get(name);
    if (!content) throw new RevOpsError("invalid_workbook", 400);
    const parser = new SaxesParser({ xmlns: true });
    const path: string[] = [];
    parser.on("doctype", () => {
      throw new RevOpsError("workbook_doctype_not_allowed", 400);
    });
    parser.on("error", () => {
      throw new RevOpsError("invalid_workbook_xml", 400);
    });
    parser.on("opentag", (tag) => {
      if (
        ++nodes > 200000 ||
        path.length >= 32 ||
        Object.keys(tag.attributes).length > 64
      )
        throw new RevOpsError("workbook_xml_too_complex", 400);
      if (!path.length && (tag.local !== rootName || tag.uri !== namespace))
        throw new RevOpsError("invalid_workbook_xml", 400);
      path.push(tag.uri === namespace ? tag.local : "?");
      open(tag, path.join("/"));
    });
    const onText = (value: string) => text?.(value, path.join("/"));
    parser.on("text", onText);
    parser.on("cdata", onText);
    parser.on("closetag", (tag) => {
      close?.(tag, path.join("/"));
      path.pop();
    });
    // Decode explicitly rather than silently interpreting UTF-16 as UTF-8.
    const source = new TextDecoder("utf-8", { fatal: true }).decode(content);
    for (let i = 0; i < source.length; i += 16384)
      parser.write(source.slice(i, i + 16384));
    parser.close();
  }
  const sheets: { name: string; id: string }[] = [];
  let date1904 = false;
  xml("xl/workbook.xml", "workbook", MAIN, (tag, path) => {
    if (path === "workbook/workbookPr")
      date1904 = ["1", "true"].includes(attr(tag, "date1904") ?? "");
    if (path === "workbook/sheets/sheet") {
      const name = attr(tag, "name"),
        id = attr(tag, "id", REL);
      if (
        !name ||
        !id ||
        sheets.length >= 200 ||
        sheets.some((s) => s.name === name || s.id === id)
      )
        throw new RevOpsError("invalid_workbook", 400);
      sheets.push({ name, id });
    }
  });
  const sheet = selected ? sheets.find((s) => s.name === selected) : sheets[0];
  if (!sheet) throw new RevOpsError("worksheet_missing_or_too_large", 400);
  const relationships = new Map<string, string>();
  const relationshipIds = new Set<string>();
  xml(
    "xl/_rels/workbook.xml.rels",
    "Relationships",
    PACKAGE_REL,
    (tag, path) => {
      if (path !== "Relationships/Relationship") return;
      const id = attr(tag, "Id"),
        target = attr(tag, "Target"),
        type = attr(tag, "Type");
      if (!id || !target || relationshipIds.has(id))
        throw new RevOpsError("invalid_workbook", 400);
      relationshipIds.add(id);
      if (type !== `${REL}/worksheet`) return;
      const resolved = target.startsWith("/")
        ? posix.normalize(target.slice(1))
        : posix.normalize(posix.join("xl", target));
      if (
        attr(tag, "TargetMode") === "External" ||
        !/^xl\/worksheets\/[^/]+\.xml$/.test(resolved)
      )
        throw new RevOpsError("invalid_workbook", 400);
      relationships.set(id, resolved);
    },
  );
  const selectedPath = relationships.get(sheet.id);
  if (
    !selectedPath ||
    sheets.some((s) => !files.has(relationships.get(s.id) ?? ""))
  )
    throw new RevOpsError("invalid_workbook", 400);

  const formats = new Map<number, string>();
  const styles: number[] = [];
  if (files.has("xl/styles.xml"))
    xml("xl/styles.xml", "styleSheet", MAIN, (tag, path) => {
      if (path === "styleSheet/numFmts/numFmt") {
        const id = integer(attr(tag, "numFmtId"), 65535);
        if (formats.size >= 1000 || formats.has(id))
          throw new RevOpsError("workbook_xml_too_complex", 400);
        formats.set(id, attr(tag, "formatCode") ?? "");
      }
      if (path === "styleSheet/cellXfs/xf") {
        if (styles.length >= 1000)
          throw new RevOpsError("workbook_xml_too_complex", 400);
        styles.push(integer(attr(tag, "numFmtId") ?? "0", 65535));
      }
    });
  const shared: string[] = [];
  let sharedText = "",
    rich = false;
  if (files.has("xl/sharedStrings.xml"))
    xml(
      "xl/sharedStrings.xml",
      "sst",
      MAIN,
      (_tag, path) => {
        if (path === "sst/si") {
          sharedText = "";
          rich = false;
        }
        if (path === "sst/si/r") rich = true;
      },
      (value, path) => {
        if (path === "sst/si/t" || path === "sst/si/r/t") {
          sharedText += value;
          if (sharedText.length > 32767)
            throw new RevOpsError("workbook_cell_too_large", 400);
        }
      },
      (_tag, path) => {
        if (path === "sst/si") {
          if (shared.length >= 100000)
            throw new RevOpsError("workbook_xml_too_complex", 400);
          shared.push(rich ? INVALID_CELL : sharedText);
        }
      },
    );
  function valueOf(
    type: string,
    value: string,
    style: string | undefined,
  ): unknown {
    if (type === "s") return shared[integer(value, shared.length - 1)];
    if (type === "inlineStr" || type === "str") return value;
    if (type === "b") return value === "1";
    if (type === "e") return INVALID_CELL;
    if (type === "d") {
      const d = new Date(value);
      if (!Number.isFinite(d.getTime()))
        throw new RevOpsError("invalid_workbook", 400);
      return d.toISOString().slice(0, 10);
    }
    if (type && type !== "n") throw new RevOpsError("invalid_workbook", 400);
    if (!value.trim()) return "";
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[Ee][+-]?\d+)?$/.test(value.trim()))
      throw new RevOpsError("invalid_workbook", 400);
    const n = Number(value);
    if (!Number.isFinite(n)) throw new RevOpsError("invalid_workbook", 400);
    const format =
      style === undefined ? 0 : styles[integer(style, styles.length - 1)];
    const code = (formats.get(format ?? 0) ?? "").replace(
      /"[^"]*"|\\.|\[[^\]]*\]/g,
      "",
    );
    const isDate =
      (format !== undefined &&
        ((format >= 14 && format <= 22) ||
          (format >= 27 && format <= 36) ||
          (format >= 45 && format <= 47) ||
          (format >= 50 && format <= 58))) ||
      /[ymdhis]/i.test(code);
    if (!isDate) return n;
    const date = new Date(
      Math.round((n + (date1904 ? 1462 : 0) - 25569) * 86400000),
    );
    if (!Number.isFinite(date.getTime()))
      throw new RevOpsError("invalid_workbook", 400);
    return date.toISOString().slice(0, 10);
  }
  let selectedRows = new Map<number, Map<number, unknown>>();
  let maxRow = 0,
    maxCol = 0;
  for (const [name] of files) {
    if (!/^xl\/worksheets\/[^/]+\.xml$/.test(name)) continue;
    const rows = new Map<number, Map<number, unknown>>();
    let rowNumber = 0;
    let current:
      | {
          col: number;
          type: string;
          style?: string;
          value: string;
          formula: boolean;
          rich: boolean;
        }
      | undefined;
    xml(
      name,
      "worksheet",
      MAIN,
      (tag, path) => {
        if (tag.uri !== MAIN) return;
        if (
          ["dimension", "mergeCell", "autoFilter", "f"].includes(tag.local) &&
          attr(tag, "ref")
        )
          boundedRanges(attr(tag, "ref")!);
        if (attr(tag, "sqref")) boundedRanges(attr(tag, "sqref")!);
        if (path === "worksheet/cols/col") {
          integer(attr(tag, "min"), MAX_COLS, 1);
          integer(attr(tag, "max"), MAX_COLS, 1);
        }
        if (path === "worksheet/sheetData/row") {
          rowNumber = integer(attr(tag, "r"), MAX_ROWS, 1);
          if (rows.has(rowNumber))
            throw new RevOpsError("invalid_workbook", 400);
          rows.set(rowNumber, new Map());
        }
        if (path === "worksheet/sheetData/row/c") {
          const [r, c] = cellAddress(attr(tag, "r") ?? "");
          if (r !== rowNumber || rows.get(r)!.has(c))
            throw new RevOpsError("invalid_workbook", 400);
          if (++totalCells > 100000)
            throw new RevOpsError("workbook_xml_too_complex", 400);
          current = {
            col: c,
            type: attr(tag, "t") ?? "n",
            style: attr(tag, "s"),
            value: "",
            formula: false,
            rich: false,
          };
        }
        if (path === "worksheet/sheetData/row/c/f" && current)
          current.formula = true;
        if (path === "worksheet/sheetData/row/c/is/r" && current)
          current.rich = true;
      },
      (value, path) => {
        if (
          current &&
          [
            "worksheet/sheetData/row/c/v",
            "worksheet/sheetData/row/c/is/t",
            "worksheet/sheetData/row/c/is/r/t",
          ].includes(path)
        ) {
          current.value += value;
          if (current.value.length > 32767)
            throw new RevOpsError("workbook_cell_too_large", 400);
        }
      },
      (_tag, path) => {
        if (path === "worksheet/sheetData/row/c" && current) {
          rows
            .get(rowNumber)!
            .set(
              current.col,
              current.formula || current.rich
                ? INVALID_CELL
                : valueOf(current.type, current.value, current.style),
            );
          current = undefined;
        }
      },
    );
    if (name === selectedPath) selectedRows = rows;
  }
  for (const [r, cells] of selectedRows) {
    maxRow = Math.max(maxRow, r);
    for (const c of cells.keys()) maxCol = Math.max(maxCol, c);
  }
  const row = (r: number) =>
    Array.from(
      { length: maxCol },
      (_, c) => selectedRows.get(r)?.get(c + 1) ?? "",
    );
  return {
    sheet: sheet.name,
    headers: row(1).map(String),
    records: Array.from({ length: Math.max(0, maxRow - 1) }, (_, i) =>
      row(i + 2),
    ),
    sourceRows: Array.from(
      { length: Math.max(0, maxRow - 1) },
      (_, i) => i + 2,
    ),
  };
}
