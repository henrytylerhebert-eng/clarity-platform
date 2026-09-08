import { createHash } from "node:crypto";
import ExcelJS from "exceljs";
import { z } from "zod";
import { REV_OPS_CENSUS_METRIC, RevOpsDate, RevOpsPeriod, type RevOpsClosingReceipt, type RevOpsExportDocument, type RevOpsSource } from "../../domain-contracts/src/revOps.js";
import { daysInPeriod, RevOpsError } from "../../rev-ops-service/src/index.js";

export const EXPORT_LIMITS = { payloadBytes: 262144, nodes: 20000, stringBytes: 4096, arrayItems: 128, depth: 16, cells: 4096, outputBytes: 1048576 } as const;
export const EXPORT_TEMPLATE = "revops-census-v1";
const invalid = () => new RevOpsError("invalid_historical_receipt", 400);
const oversized = () => new RevOpsError("export_size_limit", 413);

/** Bound the entire source before cloning/hashing, including fields omitted from export. */
export function receiptHash(value: unknown): string {
  let nodes = 0, bytes = 0;
  function canonical(v: unknown, depth: number): unknown {
    if (++nodes > EXPORT_LIMITS.nodes || depth > EXPORT_LIMITS.depth) throw oversized();
    if (typeof v === "string") {
      const size = Buffer.byteLength(v);
      if (size > EXPORT_LIMITS.stringBytes) throw oversized();
      bytes += size;
    } else if (typeof v === "number" && !Number.isFinite(v)) throw invalid();
    if (bytes > EXPORT_LIMITS.payloadBytes) throw oversized();
    if (Array.isArray(v)) {
      if (v.length > EXPORT_LIMITS.arrayItems) throw oversized();
      return v.map(x => canonical(x, depth + 1));
    }
    if (v && typeof v === "object") {
      const keys = Object.keys(v).sort();
      if (keys.length > EXPORT_LIMITS.arrayItems) throw oversized();
      return Object.fromEntries(keys.map(k => {
        canonical(k, depth + 1);
        return [k, canonical((v as Record<string, unknown>)[k], depth + 1)];
      }));
    }
    return v;
  }
  const serialized = JSON.stringify(canonical(value, 0));
  if (!serialized || Buffer.byteLength(serialized) > EXPORT_LIMITS.payloadBytes) throw oversized();
  return createHash("sha256").update(serialized).digest("hex");
}

const text = z.string().min(1).max(4096);
const integer = z.number().int().nonnegative();
const sourceSchema = z.object({ kind: z.enum(["manual", "upload"]), name: text, sha256: z.string().regex(/^[a-f0-9]{64}$/).optional(), rows: z.array(z.number().int().positive()).max(128).optional() });
const timestamp = z.string().datetime();
// Validate exported facts independently of TypeScript casts at the persistence boundary.
const receiptSchema = z.object({
  workspaceId: text, unit: text, timezone: text, dateConvention: z.literal("end-of-day"),
  hospitalId: text.optional(), hospitalName: text.optional(),
  metric: z.object({
    metric_code: z.literal(REV_OPS_CENSUS_METRIC.metric_code),
    metric_label: z.literal(REV_OPS_CENSUS_METRIC.metric_label),
    definition_version: z.literal(REV_OPS_CENSUS_METRIC.definition_version),
    definition: z.literal(REV_OPS_CENSUS_METRIC.definition),
    timezone: text, census_local_time: z.literal("00:00"),
    service_date_rule: z.literal("PRIOR_CALENDAR_DAY"),
    validation_status: z.literal("unverified"), inclusion_rule_version: z.null(), effective_from: z.null(),
    hospital_rules: z.object(Object.fromEntries(Object.keys(REV_OPS_CENSUS_METRIC.hospital_rules).map(key => [key,z.null()]))).strict(),
  }).strict().optional(),
  period: RevOpsPeriod, through: RevOpsDate, expectedDays: integer.max(31), actuals: integer.max(3100000), variance: z.number().finite(),
  revision: integer.positive(), closingNumber: integer.positive(), previousClosingRevision: integer.positive().optional(), actorId: text, at: timestamp, reason: text,
  budget: z.object({ id: text, period: RevOpsPeriod, status: z.literal("approved"), total: z.number().min(0).max(1000000), dailyTargets: z.array(z.number().min(0).max(100000)).max(31), approvedBy: text, approvedAt: timestamp, source: sourceSchema }),
  days: z.array(z.object({ date: RevOpsDate, actualRevision: integer.positive(), actual: z.object({ count: integer.max(100000), actorId: text, at: timestamp, cutoffInstant: timestamp, source: sourceSchema }) })).max(31),
});

