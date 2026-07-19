import { Route } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { caseIsEscalated } from "../domain/clocks";
import {
  deriveHandoffFeed,
  deriveJourney,
  journeyPhaseOrder,
  monitoredPhases,
  type JourneyMilestone,
  type MilestoneStatus,
} from "../domain/journey";
import { sortCases } from "../domain/selectors";
import type { AppState } from "../domain/types";

function milestoneTone(status: MilestoneStatus): "good" | "info" | "neutral" | "warn" {
  if (status === "Complete") return "good";
  if (status === "In progress") return "info";
  if (status === "Not built") return "warn";
  return "neutral";
}

function MilestoneRow({ item }: { item: JourneyMilestone }) {
  return (
    <li className="journey-milestone">
      <div className="journey-milestone-head">
        <StatusBadge tone={milestoneTone(item.status)}>{item.status}</StatusBadge>
        <strong>{item.label}</strong>
      </div>
      <p className="subtext">{item.evidence}</p>
      {item.status !== "Complete" ? (
        <p className="subtext">
          <em>{item.status === "Not built" ? "Product gap: " : "Next: "}</em>
          {item.nextStep} · <strong>{item.responsibleLabel}</strong>
        </p>
      ) : null}
    </li>
  );
}

export function JourneyMonitor({
  state,
  nowIso,
  selectedCaseId,
  onSelect,
}: {
  state: AppState;
  nowIso: string;
  selectedCaseId: string;
  onSelect: (caseId: string) => void;
}) {
  const selectedReading = deriveJourney(state, selectedCaseId, nowIso);
  const handoffGroups = deriveHandoffFeed(state, nowIso);

  return (
    <div className="stack">
      <section className="panel">
        <div className="panel-title">
          <div className="icon-title"><Route size={18} /><h2>Patient Journey Monitor</h2></div>
          <p>
            Admin view of pre-admit, intake, and admitted progress per synthetic case. Progress derives live from
            workspace artifacts — nothing here is entered by hand. Hatched segments are product gaps, not patient status.
          </p>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Case</th>
                <th>Priority</th>
                {monitoredPhases.map((phaseId) => (
                  <th key={phaseId}>{journeyPhaseOrder.find((item) => item.id === phaseId)?.label}</th>
                ))}
                <th>Next action</th>
                <th>Owner of next step</th>
                <th>Escalation</th>
              </tr>
            </thead>
            <tbody>
              {sortCases(state.cases).map((caseRecord) => {
                const reading = deriveJourney(state, caseRecord.id, nowIso);
                const escalated = caseIsEscalated(state, caseRecord.id, nowIso);
                return (
                  <tr
                    className={caseRecord.id === selectedCaseId ? "selected-row" : escalated ? "escalated-row" : ""}
                    key={caseRecord.id}
                    onClick={() => onSelect(caseRecord.id)}
                  >
                    <td>
                      <button className="link-button" type="button">{caseRecord.patientToken.displayName}</button>
                      <span className="subtext">{caseRecord.id}</span>
                    </td>
                    <td>
                      <StatusBadge tone={caseRecord.priority === "Emergent" ? "danger" : caseRecord.priority === "Urgent" ? "warn" : "neutral"}>
                        {caseRecord.priority}
                      </StatusBadge>
                    </td>
                    {monitoredPhases.map((phaseId) => {
                      const phase = reading.phases.find((item) => item.phase === phaseId);
                      if (!phase) return <td key={phaseId} />;
                      return (
                        <td key={phaseId}>
                          <div className="journey-bar" title={`${phase.completed}/${phase.built} built milestones complete${phase.notBuilt ? `; ${phase.notBuilt} not built yet` : ""}`}>
                            <div className="journey-bar-fill" style={{ width: `${phase.percent}%` }} />
                            {phase.notBuilt > 0 ? <div className="journey-bar-gap" style={{ width: `${Math.round((phase.notBuilt / phase.milestones.length) * 100)}%` }} /> : null}
                          </div>
                          <span className="subtext">{phase.percent}% · {phase.completed}/{phase.built}{phase.notBuilt ? ` (+${phase.notBuilt} unbuilt)` : ""}</span>
                        </td>
                      );
                    })}
                    <td>{reading.nextAction ? reading.nextAction.label : <span className="subtext">None</span>}</td>
                    <td>{reading.nextAction ? <StatusBadge tone="info">{reading.nextAction.responsibleLabel}</StatusBadge> : <span className="subtext">—</span>}</td>
                    <td>{escalated ? <StatusBadge tone="danger">Clock breached</StatusBadge> : <span className="subtext">None</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <footer className="panel-footer">
          Percentages count implemented milestones only. Intake and Admitted include unbuilt milestones (CIA workflow, admission orders, UR surface) shown as gaps so the bar cannot overstate reality.
        </footer>
      </section>

      <section className="panel">
        <div className="panel-title">
          <h3>Selected case — full journey</h3>
          <p>All five phases for the selected case. Completing work in the source workspace is what advances a milestone; this view stores nothing.</p>
        </div>
        <div className="journey-phase-grid">
          {selectedReading.phases.map((phase) => (
            <article className="journey-phase-card" key={phase.phase}>
              <header>
                <h4>{phase.label}</h4>
                <span className="subtext">{phase.completed}/{phase.built} complete{phase.notBuilt ? ` · ${phase.notBuilt} not built` : ""}</span>
              </header>
              <ul>
                {phase.milestones.map((item) => (
                  <MilestoneRow item={item} key={item.id} />
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <h3>Simulated handoff feed</h3>
          <p>
            Who owns the next step on every open case, grouped by role. Display-only simulation: no page, text, email, or
            call is sent. A real notification/agent layer is future work behind authentication and audit boundaries.
          </p>
        </div>
        {handoffGroups.length === 0 ? (
          <p className="subtext">No open next actions.</p>
        ) : (
          <div className="journey-handoff-grid">
            {handoffGroups.map((group) => (
              <article className="journey-handoff-card" key={group.responsibleLabel}>
                <h4>{group.responsibleLabel}</h4>
                <ul>
                  {group.items.map((item) => (
                    <li key={`${item.caseId}-${item.milestone.id}`}>
                      <button className="link-button" onClick={() => onSelect(item.caseId)} type="button">
                        {item.caseLabel}
                      </button>{" "}
                      <StatusBadge tone={item.priority === "Emergent" ? "danger" : item.priority === "Urgent" ? "warn" : "neutral"}>{item.priority}</StatusBadge>
                      <p className="subtext">{item.milestone.nextStep}</p>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
        <footer className="panel-footer">Synthetic cases only. The goal state — automatic role/agent notification on milestone completion — requires the authentication, audit, and consumer contracts tracked in IMPLEMENTATION_STATUS.md.</footer>
      </section>
    </div>
  );
}
