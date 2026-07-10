import { useState } from "react";
import type { AppState, Assessment, RiskFinding, RiskType, SourceReference, SourceType } from "../domain/types";
import { evaluatePitfallGuards } from "../domain/guardrails";
import { StatusBadge } from "../components/StatusBadge";

interface Props {
  state: AppState;
  caseId: string;
  onAssessmentChange: (assessment: Assessment) => void;
  onAddSourceAndRisk: (source: SourceReference, risk: RiskFinding) => void;
}

export function GuidedIntake({ state, caseId, onAssessmentChange, onAddSourceAndRisk }: Props) {
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
      {isFieldMode ? (
        <p className="inline-warning">
          Field mode captures scene facts in plain language. Clinical fields are hidden and stay on the same case record — switch to clinical mode for the full assessment.
        </p>
      ) : null}
      <div className="form-grid">
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
      </div>
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
