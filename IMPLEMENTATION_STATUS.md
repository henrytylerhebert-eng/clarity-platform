# Implementation Status

## Current State

**Current-state assertions below were validated against `origin/main` at `dc559e5` on
2026-09-19 after Access Phase 4E (Gate 1 & Gate 2 — Slice 2A).**

Those SHAs are an **evidence baseline** — the commit the claims were checked against — not a
claim that either is still the newest commit. `main` moves; this line does not need editing
after every merge. Re-validate before relying on a specific capability claim, and record the
new SHA and date here when you do. Earlier baselines are kept as historical evidence.

Validated via `git rev-parse origin/main`, `gh pr list`, `git ls-tree`, and read-only `psql`
against local `clarity_dev` — not carried forward from memory. This block was **first written
during Housekeeping Phase 1 at `5c4c0b9` and updated during Phase 2B at `f0cd909`**; it
supersedes the 2026-09-13 narrative preserved below it. Where a claim changed between those two
baselines — the reconciled ADR-0015 and ADR-0020, the ADR index, zero open PRs — the `f0cd909`
baseline is the one that supports it. **Database, test-isolation and issue #24/#31 claims carry
the Housekeeping Phase 3B baseline `f9c4eb8`** (merge of PR #107), validated 2026-09-18.

### Status vocabulary used here

- **CURRENT — VERIFIED** — observed in the repository at one of this block's stated baselines:
  `5c4c0b9` for claims written in Phase 1, `f0cd909` for claims added or changed in Phase 2B,
  and `f9c4eb8` for the database, test-isolation and issue #24/#31 claims established by
  Housekeeping Phase 3B. None of the three is a claim to be the newest commit.
- **HISTORICAL** — was verified on a stated earlier date; not re-run here.
- **DOCUMENTATION ONLY** — a document exists; no runtime behind it.
- **PROPOSED** — designed, not authorized and not implemented.
- **BLOCKED** — waiting on a named owner decision or external access.
- **UNKNOWN** — not established by this update.

### Repository shape — CURRENT, VERIFIED

14 packages on `main`: `api-service`, `assurance-service`, `auth-service`,
`authorization-service`, `benefits-service`, `case-repository`, `case-service`,
`document-service`, `domain-contracts`, `evidence-service`, `learning-practice-service`,
`legal-hold-forms`, `prescreen-service`, `rev-ops-service`. Frontend in `app/`.
27 Prisma migrations plus `migration_lock.toml` (re-counted at `44c3ec2`, 2026-09-19; the
earlier figure of 26 predates the Slice 2A migration).

**Prescreen moved.** The command service is `packages/prescreen-service`; contracts are
the flat files `packages/domain-contracts/src/prescreen.ts` and
`packages/domain-contracts/src/prescreenCommands.ts`. There is **no**
`packages/domain-contracts/src/prescreen/` directory. Documents that cite that path are stale.

**Authentication is implemented** (ADR-0011, Accepted). `packages/api-service` verifies a
bearer token through `@clarity/auth-service` and builds every `CommandActor` via
`actorFor(principal)` (`packages/auth-service/src/authenticationService.ts:65`);
`organizationId` and roles come from the database-backed principal, never the request body.
The long-standing assumption "actor roles are trusted caller input" is **retired** for
API-mediated paths.

**Prisma boundary holds.** Only `packages/case-repository` has a runtime `@prisma/client`
dependency. `packages/api-service/src/assuranceDevFixture.ts` carries a single **type-only**
`import type { PrismaClient }`, which erases at compile time and is not a runtime violation.

### Capability state — CURRENT, VERIFIED (shape only)

| Capability | State | Note |
|---|---|---|
| Prescreen | CURRENT — VERIFIED (shape) | `prescreen-service` + flat contracts; 2 migrations; 4 tables live in `clarity_dev` |
| RevOps | CURRENT — VERIFIED (shape) | `rev-ops-service`, rate-release registry (ADR-0021), 5 migrations |
| Operating Assurance | CURRENT — VERIFIED (shape) | `assurance-service`, `prisma/assurance.prisma`, 5 migrations; VS-OA-001 acceptance review still outstanding |
| Learning & Practice / CLPR | CURRENT — VERIFIED (shape) | `learning-practice-service`, `app/src/components/learning-practice/*`, `docs/planning/clpr/*`; PR #99 reconciled post-merge acceptance |
| Shared auth / router / shell | CURRENT — VERIFIED (shape) | `AuthContext.tsx`, `SignInForm.tsx`, `ClarityShell.tsx` (PR #84, verified live on 2026-09-13 — that live run is HISTORICAL) |
| IOP | PARTIAL / BLOCKED | `iop_reconciliation_persistence` and `20260917000100_iop_program_binding` both applied to the rebuilt `clarity_dev` (Phase 3B Gate B); source-adapter and access gates open (PR #100) |
| Liaison / referral-development training | NOT IMPLEMENTED | Absent from every ref; "liaison" appears once, incidentally, in `docs/09-personas-and-role-ux.md` |
| Freedom Behavioral roles / workflows | NOT IMPLEMENTED | Absent from every ref; the name appears only as facility names in `data/public-rates/la-inpatient-2026.json` |
| Clarity Access refactor | ACTIVE | Slice 4B merged. ADR-0024 accepted. Slice 4A.1 merged. Access read API implemented. Journey/Guidance derived, not persisted. Access Snapshot UI (PR #127; a read-only view of the read model, no patient identity, nothing assigned) is implemented in `app/src/features/access-snapshot/`; its dated verification evidence is under "Test evidence" above and its gaps are in [docs/testing/ACCESS_SNAPSHOT_UI_TEST_MANIFEST.md](docs/testing/ACCESS_SNAPSHOT_UI_TEST_MANIFEST.md). WorkItem not implemented. cross-org Access not implemented. OD-22 / OD-24 open. |

**Test evidence:** the Phase 1/2B updates ran no tests. Phase 3B Gate B (2026-09-18, at
`f9c4eb8`) ran lint, typecheck, `prisma validate`, unit (47 files / 504 tests) and four
ephemeral integration runs (32 files / 276 tests each). Those are dated evidence, not a standing
claim. Every count in "Verification history" below is **HISTORICAL**.

**Access Snapshot UI evidence (2026-09-19, branch off `c00dabd`, merged to `main` as `41cef95` on 2026-09-20; dated, not a standing claim):** LOCAL unless marked CI; exact commands: `npm run verify` = `eslint .` + `tsc --noEmit && tsc -b app/tsconfig.json` + `prisma validate` + `vitest run --config vitest.unit.config.ts` (51 files / 565 tests) + `vitest run --config vitest.integration.config.ts` on an ephemeral database (34 files / 295 tests); then `npm run test:app` (= `npm --workspace app test`; Vitest under `app/` excluding `node_modules`/`dist`/`smoke`, so `app/src/**` only and NO browser tests — 25 files / 215 tests, the pre-#129 figure; the per-persona suite later took it to 225) and `npm --workspace app run build`. CI re-ran lint, typecheck, root tests (as `npm test`, one pass over `vitest.config.ts` rather than the split unit/integration commands), `test:app`, the build and `test:oa-e2e` in its single `verify` job, green on the merged head `555e820`. Playwright, with provenance (per `AGENTS.md`, never inferred from an aggregate check): CI's `verify` job runs `npm run test:oa-e2e`, whose config `testMatch` selects `operating-assurance.spec.ts` only — that spec ran in CI on the merged head. The Crisis Ops suite `app/smoke/clarity-v01.spec.ts` runs under the default config, which **no** CI step invokes; it was run locally post-merge on 2026-09-20 (20/20, desktop + mobile) as a shell regression check, and it asserts nothing about `access`. **No Access-specific E2E spec exists.** Gaps are listed in the UI test manifest.

### Open PRs and issues — CURRENT, VERIFIED (2026-09-18)

**Open PRs: 0** as of 2026-09-20. (0 as of 2026-09-18 after Housekeeping Phase 2B; #127, #128
and #129 landed 2026-09-19/20 and #126 was closed as superseded.)

Phase 2B landed #81, #89, #100, #102, #103, #104, #105 and closed #63, #73, #82, #88, #91,
#92, #93, #94, #95 with per-PR evidence. **No branch was deleted for any closure** — each
closed PR's head branch remains on `origin` as its preserving ref.

Open issues: #1, #2, #3, #4, #5, #35. **#24 and #31 were resolved by Housekeeping Phase 3B
Gate B** — closure evidence in
[docs/recovery/2026-09-18-housekeeping-phase-3b-gate-b-clarity-dev-rebuild.md](docs/recovery/2026-09-18-housekeeping-phase-3b-gate-b-clarity-dev-rebuild.md).

**Closed — no longer blockers:** PR #30 closed 2026-09-12; PR #18 and PR #29 closed
2026-08-23. Any document describing PR #30 as an active blocker is stale.

### ADR inventory — CURRENT, VERIFIED

**Updated 2026-09-18 (Housekeeping Phase 2B).** Both previously off-main ADR numbers are now
reconciled onto `main`:

- **ADR-0020** (Operating Assurance implementation ratified retroactively past its own
  discovery-lifecycle gate, **Accepted** 2026-09-12) — extracted from the PR #73 branch per
  owner decision OD-HK2-002. Its decision is current and unchanged; only its path to `main`
  differed.
- **ADR-0015** (network-enrichment invariant remediation, Accepted 2026-07-19) — landed
  **preserved as historical** per owner decision OD-HK2-001. Its implementation lineage never
  merged: PRs #29/#30 closed unmerged and `packages/network-enrichment-service` does not exist
  on `main`. **It is not evidence that a network-enrichment service exists today.** It is kept
  because it is the only document explaining the historical orphan migrations
  `20260720002049_packet11_persistence` and `20260720014914_network_review_append_only_audit`,
  and because its findings are reusable invariant lessons. Those two migrations were applied to
  the pre-rebuild `clarity_dev` while absent from `main`; the Phase 3B Gate B rebuild removed
  them, and they now survive only on remote history/recovery refs.

Any earlier statement that either ADR exists only on an unmerged branch and awaits disposition
is **superseded**. The prior text here read "20 ADRs on `main`: 0001–0014, 0016–0019, 0021,
0022" and listed both as gaps; that was accurate at `5c4c0b9`.

**Numbers 0001–0023 are all permanently reserved** (ADR-0023 was taken by Access Slice 2A;
re-checked across all refs 2026-09-19). Find the next safe number with the all-refs scan in
`CLAUDE.md` — do not assume ADR-0024 without running it. Never
allocate from a `main`-only listing — check every ref by filename. The authoritative inventory
is `docs/architecture/ADR_INDEX.md` once Phase 2B Step F lands it.

### Local database — CURRENT, VERIFIED (rebuilt 2026-09-18, Phase 3B Gate B)

`clarity_dev` was **dropped and rebuilt** from the canonical current-`main` migration chain
(`prisma migrate deploy`) after a verified `pg_dump` backup. Full evidence:
[docs/recovery/2026-09-18-housekeeping-phase-3b-gate-b-clarity-dev-rebuild.md](docs/recovery/2026-09-18-housekeeping-phase-3b-gate-b-clarity-dev-rebuild.md).

| | Before (historical) | After rebuild |
|---|---|---|
| Organizations / cases | 401 / 1,192 | 1 / 1 |
| Users / PatientTokens / FacilityProfiles | 670 / 401 / 101 | 8 / 1 / 2 |
| Ledger rows | 27 (2 orphans, 1 pending, 3 zero-step) | 26, set-identical to `prisma/migrations/`, 0 orphan / pending / failed / zero-step |
| Legacy `Network*` tables / rows | 9 / 1598 | 0 / 0 |
| `IopSourceIntegration.programId` | absent | present, `NOT NULL`, indexed |

- **Operating model.** The only sanctioned persistent organization is
  `synthetic-org-api-dev`, seeded idempotently by `npm run api:dev`; any other organization in
  `clarity_dev` is residue. Database-writing tests never target it: `npm run test:integration`
  runs on a per-run disposable cluster, and the harness refuses any database not marked
  disposable (PR #107). Three sequential runs and one concurrent two-worktree run left the
  persistent database unchanged — every table's row count, the ledger hash, and the
  organization-id hash matched the post-seed baseline.
- **Unknown, preserved:** the 2026-09-13 residue mechanism. Gate A.5 reproduced two different
  mechanisms that leave the same signature, so the historical state cannot tell them apart.
- **Residual drift (names only):** 20 constraint/index names differ between the migration
  chain and the Prisma schema (hand-named Assurance FKs; index names over PostgreSQL's 63-byte
  limit). No structural difference. Reproduces on every clean replay; needs its own issue.

### Branch and worktree durability — CURRENT, VERIFIED

A 2026-09-18 read-only forensic audit found 64 local branches, 99 remote branches, 0
stashes, 10 worktrees, and **zero unpreserved committed content** — the 8 local-only SHAs
were patch-equivalent to work already on origin. The 2026-09-17 machine-only recovery plan
was executed; all 8 `recovery/machine-only/2026-09-17/*` refs exist on origin and must
never be deleted.

**Re-measured 2026-09-20** (after the Access Snapshot work): 65 local branches, 126 remote, 0
stashes, 19 worktrees, 8 recovery refs.

**These are counts only. Preservation of the growth is [Unverified]** — no audit comparable to the
2026-09-18 forensic pass was run. What was measured on 2026-09-20:

- **9 local branch tips exist on no remote ref**: `claude/ai-operating-model-handoff-7c884e`,
  `codex/om/admission-race-fix-review`, `codex/om/admission-replay-active-check`,
  `codex/om/directory-crm-prototype`, `codex/om/operations-backbone-review`,
  `codex/om/prescreen-contract-review`, `codex/om/prescreen-source-package-fix` (all 2026-07-19/29),
  plus `codex/om/product-definition-reconciliation` and `codex/om/synthetic-iop-p2-records`
  (both 2026-09-19, i.e. created **after** the 2026-09-18 audit).
- **None of the 9 was checked for patch-equivalence** to work already on origin. The 2026-09-18
  audit did perform that check for its 8; this pass did not.
- **One worktree is dirty**: the main checkout, 7 uncommitted files on `feat/access-snapshot`
  (the superseded Antigravity leftovers, deliberately preserved).

**Do not delete any branch on the strength of these counts.** Re-run a preservation audit first.
The only branches deleted on 2026-09-20 were the three merged Access ones (#127/#128/#129), each
gated on matching its tip to the head GitHub squash-merged — squash merges leave a merged branch
looking unmerged to `git merge-base --is-ancestor`.

### Known production-readiness limitations — UNCHANGED

Not claimed: production readiness, HIPAA compliance, PHI handling, approved clinical or
legal rules, working external integrations, or provider-backed tenancy evidence.

**OD-6 provider — CURRENT, VERIFIED.** The provider is **Supabase Postgres**, not Google
Cloud SQL. [ADR-0022](docs/architecture/ADR-0022-supabase-provider-swap.md) is **Accepted**
(owner-directed, 2026-09-13) and swapped OD-6's recorded provider from Cloud SQL to the
existing Supabase project; the schema was actually applied there, which is the first time
OD-6's provider-backed step happened at all. No GCP account or project was ever available,
so Cloud SQL remained recorded intent only. **What still remains open under OD-6:
provider-backed tenancy tests and independent security review** (per
[OPEN_DECISIONS.md](docs/decisions/OPEN_DECISIONS.md) — the schema and anon-grant fix are
already done). Direct any provider-specific tenancy or security work at Supabase.
Earlier sections of this file that name Cloud SQL as the pending gate predate ADR-0022 and
are retained as **HISTORICAL**.

---

### Prior current-state narrative (2026-09-13, `main` at `66b0b7a`) — HISTORICAL

Retained as written. Superseded by the 2026-09-18 block above; its `main` SHA and PR
states are no longer current.

**As of 2026-09-13 (late), branch `main` at `66b0b7a` (confirmed via `git log
origin/main` and `gh pr view` on every PR named below — not carried forward from
memory).**

**PR #83 merged** (`92ed7b9`): a live UX audit of the Clarity prototype produced a
full topology/navigation/session/IA reconciliation — eight documents under
`docs/ux/`, now the source of truth for anything navigation/session/IA-related.
[`docs/ux/PRODUCT_TOPOLOGY_DECISION.md`](docs/ux/PRODUCT_TOPOLOGY_DECISION.md) is
**the answer** worth knowing before touching any of this again: Clarity is **one
platform** with several applications (Crisis Ops, Operating Assurance, RevOps) —
not one monolithic product, not a suite of unrelated apps.

**PR #84 merged** (`66b0b7a`, the first implementation slice acting on that
reconciliation — "Phase 2A"): fixed the concretely-demonstrated defect from the
audit — four independent sign-in surfaces (Crisis Ops sidebar, IOP Reconciliation,
Operating Assurance, RevOps) each called the same `apiLogin`/`apiLogout` but kept
separate React state, so signing in on one left the other three still prompting.
New: `app/src/domain/AuthContext.tsx` (one shared `AuthProvider`/`useAuth()`),
`app/src/components/SignInForm.tsx` (one shared sign-in form replacing four bespoke
copies), `app/src/ClarityShell.tsx` (minimal global layout: Clarity mark, area
switcher, one identity display). `react-router-dom` now drives `/`, `/assurance`,
`/rev-ops` in place of a raw pathname check and a client-state boolean toggle.
Verified live with a real running `api:dev` + `app dev`: sign in once via Crisis
Ops, navigate to Operating Assurance (already signed in), navigate to Revenue
Operations (already signed in, data loaded), back to Crisis Ops (still signed in) —
the brief's exact acceptance test, passing. Deliberately did **not** touch any
workspace/clinical/domain logic, any security boundary, or Prescreen/Analytics/
Network-Enrichment UI (confirmed during the topology audit that none of those three
have a frontend). **Disclosed, accepted limitation, not fixed here:**
`ClarityShell`'s own identity bar sits above each area's existing chrome without
editing it, so e.g. two "Sign out" buttons render after sign-in (the shell's own
plus the area's own) — a small, known redundancy, deliberately left for a later
visual-cleanup pass per the brief's explicit "no product-wide visual cleanup"
instruction; do not "fix" this without it being asked for.

**PR #84's CI was actually red on first push, not merely pending** — this session
verified that directly (`gh pr checks 84`, then read the actual failure log) rather
than trusting the open-PR state. All 6 Playwright cases in "Operating Assurance
replay E2E" failed (3 scenarios × desktop/mobile). Two real, distinct bugs, both
root-caused and fixed in a follow-up commit (`e6d04c8`) before merge:
1. `app/smoke/operating-assurance.spec.ts` still targeted the pre-Phase-2A
   accessible names (`"Operating Assurance dev assertion"` / `"Sign in (verified
   session)"`); the new shared `SignInForm` renders `"Development assertion"` /
   `"Sign in"` instead. Fixed by updating the locators to match, confirmed against
   `SignInForm.tsx`'s actual source rather than guessed.
2. `ClarityShell`'s new global "Sign out" button made `getByRole("button", {name:
   "Sign out"})` a strict-mode ambiguity against Operating Assurance's own. Scoped
   the test's locator to `.session-panel` (OA's own panel) rather than changing any
   product chrome.
3. Mobile-project-only: Playwright's actionability check reported a sibling
   paragraph/label as intercepting the "Load case" click. Verified by hand this is
   a Chromium `isMobile+hasTouch` emulation false positive, not a real defect —
   direct `getBoundingClientRect()`/`elementFromPoint()` checks show no actual
   overlap, and a forced click loads the case correctly every time. Used `{force:
   true}` on just that one click, with a comment explaining why.

**Verified in this session before pushing the fix, all locally against local
`clarity_dev`:** lint clean, typecheck clean, root suite **771/771** (76 files),
app suite **151/151** (23 files), app build succeeds, `npm audit --audit-level=high`
clean, and `npm run test:oa-e2e` **6/6** (previously 0/6) across desktop and mobile.
Re-ran the full gate a second time after the fix, not just the previously-failing
suite in isolation. Self-review posted per §3a, both for the original 5 commits and
as an addendum for this fix commit. CI `verify` green on the fix
(run `34790844425`). **Merged 2026-09-13 23:55 UTC** (confirmed via
`gh pr view 84 --json state,mergedAt`).

**PR #85 (open, not yet merged):** the session handoff document written at the end
of the PR #83/#84 session, committed verbatim to
`docs/developer-handoff/SESSION_HANDOFF_2026-09-13_PHASE_2A.md`. Docs-only.

**PR #82 (open, now stale/superseded — an owner call, not acted on here):** its own
scope was "bring `IMPLEMENTATION_STATUS.md` current on the #78/#79/#80 merges";
`main` has since gained PR #83 and PR #84, so its diff no longer reflects current
state and `gh pr view 82` reports `mergeStateStatus: BEHIND`. This session's update
supersedes it rather than building on it. Recommend closing #82 as superseded, but
that is the owner's call, not this session's.

**PR #81 (open, docs-only, independent):** a Gemini deep-research prompt for
Louisiana psychiatrist/PMHNP scope-of-practice, relevant to ADR-0014's still-open
PMHNP signer-authority question. `verify` passed; `mergeStateStatus: BEHIND` (needs
a rebase, not a conflict) as of this write-up.

**PR #73 (open, untriaged, now has real merge conflicts with current `main`):** the
whole-platform architecture audit from 2026-09-13 03:48 UTC, docs-only, `verify`
passed on its own (now-stale) head, but `gh pr view 73` reports
`mergeStateStatus: DIRTY` — an owner call on disposition, not something to resolve
unprompted.

**PR #63 (draft, unchanged):** public product-portfolio documentation, still needs
an owner look before it can leave draft.

**Not claimed:** production readiness, HIPAA compliance, malware protection, working
external integrations, approved clinical/legal rules, Product Acceptance of
VS-OA-001, or that the mobile Chromium click-interception false positive above has
a root cause beyond what PR #84's fix commit documents — for any capability
described anywhere in this file. Synthetic data only, throughout.

**2026-09-12: OD-13 research executed.** The CMS/Medicare/Medicaid Phase 1 deep
research prompt (`docs/legal/GEMINI_DEEP_RESEARCH_PROMPT_CMS_MEDICARE_MEDICAID.md`)
was run by Tyler using an external deep-research tool; the historical entry below
dated to PR #41 that says "the research has NOT been executed" is superseded by
this line only — everything else in that entry (the classification scheme, the
Phase 2 relationship) stands. Output is at
[`docs/legal/CMS_MEDICARE_MEDICAID_REGULATORY_REFERENCE_INDEX.md`](docs/legal/CMS_MEDICARE_MEDICAID_REGULATORY_REFERENCE_INDEX.md):
~30 classified requirement records across EMTALA, hospital CoPs, Medicare IPF
payment, Medicaid/IMD exclusion, prior-auth/interoperability, quality reporting,
program integrity, privacy/consent, telehealth, and other facility types, plus
two Louisiana-specific surfaces the scaffold missed, a contradictions section,
an interpretation map, and a top-10-by-consequence ranking. **This does not
close OD-13** — citations were not independently re-verified inside this
repository session (see the file's own front matter), and "who reviews the
output before it informs a rule" remains open pending OD-2 (counsel) and OD-3
(clinical licensing). Nothing in it is a Clarity rule, validation rule,
state-machine transition, or role permission yet.

The narrative log below (every prior dated session entry, verbatim, unmoved in
substance) is historical color for how each capability arrived; it is not where a
reader should look for current truth. The Completed / Scaffolded / Documented only /
Blocked / Not started buckets further down remain the authority for
capability-by-capability status and are unchanged by this reorganization.

## Verification history (historical — not current)

**2026-09-12: Twelve-PR housekeeping pass and bridge retirement.** Merged: #58
(workbook operating slice + payment scenarios; cleaned of a dead, unused
`RevOpsScope.tsx`), #59 (governance/operating-assurance documentation recovery),
#48 (network-enrichment contract kernel, verified contract-only — no Prisma
imports, no server/runtime code), #64 (root-caused and fixed a real intermittent
CI failure: Prisma's 5000ms interactive-transaction default was exceeded writing
the operating workbook's ~28k-record state blob under CI's shared-runner
contention, error P2028; raised to 15s in the shared `withTenantContext` helper
used by every gateway), #65 (corrected that fix's test docstring to describe a
configuration assertion, not a timeout reproduction), #54 and #55 (csv-parse and
vitest dependency bumps), #56 (API path validation plus a stable prescreen-actor
role-order idempotency fingerprint), #57 (Graphify local-artifact retention
policy, resolves issue #40), #60 (opt-in ephemeral-PostgreSQL verification
runner, independent of the shared local `clarity_dev`), #61 (this pass's own
preservation and disposition record), #62 (gstack skill-routing addition to this
file's own house rules). Closed: **PR #30** (held network-enrichment runtime
slice, 2,483 changed files) as superseded — its contract-only portion already
landed via #48; the runtime portion (service, persistence/outbox, API routes,
UI, the `agent_bridge` tree) was never reviewed and remains unimplemented,
preserved in the local recovery bundle and the closed branch's history if it is
wanted later. **Bridge: retired** as of this same pass (PR #66) — PR #30's
closure unblocked AI_OPERATING_MODEL_PLAN.md's Stage 0.1–0.3: `agents/bridge/`
and the root `agent_bridge/` notification mirror both moved, byte-identical, to
`docs/experiments/2026-07-agent-bridge/` per
[ADR-0017](docs/architecture/ADR-0017-agent-operating-model-and-bridge-retirement.md);
no live listener, dispatch script, or `npm run bridge:*` entry point exists.
Verified that session (PR #64, after the fix, three consecutive full CI passes on
the same revision): full root suite **617/617** (58 files), app suite **96/96**,
lint clean, typecheck clean, `prisma validate` clean, `npm audit
--audit-level=high` clean (the 3 moderate advisories it had flagged, in
`vitest`/`@vitest/mocker` and `csv-parse`, are resolved by #54/#55). Every merge
above has its own passing required `verify` CI check on its exact merged
revision, and `main`'s own post-merge CI passed after each one.

**2026-09-09: Working operating workbook and payment tools implemented locally.**
The authenticated RevOps client now opens populated operations, rather than the
scope-definition banner. It imports 31 accepted-source tables / 28,301 synthetic
records, recalculates all 47 numeric MONTHLY outputs, persists validated input
corrections and new payer/service/contract records, and preserves report snapshots.
The parity suite checks 47 metrics across 12 months plus the year: 611 matches.
Louisiana Medicaid per-diem scenarios use 1,126 archived official rows; commercial
scenario methods and the FY2026 Medicare wage-adjusted base component are implemented.
All-in Medicare pricing, real provider binding, financial close, new receipt/reversal
commands, remaining report/detail parity and production readiness are not complete.
See [runtime verification](docs/testing/REVOPS_OPERATING_MVP_VERIFICATION.md) for
tests, architecture boundaries and exact remaining work. Earlier status entries
below are historical and are superseded only for the implemented scope here.

**2026-09-09: Restored workbook accepted; full parity and sourced financial-rate implementation authorized.**
Tyler explicitly accepted **Dunder Mifflin Hospital - Restored Operations 2026**.
The mapped and currently checked SHA-256 is
`6e81bd61950c244e607ed03f8b0f13e1a4d0bea366ee7ad7cc54c053ef90de26`.
See the [acceptance record](docs/product/RESTORED_WORKBOOK_ACCEPTANCE.md).
The prior owner-acceptance gate is closed. MVP/interface updates, every mapped
workbook parity gap, and official financial-rate implementation are authorized.

**Implementation status:** the existing census/budget/staffing/close/export work
below remains a reusable partial implementation. Full IP/IOP activity, effective
payer/contract pricing, role costs, invoices, collections, forecasts, and complete
reporting parity remain undelivered unless supported by a subsequent scoped
implementation and verification entry. The existing UI definition is not proof
that the full accepted MVP has been delivered.

**Next work:** retain IOP review as one increment and start the financial source,
rate-version, payer-distinction, and calculation lane in parallel. The Louisiana
hospital provider identifier is pending only for its facility-specific calculations
([OD-19](docs/decisions/OPEN_DECISIONS.md)). Budget, actual activity, modeled
reimbursement, billed amounts, forecasts, and posted collections stay distinct.

**Evidence limits:** this acceptance record includes a current file-hash check;
native workbook mutation tests were not rerun. Historical native tests concern
another byte version. Owner acceptance does not promote those results, application
parity, rate calculations, or production readiness to verified. Patient/operating
data remain synthetic; official financial reference data and calculation development
are in scope.

**Implemented interface correction — 2026-09-09 (superseded 2026-09-12):**
An expandable RevOps scope register identified the accepted full MVP and
displayed coverage by operating domain. The
[RevOps client](app/src/workspaces/RevOps.tsx) defaults to January 2026 while
retaining other reporting years. Seven focused RevOps tests, scoped ESLint,
and the app build passed. Authenticated desktop/mobile checks verified the
defaults, expandable scope, and layout at the time. These results verify the
interface change as it stood then; they do not verify financial-rate engines
or full workbook parity. See the historical
[verification record](docs/testing/REVOPS_ACCEPTED_SCOPE_VERIFICATION.md).
The standalone scope register (`RevOpsScope.tsx`) was superseded by the
populated Operations/Rates tabs described above and removed as unused dead
code on 2026-09-12; no replacement banner UI was added.

**2026-09-12 documentation recovery (historical proposals):** the [governance recovery record](docs/developer-handoff/GOVERNANCE_DOCUMENT_RECOVERY_2026-09-12.md) preserves July proposals and explains the normal merge of the workbook dependency. DEV-R1 remains unapproved. This documentation slice preserves the accepted workbook evidence and authority above; it adds no runtime implementation, agent launch, deployment, or fresh runtime-test claim. The dated verification records remain scoped to their original work.

**2026-09-06: Rev Ops patient-day slice merged; synthetic verification, not deployed.**
[PR #49](https://github.com/henrytylerhebert-eng/clarity-platform/pull/49) merged
as `926b3776ae25df536ad3d2254d51c6d8019aff0a` after latest-head CI passed.
The synthetic `/rev-ops` workflow now covers
hospital/unit setup, delegated access, configurable cost center, budget
upload/manual draft and approval, actuals upload/manual entry, accountable
correction, period close/reopen and full/phased comparisons. Persistence,
source history, optimistic concurrency and server-enforced tenant isolation
are implemented. Forecast, collections and event-level stay counting remain deferred.

Tyler completed the owner walkthrough and authorized a test/debug pass. Current
verification: 480 root tests, 67 app tests and four Rev Ops browser journeys passed
after review fixes; all 20 legacy browser checks passed in the preceding debug pass.
Typecheck, full source lint, app build, Prisma
validation and diff checks passed. A real API restart preserved the full workspace
and all audit revisions. Debugging fixed import validation/provenance, stale UI
state, budget amendment handling, setup ambiguity and server logout; an additional
migration protects history from application-role updates/deletes. Stale legacy
selectors and an intermittent prescreen fixture collision were corrected.
The subsequent review reproduced and fixed a ZIP entry-count validation bypass
and cascading audit-reference rewrites. Complete ZIP directory validation and a
fourth forward migration now protect those paths; both regressions pass.
The final import fix replaces full workbook-model loading with a bounded,
namespace-aware scalar reader, covering unused-sheet expansion and the original
sample's namespace compatibility failure. The original workbook now passes upload,
approval, correction, replay and reload without modification. Authorization and
migrations were unchanged in this final fix.
See [verification and remaining gates](docs/testing/REV_OPS_PATIENT_DAY_VERIFICATION.md).
This is local synthetic proof, not production readiness or whole-product completion.

**2026-09-07: Onboarding and additional fields — merged with synthetic verification.**
[PR #50](https://github.com/henrytylerhebert-eng/clarity-platform/pull/50) merged
as `c5e41132aabdf0d13f984400015cc1ca19082e03`. Administrators can save/resume setup and
define bounded text/select fields for setup, budgets and actuals. Manual entry
and imports share validation; values retain definition snapshots, metadata-only
corrections are audited, and renamed/archived fields preserve history. The UI
shows onboarding progress from saved state and retains the preview revision at
import confirmation. Existing tenant transactions and JSON storage are reused;
no schema, migration, dependency or new service was added.

Verification after PR #50 review: 493 root tests, 68 app tests, six desktop/mobile journeys, lint,
typecheck, build, Prisma validation and dependency audit passed. API restart
preserved two field-enabled workspaces and the original PR #49 sample, with
identical saves remaining no-ops after PostgreSQL JSONB round-trips. The original
unmodified XLSX still passes upload/correction/replay. See the
[verification record](docs/testing/REV_OPS_ONBOARDING_FIELDS_VERIFICATION.md) and
[scope brief](docs/product/INPATIENT_REV_OPS_ONBOARDING_FIELDS_BRIEF.md).
The review fixed an import mapping-mode replay collision and a client-test build
failure; CI's existing typecheck now includes app code. The verification record corrects the
earlier build claim. The owner authorized merge after the agent walkthrough/review;
[post-merge CI passed](https://github.com/henrytylerhebert-eng/clarity-platform/actions/runs/34152431610).
This is not a production Rev Ops deployment. Sensitive-field
permissions and organization-wide field sharing remain deferred. Budget, actual
activity, forecast and collections remain separate.

**2026-09-07: Census-upload reconciliation — merged with synthetic verification.**
Tyler approved the [bounded workflow](docs/product/INPATIENT_REV_OPS_IMPORT_RECONCILIATION_BRIEF.md).
PR #51 merged with owner authorization as `dc43505`;
[post-merge CI passed](https://github.com/henrytylerhebert-eng/clarity-platform/actions/runs/34155541255).
Reviewers can compare saved/incoming rows, choose keep/use with reasons, commit
atomically and inspect a durable receipt. Entry-only users cannot commit conflicts,
including all-keep batches. The server binds decisions to reparsed input and current
workspace revision; repeat accepted imports return the original receipt without
replacing later corrections. Existing transactions, journal and import keys are
preserved; no schema, migration or dependency changes.

Local verification: 502 root tests after review regressions, 71 app tests, eight desktop/mobile journeys,
lint, root/app typecheck, app build, Prisma validation and dependency audit passed.
The synthetic receipt is 1 inserted / 2 corrected / 4 unchanged / 1 kept, for +5
patient days. API restart preserved both workspaces, complete histories and original
receipts; subsequent replay remained a no-op. The original unmodified XLSX also
passed upload/correction/replay. See the
[verification record](docs/testing/REV_OPS_RECONCILIATION_VERIFICATION.md).
The scoped review found no blocking defect. Added failure injection proves a receipt
write failure after the workspace update rolls back the entire transaction; forged
authority fields and legacy-path conflict bypass are rejected. Production gates remain separate; forecast and collections are outside this slice.

**2026-09-07: Month-end readiness and accountable close — merged in PR #52 (`c9a00bd`), synthetically verified.**
The [approved slice](docs/product/INPATIENT_REV_OPS_MONTH_CLOSE_BRIEF.md) requires
all calendar dates and an approved budget before closing. Leap years use the existing
calendar rules. Closing saves a fixed budget/actual/source receipt in the existing
transaction and journal; reopening preserves it, and the next close creates a new
version. Legacy closed months remain readable without fabricated receipts.

Verification: 512 root tests, 76 app tests, ten desktop/mobile journeys, lint,
typecheck, build, Prisma validation and dependency audit passed. Receipt-failure
injection rolls back the entire close. Two complete workspaces and histories
survived API restart; four repeat closes remained no-ops. No schema, migration or
dependency change. See the [evidence record](docs/testing/REV_OPS_MONTH_CLOSE_VERIFICATION.md).
Production readiness, forecasts, collections and further expansion remain outside
this bounded proof.

**2026-09-08: Operational census receipt export — implemented locally; pending review, not merged or deployed.**
Tyler authorized the [bounded export workflow](docs/product/INPATIENT_REV_OPS_EXPORT_BRIEF.md)
and Daily Midnight Census Count definition v1. Future receipts snapshot the metric
and historical hospital identity; legacy definitions stay unrecorded. Explicitly
delegated users can review/download selected original or revised receipts, with
fresh server authorization, source hashes, bounded values-only workbooks and
separate durable export events. Existing budget selection remains unchanged.
Hospital-specific inclusion rules, production retention/limits and real-data use
remain unverified. No schema, migration, dependency or MiroFish changes.
See the [verification record](docs/testing/REV_OPS_EXPORT_VERIFICATION.md) for exact
checks and remaining gates. This is synthetic implementation evidence, not a pilot.

**As of 2026-08-23 (AI operating model merge and PR #43 reconciliation)**
on branch `docs/session-close-2026-07-29` after merging current `origin/main`.

- **AI operating model plan merged (PR #33).** Five active review-thread
  blockers were fixed and resolved on 2026-08-23: AGENTS.md remains
  authoritative over repository policy, ADR collision checks fetch/query open
  PR refs before `git log --all`, graph maintenance is skipped unless
  generated from the canonical checkout or normalized/excluding tooling, Stage
  1 precision bands now cover the 0.3–0.499 and zero-denominator cases, and the
  dated handoff no longer points operators at closed issue #34 as the live
  merge blocker. GitHub CI `verify` passed on PR #33 before merge.
- **PR #43 reconciliation.** The July regulatory-reference session notes below
  are preserved as historical status instead of replacing the newer 2026-08-10
  prescreen reconciliation block. The project-state block in `CLAUDE.md` now
  carries forward OD-13, OD-14, the dev-tool-only boundary for the regulatory
  corpus tool, and the graph-determinism issue without reviving stale PR #33,
  PR #32, issue #34, or audit-gate blockers.

**Verification this session:** docs-only conflict reconciliation; no product
code, schema, migration, runtime, generated graph output, PHI/PII, or secrets
changed. `git diff --check` must pass before push; CI is the authority after
this branch updates.

**As of 2026-08-10 (PR #32 review-response and main-reconciliation session)**
on branch `codex/om/prescreen-phase3-fix` (pushed to PR #32's head,
`claude/prescreen-phase3-persistence`). Two things landed:

1. **Closed both Gemini Code Assist review findings on PR #32.**
   `saveAssessmentDraft` and `submitPrescreen` now catch raw Prisma `P2002`
   unique-index contention (racing duplicate `assessmentVersionId`; racing
   duplicate submission on the same encounter) and map it to
   `PrescreenDomainValidationError` instead of letting a raw Prisma error
   escape the gateway — mirroring the pre-existing
   `isAssessmentIdUniqueViolation` pattern. Two new concurrency tests fire
   racing requests with distinct idempotency keys (a real DB-level race, not
   an idempotency replay) and assert exactly one winner, one domain-typed
   loser. Both review threads replied to and resolved.
2. **Brought PR #32 current with `main`** (was 6 commits / ~3 weeks behind;
   GitHub reported `mergeable: CONFLICTING`). Merge conflicts were confined
   to `CLAUDE.md` and `IMPLEMENTATION_STATUS.md` narrative — both resolved by
   interleaving history rather than picking a side. The merge also surfaced
   a real collision needing a code fix, not just a doc reconciliation: PR
   #36's new `contract-schema-enum-sync.test.ts` (Stage 0.4, landed on `main`
   after PR #32 branched) didn't know about the six prescreen schema enums
   PR #32 added (`PrescreenEncounterStatus`, `PrescreenAssessmentStatus`,
   `PatientWillingness`, `PossiblePathway`, `PrescreenReadinessTarget`,
   `PacketRequirementState`). Verified each against its domain-contracts
   array member-for-member before classifying all six as `MIRRORED` — no
   desync, just an invariant test that predated the enums it now covers.

**Verification this session:** root **435/435** (40 files, up from 353 on
PR #32's prior head and 388/389 on `main`'s prior head — the merged sum),
app **64/64**, lint, typecheck, `prisma validate` pass, zero residue delta
(28 orgs/15 cases, stable across every run this session — matches the
2026-07-29 session's recorded count exactly).

**Known gaps, both flagged, neither fixed here:**
- The required "verify" CI check did not trigger for the Gemini-fix push
  (confirmed via two direct GitHub API queries on the commit SHA, ~1 min
  apart: `total_count: 0` workflow runs). Cause undetermined — the merge
  commit's push may resolve it, or it may need repo Actions-settings review.
- `npm audit --audit-level=high` now reports 2 new high-severity findings
  repo-wide, disclosed after PR #37's audit-gate fix landed on 7/29:
  `brace-expansion` (a follow-up CVE past PR #37's 5.0.8, already has an
  open Dependabot fix, PR #44) and `nanoid` (<3.3.17, no open fix yet). This
  blocks every PR's CI right now, not specifically #32; left for the owner
  rather than bundled into this PR's diff.
- `graphify-out/` on this branch was found built from the wrong worktree
  (2,454 files pinned instead of the repo's 6,537 — same failure mode
  tracked by issue #40) and was NOT refreshed/committed here to avoid an
  unrelated 1.7M-line diff riding along with this fix.

**As of 2026-07-29 (regulatory-reference session, second half)** on `main`.
Two further merges after the block below: PR #41 (CMS research prompt + Phase 2
policy-index packet) and PR #42 (regulatory corpus tool). PR #33 (operating
model plan + ADR-0017) had seven review findings fixed in this session; five
later review blockers were resolved and PR #33 merged on 2026-08-23.

- **CMS regulatory reference, Phase 1 (PR #41).** A deep research prompt at
  `docs/legal/GEMINI_DEEP_RESEARCH_PROMPT_CMS_MEDICARE_MEDICAID.md`, following
  the house pattern of the LA OPC/PEC/CEC prompt. Its organising idea is that
  most CMS guidance is interpretive and each organization writes its own
  policies, so every returned requirement must be classified
  BINDING-SPECIFIC / BINDING-INTERPRETIVE / ORG-DISCRETION / NOT-APPLICABLE,
  and the interpretive and discretionary ones must state concretely what an
  organization has to decide and show a surveyor. The consolidated form of
  that — "the interpretation map" — is the specification input for Phase 2.
  **The research has NOT been executed** (OD-13). The surface enumeration is
  authored from model knowledge and marked `Assumed`, not a verified inventory.
- **Phase 2 captured, not designed (PR #41).**
  `docs/decisions/ORG_POLICY_INDEX_DECISION_PACKET.md` records the
  per-organization AI-native policy index at decision-packet altitude, notes it
  sits on the controlled-extraction and AI-agent steps at the END of the build
  sequence, and names five risks needing owner rulings: cross-tenant leakage
  through shared vector retrieval (nearest-neighbour search does not naturally
  respect a tenant predicate), policy-as-reference vs policy-as-authority,
  possible FDA clinical-decision-support scope, who authors default
  interpretations, and version staleness. Registered as OD-14.
- **Regulatory corpus tool (PR #42).** `scripts/regulatory-corpus/` collects
  federal regulatory text, stores it, and detects change. API-first: eCFR and
  the Federal Register both publish documented APIs, so nothing is scraped.
  Update detection does not diff text — the eCFR versioner exposes a
  per-section `amendment_date`, so `check` reads one request per title plus one
  per part and exits 2 on drift. `amended` and `content-changed` are reported
  separately so an editorial hash change cannot masquerade as an amendment.
  Tracked manifest/index/change-log; raw payloads in gitignored
  `.regulatory-cache/`. robots.txt is enforced locally (cms.gov publishes
  `Disallow: /*?`). Federal Register lookups return candidates for human
  confirmation, except RIN `0938-AU87` which was verified live and resolves the
  CMS-0057-F family exactly. **Live run: 17/17 sources retrieved.** 28 unit
  tests, none performing network I/O.
  **Scope boundary:** development tooling — no `@prisma/client`, no database,
  no patient or tenant data, and NOT a deployed worker. Scheduling remains an
  owner decision per the standing worker/deployment constraint.
- **PR #33 review findings from this session (seven, all valid).** Two were
  documents making false claims about themselves: ADR-0017 advertised R1 as
  "read-only by tool allowlist" while the plan disclaimed exactly that, and the
  ADR-collision check piped filenames to bare numbers through `sort -u`, which
  collapses the duplicate it is hunting — the plan asserted three collisions
  while shipping a command incapable of finding one. A **P1** had the handoff
  telling an operator to replay the FIX commits (`346ee85`, `1470e00`) rather
  than the vulnerable parents (`ad1b7e9`, and `1470e00`'s parent), which would
  have handed R1 already-fixed code and recorded a false no-go. Also fixed: T1
  has no contract (now a Stage 3 entry gate), R2's write targets were
  summarised as three when the contract lists four, Stage 1's outcome bands
  overlapped at exactly two findings, and the handoff blocked Stage 1 on all
  four Stage 0 sub-items when the plan requires only 0.1–0.3.
- **Verification on `main` at that session close:** root **416/417**, app
  **64/64**, lint, typecheck, `prisma validate`, `npm audit` clean. The single
  root failure was the shared-`clarity_dev` migration-ledger contention (issue
  #31); CI's ephemeral Postgres passed that step. Synthetic residue zero delta
  across runs (28 orgs / 15 cases / 28 users).
- **New issue:** #40 — `graphify-out/` is tracked but keyed by absolute
  worktree paths, so the CLAUDE.md-mandated `graphify update .` rewrites
  thousands of path entries from any worktree other than the one that last
  generated it. Needs a decision between untracking it, making it
  path-independent, or naming one canonical worktree.

**As of 2026-07-29 (merge-gate and CaseStatus-ruling session)** on `main`
after three merges: PR #37 (dependency audit), PR #36 (Stage 0.4 enum-sync
test), PR #38 (ADR-0018 `MEDICAL_TRANSFER_REQUIRED`).

- **Merge gate restored (PR #37, closes issue #34).** `npm audit
  --audit-level=high` had been failing on every PR — including docs-only
  ones — against two transitive dev advisories (`brace-expansion` <=5.0.7,
  `postcss` <=8.5.17), blocking all merges. Both fixed versions were already
  inside the ranges their parents declare, so the fix is lockfile-only: no
  `overrides` pin and no `package.json` change. Three packages moved
  (`brace-expansion` 5.0.8, `postcss` 8.5.25, `nanoid` 3.3.16).
- **Contracts↔schema enum mirror is now a machine check (PR #36, Stage 0.4).**
  `tests/unit/contract-schema-enum-sync.test.ts` classifies every schema enum
  as MIRRORED or NOT_MIRRORED and asserts membership as a set. Two parser
  defects found in review were fixed with regression tests: members carrying
  Prisma field attributes (`ACTIVE @map("active")`) were silently dropped, and
  indented `enum` declarations were skipped whole — each would have let the
  suite pass while enforcing nothing for the affected enum.
- **`CaseStatus` desync reduced from two values to one (PR #38, ADR-0018).**
  Owner ruled the two orphaned values separately because they are not
  symmetric. `MEDICAL_TRANSFER_REQUIRED` is mirrored as a non-terminal
  diversion: enterable from the review/routing span, exiting to any
  `ACTIVE_ORDER` state (including `CLOSED`), deliberately NOT a member of
  `ACTIVE_ORDER`, rationale mandatory. `RETURNED_FOR_MORE_INFORMATION` stays
  deferred and unrepresentable — it presumes an external returning actor,
  which belongs to the open cross-organization submission/receipt packet — and
  remains pinned in `KNOWN_DESYNC` against issue #35. No migration: the schema
  already declared both values.
- **Known limitation recorded, not resolved:** `TransitionCase` is permitted to
  `INTAKE_COORDINATOR` and `ORGANIZATION_ADMIN`, neither of which is a
  clinical role, so a non-clinician can set `MEDICAL_TRANSFER_REQUIRED`.
  Narrowing this needs a per-target-status role mechanism that does not exist.
  See ADR-0018 Consequences.
- **Verification this session:** root **388/389**, app **64/64**, lint,
  typecheck, `prisma validate`, `npm audit` clean. The single root failure is
  `tests/integration/migration-integrity.test.ts`, which fails locally only
  because the shared local `clarity_dev` carries 4 migrations belonging to the
  #30 and #32 branches (issue #31); a read-only ledger query confirmed that
  excluding those 4 rows leaves this branch's 12 exactly, in order, all
  finished and not rolled back. CI's ephemeral Postgres passed the root-test
  step on #36, #37, and #38. Synthetic residue showed zero delta across suite
  runs (28 orgs / 15 cases / 28 users before and after); the standing count
  exceeds issue #24's recorded 7/4 because of accumulation by other worktrees
  and nothing was deleted.
- **Owner rulings this session:** PR #30 (network-enrichment, 2,483 files /
  +1.4M lines, stale CI, expands the `agent_bridge/` tree that ADR-0017 would
  retire) is **held for owner review** — not merged, not edited. Consequently
  AI-operating-model Stage 0.1–0.3 remain HELD, since they rewrite the four
  files #30 touches.
- **Still open:** PR #33 (operating-model plan + ADR-0017) carries four
  unresolved P2 review findings, including an ADR claim that R1 is read-only
  which the plan's own residual-risk text contradicts. PR #29, #32 remain
  open; #18 is draft.

**As of 2026-07-19 (prescreen Phase 3 persistence session)** on branch
`claude/prescreen-phase3-persistence` (from `main` 8399edd, PR pending).
The owner authorized **local-only Phase 3 prescreen persistence** on the S2
precedent — explicitly not the provider-backed Cloud SQL/RLS gate, which
stays open. Delivered (ADR-0016): the prescreen gateway contract is async;
command contracts moved to `domain-contracts` (re-exported unchanged);
four tenant-scoped prescreen tables + a nullable idempotency
`requestFingerprint` column (two migrations, OD-6-shaped RLS on the new
tables); `PrismaPrescreenGateway` in `case-repository` (one tenant-context
transaction per command; namespaced keys `prescreen/<command>/<actor>/<key>`
with the shared ADR-0014 §5 fingerprint; replay reconstructs the original
result; governed-event/outbox storage reuse — no vocabulary expansion; real
tenant-checked `caseId` FK with non-revealing misses). The 9 prescreen HTTP
tests and the dev server now run on the persistent gateway — prescreen
state survives a restart. Session verification: root **353/353** (38
files, three consecutive runs — includes 10 new persistence proofs:
durability across clients, cross-connection replay, nested-body conflict,
one-winner concurrency, zero-residue failure, fail-closed RLS under a
NOBYPASSRLS role), app **64/64**, lint, typecheck, `prisma validate`; zero
residue from this session (pre-existing residue now 26 orgs/13 cases, all
from other sessions — issue #24 updated). Deviations, both tracked: the
two migrations were applied via the Prisma hotfix flow because unmerged
network-branch migrations occupy the shared ledger (issue #31, new), and
the migration-integrity test now asserts its stated intent (repository ⊆
ledger, none rolled back) until #31 resolves. ADR numbering: 0016 taken;
0015 left free for the network branch's collision fix (its PR #29
currently claims the already-assigned 0014). Not claimed: provider-backed
Cloud SQL/RLS, runtime-role app connection (dev connection is superuser),
fresh-ledger replay this session, outbox dispatch for prescreen events,
cross-org, UI, production readiness.

**As of 2026-07-19 (prescreen API-slice session)** on branch
`claude/clarity-opening-cfcdc5`, rebased onto `main` after the prescreen
hardening session (PR #27). The owner resolved the prescreen role-mapping
decision packet (ADR-0014: Option 3 narrow — `INTAKE_COORDINATOR` ≡
Central Intake, `PHYSICIAN_REVIEWER` ≡ authorized practitioner,
external/field roles deferred; first API slice same-organization only).
The same-organization prescreen HTTP slice is implemented on the existing
node:http server with the production role policy and the Phase 2
in-memory gateway. Post-rebase verification this session: root tests
**343/343** (including 38 prescreen-contract, 27 prescreen-service, and 9
new prescreen-API integration tests), app **64/64**, lint, typecheck,
`prisma validate`, zero synthetic residue from this session's runs against
local `clarity_dev`. Pre-existing synthetic residue from earlier sessions
(7 orgs / 4 cases) is tracked as a GitHub issue, not silently deleted.

**As of 2026-07-19 (prescreen hardening session).** Branch verification at the time: root tests **333/333** (including 38 prescreen-contract and 26 prescreen-service tests) against local `clarity_dev`; app tests 64/64; typecheck, lint, `prisma validate`, app build, and all 145 source-package checksums pass. Database residue counts were not remeasured in that pass.

**As of 2026-07-19** on `main` after the review-and-promotion session. Current verification evidence for this slice: root tests 268/268, app tests 64/64, typecheck, root lint, and `npm audit` (0 vulnerabilities) — run locally for PR #14 and re-run by the new CI `verify` job (Postgres-backed) on PR #15 before merge. Earlier bridge tests, app production build, and nested visualizer lint remain historical evidence and were not rerun in this pass. The exact branch, HEAD, and worktree state must be rechecked before each task. A capability appears in exactly one bucket. "Verified" means it ran in the current local verification pass unless a historical count is explicitly labeled.

## Current Clarity Persistence And Coordination Slice

- **S1 domain foundation:** episode identity/lifecycle, admission linkage, episode-owned utilization review, authorization outcomes, separate risk flags, governed envelopes, append-only corrections, explicit facility timezone lineage, draft metrics, synthetic fixtures, and deterministic tests are implemented and owner-accepted.
- **S2 bounded persistence:** episodes, case links, episode-owned authorization facts, documentation gaps, corrections, governed events, transactional outbox rows, Prisma gateways, and deterministic integration tests are implemented and independently verified.
- **H1 hardening:** nullable source-owned `programId` is aligned across contracts, event payloads, mapper, and persistence; concurrent acceptance-key replay is deterministic and conflicting reuse raises `IdempotencyConflictError`.
- **H3 hardening:** an additive partial unique index enforces one active admission-source episode per case at the database boundary; losing concurrent writes raise `ActiveAdmissionExistsError`. PR #14 fixed the H1/H3 database-uniqueness interaction. PR #21 closes the separate read-window race where an identical winner commits between the acceptance-key lookup and active-admission lookup; deterministic integration coverage forces that interleaving. Exact admission identity replays, while a different acceptance identity remains a conflict.
- **Migration integrity:** local migration ledger and H3 index verification are covered by a read-only integration test; local fresh-database replay/restore is verified, while provider restore and production promotion remain unverified.
- **Event vocabulary:** current bounded source-versus-derived boundary accepted; the three emitted S2 events remain in force, with a named synthetic staging consumer contract and no deployed external consumer.
- **OD-6 posture:** recommended shared-schema PostgreSQL and transaction-local RLS posture accepted; provider, pooling mode, runtime roles, provider-backed tests, and implementation authorization remain gated.
- **OD-6 bounded local RLS:** transaction-local context and additive direct-tenant policies for the episode persistence tables are implemented and verified against local `clarity_dev`; audit/idempotency/inherited-model coverage, provider-backed evidence, runtime-role deployment, and production rollout remain gated.
- **Provider/session choice:** Google Cloud SQL for PostgreSQL in `us-central1` with direct connections is recorded; no authenticated GCP account/project was available for provider-backed execution in this pass.
- **Local provider/security evidence:** the local PostgreSQL boundary has a dedicated `NOSUPERUSER NOBYPASSRLS` runtime-role proof and transaction-local isolation tests; this is technical synthetic evidence, not Cloud SQL or independent security acceptance.
- **Local migration recovery:** all 12 migrations replayed into a disposable local database and restored into a second disposable database with both ledgers reporting 12 successful migrations; Cloud SQL restore and production promotion remain gated.
- **Synthetic outbox runtime:** a tenant-scoped dispatcher and in-process consumer are verified for the accepted three event types, retry preservation, and concurrent row locking; `Bayside Hospital Clarity Intake Receiver` is named as the first consumer contract, but external consumer/runtime delivery remains gated.
- **H2 governance:** the RLS tenant-enforcement, migration promotion/recovery, and outbox ownership records now contain bounded recommended operating designs. Local fresh migration replay/restore and synthetic outbox delivery are verified; provider-backed or production RLS, production migration promotion, external workers/consumers, APIs, and deployment remain unauthorized.
- **Workflow Discovery Protocol:** documentation-only requirements-acquisition package and inference-complete synthetic protective-custody session are committed under `docs/discovery/`. They preserve source, assumption, derived, review, and implementation boundaries; they do not add runtime behavior or promote inferred facts to verified domain truth.
- **Bridge:** the active repository-relative Antigravity file-mirror watcher is detected as `listener=running`; direct Antigravity CLI and agent consumption remain unverified.
- **Repository promotion and governance (2026-07-19 session):** the verified slice was promoted to protected `main` via PR #13 (reviewed, merged 7345dd8). PR #14 cleared all Dependabot alerts (vitest ^3.2.6, vite ^6.4.3, @playwright/test ^1.55.1; `npm audit` clean) and carried the H1/H3 replay-classification fix. Redundant PRs #6/#10/#11/#12 were closed as superseded; docs PRs #8 (operating manual + session rules) and #9 (MVP roadmap) were merged. PR #15 added the CI `verify` workflow (lint, typecheck, root + app tests against an ephemeral `clarity_dev` Postgres 16 service, Prisma validate/generate/migrate deploy, high-severity npm audit) and it passed on its own PR before merge. The §3a solo-maintainer protection is now live: PR-only, 0 required approvals with documented self-review, required `verify` status check (strict), conversation resolution, admin enforcement. CI closes the former OD-9 toolchain gap; hosting/backup portions of Phase 6 remain open.

## Prescreen product slice (2026-07-19 session)

- **Package onboarding (PRs #17 and #20):** `clarity-prescreen-integration-package-v1.0.0` is preserved under `reference/source-packages/` with provenance recorded. PR #20 restored `code/tests/transport.test.mjs` to its manifest bytes; all 145 checksums and the 31 reference tests now pass. Historical schema/OpenAPI/fixture evidence was not re-run because no runnable validation script ships.
- **Phase 1 contracts (PR #19 plus post-merge hardening):** repo-native prescreen contracts in `packages/domain-contracts/src/prescreen.ts` — willingness, four-domain orientation + gate, possible-pathway derivation (medical-stabilization precedence; routing hints, never decisions), encounter/assessment lifecycles, target-scoped packet readiness (named gaps, no aggregate score), fail-closed consent-authority and transport-qualification evaluators over configured rules, stable error codes, and an event envelope limited to the six command-coupled event types. Conservative review hardening routes NON_OPPOSED to authorized noncontested review, fails closed on missing privacy regime or overlapping approved consent rules, disqualifies providers with unresolved restrictions, and requires both sending- and receiving-facility approval. 38 unit tests.
- **Phase 2 command service (PR #23, ADR-0013):** `packages/prescreen-service` — six commands (StartPrescreenEncounter, SaveAssessmentDraft, AttestAssessment, CreateAssessmentSupplement, SubmitPrescreen, UpdatePacketRequirement) plus the read-only EvaluateTargetReadiness view, behind strict envelopes → injected explicit role policy → an atomic in-memory gateway (tenant-scoped reads, fresh-row state machine, versioned update, audit + outbox + idempotency committed together; failed commands leave zero residue — proven by test). Canonical recursively-sorted SHA-256 idempotency fingerprints close the reference package's nested-body replay defect. Submission records intent only: no acknowledgement, review, acceptance, admission, transport authority, or cross-organization access is expressible. 27 tests (includes the ADR-0014 §5 fingerprint-amendment test) covering all fourteen owner completion criteria plus post-merge review hardening (`docs/testing/PRESCREEN_SERVICE_TEST_MANIFEST.md`).
- **Role mapping resolved + same-org API slice (this branch, ADR-0014):** the owner ruled Option 3 narrowly — exactly two equivalences (`INTAKE_COORDINATOR` ≡ Central Intake coordinator; `PHYSICIAN_REVIEWER` ≡ authorized practitioner, PMHNP signer authority as configured policy, matrix-conditional capabilities excluded fail-closed), external/field roles deferred to the cross-org design, no enum change. `PRESCREEN_PRODUCTION_POLICY` (compile-checked against `UserRole`) + seven HTTP routes on the existing node:http server: strict bodies mirror the envelopes minus every server-derived field (`organizationId`, `actor`, `occurredAt`, and for submit `receivingOrganizationId` — all principal-derived/server-stamped; supplying any is a 400, and cross-org submission is structurally inexpressible). Stable error-code → status mapping (403/404/409/400, content-free). Phase 2 amendment: the idempotency fingerprint excludes `occurredAt` so HTTP retries replay instead of conflicting; nested-body conflicts unchanged. 9 integration tests over real HTTP with DB-backed auth (`docs/testing/PRESCREEN_API_TEST_MANIFEST.md`).
- **Phase 3 persistence (this branch, ADR-0016):** owner-authorized local bounded slice. Prescreen state persists in `clarity_dev` behind `PrismaPrescreenGateway` and survives restart; RLS (ENABLE+FORCE, fail-closed) covers the four new tables; all Phase 2 guarantees re-proven against Postgres (10 persistence tests + the 9 HTTP tests on the persistent gateway). See `docs/implementation/PRESCREEN_PHASE3_PERSISTENCE_IMPLEMENTATION.md` and `docs/testing/PRESCREEN_PERSISTENCE_TEST_MANIFEST.md`.
- **Not claimed for the prescreen slice:** provider-backed Cloud SQL/RLS evidence (separate, non-waived gate), runtime-role deployment for the app connection (local dev connection is superuser and bypasses RLS; the proof used a NOBYPASSRLS role), outbox dispatch/delivery for prescreen events, UI, cross-organization collaboration, roles beyond the two ruled equivalences, PMHNP scope configuration, clinical/legal approval of any rule content, production readiness.
- **Open decision packets:** the cross-organization submission/receipt model (successor to the resolved role-mapping packet — blocks field-originated prescreens and any external-actor work); consent-rule specificity ordering and fractional-age representation remain domain-review follow-ups in ADR-0013 (until an ordering policy is approved, overlapping consent rules fail closed).

## Completed (verified working)

- **API vertical slice** (`packages/api-service`, pre-decision ADR-0012 spike): the first HTTP entry point uses `node:http` and exposes login/logout/session plus `POST /api/cases/{caseKey}/decision-rationale`. Tenant and actor roles are derived exclusively from the verified principal (`AuthenticationService.authenticate` -> `actorFor`); there is no request field through which a caller can supply either, and unknown body fields are rejected (400). The slice proves one authenticated path from the prototype UI to the command service and Postgres audit trail. It does **not** resolve ADR-0012, which still proposes Fastify and requires owner approval. Verified: 8 API integration tests within the current 258-test root suite; app suite 64/64.

- **Authentication** (`packages/auth-service` + `PrismaAuthGateway`, ADR-0011 — MVP_ROADMAP Phase 3): server-side sessions over the existing `User`/roles model — opaque 32-byte bearer tokens stored only as SHA-256 hashes (returned exactly once, never audited), 8h default expiry, audited timestamp revocation (`SESSION_ISSUED`/`SESSION_REVOKED`, the first organization-level audit events with null caseId); `IdentityProvider` port (managed-IdP/OIDC adapter is deployment-phase work; dev provider is local-only, no passwords stored anywhere); the `principalToActor` bridge sources roles FROM THE DATABASE, retiring the trusted-caller-roles assumption at the authentication boundary (fully dead when the API layer is the sole entry — ADR-0012 Proposed); deactivating a user kills live sessions on the next request; all authentication failures are one indistinguishable error. Permission suites re-run against real session-derived principals. Migration `auth_sessions`. Verified: 8 integration tests, full suite **185/185**, app 37/37, zero residue.

- **Authorization readiness — preparation phase** (`packages/authorization-service` + `PrismaAuthorizationGateway`, ADR-0010 — MVP_ROADMAP Phase 2): RecordAuthorization (initial status DERIVED from the cited benefit quote: required→NOT_STARTED, not-required→NOT_REQUIRED, unknown→rejected; one record per coverage+LOC), TransitionAuthorizationPreparation (structurally limited to PREPARING/NOT_REQUIRED/UNABLE_TO_COMPLETE — SUBMITTED unreachable until the submission phase behind `assertHumanSubmitter`; existing state machine revalidated in-transaction; rationale required off the normal path), and AssessAuthorizationReadiness (pure derived per-coverage view: requirement + named gaps + statuses, **no aggregate score** per the readiness doctrine, verified by test). Migration `authorization_tenancy_and_versioning` (Authorization: organizationId, version); contract addition LEVELS_OF_CARE. Verified: 10 integration tests, full suite **177/177**, app 37/37, zero residue.

- **Manual insurance and benefits verification** (`packages/benefits-service` + `PrismaBenefitsGateway`, ADR-0009 — MVP_ROADMAP Phase 1): four commands (RecordInsuranceCoverage, VerifyEligibility, RecordBenefitVerification, RecordFinancialEducation) — human-performed only, no X12/payer APIs. Coverage requires ≥1 same-case APPROVED INSURANCE evidence item (the ADR-0008 review gate made structural); member/group/policy identifiers are structurally unacceptable input and stored nowhere (`*Encrypted` columns stay NULL until an encryption capability exists); eligibility attempts are immutable rows following the pre-existing eligibility state machine with version-guarded coverage rollup; benefit quotes are impossible to record without the not-a-payment-guarantee disclaimer and only against ACTIVE coverage; education records disclose uncertainties. Migration `coverage_tenancy_and_versioning` (InsuranceCoverage: organizationId, version). Contract correction: SUBSCRIBER_RELATIONSHIPS now mirrors the schema enum (CHILD → PARENT/GUARDIAN). Verified: 16 integration tests, full suite **167/167**, app 37/37, zero residue.

- **Evidence repository and human-review workflow** (`packages/evidence-service` + `PrismaEvidenceGateway`, ADR-0008): nine commands (CreateCandidateEvidence, CorrectCandidateEvidence, ApproveEvidence, RejectEvidence, RequestEvidenceClarification, SupersedeEvidence, CreateContradictionGroup, AddEvidenceToContradictionGroup, ResolveContradictionReview) — entirely human-driven, no OCR/extraction/AI. Evidence binds verbatim source text (immutable by construction) to the exact document version; every item starts CANDIDATE; approval is domain-scoped by category; corrections touch interpretation only; supersession freezes history in one transaction; contradiction groups make conflicts visible without resolving them; optimistic concurrency + idempotency replay (new `objectId` on idempotency records); audit metadata carries hashes and field names, never source text. Migration `evidence_review_and_contradiction_support` (EvidenceItem: organizationId, version, createdBy, creationMethod, reviewerNote, supersededById, evidenceFamilyId; new ContradictionGroup). Verified: 19 evidence tests, full suite **149/149**, app 37/37, zero residue.

- **Case foundation hardening** (this branch): (1) **Atomic assignee validation** (ADR-0005) — the AssignCase TOCTOU window is closed; assignee same-organization + `ACTIVE`-status checks run inside the command transaction and are re-asserted as a predicate on the conditional UPDATE itself; verified incl. a deterministic mid-transaction membership-change interleave (6 new tests). (2) **Reopen authority exact-named** — `ORGANIZATION_ADMIN` + mandatory rationale; `SYSTEM_ADMIN` provably cannot reopen; failed reopens write nothing. (3) **Lint baseline** (ADR-0006) — ESLint + typescript-eslint flat config, root `lint`/`typecheck` scripts, 0 errors. (4) Phase-0 milestone review (`docs/repository-audit/07_…`) and private-remote handoff guide (`docs/developer-handoff/…`); no remote exists, nothing pushed.
- **Document repository** (`packages/document-service` + `PrismaDocumentGateway`, ADR-0004 baseline + ADR-0007 hardening): four commands (UploadDocument, CreateDocumentVersion, ClassifyDocument, AccessDocument) behind the controlled-path pattern — strict envelopes, role policy, file validation (size/MIME/extension/filename, configurable), SHA-256 content-addressed dedupe, version families (migration `20260711141534`: `fileSizeBytes`, `documentFamilyId`; prior versions immutable), classification state machine (REJECTED terminal + rationale + distinct `DOCUMENT_REJECTED` audit), case-ownership checks, access auditing with VIEW/DOWNLOAD modes, sanitized filenames in audit metadata, and storage/DB **failure compensation** (bytes-first + compensating delete guarded by a reference count; `DOCUMENT_UPLOAD_FAILED`/`DOCUMENT_STORAGE_CLEANUP_COMPLETED`). Storage port has two adapters: in-memory and a dev-only `LocalFilesystemObjectStorage` (`.local-object-storage/`, git-ignored, traversal-proof opaque keys). Verified: 32 document tests (14 baseline + 18 hardening), full root suite **130/130**, app suite 37/37, zero residue. No OCR/AI extraction, no malware scanning, no cloud storage.
- **Case command service and workflow transition engine** (`packages/case-service`, branch `feat/case-command-service`): nine explicit commands behind one controlled path — strict envelopes, role policy (schema `UserRole` values), rationale rules, terminal-case protection, reopen gated to exactly `ORGANIZATION_ADMIN` with mandatory rationale (`SYSTEM_ADMIN` has no case-command rights), optimistic concurrency (`version` column + predicate), idempotency keys (`CommandIdempotencyRecord`), correlation ids, and audit events with previous/new state hashes — all atomic per command via the single approved Prisma gateway. Verified: 52/52 integration tests incl. all 12 required behaviors, full suite 91/91 (at the time; now 105/105 with document-service added). ADR-0003.
- **Tenant-scoped case repository** (`packages/case-repository`, branch `feat/tenant-scoped-case-repository`): Prisma-backed `CaseRepository` with organization scoping in every query/write predicate, atomic case-mutation + audit-event transactions, append-only audit writes with the restricted-identifier guard, optimistic concurrency on state transitions. Verified against local `clarity_dev`: 30/30 integration tests, 69/69 full root suite, cleanup leaves zero synthetic rows. See `docs/implementation/CASE_REPOSITORY_IMPLEMENTATION.md` and `docs/testing/CASE_REPOSITORY_TEST_MANIFEST.md`. **Audit integration: implemented** for case mutations (no DB-level immutability enforcement yet; no state hashes).

- `app/` crisis-path prototype: guided intake, drafts with prohibited-language guards, hash-chained custody ledger, compliance clocks (demo values), packet builder, simulated routing, bedboard, role-adaptive UX, and a read-only synthetic Product Studio registry. Current app suite 64/64; typecheck and production build pass. Frontend demo only (localStorage).
- **Louisiana e-PEC lifecycle** (Legal Status workspace): OPC issuance, PEC execution with a configurable exam-validity window check and a hash-sealed fingerprint, a bridge into the existing packet/routing pipeline for transmission and facility acceptance, and CEC execution (continue or discharge-forthwith) — all against a jurisdiction-configurable rule set (`epecRuleSets.ts`) so a second jurisdiction is a new config object, not a code change. Demo logic only; see `docs/legal/LEGAL_STATUS_ARCHITECTURE.md`.
- Canonical foundation Prisma schema: `prisma format` / `validate` / `generate` passed; migration `20260710233252_initial_clarity_foundation` generated and applied to local PostgreSQL 18.4.
- 3 synthetic cases validated (JSON + Zod synthetic-only schema).
- Repository audit trail (`docs/repository-audit/`), canonical doc set, ADR-0001/0002.
- Root safety/workflow test baseline: 39/39 passing.

## Scaffolded (contracts exist; no runtime behind them)

- `packages/domain-contracts`: shared state machines, audit helpers, payer-memory labeling, readiness dimensions, dark feature flags, and seed contracts. Case, evidence, benefits, authorization, document, and auth areas have implemented service foundations; remaining contracts without runtime must be evaluated individually rather than treating the entire package as scaffold-only.

## Documented only (no code)

- Model gateway, retrieval/citations, agent contracts (catalog only - files missing from package), packet approval workflow beyond demo, communications recording, analytics dashboards, production deployment topology, managed identity adapter, evaluation suites beyond the baseline, and expanded 43-model schema domains (WorkflowTask, ReferralPacket, etc.).
- **Clarity CIA integration bundle v1.0.0** (onboarded 2026-07-17 to `reference/source-packages/clarity_cia_integration_bundle_v1_0_0/`): Comprehensive Initial Assessment blueprint — 3-stage treatment-team workflow (field/crisis intake → nursing → social-services integration → final clinical review), 11-role permission model, restricted-capability signer rules, runtime JSON Schema, and orchestration prompts. Requirements it does not cover (per-facility exclusionary/inclusionary criteria and lab standards, physician→NP acceptance delegation, sending-facility nursing report artifact, ambient audio documentation assist) are captured in `docs/workflows/INTAKE_TO_ADMISSION_WORKFLOW.md`; the facility P&P/SOP ingestion pipeline is parked in `docs/roadmap/IMPLEMENTATION_ROADMAP.md` → Parking lot.

## Blocked

- **OD-1:** full master package v0.2.0 (72 of 87 files missing) — blocks re-verification of 12 summary-graded domains and the 7 missing synthetic cases.
- **OD-2:** counsel review of Louisiana statutory wording — blocks any legal-clock enforcement.
- **OD-3:** clinical criteria licensing — blocks necessity criteria mapping.

## Not started

- Production hosting for the app/API/database, managed identity-provider integration, production-wide RBAC/RLS enforcement, production object storage (S3/Blob), malware scanning, live evidence extraction, any live product agent, external integrations, test/lint/build CI, formatter toolchain, observability, and Node version pin. GitHub Pages publishes only the self-contained `docs/index.html` artifact and is not application deployment evidence.

## Requires clinical review

- Assessment content, guardrail vocabulary, bedboard compatibility heuristics, medical-necessity draft prompts.

## Requires legal review

- PEC/OPC/CEC instrument logic (implemented as demo logic, see Completed), compliance-clock configuration, custody/EMTALA language.

## Requires security review

- Everything in SECURITY.md "required controls"; any future integration or deployment.

## Requires developer decision

- OD-5 (API architecture), OD-6 (database hosting/RLS), OD-7 (pnpm/Turborepo timing), OD-8 (expanded-schema graduation), OD-9 (toolchain/CI).

## Next recommended action

**Current action (updated 2026-09-18, after Housekeeping Phase 3B).** **The historical
housekeeping cycle is closed.** Phases 1, 2B, 3A and 3B are complete. Phase 3B Gate A (PR #107)
isolated database-writing tests from the persistent developer database. Gate A.5 recorded the
residue reproduction (`PARTIALLY REPRODUCED`; the 2026-09-13 mechanism remains unknown). Gate B
rebuilt `clarity_dev` from canonical migrations, recreated only `synthetic-org-api-dev`,
proved isolation, and resolved issues #24 and #31. Local `codex/om/sync-main` is retired: its
exact tip is preserved on `origin/recovery/machine-only/2026-09-17/codex/om/sync-main`,
`origin/codex/om/sync-main` is untouched, and `recovery/machine-only/*` is never deleted.

**Current action (updated 2026-09-19, with the Access Snapshot UI): no Access step is queued; the next one is whatever the owner directs** (project `CLAUDE.md`: proceed "as directed by the user"). Access Slice 4B (pure Guidance Projection; manifest [docs/testing/ACCESS_GUIDANCE_TEST_MANIFEST.md](docs/testing/ACCESS_GUIDANCE_TEST_MANIFEST.md)), Slice 4A.1 (Case Read Model API) and the read-only Access Snapshot UI (PR #127; manifest [docs/testing/ACCESS_SNAPSHOT_UI_TEST_MANIFEST.md](docs/testing/ACCESS_SNAPSHOT_UI_TEST_MANIFEST.md)) are on `main`. OD-22 and OD-24 remain open. WorkItem persistence and Guided Intake convergence remain unauthorized, and so does any Access UI beyond this snapshot.

#### Phase 3 plan as written after Phase 2B — HISTORICAL (now executed)

The five Phase 3 steps were: diagnose the residue; rule on `synthetic-org-api-dev` (ruled:
canonical persistent fixture); remove run-scoped residue (done by rebuild); decide the #31
orphan ledger entries (removed by rebuild, never ported to `main`; legacy Network tables are dropped); apply
`20260917000100_iop_program_binding` (applied by clean replay).

**CLARITY ACCESS IMPLEMENTATION IS ACTIVE (2026-09-19).** Authorized and landed: Slice 4A.1, Slice 4B, Slice 3, Slice 2A. Still **not** authorized: an Access patient-journey refactor beyond those slices, scenario/rule
architecture, Guided Intake / Prescreen convergence, role redesign, `WorkItem` persistence or
engine, or UI redesign. The Access Domain Reconciliation
v0.1.0 package is proposed future architecture and a freeze declaration — not an
implementation mandate.

The threads below remain open and are unchanged by Phase 1, but are **not** the next action
while housekeeping runs.

#### Prior "current action" (2026-09-13, late) — HISTORICAL

~~Case repository~~ ~~case command service~~ ~~document repository~~ ~~foundation hardening~~ ~~evidence repository~~ ~~benefits verification~~ ~~authorization readiness~~ ~~authentication~~ **all done** (ADR-0003…ADR-0011). ~~Check PR #75's CI and merge it~~ **done** — merged 2026-09-13 19:39 UTC. ~~Phase 2A: shared auth + router + global shell~~ **done** — PR #84 merged 2026-09-13 23:55 UTC (see Current State above for the CI regressions found and fixed en route).

**Current action (updated 2026-09-13, late; the paragraph this replaced described Phase 2A as PR #84 "open, not yet merged" — it has since merged):** no single blocking action — several independent threads, none of which should be attempted together:

1. **VS-OA-001 still needs an independent Product Acceptance review** (unchanged from the prior entry) against the handoff's AC-OA-001…014 criteria and FIX-OA-001…010 fixtures
   ([docs/developer-handoff/OPERATING_ASSURANCE_VS_OA_001_ACCEPTANCE_HANDOFF.md](docs/developer-handoff/OPERATING_ASSURANCE_VS_OA_001_ACCEPTANCE_HANDOFF.md)) —
   this must not be performed or pre-verdicted by an implementing session.
2. **Phase 2B candidates, none scoped yet** (per
   [docs/ux/CLARITY_UX_MIGRATION_PRECONDITIONS.md](docs/ux/CLARITY_UX_MIGRATION_PRECONDITIONS.md)'s
   "Migration sequence" section): make workspace/tab/case selection
   URL-addressable (deliberately deferred from Phase 2A); resolve the
   ClarityShell/area-chrome visual redundancy noted above — a visual-cleanup call
   that wants explicit owner sign-off before starting, given the brief's repeated
   "not yet" on visual redesign; wire the Evidence Review frontend to its backend
   (the next-named P1-1 slice per PR #73's implementation plan, after IOP
   Reconciliation — evidence-service is the most mature, most-tested backend among
   the remaining `localStorage`-only workspaces; do not attempt more than one at a
   time).
3. **Four open PRs need an owner look, not code changes:**
   [PR #82](https://github.com/henrytylerhebert-eng/clarity-platform/pull/82) is
   now stale/superseded by this update — candidate to close;
   [PR #81](https://github.com/henrytylerhebert-eng/clarity-platform/pull/81) is
   docs-only, independent, `verify` passed, just needs a rebase and a look;
   [PR #73](https://github.com/henrytylerhebert-eng/clarity-platform/pull/73) (the
   whole-platform architecture audit) is untriaged and now has real merge
   conflicts with `main` — a disposition call, not something to resolve
   unprompted; [PR #63](https://github.com/henrytylerhebert-eng/clarity-platform/pull/63)
   (draft product-portfolio documentation) needs an owner look before it can leave
   draft.
4. **Unchanged, still blocked on the owner:** provider-backed Cloud SQL/RLS
   verification remains the separate, non-waived gate (`gcloud auth login` +
   intended project); OD-13 (execute CMS regulatory research) and OD-14 (per-org
   AI-native policy index) remain open decisions; OD-19 (Louisiana hospital
   provider identifiers) is still pending.

Do not add Studio mutation, publication, feature-flag, worker, or deployment
controls before server authorization and audit boundaries exist.
