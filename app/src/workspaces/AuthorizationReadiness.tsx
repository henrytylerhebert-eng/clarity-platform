import { ClipboardCheck } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import {
  GAP_LABELS,
  assessAuthorizationReadiness,
  deriveCoverage,
  type AuthorizationStatus,
} from "../domain/services";
import type { WorkspaceId } from "../domain/roles";

interface Props {
  caseId: string;
  onNavigateWorkspace: (workspace: WorkspaceId) => void;
}

function statusTone(status: AuthorizationStatus): "info" | "warn" | "danger" | "good" {
  if (status === "APPROVED" || status === "NOT_REQUIRED") return "good";
  if (status === "DENIED" || status === "UNABLE_TO_COMPLETE") return "danger";
  if (status === "PARTIALLY_APPROVED") return "warn";
  return "info";
}

export function AuthorizationReadiness({ caseId, onNavigateWorkspace }: Props) {
  const coverage = deriveCoverage(caseId);
  const readiness = assessAuthorizationReadiness(coverage);

  return (
    <section className="panel">
      <div className="panel-title">
        <div className="icon-title"><ClipboardCheck size={18} /><h2>Authorization Readiness</h2></div>
        <p>
          What still stands between this case and a submittable authorization request. Readiness
          reports; it does not gate — an unmet item here never blocks clinical review, placement, or
          transport.
        </p>
      </div>

      <article className="subtle-panel">
        <div className="stage-summary-head">
          <h3>{coverage.payerName}</h3>
          <StatusBadge tone={statusTone(readiness.status)}>{readiness.status.replace(/_/g, " ").toLowerCase()}</StatusBadge>
        </div>
        {readiness.gaps.length === 0 ? (
          <p className="subtext-good">No outstanding readiness gaps — an authorization request can be prepared.</p>
        ) : (
          <ul className="gap-list">
            {readiness.gaps.map((gap) => (
              <li key={gap}>
                <StatusBadge tone="warn">open</StatusBadge>
                <span>{GAP_LABELS[gap]}</span>
              </li>
            ))}
          </ul>
        )}
      </article>

      {coverage.coverageStatus === "UNABLE_TO_VERIFY" ? (
        <p className="inline-warning">
          Coverage could not be verified, so authorization cannot be completed through a payer. Route
          this case through the self-pay / financial-counseling path instead.
        </p>
      ) : null}

      <button className="secondary-button" type="button" onClick={() => onNavigateWorkspace("benefits")}>
        Review coverage &amp; benefit quote
      </button>
    </section>
  );
}
