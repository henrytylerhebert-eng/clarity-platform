---
status: Parking-lot source audit - no implementation authorization
owner: Tyler Hebert
version: 0.1.0
date: 2026-07-29
repository_snapshot: 0acc9fcd2b57a339bef52d3170623e37547266b2
source_scope:
  - Two owner-authorized shared-drive collections, anonymized here as Collection A and Collection B
data_boundary: Structural patterns only; no client records, PHI, PII, credentials, contract terms, completed facility findings, or proprietary document text copied into the repository
exhaustiveness: Representative audit of high-signal folders and generic templates; not a complete Drive census or content review
related:
  - docs/decisions/ORG_POLICY_INDEX_DECISION_PACKET.md
  - docs/regulatory/README.md
  - docs/governance/PRODUCT_EVIDENCE_AND_DECISION_PROTOCOL.md
  - docs/discovery/WORKFLOW_DISCOVERY_PROTOCOL.md
  - docs/discovery/operating-assurance/IDEA_OPPORTUNITY_ASSESSMENT.md
  - docs/roadmap/IMPLEMENTATION_ROADMAP.md
---

# Shared-Drive Operating Pattern Audit

## Executive finding

The reusable asset is not any one policy, checklist, or spreadsheet. It is the
operating-assurance loop repeated across the source collections:

```text
external authority or operating requirement
  -> organization-specific policy
  -> executable procedure or SOP
  -> checklist, tracer, form, or log
  -> measurement and trend review
  -> committee decision and assigned action
  -> corrective action or after-action review
  -> revised policy, training, and evidence
```

That pattern is useful to Clarity. The client-specific wording, completed
facility work, licensed standards, and historical scores are not.

Clarity already has several compatible foundations:

- versioned documents and immutable, review-gated evidence;
- contradiction and supersession handling;
- separate readiness dimensions and named gaps;
- human approval and product-evidence rules;
- a documentation-only workflow-discovery protocol;
- a development-time regulatory corpus with source hashes and update
  detection;
- a proposed per-organization policy index; and
- synthetic Training & SOPs and reporting prototypes.

The missing layer is a governed connection among those foundations. There is
no accepted organization-policy metadata model, standards-to-evidence
crosswalk, compliance calendar, survey-readiness evidence matrix, corrective
action workflow, or durable competency record.

## Scope and method

The local Drive mount exposes many files as cloud-only `dataless` placeholders.
A blind recursive content crawl would therefore be slow, incomplete, and likely
to over-collect business-sensitive material. This audit used:

1. filesystem metadata and filenames for a cohort of thousands of files in
   selected high-signal subtrees;
2. folder-structure review across operational, policy, survey, training,
   regulatory, and template areas;
3. read-only connected-Drive extraction of representative generic templates;
4. current-repository inspection at the frozen snapshot above; and
5. source-truth classification before any recommendation.

No Drive file was edited. No file was copied into the repository.

### Privacy-safe cohort definition

The metadata observation was made on 2026-07-29. Collection A sampling covered
its generic tool/template library and selected policy, program, and
transformation areas. Collection B sampling covered its SOP, program,
consulting, regulatory-update, and workforce-documentation areas.

The scan counted each pathname once inside non-overlapping selected subtrees.
It did not content-hash or consolidate copies. Large client, archive, project,
finance, contract, and media trees were excluded from recursive content review.
Exact source paths, organization names, per-folder counts, and a file-level
manifest are intentionally omitted from the repository artifact because they
are business-sensitive inventory metadata. The selected cohort contained
thousands of file records; it is evidence of recurring structures, not a
complete census of either collection.

### Format and date signals

| Signal | Relative scale | Interpretation |
|---|---|---|
| DOCX | Dominant | Policies, SOPs, reports, checklists, minutes, and templates dominate |
| PDF | Large | External standards, final presentations, policies, reports, and forms are mixed together |
| Legacy DOC | Material | Conversion and currentness risk |
| XLSX / XLS / XLSM / XLSB | Material | Logs, calendars, audits, risk tools, and dashboards; formulas/macros were not validated |
| PPTX | Smaller | Training and committee presentation layer |
| Images | Large | Signage, screenshots, scans, and generated presentation assets |
| Google-native document shortcuts | Small | Includes an SOP template and authoring guide |
| Explicit 2019-2021 filename years | Limited | Likely historical or source-era material; currentness not proven |
| Explicit 2022-2024 filename years | Substantial | Strong annual/version segmentation |
| Explicit 2025-2026 filename years | Recent-looking subset | A filename date is not review evidence |

Copy/version markers such as `Copy of`, numeric suffixes, and parenthesized copy
numbers were common in the largest high-signal subtrees. That is not
duplicate-content evidence, but it shows why canonical-version selection cannot
rely on filenames.

