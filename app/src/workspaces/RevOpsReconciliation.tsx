import { useState } from "react";
import type {
  RevOpsImportRow,
  RevOpsReconciliation,
  RevOpsReconciliationReceipt,
  RevOpsState,
} from "../../../packages/domain-contracts/src/revOps";

function Values({
  value,
  state,
  incoming = false,
}: {
  value?: {
    count: number;
    fields?: NonNullable<RevOpsImportRow["incoming"]>["fields"];
  };
  state: RevOpsState;
  incoming?: boolean;
}) {
  if (!value)
    return <p>{incoming ? "Invalid or missing values" : "No saved day"}</p>;
  const missing = incoming
    ? (state.customFields ?? []).filter(
        (f) =>
          f.scope === "actual" &&
          !f.archived &&
          !value.fields?.some((v) => v.fieldId === f.id),
      )
    : [];
  return (
    <>
      <p>
        Patient days: <strong>{value.count}</strong>
      </p>
      <ul className="ro-field-values">
        {(value.fields ?? []).map((v) => (
          <li key={v.fieldId}>
            {v.label}: {v.optionLabel ?? v.value} <small>(v{v.version})</small>
            {state.customFields?.some((f) => f.id === v.fieldId && f.archived)
              ? " (archived, retained)"
              : ""}
          </li>
        ))}
        {missing.map((f) => (
          <li key={f.id}>
            {f.label}: blank (cleared if uploaded values are used)
          </li>
        ))}
      </ul>
    </>
  );
}
const outcomeLabel = {
  inserted: "Inserted",
  corrected: "Corrected",
  unchanged: "Unchanged",
  kept: "Kept saved values",
};
export function ReconciliationReceipt({
  receipt,
  state,
}: {
  receipt: RevOpsReconciliationReceipt;
  state: RevOpsState;
}) {
  return (
    <section className="ro-receipt" aria-label="Reconciliation receipt">
      <h3>Reconciliation receipt</h3>
      <p>
        {receipt.source.name} · {receipt.period} · workspace revision{" "}
        {receipt.revision}
      </p>
      <p>
        {receipt.counts.inserted} inserted · {receipt.counts.corrected}{" "}
        corrected · {receipt.counts.unchanged} unchanged · {receipt.counts.kept}{" "}
        kept
      </p>
      <p>
        Patient-day change: {receipt.patientDayChange > 0 ? "+" : ""}
        {receipt.patientDayChange}
      </p>
      <p>
        Reviewed by {receipt.actorId} · {receipt.at}
      </p>
      <details>
        <summary>Row decisions and sources</summary>
        {receipt.rows.map((r) => (
          <article key={r.row} className="ro-reconciliation-row">
            <h4>
              {r.date} · row {r.row} · {outcomeLabel[r.outcome]}
            </h4>
            <div className="ro-review-values">
              <div>
                <strong>Previously saved</strong>
                <Values value={r.saved} state={state} />
              </div>
              <div>
                <strong>Uploaded candidate</strong>
                <Values value={r.incoming} state={state} />
              </div>
            </div>
            <p>
              {r.reason ?? "No conflict decision required"} · actual revision{" "}
              {r.actualRevision}
            </p>
          </article>
        ))}
        <p>
          Source SHA-256: {receipt.source.sha256} · worksheet:{" "}
          {receipt.source.sheet ?? "CSV"}
        </p>
      </details>
    </section>
  );
}

