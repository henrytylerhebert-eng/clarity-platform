# Clarity Platform — Session Operating Rules

Full manual: [docs/developer-handoff/CLAUDE_OPERATING_MANUAL.md](docs/developer-handoff/CLAUDE_OPERATING_MANUAL.md) (v1.0). This file is its project-level tailoring per the manual's Section 15. When rules conflict, this file wins.

## What this project is

Clarity is a behavioral-health case-intelligence platform (Louisiana crisis-placement focus). **Synthetic data only — it is not a deployed clinical system.** Owner: Tyler Hebert. Private remote: `github.com/henrytylerhebert-eng/clarity-platform`; `main` is protected — PR-only, no direct pushes, no force-pushes/deletions. Required approvals are **0** under the temporary solo-maintainer policy (handoff guide §3a); every PR still gets a documented self-review, and the 1-review requirement returns per §3a's triggers.

Build sequence (agreed): case repository → case command service → documents → **evidence (done)** → insurance/benefits → authorization readiness → authentication → API → UI → controlled extraction → AI agents. Do not jump ahead in this sequence without an explicit user decision.

## Session open / close (mandatory)

- **Open:** read `IMPLEMENTATION_STATUS.md` (current state + next recommended action) and restate the project state in ≤5 lines before doing new work. Verify `git status` is clean before starting.
- **Close:** update `IMPLEMENTATION_STATUS.md`, maintain the local graph when useful using [GRAPHIFY_WORKFLOW.md](docs/developer-handoff/GRAPHIFY_WORKFLOW.md), and end with completed items + the single next action. `graphify-out/` is generated, ignored worktree state; never stage its caches or generated reports.

## Hard rules (truth discipline)

1. **Never claim a test passed unless it ran in this session.** Report exact counts. Use only: written / run / tested / committed / pushed / deployed — highest TRUE state.
2. **Database:** integration tests run **only against a disposable database**. Two guards enforce this and neither may be weakened: `assertLocalClarityDevDatabase` (name/host must be local `clarity_dev`) and `assertDisposableDatabase` (the database must be marked `CLARITY_DISPOSABLE_DATABASE=1`). Run them with `npm run test:integration`, which wraps the suite in `scripts/with-ephemeral-database.ts` — a throwaway PostgreSQL instance created, migrated and destroyed per run. CI sets the same marker because its service container is per-run. The persistent local `clarity_dev` is for the `npm run api:dev` prototype fixture only; **no test may write to it**. This replaces the old "verify zero synthetic residue after any suite" rule — residue is now structurally impossible rather than something to check for afterwards.
3. **Never add real patient data, real insurance identifiers, PHI/PII, or secrets** — anywhere, including audit metadata, commit messages, and docs. `.env` and `.local-object-storage/` stay untracked.
4. **Not claimed, ever:** production readiness, HIPAA compliance, malware protection, working external integrations, or approved clinical/legal rules. Final reports carry an honesty statement listing what is NOT claimed.
5. Migrations: smallest possible, applied to local `clarity_dev` only, justified in an ADR.

## Architecture invariants (do not violate; propose changes via ADR)

- **One Prisma package:** only `packages/case-repository` imports `@prisma/client`. Services (`case-service`, `document-service`, `evidence-service`) go through their gateway adapters.
- **Command pattern everywhere:** strict Zod envelopes → role policy (exact `UserRole` enum values, no "admin" shorthand) → one transaction (tenant-scoped reads, state machine on the fresh row, conditional versioned UPDATE, atomic audit event, idempotency record). New capabilities reuse this; never reinvent.
- **Tenancy in every predicate.** A record id is never authorization. Cross-tenant misses are non-revealing errors.
- **Append-only audit** with the restricted-identifier guard; metadata carries hashes/field-names, never source text, file bytes, or raw filenames.
- **Immutability by construction** where required (evidence `originalText`/category, document versions): no change-set type may express the forbidden update.
- Contracts live in `packages/domain-contracts` (pure; enum arrays mirror `prisma/schema.prisma` — keep in sync).

## Workflow

