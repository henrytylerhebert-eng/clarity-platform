---
status: proposed working backlog
owner: Tyler Hebert / product owner
last_reconciled: 2026-09-16
source_of_truth:
  - IMPLEMENTATION_STATUS.md
  - docs/roadmap/IMPLEMENTATION_ROADMAP.md
  - docs/product/WORKBOOK_TO_PLATFORM_WORKFLOW_MAP.md
  - docs/decisions/OPEN_DECISIONS.md
  - docs/ux/PRODUCT_TOPOLOGY_DECISION.md
---

# Clarity work to be done


> **PRESERVATION NOTE — added 2026-09-18 (Housekeeping Phase 1).** Authored
> 2026-09-16 in an untracked working tree; committed to Git for the first time on
> 2026-09-18. This remains a **proposed** backlog and is not an implementation
> approval. Item `W0 — Reconcile the working baseline` was *partially* executed by
> the 2026-09-18 read-only forensic reconciliation and this Phase 1 truth repair;
> W0 is **not closed** — branch/PR disposition (Phase 2) and database/migration
> drift (Phase 3) remain. The checkout reference below
> (`claude/clarity-marketing-strategy-a135e7 @ 5f22f6e`) is historical; `main` was
> `5c4c0b9` on 2026-09-18. **Clarity Access feature development is frozen** as of
> 2026-09-18 by owner direction; no Access item in this queue is authorized to start.

This document turns existing roadmap and decision records into an actionable
queue. It is a planning aid, not a new product decision, implementation approval,
release approval, or replacement for the linked canonical records. Priorities
below are a proposed sequencing based on dependencies and documented blockers;
Tyler owns product priority.

## Current boundary

- Clarity is documented as one platform with Crisis Ops, RevOps, and Operating
  Assurance applications. The topology record is still a recommendation awaiting
  owner ruling; the shared shell work described in `IMPLEMENTATION_STATUS.md`
  has been implemented and verified for the scope of PR #84.
- Crisis Ops and demo workflows remain synthetic. There is no production or
  PHI-ready deployment, approved clinical/legal rule pack, or demonstrated
  operational outcome.
- The restored RevOps workbook was accepted on 2026-09-09. Full parity and
  financial-rate work are authorized; they are not complete. Facility-specific
  Louisiana calculations still need the selected hospital provider identifiers
  and applicable inputs (OD-19).
- The repository records Supabase as the selected database provider, but
  provider-backed tenancy tests and independent security review remain open
  (OD-6). Do not treat local Postgres/RLS evidence as provider or production
  acceptance.
- `IMPLEMENTATION_STATUS.md` has a current-state block dated 2026-09-13 and
  older capability buckets. This checkout is branch
  `claude/clarity-marketing-strategy-a135e7` at `5f22f6e`; reconcile current
  branch/remote evidence and post-2026-09-13 changes before using those buckets
  as a complete present-day inventory.

## Proposed queue

### W0 — Reconcile the working baseline

**Priority:** P0 · **Type:** source-of-truth and planning · **Dependency:** none

1. Inspect current branch, remote state, open PRs, and merged history; classify
   every live branch/PR as active, superseded, blocked, or owner decision.
2. Reconcile `IMPLEMENTATION_STATUS.md`, the implementation roadmap, and the
   work-package list against that evidence. Keep dated verification as historical
   unless rerun; do not copy old test counts into current status.
3. Confirm or revise the topology recommendation and select the next product
   outcome to optimize: Crisis Ops stakeholder validation, RevOps parity, or
   another owner-named outcome. Record the choice in its canonical decision
   record.

**Done when:** one current-state summary points to verified capability evidence;
the active queue has an owner, scope, dependencies, and a next bounded package;
stale/ambiguous PRs have explicit dispositions. No source claim is promoted
without current evidence.

### C1 — Crisis Ops synthetic stakeholder walkthroughs

**Priority:** P1 · **Type:** product discovery and validation · **Dependency:** W0

Run the synthetic POC walkthrough already described in
`docs/roadmap/POC_STAKEHOLDER_FEEDBACK_ROADMAP.md`: 2–3 crisis/intake operations
reviewers, a clinician reviewer, a UR/benefits reviewer, and legal/compliance
review if available. Capture user role, task, observed friction, exact feedback,
and unresolved questions. Keep reviewer conclusions separate from product-owner
decisions and from measured outcomes.

**Done when:** a dated evidence record identifies who reviewed which build,
what they could and could not assess, recurring workflow gaps, candidate changes,
and owner decisions. No ROI or clinical/legal correctness claim without the
required evidence and qualified review.

### R1 — RevOps accepted-workbook parity

**Priority:** P1 · **Type:** implementation · **Dependency:** W0; execute in the
accepted sequence in `docs/product/WORKBOOK_TO_PLATFORM_WORKFLOW_MAP.md`

Continue at P1/P2 and P3 source/rate work in parallel where prerequisites allow:

1. **IP activity to close (P1):** source encounters, patient-day projection,
   aggregate-census comparison, correction impact, admissions/ALOS/occupancy.
2. **IOP operating/reconciliation (P2):** connect the authenticated review UI to
   the synthetic API; prove program binding, duplicate handling, calendar rules,
   and closed-review behavior. Keep any real adapter behind its separate
   decision packet.
