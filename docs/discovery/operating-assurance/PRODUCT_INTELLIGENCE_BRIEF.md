---
status: Accepted for Product Requirements Planning - no implementation authorization
owner: Tyler Hebert
version: 0.3.0
date: 2026-07-30
suite: product-build-skill-suite@1.0.0
stage: product-intelligence
working_product_name: Operating Assurance Workspace
repository_snapshot: 0acc9fcd2b57a339bef52d3170623e37547266b2
data_boundary: Documentation, anonymized aggregate metadata, public vendor materials, repository inspection, and source-sanitized examples only
source_artifacts:
  - docs/discovery/SHARED_DRIVE_OPERATING_PATTERN_AUDIT.md
  - docs/discovery/operating-assurance/CONSULTING_PORTFOLIO_EVIDENCE.md
  - docs/discovery/operating-assurance/PLATFORM_INTELLIGENCE_CORPUS_STRATEGY.md
  - docs/discovery/operating-assurance/IDEA_OPPORTUNITY_ASSESSMENT.md
  - docs/discovery/operating-assurance/REPOSITORY_STATE.md
  - docs/decisions/OPEN_DECISIONS.md
  - docs/decisions/RISK_REGISTER.md
  - README.md
  - ARCHITECTURE.md
---

# Operating Assurance Workspace - Product Intelligence Brief

## Orchestrator result

| Output | Result |
|---|---|
| Current stage | `product-intelligence` |
| Entry gate | Passed - the bounded opportunity definition and OD-15 owner decision exist |
| Selected skill | `02-product-intelligence` |
| Supporting governance | Evidence classification, artifact validation, traceability, decision and risk registers, change control, repository-state inspection, quality gate, handoff |
| Prohibited actions | Execution architecture, contracts, schemas, work packages, implementation, live ingestion/retrieval, pilot, deployment, or compliance determination |
| Expected output | Canonical product definition and a proposed first-release boundary |
| Exit gate | Passed - the owner accepted the product thesis, longitudinal operating-value evidence, and corpus advantage on 2026-07-30 |
| Next legal transition | `product-requirements-planning`; that stage has not started |

## Executive product summary

**[Documented]** The consulting firm delivers recurring healthcare
operational, regulatory, accreditation, policy, evidence, training, quality,
and corrective-action work through consultants, shared drives, Word
documents, spreadsheets, trackers, and reusable packets.

**[Reported]** The owner wants the client to become the operating user while
the consultant remains the oversight layer, so delivery can scale beyond
consultant labor.

**[Reported]** The firm has used these tools, workflows, evidence methods, and
plans of correction in consulting delivery since 2020 while building the
business.

**[Documented]** The dated 2019-2026 artifact history, recurring annual cycles,
91 current-labeled engagement-like units, 3,121 operating assets, and 1,476
explicit consultant-delivery assets corroborate longitudinal use and
repeatability.

**[Proposed]** The product is a multi-tenant, consultant-supervised operating
assurance workspace. It connects exact authority and version to an
organization's policy and SOP, expected evidence, human-reviewed answer or
gap, corrective action, closure, and any resulting policy/SOP/training review.

The product is not primarily:

- a document repository;
- a policy authoring system;
- an LMS or credentialing platform;
- a generic GRC suite;
- a survey checklist;
- a regulatory chatbot; or
- an autonomous compliance engine.

Its differentiation hypothesis is narrower than service plus software, which
existing vendors also offer: software-enforced client separation,
assigned-consultant review and closure queues, exact cross-object lineage, and
fail-closed reviewed answers, informed by a governed longitudinal corpus of
expert consulting work.

## One-sentence product definition

> **Operating Assurance Workspace is a consultant-supervised healthcare
> workspace that lets a client answer an operating or survey-readiness question
> by tracing exact authority and version to current policy, SOP, supporting or
> missing evidence, and a human-reviewed answer, then records any follow-up
> through review of closure evidence.**

