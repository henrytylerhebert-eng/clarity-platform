import { BookOpenCheck, ClipboardCheck, FileWarning, ShieldCheck } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import {
  getRoleTrainingPlan,
  pecCustodyTrainingPath,
  roleTrainingPlans,
  sopPhases,
  trainingSourceBoundaries,
} from "../domain/training";
import type { RoleId } from "../domain/roles";
import { PracticeLabScenario } from "../components/learning-practice/PracticeLabScenario";

export function TrainingSops({ roleId }: { roleId: RoleId }) {
  const plan = getRoleTrainingPlan(roleId);

  return (
    <div className="stack" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
      <section className="panel">
        <div className="panel-title">
          <div>
            <h2>Training & SOPs</h2>
            <p>
              Role-specific onboarding built from the platform source context. This is training guidance for synthetic
              workflow practice, not final clinical policy, legal advice, HR credentialing, or production SOP enforcement.
            </p>
          </div>
          <StatusBadge tone="warn">Review-gated training</StatusBadge>
        </div>

        <div className="status-strip">
          <div>
            <span className="label">Active position</span>
            <strong>{plan.label}</strong>
          </div>
          <div>
            <span className="label">Training posture</span>
            <strong>Draft SOP support</strong>
          </div>
          <div>
            <span className="label">Clinical/legal status</span>
            <strong>Requires review</strong>
          </div>
          <div>
            <span className="label">Data mode</span>
            <strong>Synthetic only</strong>
          </div>
        </div>
      </section>

      {(roleId === "central" || roleId === "all") && <PracticeLabScenario />}

      <section className="grid-two">
        <article className="panel">
          <div className="icon-title">
            <BookOpenCheck size={19} />
            <h3>{plan.label} onboarding</h3>
          </div>
          <p className="subtext">{plan.mission}</p>
          <p><strong>Outcome:</strong> {plan.onboardingOutcome}</p>
          <h4>SOP checklist</h4>
          <ul className="check-list">
            {plan.sopChecklist.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </article>

        <article className="panel">
          <div className="icon-title">
            <ClipboardCheck size={19} />
            <h3>Practice workflow and competency evidence</h3>
          </div>
          <div className="training-path" aria-label="Practice workflow">
            {plan.practiceWorkflow.map((step) => <span key={step}>{step}</span>)}
          </div>
          <h4>Competency evidence</h4>
          <ul className="check-list">
            {plan.competencyEvidence.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <h4>Review gates</h4>
          <div className="training-badge-row">
            {plan.reviewGates.map((gate) => <StatusBadge key={gate} tone="warn">{gate}</StatusBadge>)}
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-title">
          <div>
            <h3>SOP phases built into workflow</h3>
            <p>These phases convert the detailed SOP material into repeatable product checkpoints and training evidence.</p>
          </div>
          <StatusBadge tone="info">Source-linked training</StatusBadge>
        </div>
        <div className="feature-map-grid">
          {sopPhases.map((phase) => (
            <article className="feature-card" key={phase.title}>
              <h4>{phase.title}</h4>
              <p><strong>Workflow:</strong> {phase.workflowFit}</p>
              <p><strong>Evidence:</strong> {phase.evidence}</p>
              <p><strong>Gate:</strong> {phase.reviewGate}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid-two">
        <article className="panel">
          <div className="icon-title">
            <ShieldCheck size={19} />
            <h3>PEC chain-of-custody practice path</h3>
          </div>
          <ol className="number-list">
            {pecCustodyTrainingPath.map((step) => <li key={step}>{step}</li>)}
          </ol>
          <p className="panel-footer">
            Statutory deadlines, legal form wording, signature rules, and CEC/second-review behavior remain counsel-validation items.
          </p>
        </article>

        <article className="panel">
          <div className="icon-title">
            <FileWarning size={19} />
            <h3>Source boundaries</h3>
          </div>
          <div className="source-boundary-list">
            {trainingSourceBoundaries.map((source) => (
              <div className="source-boundary-row" key={source.title}>
                <div>
                  <strong>{source.title}</strong>
                  <p>{source.note}</p>
                </div>
                <div className="training-badge-row">
                  <StatusBadge tone={source.status === "Source confirmed" ? "good" : "info"}>{source.status}</StatusBadge>
                  <StatusBadge tone="warn">{source.review}</StatusBadge>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-title">
          <div>
            <h3>Position training matrix</h3>
            <p>Every role gets onboarding, SOP practice, competency evidence, and explicit review boundaries.</p>
          </div>
          <StatusBadge tone="neutral">Company agnostic</StatusBadge>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Position</th>
                <th>Onboarding outcome</th>
                <th>Practice workflow</th>
                <th>Review gates</th>
              </tr>
            </thead>
            <tbody>
              {roleTrainingPlans.filter((item) => item.roleId !== "all").map((item) => (
                <tr key={item.roleId}>
                  <td><strong>{item.label}</strong><span className="subtext">{item.mission}</span></td>
                  <td>{item.onboardingOutcome}</td>
                  <td>{item.practiceWorkflow.join(" -> ")}</td>
                  <td>{item.reviewGates.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
