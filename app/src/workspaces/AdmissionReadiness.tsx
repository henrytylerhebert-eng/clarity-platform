import { CheckCircle2, ClipboardCheck, ShieldAlert } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { createDefaultAdmissionEpisode, getAdmissionEpisode } from "../domain/admissionEpisode";
import { getAdmissionReadiness } from "../domain/journey";
import type { WorkspaceId } from "../domain/roles";
import type { AdmissionCheckpoint, AdmissionCheckpointStatus, AdmissionEpisodeRecord, AppState, MedicalClearanceRecord } from "../domain/types";

interface Props {
  state: AppState;
  caseId: string;
  onCheckpointChange: (checkpoint: AdmissionCheckpoint) => void;
  onMedicalClearanceChange: (record: MedicalClearanceRecord) => void;
  onAdmissionEpisodeChange: (record: AdmissionEpisodeRecord) => void;
  onNavigateWorkspace: (workspace: WorkspaceId) => void;
}

const checkpointLabels: Record<AdmissionCheckpoint["kind"], string> = {
  "psychiatrist-acceptance": "Psychiatrist acceptance",
  "medical-clearance": "Medical clearance",
  "operational-readiness": "Facility, bed, and transport",
  "arrival-handoff": "Arrival and handoff",
  "admission-episode": "Admission episode",
};

function tone(status: AdmissionCheckpointStatus): "good" | "warn" | "danger" | "info" | "neutral" {
  if (status === "Accepted" || status === "Approved" || status === "Complete") return "good";
  if (status === "Declined" || status === "Blocked") return "danger";
  return status === "Needs review" ? "warn" : "info";
}

