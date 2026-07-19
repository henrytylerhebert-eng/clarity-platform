import { ClipboardCheck, ShieldAlert } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { getPrescreenRecord, type HumanDisposition, type HumanTriageStatus } from "../domain/journey";
import type { AppState, PrescreenRecord } from "../domain/types";
import type { WorkspaceId } from "../domain/roles";

interface Props {
  state: AppState;
  caseId: string;
  onChange: (record: PrescreenRecord) => void;
  onNavigateWorkspace: (workspace: WorkspaceId) => void;
}

const triageOptions: HumanTriageStatus[] = ["Not started", "In progress", "Needs authorized review", "Reviewed"];
const dispositionOptions: HumanDisposition[] = [
  "Not recorded",
  "Continue to intake",
  "Emergency protocol activated",
  "Medical evaluation required",
  "Pending information",
  "Alternate setting considered",
];

export function Prescreen({ state, caseId, onChange, onNavigateWorkspace }: Props) {
  const record = getPrescreenRecord(state, caseId);
  const caseRecord = state.cases.find((item) => item.id === caseId);
  const sourceCount = state.sourceReferences.filter((item) => item.caseId === caseId).length;
  const update = (changes: Partial<PrescreenRecord>) => onChange({ ...record, ...changes, updatedAt: new Date().toISOString() });

  return (
    <div className="stack" aria-labelledby="prescreen-heading">
      <section className="panel journey-workspace-hero">
        <div className="panel-title">
          <div className="icon-title"><ClipboardCheck size={19} /><h2 id="prescreen-heading">Prescreen</h2></div>
          <StatusBadge tone={record.triageStatus === "Reviewed" ? "good" : "warn"}>{record.triageStatus}</StatusBadge>
        </div>
        <p>
          Initial clinical and operational screen for an authorized human reviewer. Clarity surfaces safety and medical context;
          it does not autonomously triage, determine disposition, level of care, placement, or admission.
        </p>
        <div className="read-only-warning" role="note">
          <ShieldAlert size={17} />
          <span>Synthetic local workflow. Human triage and disposition must be explicitly recorded by an authorized reviewer.</span>
        </div>
      </section>

      <section className="journey-context-strip" aria-label="Prescreen case context">
        <div><span className="label">Case</span><strong>{caseRecord?.patientToken.displayName ?? caseId}</strong></div>
        <div><span className="label">Location</span><strong>{record.currentLocation}</strong></div>
        <div><span className="label">Urgency</span><StatusBadge tone={record.urgency === "Emergent" ? "danger" : record.urgency === "Urgent" ? "warn" : "info"}>{record.urgency}</StatusBadge></div>
        <div><span className="label">Source references</span><strong>{sourceCount}</strong></div>
      </section>

      <div className="grid-two">
        <section className="panel">
          <div className="panel-title"><h3>Referral facts</h3><p>Source facts stay separate from human conclusions.</p></div>
          <div className="form-grid">
            <label>Referral source<input value={record.referralSource} onChange={(event) => update({ referralSource: event.target.value })} /></label>
            <label>Referral received<input value={record.referralReceivedAt} onChange={(event) => update({ referralReceivedAt: event.target.value })} /></label>
            <label>Current location<input value={record.currentLocation} onChange={(event) => update({ currentLocation: event.target.value })} /></label>
            <label>Urgency<select value={record.urgency} onChange={(event) => update({ urgency: event.target.value as PrescreenRecord["urgency"] })}>
              {(["Routine", "Urgent", "Emergent", "Unknown"] as const).map((item) => <option key={item}>{item}</option>)}
            </select></label>
            <label className="span-2">Presenting concern<textarea value={record.presentingConcern} onChange={(event) => update({ presentingConcern: event.target.value })} /></label>
            <label className="span-2">Custody / legal context<textarea value={record.custodyContext} onChange={(event) => update({ custodyContext: event.target.value })} /></label>
          </div>
        </section>

        <section className="panel">
          <div className="panel-title"><h3>Immediate safety and medical context</h3><p>Unknown is a valid answer state and requires follow-up.</p></div>
          <div className="form-grid">
            <label className="span-2">Immediate safety concerns<textarea value={record.immediateSafety} onChange={(event) => update({ immediateSafety: event.target.value })} /></label>
            <label className="span-2">Medical instability concerns<textarea value={record.medicalConcerns} onChange={(event) => update({ medicalConcerns: event.target.value })} /></label>
            <label>Collateral status<select value={record.collateralStatus} onChange={(event) => update({ collateralStatus: event.target.value as PrescreenRecord["collateralStatus"] })}>
              {(["Missing", "Partial", "Documented", "Unknown"] as const).map((item) => <option key={item}>{item}</option>)}
            </select></label>
            <label>Assigned owner<input value={record.assignedOwner} onChange={(event) => update({ assignedOwner: event.target.value })} /></label>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-title"><h3>Human triage and next path</h3><p>This is a human-recorded gate, not an automated conclusion.</p></div>
        <div className="form-grid">
          <label>Triage status<select value={record.triageStatus} onChange={(event) => update({ triageStatus: event.target.value as HumanTriageStatus })}>
            {triageOptions.map((item) => <option key={item}>{item}</option>)}
          </select></label>
          <label>Human disposition<select value={record.humanDisposition} onChange={(event) => update({ humanDisposition: event.target.value as HumanDisposition })}>
            {dispositionOptions.map((item) => <option key={item}>{item}</option>)}
          </select></label>
          <label className="span-2">Next action<input value={record.nextAction} onChange={(event) => update({ nextAction: event.target.value })} /></label>
        </div>
        <div className="button-row">
          <button className="primary-button" type="button" onClick={() => onNavigateWorkspace("intake")}>Continue to Guided Intake</button>
          <button className="secondary-button" type="button" onClick={() => onNavigateWorkspace("dependency-map")}>Review dependencies</button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-title"><h3>Source and activity</h3><p>Prescreen records the handoff; downstream workspaces own their artifacts.</p></div>
        <dl className="kv-grid">
          <dt>Source references</dt><dd>{record.sourceReferenceIds.length || sourceCount}</dd>
          <dt>Last updated</dt><dd>{record.updatedAt}</dd>
          <dt>Next owner</dt><dd>{record.assignedOwner}</dd>
        </dl>
        <p className="panel-footer">No clinical, legal, placement, or admission decision is made by this screen.</p>
      </section>
    </div>
  );
}