export function ReconciliationReview({
  rows,
  state,
  busy,
  canEnter,
  canCorrect,
  stale,
  replayed,
  receipt,
  onConfirm,
  onCancel,
}: {
  rows: RevOpsImportRow[];
  state: RevOpsState;
  busy: boolean;
  canEnter: boolean;
  canCorrect: boolean;
  stale: boolean;
  replayed: boolean;
  receipt?: RevOpsReconciliationReceipt;
  onConfirm: (decisions: RevOpsReconciliation["decisions"]) => void;
  onCancel: () => void;
}) {
  const [choices, setChoices] = useState<
    Record<number, { choice: "" | "keep" | "use"; reason: string }>
  >({});
  const conflicts = rows.filter((r) => r.status === "conflict");
  const invalid = rows.filter((r) => r.status === "invalid").length;
  const unresolved = conflicts.filter(
    (r) =>
      !choices[r.row]?.choice ||
      (choices[r.row]?.reason.trim().length ?? 0) < 3,
  ).length;
  const counts = { inserted: 0, corrected: 0, unchanged: 0, kept: 0 };
  let delta = 0;
  for (const r of rows) {
    if (r.status === "new") {
      counts.inserted++;
      delta += r.incoming!.count;
    }
    if (r.status === "unchanged") counts.unchanged++;
    if (r.status === "conflict" && choices[r.row]?.choice === "keep")
      counts.kept++;
    if (r.status === "conflict" && choices[r.row]?.choice === "use") {
      counts.corrected++;
      delta += r.incoming!.count - r.saved!.count;
    }
  }
  const disabled =
    busy ||
    !canEnter ||
    (!replayed &&
      (stale ||
        !!invalid ||
        !!unresolved ||
        (conflicts.length > 0 && !canCorrect)));
  return (
    <section aria-label="Census reconciliation">
      {replayed ? (
        <>
          <p>
            Already imported. Confirmation will preserve all current values and
            later corrections.
          </p>
          {receipt ? (
            <ReconciliationReceipt receipt={receipt} state={state} />
          ) : (
            <p>This earlier import has no reconciliation receipt.</p>
          )}
        </>
      ) : (
        <>
          <p>
            Review every conflict. Decisions apply to the whole row. Invalid
            rows must be fixed in the file or mapping.
          </p>
          {stale ? (
            <p className="ro-warning">
              Data changed. Preview again before confirming; review these
              decisions again.
            </p>
          ) : null}
          {conflicts.length > 0 && !canCorrect ? (
            <p className="ro-warning">
              Correction permission is required to resolve this batch, including
              keeping saved values.
            </p>
          ) : null}
          {rows.map((r) => (
            <article
              key={r.row}
              className="ro-reconciliation-row"
              aria-label={`Row ${r.row}: ${r.date ?? "invalid date"}`}
            >
              <h4>
                {r.date ?? "Invalid date"} · row {r.row} · {r.status}
              </h4>
              <div className="ro-review-values">
                <div>
                  <strong>Saved values</strong>
                  <Values value={r.saved} state={state} />
                  <small>{r.saved?.source.name}</small>
                </div>
                <div>
                  <strong>Uploaded values</strong>
                  <Values value={r.incoming} state={state} incoming />
                </div>
              </div>
              {r.issues.map((issue, i) => (
                <p key={i} className="ro-warning">
                  {issue}
                </p>
              ))}
              {r.status === "conflict" ? (
                <div className="ro-form">
                  <label>
                    Decision for {r.date}
                    <select
                      aria-label={`Decision for ${r.date}`}
                      value={choices[r.row]?.choice ?? ""}
                      disabled={busy || stale || !canCorrect}
                      onChange={(e) =>
                        setChoices({
                          ...choices,
                          [r.row]: {
                            choice: e.target.value as "" | "keep" | "use",
                            reason: choices[r.row]?.reason ?? "",
                          },
                        })
                      }
                    >
                      <option value="">Choose a decision</option>
                      <option value="keep">Keep saved values</option>
                      <option value="use">Use uploaded values</option>
                    </select>
                  </label>
                  <label>
                    Reason for {r.date}
                    <textarea
                      aria-label={`Reason for ${r.date}`}
                      minLength={3}
                      maxLength={1000}
                      value={choices[r.row]?.reason ?? ""}
                      disabled={busy || stale || !canCorrect}
                      onChange={(e) =>
                        setChoices({
                          ...choices,
                          [r.row]: {
                            choice: choices[r.row]?.choice ?? "",
                            reason: e.target.value,
                          },
                        })
                      }
                    />
                  </label>
                </div>
              ) : null}
            </article>
          ))}
          <p aria-live="polite">
            {counts.inserted} insert · {counts.corrected} correct ·{" "}
            {counts.unchanged} unchanged · {counts.kept} keep · {invalid}{" "}
            invalid · {unresolved} unresolved
          </p>
          <p>
            Expected patient-day change:{" "}
            {invalid || unresolved
              ? "Resolve all rows first"
              : `${delta > 0 ? "+" : ""}${delta}`}
          </p>
        </>
      )}
      <button
        disabled={disabled}
        onClick={() =>
          onConfirm(
            replayed
              ? []
              : conflicts.map((r) => ({
                  row: r.row,
                  date: r.date!,
                  choice: choices[r.row]!.choice as "keep" | "use",
                  reason: choices[r.row]!.reason.trim(),
                })),
          )
        }
      >
        Confirm import
      </button>
      <button className="ro-secondary" disabled={busy} onClick={onCancel}>
        Discard preview
      </button>
    </section>
  );
}
