import { useState } from "react";
import syntheticImport from "../../../docs/product/evidence/IOP_ATTENDANCE_RECONCILIATION_SYNTHETIC_IMPORT.json";
import {
  closeIopReconciliationImport,
  previewIopReconciliationImport,
  type IopReconciliationCloseReceipt,
  type IopReconciliationPreview,
} from "../../../packages/domain-contracts/src/iopReconciliationImport";

function issueLabel(reason: string) {
  return reason.replaceAll("_", " ");
}

export function IopReconciliation() {
  const [input, setInput] = useState<unknown | null>(null);
  const [preview, setPreview] = useState<IopReconciliationPreview | null>(null);
  const [reviewerToken, setReviewerToken] = useState("");
  const [receipt, setReceipt] = useState<IopReconciliationCloseReceipt | null>(null);
  const [error, setError] = useState("");

  function load(candidate: unknown) {
    try {
      setPreview(previewIopReconciliationImport(candidate));
      setInput(candidate);
      setReceipt(null);
      setError("");
    } catch {
      setInput(null);
      setPreview(null);
      setReceipt(null);
      setError("This file is not a valid synthetic IOP reconciliation import.");
    }
  }

  async function readImport(file?: File) {
    if (!file) return;
    try {
      load(JSON.parse(await file.text()));
    } catch {
      setError("This file is not valid JSON.");
    }
  }

  function closePreview() {
    if (!input) return;
    try {
      setReceipt(
        closeIopReconciliationImport(input, {
          reviewerToken: reviewerToken.trim(),
          reviewedAt: new Date().toISOString(),
        }),
      );
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The reconciliation could not be closed.",
      );
    }
  }

  return (
    <div className="stack iop-reconciliation">
      <section className="panel iop-hero">
        <div>
          <span className="label">SYNTHETIC IOP OPERATIONS</span>
          <h2>Attendance reconciliation review</h2>
          <p>
            Validate source links from enrollment through plan, attendance,
            note audit, charge, and EMR billable evidence. This workspace does
            not determine clinical compliance or billing eligibility.
          </p>
        </div>
        <span className="status-badge warning">Human review required</span>
      </section>

      <section className="panel iop-import-panel" aria-label="Source import">
        <div className="panel-title">
          <div>
            <h2>Source import adapter</h2>
            <p>Accepts a bounded synthetic JSON export and preserves its source cutoff.</p>
          </div>
        </div>
        <div className="iop-actions">
          <button type="button" onClick={() => load(syntheticImport)}>
            Load synthetic source import
          </button>
          <label className="secondary-button iop-file-input">
            Select synthetic JSON
            <input
              aria-label="Select synthetic IOP JSON"
              type="file"
              accept="application/json,.json"
              onChange={(event) => void readImport(event.target.files?.[0])}
            />
          </label>
        </div>
        {error ? <p className="inline-warning">{error}</p> : null}
      </section>

      {preview ? (
        <>
          <section className="status-strip" aria-label="IOP reconciliation summary">
            <div><span className="label">Import</span><strong>{preview.importId}</strong><span className="subtext">synthetic source only</span></div>
            <div><span className="label">Derived issues</span><strong>{preview.issues.length}</strong><span className="subtext">source-link gaps</span></div>
            <div><span className="label">Unreviewed</span><strong>{preview.unresolved.length}</strong><span className="subtext">blocks close</span></div>
            <div><span className="label">Close state</span><strong>{preview.closeReady ? "Ready" : "Blocked"}</strong><span className="subtext">review gate</span></div>
          </section>

          <section className="panel iop-source-detail">
            <div className="panel-title"><div><h2>Source evidence</h2><p>Retained with the close receipt.</p></div></div>
            <dl>
              <div><dt>Source system</dt><dd>{preview.source.systemLabel}</dd></div>
              <div><dt>Source file</dt><dd>{preview.source.fileName}</dd></div>
              <div><dt>Exported</dt><dd>{preview.source.exportedAt}</dd></div>
              <div><dt>Source cutoff</dt><dd>{preview.source.cutoffAt}</dd></div>
            </dl>
          </section>

          <section className="grid-two">
            <section className="panel" aria-label="Reviewed exceptions">
              <div className="panel-title"><div><h2>Reviewed exceptions</h2><p>Each gap needs a discrete reviewer record.</p></div></div>
              <ul className="iop-issue-list">
                {preview.issues.map((issue) => {
                  const review = preview.sample.exceptionReviews.find(
                    (candidate) => candidate.issueKey === issue.issueKey,
                  );
                  return <li key={issue.issueKey}><strong>{issueLabel(issue.reason)}</strong><span>{issue.issueKey}</span><small>{review ? `${review.state} · ${review.reviewerToken} · ${review.disposition}` : "Not reviewed"}</small></li>;
                })}
              </ul>
            </section>
            <section className="panel" aria-label="Reconciliation close">
              <div className="panel-title"><div><h2>Close preview</h2><p>Closing records a human identity and the source cutoff.</p></div></div>
              {preview.unresolved.length ? <p className="inline-warning">{preview.unresolved.length} unmatched event(s) still require a reviewed exception.</p> : <p className="iop-ready">All derived gaps have reviewed exception records.</p>}
              <label className="iop-reviewer">Reviewer identity<input aria-label="Close reviewer identity" value={reviewerToken} onChange={(event) => setReviewerToken(event.target.value)} placeholder="REVIEWER_002" /></label>
              <button type="button" disabled={!preview.closeReady || !reviewerToken.trim()} onClick={closePreview}>Record reviewed close</button>
              {receipt ? <dl className="iop-receipt"><div><dt>Reviewer</dt><dd>{receipt.reviewerToken}</dd></div><div><dt>Source cutoff</dt><dd>{receipt.sourceCutoffAt}</dd></div><div><dt>Reviewed at</dt><dd>{receipt.reviewedAt}</dd></div><div><dt>Exceptions</dt><dd>{receipt.reviewedExceptionCount} reviewed of {receipt.issueCount} derived</dd></div></dl> : null}
            </section>
          </section>
        </>
      ) : null}
    </div>
  );
}
