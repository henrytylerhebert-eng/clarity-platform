import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileWarning,
  History,
  Link2,
  MapPinned,
  ShieldAlert,
} from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { getEpisodeProjection, type EpisodeCoverageOutcome, type EpisodeRiskFlagCode } from "../domain/episodeProjection";
import type { Case } from "../domain/types";

interface Props {
  caseRecord: Case;
}

const outcomeLabels: Record<EpisodeCoverageOutcome, string> = {
  APPROVED: "Approved",
  DENIED: "Denied",
  PENDING: "Pending",
  EXPIRED: "Expired",
  UNREQUESTED: "Unrequested",
  UNKNOWN: "Unknown",
  NOT_REQUIRED: "Not required",
};

const outcomeTones: Record<EpisodeCoverageOutcome, "good" | "danger" | "warn" | "info" | "neutral"> = {
  APPROVED: "good",
  DENIED: "danger",
  PENDING: "warn",
  EXPIRED: "danger",
  UNREQUESTED: "warn",
  UNKNOWN: "neutral",
  NOT_REQUIRED: "info",
};

const riskLabels: Record<EpisodeRiskFlagCode, string> = {
  DAY_AT_RISK: "Day at risk",
  DOCUMENTATION_GAP: "Documentation gap",
  EXPIRING_SOON: "Review window ending",
  LATE_REVIEW: "Late review",
  UNKNOWN_COVERAGE: "Unknown coverage",
};

function formatDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(Date.UTC(year!, month! - 1, day!, 12)));
  }
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function outcomeSummary(days: Array<{ outcome: EpisodeCoverageOutcome }>): string {
  const counts = days.reduce<Partial<Record<EpisodeCoverageOutcome, number>>>((result, day) => {
    result[day.outcome] = (result[day.outcome] ?? 0) + 1;
    return result;
  }, {});
  return `${counts.APPROVED ?? 0} approved · ${counts.PENDING ?? 0} pending · ${counts.DENIED ?? 0} denied`;
}

function riskTone(code: EpisodeRiskFlagCode): "warn" | "danger" | "info" {
  if (code === "DAY_AT_RISK" || code === "LATE_REVIEW") return "danger";
  if (code === "DOCUMENTATION_GAP" || code === "EXPIRING_SOON") return "warn";
  return "info";
}

