// Proposed and unverified.
export interface ReviewSummaryProps {
  versionNumber: number;
  willingness: string;
  orientationGate: "PASS" | "FAIL" | "UNKNOWN";
  possiblePathway: string;
  unknowns: string[];
  contradictions: string[];
  sourceCount: number;
  attested: boolean;
}

export function PrescreenReviewSummary(props: ReviewSummaryProps) {
  return (
    <section aria-labelledby="review-summary-heading">
      <h2 id="review-summary-heading">Assessment review</h2>
      <dl>
        <dt>Version</dt><dd>{props.versionNumber}</dd>
        <dt>Patient willingness</dt><dd>{props.willingness}</dd>
        <dt>Formal-voluntary prescreen gate</dt><dd>{props.orientationGate}</dd>
        <dt>Possible pathway for authorized review</dt><dd>{props.possiblePathway}</dd>
        <dt>Sources</dt><dd>{props.sourceCount}</dd>
      </dl>
      <h3>Unknown or not assessed</h3>
      {props.unknowns.length ? <ul>{props.unknowns.map((item) => <li key={item}>{item}</li>)}</ul> : <p>None recorded.</p>}
      <h3>Contradictions</h3>
      {props.contradictions.length ? <ul>{props.contradictions.map((item) => <li key={item}>{item}</li>)}</ul> : <p>None recorded.</p>}
      <p>{props.attested ? "This version is attested and read-only. Create a supplement to change it." : "Review before attestation."}</p>
    </section>
  );
}
