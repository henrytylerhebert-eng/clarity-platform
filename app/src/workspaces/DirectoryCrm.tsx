import { useMemo, useState } from "react";
import { StatusBadge } from "../components/StatusBadge";
import {
  directoryCrmOrganizations,
  directoryOrganizationTypeLabels,
  directoryReviewStateLabels,
  directoryWorkflowLabels,
  filterDirectoryOrganizations,
  hasForbiddenDirectoryIntentLabel,
  type DirectoryCrmFilters,
  type DirectoryOrganization,
  type DirectoryOrganizationType,
  type DirectoryReviewState,
  type DirectoryWorkflowContext,
} from "../domain/directoryCrm";

const setupSteps = [
  {
    label: "Organization profile",
    detail: "Police department, crisis team, hospital, behavioral parent company, or resource provider.",
    status: "Base record",
  },
  {
    label: "Locations and service lines",
    detail: "ED campuses, central intake hubs, inpatient units, consult paths, and discharge resources.",
    status: "Configured",
  },
  {
    label: "Personnel and access",
    detail: "Officers, ED case managers, intake coordinators, clinicians, UR, nurses, planners, and admins.",
    status: "Review gate",
  },
  {
    label: "Partner workflows",
    detail: "Referral, packet, bed-review request, telemed consult, handoff, UR, and discharge planning.",
    status: "No live send",
  },
];

const moduleLanes = [
  {
    title: "Law enforcement / crisis response",
    detail: "Prescreen, source capture, custody context, field handoff, and limited case visibility.",
    badge: "Access layer",
  },
  {
    title: "Acute hospital / ED",
    detail: "Referral request, bed-review request, packet prep, consult request, case management, and discharge resources.",
    badge: "EMR unverified",
  },
  {
    title: "Behavioral health provider",
    detail: "Central intake, facility response, admission readiness, episode operations, UR, and discharge planning.",
    badge: "Service lines",
  },
  {
    title: "Parent company admin",
    detail: "Child locations, service-line setup, personnel permissions, verification status, and network governance.",
    badge: "Human approval",
  },
];

function reviewTone(reviewState: DirectoryReviewState): "info" | "warn" | "danger" | "good" {
  if (reviewState === "source-confirmed" || reviewState === "human-confirmed") return "good";
  if (reviewState === "stale") return "warn";
  if (reviewState === "do-not-use") return "danger";
  return "info";
}

function formatType(type: DirectoryOrganizationType): string {
  return directoryOrganizationTypeLabels[type];
}

function profileSummary(organization: DirectoryOrganization) {
  const serviceLineCount = organization.serviceLines.length;
  const locationCount = organization.locations.length;
  const personnelCount = organization.personnel.length;
  return `${locationCount} location${locationCount === 1 ? "" : "s"} · ${serviceLineCount} service line${serviceLineCount === 1 ? "" : "s"} · ${personnelCount} personnel group${personnelCount === 1 ? "" : "s"}`;
}

