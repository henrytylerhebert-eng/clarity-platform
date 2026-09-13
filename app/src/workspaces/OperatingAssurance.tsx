import { useMemo, useState } from "react";
import { EmptyState, SectionHeader, StatusBadge } from "../components/StatusBadge";
import {
  apiAssuranceEvaluate,
  apiAssuranceGetCase,
  apiAssuranceGetHistory,
  apiAssuranceReview,
  apiAssuranceReviseEvidence,
  apiAssuranceSubmitEvidence,
  describeApiError,
  type AssuranceCaseViewDto,
  type AssuranceEvidenceExpectationDto,
  type AssuranceHistoryEntryDto,
  type AssuranceReviewDecisionDto,
  type VerifiedPrincipal,
} from "../domain/api";

const RATIONALE_REQUIRED = new Set<AssuranceReviewDecisionDto["decision"]>([
  "REJECT",
  "REQUEST_MORE_EVIDENCE",
  "REVIEW_REQUIRED",
]);

const FAIL_CLOSED_STATES = new Set([
  "MISSING_EVIDENCE",
  "CONFLICT",
  "STALE_SOURCE",
  "APPLICABILITY_PENDING",
  "RIGHTS_RESTRICTED",
  "REVIEW_REQUIRED",
  "UNKNOWN",
]);

function displayState(value: string | null | undefined): string {
  if (!value) return "Not recorded";
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function toneFor(value: string | null | undefined): "neutral" | "good" | "warn" | "danger" | "info" {
  if (!value) return "neutral";
  if (["APPROVED", "CURRENT", "PERMITTED", "ACCEPT", "ACCEPTED", "LINKED"].includes(value)) return "good";
  if (["RESTRICTED", "STALE", "SUPERSEDED", "CONFLICT", "REJECT", "REJECTED"].includes(value)) return "danger";
  if (["PENDING", "CONDITIONAL", "UNKNOWN", "REVIEW_REQUIRED", "NEEDS_CLARIFICATION", "MISSING_EVIDENCE", "PARTIALLY_SUPPORTED"].includes(value)) return "warn";
  if (value === "SUPPORTED") return "info";
  return "neutral";
}

function stringValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  return typeof value === "string" ? value : JSON.stringify(value);
}

function currentExpectation(view: AssuranceCaseViewDto | null): AssuranceEvidenceExpectationDto | undefined {
  return view?.evidenceExpectations[0];
}

function trustCard(label: string, value: string, detail: string) {
  return (
    <div
      key={label}
      style={{
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 12,
        background: "var(--surface)",
        minWidth: 0,
      }}
    >
      <span className="label">{label}</span>
      <div style={{ marginTop: 8 }}><StatusBadge tone={toneFor(value)}>{displayState(value)}</StatusBadge></div>
      <p style={{ margin: "8px 0 0", fontSize: 12 }}>{detail}</p>
    </div>
  );
}

