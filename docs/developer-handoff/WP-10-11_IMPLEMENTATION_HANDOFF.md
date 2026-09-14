# WP-10 + WP-11 — Implementation Handoff

**Package:** WP-10 (hermetic typecheck) + WP-11 (per-session ephemeral database)
**Milestone:** MS-01 · **Epic:** EP-02 · **Slice:** VS-02 (Protected baseline)
**Executed:** 2026-07-29 · **Branch:** `claude/repo-product-intelligence-a4a509` (descendant of `main` @ `8399edd`)
**Verdict:** **Partially complete — blocked on a newly discovered dependency outside the package boundary (CR-04).**

---

## 1. Implementation Context Summary

| Field | Value |
|---|---|
| **Product outcome** | Not user-facing. **System outcome:** a completion claim in a session report becomes verifiable |
| **Milestone** | MS-01 — Decisions closed & baseline protected |
| **Epic** | EP-02 — Verification integrity & behavior protection |
| **Vertical slice** | VS-02 — Protected baseline |
| **Work package** | WP-10 + WP-11 |
| **Why first** | The only work in the plan that is dependency-free and decision-free, and it repairs a defect that undermines every downstream completion claim — every milestone gate in the execution architecture is phrased "suite green on an ephemeral database with a hermetic typecheck" |

## 2. Previous Output Understanding

