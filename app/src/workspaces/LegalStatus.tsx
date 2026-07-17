import { useState } from "react";
import { Gavel, ShieldAlert } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { isPecExamWithinWindow } from "../domain/epec";
import type { CecInput as CecFormInput, OpcInput as OpcFormInput, PecInput as PecFormInput } from "../domain/epec";
import type { ClockReading } from "../domain/clocks";
import type { EpecRuleSet } from "../domain/epecRuleSets";
import type { WorkspaceId } from "../domain/roles";
import type { FacilityReferral, FacilityResponse, LegalInstrument } from "../domain/types";

interface Props {
  caseId: string;
  ruleSet: EpecRuleSet;
  legalInstrument?: LegalInstrument;
  referrals: FacilityReferral[];
  facilityResponses: FacilityResponse[];
  clocks: ClockReading[];
  onIssueOpc: (input: OpcFormInput) => void;
  onExecutePec: (input: PecFormInput) => void;
  onExecuteCec: (input: CecFormInput) => void;
  onNavigateWorkspace: (workspace: WorkspaceId) => void;
}

function clockTone(status: ClockReading["status"]): "info" | "warn" | "danger" | "good" {
  if (status === "Breached") return "danger";
  if (status === "Due soon") return "warn";
  if (status === "Stopped") return "good";
  return "info";
}

function formatRemaining(reading: ClockReading): string {
  if (reading.status === "Stopped") return "stopped";
  if (reading.remainingMinutes <= 0) return `${Math.abs(reading.remainingMinutes)}m over`;
  return `${Math.floor(reading.remainingMinutes / 60)}h ${reading.remainingMinutes % 60}m left`;
}

function ClockChip({ reading }: { reading?: ClockReading }) {
  if (!reading) return null;
  return (
    <span className="clock-chip">
      <StatusBadge tone={clockTone(reading.status)}>{reading.status}</StatusBadge>
      <span>{reading.clock.label} · {formatRemaining(reading)}</span>
      {reading.clock.counselValidationRequired ? <em>counsel validation required</em> : null}
    </span>
  );
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function OptionGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: Array<{ value: string; description: string }>;
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <label className="full-label">
      {label}
      <div className="option-group">
        {options.map((option) => (
          <label className="checkbox-label option-row" key={option.value}>
            <input type="checkbox" checked={selected.includes(option.value)} onChange={() => onToggle(option.value)} />
            <span>
              <b>{option.value}</b>
              {option.description ? <small>{option.description}</small> : null}
            </span>
          </label>
        ))}
      </div>
    </label>
  );
}

