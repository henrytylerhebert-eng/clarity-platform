import { AlertTriangle, FileText, ShieldCheck } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import type { AppState, Case } from "../domain/types";

export function CaseOverview({ state, caseRecord }: { state: AppState; caseRecord: Case }) {
  const assessment = state.assessments.find((item) => item.caseId === caseRecord.id);
  const encounter = state.encounters.find((item) => item.caseId === caseRecord.id);
  const legal = state.legalInstruments.find((item) => item.caseId === caseRecord.id);
  const medical = state.medicalNecessitySnapshots.find((item) => item.caseId === caseRecord.id);
  const packet = state.referralPackets.find((item) => item.caseId === caseRecord.id);
  const referrals = state.facilityReferrals.filter((item) => item.caseId === caseRecord.id);
  const ledgerEvents = state.custodyLedgerEvents.filter((item) => item.caseId === caseRecord.id);
  const risks = state.riskFindings.filter((item) => item.caseId === caseRecord.id);

  return (
    <div className="stack">
      <section className="panel">
        <div className="panel-title">
          <h2>Case Overview</h2>
          <p>Single-case command surface for referral, assessment, packet, routing, and custody review.</p>
        </div>
      </section>
      <section className="status-strip">
        <div>
          <span className="label">Patient token</span>
          <strong>{caseRecord.patientToken.id}</strong>
        </div>
        <div>
          <span className="label">Encounter</span>
          <strong>{encounter?.referralSource ?? "Unknown"}</strong>
        </div>
        <div>
          <span className="label">Stage</span>
          <strong>{caseRecord.currentStage}</strong>
        </div>
        <div>
          <span className="label">Legal status</span>
          <strong>{caseRecord.legalStatus}</strong>
        </div>
        <div>
          <span className="label">Packet completeness</span>
          <strong>{caseRecord.packetCompleteness}%</strong>
        </div>
        <div>
          <span className="label">Insurance</span>
          <strong>{state.encounters.find((item) => item.caseId === caseRecord.id)?.insuranceStatus ?? "Unknown"}</strong>
        </div>
        <div>
          <span className="label">Routing response</span>
          <strong>{referrals.length ? referrals.map((item) => item.status).join(", ") : "Draft"}</strong>
        </div>
        <div>
          <span className="label">Custody verification</span>
          <strong>{ledgerEvents.length ? "Verify in ledger" : "No custody events"}</strong>
        </div>
      </section>

      <section className="grid-two">
        <article className="panel">
          <div className="icon-title"><FileText size={18} /><h3>Clinical record</h3></div>
          <p>{assessment?.presentingProblem ?? "No assessment draft yet."}</p>
          <StatusBadge tone="warn">{assessment?.reviewStatus ?? "Draft"}</StatusBadge>
        </article>
        <article className="panel">
          <div className="icon-title"><FileText size={18} /><h3>Medical necessity draft</h3></div>
          <p>{medical?.draftNarrative ?? "No draft exists. v0.1 does not make a level-of-care determination."}</p>
          <StatusBadge tone="warn">{medical?.reviewStatus ?? "Needs clinician review"}</StatusBadge>
        </article>
        <article className="panel">
          <div className="icon-title"><ShieldCheck size={18} /><h3>Legal and custody</h3></div>
          <p>{legal?.draftText ?? "No legal draft yet."}</p>
          <StatusBadge tone="warn">{legal?.reviewStatus ?? "Counsel validation required"}</StatusBadge>
        </article>
      </section>

      <section className="panel">
        <div className="icon-title"><AlertTriangle size={18} /><h3>Risk findings</h3></div>
        <div className="risk-list">
          {risks.map((risk) => (
            <div className="risk-row" key={risk.id}>
              <strong>{risk.type}</strong>
              <span>{risk.summary}</span>
              <StatusBadge tone={risk.severity === "High" || risk.severity === "Imminent" ? "danger" : "warn"}>{risk.severity}</StatusBadge>
            </div>
          ))}
        </div>
      </section>

      <section className="panel subtle-panel">
        <h3>Reporting metrics compatibility</h3>
        <p>Future company-agnostic UR metrics can consume event exports from this spine. No reporting dashboard is included in v0.1.</p>
        <p className="mono">{packet ? `Packet hash available: ${packet.packetHash.slice(0, 18)}...` : "No measurements found"}</p>
      </section>
    </div>
  );
}
