import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { apiRevOps } from "../domain/api";
import { WORKBOOK_APPEND_REQUIRED_FIELDS } from "../../../packages/domain-contracts/src/operatingWorkbook";
import type {
  OperatingWorkbook as WorkbookData,
  WorkbookCell,
  WorkbookColumn,
  WorkbookRow,
  WorkbookTable,
  OperatingMetrics,
  OperatingWorkbookSummary,
} from "../../../packages/domain-contracts/src/operatingWorkbook";
import "./operatingWorkbook.css";

type Change = {
  id: string;
  revision: number;
  action: "load" | "edit" | "append" | "snapshot";
  tableKey?: string;
  rowId?: string;
  columnKey?: string;
  oldValue?: WorkbookCell;
  newValue?: WorkbookCell;
  reason: string;
  actorId: string;
  at: string;
};
type Snapshot = {
  id: string;
  revision: number;
  period: string;
  reason: string;
  actorId: string;
  at: string;
  sourceHash: string;
  dataHash: string;
  summary: OperatingWorkbookSummary;
};
type WorkbookView = {
  revision: number;
  workbook: WorkbookData | null;
  summary?: OperatingWorkbookSummary | null;
  history: Change[];
  closings: Snapshot[];
};
type Edit = { table: WorkbookTable; row: WorkbookRow; column: WorkbookColumn };
const sections = [
  { key: "overview", label: "Overview", sheets: ["MONTHLY", "DASHBOARD", "MANAGEMENT_REPORT"] },
  { key: "inpatient", label: "Inpatient", sheets: ["ENCOUNTERS", "PATIENTS", "INPATIENT", "COVERAGE", "STATE_MIX"] },
  { key: "iop", label: "IOP", sheets: ["IOP_ROSTER", "IOP_VISITS", "IOP_SESSIONS", "SESSION_ATTENDANCE", "IOP", "IOP_GRID"] },
  { key: "staffing", label: "Staffing", sheets: ["STAFF_DETAIL", "STAFF_STANDARDS", "STAFFING", "STAFF_REPORT"] },
  { key: "payers", label: "Payers & services", sheets: ["PAYERS", "SERVICES", "CONTRACT_RATES", "SERVICE_LEDGER", "PAYER_ACTIVITY", "PAYER_MIX", "UR_PAYER", "BENEFIT_REVIEW", "BENEFITS_REFERENCE", "ASSISTANCE"] },
  { key: "planning", label: "Budget & forecast", sheets: ["BUDGET", "FORECAST", "ANCILLARY", "INVOICES"] },
  { key: "collections", label: "Collections", sheets: ["COLLECTIONS", "RECEIPT_ALLOCATIONS"] },
  { key: "source", label: "Source & checks", sheets: [] as string[] },
  { key: "history", label: "History", sheets: [] as string[] },
] as const;
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const pageSize = 25;
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const display = (v: WorkbookCell | undefined) => v == null || v === "" ? "—" : typeof v === "number" ? number.format(v) : String(v);
const appendIdentity: Record<string, string> = Object.fromEntries(Object.entries(WORKBOOK_APPEND_REQUIRED_FIELDS).map(([key, fields]) => [key, fields[0]]));
const rowLabel = (row: WorkbookRow) => row.sourceRow > 0 ? `row ${row.sourceRow}` : `platform record ${row.id}`;
function workbookError(error: unknown, fallback: string): string {
  const messages: Record<string, string> = {
    invalid_registry_record: "This record could not be added. Check required fields, a unique business ID, and linked payer and service IDs. Contract dates must form a valid range without overlapping an existing rate. Percentage rates use a fraction from 0 to 1, such as 0.60 for 60%.",
    invalid_workbook_edit: "This correction could not be saved. Check required values, linked records, and valid dates. Rate periods must not overlap, and percentage rates use a fraction from 0 to 1. Formula cells and receipt history remain read-only.",
    version_conflict_refresh_required: "This workbook changed after you opened it. Keep a copy of your entry, cancel this form, then refresh the workbook and retry against the latest records.",
    permission_denied: "Your account does not have permission to perform this action. An organization administrator can review your workspace access.",
    authentication_failed: "Your session has ended. Sign in again to continue.",
    api_unreachable: "The local API is unavailable. Restore the connection, then refresh and try again.",
    workbook_already_loaded: "The accepted workbook is already loaded in this workspace. Refresh to see the saved records.",
    workbook_not_loaded: "Load the accepted workbook before adding or correcting records.",
  };
  return error instanceof Error ? messages[error.message] ?? fallback : fallback;
}
const currencyKeys = new Set<keyof OperatingMetrics>(["laborCost", "ancillaryExpense", "cashReceived", "allocatedReceipts", "modeledRevenue", "ipRevenue", "iopRevenue", "revenueBudget", "forecastRevenue", "modeledOutstanding", "revenueVariance", "phasedRevenueBudget", "phasedRevenueVariance", "laborBudget", "laborVariance", "agencyCost", "oneToOneCost", "lease", "invoiceBalance"]);
const metricGroups: { label: string; metrics: { key: keyof OperatingMetrics; label: string }[] }[] = [
  { label: "Inpatient operations", metrics: [{ key: "admissions", label: "Admissions" }, { key: "discharges", label: "Discharges" }, { key: "ipPatientDays", label: "Patient days" }, { key: "adc", label: "Average daily census" }, { key: "occupancy", label: "Occupancy" }, { key: "alos", label: "Average length of stay · days" }] },
  { label: "IOP activity", metrics: [{ key: "iopPatientDays", label: "Patient days attended" }, { key: "iopScheduled", label: "Scheduled visits" }, { key: "iopAttendanceRate", label: "Attendance rate" }, { key: "iopNoShows", label: "No-shows" }, { key: "iopCancelled", label: "Cancelled visits" }, { key: "sessions", label: "Group sessions" }, { key: "groupUnits", label: "Participant group units" }] },
  { label: "Staffing & operating expense", metrics: [{ key: "staffHours", label: "Actual staff hours" }, { key: "staffBudgetHours", label: "Budget staff hours" }, { key: "ipStaffHours", label: "Inpatient staff hours" }, { key: "iopStaffHours", label: "IOP staff hours" }, { key: "laborCost", label: "Calculated labor expense" }, { key: "laborBudget", label: "Labor budget" }, { key: "ancillaryExpense", label: "Ancillary expense" }, { key: "lease", label: "Lease expense" }, { key: "invoiceBalance", label: "Invoice balance" }] },
  { label: "Revenue plan & collections", metrics: [{ key: "modeledRevenue", label: "Modeled service value" }, { key: "revenueBudget", label: "Revenue budget" }, { key: "revenueVariance", label: "Service value vs. budget" }, { key: "forecastRevenue", label: "Forecast revenue" }, { key: "cashReceived", label: "Cash received" }, { key: "allocatedReceipts", label: "Receipts allocated" }, { key: "modeledOutstanding", label: "Modeled amount outstanding" }, { key: "servicesDelivered", label: "Services delivered" }] },
];
const metricValue = (key: keyof OperatingMetrics, value: number | null) => value == null ? "Unavailable" : key === "occupancy" || key === "iopAttendanceRate" || key === "revenueVariancePct" ? `${number.format(value * 100)}%` : currencyKeys.has(key) ? money.format(value) : number.format(value);

