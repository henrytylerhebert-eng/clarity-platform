# Clarity — Product Build Plan and Requirements

**Prepared:** 2026-07-29 · **Input:** [REPOSITORY_PRODUCT_INTELLIGENCE_BRIEF.md](REPOSITORY_PRODUCT_INTELLIGENCE_BRIEF.md)
**Status:** Proposed. Nothing in this document is an owner decision. Every recommendation is labeled.
**Labels:** `[V]` Verified (code/test/schema/config) · `[D]` Documented (stated, unconfirmed) · `[I]` Inferred · `[P]` Proposed (introduced here) · `[U]` Unknown

---

## Two findings from this session that change the plan

Both were confirmed by reading code during planning, and neither appears in any repository status document.

**F1 — The case spine has no entry point. `[V]`**
`CreateCaseCommandSchema` requires `patientTokenId` `[V: packages/case-service/src/commands.ts:38]`. There is **no command, no service method, and no gateway method that creates a `PatientToken`.** It is created only by raw Prisma calls in `packages/api-service/src/devMain.ts:86` and `tests/integration/helpers/harness.ts:52` `[V: grep across packages/, scripts/, tests/]`. Consequence: **no user, through any governed path, can create the first object a case requires.** Every "the backend is complete, it just needs a UI" statement is therefore false in one specific, blocking way. This becomes requirement **FR-01** and it carries a real design decision, because `PatientToken` is the PHI-boundary object (`dateOfBirth`, `age`, `sex`, `externalPatientReference`, `guardianStatus`) `[V: prisma/schema.prisma:407-423]`.

**F2 — A read API does not exist, but a read *layer* does. `[V]`**
The HTTP surface has exactly two GET routes (`/api/auth/session`, prescreen readiness) and no way to list or fetch a case `[V: packages/api-service/src/server.ts]`. But tenant-scoped read methods already exist and are tested at the gateway layer:

| Method | Location | Tenant-scoped? |
|---|---|---|
| `listForOrganization(organizationId)` | `packages/case-repository/src/prismaCaseRepository.ts:107` | Yes `[V]` |
| `findByKey(organizationId, caseKey)` | `…/prismaCaseRepository.ts:100` | Yes `[V]` |
| `listDocumentsForCase(organizationId, caseId)` | `…/documentGateway.ts:379` | Yes `[V]` |
| `listEvidenceForCase(organizationId, caseId)` | `…/evidenceGateway.ts:711` | Yes `[V]` |
| `listCoveragesForCase(organizationId, caseId)` | `…/benefitsGateway.ts:650` | Yes `[V]` |
| `assessCaseAuthorizationReadiness(…)` | `…/authorizationGateway.ts:348` | Yes `[V]` |

This is the single largest reuse opportunity in the repository: the first UI slice is mostly **HTTP plumbing plus a read-authorization policy**, not new domain work. But note what is missing — **reads have no role policy and no audit decision.** Every write command passes through `assertPermitted(...)`; these reads bypass the service layer entirely. Exposing them requires deciding who may read what, and whether reads are audited. That is decision **D7**, not plumbing.

---

# Artifact 1 — Product Direction Confirmation

## Strongest supported direction statement `[P, synthesized from V+D evidence]`

> **For a central-intake coordinator at a single receiving behavioral-health facility, the product should help them take a crisis referral from arrival to a documented, owned, prioritized, and provable case record, by carrying one tenant-scoped case through governed commands with an append-only audit trail — while reducing the re-collection of patient facts at each handoff and the inability to prove afterward what was known, sent, and decided.**

| Element | Statement | Basis |
|---|---|---|
| **Product definition** | Tenant-scoped case coordination and audit system for behavioral-health crisis placement. Not a clinical record. Not a decision engine. | `[V]` implementation; `[D]` PRODUCT_VISION |
| **Primary user** | Central-intake coordinator at the **receiving** facility | `[D, contested]` — INTAKE_TO_ADMISSION_WORKFLOW:23 says receiving facility; personas doc + README say field/central intake; `INTAKE_COORDINATOR` is the most-privileged role in every implemented policy `[V]` |
| **Primary problem** | Between referral receipt and documented acceptance, case facts degrade across handoffs and nobody can afterward prove what was known, sent, or decided | `[D]` README, PRODUCT_VISION; `[I]` corroborated by the real 44-sheet operations workbook |
| **Core job to be done** | "When a referral arrives mid-shift, I want to capture and own it once, so I can find it, move it, and defend it later." | `[I]` from personas doc + implemented commands |
| **Core product mechanism** | One canonical case + 8 independent workstreams behind a uniform command pattern: strict envelope → explicit role policy → single transaction (tenant read, state machine on fresh row, versioned conditional UPDATE, atomic audit + idempotency) | `[V]` 342/343 tests; ADR-0003/0005 |
| **Primary workflow** | Referral → case created → owned → prioritized → rationale recorded → closed, with a complete audit history | `[V]` backend; `[U]` as a user experience |
| **User outcome** | A case that is findable tomorrow, has a named owner, and can be explained after the fact without asking anyone | `[P]` |
| **Business/organizational outcome** | `[U]` — no pricing, buyer, contract, or revenue evidence exists anywhere in the repository |
| **Product boundary** | Holds the coordination and evidentiary record for the **pre-admission** phase. Does not hold the clinical record, does not decide, does not transmit externally, does not measure outcomes. Episode/UR is a separate, later surface. | `[P]`, consistent with `[V]` two-bounded-context design |
| **Current maturity** | Pre-alpha: tested foundation, no reachable product, zero user validation | `[V]` all twelve maturity dimensions |

## Direction Confidence Assessment

| Element | Confidence | Why | Recommended action |
|---|---|---|---|
| Primary problem | **High** | Consistent across all docs; corroborated by a real operations workbook; authored by a 16-year domain practitioner | Proceed |
| Core product mechanism | **High** `[V]` | 342/343 tests including deterministic concurrency interleaves | Proceed — this is the asset |
| Product definition | **Medium** | Clear in implementation; muddied by "AI"/"intelligence" naming (OD-4) | **Decide internally** (D5) |
| Primary workflow | **Medium** | Backend chain verified; no user has traversed it | **Validate** after first slice |
| Product boundary | **Medium** | Two spines exist with no surface; PR #30 would widen the perimeter | **Decide internally** (D2) |
| User outcome | **Medium** `[P]` | Reasonable, untested | **Test behavior** in pilot |
| **Primary user** | **Low** | Three documents, three answers; newest ruling reflected in nothing; `FIELD_RESPONDER` absent from the role enum `[V]` | **Decide internally first (D1), then confirm with user research (V1)** |
| Core job to be done | **Low** | Inferred; zero interviews | **Conduct user research** (V1) |
| Business outcome | **Unknown** | No commercial artifact of any kind | **Defer** — do not let this block a synthetic pilot |
| Statutory/clinical rule content | **Unknown** | OD-2 (counsel), OD-3 (clinical licensing) unstarted | **Consult domain expert / counsel**; keep out of the first slice |

---

# Artifact 2 — Recommended Next-Step Classification

## Primary category: **CLARIFY**

**Secondary, sequenced and explicitly subordinate:** **Repair** (cheap, mechanical, parallel) → **Complete** (the step Clarify unlocks).

### Why Clarify is the correct next step

1. **Requirements are not writable at the user level.** Three documents name three different primary users, and the most recent owner ruling — *"the receiving facility is the primary user"* (2026-07-17) — is reflected in neither the implemented role model, the README, nor the personas doc `[V: brief §18-A]`. A UI slice chosen before this is a coin flip, and Phase 5 of the existing roadmap explicitly warns that the UI phase is where the wrong choice gets locked in `[D: MVP_ROADMAP:55]`.

2. **Two incompatible products are consuming capacity right now.** `main` builds a receiving-facility case system. Open PR #30 (**2,484 files**) argues Clarity is a public-safety coordination directory sold to municipalities through DOJ JMHCP / SAMHSA MCTP grants, shipping Apps Script CRMs and a Python grant-hunter `[V]`. Different user, buyer, compliance perimeter, and data model. One solo maintainer cannot build both.

3. **Two hard-rule violations gate every external conversation.** A "HIPAA-compliant" claim on PR #30 contradicts `CLAUDE.md` rule 4 and `SECURITY.md:3` `[V]`; and a tracked, pushed hospital workbook has **25 of 44 sheets self-flagged `has_phi_risk = Yes`** by the repository's own committed analysis `[V: reporting-metrics-rebuild-package/sheet_summary.csv]`. Until both are resolved, the team cannot safely run user research, submit a grant, or open a data room — which means **Validate is blocked by Clarify.**

4. **`Validate` is premature specifically because nothing is reachable.** You cannot test a workflow hypothesis with users when no user can complete any workflow `[V: brief §16]`. The honest sequence is clarify → make one thing reachable → validate.

5. **`Complete` is premature by exactly one week of decisions.** It is otherwise the right instinct, and F1/F2 above show it is cheaper than it looks. It becomes correct the moment D1–D4 close.

### Evidence supporting Clarify

| Evidence | Source |
|---|---|
| Primary user contradicted three ways; newest ruling unimplemented | `[V]` brief §18-A |
| 2,484-file open PR proposing a different product and buyer | `[V]` brief §14, §18-E |
| HIPAA claim violating repo rules | `[V]` brief §18-B |
| 25/44 PHI-risk-flagged sheets in a tracked, pushed workbook | `[V]` `sheet_summary.csv` |
| Two ADRs numbered 0014 on different branches | `[V]` brief §18-E |
| Status document 10 days stale with 3 large PRs open | `[V]` |
| Zero user validation, named as blind spot #1 | `[D]` MVP_ROADMAP:55 |
| `owner: TBD` in every `docs/product/*` front-matter | `[V]` |

### What would be premature right now

- Building any UI before D1 closes — the queue-for-a-coordinator and the mobile-capture-for-an-officer are different products.
- Merging PR #30 before D2 — it doubles the surface area and the compliance perimeter.
- Merging PR #32 (prescreen Phase 3) before D2 — it deepens a workflow whose primary actor (external/field) is explicitly deferred and may not be the chosen user at all.
- Any external conversation (user research, grant submission, investor material) before D3/D4.
- Instrumentation, dashboards, analytics mart, or scaling work.

### What becomes possible once Clarify completes

Requirements become writable against a named user. One vertical slice becomes selectable and defensible. The three open PRs become merge/park/close decisions rather than accumulating divergence. User research becomes safe to run. `IMPLEMENTATION_STATUS.md` becomes trustworthy again.

### Time-box `[P]`

**Clarify is days, not weeks, and produces artifacts — not deliberation.** Concretely: four decisions closed in writing (D1–D4), ADR renumbering, a refreshed status document, and a merge/park ruling on three PRs. If this takes more than one working week, the constraint is owner availability, not analysis — and the parallel work in Artifact 7 Slice S1 proceeds regardless.

---

# Artifact 3 — Minimum Complete Product Outcome

> **Conditional `[P]`:** this MCPO assumes D1 resolves to *central-intake coordinator at the receiving facility*. If D1 resolves to the field responder / public-safety officer instead, the MCPO changes and Artifacts 5–11 must be re-derived. It is stated as a single, coherent alternative in Artifact 4 → D1.

**Working name: "Referral to owned, provable case."**

| Dimension | Definition |
|---|---|
| **Target user** | One named central-intake coordinator at a single pilot organization, holding the `INTAKE_COORDINATOR` role in the database `[V: role exists and is the most-privileged role in every implemented policy]` |
| **Trigger** | A crisis referral arrives — a phone call from an ED, a fax, or a walk-in handoff — during a shift in which the coordinator is already running other cases `[I: personas doc §2]` |
| **Starting state** | The coordinator has the referral facts in hand (verbally or on paper), a browser, and a verified session. They do **not** yet have a record, an owner, a priority, or anywhere to put it other than a spreadsheet `[D: MVP_ROADMAP:26 "binder/fax/whiteboard status quo"]` |
| **Desired outcome** | A case exists in Clarity that is **findable tomorrow**, has a **named owner**, a **recorded urgency**, at least one **recorded decision rationale**, and a **complete audit history** — and can be **closed** with a documented reason |
| **Completion condition** (observable) | The coordinator closes the browser, returns later, finds the case in a list scoped to their organization, opens it, and reads back every action taken on it with actor and timestamp — then transitions it to a terminal state. No developer, script, or database client is involved at any point. |
| **Time horizon** | Referral in hand → case created, owned, and prioritized in **under 5 minutes**; the audit read-back in **under 30 seconds** `[P — a design target, not a measurement]` |
| **Product responsibility** | Verified identity and tenancy; persistence; the case state machine; optimistic concurrency; idempotent retries; the append-only audit trail; tenant-scoped read views; honest error states |
| **Human responsibility** | Every judgment: what the referral says, how urgent it is, who should own it, whether to close it and why. Also: creating the pilot organization and the user account (administrative, out-of-product in this version) |
| **System boundary — explicitly NOT in this version** | Documents · evidence · benefits/authorization · legal instruments (OPC/PEC/CEC) · packet generation · facility routing · bedboard · prescreen · episode/UR · cross-organization anything · notifications · assignment inbox · metrics/dashboards · file upload · OCR/AI/extraction · real patient data |
| **Value hypothesis** | If a coordinator will not adopt even the case spine plus an audit trail, no later slice matters — every richer capability hangs off this spine. If they will, every subsequent slice attaches to something they already use daily. This is the cheapest possible test of the product's central premise. `[P]` |
| **Validation signal** | The coordinator uses it for a week of *synthetic* referrals without reverting to their spreadsheet **and** answers "what happened on this case?" from the screen rather than from memory or a colleague. Counter-signal: they create cases in Clarity *and* keep the spreadsheet — which means the spine does not yet carry what they actually need. `[P]` |

**Why this is complete rather than partial:** it has a trigger, a terminal state (`CLOSED`), a durable artifact, and a user-observable proof of the product's core claim (defensibility). It is *not* a screen list; it is a result the coordinator can point at.

---

# Artifact 4 — Prioritized Decision Register

## Required BEFORE planning can be finalized

