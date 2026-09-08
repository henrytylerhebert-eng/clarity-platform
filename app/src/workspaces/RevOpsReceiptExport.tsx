import {useEffect,useState} from "react";
import {apiRevOps,apiRevOpsExport,describeApiError} from "../domain/api";
import type {RevOpsExportDocument} from "../../../packages/domain-contracts/src/revOps";

export function ReceiptExport({workspaceId,receiptRevision}:{workspaceId:string;receiptRevision:number}) {
  const [open,setOpen]=useState(false);
  const [attempt,setAttempt]=useState(0);
  const [document,setDocument]=useState<RevOpsExportDocument|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const path=`/workspaces/${encodeURIComponent(workspaceId)}/receipts/${receiptRevision}`;
  useEffect(()=>{
    let cancelled=false;
    setDocument(null);setError("");setMessage("");
    if(!open)return;
    setBusy(true);
    apiRevOps<RevOpsExportDocument>(path).then(result=>{if(!cancelled)setDocument(result);})
      .catch(e=>{if(!cancelled)setError(describeApiError(e));})
      .finally(()=>{if(!cancelled)setBusy(false);});
    return()=>{cancelled=true;};
  },[open,path,attempt]);
  return <section aria-label={`Excel export for receipt revision ${receiptRevision}`}>
    <button onClick={()=>setOpen(v=>!v)}>{open?"Hide Excel review":"Review Excel export"}</button>
    {open?<>
      <p>Synthetic-only operational census export. The workbook uses this receipt’s recorded facts. No accounting close or patient-day equivalence is implied.</p>
      <button disabled={busy} onClick={()=>setAttempt(v=>v+1)}>Refresh export review</button>
      {busy?<p role="status">Preparing export…</p>:null}
      {error?<p role="alert">{error} Refresh the review before retrying.</p>:null}
      {document?<>
        <p>Receipt revision {document.receiptRevision} · observed workspace revision {document.workspaceRevision} · {document.filename}</p>
        {document.sheets.map(sheet=><details key={sheet.name} open={sheet.name==="Summary"}>
          <summary>{sheet.name}</summary>
          <div style={{overflowX:"auto"}}><table><tbody>{sheet.rows.map((row,i)=><tr key={i}>{row.map((cell,j)=>i===0?<th key={j}>{cell}</th>:<td key={j} style={{overflowWrap:"anywhere",padding:"0.3rem"}}>{sheet.name==="Summary" && row[0]==="Variance percent" && typeof cell==="number" ? new Intl.NumberFormat("en-US",{style:"percent",minimumFractionDigits:2,maximumFractionDigits:2}).format(cell) : cell}</td>)}</tr>)}</tbody></table></div>
        </details>)}
        <button disabled={busy} onClick={()=>{
          setBusy(true);setError("");setMessage("");
          void apiRevOpsExport(path+"/export",{workspaceRevision:document.workspaceRevision,receiptHash:document.receiptHash}).then(blob=>{
            const url=URL.createObjectURL(blob);
            const a=window.document.createElement("a");a.href=url;a.download=document.filename;a.click();
            window.setTimeout(()=>URL.revokeObjectURL(url),10000);
            setMessage("Workbook generated and handed to the browser. Opening or saving the file is not confirmed.");
          }).catch(e=>{setError(describeApiError(e));setDocument(null);}).finally(()=>setBusy(false));
        }}>Download selected receipt (.xlsx)</button>
      </>:null}
      {message?<p role="status">{message}</p>:null}
    </>:null}
  </section>;
}