function tablesFor(workbook: WorkbookData, section: string) {
  const selected = sections.find((item) => item.key === section);
  if (!selected || section === "history") return [];
  if (section === "source") {
    const assigned = new Set(sections.flatMap((item) => [...item.sheets]));
    return workbook.tables.filter((table) => !assigned.has(table.sheet));
  }
  return workbook.tables.filter((table) => (selected.sheets as readonly string[]).includes(table.sheet));
}

function SummaryValues({ summary }: { summary: OperatingWorkbookSummary }) {
  return <>
    <div className="ow-summary-groups">{metricGroups.map((group) => <section className="ow-summary-group" key={group.label} aria-label={group.label}>
      <h3>{group.label}</h3><dl className="ow-metrics">{group.metrics.map(({ key, label }) => <div key={key}><dt>{label}</dt><dd>{metricValue(key, summary.metrics[key])}</dd></div>)}</dl>
    </section>)}</div>
    <p className="ow-muted ow-summary-note">Modeled service value uses the workbook’s synthetic contract assumptions. Cash received is recorded separately. Unavailable amounts indicate missing or unresolved calculation inputs.</p>
    <details className="ow-report-detail"><summary>Monthly operating trend</summary><div className="ow-table-scroll"><table className="ow-table"><thead><tr><th>Month</th><th>IP patient days</th><th>Occupancy</th><th>IOP patient days</th><th>Staff hours</th><th>Modeled service value</th><th>Revenue budget</th><th>Cash received</th></tr></thead><tbody>{summary.months.map((month) => <tr key={month.period}><th scope="row">{month.label}</th>{(["ipPatientDays", "occupancy", "iopPatientDays", "staffHours", "modeledRevenue", "revenueBudget", "cashReceived"] as const).map((key) => <td className="ow-number" key={key}><span className="ow-value">{metricValue(key, month[key])}</span></td>)}</tr>)}</tbody></table></div></details>
    <WorkbookChecks summary={summary} />
  </>;
}

