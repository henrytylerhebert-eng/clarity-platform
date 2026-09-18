# Session handoff — whole-platform tree + architecture audit — 2026-09-12

> **PRESERVED 2026-09-18 (Housekeeping Phase 2B).** Extracted from the unmerged PR #73
> branch rather than merging that PR wholesale, because its only conflicting file
> (`IMPLEMENTATION_STATUS.md`) was rewritten by PR #101's truth repair. This document is a
> **2026-09-12 snapshot** taken against `main` at `15a094d`; treat its statuses, counts and
> file sizes as historical to that date, not as current capability. Corrections applied on
> extraction are marked inline as **[CORRECTED 2026-09-18]**. See
> [`../recovery/2026-09-18-housekeeping-phase-1-truth-reconciliation.md`](../recovery/2026-09-18-housekeeping-phase-1-truth-reconciliation.md).

> **Historical snapshot — superseded as an execution handoff on 2026-09-14.**
> This document preserves what the 2026-09-12 session believed was current; it
> is not the present implementation plan. Work it labels as next was subsequently
> completed or changed by merged PRs #75 (Fastify migration), #79 (IOP frontend
> API wiring), #84 (shared authentication/router shell), and #86 (Phase 2A status
> and provider decision updates). Re-check `main`, `IMPLEMENTATION_STATUS.md`, the
> open-decisions register, and GitHub before acting on any status below.

**Why this file exists:** this session ran out of usage. Everything below is what a
fresh Claude Code session needs to pick up exactly where this one stopped — no prior
context required.

## Where things stand right now

- **Worktree:** `/Users/tylerhebert/Documents/clarity-platform/.claude/worktrees/tree-structure-buildout-765db6`
- **Branch:** `claude/tree-structure-buildout-765db6`, pushed to `origin`.
- **PR:** [#73](https://github.com/henrytylerhebert-eng/clarity-platform/pull/73) — open
  against `main`, ready for review (not draft), not yet merged, not yet reviewed by
  Tyler.
- **Commit:** `26ac7b0` — "docs: whole-platform tree, architecture audit, and doc-truth
  repair." **Docs-only.** No product/executable code was changed in this session.
- Working tree was clean at session end (everything relevant committed).

## Read these first, in this order

1. **[docs/architecture/CODEX_ARCHITECTURE_HANDOFF.md](../architecture/CODEX_ARCHITECTURE_HANDOFF.md)**
   — the actual engineering handoff: what must not change, which tests must stay green,
   which work is parallelizable vs. sequential, and the recommended atomic slice order.
   This is the most important single file to read next.
2. **[docs/architecture/CLARITY_ARCHITECTURE_LEDGER.md](../architecture/CLARITY_ARCHITECTURE_LEDGER.md)**
   — component-by-component status with evidence (what's IMPLEMENTED vs. PARTIAL vs.
   BUILT-INTEGRATION-PENDING vs. DESIGNED, across the whole repo).
3. **[docs/architecture/ARCHITECTURE_DRIFT_REGISTER.md](../architecture/ARCHITECTURE_DRIFT_REGISTER.md)**
   — 14 concrete findings (DRIFT-01 through DRIFT-13), each with evidence, priority, and
   status (fixed / ruled-but-not-executed / flagged-only).
4. **[docs/architecture/ARCHITECTURE_IMPLEMENTATION_PLAN.md](../architecture/ARCHITECTURE_IMPLEMENTATION_PLAN.md)**
   — the actual backlog (P0–P4), each item with problem/evidence/files/acceptance
   criteria/Codex-suitability.
5. `IMPLEMENTATION_STATUS.md` top block — now current as of `15a094d`.

Also useful but secondary: `docs/architecture/{CLARITY_CURRENT_STATE,
CLARITY_EMERGING_STATE, CLARITY_TARGET_STATE}.md` (Mermaid diagrams),
`SERVICE_EXTRACTION_MATRIX.md`, `PRODUCTION_READINESS_MATRIX.md`,
`docs/product/CLARITY_PLATFORM_FULL_TREE.md` (whole-platform navigation map, separate
from the architecture audit — built earlier in this same session),
`ADR-0020-operating-assurance-retroactive-ratification.md`.

## What this session actually did, in order

1. Built `docs/product/CLARITY_PLATFORM_FULL_TREE.md` — a navigation map covering every
   initiative on the case spine (case/evidence/benefits/authorization/authentication/API,
   prescreen, RevOps/workbook, Operating Assurance, CLPR, legal-hold-forms,
   network-enrichment, AI operating model), mirroring the existing RevOps-scoped tree.
2. Tyler shared a 116-page PDF (`~/Downloads/BH Training Material Revisit - Marketing
   Training Tree.pdf`) — a separate ChatGPT conversation building a "Behavioral Health
   CMO/CRO Operating Manual" (a consulting/product asset, saved to his
   `henrytylerhebert@gmail.com` Google Drive, **not part of this repo**). Traced its
   provenance: the *only* part of that conversation meant to reach Clarity was the CLPR
   ("Clarity Practice Loop" / Notice-and-Acknowledge) concept, and that handoff had
   **already been executed** — `docs/planning/clpr/CLPR_INTEGRATION_RESOLUTION.md`,
   `CLPR_FILE_OWNERSHIP.json`, and `packages/learning-practice-service` all already
   existed on `main` before this session started. No further action needed on the PDF
   itself; it's context only if Tyler brings it up again.