export function AdmissionReadiness({ state, caseId, onCheckpointChange, onMedicalClearanceChange, onAdmissionEpisodeChange, onNavigateWorkspace }: Props) {
  const readiness = getAdmissionReadiness(state, caseId);
  const caseRecord = state.cases.find((item) => item.id === caseId);
  const episode = getAdmissionEpisode(state, caseId);
  const episodeDraft = episode ?? createDefaultAdmissionEpisode(state, caseId, new Date().toISOString());
  const acceptance = readiness.checkpoints.find((item) => item.kind === "psychiatrist-acceptance");
  const medicalCheckpoint = readiness.checkpoints.find((item) => item.kind === "medical-clearance");
  const operational = readiness.checkpoints.find((item) => item.kind === "operational-readiness");
  const arrival = readiness.checkpoints.find((item) => item.kind === "arrival-handoff");
  const canCreateEpisode = acceptance?.status === "Accepted"
    && medicalCheckpoint?.status === "Approved"
    && operational?.status === "Complete"
    && arrival?.status === "Complete";
  const updateCheckpoint = (checkpoint: AdmissionCheckpoint, status: AdmissionCheckpointStatus) => onCheckpointChange({ ...checkpoint, status, updatedAt: new Date().toISOString() });
  const updateEpisode = (patch: Partial<AdmissionEpisodeRecord>) => onAdmissionEpisodeChange({ ...episodeDraft, ...patch, updatedAt: new Date().toISOString() });

  return (
    <div className="stack" aria-labelledby="admit-heading">
      <section className="panel journey-workspace-hero">
        <div className="panel-title">
          <div className="icon-title"><ClipboardCheck size={19} /><h2 id="admit-heading">Admission Readiness</h2></div>
          <StatusBadge tone="warn">Separate human checkpoints</StatusBadge>
        </div>
        <p>
          Psychiatrist acceptance, medical clearance, operational readiness, arrival/handoff, and admission episode are separate.
          One checkpoint never implies another.
        </p>
        <div className="read-only-warning" role="note"><ShieldAlert size={17} /><span>Synthetic local workflow. This surface does not make or authorize admission decisions.</span></div>
      </section>

      <section className="journey-context-strip" aria-label="Admission case context">
        <div><span className="label">Case</span><strong>{caseRecord?.patientToken.displayName ?? caseId}</strong></div>
        <div><span className="label">Current stage</span><strong>{caseRecord?.currentStage ?? "Unknown"}</strong></div>
        <div><span className="label">Packet</span><strong>{caseRecord?.packetCompleteness ?? 0}%</strong></div>
        <div><span className="label">Facility routing</span><strong>{caseRecord?.routingStatus ?? "Unknown"}</strong></div>
      </section>

      <section className="admission-checkpoint-rail" aria-label="Admission checkpoints">
        {readiness.checkpoints.map((checkpoint) => (
          <article className="panel admission-checkpoint" key={checkpoint.id}>
            <div className="panel-title">
              <div className="icon-title"><CheckCircle2 size={17} /><h3>{checkpointLabels[checkpoint.kind]}</h3></div>
              <StatusBadge tone={tone(checkpoint.status)}>{checkpoint.status}</StatusBadge>
            </div>
            <p>{checkpoint.note}</p>
            <dl className="kv-grid">
              <dt>Owner</dt><dd>{checkpoint.owner}</dd>
              <dt>Review authority</dt><dd>{checkpoint.reviewAuthority}</dd>
              <dt>Updated</dt><dd>{checkpoint.updatedAt}</dd>
            </dl>
            {checkpoint.kind === "psychiatrist-acceptance" ? (
              <label>Acceptance status<select value={checkpoint.status} onChange={(event) => updateCheckpoint(checkpoint, event.target.value as AdmissionCheckpointStatus)}>
                {(["Pending", "Needs review", "Accepted", "Declined"] as const).map((item) => <option key={item}>{item}</option>)}
              </select></label>
            ) : null}
            {checkpoint.kind === "medical-clearance" ? (
              <div className="stack-tight">
                <label>Clearance status<select value={readiness.medicalClearance.status} onChange={(event) => {
                  const status = event.target.value as MedicalClearanceRecord["status"];
                  onMedicalClearanceChange({ ...readiness.medicalClearance, status, reviewedAt: status === "Approved" ? new Date().toISOString() : undefined, updatedAt: new Date().toISOString() });
                  updateCheckpoint(checkpoint, status === "Approved" ? "Approved" : status === "Not approved" ? "Blocked" : status === "Needs review" ? "Needs review" : "In progress");
                }}>
                  {(["Pending", "In progress", "Needs review", "Approved", "Not approved"] as const).map((item) => <option key={item}>{item}</option>)}
                </select></label>
                <label>Medical reviewer<input value={readiness.medicalClearance.reviewedBy ?? ""} onChange={(event) => onMedicalClearanceChange({ ...readiness.medicalClearance, reviewedBy: event.target.value || undefined, updatedAt: new Date().toISOString() })} placeholder="Authorized reviewer" /></label>
              </div>
            ) : null}
            {checkpoint.kind === "arrival-handoff" ? <button className="secondary-button" type="button" onClick={() => updateCheckpoint(checkpoint, "Complete")}>Record synthetic arrival / handoff</button> : null}
            {checkpoint.kind === "operational-readiness" ? <button className="secondary-button" type="button" onClick={() => onNavigateWorkspace("routing")}>Review facility response</button> : null}
            {checkpoint.kind === "admission-episode" ? (
              <div className="admission-episode-form">
                {!episode ? (
                  <>
                    <p className="inline-warning">The local prototype can create a case-owned episode only after the preceding checkpoints are independently satisfied. This mirrors the existing backend Episode / CaseEpisodeLink contract; it does not call the backend gateway.</p>
                    <button className="primary-button" type="button" disabled={!canCreateEpisode} onClick={() => onAdmissionEpisodeChange(episodeDraft)}>Create case-owned admission episode</button>
                    {!canCreateEpisode ? <p className="subtext">Complete psychiatrist acceptance, medical clearance, operational readiness, and arrival/handoff first.</p> : null}
                  </>
                ) : (
                  <>
                    <dl className="kv-grid">
                      <dt>Episode ID</dt><dd className="mono">{episode.id}</dd>
                      <dt>Source acceptance</dt><dd className="mono">{episode.sourceAcceptanceId}</dd>
                      <dt>Facility / unit</dt><dd>{episode.facilityName} / {episode.unitId ?? "Unit not linked"}</dd>
                      <dt>Service date</dt><dd>{episode.serviceDate} ({episode.facilityTimezone})</dd>
                      <dt>Custody source</dt><dd className="mono">{episode.sourceCustodyEventId ?? "Not linked"}</dd>
                    </dl>
                    <div className="compact-form-grid">
                      <label>Admission orders<select value={episode.admissionOrdersStatus} onChange={(event) => updateEpisode({ admissionOrdersStatus: event.target.value as AdmissionEpisodeRecord["admissionOrdersStatus"] })}><option>Not recorded</option><option>Recorded</option><option>Needs review</option></select></label>
                      <label>Initial post-admission review<select value={episode.initialPostAdmissionReviewStatus} onChange={(event) => updateEpisode({ initialPostAdmissionReviewStatus: event.target.value as AdmissionEpisodeRecord["initialPostAdmissionReviewStatus"] })}><option>Not recorded</option><option>Recorded</option><option>Needs review</option></select></label>
                    </div>
                    <p className="subtext">Episode completion requires both admission orders and the initial post-admission review. Arrival alone does not create an episode.</p>
                    <button className="secondary-button" type="button" onClick={() => onNavigateWorkspace("episode")}>Open Episode &amp; UR projection</button>
                  </>
                )}
              </div>
            ) : null}
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="panel-title"><h3>Resolution workspaces</h3><p>Existing workspaces remain the source of operational artifacts.</p></div>
        <div className="button-row">
          <button className="secondary-button" type="button" onClick={() => onNavigateWorkspace("intake")}>Guided Intake</button>
          <button className="secondary-button" type="button" onClick={() => onNavigateWorkspace("medical")}>Medical Necessity</button>
          <button className="secondary-button" type="button" onClick={() => onNavigateWorkspace("packet")}>Packet Preview</button>
          <button className="secondary-button" type="button" onClick={() => onNavigateWorkspace("bedboard")}>Milieu Bedboard</button>
          <button className="secondary-button" type="button" onClick={() => onNavigateWorkspace("ledger")}>Custody Ledger</button>
        </div>
        {medicalCheckpoint?.status === "Approved" ? <p className="subtext">Medical clearance is recorded separately from medical necessity and psychiatrist acceptance.</p> : null}
      </section>
    </div>
  );
}
