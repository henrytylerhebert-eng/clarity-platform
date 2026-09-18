# Architecture Drift Register

> **PRESERVED 2026-09-18 (Housekeeping Phase 2B).** Extracted from the unmerged PR #73
> branch rather than merging that PR wholesale, because its only conflicting file
> (`IMPLEMENTATION_STATUS.md`) was rewritten by PR #101's truth repair. This document is a
> **2026-09-12 snapshot** taken against `main` at `15a094d`; treat its statuses, counts and
> file sizes as historical to that date, not as current capability. Corrections applied on
> extraction are marked inline as **[CORRECTED 2026-09-18]**. See
> [`../recovery/2026-09-18-housekeeping-phase-1-truth-reconciliation.md`](../recovery/2026-09-18-housekeeping-phase-1-truth-reconciliation.md).

> **Status of these findings as re-verified on 2026-09-18:**
> **DRIFT-01** still true — the two orphan ledger entries remain in local `clarity_dev`; issue
> #31 is open. **DRIFT-09** is **SUPERSEDED** by PR #101, which repaired
> `IMPLEMENTATION_STATUS.md` and `CLAUDE.md`. **DRIFT-10** is **closed on main** — the CLPR
> review acceptance was recorded in `docs/planning/clpr/CLPR_IMPLEMENTATION_RETURN.md`
> (`claude_review_verdict: ACCEPT`) via PR #99, which also corrected that record's test-count
> attribution; this register's own proposed edit to
> `docs/implementation/CLPR_SYNTHETIC_VERTICAL_SLICE.md` was deliberately **not** extracted so
> those corrected counts are not re-introduced. **DRIFT-11** is **partially true** — see its
> inline correction. **DRIFT-13** still true and now load-bearing: it is the measured evidence
> that the test suite, not any one session, regrows the issue #24 synthetic residue.

Every item below was found by direct repository inspection this session (code, schema,
migrations, and test runs — not by re-quoting documentation) and is flagged, not silently
resolved. Two items (DRIFT-08, DRIFT-06) required an explicit owner ruling; Tyler ruled
both — see each entry. Nothing else here has been decided on his behalf.

**Priority key:** P0 = architecture-correctness or security-relevant; P1 = blocks or
misleads product-integration decisions; P2 = code-hygiene/consolidation opportunity.

---

