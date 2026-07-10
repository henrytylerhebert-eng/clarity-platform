import { AlertCircle } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import type { MedicalNecessitySnapshot } from "../domain/types";
import { findProhibitedLanguage } from "../domain/guardrails";

export function MedicalNecessity({ snapshot, onChange }: { snapshot?: MedicalNecessitySnapshot; onChange: (snapshot: MedicalNecessitySnapshot) => void }) {
  if (!snapshot) {
    return (
      <section className="panel">
        <h2>Medical Necessity</h2>
        <p>No draft exists for this case yet. This v0.1 prototype does not certify medical necessity.</p>
      </section>
    );
  }

  const prohibited = findProhibitedLanguage(snapshot.draftNarrative);

  return (
    <section className="panel">
      <div className="panel-title">
        <h2>Medical Necessity</h2>
        <p>The documentation may support clinician review for inpatient level of care. Draft for clinician review. No proprietary criteria claims.</p>
      </div>
      <div className="grid-two">
        <div>
          <h3>Documented risk of harm</h3>
          <ul className="check-list">
            {snapshot.severityEvidence.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <h3>Documented functional impairment</h3>
          <ul className="check-list">
            {snapshot.functionalImpairment.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <h3>Documented treatment history</h3>
          <p>{snapshot.lowerLevelConsidered || "Unknown"}</p>
        </div>
        <div>
          <h3>Missing facts</h3>
          <ul className="check-list missing">
            {snapshot.missingItems.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <h3>Documented environmental stressors</h3>
          <p>See structured assessment. Missing details remain labeled Unknown, Not assessed, or No measurements found.</p>
          <h3>Documented engagement/supports</h3>
          <p>See collateral and protective-factor fields. Insurance status never blocks clinical workflow.</p>
        </div>
      </div>
      <label className="full-label">
        Draft narrative
        <textarea
          value={snapshot.draftNarrative}
          onChange={(event) => onChange({ ...snapshot, draftNarrative: event.target.value })}
        />
      </label>
      <div className="review-bar">
        <StatusBadge tone="warn">{snapshot.reviewStatus}</StatusBadge>
        {prohibited.length ? (
          <span className="inline-warning"><AlertCircle size={16} /> Prohibited criteria language detected.</span>
        ) : (
          <span>Language scan clear for prohibited criteria claims.</span>
        )}
      </div>
    </section>
  );
}