3. Planned a redundancy/efficiency cleanup (approved plan saved at
   `~/.claude/plans/composed-squishing-wind.md`) after three parallel Explore agents
   found: three dead root-level reference-package directories fully absorbed into real
   code; duplicated idempotency-violation/canonical-JSON/role-policy-guard patterns
   across service packages; and four documentation gaps. **Only partially executed**
   before the next item superseded it — see "What's still open" below.
4. Mid-session, Tyler sent a large "Canonical Architecture Reconciliation" prompt asking
   for a full audit-first architecture review (ledger, drift register, three state
   diagrams, extraction matrix, readiness matrix, implementation plan, Codex handoff).
   This explicitly said *audit first, don't restructure code until findings are
   established* — so the redundancy-cleanup code changes (item 3) were paused, not
   completed.
5. Fixed a real, concrete problem found while establishing ground truth: this worktree's
   local `clarity_dev` Postgres was missing 10 of its own migrations (RevOps, IOP
   reconciliation, Operating Assurance — all present in `prisma/migrations/` but never
   applied here) and had 2 migrations from a *different* worktree/branch that aren't in
   this one's migration folder at all. This is the shared-local-database ledger drift
   already tracked as issue #31 — applied the missing migrations
   (`npx prisma migrate deploy`), regenerated the Prisma client, and fixed one
   environment-specific role-permission gap (`GRANT USAGE ON SCHEMA public TO
   revops_rls_test`). Documented as DRIFT-01.
