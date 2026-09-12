---
recovered_at: 2026-09-12
acceptance_provenance: Historical July source record; not newly accepted by recovery
status: Accepted for Product Intelligence - no implementation authorization
owner: Tyler Hebert
version: 0.3.0
date: 2026-07-30
suite: product-build-skill-suite@1.0.0
stage: idea-opportunity-assessment
repository_snapshot: 0acc9fcd2b57a339bef52d3170623e37547266b2
canonical_parking_lot: docs/roadmap/IMPLEMENTATION_ROADMAP.md
data_boundary: Documentation-only; synthetic and source-sanitized material; no Drive import, PHI, PII, client records, licensed source text, or completed findings
source_artifacts:
  - docs/discovery/SHARED_DRIVE_OPERATING_PATTERN_AUDIT.md
  - docs/decisions/ORG_POLICY_INDEX_DECISION_PACKET.md
  - docs/decisions/OPEN_DECISIONS.md
  - docs/decisions/RISK_REGISTER.md
  - docs/governance/PRODUCT_EVIDENCE_AND_DECISION_PROTOCOL.md
  - docs/discovery/WORKFLOW_DISCOVERY_PROTOCOL.md
  - docs/discovery/operating-assurance/REPOSITORY_STATE.md
  - docs/roadmap/IMPLEMENTATION_ROADMAP.md
---

# Operating Assurance Idea and Opportunity Assessment

> Recovered dated source record. Read the [recovery index](README.md) for
> current ID mapping, paused scope, and verification limits. Historical
> acceptance/verification labels below describe the July source record; no
> implementation, corpus use, pilot, or product-home decision is granted here.


## Orchestrator decision

| Orchestrator output | Result |
|---|---|
| Current stage | Product Intelligence completed; `product-requirements-planning` is the next legal stage |
| Gate result | `PASSED` - the owner selected a bounded user, workflow, outcome, and authority posture on 2026-07-30 |
| Missing artifacts | Direct end-user walkthrough evidence and baseline measurements remain absent; they constrain value and pilot claims but do not block bounded product definition |
| Blocking decisions | OD-25 is resolved for Product Intelligence. OD-14 and the product-home decision block retrieval design and execution architecture |
| Selected primary skill | `02-product-intelligence` - completed after this Stage 01 handoff |
| Supporting governance skills | Evidence classifier, traceability manager, decision register, risk register, change control, repository-state inspector, artifact validator, quality gate |
| Required inputs | Source-pattern audit, portfolio-mix evidence, repository state, owner direction, current alternatives, and open risks |
| Prohibited actions | Execution architecture, work packages, implementation, ingestion, extraction, live retrieval, integrations, pilot, deployment, policy interpretation, or compliance determination |
| Expected output | Canonical product definition and a proposed first-release boundary for owner review - delivered |
| Next legal transition | `product-requirements-planning`; product-definition gate passed on 2026-07-30 |

**Exit verdict: `Ready for product intelligence`.**

**Historical next action:** completed. The product and first-release boundary
were defined and owner-accepted. Product Requirements Planning is now the next
legal stage when separately authorized.

## Owner scope decision - 2026-07-30

The product owner explicitly narrowed the next phase to product definition and
first-release scoping, rejected further broad ideation, and did not authorize
implementation.

For Product Intelligence, the accepted opportunity boundary is:

- **Primary day-to-day user:** `USR-OA-01`, a client-side compliance, quality,
  or program owner.
- **Oversight user:** an assigned consultant who configures the engagement,
  reviews source and evidence lineage, supervises open work, and approves
  client-facing answers or closure.
- **Primary workflow:** one consultant-supervised question using exact
  authority, policy, and SOP references, one evidence response, and a
  human-reviewed answer or explicit gap. Corrective action, closure, and
  policy/SOP/training review remain part of the longer product thesis, not the
  minimum first-release outcome.
- **Target outcome:** an authorized client user can answer one
  survey-readiness or operating-assurance question with exact, current,
  reviewable lineage—or receive an explicit `Unknown` or gap—without treating
  the system as a compliance determination.
- **Authority posture:** sources and organization records are reference
  material with provenance and currentness. Applicability, interpretation,
  compliance, clinical, and legal conclusions remain with qualified humans.
- **Product posture:** the client operates the workspace; the consultant
  remains the supervisory control plane. This is a service-to-software
  productization opportunity, not merely a policy repository.

