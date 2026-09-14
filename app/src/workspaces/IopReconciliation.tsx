import { useState } from "react";
import { ZodError } from "zod";
import { StatusBadge } from "../components/StatusBadge";
import syntheticImport from "../../../docs/product/evidence/IOP_ATTENDANCE_RECONCILIATION_SYNTHETIC_IMPORT.json";
import { IopReconciliationImportSchema } from "../../../packages/domain-contracts/src/iopReconciliationImport";
import {
  validateIopReconciliationSample,
  type IopReconciliationIssue,
  type IopReconciliationSample,
} from "../../../packages/domain-contracts/src/iopReconciliation";
import {
  apiIopReconciliationClose,
  apiIopReconciliationGet,
  apiIopReconciliationImport,
  apiIopReconciliationReview,
  describeApiError,
  type IopReconciliationImportDetailDto,
  type IopSourceRecordDto,
  type IopSourceRecordType,
  type VerifiedPrincipal,
} from "../domain/api";

const DEFAULT_FACILITY_ID = "synthetic-iop-facility-api-dev";
const DEFAULT_INTEGRATION_KEY = "SYNTHETIC_IOP_PROGRAM";

function issueLabel(reason: string) {
  return reason.replaceAll("_", " ");
}

function newIdempotencyKey(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

/**
 * The backend requires a stable per-record source-lineage entry for every id
 * referenced anywhere in the reconciliation sample (IopPersistedImportRequestSchema's
 * superRefine). The synthetic sample has no independent "source record version"
 * concept of its own, so each id gets one entry at a constant version.
 */
function deriveSourceRecords(sample: IopReconciliationSample): IopSourceRecordDto[] {
  const record = (type: IopSourceRecordType, sourceRecordId: string): IopSourceRecordDto => ({
    type,
    sourceRecordId,
    sourceVersion: "v1",
  });
  return [
    ...sample.enrollments.map((entry) => record("ENROLLMENT", entry.enrollmentId)),
    ...sample.treatmentPlans.map((entry) => record("TREATMENT_PLAN", entry.planId)),
    ...sample.attendanceEvents.map((entry) => record("ATTENDANCE", entry.attendanceId)),
    ...sample.noteAudits.map((entry) => record("NOTE_AUDIT", entry.noteId)),
    ...sample.chargeLines.map((entry) => record("CHARGE_LINE", entry.chargeLineId)),
    ...sample.emrBillableLines.map((entry) => record("EMR_BILLABLE_LINE", entry.billableLineId)),
  ];
}

interface ReviewDraft {
  disposition: "RESOLVED" | "ACCEPTED_EXCEPTION";
  reason: string;
}

const DEFAULT_DRAFT: ReviewDraft = { disposition: "ACCEPTED_EXCEPTION", reason: "" };

export function IopReconciliation({ apiPrincipal }: { apiPrincipal: VerifiedPrincipal | null }) {
  const [facilityId, setFacilityId] = useState(DEFAULT_FACILITY_ID);
  const [integrationKey, setIntegrationKey] = useState(DEFAULT_INTEGRATION_KEY);
  const [loadId, setLoadId] = useState("");
  const [record, setRecord] = useState<IopReconciliationImportDetailDto | null>(null);
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, ReviewDraft>>({});
  const [closeReason, setCloseReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const sample = record?.payload.reconciliation ?? null;
  const allIssues: IopReconciliationIssue[] = sample ? validateIopReconciliationSample(sample).issues : [];
  const reviewedKeys = new Set((record?.exceptionReviews ?? []).map((review) => review.issueKey));
  const unresolved = allIssues.filter((issue) => !reviewedKeys.has(issue.issueKey));
  const closeReady = allIssues.length > 0 && unresolved.length === 0 && !record?.closeReceipt;

  async function loadById(id: string) {
    if (!apiPrincipal || !id.trim()) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      setRecord(await apiIopReconciliationGet(id.trim()));
    } catch (cause) {
      setError(describeApiError(cause));
    } finally {
      setBusy(false);
    }
  }

  async function importCandidate(candidate: unknown) {
    if (!apiPrincipal) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const parsed = IopReconciliationImportSchema.parse(candidate);
      const { import: created, replayed } = await apiIopReconciliationImport({
        facilityId: facilityId.trim(),
        programId: parsed.reconciliation.programId,
        integrationKey: integrationKey.trim(),
        idempotencyKey: newIdempotencyKey("iop-import"),
        source: {
          fileName: parsed.source.fileName,
          exportedAt: parsed.source.exportedAt,
          cutoffAt: parsed.source.cutoffAt,
        },
        sourceRecords: deriveSourceRecords(parsed.reconciliation),
        // Review authority is never accepted from an import payload — the
        // backend strips this regardless, so the outgoing request says so too.
        reconciliation: { ...parsed.reconciliation, exceptionReviews: [] },
      });
      setRecord(await apiIopReconciliationGet(created.id));
      setLoadId(created.id);
      setReviewDrafts({});
      setNotice(
        replayed
          ? "This exact source snapshot was already imported; showing the existing record."
          : "Source import accepted.",
      );
    } catch (cause) {
      setRecord(null);
      setError(
        cause instanceof ZodError
          ? "This file is not a valid synthetic IOP reconciliation import."
          : describeApiError(cause),
      );
    } finally {
      setBusy(false);
    }
  }

  async function readImportFile(file?: File) {
    if (!file) return;
    let candidate: unknown;
    try {
      candidate = JSON.parse(await file.text());
    } catch {
      setError("This file is not valid JSON.");
      return;
    }
    await importCandidate(candidate);
  }

  function draftFor(issueKey: string): ReviewDraft {
    return reviewDrafts[issueKey] ?? DEFAULT_DRAFT;
  }

  function setDraft(issueKey: string, patch: Partial<ReviewDraft>) {
    setReviewDrafts((current) => ({ ...current, [issueKey]: { ...draftFor(issueKey), ...patch } }));
  }

  async function submitReview(issue: IopReconciliationIssue) {
    if (!apiPrincipal || !record) return;
    const draft = draftFor(issue.issueKey);
    if (!draft.reason.trim()) {
      setNotice("");
      setError("A review reason is required.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await apiIopReconciliationReview(record.id, issue.issueKey, {
        expectedRevision: record.revision,
        idempotencyKey: newIdempotencyKey("iop-review"),
        disposition: draft.disposition,
        reason: draft.reason.trim(),
      });
      setRecord(await apiIopReconciliationGet(record.id));
      setNotice(`Reviewed ${issueLabel(issue.reason)}.`);
    } catch (cause) {
      setError(describeApiError(cause));
    } finally {
      setBusy(false);
    }
  }

  async function closeRecord() {
    if (!apiPrincipal || !record || !closeReady || !closeReason.trim()) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await apiIopReconciliationClose(record.id, {
        expectedRevision: record.revision,
        idempotencyKey: newIdempotencyKey("iop-close"),
        reason: closeReason.trim(),
      });
      setRecord(await apiIopReconciliationGet(record.id));
      setCloseReason("");
      setNotice("Reconciliation closed.");
    } catch (cause) {
      setError(describeApiError(cause));
    } finally {
      setBusy(false);
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
            note audit, charge, and EMR billable evidence against the
            verified backend session. This workspace does not determine
            clinical compliance or billing eligibility.
          </p>
        </div>
        <StatusBadge tone={apiPrincipal ? "good" : "warn"}>
          {apiPrincipal ? "Verified session" : "Not signed in"}
        </StatusBadge>
      </section>

      {!apiPrincipal ? (
        <section className="panel">
          <p className="inline-warning" role="alert">
            Sign in with a verified API session (see &quot;Session &amp; identity&quot; in the sidebar) to
            import, review, or close a reconciliation. Demo role selectors never grant this authority.
          </p>
        </section>
      ) : (
        <>
          <section className="panel iop-import-panel" aria-label="Source import">
            <div className="panel-title">
              <div>
                <h2>Source import adapter</h2>
                <p>Accepts a bounded synthetic JSON export and records it against a real facility and integration.</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
              <label style={{ flex: "1 1 220px" }}>
                <span className="label">Facility ID</span>
                <input
                  aria-label="Facility ID"
                  value={facilityId}
                  onChange={(event) => setFacilityId(event.target.value)}
                />
              </label>
              <label style={{ flex: "1 1 220px" }}>
                <span className="label">Integration key</span>
                <input
                  aria-label="Integration key"
                  value={integrationKey}
                  onChange={(event) => setIntegrationKey(event.target.value)}
                />
              </label>
            </div>
            <div className="iop-actions">
              <button type="button" disabled={busy} onClick={() => void importCandidate(syntheticImport)}>
                Load synthetic source import
              </button>
              <label className="secondary-button iop-file-input">
                Select synthetic JSON
                <input
                  aria-label="Select synthetic IOP JSON"
                  type="file"
                  accept="application/json,.json"
                  onChange={(event) => void readImportFile(event.target.files?.[0])}
                />
              </label>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "end", flexWrap: "wrap", marginTop: 12 }}>
              <label style={{ flex: "1 1 320px" }}>
                <span className="label">Load an existing import by ID</span>
                <input aria-label="Existing import ID" value={loadId} onChange={(event) => setLoadId(event.target.value)} placeholder="cljk3q…" />
              </label>
              <button className="secondary-button" type="button" disabled={busy || !loadId.trim()} onClick={() => void loadById(loadId)}>
                Load
              </button>
            </div>
            {error ? <p className="inline-warning" role="alert">{error}</p> : null}
            {notice && !error ? <p role="status">{notice}</p> : null}
          </section>

          {record ? (
            <>
              <section className="status-strip" aria-label="IOP reconciliation summary">
                <div><span className="label">Import</span><strong>{record.id}</strong><span className="subtext">revision {record.revision}</span></div>
                <div><span className="label">Derived issues</span><strong>{allIssues.length}</strong><span className="subtext">source-link gaps</span></div>
                <div><span className="label">Unreviewed</span><strong>{unresolved.length}</strong><span className="subtext">blocks close</span></div>
                <div><span className="label">Close state</span><strong>{record.closeReceipt ? "Closed" : closeReady ? "Ready" : "Blocked"}</strong><span className="subtext">review gate</span></div>
              </section>

              <section className="panel iop-source-detail">
                <div className="panel-title"><div><h2>Source evidence</h2><p>Persisted with the import; reviews and the close receipt are separate authenticated records.</p></div></div>
                <dl>
                  <div><dt>Facility</dt><dd>{record.facilityId}</dd></div>
                  <div><dt>Integration</dt><dd>{record.integration.label} ({record.integration.integrationKey})</dd></div>
                  <div><dt>Source file</dt><dd>{record.sourceFileName ?? "—"}</dd></div>
                  <div><dt>Exported</dt><dd>{record.exportedAt}</dd></div>
                  <div><dt>Source cutoff</dt><dd>{record.cutoffAt}</dd></div>
                  <div><dt>Accepted by</dt><dd>{record.acceptedBy}</dd></div>
                </dl>
              </section>

              <section className="grid-two">
                <section className="panel" aria-label="Reviewed exceptions">
                  <div className="panel-title"><div><h2>Reviewed exceptions</h2><p>Each gap needs a discrete, authenticated reviewer record.</p></div></div>
                  <ul className="iop-issue-list">
                    {allIssues.map((issue) => {
                      const review = record.exceptionReviews.find((candidate) => candidate.issueKey === issue.issueKey);
                      const draft = draftFor(issue.issueKey);
                      return (
                        <li key={issue.issueKey}>
                          <strong>{issueLabel(issue.reason)}</strong>
                          <span>{issue.issueKey}</span>
                          {review ? (
                            <small>{review.disposition} · {review.reviewerId} · {review.reason}</small>
                          ) : (
                            <div style={{ display: "flex", gap: 8, alignItems: "end", flexWrap: "wrap", marginTop: 6 }}>
                              <label>
                                <span className="label">Disposition</span>
                                <select
                                  aria-label={`Disposition for ${issue.issueKey}`}
                                  value={draft.disposition}
                                  onChange={(event) => setDraft(issue.issueKey, { disposition: event.target.value as ReviewDraft["disposition"] })}
                                >
                                  <option value="ACCEPTED_EXCEPTION">Accepted exception</option>
                                  <option value="RESOLVED">Resolved</option>
                                </select>
                              </label>
                              <label style={{ flex: "1 1 220px" }}>
                                <span className="label">Reason</span>
                                <input
                                  aria-label={`Reason for ${issue.issueKey}`}
                                  value={draft.reason}
                                  onChange={(event) => setDraft(issue.issueKey, { reason: event.target.value })}
                                />
                              </label>
                              <button className="secondary-button" type="button" disabled={busy} onClick={() => void submitReview(issue)}>
                                Record review
                              </button>
                            </div>
                          )}
                        </li>
                      );
                    })}
                    {!allIssues.length ? <li>No derived source-link gaps.</li> : null}
                  </ul>
                </section>
                <section className="panel" aria-label="Reconciliation close">
                  <div className="panel-title"><div><h2>Close reconciliation</h2><p>Closing records a human identity, a reason, and the source cutoff.</p></div></div>
                  {record.closeReceipt ? (
                    <dl className="iop-receipt">
                      <div><dt>Reviewer</dt><dd>{record.closeReceipt.reviewerId}</dd></div>
                      <div><dt>Source cutoff</dt><dd>{record.closeReceipt.sourceCutoffAt}</dd></div>
                      <div><dt>Reviewed at</dt><dd>{record.closeReceipt.reviewedAt}</dd></div>
                      <div><dt>Reason</dt><dd>{record.closeReceipt.reason}</dd></div>
                      <div><dt>Exceptions</dt><dd>{record.closeReceipt.reviewedCount} reviewed of {record.closeReceipt.issueCount} derived</dd></div>
                    </dl>
                  ) : (
                    <>
                      {unresolved.length ? <p className="inline-warning">{unresolved.length} unmatched event(s) still require a reviewed exception.</p> : <p className="iop-ready">All derived gaps have reviewed exception records.</p>}
                      <label className="iop-reviewer">
                        Close reason
                        <input aria-label="Close reason" value={closeReason} onChange={(event) => setCloseReason(event.target.value)} placeholder="Reviewed and reconciled for the source cutoff." />
                      </label>
                      <button type="button" disabled={busy || !closeReady || !closeReason.trim()} onClick={() => void closeRecord()}>
                        Record reviewed close
                      </button>
                    </>
                  )}
                </section>
              </section>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