6. Ran the full house validation gate: root **755/755** (72 files), app **132/132** (20
   files), `npm run lint` clean, `npm run typecheck` clean, `npx prisma validate` clean.
   Synthetic residue after the run was **not zero** (Organization +62, case +168) —
   tracked, pre-existing pattern (issue #24 lineage), not a new regression.
7. Produced all nine architecture-audit documents plus ADR-0020, made two owner rulings
   (below), fixed three documentation-truth gaps, then committed and opened PR #73.

## Owner rulings made this session (binding — do not re-litigate)

1. **Operating Assurance was implemented while its own discovery-lifecycle docs said
   implementation was prohibited** (`docs/discovery/operating-assurance/
   project-state.yaml` said `lifecycle_status: paused`). Tyler ruled: **ratify
   retroactively**, not roll back, not leave standing. Recorded as
   [ADR-0020](../architecture/ADR-0020-operating-assurance-retroactive-ratification.md);
   `project-state.yaml` already updated to match.
2. **ADR-0012 (API architecture) is "accepted in part"** — Fastify wraps a manual
   `node:http`-style catch-all for the original 4 routes plus all 7 prescreen routes.
   Tyler ruled: **finish the native-Fastify migration** (not formalize the hybrid as
   permanent). **This ruling is recorded but the migration itself has NOT been done
   yet** — it's the top item in the implementation plan (P0-2).
3. Tyler approved installing two ECC agents (`code-simplifier`, `doc-updater`) and one
   skill (`architecture-decision-records`) from
   `/Users/tylerhebert/Documents/agentkits-marketing/ECC`, **project-scoped only**
   (copied into this repo's `.claude/agents/` and `.claude/skills/`, not into
   `~/.claude/`). Already done, committed in PR #73.

## What's still open — in priority order

Everything below is fully scoped in `docs/architecture/ARCHITECTURE_IMPLEMENTATION_PLAN.md`
with exact files, acceptance criteria, and test requirements. Do not re-plan from
scratch — read that file's entry for each ID before starting.

1. **P0-2 — finish the ADR-0012 Fastify migration.** Convert the remaining
   `app.all("/*", ...)` + `reply.hijack()` catch-all in
   `packages/api-service/src/server.ts` (original 4 routes + all prescreen routes) to
   native Fastify route registration, matching `registerAssuranceRoutes`. Must not
   change request/response contracts — the existing API and prescreen integration
   suites are the regression check.
2. **P0-3 — add Zod validation to Operating Assurance's commands.**
   `packages/assurance-service/src/commands.ts` uses plain TypeScript interfaces instead
   of the Zod envelopes every other command service uses (DRIFT-02's Zod half).
3. **P1-1 — wire the frontend to real APIs, one slice at a time.** 12 of 15
   experience-layer surfaces are `localStorage`-only despite matching, tested backend
   packages existing (DRIFT-11 — the single biggest finding of the whole audit).
   Recommended first slice: **IOP Reconciliation** (`app/src/workspaces/
   IopReconciliation.tsx`) — its backend API (`packages/api-service/src/
   iopReconciliationRoutes.ts`) already exists; only the frontend needs wiring. Second
   slice: Evidence Review. Do not attempt all 12 at once.
4. **P1-3 through P1-6 — the original redundancy-cleanup plan**, deferred when the
   architecture audit superseded it, still fully valid:
   - Extract one `isIdempotencyUniqueViolation` helper (`case-repository/src/`) —
     currently 4 independent copies in 2 shapes across `evidenceGateway.ts`,
     `benefitsGateway.ts`, `caseCommandGateway.ts`, `prescreenGateway.ts`.
   - Extract one `createRolePolicyGuard` (`domain-contracts/src/rolePolicy.ts`) —
     currently reimplemented identically in `case-service`, `evidence-service`,
     `prescreen-service`'s `permissions.ts` files.
   - Consolidate canonical-JSON fingerprint logic (`canonicalStringify` vs
     `episodePersistenceGateway.ts`'s `canonicalJson` vs
     `networkEnrichmentResolution.ts`'s `stableNetworkJson`) — **write a byte-equivalence
     comparison test FIRST**; these values feed idempotency fingerprints already
     persisted in `clarity_dev`, so don't swap call sites until proven identical.
   - Investigate (don't blindly fix) why `evidenceGateway`/`benefitsGateway`/
     `caseCommandGateway`/`assuranceGateway`/`documentGateway` skip the shared
     `withTenantContext` wrapper that `prescreenGateway`/`revOpsGateway`/
     `utilizationReviewGateway` use.
   - Archive `reporting-metrics-rebuild-package/`, `clarity-analytics-return-package/`,
     `chatgpt-full-stack-analytics-handoff/` into `reference/source-packages/` (all
     confirmed fully absorbed into real code, zero source files, not in any build
     config) and delete the one byte-identical duplicate file pair. Fix the one known
     reference in `docs/repository-audit/06_INTEGRATION_DECISIONS.md` row 15.
   - Full original plan (slightly more narrative, same substance): `~/.claude/plans/
     composed-squishing-wind.md`.

None of P0-2/P0-3/P1-1/P1-3..6 have been started as code — only planned and documented.

## Environment gotchas for a fresh session

- **Each git worktree needs its own `.env`.** This one didn't have one at session start;
  copied from the main checkout: `cp /Users/tylerhebert/Documents/clarity-platform/.env
  .env` (points at local `clarity_dev` as user `tylerhebert`, no password).
- **Always run `npx prisma migrate status` before trusting a test failure.** The shared
  local `clarity_dev` Postgres instance is used by multiple worktrees/branches
  simultaneously; migration-ledger drift (issue #31) is real and was hit concretely this
  session (see DRIFT-01). If migrations are missing, `npx prisma migrate deploy` +
  `npx prisma generate` before re-running tests — check each migration's SQL for
  destructive `DROP`/`TRUNCATE` first (none of this session's 10 were destructive; they
  were RLS-policy recreate patterns).
- **Synthetic residue is not zero** (Organization +62, case +168 as of this session) —
  expected, tracked, not a regression to chase down.
- Postgres roles used for RLS testing (e.g. `revops_rls_test`) may be missing
  `GRANT USAGE ON SCHEMA public` on a given local machine even though they have
  table-level grants — produces a misleading "relation does not exist" error, not a
  permission error. Fixed on this machine's local Postgres for this role; may recur
  elsewhere.

## Open decisions that need Tyler, not engineering judgment

- Hosting/deployment target (OD-5/OD-6) — blocks every P2 productionization item.
- Which mock-only workspace gets wired second, after IOP Reconciliation.
- Whether CLPR or `legal-hold-forms` should ever get real Prisma persistence/API — both
  are currently BUILT-INTEGRATION-PENDING by design; graduating either is a product
  decision, not a default next step.
- Vendor choices (object storage, secrets manager, identity provider) whenever a real
  pilot is authorized — see `docs/architecture/PRODUCTION_READINESS_MATRIX.md`.
