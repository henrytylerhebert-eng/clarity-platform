import { ShieldCheck } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { BENEFIT_DISCLAIMER, deriveCoverage, type CoverageSnapshot } from "../domain/services";

interface Props {
  caseId: string;
}

function coverageTone(status: CoverageSnapshot["coverageStatus"]): "info" | "warn" | "danger" | "good" {
  if (status === "ACTIVE") return "good";
  if (status === "INACTIVE" || status === "UNABLE_TO_VERIFY") return "danger";
  if (status === "UNCLEAR") return "warn";
  return "info";
}

function eligibilityTone(status: CoverageSnapshot["eligibilityStatus"]): "info" | "warn" | "danger" | "good" {
  if (status === "ACTIVE_CONFIRMED") return "good";
  if (status === "FAILED" || status === "INACTIVE") return "danger";
  if (status === "UNCLEAR") return "warn";
  return "info";
}

export function BenefitsVerification({ caseId }: Props) {
  const coverage = deriveCoverage(caseId);

  return (
    <section className="panel">
      <div className="panel-title">
        <div className="icon-title"><ShieldCheck size={18} /><h2>Benefits Verification</h2></div>
        <p>
          The financial lane runs in parallel and never blocks the clinical lane. Verification is a
          human workflow — a person contacts the payer and records what they were told, with the
          method and timestamp attached.
        </p>
      </div>

      <article className="subtle-panel">
        <div className="stage-summary-head">
          <h3>{coverage.payerName} — {coverage.planName}</h3>
          <StatusBadge tone={coverageTone(coverage.coverageStatus)}>
            {coverage.coverageStatus.replace(/_/g, " ").toLowerCase()}
          </StatusBadge>
        </div>
        <div className="kv-grid">
          <span className="label">Coverage order</span><span>{coverage.coverageOrder}</span>
          <span className="label">Coverage type</span><span>{coverage.coverageType.replace(/_/g, " ")}</span>
          <span className="label">Eligibility</span>
          <span>
            <StatusBadge tone={eligibilityTone(coverage.eligibilityStatus)}>
              {coverage.eligibilityStatus.replace(/_/g, " ").toLowerCase()}
            </StatusBadge>
          </span>
          <span className="label">Method</span><span>{coverage.verificationMethod.replace(/_/g, " ").toLowerCase()}</span>
          <span className="label">Verified by</span>
          <span>
            {coverage.verifiedBy ?? "Not yet verified"}
            {coverage.verifiedAt ? ` · ${new Date(coverage.verifiedAt).toLocaleString()}` : ""}
          </span>
        </div>
      </article>

      {coverage.benefitQuote ? (
        <article className="subtle-panel">
          <h3>Benefit quote</h3>
          <div className="kv-grid">
            <span className="label">Deductible remaining</span><span>{coverage.benefitQuote.deductibleRemaining}</span>
            <span className="label">Coinsurance</span><span>{coverage.benefitQuote.coinsurance}</span>
            <span className="label">Prior authorization</span>
            <span>
              <StatusBadge tone={coverage.benefitQuote.priorAuthRequired === "UNKNOWN" ? "warn" : "info"}>
                {coverage.benefitQuote.priorAuthRequired.replace(/_/g, " ").toLowerCase()}
              </StatusBadge>
            </span>
          </div>
          <p className="benefit-disclaimer">{BENEFIT_DISCLAIMER}</p>
        </article>
      ) : (
        <article className="subtle-panel">
          <h3>No benefit quote captured</h3>
          <p>
            Coverage has not been verified with the payer yet, so no quote exists to display. This does
            not hold up clinical review or placement.
          </p>
        </article>
      )}
    </section>
  );
}