## Product thesis

### Governing idea

**[Proposed]** The reusable product is the operating-assurance loop:

```text
authority and version
  -> organization policy
  -> executable SOP
  -> expected evidence
  -> human-reviewed answer or named gap
  -> corrective action and closure-evidence review
  -> policy, SOP, or training review
```

### Service-to-software thesis

**[Reported and documented]** The firm already performs the coordination,
interpretation handoff, evidence collection, remediation tracking, and closure
work through a longitudinal consulting operating system. Software can make the
shared state reusable and client-operable, but only if the consultant's
supervisory role becomes a controlled queue rather than a hidden manual
dependency.

### Owner evidence and acceptance update - 2026-07-30

The owner accepts the underlying consulting workflow and its practical value
as established by use since 2020. This closes the Product Intelligence
question of whether the method itself is merely hypothetical.

The acceptance does not claim that clients have adopted a software interface,
that software improves outcomes, or that every historical artifact is
authorized or suitable for shared model training. Those remain requirements,
validation, rights, and pilot concerns.

### Differentiation thesis

**[Inferred]** The credible wedge is not feature breadth or lineage alone.
Current vendors already market healthcare policy management, standards links,
evidence, corrective action, training, credentialing, regulatory Q&A, and
parts of the same closed loop. The testable differentiation is the combination
of exact version-specific lineage, fail-closed human-reviewed answers, an
assigned-consultant portfolio control plane, and a governed longitudinal
expert-demonstration corpus across:

1. the exact external authority;
2. the client's current policy and SOP;
3. the evidence present or missing;
4. the qualified review and published answer;
5. the corrective action and closure; and
6. consultant oversight across separated client workspaces; and
7. permissioned historical examples of evidence, findings, plans of
   correction, review, closure, and change.

Public materials do not verify that current assistants cross-reference exact
external authority, client policy/SOP, and current client evidence in one cited
answer. That proposed gap must be tested in vendor demos and buyer interviews;
public product pages cannot prove that competitors lack it.

The proposed first release validates only the reviewed-answer contract. It
does not test production client separation, multi-client portfolio oversight,
closure queues, or consultant leverage. Those differentiation and scale claims
require separate later discovery before they can be treated as validated.

## Problem definition

### PROB-OA-01 - Fragmented operating truth

**[Documented]** Authority, policies, SOPs, evidence, calendars, survey tools,
committee records, training, and closeout records recur across separate files
and versions. A filename or folder location does not prove currentness,
applicability, approval, or closure.

**[Inferred]** A client or consultant answering a readiness question must
manually reconstruct what governs, which policy is current, how work is
performed, what evidence exists, what is missing, and whether remediation
closed.

### PROB-OA-02 - Consulting delivery does not scale as shared state

**[Reported]** Consultants are deployed to execute defined scopes for multiple
clients. Clients rely on consultant-created documents, spreadsheets,
walkthroughs, reviews, and follow-up.

**[Inferred]** Reusable templates reduce drafting effort, but the client does
not inherit a continuously governed operating system. Consultant knowledge and
manual oversight remain the coordination bottleneck.

### PROB-OA-03 - Search without authority is unsafe

**[Reported]** The desired end state includes easy question answering for
consultants, clients, and potentially an external reviewer or surveyor.

**[Inferred]** A generic answer is not sufficient. The useful and defensible
answer must show exact source, version, applicability posture, client policy,
SOP, evidence state, contradictions, and human approval. Missing or conflicting
support must remain `Unknown`.

## Users, buyers, and stakeholders