function WorkbookChecks({ summary }: { summary: OperatingWorkbookSummary }) {
  return <>
    <details className="ow-report-detail"><summary>Reconcile to accepted workbook · {summary.comparisons.filter((item) => item.status === "match").length} of {summary.comparisons.length} match</summary><p className="ow-muted">Current platform totals compared with the accepted workbook snapshot. Corrections can create expected differences that remain visible for review.</p><div className="ow-table-scroll"><table className="ow-table"><thead><tr><th>Metric</th><th>Platform</th><th>Workbook snapshot</th><th>Difference</th><th>Status</th></tr></thead><tbody>{summary.comparisons.map((item) => <tr key={item.metric}><th scope="row">{item.label}</th><td className="ow-number"><span className="ow-value">{metricValue(item.metric, item.calculated)}</span></td><td className="ow-number"><span className="ow-value">{metricValue(item.metric, item.workbookSnapshot)}</span></td><td className="ow-number"><span className="ow-value">{metricValue(item.metric, item.difference)}</span></td><td><span className={`ow-value ow-comparison-${item.status}`}>{item.status === "match" ? "Match" : item.status === "changed" ? "Difference" : "Unavailable"}</span></td></tr>)}</tbody></table></div></details>
    {summary.issues.length > 0 && <details className="ow-report-detail ow-issue-detail"><summary>{summary.issues.length} calculation {summary.issues.length === 1 ? "exception" : "exceptions"} to review</summary><ul>{summary.issues.map((issue, index) => <li key={`${issue.code}-${issue.tableKey}-${issue.rowId ?? index}`}><strong>{issue.tableKey}{issue.rowId ? ` · ${issue.rowId}` : ""}</strong><span>{issue.message}</span></li>)}</ul></details>}
  </>;
}

function EditCell({ edit, busy, onSave, onCancel }: {
  edit: Edit;
  busy: boolean;
  onSave: (value: WorkbookCell, reason: string) => Promise<void>;
  onCancel: () => void;
}) {
  const initial = edit.row.values[edit.column.key];
  const [value, setValue] = useState(initial == null ? "" : String(initial));
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const dialog = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector<HTMLElement>("input, select, textarea")?.focus();
    return () => { previous?.focus(); };
  }, []);
  async function save(event: FormEvent) {
    event.preventDefault();
    setError("");
    const cell = value === "" ? null : edit.column.type === "number" ? Number(value) : typeof initial === "boolean" ? value === "true" : value;
    if (typeof cell === "number" && !Number.isFinite(cell)) { setError("Enter a valid number."); return; }
    try { await onSave(cell, reason.trim()); }
    catch (e) { setError(workbookError(e, "Unable to save this change. Your entry remains here so you can review it and retry.")); }
  }
  return <div className="ow-dialog-backdrop" onKeyDown={(event) => { if (event.key === "Escape" && !busy) onCancel(); }}>
    <section ref={dialog} role="dialog" aria-modal="true" aria-labelledby="ow-edit-title" className="ow-dialog" onKeyDown={(event) => {
      if (event.key !== "Tab") return;
      const focusable = [...(dialog.current?.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)") ?? [])];
      if (!focusable.length) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable[focusable.length - 1]?.focus(); }
      if (!event.shiftKey && document.activeElement === focusable[focusable.length - 1]) { event.preventDefault(); focusable[0]?.focus(); }
    }}>
      <div className="ow-dialog-heading"><h3 id="ow-edit-title">Edit {edit.column.label}</h3><button className="ow-quiet" type="button" disabled={busy} onClick={onCancel} aria-label="Cancel edit">×</button></div>
      <p className="ow-muted">{edit.table.title} · {edit.row.sourceRow > 0 ? `Source row ${edit.row.sourceRow}` : `Platform record ${edit.row.id}`}</p>
      <form onSubmit={save}>
        <label>{edit.column.label}{edit.column.options?.length || typeof initial === "boolean" ? <select value={value} onChange={(event) => setValue(event.target.value)} disabled={busy} required={edit.column.required}>{!edit.column.required && <option value="">Blank</option>}{(edit.column.options ?? ["true", "false"]).map((option) => <option key={option}>{option}</option>)}</select> : <input type={edit.column.type === "number" ? "number" : edit.column.type === "date" ? "date" : "text"} step={edit.column.type === "number" ? "any" : undefined} value={value} onChange={(event) => setValue(event.target.value)} disabled={busy} required={edit.column.required} />}</label>
        <label>Reason for correction<textarea value={reason} onChange={(event) => setReason(event.target.value)} required minLength={3} maxLength={1000} rows={3} disabled={busy} placeholder="Explain what changed and why." /></label>
        <p className="ow-muted">Previous value: {display(initial)}. The change records your signed-in identity and preserves the previous value.</p>
        {error && <p role="alert" className="ow-error">{error}</p>}
        <div className="ow-actions"><button type="button" className="ow-quiet" disabled={busy} onClick={onCancel}>Cancel</button><button disabled={busy || reason.trim().length < 3 || value === (initial == null ? "" : String(initial))}>{busy ? "Saving…" : "Save correction"}</button></div>
      </form>
    </section>
  </div>;
}