### Representative content sample

Connected-Drive content reads covered generic structures from these families:

- policy table of contents and policy templates;
- annual risk assessment narrative and scoring chart;
- annual program plan and program evaluation;
- committee minutes and action tracking;
- survey-readiness checklist;
- behavioral-health startup checklist;
- native SOP template, SOP-authoring guide, and completed administrative SOP;
- compliance calendar and mock-survey agenda;
- performance-monitoring checklist;
- closeout report; and
- outbreak-investigation after-action workbook.

The sample was selected for structure, not to validate the underlying clinical,
legal, accreditation, HR, or operational content.

## Collection profiles

### Collection A - consulting delivery library

This collection functions as a consulting and delivery library. Its
high-signal areas combine external reference material, configurable policy and
program templates, evidence-gathering tools, completed examples, assessment
artifacts, and closeout records.

Its strongest reusable pattern is the consulting-delivery packet: source
references plus a configurable template, evidence-gathering checklist, review
or walkthrough, report, action list, and closeout artifact.

Its main reuse risk is provenance. Generic templates, completed client work,
external standards, archived versions, and copied derivatives can look similar
from a filename alone.

### Collection B - operations and consulting library

This collection functions as both an internal operating system and a
consulting knowledge base. Its high-signal areas combine controlled SOP
authoring, linked resources, recurring program governance, evidence capture,
review calendars, training, and competency records.

Its strongest reusable pattern is governed execution: an approved procedure
points to the required resources, evidence, responsible role, review cadence,
and change history.

Its main reuse risk is version ambiguity. Active, archived, copied, template,
completed, and externally sourced documents coexist, and the local mount does
not prove which file a facility currently governs by.

## Observed date and subject signals

The metadata supports these limited observations:

- Explicit year tokens cluster heavily in 2022-2025, with newer 2026 material
  concentrated in infection-control plans, risk/evaluation templates,
  construction controls, education, and rural-health work.
- Annual plans, risk assessments, program evaluations, dashboards, committee
  packets, and compliance calendars are commonly date-segmented. This supports
  a real review-cycle model rather than an undated document library.
- Repeated recent subject families include antimicrobial stewardship,
  infectious-disease screening/reporting, respiratory protection,
  construction risk, workplace violence, survey readiness, and regulatory
  updates.
- The folder structure repeatedly pairs policy material with education,
  checklists, logs, dashboards, meeting records, and closeout/action artifacts.

These are filename/folder and representative-content signals, not proof of
market growth, regulatory applicability, policy currency, control
effectiveness, or measured outcomes.

## Source-truth classification

| Artifact family | Classification | What it can support | What it cannot support |
|---|---|---|---|
| Current official regulation or agency publication | `source`, only after live authority/version verification | Citation, amendment date, candidate applicability review | Automatic Clarity rule or compliance claim |
| Local copy of an external standard or accreditation manual | `unknown` until license, provenance, edition, and currentness are checked | Discovery of a likely source family | Redistribution, authoritative current requirement, or direct import |
| Approved organization policy | `source` for that organization and version only when approval/currentness evidence is present | Organization-specific reference and workflow discovery | A universal rule or another tenant's policy |
| Consultant-authored policy or SOP template | `presentation` / template | Field structure, authoring prompts, review workflow | Approved policy, legal/clinical truth, or implemented control |
| Blank policy, SOP, checklist, tracer, calendar, form, log, or minutes template | `presentation` / template | Field structure, prompts, review workflow, and recurring-task design | Approved policy, completed action, or implemented control |
| Approved committee minutes or decision record | `source` for that exact record and version | The decisions, assignments, and statements the record contains | Proof the referenced control was effective or the decision remains current |
| Populated checklist, tracer, form, or log | `source` for its exact entries when provenance and version are known | What the named actor recorded for the stated period | Independent proof the underlying requirement was met |
| Completed risk assessment, analytical report, or closeout report | `source` for the record itself; `derived` for its calculations and conclusions | Historical workflow, findings, action, and review patterns with provenance | Reusable baseline, benchmark, or current performance claim |
| Dashboard, scored workbook, or macro-enabled tool | `derived` | Candidate metrics, relationships, and review cadence | Validated calculation or safe executable logic without formula/macro audit |
| Training deck, flyer, sign, or job aid | `presentation` | Role-oriented communication patterns | Competency evidence or policy authority |
| Archived, copied, retired, or date-suffixed file | `unknown` | Historical comparison after lineage review | Current source of truth |
| Extracted media, XML, layout, and application support files | `generated` | Rendering or package support | Independent business meaning |

## What the source collections are actually building

### 1. A policy lifecycle, not a document pile

The strongest policy templates separate:

- purpose and scope;
- policy statement;
- authority and responsibility;
- definitions;
- procedure;
- evidence or monitoring;
- references;
- owner and approving body;
- effective, review, and revision dates; and
- supersession/change history.

Facility, state, service-line, bed-count, local-authority, reporting-period,
and review-date placeholders show that these documents are intended to be
configured, not treated as universal text.

### 2. A recurring assurance cycle

The infection-control material repeatedly connects:

- an annual risk assessment;
- prioritized risks and scoring rationale;
- an annual program plan;
- goals and measures of success;
- surveillance and source data;
- committee review;
- action owners and due dates;
- program evaluation; and
- next-cycle changes.

This is more valuable as a product pattern than any individual infection-
control rule. It is a general model for compliance, quality, operations,
security, and implementation governance.

### 3. Evidence-first survey readiness

Readiness and mock-survey tools ask for:

- the requirement or tracer question;
- evidence expected;
- evidence location;
- named owner;
- review period/currentness;
- finding or gap;
- remediation;
- due date; and
- closure evidence.

This resembles Clarity's existing named-gap and evidence-review posture. It
should remain evidence support, never an automatic "compliant" determination.

### 4. Procedures designed for execution and handoff

The native SOP system uses:

- vision and commitment;
- pre-, during-, and post-process steps;
- concise action-oriented instructions;
- linked forms/resources at the step where they are used;
- screenshots or video when necessary;
- creator, approver, and approval date;
- a change tracker; and
- an explicit rule not to place credentials in the SOP.

This is a useful authoring pattern for Clarity domain discovery and role
training.

### 5. Governance through meetings and corrective action

Committee and after-action artifacts preserve:

- prior-minute approval;
- reviewed evidence and trends;
- decisions;
- named responsible person;
- due date;
- corrective action;
- follow-up status;
- closure evidence; and
- lessons that alter the next policy, plan, or training cycle.

The repository has decision and audit concepts, but no accepted operational
action/closure loop.

## Current Clarity fit

| Drive pattern | Current repository anchor | Current fit | Missing before product use |
|---|---|---|---|
| Regulatory source registry and change detection | `docs/regulatory/`, `scripts/regulatory-corpus/` | Implemented development-time public-source tooling | Human applicability/impact review; no policy automation |
| Organization policy corpus | `docs/decisions/ORG_POLICY_INDEX_DECISION_PACKET.md` | Concept captured; explicitly no design or runtime | OD-14 rulings, tenant partitioning, source/version model, controlled extraction, privacy/copyright review |
| Versioned source and reviewed interpretation | document/evidence services; ADR-0007/ADR-0008 | Strong reusable foundation | Policy-specific metadata and approved extraction path |
| Contradiction and supersession | evidence contracts and ADR-0008 | Compatible with policy version conflict | Policy-family rules and qualified reviewer ownership |
| Named-gap readiness | domain readiness contracts and prescreen readiness | Compatible pattern | Standards/evidence crosswalk and non-compliance-claim boundary |
| SOP and competency training | `docs/product/ROLE_ONBOARDING_AND_TRAINING.md`, `app/src/workspaces/TrainingSops.tsx` | Synthetic prototype guidance | Server-owned training definitions, competency evidence, approval and renewal rules |
| SME workflow capture | `docs/discovery/` | Proposed documentation-only protocol | Owner adoption and a completed policy/SOP discovery session |
| Metrics and trend lineage | `reporting-metrics-rebuild-package/` | Analysis substrate, build open | Approved metric definitions, source lineage, cadence, owners, validation |
| Human decisions and product claims | product-evidence protocol, decision/risk registers | Strong governance fit | Named compliance/operations owners and domain-specific acceptance records |
| Corrective action / after-action closure | Audit/event foundations only | Partial conceptual fit | Accepted domain object, workflow, roles, tests, and closure evidence |

## Candidate observations - noncanonical analysis

These are supporting observations, not an independent roadmap or approved
requirements. The sole canonical disposition for every SD identifier below is
the parking-lot table in `docs/roadmap/IMPLEMENTATION_ROADMAP.md`. Scheduling,
removal, or status changes must be recorded there rather than in this audit.