| ID | Role | Product relationship | Primary need |
|---|---|---|---|
| USR-OA-01 | Client compliance, quality, or program owner | Primary day-to-day user | Maintain operating truth, answer questions, assign evidence/actions, and see unresolved work |
| USR-OA-02 | Policy or SOP owner | Contributor | Maintain the current approved policy/SOP and respond to change or review triggers |
| USR-OA-03 | Frontline SOP user or evidence contributor | Contributor | Supply the requested evidence for an assigned procedure or obligation |
| USR-OA-04 | Independent assurance reviewer | Reviewer | Assess provenance and evidence state, return gaps, and review closure evidence without declaring compliance automatically |
| USR-OA-05 | Training or competency owner | Downstream owner | Review whether a policy/SOP change affects learning, assessment, renewal, or acknowledgement |
| USR-OA-06 | Qualified clinical, legal, or operational reviewer | Conditional authority | Decide questions outside ordinary operational review |
| USR-OA-07 | Security/privacy and technical owner | Control owner | Decide tenancy, source handling, retention, audit, and architecture boundaries |
| USR-OA-08 | Product owner | Product authority | Decide scope, fit, status, investment, and lifecycle advancement |
| USR-OA-09 | Assigned consultant | Primary oversight user | Configure the engagement, supervise several clients, review answers, manage exceptions, and review closure evidence |
| USR-OA-10 | Client executive or committee member | Read-only decision consumer | See open risks, actions, due dates, decisions, and evidence-backed closure |
| USR-OA-11 | Consulting-firm operations administrator | Business operator | Manage consultant assignments, client separation, templates, workload, and service governance |

**[Proposed] buyer model:** the consulting firm is the initial platform
operator and distribution channel; the client organization is the tenant and
may later become the direct buyer. Buyer preference and pricing are
**[Unknown]**.

Regulators, accreditors, and surveyors are evidence consumers, not direct
first-release users. External access is deferred.

## Jobs to be done

| ID | User | Job | Completion condition |
|---|---|---|---|
| JOB-OA-01 | USR-OA-01 | Ask what approved policy, SOP, and evidence are linked to a requirement, what each source supports, and what remains unverified as of a stated date | A reviewed answer or explicit gap exists with exact lineage |
| JOB-OA-02 | USR-OA-09 | Supervise several client engagements without reconstructing each client's state from drives and spreadsheets | Assigned queues, exceptions, stale sources, overdue evidence, and actions are visible by client |
| JOB-OA-03 | USR-OA-03 | Respond to one evidence request with the correct item and context | Evidence is linked, versioned, and ready for review |
| JOB-OA-04 | USR-OA-04 | Decide whether evidence supports the requested statement and what remains unresolved | Evidence is accepted, returned, rejected, or marked stale with rationale |
| JOB-OA-05 | USR-OA-02 | Determine what must be reviewed after an authority, policy, or SOP changes | Affected answers, evidence, actions, and training are marked for human review |
| JOB-OA-06 | USR-OA-10 | Understand what remains open and why | Every displayed status links to source, owner, decision, due date, and evidence |

## Primary workflow and outcome

### WF-OA-01 - Consultant-supervised assurance question

1. An authorized user opens one client/facility workspace.
2. The client owner or consultant records a question and its intended context.
3. Approved authority and requirement records are selected with exact version,
   citation, jurisdiction, pre-approved applicability posture, named qualified
   authority, authority scope, as-of date, and currentness.
4. The current organization policy and SOP versions are linked.
5. Required evidence is identified and assigned.
6. A contributor supplies evidence or records that it is missing.
7. A reviewer evaluates the evidence as `Unknown`, `gap`, `under review`, or
   `evidenced`; the system does not convert that state into compliance.
8. A structured answer is drafted from the approved lineage. Each material
   statement identifies a permitted excerpt or locator, support
   classification, applicability rationale, source/version, and as-of date;
   conflicts or missing support remain explicit.
9. The assigned consultant or qualified reviewer approves, returns, or
   supersedes the answer.
10. A gap may become a corrective action with owner, due date, and required
    closure evidence.
11. Closure evidence is independently reviewed where required.
12. A source, policy, or SOP change marks affected answers and evidence for
    re-review and may trigger a training review.

The proposed first release tests steps 1 through 9 with one pre-seeded source
chain and one evidence response. Corrective-action management, closure, and
change propagation remain later product capabilities.