### D1 — Who is the primary user? **P0**
- **Why it matters:** determines the MCPO, the first UI, the role policies exercised, and whether cross-organization work is on the critical path. Every requirement below inherits from it.
- **Options:**
  - **(a) Central-intake coordinator at the receiving facility.** Evidence: newest owner ruling `[D: INTAKE_TO_ADMISSION_WORKFLOW:23]`; `INTAKE_COORDINATOR` is the most-privileged role in the case, document, and prescreen policies `[V]`; same-organization only, so no cross-org design is needed `[V: ADR-0014]`.
  - **(b) Field responder / public-safety officer.** Evidence: the crisis narrative starts here `[D: docs/09 §1]`; field-mode intake is built in the prototype `[V]`. **Blocked:** `FIELD_RESPONDER` does not exist in the `UserRole` enum `[V]`, ADR-0014 deferred every external actor, and cross-org submission is *structurally inexpressible* `[V]`. Choosing (b) puts the unresolved cross-organization design on the critical path.
  - **(c) Both, sequenced.** Evidence: the documented journey needs both ends. Cost: doubles slice count before any validation.
- **Recommended `[P]`: (a).** It is the newest owner ruling, it is the only option with zero blocking architectural prerequisites, and it exercises the most already-tested code.
- **Confidence:** Medium. **Owner:** Tyler Hebert (product owner). **Dependency:** none — decidable today.
- **Consequence of delay:** every subsequent artifact stays conditional; UI work cannot start.
- **Can development proceed without it?** Only Slice S0 and S1 (both thesis-invariant). Not S2 onward.

