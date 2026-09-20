import { useState } from "react";
import type { AccessCaseReadModel, BlockingScope, GuidanceSignal } from "@clarity/domain-contracts";
import { SignInForm } from "../../components/SignInForm";
import { EmptyState, StatusBadge } from "../../components/StatusBadge";
import { useAuth } from "../../domain/AuthContext";
import { apiAccessGetCase, describeApiError } from "../../domain/api";
import {
  JOURNEY_PHASE_ORDER,
  WORKSTREAM_ORDER,
  blockingClassLabel,
  blockingClassTone,
  describeAccessSignal,
  describeJourneyEvidence,
  dispositionLabel,
  dispositionTone,
  isAttentionClass,
  nextWorkLabel,
  phaseLabel,
  prescreenStatusLabel,
  prescreenTargetLabel,
  requirementLabelIndex,
  suppressionReasonLabel,
  workstreamLabel,
  workstreamStatusLabel,
  workstreamStatusTone,
} from "./accessPresentation";
import "./AccessSnapshot.css";

/** Synthetic key seeded by `npm run api:dev`; a starting value, not a lookup default in production. */
const DEFAULT_CASE_KEY = "SYN-API-CASE-0001";

const SIGNAL_GROUPS: ReadonlyArray<{ scope: BlockingScope; title: string }> = [
  { scope: "CASE_PROGRESSION", title: "Case progression" },
  { scope: "PRESCREEN", title: "Prescreen" },
  { scope: "PRESCREEN_TARGET", title: "Packet readiness" },
  { scope: "WORKSTREAM", title: "Workstream signals" },
];

/**
 * Read-only view of the governed Access case read model (ADR-0024). Everything shown is
 * a rendering of what `GET /api/access/cases/:caseKey` returned for the verified
 * session; it never touches the local demo case state and shows no patient identity.
 */
export function AccessSnapshot() {
  const { busy, principal } = useAuth();

  return (
    <div className="access-snapshot">
      <header className="snapshot-header">
        <div className="header-info">
          <h2>Access Snapshot</h2>
          <StatusBadge tone="info">Governed read model</StatusBadge>
        </div>
        {principal ? (
          <div className="session-info">
            Verified session {principal.displayName} ({principal.organizationId})
          </div>
        ) : null}
      </header>

      {principal ? (
        // Keyed by session: signing out and in as someone else must never inherit
        // the previous session's loaded case.
        <AccessCaseView key={principal.sessionId} />
      ) : busy ? (
        <p className="signing-in">Signing in…</p>
      ) : (
        <div className="signed-out">
          <h3>Authentication required</h3>
          <p>You must be signed in to access the governed Access read model.</p>
          <SignInForm
            placeholder="Development assertion"
            defaultValue="syn-assert-api-intake-dev"
            helpText={<p className="help-text">Development-only synthetic assertion.</p>}
          />
        </div>
      )}
    </div>
  );
}

