# Clarity Platform — Repository Product Intelligence Brief

**Prepared:** 2026-07-29 · **Analyst role:** incoming product strategy / systems analysis
**Repository state examined:** worktree `clarity-build-to-goal-operating-doc-011dc7`, branch `claude/repo-product-intelligence-a4a509` (descendant of `main` @ `8399edd`), plus all 89 local refs and open PRs #29/#30/#32.
**Evidence labels used throughout:** `[V]` Verified (working code / passing test / schema / config), `[D]` Documented (stated in repo docs, not confirmed in implementation), `[I]` Inferred (pattern-supported, not stated), `[U]` Unknown.

---

## 0. What I ran this session (verification basis)

| Check | Command | Result |
|---|---|---|
| Unit + security suites (no DB) | `npx vitest run tests/unit tests/security` | **103/103 passed** `[V]` |
| Full root suite (DB-backed) | `DATABASE_URL=…clarity_dev npx vitest run` | **342/343 passed, 1 failed** `[V]` |
| Failing test | `tests/integration/migration-integrity.test.ts` | Local `clarity_dev` ledger contains **4 migrations not present on this branch** (`20260719222634_prescreen_phase3_persistence`, `20260719222650_prescreen_persistence_rls`, `20260720002049_packet11_persistence`, `20260720014914_network_review_append_only_audit`) `[V]` |
| Lint | `npm run lint` | Passed, zero output `[V]` |
| Prisma schema | `DATABASE_URL=… npx prisma validate` | "The schema at prisma/schema.prisma is valid" `[V]` |
| Typecheck | `npm run typecheck` | **Failed** — but see §18-C: the failure is a worktree module-resolution artifact, **not** evidence about this branch's code `[V]` |
| App prototype suite (64 tests claimed) | `cd app && npx vitest run` | **Could not run** — `app/node_modules` absent in this worktree. App claims remain *historical evidence*, unverified by me `[U]` |

Two things follow. First, the backend claims in `IMPLEMENTATION_STATUS.md` largely hold up under execution — this is an unusually honest repository. Second, the *one* failure is itself a product-relevant finding, not a flake: parallel agent branches are writing migrations into a shared local database, and `main` no longer describes the frontier of the work.

---

## 1. Executive Product Summary

**What it is.** Clarity is a **behavioral-health case coordination and audit system** for the operational gap between a psychiatric crisis referral and a patient physically arriving in an appropriate bed. It is not a clinical record system and not a decision engine. Its product proposition is *traceability under time pressure*: for every material action on a case, the system holds the source, the uncertainty, the rule that applies, the owner, the deadline, and the history `[D: README.md:25, docs/product/PRODUCT_VISION.md:20]`.

**Who it is for.** The repository names eight stakeholder roles and implements demo scoping for all eight `[V: app/src/domain/roles.ts]`. But **who the *primary* user is remains genuinely unresolved** — the repository contains two mutually exclusive answers written ten days apart (see §5 and §18-A).

**What problem it solves.** Crisis placement work is fragmented across phone calls, faxes, PDFs, spreadsheets, and whiteboards. The same patient story gets retold at each handoff; clinical, legal, benefits and placement work run in parallel with no shared spine; missing collateral and unsupported risk claims surface too late; and after the fact nobody can prove what was sent, to whom, or why a facility declined `[D: README.md:17-23]`. The repository's own strongest grounding for this is a real 44-sheet hospital operations workbook that its analysis describes as *"not just a budget spreadsheet — a manually operated hospital intelligence system"* `[V: reporting-metrics-rebuild-package/REPORTING_METRICS_REVERSE_ENGINEERING.md:5]`.

**How it solves it.** A single canonical case record (`BehavioralHealthCase`) with eight independent parallel workstreams, behind a uniform **command pattern**: strict Zod envelope → explicit role policy → one database transaction that does tenant-scoped reads, runs a state machine on the fresh row, performs a version-guarded conditional UPDATE, and writes an append-only audit event plus an idempotency record atomically `[V: packages/case-service/src/caseCommandService.ts, packages/case-repository/src/caseCommandGateway.ts, 342-test suite]`. On top of that spine sit human review gates, an immutable evidence layer, and a hash-chained custody ledger (the ledger currently exists only in the frontend prototype).

**What makes the approach distinct.** Three things are unusual and defensible:

1. **Invariants enforced structurally, not by policy.** "Financial readiness never blocks emergency clinical review" is a passing test. "Evidence source text is immutable" is enforced because no change-set type can express the update. "A benefits quote cannot be recorded without the not-a-payment-guarantee disclaimer" is a schema-level requirement `[V: docs/architecture/ADR-0008, ADR-0009; tests/integration/*]`.
2. **Aggressive refusal to score.** Readiness assessments return *named gaps*, never an aggregate number — there is a test asserting the absence of a composite score `[V: ADR-0010, tests/unit/readiness.test.ts]`. This is a deliberate rejection of the payer-weighted-priority pattern.
3. **A working truth-discipline apparatus.** Every claim in the repo is bucketed (verified / scaffolded / documented-only / blocked), honesty statements enumerate what is *not* claimed, and the phrase `No measurements found` is used literally in the UI where a metric would normally be invented `[V: IMPLEMENTATION_STATUS.md, app/src/domain/roleFocus.ts]`.

**What stage it is in.** **A tested backend foundation with no user-reachable product.** Nine to eleven service packages are implemented and integration-tested against PostgreSQL; a React prototype demonstrates the intended experience against `localStorage`; exactly **two** functional paths connect them (login/session, and one command: record-decision-rationale). There is no deployment, no hosting, no live integration, and no user validation. The repository's own roadmap says this plainly: *"none of the product is user-reachable"* `[V: docs/planning/MVP_ROADMAP.md:7]`.

---

## 2. One-Sentence Product Definition

**Best-supported version:**

> This product helps a **receiving psychiatric facility's central-intake team** `[contested — see §18-A]` accomplish **a defensible, source-linked crisis placement decision with a provable audit trail** `[V]` by **carrying one structured case record through parallel clinical, legal, benefits and placement workstreams behind human review gates** `[V for spine; D for the full chain]`, without **re-collecting the patient story at every handoff or reconstructing after the fact who sent what, to whom, and why it was declined** `[D]`.

**Inferred / contested elements flagged:**
- "receiving psychiatric facility" is `[D, 2026-07-17]` and contradicted by `[D, 2026-07-08]` and `[V: app/src/domain/roles.ts]`.
- "provable audit trail" is `[V]` at the application layer; database-level append-only enforcement does **not** exist `[V: MVP_ROADMAP.md:50]`, so "provable" currently means "tested application invariant", not "tamper-evident storage".
- The full parallel-workstream chain is `[V]` as contracts and state machine, `[D]` as an end-to-end user experience.

---

## 3. Product Idea and Strategic Thesis

### The central idea `[D]`

Behavioral-health crisis access fails not for lack of clinical knowledge but for lack of **operational memory**. If you make the case's evidence, gaps, rules, owners and clocks explicit and reviewable, qualified humans make faster and more defensible decisions — and the organization can finally measure where the delay actually is.

### The belief about behavior behind it `[I]`

