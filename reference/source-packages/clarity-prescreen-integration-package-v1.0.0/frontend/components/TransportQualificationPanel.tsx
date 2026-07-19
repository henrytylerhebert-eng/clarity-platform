// Proposed and unverified. Qualification must come from the server.
export interface QualifiedProviderView {
  providerId: string;
  legalName: string;
  category: string;
  qualificationStatus: "QUALIFIED" | "CONDITIONAL" | "NOT_QUALIFIED";
  conditions: string[];
  disqualifiers: string[];
  verifiedAt: string;
}

export function TransportQualificationPanel({ providers, onSelect }: { providers: QualifiedProviderView[]; onSelect(id: string): void }) {
  if (providers.length === 0) return <p role="status">No qualified transport providers found. Contact the transport coordinator.</p>;
  return (
    <section aria-labelledby="transport-provider-heading">
      <h2 id="transport-provider-heading">Transport provider qualification</h2>
      <p>Provider eligibility reflects the current rule and credential snapshot. Dispatch must recheck current status.</p>
      <ul>
        {providers.map((provider) => (
          <li key={provider.providerId}>
            <h3>{provider.legalName}</h3>
            <p>{provider.category} — {provider.qualificationStatus}</p>
            <p>Verified: {new Date(provider.verifiedAt).toLocaleString()}</p>
            {provider.conditions.length > 0 && <p>Conditions: {provider.conditions.join(", ")}</p>}
            {provider.disqualifiers.length > 0 && <p>Not qualified because: {provider.disqualifiers.join(", ")}</p>}
            <button disabled={provider.qualificationStatus === "NOT_QUALIFIED"} onClick={() => onSelect(provider.providerId)}>
              Select provider
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