export function OperatingAssurance({ principal }: { principal: VerifiedPrincipal | null }) {
  const [caseKeyInput, setCaseKeyInput] = useState("");
  const [view, setView] = useState<AssuranceCaseViewDto | null>(null);
  const [history, setHistory] = useState<AssuranceHistoryEntryDto[]>([]);
  const [evidenceValues, setEvidenceValues] = useState<Record<string, string>>({});
  const [decision, setDecision] = useState<AssuranceReviewDecisionDto["decision"]>("ACCEPT");
  const [rationale, setRationale] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const expectation = currentExpectation(view);
  const latestSubmission = expectation?.submissions[0];
  const latestEvaluation = view?.evaluations[0];
  const latestReview = latestEvaluation?.reviewDecisions?.[0];
  const participant = view?.participants.find((item) => item.userId === principal?.userId && item.active);
  const canContribute = participant?.role === "EVIDENCE_CONTRIBUTOR";
  const canEvaluate = Boolean(participant);
  const scopedReviewer = view?.participants.find(
    (item) => item.userId === principal?.userId && item.active && item.role === "QUALIFIED_REVIEWER" && Boolean(item.authorityBasis?.trim()),
  );
  const canReview = Boolean(principal?.roles.includes("COMPLIANCE_REVIEWER") && scopedReviewer);

  const trust = useMemo(() => {
    if (!view) return [] as Array<{ label: string; value: string; detail: string }>;
    const applicability = view.applicability[0]?.status ?? "PENDING";
    const openConflict = view.sourceConflicts.some((item) => item.status === "OPEN");
    const restricted = view.sources.some((item) => item.rightsStatus === "RESTRICTED");
    const stale = view.sources.some((item) => ["STALE", "SUPERSEDED"].includes(item.currentness));
    const uncertainSource = view.sources.some((item) => item.currentness === "UNKNOWN" || item.rightsStatus === "UNKNOWN");
    const authority = view.sources.length === 0
      ? "UNKNOWN"
      : openConflict
        ? "CONFLICT"
        : restricted
          ? "RESTRICTED"
          : stale
            ? "STALE"
            : uncertainSource
              ? "REVIEW_REQUIRED"
              : "CURRENT";
    const policy = view.documentReferences.some((item) => item.kind === "POLICY") ? "LINKED" : "MISSING_EVIDENCE";
    const sop = view.documentReferences.some((item) => item.kind === "SOP") ? "LINKED" : "MISSING_EVIDENCE";
    const evidence = latestSubmission?.status ?? "MISSING_EVIDENCE";
    const machine = latestEvaluation?.result ?? "REVIEW_REQUIRED";
    const human = latestReview?.decision ?? "REVIEW_REQUIRED";
    return [
      { label: "Authority", value: authority, detail: view.sources[0]?.citation ?? "No authority source is recorded." },
      { label: "Applicability", value: applicability, detail: view.applicability[0]?.rationale ?? "No approved applicability decision is recorded." },
      { label: "Policy", value: policy, detail: view.documentReferences.find((item) => item.kind === "POLICY")?.title ?? "Policy reference missing." },
      { label: "SOP", value: sop, detail: view.documentReferences.find((item) => item.kind === "SOP")?.title ?? "SOP reference missing." },
      { label: "Evidence", value: evidence, detail: expectation?.prompt ?? "Evidence expectation missing." },
      { label: "Machine assistance", value: machine, detail: latestEvaluation ? `Revision ${latestEvaluation.revision}; human review required.` : "No current evaluation has been run." },
      { label: "Human review", value: human, detail: latestReview ? `Reviewer ${latestReview.reviewerUserId}` : "No qualified reviewer determination is recorded." },
    ];
  }, [expectation?.prompt, latestEvaluation, latestReview, latestSubmission?.status, view]);

  async function refresh(caseKey = view?.caseKey ?? caseKeyInput.trim()) {
    if (!principal || !caseKey) return;
    setBusy(true);
    setError(null);
    try {
      const [nextView, nextHistory] = await Promise.all([
        apiAssuranceGetCase(caseKey),
        apiAssuranceGetHistory(caseKey),
      ]);
      setView(nextView);
      setHistory(nextHistory);
      const nextExpectation = currentExpectation(nextView);
      const payload = nextExpectation?.submissions[0]?.payload ?? {};
      setEvidenceValues(
        Object.fromEntries((nextExpectation?.requiredKeys ?? []).map((key) => [key, stringValue(payload[key])])),
      );
      setCaseKeyInput(nextView.caseKey);
    } catch (cause) {
      setView(null);
      setHistory([]);
      setError(describeApiError(cause));
    } finally {
      setBusy(false);
    }
  }

  async function perform(action: () => Promise<unknown>, successMessage: string) {
    if (!view) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
      await refresh(view.caseKey);
      setNotice(successMessage);
    } catch (cause) {
      setError(describeApiError(cause));
    } finally {
      setBusy(false);
    }
  }

  async function submitEvidence() {
    if (!view || !expectation) return;
    const payload = Object.fromEntries(expectation.requiredKeys.map((key) => [key, evidenceValues[key] ?? ""]));
    if (latestSubmission) {
      await perform(
        () => apiAssuranceReviseEvidence({
          caseKey: view.caseKey,
          priorSubmissionId: latestSubmission.id,
          payload,
        }),
        "Evidence revision submitted for review.",
      );
      return;
    }
    await perform(
      () => apiAssuranceSubmitEvidence({ caseKey: view.caseKey, expectationId: expectation.id, payload }),
      "Evidence submitted for review.",
    );
  }

  async function runEvaluation() {
    if (!view || !expectation) return;
    await perform(
      () => apiAssuranceEvaluate({ caseKey: view.caseKey, expectationId: expectation.id }),
      "Machine assistance refreshed. Human review is still required.",
    );
  }

  async function recordReview() {
    if (!latestEvaluation) return;
    if (RATIONALE_REQUIRED.has(decision) && !rationale.trim()) {
      setNotice(null);
      setError("A reviewer rationale is required for this decision.");
      return;
    }
    await perform(
      () => apiAssuranceReview({
        evaluationId: latestEvaluation.id,
        decision,
        ...(rationale.trim() ? { rationale: rationale.trim() } : {}),
      }),
      "Qualified human review recorded.",
    );
    setRationale("");
  }

  if (!principal) {
    return (
      <div className="workspace-stack">
        <SectionHeader title="Operating Assurance" eyebrow="Authenticated one-case workspace" />
        <EmptyState title="Verified API session required">
          Sign in through Session & identity. The demo role selector only changes navigation and never grants Operating Assurance authority.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="workspace-stack">
      <SectionHeader title="Operating Assurance" eyebrow="One-case governed assurance workspace" />

      <section className="panel">
        <div className="panel-title">
          <div>
            <h2>Open assurance case</h2>
            <p>Case access, contributor rights, and reviewer authority are enforced by the verified backend session.</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "end", flexWrap: "wrap" }}>
          <label style={{ flex: "1 1 320px" }}>
            <span className="label">Case key</span>
            <input
              aria-label="Operating Assurance case key"
              value={caseKeyInput}
              onChange={(event) => setCaseKeyInput(event.target.value)}
              placeholder="oa-synthetic-case"
            />
          </label>
          <button className="secondary-button" type="button" disabled={busy || !caseKeyInput.trim()} onClick={() => refresh(caseKeyInput.trim())}>
            {busy ? "Loading…" : "Load case"}
          </button>
        </div>
        <p className="role-note" style={{ marginTop: 10 }}>
          Verified principal: {principal.displayName} · {principal.organizationId} · roles: {principal.roles.join(", ") || "none"}. Demo workspace roles do not affect these permissions.
        </p>
        {error ? <p className="inline-warning" role="alert">{error}</p> : null}
        {notice ? <p role="status">{notice}</p> : null}
      </section>

      {view ? (
        <>
          <section className="panel">
            <div className="panel-title">
              <div>
                <span className="label">{view.caseKey}</span>
                <h2>{view.title}</h2>
                <p>{view.assuranceStatement}</p>
              </div>
            </div>
            <div
              aria-label="Operating Assurance trust strip"
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}
            >
              {trust.map((item) => trustCard(item.label, item.value, item.detail))}
            </div>
            <p className="role-note" style={{ marginTop: 12 }}>
              Machine assistance is not a compliance determination. Every evaluation remains human-review gated.
            </p>
          </section>

          <div className="grid-two">
            <section className="panel">
              <div className="panel-title"><div><h2>Authority and operating references</h2><p>Metadata and tenant references only; restricted standards text is not reproduced.</p></div></div>
              {view.sources.length ? view.sources.map((source) => (
                <div key={source.id} style={{ marginBottom: 14 }}>
                  <strong>{source.title}</strong>
                  <p>{source.authorityClass} · {source.citation} · {source.versionLabel}</p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <StatusBadge tone={toneFor(source.currentness)}>{displayState(source.currentness)}</StatusBadge>
                    <StatusBadge tone={toneFor(source.rightsStatus)}>{displayState(source.rightsStatus)}</StatusBadge>
                  </div>
                </div>
              )) : <p>No authority source recorded.</p>}
              {view.documentReferences.map((reference) => (
                <p key={reference.id}><strong>{reference.kind}</strong> · {reference.title} · {reference.versionLabel}</p>
              ))}
              {view.sourceConflicts.some((item) => item.status === "OPEN") ? (
                <p className="inline-warning">An unresolved source conflict is recorded. The machine result must remain fail-closed.</p>
              ) : null}
            </section>

            <section className="panel">
              <div className="panel-title"><div><h2>Verified session capability</h2><p>Displayed for clarity only. Backend authorization remains authoritative.</p></div></div>
              <p><strong>Case participant:</strong> {participant?.role ? displayState(participant.role) : "Not assigned"}</p>
              <p><strong>Evidence contribution:</strong> {canContribute ? "Expected to be allowed" : "Not granted in this case"}</p>
              <p><strong>Evaluation:</strong> {canEvaluate ? "Expected to be allowed" : "Not granted in this case"}</p>
              <p><strong>Final review:</strong> {canReview ? "Both required grants are present" : "Both required grants are not present"}</p>
              <p className="role-note">Final review requires global COMPLIANCE_REVIEWER plus an active case-scoped QUALIFIED_REVIEWER assignment with an authority basis. SYSTEM_ADMIN alone is not sufficient.</p>
            </section>
          </div>

          <div className="grid-two">
            <section className="panel">
              <div className="panel-title"><div><h2>Evidence</h2><p>{expectation?.prompt ?? "No evidence expectation is configured."}</p></div></div>
              {expectation ? (
                <>
                  {expectation.requiredKeys.map((key) => (
                    <label key={key} style={{ display: "block", marginBottom: 10 }}>
                      <span className="label">{displayState(key)}</span>
                      <input
                        aria-label={`Evidence ${key}`}
                        value={evidenceValues[key] ?? ""}
                        onChange={(event) => setEvidenceValues((current) => ({ ...current, [key]: event.target.value }))}
                      />
                    </label>
                  ))}
                  <button className="secondary-button" type="button" disabled={busy || !canContribute} onClick={submitEvidence}>
                    {latestSubmission ? "Submit evidence revision" : "Submit evidence"}
                  </button>
                  <p className="role-note" style={{ marginTop: 10 }}>Submission records evidence; it does not accept the evidence or determine compliance.</p>
                </>
              ) : <p>No evidence expectation is available.</p>}
            </section>

            <section className="panel">
              <div className="panel-title"><div><h2>Machine assistance</h2><p>Deterministic and fail-closed. A qualified human remains authoritative.</p></div></div>
              <p><strong>Current result:</strong> <StatusBadge tone={toneFor(latestEvaluation?.result)}>{displayState(latestEvaluation?.result ?? "REVIEW_REQUIRED")}</StatusBadge></p>
              {latestEvaluation?.reasonCodes.length ? <p><strong>Reason codes:</strong> {latestEvaluation.reasonCodes.join(", ")}</p> : null}
              {latestEvaluation ? <p><strong>Human review required:</strong> {latestEvaluation.requiresHumanReview ? "Yes" : "Yes"}</p> : null}
              {latestEvaluation && FAIL_CLOSED_STATES.has(latestEvaluation.result) ? (
                <p className="inline-warning">This is a fail-closed state. Do not treat it as a compliance determination or completed assurance conclusion.</p>
              ) : null}
              <button className="secondary-button" type="button" disabled={busy || !canEvaluate || !expectation} onClick={runEvaluation}>
                Run governed evaluation
              </button>
            </section>
          </div>

          <section className="panel">
            <div className="panel-title"><div><h2>Qualified human review</h2><p>Machine result and human determination remain separate records.</p></div></div>
            {latestEvaluation ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 0.6fr) minmax(280px, 1.4fr)", gap: 12 }}>
                  <label>
                    <span className="label">Decision</span>
                    <select aria-label="Review decision" value={decision} onChange={(event) => setDecision(event.target.value as AssuranceReviewDecisionDto["decision"])}>
                      <option value="ACCEPT">Accept bounded result</option>
                      <option value="REJECT">Reject</option>
                      <option value="REQUEST_MORE_EVIDENCE">Request more evidence</option>
                      <option value="REVIEW_REQUIRED">Keep review required</option>
                    </select>
                  </label>
                  <label>
                    <span className="label">Rationale{RATIONALE_REQUIRED.has(decision) ? " (required)" : " (optional for accept)"}</span>
                    <textarea aria-label="Review rationale" rows={3} value={rationale} onChange={(event) => setRationale(event.target.value)} />
                  </label>
                </div>
                <button className="secondary-button" type="button" disabled={busy || !canReview} onClick={recordReview}>
                  Record qualified review
                </button>
                <p className="role-note" style={{ marginTop: 10 }}>The UI can explain expected capability, but only the backend can authorize this action.</p>
              </>
            ) : <p>Run an evaluation before recording a human review.</p>}
          </section>

          <section className="panel">
            <div className="panel-title"><div><h2>Assurance history</h2><p>Evidence, machine evaluations, and human decisions remain distinct historical events.</p></div></div>
            {history.length ? (
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead><tr><th>When</th><th>Kind</th><th>State</th><th>Version</th><th>Related record</th></tr></thead>
                  <tbody>
                    {history.map((entry) => (
                      <tr key={`${entry.kind}-${entry.id}`}>
                        <td>{new Date(entry.occurredAt).toLocaleString()}</td>
                        <td>{displayState(entry.kind)}</td>
                        <td><StatusBadge tone={toneFor(entry.state)}>{displayState(entry.state)}</StatusBadge></td>
                        <td>{entry.version}</td>
                        <td>{entry.relatedId ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p>No assurance history is visible for this case yet.</p>}
          </section>
        </>
      ) : null}
    </div>
  );
}