Confirmed before writing code:
- **WP-10 target:** `npm run typecheck` in a worktree silently type-checked the *parent* checkout (all diagnostics at `../../../packages/...`).
- **WP-11 target:** parallel branch sessions share one local `clarity_dev`, so `migration-integrity` fails deterministically (open issue #31).
- **Hard constraints honored:** do not weaken `assertLocalClarityDevDatabase`; do not change tests; do not fix latent type errors newly revealed (report them); do not touch the five uncalled gateway reads (WP-13); do not merge PRs #29/#30/#32; do not touch branch protection.

## 3. Readiness Verdict (pre-implementation)

Proceeded. No upstream dependency. Bounded assumptions declared before coding:
- `initdb`/`pg_ctl`/`createdb` are available locally — **verified** (PostgreSQL 18.4, Homebrew).
- Migrations are schema-agnostic — **verified** (zero `public.` references across all 12 migration files).
- An ephemeral instance can satisfy the guard unchanged — **verified** (guard checks database name and host, not port).

## 4. Repository Baseline (measured before any change)

| Check | Command | Baseline result |
|---|---|---|
| Typecheck | `npm run typecheck` | **FAILED** — 12 errors, all at `../../../packages/prescreen-service/...` (parent checkout) |
| Lint | `npm run lint` | Passed, zero output |
| Prisma schema | `npx prisma validate` | Valid |
| Full suite (shared `clarity_dev`) | `DATABASE_URL=…:5432/clarity_dev npx vitest run` | 342/343 — `migration-integrity` failing |
| Working tree | `git status --short` | Clean except three untracked planning documents |

### Root-cause diagnosis (refines what the plan assumed)

The execution architecture stated two causes for the typecheck failure: a missing `baseUrl` *and* a missing `@clarity/prescreen-service` path entry. **Only the second is real.** Relative `paths` mappings do not require `baseUrl` in TypeScript 5.7, and the other ten mappings were working. The precise mechanism:

1. `@clarity/prescreen-service` was absent from `paths`, so it resolved through the parent's npm-workspace symlink to the **parent checkout's** `prescreen-service` (currently on the Phase-3 branch).
2. That parent file imports Phase-3 types from `@clarity/domain-contracts` — which *is* mapped, and therefore resolved back to **this** worktree's pre-Phase-3 contracts.
3. Result: 12 "has no exported member" and implicit-`any` errors, describing a file combination that exists in neither branch.

A one-line addition fixes it; `baseUrl` was not needed and was not added.

## 5. Local Implementation Plan (as executed)

1. Add the missing `@clarity/prescreen-service` mapping to `tsconfig.json`. *(WP-10)*
2. Add `scripts/with-ephemeral-database.ts`: initialise a throwaway PostgreSQL cluster on a free loopback port with a database named `clarity_dev`, `prisma migrate deploy`, run a wrapped command, then stop and delete. *(WP-11)*
3. Add the `test:ephemeral` npm script. *(WP-11)*
4. Verify hermeticity with `tsc --listFiles`; verify cleanup and non-destructiveness; run all quality gates.

## 6. Implementation

### 6.1 WP-10 — one line

`tsconfig.json`, in `compilerOptions.paths`:

```json
"@clarity/prescreen-service": ["./packages/prescreen-service/src/index.ts"]
```

### 6.2 WP-11 — ephemeral instance, not an ephemeral database

**Design constraint discovered during implementation.** WP-11 was specified as "create → `prisma migrate deploy` → run → drop" of a per-session *database*. That is not achievable as written:

- `assertLocalClarityDevDatabase` requires the database to be named **exactly** `clarity_dev` on `localhost`/`127.0.0.1` (`packages/case-repository/src/prismaClient.ts`).
- Two databases named `clarity_dev` cannot coexist on one server, so per-session databases cannot be uniquely named without weakening that guard — **prohibited by this package**.
- A per-session *schema* would work for the ledger, but `migration-integrity.test.ts:50` hardcodes `schemaname = 'public'`, and changing a test is also prohibited.

**Resolution:** give each session its own PostgreSQL *server* on its own port, containing a database named `clarity_dev`. The guard inspects host and database name but not port, so it passes **unchanged**. Recorded as deviation D-01 (§7.3).

Two environment-specific failures were hit and fixed during implementation, both diagnosed from the server log:

| Failure | Cause | Fix |
|---|---|---|
| `could not create any Unix-domain sockets` | Socket path exceeded PostgreSQL's 103-byte cap — macOS `TMPDIR` (`/var/folders/…`) is long enough on its own | Socket directory created under a short root (`/tmp`, `mkdtemp`, mode 0700); clients connect over TCP regardless |
| `postmaster became multithreaded during startup` | macOS + PostgreSQL 18 with an unset/invalid locale | `LC_ALL=C` pinned for `initdb` and `pg_ctl` so cluster and runtime agree |

The script now also prints the server log on a startup failure before deleting the data directory — without that, the first failure was undiagnosable because the log lives inside the directory the cleanup removes.

## 7. Test Results

### 7.1 Quality checks

| Check | Command | Result | Failures | Relationship to this change | Resolution | Remaining issue |
|---|---|---|---|---|---|---|
| Lint | `npm run lint` | **Passed** | none | New script must satisfy the flat config | — | none |
| Typecheck | `npm run typecheck` | **Passed** (was failing) | none | Direct target of WP-10; also covers the new script (`scripts/**/*.ts` is in `include`) | Path mapping added | none |
| Typecheck hermeticity | `npx tsc --noEmit --listFiles` | **Passed** | none | Acceptance criterion for WP-10 | — | none |
| Prisma schema | `npx prisma validate` | **Passed** | none | Unchanged by this package | — | none |
| Unit + security | `npx vitest run tests/unit tests/security` | **103/103** | none | No DB required; unaffected | — | none |
| Full suite, ephemeral DB | `npm run test:ephemeral` | **327/343, 16 failed** | 16 | **Not caused by this change** — see CR-04 | Not resolved; outside package boundary | **Yes — blocks WP-11 acceptance** |
| Full suite, shared DB (baseline) | `DATABASE_URL=…:5432 npx vitest run` | 342/343 | 1 | Pre-existing (issue #31) | Fixed by WP-11 for `migration-integrity` | — |
| Formatting | — | **Not run** | — | No formatter exists in this repository (OD-9 remainder) | N/A | Tracked |
| Build | — | **Not applicable** | — | Root workspace is `noEmit`; app build not touched by this package | N/A | — |
| E2E / accessibility / performance | — | **Not applicable** | — | No UI or runtime behavior changed | N/A | — |
| Security checks | — | **Not run** | — | `npm audit` not part of this package | N/A | Tracked |

### 7.2 Hermeticity evidence (WP-10)

```
npx tsc --noEmit --listFiles | grep -v node_modules \
  | grep -c "^<repository-root>/packages/"
→ 0        # parent-checkout source files in the program

npx tsc --noEmit --listFiles | grep prescreen-service
→ …/.claude/worktrees/clarity-build-to-goal-operating-doc-011dc7/packages/prescreen-service/src/*.ts
```

Zero parent files in the program; the worktree's own `prescreen-service` sources are loaded. **No latent type errors were revealed** by the fix, so nothing needed deferring under the package's must-not-include rule.

### 7.3 Ephemeral-instance evidence (WP-11)

| Assertion | Result |
|---|---|
| `migration-integrity` — WP-11's actual target | **2/2 passed** (fails on the shared database) |
| `od6-rls` (RLS policies apply on a fresh cluster) | 4/4 passed |
| Leftover data directories after the run | 0 |
| Leftover socket directories after the run | 0 |
| Stray `postgres` processes after the run | 0 |
| Developer's own `clarity_dev` | **Untouched** — still 16 migration rows, unmodified |
| Guard `assertLocalClarityDevDatabase` | **Unchanged**; passes against the ephemeral URL |
| Wrapped-command exit code propagation | Verified (16 test failures surfaced as a non-zero exit) |

### 7.4 The 16 failures — single shared root cause

Every failure reduces to one line:

```
The column `CommandIdempotencyRecord.requestFingerprint` does not exist in the current database.
```

| Source | `requestFingerprint` occurrences |
|---|---|
| This branch's `prisma/schema.prisma` | **0** |
| Parent checkout's `prisma/schema.prisma` | 1 |
| Shared generated client `node_modules/.prisma/client/index.d.ts` | **30** |

The generated Prisma client in the parent's shared `node_modules` was generated from the **parent branch's** schema. It also contains `PrescreenEncounter` and `PrescreenAssessment` models, which do not exist in this branch at all. The 16 failures are all idempotency-path or error-type assertions that touch `CommandIdempotencyRecord`. **None is a logic defect, and none was introduced by this package.**

## 8. Requirement Verification Matrix

| Requirement | Implementation | Evidence | Result |
|---|---|---|---|
| NFR-11a — typecheck is hermetic in a worktree | `tsconfig.json` path mapping added | `tsc --listFiles`: 0 parent files; typecheck passes | **Passed** |
| NFR-11b — each session runs on an ephemeral database with its own migration ledger | `scripts/with-ephemeral-database.ts` + `test:ephemeral` | `migration-integrity` 2/2 on a fresh cluster | **Passed** |
| NFR-11c — full suite green on a fresh ephemeral database | Not achieved | 327/343; single root cause CR-04 | **Failed** |
| WP-10/11 constraint — `assertLocalClarityDevDatabase` not weakened | Ephemeral instance rather than renamed database | `prismaClient.ts` unmodified; guard passes | **Passed** |
| WP-10/11 constraint — no test changed | — | `git status`: no file under `tests/` modified | **Passed** |
| WP-10/11 constraint — developer's `clarity_dev` not destroyed | Fresh temp cluster only | 16 migration rows before and after | **Passed** |
| WP-10/11 constraint — latent type errors reported, not fixed | — | None revealed | **Not applicable** |
| Lint / typecheck / `prisma validate` gates | — | All three pass | **Passed** |
| Formatter check | — | No formatter exists in the repository | **Not applicable** |
| Contracts satisfied (CTR-01…10) | No contract touched | — | **Not applicable** |
| Permissions enforced | No permission surface touched | — | **Not applicable** |
| Error states handled | Startup failure prints the server log; wrapped exit code propagated; cleanup runs in `finally` | Both failure modes exercised during implementation | **Passed** |
| Logging present | `[ephemeral-db]` ready/destroyed lines; server log on failure | Observed in output | **Passed** |
| Documentation updated | This handoff; script header explains every non-obvious choice | — | **Passed** |

**No must-have requirement is untested. One (NFR-11c) is failed, which is why the verdict is not "complete."**

## 9. Definition of Done Assessment

### Work package DoD

| Criterion | Status | Note |
|---|---|---|
| Required code implemented | ✅ | Both WP-10 and WP-11 mechanisms |
| Required tests exist | ✅ | Verification is that the *existing* suite behaves correctly; no new product tests were in scope |
| Relevant tests pass | ❌ | 327/343 on the ephemeral cluster (CR-04) |
| Contracts satisfied | ✅ (N/A) | No contract touched |
| Error states implemented | ✅ | Log-on-failure, exit-code propagation, `finally` cleanup |
| Permissions enforced | ✅ (N/A) | No permission surface |
| Logging present | ✅ | |
| Documentation updated | ✅ | |
| Acceptance criteria pass | ❌ | Three of four clauses pass; "full suite passes" fails |
| No critical defects remain | ⚠️ | None *introduced*; one *revealed* (CR-04) |
| Handoff complete | ✅ | This document |

**Work package DoD: NOT met.**

### Vertical slice DoD — VS-02 "Protected baseline"

| Criterion | Status |
|---|---|
| Outcome works end to end | ⚠️ Partially — the harness works; the suite it runs does not fully pass |
| Slice demonstrable independently | ✅ `npm run test:ephemeral` |
| Critical exceptions work | ✅ Both startup failure modes handled and observed |
| Data persists correctly | ✅ (N/A) — the point is that it *doesn't* persist beyond the session |
| Authorization works | ✅ (N/A) |
| Audit evidence exists | ✅ (N/A) |
| Tests cover the workflow | ⚠️ The harness itself has no automated test — see follow-up F-03 |

**VS-02: NOT complete. MS-01 remains open** (its decision items WP-01…WP-06 are also outstanding and were not in this package).

## 10. Change-Control Register

### CR-04 — The shared generated Prisma client belongs to a different branch **(blocking)**

| Field | Content |
|---|---|
| **Discovery** | On a clean ephemeral database containing only this branch's 12 migrations, 16 tests fail because the generated Prisma client expects a `CommandIdempotencyRecord.requestFingerprint` column that this branch's schema does not define |
| **Evidence** | `requestFingerprint`: 0 occurrences in this branch's schema · 1 in the parent checkout's schema · 30 in `node_modules/.prisma/client/index.d.ts`. The client also declares `PrescreenEncounter`/`PrescreenAssessment`, absent from this branch. Failure text: `The column CommandIdempotencyRecord.requestFingerprint does not exist in the current database` (8 occurrences) |
| **Impact** | **The previously reported "342/343 passing" was not a valid measurement of this branch.** It passed only because the shared `clarity_dev` had the parent branch's migrations applied, which happened to match the parent-generated client. Neither the database nor the client belonged to this branch. This branch's isolated status is **327/343 pending client regeneration** |
| **Product impact** | None directly. But it invalidates the test-coverage evidence used in the maturity assessment and the regression gate, and it means the repository has **two** shared-state contamination channels, not one: the database (issue #31, now fixed) and the generated client (new) |
| **Technical impact** | Worktrees have no `node_modules` of their own and resolve `@prisma/client` to the parent's, so any branch whose schema differs from the parent's checkout tests against a mismatched client |
| **Recommended action** | **(b) as the root fix:** give each worktree its own `node_modules` (`npm install` inside the worktree), which isolates both dependencies and the generated client. **Then (a):** add `npx prisma generate` to `with-ephemeral-database.ts`, matching `.github/workflows/ci.yml`, which already generates per job. **(c)** — a `generator client { output = … }` schema change — is rejected: it alters a shared file for a local-environment problem |
| **Work completed** | Diagnosis and evidence only |
| **Work deferred** | The fix. `prisma generate` was **deliberately not run**: its default output is the parent's shared `node_modules/.prisma/client`, so running it would silently break the parent checkout (currently on `codex/om/prescreen-phase3-fix`) until that workspace regenerated. That is a side effect outside this package's boundary and outside its authority |
| **Decision required** | Approve per-worktree `node_modules`, and whether `prisma generate` belongs in the ephemeral runner |
| **Owner** | Infra owner + tech lead |
| **Blocking status** | **Blocks WP-11 acceptance (NFR-11c) and blocks trusting any suite result from a worktree** |

### CR-05 — WP-11 cannot be an ephemeral *database* (non-blocking; resolved in implementation)

| Field | Content |
|---|---|
| **Discovery** | The guard requires the database to be named exactly `clarity_dev`, so per-session databases cannot be uniquely named |
| **Evidence** | `assertLocalClarityDevDatabase` in `packages/case-repository/src/prismaClient.ts`; `migration-integrity.test.ts:50` hardcodes `schemaname = 'public'` |
| **Impact** | Implementation approach only |
| **Recommended action** | Accept the ephemeral-*instance* approach as the standing pattern; update the execution architecture's WP-11 description |
| **Work completed** | Implemented as an ephemeral instance |
| **Decision required** | Ratify the deviation |
| **Owner** | Infra owner |
| **Blocking status** | Not blocking |

### Deviations from the execution architecture

| ID | Deviation | Reason |
|---|---|---|
| **D-01** | Ephemeral PostgreSQL *instance* instead of ephemeral *database* | The guard forbids a uniquely-named database and may not be weakened (CR-05) |
| **D-02** | `baseUrl` **not** added to `tsconfig.json` | The plan's diagnosis was partly wrong: relative `paths` work without `baseUrl` in TS 5.7. Only the missing path entry was the cause, and the smallest correct change was preferred |
| **D-03** | Added two things not in the WP description: `LC_ALL` pinning and log-on-startup-failure | Both were required to make the harness work at all on macOS; the first failure was undiagnosable without the second |

## 11. Implementation Handoff

### 11.1 Changes made

| File | Status | Purpose |
|---|---|---|
| `tsconfig.json` | Modified (+1 line) | Add the missing `@clarity/prescreen-service` path mapping so the worktree stops type-checking the parent checkout |
| `scripts/with-ephemeral-database.ts` | **Created** (135 lines) | Run any command against a throwaway PostgreSQL instance with an isolated migration ledger, then destroy it |
| `package.json` | Modified (+1 line) | `test:ephemeral` script |
| `docs/developer-handoff/WP-10-11_IMPLEMENTATION_HANDOFF.md` | **Created** | This document |

**Not changed:** no schema, no migration, no test, no product code, no configuration beyond the two lines above, no branch protection. `git status` shows no file under `tests/`, `packages/`, `prisma/`, or `app/`.

### 11.2 Contracts

**None added or changed.** No consumer is affected. No versioning considerations.

### 11.3 Tests

- **Added:** none. This package's verification is that the *existing* suite behaves correctly on isolated infrastructure.
- **Modified:** none (prohibited by the package).
- **Commands run and results:** see §7.1. Every count comes from a run in this session against the stated `DATABASE_URL`.
- **Coverage gaps:** the harness script itself is untested (follow-up F-03); no formatter, security, performance, or accessibility check applies to this change.
- **Manual validation:** reproduced both startup failures manually and read the PostgreSQL logs; verified cleanup (0 datadirs, 0 socket dirs, 0 processes); verified the developer's `clarity_dev` was untouched before and after.

### 11.4 Acceptance criteria

| Clause of the WP acceptance criterion | Result |
|---|---|
| Lint passes | **Passed** |
| Typecheck passes | **Passed** |
| `prisma validate` passes | **Passed** |
| `migration-integrity` is green | **Passed** |
| No diagnostic path points outside the worktree | **Passed** |
| **The full suite passes** | **Failed** — 327/343 (CR-04) |

**5 passed · 1 failed · 0 blocked · 0 untested.**

### 11.5 Assumptions

| Assumption | Label |
|---|---|
| PostgreSQL server binaries are available to every developer running `test:ephemeral` | `[V]` locally; `[I]` for other machines — the script fails with an actionable message if not |
| `LC_ALL=C` is acceptable for the test cluster's collation | `[I]` — no test asserts locale-dependent text ordering; if one is added, it may need `en_US.UTF-8` instead |
| `/tmp` exists (used for the short socket path) | `[I]` — true on macOS and on CI's `ubuntu-latest`; the script falls back to `tmpdir()` |
| `initdb` on every run is an acceptable cost | `[I]` — a few seconds per session, not per test file |
| CI is unaffected | `[V]` — `ci.yml` is untouched and keeps using its Postgres service container |

### 11.6 Known limitations

1. **The full suite does not pass on an isolated cluster** (CR-04). Until that is resolved, `test:ephemeral` reports 16 failures that are environmental, not real — which is itself a trust hazard if left undocumented.
2. `test:ephemeral` does not replace the shared-database workflow; nothing forces its use.
3. The harness has no automated test of its own.
4. An `initdb` per invocation makes this a session-level tool, not something to run per file.
5. `--auth=trust`, `fsync=off`, and `--no-sync` are used. Safe here — loopback-only, synthetic, deleted on exit — and commented as such in the script, but they must never be copied to a durable database.

### 11.7 Risks introduced

| Risk | Type | Assessment |
|---|---|---|
| A developer copies the throwaway cluster flags into a real environment | Security | Low — commented explicitly at the call site; no durable config touched |
| Socket directories accumulate in `/tmp` if a process is SIGKILLed | Operational | Low — `mkdtemp` 0700 dirs, cleaned in `finally`; a stale dir is inert |
| Port selection races between two sessions started in the same instant | Operational | Low — OS-assigned free port; a collision fails loudly at startup with the log printed |
| `LC_ALL=C` diverges from the developer's shared `clarity_dev` collation | Data | Low — no test asserts locale-dependent ordering today; noted as an assumption |
| **Suite results from a worktree cannot be trusted until CR-04 is fixed** | Operational | **Medium — this is the reason for the verdict**, and it predates this package |

### 11.8 Follow-up work (discovered, not added to scope)

| ID | Item | Origin |
|---|---|---|
| **F-01** | Give each worktree its own `node_modules`, then add `prisma generate` to the ephemeral runner | CR-04 |
| **F-02** | Update the execution architecture's WP-11 description to "ephemeral instance"; ratify D-01/D-02/D-03 | CR-05 |
| **F-03** | Add a test for the harness itself (starts, migrates, propagates exit codes, cleans up) | §11.6 |
| **F-04** | Decide whether `test:ephemeral` becomes the default local workflow, and whether CI should call it | §11.6 |
| **F-05** | Re-measure the true per-branch test baseline once CR-04 is fixed, and correct the figures in the brief and build plan | CR-04 |

### 11.9 Review guidance

- **Inspect first:** `scripts/with-ephemeral-database.ts` — specifically the `POSTGRES_ENV` and `makeSocketDirectory` comments, which encode two non-obvious platform constraints that cost two failed runs to find.
- **Highest-risk file:** the same script. It starts and stops OS processes and deletes directories. Check that the `finally` block cannot delete a path it did not create, and that `rmSync` targets are always `mkdtemp` results.
- **Tests that prove the behavior:** `migration-integrity` (2/2 on a fresh cluster, failing on the shared one) is the whole point of WP-11. For WP-10, the proof is the `tsc --listFiles` count of zero parent-checkout files, not merely a passing typecheck.
- **Manual scenario to run:** `npm run test:ephemeral`, then confirm `ls -d /var/folders/*/*/T/clarity-ephemeral-db-* /tmp/clarity-pgsock-*` returns nothing and `ps aux | grep clarity-ephemeral` shows no process.
- **Assumptions needing attention:** `LC_ALL=C` (collation), and the CR-04 recommendation — approving per-worktree `node_modules` has consequences for disk use and install time across the several worktrees in this repository.

## 12. Next Valid Step

**Resolve a blocking decision — CR-04.**

Not "fix implementation defects": nothing in this package is defective. Not "execute the next work package": WP-12 (characterization tests for the reads VS-03 will expose) depends on a trustworthy suite, and CR-04 means no worktree suite result can currently be trusted. Not "review and merge" alone: merging is fine and safe, but it does not close MS-01, and leaving CR-04 open would let the next package be verified against a mismatched client — the exact failure mode this package exists to eliminate.

The decision is small and reversible: approve per-worktree `node_modules`, then add `prisma generate` to the ephemeral runner (F-01). Once done, re-run `npm run test:ephemeral`, expect 343/343, and WP-11's acceptance criterion closes.

---

# Implementation Verdict

**Partially complete.**

**Product outcome delivered.** Typecheck in a worktree is now hermetic and verifiably so, and any command can be run against a throwaway PostgreSQL instance whose migration ledger contains exactly the current branch's migrations — which makes `migration-integrity` pass where the shared database makes it fail. The harness also *revealed* a second contamination channel that no status document had recorded.

**Work package completed.** WP-10 (hermetic typecheck) — complete. WP-11 (per-session ephemeral database) — mechanism complete, acceptance criterion not met.

**Files changed.**
- `tsconfig.json` (+1 line)
- `scripts/with-ephemeral-database.ts` (new, 135 lines)
- `package.json` (+1 line)
- `docs/developer-handoff/WP-10-11_IMPLEMENTATION_HANDOFF.md` (new)

**Contracts changed.** None.

**Tests run.**
- `npm run lint` → passed
- `npm run typecheck` → passed (was failing with 12 errors)
- `npx tsc --noEmit --listFiles` → 0 parent-checkout files in the program
- `npx prisma validate` → valid
- `npx vitest run tests/unit tests/security` → 103/103
- `npm run test:ephemeral` → **327/343, 16 failed** (all one root cause, CR-04); `migration-integrity` **2/2 passed**
- Baseline for comparison, shared DB → 342/343, `migration-integrity` failed

**Acceptance criteria.** 5 passed · 1 failed · 0 blocked · 0 untested.

**Known limitations.** The full suite does not pass on an isolated cluster because the shared generated Prisma client belongs to the parent checkout's branch. `test:ephemeral` is opt-in. The harness has no test of its own.

**Decisions required.** CR-04 — approve per-worktree `node_modules` and whether `prisma generate` joins the ephemeral runner. CR-05 — ratify the ephemeral-instance approach.

**Deviations.** D-01 ephemeral instance rather than database (guard could not be weakened). D-02 `baseUrl` not added (the plan's diagnosis was partly wrong; one line sufficed). D-03 added `LC_ALL` pinning and log-on-failure, both required to make the harness work on macOS.

**Recommended next step.** Close CR-04 by giving each worktree its own `node_modules`, then add `prisma generate` to `with-ephemeral-database.ts` and re-run — that is the one action standing between this package and a trustworthy 343/343.
