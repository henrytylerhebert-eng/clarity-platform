// Proposed and unverified. Map imports and components to the live Clarity app.
type Status = "ORIENTED" | "NOT_ORIENTED" | "UNABLE_TO_ASSESS" | "NOT_ASSESSED" | "UNKNOWN";
type Domain = "person" | "place" | "time" | "situation";

export interface OrientationPanelProps {
  value: Record<Domain, { status: Status; observation?: string }>;
  disabled?: boolean;
  onChange(domain: Domain, status: Status, observation?: string): void;
}

const labels: Record<Domain, string> = {
  person: "Person",
  place: "Place",
  time: "Time",
  situation: "Situation",
};

export function OrientationPanel({ value, disabled = false, onChange }: OrientationPanelProps) {
  const domains = Object.keys(labels) as Domain[];
  const formalVoluntaryGate = domains.every((domain) => value[domain].status === "ORIENTED") ? "PASS" :
    domains.some((domain) => value[domain].status === "NOT_ORIENTED") ? "FAIL" : "UNKNOWN";

  return (
    <fieldset disabled={disabled} aria-describedby="orientation-help orientation-gate">
      <legend>Orientation observation</legend>
      <p id="orientation-help">Record each domain separately. This is an observation, not a capacity determination.</p>
      {domains.map((domain) => (
        <div key={domain}>
          <label htmlFor={`orientation-${domain}`}>{labels[domain]}</label>
          <select
            id={`orientation-${domain}`}
            value={value[domain].status}
            onChange={(event) => onChange(domain, event.target.value as Status, value[domain].observation)}
          >
            <option value="NOT_ASSESSED">Not assessed</option>
            <option value="ORIENTED">Oriented</option>
            <option value="NOT_ORIENTED">Not oriented</option>
            <option value="UNABLE_TO_ASSESS">Unable to assess</option>
            <option value="UNKNOWN">Unknown</option>
          </select>
          <label htmlFor={`orientation-${domain}-observation`}>Supporting observation</label>
          <textarea
            id={`orientation-${domain}-observation`}
            value={value[domain].observation ?? ""}
            onChange={(event) => onChange(domain, value[domain].status, event.target.value)}
          />
        </div>
      ))}
      <p id="orientation-gate" role="status">Formal-voluntary prescreen gate: {formalVoluntaryGate}</p>
    </fieldset>
  );
}
