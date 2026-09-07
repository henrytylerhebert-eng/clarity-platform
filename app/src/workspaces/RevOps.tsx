import { useEffect, useState, useRef, type FormEvent } from "react";
import {
  apiLogin,
  apiLogout,
  apiRevOps,
  type VerifiedPrincipal,
} from "../domain/api";
import type {
  RevOpsView,
  RevOpsCommand,
  RevOpsPermission,
  RevOpsImportRow,
  RevOpsReconciliationReceipt,
  RevOpsClosingReceipt,
  RevOpsCloseReadiness,
} from "../../../packages/domain-contracts/src/revOps";
import "./revOps.css";
import {
  CustomFieldSetup,
  EntryFields,
  ActualEntry,
  SnapshotValues,
  customValues,
} from "./RevOpsFields";
import {
  ReconciliationReview,
  ReconciliationReceipt,
} from "./RevOpsReconciliation";

import { MonthClose, ClosingReceipt } from "./RevOpsMonthClose";

type Comparison = {
  revision: number;
  closeReadiness?: RevOpsCloseReadiness;
  closingReceipt?: RevOpsClosingReceipt | null;
  onboarding?: {
    complete: boolean;
    steps: { label: string; complete: boolean; missing: string[] }[];
  };
  knownActuals: number;
  actuals: number | null;
  fullMonthBudget: number | null;
  phasedTarget: number | null;
  fullMonthVariance: number | null;
  phasedVariance: number | null;
  missingDates: string[];
  budget: { id: string } | null;
};
type Upload = {
  kind: "budget" | "actuals";
  name: string;
  content: string;
  sheet?: string;
  mapping: Record<string, string>;
  fieldMapping?: { fieldId: string; column: string }[];
};
type Preview = {
  revision: number;
  headers: string[];
  commands: unknown[];
  issues: { row: number; message: string }[];
  replayed: boolean;
  reconciliation?: {
    period: string;
    importKey: string;
    rows: RevOpsImportRow[];
  };
  receipt?: RevOpsReconciliationReceipt;
};
type Change = {
  id: string;
  revision: number;
  actorId: string;
  action: string;
  occurredAt: string;
  details: {
    reconciliation?: RevOpsReconciliationReceipt;
    closing?: RevOpsClosingReceipt;
  };
};
const permissionLabels: Record<RevOpsPermission, string> = {
  view: "View reports and history",
  budgetImport: "Enter / import budgets",
  budgetApprove: "Approve budgets",
  actualEnter: "Enter / import actuals",
  actualCorrect: "Correct actuals",
  periodClose: "Close periods",
  periodReopen: "Reopen periods",
};
const fields = (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  return new FormData(event.currentTarget);
};
const value = (data: FormData, key: string) => String(data.get(key) ?? "");
const format = (v: number | null | undefined) =>
  v == null
    ? "Unavailable"
    : new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(v);