The owner subsequently confirmed that the consulting tools and methods have
been used since 2020 while building the business. That is strong evidence of
method adoption and practical service value, corroborated by the longitudinal
artifact structure. It is not proof of client-operated software adoption,
software ROI, or measurable platform outcomes. EXP-OA-01 remains a validation
method for those later claims.

## Evidence-label note

This artifact uses the suite labels `Verified`, `Documented`, `Reported`,
`Inferred`, `Proposed`, `Assumption`, `Unknown`, `Blocked`, and
`Not applicable`. If EXP-OA-01 becomes a Clarity Workflow Discovery Protocol
session, its records must use the repository's discovery classifications and
preserve these IDs as traceability.

## IDEA-OA-01 - Idea restatement

**[Documented]** Explore whether Clarity should eventually support a
human-governed operating-assurance workflow that connects:

```text
exact authority and version
  -> organization policy
  -> executable SOP
  -> expected evidence
  -> human review and decision
  -> corrective action and closure
  -> updated policy, SOP, or training
```

**[Proposed]** Treat SD-01 through SD-10 as related modules in that workflow,
not ten independent products.

**[Unknown]** Whether this belongs inside Clarity's crisis-access product, in an
adjacent module, or in a consulting/service toolkit.

## Problem hypothesis

### PROB-OA-01 - Fragmented operating truth

**[Documented]** The source collections repeatedly separate authority,
policies, SOPs, evidence tools, calendars, committee records, training, and
closeout records across files and versions. Filenames alone do not establish
provenance or the currently governed version.

**[Inferred]** Policy owners, operators, and reviewers may have to reconcile
source, version, applicability, evidence, owner, decision, and closure
manually.

**[Unknown]** No direct interviews, workflow observations, loss data, or
baseline task measurements establish how often this occurs or how costly it is.

### PROB-OA-02 - Compatible foundations without a governed connection

**[Verified]** Clarity has versioned-document and reviewed-evidence concepts,
contradiction/supersession concepts, separate readiness dimensions,
development-time regulatory change tooling, and a synthetic Training & SOPs
surface.

**[Documented]** Clarity has no accepted organization-policy metadata model,
standards-to-evidence crosswalk, compliance calendar, corrective-action
workflow, or durable competency record.

**[Unknown]** Current document/evidence contracts are case-oriented. Their fit
for organization-level policy control has not been designed or proven.

## Value hypothesis

### VAL-OA-01 - Shared, reviewable operating context

**[Proposed]** A governed chain could make source authority, currentness,
ownership, gaps, decisions, due dates, and closure evidence visible without
Clarity deciding whether an organization is compliant.

### VAL-OA-02 - Reference support without hidden judgment

**[Assumption]** Reference-only support, named gaps, and explicit human review
provide enough value without automatic policy interpretation or a combined
compliance score.

### VAL-OA-03 - Reuse existing product primitives

**[Inferred]** Existing versioning, evidence review, contradiction, readiness,
and audit patterns may reduce future implementation effort if the opportunity
is validated.

Adoption of the consulting method and practical service value are
**[Reported]** by the owner and corroborated by longitudinal delivery
artifacts. Time savings, error reduction, software adoption, software
willingness to pay, implementation cost, and software ROI are **[Unknown]**.
**No measurements found.**

## WF-OA-01 - Proposed workflow and candidate system map

This map is analysis only. Canonical disposition remains the roadmap parking
lot.

| Proposed group | Candidates | Role in the operating loop |
|---|---|---|
| Authority and control | SD-01, SD-02, SD-07 | Establish exact source/version/applicability and recurring obligations |
| Evidence and assurance | SD-03, SD-04 | Connect requirements, evidence, gaps, measures, and review |
| Governance and closure | SD-06, SD-10 | Preserve decisions, assigned actions, follow-up, closure, and lessons |
| Execution and workforce | SD-05, SD-08, SD-09 | Turn policy into executable SOPs, competency, and onboarding |

**[Proposed dependency order]:** investigate SD-01 + SD-03 first. SD-02 and
SD-07 depend on source control; SD-04 depends on accepted evidence and metric
definitions; SD-06 and SD-10 depend on an accepted action/closure model; SD-08
and SD-09 depend on an accepted SOP and competency model.

## User and stakeholder map

Stage 01 originally had no accepted primary user. The OD-25 resolution now
accepts `USR-OA-01` as the primary user for bounded Product Intelligence.
Direct user validation remains absent.

