# Scope of work: branch reconciliation and next-phase execution

**Prepared for:** a fresh Claude Code (Fable) session with real repo, GitHub, and local-Postgres access — none of which the session that wrote this had.
**Repository:** `henrytylerhebert-eng/clarity-platform`, working branch `codex/om/sync-main`.
**Read first, in this order:** `AGENTS.md`, `IMPLEMENTATION_STATUS.md`, `docs/decisions/OPEN_DECISIONS.md`. Do not skip this — this repo runs on explicit verification discipline (COACH MODE, PROMPT CHECK, "output is not evidence") and treats exact test counts as a hard rule. Match that discipline throughout this scope of work: never report a check as passing unless you ran it and saw it pass; label anything you could not run as `[Unverified]`.

## Why this document exists

Three parallel work streams — prescreen role-mapping (PR #28), network-enrichment contracts (PR #29), and the packet-based network-enrichment build already underway on `sync-main` — were built independently from the same fork point (`main` @ `e296e5d`) without visibility into each other. An earlier session already did the investigation and a first reconciliation pass. This document hands you the findings and the remaining, concrete work. Do not redo the investigation below — verify it against current repo state (things may have moved since this was written) and proceed.

## What's already done (verify, don't redo)

1. **PR #28** (`claude/clarity-opening-cfcdc5` → `main`, "prescreen role-mapping ruling ADR-0014 + same-organization API slice") was independently code-reviewed. Verdict: **pass, conditional on three fixes** — see Phase 1 below.
2. **PR #29** (`claude/clarity-network-enrichment-f10807` → `main`, "network-enrichment Phase 1 contracts") was compared against the packet-based network-enrichment work already built on `sync-main` (packets 1–16: persistence, outbox, review UI, audit export, API routes). They are not competing implementations — they model different ends of the same pipeline (PR #29 = entity resolution / candidate data quality; `sync-main` = human review / persistence workflow) and conflicted only because both independently created `packages/domain-contracts/src/networkEnrichment.ts` at the same path.
3. **The domain-contracts split is done**, uncommitted, on the `codex/om/sync-main` working tree at `/Users/tylerhebert/Documents/clarity-platform`. `packages/domain-contracts/src/networkEnrichment.ts` is now a compatibility barrel over three new files: `networkEnrichmentShared.ts`, `networkEnrichmentResolution.ts` (PR #29's content), `networkEnrichmentReview.ts` (sync-main's content). Verified in that session: whole-repo `tsc --noEmit` clean, `eslint` clean on all four files, `tests/unit` 46/46 (including the score-export-ban guard `readiness.test.ts`), `git diff --check` clean on the four files. **Not verified there** (no DB access in that sandbox): the DB-backed integration suite (`tests/integration/prisma-network-review-gateway.test.ts`, `network-enrichment-outbox.test.ts`, and anything Packet 8–11-specific). Run these first, in this environment, before doing anything else — you have the DB access that session didn't.
4. **Known defects were found in `packages/network-enrichment-service`** (not in the contracts files split above — these are runtime/gateway files, untouched by the split): see Phase 2. These are real and should not be treated as fixed just because the contracts were reconciled.

## Phase 0 — orientation and verification (do this before anything else)

- `pwd`, `git status --short --branch`, `git rev-parse HEAD`, `git remote -v`. Confirm you're on `codex/om/sync-main` and see the four uncommitted `packages/domain-contracts/src/networkEnrichment*.ts` files.
- Run the full suite against local `clarity_dev`: `npm test`, `npm run typecheck`, `npm run lint`, `npm run prisma:validate`, `cd app && npm test`. Report exact pass counts, not "should be fine."
- Specifically confirm the migration ledger state: `SELECT migration_name FROM _prisma_migrations ORDER BY migration_name;` — expect 13 entries including `20260720002049_packet11_persistence`. This matters for Phase 1.
- If the split's DB-backed tests pass, commit it as its own commit on `sync-main` with a message referencing this reconciliation (don't fold it into an unrelated commit). Do not commit anything else yet.

## Phase 1 — land PR #28 (prescreen role-mapping + API slice)

The code was verified sound: fail-closed role policy matches ADR-0014 exactly (compile-checked via `satisfies Readonly<Record<PrescreenCommandName, readonly UserRole[]>>`), the idempotency-fingerprint change correctly excludes `occurredAt` only, tenancy invariants are structural (strict Zod schemas, not convention), error taxonomy is complete. Three things block merge as-is:

1. **The PR body claims "339/339" tests; the actual count is 343/343** (333 prior + 9 new API integration + 1 new idempotency unit test, matching the branch's own `IMPLEMENTATION_STATUS.md`). Fix the PR description before merging — this repo treats exact counts as a hard rule, don't let a wrong number ship.
2. **Local `clarity_dev` will fail PR #28's migration-integrity test** because `sync-main`'s `packet11_persistence` migration (the 13th) is already applied there, and that test asserts exactly 12. This is not a PR #28 defect — it's environment drift between the two branches' migration history. Resolve by either restoring a clean 12-migration `clarity_dev` for this specific test run, or explicitly accepting CI's ephemeral Postgres as the gate for this one check and noting the local discrepancy in the PR.
3. **ADR-0014 numbering collision.** Both PR #28 (`ADR-0014-prescreen-role-mapping-and-api-slice.md`) and PR #29 (`ADR-0014-network-enrichment-contracts.md`) claim the same ADR number. Whichever merges to `main` second must renumber to `ADR-0015`. Given the reconciliation in Phase 2 folds PR #29's content into a shared file rather than merging PR #29 as its own PR (see below), PR #28 merging first and keeping `ADR-0014` is the simpler path — confirm this against whatever state PR #29 is in by the time you act.

**Before merging, get explicit confirmation from Tyler on one thing an agent cannot verify**: the PR converts the prescreen role-mapping decision packet from OPEN to "RESOLVED — owner ruling recorded 2026-07-19 (Option 3, narrow)." The code correctly implements that ruling; whether the ruling itself is genuine is not something either reviewing session could confirm. Ask directly before treating this as settled. If Tyler didn't make that call, this is a hard blocker, not a documentation nit.

Once all three conditions are resolved and Tyler confirms the ruling: merge PR #28 into `main`, then reconcile it into `sync-main`. Expect a real but mechanical conflict in `packages/api-service/src/server.ts` — both PR #28 and `sync-main` independently added new route blocks to the same file (prescreen routes vs. network-enrichment routes); resolve by keeping both blocks, not by picking one.

## Phase 2 — fix the defects found in `packages/network-enrichment-service` before this goes any further

These were found during the PR #29-vs-`sync-main` comparison and are independent of the contracts split. They live in the gateway/service layer, not in the contract files reconciled above. Given this repo's standing invariants (synthetic-data-only, append-only audit, no autonomous promotion), these should be fixed — or at minimum triaged with Tyler and explicitly accepted as known debt — before `sync-main` merges into `main`, not carried forward silently:

1. **`@prisma/client` is imported outside `packages/case-repository`** in `prismaReviewGateway.ts` and `scripts/seed_facilities.ts`. This breaches the repo's one-Prisma-package rule. Find every such import and route it through the approved gateway pattern instead.
2. **Dual-review is declared but not enforced.** `NetworkReviewPolicy.oneReviewSuffices`/`specializedReviewRequired` (in `networkEnrichmentReview.ts`, preserved as-is by the split) are read nowhere in the gateway before a package is promoted to `HUMAN_CONFIRMED` — one approval promotes regardless of the `ALL_DISTINCT` dual-review requirement for sensitive fields. Find the promotion path in `packages/network-enrichment-service` and gate it on the policy.
3. **`NetworkReviewAudit` rows cascade-delete with their package**, breaking the append-only audit invariant this repo holds everywhere else (case, document, evidence, benefits, authorization all have append-only audit as a tested guarantee). Check the Prisma schema's `onDelete` behavior for this relation and fix it to match the rest of the codebase.
4. **A governed-event `payloadHash` is a hardcoded string of zeros stamped `VALID`.** Find where this hash is computed (or not computed) and either compute it properly or make the record honestly reflect that it isn't verified — a fake "VALID" stamp is worse than an honest "unverified."
5. **`reconcilePackage` stamps a package `HUMAN_CONFIRMED` with no gate requiring any actual confirmed review to have happened.** Related to #2 — trace the actual precondition check (or lack of one) and close the gap.
6. **`scripts/seed_facilities.ts` bulk-loads a real-world Louisiana facility directory CSV into `FacilityProfile` with no synthetic prefixing.** This is the one that needs Tyler's attention directly, not just an engineering fix: confirm with him whether real-world (non-synthetic, non-PHI but still real) data has already landed in a database this repo's entire governance model assumes is synthetic-only, and what to do about rows already loaded.
7. **A live web-research agent prompt** (`tools/prompts/facility-enrichment-agent.md`) sits in the operational tree. `IMPLEMENTATION_STATUS.md` lists "any live product agent" under Not Started. Confirm with Tyler whether this file represents planning material or was ever actually wired to run, and whether it should move to a clearly-marked reference/parking-lot location.

Do not attempt to fix all seven silently in one pass — surface #6 and #7 to Tyler explicitly before touching anything, since both bear on data/governance decisions above the code level, not engineering judgment calls.

## Phase 3 — reconcile `codex/om/sync-main` with `main`

After Phases 1–2: `sync-main` is roughly 35 commits ahead of `main` (packets 2, 7–16 of network-enrichment, OD-6/RLS work, the just-committed contracts split) and will be some number behind after PR #28 lands (everything merged via PRs #17–#27 that `sync-main` branched before). Rebase or merge `main` into `sync-main` (whichever your git workflow here prefers — check for a stated convention in `AGENTS.md` or ask if none exists), resolve the mechanical `server.ts` conflict from Phase 1, run the full verification suite again, and get `sync-main` itself back into a reviewable PR against `main` so this doesn't silently diverge again. Consider whether the `codex/om/sync-main` branch name and workflow (periodic PR-based sync, per the closed PR #13 precedent) is still the right pattern going forward, or whether it's time to work directly on short-lived branches off `main` instead — ask Tyler rather than deciding unilaterally.

## Phase 4 — execute the ADR-0012 Fastify port

OD-5 is already decided ("accepted in part" on 2026-07-18) — this is a scheduled migration, not an open decision. Once the route surface has stabilized post-Phase-3 (prescreen routes + network-enrichment routes both present and reconciled), port `packages/api-service`'s existing `node:http` server to Fastify per ADR-0012's spec: preserve the `/api` namespace, the verified-principal-only tenancy/actor derivation, and the existing error-taxonomy mapping exactly — this is a mechanical 1:1 port, not a redesign. Contract tests already exist for every route; treat any test that needs behavior changes (not just adapter changes) to pass as a signal you've drifted from the ADR's scope.

## Phase 5 — prescreen Phase 3 persistence (can start in parallel with Phase 4)

Follow the same local-first pattern already proven for S2 episode persistence: build and verify Prisma migrations, the Prisma gateway, and local RLS against `clarity_dev` first; only the *production*/Cloud SQL evidence is gated on Tyler's GCP access (Phase 6). Follow the existing command-pattern/tenancy/audit invariants used by every other `*-service` package (`packages/case-service`, `packages/evidence-service`, etc.) — don't invent a new pattern for prescreen.

## Phase 6 — GCP/Cloud SQL provider-backed verification (external blocker, prep now)

No authenticated GCP project has been available in any session to date. You cannot unblock this yourself. What you can do: build the exact runbook from `docs/decisions/OD-6_PROVIDER_AND_RLS_DECISION_PACKET.md`, `docs/decisions/RLS_TENANT_ENFORCEMENT_DESIGN.md`, and `docs/decisions/S2_MIGRATION_PROMOTION_AND_RECOVERY_CHECKLIST.md` so that the moment Tyler grants project access, the provider-backed RLS/migration/recovery verification runs same-day rather than being scoped from scratch.

## Phase 7 — housekeeping (parallel to everything above, not gated on it)

- `graphify update .` — the graph was last built 71+ commits behind HEAD at the start of this reconciliation; it will be further behind by the time you read this. Run it after Phase 3 lands, not before, so it reflects the reconciled state rather than a mid-flight one.
- DB residue counts — direct count queries against `clarity_dev` (organizations, users, cases, `SourceDocument`, `CommandIdempotencyRecord`, `AuditEvent`, and now the network-enrichment tables) confirming zero synthetic residue after a full test run. This was skipped in the last pass; you have DB access to actually run it.

## Phase 8 — UI (production), controlled extraction, AI agents

Correctly last, per the existing agreed build sequence, and better sequenced after Phase 4 so the production UI doesn't integrate against an HTTP boundary that's mid-migration. Nothing to do here yet — flagged only so it isn't skipped in planning.

## Working rules for all of the above

- Preserve user changes; do not revert unrelated edits. Inspect before editing. Prefer existing patterns and local abstractions over new ones.
- Do not add API contracts, services, or integrations without explicit approval — Phases 1–4 above are the approved scope; anything beyond them needs a fresh ask.
- Do not commit or expose real PHI/PII, secrets, or `.env` values. Phase 2's item 6 is exactly the kind of thing to stop and ask about rather than resolve unilaterally.
- Never claim a check passed without having run it in this session. Separate passing checks from checks not run, explicitly.
- When you hit a genuine `NEEDS_DECISION` point (anything in Phase 2 items 6–7, the ADR-0014 ordering in Phase 1, the branch-workflow question in Phase 3), stop and ask rather than picking a default.
