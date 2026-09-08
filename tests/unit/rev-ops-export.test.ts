import {describe,it,expect} from "vitest";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import {buildExportDocument,renderExport,receiptHash} from "../../packages/api-service/src/revOpsExport.js";
import {REV_OPS_CENSUS_METRIC,type RevOpsClosingReceipt} from "../../packages/domain-contracts/src/revOps.js";
import {midnightEnding} from "../../packages/rev-ops-service/src/index.js";

export function exportFixture(): RevOpsClosingReceipt {
  const at="2028-03-01T12:00:00.000Z";
  const source={kind:"manual" as const,name:"PRIVATE_SOURCE_NAME"};
  return {workspaceId:"synthetic-w",unit:"Synthetic unit",timezone:"America/Chicago",dateConvention:"end-of-day",period:"2028-02",through:"2028-02-29",expectedDays:29,actuals:280,variance:-10,revision:7,closingNumber:1,actorId:"synthetic-actor",at,reason:"PRIVATE_REASON",
    metric:{...structuredClone(REV_OPS_CENSUS_METRIC),timezone:"America/Chicago"},hospitalId:"synthetic-h",hospitalName:"Synthetic hospital",
    budget:{id:"budget-one",period:"2028-02",total:290,dailyTargets:Array(29).fill(10),costCenter:"PRIVATE_COST_CENTER",costCenterLabel:"PRIVATE_LABEL",fieldVersion:1,status:"approved",createdBy:"synthetic-finance",createdAt:at,approvedBy:"synthetic-finance",approvedAt:at,source},
    days:Array.from({length:29},(_,i)=>{const date=`2028-02-${String(i+1).padStart(2,"0")}`;return {date,actualRevision:1,actual:{count:i===28?0:10,actorId:"synthetic-actor",at,cutoffInstant:midnightEnding(date,"America/Chicago"),source}};})};
}
const context=(receipt=exportFixture())=>({receipt,workspaceRevision:14,periodClosed:true,observedAt:"2028-03-02T12:00:00.000Z"});
describe("bounded historical census export",()=>{
  it("exports selected facts, explicit zero and a distinct budget/actual revision bridge",()=>{
    const first=exportFixture();const hash=receiptHash(first);
    const revised=structuredClone(first);revised.days[28]!.actual.count=5;revised.actuals=285;revised.variance=-5;revised.revision=10;revised.closingNumber=2;revised.previousClosingRevision=7;
    const doc=buildExportDocument({...context(revised),predecessor:first});
    expect(doc.sheets[0]!.rows).toContainEqual(["Actual — Sum of Daily Midnight Census Counts",285]);
    expect(doc.sheets.find(s=>s.name==="Revision comparison")!.rows).toContainEqual(["Budget",290,290,0]);
    const legacy=structuredClone(first);delete legacy.metric;
    expect(buildExportDocument({...context(revised),predecessor:legacy}).sheets.at(-1)!.rows).toContainEqual(["Metric definition","Definition not recorded","Daily Midnight Census Count","Historical definitions retained"]);
    expect(receiptHash(first)).toBe(hash);expect(first.days[28]!.actual.count).toBe(0);
    const old=buildExportDocument({...context(first),successorRevision:10});expect(old.sheets[0]!.rows).toContainEqual(["Observed status","SUPERSEDED"]);
    const reopened=buildExportDocument({...context(first),periodClosed:false});expect(reopened.sheets[0]!.rows).toContainEqual(["Observed status","PERIOD REOPENED"]);
  });
  it("exports a validated immutable staffing-plan variance when the close recorded one",()=>{
    const r=exportFixture();
    const staffingDays=r.days.map(day=>({
      date:day.date,actualRevision:1,
      actual:{hours:day.actual.count*2,actorId:"synthetic-staffing",at:r.at,source:day.actual.source},
    }));
    r.staffing={
      comparison:{
        metric:{code:"RN_WORKED_HOURS",label:"Synthetic RN worked hours",definition:"Synthetic fixture measure.",unit:"hours",version:"1.0.0",effectiveFrom:"2028-02-01",status:"approved",createdBy:"synthetic-admin",createdAt:r.at,approvedBy:"synthetic-admin",approvedAt:r.at},
        missingCensusDates:[],missingStaffingDates:[],missingRuleDates:[],
        expectedHours:560,actualHours:560,variance:0,
        contributors:r.days.map(day=>({date:day.date,census:day.actual.count,actualHours:day.actual.count*2,expectedHours:day.actual.count*2,variance:0,ruleId:"synthetic-rule",ruleEffectiveFrom:"2028-02-01"})),
      },
      days:staffingDays,
    };
    const doc=buildExportDocument(context(r));
    expect(doc.sheets.find(s=>s.name==="Staffing variance")!.rows).toContainEqual(["Scope","Configured operational staffing-plan variance only. Not a mandated ratio, billing basis, payroll close, or clinical recommendation.","","","","","","","",""]);
    r.staffing.days[0]!.actual.hours=999;
    expect(()=>buildExportDocument(context(r))).toThrow("invalid_historical_receipt");
  });
  it("preserves all supported month lengths and recorded daylight-saving cutoffs",()=>{
    for(const [period,n] of [["2027-02",28],["2028-02",29],["2028-04",30],["2028-03",31]] as const){
      const r=exportFixture();r.period=period;r.through=`${period}-${n}`;r.expectedDays=n;
      r.budget.period=period;r.budget.total=n*10;r.budget.dailyTargets=Array(n).fill(10);r.actuals=n*10;r.variance=0;
      r.days=Array.from({length:n},(_,i)=>{const date=`${period}-${String(i+1).padStart(2,"0")}`;return{...structuredClone(exportFixture().days[0]!),date,actual:{...structuredClone(exportFixture().days[0]!.actual),cutoffInstant:midnightEnding(date,r.timezone)}};});
      const rows=buildExportDocument(context(r)).sheets.find(s=>s.name==="Daily activity")!.rows;
      expect(rows).toHaveLength(n+1);expect(rows.at(-1)![0]).toBe(r.through);
      if(period==="2028-03"){expect(rows[11]![4]).toBe("2028-03-12T06:00:00.000Z");expect(rows[12]![4]).toBe("2028-03-13T05:00:00.000Z");}
    }
  });
  it("keeps legacy definitions unknown and does not invent a zero-budget percentage",()=>{
    const r=exportFixture();delete r.metric;delete r.hospitalName;r.budget.total=0;r.budget.dailyTargets.fill(0);r.variance=280;
    const d=buildExportDocument(context(r));
    expect(d.sheets[0]!.rows).toContainEqual(["Metric","Definition not recorded"]);
    expect(d.sheets[0]!.rows).toContainEqual(["Variance percent","Not applicable: zero budget"]);
    expect(d.sheets.find(s=>s.name==="Closing receipt")!.rows).toContainEqual(["Historical hospital name","Not recorded"]);
  });
  it("rejects unsupported or inconsistent recorded metric definitions",()=>{
    for(const patch of [{metric_code:"PATIENT_DAYS"},{timezone:"UTC"},{definition_version:"2.0"},{hospital_rules:{}}]) {
      const r=exportFixture();Object.assign(r.metric!,patch);
      expect(()=>buildExportDocument(context(r))).toThrow("invalid_historical_receipt");
    }
  });
  it("hashes canonical source independently of key order and export metadata",()=>{
    const r=exportFixture();expect(receiptHash(r)).toBe(receiptHash(Object.fromEntries(Object.entries(r).reverse())));
    expect(buildExportDocument({...context(r),observedAt:"2030-01-01T00:00:00.000Z"}).receiptHash).toBe(receiptHash(r));
    r.reason="Changed source fact";expect(receiptHash(r)).not.toBe(receiptHash(exportFixture()));
  });
  it("rejects missing/duplicate dates, inconsistent totals, draft budgets and oversized hidden source content",()=>{
    for(const change of [(r:RevOpsClosingReceipt)=>r.days.pop(),(r:RevOpsClosingReceipt)=>r.days[1]!.date=r.days[0]!.date,(r:RevOpsClosingReceipt)=>r.actuals=999,(r:RevOpsClosingReceipt)=>r.budget.status="draft"]){const r=exportFixture();change(r);expect(()=>buildExportDocument(context(r))).toThrow("invalid_historical_receipt");}
    const r=exportFixture();r.reason="x".repeat(4097);expect(()=>buildExportDocument(context(r))).toThrow("export_size_limit");
    expect(()=>receiptHash({omitted:Array(129).fill(0)})).toThrow("export_size_limit");
  });
  it("writes formula-like text as literal OOXML strings with no forbidden workbook content",async()=>{
    const r=exportFixture();r.unit='=HYPERLINK("https://example.test","click")';r.hospitalName="@SUM(1,2)";
    const doc=buildExportDocument(context(r));
    const bytes=await renderExport(doc,"synthetic-export","2028-03-02T12:00:00.000Z","synthetic-actor");
    expect(bytes.length).toBeLessThan(1048576);
    const zip=await JSZip.loadAsync(bytes);
    const xml=(await Promise.all(Object.keys(zip.files).filter(n=>n.endsWith('.xml')||n.endsWith('.rels')).map(n=>zip.file(n)!.async('string')))).join('\n');
    expect(xml).not.toMatch(/<f(?:\s|>)/);expect(xml).not.toContain('TargetMode="External"');
    for(const v of ["PRIVATE_SOURCE_NAME","PRIVATE_REASON","PRIVATE_COST_CENTER","PRIVATE_LABEL"] )expect(xml).not.toContain(v);
    expect(Object.keys(zip.files).join(' ')).not.toMatch(/vbaProject|externalLinks|connections|comments|embeddings/);
    const book=new ExcelJS.Workbook();await book.xlsx.load(bytes as never);
    expect(book.worksheets.every(s=>s.state==="visible")).toBe(true);
    const receipt=book.getWorksheet("Closing receipt")!;
    expect(receipt.getRow(5).getCell(2).value).toBe(r.unit);
    const activity=book.getWorksheet("Daily activity")!;
    expect(activity.getRow(30).getCell(2).value).toBe(0);
    expect(activity.getRow(30).getCell(3).value).toBe("EXPLICIT_ZERO");
    expect(activity.getRow(2).getCell(5).value).toEqual(new Date(r.days[0]!.actual.cutoffInstant));
  });
});
