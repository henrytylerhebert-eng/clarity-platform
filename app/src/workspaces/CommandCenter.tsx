import { useEffect, useState } from "react";
import { LayoutDashboard } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { caseIsEscalated, readCaseClocks, type ClockReading } from "../domain/clocks";
import { sortCases } from "../domain/selectors";
import type { AppState } from "../domain/types";

const featureCards = [
  {
    feature: "Case Queue",
    does: "Shows every active synthetic case with stage, packet progress, routing state, and review status.",
    solves: "Stops cases from living in separate calls, texts, spreadsheets, and hallway updates.",
    forWhom: "Central intake coordinators, clinicians, compliance reviewers, and program directors.",
    workflow: "Referral received -> triage queue -> select case -> open overview.",
  },
  {
    feature: "Guided Intake",
    does: "Captures the story once as structured assessment fields with source-linked risk findings.",
    solves: "Reduces retyping, missing collateral, and untraceable risk claims.",
    forWhom: "Field responders, intake coordinators, and clinician reviewers.",
    workflow: "New case -> presenting concern -> risk facts -> source references -> pitfall guards.",
  },
  {
    feature: "Medical Necessity Draft",
    does: "Displays review-gated documentation support, missing facts, and prohibited-language warnings.",
    solves: "Prevents draft language from becoming an unsupported final determination.",
    forWhom: "Clinician reviewers and UR / benefits specialists.",
    workflow: "Assessment facts -> documented risk/impairment -> missing data -> clinician review.",
  },
  {
    feature: "Legal Status Draft",
    does: "Tracks voluntary/involuntary status, clock placeholders, source facts, and counsel-validation warnings.",
    solves: "Makes legal uncertainty visible without generating production legal forms.",
    forWhom: "Clinicians, compliance/legal officers, and intake leadership.",
    workflow: "Observed facts -> legal status draft -> required facts -> counsel validation.",
  },
  {
    feature: "Packet Preview",
    does: "Builds a read-only referral packet from the same assessment, risk, legal, and custody records.",
    solves: "Stops teams from rebuilding the same story for every receiving facility.",
    forWhom: "Intake coordinators, receiving facilities, and clinician reviewers.",
    workflow: "Reviewed facts -> packet checklist -> hash seal -> simulated send.",
  },
  {
    feature: "Routing Response",
    does: "Simulates accepting, declining, waitlisting, or requesting more information from facilities.",
    solves: "Creates structured response data and decline reasons for later network learning.",
    forWhom: "Receiving facilities, intake coordinators, UR leaders, and executives.",
    workflow: "Packet sent -> facility response -> reason code -> case status update.",
  },
  {
    feature: "Custody Ledger",
    does: "Verifies material events using canonical JSON, SHA-256 event hashes, and previous-hash chaining.",
    solves: "Gives reviewers a tamper-evident chain for packet, legal, routing, and placement events.",
    forWhom: "Compliance/legal officers, clinicians, and pilot evaluators.",
    workflow: "Event recorded -> hash chained -> verify chain -> demonstrate tamper failure.",
  },
  {
    feature: "Milieu Bedboard",
    does: "Shows demo bed compatibility, acuity risks, and charge-nurse override reasons.",
    solves: "Separates bed availability from safe placement decisions.",
    forWhom: "Charge nurses, receiving facilities, and clinical leadership.",
    workflow: "Accepted/referral candidate -> compatibility view -> accept/override with reason.",
  },
  {
    feature: "Reporting Metrics Rebuilder Stub",
    does: "Exports company-agnostic event shapes for future utilization-review excellence metrics.",
    solves: "Keeps metrics reusable without turning v0.2 into a reporting dashboard.",
    forWhom: "UR leaders, operators, executives, and future analytics builders.",
    workflow: "Case event -> metrics-safe payload -> later reporting substrate.",
  },
];

const roadmapRows = [
  {
    stage: "MVP 0.1",
    promise: "Prove the intake spine.",
    feedback: "Can a reviewer follow one crisis referral from intake to packet to response without retyping the story?",
    status: "Built in prototype",
  },
  {
    stage: "MVP 0.2",
    promise: "Add command center, role focus, routing, and milieu-aware placement demo.",
    feedback: "Which role view feels most credible, confusing, or missing for a pilot conversation?",
    status: "Built in prototype",
  },
  {
    stage: "POC Pilot",
    promise: "Validate workflow fit with 2-3 intake/UR/clinical stakeholders using synthetic cases.",
    feedback: "What would your team rename, remove, or demand before using this in a shadow workflow?",
    status: "Next",
  },
  {
    stage: "MVP 0.3",
    promise: "Build measured command metrics and company-agnostic UR reporting substrate.",
    feedback: "Which metrics matter only if measured locally, and which are useful as standard UR definitions?",
    status: "Planned",
  },
  {
    stage: "Production Readiness",
    promise: "Add backend, auth/RBAC/RLS, PHI controls, integrations, clinical/legal validation, and audit hardening.",
    feedback: "Which governance gates are required before live data or operational use?",
    status: "Parking lot until POC evidence",
  },
];

