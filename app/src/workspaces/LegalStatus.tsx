import { useState } from "react";
import { Gavel, ShieldAlert, ScaleIcon } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { isPecExamWithinWindow, validateCecIndependence, validatePecInput } from "../domain/epec";
import type { CecInput as CecFormInput, OpcInput as OpcFormInput, PecInput as PecFormInput } from "../domain/epec";
import type { ClockReading } from "../domain/clocks";
import { DEADLINE_CONFLICTS, conditionOptionsForForm, getExaminerType, type EpecRuleSet } from "../domain/epecRuleSets";
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
    examinerType: ruleSet.examinerTypes[0].value,
    examinedAt: "",
    findings: [],
    conditions: [],
    telemedicine: false,
    narrative: "",
    certificateSequence: "1st",
    collaboratingPhysicianName: "",
    examinerLicenseNumber: "",
  });
  const [cecForm, setCecForm] = useState<CecFormInput>({ examinerName: "", findings: [], conditions: [], outcome: "Continued", examinerLicenseNumber: "" });

  // Review-and-confirm gate (WCAG 3.3.4): executing a certificate is a legal commitment that
  // locks the record, so it must never happen on a single click. The signer reviews a read-only
  // summary and acknowledges identity before the seal button is enabled.
  const [pecReview, setPecReview] = useState(false);
  const [pecAttested, setPecAttested] = useState(false);
  const [cecReview, setCecReview] = useState(false);
  const [cecAttested, setCecAttested] = useState(false);

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

  // Which printed form this signer executes, and which condition options that form carries.
  const selectedExaminerType = getExaminerType(ruleSet, pecForm.examinerType);
  const pecFormId = selectedExaminerType?.form ?? "OBH-1";
  const pecConditionOptions = conditionOptionsForForm(ruleSet, pecFormId);
  const pecIssues = validatePecInput(pecForm, ruleSet);
  const cecIssues = validateCecIndependence(pec, cecForm);

  const pecReady = Boolean(
    pecForm.examinerName.trim().length > 0
    && pecForm.examinedAt
    && examWithinWindow
    && pecForm.narrative.trim().length > 20
    && pecIssues.length === 0,
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

      <details className="conflict-panel">
        <summary>
          <ScaleIcon size={15} />
          <span>{DEADLINE_CONFLICTS.length} known form-vs-statute conflicts on these instruments</span>
        </summary>
        <p className="conflict-intro">
          The printed form and the current statute disagree below. Both figures are shown throughout this
          workspace rather than resolved in software — choosing one automatically would either over-detain
          or release prematurely. Pending written LDH clarification.
        </p>
        <ul className="conflict-list">
          {DEADLINE_CONFLICTS.map((conflict) => (
            <li key={conflict.id}>
              <b>{conflict.label}</b>
              <div className="conflict-sides">
                <span><em>Form says</em> {conflict.formSays}</span>
                <span><em>Statute says</em> {conflict.statuteSays}</span>
              </div>
              <small>{conflict.guidance}</small>
            </li>
          ))}
        </ul>
      </details>

      {/* Stage I — OPC */}
      {!opc ? (
        <article className="subtle-panel epec-stage">
          <h3>Order for Protective Custody (OPC) — Form OBH-20, {ruleSet.statuteRefs.opc}</h3>
          <p>Coroner or district judge may order protective custody on a credible person's sworn statement from personal observation.</p>
          <p className="form-lineage">
            The sworn statement below is the substance of <b>Form OBH-19</b> (Request for Protective Custody,
            completed by a peace officer or other credible person); issuing it produces <b>Form OBH-20</b>,
            the order that authorizes transport.
          </p>
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
          <div className="deadline-split">
            <b>On arrival at the facility or coroner's office, two examination deadlines apply:</b>
            <div className="deadline-split-rows">
              <span>
                <StatusBadge tone="warn">{Math.round(ruleSet.custodyWindowsMinutes.examOnArrivalFormPrinted / 60)}h</StatusBadge>
                as printed on this order (OBH-20) — escalate by this point
              </span>
              <span>
                <StatusBadge tone="info">{Math.round(ruleSet.custodyWindowsMinutes.examOnArrivalStatutory / 60)}h</StatusBadge>
                statutory ceiling ({ruleSet.statuteRefs.opc}(D))
              </span>
            </div>
            <small>
              Delivery to the facility or coroner's office must occur within{" "}
              {Math.round(ruleSet.custodyWindowsMinutes.transportDelivery / 60)} hours of being taken into
              custody — a statutory deadline that is not printed on the order itself. Arrival time is not yet
              captured in this prototype, so these are shown as reference figures rather than live countdowns.
            </small>
          </div>
        </article>
      )}

      {/* Stage II — PEC */}
      {!pec ? (
        <article className="subtle-panel epec-stage">
          <h3>
            {pecFormId === "OBH-1A" ? "Psychologist's" : "Physician's"} Emergency Certificate — Form {pecFormId},{" "}
            {pecFormId === "OBH-1A" ? ruleSet.statuteRefs.pecPsychologist : ruleSet.statuteRefs.pec}
          </h3>
          {!opc ? <p className="inline-warning">No active OPC on this case. A PEC can also originate directly from an examination without an OPC.</p> : null}
          {!pecReview ? (
          <>
          <div className="form-grid">
            <label>Examining certifier
              <input value={pecForm.examinerName} onChange={(event) => setPecForm({ ...pecForm, examinerName: event.target.value })} placeholder="Name, credentials" />
            </label>
            <label>Certifier type
              <select value={pecForm.examinerType} onChange={(event) => setPecForm({ ...pecForm, examinerType: event.target.value })}>
                {ruleSet.examinerTypes.map((type) => <option key={type.value} value={type.value}>{type.value}</option>)}
              </select>
              {selectedExaminerType ? (
                <small className="subtext-muted">
                  Executes Form {selectedExaminerType.form} · licensed by {selectedExaminerType.licenseBoard}
                  {selectedExaminerType.telehealthEligible ? "" : " · in-person examination only"}
                </small>
              ) : null}
            </label>
            <label>License number
              <input
                value={pecForm.examinerLicenseNumber ?? ""}
                onChange={(event) => setPecForm({ ...pecForm, examinerLicenseNumber: event.target.value })}
                placeholder="As entered in the form's LA MEDICAL LICENSE NUMBER field"
              />
              {selectedExaminerType && selectedExaminerType.licenseBoard !== "LSBME" ? (
                <small className="subtext-muted">
                  The printed field reads &ldquo;LA Medical License Number&rdquo; even for {selectedExaminerType.licenseBoard}-issued
                  licenses — enter your {selectedExaminerType.licenseBoard} number.
                </small>
              ) : null}
            </label>
            <label>Certificate sequence
              <select
                value={pecForm.certificateSequence ?? "1st"}
                onChange={(event) => setPecForm({ ...pecForm, certificateSequence: event.target.value as "1st" | "2nd" })}
              >
                {ruleSet.certificateSequenceOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.value}</option>
                ))}
              </select>
              <small className="subtext-muted">
                {ruleSet.certificateSequenceOptions.find((option) => option.value === (pecForm.certificateSequence ?? "1st"))?.description}
              </small>
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
              <input
                type="checkbox"
                checked={pecForm.telemedicine}
                disabled={selectedExaminerType ? !selectedExaminerType.telehealthEligible : false}
                onChange={(event) => setPecForm({ ...pecForm, telemedicine: event.target.checked })}
              />
              Examination conducted by telehealth
            </label>
            {selectedExaminerType && !selectedExaminerType.telehealthEligible ? (
              <p className="inline-warning span-2">
                {selectedExaminerType.value} is not among the roles authorized to examine by telehealth
                (psychiatrist, psychologist, medical psychologist, or PMHNP) — La. R.S. 28:53(B)(1) as amended
                by Act 148 of 2025. An in-person examination is required.
              </p>
            ) : null}
            {selectedExaminerType?.requiresCollaboratingPhysicianApproval ? (
              <label className="span-2">Collaborating physician who gave verbal approval
                <input
                  value={pecForm.collaboratingPhysicianName ?? ""}
                  onChange={(event) => setPecForm({ ...pecForm, collaboratingPhysicianName: event.target.value })}
                  placeholder="Dr. ..."
                />
                <small className="subtext-muted">
                  Required before a non-psychiatric nurse practitioner may execute this certificate
                  (La. R.S. 28:53(B)(1)). OBH-1 has no printed field for this, so it is recorded here and in the
                  custody ledger.
                </small>
              </label>
            ) : null}
            <OptionGroup
              label="Findings — group 1"
              options={ruleSet.groundsOptions}
              selected={pecForm.findings}
              onToggle={(value) => setPecForm({ ...pecForm, findings: toggle(pecForm.findings, value) })}
            />
            <OptionGroup
              label="And the person is — group 2"
              options={pecConditionOptions}
              selected={pecForm.conditions}
              onToggle={(value) => setPecForm({ ...pecForm, conditions: toggle(pecForm.conditions, value) })}
            />
            <p className="span-2 subtext-muted">
              The form directs a selection in <b>both</b> group 1 and group 2 — not one overall.
            </p>
            <label className="span-2">Clinical observations &amp; narrative
              <textarea value={pecForm.narrative} onChange={(event) => setPecForm({ ...pecForm, narrative: event.target.value })} placeholder="Time-stamped observations, risk assessment, mental status exam, why immediate psychiatric treatment is required." />
            </label>
          </div>
          {pecIssues.length ? (
            <ul className="validation-list">
              {pecIssues.map((issue) => (
                <li key={issue.code}>
                  <span>{issue.message}</span>
                  <small>{issue.citation}</small>
                </li>
              ))}
            </ul>
          ) : null}
          <button
            className="primary-button"
            type="button"
            disabled={!pecReady}
            onClick={() => { setPecReview(true); setPecAttested(false); }}
          >
            Review certificate for signature
          </button>
          </>
          ) : (
          <div className="attest-review">
            <h4>Review before signing — this certificate seals and locks on execution</h4>
            <div className="kv-grid">
              <span className="label">Form</span>
              <span>{pecFormId} · {pecForm.certificateSequence ?? "1st"} certificate</span>
              <span className="label">Certifier</span>
              <span>
                {pecForm.examinerName} — {pecForm.examinerType}
                {pecForm.examinerLicenseNumber ? ` · lic. ${pecForm.examinerLicenseNumber}` : ""}
              </span>
              <span className="label">Examined</span>
              <span>{new Date(pecForm.examinedAt).toLocaleString()}{pecForm.telemedicine ? " (telehealth)" : ""}</span>
              <span className="label">Findings</span>
              <span>{pecForm.findings.join("; ") || "None selected"} · {pecForm.conditions.join("; ") || "None selected"}</span>
              {pecForm.collaboratingPhysicianName ? (
                <>
                  <span className="label">Verbal approval</span>
                  <span>{pecForm.collaboratingPhysicianName} (collaborating physician)</span>
                </>
              ) : null}
              <span className="label">Narrative</span>
              <span className="attest-narrative">{pecForm.narrative}</span>
            </div>
            <blockquote className="attest-text">
              I certify that I have actually examined the above-named person within the statutory window and am
              of the opinion that they are in need of immediate psychiatric treatment in a treatment facility as
              indicated above. Completion of this certificate constitutes legal authority to transport the
              patient to the designated facility.
              <small>Draft attestation language — requires counsel validation; the executed wording is the printed form&rsquo;s.</small>
            </blockquote>
            <label className="checkbox-label">
              <input type="checkbox" checked={pecAttested} onChange={(event) => setPecAttested(event.target.checked)} />
              I am {pecForm.examinerName.trim() || "the named certifier"}, {pecForm.examinerType}, I have reviewed
              this certificate for accuracy, and I understand it locks on execution.
            </label>
            <div className="attest-actions">
              <button className="secondary-button" type="button" onClick={() => { setPecReview(false); setPecAttested(false); }}>
                Go back &amp; edit
              </button>
              <button className="primary-button" type="button" disabled={!pecAttested} onClick={() => onExecutePec(pecForm)}>
                Sign, attest &amp; seal certificate
              </button>
            </div>
          </div>
          )}
        </article>
      ) : (
        <article className="subtle-panel epec-stage">
          <div className="stage-summary-head">
            <h3>PEC executed &amp; sealed</h3>
            <StatusBadge tone="good">Sealed</StatusBadge>
          </div>
          <div className="kv-grid">
            <span className="label">Form</span>
            <span>{pec.form ?? "OBH-1"} · {pec.certificateSequence ?? "1st"} certificate</span>
            <span className="label">Certifier</span>
            <span>
              {pec.examinerName} — {pec.examinerType}
              {pec.examinerLicenseNumber ? ` · lic. ${pec.examinerLicenseNumber}` : ""}
            </span>
            <span className="label">Examined</span><span>{new Date(pec.examinedAt).toLocaleString()}{pec.telemedicine ? " (telehealth)" : ""}</span>
            <span className="label">Findings</span><span>{pec.findings.join("; ")} · {pec.conditions.join("; ")}</span>
            {pec.collaboratingPhysicianName ? (
              <>
                <span className="label">Verbal approval</span>
                <span>{pec.collaboratingPhysicianName} (collaborating physician)</span>
              </>
            ) : null}
          </div>
          {pec.formInstanceId ? (
            <div className="fingerprint-chip">Control number <code>{pec.formInstanceId}</code></div>
          ) : null}
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
          {!cecReview ? (
          <>
          <div className="form-grid">
            <label>Coroner / deputy coroner examiner
              <input value={cecForm.examinerName} onChange={(event) => setCecForm({ ...cecForm, examinerName: event.target.value })} />
            </label>
            <label>License number
              <input
                value={cecForm.examinerLicenseNumber ?? ""}
                onChange={(event) => setCecForm({ ...cecForm, examinerLicenseNumber: event.target.value })}
                placeholder="LA medical license number"
              />
            </label>
            <OptionGroup
              label="Independent findings — group 1"
              options={ruleSet.groundsOptions}
              selected={cecForm.findings}
              onToggle={(value) => setCecForm({ ...cecForm, findings: toggle(cecForm.findings, value) })}
            />
            <OptionGroup
              label="And the person is — group 2"
              options={conditionOptionsForForm(ruleSet, "OBH-2")}
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
          {cecIssues.length ? (
            <ul className="validation-list">
              {cecIssues.map((issue) => (
                <li key={issue.code}>
                  <span>{issue.message}</span>
                  <small>{issue.citation}</small>
                </li>
              ))}
            </ul>
          ) : null}
          {cecForm.outcome === "Discharged" ? (
            <div className="deadline-split">
              <b>Concluding &ldquo;not a proper subject&rdquo; ends the legal basis for the hold.</b>
              <small>
                The certificate is a precondition to continued confinement, so this conclusion requires release
                rather than continued detention. La. R.S. 28:53.1 then requires the facility to notify the
                patient&rsquo;s current behavioral-health provider of the discharge date and time, notify any
                referred follow-up provider within 24 hours with a clinical summary, and give the patient the
                LDH-published educational materials.
              </small>
            </div>
          ) : null}
          <button
            className="primary-button"
            type="button"
            disabled={
              !cecForm.examinerName
              || cecIssues.length > 0
              || (cecForm.outcome === "Continued" && (!cecForm.findings.length || !cecForm.conditions.length))
            }
            onClick={() => { setCecReview(true); setCecAttested(false); }}
          >
            Review determination for execution
          </button>
          </>
          ) : (
          <div className="attest-review">
            <h4>Review before executing — this determination freezes the case record</h4>
            <div className="kv-grid">
              <span className="label">Examiner</span>
              <span>
                {cecForm.examinerName}
                {cecForm.examinerLicenseNumber ? ` · lic. ${cecForm.examinerLicenseNumber}` : ""}
              </span>
              <span className="label">Determination</span>
              <span>{cecForm.outcome === "Continued" ? "Criteria met — continued confinement authorized" : "Not a proper subject — discharge forthwith"}</span>
              {cecForm.outcome === "Continued" ? (
                <>
                  <span className="label">Findings</span>
                  <span>{cecForm.findings.join("; ") || "None selected"} · {cecForm.conditions.join("; ") || "None selected"}</span>
                </>
              ) : (
                <>
                  <span className="label">Reason</span>
                  <span>{cecForm.dischargeReason?.trim() || "Unknown"}</span>
                </>
              )}
            </div>
            <blockquote className="attest-text">
              {cecForm.outcome === "Continued"
                ? "Executing this certificate authorizes continued confinement as a precondition under the cited statute."
                : "Executing this determination ends the legal basis for the hold; the patient shall not be further detained and discharge notifications under La. R.S. 28:53.1 apply."}
              <small>Draft consequence summary — requires counsel validation; the executed wording is the printed form&rsquo;s.</small>
            </blockquote>
            <label className="checkbox-label">
              <input type="checkbox" checked={cecAttested} onChange={(event) => setCecAttested(event.target.checked)} />
              I am {cecForm.examinerName.trim() || "the named examiner"}, this is my independent determination
              following actual examination, and I understand the record freezes on execution.
            </label>
            <div className="attest-actions">
              <button className="secondary-button" type="button" onClick={() => { setCecReview(false); setCecAttested(false); }}>
                Go back &amp; edit
              </button>
              <button className="primary-button" type="button" disabled={!cecAttested} onClick={() => onExecuteCec(cecForm)}>
                Execute certificate &amp; freeze record
              </button>
            </div>
          </div>
          )}
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