function validate(receipt: RevOpsClosingReceipt) {
  const parsed = receiptSchema.safeParse(receipt);
  if (!parsed.success) throw invalid();
  const r = parsed.data;
  const n = daysInPeriod(r.period);
  if ((r.metric && r.metric.timezone !== r.timezone) || r.expectedDays !== n || r.days.length !== n || r.budget.period !== r.period ||
      r.through !== `${r.period}-${n}` || r.budget.dailyTargets.length !== n ||
      r.days.some((d,i) => d.date !== `${r.period}-${String(i+1).padStart(2,"0")}`) ||
      r.days.reduce((s,d) => s+d.actual.count,0) !== r.actuals ||
      Math.abs(r.budget.dailyTargets.reduce((s,d) => s+d,0)-r.budget.total) > 1e-6 ||
      Math.abs(r.actuals-r.budget.total-r.variance) > 1e-6) throw invalid();
}

export interface ExportContext {
  receipt: RevOpsClosingReceipt;
  predecessor?: RevOpsClosingReceipt;
  successorRevision?: number;
  workspaceRevision: number;
  periodClosed: boolean;
  observedAt: string;
}

export function buildExportDocument(context: ExportContext): RevOpsExportDocument {
  const { receipt: r, predecessor: p } = context;
  const hash = receiptHash(r);
  validate(r);
  if (p) {
    receiptHash(p); validate(p);
    if (p.workspaceId !== r.workspaceId || p.period !== r.period || p.revision !== r.previousClosingRevision) throw invalid();
  }
  const metric = r.metric;
  const totalLabel = metric ? "Sum of Daily Midnight Census Counts" : "Recorded aggregate total (definition not recorded)";
  const status = context.successorRevision ? "SUPERSEDED" : context.periodClosed ? "LATEST CLOSED" : "PERIOD REOPENED";
  const sources: (string | number | null)[][] = [["Reference", "Type", "Checksum", "Source names / paths"]];
  const sourceIds = new Map<string,string>();
  const ref = (s: RevOpsSource) => {
    // Export aliases use safe identity facts, never unrestricted filenames or mappings.
    const key = `${s.kind}:${s.sha256 ?? "none"}`;
    let id = sourceIds.get(key);
    if (!id) { id = `SRC-${sourceIds.size+1}`; sourceIds.set(key,id); sources.push([id,s.kind,s.sha256??"Not recorded","Withheld"]); }
    return id;
  };
  const sheets: RevOpsExportDocument["sheets"] = [
    { name: "Summary", rows: [
      ["Operational Census Close", "Synthetic-only export"],
      ["Metric", metric?.metric_label ?? "Definition not recorded"],
      ["Actual — "+totalLabel, r.actuals], ["Selected budget — aggregate target", r.budget.total],
      ["Variance (actual minus budget)",r.variance], ["Variance percent",r.budget.total===0?"Not applicable: zero budget":r.variance/r.budget.total],
      ["Calendar dates",r.expectedDays], ["Recorded dates",r.days.length], ["Explicit zero dates",r.days.filter(d=>d.actual.count===0).length],
      ["Observed status",status], ["Budget metric validation","Hospital validation required; budget carries no independent metric contract"],
      ["Scope","Operational counts and selected budget only. Not accounting close, billed days, forecast, collections or regulatory filing."],
      ["Privacy policy","Source filenames, free-text reasons and custom-field values withheld. Historical unit/hospital labels and actor IDs included."],
    ] },
    { name: "Daily activity", rows: [
      ["Service date", "Daily count", "Data state", "Actual revision", "Cutoff (UTC)", "Actor ID", "Recorded at (UTC)", "Source reference", "Source rows", "Reason / custom fields"],
      ...r.days.map(d=>[d.date,d.actual.count,d.actual.count===0?"EXPLICIT_ZERO":"VALUE",d.actualRevision,d.actual.cutoffInstant,d.actual.actorId,d.actual.at,ref(d.actual.source),d.actual.source.rows?.join(", ")??"Not recorded","Withheld"]),
    ] },
    { name: "Selected budget", rows: [
      ["Property","Recorded value"], ["Budget ID",r.budget.id], ["Period",r.budget.period], ["Status",r.budget.status],
      ["Total",r.budget.total], ["Approved by",r.budget.approvedBy!], ["Approved at (UTC)",r.budget.approvedAt!], ["Source reference",ref(r.budget.source)],
      ["Historical custom fields","Withheld by export policy; source snapshots retained"],
      ["Daily targets","Captured in selected budget; not allocated by export"],
      ...r.budget.dailyTargets.map((target,i)=>[r.days[i]!.date,target]),
    ] },
    { name: "Closing receipt", rows: [
      ["Property","Recorded value"], ["Workspace ID",r.workspaceId], ["Hospital ID",r.hospitalId??"Not recorded"], ["Historical hospital name",r.hospitalName??"Not recorded"],
      ["Unit",r.unit], ["Period",r.period], ["Receipt revision",r.revision], ["Closing number",r.closingNumber], ["Predecessor revision",r.previousClosingRevision??"Not recorded"],
      ["Successor revision at observation",context.successorRevision??"None observed"], ["Source receipt SHA-256",hash], ["Hash convention","SHA-256 / recursively sorted JSON keys / array order preserved; includes withheld fields; not a signature"],
      ["Closed by",r.actorId], ["Closed at (UTC)",r.at], ["Reason","Withheld: free text"],
      ["Metric code",metric?.metric_code??"Definition not recorded"], ["Metric label",metric?.metric_label??"Definition not recorded"],
      ["Definition version",metric?.definition_version??"Not recorded"], ["Definition",metric?.definition??"Definition not recorded"],
      ["Timezone",r.timezone], ["Census local time",metric?.census_local_time??"Not recorded"], ["Service-date rule",metric?.service_date_rule??"Not recorded"],
      ["Existing date convention",r.dateConvention], ["Hospital rule validation",metric?.validation_status??"Not recorded"],
      ["Inclusion rule version",metric?.inclusion_rule_version??"Not recorded"], ["Rule effective date",metric?.effective_from??"Not recorded"],
      ["Hospital-specific rules","Not recorded: statuses, observation, leave/pass, midnight transfers, unit assignment, midnight admission/discharge, temporary closure"],
      ["Observed workspace revision",context.workspaceRevision], ["Observed at (UTC)",context.observedAt], ["Observed period state",context.periodClosed?"Closed":"Open"],
      ["Template version",EXPORT_TEMPLATE],
    ] },
    { name: "Sources", rows: sources },
  ];
  if (p) sheets.push({name:"Revision comparison",rows:[
    ["Measure","Prior","Selected","Change"], [p.metric ? totalLabel : "Recorded aggregate total (prior definition not recorded)",p.actuals,r.actuals,r.actuals-p.actuals], ["Budget",p.budget.total,r.budget.total,r.budget.total-p.budget.total], ["Variance",p.variance,r.variance,r.variance-p.variance],
    ["Metric definition",p.metric?.metric_label??"Definition not recorded",metric?.metric_label??"Definition not recorded","Historical definitions retained"],
    ["Changed service date","Prior count","Selected count","Change"],
    ...r.days.filter((d,i)=>d.actual.count!==p.days[i]!.actual.count).map(d=>{const prior=p.days.find(x=>x.date===d.date)!;return[d.date,prior.actual.count,d.actual.count,d.actual.count-prior.actual.count];}),
  ]});
  return {templateVersion:EXPORT_TEMPLATE,receiptHash:hash,receiptRevision:r.revision,workspaceRevision:context.workspaceRevision,period:r.period,filename:`census-${r.period}-receipt-${r.revision}.xlsx`,sheets};
}

