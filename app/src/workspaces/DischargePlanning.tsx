import { ClipboardList, Home, ShieldAlert } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { getDischargePlan, levelOfCareOptions } from "../domain/journey";
import type { WorkspaceId } from "../domain/roles";
import type { AppState, DischargePlan, DischargePlanDomain, DischargePlanningStatus, LevelOfCareOption } from "../domain/types";

interface Props {
  state: AppState;
  caseId: string;
  onChange: (plan: DischargePlan) => void;
  onNavigateWorkspace: (workspace: WorkspaceId) => void;
}

const statusOptions: DischargePlanningStatus[] = ["Not started", "In progress", "Needs review", "Confirmed", "Not applicable"];

function tone(status: DischargePlanningStatus): "good" | "warn" | "info" | "neutral" {
  if (status === "Confirmed" || status === "Not applicable") return "good";
  if (status === "Needs review") return "warn";
  if (status === "In progress") return "info";
  return "neutral";
}

export function DischargePlanning({ state, caseId, onChange, onNavigateWorkspace }: Props) {
  const plan = getDischargePlan(state, caseId);
  const caseRecord = state.cases.find((item) => item.id === caseId);
  const updateDomain = (domain: DischargePlanDomain, changes: Partial<DischargePlanDomain>) => {
    const updatedDomain = { ...domain, ...changes, updatedAt: new Date().toISOString() };
    onChange({ ...plan, status: "In progress", domains: plan.domains.map((item) => item.id === domain.id ? updatedDomain : item), updatedAt: new Date().toISOString() });
  };

  return (
    <div className="stack" aria-labelledby="discharge-heading">
      <section className="panel journey-workspace-hero">
        <div className="panel-title">
          <div className="icon-title"><ClipboardList size={19} /><h2 id="discharge-heading">Discharge Planning</h2></div>
          <StatusBadge tone="info">Starts during Intake</StatusBadge>
        </div>
        <p>
          Build continuity planning early and confirm it before discharge. Admission is not blocked by an unfinished plan by default;
          unresolved barriers remain visible with an owner.
        </p>
        <div className="read-only-warning" role="note"><ShieldAlert size={17} /><span>Synthetic local workflow. Disposition, level of care, placement, and discharge decisions remain human-reviewed.</span></div>
      </section>

      <section className="journey-context-strip" aria-label="Discharge planning case context">
        <div><span className="label">Case</span><strong>{caseRecord?.patientToken.displayName ?? caseId}</strong></div>
        <div><span className="label">Current stage</span><strong>{caseRecord?.currentStage ?? "Unknown"}</strong></div>
        <div><span className="label">Planning domains</span><strong>{plan.domains.length}</strong></div>
        <div><span className="label">Confirmed</span><strong>{plan.domains.filter((item) => item.status === "Confirmed" || item.status === "Not applicable").length}</strong></div>
      </section>

      <section className="panel">
        <div className="panel-title"><div className="icon-title"><Home size={18} /><h3>Disposition review</h3></div><p>Human review determines the final path.</p></div>
        <div className="form-grid">
          <label>Disposition review status<select value={plan.dispositionReviewStatus} onChange={(event) => onChange({ ...plan, dispositionReviewStatus: event.target.value as DischargePlan["dispositionReviewStatus"], updatedAt: new Date().toISOString() })}>
            {(["Not started", "Needs authorized review", "Reviewed"] as const).map((item) => <option key={item}>{item}</option>)}
          </select></label>
          <label>Selected step-down level
            <select value={plan.domains.find((item) => item.kind === "step-down-level")?.selectedLevelOfCare ?? "Unknown"} onChange={(event) => {
              const domain = plan.domains.find((item) => item.kind === "step-down-level");
              if (domain) updateDomain(domain, { selectedLevelOfCare: event.target.value as LevelOfCareOption, status: "Needs review" });
            }}>
              {levelOfCareOptions.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="panel-title"><h3>Planning domains</h3><p>Default prompts require confirmation; they are never silently marked arranged.</p></div>
        <div className="discharge-domain-list">
          {plan.domains.map((domain) => (
            <article className="discharge-domain" key={domain.id}>
              <div className="stage-summary-head"><div><strong>{domain.label}</strong><span className="subtext">Owner: {domain.owner}</span></div><StatusBadge tone={tone(domain.status)}>{domain.status}</StatusBadge></div>
              <p>{domain.note}</p>
              <div className="form-grid compact-form-grid">
                <label>Status<select value={domain.status} onChange={(event) => updateDomain(domain, { status: event.target.value as DischargePlanningStatus })}>
                  {statusOptions.map((item) => <option key={item}>{item}</option>)}
                </select></label>
                <label>Due or follow-up date<input type="date" value={domain.dueAt ?? ""} onChange={(event) => updateDomain(domain, { dueAt: event.target.value || undefined })} /></label>
                <label className="span-2">Planning note<textarea value={domain.note} onChange={(event) => updateDomain(domain, { note: event.target.value })} /></label>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-title"><h3>Resolution workspaces</h3><p>Use existing source surfaces for the underlying clinical, legal, placement, and custody artifacts.</p></div>
        <div className="button-row">
          <button className="secondary-button" type="button" onClick={() => onNavigateWorkspace("intake")}>Guided Intake</button>
          <button className="secondary-button" type="button" onClick={() => onNavigateWorkspace("medical")}>Medical Necessity</button>
          <button className="secondary-button" type="button" onClick={() => onNavigateWorkspace("legal")}>Legal Status</button>
          <button className="secondary-button" type="button" onClick={() => onNavigateWorkspace("bedboard")}>Milieu Bedboard</button>
          <button className="secondary-button" type="button" onClick={() => onNavigateWorkspace("dependency-map")}>Dependency Map</button>
        </div>
      </section>
    </div>
  );
}