| ID | Candidate user or stakeholder | Need or authority | Evidence |
|---|---|---|---|
| USR-OA-01 | Compliance, quality, or program owner | Know which source/policy/version governs, what evidence is expected, and what remains open | **[Documented]** accepted for Product Intelligence by owner direction; direct user validation absent |
| USR-OA-02 | Policy or SOP owner | Maintain approval, currentness, supersession, executable steps, and change history | **[Documented]** owner/approver/version structures recur |
| USR-OA-03 | Frontline SOP user | Find the current procedure and produce the expected evidence | **[Proposed]** downstream user |
| USR-OA-04 | Independent evidence or assurance reviewer | Review provenance, evidence state, gaps, action, and closure without converting evidence into compliance | **[Proposed]** reviewer for EXP-OA-01 |
| USR-OA-05 | Training or competency owner | Know which policy/SOP change affects learning, assessment, renewal, or acknowledgement | **[Inferred]** from training and competency artifacts |
| USR-OA-06 | Qualified clinical, legal, or operational reviewer | Own domain interpretation when the content enters a regulated or patient-affecting workflow | **[Documented]** Clarity governance requirement |
| USR-OA-07 | Security/privacy and technical owner | Decide tenant isolation, source handling, retention, audit, and architecture boundaries | **[Documented]** OD-14 and repository governance |
| USR-OA-08 | Product owner | Decide scope, fit, status, and investment | **[Documented]** canonical product gate owner |

Regulators, accreditors, or surveyors may be evidence consumers or authorities,
but whether any is a direct user is **[Unknown]**.

## Current alternatives

| Alternative | Evidence | Unknowns |
|---|---|---|
| Shared-drive folder and document hierarchy | **[Documented]** in the audited collections | Actual search time, failure frequency, and user satisfaction |
| Spreadsheet, calendar, checklist, and log coordination | **[Documented]** recurring artifact family | Maintenance effort and error rate |
| Consultant-delivery packet with walkthrough, report, actions, and closeout | **[Documented]** recurring delivery pattern | Which parts clients value independently of consulting |
| Committee minutes and manual action follow-up | **[Documented]** recurring governance pattern | Closure reliability and duplication burden |
| Separate current Clarity components | **[Verified]** regulatory tooling, document/evidence concepts, readiness, and synthetic training exist separately | Whether users want them connected for this job |
| Commercial policy, GRC, QMS, or compliance-management products | **[Unknown]** | Current vendors, fit, switching costs, differentiation, and buy-versus-build posture require Product Intelligence |

## Scope and non-scope

### Original assessment scope

- Assess one operating-assurance opportunity.
- Preserve SD-01 through SD-10 as parked candidates.
- Test only SD-01 + SD-03 as paper/document structures.
- Use one fictional, nonclinical administrative policy family.
- Collect directional learning and explicit falsification evidence.

### Original assessment non-scope

- No copying or importing Drive documents.
- No policy writing, regulatory applicability ruling, or compliance
  determination.
- No real organization, facility, client, employee, patient, or case data.
- No ingestion, OCR, extraction, embeddings, retrieval, agent, integration,
  schema, API, UI, or runtime design.
- No aggregate compliance, readiness, competency, or control-effectiveness
  score.
- No implementation requirement, work package, pilot, production, or roadmap
  promotion.
- No validation claim for SD-02 or SD-04 through SD-10.

## Assumption register and critical unknowns

| ID | Statement | Label | Fastest test | Falsified or unresolved when |
|---|---|---|---|---|
| ASM-OA-01 | Version, provenance, and ownership ambiguity causes meaningful coordination friction | Assumption | Baseline synthetic walkthrough using current file/folder method | Participants answer reliably and see no meaningful friction |
| ASM-OA-02 | A connected record is materially clearer than existing tools | Assumption | Compare the baseline with SD-01 + SD-03 | Participants see no benefit or added maintenance exceeds value |
| ASM-OA-03 | Reference-only support is useful without a compliance conclusion | Assumption | Observe the evidence-review step | Participants require an automated determination or opaque score |
| ASM-OA-04 | SD-01 + SD-03 are sufficient for the first human handoff | Assumption | Complete EXP-OA-01 without adding another candidate | The workflow requires additional controlled artifact families |
| ASM-OA-05 | Clarity is an appropriate product home | Unknown | Ask users where this job belongs and compare product boundaries in Product Intelligence | The job is unrelated to the crisis-access wedge or belongs in a service/toolkit |
| ASM-OA-06 | Organization-level policy records can reuse case-oriented Clarity concepts safely | Unknown | Future Product Intelligence and architecture fit review | Reuse would distort case contracts or require unsafe coupling |
| ASM-OA-07 | Useful coordination does not require protected source content | Assumption | Use metadata and synthetic excerpts only | Completion requires client content, licensed standards, PHI/PII, or findings |
| ASM-OA-08 | Organizations can name a policy owner and authoritative current version | Assumption | Ask participants to assign ownership and currentness | Authority remains disputed or cannot be maintained |
| ASM-OA-09 | Users can separate `evidenced` from `compliant` | Assumption | Observe language and decisions during the tracer task | Participants consistently treat evidence state as a compliance verdict |
| ASM-OA-10 | The opportunity has measurable operational value | Unknown | Collect baseline and post-template task evidence | No useful measure or investment rationale emerges |

