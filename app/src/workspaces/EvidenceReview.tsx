import { FileSearch, GitCompareArrows } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { buildEvidenceLedger, detectContradictions, type EvidenceItem, type EvidenceStatus } from "../domain/services";
import type { AppState } from "../domain/types";

interface Props {
  state: AppState;
  caseId: string;
}

function statusTone(status: EvidenceStatus): "info" | "warn" | "danger" | "good" {
  if (status === "APPROVED") return "good";
  if (status === "REJECTED") return "danger";
  if (status === "NEEDS_CLARIFICATION") return "warn";
  return "info";
}

function EvidenceCard({ item }: { item: EvidenceItem }) {
  return (
    <article className="evidence-card">
      <div className="evidence-card-head">
        <div>
          <b>{item.category}</b>
          <small>{item.severity} severity</small>
        </div>
        <StatusBadge tone={statusTone(item.status)}>{item.status.replace(/_/g, " ").toLowerCase()}</StatusBadge>
      </div>
      <p>{item.summary}</p>
      {item.unsourced ? (
        <p className="inline-warning">
          No source reference is attached. Unsourced items stay candidates — they cannot be approved
          into the record until provenance is supplied.
        </p>
      ) : (
        <ul className="evidence-sources">
          {item.sources.map((source) => (
            <li key={source.id}>
              <span className="source-type">{source.type}</span>
              <span className="source-label">{source.label}</span>
              <em>&ldquo;{source.excerpt}&rdquo;</em>
              <StatusBadge tone={source.confidence === "High" ? "good" : source.confidence === "Needs verification" ? "warn" : "info"}>
                {source.confidence}
              </StatusBadge>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export function EvidenceReview({ state, caseId }: Props) {
  const items = buildEvidenceLedger(state, caseId);
  const contradictions = detectContradictions(items);
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section className="panel">
      <div className="panel-title">
        <div className="icon-title"><FileSearch size={18} /><h2>Evidence Review</h2></div>
        <p>
          Every finding enters review as a candidate with its provenance attached. Nothing is
          auto-approved, and contradictions are surfaced for a human to classify rather than silently
          reconciled.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="empty-state">No risk findings recorded for this case yet. Capture findings in Guided Intake first.</p>
      ) : (
        <>
          <div className="evidence-status-strip">
            {Object.entries(counts).map(([status, count]) => (
              <span key={status}>
                <StatusBadge tone={statusTone(status as EvidenceStatus)}>{count}</StatusBadge>
                {status.replace(/_/g, " ").toLowerCase()}
              </span>
            ))}
          </div>

          {contradictions.length ? (
            <article className="subtle-panel">
              <div className="icon-title"><GitCompareArrows size={16} /><h3>Contradictions to resolve</h3></div>
              <ul className="contradiction-list">
                {contradictions.map((group) => (
                  <li key={group.id}>
                    <StatusBadge tone="warn">{group.classification.replace(/_/g, " ").toLowerCase()}</StatusBadge>
                    <span>{group.summary}</span>
                    <small>{group.memberIds.length} findings in this group — a reviewer classifies and resolves.</small>
                  </li>
                ))}
              </ul>
            </article>
          ) : null}

          <div className="evidence-grid">
            {items.map((item) => <EvidenceCard key={item.id} item={item} />)}
          </div>
        </>
      )}
    </section>
  );
}