### DRIFT-01 — Shared local `clarity_dev` migration ledger was out of sync (P0, fixed this session)
**Evidence:** `npx prisma migrate status` at session start reported: last common migration
`20260719222650_prescreen_persistence_rls`; 10 migrations in this worktree
(`rev_ops_*` ×4, `iop_reconciliation_persistence`, `operating_assurance_*` ×5) not yet
applied to the shared local database; 2 migrations in the database
(`20260720002049_packet11_persistence`, `20260720014914_network_review_append_only_audit`)
not present in this worktree's `prisma/migrations/` at all (they belong to another
worktree/branch).
**Current reality:** the shared-dev-database model (multiple git worktrees pointing at
one Postgres instance) causes exactly the ledger contention already tracked as issue #31.
This instance's manifestation was concrete: `RevOpsWorkspace` and all 5
`OperatingAssurance*` tables did not exist locally, causing `relation does not exist`
failures across 30 test files on first run this session.
**Conflicting representation:** none — this is a known, documented pattern
(`IMPLEMENTATION_STATUS.md` references the "Prisma hotfix flow" and issue #31
repeatedly), just newly concrete for this worktree.
**Risk:** anyone in a fresh worktree gets a wall of false test failures and could
misdiagnose them as real regressions.
**Recommended correction:** applied this session — `npx prisma migrate deploy` (10
migrations, all additive/RLS-policy-recreate, no destructive DROP of live data) +
`npx prisma generate`. Also required a one-time `GRANT USAGE ON SCHEMA public TO
revops_rls_test` on this specific local Postgres instance (the role's schema-usage grant
was missing, causing a same-symptom `relation does not exist` error even after the
migration fix — a local-environment privilege gap, not a code or migration defect).
**Priority:** P0. **Status:** fixed for this worktree's session; the underlying
shared-ledger fragility (issue #31) remains open.

---

### DRIFT-02 — Evidence-lifecycle vocabulary duplicated between evidence-service and assurance-service (P2)
**Evidence:** `packages/domain-contracts/src/evidence.ts:30-37`
(`CANDIDATE/APPROVED/REJECTED/NEEDS_CLARIFICATION/SUPERSEDED`) vs `assurance.ts:46-53`
(`SUBMITTED/ACCEPTED/REJECTED/NEEDS_CLARIFICATION/SUPERSEDED`) — same concept, different
first two labels. Assurance-service's command schemas
(`packages/assurance-service/src/commands.ts`) are plain TypeScript interfaces, not the
Zod envelopes every other command service uses.
**Current reality:** two independently-modeled "evidence needs human review" state
machines for two genuinely different bounded contexts (case evidence vs. regulatory
compliance evidence).
**Recommended correction:** do not force a shared enum — the domains are legitimately
different. Do add Zod validation to assurance-service's commands to close the house-
pattern deviation (missing input validation is a real correctness gap, not just a style
one).
**Priority:** P2 for the vocabulary question; **P1** for the missing Zod validation
specifically (it's an unvalidated command boundary).

---

### DRIFT-03 — Canonical-JSON fingerprint logic reimplemented three times (P2)
**Evidence:** `canonicalStringify` (`domain-contracts/prescreenCommands.ts:298`, properly
shared — used by prescreen-service and case-repository's prescreenGateway),
`canonicalJson` (`case-repository/episodePersistenceGateway.ts:145-152`, an independent
but algorithmically identical recursive key-sort), `stableNetworkJson`/
`sortNetworkJsonValue` (`domain-contracts/networkEnrichmentResolution.ts:259-274`,
duplicated even within `domain-contracts` itself).
**Risk:** these values feed idempotency fingerprints and stored hashes. A silent
algorithmic difference between the three would not currently break anything (each is used
only within its own package), but consolidating them without first proving byte-identical
output on real fixtures could invalidate replay-safety for already-persisted records —
this is why it was not consolidated in this pass (audit-first, no code changes).
**Recommended correction:** write a one-off comparison test proving byte-identical output
across all three on shared fixtures; only then promote `canonicalStringify` to a neutral
location and replace the other two call sites.
**Priority:** P2 — real duplication, non-urgent, and must be done carefully.

---

### DRIFT-04 — Idempotency-violation detection and role-policy guards each duplicated (P2)
**Evidence:** `isIdempotencyUniqueViolation` independently defined in `evidenceGateway.ts`/
`benefitsGateway.ts` (one shape) and `caseCommandGateway.ts`/`prescreenGateway.ts`
(another shape) — four copies, two shapes, same package (`case-repository`). The static
role-policy guard (`if (!roles.some(r => allowed.includes(r))) throw <LocalError>`) is
reimplemented identically across `case-service`, `evidence-service`, and
`prescreen-service`'s `permissions.ts` files. Assurance-service's permission model is
genuinely different (per-resource participant grants) and is not part of this
duplication.
**Recommended correction:** extract one `isIdempotencyUniqueViolation` in
`case-repository/src/idempotencyErrors.ts`; extract one `createRolePolicyGuard` in
`domain-contracts/src/rolePolicy.ts`. Both are behavior-preserving, mechanical
extractions with existing test coverage to verify against.
**Priority:** P2.

---

### DRIFT-05 — `withTenantContext` used inconsistently across gateways (P2)
**Evidence:** `prescreenGateway`, `revOpsGateway`, `utilizationReviewGateway` use the
shared `case-repository/src/tenantContext.ts` wrapper; `evidenceGateway`,
`benefitsGateway`, `caseCommandGateway`, `assuranceGateway`, `documentGateway` call
`this.prisma.$transaction` directly instead.
**Current reality:** unclear whether this is intentional (e.g. some of these gateways
also write organization-level events with no single case tenant) or an omission.
**Recommended correction:** investigate each of the 5 gateways' actual transaction needs
before changing anything — do not convert blindly.
**Priority:** P2, investigate-before-fix.

---

### DRIFT-06 — ADR-0012 accepted "in part": Fastify wraps a node:http-style catch-all (P1, ruling made)
**Evidence:** `packages/api-service/src/server.ts:265` initializes real Fastify; lines
297-312 register native routes for RevOps/IOP/Operating Assurance; lines 313-434 still
route the original 4 endpoints and all 7 prescreen endpoints through a manual
`app.all("/*", ...)` handler using `reply.hijack()` and regex path matching.
**Current reality:** `ADR-0012-api-architecture.md` records "Accepted in part" — the
Fastify *direction* was approved 2026-07-18, but the migration was never finished and no
resolution timeline existed anywhere in `docs/`.
**Owner ruling:** finish the native-Fastify migration for the remaining routes and accept
ADR-0012 in full (Tyler's ruling this session, recorded in the approved implementation
plan). **Not yet executed** — this audit pass identifies and documents it; the migration
itself is scoped as a P1 implementation-plan item, not done in this pass per "audit
first, do not restructure code" ordering.
**Priority:** P1.

---

### DRIFT-07 — Three root-level packages are inert, fully-absorbed reference material (P2)
**Evidence:** `reporting-metrics-rebuild-package/`, `clarity-analytics-return-package/`,
`chatgpt-full-stack-analytics-handoff/` — zero `.ts/.tsx/.js` files across all three
(confirmed via `find`), none in `package.json` workspaces/`tsconfig.json`/
`vitest.config.ts`. Their content is confirmed implemented: the first in
`packages/rev-ops-service/src/operatingWorkbook.ts`; the other two in
`packages/domain-contracts/src/{analytics,episode,utilizationReview}.ts` +
`case-repository`'s episode/UR gateways. `chatgpt-full-stack-analytics-handoff/
source-material/reporting/` additionally contains a byte-identical duplicate of two files
from `reporting-metrics-rebuild-package/`.
**Recommended correction:** move all three into `reference/source-packages/` (the
existing convention for onboarded/absorbed material) and delete the duplicate pair. Fix
the one known reference to the old path
(`docs/repository-audit/06_INTEGRATION_DECISIONS.md` row 15).
**Priority:** P2 — cosmetic/organizational, zero behavior risk.

---

### DRIFT-08 — Operating Assurance implementation ran ahead of its own discovery-lifecycle gate (P0, ruling made)
**Evidence:** `docs/discovery/operating-assurance/project-state.yaml` (as of the July 30
source decisions): `lifecycle_status: paused`, `gates.requirement_readiness:
not_started`, `gates.execution_readiness: not_started`, `next_allowed_skills:
[product-requirements-planning]`. `stage-manifest.yaml` and
`product-intelligence-stage-manifest.yaml` both list `implementation_in_progress` as a
**prohibited** entry state. `docs/discovery/operating-assurance/
PRODUCT_INTELLIGENCE_HANDOFF.md:111` states outright: "Implementation is prohibited by
the current lifecycle state." Commits `9eeeda3`, `f6ff9eb`, `406c6d6`, `15a094d` (this
same branch, this same day) built the full OA contracts/persistence/commands/API anyway.
**Current reality:** a genuine, unresolved authorization violation existed until this
session — implemented, merged, tested code contradicting an explicit, still-live
process gate in the same repository.
**Owner ruling:** ratify retroactively. Tyler is the owner and directly authorized this
work; the docs should reflect that rather than the implementation being rolled back or
the contradiction being left standing. Recorded in
[ADR-0020](ADR-0020-operating-assurance-retroactive-ratification.md); `project-state.yaml`
and both stage-manifest files should be updated to record requirement/execution readiness
as reached via direct owner authorization on 2026-09-12 (implementation-plan item, not
yet executed in this audit pass — see ARCHITECTURE_IMPLEMENTATION_PLAN.md P0-1).
**Priority:** P0.

---

### DRIFT-09 — `IMPLEMENTATION_STATUS.md`'s "Current State" block was stale and self-contradicting (P1, fixed this session)
**Evidence:** the file's top block was pinned to commit `5348202` (14 commits behind
HEAD) and never mentioned `assurance-service`, `learning-practice-service` (CLPR), or
`legal-hold-forms`. A dated entry describing exactly these gaps had already been added
earlier the same day but was misfiled under the "## Verification history (historical —
not current)" section header — the file contradicted its own organizing principle.
**Recommended correction:** rewritten this session — the top block now reflects HEAD
`15a094d`, folds in OA/CLPR/legal-hold-forms, and the misfiled duplicate entry was
removed. New "Operating Assurance product slice" and "CLPR" H2 sections were added
matching the file's existing per-initiative section convention.
**Priority:** P1. **Status:** fixed.

---

### DRIFT-10 — CLPR review-acceptance gate sat unrun since PR #68 merged (P1, fixed this session)
**Evidence:** `docs/implementation/CLPR_SYNTHETIC_VERTICAL_SLICE.md:4`: "Review
acceptance: [Unverified]; this document does not record Claude approval" — despite PR #68
having merged. `CLPR_FILE_OWNERSHIP.json` names the review checklist
(`docs/planning/clpr/CLPR_INTEGRATION_RESOLUTION.md` §F/§G).
**Recommended correction:** the full house validation gate ran this session (lint,
typecheck, root 755/755, app 132/132, `prisma validate`) and covers exactly the commands
§F specifies; `git diff --stat` on PR #68 (verified in an earlier pass) touched none of
`CLPR_FILE_OWNERSHIP.json`'s `blocked_paths`. The review-acceptance line should be updated
to reflect this pass (implementation-plan item — doc update, not yet applied to that
specific file in this pass; tracked as P1-2 in the implementation plan).
**Priority:** P1.

---

### DRIFT-11 — Frontend/backend disconnection across most of the experience layer (P0 — the most consequential drift found)
**Evidence (Explore-agent frontend audit, file-by-file):** of 15 audited experience-layer
surfaces, only **RevOps/Operating Workbook** is REAL_API_BACKED with genuine end-to-end
test coverage. **Legal Status** is HYBRID (rule engine client-side, only the final
decision-rationale write hits a real API). The remaining 12 — Case Queue, Command Center,
Guided Intake, Evidence Review, Medical Necessity, Benefits Verification, Authorization
Readiness, IOP Reconciliation, Packet Preview, Routing/Facility Response, Bedboard/Custody,
Learning/Practice — are LOCAL_MOCK_ONLY: they read/write one shared `localStorage` blob
(`app/src/domain/storage.ts`) and do not import `app/src/domain/api.ts` at all, despite
matching, tested backend packages existing for most of them (case-service,
evidence-service, benefits-service, authorization-service, learning-practice-service).
Operating Assurance has **no frontend surface at all**.
**Current reality:** the documentation (`IMPLEMENTATION_STATUS.md`'s "Completed" bucket,
and this ledger before this correction) lists backend packages as "Completed" in a way
that reads as if the product experience is complete — it is not. Backend maturity is
invisible in the actual app for roughly 12 of 15 surfaces.
**Risk:** any planning or investor/stakeholder conversation that treats "package X is
Completed" as "feature X works in the product" is working from a false premise.
**Recommended correction:** no code change recommended in this audit pass. This is
recorded as the top-priority planning input for whichever surface gets prioritized next
— see ARCHITECTURE_IMPLEMENTATION_PLAN.md P1-1.
**Priority:** P0 (as a documentation/planning-accuracy issue), not a security or
correctness bug in the backend itself.

**[CORRECTED 2026-09-18]** The broad finding still holds — most experience-layer surfaces
still import no API client, and workspaces still receive one shared `localStorage` blob via
`CrisisOpsApp.tsx` rather than importing `domain/storage.ts` directly. Two specifics in the
evidence above are now **stale and must not be re-quoted**:
(1) *"Operating Assurance has no frontend surface at all"* is **false** —
`app/src/workspaces/OperatingAssurance.tsx` exists (325 lines) and is API-backed;
(2) *IOP Reconciliation is LOCAL_MOCK_ONLY* is **false** — `IopReconciliation.tsx` was wired
to its real backend API and then migrated to the shared session.
On current `main`, 7 of 26 workspace surfaces import an API client
(IopReconciliation, LegalStatus, OperatingAssurance, OperatingWorkbook, RevOps,
RevOpsPricing, RevOpsReceiptExport). The disconnection finding is therefore **narrower than
originally written but not resolved**.

---

### DRIFT-12 — "Governed events & outbox" language overstates a write-path-only implementation (P1)
**Evidence:** `packages/case-repository/src/outboxDelivery.ts` — no dispatcher process,
no external egress of any kind (`fetch`/broker-client grep returned nothing), no
retry-ceiling or dead-letter handling; `OutboxRecord.status` is a bare PENDING/DELIVERED
string with no attempt/lease columns. The repository's own
`docs/decisions/OUTBOX_DELIVERY_BOUNDARY_DECISION.md` already states this precisely — the
drift is in how casually "event foundation" gets used elsewhere, not in the design doc
itself.
**Recommended correction:** when referring to this capability outside its own decision
doc, call it a "transactional outbox write-path" or "boundary proof," not an "event
foundation" or "event architecture," until a real dispatcher/consumer exists.
**Priority:** P1 — terminology-accuracy, not a functional gap given its own doc already
scopes it correctly.

---

### DRIFT-13 — Test suite leaves synthetic residue (not zero-delta) (P2)
**Evidence:** `Organization` count 338→400 (+62), `BehavioralHealthCase` count
1023→1191 (+168) across this session's full-suite runs against local `clarity_dev`.
**Current reality:** consistent with the repo's own long-tracked residue pattern
(referenced as "issue #24" in `IMPLEMENTATION_STATUS.md`'s prior sessions) — not a new
regression from this session's changes, but confirmed concretely here.
**Recommended correction:** out of scope for this audit pass; a residue-cleanup pass
across the suite is a separate, pre-existing tracked item.
**Priority:** P2.

**[CORROBORATED 2026-09-18, then NARROWED]** An independent read-only count found **401
organizations / 1,192 cases** — one above this entry's 400/1191 endpoint. The persistence of
the residue is corroborated; **the mechanism is not.** These are aggregate before/after counts
and cannot attribute rows to a writer: they do not distinguish a failed teardown hook from an
intentionally persistent setup or dev fixture, a crashed run, or another session's writes.
An earlier revision of this note said the match "confirms" teardown as the mechanism — that
overstated the evidence and is retracted here. Phase 3 must therefore **diagnose the cause
and attribute rows per fixture family before deleting anything**; deleting first risks the
deletion simply being undone, which holds whatever the cause turns out to be.

**[RESOLVED 2026-09-18 — Housekeeping Phase 3B]** The operating path is removed rather than
the historical cause proven. PR #107 made database-writing tests run only on per-run
disposable clusters (the harness refuses an unmarked database) and added a schema-driven
tenant-cleanup coverage guard. Gate A.5 reproduced **two** mechanisms that leave this exact
residue signature (cleanup exception; termination before `afterAll`), so which one produced
the historical rows remains **UNKNOWN**. Gate B rebuilt `clarity_dev` from canonical
migrations; three sequential and one concurrent two-worktree integration runs left it
unchanged. See `docs/recovery/2026-09-18-housekeeping-phase-3b-gate-b-clarity-dev-rebuild.md`.

---

## Summary by priority

| Priority | IDs | Status |
| --- | --- | --- |
| P0 | DRIFT-01, DRIFT-08, DRIFT-11 | DRIFT-01 fixed this session; DRIFT-08 ruled, ADR written, doc-sync pending; DRIFT-11 flagged for planning, no code change proposed |
| P1 | DRIFT-02 (Zod gap only), DRIFT-06, DRIFT-09, DRIFT-10, DRIFT-12 | DRIFT-09 fixed; DRIFT-06 ruled, migration pending; DRIFT-10 evidence gathered, doc-line pending; DRIFT-02/DRIFT-12 flagged |
| P2 | DRIFT-02 (vocabulary), DRIFT-03, DRIFT-04, DRIFT-05, DRIFT-07, DRIFT-13 | all flagged, none require an owner ruling, none executed in this audit pass |
