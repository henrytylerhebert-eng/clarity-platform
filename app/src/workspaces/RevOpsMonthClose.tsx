import { useState } from "react";
import type {
  RevOpsCloseReadiness,
  RevOpsClosingReceipt,
  RevOpsCommand,
} from "../../../packages/domain-contracts/src/revOps";

export function ClosingReceipt({ receipt }: { receipt: RevOpsClosingReceipt }) {
  return (
    <section
      className="ro-receipt"
      aria-label={`Closing receipt ${receipt.closingNumber}`}
    >
      <h3>Closing receipt #{receipt.closingNumber}</h3>
      <p>
        {receipt.period} · {receipt.unit} · {receipt.timezone} · workspace
        revision {receipt.revision}
      </p>
      <p>
        Closed actuals: <strong>{receipt.actuals}</strong> · Approved budget:{" "}
        <strong>{receipt.budget.total}</strong> · Variance:{" "}
        <strong>{receipt.variance}</strong>
      </p>
      <p>
        {receipt.expectedDays} calendar dates recorded through {receipt.through}
        . Date convention: day ending at the next midnight.
      </p>
      <p>
        Closed by {receipt.actorId} · {receipt.at} · {receipt.reason}
      </p>
      <p>Fixed closing record. Later changes do not update these values.</p>
      {receipt.previousClosingRevision ? (
        <p>
          Previous closing: workspace revision {receipt.previousClosingRevision}
          .
        </p>
      ) : null}
      <details>
        <summary>Closing budget and daily sources</summary>
        <p>
          Budget version {receipt.budget.id} · {receipt.budget.costCenterLabel}:{" "}
          {receipt.budget.costCenter} · approved by {receipt.budget.approvedBy}{" "}
          at {receipt.budget.approvedAt}
        </p>
        <p>
          Budget source: {receipt.budget.source.name} ·{" "}
          {receipt.budget.source.sheet ?? "manual / CSV"} ·{" "}
          {receipt.budget.source.sha256 ?? "no file hash"}
        </p>
        <ul>
          {(receipt.budget.fields ?? []).map((v) => (
            <li key={v.fieldId}>
              {v.label}: {v.optionLabel ?? v.value} (v{v.version})
            </li>
          ))}
        </ul>
        {receipt.days.map((d) => (
          <article className="ro-reconciliation-row" key={d.date}>
            <h4>
              {d.date} · {d.actual.count} patient days · actual revision{" "}
              {d.actualRevision}
            </h4>
            <p>
              {d.actual.source.name} · {d.actual.source.sheet ?? "manual / CSV"}{" "}
              · row {d.actual.source.rows?.join(", ") ?? "not applicable"}
            </p>
            <p>
              {d.actual.actorId} · {d.actual.at}
              {d.actual.reason ? ` · ${d.actual.reason}` : ""}
            </p>
            <ul>
              {(d.actual.fields ?? []).map((v) => (
                <li key={v.fieldId}>
                  {v.label}: {v.optionLabel ?? v.value} (v{v.version})
                </li>
              ))}
            </ul>
            {d.actual.source.sha256 ? (
              <p>Source SHA-256: {d.actual.source.sha256}</p>
            ) : null}
          </article>
        ))}
      </details>
    </section>
  );
}

export function MonthClose({
  readiness,
  receipt,
  revision,
  currentRevision,
  busy,
  canClose,
  canReopen,
  onCommand,
}: {
  readiness: RevOpsCloseReadiness;
  receipt: RevOpsClosingReceipt | null;
  revision: number;
  currentRevision: number;
  busy: boolean;
  canClose: boolean;
  canReopen: boolean;
  onCommand: (command: RevOpsCommand, revision: number) => void;
}) {
  const [reason, setReason] = useState("");
  const stale = revision !== currentRevision;
  const allowed = readiness.closed ? canReopen : canClose;
  const disabled =
    busy ||
    stale ||
    !allowed ||
    reason.trim().length < 3 ||
    (!readiness.closed && !readiness.ready);
  return (
    <section aria-label="Month-end readiness">
      <h3>Month-end readiness</h3>
      <p>
        {readiness.recordedDays} of {readiness.expectedDays} calendar dates
        recorded for {readiness.period}. Close checks the whole month through{" "}
        {readiness.through}, regardless of the report cutoff.
      </p>
      <p>
        Known full-month actuals: {readiness.knownActuals} · Approved budget:{" "}
        {readiness.budget?.total ?? "Missing"} · Full-month variance:{" "}
        {readiness.variance ?? "Unavailable"}
      </p>
      {readiness.budget ? (
        <p>
          Selected closing budget: {readiness.budget.id}. This version will be
          preserved in the receipt.
        </p>
      ) : (
        <p className="ro-warning">
          An approved budget is required before closing.
        </p>
      )}
      {readiness.missingDates.length ? (
        <p className="ro-warning">
          Missing census dates: {readiness.missingDates.join(", ")}. Enter or
          upload each date; record zero explicitly when appropriate.
        </p>
      ) : (
        <p>Every calendar date has a recorded count.</p>
      )}
      {stale ? (
        <p className="ro-warning">
          Readiness changed. Refresh and review before continuing.
        </p>
      ) : null}
      {readiness.closed && !receipt ? (
        <p>
          This period was closed before closing receipts were available. No
          historical receipt exists; reopen and review before closing again.
        </p>
      ) : null}
      {!readiness.closed && receipt ? (
        <p>The month is open. The previous closing below remains unchanged.</p>
      ) : null}
      {canClose || canReopen ? (
        <form
          className="ro-inline"
          onSubmit={(e) => {
            e.preventDefault();
            if (disabled) return;
            onCommand(
              readiness.closed
                ? {
                    action: "reopen",
                    period: readiness.period,
                    reason: reason.trim(),
                  }
                : {
                    action: "close",
                    period: readiness.period,
                    budgetId: readiness.budget!.id,
                    reason: reason.trim(),
                  },
              revision,
            );
          }}
        >
          <label>
            Reason to {readiness.closed ? "reopen" : "close"} period
            <input
              name="reason"
              required
              minLength={3}
              maxLength={1000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={busy || stale || !allowed}
            />
          </label>
          <button disabled={disabled}>
            {readiness.closed ? "Reopen period" : "Close period"}
          </button>
        </form>
      ) : (
        <p>
          You can review this month; closing and reopening require delegated
          permission.
        </p>
      )}
      {receipt ? <ClosingReceipt receipt={receipt} /> : null}
    </section>
  );
}