export function LegalStatus({
  caseId,
  ruleSet,
  legalInstrument,
  referrals,
  facilityResponses,
  clocks,
  onIssueOpc,
  onExecutePec,
  onExecuteCec,
  onNavigateWorkspace,
}: Props) {
  const opc = legalInstrument?.opc;
  const pec = legalInstrument?.pec;
  const cec = legalInstrument?.cec;

  const [opcForm, setOpcForm] = useState<OpcFormInput>({ requestor: "", relation: "", observed: "", grounds: [] });
  const [pecForm, setPecForm] = useState<PecFormInput>({
    examinerName: "",
    examinerType: ruleSet.examinerTypes[0],
    examinedAt: "",
    findings: [],
    conditions: [],
    telemedicine: false,
    narrative: "",
  });
  const [cecForm, setCecForm] = useState<CecFormInput>({ examinerName: "", findings: [], conditions: [], outcome: "Continued" });

  const opcClock = clocks.find((reading) => reading.clock.id === `opc-${caseId}`);
  const cecClock = clocks.find((reading) => reading.clock.id === `cec-${caseId}`);

  const acceptedResponse = facilityResponses.find(
    (response) => response.response === "Accept" && referrals.some((referral) => referral.id === response.referralId),
  );
  const acceptedReferral = acceptedResponse ? referrals.find((referral) => referral.id === acceptedResponse.referralId) : undefined;
  const anySent = referrals.length > 0;

  const examWithinWindow = pecForm.examinedAt
    ? isPecExamWithinWindow(new Date(pecForm.examinedAt).toISOString(), new Date().toISOString(), ruleSet.windowsMinutes.pec)
    : null;
  const pecReady = Boolean(
    pecForm.examinerName.trim().length > 0
    && pecForm.examinedAt
    && examWithinWindow
    && pecForm.findings.length > 0
    && pecForm.conditions.length > 0
    && pecForm.narrative.trim().length > 20,
  );

  return (
    <section className="panel">
      <div className="panel-title">
        <div className="icon-title"><Gavel size={18} /><h2>Legal Status</h2></div>
        <p>{ruleSet.jurisdictionLabel} e-PEC lifecycle draft. Not legal advice; validate with counsel and LDH before any production use.</p>
      </div>
      <div className="legal-warning">
        <ShieldAlert size={18} />
        <span>Statutory triggers, durations, form requirements, and attestation language shown here are configuration, not statutory truth, and require counsel validation before enforcement.</span>
      </div>

      {/* Stage I — OPC */}
      {!opc ? (
        <article className="subtle-panel epec-stage">
          <h3>Order for Protective Custody (OPC) — {ruleSet.statuteRefs.opc}</h3>
          <p>Coroner or district judge may order protective custody on a credible person's sworn statement from personal observation.</p>
          <div className="form-grid">
            <label>Requesting party (credible person)
              <input value={opcForm.requestor} onChange={(event) => setOpcForm({ ...opcForm, requestor: event.target.value })} placeholder="Name, agency" />
            </label>
            <label>Relationship to subject
              <input value={opcForm.relation} onChange={(event) => setOpcForm({ ...opcForm, relation: event.target.value })} placeholder="Officer, family member, clinician..." />
            </label>
            <label className="span-2">Personal observation — sworn statement
              <textarea value={opcForm.observed} onChange={(event) => setOpcForm({ ...opcForm, observed: event.target.value })} placeholder="Facts observed firsthand establishing danger to self, danger to others, or grave disability." />
            </label>
            <OptionGroup
              label="Statutory grounds (check all that apply)"
              options={ruleSet.groundsOptions}
              selected={opcForm.grounds}
              onToggle={(value) => setOpcForm({ ...opcForm, grounds: toggle(opcForm.grounds, value) })}
            />
          </div>
          <button
            className="primary-button"
            type="button"
            disabled={!(opcForm.requestor && opcForm.grounds.length && opcForm.observed.trim().length > 20)}
            onClick={() => onIssueOpc(opcForm)}
          >
            Issue OPC &amp; open custody ledger
          </button>
        </article>
      ) : (
        <article className="subtle-panel epec-stage">
          <div className="stage-summary-head">
            <h3>OPC issued</h3>
            <StatusBadge tone="good">Issued</StatusBadge>
          </div>
          <div className="kv-grid">
            <span className="label">Requestor</span><span>{opc.requestor} ({opc.relation})</span>
            <span className="label">Grounds</span><span>{opc.grounds.join("; ") || "Unknown"}</span>
            <span className="label">Issued</span><span>{new Date(opc.issuedAt).toLocaleString()}</span>
          </div>
          <ClockChip reading={opcClock} />
        </article>
      )}

      {/* Stage II — PEC */}
      {!pec ? (
        <article className="subtle-panel epec-stage">
          <h3>Physician's Emergency Certificate (PEC) — Form OBH-1, {ruleSet.statuteRefs.pec}</h3>
          {!opc ? <p className="inline-warning">No active OPC on this case. A PEC can also originate directly from an examination without an OPC.</p> : null}
          <div className="form-grid">
            <label>Examining certifier
              <input value={pecForm.examinerName} onChange={(event) => setPecForm({ ...pecForm, examinerName: event.target.value })} placeholder="Name, credentials" />
            </label>
            <label>Certifier type
              <select value={pecForm.examinerType} onChange={(event) => setPecForm({ ...pecForm, examinerType: event.target.value })}>
                {ruleSet.examinerTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
            <label>Actual examination date &amp; time
              <input type="datetime-local" value={pecForm.examinedAt} onChange={(event) => setPecForm({ ...pecForm, examinedAt: event.target.value })} />
              {pecForm.examinedAt ? (
                examWithinWindow
                  ? <small className="subtext-good">Within the statutory window</small>
                  : <small className="subtext-warn">Outside the statutory window — certificate would be invalid</small>
              ) : null}
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={pecForm.telemedicine} onChange={(event) => setPecForm({ ...pecForm, telemedicine: event.target.checked })} />
              Examination conducted by telemedicine
            </label>
            <OptionGroup
              label="Findings"
              options={ruleSet.groundsOptions}
              selected={pecForm.findings}
              onToggle={(value) => setPecForm({ ...pecForm, findings: toggle(pecForm.findings, value) })}
            />
            <OptionGroup
              label="And the person is"
              options={ruleSet.conditionOptions}
              selected={pecForm.conditions}
              onToggle={(value) => setPecForm({ ...pecForm, conditions: toggle(pecForm.conditions, value) })}
            />
            <label className="span-2">Clinical observations &amp; narrative
              <textarea value={pecForm.narrative} onChange={(event) => setPecForm({ ...pecForm, narrative: event.target.value })} placeholder="Time-stamped observations, risk assessment, mental status exam, why immediate psychiatric treatment is required." />
            </label>
          </div>
          <button className="primary-button" type="button" disabled={!pecReady} onClick={() => onExecutePec(pecForm)}>
            Sign, attest &amp; seal certificate
          </button>
        </article>
      ) : (
        <article className="subtle-panel epec-stage">
          <div className="stage-summary-head">
            <h3>PEC executed &amp; sealed</h3>
            <StatusBadge tone="good">Sealed</StatusBadge>
          </div>
          <div className="kv-grid">
            <span className="label">Certifier</span><span>{pec.examinerName} — {pec.examinerType}</span>
            <span className="label">Examined</span><span>{new Date(pec.examinedAt).toLocaleString()}{pec.telemedicine ? " (telemedicine)" : ""}</span>
            <span className="label">Findings</span><span>{pec.findings.join("; ")} · {pec.conditions.join("; ")}</span>
          </div>
          {pec.sealHash ? <div className="fingerprint-chip">Fingerprint <code>{pec.sealHash.slice(0, 24)}...</code></div> : null}

          {/* Stage III — bridge to the existing transmission/acceptance pipeline */}
          <div className="epec-bridge">
            {!acceptedResponse ? (
              <>
                <p>{anySent ? "Awaiting facility acceptance." : "No referral packet sent yet."}</p>
                <button className="secondary-button" type="button" onClick={() => onNavigateWorkspace(anySent ? "routing" : "packet")}>
                  {anySent ? "Review facility responses" : "Generate & send referral packet"}
                </button>
              </>
            ) : (
              <p>Accepted by <b>{acceptedReferral?.facilityName}</b> at {acceptedResponse.respondedAt ? new Date(acceptedResponse.respondedAt).toLocaleString() : "unknown time"}. CEC review window is now running.</p>
            )}
          </div>
        </article>
      )}

      {/* Stage IV — CEC */}
      {pec && acceptedResponse && !cec ? (
        <article className="subtle-panel epec-stage">
          <h3>Coroner's Emergency Certificate (CEC) — Form OBH-2, {ruleSet.statuteRefs.cec}</h3>
          <p>Upon admission by emergency certificate, within the statutory window the coroner or deputy independently examines the patient; execution of this certificate is a precondition to continued confinement.</p>
          <ClockChip reading={cecClock} />
          <div className="form-grid">
            <label>Coroner / deputy coroner examiner
              <input value={cecForm.examinerName} onChange={(event) => setCecForm({ ...cecForm, examinerName: event.target.value })} />
            </label>
            <OptionGroup
              label="Independent findings"
              options={ruleSet.groundsOptions}
              selected={cecForm.findings}
              onToggle={(value) => setCecForm({ ...cecForm, findings: toggle(cecForm.findings, value) })}
            />
            <OptionGroup
              label="And the person is"
              options={ruleSet.conditionOptions}
              selected={cecForm.conditions}
              onToggle={(value) => setCecForm({ ...cecForm, conditions: toggle(cecForm.conditions, value) })}
            />
            <label className="full-label">Determination
              <div className="option-group">
                <label className="checkbox-label option-row">
                  <input type="radio" name={`cec-outcome-${caseId}`} checked={cecForm.outcome === "Continued"} onChange={() => setCecForm({ ...cecForm, outcome: "Continued" })} />
                  <span><b>Criteria met — continued confinement authorized</b></span>
                </label>
                <label className="checkbox-label option-row">
                  <input type="radio" name={`cec-outcome-${caseId}`} checked={cecForm.outcome === "Discharged"} onChange={() => setCecForm({ ...cecForm, outcome: "Discharged" })} />
                  <span><b>Not a proper subject — discharge forthwith</b></span>
                </label>
              </div>
            </label>
            {cecForm.outcome === "Discharged" ? (
              <label className="span-2">Discharge reason
                <input value={cecForm.dischargeReason ?? ""} onChange={(event) => setCecForm({ ...cecForm, dischargeReason: event.target.value })} />
              </label>
            ) : null}
          </div>
          <button
            className="primary-button"
            type="button"
            disabled={!cecForm.examinerName || (cecForm.outcome === "Continued" && (!cecForm.findings.length || !cecForm.conditions.length))}
            onClick={() => onExecuteCec(cecForm)}
          >
            Execute certificate &amp; freeze record
          </button>
        </article>
      ) : null}

      {cec ? (
        <article className="subtle-panel epec-stage">
          <div className="stage-summary-head">
            <h3>Case record frozen</h3>
            <StatusBadge tone={cec.outcome === "Continued" ? "good" : "warn"}>{cec.outcome === "Continued" ? "Confinement continued" : "Discharged by coroner"}</StatusBadge>
          </div>
          <div className="kv-grid">
            <span className="label">Examiner</span><span>{cec.examinerName}</span>
            <span className="label">Executed</span><span>{new Date(cec.executedAt).toLocaleString()}</span>
            {cec.dischargeReason ? <><span className="label">Reason</span><span>{cec.dischargeReason}</span></> : null}
          </div>
          <button className="secondary-button" type="button" onClick={() => onNavigateWorkspace("ledger")}>View full custody ledger &amp; verify chain</button>
        </article>
      ) : null}
    </section>
  );
}