function AppendRecord({ table, busy, onSave, onCancel }: {
  table: WorkbookTable;
  busy: boolean;
  onSave: (values: Record<string, WorkbookCell>, reason: string) => Promise<void>;
  onCancel: () => void;
}) {
  const identity = appendIdentity[table.key];
  const requiredFields: readonly string[] = WORKBOOK_APPEND_REQUIRED_FIELDS[table.key as keyof typeof WORKBOOK_APPEND_REQUIRED_FIELDS] ?? [];
  const formulaKeys = new Set(table.rows.flatMap((row) => row.formulaKeys ?? []));
  const columns = table.columns.filter((column) => column.key === identity || (column.editable && !column.snapshot && !formulaKeys.has(column.key)));
  const [values, setValues] = useState<Record<string, string>>({});
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const dialog = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector<HTMLElement>("input, select, textarea")?.focus();
    return () => { previous?.focus(); };
  }, []);
  const missing = columns.some((column) => (column.required || requiredFields.includes(column.key)) && !values[column.key]?.trim());
  async function save(event: FormEvent) {
    event.preventDefault();
    setError("");
    const entered: Record<string, WorkbookCell> = {};
    for (const column of columns) {
      const raw = (values[column.key] ?? "").trim();
      if (!raw) continue;
      const value = column.type === "number" ? Number(raw) : raw;
      if (typeof value === "number" && !Number.isFinite(value)) { setError(`Enter a valid number for ${column.label}.`); return; }
      entered[column.key] = value;
    }
    try { await onSave(entered, reason.trim()); }
    catch (e) { setError(workbookError(e, "Unable to add this record. Your entry remains here so you can review it and retry.")); }
  }
  return <div className="ow-dialog-backdrop" onKeyDown={(event) => { if (event.key === "Escape" && !busy) onCancel(); }}>
    <section ref={dialog} role="dialog" aria-modal="true" aria-labelledby="ow-add-title" className="ow-dialog ow-add-dialog" onKeyDown={(event) => {
      if (event.key !== "Tab") return;
      const focusable = [...(dialog.current?.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)") ?? [])];
      if (!focusable.length) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable[focusable.length - 1]?.focus(); }
      if (!event.shiftKey && document.activeElement === focusable[focusable.length - 1]) { event.preventDefault(); focusable[0]?.focus(); }
    }}>
      <div className="ow-dialog-heading"><h3 id="ow-add-title">Add {table.key === "payers" ? "payer" : table.key === "services" ? "service" : "contract rate"}</h3><button className="ow-quiet" type="button" disabled={busy} onClick={onCancel} aria-label="Cancel new record">×</button></div>
      <p className="ow-muted">Create a platform record with its own business ID. Required fields are marked *. Source workbook records stay preserved.</p>
      <form onSubmit={save}><div className="ow-add-form-grid">{columns.map((column) => {
        const required = column.required || requiredFields.includes(column.key);
        return <label key={column.key}>{column.label}{required ? " *" : ""}{column.options?.length ? <select value={values[column.key] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [column.key]: event.target.value }))} required={required} disabled={busy}><option value="">Select…</option>{column.options.map((option) => <option key={option}>{option}</option>)}</select> : <input type={column.type === "number" ? "number" : column.type === "date" ? "date" : "text"} step={column.type === "number" ? "any" : undefined} pattern={column.key === identity ? "[A-Za-z0-9][A-Za-z0-9._:\\-]{0,79}" : undefined} maxLength={column.key === identity ? 80 : 2000} value={values[column.key] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [column.key]: event.target.value }))} required={required} disabled={busy} />}{column.key === identity && <small>Unique ID · letters, numbers, dots, underscores, colons or hyphens</small>}</label>;
      })}</div><label>Reason for new record<textarea required minLength={3} maxLength={1000} rows={2} disabled={busy} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Record the source and purpose for this new entry." /></label>
        {error && <p role="alert" className="ow-error">{error}</p>}
        <div className="ow-actions"><button type="button" className="ow-quiet" onClick={onCancel} disabled={busy}>Cancel</button><button disabled={busy || missing || reason.trim().length < 3}>{busy ? "Adding…" : "Add record"}</button></div>
      </form>
    </section>
  </div>;
}