- Discovery first (read existing code/ADRs), then implementation, then integration tests against `clarity_dev`, then docs (ADR + implementation doc + test manifest with **honest gaps**), then small commits, then PR to `main`. Never push directly to `main`.
- Bounded implementation slices state scope, prohibited paths, and required acceptance evidence up front using [docs/governance/WORK_PACKAGE_TEMPLATE.md](docs/governance/WORK_PACKAGE_TEMPLATE.md).
- Validation gate before any completion claim: **`npm run verify`** — runs `lint`, `typecheck`, `prisma:validate`, `test:unit` (no database) and `test:integration` (disposable database), all of which must actually run and pass. `npm test` is the single-pass runner CI uses with its own disposable service database; do not run it locally against a persistent `clarity_dev`.
- Commit style: conventional prefixes (`feat:`/`fix:`/`test:`/`docs:`/`chore:`), body explains the why.
- **ADR numbering:** `docs/architecture/ADR_INDEX.md` is authoritative and must be updated in the same commit that creates an ADR. A number is permanently reserved on first use **anywhere in repository history or on any durable ref** — never reuse one, and never renumber to close a gap. Do **not** allocate by listing `docs/architecture/` on `main`: that is exactly how 0015 and 0020 were double-claimed. Check all refs:
  `git log --all --diff-filter=A --name-only --pretty=format: -- 'docs/architecture/ADR-*' | grep -o 'ADR-[0-9]\{4\}' | sort -u | tail -1`, then take max + 1.
