import { useState } from "react";
import syntheticImport from "../../../docs/product/evidence/IOP_ATTENDANCE_RECONCILIATION_SYNTHETIC_IMPORT.json";
import {
  IopReconciliationImportSchema,
  type IopReconciliationImport,
} from "../../../packages/domain-contracts/src/iopReconciliationImport";
import {
  validateIopReconciliationSample,
  type IopReconciliationIssue,
  type IopReconciliationSample,
} from "../../../packages/domain-contracts/src/iopReconciliation";
import {
  apiIopReconciliation,
  apiLogin,
  apiLogout,
  describeApiError,
  type VerifiedPrincipal,
} from "../domain/api";

// Must match the dev-only facility/integration bootstrapped by
// packages/api-service/src/devMain.ts — this workspace only ever imports
// against that one synthetic facility/integration pair.
const DEV_FACILITY_ID = "synthetic-iop-facility-api-dev";
const DEV_INTEGRATION_KEY = "SYNTHETIC_IOP_PROGRAM";

interface PersistedReview {
  issueKey: string;
  disposition: string;
  reason: string;
  reviewerId: string;
  reviewedAt: string;
}

interface PersistedCloseReceipt {
  reviewerId: string;
  reviewedAt: string;
  reason: string;
  sourceCutoffAt: string;
  issueCount: number;
  reviewedCount: number;
}

interface PersistedImport {
  id: string;
  revision: number;
  payload: { reconciliation: unknown };
  exceptionReviews: PersistedReview[];
  closeReceipt: PersistedCloseReceipt | null;
}

type ReviewDraft = { disposition: "RESOLVED" | "ACCEPTED_EXCEPTION"; reason: string };

function issueLabel(reason: string) {
  return reason.replaceAll("_", " ");
}

function sourceRecordsFor(reconciliation: IopReconciliationSample) {
  const groups: readonly [string, string][] = [
    ...reconciliation.enrollments.map((e): [string, string] => ["ENROLLMENT", e.enrollmentId]),
    ...reconciliation.treatmentPlans.map((e): [string, string] => ["TREATMENT_PLAN", e.planId]),
    ...reconciliation.attendanceEvents.map((e): [string, string] => ["ATTENDANCE", e.attendanceId]),
    ...reconciliation.noteAudits.map((e): [string, string] => ["NOTE_AUDIT", e.noteId]),
    ...reconciliation.chargeLines.map((e): [string, string] => ["CHARGE_LINE", e.chargeLineId]),
    ...reconciliation.emrBillableLines.map((e): [string, string] => ["EMR_BILLABLE_LINE", e.billableLineId]),
  ];
  return groups.map(([type, sourceRecordId]) => ({ type, sourceRecordId, sourceVersion: "1" }));
}