function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function RevOps() {
  const [principal, setPrincipal] = useState<VerifiedPrincipal | null>(null);
  const [items, setItems] = useState<RevOpsView[]>([]);
  const [selected, setSelected] = useState("");
  const [tab, setTab] = useState("Comparison");
  const [period, setPeriod] = useState("2028-02");
  const [through, setThrough] = useState("2028-02-07");
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [budgetId, setBudgetId] = useState("");
  const fileRead = useRef(0);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState("");
  const [history, setHistory] = useState<Change[]>([]);
  const [members, setMembers] = useState<{ id: string; displayName: string }[]>(
    [],
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [upload, setUpload] = useState<Upload | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [receipt, setReceipt] = useState<RevOpsReconciliationReceipt | null>(
    null,
  );
  const [kind, setKind] = useState<"budget" | "actuals">("actuals");
  const current = items.find((i) => i.id === selected);
  const can = (p: RevOpsPermission) =>
    current?.permissions.includes(p) ?? false;
  const admin = principal?.roles.includes("ORGANIZATION_ADMIN");
  async function refresh() {
    const rows = await apiRevOps<RevOpsView[]>("/workspaces");
    setItems(rows);
    setSelected((s) =>
      rows.some((r) => r.id === s) ? s : (rows[0]?.id ?? ""),
    );
  }
  async function run(
    action: () => Promise<unknown>,
    success: string,
    reload = true,
  ) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
      if (reload) await refresh();
      setMessage(success);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }
  async function command(command: RevOpsCommand, expectedRevision?: number) {
    if (!current) return;
    await run(
      () =>
        apiRevOps(`/workspaces/${current.id}/commands`, {
          revision: expectedRevision ?? current.revision,
          command,
        }),
      "Saved with source history.",
    );
  }
  useEffect(() => {
    setPreview(null);
    setReceipt(null);
    setUpload(null);
    setBudgetId("");
    setMessage("");
    setError("");
  }, [selected]);
  useEffect(() => {
    let cancelled = false;
    setComparison(null);
    setComparisonError("");
    setComparisonLoading(Boolean(current));
    if (current)
      apiRevOps<Comparison>(
        `/workspaces/${current.id}/comparison?period=${period}&through=${through}${budgetId ? `&budgetId=${budgetId}` : ""}`,
      )
        .then((c) => {
          if (!cancelled) setComparison(c);
        })
        .catch((e) => {
          if (!cancelled) setComparisonError(e.message);
        })
        .finally(() => {
          if (!cancelled) setComparisonLoading(false);
        });
    return () => {
      cancelled = true;
    };
  }, [current, period, through, budgetId]);
  useEffect(() => {
    let cancelled = false;
    setHistory([]);
    if (current)
      apiRevOps<Change[]>(`/workspaces/${current.id}/history`)
        .then((h) => {
          if (!cancelled) setHistory(h);
        })
        .catch((e) => {
          if (!cancelled) setError(e.message);
        });
    return () => {
      cancelled = true;
    };
  }, [current]);
  useEffect(() => {
    if (admin)
      apiRevOps<{ id: string; displayName: string }[]>("/members")
        .then(setMembers)
        .catch((e) => setError(e.message));
  }, [admin]);
  async function readFile(file: File) {
    const request = ++fileRead.current;
    setError("");
    setPreview(null);
    setReceipt(null);
    setUpload(null);
    setBusy(true);
    try {
      if (file.size > 1024 * 1024)
        throw new Error("Use a CSV or XLSX file under 1 MB.");
      const bytes = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (const b of bytes) binary += String.fromCharCode(b);
      if (request === fileRead.current)
        setUpload({
          kind,
          name: file.name,
          content: btoa(binary),
          mapping: {},
        });
    } catch (e) {
      if (request === fileRead.current)
        setError(e instanceof Error ? e.message : "File could not be read");
    } finally {
      if (request === fileRead.current) setBusy(false);
    }
  }
  const template = (kind: "budget" | "actual") => {
    if (!current) return "";
    const columns = (current.state.customFields ?? [])
      .filter((f) => f.scope === kind && !f.archived)
      .map((f) => `Field: ${f.label}`);
    const quote = (v: string) => `"${v.replaceAll('"', '""')}"`;
    const headers =
      kind === "budget"
        ? ["period", "monthly_budget", "cost_center"]
        : ["activity_date", "patient_days"];
    const center = current.state.field.options[0] ?? "";
    // Do not generate spreadsheet formulas from a configured cost-center label.
    const safeCenter = /^[=+@\-\t\r\n]/.test(center) ? "" : center;
    const rows =
      kind === "budget"
        ? [[period, "290", safeCenter]]
        : [9, 10, 11, 10, 12, 8, 10].map((n, i) => [
            `${period}-${String(i + 1).padStart(2, "0")}`,
            String(n),
          ]);
    return (
      [
        [...headers, ...columns],
        ...rows.map((r) => [...r, ...columns.map(() => "")]),
      ]
        .map((r) => r.map(quote).join(","))
        .join("\n") + "\n"
    );
  };
  const base = current ? `/workspaces/${current.id}` : "";
  return (
    <main className="revops">
      <header className="ro-header">
        <div>
          <a href="./">Clarity</a>
          <span className="ro-eyebrow">INPATIENT OPERATIONS</span>
          <h1>Budget & daily activity</h1>
        </div>
        <span className="ro-synthetic">
          Synthetic workspace · local development
        </span>
      </header>
      {!principal ? (
        <section className="ro-login">
          <h2>Sign in to your organization</h2>
          <p>
            Access is verified by the server. The prototype role selector does
            not grant access here.
          </p>
          <form
            onSubmit={(e) => {
              const d = fields(e);
              setBusy(true);
              setError("");
              apiLogin(value(d, "assertion"))
                .then(async (p) => {
                  setPrincipal(p);
                  await refresh();
                })
                .catch((e) => setError(e.message))
                .finally(() => setBusy(false));
            }}
          >
            <label>
              Development assertion
              <input
                name="assertion"
                defaultValue="syn-assert-revops-admin-dev"
                required
                autoComplete="off"
              />
            </label>
            <button disabled={busy}>Sign in</button>
          </form>
          <p>
            Local fixtures: <code>syn-assert-revops-admin-dev</code> or{" "}
            <code>syn-assert-revops-census-dev</code>. Administrator delegates
            census permissions after setup.
          </p>
        </section>
      ) : (
        <>
          <div className="ro-session">
            <span>
              {principal.displayName} <small>{principal.organizationId}</small>
            </span>
            <button
              className="ro-secondary"
              disabled={busy}
              onClick={() => {
                void apiLogout()
                  .finally(() => {
                    setPrincipal(null);
                    setItems([]);
                    setComparison(null);
                    setHistory([]);
                    setUpload(null);
                    setPreview(null);
                  })
                  .catch((e) =>
                    setError(
                      `Signed out locally; server session revocation could not be confirmed: ${e.message}`,
                    ),
                  );
              }}
            >
              Sign out
            </button>
          </div>
          <div className="ro-toolbar">
            <label>
              Hospital / unit
              <select
                aria-label="Hospital / unit"
                disabled={busy}
                value={selected}
                onChange={(e) => {
                  setComparison(null);
                  setSelected(e.target.value);
                }}
              >
                <option value="">Select workspace</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} / {i.state.unit}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Month
              <input
                disabled={busy}
                type="month"
                value={period}
                onChange={(e) => {
                  setComparison(null);
                  setPeriod(e.target.value);
                  setPreview(null);
                  setThrough(`${e.target.value}-01`);
                  setBudgetId("");
                }}
              />
            </label>
            <label>
              Through date
              <input
                disabled={busy}
                type="date"
                value={through}
                onChange={(e) => setThrough(e.target.value)}
              />
            </label>
            <button
              className="ro-secondary"
              disabled={busy}
              onClick={() => void run(refresh, "Refreshed from server.", false)}
            >
              Refresh
            </button>
          </div>
          <nav className="ro-tabs" aria-label="Rev Ops sections">
            {[
              "Comparison",
              "Budgets",
              "Daily actuals",
              "Upload",
              "History",
              ...(admin ? ["Setup & access"] : []),
            ].map((t) => (
              <button
                key={t}
                aria-current={tab === t ? "page" : undefined}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </nav>
          {current && comparison?.onboarding ? (
            <details
              className="ro-onboarding"
              open={!comparison.onboarding.complete && tab === "Setup & access"}
            >
              <summary>
                {comparison.onboarding.complete
                  ? "Synthetic workflow configured"
                  : "Finish workspace setup"}
              </summary>
              <p>
                Progress is based on saved setup, delegated responsibilities and{" "}
                {period} records.
              </p>
              <ul>
                {comparison.onboarding.steps.map((step) => (
                  <li key={step.label}>
                    {step.complete ? "✓" : "○"} {step.label}
                    {step.missing.length ? ` — ${step.missing.join(", ")}` : ""}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
          {!current && tab !== "Setup & access" ? (
            <section>
              <h2>No accessible workspace</h2>
              <p>
                {admin
                  ? "Open Setup & access to add a hospital and unit."
                  : "Your administrator must delegate access to a hospital workspace."}
              </p>
            </section>
          ) : null}
          {tab === "Setup & access" && admin ? (
            <section>
              <h2>Hospital setup</h2>
              <p>
                Midnight census is labeled with the day just ended. Choose the
                hospital’s local timezone.
              </p>
              <form
                className="ro-form"
                onSubmit={(e) => {
                  const d = fields(e);
                  void run(async () => {
                    const row = await apiRevOps<RevOpsView>("/workspaces", {
                      name: value(d, "name"),
                      unit: value(d, "unit"),
                      timezone: value(d, "timezone"),
                      costCenterLabel: value(d, "label"),
                      costCenterOptions: value(d, "options")
                        .split(",")
                        .map((s) => s.trim()),
                    });
                    setSelected(row.id);
                  }, "Hospital workspace created.");
                }}
              >
                <label>
                  Hospital name
                  <input name="name" required />
                </label>
                <label>
                  Unit name
                  <input name="unit" defaultValue="Adult" required />
                </label>
                <label>
                  Timezone
                  <input
                    name="timezone"
                    defaultValue="America/Chicago"
                    required
                  />
                </label>
                <label>
                  Custom field label
                  <input name="label" defaultValue="Cost center" required />
                </label>
                <label>
                  Allowed values, comma separated
                  <input name="options" defaultValue="Inpatient" required />
                </label>
                <button disabled={busy}>Create workspace</button>
              </form>
              {current ? (
                <>
                  <CustomFieldSetup
                    current={current}
                    busy={busy}
                    command={command}
                  />
                  <h2>Delegate access</h2>
                  <form
                    className="ro-form"
                    key={`grant-${current.id}`}
                    onSubmit={(e) => {
                      const d = fields(e);
                      void command({
                        action: "grant",
                        userId: value(d, "user"),
                        permissions: d.getAll(
                          "permission",
                        ) as RevOpsPermission[],
                      });
                    }}
                  >
                    <label>
                      Staff member
                      <select name="user">
                        {members.map((m) => (
                          <option value={m.id} key={m.id}>
                            {m.displayName}
                          </option>
                        ))}
                      </select>
                    </label>
                    <fieldset>
                      <legend>
                        Permissions (replaces the selected member’s existing
                        grants)
                      </legend>
                      {Object.entries(permissionLabels).map(([p, label]) => (
                        <label className="ro-check" key={p}>
                          <input type="checkbox" name="permission" value={p} />
                          {label}
                        </label>
                      ))}
                    </fieldset>
                    <button disabled={busy}>Save delegation</button>
                  </form>
                  <ul>
                    {Object.entries(current.state.grants).map(([id, p]) => (
                      <li key={id}>
                        {members.find((m) => m.id === id)?.displayName ?? id}:{" "}
                        {p.join(", ") || "No access"}
                      </li>
                    ))}
                  </ul>
                  <h2>Custom field</h2>
                  <form
                    className="ro-form"
                    key={`field-${current.id}-${current.revision}`}
                    onSubmit={(e) => {
                      const d = fields(e);
                      void command({
                        action: "field",
                        label: value(d, "label"),
                        options: value(d, "options")
                          .split(",")
                          .map((s) => s.trim()),
                        archived: d.has("archived"),
                      });
                    }}
                  >
                    <label>
                      Field label
                      <input
                        name="label"
                        defaultValue={current.state.field.label}
                        required
                      />
                    </label>
                    <label>
                      Allowed values
                      <input
                        name="options"
                        defaultValue={current.state.field.options.join(", ")}
                        required
                      />
                    </label>
                    <label className="ro-check">
                      <input
                        type="checkbox"
                        name="archived"
                        defaultChecked={current.state.field.archived}
                      />
                      Archive field (prevents new budgets)
                    </label>
                    <button disabled={busy}>Save field revision</button>
                  </form>
                </>
              ) : null}
            </section>
          ) : null}
          {current && tab === "Comparison" ? (
            <section>
              <div className="ro-section-title">
                <div>
                  <h2>Patient-day comparison</h2>
                  <p>
                    {current.name} / {current.state.unit} ·{" "}
                    {current.state.timezone} · revision {current.revision}
                  </p>
                </div>
                <span>
                  {current.state.closedPeriods.includes(period)
                    ? "Closed period"
                    : "Open period"}
                </span>
              </div>
              <label>
                Approved baseline
                <select
                  value={budgetId}
                  onChange={(e) => {
                    setComparison(null);
                    setBudgetId(e.target.value);
                  }}
                >
                  <option value="">Latest approved version</option>
                  {current.state.budgets
                    .filter(
                      (b) => b.period === period && b.status === "approved",
                    )
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.createdAt} · {b.total} days
                      </option>
                    ))}
                </select>
              </label>
              {comparison ? (
                <>
                  <div className="ro-metrics">
                    <div>
                      <span>Actual patient days through cutoff</span>
                      <strong>{format(comparison.actuals)}</strong>
                    </div>
                    <div>
                      <span>Full-month budget</span>
                      <strong>{format(comparison.fullMonthBudget)}</strong>
                    </div>
                    <div>
                      <span>Phased target through cutoff</span>
                      <strong>{format(comparison.phasedTarget)}</strong>
                    </div>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>Comparison</th>
                        <th>Actual minus target</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Full monthly budget</td>
                        <td>{format(comparison.fullMonthVariance)}</td>
                      </tr>
                      <tr>
                        <td>Phased budget through {through}</td>
                        <td>{format(comparison.phasedVariance)}</td>
                      </tr>
                    </tbody>
                  </table>
                  <p>
                    Partial-month actuals against the full budget show progress,
                    not a revenue forecast. Positive variance means more patient
                    days than budget; it is not a clinical recommendation.
                  </p>
                  {comparison.missingDates.length ? (
                    <p className="ro-warning">
                      Incomplete: {comparison.missingDates.join(", ")}.
                      Known-day total: {comparison.knownActuals}.
                      Complete-period variances are unavailable.
                    </p>
                  ) : null}
                  <p className="ro-muted">
                    Forecast and collections are outside this slice. No values
                    are inferred.
                  </p>
                </>
              ) : (
                <p>
                  {comparisonLoading
                    ? "Loading comparison…"
                    : `Comparison unavailable: ${comparisonError.replaceAll("_", " ")}. Check the selected dates and baseline.`}
                </p>
              )}
              {comparison?.closeReadiness ? (
                <MonthClose
                  key={`${current.id}:${period}:${comparison.revision}:${comparison.closeReadiness.budget?.id ?? ""}`}
                  readiness={comparison.closeReadiness}
                  receipt={comparison.closingReceipt ?? null}
                  revision={comparison.revision}
                  currentRevision={current.revision}
                  busy={busy}
                  canClose={can("periodClose")}
                  canReopen={can("periodReopen")}
                  onCommand={(c, r) => void command(c, r)}
                />
              ) : null}
            </section>
          ) : null}
          {current && tab === "Budgets" ? (
            <section>
              <h2>Budget versions</h2>
              <p>
                Approved baselines are preserved. A changed budget creates a new
                draft version.
              </p>
              {can("budgetImport") ? (
                <form
                  key={`budget-${current.id}-${period}`}
                  className="ro-form"
                  onSubmit={(e) => {
                    const d = fields(e);
                    const targets = value(d, "targets").trim();
                    void command({
                      action: "budget",
                      period,
                      total: Number(d.get("total")),
                      costCenter: value(d, "center"),
                      fields: customValues(d, current.state, "budget"),
                      ...(targets
                        ? {
                            dailyTargets: targets
                              .split(",")
                              .map((t) => (t.trim() === "" ? NaN : Number(t))),
                          }
                        : {}),
                    });
                  }}
                >
                  <label>
                    Monthly patient-day budget
                    <input
                      name="total"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                    />
                  </label>
                  <label>
                    {current.state.field.label}
                    <select name="center">
                      {current.state.field.options.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Custom daily targets (optional, comma separated)
                    <textarea
                      name="targets"
                      placeholder="Leave blank for an even daily allocation"
                    />
                  </label>
                  <EntryFields
                    state={current.state}
                    scope="budget"
                    values={
                      current.state.budgets
                        .filter((b) => b.period === period)
                        .at(-1)?.fields
                    }
                  />
                  <button disabled={busy || current.state.field.archived}>
                    Create draft budget
                  </button>
                </form>
              ) : null}
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Patient days</th>
                    <th>Cost center at entry</th>
                    <th>Status / source</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {current.state.budgets.map((b) => (
                    <tr key={b.id}>
                      <td>{b.period}</td>
                      <td>{format(b.total)}</td>
                      <td>
                        {b.costCenterLabel}: {b.costCenter}
                        <SnapshotValues
                          state={current.state}
                          scope="budget"
                          values={b.fields}
                        />
                      </td>
                      <td>
                        {b.status} · {b.source.name}
                      </td>
                      <td>
                        {b.status === "draft" && can("budgetApprove") ? (
                          <button
                            disabled={busy}
                            onClick={() =>
                              void command({
                                action: "approve",
                                budgetId: b.id,
                              })
                            }
                          >
                            Approve budget
                          </button>
                        ) : (
                          (b.approvedBy ?? "Awaiting approval")
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : null}
          {current && tab === "Daily actuals" ? (
            <section>
              <h2>Daily patient days</h2>
              <p>
                Enter the census at midnight ending the selected day. Correcting
                an existing value requires delegated permission and a reason.
              </p>
              {can("actualEnter") || can("actualCorrect") ? (
                <ActualEntry
                  key={`${current.id}-${through}`}
                  current={current}
                  busy={busy}
                  command={command}
                  through={through}
                />
              ) : null}
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Patient days</th>
                    <th>Source</th>
                    <th>Accountability</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(current.state.actuals)
                    .filter(([date]) => date.startsWith(period))
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([date, versions]) => {
                      const v = versions.at(-1)!;
                      return (
                        <tr key={date}>
                          <td>{date}</td>
                          <td>{v.count}</td>
                          <td>
                            {v.source.name}
                            <SnapshotValues
                              state={current.state}
                              scope="actual"
                              values={v.fields}
                            />
                          </td>
                          <td>
                            <details>
                              <summary>
                                {versions.length} revision(s) · {v.actorId}
                              </summary>
                              {versions.map((x, i) => (
                                <div key={i}>
                                  <p>
                                    {x.at}: {x.count} · {x.actorId} ·{" "}
                                    {x.reason ?? "Original entry"} ·{" "}
                                    {x.source.name}
                                  </p>
                                  <SnapshotValues
                                    state={current.state}
                                    scope="actual"
                                    values={x.fields}
                                  />
                                </div>
                              ))}
                            </details>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </section>
          ) : null}
          {current && tab === "Upload" ? (
            <section>
              <h2>Upload and reconcile</h2>
              <p>
                CSV or XLSX, first row headers, up to 366 data rows and 1 MB.
                Use one monthly budget row or daily actual rows. Export reviewed
                values; workbook formulas are not executed.
              </p>
              <div className="ro-inline">
                <button
                  className="ro-secondary"
                  onClick={() =>
                    download("budget-template.csv", template("budget"))
                  }
                >
                  Budget template
                </button>
                <button
                  className="ro-secondary"
                  onClick={() =>
                    download("actuals-template.csv", template("actual"))
                  }
                >
                  Synthetic actuals template
                </button>
              </div>
              <p>
                Templates include your current custom columns. Fill their values
                before uploading. “Field: label” headers map automatically; use
                the column inputs below for other files.
              </p>
              <label>
                Import type
                <select
                  disabled={busy}
                  value={kind}
                  onChange={(e) => {
                    setKind(e.target.value as typeof kind);
                    setUpload(null);
                    setPreview(null);
                  }}
                >
                  <option value="actuals">Daily actuals</option>
                  <option value="budget">Monthly budget</option>
                </select>
              </label>
              <label>
                File
                <input
                  disabled={busy}
                  key={`${kind}-${selected}`}
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void readFile(f);
                  }}
                />
              </label>
              {upload ? (
                <form
                  key={upload.name}
                  className="ro-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void run(
                      async () => {
                        setPreview(null);
                        setPreview(
                          await apiRevOps<Preview>(`${base}/import`, {
                            revision: current.revision,
                            commit: false,
                            upload,
                            ...(upload.kind === "actuals"
                              ? { reconciliation: { period } }
                              : {}),
                          }),
                        );
                      },
                      "Preview loaded; no rows imported.",
                      false,
                    );
                  }}
                >
                  <p>Selected file: {upload.name}</p>
                  <label>
                    Worksheet (optional)
                    <input
                      disabled={busy}
                      value={upload.sheet ?? ""}
                      onChange={(e) => {
                        setUpload({
                          ...upload,
                          sheet: e.target.value || undefined,
                        });
                        setPreview(null);
                      }}
                    />
                  </label>
                  {(kind === "budget"
                    ? ["period", "total", "costCenter"]
                    : ["date", "count"]
                  ).map((key) => (
                    <label key={key}>
                      {key} column
                      <input
                        disabled={busy}
                        value={upload.mapping[key] ?? ""}
                        placeholder={
                          (
                            {
                              period: "period",
                              total: "monthly_budget",
                              costCenter: "cost_center",
                              date: "activity_date",
                              count: "patient_days",
                            } as Record<string, string>
                          )[key]
                        }
                        onChange={(e) => {
                          setUpload({
                            ...upload,
                            mapping: {
                              ...upload.mapping,
                              [key]:
                                e.target.value ||
                                (
                                  {
                                    period: "period",
                                    total: "monthly_budget",
                                    costCenter: "cost_center",
                                    date: "activity_date",
                                    count: "patient_days",
                                  } as Record<string, string>
                                )[key]!,
                            },
                          });
                          setPreview(null);
                        }}
                      />
                    </label>
                  ))}
                  {(current.state.customFields ?? [])
                    .filter(
                      (f) =>
                        f.scope === (kind === "budget" ? "budget" : "actual") &&
                        !f.archived,
                    )
                    .map((f) => (
                      <label key={f.id}>
                        {f.label} column
                        {f.required ? " (required)" : " (optional)"}
                        <input
                          disabled={busy}
                          value={
                            upload.fieldMapping?.find((m) => m.fieldId === f.id)
                              ?.column ?? ""
                          }
                          aria-label={`${f.label} column${f.required ? " (required)" : " (optional)"}`}
                          placeholder={`Column containing ${f.label}`}
                          onChange={(e) => {
                            const rest = (upload.fieldMapping ?? []).filter(
                              (m) => m.fieldId !== f.id,
                            );
                            setUpload({
                              ...upload,
                              fieldMapping: e.target.value
                                ? [
                                    ...rest,
                                    { fieldId: f.id, column: e.target.value },
                                  ]
                                : rest,
                            });
                            setPreview(null);
                          }}
                        />
                        {f.type === "select" ? (
                          <small>
                            Choices:{" "}
                            {f.options
                              .filter((o) => !o.archived)
                              .map((o) => o.label)
                              .join(", ")}
                          </small>
                        ) : null}
                      </label>
                    ))}
                  <button
                    disabled={
                      busy ||
                      !can(kind === "budget" ? "budgetImport" : "actualEnter")
                    }
                  >
                    Preview import
                  </button>
                </form>
              ) : null}
              {preview ? (
                <div>
                  <h3>
                    {preview.commands.length} mapped rows{" "}
                    {preview.replayed ? "· already imported" : ""}
                  </h3>
                  <p>Headers: {preview.headers.join(", ")}</p>
                  {preview.reconciliation ? (
                    <ReconciliationReview
                      rows={preview.reconciliation.rows}
                      state={current.state}
                      busy={busy}
                      canEnter={can("actualEnter")}
                      canCorrect={can("actualCorrect")}
                      stale={current.revision !== preview.revision}
                      replayed={preview.replayed}
                      receipt={preview.receipt}
                      onCancel={() => {
                        setPreview(null);
                        setMessage("Preview discarded; no rows imported.");
                      }}
                      onConfirm={(decisions) =>
                        void run(async () => {
                          const result = await apiRevOps<{
                            receipt?: RevOpsReconciliationReceipt;
                          }>(`${base}/import`, {
                            revision: preview.revision,
                            commit: true,
                            upload,
                            reconciliation: {
                              period: preview.reconciliation!.period,
                              importKey: preview.reconciliation!.importKey,
                              decisions,
                            },
                          });
                          setReceipt(result.receipt ?? null);
                          setPreview(null);
                          setUpload(null);
                        }, "Import accepted. Existing corrections and approved baselines are preserved.")
                      }
                    />
                  ) : (
                    <>
                      {preview.issues.map((i, n) => (
                        <p className="ro-warning" key={n}>
                          Row {i.row}: {i.message}
                        </p>
                      ))}
                      <details>
                        <summary>Review mapped values</summary>
                        <pre>{JSON.stringify(preview.commands, null, 2)}</pre>
                      </details>
                      <button
                        disabled={busy || preview.issues.length > 0}
                        onClick={() =>
                          void run(async () => {
                            await apiRevOps(`${base}/import`, {
                              revision: preview.revision,
                              commit: true,
                              upload,
                            });
                            setPreview(null);
                            setUpload(null);
                          }, "Import accepted. Existing corrections and approved baselines are preserved.")
                        }
                      >
                        Confirm import
                      </button>
                    </>
                  )}
                </div>
              ) : null}
              {receipt ? (
                <ReconciliationReceipt
                  receipt={receipt}
                  state={current.state}
                />
              ) : null}
            </section>
          ) : null}
          {current && tab === "History" ? (
            <section>
              <h2>Source and change history</h2>
              <p>
                Most recent 100 changes. Records retain the responsible user,
                source and workspace revision.
              </p>
              {history.map((h) => (
                <details key={h.id}>
                  <summary>
                    Revision {h.revision} · {h.action} · {h.actorId} ·{" "}
                    {h.occurredAt}
                  </summary>
                  {h.details.reconciliation ? (
                    <ReconciliationReceipt
                      receipt={h.details.reconciliation}
                      state={current.state}
                    />
                  ) : null}
                  {h.details.closing ? (
                    <ClosingReceipt receipt={h.details.closing} />
                  ) : null}
                  <pre>{JSON.stringify(h.details, null, 2)}</pre>
                </details>
              ))}
              {history.length === 100 ? (
                <button
                  onClick={() =>
                    void run(
                      async () => {
                        const old = await apiRevOps<Change[]>(
                          `${base}/history?before=${history.at(-1)!.revision}`,
                        );
                        setHistory(old);
                      },
                      "Older history loaded.",
                      false,
                    )
                  }
                >
                  Load older history
                </button>
              ) : null}
            </section>
          ) : null}
        </>
      )}
      {error ? (
        <p role="alert" className="ro-error">
          {error.replaceAll("_", " ")}. The result could not be confirmed.
          Refresh the workspace before retrying.
        </p>
      ) : null}
      {message ? (
        <p role="status" className="ro-status">
          {message}
        </p>
      ) : null}
      {busy ? <p role="status">Working…</p> : null}
    </main>
  );
}