- Out-of-scope findings become GitHub issues, not silent scope creep (backlog: issues #1–#5).

## House terminology

Adopt these exactly: tenant = `organizationId`; case = `BehavioralHealthCase`; the 8 parallel workstreams; command/gateway/service layering; "synthetic" prefixes all test fixtures; open decisions are `OD-n` (see `IMPLEMENTATION_STATUS.md`).

## Standing assumptions (labeled, in force)

- **Authentication EXISTS** (ADR-0011, Accepted, implemented). `packages/api-service`
  verifies a bearer token through `@clarity/auth-service` and builds every `CommandActor`
  via `actorFor(principal)` (`packages/auth-service/src/authenticationService.ts:65`), so
  `organizationId` and roles come from the database-backed principal — never from the
  request body. The former assumption *"actor roles are trusted caller input; authentication
  does not exist"* is **RETIRED** for API-mediated paths; ADR-0011 explicitly retires it.
  In-process service calls in tests and dev fixtures still build actors directly — those
  paths are synthetic-only and are not an authorization boundary.
- Local filesystem object storage is development-only.
- REQ numbering is inferred lineage; the source REQ matrix is missing (OD-1).

## Project state (update on every phase change)

```
PROJECT STATE: Clarity Platform — updated 2026-09-20 (Slice 4B merged. ADR-0024 accepted. Slice 4A.1 merged. Access read API implemented. Access Snapshot UI merged as 41cef95.)
Baseline: claims in this block were validated against origin/main after Access Phase 4E (Slice 2A).
Objective: local, synthetic-only, tenant-scoped platform foundation for behavioral-health access, revenue, assurance, and practice workflows.
Current phase: REPOSITORY HOUSEKEEPING — Phase 1 (preserve local-only documents + repair canonical truth) and Phase 2B (ADR/branch/PR governance cleanup) are COMPLETE. Phase 2A was the read-only decision packet. Access Slice 2A (Option B2, ADR-0023) is implemented and merged. Access Slice 3 (derived JourneyPhase projection) is implemented and merged. Access Slice 4B (pure `deriveAccessGuidance()`) is implemented and merged. Access Slice 4A.1 (Case Read Model API) is implemented and merged. The read-only Access Snapshot UI is implemented and merged (PR #127, `41cef95`, 2026-09-20). The Access implementation is active. OD-22 and OD-24 remain open.
Shipped on main (verified by tree inspection at 5c4c0b9): 14 packages — api-service, assurance-service, auth-service, authorization-service, benefits-service, case-repository, case-service, document-service, domain-contracts, evidence-service, learning-practice-service, legal-hold-forms, prescreen-service, rev-ops-service. Frontend `app/` carries the shared AuthProvider / SignInForm / ClarityShell and react-router areas (PR #84). 27 migrations + `migration_lock.toml`. Added since that baseline (verified by tree inspection at `41cef95`, 2026-09-20): `app/src/features/access-snapshot/` — the Access Snapshot workspace. It reads `GET /api/access/cases/:caseKey` under a verified session and renders that response and nothing else. Crisis Ops is MIXED, not uniformly governed: `access` (read-only), `iop-reconciliation` (`apiIopReconciliation`) and `legal` (`apiPrincipal` / `apiRecordDecisionRationale`) reach the API under a verified session, while the remaining workspaces are local demo/prototype state driven by the unauthenticated demo-role picker. Do not cite one as evidence for the other; the demo-role picker is NOT an authorization boundary anywhere.
Prescreen location (CHANGED — older docs are wrong): the command service is `packages/prescreen-service`; contracts are the FLAT files `packages/domain-contracts/src/prescreen.ts` and `packages/domain-contracts/src/prescreenCommands.ts`. There is NO `packages/domain-contracts/src/prescreen/` directory.
ADRs on main: reconciled during Housekeeping Phase 2B — ADR-0020 landed via the PR #73 extraction (Step C) and ADR-0015 is preserved-as-historical via Step E. Numbers 0001–0023 are ALL permanently reserved; next safe number should be found by scanning all refs. The authoritative inventory is `docs/architecture/ADR_INDEX.md` (Step F). Never allocate from a `main`-only listing — check all refs by filename.
Open PRs: 0 as of 2026-09-18 after Housekeeping Phase 2B (landed #81/#89/#100/#102/#103/#104/#105; closed #63/#73/#82/#88/#91/#92/#93/#94/#95 with evidence, deleting no branches). Open issues: #1–#5, #35. Issues #24 and #31 were resolved by Phase 3B Gate B (closure evidence in the Gate B record).
No longer blockers (CHANGED): PR #30 CLOSED 2026-09-12; PR #18 and PR #29 CLOSED 2026-08-23. Any document calling PR #30 "the single blocker" for AI-operating-model Stage 0.1–0.3 is STALE.
Branch durability: the 2026-09-17 machine-only recovery plan was EXECUTED — all 8 `recovery/machine-only/2026-09-17/*` refs exist on origin. A 2026-09-18 audit found 64 local branches, 99 remote branches, 0 stashes, 10 worktrees, and ZERO unpreserved committed content (the 8 local-only SHAs were patch-equivalent to upstream work). NEVER delete the `recovery/machine-only/*` refs.
Local database (clarity_dev, REBUILT 2026-09-18 in Phase 3B Gate B): dropped and recreated from the canonical current-main chain with `prisma migrate deploy` — 26 ledger rows, set-identical to `prisma/migrations/`, 0 orphans, 0 pending, 0 failed/rolled-back, 0 zero-step hotfix rows, `migrate status` clean. `20260917000100_iop_program_binding` is APPLIED (`IopSourceIntegration.programId` NOT NULL + `(organizationId, programId, active)` index). The legacy `Network*` tables are GONE. The ONLY sanctioned persistent organization is `synthetic-org-api-dev`, recreated by `npm run api:dev` (idempotent); any other org in `clarity_dev` is residue. Pre-rebuild state is preserved in a verified `pg_dump` outside the repo (path and SHA-256 in the Gate B record). The 2026-09-13 residue mechanism remains UNKNOWN (Gate A.5: PARTIALLY REPRODUCED — two mechanisms give the same signature). Known residual drift: resolved. The 23-name drift was resolved incidentally by the Slice 2A migration.
Not implemented on ANY ref: liaison / referral-development training; Freedom Behavioral roles or workflows. "Freedom Behavioral" appears only as facility names in `data/public-rates/la-inpatient-2026.json`; "liaison" appears once, incidentally, in `docs/09-personas-and-role-ux.md`.
Verification status: Phase 3B Gate B ran lint, typecheck, prisma validate, unit (47 files / 504 tests) and three sequential ephemeral integration runs plus a concurrent two-worktree run (each 32 files / 276 tests) at f9c4eb8 on 2026-09-18 — persistent clarity_dev unchanged throughout. Treat those as the dated baseline, not a standing claim. Access Slice 4B (2026-09-19, branch off `44c3ec2`), final run after the routing-conflict fail-closed fix (the commit following `0c072d9`): lint, typecheck, prisma validate, unit (51 files / 565 tests, incl. 32 access-guidance tests) and one ephemeral integration run (33 files / 283 tests). Access Snapshot UI (2026-09-19, branch off `c00dabd`, merged as `41cef95`): lint, typecheck, prisma validate, unit (51 files / 565 tests) and one ephemeral integration run (34 files / 295 tests), plus `npm run test:app` (25 files / 215 tests) and the app build; required CI `verify` green on the merged head `555e820`. Playwright, stated precisely: CI's `verify` job DOES run `npm run test:oa-e2e`, but that config's `testMatch` limits it to `operating-assurance.spec.ts`. The Crisis Ops suite `app/smoke/clarity-v01.spec.ts` is run by NO CI step (only `npm --workspace app run smoke`); it was run locally on 2026-09-20 — 20/20 passed on the desktop and mobile projects, including the role-scoping test that covers the `roles.ts` change. No Access-specific Playwright spec exists: `clarity-v01.spec.ts` never opens the `access` workspace. Remaining gaps are in `docs/testing/ACCESS_SNAPSHOT_UI_TEST_MANIFEST.md`. Note `npm run verify` does NOT cover `app/` — the root vitest configs include only `tests/**` and `packages/**`, so any `app/` change needs `npm run test:app` as CI runs it. Historical test counts in IMPLEMENTATION_STATUS.md are HISTORY — never restate them as current evidence.
Durable decisions still in force: solo-maintainer §3a protection is LIVE (PR-only, approvals 0, required strict "verify" check, conversation resolution, admin enforcement); prescreen role mapping ruled Option-3-narrow (INTAKE_COORDINATOR ≡ Central Intake, PHYSICIAN_REVIEWER ≡ authorized practitioner, PMHNP scope as configured policy, external/field roles deferred, same-org only, receivingOrganizationId principal-derived); NON_OPPOSED routing remains an authorized-review pathway; contract evaluators fail closed for missing privacy regime, overlapping consent rules, unresolved transport restrictions, and missing sending/receiving facility approvals; idempotency fingerprint excludes occurredAt (ADR-0014 §5); event-vocabulary expansion stays gated on named consumers and domain review; CaseStatus MEDICAL_TRANSFER_REQUIRED is a non-terminal diversion off ACTIVE_ORDER with mandatory rationale, RETURNED_FOR_MORE_INFORMATION deferred to the cross-org packet (ADR-0018).
Open decisions: OD-1 (missing master package), OD-2 (counsel review), OD-3 (clinical licensing), OD-5 (API hosting), OD-6 (DB hosting/RLS — provider is **Supabase Postgres** per ADR-0022, Accepted 2026-09-13, schema already applied; NOT Cloud SQL, which was never provisioned. Still open: provider-backed tenancy tests and independent security review), OD-7 (pnpm/Turborepo), OD-8 (schema graduation), OD-13 (CMS regulatory research — the Phase 1 research WAS executed 2026-09-12 and its index landed via PR #89; what remains open is naming the reviewer, gated on OD-2 counsel and OD-3 clinical licensing. Nothing in it is a Clarity rule), OD-14 (per-org AI-native policy index); plus cross-org prescreen submission/receipt model; prescreen UI scope; whether MEDICAL_TRANSFER_REQUIRED should be clinician-gated.
Next action: No Access step is queued. The JourneyPhase rail shipped inside the Access Snapshot UI; the governed queue, WorkItem persistence, Guided Intake convergence and any Access UI beyond this read-only snapshot remain UNAUTHORIZED. Proceed only as directed by the user.
```

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