function TableExplorer({ tables, period, canEdit, onEdit, onAppend, createdRecord }: {
  tables: WorkbookTable[];
  period: string;
  canEdit: boolean;
  onEdit: (edit: Edit) => void;
  onAppend: (table: WorkbookTable) => void;
  createdRecord: { tableKey: string; identity: string } | null;
}) {
  const [selected, setSelected] = useState(tables[0]?.key ?? "");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const table = tables.find((item) => item.key === selected) ?? tables[0];
  const monthKey = table?.columns.find((column) => column.key === "month")?.key;
  useEffect(() => {
    if (createdRecord?.tableKey === table?.key) { setQuery(createdRecord?.identity ?? ""); setPage(0); }
  }, [createdRecord, table?.key]);
  const rows = useMemo(() => {
    if (!table) return [];
    const needle = query.trim().toLowerCase();
    return table.rows.filter((row) => {
      const date = table.dateKey ? row.values[table.dateKey] : null;
      const matchesPeriod = period.length === 4 || (table.dateKey
        ? typeof date === "string" && date.startsWith(period)
        : monthKey ? Number(row.values[monthKey]) === Number(period.slice(5)) : true);
      return matchesPeriod && (!needle || Object.values(row.values).some((cell) => String(cell ?? "").toLowerCase().includes(needle)));
    });
  }, [table, query, period, monthKey]);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  if (!table) return <p className="ow-empty">No source tables are available in this section.</p>;
  const hasEditableInput = !table.snapshot && table.columns.some((column) => column.editable);
  const scope = table.dateKey || monthKey ? period.length === 7 ? "Filtered to selected month" : "Full reporting year" : "All reference records";
  const editingNote = table.snapshot
    ? "Accepted workbook snapshot · does not recalculate after corrections"
    : hasEditableInput && canEdit ? "Select an input value to correct it · formula reference cells stay fixed" : "Read-only records";
  return <section className="ow-explorer" aria-label="Workbook records">
    <div className="ow-table-controls">
      <label>Record table<select value={table.key} onChange={(event) => { setSelected(event.target.value); setPage(0); setQuery(""); }}>{tables.map((item) => <option value={item.key} key={item.key}>{item.title}{tables.filter((other) => other.title === item.title).length > 1 ? ` · ${item.key}` : ""}</option>)}</select></label>
      <label className="ow-search">Search records<input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder="Find a patient, payer, date, or value" /></label>
      <span className="ow-record-count">{number.format(rows.length)} {rows.length === 1 ? "record" : "records"}</span>
      {canEdit && !table.snapshot && appendIdentity[table.key] && <button onClick={() => onAppend(table)}>Add record</button>}
    </div>
    <div className="ow-table-meta"><span><strong>{table.sheet}</strong> · {table.key} · {scope}</span><span>{editingNote}</span></div>
    <div className="ow-table-scroll" tabIndex={0} aria-label={`${table.title} records, scroll horizontally for more columns`}>
      <table className="ow-table"><thead><tr><th scope="col" className="ow-row-number">Source row</th>{table.columns.map((column) => <th scope="col" key={column.key}>{column.label}{(table.snapshot || !column.editable) && <small>{table.snapshot ? "Accepted snapshot" : "Calculated / reference"}</small>}</th>)}</tr></thead>
        <tbody>{rows.slice(safePage * pageSize, (safePage + 1) * pageSize).map((row) => <tr key={row.id}><th scope="row" className="ow-row-number">{row.sourceRow > 0 ? row.sourceRow : "Platform"}</th>{table.columns.map((column) => <td key={column.key} className={column.type === "number" ? "ow-number" : ""}>{column.editable && canEdit && !table.snapshot && !row.formulaKeys?.includes(column.key) ? <button className="ow-cell" aria-label={`Edit ${column.label}, ${rowLabel(row)}`} onClick={() => onEdit({ table, row, column })}>{display(row.values[column.key])}<span aria-hidden="true">↗</span></button> : <span className="ow-value">{display(row.values[column.key])}</span>}</td>)}</tr>)}</tbody>
      </table>
    </div>
    {rows.length === 0 && <p className="ow-empty">No records match this month and search. Try another month or clear the search.</p>}
    <div className="ow-pagination"><span>{rows.length ? `${safePage * pageSize + 1}–${Math.min((safePage + 1) * pageSize, rows.length)} of ${number.format(rows.length)}` : "0 records"}</span><div><button type="button" className="ow-quiet" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>Previous</button><span>Page {safePage + 1} / {pageCount}</span><button type="button" className="ow-quiet" disabled={safePage + 1 >= pageCount} onClick={() => setPage(safePage + 1)}>Next</button></div></div>
    <p className="ow-muted ow-calculation-note">{table.snapshot ? "This report preserves the accepted workbook results. Review current calculations in Overview and compare differences in Source & checks." : hasEditableInput ? "Input corrections recalculate the platform summary only. Formula and reference cells in this source table retain the accepted workbook values." : "These source records are read-only. Current calculations and any reconciliation differences remain available in Overview."}</p>
  </section>;
}

