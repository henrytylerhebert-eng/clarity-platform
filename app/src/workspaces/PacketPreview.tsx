import { FileCheck2 } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { computePacketChecklist } from "../domain/packets";
import type { AppState, ReferralPacket } from "../domain/types";

interface Props {
  state: AppState;
  caseId: string;
  packet?: ReferralPacket;
  onGenerate: (caseId: string) => void;
  onSend: (packet: ReferralPacket) => void;
}

export function PacketPreview({ state, caseId, packet, onGenerate, onSend }: Props) {
  const assessment = state.assessments.find((item) => item.caseId === caseId);
  const risks = state.riskFindings.filter((item) => item.caseId === caseId);
  const sources = state.sourceReferences.filter((item) => item.caseId === caseId);
  const encounter = state.encounters.find((item) => item.caseId === caseId);
  const medicalNecessity = state.medicalNecessitySnapshots.find((item) => item.caseId === caseId);
  const legal = state.legalInstruments.find((item) => item.caseId === caseId);
  const checklist = computePacketChecklist(state, caseId);

  if (!packet) {
    return (
      <section className="panel">
        <div className="panel-title">
          <div className="icon-title"><FileCheck2 size={18} /><h2>Packet Preview</h2></div>
          <p>No packet yet. The completeness checklist below shows what the packet will include when generated.</p>
        </div>
        <div className="guard-panel">
          <h3>Packet completeness checklist</h3>
          {checklist.map((item) => (
            <div className="guard-row" key={item.label}>
              <StatusBadge tone={item.present ? "good" : "warn"}>{item.present ? "Ready" : "Missing"}</StatusBadge>
              <strong>{item.label}</strong>
              <span>{item.detail}</span>
            </div>
          ))}
        </div>
        <button className="primary-button" type="button" onClick={() => onGenerate(caseId)}>
          Generate packet
        </button>
        <footer className="panel-footer">Generating seals a hash of the current case artifacts into the custody ledger. Missing items lower completeness but do not block generation.</footer>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel-title">
        <div className="icon-title"><FileCheck2 size={18} /><h2>Packet Preview</h2></div>
        <p>Draft packet — not final until human review. The workbook/export layer is not the system of record.</p>
      </div>
      <div className="status-strip">
        <div><span className="label">Status</span><strong>{packet.status}</strong></div>
        <div><span className="label">Completeness</span><strong>{packet.completeness}%</strong></div>
        <div><span className="label">Custody hash</span><strong className="hash-text">{packet.packetHash.slice(0, 16)}...</strong></div>
        {packet.status !== "Sent" ? (
          <button className="primary-button" type="button" onClick={() => onSend(packet)}>
            Send packet to facilities
          </button>
        ) : null}
      </div>
      <div className="packet-grid">
        <article>
          <h3>Referral summary</h3>
          <p>{encounter?.referralSource ?? "Unknown"}</p>
          <p>{encounter?.insuranceStatus ?? "Unknown"} insurance status does not block clinical workflow.</p>
        </article>
        <article>
          <h3>Presenting concern</h3>
          <p>{assessment?.presentingProblem}</p>
        </article>
        <article>
          <h3>Assessment summary</h3>
          <p>{assessment?.presentingProblem}</p>
          <p>{assessment?.formulation || "Risk formulation missing or Unknown."}</p>
        </article>
        <article>
          <h3>Risk findings</h3>
          {risks.map((risk) => <p key={risk.id}>{risk.type}: {risk.summary}</p>)}
        </article>
        <article>
          <h3>Medical necessity draft</h3>
          <p>{medicalNecessity?.draftNarrative}</p>
          <StatusBadge tone="warn">{medicalNecessity?.reviewStatus ?? "Draft"}</StatusBadge>
        </article>
        <article>
          <h3>Legal status draft</h3>
          <p>{legal?.draftText}</p>
          <StatusBadge tone="warn">{legal?.reviewStatus ?? "Counsel validation required"}</StatusBadge>
        </article>
        <article>
          <h3>Source references</h3>
          {sources.map((source) => <p key={source.id}>{source.type}: {source.label}</p>)}
        </article>
        <article>
          <h3>Review warnings</h3>
          <p>Clinical output is Draft. Medical necessity requires clinician review. Legal language requires counsel validation.</p>
        </article>
      </div>
    </section>
  );
}
