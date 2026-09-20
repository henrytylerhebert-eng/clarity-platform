import { StatusBadge, type StatusBadgeTone } from "./StatusBadge";

export interface CaseHeaderProps {
  readonly caseKey: string;
  readonly phase: string;
  readonly disposition: string;
  readonly dispositionTone: StatusBadgeTone;
  readonly version: number;
  readonly loading: boolean;
  readonly onRefresh: () => void;
}

export function CaseHeader({
  caseKey,
  phase,
  disposition,
  dispositionTone,
  version,
  loading,
  onRefresh,
}: CaseHeaderProps) {
  return (
    <section className="case-status-header" aria-label="Case status summary">
      <div>
        <span className="label">Case status</span>
        <h3>Case {caseKey}</h3>
        <div className="case-status-summary">
          <span>{phase}</span>
          <StatusBadge tone={dispositionTone}>{disposition}</StatusBadge>
        </div>
      </div>
      <div className="case-status-actions">
        <span className="subtext">Version {version}</span>
        <button className="secondary-button" type="button" disabled={loading} onClick={onRefresh}>
          Refresh case
        </button>
      </div>
    </section>
  );
}