### OUT-OA-01 - Minimum product outcome

An authorized client user can obtain one human-reviewed, source-linked answer
or explicit gap from pre-seeded immutable authority, policy, and SOP references
plus one evidence response. Every material statement preserves its locator,
support classification, pre-approved applicability rationale and named
authority, reviewer authority, and as-of date.

## Current experience and alternatives

### Current operating experience

**[Documented]**

- Shared drives are the practical record system.
- Word/PDF policies and procedures preserve narrative and approval artifacts.
- Excel trackers, calendars, checklists, and logs coordinate recurring work.
- Consultant packets, walkthroughs, meetings, findings, and closeout records
  connect the pieces temporarily.
- Client folders mix templates, active-looking records, archives, external
  sources, and completed work.

### Representative current products

These are vendor-reported capabilities from official public pages, not
independently verified implementations.

| Alternative | Vendor-reported overlap | Product implication |
|---|---|---|
| [RLDatix Policy Management / PolicyStat](https://www.rldatix.com/en-nam/module/policy-management/) | Healthcare policy lifecycle, searchable policies, standards links, reporting, multi-location support, and links into other RLD modules | Do not compete as another policy repository; cross-module closed-loop behavior remains unverified |
| [symplr Compliance](https://www.symplr.com/products/symplr-compliance) | Healthcare standards content, policy/document management, audits, evidence, risk, issue/action management, corrective action, and reporting | Validate whether the proposed lineage and consultant control plane are materially different |
| [Joint Commission Tracers with AMP](https://www.jointcommission.org/en-us/products/atp) | Standards-based observations, findings, dashboards, tasks, follow-up, plans of correction, and progress tracking | Do not make generic tracer/checklist depth the wedge |
| [MedTrainer Compliance](https://medtrainer.com/products/compliance-overview/) | Policy lifecycle and acknowledgements, learning, credentialing, incidents, survey reports, outdated-policy detection, suggested regulatory edits, and regulatory AI assistance | Defer LMS, credentialing, and broad replacement-suite ambitions |
| [NAVEX policy management](https://www.navex.com/en-us/platform/policy-procedure-management/) | Policy lifecycle, approval, attestation, audit trails, training links, internal-policy Q&A, and connections to the broader NAVEX GRC platform | Keep healthcare assurance lineage and client evidence central; suite-level closed-loop behavior remains unverified |
| [Healthicity Compliance Manager](https://www.healthicity.com/solutions/compliance/software) | Incidents, audits, risk, policy attestations, finding-linked training, documented corrective actions, and advisory/consulting services | Service plus software is not differentiated; an embedded assigned-consultant control plane is not publicly verified |
| [Surglogs](https://surglogs.com/) | Standards-change notices, standards-to-policy links, policy generation/approval/signing, attached evidence, logs, tasks, and accreditation monitoring | Strongest public-page challenge to the proposed loop; compare the complete workflow directly |

**[Inferred]** The market is crowded at the feature level. The product should
initially complement or integrate with incumbent policy, LMS, credentialing,
and document systems rather than claim replacement.

Before formal PRD acceptance, the team must compare this exact workflow in at
least one incumbent demonstration or buyer-controlled current-tool
walkthrough, then record a build, integrate, buy, or stop posture. Public
feature pages alone are insufficient.

## Capability inventory

### Evidence-supported operating capabilities

| Capability | Current evidence | Product status |
|---|---|---|
| Policy and SOP structures | Repeated source artifacts and templates | Documented pattern |
| Evidence requests, tracers, findings, and closure | Repeated survey/readiness artifacts | Documented pattern |
| Reporting, monitoring, logs, and trackers | Visible in 56.0% of current-labeled workspaces | Documented pattern |
| Multi-scope engagements | 42.9% expose at least three scope families | Documented pattern |
| Consultant methods and reusable tools | 69.5% of the methods collection is shared capability/reference material | Documented delivery asset |
| Longitudinal operating adoption | Owner-reported use since 2020, corroborated by dated 2019-2026 artifacts and recurring annual cycles | Strong method-adoption evidence; not software adoption |
| Expert-demonstration corpus | Repeated evidence, finding, action, plan-of-correction, review, training, and closeout structures | Strong candidate product-intelligence asset; content eligibility not yet audited |
| Survey-heavy behavioral-health work | 69.0% of recorded survey events in the historical ledger | Documented historical activity proxy |

The owner reports that the connected method has been used in delivery since
2020, and the artifact families corroborate its longitudinal recurrence. The
aggregate percentages still overlap and do not prove that every engagement
completed every step or that every plan of correction produced an effective
outcome. The first release therefore stops at a reviewed answer or explicit
gap while requirements planning treats action/closure logic as a corpus-backed
later capability.

### Potentially reusable Clarity patterns

**[Verified]** The repository contains:

- organization-scoped types and audit actors;
- versioned document command foundations;
- human-reviewed evidence states;
- correction, supersession, contradiction, and immutable-history patterns;
- tenant predicates and audit-writing foundations;
- separate readiness dimensions;
- a development-time public regulatory-corpus tool; and
- a synthetic Training & SOPs prototype.

**[Verified]** Those contracts and services are case-oriented. No
organization-policy, assurance-question, corrective-action, or consultant
portfolio domain exists.

### Missing product capabilities

- organization/facility workspace and multi-client consultant assignment;
- approved authority and requirement record;
- organization policy/SOP control record independent of a patient case;
- explicit authority-policy-SOP-evidence lineage;
- assurance question and reviewed answer record;
- gap, corrective action, closure evidence, and re-open behavior;
- consultant review queues and exception model;
- source rights, applicability, currentness, and qualified-review model;
- tenant-safe search and question-answering boundary;
- integrations with existing policy/LMS/document systems;
- commercial administration, onboarding, support, and service-level model; and
- validated user value, usability, pricing, and retention evidence.

## Domain, data, permissions, integrations, and architecture context

### Conceptual records

The product definition requires these conceptual records. They are not schema
or implementation authorization:

- organization tenant and facility;
- user, role, and client/consultant assignment;
- authority source, version, citation, jurisdiction, rights, and currentness;
- requirement and applicability posture;
- policy record and version;
- SOP record and version;
- evidence request and evidence item;
- assurance question, structured answer, review, and supersession;
- gap or finding;
- corrective action and closure evidence;
- decision, comment, notification, and audit event.

### Source-of-truth ownership

**[Proposed]** The client's approved document or policy system continues to
own policy/SOP content, approval, and current-version status. The issuing
authority or authorized licensed source continues to own external authority
text and official status. Qualified humans continue to own applicability,
interpretation, compliance, clinical, and legal conclusions.

Operating Assurance Workspace owns only its immutable source references
(source ID or URI, version or hash, locator, and verified-as-of date), lineage,
evidence-request and review state, reviewed answer and supersession history,
follow-up/action state, and audit history. It must not become a shadow policy
repository.

### Platform-intelligence corpus

**[Inferred]** The longitudinal collection can become a major product
advantage because it contains expert demonstrations of evidence collection,
workflow execution, findings, plans of correction, review, closure, and
subsequent policy or training changes.

Raw files are not automatically training-ready. The governed corpus must
separate:

- firm-owned reusable methods and templates;
- public or properly licensed authoritative sources;
- client-private policy, SOP, evidence, finding, and action records;
- permissioned and de-identified expert demonstrations;
- held-out, human-adjudicated evaluation cases; and
- quarantined material with unresolved rights, privacy, licensing, provenance,
  currentness, or correctness.

The recommended intelligence order is domain ontology, workflow/state logic,
template configuration, gold evaluation cases, tenant-private retrieval,
human-reviewed assistance, and only then selective training or fine-tuning
when rights and measured advantage justify it.

The canonical strategy is
`docs/discovery/operating-assurance/PLATFORM_INTELLIGENCE_CORPUS_STRATEGY.md`.
No ingestion, extraction, retrieval, or model training is authorized here.

### Permission model

**[Proposed]**

- Client users can access only their organization/facility workspaces.
- Consultants can access only explicitly assigned clients.
- Consulting administrators can manage assignments but do not receive
  unrestricted client-content access by default.
- Contributors can submit evidence but cannot approve their own material where
  independent review is required.
- Only assigned reviewers can publish or supersede an answer.
- External surveyor/regulator access is out of scope for the first release.
- Every mutation and material read/export is attributable and auditable.

Before a formal PRD is accepted, the product boundary must preserve a
conceptual trust order from platform operator to consulting service
organization, client tenant, facility, assigned consultant principal, and
explicit scoped user grant. Cross-client templates may be owned by the
consulting firm but must not contain client content. This is an authority
boundary, not a technical architecture.

### Integration posture

**[Proposed] first release:** one facility and three actors use pre-seeded,
immutable source references with a synthetic/source-sanitized dataset. No
Drive synchronization, source/policy authoring, bulk ingestion, OCR,
embeddings, open-web retrieval, EHR, LMS, credentialing, email, messaging, or
regulatory-feed integration.

**[Proposed] later:** prefer source-system links and governed integrations over
replacement. A public regulatory change may create a human review trigger; it
must never silently update applicability or policy.

### Product and repository home

**[Proposed]** Treat Operating Assurance Workspace as a separate adjacent
product. Reuse Clarity patterns only after explicit contract and tenancy
review. The current Clarity worktree is a temporary discovery/governance
location, not an implementation decision.

OD-16 remains open and blocks Execution Architecture.

## Success model

### Definition-stage success

- The owner accepts the user, workflow, outcome, product boundary, and
  first-release thesis. **Passed on 2026-07-30.**
- An operational/compliance reviewer agrees that evidence states do not imply
  compliance. **Required during Product Requirements Planning.**
- The product-home decision has a named owner and deadline before architecture.

### First-release validation evidence

| Measure | Evidence required | Current state |
|---|---|---|
| End-to-end completion | One synthetic question completed through a reviewed answer or explicit gap | No measurements found |
| Provenance completeness | Every published material statement links to exact source, locator, version, applicability rationale, and as-of date | No measurements found |
| Fail-closed behavior | Missing, stale, conflicting, or unauthorized support produces `Unknown` or a block | No measurements found |
| Client self-service | Steps completed by the client without consultant execution | No measurements found |
| Consultant leverage | Consultant touches and review-queue time per completed cycle | No measurements found |
| Coordination effort | Directional time, prompts, lookups, rework, and handoff failures versus the current alternative | No measurements found |
| Maintenance burden | Source/policy/evidence fields judged useful versus duplicative or too costly | No measurements found |
| Safety | Cross-tenant, false-authority, false-compliance, and unsupported-answer failures | No measurements found |

These are software-specific validation measures. They do not negate the
established use of the underlying consulting method. No software ROI,
time-savings, compliance, survey-pass, or outcome claim is supported.

## Maturity assessment

| Dimension | State | Evidence |
|---|---|---|
| Opportunity definition | Defined | Owner direction plus portfolio and source-pattern evidence |
| Product definition | Accepted for requirements planning | Owner decision plus this brief |
| Primary workflow | Established consulting method; proposed software workflow | Owner-reported use since 2020, longitudinal artifacts, and WF-OA-01 |
| Consultant method adoption | Established | Owner-reported longitudinal use corroborated by recurring dated delivery artifacts |
| Client-operated software adoption | Not started | No software product or client-interface walkthrough exists |
| Market differentiation | Partially understood | Bounded official-source scan; no vendor demos or buyer interviews |
| Requirements | Not started | First-release scope is a proposal, not a PRD |
| Architecture | Not started | OD-16 open |
| Runtime product | Not started | No implementation exists |
| Security/tenancy and corpus governance | Conceptual only | R-13, R-18, R-19, and R-20 open |
| Pilot evidence | Not started | No pilot authorized |
| Service value | Strong indirect evidence | Sustained owner-reported use while building the consulting business; economics unmeasured |
| Software commercial evidence | Unknown | No software pricing, willingness-to-pay, win/loss, or retention evidence |

## Assumption register

| ID | Assumption | Fastest validation | Failure condition |
|---|---|---|---|
| ASM-PI-01 | Client owners will operate the workspace rather than forward work to the consultant | Facilitated role-based walkthrough | Client cannot or will not own assigned steps |
| ASM-PI-02 | Consultant review can be exception-based enough to create leverage | Instrument consultant touches and queue time | Every routine item needs synchronous consultant work |
| ASM-PI-03 | Exact lineage is more valuable than an incumbent repository or checklist | Buyer workflow comparison and vendor demo | Existing tools already solve the job adequately |
| ASM-PI-04 | A reviewed answer with `Unknown` is useful without an automated compliance verdict | Observe answer-review scenario | Users reject the answer unless the system declares compliance |
| ASM-PI-05 | The first release can avoid protected and unlicensed source content | Synthetic/public-source test | Meaningful completion requires restricted content |
| ASM-PI-06 | One segment-neutral administrative workflow can be tested before selecting a segment-specific configuration | Compare the same question pattern with an available design partner and later across segments | The first participant requires segment-specific records or rules before the core job can be evaluated |
| ASM-PI-07 | The consulting firm can convert its established delivery role into an effective software operator and channel | Commercial and operating-model test | Clients require direct vendor ownership or consultants resist the software workflow |
| ASM-PI-08 | Existing Clarity patterns reduce later effort without forcing case concepts | Contract review during architecture | Reuse creates unsafe coupling or more migration cost than value |

## Contradictions and unresolved questions

1. **Scale versus oversight:** consultant review protects quality but can
   preserve the labor bottleneck.
2. **Easy Q&A versus governed authority:** conversational speed cannot hide
   missing, stale, conflicting, unlicensed, or inapplicable sources.
3. **Broad platform versus first release:** the portfolio supports many modules,
   but feature breadth would erase the testable wedge.
4. **Clarity reuse versus product integrity:** reusable patterns exist, but the
   governing domain object and users differ.
5. **Client operation versus firm control:** client ownership must not weaken
   consultant review, while consultant controls must not prevent self-service.
6. **Evidence versus compliance:** an evidence record, checklist, or closed
   action is not proof of compliance or control effectiveness.
7. **Initial segment:** behavioral-health facility work has the strongest
   historical survey signal, while RHCs form a large coherent portfolio lane.
   Neither proxy proves initial demand. The first test should use the available
   authorized design partner and a segment-neutral, nonclinical administrative
   question; segment selection must be refined during requirements planning.

## Principal risks

- R-13 - tenant or source-boundary disclosure;
- R-14 - non-authoritative material presented as authority;
- R-15 - evidence represented as compliance or effectiveness;
- R-16 - undifferentiated incumbent overlap;
- R-17 - consultant oversight bottleneck; and
- R-18 - unsafe or falsely authoritative knowledge answer;
- R-19 - unauthorized corpus reuse; and
- R-20 - historical examples learned as universal truth.

## Product story versus product truth

| Product story | Current truth |
|---|---|
| Massive regulatory knowledge base | No approved corpus, rights model, applicability model, or runtime exists |
| Easy consultant and client Q&A | A safe answer contract is proposed; no retrieval or answer behavior exists |
| Client-operated platform | User model is owner-directed; no direct client workflow evidence exists |
| Consultant oversight at scale | Oversight model is proposed; workload leverage is unmeasured |
| Untested operating concept | The consulting method has longitudinal operating adoption; the software product remains unbuilt and untested |
| Historical files are ready-made training data | The collection is a strong candidate expert-demonstration corpus; training eligibility is unknown until rights, privacy, licensing, provenance, currentness, and label-quality review |
| Cross-referenced policy, SOP, and evidence | The source pattern exists; no product record or linkage exists |
| Survey-ready and compliant | The product may organize evidence and gaps; it may not declare compliance or guarantee survey outcomes |
| Reuse Clarity | Some patterns are verified; product and technical reuse are undecided |

## Canonical product definition

### What it is

A separate, adjacent, multi-tenant operating-assurance product for
consultant-led healthcare engagements.

### Who it serves

The primary day-to-day user is a client compliance, quality, or program owner.
The primary oversight user is the assigned consultant. Contributors, reviewers,
executives, and conditional domain authorities participate through bounded
roles.

### What job it completes

It turns one operating or survey-readiness question into an inspectable,
human-governed chain from exact authority to current organization policy and
SOP, supporting or missing evidence, reviewed answer, and—when needed—follow-up
action whose closure evidence can be reviewed.

### How it works

The client operates inside its organization/facility workspace. The consultant
configures, supervises, reviews, and manages exceptions across assigned
clients. The knowledge layer uses approved, versioned, tenant-authorized
sources and fails closed when support is missing or conflicting.

### What completion means

Initial completion is a reviewed answer or explicit `Unknown`/gap with
claim-level support and a preserved audit trail. A later corrective-action
workflow may add an owner, due date, and reviewed closure evidence. Neither
branch is a compliance determination.

### Product boundary

The product does not replace a policy authoring suite, LMS, credentialing
system, incident hotline, EHR, legal service, clinical judgment, regulator, or
accreditor. It does not autonomously determine applicability, compliance,
clinical appropriateness, legal sufficiency, competency, or control
effectiveness.

### Product-home recommendation

Keep the product separate from Clarity's crisis-access case domain. Evaluate
reuse of versioning, evidence review, audit, and tenancy patterns later through
OD-16 and Execution Architecture.

## Proposed first-release boundary

The companion
`docs/discovery/operating-assurance/FIRST_RELEASE_SCOPE_PROPOSAL.md` defines a
single validation release around OUT-OA-01. It is not a PRD, executable work
package, architecture, or implementation authorization.

## Quality gate

| Check | Result |
|---|---|
| Prior opportunity artifact accepted for Product Intelligence | Passed |
| Product, users, workflow, outcome, and boundary defined and owner-accepted | Passed |
| Longitudinal consulting-method adoption and practical value evidenced | Passed - owner-reported use since 2020, corroborated by dated recurring artifacts |
| Portfolio and source-pattern evidence preserved | Passed |
| Current alternatives examined using official sources | Passed; vendor behavior not independently verified |
| Repository capability and product-home contradiction identified | Passed |
| Client-operated software validation present | Not started - carried into requirements and later validation; does not block PRD |
| Software baseline or result measurements present | Not started - No measurements found; does not block PRD |
| Historical corpus strategy defined | Passed at strategy level; content rights and eligibility remain unaudited |
| First-release recommendation bounded | Passed |
| Requirements or implementation started | Passed - neither started |
| Privacy, tenant, authority, and no-false-compliance boundaries retained | Passed |

**Exit verdict: `Ready for product requirements planning`.**

The owner has accepted the product thesis and clarified that the underlying
consulting system has longitudinal operating adoption. Software adoption,
consultant leverage, ROI, incumbent preference, and corpus eligibility remain
unknown, but they are requirements, validation, and pilot concerns rather than
Product Intelligence blockers.

**One immediate next action:** when authorized, enter
`product-requirements-planning` for the reviewed-answer-or-explicit-gap release
and a governed corpus/evaluation workstream. Architecture, implementation,
live corpus ingestion, retrieval, model training, pilot, and deployment remain
unauthorized.
