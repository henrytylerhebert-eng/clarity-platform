import { useState } from "react";
import { StatusBadge } from "../StatusBadge";
import { readPractice, type ActorScope, type NoticeAction, type PracticeState } from "../../domain/learningPractice";

export function NoticeAcknowledgeCard({ state, viewer, onAction }: {
  state: PracticeState; viewer: ActorScope; onAction: (action: NoticeAction, context: string) => void;
}) {
  const [context, setContext] = useState("");
  const current = readPractice(state, viewer);
  const { candidate, observation } = current;
  if (!candidate || !observation) return null;
  const ready = candidate.state === "READY_TO_ACKNOWLEDGE";
  const act = (action: NoticeAction) => { onAction(action, context); setContext(""); };
  return (
    <section className="panel" aria-label="Notice and Acknowledge">
      <div className="panel-title">
        <h3>Notice & Acknowledge</h3>
        <StatusBadge tone={candidate.state === "CONFIRMED" ? "good" : "warn"}>{candidate.state}</StatusBadge>
      </div>
      <p>You preserved contradictory source statements and routed the conflict for qualified review.</p>
      <p>Preserving uncertainty prevents an unverified account from becoming settled fact.</p>
      <p><strong>Behavior rule:</strong> {observation.ruleId}@{observation.ruleVersion} · <strong>Confidence:</strong> {observation.confidence}</p>
      <p><strong>Learning module:</strong> {observation.moduleVersion}</p>
      <details>
        <summary>Evidence references ({observation.evidenceRefs.length})</summary>
        <ul>{observation.evidenceRefs.map(ref => <li key={ref}>{ref}</li>)}</ul>
      </details>
      <p>You may acknowledge, add context, contest, or dismiss this candidate. Context alone does not create competency evidence.</p>
      {(ready || candidate.state === "CONTESTED") && <div className="stack">
        <label>Synthetic context only
          <textarea aria-label="Synthetic context only" value={context} onChange={event => setContext(event.target.value)} placeholder="Describe the synthetic practice or review context; no real personal information." />
        </label>
        {ready && <div className="training-badge-row">
          <button type="button" className="primary-button" onClick={() => act("ACKNOWLEDGE")}>Acknowledge</button>
          <button type="button" className="secondary-button" disabled={!context.trim()} onClick={() => act("ADD_CONTEXT")}>Add context</button>
          <button type="button" className="secondary-button" disabled={!context.trim()} onClick={() => act("CONTEST")}>Contest</button>
          <button type="button" className="secondary-button" disabled={!context.trim()} onClick={() => act("DISMISS")}>Dismiss candidate</button>
        </div>}
        {candidate.state === "CONTESTED" && <div className="stack">
          <p role="status">Contested: competency evidence is frozen pending review.</p>
          <p><strong>Simulated reviewer controls.</strong> These act as a separate configured synthetic reviewer. This is a demo of human review; no actual reviewer approval or production authorization is recorded.</p>
          <div className="training-badge-row">
            <button type="button" className="secondary-button" disabled={!context.trim()} onClick={() => act("CONFIRM_CONTEST")}>Simulate reviewer confirmation</button>
            <button type="button" className="secondary-button" disabled={!context.trim()} onClick={() => act("DISMISS_CONTEST")}>Simulate reviewer dismissal</button>
          </div>
        </div>}
      </div>}
      {observation.confidence === "HUMAN_REVIEWED" && <p>HUMAN_REVIEWED is a simulated resolution status in this synthetic demo.</p>}
      {current.history.length > 0 && <details><summary>Acknowledgement history</summary><ul>{current.history.map((item, index) => <li key={index}>{item.action} · {item.actorId}{item.context && `: ${item.context}`}</li>)}</ul></details>}
    </section>
  );
}