export function EpisodeOperations({ caseRecord }: Props) {
  const projection = getEpisodeProjection(caseRecord.id, caseRecord.patientToken.displayName);
  const approvedDays = projection.episodeDays.filter((day) => day.outcome === "APPROVED").length;
  const flaggedDays = projection.episodeDays.filter((day) => day.riskFlags.length > 0).length;
  const openGaps = projection.documentationGaps.filter((gap) => gap.status !== "RESOLVED").length;

  return (
    <div className="stack">
      <section className="panel episode-hero">
        <div className="panel-title">
          <div>
            <div className="icon-title"><Activity size={18} /><h2>Episode &amp; UR</h2></div>
            <p>Episode-owned utilization review for <strong>{projection.caseLabel}</strong>. This is a read-only synthetic projection of the S1/S2 contracts.</p>
          </div>
          <div className="topbar-badges">
            <StatusBadge tone="info">Episode-owned</StatusBadge>
            <StatusBadge tone="warn">Synthetic only</StatusBadge>
          </div>
        </div>
        <div className="episode-identity">
          <div>
            <span className="label">Episode identity</span>
            <strong className="mono">{projection.episode.id}</strong>
          </div>
          <div>
            <span className="label">Lifecycle</span>
            <StatusBadge tone="good">{projection.episode.status}</StatusBadge>
          </div>
          <div>
            <span className="label">Admission service date</span>
            <strong>{projection.episode.serviceDate}</strong>
          </div>
          <div>
            <span className="label">Coverage snapshot</span>
            <strong>{outcomeSummary(projection.episodeDays)}</strong>
          </div>
        </div>
        <p className="episode-boundary-note">
          Pre-admission authorization readiness remains in its existing workspace. This surface begins after facility acceptance and admission linkage.
        </p>
      </section>

      <section className="status-strip episode-status-strip">
        <div>
          <span className="label">Episode days in scope</span>
          <strong>{projection.episodeDays.length}</strong>
        </div>
        <div>
          <span className="label">Approved days</span>
          <strong>{approvedDays}</strong>
        </div>
        <div>
          <span className="label">Days with risk flags</span>
          <strong>{flaggedDays}</strong>
        </div>
        <div>
          <span className="label">Open documentation gaps</span>
          <strong>{openGaps}</strong>
        </div>
      </section>

      <section className="episode-grid">
        <article className="panel">
          <div className="icon-title"><Link2 size={18} /><h3>Admission-to-episode linkage</h3></div>
          <dl className="kv-grid">
            <dt>Relationship</dt><dd><StatusBadge tone="info">{projection.admissionLink.relationship}</StatusBadge></dd>
            <dt>Source acceptance</dt><dd className="mono">{projection.admissionLink.sourceAcceptanceId}</dd>
            <dt>Linked at</dt><dd>{formatDateTime(projection.admissionLink.linkedAt)}</dd>
            <dt>Linked by</dt><dd className="mono">{projection.admissionLink.linkedBy}</dd>
          </dl>
        </article>
        <article className="panel">
          <div className="icon-title"><MapPinned size={18} /><h3>Facility-owned context</h3></div>
          <dl className="kv-grid">
            <dt>Facility</dt><dd>{projection.episode.facilityName}</dd>
            <dt>Program / unit</dt><dd>{projection.episode.programName} / {projection.episode.unitName}</dd>
            <dt>Timezone</dt><dd><strong>{projection.episode.facilityTimezone}</strong></dd>
            <dt>Source</dt><dd>{projection.episode.timezoneSource} <span className="subtext mono">{projection.episode.timezoneReferenceId}</span></dd>
          </dl>
          <p className="source-note">Service dates are derived from the explicit facility configuration, never from the browser or server location.</p>
        </article>
      </section>

      <section className="episode-grid">
        <article className="panel">
          <div className="panel-title">
            <div className="icon-title"><ClipboardList size={18} /><h3>Episode-owned authorization review</h3></div>
            <StatusBadge tone={projection.utilization.reviewStatus === "APPROVED" ? "good" : "warn"}>{projection.utilization.reviewStatus}</StatusBadge>
          </div>
          <dl className="kv-grid">
            <dt>UR owner</dt><dd>{projection.utilization.owner}</dd>
            <dt>Assignment version</dt><dd>{projection.utilization.assignmentVersion}</dd>
            <dt>Level of care</dt><dd>{projection.utilization.levelOfCare}</dd>
            <dt>Requirement</dt><dd><StatusBadge tone="info">{projection.utilization.requirement}</StatusBadge></dd>
            <dt>Review type</dt><dd>{projection.utilization.reviewType}</dd>
            <dt>Payer reference</dt><dd className="mono">{projection.utilization.payerReferenceToken}</dd>
          </dl>
        </article>
        <article className="panel risk-callout-panel">
          <div className="panel-title">
            <div className="icon-title"><ShieldAlert size={18} /><h3>Separate authorization-risk flags</h3></div>
            <StatusBadge tone="danger">{projection.riskFlags.length} active</StatusBadge>
          </div>
          <p className="subtext">Risk flags explain follow-up work. They do not replace the coverage outcome for a day.</p>
          <div className="risk-flag-list">
            {projection.riskFlags.map((flag) => (
              <div className="risk-flag-row" key={flag.id}>
                <StatusBadge tone={riskTone(flag.code)}>{riskLabels[flag.code]}</StatusBadge>
                <div><strong>{flag.serviceDate}</strong><span>{flag.explanation}</span></div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-title">
          <div className="icon-title"><CalendarDays size={18} /><h3>Episode-day authorization coverage</h3></div>
          <p>Outcome and risk remain separate fields.</p>
        </div>
        <div className="episode-day-list">
          {projection.episodeDays.map((day) => (
            <div className="episode-day-row" key={day.id}>
              <div><span className="label">Service date</span><strong>{formatDate(day.serviceDate)}</strong></div>
              <div><span className="label">Coverage outcome</span><StatusBadge tone={outcomeTones[day.outcome]}>{outcomeLabels[day.outcome]}</StatusBadge></div>
              <div><span className="label">Denial reason</span><span>{day.denialReason ?? "None recorded"}</span></div>
              <div className="episode-day-flags"><span className="label">Risk flags</span>{day.riskFlags.length ? day.riskFlags.map((flag) => <StatusBadge key={flag} tone={riskTone(flag)}>{riskLabels[flag]}</StatusBadge>) : <span className="subtext">None</span>}</div>
            </div>
          ))}
        </div>
        <footer className="panel-footer">Supported outcomes include approved, denied, pending, expired, unrequested, unknown, and not required. “At risk” is intentionally shown as a separate flag.</footer>
      </section>

      <section className="episode-grid">
        <article className="panel">
          <div className="panel-title">
            <div className="icon-title"><FileWarning size={18} /><h3>Documentation gaps</h3></div>
            <StatusBadge tone="warn">Human follow-up</StatusBadge>
          </div>
          <div className="gap-card-list">
            {projection.documentationGaps.map((gap) => (
              <div className="gap-card" key={gap.id}>
                <div className="stage-summary-head"><strong>{gap.category}</strong><StatusBadge tone={gap.status === "RESOLVED" ? "good" : "warn"}>{gap.status}</StatusBadge></div>
                <p>{gap.summary}</p>
                <span className="subtext">Assigned to {gap.assignedRole} · due {formatDateTime(gap.dueAt)}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="panel">
          <div className="panel-title">
            <div className="icon-title"><History size={18} /><h3>Governed event and correction trail</h3></div>
            <StatusBadge tone="info">Append-only</StatusBadge>
          </div>
          <div className="event-timeline">
            {projection.events.map((event) => (
              <div className="event-row" key={event.id}>
                <span className="event-dot" aria-hidden="true"><CheckCircle2 size={14} /></span>
                <div>
                  <strong>{event.eventType}.v1</strong>
                  <span>{formatDateTime(event.occurredAt)} · {event.actor}</span>
                  {event.correctionLabel ? <small>{event.correctionLabel}</small> : null}
                </div>
                <StatusBadge tone={event.status === "DELIVERED" ? "good" : "warn"}>{event.status}</StatusBadge>
              </div>
            ))}
          </div>
          <p className="source-note">Original records remain visible when a correction supersedes them. Outbox status is shown as synthetic local evidence.</p>
        </article>
      </section>

      <section className="panel subtle-panel">
        <div className="panel-title">
          <div className="icon-title"><Clock3 size={18} /><h3>Draft metric definitions</h3></div>
          <StatusBadge tone="warn">DRAFT · not approved</StatusBadge>
        </div>
        <div className="metric-definition-list">
          {projection.draftMetrics.map((metric) => (
            <div className="metric-definition" key={metric.name}>
              <strong>{metric.name}</strong>
              <span>{metric.definition}</span>
              <StatusBadge tone="warn">{metric.status}</StatusBadge>
            </div>
          ))}
        </div>
        <p className="panel-footer">These definitions are design artifacts, not operational measurements. No production analytics or performance claim is represented.</p>
      </section>
    </div>
  );
}
