import { Route } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { caseIsEscalated } from "../domain/clocks";
import { deriveHandoffFeed, deriveJourney, journeyPhaseOrder, monitoredPhases, type JourneyMilestone, type JourneyStatus } from "../domain/journey";
import type { WorkspaceId } from "../domain/roles";
import { sortCases } from "../domain/selectors";
import type { AppState } from "../domain/types";

interface Props {
  state: AppState;
  nowIso: string;
  selectedCaseId: string;
  onSelect: (caseId: string) => void;
  onNavigateWorkspace: (workspace: WorkspaceId) => void;
}

function milestoneTone(status: JourneyStatus): "good" | "info" | "neutral" | "warn" | "danger" {
  if (status === "Complete") return "good";
  if (status === "Blocked") return "danger";
  if (status === "Needs review" || status === "External wait" || status === "Not built") return "warn";
  if (status === "In progress") return "info";
  return "neutral";
}

function workspaceForMilestone(item: JourneyMilestone): WorkspaceId {
  if (item.phase === "prescreen") return "prescreen";
  if (item.phase === "intake") {
    if (item.id.includes("medical-necessity")) return "medical";
    if (item.id.includes("legal")) return "legal";
    return "intake";
  }
  if (item.phase === "admit") return item.id.includes("operational") ? "routing" : item.id.includes("arrival") ? "ledger" : "admit";
  if (item.phase === "discharge") return "discharge";
  return "journey";
}

function MilestoneRow({ item, onNavigateWorkspace }: { item: JourneyMilestone; onNavigateWorkspace: (workspace: WorkspaceId) => void }) {
  return (
    <li className="journey-milestone">
      <div className="journey-milestone-head"><StatusBadge tone={milestoneTone(item.status)}>{item.status}</StatusBadge><strong>{item.label}</strong></div>
      <p className="subtext">{item.evidence}</p>
      {item.status !== "Complete" && item.status !== "Not applicable" ? <p className="subtext"><em>{item.status === "Not built" ? "Product gap: " : "Next: "}</em>{item.nextStep} · <strong>{item.responsibleLabel}</strong></p> : null}
      {item.status !== "Not built" && item.status !== "Complete" ? <button className="link-button" type="button" onClick={() => onNavigateWorkspace(workspaceForMilestone(item))}>Open resolution workspace</button> : null}
    </li>
  );
}

export function JourneyMonitor({ state, nowIso, selectedCaseId, onSelect, onNavigateWorkspace }: Props) {
  const selectedReading = deriveJourney(state, selectedCaseId, nowIso);
  const handoffGroups = deriveHandoffFeed(state, nowIso);
  return (
    <div className="stack" aria-labelledby="journey-heading">
      <section className="panel journey-workspace-hero">
        <div className="panel-title"><div className="icon-title"><Route size={19} /><h2 id="journey-heading">Patient Journey Monitor</h2></div><StatusBadge tone="info">Derived read-only view</StatusBadge></div>
        <p>Central Intake coordination across Prescreen, staged Intake, Admit checkpoints, and Discharge Planning. Source workspaces write; this view recalculates.</p>
        <div className="read-only-warning" role="note">Synthetic cases only. No universal readiness score, autonomous conclusion, or real notification is generated here.</div>
      </section>

      <section className="panel">
        <div className="panel-title"><h3>Journey queue</h3><p>Progress counts built milestones only; product gaps remain visible.</p></div>
        <div className="table-wrap">
          <table className="readiness-table" aria-label="Patient journey queue">
            <thead><tr><th>Case</th><th>Priority</th>{monitoredPhases.map((phaseId) => <th key={phaseId}>{journeyPhaseOrder.find((item) => item.id === phaseId)?.label}</th>)}<th>Next action</th><th>Owner</th><th>Escalation</th></tr></thead>
            <tbody>{sortCases(state.cases).map((caseRecord) => {
              const reading = deriveJourney(state, caseRecord.id, nowIso);
              const escalated = caseIsEscalated(state, caseRecord.id, nowIso);
              return <tr className={caseRecord.id === selectedCaseId ? "selected-row" : escalated ? "escalated-row" : ""} key={caseRecord.id} onClick={() => onSelect(caseRecord.id)}>
                <td data-label="Case"><button className="link-button" type="button">{caseRecord.patientToken.displayName}</button><span className="subtext">{caseRecord.id}</span></td>
                <td data-label="Priority"><StatusBadge tone={caseRecord.priority === "Emergent" ? "danger" : caseRecord.priority === "Urgent" ? "warn" : "neutral"}>{caseRecord.priority}</StatusBadge></td>
                {monitoredPhases.map((phaseId) => { const phase = reading.phases.find((item) => item.phase === phaseId); return <td data-label={journeyPhaseOrder.find((item) => item.id === phaseId)?.label} key={phaseId}>{phase ? <><div className="journey-bar" title={`${phase.completed}/${phase.built} built milestones complete`}><div className="journey-bar-fill" style={{ width: `${phase.percent}%` }} />{phase.notBuilt ? <div className="journey-bar-gap" style={{ width: `${Math.round((phase.notBuilt / phase.milestones.length) * 100)}%` }} /> : null}</div><span className="subtext">{phase.percent}% · {phase.completed}/{phase.built}{phase.notBuilt ? ` (+${phase.notBuilt} gap)` : ""}</span></> : null}</td>; })}
                <td data-label="Next action">{reading.nextAction?.label ?? <span className="subtext">None</span>}</td>
                <td data-label="Owner">{reading.nextAction ? <StatusBadge tone="info">{reading.nextAction.responsibleLabel}</StatusBadge> : <span className="subtext">None</span>}</td>
                <td data-label="Escalation">{escalated ? <StatusBadge tone="danger">Clock breached</StatusBadge> : <span className="subtext">None</span>}</td>
              </tr>;
            })}</tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-title"><h3>Selected case — five-part journey</h3><p>Admit is a chain of checkpoints. Discharge planning starts before admission is complete.</p></div>
        <div className="journey-phase-grid">{selectedReading.phases.map((phase) => <article className="journey-phase-card" key={phase.phase}><header><h4>{phase.label}</h4><span className="subtext">{phase.completed}/{phase.built} complete{phase.notBuilt ? ` · ${phase.notBuilt} gap(s)` : ""}</span></header><ul>{phase.milestones.map((item) => <MilestoneRow item={item} key={item.id} onNavigateWorkspace={onNavigateWorkspace} />)}</ul></article>)}</div>
      </section>

      <section className="panel">
        <div className="panel-title"><h3>Simulated handoff feed</h3><p>Display-only grouping of each case's next human-owned action.</p></div>
        {handoffGroups.length ? <div className="journey-handoff-grid">{handoffGroups.map((group) => <article className="journey-handoff-card" key={group.responsibleLabel}><h4>{group.responsibleLabel}</h4><ul>{group.items.map((item) => <li key={`${item.caseId}-${item.milestone.id}`}><button className="link-button" type="button" onClick={() => onSelect(item.caseId)}>{item.caseLabel}</button> <StatusBadge tone={item.priority === "Emergent" ? "danger" : item.priority === "Urgent" ? "warn" : "neutral"}>{item.priority}</StatusBadge><p className="subtext">{item.milestone.nextStep}</p></li>)}</ul></article>)}</div> : <p className="subtext">No open next actions.</p>}
        <footer className="panel-footer">A real notification layer remains gated behind authentication, audit, and consumer contracts.</footer>
      </section>
    </div>
  );
}