function AccessCaseView() {
  const [caseKeyInput, setCaseKeyInput] = useState(DEFAULT_CASE_KEY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<AccessCaseReadModel | null>(null);

  // Both buttons are disabled while a request is in flight, so requests never overlap.
  async function load(caseKey: string) {
    if (!caseKey) return;
    setLoading(true);
    setError(null);
    try {
      setSnapshot(await apiAccessGetCase(caseKey));
    } catch (e) {
      // Fail closed: never keep showing a previous case beside an error.
      setSnapshot(null);
      setError(describeApiError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form
        className="lookup-bar"
        onSubmit={(event) => {
          event.preventDefault();
          void load(caseKeyInput.trim());
        }}
      >
        <label htmlFor="case-key-lookup">Case key</label>
        <input
          id="case-key-lookup"
          type="text"
          value={caseKeyInput}
          onChange={(event) => setCaseKeyInput(event.target.value)}
          placeholder="Enter case key..."
        />
        <button type="submit" disabled={loading || caseKeyInput.trim() === ""}>
          {loading ? "Loading..." : "Open case"}
        </button>
        {snapshot ? (
          <div className="refresh-actions">
            {/* Reloads the case on screen, not whatever has since been typed above. */}
            <button type="button" disabled={loading} onClick={() => void load(snapshot.caseKey)}>
              Refresh case
            </button>
            <span className="refresh-help">
              This view is refreshed on request; case-detail access is audited.
            </span>
          </div>
        ) : null}
      </form>

      {error ? (
        <div className="snapshot-error" role="alert">
          <h3>Failed to load governed case</h3>
          <p>{error}</p>
        </div>
      ) : null}

      {snapshot ? <SnapshotBody snapshot={snapshot} /> : null}
    </>
  );
}

function SignalList({
  signals,
  requirementLabels,
}: {
  signals: readonly GuidanceSignal[];
  requirementLabels: ReadonlyMap<string, string>;
}) {
  return (
    <ul>
      {signals.map((signal) => (
        <li key={signal.signalId}>
          <StatusBadge tone={blockingClassTone(signal.blockingClass)}>
            {blockingClassLabel(signal.blockingClass)}
          </StatusBadge>
          <span className="signal-reason">{describeAccessSignal(signal, requirementLabels)}</span>
        </li>
      ))}
    </ul>
  );
}

function SnapshotBody({ snapshot }: { snapshot: AccessCaseReadModel }) {
  const { journey, guidance, sourceState } = snapshot;
  const requirementLabels = requirementLabelIndex(guidance.packetReadiness);
  const activePosition = journey.phase === null ? -1 : JOURNEY_PHASE_ORDER.indexOf(journey.phase);

  const attention = guidance.signals.filter((signal) => isAttentionClass(signal.blockingClass));
  const recorded = guidance.signals.filter((signal) => !isAttentionClass(signal.blockingClass));

  return (
    <div className="snapshot-content">
      <div className="case-identity">
        <span className="case-id">Case {snapshot.caseKey}</span>
        <span className="case-version">Version {snapshot.caseVersion}</span>
      </div>

      <section className="journey-rail" aria-labelledby="journey-heading">
        <h3 id="journey-heading">Current journey position</h3>

        <ol className="phases-visual-rail" aria-label="Journey phases">
          {JOURNEY_PHASE_ORDER.map((phase, position) => {
            const isActive = position === activePosition;
            const isPast = activePosition !== -1 && position < activePosition;
            return (
              <li
                key={phase}
                className={`phase-node${isActive ? " active" : ""}${isPast ? " preceding" : ""}`}
                aria-current={isActive ? "step" : undefined}
              >
                {phaseLabel(phase)}
              </li>
            );
          })}
        </ol>

        <div className="phase-display">
          {journey.phase !== null ? (
            <span className="phase-label">{phaseLabel(journey.phase)}</span>
          ) : (
            <span className="phase-label unknown">
              Current phase cannot be determined from available governed evidence.
            </span>
          )}
          <StatusBadge tone={dispositionTone(journey.disposition)}>{dispositionLabel(journey.disposition)}</StatusBadge>
        </div>

        {journey.evidence.length > 0 ? (
          <details className="evidence-explanation">
            <summary>Why this phase?</summary>
            <ul>
              {journey.evidence.map((evidence, index) => (
                // Index in the key: two episode links may legitimately carry the same relationship.
                <li key={`${evidence.source}:${evidence.sourceValue}:${index}`}>{describeJourneyEvidence(evidence)}</li>
              ))}
            </ul>
          </details>
        ) : null}

        {journey.phase === "ADMISSION" ? (
          <p className="admission-source-note">Admission phase is based on recorded case-to-episode linkage.</p>
        ) : null}
      </section>

      <div className="snapshot-grid">
        <section className="attention-summary" aria-labelledby="attention-heading">
          <h3 id="attention-heading">What needs attention</h3>
          {attention.length === 0 ? (
            <EmptyState title="Nothing flagged">
              No blocked, waiting or review-gated items were derived from the recorded statuses. This is not a clearance.
            </EmptyState>
          ) : (
            <div className="signals-grouped">
              {SIGNAL_GROUPS.map(({ scope, title }) => {
                const inScope = attention.filter((signal) => signal.scope === scope);
                if (inScope.length === 0) return null;
                return (
                  <div key={scope} className="signal-group">
                    <h4>{title}</h4>
                    <SignalList signals={inScope} requirementLabels={requirementLabels} />
                  </div>
                );
              })}
            </div>
          )}

          {recorded.length > 0 ? (
            <details className="recorded-signals">
              <summary>Satisfied or not applicable ({recorded.length})</summary>
              <SignalList signals={recorded} requirementLabels={requirementLabels} />
            </details>
          ) : null}
        </section>

        <section className="candidate-work" aria-labelledby="next-work-heading">
          <h3 id="next-work-heading">Candidate next work</h3>
          {guidance.nextWork.length === 0 ? (
            <EmptyState title="No next work">There are no candidate actions at this time.</EmptyState>
          ) : (
            <ul className="next-work-list">
              {guidance.nextWork.map((candidate) => (
                <li key={candidate.candidateId} className="work-item">
                  <span className="work-label">{nextWorkLabel(candidate.kind)}</span>
                  {candidate.workstream !== undefined ? (
                    <span className="work-context">{workstreamLabel(candidate.workstream)}</span>
                  ) : null}
                  {candidate.requirementCode !== undefined ? (
                    <span className="work-context">
                      {requirementLabels.get(candidate.requirementCode) ?? candidate.requirementCode}
                    </span>
                  ) : null}
                  <span className="candidate-badge">Candidate / Not assigned</span>
                </li>
              ))}
            </ul>
          )}

          {guidance.suppressed.length > 0 ? (
            <details className="suppressed-work">
              <summary>Work not currently actionable</summary>
              <ul>
                {guidance.suppressed.map((suppression) => (
                  <li key={`${suppression.kind}:${suppression.signalId}`}>
                    {nextWorkLabel(suppression.kind)} — {suppressionReasonLabel(suppression.reason)}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </section>

        <section className="workstreams-panel" aria-labelledby="workstreams-heading">
          <h3 id="workstreams-heading">Workstreams</h3>
          <p className="help-text">A blocked lane does not necessarily mean the patient journey is blocked.</p>
          <div className="workstream-list">
            {WORKSTREAM_ORDER.map((workstream) => (
              <div key={workstream} className="workstream-row">
                <span className="ws-name">{workstreamLabel(workstream)}</span>
                <StatusBadge tone={workstreamStatusTone(sourceState.workstreams[workstream])}>
                  {workstreamStatusLabel(sourceState.workstreams[workstream])}
                </StatusBadge>
              </div>
            ))}
          </div>
        </section>

        <section className="prescreen-source" aria-labelledby="prescreen-heading">
          <h3 id="prescreen-heading">Prescreen source state</h3>
          <div className="prescreen-selection">
            {sourceState.prescreenSelection === "NONE" ? (
              <p>No active Prescreen encounter selected from governed data.</p>
            ) : null}
            {sourceState.prescreenSelection === "SELECTED" && sourceState.prescreen ? (
              <div className="selected-prescreen">
                <p>Status: {prescreenStatusLabel(sourceState.prescreen.status)}</p>
                <p>Version: {sourceState.prescreen.version}</p>
              </div>
            ) : null}
            {sourceState.prescreenSelection === "AMBIGUOUS" ? (
              <div className="ambiguous-warning" role="alert">
                <strong>Warning:</strong> Multiple active Prescreen encounters exist. Prescreen evidence is excluded from
                this projection until the ambiguity is resolved. Do not guess which encounter is current.
              </div>
            ) : null}
          </div>

          <h4>Packet evidence</h4>
          <div className="packet-evidence">
            {sourceState.packetRequirementEvidence === "NOT_AVAILABLE" ? (
              <p>Packet requirement evidence was not supplied to this projection.</p>
            ) : null}
            {sourceState.packetRequirementEvidence === "LOADED_EMPTY" ? (
              <p>
                The selected Prescreen encounter currently has zero persisted packet requirement rows.
                <br />
                <small>This does not prove all real-world required documents are present.</small>
              </p>
            ) : null}
            {sourceState.packetRequirementEvidence === "LOADED" && guidance.packetReadiness !== null ? (
              <ul className="packet-readiness">
                {guidance.packetReadiness.map((result) => (
                  <li key={result.target}>
                    <span className="target-name">{prescreenTargetLabel(result.target)}</span>
                    <StatusBadge tone={result.ready ? "good" : "danger"}>
                      {result.ready ? "Ready" : "Not ready"}
                    </StatusBadge>
                    <span className="target-counts">
                      {result.blockers.length} blocking, {result.warnings.length} warning
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
