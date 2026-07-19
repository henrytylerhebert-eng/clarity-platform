import { useState } from "react";
import { createDefaultNursingAssessment, getNursingAssessment, isNursingAssessmentComplete } from "../domain/nursingAssessment";
import type {
  AppState,
  Assessment,
  NursingAssessmentRecord,
  NursingVitalSigns,
  RiskFinding,
  RiskType,
  SourceReference,
  SourceType,
} from "../domain/types";
import { evaluatePitfallGuards } from "../domain/guardrails";
import { StatusBadge } from "../components/StatusBadge";

interface Props {
  state: AppState;
  caseId: string;
  onAssessmentChange: (assessment: Assessment) => void;
  onAddSourceAndRisk: (source: SourceReference, risk: RiskFinding) => void;
  onNursingAssessmentChange: (assessment: NursingAssessmentRecord) => void;
}

export function GuidedIntake({ state, caseId, onAssessmentChange, onAddSourceAndRisk, onNursingAssessmentChange }: Props) {
  const [activeStage, setActiveStage] = useState<"stage-1" | "stage-2" | "stage-3" | "final">("stage-1");
  const [sourceType, setSourceType] = useState<SourceType>("Patient report");
  const [sourceLabel, setSourceLabel] = useState("Patient report");
  const [sourceExcerpt, setSourceExcerpt] = useState("Source-linked fact entered during guided intake.");
  const [riskType, setRiskType] = useState<RiskType>("Danger to self");
  const [riskSummary, setRiskSummary] = useState("Source-linked risk finding needs clinician review.");
  const caseRecord = state.cases.find((item) => item.id === caseId);
  const assessment = state.assessments.find((item) => item.caseId === caseId);
  if (!caseRecord || !assessment) return null;
  const currentAssessment = assessment;
  const currentRisks = state.riskFindings.filter((item) => item.caseId === caseId);
  const nursingAssessment = getNursingAssessment(state, caseId) ?? createDefaultNursingAssessment(state, caseId, caseRecord.openedAt);
  const nursingStatus = !getNursingAssessment(state, caseId)
    ? "Pending"
    : isNursingAssessmentComplete(nursingAssessment)
      ? "Complete"
      : nursingAssessment.status === "Safety interrupt" || nursingAssessment.status === "Needs review"
        ? "Needs review"
        : "In progress";

  const guards = evaluatePitfallGuards({
    caseRecord,
    assessment,
    riskFindings: state.riskFindings.filter((item) => item.caseId === caseId),
    medicalNecessity: state.medicalNecessitySnapshots.find((item) => item.caseId === caseId),
    legalInstrument: state.legalInstruments.find((item) => item.caseId === caseId),
  });

  function updateAssessment(patch: Partial<Assessment>) {
    onAssessmentChange({ ...currentAssessment, ...patch });
  }

  function addRiskFinding() {
    const sourceId = `src-${Date.now()}`;
    const riskId = `risk-${Date.now()}`;
    onAddSourceAndRisk(
      {
        id: sourceId,
        caseId,
        type: sourceType,
        label: sourceLabel,
        excerpt: sourceExcerpt,
        confidence: "Medium",
      },
      {
        id: riskId,
        caseId,
        type: riskType,
        summary: riskSummary,
        sourceReferenceIds: [sourceId],
        severity: "Unknown",
        reviewStatus: "Draft",
      },
    );
  }

  const isFieldMode = currentAssessment.mode === "Field";

  return (
    <section className="panel">
      <div className="panel-title">
        <div>
          <h2>Guided Intake</h2>
          <p>{assessment.mode} mode. Ask in plain language, store structured facts.</p>
        </div>
        <div className="mode-toggle" role="group" aria-label="Capture mode">
          <button
            className={isFieldMode ? "mode-option active" : "mode-option"}
            type="button"
            onClick={() => updateAssessment({ mode: "Field" })}
          >
            Field mode
          </button>
          <button
            className={!isFieldMode ? "mode-option active" : "mode-option"}
            type="button"
            onClick={() => updateAssessment({ mode: "Clinical" })}
          >
            Clinical mode
          </button>
        </div>
      </div>
      <div className="intake-stage-strip" role="tablist" aria-label="CIA intake stages">
        {([
          ["stage-1", "Stage 1 · Field / crisis", "Complete"],
          ["stage-2", "Stage 2 · Nursing", nursingStatus],
          ["stage-3", "Stage 3 · Clinical / social", currentAssessment.formulation && currentAssessment.collateralStatus === "Documented" ? "Complete" : "In progress"],
          ["final", "Final clinical review", currentAssessment.reviewStatus === "Clinician reviewed" || currentAssessment.reviewStatus === "Signed locked" ? "Complete" : "Needs review"],
        ] as const).map(([value, label, status]) => (
          <button
            className={activeStage === value ? "intake-stage active" : "intake-stage"}
            key={value}
            type="button"
            role="tab"
            aria-selected={activeStage === value}
            onClick={() => setActiveStage(value)}
          >
            <strong>{label}</strong><StatusBadge tone={status === "Complete" ? "good" : status === "Needs review" ? "warn" : "info"}>{status}</StatusBadge>
          </button>
        ))}
      </div>
      <div className="intake-stage-callout">
        {activeStage === "stage-1" ? <p><strong>Stage 1 job:</strong> capture immediate safety, medical concerns, referral context, interventions, transport, and the next handoff without turning a field encounter into a full diagnostic interview.</p> : null}
        {activeStage === "stage-2" ? <p><strong>Stage 2 job:</strong> a registered nurse verifies the handoff and documents medical screening, vitals, allergies, medications, withdrawal/overdose risk, physical findings, and current behavioral risk. Nursing recommendations remain separate from provider orders and medical clearance.</p> : null}
        {activeStage === "stage-3" ? <p><strong>Stage 3 job:</strong> integrate the biopsychosocial story, family/supports, housing, formulation, level-of-care support, and early discharge planning. The existing clinical fields remain the source workspace.</p> : null}
        {activeStage === "final" ? <p><strong>Final review job:</strong> an authorized reviewer checks material fields, conflicts, safety alerts, restricted details, draft outputs, and signatures. Review status remains distinct from data capture.</p> : null}
      </div>
      {isFieldMode ? (
        <p className="inline-warning">
          Field mode captures scene facts in plain language. Clinical fields are hidden and stay on the same case record — switch to clinical mode for the full assessment.
        </p>
      ) : null}
      {activeStage === "stage-2" ? (
        <NursingStagePanel state={state} record={nursingAssessment} onChange={onNursingAssessmentChange} />
      ) : <div className="form-grid">
        <label className="span-2">
          Presenting problem
          <textarea value={currentAssessment.presentingProblem} onChange={(event) => updateAssessment({ presentingProblem: event.target.value })} />
        </label>
        <label className="span-2">
          Precipitating events
          <textarea value={currentAssessment.precipitatingEvents} onChange={(event) => updateAssessment({ precipitatingEvents: event.target.value })} />
        </label>
        <label>
          Danger to self
          <textarea value={currentAssessment.dangerToSelf} onChange={(event) => updateAssessment({ dangerToSelf: event.target.value })} />
        </label>
        <label>
          Danger to others
          <textarea value={currentAssessment.dangerToOthers} onChange={(event) => updateAssessment({ dangerToOthers: event.target.value })} />
        </label>
        {!isFieldMode ? (
          <>
            <label>
              Grave disability
              <textarea value={currentAssessment.graveDisability} onChange={(event) => updateAssessment({ graveDisability: event.target.value })} />
            </label>
            <label>
              Orientation
              <textarea value={currentAssessment.orientation} onChange={(event) => updateAssessment({ orientation: event.target.value })} />
            </label>
            <label>
              Hallucinations / delusions / paranoia
              <textarea value={currentAssessment.psychosis} onChange={(event) => updateAssessment({ psychosis: event.target.value })} />
            </label>
            <label>
              Depression / anxiety / insomnia / eating / sleeping
              <textarea value={currentAssessment.moodSleepAppetite} onChange={(event) => updateAssessment({ moodSleepAppetite: event.target.value })} />
            </label>
            <label>
              Mental status
              <textarea value={currentAssessment.mentalStatus} onChange={(event) => updateAssessment({ mentalStatus: event.target.value })} />
            </label>
          </>
        ) : null}
        <label>
          Collateral status
          <select value={currentAssessment.collateralStatus} onChange={(event) => updateAssessment({ collateralStatus: event.target.value as Assessment["collateralStatus"] })}>
            <option>Missing</option>
            <option>Partial</option>
            <option>Documented</option>
          </select>
        </label>
        {!isFieldMode ? (
          <>
            <label className="span-2">
              Risk formulation
              <textarea value={currentAssessment.formulation} onChange={(event) => updateAssessment({ formulation: event.target.value })} />
            </label>
            <label>
              Psychiatric history
              <textarea value={currentAssessment.psychiatricHistory} onChange={(event) => updateAssessment({ psychiatricHistory: event.target.value })} />
            </label>
            <label>
              Treatment history
              <textarea value={currentAssessment.treatmentHistory} onChange={(event) => updateAssessment({ treatmentHistory: event.target.value })} />
            </label>
            <label>
              Substance use
              <textarea value={currentAssessment.substanceUse} onChange={(event) => updateAssessment({ substanceUse: event.target.value })} />
            </label>
            <label>
              Medical concerns
              <textarea value={currentAssessment.medicalConcerns} onChange={(event) => updateAssessment({ medicalConcerns: event.target.value })} />
            </label>
          </>
        ) : null}
        <label className="span-2">
          Family / environment / housing / work / school stressors
          <textarea value={currentAssessment.environmentalStressors} onChange={(event) => updateAssessment({ environmentalStressors: event.target.value })} />
        </label>
        <label>
          Collateral contacts
          <textarea value={currentAssessment.collateralContacts} onChange={(event) => updateAssessment({ collateralContacts: event.target.value })} />
        </label>
        {!isFieldMode ? (
          <>
            <label>
              Protective factors
              <textarea value={currentAssessment.protectiveFactors} onChange={(event) => updateAssessment({ protectiveFactors: event.target.value })} />
            </label>
            <label className="span-2">
              Lower level of care considered
              <textarea value={currentAssessment.lowerLevelConsidered} onChange={(event) => updateAssessment({ lowerLevelConsidered: event.target.value })} />
            </label>
          </>
        ) : null}
      </div>}
      <div className="source-risk-panel">
        <h3>Source-linked risk finding</h3>
        <div className="form-grid">
          <label>
            Source type
            <select value={sourceType} onChange={(event) => setSourceType(event.target.value as SourceType)}>
              <option>Patient report</option>
              <option>Family collateral</option>
              <option>Law enforcement</option>
              <option>ED staff</option>
              <option>Outpatient provider</option>
              <option>Clinician observation</option>
              <option>Prior record</option>
            </select>
          </label>
          <label>
            Risk type
            <select value={riskType} onChange={(event) => setRiskType(event.target.value as RiskType)}>
              <option>Danger to self</option>
              <option>Danger to others</option>
              <option>Grave disability</option>
              <option>Medical instability</option>
              <option>Elopement</option>
              <option>Vulnerability</option>
            </select>
          </label>
          <label>
            Source label
            <input value={sourceLabel} onChange={(event) => setSourceLabel(event.target.value)} />
          </label>
          <label>
            Source excerpt
            <textarea value={sourceExcerpt} onChange={(event) => setSourceExcerpt(event.target.value)} />
          </label>
          <label className="span-2">
            Risk summary
            <textarea value={riskSummary} onChange={(event) => setRiskSummary(event.target.value)} />
          </label>
        </div>
        <button className="secondary-button" type="button" onClick={addRiskFinding}>Add source-linked risk</button>
      </div>

      <div className="guard-panel">
        <h3>Pitfall guards</h3>
        {guards.length ? guards.map((guard) => (
          <div className="guard-row" key={guard.id}>
            <StatusBadge tone={guard.severity === "Hard stop" ? "danger" : "warn"}>{guard.severity}</StatusBadge>
            <strong>{guard.title}</strong>
            <span>{guard.message}</span>
          </div>
        )) : <p>No active pitfall guards.</p>}
      </div>
      <div className="guard-panel">
        <h3>Current source-linked risk findings</h3>
        {currentRisks.length ? currentRisks.map((risk) => (
          <div className="risk-row" key={risk.id}>
            <strong>{risk.type}</strong>
            <span>{risk.summary}</span>
            <StatusBadge tone="warn">{risk.reviewStatus}</StatusBadge>
          </div>
        )) : <p>No source-linked risk findings yet.</p>}
      </div>
    </section>
  );
}

