import { useState } from "react";
import { StatusBadge } from "../StatusBadge";
import {
  applyNoticeAction, contradictionRule, contradictionScenario, demoLearner, demoReviewer, evaluatePractice,
  isPracticeActionAvailable, learningModule, practiceActions, recordPracticeAction, startPractice,
  type NoticeAction, type ScenarioAction,
} from "../../domain/learningPractice";
import { MyPathPanel } from "./MyPathPanel";
import { NoticeAcknowledgeCard } from "./NoticeAcknowledgeCard";

export function PracticeLabScenario() {
  const [state, setState] = useState(() => startPractice());
  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const act = (action: ScenarioAction) => {
    try {
      const next = recordPracticeAction(state, demoLearner, action);
      setState(action === "COMPLETE_SCENARIO" ? evaluatePractice(next, demoLearner) : next);
      setError("");
    } catch (err) { setError(err instanceof Error ? err.message : "Practice action failed"); }
  };
  const noticeAction = (action: NoticeAction, context: string) => {
    try {
      const resolution = action === "CONFIRM_CONTEST" || action === "DISMISS_CONTEST";
      setState(applyNoticeAction(state, resolution ? demoReviewer : demoLearner, action, context, demoReviewer));
      setError("");
    } catch (err) { setError(err instanceof Error ? err.message : "Notice action failed"); }
  };
  return (
    <div className="stack" style={{ gridTemplateColumns: "minmax(0, 1fr)" }} aria-label="Central Intake Practice Lab">
      <section className="panel">
        <div className="panel-title"><div><h3>Central Intake Practice Lab</h3><p>{learningModule.title} · module {learningModule.version}</p></div><StatusBadge tone="warn">Synthetic demo only</StatusBadge></div>
        <p>One in-memory practice attempt. Reset, leaving this workspace, or reloading clears this practice and its evidence. Demo identities are not authentication.</p>
        <p>Live recognition (CLPR-4) is disabled. No live work observation or patient workflows are connected.</p>
        <h4>{contradictionScenario.title}</h4>
        <div className="grid-two">{contradictionScenario.initialFacts.map(fact => <article className="feature-card" key={fact.factId}>
          <h4>{fact.sourceLabel}</h4><p>{fact.statement}</p><p className="subtext">{fact.factId} · Source reliability: {fact.sourceReliability}</p>
        </article>)}</div>
        <p>Identify the contradiction, retain both source statements, and escalate to the clinical review queue. Complete the attempt to evaluate the recorded behavior.</p>
        <div className="training-badge-row">{practiceActions.map(({ action, label }) => <button type="button" key={action} className="secondary-button" disabled={state.completed || state.actions.includes(action) || !isPracticeActionAvailable(action, state.actions)} onClick={() => act(action)}>{label}</button>)}</div>
        <div className="training-badge-row">
          <button type="button" className="primary-button" disabled={state.completed} onClick={() => act("COMPLETE_SCENARIO")}>Complete and evaluate practice</button>
          <button type="button" className="secondary-button" onClick={() => { setState(startPractice()); setError(""); setResetMessage("Practice reset: previous events and competency evidence cleared."); }}>Reset synthetic practice</button>
        </div>
        {resetMessage && <p role="status">{resetMessage}</p>}
        <p role="status">{state.reason}</p>
        {error && <p role="alert">{error}</p>}
        <details><summary>Synthetic workflow events ({state.events.length})</summary><ol>{state.events.map(event => <li key={event.eventId}>{event.eventType}{event.evidenceRefs.length > 0 && ` · ${event.evidenceRefs.join(", ")}`}</li>)}</ol></details>
        <p className="subtext">Excluded from recognition: {contradictionRule.prohibitedInputs.join(", ").toLowerCase()}.</p>
      </section>
      <NoticeAcknowledgeCard key={state.sessionId} state={state} viewer={demoLearner} onAction={noticeAction} />
      <MyPathPanel state={state} viewer={demoLearner} />
    </div>
  );
}