Assumption owners are Tyler/product for scope and value, the named
operational/compliance owner for workflow and authority, security/technical
owners for source and tenant boundaries, and qualified domain reviewers where
regulated interpretation appears.

## Opportunity classification

- **Opportunity type:** **[Documented]** owner-accepted
  service-to-software product opportunity.
- **Product adjacency:** **[Proposed]** separate adjacent product that may
  reuse proven Clarity primitives; repository/product home remains open.
- **User definition:** **[Documented]** accepted for Product Intelligence:
  client-side compliance/quality/program owner with consultant oversight.
- **Workflow definition:** **[Documented]** accepted for Product Intelligence:
  one authority-policy-SOP-evidence question ending in a reviewed answer or
  explicit gap.
- **Outcome definition:** **[Documented]** accepted for Product Intelligence:
  one human-reviewed, source-linked answer or named gap.
- **Investment evidence:** **[Reported and documented]** longitudinal method
  use and recurring delivery assets support requirements planning. Software
  economics and outcome measurements remain **[Unknown]**.
- **Gate verdict:** `Ready for product intelligence`.

OD-25 now has an owner decision. EXP-OA-01 remains unperformed and therefore
continues to constrain client-operated software adoption, usability, leverage,
and ROI claims, not the established use of the consulting method.

## EXP-OA-01 - Smallest learning plan

### Objective

Falsify whether SD-01 plus SD-03 provide enough shared truth for a client and
assigned consultant to complete one reviewed assurance answer or explicit gap.

### Synthetic scenario

One fictional requirement is linked to one synthetic, nonclinical
administrative policy and its SOP. The scenario includes:

- one pre-seeded authority reference with exact locator and as-of date;
- one current policy reference and one SOP reference;
- one named client compliance/quality owner;
- one evidence request for a single SOP step;
- one evidence response or explicit missing state; and
- one assigned consultant reviewer.

### Participants

- one client compliance/quality owner;
- one policy/SOP or evidence contributor;
- one assigned consultant acting as the assurance reviewer;
- one discovery facilitator; and
- one asynchronous privacy/security reviewer for the sanitized output.

A legal or clinical reviewer is not needed for the fictional administrative
scenario. If a participant introduces a real authority, real organization
policy, or clinical/legal interpretation, stop and require the appropriately
qualified reviewer.

### Walkthrough

1. Answer the descriptive assurance question with the baseline file/folder
   method and record directional effort.
2. Repeat with the pre-seeded authority, policy, and SOP references.
3. Request and link one synthetic evidence response or record it as missing.
4. Draft an answer whose material statements identify an exact source locator,
   version, support classification, applicability rationale, and as-of date.
5. Have the assigned consultant publish, return, or preserve an explicit gap.
6. Compare clarity, prompts, lookups, rework, and upkeep with the baseline.
7. Stop before changing policy content, managing corrective action, determining
   compliance, or designing software.

### Learning evidence

| ID | Observation |
|---|---|
| MET-OA-01 | Whether each critical answer identifies an exact source and version |
| MET-OA-02 | Directional task time, facilitator prompts, rework, and manual lookups before and after the template |
| MET-OA-03 | Fields marked useful, duplicative, ambiguous, missing, or too costly to maintain |
| MET-OA-04 | Handoff failures between owner, operator, and reviewer |
| MET-OA-05 | Every instance of compliance-like language or demand for one combined score |
| MET-OA-06 | Any field that appears to require protected, proprietary, licensed, or organization-specific content |
| MET-OA-07 | Participant judgment of upkeep burden compared with the current alternative |

