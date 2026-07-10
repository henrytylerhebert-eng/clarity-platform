import { FormEvent, useState } from "react";
import type { AppState, Case, Encounter } from "../domain/types";

export function NewCase({ onCreate }: { onCreate: (caseRecord: Case, encounter: Encounter, presentingConcern: string, briefNarrative: string) => void | Promise<void> }) {
  const [displayName, setDisplayName] = useState("New Demo Case");
  const [ageBand, setAgeBand] = useState<Case["patientToken"]["ageBand"]>("Adult");
  const [location, setLocation] = useState("Referral call");
  const [referralSource, setReferralSource] = useState("Family/self referral");
  const [presentingConcern, setPresentingConcern] = useState("New referral captured. Clinical screening can begin while benefits remain unknown.");
  const [briefNarrative, setBriefNarrative] = useState("Unknown");
  const [legalStatus, setLegalStatus] = useState<Case["legalStatus"]>("Unknown");
  const [insuranceStatus, setInsuranceStatus] = useState<Encounter["insuranceStatus"]>("Unknown");
  const [priority, setPriority] = useState<Case["priority"]>("Urgent");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = `case-${Date.now()}`;
    const openedAt = new Date().toISOString();
    onCreate(
      {
        id,
        patientToken: { id: `pt-${Date.now()}`, displayName, ageBand, location },
        currentStage: "Referral",
        priority,
        openedAt,
        assignedOwner: "Intake Coordinator",
        legalStatus,
        packetCompleteness: 12,
        routingStatus: "Draft",
      },
      {
        id: `enc-${Date.now()}`,
        caseId: id,
        mode: "Field",
        startedAt: openedAt,
        referralSource,
        insuranceStatus,
      },
      presentingConcern,
      briefNarrative,
    );
  }

  return (
    <section className="panel">
      <div className="panel-title">
        <h2>New Case</h2>
        <p>Creates a fake case and starts the clinical lane even when insurance is unknown.</p>
      </div>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Patient token
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
        </label>
        <label>
          Age band
          <select value={ageBand} onChange={(event) => setAgeBand(event.target.value as AppState["cases"][number]["patientToken"]["ageBand"])}>
            <option>Adult</option>
            <option>Geriatric</option>
            <option>Youth</option>
            <option>Unknown</option>
          </select>
        </label>
        <label>
          Current location
          <input value={location} onChange={(event) => setLocation(event.target.value)} />
        </label>
        <label>
          Referral source
          <input value={referralSource} onChange={(event) => setReferralSource(event.target.value)} />
        </label>
        <label className="span-2">
          Presenting concern
          <textarea value={presentingConcern} onChange={(event) => setPresentingConcern(event.target.value)} />
        </label>
        <label>
          Legal status
          <select value={legalStatus} onChange={(event) => setLegalStatus(event.target.value as Case["legalStatus"])}>
            <option>Unknown</option>
            <option>Voluntary</option>
            <option>OPC</option>
            <option>PEC</option>
            <option>CEC</option>
            <option>Court committed</option>
          </select>
        </label>
        <label>
          Insurance status
          <select value={insuranceStatus} onChange={(event) => setInsuranceStatus(event.target.value as Encounter["insuranceStatus"])}>
            <option>Unknown</option>
            <option>Pending verification</option>
            <option>Verified</option>
            <option>Not provided</option>
          </select>
        </label>
        <label>
          Priority
          <select value={priority} onChange={(event) => setPriority(event.target.value as Case["priority"])}>
            <option>Routine</option>
            <option>Urgent</option>
            <option>Emergent</option>
          </select>
        </label>
        <label className="span-2">
          Brief narrative
          <textarea value={briefNarrative} onChange={(event) => setBriefNarrative(event.target.value)} />
        </label>
        <button className="primary-button" type="submit">Create case</button>
      </form>
    </section>
  );
}
