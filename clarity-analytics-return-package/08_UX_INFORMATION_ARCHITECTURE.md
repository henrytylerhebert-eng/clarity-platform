# UX Information Architecture

## Top-level product structure

Do not turn the current intake Command Center into a generic hospital dashboard.

### Proposed primary navigation

```text
Access & Admission
  Case Queue
  Command Center
  New Case
  Guided Intake
  Evidence / Clinical / Legal / Benefits / Authorization Readiness
  Packet / Routing / Custody
  Admission Handoff (contextual entry)

Operations & Outcomes
  My UR Work
  Utilization Review
  Authorization Risk
  Episode Search
  Documentation Gaps
  Audit & Corrections
  Hospital Operations          [later]
  Clinical Documentation       [later]
  Staffing Operations          [later]
  Finance & Payer Intelligence [later]
  Executive Intelligence       [later]
  Regulatory Reporting         [later]

Product & Learning
  Training & SOPs
  Mock Admit Lab
  Product Studio (read-only)
```

`Admission Handoff` appears as:

- an action on an accepted case;
- a contextual page within Access & Admission;
- the transition point into the new module.

It is not a general analytics home page.

## Workspace shell

The Operations & Outcomes shell provides:

- module title and current tenant/facility scope;
- role-aware navigation;
- global facility/program/unit selector limited by grants;
- date/timezone indicator;
- freshness/data-quality indicator;
- correction/review alerts;
- help/definition drawer;
- no patient search in aggregate-only executive roles.

## Role-oriented defaults

| Role/capability group | Default landing | Primary action |
|---|---|---|
| Admissions coordinator | accepted-case Admission Handoff task list | record authorized admission |
| UR specialist | My UR Work | record review, follow gap, resolve risk |
| UR manager/program leader | Utilization Review | balance queue and inspect operational exceptions |
| Clinician/HIM/nursing documentation role | Documentation Gaps | acknowledge/resolve assigned gaps |
| Compliance/auditor | Audit & Corrections | inspect lineage and unresolved corrections |
| Facility executive | Authorization Risk | understand aggregate burden and freshness |
| Organization executive | Executive Intelligence later | approved multi-facility aggregates |
| Analytics steward | Metric definitions later | review/approve definition versions |
| System administrator | no implicit patient landing | system administration only, no silent episode access |

The exact existing role enum is unknown. Navigation must be capability-driven.

## Information hierarchy

### Operational hierarchy

```text
Scope
→ work requiring attention
→ episode/authorization context
→ source facts and due dates
→ human action
→ audit/provenance
```

### Aggregate hierarchy

```text
Scope and period
→ data status/freshness
→ approved metrics
→ trend/distribution
→ controlled dimension drill-down
→ definition/provenance
```

Aggregate drill-down does not automatically become patient-level drill-through.

## Cross-module links

- Accepted case → Admission Handoff.
- Admission Handoff success → Episode UR Detail.
- UR queue row → Episode UR Detail.
- Documentation gap card → approved source document metadata, if authorized.
- Authorization-risk chart segment → filtered UR queue only for users who also hold operational access.
- Metric definition → definition drawer, not source PHI.
- Corrected metric → recomputation/provenance panel.

Links must preserve scope and never expose unauthorized IDs in route suggestions.

## Common filters

### Operational queue

- facility;
- program;
- unit;
- assigned to me/unassigned/assigned user;
- due window;
- coverage status;
- risk reason;
- payer category/display;
- gap category;
- quality/review state;
- corrected/late data.

### Aggregate dashboard

- period;
- grain;
- facility/program/unit within approved scope;
- payer category;
- level of care;
- metric definition version only when audit comparison is permitted.

No default cross-organization filter exists.

## Definition and provenance drawer

Every metric card/chart/table exposes:

- metric name and key;
- version/status;
- plain-language definition;
- numerator/denominator;
- included/excluded states;
- grain;
- source event types;
- last calculation time;
- source watermark;
- completeness;
- quality issues;
- suppression;
- recomputation/correction history;
- owner and effective date.

Every operational fact exposes:

- who/source recorded it;
- effective versus recorded time;
- source reference;
- review/attestation state;
- correction chain;
- current active version.

## Visual language

### Status versus risk

Do not encode authorization outcome and risk in one color/status.

- outcome badge: approved, denied, pending, expired, unrequested, not required, unknown;
- risk chips: expires soon, overdue review, documentation gap, source disagreement, incomplete data;
- quality icon: valid, warning, pending review, quarantined;
- correction icon: corrected/superseded;
- freshness indicator: fresh, stale, unknown.

Use text labels and icons, not color alone.

## Responsive behavior

### Desktop

- persistent module navigation;
- filter bar;
- table with pinned episode/status/due columns;
- right-side detail or provenance drawer;
- aggregate charts and metric cards.

### Tablet

- collapsible navigation;
- filters in drawer;
- queue table keeps episode, status, due, owner; secondary columns move to detail;
- dashboard cards use two-column layout.

### Mobile

- queue becomes stacked actionable cards;
- no horizontally compressed 12-column table;
- urgent reason, due time, coverage, gaps, owner, and primary action remain visible;
- aggregate charts have tabular accessible fallback;
- admission handoff uses single-column sections and sticky review/submit footer.

## Accessibility target

**Proposed:** WCAG 2.2 AA as the implementation target, subject to repository standards.

Requirements:

- semantic headings/landmarks;
- keyboard-complete queue, dialogs, drawers, and filter controls;
- visible focus;
- status never color-only;
- chart data table alternative;
- live-region announcements for save, projection pending, correction, and errors;
- form errors linked to fields;
- minimum touch targets;
- meaningful labels for tokens and dates;
- timezone stated;
- reduced-motion support;
- no auto-refresh that moves focus or reorders rows without notice.

## Auto-refresh

- operational queue may poll or receive server updates later;
- show `Updated …` and pause indicator;
- do not reorder a row while the user is editing it;
- announce material changes;
- stale/error state does not wipe the last safe result;
- aggregate dashboard may refresh on explicit user action or a conservative interval.

## Empty and no-measurement language

- Operational empty: `No utilization-review work matches this scope and filter.`
- Aggregate no data: `No measurements found.`
- Insufficient denominator: `Not enough eligible data to calculate this measure.`
- No permission: `You do not have access to this scope.`
- Projection pending: `The latest recorded work is still being processed.`
- Partial source coverage: `This view excludes sources that have not reported for the selected period.`

Do not show zero when the correct state is unknown, missing, suppressed, or ineligible.

## Analytics disclaimer

Aggregate surfaces include:

> Operational intelligence supports review and workflow. It does not make clinical, admission, discharge, placement, legal, or payer-authorization decisions.

## URL and route pattern

**Proposed and unverified:**

```text
/operations
/operations/ur
/operations/ur/queue
/operations/ur/episodes/:episodeId
/operations/authorization-risk
/operations/documentation-gaps
/operations/audit/events/:eventId
/access/cases/:caseKey/admission-handoff
```

The router and current app conventions must be inspected before choosing exact paths.
