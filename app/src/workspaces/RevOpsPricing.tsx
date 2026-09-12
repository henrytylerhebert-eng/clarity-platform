import { useState } from "react";
import type { RevOpsContractRate, RevOpsPaymentMethod, RevOpsPayerKind, RevOpsPricingResult } from "../../../packages/domain-contracts/src/revOpsPricing";
import {
  calculateContractScenario,
  calculateIpfBaseComponent,
  calculateLaInpatientScenario,
  dollarsToCents,
  LA_INPATIENT_RELEASES,
  validateContractRate,
} from "../../../packages/rev-ops-service/src/pricing";

const money = (cents: number) => (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
const providers = [...new Map(LA_INPATIENT_RELEASES.flatMap(release => release.rows).map(row => [row.providerId, row.facilityName])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
const initialContract = {
  payer: "Dunder demo payer", payerKind: "commercial" as RevOpsPayerKind, plan: "Example PPO",
  network: "In network", funding: "Fully insured", facility: "Dunder Mifflin Hospital",
  program: "Inpatient psychiatry", method: "perDiem" as RevOpsPaymentMethod,
  effectiveFrom: "2026-01-01", effectiveThrough: "2026-12-31", sourceReference: "User-entered synthetic example",
};

function PricingOutput({ value }: { value: RevOpsPricingResult | null }) {
  if (!value) return <p>Enter a scenario and calculate to see the amount and source trace.</p>;
  return <div aria-live="polite">
    <h3>{value.status === "unpriced" ? "Unpriced" : value.status === "componentOnly" ? "Base component" : "Scenario subtotal"}: {value.amountCents === null ? "Unknown" : money(value.amountCents)}</h3>
    <p>{value.financialMeaning}</p>
    {value.reasons.map(reason => <p key={reason}>{reason}</p>)}
    {value.lines.length > 0 && <div className="ro-table-wrap"><table>
      <thead><tr><th scope="col">Calculation</th><th scope="col">Units</th><th scope="col">Unit rate</th><th scope="col">Subtotal</th><th scope="col">Source</th></tr></thead>
      <tbody>{value.lines.map((line, index) => <tr key={index}><td>{line.label}</td><td>{line.units}</td><td>{money(line.unitRateCents)}</td><td>{money(line.amountCents)}</td><td>{line.source.sourceUrl ? <a href={line.source.sourceUrl} target="_blank" rel="noreferrer">{line.source.releaseId}</a> : line.source.releaseId}<br />{line.source.locator}</td></tr>)}</tbody>
    </table></div>}
    <details><summary>Calculation inputs and source evidence</summary><pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{JSON.stringify(value, null, 2)}</pre></details>
    <button type="button" onClick={() => {
      const url = URL.createObjectURL(new Blob([JSON.stringify({ scenarioOnly: true, exportedAt: new Date().toISOString(), ...value }, null, 2)], { type: "application/json" }));
      const link = document.createElement("a"); link.href = url; link.download = "revops-payment-scenario.json"; link.click(); URL.revokeObjectURL(url);
    }}>Export scenario and evidence</button>
  </div>;
}

/** Scenario tools intentionally do not save a real provider binding or post ledger amounts. */
export function RevOpsPricing() {
  const [mode, setMode] = useState<"medicaid" | "contract" | "medicare">("medicaid");
  const [providerId, setProviderId] = useState("");
  const [rateType, setRateType] = useState("Free Standing Psychiatric");
  const [firstDate, setFirstDate] = useState("2026-06-30");
  const [lastDate, setLastDate] = useState("2026-07-01");
  const [coverage, setCoverage] = useState<"feeForService" | "managedCare">("feeForService");
  const [contract, setContract] = useState(initialContract);
  const [rateAmount, setRateAmount] = useState("");
  const [rates, setRates] = useState<RevOpsContractRate[]>([]);
  const [activeRateId, setActiveRateId] = useState("");
  const [contractDate, setContractDate] = useState("2026-07-01");
  const [units, setUnits] = useState("1");
  const [charges, setCharges] = useState("");
  const [contractError, setContractError] = useState("");
  const [dischargeDate, setDischargeDate] = useState("2026-09-30");
  const [wageIndex, setWageIndex] = useState("");
  const [quality, setQuality] = useState<"compliant" | "reduced">("compliant");
  const [output, setOutput] = useState<RevOpsPricingResult | null>(null);
  const rateTypes = [...new Set(LA_INPATIENT_RELEASES.flatMap(release => release.rows).filter(row => !providerId || row.providerId === providerId).map(row => row.rateType))].sort();
  const selectedRate = rates.find(rate => rate.id === activeRateId);

  return <section aria-labelledby="payment-model-heading">
    <h2 id="payment-model-heading">Payment scenarios</h2>
    <p>Calculate published Louisiana inpatient per diems, enter payer-specific terms, or inspect the Medicare base component. These calculations use synthetic activity. Scenarios stay in this session; export a result to retain its inputs and source evidence.</p>
    <p>The real Louisiana hospital profile is awaiting your provider identifiers. Choosing a public reference provider below does not set that profile.</p>
    <label>Payment method workspace<select value={mode} onChange={event => { setMode(event.target.value as typeof mode); setOutput(null); }}>
      <option value="medicaid">Louisiana Medicaid inpatient</option><option value="contract">Commercial and managed-plan terms</option><option value="medicare">Medicare IPF base component</option>
    </select></label>
    {mode === "medicaid" && <>
      <p>1,126 public active-provider rows across the July 2025 and July 2026 releases. Eligible date intervals crossing July 1 use each applicable release. Missing or conflicting rows remain unpriced.</p>
      <form className="ro-form" onSubmit={event => { event.preventDefault(); setOutput(calculateLaInpatientScenario({ providerId, rateType, firstEligibleDate: firstDate, lastEligibleDate: lastDate, coverage })); }}>
        <label>Reference provider (scenario only)<select value={providerId} onChange={event => {
          const id = event.target.value; setProviderId(id); setOutput(null);
          const available = LA_INPATIENT_RELEASES.flatMap(release => release.rows).filter(row => row.providerId === id);
          setRateType(available.find(row => row.rateType.includes("Psychiatric"))?.rateType ?? available[0]?.rateType ?? "");
        }}><option value="">Select an exact Medicaid provider</option>{providers.map(([id, name]) => <option key={id} value={id}>{id} — {name}</option>)}</select></label>
        <label>Covered rate type<select value={rateType} onChange={event => { setRateType(event.target.value); setOutput(null); }}>{rateTypes.map(type => <option key={type}>{type}</option>)}</select></label>
        <label>Payment relationship<select value={coverage} onChange={event => { setCoverage(event.target.value as typeof coverage); setOutput(null); }}><option value="feeForService">Fee for service</option><option value="managedCare">Managed care (requires contract)</option></select></label>
        <label>First eligible service day<input type="date" value={firstDate} onChange={event => { setFirstDate(event.target.value); setOutput(null); }} /></label>
        <label>Last eligible service day (inclusive)<input type="date" value={lastDate} onChange={event => { setLastDate(event.target.value); setOutput(null); }} /></label>
        <button type="submit">Calculate published per-diem subtotal</button>
      </form>
    </>}
    {mode === "contract" && <>
      <p>Add distinct payer, plan, network, funding and effective-date terms. No commercial prices are preloaded. These examples support flat per-diem, service, case and percentage-of-charges methods; complex terms need their own calculation method.</p>
      <details open={rates.length === 0}><summary>Add a synthetic contract version</summary>
        <form className="ro-form" onSubmit={event => {
          event.preventDefault();
          const amount = dollarsToCents(rateAmount);
          const next: RevOpsContractRate = { ...contract, id: `scenario-rate-${rates.length + 1}`, unitRateCents: contract.method === "percentCharges" ? null : amount, percentBasisPoints: contract.method === "percentCharges" ? amount : null, provenance: "synthetic" };
          const errors = validateContractRate(next);
          if (errors.length) { setContractError(errors.join(" ")); return; }
          setRates([...rates, next]); setActiveRateId(next.id); setContractError(""); setOutput(null);
        }}>
          {(["payer", "plan", "network", "funding", "facility", "program", "sourceReference"] as const).map(field => <label key={field}>{({ payer: "Payer", plan: "Plan / product", network: "Network", funding: "Funding / ASO", facility: "Facility", program: "Program", sourceReference: "Source / example reference" })[field]}<input required value={contract[field]} onChange={event => setContract({ ...contract, [field]: event.target.value })} /></label>)}
          <label>Payer distinction<select value={contract.payerKind} onChange={event => setContract({ ...contract, payerKind: event.target.value as RevOpsPayerKind })}><option value="commercial">Commercial</option><option value="medicareAdvantage">Medicare Advantage</option><option value="medicaidManagedCare">Medicaid managed care</option></select></label>
          <label>Payment basis<select value={contract.method} onChange={event => setContract({ ...contract, method: event.target.value as RevOpsPaymentMethod })}><option value="perDiem">Per eligible day</option><option value="perService">Per eligible service</option><option value="perCase">Per eligible case</option><option value="percentCharges">Percentage of charges</option></select></label>
          <label>{contract.method === "percentCharges" ? "Percentage (0–100)" : "Rate (USD per unit)"}<input inputMode="decimal" placeholder="Enter an example amount" value={rateAmount} onChange={event => setRateAmount(event.target.value)} /></label>
          <label>Effective from<input type="date" value={contract.effectiveFrom} onChange={event => setContract({ ...contract, effectiveFrom: event.target.value })} /></label>
          <label>Effective through (inclusive)<input type="date" value={contract.effectiveThrough} onChange={event => setContract({ ...contract, effectiveThrough: event.target.value })} /></label>
          <button type="submit">Add contract version to scenario</button>
        </form>
        {contractError && <p role="alert">{contractError}</p>}
      </details>
      {rates.length > 0 && <form className="ro-form" onSubmit={event => {
        event.preventDefault(); if (!selectedRate) return;
        setOutput(calculateContractScenario(rates, { ...selectedRate, serviceDate: contractDate, units: units.trim() ? Number(units) : null, chargesCents: dollarsToCents(charges) }));
      }}>
        <label>Terms to model<select value={activeRateId} onChange={event => { setActiveRateId(event.target.value); setOutput(null); }}>{rates.map(rate => <option key={rate.id} value={rate.id}>{rate.payer} / {rate.plan} / {rate.network} — {rate.effectiveFrom} to {rate.effectiveThrough} ({rate.id})</option>)}</select></label>
        <label>Pricing date (all units use this date)<input type="date" value={contractDate} onChange={event => { setContractDate(event.target.value); setOutput(null); }} /></label>
        {selectedRate?.method === "percentCharges" ? <label>Entered charges (USD)<input inputMode="decimal" value={charges} onChange={event => { setCharges(event.target.value); setOutput(null); }} /></label> : <label>Eligible units<input type="number" min="0" max="100000" step="1" value={units} onChange={event => { setUnits(event.target.value); setOutput(null); }} /></label>}
        <button type="submit">Calculate contract scenario</button>
      </form>}
    </>}
    {mode === "medicare" && <>
      <p>CMS FY2026 published bases: $892.87 (quality compliant) and $875.44 (reporting reduction). This tool calculates only the wage-adjusted federal base component. Full IPF, FY2027, OPPS/IOP and SBH calculations remain unavailable.</p>
      <form className="ro-form" onSubmit={event => { event.preventDefault(); setOutput(calculateIpfBaseComponent({ dischargeDate, wageIndex, qualityReporting: quality })); }}>
        <label>Discharge date<input type="date" value={dischargeDate} onChange={event => { setDischargeDate(event.target.value); setOutput(null); }} /></label>
        <label>Scenario wage index<input inputMode="decimal" placeholder="Enter verified or hypothetical index" value={wageIndex} onChange={event => { setWageIndex(event.target.value); setOutput(null); }} /></label>
        <label>Quality-reporting branch<select value={quality} onChange={event => { setQuality(event.target.value as typeof quality); setOutput(null); }}><option value="compliant">Compliant</option><option value="reduced">Reporting reduction</option></select></label>
        <button type="submit">Calculate base component</button>
      </form>
    </>}
    <PricingOutput value={output} />
  </section>;
}

export default RevOpsPricing;