Directional timing is learning evidence, not a benchmark or performance claim.
There is no pre-existing baseline. **No measurements found.**

### Outcome rules

These were the original experiment-routing rules. CHG-OA-03 and the OD-25
owner resolution supersede the `Advance to Product Intelligence` condition for
the bounded definition pass only. EXP-OA-01 remains required before pilot,
adoption, usability, or measurable-value claims.

- **Original advance rule:** the owner accepts a primary user,
  workflow, and target outcome; participants find meaningful coordination
  value; provenance remains traceable; and no prohibited content or
  determination is required.
- **Current route:** owner direction has authorized Product Intelligence
  without representing the unperformed participant evidence as complete.
- **Iterate discovery:** the problem appears real, but roles, status meanings,
  fields, or authority remain materially ambiguous.
- **Park:** current alternatives are adequate or upkeep exceeds observed value.
- **Stop:** meaningful use requires protected content, automated
  interpretation, tenant/runtime infrastructure, or a compliance,
  clinical, or legal determination.

SD-02 and SD-04 through SD-10 remain parked throughout EXP-OA-01. Any need for
them is an observation or assumption, not expanded scope.

## Traceability

| From | To | Current state |
|---|---|---|
| IDEA-OA-01 | PROB-OA-01, PROB-OA-02 | Documented source pattern plus inferred user problem |
| PROB-OA-01 | USR-OA-01 through USR-OA-04 | USR-OA-01 accepted for Product Intelligence; other roles remain proposed and direct validation is absent |
| PROB-OA-01 | WF-OA-01 operating-assurance loop | Proposed workflow |
| WF-OA-01 | VAL-OA-01 through VAL-OA-03 | Proposed value; no outcome evidence |
| ASM-OA-01 through ASM-OA-10 | EXP-OA-01 | Smallest falsification plan |
| EXP-OA-01 | OD-25 | Owner resolved the Product Intelligence route; the experiment remains required before pilot/value validation |
| IDEA-OA-01 | R-25 through R-27 | Canonical risks constrain discovery and every later stage |
| SD-01 through SD-10 | Canonical roadmap | Parked; no status change |

No `REQ`, `CTR`, `WP`, `TST`, or `AC` records exist for this opportunity
because requirements and implementation stages are prohibited.

## Canonical decision and risk references

The suite's `DEC` concept maps to Clarity's canonical `OD-*` namespace, and the
suite's `RSK` concept maps to Clarity's canonical `R-*` namespace. This folder
does not create shadow decision or risk registers.

- OD-14 governs the future per-organization policy index and remains narrower
  than this operating-assurance opportunity.
- OD-25 selects one bounded learning target, user/context, authority posture,
  reviewers, and outcome before Product Intelligence.
- R-25 covers cross-tenant or source-boundary disclosure.
- R-26 covers stale, inapplicable, unlicensed, or template content treated as
  current authority.
- R-27 covers evidence or template outputs misrepresented as compliance,
  competency, or control effectiveness.

Canonical details live in `docs/decisions/OPEN_DECISIONS.md` and
`docs/decisions/RISK_REGISTER.md`.

## Artifact validation and quality gate

| Check | Result |
|---|---|
| Prior source-pattern artifact exists and is current for this branch | Passed |
| Canonical roadmap contains SD-01 through SD-10 | Passed |
| Stage-relevant OD-25 and R-25 through R-27 are current | Passed; legacy register rows were not revalidated |
| Repository state and applicable product boundaries inspected | Passed; see `REPOSITORY_STATE.md` |
| Required idea-assessment output sections present | Passed |
| Primary user, workflow, and target outcome accepted | Passed - owner-directed for Product Intelligence |
| Longitudinal consulting-method use present | Passed - owner-reported since 2020 and corroborated by recurring dated artifacts |
| Client-operated software evidence present | Pending - not collected; constrains software validation and pilot claims |
| Baseline or outcome measurement present | Pending - No measurements found |
| Requirements or implementation authorization present | Not applicable |
| Privacy/source boundary preserved | Passed for this documentation artifact |

**Quality-gate verdict: `Ready for product intelligence`.**

That Stage 01 transition is complete. Product Intelligence subsequently passed
its product-definition gate, and `product-requirements-planning` is now the
next legal stage when separately authorized. Execution architecture,
implementation, acceptance, pilot, and production skills remain prohibited.