function WorkbookHistory({ view }: { view: WorkbookView }) {
  const [opened, setOpened] = useState("");
  const snapshot = view.closings.find((item) => item.id === opened);
  return <div className="ow-history">
    <h3>Saved report snapshots</h3>
    <p className="ow-muted">A snapshot preserves the period summary and source version at the time of review. It does not close or lock the operating period.</p>
    {view.closings.length ? <div className="ow-snapshot-list">{view.closings.map((item) => <button className="ow-snapshot" key={item.id} onClick={() => setOpened(opened === item.id ? "" : item.id)} aria-expanded={opened === item.id}><strong>{item.period}</strong><span>{item.reason}</span><small>{new Date(item.at).toLocaleString()} · revision {item.revision}</small><span aria-hidden="true">{opened === item.id ? "−" : "+"}</span></button>)}</div> : <p className="ow-empty">No report snapshots saved yet.</p>}
    {snapshot && <section className="ow-snapshot-detail"><h4>Saved report · {snapshot.period}</h4><SummaryValues summary={snapshot.summary} /><details><summary>Saved report provenance</summary><dl className="ow-provenance"><dt>Reviewer</dt><dd>{snapshot.actorId}</dd><dt>Source SHA-256</dt><dd>{snapshot.sourceHash}</dd><dt>Data SHA-256</dt><dd>{snapshot.dataHash}</dd></dl></details></section>}
    <h3>Recent activity</h3>
    <div className="ow-activity">{view.history.length ? view.history.map((item) => <article key={item.id}><div><strong>{item.action === "edit" ? "Input corrected" : item.action === "append" ? "Platform record added" : item.action === "load" ? "Workbook loaded" : "Report snapshot saved"}</strong><small>{new Date(item.at).toLocaleString()} · revision {item.revision}</small></div><p>{item.reason}</p>{item.action === "edit" && <p className="ow-muted">{item.tableKey} · {item.rowId} · {item.columnKey}: {display(item.oldValue)} → {display(item.newValue)}</p>}{item.action === "append" && <p className="ow-muted">{item.tableKey} · {item.rowId}</p>}<small>Saved by {item.actorId}</small></article>) : <p className="ow-empty">No changes recorded.</p>}</div>
  </div>;
}