export function IopReconciliation() {
  const [principal, setPrincipal] = useState<VerifiedPrincipal | null>(null);
  const [assertion, setAssertion] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [candidate, setCandidate] = useState<IopReconciliationImport | null>(null);
  const [candidateIssueCount, setCandidateIssueCount] = useState(0);
  const [loadError, setLoadError] = useState("");

  const [record, setRecord] = useState<PersistedImport | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, ReviewDraft>>({});
  const [closeReason, setCloseReason] = useState("");

  function load(raw: unknown) {
    try {
      const parsed = IopReconciliationImportSchema.parse(raw);
      const { issues } = validateIopReconciliationSample(parsed.reconciliation);
      setCandidate(parsed);
      setCandidateIssueCount(issues.length);
      setRecord(null);
      setReviewDrafts({});
      setCloseReason("");
      setActionError("");
      setLoadError("");
    } catch {
      setCandidate(null);
      setLoadError("This file is not a valid synthetic IOP reconciliation import.");
    }
  }

  async function readImport(file?: File) {
    if (!file) return;
    try {
      load(JSON.parse(await file.text()));
    } catch {
      setLoadError("This file is not valid JSON.");
    }
  }

  async function signIn() {
    setLoginBusy(true);
    setLoginError("");
    try {
      setPrincipal(await apiLogin(assertion.trim()));
      setAssertion("");
    } catch (cause) {
      setLoginError(describeApiError(cause));
    } finally {
      setLoginBusy(false);
    }
  }

  async function signOut() {
    await apiLogout();
    setPrincipal(null);
  }

  async function loadRecord(id: string) {
    setRecord(await apiIopReconciliation<PersistedImport>(`/reconciliation-imports/${id}`));
  }

  async function submitImport() {
    if (!candidate) return;
    setBusy(true);
    setActionError("");
    try {
      const result = await apiIopReconciliation<{ import: { id: string } }>(
        "/reconciliation-imports",
        {
          facilityId: DEV_FACILITY_ID,
          programId: candidate.reconciliation.programId,
          integrationKey: DEV_INTEGRATION_KEY,
          idempotencyKey: `iop-import-${candidate.importId}`,
          source: candidate.source,
          sourceRecords: sourceRecordsFor(candidate.reconciliation),
          reconciliation: candidate.reconciliation,
        },
      );
      await loadRecord(result.import.id);
    } catch (cause) {
      setActionError(describeApiError(cause));
    } finally {
      setBusy(false);
    }
  }

  async function submitReview(issueKey: string) {
    if (!record) return;
    const draft = reviewDrafts[issueKey] ?? { disposition: "RESOLVED", reason: "" };
    setBusy(true);
    setActionError("");
    try {
      await apiIopReconciliation(
        `/reconciliation-imports/${record.id}/issues/${encodeURIComponent(issueKey)}/reviews`,
        {
          expectedRevision: record.revision,
          idempotencyKey: `iop-review-${record.id}-${issueKey}`,
          disposition: draft.disposition,
          reason: draft.reason.trim(),
        },
      );
      await loadRecord(record.id);
    } catch (cause) {
      setActionError(describeApiError(cause));
    } finally {
      setBusy(false);
    }
  }

  async function submitClose() {
    if (!record) return;
    setBusy(true);
    setActionError("");
    try {
      await apiIopReconciliation(`/reconciliation-imports/${record.id}/close`, {
        expectedRevision: record.revision,
        idempotencyKey: `iop-close-${record.id}`,
        reason: closeReason.trim(),
      });
      await loadRecord(record.id);
    } catch (cause) {
      setActionError(describeApiError(cause));
    } finally {
      setBusy(false);
    }
  }

  const issues: IopReconciliationIssue[] = record
    ? validateIopReconciliationSample(record.payload.reconciliation).issues
    : [];
  const reviewedByIssueKey = new Map(record?.exceptionReviews.map((r) => [r.issueKey, r]) ?? []);
  const unresolved = issues.filter((issue) => !reviewedByIssueKey.has(issue.issueKey));

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

      <section className="panel iop-session" aria-label="Verified session">
        {principal ? (
          <div className="iop-actions">
            <span>
              Signed in as <strong>{principal.displayName}</strong> ({principal.organizationId})
            </span>
            <button type="button" className="secondary-button" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        ) : (
          <>
            <p>
              Importing, reviewing, and closing write through the real backend
              and require a verified session. Previewing a candidate file does
              not.
            </p>
            <div className="iop-actions">
              <label className="iop-reviewer">
                Development assertion
                <input
                  aria-label="Development assertion"
                  value={assertion}
                  onChange={(event) => setAssertion(event.target.value)}
                  placeholder="syn-assert-revops-admin-dev"
                />
              </label>
              <button
                type="button"
                disabled={loginBusy || assertion.trim().length < 16}
                onClick={() => void signIn()}
              >
                Sign in
              </button>
            </div>
            {loginError ? <p className="inline-warning">{loginError}</p> : null}
          </>
        )}
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
        {loadError ? <p className="inline-warning">{loadError}</p> : null}
        {candidate && !record ? (
          <>
            <dl>
              <div><dt>Candidate import</dt><dd>{candidate.importId}</dd></div>
              <div><dt>Source system</dt><dd>{candidate.source.systemLabel}</dd></div>
              <div><dt>Source cutoff</dt><dd>{candidate.source.cutoffAt}</dd></div>
              <div><dt>Derived issues</dt><dd>{candidateIssueCount} will need review after import</dd></div>
            </dl>
            <button type="button" disabled={busy || !principal} onClick={() => void submitImport()}>
              Submit synthetic import
            </button>
            {!principal ? <p className="inline-warning">Sign in above to submit this import.</p> : null}
          </>
        ) : null}
        {actionError ? <p className="inline-warning">{actionError}</p> : null}
      </section>

      {record ? (
        <>
          <section className="status-strip" aria-label="IOP reconciliation summary">
            <div><span className="label">Import</span><strong>{record.id}</strong><span className="subtext">persisted, tenant-scoped</span></div>
            <div><span className="label">Derived issues</span><strong>{issues.length}</strong><span className="subtext">source-link gaps</span></div>
            <div><span className="label">Unreviewed</span><strong>{unresolved.length}</strong><span className="subtext">blocks close</span></div>
            <div><span className="label">Close state</span><strong>{record.closeReceipt ? "Closed" : unresolved.length === 0 ? "Ready" : "Blocked"}</strong><span className="subtext">review gate</span></div>
          </section>

          <section className="grid-two">
            <section className="panel" aria-label="Reviewed exceptions">
              <div className="panel-title"><div><h2>Reviewed exceptions</h2><p>Each gap needs a discrete, authenticated reviewer record.</p></div></div>
              <ul className="iop-issue-list">
                {issues.map((issue) => {
                  const review = reviewedByIssueKey.get(issue.issueKey);
                  const draft = reviewDrafts[issue.issueKey] ?? { disposition: "RESOLVED" as const, reason: "" };
                  return (
                    <li key={issue.issueKey}>
                      <strong>{issueLabel(issue.reason)}</strong>
                      <span>{issue.issueKey}</span>
                      {review ? (
                        <small>{review.disposition} · {review.reviewerId} · {review.reason}</small>
                      ) : (
                        <div className="iop-review-form">
                          <label>
                            Disposition
                            <select
                              aria-label={`Disposition for ${issue.issueKey}`}
                              value={draft.disposition}
                              onChange={(event) =>
                                setReviewDrafts((prior) => ({
                                  ...prior,
                                  [issue.issueKey]: { ...draft, disposition: event.target.value as ReviewDraft["disposition"] },
                                }))
                              }
                            >
                              <option value="RESOLVED">Resolved</option>
                              <option value="ACCEPTED_EXCEPTION">Accepted exception</option>
                            </select>
                          </label>
                          <label>
                            Reason
                            <input
                              aria-label={`Review reason for ${issue.issueKey}`}
                              value={draft.reason}
                              onChange={(event) =>
                                setReviewDrafts((prior) => ({
                                  ...prior,
                                  [issue.issueKey]: { ...draft, reason: event.target.value },
                                }))
                              }
                            />
                          </label>
                          <button
                            type="button"
                            aria-label={`Record review for ${issue.issueKey}`}
                            disabled={busy || !principal || draft.reason.trim().length < 3}
                            onClick={() => void submitReview(issue.issueKey)}
                          >
                            Record review
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
            <section className="panel" aria-label="Reconciliation close">
              <div className="panel-title"><div><h2>Close</h2><p>Closing records the authenticated reviewer and the source cutoff.</p></div></div>
              {record.closeReceipt ? (
                <dl className="iop-receipt">
                  <div><dt>Reviewer</dt><dd>{record.closeReceipt.reviewerId}</dd></div>
                  <div><dt>Source cutoff</dt><dd>{record.closeReceipt.sourceCutoffAt}</dd></div>
                  <div><dt>Reviewed at</dt><dd>{record.closeReceipt.reviewedAt}</dd></div>
                  <div><dt>Exceptions</dt><dd>{record.closeReceipt.reviewedCount} reviewed of {record.closeReceipt.issueCount} derived</dd></div>
                </dl>
              ) : (
                <>
                  {unresolved.length ? <p className="inline-warning">{unresolved.length} unmatched event(s) still require a reviewed exception.</p> : <p className="iop-ready">All derived gaps have reviewed exception records.</p>}
                  <label className="iop-reviewer">
                    Close reason
                    <input
                      aria-label="Close reason"
                      value={closeReason}
                      onChange={(event) => setCloseReason(event.target.value)}
                      placeholder="All synthetic exceptions reviewed."
                    />
                  </label>
                  <button
                    type="button"
                    disabled={busy || !principal || unresolved.length > 0 || closeReason.trim().length < 3}
                    onClick={() => void submitClose()}
                  >
                    Record reviewed close
                  </button>
                </>
              )}
            </section>
          </section>
        </>
      ) : null}
    </div>
  );
}