export function DirectoryCrm() {
  const [filters, setFilters] = useState<DirectoryCrmFilters>({
    query: "",
    organizationType: "all",
    workflowContext: "all",
    reviewState: "all",
  });
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(directoryCrmOrganizations[0].id);

  const filteredOrganizations = useMemo(() => filterDirectoryOrganizations(directoryCrmOrganizations, filters), [filters]);
  const selectedOrganization =
    directoryCrmOrganizations.find((organization) => organization.id === selectedOrganizationId) ??
    filteredOrganizations[0] ??
    directoryCrmOrganizations[0];
  const visibleSelectedOrganization = filteredOrganizations.some((organization) => organization.id === selectedOrganization.id)
    ? selectedOrganization
    : filteredOrganizations[0] ?? selectedOrganization;
  const forbiddenIntentVisible = visibleSelectedOrganization.allowedIntentLabels.some(hasForbiddenDirectoryIntentLabel);

  function updateFilters(next: Partial<DirectoryCrmFilters>) {
    setFilters((current) => ({ ...current, ...next }));
  }

  return (
    <div className="stack directory-crm-workspace">
      <section className="panel directory-crm-hero">
        <div className="panel-title">
          <div>
            <p className="label">Phase 1 synthetic prototype</p>
            <h2>Directory CRM</h2>
          </div>
          <div className="topbar-badges">
            <StatusBadge tone="danger">Synthetic only</StatusBadge>
            <StatusBadge tone="warn">Needs review</StatusBadge>
            <StatusBadge tone="danger">No live send</StatusBadge>
          </div>
        </div>
        <p>
          Base portal CRM for organization profiles, locations, service lines, personnel access, partner workflows,
          and resource discovery. Demo role scoping is not authentication.
        </p>
        <div className="directory-crm-metrics" aria-label="Directory CRM status">
          <div>
            <span className="label">Account model</span>
            <strong>Organization portal</strong>
            <p>Parent org, child locations, personnel, and service lines.</p>
          </div>
          <div>
            <span className="label">Network records</span>
            <strong>19,000+</strong>
            <p>Directory persistence remains unverified in this session.</p>
          </div>
          <div>
            <span className="label">Action boundary</span>
            <strong>Prepare / Add / Queue</strong>
            <p>No referral send, bed reservation, consult routing, or user provisioning.</p>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <h3>Portal setup sequence</h3>
          <p>Every organization starts with a profile, then unlocks the right tools for its personnel.</p>
        </div>
        <div className="directory-setup-rail">
          {setupSteps.map((step, index) => (
            <article key={step.label} className="directory-setup-step">
              <span className="directory-step-number">{index + 1}</span>
              <div>
                <h4>{step.label}</h4>
                <p>{step.detail}</p>
              </div>
              <StatusBadge tone={step.status === "No live send" ? "danger" : step.status === "Review gate" ? "warn" : "info"}>
                {step.status}
              </StatusBadge>
            </article>
          ))}
        </div>
      </section>

      <section className="directory-module-lanes" aria-label="Organization module lanes">
        {moduleLanes.map((lane) => (
          <article className="panel directory-module-lane" key={lane.title}>
            <div className="panel-title">
              <h3>{lane.title}</h3>
              <StatusBadge tone={lane.badge === "EMR unverified" || lane.badge === "Human approval" ? "warn" : "info"}>{lane.badge}</StatusBadge>
            </div>
            <p>{lane.detail}</p>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="panel-title">
          <h3>Network search</h3>
          <p>Search organization/resource profiles. Results are candidate context, not automatic ranking or placement.</p>
        </div>
        <div className="directory-filter-grid">
          <label>
            <span>Search</span>
            <input
              value={filters.query}
              onChange={(event) => updateFilters({ query: event.target.value })}
              placeholder="Organization, city, personnel, service line"
            />
          </label>
          <label>
            <span>Organization type</span>
            <select
              value={filters.organizationType}
              onChange={(event) =>
                updateFilters({ organizationType: event.target.value as DirectoryCrmFilters["organizationType"] })
              }
            >
              <option value="all">All organization types</option>
              {Object.entries(directoryOrganizationTypeLabels).map(([value, label]) => (
                <option value={value} key={value}>{label}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Workflow context</span>
            <select
              value={filters.workflowContext}
              onChange={(event) => updateFilters({ workflowContext: event.target.value as DirectoryWorkflowContext })}
            >
              {Object.entries(directoryWorkflowLabels).map(([value, label]) => (
                <option value={value} key={value}>{label}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Review state</span>
            <select
              value={filters.reviewState}
              onChange={(event) => updateFilters({ reviewState: event.target.value as DirectoryCrmFilters["reviewState"] })}
            >
              <option value="all">All review states</option>
              {Object.entries(directoryReviewStateLabels).map(([value, label]) => (
                <option value={value} key={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="directory-crm-split">
        <div className="panel table-wrap">
          <div className="panel-title">
            <h3>Organization profiles</h3>
            <p>{filteredOrganizations.length} profile{filteredOrganizations.length === 1 ? "" : "s"} shown.</p>
          </div>
          <table aria-label="Directory CRM organization profiles">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Type</th>
                <th>Service lines</th>
                <th>Modules</th>
                <th>Review</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrganizations.map((organization) => (
                <tr
                  key={organization.id}
                  className={organization.id === visibleSelectedOrganization.id ? "selected-row" : ""}
                  onClick={() => setSelectedOrganizationId(organization.id)}
                >
                  <td>
                    <button className="link-button" type="button">{organization.name}</button>
                    <span className="subtext">{organization.city} · {profileSummary(organization)}</span>
                  </td>
                  <td>{formatType(organization.type)}</td>
                  <td>{organization.serviceLines.map((line) => line.name).slice(0, 2).join(", ")}</td>
                  <td>{organization.modules.slice(0, 3).join(", ")}</td>
                  <td><StatusBadge tone={reviewTone(organization.reviewState)}>{directoryReviewStateLabels[organization.reviewState]}</StatusBadge></td>
                </tr>
              ))}
              {!filteredOrganizations.length ? (
                <tr>
                  <td colSpan={5}>No synthetic organization profiles match these filters.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <aside className="panel directory-profile-inspector" aria-label="Selected organization profile">
          <div className="panel-title">
            <div>
              <p className="label">Selected profile</p>
              <h3>{visibleSelectedOrganization.name}</h3>
            </div>
            <StatusBadge tone={reviewTone(visibleSelectedOrganization.reviewState)}>
              {directoryReviewStateLabels[visibleSelectedOrganization.reviewState]}
            </StatusBadge>
          </div>
          <p>{visibleSelectedOrganization.summary}</p>
          <dl className="directory-profile-facts">
            <div><dt>Parent org</dt><dd>{visibleSelectedOrganization.parentName}</dd></div>
            <div><dt>Type</dt><dd>{formatType(visibleSelectedOrganization.type)}</dd></div>
            <div><dt>Capacity</dt><dd>Unknown</dd></div>
            <div><dt>Boundary</dt><dd>{visibleSelectedOrganization.verificationNote}</dd></div>
          </dl>

          <div className="directory-profile-section">
            <h4>Locations and service lines</h4>
            {visibleSelectedOrganization.locations.map((location) => (
              <div className="directory-profile-block" key={location.id}>
                <strong>{location.name}</strong>
                <span>{location.kind} · {location.city}</span>
              </div>
            ))}
            <div className="chip-list">
              {visibleSelectedOrganization.serviceLines.map((line) => (
                <span className="chip" key={line.id}>{line.name}</span>
              ))}
            </div>
          </div>

          <div className="directory-profile-section">
            <h4>Personnel and modules</h4>
            {visibleSelectedOrganization.personnel.map((person) => (
              <div className="directory-profile-block" key={person.id}>
                <strong>{person.label}</strong>
                <span>{person.peopleExample}</span>
                <span>{person.modules.join(", ")}</span>
              </div>
            ))}
          </div>

          <div className="directory-profile-section">
            <h4>Partner relationships</h4>
            {visibleSelectedOrganization.partnerRelationships.length ? visibleSelectedOrganization.partnerRelationships.map((relationship) => (
              <div className="directory-profile-block" key={relationship.id}>
                <strong>{relationship.targetOrganizationName}</strong>
                <span>{relationship.relationshipType} · {relationship.allowedWorkflows.join(", ")}</span>
              </div>
            )) : <p className="subtext">No synthetic partner relationship recorded.</p>}
          </div>

          <div className="directory-profile-section">
            <h4>Review-gated intents</h4>
            <div className="directory-intent-grid">
              {visibleSelectedOrganization.allowedIntentLabels.map((label) => (
                <button className="secondary-button" type="button" key={label}>{label}</button>
              ))}
            </div>
            {forbiddenIntentVisible ? (
              <p className="inline-warning">Forbidden live-action label detected.</p>
            ) : (
              <p className="subtext">Intent buttons prepare, add, or queue review only. They do not send, reserve, admit, provision, or sync.</p>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