export function WorkbookOperations({ workspaceId, canEdit, onSaved }: { workspaceId: string; canEdit: boolean; onSaved?: () => void }) {
  const [view, setView] = useState<WorkbookView | null>(null);
  const [section, setSection] = useState("overview");
  const [period, setPeriod] = useState("2026");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [edit, setEdit] = useState<Edit | null>(null);
  const [appendTable, setAppendTable] = useState<WorkbookTable | null>(null);
  const [createdRecord, setCreatedRecord] = useState<{ tableKey: string; identity: string } | null>(null);
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [snapshotReason, setSnapshotReason] = useState("");
  const requestId = useRef(0);
  const endpoint = `/workspaces/${encodeURIComponent(workspaceId)}/operating-workbook`;
  useEffect(() => { setView(null); setEdit(null); setAppendTable(null); setCreatedRecord(null); setSnapshotOpen(false); setNotice(""); setBusy(false); setSection("overview"); }, [workspaceId]);
  useEffect(() => {
    const request = ++requestId.current;
    setLoading(true);
    setError("");
    apiRevOps<WorkbookView>(`${endpoint}?period=${period}`).then((next) => { if (request === requestId.current) setView(next); }).catch((e) => { if (request === requestId.current) setError(workbookError(e, "Unable to load the workbook. Refresh to try again.")); }).finally(() => { if (request === requestId.current) setLoading(false); });
    return () => { requestId.current += 1; };
  }, [endpoint, period]);
  async function reload() {
    const request = ++requestId.current;
    setLoading(true);
    setError("");
    try { const next = await apiRevOps<WorkbookView>(`${endpoint}?period=${period}`); if (request === requestId.current) setView(next); }
    catch (e) { if (request === requestId.current) setError(workbookError(e, "Unable to refresh the workbook. Try again when the connection is available.")); }
    finally { if (request === requestId.current) setLoading(false); }
  }
  async function mutate(path: string, body: Record<string, unknown>, message: string) {
    const request = ++requestId.current;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const next = await apiRevOps<WorkbookView>(`${endpoint}${path}`, { ...body, period });
      if (request === requestId.current) { setView(next); setNotice(message); onSaved?.(); return true; }
      return false;
    } catch (e) { if (request === requestId.current) throw e; return false; }
    finally { if (request === requestId.current) setBusy(false); }
  }
  async function loadSample() {
    try { await mutate("", { action: "loadSample" }, "Accepted 2026 synthetic workbook loaded."); }
    catch (e) { setError(workbookError(e, "Unable to load the accepted sample. Refresh to check the workspace before retrying.")); }
  }
  async function saveSnapshot(event: FormEvent) {
    event.preventDefault();
    if (!view) return;
    try { if (await mutate("/snapshot", { revision: view.revision, reason: snapshotReason.trim() }, "Report snapshot saved with source and data provenance.")) { setSnapshotOpen(false); setSnapshotReason(""); } }
    catch (e) { setError(workbookError(e, "Unable to save the report snapshot. Your review note remains here so you can retry.")); }
  }
  const workbook = view?.workbook;
  const availableTables = workbook ? tablesFor(workbook, section) : [];
  const rows = workbook?.tables.reduce((total, table) => total + table.rows.length, 0) ?? 0;
  return <section className="operating-workbook" aria-label="Hospital operating workbook">
    <div className="ow-heading"><div><span className="ow-kicker">Dunder Mifflin Hospital · 2026</span><h2>Operating workbook</h2></div><div className="ow-period"><label>Reporting period<select value={period} disabled={busy} onChange={(event) => setPeriod(event.target.value)}><option value="2026">Full year · 2026</option>{monthNames.map((month, index) => <option key={month} value={`2026-${String(index + 1).padStart(2, "0")}`}>{month} 2026</option>)}</select></label><button className="ow-quiet" onClick={reload} disabled={loading || busy}>Refresh</button></div></div>
    {error && <p role="alert" className="ow-error">{error}</p>}
    {notice && <p role="status" className="ow-success">{notice}</p>}
    {loading && <p className="ow-loading" role="status">Loading operating records…</p>}
    {!loading && !workbook && !error && <div className="ow-load-state"><h3>Open the accepted 2026 operating year</h3><p>Load the full synthetic year from Dunder Mifflin Hospital – Restored Operations 2026 into this workspace.</p>{canEdit ? <button disabled={busy} onClick={loadSample}>{busy ? "Loading workbook…" : "Load accepted workbook"}</button> : <p className="ow-muted">An organization administrator can load the accepted workbook.</p>}</div>}
    {workbook && view && <>
      <div className="ow-status-strip"><span><i />Synthetic operating data</span><span>{workbook.tables.length} source tables</span><span>{number.format(rows)} records</span><span>Revision {view.revision}</span></div>
      <nav className="ow-nav" aria-label="Operating workbook areas">{sections.map((item) => <button key={item.key} className={section === item.key ? "ow-active" : ""} aria-current={section === item.key ? "page" : undefined} onClick={() => setSection(item.key)}>{item.label}</button>)}</nav>
      <div className="ow-content" aria-busy={loading || busy} hidden={loading}>
        {section === "overview" && <>
          <div className="ow-overview-heading"><div><h3>{period.length === 4 ? "2026 operating overview" : `${monthNames[Number(period.slice(5)) - 1]} operating overview`}</h3><p className="ow-muted">Current operating inputs · {period.length === 4 ? "annual totals" : "selected month"}. Calculated service values and cash receipts are separate.</p></div>{canEdit && <button disabled={loading || busy} className="ow-quiet" onClick={() => setSnapshotOpen(!snapshotOpen)}>Save report snapshot</button>}</div>
          {snapshotOpen && <form className="ow-snapshot-form" onSubmit={saveSnapshot}><label>Snapshot review note<textarea required minLength={3} value={snapshotReason} onChange={(event) => setSnapshotReason(event.target.value)} rows={2} maxLength={1000} placeholder="Record what you reviewed and any unresolved exceptions." /></label><div className="ow-actions"><button type="button" className="ow-quiet" onClick={() => setSnapshotOpen(false)}>Cancel</button><button disabled={busy || snapshotReason.trim().length < 3}>{busy ? "Saving…" : "Save snapshot"}</button></div></form>}
          {view.summary && <SummaryValues summary={view.summary} />}
        </>}
        {section === "source" && <details className="ow-source-details"><summary>Accepted source and calculation boundary</summary><dl className="ow-provenance"><dt>Source workbook</dt><dd>{workbook.source.name}</dd><dt>SHA-256</dt><dd>{workbook.source.sha256}</dd><dt>Imported at</dt><dd>{workbook.source.importedAt}</dd></dl><p className="ow-muted">The accepted workbook is preserved as source evidence. Live summaries use platform calculation rules; source formula results remain reference values. Public fee references and fictional contract examples retain their separate source labels.</p></details>}
        {section === "source" && view.summary && <WorkbookChecks summary={view.summary} />}
        {section === "history" ? <WorkbookHistory view={view} /> : (section !== "source" || availableTables.length > 0) && <TableExplorer key={`${workspaceId}-${section}`} tables={availableTables} period={period} canEdit={canEdit && !busy && !loading} onEdit={setEdit} onAppend={setAppendTable} createdRecord={createdRecord} />}
      </div>
      {edit && <EditCell key={`${edit.table.key}-${edit.row.id}-${edit.column.key}`} edit={edit} busy={busy} onCancel={() => setEdit(null)} onSave={async (value, reason) => { if (await mutate("/edit", { revision: view.revision, tableKey: edit.table.key, rowId: edit.row.id, columnKey: edit.column.key, value, reason }, "Correction saved. The operating summary has been recalculated.")) setEdit(null); }} />}
      {appendTable && <AppendRecord key={appendTable.key} table={appendTable} busy={busy} onCancel={() => setAppendTable(null)} onSave={async (values, reason) => {
        if (await mutate("/append", { revision: view.revision, tableKey: appendTable.key, values, reason }, "Platform record added with source history.")) {
          setCreatedRecord({ tableKey: appendTable.key, identity: String(values[appendIdentity[appendTable.key]] ?? "") });
          setAppendTable(null);
        }
      }} />}
    </>}
  </section>;
}