### D2 — Is Thesis B (public-safety coordination directory / grant path) the product, a funding strategy, or a parked bet? **P0**
- **Why it matters:** PR #30 is 2,484 files, adds a `network-enrichment-service`, a `networkReviewGateway`, Google Apps Script CRMs, and a Python grant-hunter, and introduces a criminal-justice ↔ health data-sharing perimeter `[V]`. It also contains the repository's only revenue mechanism and only outcome metrics.
- **Options:**
  - **(a) Park it.** Keep the branch, merge nothing, revisit after the first workflow is validated. Preserves capacity.
  - **(b) Merge the contracts only** (PR #29 is contracts-only `[V]`), park the tooling and the grant narrative.
  - **(c) Adopt Thesis B as the product.** Then D1 resolves to (b)-field-responder, the cross-org design moves onto the critical path, and the MCPO is re-derived.
- **Recommended `[P]`: (a) park, with (b) as an acceptable compromise if the contracts are genuinely inert.** Rationale: `main` has three weeks of tested capability and zero reachable product; adding a second product before the first is reachable maximizes the risk already realized as R12 (scope sprawl).
- **Confidence:** Medium-High. **Owner:** product owner. **Consequence of delay:** divergence compounds; PR #30 grows harder to merge or discard each week.
- **Can development proceed without it?** No — S2 onward depends on it.

### D3 — Has the source workbook been reviewed for real patient data? **P0 / blocking any external step**
- **Why it matters:** `reference/source-documents/clarity-mh-sources/Reporting Metrics Ops and Budget .xlsx` (1.6 MB) is tracked in git and pushed to the remote; the repo's own committed `sheet_summary.csv` flags 25 of 44 sheets `has_phi_risk = Yes` `[V]`. `SECURITY.md:5` already treats it as business-sensitive material that must stay local (risk R-11).
- **Options:** (a) qualified review → if real data, remove from history and vault; (b) remove from history now, review out-of-band; (c) accept the risk in writing with a documented rationale.
- **Recommended `[P]`: (a), and treat (b) as the default outcome unless review proves otherwise.** A `.gitignore` entry does not remove git history.
- **Confidence:** High that action is needed; `[U]` on what the file actually contains — **I did not open it.**
- **Owner:** owner, with qualified privacy review. **Consequence of delay:** blocks user research, grant submission, any data room, and any move toward a public remote.
- **Can development proceed without it?** Internal synthetic development yes; anything external no.

### D4 — Strike or correct the "HIPAA-compliant" claim on PR #30. **P0, one sentence**
- **Why:** `docs/product/CLARITY_GRANT_CONCEPT_NOTE.md` states Clarity provides a *"governed, HIPAA-compliant routing and directory platform"* `[V]`, contradicting `CLAUDE.md` rule 4, `SECURITY.md:3`, and reality. If it reaches a grant reviewer it is a material misrepresentation.
- **Recommended `[P]`:** strike the phrase; replace with the repository's own standard formulation ("designed toward controls required for a future PHI-ready deployment; not HIPAA-compliant, synthetic data only"). **Owner:** owner. **Delay consequence:** compliance and credibility exposure. Development is unaffected.

## Required BEFORE development

### D5 — Product name and positioning (OD-4). **P1**
"Clarity" / "Clarity MH" / "Clarity AI" / "Clarity Crisis Platform" / "Crisis Ops v0.2" all appear `[V]`. **Recommended `[P]`: "Clarity", and drop "AI" and "intelligence" from positioning** until something is derived — the roadmap already forbids AI promises in pilot conversations `[D: MVP_ROADMAP:59]`, so the name currently contradicts the sales instruction. Owner: product owner. Blocks: UI chrome, any external artifact.

### D6 — `caseKey`: who generates it? **P1**
`caseKey` maps onto the row primary key and is **client-supplied and globally unique, not per-organization unique** — a documented limitation `[V: packages/case-repository/src/mappers.ts:19-22]`. A collision returns a deliberately non-committal `Case key "X" is unavailable` `[V: prismaCaseRepository.ts:94]`, but existence still leaks across tenants.
**Options:** (a) server-generates an opaque id, UI never sees a key to invent; (b) keep client-supplied and expose it as a user-entered field; (c) migrate to a real per-tenant `caseKey` column.
**Recommended `[P]`: (a) for the first slice** — the API generates the id, the UI never asks a human to invent one. Defer (c) to a migration when a human-meaningful case number is actually requested by a user. Owner: tech lead. Blocks: FR-02.

### D7 — Read authorization and read auditing. **P1 — this is a design decision, not plumbing**
Every write passes `assertPermitted(...)` `[V]`; the tenant-scoped read methods in F2 bypass the service layer entirely. Exposing them over HTTP requires deciding: which roles may list and read cases; whether reads are audited (`AccessDocument` already audits VIEW/DOWNLOAD `[V]`, setting a precedent); and whether `READ_ONLY_AUDITOR` / `COMPLIANCE_REVIEWER` see everything.
**Options:** (a) mirror each write policy's read counterpart, no read audit; (b) explicit `CASE_READ_POLICY` + audit case *detail* reads but not list reads; (c) audit all reads.
**Recommended `[P]`: (b)** — it follows the `AccessDocument` precedent, keeps list views cheap, and makes "who looked at this case?" answerable, which is the same defensibility promise the product is built on. Record as a new ADR. Owner: tech lead + owner. Blocks: FR-05/06/07 and Slice S1.

### D8 — `PatientToken` creation: what is acceptable input? **P1 — the PHI boundary**
Per F1, no governed creation path exists. The model carries `dateOfBirth`, `age`, `sex`, `externalPatientReference`, `guardianStatus`, `preferredLanguage`, `privacyFlags` `[V]`.
**Options:** (a) accept all schema fields; (b) **minimum-necessary**: accept only `age`, `preferredLanguage`, `guardianStatus`, and a required `privacyFlags: ["SYNTHETIC_ONLY"]`, and make `dateOfBirth`/`sex`/`externalPatientReference` *structurally unacceptable input* until an encryption and data-classification capability exists; (c) defer and keep seeding tokens by script.
**Recommended `[P]`: (b).** It is exactly the precedent already set by the benefits service, where member/group/policy identifiers are structurally unacceptable and the `*Encrypted` columns stay NULL `[V: ADR-0009]`. It also directly mitigates the brief's A5 risk (*"synthetic only is policy, not enforcement"*). Owner: tech lead + owner. Blocks: FR-01, therefore the whole slice.

### D9 — Execute or defer ADR-0012 (Fastify) before adding routes. **P1**
The hand-rolled `node:http` server is 375 lines with regex routing; ADR-0012 proposes Fastify and is accepted-in-part but unexecuted `[V]`. This slice adds ~11 routes.
**Options:** (a) port to Fastify first, behind existing tests; (b) add the routes to `node:http` and port later; (c) port after the first slice ships.
**Recommended `[P]`: (c).** Evidence: the prescreen slice already proved commands map 1:1 onto routes without changing command behavior `[V: ADR-0014 §3]`, so the port is mechanical and testable at any time; and the brief's A6 risk is about *late* rework, which (c) bounds to one slice. But note the counter-evidence honestly: the server has grown from 3 routes to 10 while this decision stayed open, and (c) makes it ~22. If the owner prefers (a), the cost is roughly one slice of delay with no user-visible value. Owner: tech lead.

### D10 — Pilot data classification and environment. **P1**
**Recommended `[P]`:** synthetic-only pilot on **localhost or a single-tenant private host with no real data**, keeping the HIPAA cliff out of scope exactly as the existing MVP definition requires `[D: MVP_ROADMAP:28]`. Add a data-classification check at the API entry path (already named as a Phase-4 action in that roadmap). Owner: owner + security. Blocks: pilot, not development.

## Required BEFORE release (pilot)

### D11 — Hosting, backup, and restore (OD-6). **P2**
Cloud SQL `us-central1` is recorded intent with no authenticated GCP access `[V]`. Recommended `[P]`: keep the pilot local/single-host; do not spend the provider-backed RLS gate until a user has completed the workflow once. **This inverts the current stated next action**, which puts the GCP gate first `[V: IMPLEMENTATION_STATUS.md:113]` — justified because provider-backed RLS reduces a risk that no user has yet been exposed to, while zero-validation is the top-ranked risk. Owner: owner + tech lead.

### D12 — Support model and stop conditions for the pilot. **P2** `[U]` today. Owner: owner.

### D13 — Activation metric. **P2**
Recommended `[P]`: one counted event — *"a named pilot user completed a case end-to-end through the UI"* — which is already the repository's own MVP exit criterion `[V: MVP_ROADMAP:42]`. The seam exists: `exportAnalyticsEvents()` is implemented with **no callers** `[V]`. Owner: product owner.

## Can be deferred

| Decision | Why deferrable |
|---|---|
| OD-7 pnpm/Turborepo | No current pain at 11 packages |
| OD-8 43-model schema graduation | No slice needs it; migration cost grows but stays bounded |
| OD-11 payer criteria packs | Benefits/authorization are out of the MCPO |
| OD-2 counsel review / OD-3 clinical licensing | Required before legal or clinical *content* ships; the MCPO contains neither. **Do not** demo e-PEC to external stakeholders until OD-2 closes |
| Cross-organization submission/receipt model | Out of scope under D1(a); becomes P0 under D1(b) |
| Episode/UR product surface | Separate boundary per Artifact 1 |
| Notification/assignment inbox | Real gap, but not needed for a single-user pilot |

---

# Artifact 5 — Product Requirements Document

## 5.1 Product Requirement Summary

| Field | Content |
|---|---|
| **Working title** | Referral to owned, provable case (Case Spine v1) |
| **Product area** | Case coordination and audit |
| **Target user** | Central-intake coordinator (`INTAKE_COORDINATOR`), single pilot organization, synthetic data only |
| **User problem** | A referral arrives and there is nowhere governed to put it. Facts live in a spreadsheet or a memory; ownership is verbal; and afterward nobody can prove what was decided or by whom |
| **Desired outcome** | A durable, tenant-scoped case that is findable, owned, prioritized, explainable, and closable |
| **Proposed solution** | Expose the already-tested case command service and the already-tested tenant-scoped read methods over an authenticated HTTP API; add the one missing governed creation path (`PatientToken`); put a thin, routed UI in front of it |
| **Strategic rationale** | Converts three weeks of verified but unreachable backend into the first testable user outcome, and creates the spine every later slice attaches to |
| **Current state** | 9 case commands tested `[V]`; 1 exposed over HTTP `[V]`; 0 read routes `[V]`; no `PatientToken` creation path `[V]`; UI is a `localStorage` prototype sharing zero contracts `[V]` |
| **Intended future state** | 8 write routes + 3 read routes + 1 creation command, behind a verified session, driving a routed UI with a visible audit timeline |
| **Scope** | Auth entry, patient-token creation, case create/list/detail/audit, assign, urgency, location, workstream status, decision rationale, close, reopen |
| **Non-scope** | Documents, evidence, benefits, authorization, legal instruments, packet, routing, bedboard, prescreen, episode/UR, cross-org, notifications, metrics, file upload, AI |
| **Dependencies** | D1, D2, D6, D7, D8 closed; D9 answered |
| **Constraints** | Solo maintainer + AI pair; synthetic data only; no hosting; `node:http` server; no DB-level append-only enforcement; no encryption capability |
| **Risks** | Wrong primary user (D1) · read-authorization design error (D7) · PHI boundary widened by the token command (D8) · prototype-vs-new-UI rework (D6/scope) |

## 5.2 Problem Statement

**What currently happens `[D + I]`.** A coordinator receives a referral by phone or fax. They write it on a whiteboard or into a spreadsheet, tell a colleague verbally who owns it, and keep the priority in their head. Clinical, legal, and benefits work start in parallel with no shared record. When someone asks two days later why a case went the way it did, the answer is reconstructed from memory and email.

**Why it creates difficulty.** Facts are re-collected at each handoff; ownership is ambiguous; priority is invisible to anyone not in the room; and nothing is provable afterward.

**Who experiences it.** The central-intake coordinator daily. Downstream: clinician reviewers deciding on incomplete evidence, compliance officers reconstructing after the fact `[D: docs/09]`.

**What consequence results `[D, unquantified]`.** Repeated intake work, unowned cases, and unprovable decisions. The real-workbook analysis names "Process Denials — denials caused by missing authorization, late review, documentation gaps" as a tracked operational metric `[V: METRIC_DEFINITIONS.md]`, which is the financial shadow of the same coordination failure.

**Why the current product does not yet solve it.** Every mechanism exists and is tested; **none of it is reachable.** There is no read API, no creation path for the patient token a case requires, and the only UI writes to `localStorage` `[V: F1, F2]`.

**Evidence available.** `[V]` implementation + 342/343 tests; `[D]` README, PRODUCT_VISION, personas doc, MVP roadmap; `[I]` the real operations workbook. **Absent:** any interview, ticket, usage log, or baseline measurement. **This problem statement is single-sourced from the owner and must not be presented as validated.**

## 5.3 User Story

> **As a** central-intake coordinator at a receiving behavioral-health facility, **I need to** turn an arriving referral into an owned, prioritized case record that I can find and explain later, **so that I can** stop re-collecting the same facts and stop reconstructing decisions from memory.

Supporting stories, included only because the primary workflow cannot complete without them:

- **As a** coordinator, **I need to** see every open case in my organization in one place, **so that I can** find the one I am being asked about.
- **As a** coordinator, **I need to** read the full history of actions on a case, **so that I can** answer "what happened here?" without asking anyone.
- **As an** organization administrator, **I need to** reopen a closed case with a stated reason, **so that** a premature closure is correctable and the correction is visible. `[V: this authority already exists and is exactly scoped]`

## 5.4 Jobs to Be Done

| Job | Label |
|---|---|
| When a referral arrives mid-shift, the user wants to record it once in a place that will still exist tomorrow, so they can stop holding it in memory. | `[I]` |
| When several cases are open, the user wants to see which are unowned or most urgent, so they can decide what to touch next. | `[D: docs/09 §2 focus KPIs]` |
| When a decision is made, the user wants the reason attached to the case, so they can defend it later without recalling it. | `[V: RecordDecisionRationale exists and is tested]` |
| When asked "what happened on this case?", the user wants to read the answer off a screen, so they can respond without a colleague or a database query. | `[P]` |
| When a case is finished, the user wants a real terminal state, so their queue reflects reality. | `[V: CloseCase + terminal-case protection]` |
| **Emotional:** the user wants to not be the person who could not explain a placement decision. | `[I]` — strongly implied by the design's obsession with review gates and rationale, never stated |
| **Operational:** the team wants every mutation attributable to a verified person, so oversight is possible. | `[V: append-only audit + DB-sourced roles]` |

## 5.5 Workflow Requirements

### Happy path

| # | Actor | User goal | User action | System response | Required data | Business rule | Permission | Dependency | Possible failure | Recovery | Completion signal |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Coordinator | Get in | Submit credentials | Verified session; roles loaded **from the database** | assertion / credential | Auth failures are one indistinguishable error `[V]` | any active user | Auth service `[V]` | Bad credential; deactivated user | Uniform error; retry | Session token issued, expiry shown |
| 2 | Coordinator | See my work | Open case list | Cases for the principal's organization only | organizationId (principal-derived) | Tenancy in every predicate `[V]` | per `CASE_READ_POLICY` (D7) | FR-05 | Empty org | Purposeful empty state | List rendered |
| 3 | Coordinator | Start a record | Enter minimum patient descriptors | `PatientToken` created, `SYNTHETIC_ONLY` flagged | age, language, guardian status | Minimum-necessary only; DOB/sex/external ref structurally rejected (D8) | `INTAKE_COORDINATOR` | **FR-01 (missing today)** | Validation rejection | Field-level message | Token id returned |
| 4 | Coordinator | Create the case | Submit create | Case created `DRAFT`; audit event written atomically | patientTokenId, urgency, location | Server generates the id (D6); atomic audit `[V]` | `CreateCase` policy `[V]` | FR-02 | Key collision; token not in org | Non-revealing error; retry | Case appears in list |
| 5 | Coordinator | Give it an owner | Assign a user | Assignee same-org + ACTIVE checked **inside** the transaction and re-asserted on the UPDATE predicate `[V: ADR-0005]` | assigneeUserId | No cross-tenant assignment | `AssignCase` `[V]` | FR-08 | Assignee deactivated mid-transaction | Deterministic failure; nothing written `[V: tested]` | Owner shown |
| 6 | Coordinator | Set priority | Set urgency | Versioned update + audit | urgency enum | Terminal cases protected `[V]` | `UpdateCaseUrgency` `[V]` | FR-09 | Stale version | Show current, offer retry | Urgency shown |
| 7 | Coordinator | Move the case | Transition status | State machine validated on the **fresh** row `[V]` | target status | Only legal transitions | `TransitionCase` `[V]` | FR-10 | Illegal transition | Name the rule that blocked it | New status shown |
| 8 | Coordinator | Record why | Enter rationale | Rationale + audit event | reason, decisionContext | Rationale required off the normal path `[V]` | `RecordDecisionRationale` `[V]` | FR-12 | — | — | Rationale in history |
| 9 | Coordinator | Prove it | Open history | Full audit trail: actor, action, timestamp, previous/new state hashes | caseId | Append-only; restricted identifiers never present `[V, tested]` | read policy (D7) | FR-07 | — | — | Timeline rendered |
| 10 | Coordinator | Finish | Close case | Terminal state + audit | reason | Terminal protection thereafter `[V]` | `CloseCase` `[V]` | FR-13 | — | — | Case shows `CLOSED` |
| 11 | Org admin | Correct a mistake | Reopen with reason | Reopen; mandatory rationale; `SYSTEM_ADMIN` provably cannot `[V]` | reason | Exactly `ORGANIZATION_ADMIN` `[V]` | `ReopenCase` `[V]` | FR-14 | Wrong role | 403, content-free | Case reopened, visible in history |

### Critical exception paths

| Exception | Required behavior | Status |
|---|---|---|
| **Concurrent edit** | Version conflict → 409; UI shows the current value and offers a retry; **nothing partial is written** | Engine `[V, tested]`; HTTP mapping and UX `[P]` |
| **Permission denial** | 403, content-free, no hint about what would have been allowed | `[V]` for prescreen codes; extend to case routes `[P]` |
| **Cross-tenant / absent case** | Indistinguishable non-revealing 404 | `[V]` |
| **Session expiry / revocation** | 401; UI returns to entry without losing typed input | `[V]` engine; UX `[P]` |
| **Duplicate submit (double-click, retry)** | Idempotency key replays instead of duplicating | `[V]` engine; UI must send a stable key `[P]` |
| **API unreachable** | Explicit, actionable state — the existing prototype already does this well (`"API server is not running. Start it with: npm run api:dev"`) `[V: app/src/domain/api.ts:107]` | Reuse |
| **Illegal state transition** | Name the rule that blocked it, do not just refuse | `[V]` engine; UI copy `[P]` |

## 5.6 Functional Requirements

Priority: **P0** = MCPO cannot complete without it · **P1** = MCPO is unsafe or unusable without it · **P2** = pilot-quality.

### Entry and onboarding

| ID | Requirement | Actor | Rationale | Pri | Source | Acceptance criteria | Deps | Open questions |
|---|---|---|---|---|---|---|---|---|
| FR-20 | The system must issue a session whose roles and organization are read from the database, never from the request | coordinator | Retires the trusted-caller-roles assumption | P0 | `[V: ADR-0011]` | A request asserting a role it does not hold is rejected; roles in the session match the DB row | — | Managed IdP is deployment-phase `[D]` |
| FR-21 | The system must present one indistinguishable failure for every authentication error | any | Prevents account enumeration | P0 | `[V]` | Unknown assertion, wrong assertion, and deactivated user produce identical responses | FR-20 | — |
| FR-22 | The system must end a live session on the next request after the user is deactivated | admin | Revocation must be effective, not eventual | P1 | `[V]` | Deactivate → next request 401 | FR-20 | — |
| FR-23 | The UI must show the verified principal, organization, roles, and session expiry, and must not present unverified role selection as access control | coordinator | The prototype's role dropdown is a credibility hazard `[V: brief §11]` | P1 | `[P]` | No control changes the acting role client-side; the displayed role equals the session role | FR-20 | Remove the demo dropdown or fence it behind a demo flag? |

### Core workflow

| ID | Requirement | Actor | Rationale | Pri | Source | Acceptance criteria | Deps | Open questions |
|---|---|---|---|---|---|---|---|---|
| **FR-01** | The system must provide a governed command that creates a `PatientToken` within the caller's organization, accepting **only** minimum-necessary descriptors and requiring `privacyFlags` to include `SYNTHETIC_ONLY` | coordinator | **F1: no such path exists — this is the blocking gap** | **P0** | `[V: F1]` + `[P]` design | Command exists behind a role policy; writes an audit event; supplying `dateOfBirth`, `sex`, or `externalPatientReference` is rejected as an unknown field; token is only visible within its organization | D8 | Does any *validated* workflow need DOB rather than age band? `[U]` |
| FR-02 | The system must create a case from a patient token in the caller's organization, with a server-generated identifier | coordinator | Humans should not invent globally unique keys (D6) | P0 | `[V]` command + `[P]` id policy | Create succeeds without a caller-supplied key; case starts `DRAFT`; audit event atomic with the row | FR-01, D6 | Will a user later demand a human-readable case number? `[U]` |
| FR-03 | The system must reject a case creation whose patient token belongs to another organization, non-revealingly | coordinator | Tenancy is not a record id `[V]` | P0 | `[V]` | Cross-tenant token → same response as a nonexistent token | FR-01 | — |
| FR-04 | The system must accept an idempotency key on every mutating request and replay rather than duplicate | coordinator | Retries and double-clicks must be safe | P0 | `[V]` engine | Same key + same intent → replay; same key + different nested body → 409 | — | — |
| FR-05 | The system must return the list of cases scoped to the principal's organization | coordinator | **F2: no read route exists** | P0 | `[V]` gateway + `[P]` route | Response contains only same-org cases; a second org's case is never present | D7 | Pagination threshold? `[U]` — defer until a real queue size is known |
| FR-06 | The system must return one case's detail, scoped to the principal's organization | coordinator | Detail view | P0 | `[V]` gateway + `[P]` route | Same-org case returns; other-org and absent are indistinguishable 404 | D7 | — |
| FR-07 | The system must return the append-only audit history for a case: actor, action, timestamp, and state-change evidence, containing no restricted identifiers | coordinator | This *is* the product's core value claim | P0 | `[V]` audit + guard, tested | History renders in order; the restricted-identifier guard test still passes over the new route | D7 | Audit case-detail reads too? (D7 recommends yes) |
| FR-08 | The system must assign a case only to an active user in the same organization, validated inside the command transaction | coordinator | TOCTOU already closed — must not regress at the HTTP layer | P0 | `[V: ADR-0005]` | Mid-transaction deactivation fails deterministically and writes nothing | FR-02 | — |
| FR-09 | The system must update case urgency with optimistic concurrency | coordinator | Priority is the queue's organizing signal | P0 | `[V]` | Stale `expectedVersion` → 409, no write | FR-02 | — |
| FR-10 | The system must transition case status only along legal state-machine paths, validated on the freshly-read row | coordinator | Prevents invalid lifecycle states | P0 | `[V]` | Illegal transition rejected with the blocking rule named | FR-02 | — |
| FR-11 | The system must update each of the 8 workstream statuses independently, never touching siblings | coordinator | Parallel-lane model; financial must never gate clinical | P1 | `[V: workstreams.ts + tested invariant]` | Updating `benefits` leaves `clinical` unchanged; blocked financial lane does not block clinical review | FR-02 | Which lanes appear in v1 UI? `[P]` all 8, read-mostly |
| FR-12 | The system must record a decision rationale against a case | coordinator | Defensibility | P0 | `[V]` — already the one live route | Rationale appears in history with actor and time | FR-02 | — |
| FR-13 | The system must close a case and thereafter refuse non-reopen mutations | coordinator | Real terminal state | P0 | `[V]` | Post-close mutation attempts rejected | FR-02 | — |
| FR-14 | The system must permit reopen only to `ORGANIZATION_ADMIN` with a mandatory rationale, and must make `SYSTEM_ADMIN` incapable of it | org admin | Exactly-named authority, already tested | P1 | `[V]` | `SYSTEM_ADMIN` reopen → 403; failed reopen writes nothing | FR-13 | — |

### Error recovery

| ID | Requirement | Pri | Source | Acceptance criteria |
|---|---|---|---|---|
| FR-30 | The system must map every domain error to a stable, content-free HTTP code (401/403/404/409/400) | P0 | `[V]` precedent in prescreen mapping | No response body reveals existence, ownership, or what would have been permitted |
| FR-31 | The UI must preserve user input across a recoverable failure (409, 401, network) | P1 | `[P]` | After a conflict or expiry, typed values are still present after re-auth/retry |
| FR-32 | The UI must distinguish "no data yet" from "failed to load" from "not permitted" | P1 | `[P]` — the prototype has good empty states to harvest `[V: EmptyState]` | Three visually and textually distinct states |
| FR-33 | The UI must surface an unreachable API as an actionable state | P2 | `[V]` existing implementation | Message names the concrete remedy |

### Audit and history

| ID | Requirement | Pri | Source | Acceptance criteria |
|---|---|---|---|---|
| FR-40 | Every mutation must write exactly one append-only audit event in the same transaction as the row change | P0 | `[V]` | Forced post-write failure leaves neither row nor event (already the tested pattern) |
| FR-41 | Audit metadata must carry hashes and field names, never source text, filenames, or restricted identifiers | P0 | `[V]` + tested guard | The existing security suite passes unchanged with the new routes in place |

### Administration (out-of-product in v1)

| ID | Requirement | Pri | Source | Acceptance criteria |
|---|---|---|---|---|
| FR-50 | Organization and user provisioning may remain a documented operator script for v1 | P2 | `[V]` `devMain.ts` already does this idempotently | A named runbook creates the pilot org, one coordinator, one admin; no in-product admin UI is built |

**Deliberately excluded categories:** notifications, collaboration, approvals beyond the existing role policies, reporting, integrations. None is required for the MCPO, and each would widen the slice.

## 5.7 Nonfunctional Requirements

| ID | Category | Requirement | Measure | Status |
|---|---|---|---|---|
| NFR-01 | Tenant isolation | Every read and write carries an organization predicate | The existing isolation suites pass over the new routes; one negative test per new route | `[V]` engine; `[P]` route coverage |
| NFR-02 | Security | Session tokens stored only as SHA-256 hashes, returned exactly once, never audited | Existing tests pass | `[V]` |
| NFR-03 | Privacy | No real PHI. Restricted identifiers structurally unacceptable as input | FR-01 rejects DOB/sex/external ref; security suite green | `[V]` pattern; `[P]` for the token command |
| NFR-04 | Auditability | Application-layer append-only. **DB-level enforcement is explicitly deferred and must not be claimed** | Documented in the slice's honesty statement | `[V]` gap named in MVP_ROADMAP:50 |
| NFR-05 | Reliability | No partial writes under failure or contention | Existing concurrency/interleave tests plus one per new mutating route | `[V]` |
| NFR-06 | Recovery | Local migration replay + restore rehearsed before pilot | `npm run migration:recovery:local` green on a disposable DB | `[V]` script exists |
| NFR-07 | Observability | Every request logs correlation id, principal id, org id, route, outcome — and never a body | Log review on a manual acceptance pass | `[P]` — gap today |
| NFR-08 | Performance | Case list and detail respond in <500 ms at pilot scale (≤500 cases, single user) | One measured pass | `[P]` — no perf dimension exists today (blind spot #6) |
| NFR-09 | Accessibility | Keyboard-operable primary workflow; labelled form controls; visible focus | Manual keyboard-only pass of the full happy path | `[P]` — untested today |
| NFR-10 | Maintainability | The UI consumes API types; the domain model is not implemented a second time | No duplicated state machine or enum list in UI code | `[P]` — directly addresses blind spot #3 |
| NFR-11 | Verification integrity | Typecheck is hermetic; each branch session uses an ephemeral database | `tsconfig.json` gains `baseUrl` and the missing path; `migration-integrity` passes | `[V]` defect confirmed this session |
| NFR-12 | Compliance posture | No HIPAA, production-readiness, or measured-outcome claim in any artifact | Honesty statement present in the slice's docs | `[V]` required by CLAUDE.md rule 4 |

## 5.8 Roles and Permissions

| Role | Allowed in this slice | Restricted | Data visibility | Approval authority | Enforcement today |
|---|---|---|---|---|---|
| `INTAKE_COORDINATOR` | Create token, create case, assign, urgency, location, transition, workstream, rationale, close; read list/detail/history | Cannot reopen | Own organization only | — | `[V]` writes; **reads need D7** |
| `ORGANIZATION_ADMIN` | All of the above **plus reopen with mandatory rationale** | — | Own organization | Reopen | `[V]` |
| `CLINICAL_REVIEWER` / `PHYSICIAN_REVIEWER` | Read; workstream updates within their lanes | Not intake-coordination commands | Own organization | Clinical review (later slices) | `[V]` writes; reads need D7 |
| `COMPLIANCE_REVIEWER` / `READ_ONLY_AUDITOR` | Read case + history | No mutations; explicitly no upload/classify | Own organization | — | `[V]` documented exclusions in `document-service/src/permissions.ts`; **case-read equivalent does not exist** |
| `SYSTEM_ADMIN` | **Nothing** in this slice | No case commands, no reopen, no prescreen | — | — | `[V]` — deliberate, tested |

**Where enforcement is missing.**
1. **Reads have no policy at all** — the gateway read methods bypass the service layer (F2). D7 must close this before FR-05/06/07 ship.
2. **Database-level tenancy (RLS)** covers only the 9 episode-persistence tables, locally `[V]`. Case, audit, and idempotency tables rely on application predicates alone.
3. **The prototype's 8 personas are not permissions** and must not be presented as such (FR-23).

## 5.9 Data Requirements

| Name | Purpose | Source | Owner | Format | Req? | Validation | Sensitivity | Retention | Source of truth | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| `organizationId` | Tenant boundary | Verified principal — **never the request** | Platform | string | Yes | Present in every predicate | Low | Life of tenant | Clarity | `[V]` |
| `actor` (id, type, roles) | Attribution | Principal → `actorFor` | Platform | object | Yes | Roles from DB only | Low | With audit | Clarity | `[V]` |
| `patientToken.age` | Age-band clinical context | Coordinator entry | Pilot org | int | Yes | Range check | **Medium** | Pilot only | Clarity | `[P]` FR-01 |
| `patientToken.preferredLanguage` | Access need | Coordinator | Pilot org | string | No | Enum or free text | Low | Pilot | Clarity | `[P]` |
| `patientToken.guardianStatus` | Consent-authority context | Coordinator | Pilot org | string | No | Enum | Medium | Pilot | Clarity | `[P]` |
| `patientToken.privacyFlags` | Synthetic enforcement | System | Platform | string[] | **Yes** | Must include `SYNTHETIC_ONLY` | Low | Pilot | Clarity | `[P]` — mitigates risk A5 |
| `patientToken.dateOfBirth` / `.sex` / `.externalPatientReference` | — | — | — | — | **MUST NOT be collected in v1** | **High** | — | — | Schema columns exist `[V]`; D8 recommends structural rejection |
| `case.id` (`caseKey`) | Case identity | **Server-generated** (D6) | Platform | string | Yes | Uniqueness handled non-revealingly | Low | Life of case | Clarity | `[V]` with `[P]` id policy; note the documented global-uniqueness limitation |
| `case.status` | Lifecycle | State machine | Clarity | enum | Yes | Legal transitions only | Low | Life of case | Clarity | `[V]` |
| `case.urgency` | Prioritization | Coordinator judgment | Pilot org | enum | Yes | Enum | Low | Life of case | **Human** | `[V]` |
| `case.assignedUserId` | Ownership | Coordinator | Pilot org | FK | No | Same-org + ACTIVE, in-transaction | Low | Life of case | Clarity | `[V]` |
| 8 × workstream status | Parallel lanes | Role-scoped users | Pilot org | enum | Yes (defaulted) | Independent transitions | Low | Life of case | Clarity | `[V]` |
| `case.version` | Concurrency | System | Platform | int | Yes | Monotonic | Low | Life of case | Clarity | `[V]` |
| `auditEvent.*` | Defensibility | System | Platform | row | Yes | Restricted-identifier guard | Medium (metadata only) | **Indefinite** | Clarity | `[V]` |
| `commandIdempotencyRecord` | Replay safety | System | Platform | row | Yes | Canonical fingerprint | Low | **Retention undecided** `[U]` | Clarity | `[V]`; named as a pre-production gap |

**Must not be collected in v1:** date of birth, sex, name, address, contact details, SSN, member/group/policy identifiers, any real external reference, uploaded files. Rationale: no encryption capability exists (`*Encrypted` columns stay NULL `[V]`), and the pilot's entire risk posture depends on staying synthetic.

## 5.10 Integration Requirements

**Recommended for v1 `[P]`: zero live integrations.** Every alternative adds infrastructure without testing the product hypothesis.

| System | Purpose | Data | Direction | Auth | Frequency | Failure behavior | Ownership | Readiness | Required in v1? |
|---|---|---|---|---|---|---|---|---|---|
| Local dev identity provider | Pilot sign-in | assertion → email | inbound | none (dev) | per login | Uniform rejection | Platform | `[V]` implemented | **Yes** — sufficient for a synthetic single-tenant pilot |
| Managed IdP (OIDC) | Real identity | claims | inbound | provider | per login | — | Platform | `[V]` port only, no adapter | **No** — deployment-phase |
| PostgreSQL (local `clarity_dev`) | Persistence | all | bidirectional | local | continuous | Transaction rollback | Platform | `[V]` | **Yes** |
| Object storage | Document bytes | files | out/in | — | — | Compensating delete | Platform | `[V]` dev adapter | **No** — documents are out of scope |
| Cloud SQL / hosting | Production DB | all | — | GCP | — | — | Platform | `[D]` intent only, no GCP access | **No** — D11 defers it |
| Outbox consumer | Event delivery | events | outbound | — | — | Retry preserved | Platform | `[V]` synthetic in-process only | **No** |
| Payer / EHR / fax / email | — | — | — | — | — | — | — | Not started | **No** |
| Model provider (LLM) | — | — | — | — | — | — | — | Absent entirely | **No** |

## 5.11 UX Requirements

| Dimension | Requirement |
|---|---|
| **Entry point** | A single URL. Unauthenticated → sign-in. Authenticated → case list. **Add a router** — the prototype holds workspace in React state, so there are no URLs, no deep links, and no back button `[V: App.tsx:88]`. For a coordination product this is disqualifying: a coordinator must be able to send a colleague a link to a case. |
| **Navigation** | Two destinations in v1: **Case list** and **Case detail**. Not 17 workspaces. Everything not in the MCPO is absent, not disabled — a greyed-out feature reads as broken. |
| **Primary action** | "New case" is the single most prominent control on the list. |
| **Information hierarchy (list)** | Urgency → owner → status → age of case → last activity. Harvest the prototype's Case Queue layout `[V: app/src/workspaces/CaseQueue.tsx]` — the thinking is sound; the data source is not. |
| **Information hierarchy (detail)** | Identity band → status/urgency/owner → the 8 workstream lanes → **audit timeline**. The timeline is not a footer; it is the product's core claim and belongs above the fold. |
| **Decision points** | Assign owner · set urgency · transition status · record rationale · close. Each states who is permitted and what will be recorded. |
| **Status visibility** | Case status, all 8 workstream statuses, and version/last-updated visible without interaction. |
| **Progress visibility** | No completeness percentage. Named gaps only — consistent with the tested no-aggregate-score doctrine `[V: ADR-0010]`. |
| **Empty states** | Three distinct and purposeful: no cases yet (with the create action) · no history yet (impossible in practice, but handled) · no permission (states that access is limited, not that data is missing). Harvest `EmptyState` `[V]`. |
| **Error states** | Conflict → show the current value, offer retry, never silently overwrite. Permission → plain statement, no hint at what would work. Not found → same wording as no-permission, since the backend deliberately makes them indistinguishable, and the UI must not undo that. |
| **Confirmation states** | Close and reopen confirm, and name what will be written to the audit trail. |
| **Completion state** | An unmistakable terminal state on the case, and a visible last audit entry — the user should see that the record is now provable. |
| **Accessibility** | Keyboard-operable happy path; labelled controls; visible focus; status conveyed by text as well as colour (the prototype leans on `StatusBadge` tone `[V]`). |
| **User guidance** | Inline, at the decision. No tour, no onboarding modal. Retain the prototype's habit of stating *why* something is gated. |
| **Trust signals** | Persistent, honest banners: **"Synthetic data only"** and the verified principal + organization + role + session expiry. **Remove or fence the demo role selector** (FR-23) — it currently looks like access control and is not `[V]`. |

## 5.12 Business Rules

| Rule | Source | Current enforcement | Required enforcement | Ambiguity | Clarification owner |
|---|---|---|---|---|---|
| Every read and write is scoped to the actor's organization | `[V]` ADR-0002/0003 | Application predicates, tested | Same + read policy (D7) | Reads unpoliced | Tech lead |
| A record id is never authorization | `[V]` | Enforced | Same | None | — |
| Cross-tenant and absent are indistinguishable | `[V]` | Enforced | Same, over new routes | None | — |
| Case transitions follow the state machine, validated on the fresh row | `[V]` | Enforced | Same | None | — |
| Terminal cases reject further mutation | `[V]` | Enforced | Same | None | — |
| Reopen = exactly `ORGANIZATION_ADMIN` + mandatory rationale; `SYSTEM_ADMIN` cannot | `[V]` | Enforced and tested | Same | None | — |
| Assignee must be same-org and ACTIVE, checked in-transaction | `[V]` ADR-0005 | Enforced | Same | None | — |
| Workstreams transition independently | `[V]` | Enforced | Same | None | — |
| **Financial readiness never blocks emergency clinical review** | `[V]` GOVERNANCE #5, tested | Enforced in contracts | Must survive into the UI — no screen may gate a clinical action on a benefits state | None | — |
| Every material mutation writes one append-only audit event | `[V]` GOVERNANCE #2 | Application layer only | Same in v1; DB-level deferred and **not claimed** | "Material" is not formally defined `[U]` | Tech lead |
| Readiness output names gaps, never an aggregate score | `[V]` ADR-0010, tested | Enforced | Must survive into the UI | None | — |
| Restricted identifiers never enter audit metadata | `[V]` | Enforced and tested | Same | None | — |
| Synthetic data only | `[D]` policy | **Policy, not enforcement** | v1 adds structural enforcement at the token command (FR-01) | What counts as de-identified for a later real pilot? `[U]` | Owner + security |
| Statutory logic is configuration pending counsel review | `[D]` GOVERNANCE #9 | Demo logic only | **Out of scope in v1**; do not demo e-PEC externally until OD-2 | Statutory wording unvalidated | Counsel (OD-2) |
| Clinical criteria require licensing and clinician governance | `[D]` GOVERNANCE | Guard-gated drafts only | Out of scope in v1 | — | Clinical (OD-3) |
| Idempotency fingerprint excludes `occurredAt`; nested-body changes still conflict | `[V]` ADR-0014 §5 | Enforced | Same for case routes | — | — |
| Idempotency record retention | `[D]` named as a gap | None | Decide before real data | Undecided `[U]` | Tech lead |

## 5.13 Acceptance Criteria

**Primary success case**
```
Given  an active INTAKE_COORDINATOR in organization A with a verified session
When   they create a patient token with age and language only, create a case from it,
       assign it to an active same-org user, set urgency to URGENT, record a decision
       rationale, and close it
Then   the case is visible in organization A's case list, its detail shows the assignee,
       urgency and CLOSED status, and its history shows one attributed, timestamped
       audit entry for every one of those actions
```

**Terminal-state protection**
```
Given  a CLOSED case
When   the coordinator attempts to change its urgency
Then   the request is refused, nothing is written, and the audit trail is unchanged
```

**Reopen authority**
```
Given  a CLOSED case and a SYSTEM_ADMIN session
When   reopen is attempted
Then   the response is 403 with no content revealing what would have been permitted,
       and nothing is written

Given  the same case and an ORGANIZATION_ADMIN session with a stated reason
When   reopen is submitted
Then   the case reopens and the reason appears in the audit history
```

**Tenancy**
```
Given  a case belonging to organization B
When   a coordinator in organization A requests it by its exact id
Then   the response is identical to the response for an id that does not exist
```

**Permission (per route)**
```
Given  a session holding no role permitted for the command
When   the command is submitted
Then   the response is 403, content-free, and nothing is written
```

**Concurrency**
```
Given  two sessions holding the same case at version N
When   both submit an urgency change with expectedVersion = N
Then   exactly one succeeds, the other receives 409, exactly one audit event exists,
       and no partial state is persisted
```

**Idempotent retry**
```
Given  a create-case request that timed out client-side
When   it is retried with the same idempotency key and the same intent
Then   the original result is replayed and exactly one case and one audit event exist

Given  the same key with a different nested body
Then   the response is 409
```

**Data-boundary refusal**
```
Given  a patient-token creation request including dateOfBirth
When   it is submitted
Then   it is rejected as an invalid request and no token is created
```

**Recovery**
```
Given  a coordinator mid-form when their session expires
When   they submit
Then   they are returned to sign-in, and after re-authenticating their typed input is intact
```

**Audit integrity**
```
Given  any sequence of successful commands
When   the audit trail is read
Then   it contains no source text, filenames, or restricted identifiers, and the existing
       security suite passes unchanged
```

**Verification hygiene** (NFR-11)
```
Given  a clean checkout in a git worktree
When   lint, typecheck, and the full suite are run against an ephemeral database
Then   all three pass, and typecheck resolves only files inside that worktree
```

## 5.14 Success Metrics

**Nothing below is currently measured.** The repository has zero instrumentation and prints `No measurements found` where a metric would go `[V]`. Baselines marked *Decision required* are genuinely unknown (OD-12) and must not be invented.

### Product outcome metrics
| Metric | Definition | Formula | Source | Freq | Baseline | Target | Owner | Measurable today? |
|---|---|---|---|---|---|---|---|---|
| Workflow completion | Cases reaching a terminal state through the UI | `terminal_cases / cases_created` | audit trail | weekly | none | **Decision required** | PM | Derivable from audit `[V]`, not surfaced |
| Self-service explainability | Times the user answered "what happened?" from the screen without asking a colleague | Observed count in pilot | pilot observation | weekly | none | **Decision required** | PM | Manual only |
| **Activation (candidate north star for this slice)** | A named pilot user completed a case end-to-end through the UI | binary, then count | audit trail | once, then weekly | 0 `[V]` | ≥1, then repeat use | PM | Needs FR-40 + one event emit |

### Workflow metrics
| Metric | Formula | Source | Baseline | Measurable today? |
|---|---|---|---|---|
| Time referral → case created + owned | `assigned_at − created_at` | audit timestamps | **Decision required** (OD-12) | Derivable `[V]` |
| Rework rate | `reopened_cases / closed_cases` | audit | none | Derivable `[V]` |
| Unowned case age | `now − created_at` where `assignedUserId is null` | case rows | none | Derivable `[V]` |

### Adoption metrics
| Metric | Formula | Source | Measurable today? |
|---|---|---|---|
| Days used of days available | `active_days / pilot_days` | session records `[V: AuthSession]` | Derivable |
| Parallel-system persistence (counter-signal) | Is the spreadsheet still in use? | pilot interview | Manual only |

### Quality metrics
| Metric | Formula | Source | Measurable today? |
|---|---|---|---|
| Audit completeness | `mutations_with_audit_event / mutations` | invariant test | **Yes — already tested `[V]`** |
| Tenancy violations | count | isolation suites | **Yes `[V]`** |
| Conflict-loss incidents (user-visible data loss) | count | logs + pilot report | Needs NFR-07 |

### Operational metrics
| Metric | Formula | Source | Measurable today? |
|---|---|---|---|
| Suite green in CI on an ephemeral DB | pass/fail | GitHub Actions `[V]` | Yes |
| Restore rehearsal completed | binary | `migration:recovery:local` `[V]` | Yes |
| p95 case-list latency | measured | manual pass | No — NFR-08 |

---

# Artifact 6 — Scope Matrix

## Must build now
| Item | Reason |
|---|---|
| `PatientToken` creation command with minimum-necessary input (FR-01) | **F1** — the spine has no entry point without it; also the PHI-boundary enforcement point |
| Read routes: case list, case detail, case audit history (FR-05/06/07) | **F2** — no UI is possible without reads; gateway methods already exist |
| `CASE_READ_POLICY` + read-audit decision (D7), recorded as an ADR | Reads currently bypass the service layer entirely |
| 7 remaining case-command routes (create, assign, urgency, location, transition, workstream, close, reopen) | 8 of 9 tested commands have no entry point |
| Stable error-code → HTTP mapping for case commands (FR-30) | Prescreen already sets the pattern; must not diverge |
| Thin routed UI: case list + case detail + audit timeline (with real URLs) | The MCPO's observable outcome; a router is non-negotiable for a coordination product |
| Honest session/identity surface; demo role selector removed or fenced (FR-23) | Current dropdown misrepresents access control |
| Exception UX: conflict, permission, expiry, unreachable (FR-31/32/33) | The workflow is not usable without these, and they are where trust is won |
| `tsconfig.json` `baseUrl` + missing `@clarity/prescreen-service` path; per-session ephemeral DB (NFR-11) | Verification claims are currently unreliable in a worktree `[V]` |
| Operator runbook for org/user provisioning (FR-50) | Cheaper than an admin UI and sufficient for one pilot |

## Reuse or harden
| Item | Reuse how | Harden what |
|---|---|---|
| `CaseCommandService` (9 commands) `[V]` | As-is behind routes | Nothing — do not touch working commands to add HTTP |
| Gateway read methods (F2) `[V]` | As-is | Wrap in a service-layer read policy; add one negative tenancy test per exposed method |
| `AuthenticationService` + `actorFor` + `LocalDevIdentityProvider` `[V]` | As-is | Nothing for a synthetic pilot |
| `packages/api-service/src/server.ts` `[V]` | Extend, following the prescreen route pattern | Revisit under D9 after the slice ships |
| `devMain.ts` seeding `[V]` | Basis for the provisioning runbook | Make the pilot org/users explicit and documented |
| Prototype UX: `CaseQueue`, `CaseOverview`, `EmptyState`, `StatusBadge`, `api.ts` error mapping `[V]` | **Harvest the design and the error copy; do not import the domain layer** | Types must come from the API (NFR-10) so the domain is not implemented twice |
| Existing security + isolation suites `[V]` | Run unchanged against new routes | Extend with per-route cases |
| CI workflow `[V]` | As-is — it already models the ephemeral-DB pattern correctly | — |

## Defer
| Item | Why | Reconsider when |
|---|---|---|
| Documents (upload/version/classify/access) | Fully tested `[V]` but needs multipart/binary transport and a second UI surface | Slice S6, after the spine is validated |
| Evidence review + contradictions | Fully tested `[V]`; the richest capability, but meaningless without documents | Slice S7 |
| Benefits / authorization readiness | Tested `[V]`; a parallel lane, not the spine | After S7 |
| Prescreen Phase 3 persistence (PR #32) | Deepens a workflow whose primary actor is deferred under D1(a) | D1/D2 resolved toward prescreen |
| Legal instruments (OPC/PEC/CEC) | Blocked by OD-2 (counsel) | OD-2 closes |
| Episode/UR surface | Separate bounded context per Artifact 1 | Post-admission becomes the product focus |
| Packet, routing, bedboard | Prototype-only; require cross-org and clinical validation | Cross-org design approved |
| Cross-organization submission/receipt | Structurally inexpressible today by deliberate design `[V]` | D1 resolves toward field/external actors |
| Network enrichment / directory (PRs #29/#30) | D2 | D2 resolves toward Thesis B |
| Provider-backed Cloud SQL / RLS gate | Reduces a risk no user is exposed to yet | A user has completed the workflow (D11) |
| Notifications, assignment inbox | Not needed at one user | Second concurrent user |
| Analytics mart, dashboards | No decision consumes them yet | A validated workflow generates real questions |
| Fastify port (ADR-0012) | D9 recommends after this slice | Route count or complexity forces it |
| Pagination, search, bulk actions | Unknown real queue size | Pilot reveals it |

## Remove or stop
| Item | Reason | Action `[P]` |
|---|---|---|
| "HIPAA-compliant" claim in `CLARITY_GRANT_CONCEPT_NOTE.md` | Violates `CLAUDE.md` rule 4 and `SECURITY.md:3`; false `[V]` | Strike (D4) |
| Tracked `Reporting Metrics Ops and Budget .xlsx` | 25/44 sheets self-flagged PHI-risk; tracked and pushed `[V]` | Review, then almost certainly remove from history and vault (D3) |
| Duplicate ADR-0014 numbering | Two different ADR-0014s on different branches `[V]` | Renumber before any merge (D9-adjacent) |
| `clarity-platform-visualizer/` | Empty directory `[V]` | Delete |
| One of `agent_bridge/` or `agents/bridge/` | Two directories, one dev-tooling concern `[V]` | Consolidate |
| `chatgpt-full-stack-analytics-handoff/source-material/repo/` | Duplicated snapshot of repo docs; a live stale-fork hazard `[V]` | Replace with references to canonical paths |
| Stale `ARCHITECTURE.md` claims ("25 models"; "No backend, API, auth, or tenancy enforcement exists yet") | Both false; it is the top-level architecture entry point `[V]` | Correct — 38 models, and all four exist |
| Prototype demo role selector as shipped | Looks like access control, is not `[V]` | Remove, or fence behind an explicit demo flag (FR-23) |
| Shared local `clarity_dev` across parallel branch sessions | Empirically corrupts verification; issue #31 `[V]` | Stop; per-session ephemeral DBs |
| "AI" / "case intelligence" in positioning | Promises what the product deliberately does not do `[V]` | Resolve via D5 |

---

# Artifact 7 — Vertical-Slice Implementation Plan

Each slice delivers an observable outcome. Prioritized by risk reduction, then dependency order, then user value.

### S0 — Decision closure and verification repair
- **User value:** none directly; unblocks everything and makes "verified" mean something
- **Requirements:** D1–D4, D5–D9 answered; NFR-11, NFR-12
- **Frontend / Backend / Data / Integration:** none
- **Permission work:** none
- **Test work:** `tsconfig.json` gains `baseUrl: "."` and the `@clarity/prescreen-service` path; per-session ephemeral database; `migration-integrity` passes
- **Observability / Docs:** ADR renumbering; `IMPLEMENTATION_STATUS.md` refreshed to 2026-07-29; merge/park ruling recorded for PRs #29/#30/#32; `ARCHITECTURE.md` corrected; HIPAA claim struck; workbook disposition recorded
- **Dependencies:** owner availability only
- **Exit criteria:** D1–D4 in writing; full suite (incl. `migration-integrity`) green on an ephemeral DB; typecheck hermetic; three open PRs each explicitly merged, parked, or closed
- **Risks:** stalls on owner availability — cap at one week and let S1 proceed regardless

### S1 — "I can see my organization's cases" (thesis-invariant)
- **User value:** the first time a real user sees real, tenant-scoped data from the tested backend
- **Requirements:** FR-05, FR-06, FR-07, FR-30, NFR-01, D7
- **Backend:** `CASE_READ_POLICY` + a read service wrapping `listForOrganization`, `findByKey`, and audit-history reads; three GET routes following the prescreen route pattern
- **Data:** none — read-only over existing rows
- **Permission:** the new read policy (D7); decide and implement read auditing for case detail
- **Test:** one positive + one cross-tenant negative per route; permission-denied per route; the existing security suite unchanged
- **Observability:** structured request logging with correlation id, principal, org, route, outcome, never a body (NFR-07)
- **Docs:** read-authorization ADR
- **Dependencies:** D7 (and nothing else — this slice is valid under either thesis, which is why it can start during S0)
- **Exit criteria:** an authenticated coordinator can `GET` their org's case list, one case, and its full history; a second org's data is provably unreachable; reads are policed
- **Risks:** getting the read policy wrong is a security defect, not a UX one — this is why D7 is a decision, not plumbing

### S2 — "I can create and own a case" (requires D1 = coordinator)
- **User value:** the first governed write path a user can reach end-to-end
- **Requirements:** FR-01, FR-02, FR-03, FR-04, FR-08, FR-09, FR-10, FR-11, FR-12, FR-13, FR-14, FR-40, FR-41, NFR-03, NFR-05
- **Backend:** the `PatientToken` creation command (new — F1) with minimum-necessary input and a role policy; 8 case-command routes; server-generated case id (D6)
- **Data:** no migration expected — the schema already supports everything; **confirm before assuming**
- **Permission:** reuse the existing tested case policies unchanged; add a token-creation policy
- **Test:** one integration test per route (happy + permission + tenancy + conflict); a data-boundary test proving DOB/sex/external-ref are rejected; idempotent-replay test per mutating route
- **Docs:** ADR for the token command and the data boundary; test manifest with honest gaps
- **Dependencies:** S1, D1, D6, D8
- **Exit criteria:** the full happy path in §5.13 passes over HTTP, with no UI
- **Risks:** the token command is the one place this slice widens the PHI surface — D8 must be closed first, in writing

### S3 — "I can do my job in a browser"
- **User value:** the MCPO becomes reachable — this is the slice that produces the activation event
- **Requirements:** FR-20…FR-23, FR-31, FR-32, FR-33, NFR-09, NFR-10, all UX requirements
- **Frontend:** a router; sign-in; case list; case detail with the audit timeline above the fold; the five decision actions; three distinct empty/error/permission states; honest identity banner; demo role selector removed or fenced
- **Backend:** none new
- **Test:** component tests for the three non-happy states; one end-to-end test of the full happy path against a live API and DB; a keyboard-only manual pass
- **Docs:** pilot user guide (one page)
- **Dependencies:** S2; decision on harvest-vs-rebuild of the prototype UI
- **Exit criteria:** a named user completes the §5.13 primary success case in a browser, reloads, finds the case, and reads its history — with no terminal, script, or database client involved
- **Risks:** the harvest-vs-rebuild trap. Mitigation: harvest layout and copy, take types from the API, never import `app/src/domain` (NFR-10)

### S4 — "It behaves when things go wrong"
- **User value:** trust; the coordinator can rely on it during an actual shift
- **Requirements:** the exception table in §5.5; FR-30/31/32/33; NFR-05, NFR-07
- **Work:** conflict UX with current-value display and retry; session-expiry with input preservation; idempotency keys generated per user intent in the UI; unreachable-API state; illegal-transition messages that name the blocking rule
- **Test:** forced-conflict end-to-end; mid-form expiry; double-submit; API-down
- **Exit criteria:** every exception path in §5.5 has a passing test and a designed screen state
- **Risks:** easy to under-scope; these paths are where a pilot user loses confidence permanently

### S5 — Pilot hardening
- **User value:** the workflow can be relied on for a week
- **Requirements:** NFR-06, NFR-07, NFR-08, FR-50, D10, D11, D12
- **Work:** restore rehearsal (`npm run migration:recovery:local`); error monitoring; a measured latency pass; provisioning runbook; pilot support and stop conditions; data-classification check at the API entry path
- **Exit criteria:** restore rehearsed once; monitoring live; runbook executed by someone other than its author; stop conditions written
- **Risks:** scope creep toward production hosting — D11 explicitly defers that

### S6 / S7 — Documents, then evidence (**post-validation only**)
Do not start either until S3's activation event has occurred and the pilot has produced a signal. Both are fully tested backends `[V]` awaiting a transport and a surface; S6 additionally needs a binary/multipart decision, which is why it is not in the MCPO.

## Required build sequence

| # | Stage | Slice | Note |
|---|---|---|---|
| 1 | Foundation and decision closure | **S0** | Time-boxed to one week |
| 2 | Core data and domain readiness | **S1** + FR-01 design (D8) | S1 may run in parallel with S0 — it is thesis-invariant |
| 3 | First complete vertical workflow | **S2 → S3** | S3 is where the activation event happens |
| 4 | Critical exceptions and recovery | **S4** | |
| 5 | Permissions and governance | **folded into S1/S2** | Deliberate deviation from the template: read authorization (D7) is a *prerequisite* to exposing reads, not a later hardening stage. Shipping unpoliced reads and policing them afterward would be a security defect |
| 6 | Integration or data exchange | **skipped in v1** | Zero live integrations is the recommendation, not an omission |
| 7 | Measurement and observability | **NFR-07 in S1; D13 activation event in S3** | Pulled earlier than the template: without the activation event, the pilot cannot be evaluated |
| 8 | Pilot hardening | **S5** | |
| 9 | Release readiness | **pilot gate**, not production release | Production readiness remains gated on OD-2, OD-3, security review, and BAA-capable hosting `[V]` |

---

# Artifact 8 — Repository Change Map

Only paths confirmed to exist are named. Where a file does not exist yet, the **responsibility** is stated instead of a fabricated path.

## Reuse unchanged
| Path | Purpose | Why unchanged |
|---|---|---|
| `packages/case-service/src/caseCommandService.ts` | 9 case commands | Working and tested; adding HTTP must not touch it |
| `packages/case-service/src/permissions.ts` | Case role policy | Already exact-enum and tested |
| `packages/auth-service/src/authenticationService.ts` | Sessions, `actorFor` | Sufficient for a synthetic pilot |
| `packages/auth-service/src/identityProviders.ts` | Dev IdP | Dev-only by design |
| `packages/case-repository/src/caseCommandGateway.ts` | Atomic command transactions | The core asset |
| `packages/case-repository/src/auditWriter.ts` | Append-only audit + guard | Do not modify |
| `tests/security/*` | Isolation + identifier guard | Must pass unchanged as the definition of no-regression |
| `.github/workflows/ci.yml` | Ephemeral-DB verification | Already correct; it is the trustworthy signal |

## Modify
| Path | Current purpose | Proposed change | Reason | Requirement | Risk | Test impact |
|---|---|---|---|---|---|---|
| `packages/api-service/src/server.ts` | 10 routes, node:http | Add 3 GET read routes + 8 case-command routes + 1 token route, following the existing prescreen pattern; extend the error map | F2, FR-02…FR-14, FR-30 | Grows a 375-line hand-rolled router to ~22 routes (D9) | +~20 integration tests |
| `packages/api-service/src/devMain.ts` | Seeds a synthetic org, 3 users, 1 case, 1 patient token via raw Prisma | Wire the new read service and token command; make the pilot org/users explicit | S2/S3 need them; basis for FR-50 | Dev-only, low | Smoke via `api:dev` |
| `packages/case-repository/src/prismaCaseRepository.ts` | Includes `listForOrganization`, `findByKey` | Likely no change; add an audit-history read if one does not already exist at this layer | FR-07 | Low | +tenancy negatives |
| `packages/case-service/src/commands.ts` | Command envelopes | Add the `PatientToken` creation envelope (or place it in a new module — see below) | FR-01 | Medium — this is the PHI boundary | +boundary-refusal tests |
| `tsconfig.json` | Root TS config, `paths` without `baseUrl`, missing `@clarity/prescreen-service` | Add `baseUrl: "."`; add the missing path | NFR-11 — typecheck is currently non-hermetic in a worktree `[V]` | Low; may surface latent type errors, which is the point | Typecheck becomes meaningful |
| `ARCHITECTURE.md` | Top-level architecture entry point | Correct "25 models" → 38; remove "No backend, API, auth, or tenancy enforcement exists yet" | Both false `[V]` | None | None |
| `IMPLEMENTATION_STATUS.md` | Status of record | Refresh to 2026-07-29; record F1 and F2; record the PR dispositions | Stale by 10 days with 3 open PRs | None | None |
| `docs/09-personas-and-role-ux.md` | Canonical personas | Reconcile the primary user with D1, or mark superseded | Brief §18-A | None | `app/src/domain/roles.test.ts` may need updating if roles change |
| `docs/decisions/OPEN_DECISIONS.md` | OD register | Close OD-4 (D5); record D6–D13 | Traceability | None | None |
| `app/src/App.tsx` | 733-line prototype shell, workspace in React state | Under S3: introduce routing, or build the pilot UI as a separate surface and leave the prototype intact as a demo artifact | UX requirements; NFR-10 | **Highest-judgment change in the plan** — this is blind spot #3 | Existing app suite (64 claimed, unverified here) |
| `app/src/domain/api.ts` | API client with good error mapping | Extend for the new routes; keep the error copy | FR-33 | Low | +client tests |

## Add (new responsibilities — paths proposed, not existing)
| Responsibility | Proposed location `[P]` | Requirement |
|---|---|---|
| Tenant-scoped **read service** with an explicit `CASE_READ_POLICY` and a read-audit decision | a read module in `packages/case-service/` (co-located with the write policy it mirrors) | FR-05/06/07, D7 |
| **`PatientToken` creation command** — minimum-necessary input, `SYNTHETIC_ONLY` required, DOB/sex/external-ref structurally rejected | `packages/case-service/` alongside the case commands, with its gateway method in `packages/case-repository/` | FR-01, D8 |
| **Pilot UI surface**: router, sign-in, case list, case detail, audit timeline | a routed surface in `app/` (or a new app workspace — S3 decision) | UX requirements |
| **Request logging middleware** — correlation id, principal, org, route, outcome; never bodies | `packages/api-service/` | NFR-07 |
| **ADR: read authorization and read auditing** | `docs/architecture/ADR-00NN-…` (next free number **after** the duplicate-0014 renumbering) | D7 |
| **ADR: patient-token creation and the v1 data boundary** | `docs/architecture/` | D8 |
| **Test manifest for the case-spine API slice**, with honest gaps | `docs/testing/` (matching the existing manifest convention `[V]`) | S2/S3 |
| **Pilot runbook**: provision org + users, start API, start UI, stop conditions | `docs/developer-handoff/` | FR-50, D12 |
| **Integration tests**: read routes, case-command routes, token boundary, conflict, idempotency | `tests/integration/` | §5.13 |
| **End-to-end test**: full happy path against live API + DB | `app/smoke/` (Playwright already configured `[V]`) | S3 exit criteria |

## Schema changes
**Expected: none.** The schema already carries every field this slice needs — `version`, the 8 workstream columns, `assignedUserId`, `AuditEvent`, `CommandIdempotencyRecord`, `PatientToken` `[V]`. **Verify before assuming**, and if a migration proves necessary, it must be the smallest possible and justified in an ADR per the project's own rule `[V: CLAUDE.md]`. Explicitly **not** in this slice: a per-tenant `caseKey` column (D6 option c), deferred.

## Remove
| Path | Reason |
|---|---|
| `clarity-platform-visualizer/` | Empty directory `[V]` |
| `chatgpt-full-stack-analytics-handoff/source-material/repo/` | Duplicated repo docs; stale-fork hazard `[V]` |
| One of `agent_bridge/` or `agents/bridge/` | Duplicate dev-tooling concern `[V]` |
| `reference/source-documents/clarity-mh-sources/Reporting Metrics Ops and Budget .xlsx` | Pending D3; removal from history is likely required, not just deletion from HEAD |
| The HIPAA sentence in `docs/product/CLARITY_GRANT_CONCEPT_NOTE.md` (branch `codex/om/sync-main`) | D4 |

## Configuration / infrastructure
| Change | Reason |
|---|---|
| Per-session ephemeral database instead of shared local `clarity_dev` | Issue #31; empirically corrupts verification `[V]` |
| Node version pin + formatter (OD-9 remainder) | Reproducible sessions |
| Error monitoring in the pilot environment | NFR-07, S5 |
| Data-classification check at the API entry path | D10; already named as a Phase-4 action `[D]` |

---

# Artifact 9 — Testing and Validation Plan

## A. Product validation (does this matter to a user?)

**Participants `[P]`:** 3–5 central-intake coordinators or equivalents; at minimum, the one named pilot coordinator. Note the constraint honestly: the owner is a domain expert, but **owner review is not user validation** — that is precisely blind spot #2.

**Environment:** local or single-host, synthetic data only, coordinator's own device.

| Question to answer | Method | Tasks | Evidence collected | Success threshold `[P]` | Failure signal |
|---|---|---|---|---|---|
| Is the problem real and ranked? | 30-min interview **before** S3 ships | Describe the last three referrals; where did facts get lost? | Verbatim notes; count of re-collection events | ≥2 of 3 referrals involved re-collecting facts already captured | Participants name bed scarcity or payer delay as the dominant constraint instead — which would falsify assumption A1 and change the product |
| Is the workflow comprehensible without training? | Unmoderated first-run | "A referral just came in. Get it into the system and assign it to yourself." | Time to complete; wrong turns; questions asked | Completes unaided in <5 min | Cannot find "new case", or cannot tell what happens on submit |
| Will they use it? | One-week diary | Use it for every referral | Days used; cases created; spreadsheet still open? | Used on ≥4 of 5 days | Cases created in Clarity **and** the spreadsheet stays open — the spine does not yet carry what they need |
| Does the audit trail create real confidence? | Task | "A colleague asks why this case went the way it did. Answer from the screen." | Answered from screen? Time taken? | Answered without asking anyone, <30 s | They reach for email or memory instead |
| Does it reduce dependency? | Interview | "What did you stop having to ask someone for?" | Named dependencies removed | ≥1 named | None named |
| Would they miss it? | Interview | "If we turned this off tomorrow?" | Verbatim | Unprompted objection | Indifference |

**Follow-ups to ask regardless:** What did you expect that was not here? What did you have to keep outside the system? What would you not trust it with? Who else needed to see this and could not?

## B. Software verification

| Category | Tied to | Content |
|---|---|---|
| **Unit / domain** | FR-01, business rules | Token-input boundary refusals; state-machine legality; independent workstream transitions; the financial-never-blocks-clinical invariant (already `[V]`) |
| **Integration** | FR-02…FR-14, FR-05/06/07 | One happy + one cross-tenant negative + one permission-denied per route, against real PostgreSQL — matching the existing convention `[V]` |
| **Permission** | §5.8 | Every role × every route; explicit assertions that `SYSTEM_ADMIN` has nothing and only `ORGANIZATION_ADMIN` can reopen (already `[V]` at the service layer — must hold at the HTTP layer) |
| **Concurrency** | FR-04, FR-09, NFR-05 | Two-session version conflict: exactly one success, exactly one audit event, no partial state. Extend the existing deterministic-interleave pattern `[V]` |
| **Idempotency** | FR-04 | Same key + same intent replays; same key + different nested body → 409 (the ADR-0014 §5 guarantee, applied to case routes) |
| **Data boundary** | FR-01, NFR-03 | DOB/sex/external-ref rejected as unknown fields; `SYNTHETIC_ONLY` required |
| **Audit** | FR-40, FR-41 | One event per mutation; the existing restricted-identifier guard passes unchanged over the new routes |
| **End-to-end** | S3 exit | Playwright (already configured `[V]`): sign in → create → assign → urgency → rationale → close → reload → find → read history |
| **Failure recovery** | S4 | Forced conflict; mid-form session expiry; double-submit; API down |
| **Migration** | NFR-06 | `migration-integrity` green on an ephemeral DB; `migration:recovery:local` replay + restore rehearsed |
| **Accessibility** | NFR-09 | Keyboard-only pass of the happy path; labelled controls; status not conveyed by colour alone |
| **Performance** | NFR-08 | One measured pass at ≤500 cases, single user |
| **Security** | NFR-01/02/03 | Existing isolation + identifier suites unchanged; a negative test per new route; **no security review is claimed** — that remains an external gate `[V]` |
| **Manual acceptance** | §5.13 | The owner walks the primary success case plus every exception path before the pilot |

**Regression gate:** the existing 342-passing suite plus `migration-integrity` must be green on an ephemeral database, with a hermetic typecheck, before S3 is offered to any user.

---

# Artifact 10 — Pilot Plan

**Recommended only after S3's exit criteria are met and S4 is complete. `[P]`**

| Dimension | Plan |
|---|---|
| **Pilot user** | One named central-intake coordinator at one organization, plus one organization administrator (may be the owner) |
| **Environment** | Local or single-tenant private host. **Synthetic data only** — this keeps the HIPAA cliff out of scope exactly as the existing MVP definition requires `[D: MVP_ROADMAP:28]` |
| **Participants** | 1 primary coordinator; 1 admin; 2–4 additional interviewees who do **not** use the software (comparison and problem-ranking) |
| **Included workflow** | The MCPO only: sign in → create token → create case → assign → urgency → transition → rationale → close → find → read history → (admin) reopen |
| **Excluded** | Documents, evidence, benefits, authorization, legal instruments, packet, routing, bedboard, prescreen, episode/UR, cross-org, notifications, real data |
| **Duration** | One working week of active use, plus a pre-interview and a debrief |
| **Onboarding** | One page and one 15-minute walkthrough. If more is needed, that is a finding, not a gap to paper over |
| **Support model** | Direct line to the owner; every question logged as a product signal, not just answered |
| **Data access** | Coordinator sees only their organization; verified by test, not by assertion (NFR-01) |
| **Feedback method** | Daily one-line diary; end-of-week structured debrief; the existing POC feature map (must-have / helpful / confusing / missing / later) `[V: docs/roadmap/POC_STAKEHOLDER_FEEDBACK_ROADMAP.md]` |
| **Operational monitoring** | Error monitoring live; audit trail reviewed daily for gaps; conflict-loss incidents counted |
| **Success criteria `[P]`** | Activation achieved (≥1 case end-to-end via UI); used ≥4 of 5 days; audit question answered from the screen in <30 s; zero tenancy violations; zero user-visible data loss |
| **Stop conditions** | Any tenancy violation · any real patient data entered · any unrecoverable data loss · the coordinator abandons it for the spreadsheet within 2 days |
| **Expansion conditions** | Activation achieved **and** the coordinator asks for a specific next capability. Their ask, not the roadmap, chooses S6 vs S7 vs something unanticipated. **Do not** expand to a second organization until cross-tenant isolation has been verified under real concurrent use |

**Do not** run a multi-site or multi-role rollout before the single-user workflow is validated. The repository's top-ranked risk is zero user validation; a broad rollout multiplies that risk instead of retiring it.

---

# Artifact 11 — Prioritized Delivery Backlog

Effort is relative only (XS/S/M/L/XL/Unknown). No hour estimates — the project's own convention is working sessions, not calendar time `[V]`.

## Milestone M0 — Decision closure and repair (Slice S0)

| ID | Outcome | Req | Pri | Dep | Evidence | Acceptance | Risk addressed | Effort | Seq |
|---|---|---|---|---|---|---|---|---|---|
| B-01 | Primary user named in writing; personas doc and README reconciled | D1 | P0 | — | `[V]` brief §18-A | One named user; contradicting docs updated or marked superseded | Wrong-user build | S | 1 |
| B-02 | Thesis B ruled: park / contracts-only / adopt | D2 | P0 | — | `[V]` PR #30 = 2,484 files | Each of PRs #29/#30 explicitly merged, parked, or closed | Scope sprawl, capacity split | S | 2 |
| B-03 | Workbook data status resolved | D3 | P0 | — | `[V]` 25/44 PHI-risk flags | Qualified review recorded; file removed from history or retained with written rationale | PHI exposure | M | 3 |
| B-04 | HIPAA claim struck | D4 | P0 | — | `[V]` | Phrase gone; replaced with the standard honest formulation | Misrepresentation | XS | 4 |
| B-05 | Typecheck made hermetic | NFR-11 | P0 | — | `[V]` this session | `baseUrl` + missing path added; typecheck resolves only worktree files | Unreliable verification | XS | 5 |
| B-06 | Per-session ephemeral database | NFR-11 | P0 | — | `[V]` issue #31 | `migration-integrity` passes; no shared-DB drift | Unreliable verification | S | 6 |
| B-07 | ADR numbering deduplicated | — | P1 | B-02 | `[V]` two ADR-0014s | Every ADR number unique across all live branches | Traceability loss | XS | 7 |
| B-08 | Status of record refreshed; F1 and F2 recorded | — | P1 | B-01…B-03 | `[V]` 10 days stale | `IMPLEMENTATION_STATUS.md` current; F1/F2 present | False confidence | S | 8 |
| B-09 | `ARCHITECTURE.md` corrected | — | P1 | — | `[V]` "25 models", "no backend" | 38 models; the four existing capabilities stated | Misleads new readers | XS | 9 |
| B-10 | Dead artifacts removed | — | P2 | — | `[V]` | Empty visualizer dir gone; bridge dirs consolidated; duplicated docs replaced by references | Confusion | S | 10 |
| B-11 | Product name and positioning settled | D5 | P1 | B-01 | `[V]` OD-4 | One name; "AI"/"intelligence" removed from positioning | Expectation mismatch | XS | 11 |

## Milestone M1 — Read the spine (Slice S1)

| ID | Outcome | Req | Pri | Dep | Evidence | Acceptance | Risk addressed | Effort | Seq |
|---|---|---|---|---|---|---|---|---|---|
| B-20 | Read authorization decided and recorded as an ADR | D7 | P0 | — | `[V]` F2: reads bypass the service layer | ADR states which roles read what and whether reads are audited | Unpoliced reads | S | 12 |
| B-21 | A coordinator can retrieve their organization's case list over authenticated HTTP | FR-05 | P0 | B-20 | `[V]` `listForOrganization` exists | Same-org only; cross-tenant provably absent | No read path (F2) | S | 13 |
| B-22 | A coordinator can retrieve one case's detail | FR-06 | P0 | B-20 | `[V]` `findByKey` exists | Other-org and absent are indistinguishable 404s | No read path | S | 14 |
| B-23 | A coordinator can retrieve a case's full audit history | FR-07 | P0 | B-20 | `[V]` audit + guard tested | Ordered history; security suite unchanged | The core value claim is invisible | M | 15 |
| B-24 | Every request is traceable in logs without leaking bodies | NFR-07 | P1 | B-21 | `[P]` gap today | Correlation id, principal, org, route, outcome; no bodies | Unsupportable pilot | S | 16 |

## Milestone M2 — Create and own a case (Slice S2)

| ID | Outcome | Req | Pri | Dep | Evidence | Acceptance | Risk addressed | Effort | Seq |
|---|---|---|---|---|---|---|---|---|---|
| B-30 | Patient-token data boundary decided | D8 | P0 | B-01 | `[V]` F1 + ADR-0009 precedent | ADR names accepted fields and the structural refusals | PHI surface creep | S | 17 |
| B-31 | **A coordinator can create a patient token through a governed command** | FR-01 | P0 | B-30 | `[V]` **F1 — no path exists today** | Role-policed; audited; DOB/sex/external-ref rejected; `SYNTHETIC_ONLY` required | **The spine has no entry point** | M | 18 |
| B-32 | A coordinator can create a case with a server-generated id | FR-02, FR-03, D6 | P0 | B-31 | `[V]` command tested | Created `DRAFT`; atomic audit; cross-tenant token indistinguishable from absent | No creation path | S | 19 |
| B-33 | A coordinator can assign, prioritize, relocate, and transition a case over HTTP | FR-08…FR-11 | P0 | B-32 | `[V]` all four commands tested, incl. ADR-0005 | Per-route happy + permission + tenancy + conflict tests | 8 of 9 commands unreachable | M | 20 |
| B-34 | A coordinator can record a decision rationale and close a case; an admin can reopen it | FR-12…FR-14 | P0 | B-32 | `[V]` tested, incl. exact reopen authority | Terminal protection holds; `SYSTEM_ADMIN` reopen → 403 | No terminal outcome exists | S | 21 |
| B-35 | Retries never duplicate | FR-04 | P0 | B-32 | `[V]` ADR-0014 §5 | Same key + intent replays; nested-body change → 409 | Duplicate cases from a double-click | S | 22 |
| B-36 | Every domain error maps to a stable, content-free HTTP code | FR-30 | P0 | B-33 | `[V]` prescreen precedent | No body reveals existence, ownership, or what would have been allowed | Information leak | S | 23 |

## Milestone M3 — Reachable in a browser (Slice S3)

| ID | Outcome | Req | Pri | Dep | Evidence | Acceptance | Risk addressed | Effort | Seq |
|---|---|---|---|---|---|---|---|---|---|
| B-40 | Harvest-vs-rebuild decision for the prototype UI | — | P0 | B-01 | `[V]` blind spot #3 | Written decision; if harvesting, types come from the API and `app/src/domain` is not imported | Building the product twice | S | 24 |
| B-41 | Case list and case detail are addressable by URL | UX | P0 | B-40 | `[V]` no router today | A colleague can be sent a link that opens that case | Fatal for a coordination product | M | 25 |
| B-42 | The identity surface is honest; the demo role selector is removed or fenced | FR-23 | P0 | B-41 | `[V]` "not authentication" caption | No client control changes the acting role; displayed role = session role | Demo misleads a decision-maker | S | 26 |
| B-43 | The audit timeline is above the fold on case detail | FR-07, UX | P0 | B-41 | `[P]` | A user reads back the full history without scrolling past the primary content | Core claim buried | S | 27 |
| B-44 | The five decision actions are performable from the UI | FR-08…FR-14 | P0 | B-41 | `[V]` backend done | The §5.13 primary success case passes end-to-end in a browser | MCPO unreachable | L | 28 |
| B-45 | No-data, failed-to-load, and not-permitted are three distinct states | FR-32 | P1 | B-41 | `[V]` `EmptyState` to harvest | Three visually and textually distinct states | Users misread empty as broken | S | 29 |
| B-46 | The happy path is keyboard-operable | NFR-09 | P1 | B-44 | `[P]` untested today | Manual keyboard-only pass completes | Accessibility debt | S | 30 |
| B-47 | Activation is a counted event | D13 | P1 | B-44 | `[V]` `exportAnalyticsEvents()` exists with no callers | "User completed a case end-to-end via UI" is recorded | Pilot cannot be evaluated | S | 31 |
| B-48 | One-page pilot user guide | FR-50 | P1 | B-44 | `[P]` | A new user completes the workflow from it alone | Onboarding friction misread as product failure | XS | 32 |

## Milestone M4 — Behaves under failure (Slice S4)

| ID | Outcome | Req | Pri | Dep | Acceptance | Effort | Seq |
|---|---|---|---|---|---|---|---|
| B-50 | A concurrent edit never silently overwrites | FR-31, NFR-05 | P0 | B-44 | Conflict shows the current value and offers retry; forced-conflict test passes | M | 33 |
| B-51 | Session expiry mid-form does not lose input | FR-31 | P0 | B-44 | Re-auth returns the user with input intact | S | 34 |
| B-52 | An illegal transition names the rule that blocked it | FR-10, UX | P1 | B-44 | Message identifies the blocking rule, not just refusal | S | 35 |
| B-53 | An unreachable API is an actionable state | FR-33 | P1 | B-44 | Existing message pattern reused | XS | 36 |

## Milestone M5 — Pilot hardening (Slice S5)

| ID | Outcome | Req | Pri | Dep | Acceptance | Effort | Seq |
|---|---|---|---|---|---|---|---|
| B-60 | Restore from backup rehearsed once | NFR-06 | P0 | M4 | `migration:recovery:local` replay + restore green; result recorded | S | 37 |
| B-61 | Error monitoring live in the pilot environment | NFR-07 | P0 | M4 | Induced error appears in monitoring | S | 38 |
| B-62 | Provisioning runbook executed by someone other than its author | FR-50 | P1 | M4 | Org + coordinator + admin created from the runbook alone | S | 39 |
| B-63 | Latency measured at pilot scale | NFR-08 | P2 | M4 | List and detail <500 ms at ≤500 cases | XS | 40 |
| B-64 | Pilot support model and stop conditions written | D12 | P0 | M4 | Stop conditions explicit and agreed before day 1 | XS | 41 |
| B-65 | Data-classification check at the API entry path | D10 | P1 | M4 | A request carrying obvious real-data patterns is refused and logged | M | 42 |

---

# Artifact 12 — Milestones and Readiness Gates

No calendar dates — none were provided, and the project's convention is working sessions `[V]`.

### G0 — Product direction confirmed
- **Objective:** one primary user, one thesis, two compliance issues closed
- **Outputs:** D1–D4 in writing; PR dispositions; refreshed status; ADR numbering unique
- **Entry:** this plan reviewed
- **Exit:** a named primary user; PRs #29/#30/#32 each merged/parked/closed; HIPAA claim struck; workbook disposition recorded; hermetic typecheck; `migration-integrity` green on an ephemeral DB
- **Owner:** product owner (D1, D2, D3, D4, D5); tech lead (repair items)
- **Risks:** stalls on availability — S1 proceeds regardless
- **Unlocks:** writable requirements; user research becomes safe

### G1 — Core workflow specified and readable
- **Objective:** the spine is readable over authenticated HTTP under an explicit policy
- **Outputs:** read-authorization ADR; 3 GET routes; request logging
- **Entry:** D7 closed
- **Exit:** a coordinator retrieves list, detail, and history for their org only; per-route tenancy negatives pass; security suite unchanged
- **Owner:** tech lead
- **Unlocks:** any UI at all

### G2 — Domain model entry point exists
- **Objective:** the F1 gap is closed under a decided data boundary
- **Outputs:** patient-token ADR + command; 8 case-command routes; stable error map
- **Entry:** D1, D6, D8 closed; G1 met
- **Exit:** the §5.13 primary success case passes over HTTP with no UI; DOB/sex/external-ref refusals tested
- **Owner:** tech lead
- **Risks:** this is where the PHI surface could widen — the ADR gates it
- **Unlocks:** the UI slice

### G3 — First vertical slice functional (**the activation gate**)
- **Objective:** a real person completes a real (synthetic) case in a browser
- **Outputs:** routed UI; honest identity surface; audit timeline; three distinct empty/error states; activation event; one-page guide
- **Entry:** G2 met; harvest-vs-rebuild decided
- **Exit:** a named user signs in, creates, assigns, prioritizes, records a rationale, closes, reloads, finds the case, and reads its history — no terminal, script, or DB client involved. Full suite green in CI.
- **Owner:** tech lead + product owner
- **Unlocks:** **user validation becomes possible for the first time in the project's history**

### G4 — Critical exceptions handled
- **Exit:** every exception path in §5.5 has a passing test and a designed state; no user-visible data loss under forced conflict
- **Unlocks:** exposure to a real user for a full week

### G5 — Pilot-ready
- **Exit:** restore rehearsed; monitoring live; runbook executed by a second person; stop conditions written; synthetic-only enforced at the entry path
- **Unlocks:** the pilot

### G6 — Pilot completed
- **Outputs:** diary, debrief, feature-map results, defect list, one ranked user ask
- **Exit:** ≥4 of 5 days used; audit question answered from the screen; zero tenancy violations; zero unrecoverable loss
- **Unlocks:** the next slice is chosen **by the user's ask**, not by this plan

### G7 — Product hypothesis validated
- **Exit:** the coordinator prefers Clarity to their spreadsheet for the spine, unprompted, and names at least one dependency removed
- **Unlocks:** S6/S7, a second user, a second organization
- **If it fails:** the correct response is to revisit assumption A1 (coordination friction vs. bed scarcity) — not to add features

### G8 — Production-ready
**Explicitly out of reach and gated on external parties, not code `[V]`:** counsel review (OD-2), clinical licensing (OD-3), independent security review and pen test, BAA-capable hosting, DB-level append-only enforcement, encryption capability, malware scanning. **Do not** describe any earlier gate as production readiness.

---

# Artifact 13 — Risk-First Learning Plan

Ranked by expected damage. The principle: retire the cheapest-to-test, highest-damage unknowns before expensive implementation.

| # | Unknown / risk | Type | Evidence | Consequence if wrong | Cheapest valid test | Decision enabled | When |
|---|---|---|---|---|---|---|---|
| 1 | Coordination friction is the dominant constraint (A1) | Desirability | `[U]` — no measurement anywhere (OD-12); `[I]` workbook corroboration only | The entire product optimizes the wrong bottleneck; the ROI story collapses | **3 × 30-min interviews.** No code. Ask about the last three referrals and where facts got lost | Whether to continue at all, or reposition | **Before S3 ships — this is the single highest-value action in the plan** |
| 2 | The primary user is the coordinator, not the field responder (D1) | Desirability | `[D, contested]` three ways | Wrong first UI; wasted slice; cross-org work either wrongly deferred or wrongly prioritized | Owner decision **plus** one interview on each side of the handoff | D1; the MCPO | Before S2 |
| 3 | Thesis A vs Thesis B (D2) | Viability | `[V]` 2,484-file open PR | Capacity split; compliance perimeter doubled; neither product finished | Owner decision. If genuinely undecidable, ask one question: *who has signed anything?* | D2; PR dispositions | Immediately |
| 4 | The workbook contains real patient data (D3) | Compliance | `[V]` 25/44 self-flagged sheets, tracked and pushed | Real-data exposure in a repo with history on a remote | Qualified review of the file. Do not open it casually | D3; whether history must be rewritten | Immediately, before any external step |
| 5 | Coordinators will adopt a spine that carries no documents | Usability | `[U]` | S3 ships and is abandoned in two days | **The pilot itself** — that is precisely what the MCPO is designed to test | Whether S6 (documents) is the next slice | G6 |
| 6 | The prototype can be wired rather than rebuilt (A7) | Feasibility | `[V]` zero shared contracts, no router | UI phase doubles; the product is built twice | **A one-workspace spike:** back Case Queue with real API data and time it | D-B40 harvest-vs-rebuild | Before S3 |
| 7 | Read authorization design (D7) | Security | `[V]` F2 — reads bypass the service layer | Cross-tenant or over-broad read exposure — a security defect, not a UX one | Write the ADR, then one negative test per route per role | D7 | Before S1 ships |
| 8 | The patient-token command widens the PHI surface (D8) | Compliance / data | `[V]` F1; `[V]` ADR-0009 precedent exists | Real PHI becomes storable through a governed path | Adopt the benefits precedent (structural refusal) and test the refusals | D8 | Before S2 |
| 9 | The API boundary needs Fastify before ~22 routes (D9, A6) | Feasibility | `[V]` 375-line hand-rolled router, growing | Late rework of the entire API surface | Add the read routes first and observe the actual friction | D9 | During S1 |
| 10 | Domain rules are correct for Louisiana behavioral health (A10) | Feasibility / compliance | `[D]` blind spot #2 — no domain expert has reviewed them | Domain-wrong role policies and state machines pass code review and reach a pilot | **One paid domain review** of role policies, state machines, and the category-approval map | D-none; it is a purchase | Before G5 |
| 11 | Verification claims are reliable (A9 — **already falsified**) | Operations | `[V]` `migration-integrity` fails; issue #31; non-hermetic typecheck | "Verified" in a status report does not mean verified | Two config fixes (B-05, B-06) | — | Immediately; it is nearly free |
| 12 | Statutory/clinical demo logic will be mistaken for validated (R6) | Compliance | `[V]` e-PEC detailed against real OBH forms; OD-2 unstarted | A stakeholder acts on unvalidated statutory logic | Keep e-PEC out of the pilot; watermark any demo of it | — | Immediately, as a policy |
| 13 | Pilot-scale performance | Feasibility | `[U]` no perf dimension exists (blind spot #6) | Unusable list view at real queue size | One measured pass at 500 cases | — | S5 |

**Sequencing principle:** items 1–4 cost almost no engineering and can invalidate months of work. Items 7, 8, and 11 are cheap and prevent defects that would be expensive to discover in a pilot. Item 10 is a purchase, not a build, and should be made before a user is exposed. Everything else is downstream of a reachable workflow.

---

# Artifact 14 — What Not to Build Yet

| Item | Why not now | What would justify reconsidering |
|---|---|---|
| **Any AI, extraction, OCR, or agent capability** | No AI exists today `[V]`; the evidence layer is the funnel automation would feed, and it is unreachable. The roadmap itself forbids AI promises in pilot conversations `[D]` | A validated workflow generates enough reviewed evidence that a specific extraction task, with a defined evaluation method and human-review rule, is worth automating |
| **Prescreen Phase 3 persistence (PR #32)** | Deepens a workflow whose primary actor (external/field) is deferred under D1(a) `[V: ADR-0014]` | D1 resolves toward field-originated prescreens, **and** the cross-organization model is designed |
| **Network enrichment / directory / grant tooling (PRs #29/#30)** | D2 unresolved; 2,484 files; doubles the compliance perimeter | D2 resolves toward Thesis B with a named committed partner |
| **Cross-organization submission/receipt** | Structurally inexpressible by deliberate design `[V]`; inventing tenancy semantics for external orgs would prejudge the open decision packet | D1(b), or a receiving-facility pilot that demonstrably cannot work same-org-only |
| **Provider-backed Cloud SQL / RLS verification** | Currently the stated next action `[V]`, but it retires a risk no user is exposed to; zero-validation is the higher-ranked risk | A user has completed the workflow (G3) and a hosted environment is actually needed |
| **Documents and evidence UIs** | Both backends fully tested `[V]`, but each adds a surface and documents need a binary-transport decision | G6: the pilot user asks for them |
| **Legal instruments (OPC/PEC/CEC) in any user-facing form** | Blocked by OD-2; detailed enough against real OBH forms to look authoritative `[V]` | Counsel review completes |
| **Medical-necessity criteria** | Blocked by OD-3 (licensing) | Clinical licensing and clinician governance in place |
| **Episode / UR product surface** | A second bounded context with ~9 models and zero surface `[V]`; a different user and lifecycle | Post-admission becomes the deliberate product focus |
| **Bedboard, packet, routing** | Prototype-only; require cross-org and clinical validation `[V]` | The validated spine reaches placement |
| **Notifications, assignment inbox, real-time collaboration** | One pilot user | A second concurrent user |
| **Analytics mart, dashboards, metric registry** | Excellent definitions exist `[V]`, zero instrumentation, and no decision currently consumes them. A dashboard without a decision is decoration | A validated workflow produces a recurring question a dashboard would answer |
| **Multi-tenant onboarding, self-service provisioning, admin UI** | One org; a runbook is cheaper `[V]` | A second organization |
| **Pagination, search, filtering, saved views, bulk actions** | Unknown real queue size | The pilot reveals the actual volume |
| **Fastify port** | D9 recommends after this slice; the prescreen slice proved the mapping is mechanical `[V]` | Route count or complexity creates real friction during S1/S2 |
| **pnpm / Turborepo (OD-7)** | No current pain at 11 packages | Build times or dependency conflicts become measurable |
| **43-model schema graduation (OD-8)** | No slice needs it | A validated workflow needs `WorkflowTask` or `ReferralPacket` as first-class rows |
| **Malware scanning, content sniffing, encryption capability** | Real pre-production requirements (issues #3/#4) `[V]`, but no file upload and no real data in v1 | Documents enter scope, or real data does |
| **DB-level append-only enforcement** | Required before audit claims carry compliance weight `[V]`, not before a synthetic pilot | Real data, or an external compliance claim |
| **Visual polish, theming, design system** | Zero evidence that appearance is the constraint; the prototype is already presentable | Usability testing shows presentation blocking comprehension |
| **Any performance or scaling work beyond one measured pass** | Single user, ≤500 cases | Measured latency exceeds the NFR-08 target |

---

# Artifact 15 — Final Decision Memo

### Recommended next step
**Clarify** — close four decisions in writing (primary user, Thesis A/B, workbook data status, the HIPAA claim), rule on three open PRs, and repair verification hygiene. Time-box it to one working week. Start Slice **S1** (the thesis-invariant read API) in parallel so no capacity idles.

### Why now
Three weeks of genuinely good engineering — 342 of 343 tests passing against real PostgreSQL, eleven packages, thirty-eight models `[V]` — has produced **no reachable product**, and this session found two reasons that gap is structural rather than cosmetic: the case spine has **no governed entry point** (F1: nothing can create a `PatientToken`), and there is **no read API at all** (F2). Meanwhile the repository contains three different answers to "who is the primary user," a 2,484-file open PR arguing for a different product and buyer, a HIPAA claim that violates the project's own rules, and a tracked workbook with 25 of 44 sheets self-flagged as PHI-risk. Writing requirements before those close would produce a confident plan for an unnamed user. Every one of them is decidable in days, and several are one sentence.

### Target outcome
A named central-intake coordinator turns an arriving referral into a case that is **findable tomorrow, owned, prioritized, explainable, and closable** — and reads back its complete history from the screen. First real user outcome in the project's history.

### Minimum build
The governed `PatientToken` creation command (F1); three tenant-scoped read routes behind an explicit read policy (F2, D7); eight case-command routes over the existing tested command service; a routed two-screen UI (case list, case detail with the audit timeline above the fold) with an honest identity surface; and the exception paths — conflict, permission, expiry, unreachable.

### Explicit non-scope
Documents · evidence · benefits · authorization · legal instruments · packet · routing · bedboard · prescreen persistence · episode/UR · cross-organization anything · network enrichment · notifications · dashboards · file upload · AI · real patient data · production hosting.

### First decision required
**D1 — name the primary user.** Recommended: the central-intake coordinator at the receiving facility — the newest owner ruling, the only option with no blocking architectural prerequisite, and the role that exercises the most already-tested code. Everything downstream inherits from this one sentence.

### First validation required
**Assumption A1 — that coordination friction, not bed scarcity, dominates placement delay.** Three thirty-minute interviews, no code. If coordinators name bed scarcity or payer delay as the real constraint, the product needs repositioning, not more features — and that is worth knowing before the UI phase, not after.

### First vertical slice
**S1 — "I can see my organization's cases."** A read policy plus three GET routes over read methods that already exist and are already tenant-scoped `[V]`. It is valid under either product thesis, so it can begin during the Clarify week, and it is the prerequisite for every possible UI.

### Readiness standard
Before moving past Clarify: D1–D4 recorded in writing; each open PR explicitly merged, parked, or closed; hermetic typecheck; the full suite including `migration-integrity` green on an **ephemeral** database.

Before offering anything to a user: the §5.13 primary success case passing end-to-end in a browser; every exception path tested; zero tenancy violations; the existing security suite unchanged; and an honesty statement naming what is **not** claimed — no HIPAA compliance, no production readiness, no measured outcome, no clinical or legal validation, synthetic data only.

---

## Final Quality Check

| Question | Answer |
|---|---|
| Is the primary user specific? | Yes — one named `INTAKE_COORDINATOR` at one organization. **And it is explicitly conditional on D1**, which is unresolved; the alternative is stated rather than hidden |
| Is the intended outcome observable? | Yes — reload, find the case in a tenant-scoped list, read its full history, reach a terminal state, with no terminal or DB client involved |
| Does the scope form a complete workflow? | Yes — trigger → create → own → prioritize → justify → close → prove, with a real terminal state |
| Are requirements testable? | Yes — every FR has acceptance criteria; §5.13 gives Given/When/Then for the happy path and eight exception classes |
| Are recommendations tied to evidence? | Yes — labeled `[V]/[D]/[I]/[P]/[U]` throughout, with file and line citations for verified claims |
| Are assumptions clearly labeled? | Yes — Artifact 13 ranks them, and A9 is marked **already falsified** by this session's test run |
| Are technical tasks connected to user value? | Yes — every slice has a user-observable exit criterion. S0 is the one exception and is labeled as having no direct user value |
| Are critical failure states included? | Yes — conflict, permission, tenancy, expiry, double-submit, illegal transition, API-down, each with a recovery path and a test |
| Are permissions and data ownership addressed? | Yes — §5.8 and §5.9, including the finding that **reads have no policy at all today** (D7) and that DOB/sex/external-ref must be structurally refused (D8) |
| Is the build sequence dependency-aware? | Yes — and it deliberately deviates from the template twice: read authorization moves *before* exposure rather than into a later governance stage, and measurement moves earlier so the pilot is evaluable |
| Does the plan reduce the largest risks early? | Yes — the four cheapest, highest-damage unknowns (interviews, D1, D2, workbook) come before any implementation |
| Is the initial scope narrow enough to complete? | Yes — 2 screens, 12 routes, 1 new command, 0 migrations expected, 0 integrations |
| Is there a clear definition of done? | Yes — G3's exit criteria and the readiness standard above |
| Is it clear what the team should not build? | Yes — Artifact 14, with a named reconsideration trigger for each of 22 items |
