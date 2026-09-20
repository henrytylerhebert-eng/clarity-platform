import { useState } from "react";
import { useAuth } from "../../domain/AuthContext";
import { apiAccessGetCase, describeApiError } from "../../domain/api";
import type { AccessCaseReadModel } from "@clarity/domain-contracts";
import { EmptyState, StatusBadge } from "../../components/StatusBadge";
import { SignInForm } from "../../components/SignInForm";
import { 
  phaseLabel, 
  dispositionLabel, 
  blockingClassLabel, 
  workstreamLabel, 
  nextWorkLabel, 
  prescreenTargetLabel, 
  describeAccessSignal 
} from "./accessPresentation";
import "./AccessSnapshot.css";

const ALL_PHASES = [
  "REFERRAL",
  "PRESCREEN",
  "QUALIFIED_REVIEW",
  "FACILITY_REVIEW",
  "PRE_ADMISSION",
  "TRANSFER_HANDOFF",
  "ADMISSION"
] as const;

export function AccessSnapshot() {
  const { busy, principal } = useAuth();
  const [caseKey, setCaseKey] = useState("SYN-API-CASE-0001");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<AccessCaseReadModel | null>(null);

  if (!busy && !principal) {
    return (
      <div className="access-snapshot signed-out">
        <h2>Authentication Required</h2>
        <p>You must be signed in to access the governed Access read model.</p>
        <SignInForm 
          placeholder="Development assertion" 
          defaultValue="syn-assert-api-intake-dev" 
          helpText="Development-only synthetic assertion." 
        />
      </div>
    );
  }

  if (busy && !principal) {
    return (
      <div className="access-snapshot signing-in">
        <p>Signing in…</p>
      </div>
    );
  }

  async function loadCase() {
    if (!caseKey.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiAccessGetCase(caseKey);
      setSnapshot(result);
    } catch (e) {
      setError(describeApiError(e));
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="access-snapshot">
      <header className="snapshot-header">
        <div className="header-info">
          <h2>Access Snapshot</h2>
          {snapshot && <span className="case-id">Case {snapshot.caseKey}</span>}
          {snapshot && <span className="case-version">Version {snapshot.caseVersion}</span>}
          <span className="badge badge-info">Governed read model</span>
        </div>
        <div className="session-info">
          Verified session {principal?.displayName} ({principal?.organizationId})
        </div>
      </header>

      <div className="lookup-bar">
        <label htmlFor="case-key-lookup">Case key</label>
        <input 
          id="case-key-lookup" 
          type="text" 
          value={caseKey} 
          onChange={(e) => setCaseKey(e.target.value)}
          placeholder="Enter case key..."
        />
        <button onClick={loadCase} disabled={loading || !caseKey.trim()}>
          {loading ? "Loading..." : "Open case"}
        </button>
        {snapshot && (
          <div className="refresh-actions">
            <button onClick={loadCase} disabled={loading}>Refresh case</button>
            <span className="refresh-help">This view is refreshed on request; case-detail access is audited.</span>
          </div>
        )}
      </div>

      {error && (
        <div className="snapshot-error">
          <h3>Failed to load governed case</h3>
          <p>{error}</p>
        </div>
      )}

      {snapshot && (
        <div className="snapshot-content">
          <section className="journey-rail">
            <h3>Current journey position</h3>
            
            <div className="phases-visual-rail">
              {ALL_PHASES.map((p) => {
                const currentIdx = snapshot.journey.phase ? ALL_PHASES.indexOf(snapshot.journey.phase as any) : -1;
                const thisIdx = ALL_PHASES.indexOf(p);
                const isActive = thisIdx === currentIdx;
                const isPast = thisIdx < currentIdx && currentIdx !== -1;
                
                return (
                  <div key={p} className={`phase-node ${isActive ? 'active' : ''} ${isPast ? 'preceding' : ''}`}>
                    {phaseLabel(p)}
                  </div>
                );
              })}
            </div>

            {snapshot.journey.phase ? (
              <div className="phase-display">
                <span className="phase-label">{phaseLabel(snapshot.journey.phase)}</span>
                <span className={`disposition-badge disp-${snapshot.journey.disposition}`}>
                  {dispositionLabel(snapshot.journey.disposition)}
                </span>
                <details className="evidence-explanation">
                  <summary>Why this phase?</summary>
                  <ul>
                    {snapshot.journey.evidence.map((ev, i) => (
                      <li key={i}>
                        <strong>{ev.source}:</strong> {ev.sourceValue} &rarr; {phaseLabel(ev.supportsPhase)}
                        {ev.legacyCompatibility ? " (legacy compatibility)" : ""}
                      </li>
                    ))}
                  </ul>
                </details>
              </div>
            ) : (
              <p>Current phase cannot be determined from available governed evidence.</p>
            )}
            {snapshot.journey.phase === "ADMISSION" && (
              <div className="admission-source-note">
                <p>Admission phase is based on recorded case-to-episode linkage.</p>
              </div>
            )}
          </section>

          <div className="snapshot-grid">
            <section className="attention-summary">
              <h3>What needs attention</h3>
              {snapshot.guidance.signals.length === 0 ? (
                <EmptyState title="All clear">No attention signals found.</EmptyState>
              ) : (
                <div className="signals-grouped">
                  {[
                    { id: "CASE_PROGRESSION", label: "Case progression" },
                    { id: "PRESCREEN", label: "Prescreen" },
                    { id: "PRESCREEN_TARGET", label: "Packet readiness" },
                    { id: "WORKSTREAM", label: "Workstreams" }
                  ].map((scope) => {
                    const scopeSignals = snapshot.guidance.signals.filter(s => s.scope === scope.id);
                    if (scopeSignals.length === 0) return null;
                    
                    return (
                      <div key={scope.id} className="signal-group">
                        <h4>{scope.label}</h4>
                        <ul>
                          {scopeSignals.map((sig, i) => {
                            const label = blockingClassLabel(sig.blockingClass);
                            return (
                              <li key={i}>
                                <StatusBadge tone={sig.blockingClass === "HARD_BLOCKER" ? "danger" : "warn"}>{label}</StatusBadge>
                                <span className="signal-reason">{describeAccessSignal(sig)}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="candidate-work">
              <h3>Candidate next work</h3>
              {snapshot.guidance.nextWork.length === 0 ? (
                <EmptyState title="No next work">There are no candidate actions at this time.</EmptyState>
              ) : (
                <ul className="next-work-list">
                  {snapshot.guidance.nextWork.map((work, i) => (
                    <li key={i} className="work-item">
                      <span className="work-label">
                        {nextWorkLabel(work.kind)}
                      </span>
                      <span className="candidate-badge">Candidate / Not assigned</span>
                    </li>
                  ))}
                </ul>
              )}

              {snapshot.guidance.suppressed.length > 0 && (
                <details className="suppressed-work">
                  <summary>Work not currently actionable</summary>
                  <ul>
                    {snapshot.guidance.suppressed.map((sup, i) => (
                      <li key={i}>
                        {nextWorkLabel(sup.kind)} (Reason: {sup.reason})
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </section>

            <section className="workstreams-panel">
              <h3>Workstreams</h3>
              <p className="help-text">A blocked lane does not necessarily mean the patient journey is blocked.</p>
              <div className="workstream-list">
                {Object.entries(snapshot.sourceState.workstreams).map(([key, state]) => (
                  <div key={key} className="workstream-row">
                    <span className="ws-name">{workstreamLabel(key as any) || key}</span>
                    <StatusBadge tone={state === "BLOCKED" ? "danger" : state === "COMPLETE" ? "good" : "info"}>
                      {state.replace("_", " ")}
                    </StatusBadge>
                  </div>
                ))}
              </div>
            </section>

            <section className="prescreen-source">
              <h3>Prescreen Source State</h3>
              <div className="prescreen-selection">
                {snapshot.sourceState.prescreenSelection === "NONE" && (
                  <p>No active Prescreen encounter selected from governed data.</p>
                )}
                {snapshot.sourceState.prescreenSelection === "SELECTED" && (
                  <div className="selected-prescreen">
                    <p>Status: {snapshot.sourceState.prescreen?.status}</p>
                    <p>Version: {snapshot.sourceState.prescreen?.version}</p>
                  </div>
                )}
                {snapshot.sourceState.prescreenSelection === "AMBIGUOUS" && (
                  <div className="ambiguous-warning">
                    <strong>Warning:</strong> Multiple active Prescreen encounters exist. Prescreen evidence is excluded from this projection until the ambiguity is resolved. Do not guess which encounter is current.
                  </div>
                )}
              </div>
              
              <h4>Packet Evidence</h4>
              <div className="packet-evidence">
                {snapshot.sourceState.packetRequirementEvidence === "NOT_AVAILABLE" && (
                  <p>Packet requirement evidence was not supplied to this projection.</p>
                )}
                {snapshot.sourceState.packetRequirementEvidence === "LOADED_EMPTY" && (
                  <p>
                    The selected Prescreen encounter currently has zero persisted packet requirement rows.
                    <br/><small>This does not prove all real-world required documents are present.</small>
                  </p>
                )}
                {snapshot.sourceState.packetRequirementEvidence === "LOADED" && (
                  <div className="packet-readiness">
                    {snapshot.guidance.packetReadiness?.map((target, i) => (
                      <div key={i}>
                        Target: {prescreenTargetLabel(target.target)} - {target.ready ? "Ready" : "Not ready"}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
