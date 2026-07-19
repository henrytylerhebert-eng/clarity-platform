import { useState } from "react";
import { StatusBadge } from "../components/StatusBadge";
import {
  getOperationsPayerProfile,
  OPERATIONS_PAYER_CANONICAL_REFERENCES,
  OPERATIONS_PAYER_CONFIGURATION_PROFILES,
  type OperationsPayerProfileId,
} from "../domain/payerProfiles";

interface Props {
  initialProfileId?: OperationsPayerProfileId | null;
}

const approvalItems = [
  "Profile fields",
  "Profile-specific source references",
  "Escalation language",
  "VA representation in the shared coverage contract",
] as const;

export function PayerProfileWalkthrough({ initialProfileId }: Props) {
  const [selectedProfileId, setSelectedProfileId] = useState<OperationsPayerProfileId>(initialProfileId ?? "medicare");
  const profile = getOperationsPayerProfile(selectedProfileId);

  return (
    <article className="subtle-panel payer-profile-walkthrough">
      <div className="stage-summary-head">
        <div>
          <h3>Operations payer profile walkthrough</h3>
          <span className="subtext">Read-only discovery view; selecting a profile does not change the case.</span>
        </div>
        <StatusBadge tone="warn">Discovery only</StatusBadge>
      </div>

      <div className="payer-profile-tabs" role="tablist" aria-label="Operations payer profiles">
        {OPERATIONS_PAYER_CONFIGURATION_PROFILES.map((item) => (
          <button
            className={`payer-profile-tab${item.id === selectedProfileId ? " active" : ""}`}
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === selectedProfileId}
            onClick={() => setSelectedProfileId(item.id)}
          >
            {item.coverageTypeLabel}
          </button>
        ))}
      </div>

      <div className="payer-profile-detail" role="tabpanel">
        <div className="stage-summary-head">
          <div>
            <h4>{profile.label}</h4>
            <span className="subtext">Coverage vocabulary: {profile.coverageTypes.join(", ")}</span>
          </div>
          <StatusBadge tone="warn">{profile.reviewStatus}</StatusBadge>
        </div>

        <div className="kv-grid">
          <span className="label">Configuration version</span><span>{profile.version}</span>
          <span className="label">Escalation language</span><span>{profile.escalationLanguage}</span>
        </div>

        <div className="payer-profile-columns">
          <div>
            <h5>Reviewer prompts</h5>
            <ul className="check-list">
              {profile.verificationPrompts.map((prompt) => <li key={prompt}>{prompt}</li>)}
            </ul>
          </div>
          <div>
            <h5>Approval checklist</h5>
            <ul className="payer-profile-checklist">
              {approvalItems.map((item) => (
                <li key={item}><StatusBadge tone="warn">pending</StatusBadge><span>{item}</span></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="payer-profile-references">
          <h5>Canonical references reviewed</h5>
          <ul className="check-list">
            {OPERATIONS_PAYER_CANONICAL_REFERENCES.map((reference) => <li key={reference}>{reference}</li>)}
          </ul>
          <p className="benefit-disclaimer">
            These contracts govern the POC boundary. Profile-specific payer sources and owner approval
            are still required before backend PayerProfile or PlanProfile persistence.
          </p>
        </div>
      </div>
    </article>
  );
}
