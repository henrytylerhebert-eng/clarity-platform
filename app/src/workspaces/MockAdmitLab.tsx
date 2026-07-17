import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, FileText, FlaskConical, Scale, ShieldAlert, UsersRound } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import {
  mockAdmissionFilters,
  mockAdmissionGuardrails,
  mockAdmissionProcess,
  mockAdmissionRolePlay,
  mockAdmissions,
  mockAdmissionUrChecklist,
  type MockAdmissionFilter,
  type MockAdmissionReviewStatus,
} from "../domain/mockAdmissions";

type MockAdmissionView = "intake" | "decision" | "draft";

function reviewTone(status: MockAdmissionReviewStatus): "neutral" | "warn" | "danger" {
  if (status === "Needs medical review") return "danger";
  return status === "Needs clinician review" ? "warn" : "neutral";
}

function priorityTone(priority: "Emergent" | "Urgent"): "danger" | "warn" {
  return priority === "Emergent" ? "danger" : "warn";
}

function gateTone(reviewGate: string): "info" | "warn" | "danger" {
  if (reviewGate.includes("counsel")) return "danger";
  if (reviewGate.includes("Medical") || reviewGate.includes("medical")) return "warn";
  return "info";
}

export function MockAdmitLab() {
  const [filter, setFilter] = useState<MockAdmissionFilter>("All cases");
  const [selectedCaseId, setSelectedCaseId] = useState(mockAdmissions[0]!.id);
  const [view, setView] = useState<MockAdmissionView>("intake");

  const filteredAdmissions = useMemo(
    () => mockAdmissions.filter((admission) => filter === "All cases" || admission.cohort === filter),
    [filter],
  );

  useEffect(() => {
    if (!filteredAdmissions.some((admission) => admission.id === selectedCaseId)) {
      setSelectedCaseId(filteredAdmissions[0]!.id);
    }
  }, [filteredAdmissions, selectedCaseId]);

  const selectedAdmission = mockAdmissions.find((admission) => admission.id === selectedCaseId) ?? mockAdmissions[0]!;

  return (
    <div className="stack mock-admit-lab">
      <section className="panel mock-admit-intro">
        <div className="panel-title">
          <div>
            <div className="icon-title">
              <FlaskConical size={19} />
              <h2>Mock Inpatient Admit Lab</h2>
            </div>
            <p>
              Six fictitious admission scenarios for source-linked assessment, level-of-care discussion, and UR training.
              This read-only cohort is separate from the canonical case queue.
            </p>
          </div>
          <div className="training-badge-row">
            <StatusBadge tone="danger">Synthetic mock-use only</StatusBadge>
            <StatusBadge tone="warn">Review-gated training</StatusBadge>
          </div>
        </div>

        <div className="status-strip mock-admit-status-strip">
          <div><span className="label">Cohort</span><strong>6 mock admissions</strong></div>
          <div><span className="label">Age bands</span><strong>Geriatric 55+ / Adult 18-54</strong></div>
          <div><span className="label">Clinical status</span><strong>Draft support only</strong></div>
          <div><span className="label">Legal status</span><strong>Counsel validation required</strong></div>
        </div>

        <div className="mock-guardrail-list" aria-label="Mock cohort guardrails">
          {mockAdmissionGuardrails.map((guardrail) => <span key={guardrail}>{guardrail}</span>)}
        </div>
      </section>

      <section className="mock-admit-layout">
        <aside className="panel mock-roster" aria-label="Mock admission roster">
          <div className="panel-title">
            <div>
              <h3>Cohort roster</h3>
              <p>Choose a synthetic patient token to inspect the training workflow.</p>
            </div>
          </div>
          <div className="mock-filter-controls" role="group" aria-label="Cohort filter">
            {mockAdmissionFilters.map((option) => (
              <button
                key={option}
                type="button"
                className={filter === option ? "mock-filter active" : "mock-filter"}
                aria-pressed={filter === option}
                onClick={() => setFilter(option)}
              >
                {option}
              </button>
            ))}
          </div>
          <div className="mock-roster-list">
            {filteredAdmissions.map((admission) => (
              <button
                key={admission.id}
                type="button"
                className={selectedAdmission.id === admission.id ? "mock-roster-item active" : "mock-roster-item"}
                aria-pressed={selectedAdmission.id === admission.id}
                onClick={() => setSelectedCaseId(admission.id)}
              >
                <span className="mock-roster-name">{admission.patientToken}</span>
                <span className="mock-roster-meta">{admission.age} | {admission.cohort}</span>
                <span className="mock-roster-meta">{admission.payor}</span>
                <StatusBadge tone={priorityTone(admission.initialPriority)}>{admission.initialPriority}</StatusBadge>
              </button>
            ))}
          </div>
        </aside>

        <div className="stack">
          <section className="panel mock-case-header">
            <div className="panel-title">
              <div>
                <span className="label">Synthetic patient token | {selectedAdmission.id}</span>
                <h2>{selectedAdmission.patientToken}</h2>
                <p>{selectedAdmission.age}, {selectedAdmission.cohort} | {selectedAdmission.payor}</p>
              </div>
              <div className="training-badge-row">
                <StatusBadge tone={priorityTone(selectedAdmission.initialPriority)}>{selectedAdmission.initialPriority}</StatusBadge>
                <StatusBadge tone={gateTone(selectedAdmission.reviewGate)}>{selectedAdmission.reviewGate}</StatusBadge>
              </div>
            </div>
            <dl className="mock-case-facts">
              <div><dt>Referral</dt><dd>{selectedAdmission.referral}</dd></div>
              <div><dt>Staff owner</dt><dd>{selectedAdmission.staffOwner}</dd></div>
              <div><dt>Admission posture</dt><dd>{selectedAdmission.admissionPosture}</dd></div>
            </dl>
          </section>

          <div className="mock-tab-list" role="tablist" aria-label="Mock admission detail views">
            <button type="button" role="tab" aria-selected={view === "intake"} className={view === "intake" ? "mock-tab active" : "mock-tab"} onClick={() => setView("intake")}>
              Intake and risk
            </button>
            <button type="button" role="tab" aria-selected={view === "decision"} className={view === "decision" ? "mock-tab active" : "mock-tab"} onClick={() => setView("decision")}>
              Decision path
            </button>
            <button type="button" role="tab" aria-selected={view === "draft"} className={view === "draft" ? "mock-tab active" : "mock-tab"} onClick={() => setView("draft")}>
              UR / chart draft
            </button>
          </div>

          {view === "intake" ? <IntakeAndRiskView /> : null}
          {view === "decision" ? <DecisionPathView /> : null}
          {view === "draft" ? <DraftReviewView /> : null}
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <div>
            <h3>Cohort-level decision review</h3>
            <p>Compare training dispositions and their review gates without making a final clinical or payer determination.</p>
          </div>
          <StatusBadge tone="warn">Draft comparisons</StatusBadge>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Case</th>
                <th>Initial priority</th>
                <th>Recommended level</th>
                <th>Why lower level is insufficient in training scenario</th>
                <th>Review gate</th>
              </tr>
            </thead>
            <tbody>
              {mockAdmissions.map((admission) => (
                <tr key={admission.id} className={admission.id === selectedAdmission.id ? "selected-row" : undefined}>
                  <td><strong>{admission.patientToken}</strong><span className="subtext">{admission.id}</span></td>
                  <td><StatusBadge tone={priorityTone(admission.initialPriority)}>{admission.initialPriority}</StatusBadge></td>
                  <td>{admission.recommendedLevel}</td>
                  <td>{admission.lowerLevelInsufficient}</td>
                  <td><StatusBadge tone={gateTone(admission.reviewGate)}>{admission.reviewGate}</StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid-two">
        <article className="panel">
          <div className="icon-title"><UsersRound size={19} /><h3>Role-play assignment</h3></div>
          <div className="mock-role-list">
            {mockAdmissionRolePlay.map((assignment) => (
              <div key={assignment.function}>
                <strong>{assignment.function}</strong>
                <span>{assignment.cast}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="panel">
          <div className="icon-title"><ShieldAlert size={19} /><h3>Training boundary</h3></div>
          <p>
            These fictional character labels are role-play tokens, not real people, chart records, or payer submissions.
            A qualified clinician, counsel, and the applicable UR process must validate any real-world use.
          </p>
          <div className="training-badge-row">
            <StatusBadge tone="warn">Clinician review required</StatusBadge>
            <StatusBadge tone="danger">Counsel validation required</StatusBadge>
          </div>
        </article>
      </section>
    </div>
  );

  function IntakeAndRiskView() {
    return (
      <section className="panel mock-view-panel" role="tabpanel">
        <div className="panel-title">
          <div className="icon-title"><FileText size={19} /><h3>Intake snapshot and source-linked risk</h3></div>
          <StatusBadge tone="warn">Draft assessment</StatusBadge>
        </div>
        <div className="grid-two">
          <div>
            <h4>Provisional diagnoses</h4>
            <ul className="check-list">
              {selectedAdmission.provisionalDiagnoses.map((diagnosis) => <li key={diagnosis}>{diagnosis}</li>)}
            </ul>
            <h4>Precipitating events</h4>
            <p>{selectedAdmission.precipitatingEvents}</p>
          </div>
          <div>
            <h4>History and comorbidities</h4>
            <ul className="check-list">
              {selectedAdmission.historyAndComorbidities.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </div>
        <div className="table-wrap mock-risk-table">
          <table>
            <thead>
              <tr><th>Risk finding</th><th>Source reference</th><th>Severity</th><th>Review status</th></tr>
            </thead>
            <tbody>
              {selectedAdmission.risks.map((risk) => (
                <tr key={risk.label}>
                  <td>{risk.label}</td>
                  <td>{risk.source}</td>
                  <td><StatusBadge tone={risk.severity === "Imminent" || risk.severity === "High" ? "danger" : "warn"}>{risk.severity}</StatusBadge></td>
                  <td><StatusBadge tone={reviewTone(risk.reviewStatus)}>{risk.reviewStatus}</StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  function DecisionPathView() {
    return (
      <section className="panel mock-view-panel" role="tabpanel">
        <div className="panel-title">
          <div className="icon-title"><Scale size={19} /><h3>Decision path</h3></div>
          <StatusBadge tone={gateTone(selectedAdmission.reviewGate)}>{selectedAdmission.reviewGate}</StatusBadge>
        </div>
        <div className="mock-decision-list">
          {selectedAdmission.decisionPath.map((decision) => (
            <div className="mock-decision-step" key={decision.step}>
              <span className="label">{decision.step}</span>
              <p>{decision.decision}</p>
            </div>
          ))}
        </div>
        <div className="mock-process-map" aria-label="Standard Clarity process">
          <h4>Standard Clarity process coverage</h4>
          <ol>
            {mockAdmissionProcess.map((step, index) => (
              <li key={step.label}>
                <strong>{index + 1}. {step.label}</strong>
                <span>{step.description}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  function DraftReviewView() {
    return (
      <section className="panel mock-view-panel" role="tabpanel">
        <div className="panel-title">
          <div className="icon-title"><ClipboardCheck size={19} /><h3>Draft chart and UR summary</h3></div>
          <StatusBadge tone="warn">Human review required</StatusBadge>
        </div>
        <p className="mock-draft-copy">{selectedAdmission.draftChartAndUrSummary}</p>
        <div className="grid-two mock-draft-grid">
          <div>
            <h4>Training packet review checklist</h4>
            <ul className="mock-review-checklist">
              {mockAdmissionUrChecklist.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
          <div>
            <h4>Required validation before real use</h4>
            <ul className="check-list missing">
              <li>Clinician verifies diagnosis, risk, level of care, and treatment plan.</li>
              <li>Counsel validates any legal-status language and clock interpretation.</li>
              <li>UR staff applies the applicable payor process and organization policy.</li>
              <li>Do not copy this training draft into a real chart or authorization request.</li>
            </ul>
          </div>
        </div>
      </section>
    );
  }
}