| ID | Candidate | Treatment | Why useful to Clarity | Required boundary |
|---|---|---|---|---|
| SD-01 | Organization policy control record and index skeleton | **Recreate from structure** | Gives OD-14 a neutral metadata spine before retrieval is considered | Per-tenant; exact source version; reference only; owner/counsel/security decisions |
| SD-02 | Regulatory-change impact review packet | **Adapt current tooling** | Connects a changed public source hash to human review of affected workflows and policies | A change is a review trigger, never an automatic rule update |
| SD-03 | Survey-readiness evidence matrix / tracer | **Recreate from structure** | Links requirement, evidence, owner, gap, remediation, and closure without claiming compliance | Qualified reviewer; source/version/currentness; no opaque aggregate score |
| SD-04 | Program assurance cycle | **Recreate as a generic pattern** | Connects risk, annual plan, goals, measures, committee review, and corrective action | Operational metrics only unless a qualified domain owner approves more |
| SD-05 | SOP authoring and version-control template | **Adapt** | Gives SMEs a consistent way to describe executable work and supporting resources | No credentials; no source-text promotion; human approval and change history |
| SD-06 | Committee decision and action packet | **Recreate** | Preserves evidence reviewed, decision, owner, due date, and closure evidence | Minutes are evidence for one meeting; decisions remain domain-scoped |
| SD-07 | Compliance obligation calendar | **Recreate** | Makes recurring review, reporting, renewal, training, and inspection work visible | Every obligation needs authority, jurisdiction, owner, cadence, and evidence |
| SD-08 | Role training and competency matrix | **Adapt** | Extends the synthetic Training & SOPs concept with explicit evidence and renewal | Qualified approver; no localStorage or checklist completion as credential proof |
| SD-09 | Organization onboarding/readiness checklist | **Recreate later** | Could structure facility configuration, required documents, owners, and unresolved decisions | Not licensing advice; no production onboarding before tenancy/security gates |
| SD-10 | Closeout and after-action review packet | **Adapt** | Captures findings, corrective actions, lessons, and what must change next | No client findings copied; closure requires evidence and independent review where needed |

## Minimum template fields to preserve

| Template | Required fields when revisited |
|---|---|
| Policy control record | Organization; policy family/id/title; exact source document/version/hash; owner; approvers; effective/review dates; status; applicability; supersedes/superseded-by; references; known conflicts |
| Regulatory impact packet | Citation; agency; source URL; amendment date/hash; retrieved date; change class; candidate affected policies/workflows; applicability classification; counsel/clinical/operational reviewers; decision; rationale; follow-up |
| Evidence tracer | Requirement/source/version; evidence requested; evidence location/version; owner; currentness; status (`Unknown`, gap, under review, evidenced); finding; action; due date; closure evidence/reviewer |
| Assurance cycle | Risk/source; probability/severity/preparedness/change impact; rationale; priority; goal; measure; definition; source data; owner; cadence; threshold; review body; decision; corrective action |
| SOP | Purpose/vision; commitment; scope; owner; prerequisites; pre/during/post steps; inputs/outputs; linked resources; exceptions; escalation; evidence produced; approver/date; review trigger; change history |
| Committee packet | Meeting scope/date; attendees/authority; prior-minute approval; evidence reviewed; decisions; dissent/unknowns; action owner; due date; status; closure evidence |
| Compliance calendar | Obligation; authority/jurisdiction; organization/service applicability; recurrence; due-date rule; owner/backup; prerequisite; evidence; escalation; last/next completion; exception |
| Competency matrix | Role; required learning; source/SOP version; synthetic practice; assessment method; evidence; qualified reviewer; status; completion/expiration/renewal; exception |

## What should not be recreated or imported

- Client-specific policies, findings, scores, minutes, dashboards, contacts, or
  completed reports.
- Proprietary or licensed accreditation content without permission and a
  current-source review.
- Legacy Office macros, formulas, or scoring logic without a separate audit and
  acceptance record.
- Dated emergency or pandemic instructions as current policy.
- HR, contract, tax, credential, billing, sales, or internal business records.
- Patient examples, screenshots, identifiers, or hidden document metadata.
- A compliance score that hides separate gaps, owners, authorities, or review
  states.
- Facility policy interpreted as a clinical, legal, placement, or authorization
  decision.

Program-level risk prioritization may use an approved transparent method.
Patient/referral readiness must retain Clarity's separate dimensions and must
not become an opaque weighted score.

## Revisit gate

Do not schedule these candidates until Tyler selects one bounded outcome.
Before a build-ready decision, require:

1. a named organization and use case, using synthetic/source-sanitized material;
2. OD-14 disposition, including reference-versus-authority and tenant
   partitioning;
3. live verification of every external source and its reuse rights;
4. named product, operational/compliance, technical, security/privacy, and
   qualified clinical/legal reviewers as applicable;
5. an accepted workflow-discovery record;
6. exact data, retention, audit, versioning, supersession, and failure rules;
7. focused tenant, permission, currentness, contradiction, and no-false-
   compliance tests; and
8. a separate implementation package.

The smallest future experiment is documentation-only: define SD-01 and SD-03
for one synthetic policy family, review them with the required humans, and stop
before ingestion, extraction, retrieval, or runtime implementation.