/** Produces no effects. Caller owns authorization, concurrency and durable audit before delivery. */
export async function renderExport(document: RevOpsExportDocument, exportId: string, generatedAt: string, actorId: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Clarity synthetic Rev Ops";
  let cells = 0;
  for (const sheet of [...document.sheets, {name:"Export event",rows:[["Property","Value"],["Request ID",exportId],["Generated at (UTC)",generatedAt],["Requester ID",actorId],["Delivery","Generation does not confirm download or opening"]]}]) {
    const ws=workbook.addWorksheet(sheet.name,{views:[{state:"frozen",ySplit:1}]});
    for (const row of sheet.rows) {
      cells += row.length;
      if (cells>EXPORT_LIMITS.cells || row.some(v=>typeof v==="string" && Buffer.byteLength(v)>EXPORT_LIMITS.stringBytes)) throw oversized();
      // ExcelJS string values are OOXML strings, never formula objects or hyperlinks.
      const added=ws.addRow(row.map(v=>typeof v==="string" && (/^20\d\d-\d\d-\d\d$/.test(v) || /^20\d\d-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v)) ? new Date(v.length===10?v+"T00:00:00Z":v) : v));
      added.eachCell((cell,index)=>{if(cell.value instanceof Date)cell.numFmt=String(row[index-1]).length===10?"yyyy-mm-dd":"yyyy-mm-dd hh:mm:ss.000";});
    }
    ws.columns.forEach((column,i)=>{ column.width=sheet.name==="Daily activity"?(i===0?16:26):(i===0?42:65); });
    ws.eachRow((row,index)=>{
      row.eachCell(cell=>{cell.font={name:"Arial",size:11,color:{argb:"FF20364D"}};cell.alignment={vertical:"middle",wrapText:true};if(typeof cell.value==="number")cell.numFmt="#,##0.########;(#,##0.########);0";});
      row.height=index===1?30:Math.max(42, ...sheet.rows[index-1]!.map(v=>typeof v==="string"?Math.ceil(v.length/55)*16:42));
    });
    ws.getRow(1).eachCell(cell=>{cell.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF284B70"}};cell.font={name:"Arial",size:11,bold:true,color:{argb:"FFFFFFFF"}};});
    if(sheet.name==="Summary" && typeof ws.getCell("B6").value==="number") ws.getCell("B6").numFmt="0.00%;(0.00%);0.00%";
    ws.autoFilter={from:{row:1,column:1},to:{row:ws.rowCount,column:ws.columnCount}};
  }
  const bytes=Buffer.from(await workbook.xlsx.writeBuffer());
  if(bytes.length>EXPORT_LIMITS.outputBytes) throw oversized();
  return bytes;
}