function clockTone(status: ClockReading["status"]): "info" | "warn" | "danger" | "good" {
  if (status === "Breached") return "danger";
  if (status === "Due soon") return "warn";
  if (status === "Stopped") return "good";
  return "info";
}

function formatRemaining(reading: ClockReading): string {
  if (reading.status === "Stopped") return "stopped";
  if (reading.remainingMinutes <= 0) return `${Math.abs(reading.remainingMinutes)}m over`;
  return `${reading.remainingMinutes}m left`;
}

export function CommandCenter({ state, onSelect }: { state: AppState; onSelect: (caseId: string) => void }) {
  const [nowIso, setNowIso] = useState(() => new Date().toISOString());

  useEffect(() => {
    const timer = setInterval(() => setNowIso(new Date().toISOString()), 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="stack">
      <section className="panel">
        <div className="panel-title">
          <div className="icon-title"><LayoutDashboard size={18} /><h2>Central Intake Command Center</h2></div>
          <p>Clock targets are configurable demo values, not statutory truth. Legal timing requires counsel validation. Financial lane never blocks the clinical lane.</p>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Case</th>
                <th>Stage</th>
                <th>Clinical lane</th>
                <th>Financial lane</th>
                <th>Packet</th>
                <th>Clocks</th>
                <th>Escalation</th>
              </tr>
            </thead>
            <tbody>
              {sortCases(state.cases).map((caseRecord) => {
                const encounter = state.encounters.find((item) => item.caseId === caseRecord.id);
                const assessment = state.assessments.find((item) => item.caseId === caseRecord.id);
                const readings = readCaseClocks(state, caseRecord.id, nowIso);
                const escalated = caseIsEscalated(state, caseRecord.id, nowIso);
                return (
                  <tr className={escalated ? "escalated-row" : ""} key={caseRecord.id} onClick={() => onSelect(caseRecord.id)}>
                    <td>
                      <button className="link-button" type="button">{caseRecord.patientToken.displayName}</button>
                      <span className="subtext">{caseRecord.id}</span>
                    </td>
                    <td><StatusBadge tone="info">{caseRecord.currentStage}</StatusBadge></td>
                    <td>{assessment ? assessment.reviewStatus : "No assessment"}</td>
                    <td>{encounter?.insuranceStatus ?? "Unknown"}</td>
                    <td>
                      <span className={caseRecord.packetCompleteness >= 95 ? "" : "subtext-warn"}>
                        {caseRecord.packetCompleteness}%{caseRecord.packetCompleteness < 95 ? " (below 95% target)" : ""}
                      </span>
                    </td>
                    <td>
                      <div className="clock-stack">
                        {readings.length ? readings.map((reading) => (
                          <span className="clock-chip" key={reading.clock.id}>
                            <StatusBadge tone={clockTone(reading.status)}>{reading.status}</StatusBadge>
                            <span>{reading.clock.label} · {formatRemaining(reading)}</span>
                            {reading.clock.counselValidationRequired ? <em>counsel validation required</em> : null}
                          </span>
                        )) : <span className="subtext">No clocks</span>}
                      </div>
                    </td>
                    <td>{escalated ? <StatusBadge tone="danger">Escalated</StatusBadge> : <span className="subtext">None</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <footer className="panel-footer">Escalation fires when any clock breaches its configured target. Baseline transfer timing: No measurements found.</footer>
      </section>

      <section className="panel">
        <div className="panel-title">
          <h3>POC Feature Map</h3>
          <p>Use this section to ask stakeholders what the product should be called, what problem it solves, and which workflow step feels real enough for pilot feedback.</p>
        </div>
        <div className="feature-map-grid">
          {featureCards.map((item) => (
            <article className="feature-card" key={item.feature}>
              <h4>{item.feature}</h4>
              <p><strong>What it does:</strong> {item.does}</p>
              <p><strong>Problem solved:</strong> {item.solves}</p>
              <p><strong>For whom:</strong> {item.forWhom}</p>
              <p><strong>Correlated workflow:</strong> {item.workflow}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <h3>Product Roadmap Feedback Board</h3>
          <p>Roadmap language is deliberately stakeholder-readable. Ask reviewers to mark each stage as must-have, confusing, missing, or later.</p>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Stage</th>
                <th>Product promise</th>
                <th>Stakeholder feedback question</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {roadmapRows.map((item) => (
                <tr key={item.stage}>
                  <td><strong>{item.stage}</strong></td>
                  <td>{item.promise}</td>
                  <td>{item.feedback}</td>
                  <td>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="panel-footer">Production claims, baseline outcomes, legal validity, and clinical efficacy remain Unknown until measured and reviewed.</footer>
      </section>
    </div>
  );
}