The repository never states a market thesis, but three artifacts imply one:
- A real hospital ran its entire inpatient/IOP/UR/staffing/revenue intelligence out of a 44-sheet, 3,933-formula spreadsheet `[V: reporting-metrics-rebuild-package/REPORTING_METRICS_REVERSE_ENGINEERING.md]`. The implied belief: *the status quo is spreadsheets and binders, not competing software.*
- The consistent design choice to make gaps and contradictions **visible rather than resolved** implies a belief that operators do not trust automated judgment in this domain and will reject anything that hides its reasoning `[V: GOVERNANCE.md invariants 3, 4, 6].
- The e-PEC / facility-profile "configuration, not truth" pattern implies a belief that **jurisdiction and facility variation is the real moat** — a second state or a second hospital should be a config object, not a code fork `[V: app/src/domain/epecRuleSets.ts; D: docs/workflows/INTAKE_TO_ADMISSION_WORKFLOW.md:71-87]`.

### The current alternative / workaround `[D + I]`

Phone calls, faxed packets, PDF attachments, whiteboards, and the workbook. Named explicitly in the MVP definition: *"replacing the binder/fax/whiteboard status quo"* `[V: MVP_ROADMAP.md:26]`.

### The proposed advantage `[D]`

Not intelligence — **traceability plus coordination**. The roadmap is emphatic that pilot value must be pitched as workflow/audit/coordination with *"no AI promises in pilot conversations"* `[V: MVP_ROADMAP.md:59]`, even though "AI" appears in the umbrella product name.

### Assumptions that must be true for the thesis to hold

| # | Assumption | Status |
|---|---|---|
| T1 | Crisis-placement delay is dominated by coordination/documentation friction, not by bed scarcity | `[U]` — no measurement anywhere in the repo (OD-12) |
| T2 | Operators will do more structured capture up front in exchange for later reuse | `[U]` — zero user validation (MVP_ROADMAP blind spot #1) |
| T3 | Audit/defensibility is a purchase driver, not just a compliance checkbox | `[U]` |
| T4 | Facility- and jurisdiction-variation can be expressed as configuration | `[V]` for e-PEC (one rule set implemented, second is a config object); `[D]` for facility admission profiles (no implementation) |
| T5 | The buyer is the receiving facility (or the grant-funded public-safety agency) | `[U]` — two incompatible strategy documents exist (§14) |

---

## 4. Problem Definition

**Primary problem `[D]`.** Between the moment a person in behavioral-health crisis is identified and the moment they are accepted into an appropriate level of care, the case's *facts* degrade. Each handoff re-collects, re-types, and re-interprets; the legal instrument, the medical-necessity argument, the insurance position, and the bed decision are all being assembled in parallel by different people with no shared record of what is known, what is missing, and who owes the next step.

**Who experiences it.** Field responders and mobile-crisis staff (re-telling), central-intake coordinators (chasing), clinician reviewers (deciding on incomplete evidence), UR/benefits specialists (working a lane that is invisible to the clinical lane), receiving-facility intake (deciding from a thin packet), charge nurses (placing on bed count rather than milieu), compliance officers (reconstructing after the fact) `[V: docs/09-personas-and-role-ux.md; app/src/domain/roles.ts]`.

**When it occurs.** During an active emergency, on statutory clocks (Louisiana OPC → PEC → CEC), with incomplete collateral, across organizational boundaries `[V: app/src/domain/epec.ts; reference/source-documents/louisiana-obh-forms/ contains the actual OBH-1/OBH-2/OBH-20 state forms]`.

**Why current solutions are insufficient `[I, from the source workbook analysis]`.** EHRs are organization-internal and do not span the sending→receiving boundary. Spreadsheets carry the operational intelligence but break silently (the audit found 3,933 formulas and hundreds of error cells across sheets). Nothing in the status quo produces an audit trail of *why* a placement decision was made.

**Consequences `[D]`.** Operational: ER boarding, repeated intake, unplaced patients. Financial: denied days, process denials from missing authorization or documentation gaps `[V: reporting-metrics-rebuild-package/METRIC_DEFINITIONS.md — "Process Denials" is a named metric in the real workbook]`. Legal: unprovable custody chains on involuntary holds. Emotional: patients re-telling trauma at each handoff `[I]`.

**Root problem vs. visible symptoms `[I]`.** The visible symptom is slow placement. The root problem the architecture actually attacks is **absence of a shared, auditable case spine across organizational boundaries** — which is why the two hardest unresolved decisions in the repo are both about crossing that boundary (cross-organization prescreen submission, and provider/RLS tenancy).

**Honest limit.** The repository contains **no user research, no interviews, no support tickets, no usage data, and no baseline measurements.** The problem statement is authored by the owner — a domain expert, but a single source. `MVP_ROADMAP.md:55` names this as blind spot #1: *"Zero user validation."*

---

## 5. Users and Stakeholders

Eight roles are implemented as demo scoping; three more are defined but unimplemented. **Role scoping in the prototype is display-only and grants no security guarantee** — stated in the code itself `[V: app/src/domain/roles.ts:60-62]`. Separately, thirteen `UserRole` enum values exist server-side and *are* enforced `[V: prisma/schema.prisma:32-46; packages/*/src/permissions.ts]`. These two role systems do not correspond one-to-one — see §11.

| Role | Context | Jobs to be done | Decisions they make | Inputs | Outputs | Definition of success | Evidence | Conf. |
|---|---|---|---|---|---|---|---|---|
| **Field responder** (LE / mobile crisis) | On scene, minutes, no clinical training | Capture the story once, plainly | None clinical — everything stays Draft | Presenting problem, what happened, danger to self/others, collateral contacts | A Draft case + source-linked risk findings | Handoff without re-telling | `[V]` roles.ts, GuidedIntake field mode; `[D]` docs/09 §1 | High |
| **Central intake coordinator** | Desk, many cases, SOP owner | Keep every case moving; escalate before clocks breach | Sequencing, escalation, packet send | Whole pipeline | Referral packet, routing broadcast | No case stalls unseen | `[V]` roles.ts, CommandCenter.tsx, `INTAKE_COORDINATOR` policy | High |
| **Clinician reviewer** | Licensed; signs off | Turn drafts into defensible documentation | Clinical approval; risk formulation | Assessment, evidence, drafts | Reviewed assessment, necessity narrative | Nothing clinical ships unreviewed | `[V]` roles.ts, MedicalNecessity.tsx, `CLINICAL_REVIEWER`/`PHYSICIAN_REVIEWER` | High |
| **UR / benefits specialist** | Parallel financial lane | Clear the financial lane without blocking clinical | Coverage/eligibility/benefit recording | Insurance evidence (must be APPROVED first) | Coverage, eligibility attempts, benefit quotes with disclaimer | Financial lane never gates care | `[V]` benefits-service, 16 tests | High |
| **Receiving facility intake** | External counterparty; thin time | Decide accept/decline fast, with a reason | **Acceptance** | Referral packet | Structured response + reason code | Fast, learnable decisions | `[V]` roles.ts, RoutingResponse.tsx, `FACILITY_REVIEWER` | High |
| **Charge nurse** | Unit floor, safety-critical | Place for milieu safety, not bed count | **Final placement**; override with reason | Bed grid, occupant acuity, flags | Placement decision + ledger event | Safe milieu | `[V]` Bedboard.tsx, bedboard.test.ts | High |
| **Compliance / legal officer** | Periodic auditor, counsel liaison | Prove chain of custody; flag unvalidated statutory language | Clears counsel-validation flags (workflow deferred) | Ledger, clocks | Verification / tamper detection | Chain verifiable | `[V]` CustodyLedger.tsx, hashLedger.test.ts | High |
| **Executive / program director** | Read-focused oversight | See throughput and risk | Investment / pilot decisions | Counts only | — (deliberately shows `No measurements found`) | Measure before claiming | `[V]` roleFocus.ts | High |
| Referring ED clinician, transport coordinator, guardian/family portal | — | — | — | — | — | — | `[D]` docs/09 §"Defined, Not Yet Implemented" | — |

**Buyer.** `[U]` — no pricing, contract, procurement, or sales artifact exists in the repository. Two *candidate* buyers appear: a receiving psychiatric hospital `[D: INTAKE_TO_ADMISSION_WORKFLOW.md:23]`, and a grant-funded sheriff's office / crisis agency `[D: docs/product/CLARITY_GRANT_CONCEPT_NOTE.md, open PR #30]`.

**Beneficiary.** The patient — who is modeled only as a `PatientToken` and is never a user `[V: prisma/schema.prisma:407]`. There is no patient- or family-facing surface, and the guardian/family portal is explicitly blocked on a 42 CFR Part 2 consent engine that does not exist `[D: docs/09:101]`.

**Systems acting as stakeholders `[I]`.** The Louisiana Office of Behavioral Health (form authority — its actual PDFs are in the repo), payers (denial authority), and counsel (blocking authority via OD-2). None are integrated; all three hold veto power over features that are already built as demo logic.

### ⚠ The primary-user contradiction

Three artifacts, three answers:

| Source | Date | Primary user |
|---|---|---|
| `docs/09-personas-and-role-ux.md` | 2026-07-08 | Field responder leads the journey; central intake is "the SOP owner" |
| `README.md:31` | current | "Crisis and central-intake teams" listed first |
| `docs/workflows/INTAKE_TO_ADMISSION_WORKFLOW.md:23` | 2026-07-17 | **"The receiving facility is the primary user of the software."** ED "may also be a user, but the workflow must not assume it" |
| `docs/product/CLARITY_GRANT_CONCEPT_NOTE.md` (open PR #30) | ~2026-07-20 | Law enforcement / sheriff's office as procuring agency |

The most recent owner statement (07-17) is the narrowest and is **not reflected** in the implemented role model, the README, or the personas doc. This is the single most consequential unresolved product question in the repository.

---

## 6. Jobs to Be Done

| # | Job | Support |
|---|---|---|
| J1 | When I'm on scene with someone in crisis, I want to capture what happened in plain language, so I can hand off without re-telling it later. | **Partially implemented** — field-mode intake exists in the prototype `[V: GuidedIntake.tsx]`; it writes to `localStorage`, so the handoff does not actually happen `[V: storage.ts]` |
| J2 | When I'm running twelve cases, I want to see which one is about to breach, so I can escalate before it does. | **Prototype** — Command Center + compliance clocks are demo values; clock *enforcement* is blocked on counsel (OD-2) `[V: clocks.ts; D: OPEN_DECISIONS OD-2]` |
| J3 | When I sign a medical-necessity statement, I want every claim traced to a source I can see, so I can defend it. | **Directly supported (backend)** — evidence binds verbatim source text to an exact document version, immutable by construction, human-review-gated `[V: ADR-0008, 19 tests]`. Not reachable from any UI. |
| J4 | When I execute an involuntary hold, I want the instrument, timing and custody chain provable afterward. | **Prototype only** — OPC/PEC/CEC lifecycle + hash-chained ledger exist in the frontend `[V: epec.ts, hashLedger.ts, 267-line test]`; there is no server-side custody ledger, and all statutory content is `requires legal review` |
| J5 | When I send a packet, I want to send it once and get structured reasons back. | **Prototype / mocked** — packet build + hash seal + simulated facility response, all client-side `[V: packets.ts, RoutingResponse.tsx]`. No transmission mechanism exists. |
| J6 | When I verify benefits, I want to work in parallel without blocking clinical review. | **Implemented and tested (backend)** — four commands; identifiers structurally unstorable; disclaimer structurally attached `[V: ADR-0009, 16 tests]` |
| J7 | When I place a patient, I want milieu context, not just an empty bed. | **Prototype** — acuity/aggression/elopement flags, hard stops, reasoned override `[V: bedboard.ts]`; compatibility heuristics marked pending clinical validation |
| J8 | When I onboard into a role, I want to practice the SOP before doing it live. | **Implemented (prototype)** — Training & SOPs per role `[V: training.ts, TrainingSops.tsx]`. Notable: this is a *complete* job, unusual for a demo. |
| J9 | When I prescreen a referral, I want to know what's still missing for a specific target facility. | **Implemented (backend + HTTP)** — 6 commands + readiness view over authenticated HTTP, same-organization only, **in-memory (a restart loses it)** `[V: ADR-0014, 27+9 tests]` |
| J10 | As an executive, I want to know whether this made anything faster. | **Unsupported, deliberately** — the UI prints `No measurements found` `[V: roleFocus.ts]`. OD-12 |
| J11 | As a dispatcher/officer, I want to see which crisis provider has capacity right now. | **Documented only, on an open PR** — network-enrichment directory contracts `[D: PR #29/#30]` |

**Emotional and social jobs `[I]`.** "Don't let me be the person who couldn't prove why we placed them there" (defensibility) and "let me look competent to the receiving facility" (packet quality). Both are strongly implied by the design's obsession with review gates and reason codes; neither is stated.

---

## 7. Current User Experience

There are **two disconnected experiences**, and this is the defining UX fact about the repository.

### Experience A — the prototype (`app/`) `[V]`

- **Entry:** `cd app && npm run dev` → `http://127.0.0.1:5173`. No landing page, no signup, no discovery surface.
- **Authentication:** a **role dropdown** labeled "Viewing as", with the literal caption *"Demo role scoping only — not authentication"* `[V: App.tsx:585]`. A separate collapsible panel allows signing in against the real backend with a dev assertion string, and correctly states that the dropdown *"has no effect on this session"* `[V: App.tsx:587-634]`.
- **Onboarding:** none for the app itself; instead a **Training & SOPs** workspace teaches the *domain* role `[V]`.
- **Navigation:** 17 workspaces in a left sidebar, filtered by selected role. No routing — workspace is React state, so there are no URLs, no deep links, no back button, and no shareable case link `[V: App.tsx:88]`.
- **Core action:** create case → guided intake → add source-linked risk → review necessity draft → review legal draft → generate packet (hash-sealed) → simulate send → simulate facility response → verify custody chain.
- **Decision support:** review-status badges everywhere; prohibited-language guards; named missing items; explainable placement flags; `No measurements found` where a metric would be `[V]`.
- **Collaboration:** none. Single browser, single `localStorage` key (`clarity-intake-spine-v0.2`) `[V: storage.ts:4]`.
- **Notifications:** none. No email, no in-app alerts, no background jobs.
- **Analytics:** events are constructed with a `metricsSafePayload` and pushed onto an in-memory array; an `exportAnalyticsEvents()` function exists but **is called nowhere** `[V: analyticsEvents.ts; grep shows no callers]`.
- **Completion / follow-up:** the journey terminates at "facility accepted" plus ledger verification. There is no admission, no transport, no discharge, no return visit.
- **Failure recovery:** one button — **"Reset demo data"** — which wipes state `[V: App.tsx:652]`. The API client does have genuinely good error mapping, including a specific "API server is not running. Start it with: npm run api:dev" message `[V: api.ts:107]`.
- **Return usage:** state survives reload via `localStorage`; a shape check silently discards state from an older version `[V: storage.ts:8-11]`.

### Experience B — the real backend `[V]`

Reachable only via HTTP with a verified session. Ten routes exist: 3 auth, 1 case command, 6 prescreen `[V: packages/api-service/src/server.ts:249-363]`. There is **no user interface for any of it** except two touchpoints in the prototype (login panel; one decision-rationale call from the Legal Status workspace `[V: LegalStatus.tsx:106]`).

### Friction, dead ends, and hidden dependencies

| Issue | Evidence |
|---|---|
| **The two experiences barely touch.** 17 prototype workspaces; 1 of them writes to the real backend, via 1 of ~30 available backend commands. | `[V]` grep for `api` imports across `app/src` |
| **No URL state** → cannot link a colleague to a case; breaks every real coordination workflow. | `[V: App.tsx]` |
| **Role dropdown is a credibility hazard in demos.** It looks like access control and is explicitly not. Mitigated only by caption text. | `[V: roles.ts:60]` |
| **Requires a terminal.** Both experiences require `npm run dev` / `npm run api:dev`. | `[V: README.md:106-116]` |
| **Everything visible is Draft.** By design, but it means no user can complete a real outcome — the product currently has **no terminal success state a user can reach.** | `[V]` |
| **Hidden dependency: prescreen state is in-memory.** A user could complete a prescreen over HTTP and lose it on process restart. | `[V: ADR-0014 §4]` |

---

## 8. Core Product Workflows

Ranked by product importance.

### W1 — Case command lifecycle (the spine) — **IMPLEMENTED & TESTED**
- **User:** intake coordinator / clinical reviewer / org admin
- **Trigger:** a referral arrives
- **Preconditions:** verified principal; organization exists
- **Steps:** CreateCase → AssignCase → UpdateUrgency / UpdateLocation → TransitionCase → UpdateWorkstreamStatus → RecordDecisionRationale → CloseCase → (ReopenCase)
- **Decisions:** state transitions gated by the case state machine; reopen restricted to exactly `ORGANIZATION_ADMIN` with mandatory rationale, and `SYSTEM_ADMIN` provably cannot reopen
- **System actions:** tenant-scoped read → state machine on fresh row → versioned conditional UPDATE → atomic audit event + idempotency record
- **Data changed:** `BehavioralHealthCase`, `AuditEvent`, `CommandIdempotencyRecord`
- **Exceptions:** version conflict, terminal-case protection, permission denial, idempotency replay
- **Status:** `[V]` — 52 integration tests; concurrency and TOCTOU-closure tests included `[ADR-0003, ADR-0005]`
- **Gap:** reachable through exactly **one** HTTP route (`decision-rationale`). Eight of nine commands have no entry point.

### W2 — Evidence capture and human review — **IMPLEMENTED & TESTED**
- Nine commands; every item starts `CANDIDATE`; approval is domain-scoped by category; verbatim source text bound to an exact document version and immutable by construction; supersession freezes history in one transaction; contradictions are grouped and *not* resolved. `[V: ADR-0008, 19 tests]`
- **Product significance:** this is the funnel any future extraction/AI would feed. It is also entirely unreachable by a user today.

### W3 — Prescreen encounter → attestation → submission — **IMPLEMENTED, HTTP-REACHABLE, NON-DURABLE**
- **User:** `INTAKE_COORDINATOR` (start/draft/supplement/submit/requirements), `PHYSICIAN_REVIEWER` (attest)
- **Trigger:** a prescreen referral within the same organization
- **Steps:** StartEncounter → SaveDraft → Attest → (Supplement) → EvaluateTargetReadiness → SubmitPrescreen
- **Decisions:** willingness + four-domain orientation gate → deterministic *possible pathway* (routing hint, never a decision); medical stabilization takes precedence over everything `[V: prescreen.ts:108-160]`
- **System actions:** same atomic command pattern, against an **in-memory** gateway; `organizationId`, `actor`, `occurredAt` and `receivingOrganizationId` are all server-derived — cross-organization submission is *structurally inexpressible*
- **Completion condition:** submission records **intent only** — no acknowledgement, review, acceptance, admission or transport authority is expressible
- **Status:** `[V]` — 38 contract + 27 service + 9 HTTP integration tests, all passing in my run. **Restart loses all state** `[V: ADR-0014 §4]`

### W4 — Crisis journey demo (prototype) — **PROTOTYPE / MOCKED**
Referral → guided intake → risk → necessity draft → legal draft → packet (hash-sealed) → simulated routing → simulated response → custody verification → role-scoped command center. `localStorage` only; facility names hardcoded (`"Bayou Vista Behavioral"`, `"Cypress Recovery Hospital"`) `[V: App.tsx:486]`. **This is what a stakeholder sees in a demo, and almost none of it is the tested system.**

### W5 — Louisiana e-PEC lifecycle — **PROTOTYPE, LEGALLY GATED**
OPC issuance → PEC execution with configurable exam-validity window and hash-sealed fingerprint → transmission via the packet pipeline → facility acceptance → CEC (continue or discharge-forthwith). Jurisdiction-configurable rule set. Fields reconciled against the *actual* OBH-1/OBH-1A/OBH-2 forms, whose PDFs are in the repo `[V: epec.ts, epecRuleSets.ts, 267-line test suite; reference/source-documents/louisiana-obh-forms/]`. **Blocked by OD-2 (counsel).** This is the most domain-specific asset in the repository and the most legally exposed.

### W6 — Benefits & authorization readiness — **IMPLEMENTED & TESTED, UI-LESS**
Coverage (requires an APPROVED INSURANCE evidence item — the review gate made structural) → eligibility attempts (immutable rows) → benefit quote (disclaimer structurally required, ACTIVE coverage only) → financial education → authorization record (status *derived* from the cited quote) → preparation transitions (SUBMITTED structurally unreachable) → readiness view with named gaps and no score. `[V: ADR-0009/0010, 26 tests]`

### W7 — Milieu bedboard placement — **PROTOTYPE**
Unit/room/bed grid, occupant acuity, aggression/elopement/SI flags, unit acuity ceiling, observation load; advisory recommendation with explainable flags; hard stops disable one-click accept; override requires typed reason and is ledger-logged. `[V: bedboard.ts + tests]` Heuristics pending clinical validation.

### W8 — Episode / utilization-review persistence (S1/S2) — **IMPLEMENTED & TESTED, NO SURFACE**
Episode identity and lifecycle, case↔episode links, episode-owned authorization facts and day decisions, documentation gaps with status history, append-only corrections, governed events, transactional outbox with a tenant-scoped dispatcher, and local transaction-scoped RLS policies. `[V: 9 models added across 3 migrations; od6-rls.test.ts, outbox-delivery.test.ts, s2-episode-persistence.test.ts all passing]` **No API route, no UI, no external consumer.** This is the largest body of implemented capability with zero product surface.

### Workflows that appear necessary but are absent

| Absent workflow | Why it matters |
|---|---|
| **Cross-organization referral send/receive** | The product's core premise is spanning the sending→receiving boundary. It is currently *structurally inexpressible*. Named as the successor decision packet `[V: IMPLEMENTATION_STATUS.md:48]` |
| **Any document-upload UI** | Document service is fully tested; users cannot upload anything |
| **Admission, transport, discharge** | The journey ends at "accepted"; `transportation` is a workstream enum value with no implementation |
| **Notification / assignment inbox** | Coordination product with no way to tell anyone something happened |
| **Onboarding / tenant provisioning** | No way to create an organization or invite a user outside seed scripts |
| **Counsel-validation clearing workflow** | Compliance persona's core job; explicitly deferred `[D: docs/09:84]` |

---

## 9. Product Capabilities Inventory

### Implemented and tested `[V]`
| Capability | Strongest evidence |
|---|---|
| Tenant-scoped case repository; organization predicate in every read/write | `tests/integration/case-repository.test.ts`, `tenant-isolation.test.ts` (passing) |
| 9-command case service; state machine; optimistic concurrency; idempotency; correlation ids | `case-command-service.test.ts`, `case-command-concurrency.test.ts` (passing) |
| Atomic assignee tenant+status validation as an UPDATE predicate (TOCTOU closed) | `case-assignment-atomicity.test.ts` (passing), ADR-0005 |
| Append-only audit with restricted-identifier guard | `tests/security/no-sensitive-identifiers-in-audit.test.ts` (6 tests passing) |
| Document repository: 4 commands, SHA-256 dedupe, version families, classification machine, access audit, storage-failure compensation | `document-command-service.test.ts`, `document-hardening.test.ts` (32 tests passing) |
| Evidence repository: 9 commands, immutability by construction, contradiction groups | `evidence-command-service.test.ts`, `evidence-review-and-contradictions.test.ts` (passing) |
| Manual benefits verification: 4 commands, structural disclaimer, unstorable identifiers | `benefits-command-service.test.ts` (16 tests passing) |
| Authorization readiness: derived status, no aggregate score | `authorization-readiness.test.ts` (10 tests passing) |
| Authentication: opaque bearer tokens stored only as SHA-256 hashes, timestamp revocation, DB-sourced roles | `authentication.test.ts` (8 tests passing), ADR-0011 |
| API vertical slice: principal-derived tenant/actor, unknown fields rejected | `api-service.test.ts` (passing) |
| Prescreen contracts + command service + same-org HTTP slice | 38 + 27 + 9 tests, all passing |
| Episode/UR persistence, governed events, transactional outbox, local RLS | `s2-episode-persistence.test.ts`, `od6-rls.test.ts`, `outbox-delivery.test.ts` (passing) |
| Legal-hold form rendering, validation, deadline math | `packages/legal-hold-forms/src/*.test.ts` (passing) |
| Prototype domain logic: hash ledger, e-PEC lifecycle, guardrails, bedboard, packets, role invariants | 11 test files in `app/src/domain/` — **claimed 64/64; I could not execute them** |
| CI pipeline: lint, typecheck, root + app tests against ephemeral Postgres 16, prisma validate/generate/deploy, high-severity audit | `.github/workflows/ci.yml` |

### Implemented but weakly tested
- **Local filesystem object storage** — dev-only, traversal-proof opaque keys; the compensation-cleanup failure path is an open issue `[V: issue #1]`.
- **Outbox delivery** — verified for three event types with one *synthetic* named consumer; no external consumer exists.

### Partially implemented
- **Prescreen** — full command surface and HTTP routes, but in-memory storage. Phase 3 persistence exists **only on open PR #32**.
- **Authorization** — preparation phase only; `SUBMITTED` is structurally unreachable.
- **RLS tenancy** — implemented and verified for episode-persistence tables against local Postgres; audit/idempotency/inherited models are **not** covered; provider-backed evidence is gated.

### Prototype or mock
The entire `app/` journey: guided intake, medical-necessity draft, legal-status e-PEC lifecycle, packet builder, routing simulation, custody ledger, bedboard, command center, Training & SOPs, Mock Admit Lab, Product Studio. All `localStorage`. Facility list hardcoded. Compliance clocks are demo values.

### Documented but unimplemented
Model gateway and retrieval/citations; agent contracts (catalog only — files missing from the source package); packet approval beyond demo; communications recording; analytics dashboards; production deployment topology; managed-IdP adapter; the expanded 43-model schema (`WorkflowTask`, `ReferralPacket`, …); the CIA 3-stage treatment-team assessment workflow; facility admission profiles (labs, exclusionary/inclusionary criteria); audio-assisted documentation; the entire `clarity-analytics-return-package/` (17 documents, explicitly self-labeled *"Proposed and unverified"*).

### Implied but unsupported
- **"AI" in the product name.** `Clarity AI` appears throughout `docs/product/PRODUCT_VISION.md`. There is **no model call, no prompt, no inference, no extraction, and no agent** anywhere in the shipped code. Nearest thing: an `"AI draft"` value in a `SourceType` union `[V: app/src/domain/types.ts:27]`.
- **"Case intelligence".** No derivation, scoring, ranking, or learning exists. Deliberately — see the anti-score invariants — but the name promises what the product refuses to do.
- **"HIPAA-compliant"** — see §18-B. Claimed once, on an open PR, in direct violation of the repo's own rules.

### Legacy, abandoned, or uncertain
- `docs/00–09*.md` — the Jul 8 crisis-platform doc set, preserved but superseded; `docs/09-personas-and-role-ux.md` is still the canonical persona source *and* is contradicted by newer docs.
- `agent_bridge/` + `agents/bridge/` — two directories for a Python file-mirror multi-agent bridge; watcher detected as `listener=running`, "direct Antigravity CLI and agent consumption remain unverified" `[D: IMPLEMENTATION_STATUS.md:38]`.
- `clarity-platform-visualizer/` — **empty directory**.
- `chatgpt-full-stack-analytics-handoff/` — a prompt package to a third-party model containing a duplicated snapshot of repo docs; a stale-fork hazard.
- Three `*-package/` and `*-handoff/` directories at repo root that are analysis inputs, not product code.

---

## 10. Domain and Data Model

**Canonical schema:** `prisma/schema.prisma`, 1,350 lines, **38 models and 45 enums** `[V]`. Validated. Twelve migrations on this branch.

### Core entities and ownership

```
Organization (the tenant — organizationId is in every predicate)
 ├─ User ──── AuthSession
 ├─ PatientToken
 └─ BehavioralHealthCase  ◄── the case spine
      ├─ SourceDocument ──► EvidenceItem ──► ContradictionGroup
      │                        └─ HumanReview
      ├─ LegalStatusRecord, MedicalNecessityReview
      ├─ InsuranceCoverage ─► EligibilityVerification ─► BenefitVerification ─► Authorization
      │                                                    └─ FinancialEducationRecord
      ├─ Referral ──► FacilityProfile
      ├─ CustodyEvent
      ├─ AuditEvent  (append-only)
      └─ CaseEpisodeLink ──► Episode  ◄── the second spine (S1/S2)
                               ├─ EpisodeAuthorization ─► AuthorizationReview ─► AuthorizationDayDecision
                               ├─ DocumentationGap ─► DocumentationGapStatusHistory
                               └─ FacilityTimezoneConfiguration
GovernedEvent ─► OutboxRecord        (event ledger + delivery)
CommandIdempotencyRecord             (replay protection)
RuleSet ─► Rule                      (configuration, not truth)
PayerProfile ─► PlanProfile
```

### Lifecycle and state

`CaseStatus` (a linear-ish machine with terminal protection) **plus** eight independent `ParallelWorkstreamStatus` values `[V: packages/domain-contracts/src/workstreams.ts]`. Workstream transitions are explicitly tabulated; `COMPLETE → IN_PROGRESS` is permitted but audited. `EpisodeStatus`, `PrescreenEncounterStatus`, `PrescreenAssessmentStatus`, `DocumentClassificationStatus`, `EvidenceStatus`, `EligibilityStatus`, `AuthorizationStatus` are separate machines.

### Immutability and audit

- `AuditEvent` is append-only **at the application layer** with a restricted-identifier guard. **No database-level enforcement** (no revoked UPDATE/DELETE, no hash chain) — named as a pre-production requirement `[V: MVP_ROADMAP.md:50]`. The prototype *does* hash-chain its custody ledger, so the stronger pattern exists in the weaker layer.
- Evidence `originalText` and category are immutable *by construction* — no change-set type can express the update. This is the repository's best structural-safety idea `[V: ADR-0008]`.
- Corrections are append-only rows, not edits `[V: S1/S2]`.

### Sensitive data

- `*Encrypted` columns exist for member/group/policy identifiers and **stay NULL** — no encryption capability exists, so the benefits commands make those identifiers *structurally unacceptable input* `[V: ADR-0009]`. Good discipline.
- `PatientToken` nonetheless carries DOB/sex/external references. `MVP_ROADMAP.md:58` states the risk exactly: *"'Synthetic only' is policy, not enforcement. The schema stores DOB/sex/external references; nothing technical blocks real PHI."*

### Conceptual vs. implemented model — the gaps

| Product concept | Implemented? |
|---|---|
| Case spine + 8 parallel workstreams | `[V]` |
| Referral packet as a versioned first-class object | **No** — `ReferralPacket` exists only in the prototype's TypeScript and in the unadopted 43-model target |
| `WorkflowTask` / deadlines / escalation | **No** — documented only |
| Custody ledger (server-side) | **No** — `CustodyEvent` model exists; hash-chained ledger is prototype-only |
| Facility admission profile (labs, exclusion criteria) | **No** — `FacilityProfile` exists; the criteria layer is documented only |
| Prescreen entities | **Not on this branch** — in-memory; persistence is on open PR #32 |
| Network/facility directory with provenance | **Not on this branch** — open PRs #29/#30 |

**Two case spines.** `BehavioralHealthCase` (pre-admission) and `Episode` (post-admission, UR) are deliberately separate contexts joined by `CaseEpisodeLink` `[V: clarity-analytics-return-package/00_EXECUTIVE_RECOMMENDATION.md]`. Architecturally sound; product-wise it means **the product spans two lifecycles and has no user surface for either**.

**Data-quality risk `[I]`.** Nothing derives anything. Packet completeness, readiness, and gaps are all computed from *whether a human filled a field*. If capture discipline is poor, every downstream signal is poor — and there is no extraction, validation-against-source, or reconciliation capability to catch it.

---

## 11. Roles, Permissions, and Governance

**Two role systems that do not correspond.**

| System | Where | Enforced? |
|---|---|---|
| 8 demo personas (`all`, `field`, `central`, `clinician`, `facility`, `nurse`, `ur`, `compliance`, `executive`) | `app/src/domain/roles.ts` | **No.** Display scoping only, self-documented as such |
| 13 `UserRole` enum values | `prisma/schema.prisma:32-46`, `packages/*/src/permissions.ts` | **Yes.** Exact enum values, no shorthand; policies are compile-checked |

`FIELD_RESPONDER` **does not exist** in the enum. The persona the whole crisis narrative starts with has no server-side identity. Correspondingly, ADR-0014 had to defer every external/field actor because they cannot be expressed.

**Access boundaries `[V]`.** `organizationId` appears in every predicate; a record id is never authorization; cross-tenant misses return non-revealing 404s indistinguishable from absent records. Verified by `tenant-isolation.test.ts` and `organization-isolation.test.ts`.

**Approval authority `[V]`.** Reopen = exactly `ORGANIZATION_ADMIN` + mandatory rationale. `SYSTEM_ADMIN` provably has no case-command rights and no prescreen capability — the "no implicit admin bypass" rule is upheld. Attestation = `PHYSICIAN_REVIEWER`. Evidence approval is domain-scoped by category. Conditional matrix capabilities are treated as **not granted** (fail-closed).

**Auditability `[V]`** at the application layer; **not** at the storage layer.

**Security assumptions still in force `[V: CLAUDE.md "Standing assumptions"]`.** Local filesystem object storage is dev-only. REQ numbering is inferred lineage (the source REQ matrix is missing — OD-1). The "actor roles are trusted caller input" assumption was retired at the authentication boundary but is only *fully* dead once the API is the sole entry point — which it is not, because the prototype writes directly to `localStorage`.

**Governance apparatus `[V]`.** Ten tested-where-implementable invariants in `GOVERNANCE.md`; ADRs 0001–0014; a solo-maintainer branch-protection policy that is live (PR-only, 0 required approvals with documented self-review, required strict `verify` check, conversation resolution, admin enforcement); an evidence protocol that forbids promoting status because an artifact exists.

**Compliance implications visible in the repo.** 42 CFR Part 2 (consent engine — absent, blocks the family portal). HIPAA (explicitly not claimed; BAA-capable hosting named as the "HIPAA cliff"). Louisiana R.S. 28:53 / 28:53.1 (cited in code comments; counsel review is OD-2). EMTALA (mentioned as requiring legal review).

**Controls present in the interface but not the backend.** The entire prototype: role scoping, review gates, prohibited-language guards, hard stops, override reasons, compliance clocks, and the custody ledger are all **client-side only** and trivially bypassable. This is correctly labeled in the code but is the single most likely source of a false impression during a stakeholder demo.

---

## 12. Technical Product Architecture

```
┌─ app/ ─ React 19 + Vite ─ localStorage ─────────────┐   17 workspaces, no router
│  ── 2 thin threads ──►  /api proxy                  │   (login/session; 1 command)
└──────────────────────────────────────────────────────┘
                          │
┌─ packages/api-service ─ node:http, 375 lines, 10 routes ─┐  ⚠ single file, hand-rolled
│  auth: login/session/logout  ·  cases: decision-rationale │
│  prescreen: 6 routes (in-memory)                          │
└───────────────────────────────────────────────────────────┘
        │                          │                    │
  auth-service            case-service          prescreen-service
  (sessions, IdP port)    evidence-service      (in-memory gateway)
                          document-service
                          benefits-service
                          authorization-service
                          legal-hold-forms
        │                          │
┌─ packages/case-repository ─ THE ONLY @prisma/client IMPORTER ─┐
│  14 gateway modules + mappers + auditWriter + outboxDelivery  │
└────────────────────────────────────────────────────────────────┘
                          │
                  PostgreSQL (local clarity_dev only)
                  38 models · 12 migrations · local RLS on 9 tables

packages/domain-contracts — pure; no I/O. Enum arrays mirror schema by hand.
```

### How the architecture enables the product
- **One command pattern everywhere** means a new capability is genuinely cheap and arrives with tenancy, audit, concurrency and idempotency for free. This is why nine service packages exist in ~three weeks of sessions.
- **One Prisma importer** keeps the data boundary honest and makes the eventual RLS/provider switch a single-package change.
- **Pure contracts** let the same state machines serve tests, services, and (eventually) a UI.
- **Configuration-not-truth** (e-PEC rule sets, facility profiles) makes multi-jurisdiction expansion a config problem.

### How the architecture limits the product
| Constraint | Product consequence |
|---|---|
| **Hand-rolled `node:http` server, 375 lines, one file, regex routing** | Every new capability needs bespoke plumbing. ADR-0012 proposes Fastify and is *accepted in part but unexecuted* — the API boundary is the actual bottleneck between tested capability and user value |
| **No router in the frontend** | No deep links, no shareable case URLs — fatal for a coordination product |
| **Prototype and backend share zero contracts** | The domain model is implemented twice, differently. `MVP_ROADMAP.md:57` calls this out as a top-3 blind spot: *"risk building the product twice"* |
| **Prescreen gateway is in-memory** | The only HTTP-reachable multi-step workflow is non-durable |
| **Enum arrays mirror the schema by hand** | Drift risk; the repo has already caught two drifts (`SUBSCRIBER_RELATIONSHIPS`, `LEVELS_OF_CARE`) |
| **`tsconfig.json` `paths` has no `baseUrl` and omits `@clarity/prescreen-service`** | Root typecheck is not hermetic; in a git worktree it silently type-checks the *parent* checkout (see §18-C) |
| **No background worker runtime** | Outbox dispatcher, projections, and notifications are all designed and partly built with nowhere to run |

**Single points of failure `[I]`.** One PostgreSQL instance; one API process; one maintainer; one local dev database shared by every parallel agent branch (now empirically demonstrated to corrupt verification — issue #31).

---

## 13. External Systems and Integrations

**There are zero live integrations.** Every named integration is a port, an adapter, a plan, or a mock.

| Integration | Purpose | Direction | Auth | Failure behavior | Status | Evidence |
|---|---|---|---|---|---|---|
| Identity provider (OIDC / managed IdP) | Real authentication | inbound | — | — | **Port only.** `IdentityProvider` interface + a local dev provider that stores no passwords | `[V: auth-service/src/identityProviders.ts]` |
| Object storage (S3/Blob) | Document bytes | out/in | — | Compensating delete guarded by refcount | **Port + dev-only local filesystem adapter** | `[V: document-service/src/storage.ts]` |
| Google Cloud SQL (`us-central1`) | Production Postgres | — | — | — | **Recorded intent, unexecuted.** No authenticated GCP account was available | `[D: IMPLEMENTATION_STATUS.md:32]` |
| Receiving facilities (packet transmission) | Send packet, receive response | bidirectional | — | — | **Simulated in the browser.** Facility names hardcoded | `[V: App.tsx:486]` |
| Outbox consumer (`Bayside Hospital Clarity Intake Receiver`) | Event delivery | outbound | — | Retry preserved; rows row-locked | **In-process synthetic consumer only** | `[V: outbox-delivery.test.ts]` |
| Payer / clearinghouse (X12 270/271) | Eligibility | bidirectional | — | — | **Explicitly excluded.** All benefits work is human-performed | `[V: ADR-0009]` |
| EHR, CAD/RMS, fax, email, messaging | — | — | — | — | **Not started; forbidden without security review** | `[V: SECURITY.md:10]` |
| OCR / extraction / malware scanning | — | — | — | — | **Absent.** Malware scanning and content sniffing are open issues #4/#3 | `[V]` |
| Any LLM / model provider | — | — | — | — | **Absent.** No API key, no prompt, no call | `[V]` grep |
| Antigravity agent bridge | Multi-agent dev coordination | local files | — | — | **Watcher running; consumption unverified** — a *development* tool, not product | `[D]` |
| GitHub Pages | Publishes `docs/index.html` | outbound | — | — | **Live, but explicitly "not application deployment evidence"** | `[V: .github/workflows/pages.yml; IMPLEMENTATION_STATUS.md:91]` |

---

## 14. Business and Operating Model

**Almost no commercial evidence exists, and what exists is contradictory.**

| Dimension | Evidence |
|---|---|
| Buyer | `[U]`. Two candidates: a receiving psychiatric hospital `[D]`; a grant-funded sheriff's office / crisis agency `[D, open PR only]` |
| Pricing | `[U]`. One line: *"Potential Core/Professional/Enterprise packaging. **Pricing and ROI remain hypotheses**"* — and the source package's commercial detail was missing from the download `[V: PRODUCT_VISION.md:43]` |
| Revenue model | `[U]` |
| Sales motion | `[U]`. Nearest artifact: a POC stakeholder feedback roadmap and a "mark this feature must-have / helpful / confusing / missing / later" board `[V: docs/roadmap/POC_STAKEHOLDER_FEEDBACK_ROADMAP.md]` — a *validation* motion, not a sales motion |
| Implementation requirements | `[D]` and substantial: per-facility admission profiles, per-jurisdiction statutory packs, payer rule packs. Implies a **high-touch services component** `[I]` |
| Regulatory dependencies | `[D]` and blocking: counsel review (OD-2), clinical criteria licensing (OD-3), BAA-capable hosting, 42 CFR Part 2 |
| Cost drivers | `[I]` — hosting, security review, pen test, clinical/legal review, per-facility configuration |
| Switching costs | `[I]` — the audit trail and custody ledger become the system of record for defensibility; high once adopted, near-zero before |
| Partner dependencies | `[U]` |
| Expansion opportunities | `[D]` — second jurisdiction as config; the payer/UR stack; the analytics mart; the facility directory |

### ⚠ Two incompatible go-to-market theses now coexist

**Thesis A (on `main`, 3+ weeks of implementation):** a receiving-facility case-intelligence system. Buyer = psychiatric hospital. Value = defensible placement + audit + UR/denial reduction. Grounded in a real hospital operations workbook.

**Thesis B (open PR #30, ~2,484 files changed):** *"Clarity is a governed coordination directory and prescreen routing engine… the secure middleware between public safety and public health."* Buyer = municipality/sheriff via **DOJ JMHCP** and **SAMHSA MCTP** federal grants. Value = jail-diversion metrics, ER-boarding reduction, time-to-treatment — *for grant compliance reporting*. Ships with a Google Apps Script directory CRM, a public-safety CRM, and a Python "grant hunter" agent `[V: docs/product/CLARITY_GRANT_CONCEPT_NOTE.md, tools/apps-script/*, tools/grant-hunter/* on `codex/om/sync-main`]`.

These are different products, different buyers, different primary users, different data-sharing regimes (criminal-justice ↔ health boundary), and different compliance surfaces. Thesis B also introduces the repository's **only** revenue/funding mechanism (grants) and its **only** explicit outcome metrics. It is not reconciled with Thesis A anywhere.

---

## 15. Product Success Model

**What is currently measured: nothing.** This is deliberate and consistently enforced.

- The executive persona's focus strip prints the literal string `Baseline outcomes: No measurements found` `[V: app/src/domain/roleFocus.ts]`.
- `exportAnalyticsEvents()` exists and has **no callers**; analytics events accumulate in a browser array `[V]`.
- `OD-12` names the gap: *baseline operational measurements (transfer timing, acceptance rate, packet completeness) — blocking ROI claims and pilot design* `[V]`.
- The one place metrics are fully specified is the **reporting-metrics package**, derived from a real workbook: ADC, occupancy, ALOS, revenue days, denial rate, **days at risk**, **process denials**, IOP average daily attendance, staffing-to-census `[V: METRIC_DEFINITIONS.md]`. These are *definitions for a future mart*, not instrumentation.

### What success appears to mean `[I, from design intent]`

| Layer | Apparent success |
|---|---|
| User outcome | A coordinator carries one case referral→acceptance without re-collecting facts, and can show the trail afterward |
| Business outcome | `[U]` |
| Operational outcome | Fewer touches, shorter time-to-acceptance, higher packet completeness, fewer process denials |
| Activation event `[I]` | First synthetic case completed end-to-end **through the UI** by a named pilot user — this is literally the repo's MVP exit criterion `[V: MVP_ROADMAP.md:42]` |
| Retention behavior `[I]` | Coordinator opens Command Center at shift start |
| Quality metric | Packet completeness vs. a 95% target (present in the prototype as a demo value) |
| Risk metric | Breached compliance clocks; unvalidated statutory language; contradiction groups open |
| **Candidate north-star `[I, proposed]`** | *Median time from referral receipt to documented facility acceptance, for cases with a complete source-linked packet* — combines speed, quality and the audit premise |

**Recommended, not measured.** Nothing above except the MVP exit criterion is stated in the repository, and none of it is instrumented. Do not present any of it as a current measurement.

---

## 16. Product Maturity Assessment

| Dimension | Rating | Evidence |
|---|---|---|
| **Problem clarity** | Functionally implemented | Consistent, specific, domain-expert-authored across README, PRODUCT_VISION, CASE_WORKFLOW. Weakness: no external validation |
| **User clarity** | **Conceptual** | 8 personas richly specified, but the primary user is contradicted across three docs (§18-A), and `FIELD_RESPONDER` has no server-side existence |
| **Workflow completeness** | **Partially implemented** | Backend command chains complete and tested; **no workflow a real user can complete end-to-end** — no cross-org send, no upload UI, no admission/transport |
| **UX coherence** | Prototype | 17 coherent workspaces with genuine role-adaptive thinking and strong honesty labeling; no routing, no persistence beyond `localStorage`, and it shares zero contracts with the backend |
| **Domain model stability** | Functionally implemented | 38 models, validated, 12 migrations, two bounded contexts deliberately separated. Caveats: 43-model target unadopted (OD-8), enums mirrored by hand, prescreen entities not yet persisted on `main` |
| **Data readiness** | **Prototype** | 3 of 10 planned synthetic cases (OD-10); the *real* source workbook is business-sensitive with 25/44 sheets self-flagged PHI-risk (§18-B) |
| **Integration readiness** | **Conceptual** | Two clean ports (IdP, storage) with dev-only adapters. Zero live integrations. No X12, no EHR, no transmission mechanism |
| **Security & permissions** | Partially implemented | Real session auth, DB-sourced roles, tenancy in every predicate, non-revealing errors, restricted-identifier audit guard — all tested. But: no DB-level append-only, RLS only on 9 tables and only locally, no encryption capability, no malware scanning, no rate limiting, no security review |
| **Test coverage** | **Functionally implemented** — the strongest dimension | 342/343 root tests passing in my run against real PostgreSQL, including deterministic concurrency-interleave tests. Gaps are named honestly in per-slice test manifests |
| **Operational readiness** | **Undefined→Conceptual** | CI exists and is meaningful. No hosting, no backups, no monitoring, no runbook, no Node pin, no formatter. Local migration replay/restore verified; provider restore unverified |
| **Analytics readiness** | **Conceptual** | Excellent metric *definitions* from a real workbook; a 17-document proposed architecture; **zero instrumentation** |
| **Commercial readiness** | **Undefined** | No pricing, buyer, contract, or sales artifact. Two contradictory GTM theses |

**Overall:** a **partially implemented product with a functionally implemented backend foundation and a prototype front end** — held to an unusually high evidentiary standard. The gap is not quality; it is **reachability**.

---

## 17. Assumption Register

| # | Assumption | Why it matters | Supporting evidence | Contradicting evidence | Risk if false | How to validate | Confidence |
|---|---|---|---|---|---|---|---|
| A1 | Coordination friction (not bed scarcity) dominates placement delay | The entire value proposition | Owner domain expertise; workbook shows manual UR/census tracking | None found; also no supporting measurement | Product optimizes the wrong bottleneck; ROI story collapses | Time-and-motion study at one facility; baseline the OD-12 metrics | **Low** |
| A2 | The receiving facility is the primary user and buyer | Determines the whole roadmap | `INTAKE_TO_ADMISSION_WORKFLOW.md:23` (most recent owner statement) | Personas doc + README + implemented role model + grant concept note | Build the wrong surface first; wasted UI phase | 3–5 interviews on each side of the handoff | **Low** |
| A3 | Operators will do more structured capture up front for later reuse | Every workflow depends on human capture; nothing is derived | Field/clinical mode split shows the tension was considered | Zero user validation (named blind spot #1) | Capture discipline collapses → all downstream signals worthless | Paper-prototype the field intake with actual responders | **Low** |
| A4 | Facility and jurisdiction variation is expressible as configuration | Determines scalability and margin | e-PEC rule set implemented as config; a second jurisdiction is a config object | No second rule set or facility profile has been built | Per-customer forks; services-heavy, low-margin business | Build a second jurisdiction pack and a real facility profile | **Medium** |
| A5 | Synthetic-only is sufficient protection during development | Governs the entire risk posture | Extensive policy; `SYNTHETIC_ONLY` seed enforcement; unstorable identifiers | `MVP_ROADMAP:58` (*"policy, not enforcement"*); **25/44 sheets of a tracked workbook self-flagged PHI-risk** | Real-data exposure in a repo pushed to a remote | Independent review of the workbook; strip or vault it | **Medium-Low** |
| A6 | ADR-0012 / the API boundary can be settled without reworking commands | The bottleneck to all user value | Command envelopes are HTTP-shaped; prescreen slice mapped 1:1 | ADR-0012 still "Proposed"; the `node:http` spike keeps growing (375 lines, regex routing) | API rework late; two more months without a reachable product | Execute the thin Fastify adapter behind existing tests | **Medium-High** |
| A7 | The `app/` prototype can be wired rather than rebuilt | 3–6 sessions vs. a full rebuild | Domain logic is well-factored and tested | Zero shared contracts; duplicated domain model; no router; named blind spot #3 | UI phase doubles; product built twice | Spike: back one workspace (Case Queue) with real API data |**Medium-Low** |
| A8 | Statutory/clinical logic is safe to build as "configuration pending review" | Unblocks development ahead of counsel | Consistently labeled; guards prevent criteria claims | Demo e-PEC logic is detailed enough to look authoritative in a demo | Regulatory exposure; a stakeholder acts on demo logic | Counsel review (OD-2); watermark demo output | **Medium** |
| A9 | One local PostgreSQL shared across parallel agent branches is a workable dev model | Governs how fast parallel work can go | Worked for ~3 weeks | **Verified failure this session**: migration-integrity test fails; issue #31 open | Verification claims become unreliable; silent schema drift | Per-branch ephemeral databases (CI already does this) | **Falsified** |
| A10 | Solo maintainer + AI review is sufficient quality assurance until a pilot | Determines review burden | 342/343 tests; documented self-reviews; external-review-driven fixes | No Louisiana behavioral-health domain expert has reviewed the domain rules (blind spot #2) | Domain-wrong rules pass code review | One paid domain review of role policies + state machines + category-approval map | **Medium-Low** |
| A11 | "AI"/"intelligence" naming is safe with no AI in the product | Positioning credibility | Roadmap forbids AI promises in pilot conversations | `Clarity AI` throughout PRODUCT_VISION; "case intelligence" in README line 3 | Expectation mismatch destroys trust in the first demo | Pick one name (OD-4) and align every surface | **Medium** |

---

## 18. Contradictions and Unresolved Questions

Prioritized. Each is a factual conflict in the current repository, not a judgment.

### A. Primary user is contradicted three ways — **P0**
`docs/09-personas-and-role-ux.md` (07-08, field-first) vs `README.md:31` (crisis/central-intake first) vs `docs/workflows/INTAKE_TO_ADMISSION_WORKFLOW.md:23` (**"The receiving facility is the primary user"**, 07-17) vs `CLARITY_GRANT_CONCEPT_NOTE.md` (law enforcement as buyer, open PR). The newest owner ruling is the narrowest and is reflected in **none** of the implemented surfaces. Downstream: ADR-0014 had to defer every external/field role, so *field-originated prescreens are currently impossible* — which silently implements Thesis A while the strategy docs argue for both.

### B. "HIPAA-compliant" is claimed on an open PR, in violation of the repo's own rules — **P0**
`CLAUDE.md` hard rule 4 and `SECURITY.md:3` forbid claiming HIPAA compliance. `docs/product/CLARITY_GRANT_CONCEPT_NOTE.md` on `codex/om/sync-main` (open PR #30) states Clarity *"provid[es] a governed, HIPAA-compliant routing and directory platform."* If that document reaches a grant application, it is a material misrepresentation.

**Related, and separately serious:** `reference/source-documents/clarity-mh-sources/Reporting Metrics Ops and Budget .xlsx` (1.6 MB) is **tracked in git and pushed to the remote**, and the repository's own committed analysis marks **25 of its 44 sheets `has_phi_risk = Yes`** (all monthly Revenue sheets, Admissions, all IOP Attendance sheets) `[V: reporting-metrics-rebuild-package/sheet_summary.csv]`. `SECURITY.md:5` acknowledges this as business-sensitive material that *"stays local; do not push this repository to any public remote"* (risk R-11) — so the risk is *known and tracked*, but the file is nonetheless in git history on a private remote, and the derivative CSV that names the flags is committed too. I did not open the workbook. **This needs an owner decision, not a code change.**

### C. `IMPLEMENTATION_STATUS.md` claims typecheck passes; it fails in a worktree — **P1 (tooling)**
`npm run typecheck` fails here with `Module '"@clarity/domain-contracts"' has no exported member 'PrescreenSubmissionRecord'` and four implicit-`any` errors — all at paths `../../../packages/...`, i.e. the **parent checkout** (currently on `codex/om/prescreen-phase3-fix`). Cause: `tsconfig.json` declares `paths` with **no `baseUrl`** (so they don't apply) and **omits `@clarity/prescreen-service`** entirely; resolution falls through to the parent repo's workspace symlinks. `vitest.config.ts` gets this right using `import.meta.url`. Consequence: **the root typecheck is not hermetic and cannot be trusted inside a worktree** — and every session-close claim of "typecheck passes" from a worktree is unreliable.

### D. Local `clarity_dev` is ahead of every branch — **P1**
Four migrations are applied in the database that exist on **no** ref reachable from this worktree: `…prescreen_phase3_persistence`, `…prescreen_persistence_rls`, `…packet11_persistence`, `…network_review_append_only_audit`. This makes `migration-integrity.test.ts` fail deterministically (my run) and is tracked as open issue #31. Any "zero synthetic residue" or "suite green" claim from a shared-DB session is contingent on which branches have written to it.

### E. `main` no longer describes the frontier — **P1**
`IMPLEMENTATION_STATUS.md` is dated **2026-07-19**; today is **2026-07-29**. Three large PRs are open:
- **#32** prescreen Phase 3 persistence (ADR-**0016**) — Prisma gateway, RLS, restart durability, +526-line persistence test
- **#29** network-enrichment Phase 1 contracts (ADR-**0014** — *a second, colliding ADR-0014*)
- **#30** network-enrichment reconciled with main, "packets 1-16, ADR-**0015** remediation" — **2,484 files**, a new `network-enrichment-service` package, a `networkReviewGateway`, Google Apps Script CRMs, and a Python grant-hunter agent

Two ADRs numbered 0014 exist on different branches. Whoever inherits this must reconcile ADR numbering before anything else.

### F. Product naming remains unresolved after ~3 weeks (OD-4) — **P2**
"Clarity", "Clarity MH", "Clarity AI", "Clarity Crisis Platform", "Crisis Ops v0.2" (in the prototype's sidebar) all appear. `Clarity AI` promises intelligence the product does not have and deliberately refuses to build.

### G. Two case spines, no user surface for either — **P2**
`BehavioralHealthCase` and `Episode` are architecturally clean but represent two lifecycles, ~9 extra models, and 3 migrations of work with **zero API routes and zero UI**. The clean architectural answer and the product answer diverge here.

### H. `app/` prototype vs. backend: the domain is implemented twice — **P2**
Different types, different enums, different state machines, zero shared contracts. `MVP_ROADMAP:57` names it. A decision (wire / harvest / retire) was scheduled for Phase 5 and has not been made.

### I. Implementation without an explained product purpose — **P3**
- `agent_bridge/` **and** `agents/bridge/` — two directories for the same dev-tooling concern
- `clarity-platform-visualizer/` — empty directory
- `chatgpt-full-stack-analytics-handoff/` — duplicated repo docs bundled as a prompt to a third-party model; a live stale-fork hazard
- `data/mock-use-cohorts/nbc-sitcom-inpatient-admits.json` — sitcom-character fixtures separated from canonical seed data (harmless, but undocumented in the product narrative)
- `docs/00–09*.md` — superseded Jul 8 docs, one of which (`09-personas`) is *still* canonical
- **`ARCHITECTURE.md` is stale in two load-bearing ways:** it states the canonical schema has *"25 models"* (it has **38**) and that *"No backend, API, auth, or tenancy enforcement exists yet"* (all four exist and are tested). A new reader who starts at the top-level architecture entry point gets a materially wrong picture of the system `[V: ARCHITECTURE.md:9,21 vs. schema + passing suite]`

### Questions I will not guess at
1. Which is the product: the receiving-facility case system, or the public-safety coordination directory?
2. Is the grant path (DOJ JMHCP / SAMHSA MCTP) a funding strategy, a GTM strategy, or a pivot?
3. Has the source workbook been reviewed for real patient data before being committed and pushed?
4. Is `app/` a UX artifact to harvest, or the actual future front end?
5. Who owns any of this? Every `docs/product/*` front-matter says `owner: TBD`.

---

## 19. Product Risks

| # | Risk | Evidence | Likelihood | Impact | Current mitigation | Remaining exposure |
|---|---|---|---|---|---|---|
| R1 | **Desirability** — 3+ weeks of tested capability built with zero user contact; the workflow model is architecture-derived | `MVP_ROADMAP:55` blind spot #1 | High | Critical | Named in the roadmap; POC feedback board built | Full. No interview has happened. This is the top risk |
| R2 | **Positioning whiplash** — two incompatible GTM theses in flight simultaneously | §14, §18-A/E | High | Critical | None | Full. Splits scarce solo-maintainer capacity |
| R3 | **Data/compliance** — a real hospital workbook with 25/44 PHI-risk-flagged sheets is committed and pushed | `sheet_summary.csv`; `SECURITY.md:5` (R-11) | Medium | Critical | Risk acknowledged; private remote; derivatives exclude raw rows | High. History rewrite is the only real remediation |
| R4 | **Misrepresentation** — "HIPAA-compliant" on an open PR, contradicting repo rules and reality | `CLARITY_GRANT_CONCEPT_NOTE.md` | Medium | Critical | Repo-wide honesty rules exist and were bypassed on this branch | High if the doc reaches a grant reviewer |
| R5 | **Demo credibility** — the polished prototype is client-side theater: role scoping, review gates, clocks and the custody ledger are all bypassable | §11 | Medium-High | High | Explicit disclaimers in UI copy and code comments | Moderate. A stakeholder who believes the demo is the system will make a bad decision |
| R6 | **Regulatory** — statutory logic detailed enough to look authoritative, with counsel review unstarted | OD-2; e-PEC implementation | Medium | Critical | "Counsel validation required" flags; nothing enforced | High. The OBH form PDFs are in the repo and the fields are reconciled to them |
| R7 | **Clinical** — necessity prompts, guardrail vocabulary, bedboard heuristics all unreviewed by a clinician | OD-3; `IMPLEMENTATION_STATUS.md:95` | Medium | High | Prohibited-language guards; advisory-only labeling | High for any real use |
| R8 | **Feasibility/velocity** — the API boundary (ADR-0012) is unresolved while the hand-rolled server keeps growing | ADR-0012 Proposed; server.ts at 375 lines | High | High | Prescreen slice proved 1:1 command→route mapping | Moderate. Cost grows with every route added before the decision |
| R9 | **Build-it-twice** — prototype and backend duplicate the domain with no shared contracts | blind spot #3 | High | High | Decision deferred to Phase 5 | Full |
| R10 | **Verification integrity** — shared local DB + non-hermetic typecheck undermine "verified" claims | §18-C/D; issue #31 | **Realized** | High | CI uses an ephemeral DB and is the trustworthy signal | Moderate. Local session claims need caveats until fixed |
| R11 | **Bus factor of one, reviewed by bots** — no domain expert has reviewed the domain rules | blind spot #2 | High | High | External AI review has caught real defects (PRs #25/#26/#27) | High. Code review ≠ domain review |
| R12 | **Scope sprawl** — 11 packages, 38 models, 3 open PRs (one at 2,484 files), 4 root-level analysis packages, an empty directory, and 89 refs — with no reachable product | repo inventory | **Realized** | High | Build-sequence discipline in `CLAUDE.md`, mostly honored | Moderate-High |
| R13 | **Durability gap** — the only HTTP-reachable workflow is in-memory | ADR-0014 §4 | Certain (by design) | Medium | Phase 3 persistence exists on PR #32 | Low, if #32 lands |
| R14 | **Operational** — no hosting, backups, monitoring, runbook, or Node pin | `IMPLEMENTATION_STATUS.md:91` | Certain | Medium (pre-pilot) | CI landed; local migration replay/restore verified | Moderate; blocks any pilot |
| R15 | **Business viability** — no pricing, buyer, contract, or revenue evidence of any kind | §14 | Certain | High | Labeled as hypotheses | Full |

---

## 20. Product Truth vs. Product Story

| Product story (what docs, naming, and positioning suggest) | Product truth (what the implementation demonstrably allows) |
|---|---|
| "Behavioral-health **case intelligence** and access orchestration platform" `[README:3]` | A tested case **coordination and audit** backend. Nothing is derived, scored, ranked, or learned — deliberately. No intelligence exists |
| "**Clarity AI** — turn fragmented referrals into structured, source-linked pathways" `[PRODUCT_VISION:24]` | Zero AI. No model call, prompt, inference, extraction, or agent anywhere in shipped code. Nearest artifact: an `"AI draft"` string in a TypeScript union |
| "referral → intake → evidence → parallel workstreams → packet → routing → custody → audit" `[README:11]` | The **backend** implements case/evidence/benefits/authorization/prescreen commands. The **journey** exists only in a `localStorage` prototype. No user can traverse it in the real system |
| "A working local prototype" `[README:5]` | True, and genuinely thoughtful — but it shares zero contracts with the tested backend and duplicates the domain model |
| 17 workspaces, 8 role-scoped personas | Display scoping only, self-documented as "not authentication". The server enforces 13 different roles, and `FIELD_RESPONDER` is not among them |
| "Hash-chained custody ledger" | Real, tested — **in the browser**. The server has a `CustodyEvent` model and application-layer append-only audit with **no** database enforcement and **no** hash chain |
| "Compliance clocks" for Louisiana statutory windows | Configurable **demo values**, display-only, blocked on counsel review. Nothing is enforced |
| "Secure referral / transfer / acceptance" | Simulated in the browser against two hardcoded facility names. Cross-organization submission is *structurally inexpressible* by design |
| "Tenant-scoped, audited, concurrency-safe" | **Fully true and well-tested.** The strongest and most under-sold claim in the repository |
| "Not a production clinical system; synthetic data only" `[README:58-66]` | True as policy. But nothing technical prevents real PHI, and a real hospital workbook with 25 PHI-risk-flagged sheets is committed to git |
| "Governed, **HIPAA-compliant** routing and directory platform" `[open PR #30]` | False, and forbidden by the repository's own rules |
| "Grant-ready diversion / boarding / time-to-treatment metrics" `[open PR #30]` | No metric is measured anywhere. The UI prints `No measurements found` |
| `IMPLEMENTATION_STATUS.md`: "343/343 root tests, lint, typecheck, prisma validate all pass" | **342/343** in my run (the failure is real and tracked as issue #31); lint and `prisma validate` confirmed; **typecheck fails in a worktree** for a tooling reason; app 64/64 unverified |

**The two most important gaps.** (1) *Reachability*: an unusually well-built backend has essentially no user surface, so no claim about user value can be tested. (2) *Naming*: the product is named and positioned for intelligence it deliberately refuses to build, which will misfire in the very first stakeholder conversation.

---

## 21. Recommended Canonical Product Definition — **PROPOSED SYNTHESIS, NOT ESTABLISHED FACT**

> This is my proposal based on evidence weight. It resolves contradictions by choosing; the owner may choose differently.

| Field | Proposal | Rationale |
|---|---|---|
| **Product** | **Clarity** — a tenant-scoped case coordination and audit system for behavioral-health crisis placement. Drop "AI" and "intelligence" from the name and positioning until something is actually derived. | Resolves OD-4; aligns naming with the roadmap's own "no AI promises in pilot" rule |
| **Primary user** | The **central-intake coordinator at a receiving psychiatric facility.** | Reconciles the newest owner ruling (receiving facility) with the role that actually operates the workflow and holds the most implemented capability (`INTAKE_COORDINATOR` is the single most-privileged role in the prescreen policy). Field responder becomes the *first secondary* user, unblocked only by the cross-org design |
| **Primary problem** | Between referral receipt and a documented acceptance, the case's facts degrade across handoffs, and no one can afterward prove what was known, sent, or decided. | Strongest evidence base; measurable; does not require the unvalidated bed-scarcity claim |
| **Core workflow** | **Referral intake → source-linked evidence with human review → target-scoped readiness with named gaps → packet → documented acceptance decision → audit trail.** One tenant. One case. Reachable through a UI. | This is the shortest path that (a) reaches a user-visible terminal outcome and (b) uses already-tested backend capability |
| **Core value** | Defensibility and reuse: capture once, review explicitly, prove afterward. | Matches what the implementation actually enforces structurally |
| **System boundary** | Clarity holds the *coordination and evidentiary* record for the pre-admission phase. It does **not** hold the clinical record, does not decide, does not transmit to external systems, and does not measure outcomes — yet. Episode/UR is a *separate, later* product surface. | Prevents the two-spines-no-surface problem from widening |
| **Current stage** | **Pre-alpha: tested foundation, no reachable product, zero user validation.** | Every dimension in §16 supports this |

**What this definition explicitly defers:** the public-safety/grant coordination directory (Thesis B), cross-organization submission, the analytics mart, and everything post-admission. Not rejected — sequenced.

---

## 22. Immediate Product Decisions

Ordered. Each is a decision, not a task.

**D1 — Name the primary user, in writing, once. `[clarifies: primary user, product boundary]`**
Three documents disagree and the newest ruling is reflected in nothing that exists. Until this is settled, every UI decision is a coin flip. *Cheapest resolution:* amend `docs/09-personas-and-role-ux.md` and `README.md` to match the 07-17 ruling, or supersede the 07-17 ruling explicitly.

**D2 — Decide whether Thesis B (public-safety / grant coordination directory) is the product, a funding strategy, or a parked bet. `[clarifies: core problem, boundary, business model]`**
PR #30 is 2,484 files. Merging it without this decision doubles the product's surface area and its compliance perimeter (criminal-justice ↔ health data sharing) while `main` still has no reachable UI. This is the highest-leverage decision in the repository.

**D3 — Resolve the workbook's data status before anything else touches the remote. `[clarifies: risk posture]`**
Have a qualified person confirm whether `Reporting Metrics Ops and Budget .xlsx` contains real patient-level data. If it does, it needs removal from history and a vault, not a `.gitignore`. The repo's own committed analysis flags 25 of 44 sheets. This blocks any move toward a public remote, an investor data room, or a grant submission.

**D4 — Strike or correct the HIPAA-compliance claim on PR #30 before that branch goes anywhere. `[clarifies: honesty posture]`**
One sentence, high consequence.

**D5 — Execute the API boundary decision (ADR-0012) now, not after more routes. `[clarifies: minimum complete workflow]`**
The hand-rolled `node:http` server is the throttle on all user value. The prescreen slice already proved commands map 1:1 to routes. Port it behind the existing tests, then add routes for the eight case commands and document upload that currently have none.

**D6 — Decide the fate of `app/`: wire, harvest, or retire. `[clarifies: human vs. automated responsibility, validation strategy]`**
Deferred since 2026-07-13. The prototype holds the only real UX thinking in the project and duplicates the domain model. A one-workspace spike (back Case Queue with real API data) converts this from a judgment call into a measurement.

**D7 — Buy one domain review and three user conversations before Phase 5 locks a UI. `[clarifies: validation strategy]`**
Blind spots #1 and #2 are both "no human outside this repo has checked." One paid Louisiana behavioral-health reviewer on the role policies, state machines and category-approval map; three intake-staff conversations. This is the cheapest risk reduction available and it does not require any code.

**D8 — Give each branch session an ephemeral database, and fix `tsconfig.json`. `[clarifies: source of truth]`**
Add `baseUrl: "."` and the missing `@clarity/prescreen-service` path; stop sharing one `clarity_dev` across parallel agent branches (CI already models the right pattern). Without this, "verified" in a session-close report does not mean what it says.

**D9 — Reconcile ADR numbering (two ADR-0014s) and refresh `IMPLEMENTATION_STATUS.md` to 2026-07-29. `[clarifies: source of truth]`**
Ten days and three large PRs have accumulated since the status doc was written.

**D10 — Define one activation metric and instrument it. `[clarifies: success measurement]`**
The repo already has the right answer as its MVP exit criterion ("a named pilot user completes a full synthetic case end-to-end through the UI"). Make it a counted event. `exportAnalyticsEvents()` exists with no callers — the seam is already built.

---

## 23. Evidence Appendix

### Primary sources read in full
`README.md` · `ARCHITECTURE.md` · `CLAUDE.md` · `GOVERNANCE.md` · `SECURITY.md` · `IMPLEMENTATION_STATUS.md` (399 lines) · `package.json` · `tsconfig.json` · `vitest.config.ts` · `app/package.json` · `app/vite.config.ts` · `.github/workflows/ci.yml` · `docs/product/PRODUCT_VISION.md` · `docs/product/PRODUCT_REQUIREMENTS.md` · `docs/09-personas-and-role-ux.md` · `docs/workflows/CASE_WORKFLOW.md` · `docs/workflows/INTAKE_TO_ADMISSION_WORKFLOW.md` · `docs/planning/MVP_ROADMAP.md` · `docs/decisions/OPEN_DECISIONS.md` · `docs/architecture/ADR-0014-prescreen-role-mapping-and-api-slice.md` · `app/src/App.tsx` (733 lines) · `app/src/domain/{roles,types,api,storage,analyticsEvents}.ts` · `packages/domain-contracts/src/{workstreams,featureFlags}.ts` · `packages/api-service/src/server.ts` (routing half)

### Key schemas
`prisma/schema.prisma` — 1,350 lines, 38 models, 45 enums. Migrations: `20260710233252_initial_clarity_foundation` … `20260719123000_od6_episode_persistence_rls` (12 on this branch).

### Key routes (the complete API surface)
`POST /api/auth/login` · `GET /api/auth/session` · `POST /api/auth/logout` · `POST /api/cases/{caseKey}/decision-rationale` · `POST /api/prescreen/encounters` · `POST …/{id}/{draft|attest|supplements|submit|requirements}` · `GET …/{id}/readiness?target=`

### Major components
17 workspaces under `app/src/workspaces/` · 11 domain modules + 11 test files under `app/src/domain/` · 11 packages under `packages/` (`case-repository` is the only `@prisma/client` importer; 14 gateway modules inside it)

### Important tests (all executed this session unless noted)
`tests/integration/`: `case-repository`, `case-command-service`, `case-command-concurrency`, `case-assignment-atomicity`, `tenant-isolation`, `document-command-service`, `document-hardening`, `evidence-command-service`, `evidence-review-and-contradictions`, `benefits-command-service`, `authorization-readiness`, `authentication`, `api-service`, `prescreen-api`, `s2-episode-persistence`, `od6-rls`, `outbox-delivery`, `audit-persistence`, `legal-hold-forms`, `synthetic-seed`, **`migration-integrity` (FAILED — §18-D)** · `tests/unit/`: `prescreen-contracts` (38), `prescreen-service` (27), `analytics-contracts`, `episode-utilization-contracts`, `readiness`, `audit`, `payer-memory` · `tests/security/`: `no-sensitive-identifiers-in-audit` (6), `organization-isolation` (3) · `app/src/domain/*.test.ts` (11 files — **not executed**, `app/node_modules` absent)

### Documentation sources surveyed (not read in full)
14 ADRs · `docs/repository-audit/` (19 files) · `docs/discovery/` (14 files) · `docs/decisions/` (10 files) · `docs/testing/` (7 manifests) · `docs/security/`, `docs/legal/`, `docs/payer-and-benefits/`, `docs/roadmap/`, `docs/developer-handoff/` · `clarity-analytics-return-package/` (17 docs + contracts + proposed schema) · `reporting-metrics-rebuild-package/` (12 files) · `chatgpt-full-stack-analytics-handoff/` · `reference/source-packages/` (5 packages) · `agents/bridge/`, `agent_bridge/`

### Unavailable or inaccessible
- **`app/` test suite** — `app/node_modules` absent in this worktree; the claimed 64/64 is unverified by me
- **Master architecture package v0.2.0** — 72 of 87 files missing (OD-1); blocks re-verification of 12 summary-graded domains, the source REQ matrix, the commercial model, and 7 of 10 synthetic cases
- **Binary source documents** — three Louisiana OBH form PDFs, two `.docx` files, and the 1.6 MB `.xlsx` workbook were **not opened** (deliberately: the workbook is flagged PHI-risk)
- **GitHub Actions run history** — not inspected; CI status inferred from workflow definition and merged-PR record
- **`reference/source-packages/*.zip`** — two archives not extracted
- **Deployed artifacts** — the GitHub Pages site was not visited

### Areas not inspected in depth
Full bodies of the 11 service packages (I read command lists, permissions, service method signatures, and gateway inventories rather than every implementation); `packages/case-repository`'s 14 gateway modules individually; the `clarity-analytics-return-package` contract YAML/JSON schemas; the discovery-protocol document set; the Python agent bridge; `graphify-out/` (a generated knowledge graph — treated as derived, not evidence).

### Confidence limitations
1. **Open-PR content** (#29/#30/#32) was characterized from diffstats and selected file reads, not full review. My statements about Thesis B are about *documents on those branches*, not about merged product.
2. **The app prototype's behavior** is read from source, not from execution. UX statements are code-derived.
3. **No runtime observation.** I did not start the dev server or the API, so I did not see the product work; every functional claim rests on tests and source.
4. **Environment contamination is real and I have accounted for it:** `vitest` aliases resolve to this worktree (test results are valid for this branch); `tsc` does not (typecheck results are not).
5. **Nothing here is a clinical, legal, or compliance opinion.** The PHI and HIPAA findings are observations about repository contents and text, flagged for qualified human review.

---

## Final Summary

1. **The product appears to be** a tenant-scoped, audit-first case coordination system for behavioral-health crisis placement — a tested backend foundation of eleven packages and thirty-eight models, with a thoughtful but disconnected `localStorage` prototype in front of it, positioned commercially as "case intelligence" while deliberately containing no intelligence at all.

2. **The primary user appears to be** the central-intake coordinator — but this is genuinely contested in the repository: the most recent owner ruling (2026-07-17) names the *receiving facility*, the personas doc and README name field/central intake, an open PR names law enforcement, and the persona the crisis narrative starts with (`FIELD_RESPONDER`) has no server-side existence at all.

3. **The core problem appears to be** that between referral receipt and documented acceptance, a case's facts degrade across handoffs and nobody can afterward prove what was known, sent, or decided — a problem statement authored entirely by one domain expert, with zero external validation and no baseline measurement anywhere in the repository.

4. **The strongest implemented workflow is** the case command lifecycle and its evidence layer: nine commands and nine evidence commands behind one atomic pattern (strict envelope → explicit role policy → tenant-scoped read → state machine on the fresh row → version-guarded update → atomic audit + idempotency), with immutability enforced by construction and 342 of 343 tests passing against real PostgreSQL in this session — and it is reachable by a user through exactly **one** HTTP route.

5. **The most important unresolved product question is** whether Clarity is the receiving-facility case system that `main` has spent three weeks building, or the grant-funded public-safety coordination directory that 2,484 files of open pull request now argue for — because that single question determines the primary user, the buyer, the compliance perimeter, the next six months of a solo maintainer's capacity, and whether any of the already-tested backend is pointed at the right problem.