3. **Financial semantics and allowance (P3):** version official sources and
   methods; model payer/plan/network/contract applicability; test deterministic
   calculations and date boundaries. Leave missing facility factors and private
   terms explicitly missing.
4. **Role staffing and cost (P4):** extend the existing measure loop to
   source-reconciled role hours, subsets, rolling measures, HPPD, and approved
   cost inputs.
5. **Invoice and cash reconciliation (P5):** add source-backed quantities,
   signed posted receipts/allocations, and reversal history; keep modeled,
   billed, and collected amounts distinct.
6. **Forecast and management package (P6):** build scenarios and monthly/YTD
   views only over validated upstream outputs, with drill-down and close
   coverage.
7. **Controlled source pilot (P7):** a separate future gate requiring named
   systems and owners, approved minimal data, security/operational decisions,
   recovery procedures, and user acceptance.

**Done when:** each phase has its mapped acceptance tests from the function map,
focused implementation/test evidence, and updated status documentation. P7 is
not part of the synthetic parity completion gate.

### S1 — Provider-backed tenancy and migration evidence

**Priority:** P1 · **Type:** security/technical validation · **Dependency:**
OD-6 and its decision packet; provider access and named security reviewer

Complete the provider-specific work recorded in OD-6: establish the supported
runtime role/pooling posture, test tenant isolation and denial paths against the
selected Supabase environment, review migration promotion/recovery, and obtain
independent security review. Preserve the distinction between local synthetic
proof, provider-backed test evidence, and production acceptance.

**Done when:** the decision packet is updated with exact environment/configuration
scope, test results, failure behavior, reviewer, and remaining limits. Production
data or deployment remains a separate decision.

### S2 — Crisis Ops domain and evidence gates

**Priority:** P2 · **Type:** domain decisions and evaluation · **Dependencies:**
qualified clinical/legal reviewers; relevant owner decisions

- Resolve clinical criteria source/licensing and review ownership (OD-3); do not
  operationalize medical-necessity criteria before that gate.
- Resolve Louisiana legal wording, forms, and clock triggers with counsel (OD-2);
  keep demo clocks clearly marked until then.
- Decide qualified authority for `MEDICAL_TRANSFER_REQUIRED` (OD-24) before
  production reliance or role-policy changes.
- Decide whether to add the seven planned synthetic cases (OD-10), then extend
  evaluation coverage without treating synthetic results as clinical validation.
- Define baseline operational measurement collection and pilot design (OD-12)
  before making transfer-time, acceptance-rate, packet-quality, or ROI claims.

**Done when:** each decision is recorded by its named authority; any resulting
implementation is separately scoped with acceptance evidence and human review.

### S3 — Platform shell follow-through

**Priority:** P2 · **Type:** UX implementation · **Dependency:** owner confirms
topology recommendation and approves a bounded work package

Use the UX audit as the source for navigation/session work. Review the known
duplicate sign-out controls from Phase 2A, then define a bounded shell follow-up
for navigation destinations and cross-application continuity. Keep each app's
domain workflow separate. Prescreen and Episode/UR frontend placement is an
explicit owner decision, not an assumed fourth/fifth app.

**Done when:** approved shell acceptance criteria are met in desktop/mobile
manual journeys and focused tests; app-domain behavior is unchanged unless
explicitly included.

### G1 — Agent operating model stages

**Priority:** P3 · **Type:** governance · **Dependency:** accepted ADR-0017 plan;
each stage retains its own entry gate

The plan documents Stage 0 preparation, Stage 1 R1 verifier trial, Stage 2 R2
continuity steward, and Stage 3 T1 bounded implementation. Check current status
against the plan before proceeding. DEV-R1's historical evaluation proposal
(OD-20) remains pending; recovery documents grant no role-launch authority.
Do not start a stage or infer approval from this backlog.

**Done when:** a stage's own gate and approval record are satisfied and its
evidence is attached to the canonical operating-model record.

## Open decisions to keep visible

These decisions affect future work and remain with their recorded owners:

- OD-2/3/6/10/12/19/20/21/22/24/26/27 in
  [`OPEN_DECISIONS.md`](../decisions/OPEN_DECISIONS.md).
- Product topology recommendation: owner ruling pending in
  [`PRODUCT_TOPOLOGY_DECISION.md`](../ux/PRODUCT_TOPOLOGY_DECISION.md).
- Workbook phase dependencies and acceptance IDs in
  [`WORKBOOK_TO_PLATFORM_WORKFLOW_MAP.md`](../product/WORKBOOK_TO_PLATFORM_WORKFLOW_MAP.md).

## Package rule

Before implementation, copy `docs/governance/WORK_PACKAGE_TEMPLATE.md` into the
tracking issue or PR and fill in exact scope, prohibited paths, acceptance
evidence, claims excluded, and blockers. Use the repo's governed status labels;
this backlog itself does not move a capability from candidate to planned or
build-ready.

## First next action

Start with W0 and produce a reconciled baseline. Then have Tyler select one
owner-prioritized outcome for the next bounded implementation or discovery
package. The source records support several authorized lanes, but they do not
establish which should consume the next unit of effort.