interface NursingStageProps {
  state: AppState;
  record: NursingAssessmentRecord;
  onChange: (record: NursingAssessmentRecord) => void;
}

const nursingSourceOptions: SourceType[] = ["Patient report", "Family collateral", "Law enforcement", "ED staff", "Outpatient provider", "Clinician observation", "Prior record", "Referral document"];

function NursingStagePanel({ state, record, onChange }: NursingStageProps) {
  const update = (patch: Partial<NursingAssessmentRecord>) => onChange({
    ...record,
    ...patch,
    status: patch.status ?? (record.status === "Not started" ? "In progress" : record.status),
    updatedAt: new Date().toISOString(),
  });
  const updateMentalStatus = (patch: Partial<NursingAssessmentRecord["nursingMentalStatus"]>) => update({ nursingMentalStatus: { ...record.nursingMentalStatus, ...patch } });
  const updateList = (field: "medicationList" | "immediateNursingPriorities" | "recommendedPrecautions" | "referralsOrConsults", value: string) => update({ [field]: value.split("\n").map((item) => item.trim()).filter(Boolean) });
  const toggleSource = (source: SourceType) => update({ informationSources: record.informationSources.includes(source) ? record.informationSources.filter((item) => item !== source) : [...record.informationSources, source] });
  const toggleReference = (referenceId: string) => {
    const sourceReferenceIds = record.sourceReferenceIds.includes(referenceId) ? record.sourceReferenceIds.filter((item) => item !== referenceId) : [...record.sourceReferenceIds, referenceId];
    update({ sourceReferenceIds, fieldProvenance: { ...record.fieldProvenance, stage2_record: sourceReferenceIds } });
  };
  const addVitalSigns = () => update({
    vitalSigns: [...record.vitalSigns, {
      id: `vitals-${Date.now()}`,
      capturedAt: new Date().toISOString(),
      temperature: "",
      heartRate: "",
      respiratoryRate: "",
      bloodPressure: "",
      oxygenSaturation: "",
      sourceReferenceIds: record.sourceReferenceIds,
    }],
  });
  const updateVitalSigns = (vitalsId: string, patch: Partial<NursingVitalSigns>) => update({ vitalSigns: record.vitalSigns.map((item) => item.id === vitalsId ? { ...item, ...patch } : item) });
  const listText = (items: string[]) => items.join("\n");
  const selectedSourceCount = record.sourceReferenceIds.length;
  const complete = isNursingAssessmentComplete(record);

  return (
    <div className="nursing-stage-panel">
      <section className="nursing-summary-strip" aria-label="Nursing assessment status">
        <div><span className="label">Record</span><strong className="mono">{record.id} v{record.recordVersion}</strong></div>
        <div><span className="label">Owner</span><strong>{record.nurseId || "RN not assigned"}</strong></div>
        <div><span className="label">Source links</span><strong>{selectedSourceCount}</strong></div>
        <div><span className="label">Completion evaluator</span><StatusBadge tone={complete ? "good" : record.status === "Safety interrupt" ? "danger" : "warn"}>{complete ? "Complete" : record.status}</StatusBadge></div>
      </section>

      <div className="read-only-warning" role="note">
        <span>POC only. Nursing documentation is source-linked and review-gated. A nursing recommendation is not an authorized provider order or medical-clearance approval.</span>
      </div>

      <section className="nursing-section">
        <div className="panel-title"><h3>1. Source and admission-status verification</h3><p>Verify rather than copy Stage 1. Conflicts stay visible until reconciled.</p></div>
        <div className="compact-form-grid">
          <label>Assessment date/time<input type="datetime-local" value={record.assessedAt.slice(0, 16)} onChange={(event) => update({ assessedAt: new Date(event.target.value).toISOString() })} /></label>
          <label>Nurse identifier<input value={record.nurseId} onChange={(event) => update({ nurseId: event.target.value })} placeholder="Synthetic RN identifier" /></label>
          <label>Nurse credentials<input value={record.nurseCredentials} onChange={(event) => update({ nurseCredentials: event.target.value })} placeholder="RN" /></label>
          <label>Stage 1 handoff<select value={record.stage1HandoffStatus} onChange={(event) => update({ stage1HandoffStatus: event.target.value as NursingStageProps["record"]["stage1HandoffStatus"] })}>
            <option>Reviewed</option><option>Not reviewed</option><option>Conflicting</option><option>Not applicable</option>
          </select></label>
          <label>Reconciliation status<select value={record.reconciliationStatus} onChange={(event) => update({ reconciliationStatus: event.target.value as NursingStageProps["record"]["reconciliationStatus"] })}>
            <option>Not started</option><option>Reconciled</option><option>Partially reconciled</option><option>Conflict open</option><option>Not applicable</option>
          </select></label>
          <label>Information reliability<select value={record.sourceReliability} onChange={(event) => update({ sourceReliability: event.target.value as NursingStageProps["record"]["sourceReliability"] })}>
            <option>Reliable</option><option>Partially reliable</option><option>Unable to determine</option><option>Conflicting</option>
          </select></label>
          <label>Legal status source<select value={record.legalStatusVerification} onChange={(event) => update({ legalStatusVerification: event.target.value as NursingStageProps["record"]["legalStatusVerification"] })}>
            <option>Verified</option><option>Reported not verified</option><option>Conflicting</option><option>Not applicable</option>
          </select></label>
          <label>Medical clearance source/status<input value={record.medicalClearanceSourceAndStatus} onChange={(event) => update({ medicalClearanceSourceAndStatus: event.target.value })} placeholder="Record source and status; do not infer approval" /></label>
          <label className="span-2">Condition on arrival<textarea value={record.arrivalCondition} onChange={(event) => update({ arrivalCondition: event.target.value })} /></label>
          <label className="span-2">Immediate nursing priorities<textarea value={listText(record.immediateNursingPriorities)} onChange={(event) => updateList("immediateNursingPriorities", event.target.value)} placeholder="One priority per line" /></label>
        </div>
        <fieldset className="nursing-source-options"><legend>Information sources</legend>{nursingSourceOptions.map((source) => <label key={source}><input type="checkbox" checked={record.informationSources.includes(source)} onChange={() => toggleSource(source)} />{source}</label>)}</fieldset>
      </section>

      <section className="nursing-section">
        <div className="panel-title"><h3>2. Vitals, pain, and medical screen</h3><p>Screening evidence remains distinct from medical clearance.</p></div>
        <div className="compact-form-grid">
          <label>Pain present<select value={record.painStatus} onChange={(event) => update({ painStatus: event.target.value as NursingStageProps["record"]["painStatus"] })}><option>Yes</option><option>No</option><option>Unknown</option></select></label>
          <label>Current medical stability<select value={record.currentMedicalStability} onChange={(event) => update({ currentMedicalStability: event.target.value as NursingStageProps["record"]["currentMedicalStability"] })}><option>Stable for current setting</option><option>Requires urgent provider review</option><option>Requires emergency transfer</option><option>Unable to determine</option></select></label>
          <label className="span-2">Pain details<textarea value={record.painDetails} onChange={(event) => update({ painDetails: event.target.value })} /></label>
          <label>Acute medical complaints<textarea value={record.acuteMedicalComplaints} onChange={(event) => update({ acuteMedicalComplaints: event.target.value })} /></label>
          <label>Physical findings<textarea value={record.physicalFindings} onChange={(event) => update({ physicalFindings: event.target.value })} /></label>
          <label>Neurologic findings<textarea value={record.neurologicFindings} onChange={(event) => update({ neurologicFindings: event.target.value })} /></label>
          <label>Medical escalation actions<textarea value={record.medicalEscalationActions} onChange={(event) => update({ medicalEscalationActions: event.target.value })} /></label>
        </div>
        <div className="nursing-vitals-header"><h4>Vital-sign sets</h4><button className="secondary-button" type="button" onClick={addVitalSigns}>Add vital set</button></div>
        {record.vitalSigns.length ? record.vitalSigns.map((vitals) => <div className="nursing-vitals-row" key={vitals.id}>
          <label>Captured<input type="datetime-local" value={vitals.capturedAt.slice(0, 16)} onChange={(event) => updateVitalSigns(vitals.id, { capturedAt: new Date(event.target.value).toISOString() })} /></label>
          <label>Temp<input value={vitals.temperature} onChange={(event) => updateVitalSigns(vitals.id, { temperature: event.target.value })} /></label>
          <label>HR<input value={vitals.heartRate} onChange={(event) => updateVitalSigns(vitals.id, { heartRate: event.target.value })} /></label>
          <label>RR<input value={vitals.respiratoryRate} onChange={(event) => updateVitalSigns(vitals.id, { respiratoryRate: event.target.value })} /></label>
          <label>BP<input value={vitals.bloodPressure} onChange={(event) => updateVitalSigns(vitals.id, { bloodPressure: event.target.value })} /></label>
          <label>O2 sat<input value={vitals.oxygenSaturation} onChange={(event) => updateVitalSigns(vitals.id, { oxygenSaturation: event.target.value })} /></label>
        </div>) : <p className="inline-warning">No vital-sign set recorded yet.</p>}
      </section>

      <section className="nursing-section">
        <div className="panel-title"><h3>3. Allergies, medications, and substance-related risk</h3><p>Medication reconciliation is documentation, not prescribing.</p></div>
        <div className="compact-form-grid">
          <label>Allergy status<select value={record.allergyStatus} onChange={(event) => update({ allergyStatus: event.target.value as NursingStageProps["record"]["allergyStatus"] })}><option>Known allergies</option><option>No known allergies</option><option>Unable to verify</option><option>Conflicting information</option></select></label>
          <label>Medication reconciliation<select value={record.medicationReconciliationStatus} onChange={(event) => update({ medicationReconciliationStatus: event.target.value as NursingStageProps["record"]["medicationReconciliationStatus"] })}><option>Complete and verified</option><option>Complete, partially verified</option><option>Incomplete, pending</option><option>Unable to complete</option></select></label>
          <label>Allergies and reactions<textarea value={record.allergiesSummary} onChange={(event) => update({ allergiesSummary: event.target.value })} /></label>
          <label>Medication list<textarea value={listText(record.medicationList)} onChange={(event) => updateList("medicationList", event.target.value)} placeholder="One medication or item per line" /></label>
          <label>Medication open items<textarea value={record.medicationOpenItems} onChange={(event) => update({ medicationOpenItems: event.target.value })} /></label>
          <label>Current intoxication findings<textarea value={record.intoxicationFindings} onChange={(event) => update({ intoxicationFindings: event.target.value })} /></label>
          <label>Current withdrawal findings<textarea value={record.withdrawalFindings} onChange={(event) => update({ withdrawalFindings: event.target.value })} /></label>
          <label>Overdose history/recent event<textarea value={record.overdoseHistory} onChange={(event) => update({ overdoseHistory: event.target.value })} /></label>
          <label>Withdrawal management<select value={record.withdrawalManagement} onChange={(event) => update({ withdrawalManagement: event.target.value as NursingStageProps["record"]["withdrawalManagement"] })}><option>None identified</option><option>Monitor in current setting</option><option>Urgent provider evaluation</option><option>Specialty withdrawal management</option><option>Emergency medical transfer</option><option>Unable to determine</option></select></label>
        </div>
        <fieldset className="nursing-source-options"><legend>Medication sources</legend>{nursingSourceOptions.map((source) => <label key={`med-${source}`}><input type="checkbox" checked={record.medicationSources.includes(source)} onChange={() => update({ medicationSources: record.medicationSources.includes(source) ? record.medicationSources.filter((item) => item !== source) : [...record.medicationSources, source] })} />{source}</label>)}</fieldset>
      </section>

      <section className="nursing-section">
        <div className="panel-title"><h3>4. Function, nursing mental status, and risk reassessment</h3><p>Document observations and recommendations. Final orders remain with authorized clinicians.</p></div>
        <div className="compact-form-grid">
          <label>Pregnancy/reproductive status<select value={record.pregnancyStatus} onChange={(event) => update({ pregnancyStatus: event.target.value as NursingStageProps["record"]["pregnancyStatus"] })}><option>Pregnant</option><option>Not pregnant</option><option>Possible</option><option>Unknown</option><option>Not applicable</option><option>Declined</option></select></label>
          <label>Nutrition and hydration<textarea value={record.nutritionHydration} onChange={(event) => update({ nutritionHydration: event.target.value })} /></label>
          <label>Sleep pattern<textarea value={record.sleepPattern} onChange={(event) => update({ sleepPattern: event.target.value })} /></label>
          <label>ADL status<textarea value={record.adlStatus} onChange={(event) => update({ adlStatus: event.target.value })} /></label>
          <label>Mobility and fall risk<textarea value={record.mobilityAndFallRisk} onChange={(event) => update({ mobilityAndFallRisk: event.target.value })} /></label>
        </div>
        <div className="form-grid nursing-mental-status-grid">
          <label>Appearance and hygiene<textarea value={record.nursingMentalStatus.appearance} onChange={(event) => updateMentalStatus({ appearance: event.target.value })} /></label>
          <label>Behavior and psychomotor activity<textarea value={record.nursingMentalStatus.behavior} onChange={(event) => updateMentalStatus({ behavior: event.target.value })} /></label>
          <label>Speech<textarea value={record.nursingMentalStatus.speech} onChange={(event) => updateMentalStatus({ speech: event.target.value })} /></label>
          <label>Mood, person reported<textarea value={record.nursingMentalStatus.mood} onChange={(event) => updateMentalStatus({ mood: event.target.value })} /></label>
          <label>Affect<textarea value={record.nursingMentalStatus.affect} onChange={(event) => updateMentalStatus({ affect: event.target.value })} /></label>
          <label>Thought process/content<textarea value={`${record.nursingMentalStatus.thoughtProcess}\n${record.nursingMentalStatus.thoughtContent}`} onChange={(event) => updateMentalStatus({ thoughtProcess: event.target.value, thoughtContent: "" })} /></label>
          <label>Perception<textarea value={record.nursingMentalStatus.perception} onChange={(event) => updateMentalStatus({ perception: event.target.value })} /></label>
          <label>Orientation, attention, memory<textarea value={record.nursingMentalStatus.orientationAttentionMemory} onChange={(event) => updateMentalStatus({ orientationAttentionMemory: event.target.value })} /></label>
          <label>Insight, judgment, impulse control<textarea value={record.nursingMentalStatus.insightJudgmentImpulseControl} onChange={(event) => updateMentalStatus({ insightJudgmentImpulseControl: event.target.value })} /></label>
        </div>
        <div className="form-grid">
          <label>Suicide/self-harm reassessment<textarea value={record.suicideSelfHarmReassessment} onChange={(event) => update({ suicideSelfHarmReassessment: event.target.value })} /></label>
          <label>Violence/aggression reassessment<textarea value={record.violenceAggressionReassessment} onChange={(event) => update({ violenceAggressionReassessment: event.target.value })} /></label>
          <label>Vulnerability/elopement reassessment<textarea value={record.vulnerabilityElopementReassessment} onChange={(event) => update({ vulnerabilityElopementReassessment: event.target.value })} /></label>
          <label>Risk summary<textarea value={record.riskSummary} onChange={(event) => update({ riskSummary: event.target.value })} /></label>
          <label>Observation recommendation<select value={record.observationRecommendation} onChange={(event) => update({ observationRecommendation: event.target.value as NursingStageProps["record"]["observationRecommendation"] })}><option>Routine</option><option>Increased observation</option><option>Continuous observation recommendation</option><option>Unable to determine</option></select></label>
          <label>Authorized order status<select value={record.authorizedOrderStatus} onChange={(event) => update({ authorizedOrderStatus: event.target.value as NursingStageProps["record"]["authorizedOrderStatus"] })}><option>Ordered</option><option>Pending provider review</option><option>Not ordered</option><option>Not applicable</option></select></label>
          <label>Recommended precautions<textarea value={listText(record.recommendedPrecautions)} onChange={(event) => updateList("recommendedPrecautions", event.target.value)} placeholder="One precaution per line" /></label>
          <label>Education and understanding<textarea value={record.educationAndUnderstanding} onChange={(event) => update({ educationAndUnderstanding: event.target.value })} /></label>
          <label>Nursing referrals/consults<textarea value={listText(record.referralsOrConsults)} onChange={(event) => updateList("referralsOrConsults", event.target.value)} placeholder="One referral per line" /></label>
          <label className="span-2">Nursing assessment summary<textarea value={record.nursingSummary} onChange={(event) => update({ nursingSummary: event.target.value })} /></label>
        </div>
      </section>

      <section className="nursing-section">
        <div className="panel-title"><h3>5. Provenance, conflicts, and RN attestation</h3><p>Selected sources are visible to downstream reviewers. Corrections create a new version.</p></div>
        <fieldset className="nursing-source-options"><legend>Source references</legend>{state.sourceReferences.filter((item) => item.caseId === record.caseId).map((source) => <label key={source.id}><input type="checkbox" checked={record.sourceReferenceIds.includes(source.id)} onChange={() => toggleReference(source.id)} />{source.label} <span className="subtext">{source.type}</span></label>)}{!state.sourceReferences.some((item) => item.caseId === record.caseId) ? <p className="inline-warning">No source references are attached yet. Add a source-linked record before treating Stage 2 as complete.</p> : null}</fieldset>
        <label>Conflict or reconciliation notes<textarea value={record.conflictNotes.join("\n")} onChange={(event) => update({ conflictNotes: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean) })} placeholder="One unresolved conflict per line" /></label>
        <div className="nursing-attestation-row">
          <label>Record status<select value={record.status} onChange={(event) => update({ status: event.target.value as NursingAssessmentRecord["status"] })}><option>In progress</option><option>Needs review</option><option>Safety interrupt</option><option>Complete</option><option>Amendment in progress</option></select></label>
          <label className="checkbox-label"><input type="checkbox" checked={record.completionAttestation} onChange={(event) => update({ completionAttestation: event.target.checked })} />RN attestation recorded</label>
          {record.status === "Complete" ? <button className="secondary-button" type="button" onClick={() => update({ status: "Amendment in progress", completionAttestation: false })}>Start amendment</button> : null}
        </div>
        {!complete ? <p className="inline-warning">Stage 2 cannot count as complete until the RN attestation, handoff review, reconciliation state, medical stability, medication reconciliation, and conflict queue are resolved.</p> : <p className="success-note">Stage 2 is complete for this synthetic case. Later corrections must preserve this version and append an amendment.</p>}
      </section>
    </div>
  );
}
