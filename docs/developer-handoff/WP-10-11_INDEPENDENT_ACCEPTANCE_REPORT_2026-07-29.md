# WP-10 + WP-11 — Independent Acceptance and Implementation Verification

> **PRESERVED 2026-09-18 (Housekeeping Phase 2B).** Extracted from the unmerged PR #93 branch
> so this material stops living only on a stale ref. It is a **2026-07-29 snapshot** and is
> **Proposed**, never an owner decision — the document's own evidence labels still govern.
> Treat every capability, package, PR and branch reference in it as historical to that date:
> `main` has changed substantially since (14 packages, authentication implemented per ADR-0011,
> prescreen relocated to `packages/prescreen-service`), and PRs #29, #30 and #32 referenced in
> this era are all closed. Current state lives in `IMPLEMENTATION_STATUS.md` and the
> accepted ADRs under `docs/architecture/`.

**Review date:** 2026-07-29
**Reviewer role:** Independent product acceptance and implementation verification
**Repository:** `henrytylerhebert-eng/clarity-platform`
**Worktree:** `<historical-worktree>`
**Branch:** `claude/repo-product-intelligence-a4a509`
**HEAD reviewed:** `8399eddad4cb8575d94f9b31db27eb00f73e4bcf` plus the uncommitted WP-10/WP-11 patch
**Primary verdict:** **Revision required**

## Independence statement

This review did not assume the implementation handoff was correct. It independently:

- reconstructed the documented acceptance baseline;
- inspected the tracked diff and every WP implementation file;
- resolved the actual TypeScript, Prisma, Vitest, and generated-client paths;
- reran the required quality gates and full isolated suite;
- exercised success, non-zero exit, startup failure, parallel-session, SIGINT, and SIGTERM behavior;
- checked the developer database before and after an isolated run;
- inspected cleanup, test meaning, scope, handoff accuracy, and documented deviations.

No implementation remediation, dependency installation, Prisma generation, test change, commit, merge, push, or deployment was performed. Test-created PostgreSQL processes and directories were removed after adversarial verification. The repository changes present before this review were preserved.

Evidence labels used below:

- **Verified:** independently confirmed in this review.
- **Documented:** stated by a planning artifact but not independently approved or observed.
- **Reported:** stated by the implementation handoff.
- **Inferred:** supported reasoning, not direct observation.
- **Unverified:** evidence was insufficient.
- **Failed:** direct evidence shows the condition was not met.
- **Blocked:** a dependency, environment, or decision prevents valid verification.
- **Not applicable:** outside the WP-10/WP-11 scope.

---

## 1. Acceptance Context

### Product context

This package has no direct end-user workflow. Its intended system outcome is:

> A completion claim made from a branch worktree becomes trustworthy because typechecking uses that worktree's source and tests run against a fresh branch/session database state.

The broader proposed product outcome—an intake coordinator completing a case workflow—is not part of WP-10/WP-11.

### Execution context

| Level | Documented target |
|---|---|
| Milestone | **MS-01 — Decisions closed & baseline protected** |
| Epic | **EP-02 — Verification integrity & behavior protection** |
| Vertical slice | **VS-02 — Protected baseline** |
| Work packages | **WP-10 — Make typecheck hermetic** and **WP-11 — Per-session ephemeral database** |
| Requirement | **NFR-11 — Verification integrity** |
| User | No product user; the actor is a developer/verification agent |
| Trigger | A developer or agent verifies a branch worktree |
| Completion condition | Lint, typecheck, Prisma validation, and the 343-test root suite pass against fresh branch-local verification state; migration integrity is green; no parent repository source contaminates typechecking |

### Formal-approval limitation

**Verified:** the supposed baseline is not formally approved:

- `docs/product/PRODUCT_BUILD_PLAN_AND_REQUIREMENTS.md:4` says the plan is proposed and nothing in it is an owner decision.
- `docs/product/EXECUTION_ARCHITECTURE.md:5` says no owner decision is recorded.
- `docs/product/EXECUTION_ARCHITECTURE.md:77` names the owner as sole product-acceptance authority.
- `docs/product/EXECUTION_ARCHITECTURE.md:781` states the proposed outcome is not approved.
- All planning artifacts and the implementation handoff are untracked.

This report can issue a bounded engineering verdict against the strongest documented criteria. It cannot convert those criteria into owner-approved product scope.

---

## 2. Verification Readiness Verdict

**Verdict: Ready for bounded verification.**

### Independently verifiable

- Actual working-tree change set.
- TypeScript source resolution.
- Dependency and generated-client resolution.
- Local PostgreSQL provisioning and migration deployment.
- The root unit, security, integration, and workflow suites.
- Normal, failed-command, startup-failure, parallel, SIGINT, and SIGTERM lifecycle behavior.
- Guard preservation.
- Local developer database migration count before and after an isolated probe.
- Cleanup after ordinary success/failure.
- Documentation and handoff accuracy.

### Not fully verifiable

- **Formal approval:** no owner-ratified requirements or deviations exist.
- **Clean-checkout reproducibility:** the patch is uncommitted in a dirty worktree with no accepted commit/patch reference.
- **App regression:** `npm run test:app` was not run; it is a separate CI gate and no `app/` file changed.
- **CI behavior:** CI was inspected but not run in this review.
- **Other developer platforms:** only this macOS/Apple Silicon environment was exercised.
- **Production/pilot readiness:** not applicable and not claimed.

Missing formal approval and clean-checkout evidence cannot be treated as passed. They do not prevent the direct finding that the implementation fails its own documented full-suite criterion.

---

## 3. Documented Acceptance Baseline

Because no owner-approved baseline exists, this is the strongest documented baseline.

### Required to accept

1. `npm run lint` passes.
2. `npm run typecheck` passes.
3. TypeScript resolves no parent-checkout non-dependency source.
4. The missing `@clarity/prescreen-service` mapping is present.
5. The literal plan also adds `baseUrl: "."`, unless that requirement is formally corrected.
6. Each session receives a fresh local `clarity_dev` migration ledger.
7. `assertLocalClarityDevDatabase` remains unchanged.
8. `prisma migrate deploy` applies the branch's migrations.
9. `migration-integrity` passes.
10. `prisma validate` passes.
11. The complete root suite passes **343/343** against the isolated target.
12. No test is skipped, weakened, or changed to obtain green.
13. No product, route, schema, migration, or unrelated work is added.
14. The developer's own `clarity_dev` is not changed or destroyed.
15. Required error behavior, cleanup, logging, documentation, self-review, and CTR-10 handoff evidence exist.
16. The ephemeral command is recorded in canonical contributor guidance.
17. No unresolved critical defect remains.

### Allowed limitations

- System-only outcome with no direct product-user value.
- Synthetic/local data only.
- No product code, route, UI, schema, migration, application contract, or permission change.
- No new product-behavior test.
- App E2E, accessibility, performance, and formal security sign-off are outside this WP.
- Latent product type errors may be reported and deferred rather than fixed here.
- WP-10/WP-11 alone do not complete VS-02, EP-02, MS-01, or any release gate.

### Automatic rejection conditions

- Any required gate fails or is unverified.
- Full isolated suite is not 343/343.
- Evidence uses a shared/contaminated database or parent branch's product source/generated model.
- The safety guard is weakened.
- Tests are changed, skipped, or weakened.
- Forbidden scope is entered.
- A live disposable database/process is left after a supported termination path.
- Counts are asserted without command and target.
- Handoff, documentation, or honesty evidence materially misstates completion.
- A critical/high blocking defect remains unresolved.

Environmental failures are not an approved limitation: eliminating cross-branch environmental contamination is the package's reason for existing.

---

## 4. Change-Set Assessment

### Actual WP implementation

| File | Actual change | Classification |
|---|---|---|
| `tsconfig.json` | Adds `@clarity/prescreen-service` path | Authorized and required outcome; literal `baseUrl` step omitted |
| `package.json` | Adds `test:ephemeral` script | Authorized and required |
| `scripts/with-ephemeral-database.ts` | New 176-line PostgreSQL instance runner | Necessary supporting implementation with defects below |
| `docs/developer-handoff/WP-10-11_IMPLEMENTATION_HANDOFF.md` | New implementation report | Authorized; materially incomplete/inaccurate in places |

### Other dirty-worktree files

The three product planning documents predated WP implementation in the same Claude session. The newer full-context handoff was added after WP implementation. They are not hidden WP code changes, but they must not be silently bundled into a WP-only merge:

- `docs/product/REPOSITORY_PRODUCT_INTELLIGENCE_BRIEF.md`
- `docs/product/PRODUCT_BUILD_PLAN_AND_REQUIREMENTS.md`
- `docs/product/EXECUTION_ARCHITECTURE.md`
- `docs/developer-handoff/CLAUDE_TO_CODEX_FULL_CONTEXT_HANDOFF_2026-07-29.md`

### Boundary assessment

**Verified:**

- No file was deleted.
- No dependency version or lockfile changed.
- No schema or migration changed.
- No test changed.
- No file under `packages/`, `app/`, `prisma/`, or `tests/` changed.
- No product/domain/API/permission behavior changed.
- `assertLocalClarityDevDatabase` is unchanged.
- `git diff --check` passes.

### Handoff comparison

| Handoff claim | Independent finding | Status |
|---|---|---|
| Files are bounded to WP | Correct when prior planning artifacts are treated as pre-existing | Verified |
| Runner is 135 lines | Runner is 176 lines | Failed |
| Contracts unchanged | Product contracts unchanged; a new developer CLI/lifecycle contract exists | Partially verified |
| Tests added/modified: none | Correct | Verified |
| Lint/typecheck/Prisma validation pass | Reproduced; Prisma validation needs a safe `DATABASE_URL` that the original command omits | Partially verified |
| Full ephemeral suite is 327/343 | Reproduced exactly | Verified |
| Normal cleanup works | Reproduced for success, exit 7, startup failure, and full-suite failure | Verified |
| Error states/critical exceptions handled | SIGINT/SIGTERM and pre-`try` setup failures are not handled safely | Failed |
| Product outcome delivered | Full-suite criterion fails and verification remains contaminated | Failed |
| WP-10 complete, WP-11 partial | WP-10's source mapping works; broader dependency hermeticity and combined outcome remain incomplete | Partially verified |
| Runner mirrors CI | CI installs dependencies and runs `prisma generate`; local runner does neither and uses different Node/PostgreSQL versions | Failed as stated |
| Documentation complete | Contributor guidance and the artifact chain are not updated | Failed |

---

## 5. Product Outcome Verification

### Intended product/system outcome

The approved-style outcome is trustworthy completion evidence from a branch worktree.

### What is demonstrably delivered

**Verified:**

- TypeScript loads the worktree's prescreen-service source rather than the parent checkout's prescreen-service source.
- A normal runner invocation creates a fresh PostgreSQL instance on a unique loopback port.
- That instance contains a database named `clarity_dev`.
- The current branch's 12 migrations deploy to it.
- Two parallel focused invocations use different ports and both pass migration integrity.
- Ordinary success and non-zero wrapped-command failure clean up and propagate status.
- The developer's own port-5432 database remained at 16 migration rows before and after a fresh isolated probe.

### What is not delivered

**Failed:**

- The generated Prisma client is not branch-local.
- The full suite is not green.
- Verification still depends on the parent checkout's dependency/generated-client state.
- SIGINT and SIGTERM leave live PostgreSQL infrastructure behind.
- The documented clean-checkout/CTR-10/contributor-guidance standard is not satisfied.

### Outcome verdict

**Product outcome partially delivered.**

The package isolates worktree source resolution and database migration state during normal runs. It does not make completion claims trustworthy end to end.

---

## 6. Requirement Verification Matrix

| ID | Requirement | Priority | Implementation | Method | Result | Evidence | Defect |
|---|---|---:|---|---|---|---|---|
| R-01 | Typecheck uses worktree product source | Must | `tsconfig.json:14-26` | `tsc --listFiles` | **Passed** | 0 parent package-source files; 8 worktree prescreen files | — |
| R-02 | Literal WP-10 config adds `baseUrl` and mapping | Must/documented | `tsconfig.json` | Diff + resolution | **Partially passed** | Mapping added and effective; `baseUrl` omitted without approval | DEV-01 |
| R-03 | Fresh per-session local `clarity_dev` ledger | Must | Runner `:31-32,97-141` | Focused + parallel runs | **Passed** | Two simultaneous instances used distinct ports; 2/2 each | — |
| R-04 | Disposable lifecycle cleans on supported termination | Must/DoD | Runner `:141-165` | Success/failure/SIGINT/SIGTERM | **Failed** | Interrupts left live PostgreSQL and temp artifacts | LIFE-01 |
| R-05 | Full root suite green on fresh target | Must | `test:ephemeral` | Full fresh run | **Failed** | 327/343; 16 failures | ENV-01 |
| R-06 | Guard unchanged and satisfied | Must | Existing guard | Diff + focused run | **Passed** | Guard has no diff and accepts generated loopback URL | — |
| R-07 | Developer database untouched | Must | Separate port/cluster | Before/after query | **Passed** | 16 migration rows before and after | — |
| R-08 | No prohibited product/schema/test scope | Must | Patch | Diff/status inspection | **Passed** | No relevant paths changed | — |
| R-09 | Lint passes | Must | Root scripts | Fresh command | **Passed** | Exit 0 | — |
| R-10 | Typecheck passes | Must | Root scripts | Fresh command | **Passed** | Exit 0 | — |
| R-11 | Prisma validation passes | Must | Existing schema | Fresh command with safe URL | **Passed** | Valid schema; config deprecation warning only | DOC-02 |
| R-12 | Tests are not skipped, weakened, or edited | Must | Patch/test config | Diff + command inspection | **Passed** | No test/config diff; complete root suite ran | — |
| R-13 | Contributor and artifact documentation updated | Must/DoD | Docs | Search + comparison | **Partially passed** | Script/handoff document command; canonical contributor guidance and proposed plan remain stale | DOC-01 |
| R-14 | CTR-10 handoff is accurate/reproducible | Must/DoD | WP handoff | Claim comparison | **Partially passed** | Core failure disclosed; line count, exact Prisma env, outcome, lifecycle, and CI claims inaccurate | DOC-02 |
| R-15 | Acceptance evidence comes from a clean checkout/patch ref | Must/precondition | Git state | Status/ref inspection | **Blocked** | Uncommitted dirty worktree; no accepted patch/commit ref | GOV-01 |
| R-16 | Error logging, propagation, and cleanup | Must/DoD | Runner `:142-165` | Exit 7 + fake startup failure + signals | **Partially passed** | Exit/status/logging work; signal and pre-`try` cleanup do not | LIFE-01, LIFE-02 |
| R-17 | Honest completion statement | Must | Handoff | Document review | **Partially passed** | Failure is disclosed, but “Product outcome delivered” contradicts it | DOC-02 |
| R-18 | Product permissions/contracts | — | No affected surface | Diff inspection | **Not applicable** | No product contract/permission code changed | — |

### Requirement coverage summary

Applicable requirements: **17**

- Passed: **9**
- Partially passed: **5**
- Failed: **2**
- Unverified: **0**
- Blocked: **1**
- Not applicable: **1** additional row
- Must-have failures: **2**
- Must-have blocked items: **1**

---

## 7. Acceptance-Criteria Matrix

| Criterion | Given | When | Then | Verification | Result | Evidence |
|---|---|---|---|---|---|---|
| AC-00 | Clean worktree checkout | Package is verified | Evidence is reproducible from an accepted ref | Git preflight | **Blocked** | Patch is uncommitted in a dirty worktree |
| AC-01 | Current WP tree | `npm run lint` | Lint passes | Fresh execution | **Passed** | Exit 0 |
| AC-02 | Current WP tree | `npm run typecheck` | Typecheck passes | Fresh execution | **Passed** | Exit 0 |
| AC-03 | Safe local-form URL | `npm run prisma:validate` | Schema validates | Fresh execution | **Passed** | Prisma 6.19.3 reports valid |
| AC-04 | Fresh isolated instance | Run migration integrity | Ledger and required index pass | Fresh execution | **Passed** | 12 migrations; 2/2 |
| AC-05 | Current TS program | `tsc --listFiles` | No parent non-dependency product source | File classification | **Passed** | 0 parent package-source files |
| AC-06 | Fresh isolated instance | Run root full suite | 343/343 pass | Fresh execution | **Failed** | 327/343; 16 failures |

Acceptance criteria summary:

- Passed: **5**
- Failed: **1**
- Unverified: **0**
- Blocked: **1**

---

## 8. Workflow Verification

### Infrastructure workflow

```text
Developer invokes command
→ runner checks PostgreSQL binaries
→ creates temp data/socket directories
→ selects port
→ initializes and starts PostgreSQL
→ creates clarity_dev
→ deploys branch migrations
→ runs wrapped command with DATABASE_URL
→ stops server
→ deletes temp artifacts
→ returns wrapped exit code
```

### Happy path

| Item | Result |
|---|---|
| Starting state | Developer DB running separately on port 5432; no ephemeral artifacts |
| Action | Focused migration-integrity through `test:ephemeral` |
| System response | Fresh instance on OS-selected port; 12 migrations deployed |
| Final state | 2/2 passed; normal cleanup completed |
| Result | **Passed** |

### Required and adversarial paths

| Path | Expected | Actual | Result |
|---|---|---|---|
| Two parallel invocations | Independent ports/ledgers, both clean | Ports differed; both 2/2; cleanup clean | **Passed** |
| Wrapped command exits 7 | Return 7 and clean | Exit 7 returned; cleanup clean | **Passed** |
| PostgreSQL startup failure | Print server log, exit non-zero, clean | Synthetic failure printed; cleanup clean | **Passed** |
| Full test failure | Preserve failure status and clean | Non-zero, 327/343, cleanup clean | **Passed for propagation; failed product gate** |
| SIGINT / Ctrl-C | Stop child/server and clean | Exit 130; PostgreSQL and temp artifacts remained | **Failed** |
| SIGTERM | Stop child/server and clean | Exit 143; PostgreSQL and temp artifacts remained | **Failed** |
| Socket creation/free-port failure | Clean prior allocations | Setup occurs before `try`; leak path exists | **Failed by inspection** |
| Port race | Bind or fail clearly | TOCTOU window exists; expected to fail loudly | **Allowed low risk, documented** |

### Recovery

Signal failures required manual process termination and filesystem cleanup. That violates the intended self-contained disposable workflow.

### Workflow coherence

The command is understandable from script comments and the handoff, but not discoverable in canonical contributor guidance. A normal run is coherent; cancellation creates hidden operational state and no final “destroyed” confirmation.

---

## 9. Contract and Interface Review

### Product contracts

No domain, API, event, database, authentication, authorization, or product DTO contract changed.

### Developer CLI/lifecycle contract

| Contract element | Expected | Actual | Classification |
|---|---|---|---|
| Entry point | `npm run test:ephemeral [command...]` | Implemented | Preserved |
| Default command | Root `vitest run` | Implemented | Preserved |
| Database target | Local `clarity_dev`, unique port | Implemented | Preserved |
| Environment | Wrapped command receives generated `DATABASE_URL` | Implemented | Preserved |
| Exit code | Propagate wrapped command status | Verified with 7 | Preserved |
| Ordinary cleanup | Stop/delete after success/failure | Verified | Preserved |
| Interrupt cleanup | Stop/delete on user/agent cancellation | Missing | **Incompletely implemented** |
| Dependency/client branch identity | Use current branch | Parent checkout client used | **Broken** |
| Documentation | Canonical discoverability | Missing | **Incomplete** |

### Safety contract

`assertLocalClarityDevDatabase` remains unchanged. Host and database-name constraints are preserved.

### CTR-10

The handoff gives commands, counts, assumptions, deviations, and limitations, but it overclaims outcome delivery and omits material lifecycle behavior. CTR-10 is **incompletely satisfied**.

---

## 10. Domain and Business-Rule Review

No domain entity, state machine, case rule, approval rule, ownership rule, deadline, or escalation rule changed.

The only authoritative rules in scope are infrastructure rules:

| Rule | Source | Enforcement | Coverage | Result |
|---|---|---|---|---|
| Only local `clarity_dev` may receive tests | `prismaClient.ts:15-26` | Test harness | Focused run + unchanged code | **Passed** |
| Each run uses its own migration ledger | NFR-11/WP-11 | Separate PostgreSQL instance | Focused + parallel runs | **Passed normally** |
| Completion evidence must be honest | EP-P11/CTR-10 | Documentation/review | Handoff inspection | **Partially passed** |
| Full isolated suite must pass | WP acceptance | Test gate | Fresh full run | **Failed** |

---

## 11. Data and Migration Review

### Schema and migration change

- Schema changes: none.
- Migrations added/changed: none.
- Forward deployment: all 12 branch migrations applied successfully to fresh instances.
- Backfill/nullability/constraint risk: not applicable.
- Rollback/recovery for durable data: not applicable to a disposable synthetic instance.

### Persistence and isolation

- The runner uses a new data directory and port.
- The developer database retained 16 migration rows before and after an isolated probe.
- Parallel instances used distinct ports and ledgers.
- Normal completion removed its runner-owned artifacts.
- Signals left the fresh synthetic cluster live until manual remediation.

### Data verdict

**Requires remediation.**

No production data loss or schema risk was found. The cancellation behavior violates the disposable-data lifecycle and leaves a loopback, trust-authenticated PostgreSQL instance running.

---

## 12. Permission and Tenant-Isolation Review

No permission surface changed, so product authorization acceptance is not applicable to new behavior.

| Actor | Resource | Action | Expected | Actual | Enforcement | Result |
|---|---|---|---|---|---|---|
| Runner | Developer's port-5432 DB | Write/drop | Never | Migration count unchanged | Separate port/data dir | **Passed** |
| Test process | Fresh local `clarity_dev` | Read/write synthetic fixtures | Allowed | Allowed | Guard + generated URL | **Passed** |
| Remote/non-`clarity_dev` target | Database | Test writes | Refused | Guard unchanged; not newly exercised here | `assertLocalClarityDevDatabase` | **Verified by inspection** |
| Existing product actors | Tenant-scoped assignment/idempotency paths | Existing operations | Existing negative tests pass | 16 integration tests abort on schema/client mismatch | Existing service policy | **Blocked as regression evidence** |

The failing integration paths include cross-tenant non-disclosure and permission/idempotency behavior. Their failure is environmental rather than evidence of a changed policy, but they cannot count as verified regression protection.

---

## 13. Error and Recovery Review

| Error/recovery case | Result | Evidence |
|---|---|---|
| Binary missing | Actionable message exists; no allocations yet | Verified by code inspection |
| Startup failure | Log printed and artifacts removed | Independently exercised |
| Migration failure | Non-zero propagated; ordinary `finally` runs | Verified by structure; not separately forced |
| Wrapped non-zero | Exact status propagated and cleanup runs | Independently exercised with exit 7 |
| Full-suite failure | Non-zero and cleanup | Independently exercised |
| SIGINT | Cleanup skipped; manual recovery required | **Failed, reproduced** |
| SIGTERM | Cleanup skipped; manual recovery required | **Failed, reproduced** |
| Pre-`try` socket/port setup failure | Allocated dirs can leak | **Failed by inspection** |
| Stop failure | Error swallowed; removal proceeds | Risk remains; not forced |
| Unexpected exception | Ordinary in-`try` exception handled | Partially verified |

Error messages did not expose secrets or real personal data. The primary failure is missing cancellation-safe recovery.

---

## 14. Test Evidence Review

### Fresh commands

| Command | Scope | Result |
|---|---|---|
| `npm run lint` | Root lint | **Passed** |
| `npm run typecheck` | Root TypeScript | **Passed** |
| `npx tsc --noEmit --listFiles` | Resolution proof | **Passed narrowly:** 527 files; 136 worktree files; 391 parent dependency files; 0 parent package-source files |
| Safe local-form `DATABASE_URL=... npm run prisma:validate` | Prisma schema | **Passed**; deprecation warning |
| `npx vitest run tests/unit tests/security` | Unit/security | **9 files, 103/103 passed** |
| Focused ephemeral migration-integrity | Migration ledger/index | **1 file, 2/2 passed** |
| `npm run test:ephemeral` | Complete root suite | **Failed:** 29/37 files; 327/343 tests |
| Two simultaneous focused ephemeral runs | Parallel isolation | **Both passed 2/2** |
| Wrapped exit-7 probe | Status/cleanup | **Passed** |
| Synthetic startup-failure probe | Diagnostics/cleanup | **Passed** |
| SIGINT and SIGTERM probes | Cancellation cleanup | **Failed** |

### Full-suite failures

Sixteen failures occurred across eight files:

- `case-assignment-atomicity.test.ts` — 4
- `case-command-concurrency.test.ts` — 4
- `authorization-readiness.test.ts` — 1
- `benefits-command-service.test.ts` — 2
- `case-command-service.test.ts` — 1
- `evidence-command-service.test.ts` — 1
- `evidence-review-and-contradictions.test.ts` — 2
- `api-service.test.ts` — 1

The failures affect tenant non-disclosure, assignment atomicity, concurrency, idempotent replay, permission handling, audit rollback, mutation rollback, retry, and API replay evidence.

### Root cause

**Verified:**

```text
@prisma/client:
<repository-root>/node_modules/@prisma/client

Generated client:
<repository-root>/node_modules/.prisma/client
```

The parent-generated client contains `CommandIdempotencyRecord.requestFingerprint` 30 times and Phase-3 prescreen models. This branch's schema contains none of them.

### Test quality

- The migration-integrity test meaningfully compares the branch migration directories with the applied ledger and verifies the active-admission partial index.
- It uses raw SQL and can pass while the generated Prisma client is stale. Its 2/2 result is necessary but insufficient.
- Unit/security evidence is meaningful but bounded.
- No automated test protects the new runner's lifecycle.
- The missing signal tests allowed a real resource-leak defect to escape the handoff.
- App tests were not run and are not counted as passed.

### Test verdict

**Test suite is failing; test evidence is incomplete.**

---

## 15. Regression Review

### Static impact

No existing product implementation changed. The TypeScript mapping corrects source selection without changing package behavior. The database runner is opt-in.

### Dynamic evidence

- 103 unit/security tests passed.
- 327 root tests passed.
- 16 integration tests failed before reaching their intended assertions.
- App tests were not run.
- CI was not run.

### Regression verdict

**Not fully assessed.**

No product regression was identified in the patch, but the package has not restored a valid full regression gate. “No regressions” cannot be claimed.

---

## 16. UX and Product-Coherence Review

No product UI changed, so end-user UX is not applicable.

Developer experience findings:

- The command has clear inline comments and readable progress logs.
- Normal completion clearly reports readiness and destruction.
- The command is absent from canonical contributor guidance.
- Ctrl-C appears to stop the command but silently leaves PostgreSQL running.
- The runner's “mirrors CI” language creates false confidence because local dependency generation differs materially.

Acceptance blocker: hidden infrastructure after cancellation.
High-priority usability issue: canonical command discovery.
Cosmetic preferences: none recorded.

---

## 17. Security and Operational Review

**Security scope:** targeted, not a comprehensive security review.

### Positives

- PostgreSQL listens only on `127.0.0.1`.
- Data is synthetic.
- Temp directories are created by `mkdtemp`.
- Ordinary destructive cleanup targets those exact generated paths.
- No secrets or request bodies are logged.
- No dependency change was introduced.

### Findings

| Finding | Severity | Impact |
|---|---|---|
| Interrupted runner leaves loopback trust-auth PostgreSQL running | High operational / Low security | Resource leak and unintended local database availability |
| Generated client comes from another branch | High verification integrity | Invalidates completion/regression evidence |
| Setup allocations precede cleanup scope | Medium | Inert temp-directory leaks on uncommon failures |
| Port reservation is released before PostgreSQL binds | Low | Loud startup collision possible |
| Local and CI dependency/generation environments differ | Medium verification | Local results do not mirror CI as claimed |

### Operational readiness

**Not adequate for the claimed disposable local-verification workflow.**

It is not being evaluated for demo, pilot, or production use.

---

## 18. Definition-of-Done Assessment

### WP-10

| Criterion | Result |
|---|---|
| Missing source mapping implemented | Passed |
| Worktree product source selected | Passed |
| Literal `baseUrl` implementation | Deviated; approval required |
| Broad dependency/generated-model hermeticity | Failed |
| Quality checks | Passed except combined full-suite gate |
| WP-10 verdict | **Functionally passed narrowly; not independently merge-ready as part of this package** |

### WP-11

| Criterion | Result |
|---|---|
| Fresh local instance/ledger | Passed normally |
| Migration integrity | Passed |
| Parallel sessions | Passed |
| Ordinary success/failure cleanup | Passed |
| Cancellation cleanup | Failed |
| Full isolated suite | Failed |
| Contributor documentation | Failed |
| WP-11 verdict | **Not done** |

### Combined work package

- Required code: partially complete.
- Relevant tests: failing.
- Product contracts: not applicable/unchanged.
- Error behavior: incomplete.
- Permissions: no new surface; regression evidence incomplete.
- Logging: adequate for ordinary paths, missing interrupt completion evidence.
- Documentation: incomplete.
- Acceptance criteria: one failed and one precondition blocked.
- Blocking defects: remain.
- Handoff: materially inaccurate in places.

**Combined WP-10/WP-11 DoD: Not met.**

### Higher levels

| Level | Result | Reason |
|---|---|---|
| VS-02 | Not done | WP-11 fails; WP-12/WP-13 characterization also remains |
| EP-02 | Not done | Not all work packages/slices accepted |
| MS-01 | Not done | Exit gate and decision/governance work remain |
| Internal release | Not done | Suite not green; no accepted ref/merge |
| Demo/pilot/production | Not applicable/out of reach | No user-facing or release scope |

---

## 19. Defect Register

### GOV-01 — No owner-approved acceptance baseline

| Field | Value |
|---|---|
| Severity | High process/governance |
| Acceptance impact | Blocks formal acceptance |
| Evidence | Proposed-status declarations in the PRD and execution architecture |
| Expected | Owner-ratified package criteria and deviation decisions |
| Actual | Untracked proposed artifacts; no owner decision |
| Remediation | Record owner acceptance of the baseline and deviation rulings |
| Reverification | Confirm the accepted criteria before the next acceptance run |

### ENV-01 — Parent-generated Prisma client invalidates isolated full-suite evidence

| Field | Value |
|---|---|
| Severity | High |
| Acceptance impact | Blocks acceptance |
| Requirement | NFR-11 / AC-06 |
| Evidence | 327/343; client resolves from parent; branch/client schemas differ |
| Expected | Branch-local dependencies/generated client; 343/343 |
| Actual | 16 integration failures across eight files |
| Location | Worktree dependency installation/generation flow; runner near `:136-141` |
| Remediation | Isolate dependencies and generate the client branch-locally without changing the parent checkout |
| Reverification | Resolution proof plus complete isolated suite |

### LIFE-01 — SIGINT/SIGTERM leave live PostgreSQL and temp artifacts

| Field | Value |
|---|---|
| Severity | High |
| Acceptance impact | Blocks acceptance |
| Requirement | Disposable lifecycle / error DoD |
| Evidence | Independently reproduced exit 130 and 143; process reparented to PID 1 |
| Expected | Wrapped child/server stopped and runner-created paths removed |
| Actual | Manual cleanup required |
| Location | `scripts/with-ephemeral-database.ts:64-66,141-165` |
| Remediation | Signal-aware child/server teardown with idempotent cleanup |
| Reverification | Automated and manual SIGINT/SIGTERM lifecycle tests |

### LIFE-02 — Setup allocations occur outside cleanup scope

| Field | Value |
|---|---|
| Severity | Medium |
| Acceptance impact | Must fix before acceptance |
| Evidence | Directories/port at `:98-101`; `try` starts at `:107` |
| Expected | Every allocation covered by cleanup |
| Actual | Socket creation/free-port failure can leak directories |
| Remediation | Move allocations under an idempotent cleanup scope |
| Reverification | Forced setup-failure tests |

### TEST-01 — Runner lifecycle lacks regression tests

| Field | Value |
|---|---|
| Severity | Medium |
| Acceptance impact | Must fix with LIFE-01/LIFE-02 remediation |
| Evidence | No test references runner; signal defect escaped |
| Expected | Normal, non-zero, setup-failure, parallel, and signal behavior protected |
| Actual | Manual-only evidence |
| Remediation | Add focused infrastructure lifecycle tests; no product behavior expansion |
| Reverification | Demonstrate tests fail against old behavior and pass after remediation |

### DOC-01 — Canonical contributor guidance and artifact chain are stale

| Field | Value |
|---|---|
| Severity | Medium |
| Acceptance impact | Blocks documentation DoD |
| Evidence | No `test:ephemeral` in README/AGENTS/contributor guidance; execution plan retains obsolete instructions |
| Remediation | Document the command; update PRD/execution/WP/test map after deviation approval |
| Reverification | Link/reference and content checks |

### DOC-02 — Handoff contains material inaccuracies

| Field | Value |
|---|---|
| Severity | Medium |
| Acceptance impact | Handoff must be corrected before acceptance |
| Evidence | 135 vs 176 lines; omitted Prisma env; “mirrors CI”; “outcome delivered”; incomplete signal risk |
| Remediation | Correct claims, commands, environment, risks, and verdict |
| Reverification | Claim-by-claim comparison |

### PORT-01 — Free-port selection has a TOCTOU window

| Field | Value |
|---|---|
| Severity | Low |
| Acceptance impact | Non-blocking; documented limitation |
| Evidence | Reservation closes at `:59`; PostgreSQL binds later |
| Remediation | Optional stronger port reservation/retry strategy |
| Reverification | Parallel/stress run if changed |

---

## 20. Deviation and Change-Control Review

| ID | Deviation | Reported | Necessary | Authorized | Classification | Required action |
|---|---|---|---|---|---|---|
| D-01 | PostgreSQL instance instead of uniquely named database | Yes | Yes under unchanged guard | No recorded approval | **Requires approval** | Ratify and update artifact chain |
| D-02 | `baseUrl` not added | Yes | Smallest working change; current TS resolves paths without it | No recorded approval | **Requires approval** | Ratify or add it; correct diagnosis |
| D-03 | `LC_ALL=C` and startup-log behavior added | Yes | Verified necessary locally | No recorded approval | **Acceptable with documentation** | Record in plan/handoff |
| D-04 | Parent dependencies/generated client retained | Disclosed as CR-04, not framed as accepted deviation | No; defeats outcome | No | **Requires remediation** | Isolate dependencies/client |
| D-05 | Command remains opt-in despite “every session” wording | Disclosed | Operational choice unresolved | No | **Requires approval** | Decide default/adoption policy |

The implementation must not silently become the specification. D-01/D-02/D-03 require owner/technical ratification and artifact updates.

---

## 21. Product Claims Versus Verified Truth

| Implementation claim | Independent finding | Status |
|---|---|---|
| Product outcome delivered | Only source and normal DB isolation delivered; verification remains untrustworthy | Failed |
| WP-10 complete | Source mapping passes; broader dependency/generated-model hermeticity and deviation approval remain | Partially verified |
| WP-11 mechanism complete | Normal flow works, but cancellation and setup cleanup are defective | Failed |
| Work package complete | Handoff itself says acceptance failed; independent review agrees | Failed |
| Files changed accurately reported | WP scope mostly accurate; line count wrong | Partially verified |
| Contracts preserved | Product contracts preserved; new CLI contract incomplete | Partially verified |
| Tests passed | Exact partial results reproduced; full suite fails | Partially verified |
| Acceptance criteria 5/6 | Reproduced, plus clean-checkout precondition blocked | Verified with added caveat |
| Permissions unaffected | No permission code changed; related regression tests cannot complete | Partially verified |
| Error states handled | Ordinary failures handled; signals and pre-`try` setup are not | Failed |
| No regressions introduced | Static patch is narrow, but full regression evidence is unavailable | Unverified |
| Known limitations complete | CR-04 disclosed; signal/setup/doc gaps omitted | Failed |
| Merge can be safe before CR-04 closes | Package does not meet DoD or central outcome | Failed |
| Next step is CR-04 | Necessary but insufficient; lifecycle defects and approval also require resolution | Partially verified |

---

## 22. Final Acceptance Decision

### Decision: Revision required

The package is materially incomplete against the strongest documented baseline:

- the full-suite must-have fails;
- the core trustworthiness outcome is not delivered;
- cancellation leaves live infrastructure;
- setup cleanup is incomplete;
- the contributor/artifact-chain DoD is unmet;
- the acceptance baseline and deviations are not owner-approved;
- the evidence is not tied to a clean accepted ref.

The work is bounded and recoverable. It does not require reconsidering the broader product direction, so rejection is unnecessarily strong. “Accepted with conditions” is not valid because must-have criteria and high-severity infrastructure behavior fail.

Permitted: targeted remediation after the architecture/owner decision.
Prohibited: merge as complete, begin WP-12 based on this regression gate, or promote VS-02/MS-01/release status.

---

## 23. Required Remediation

Only work required by this verdict:

1. Record the CR-04 technical decision and owner approval for branch-local worktree dependencies/generated Prisma artifacts.
2. Isolate dependency and Prisma-client generation without modifying the parent checkout.
3. Ensure the runner validates or generates the branch-local client before the full suite.
4. Add signal-aware, idempotent teardown for the wrapped child, PostgreSQL server, data directory, and socket directory.
5. Move setup allocations inside the cleanup lifecycle.
6. Add focused infrastructure tests for normal success, wrapped non-zero, startup/setup failure, parallel invocation, SIGINT, SIGTERM, cleanup, and status propagation.
7. Ratify D-01/D-02/D-03 or amend the documented baseline.
8. Add `test:ephemeral` to canonical contributor guidance.
9. Correct the PRD/execution architecture/WP handoff/test map and all invalid completion claims/counts.
10. Produce a clean accepted patch/commit ref.
11. Rerun every acceptance gate and record the exact commands, targets, versions, counts, and cleanup evidence.

No product, UI, API, schema, migration, or unrelated refactor belongs in this remediation.

---

## 24. Next Valid Step

**Resolve and record CR-04: approve the branch-local dependency and Prisma-generation strategy before changing the runner or installing dependencies.**

After that decision, return the package for targeted remediation; do not continue to WP-12.

---

# Acceptance Verdict

**Revision required**

## Intended Product Outcome

Make worktree completion claims trustworthy through hermetic typechecking and a fresh per-session database/regression gate.

## Verified Product Outcome

Worktree package-source resolution is corrected, and normal invocations receive an isolated migrated PostgreSQL instance. The full regression claim remains untrustworthy, and cancellation leaks live infrastructure.

## Work Package

WP-10 — Make typecheck hermetic; WP-11 — Per-session ephemeral database.

## Requirements

- Passed: **9**
- Partially passed: **5**
- Failed: **2**
- Unverified: **0**
- Blocked: **1**

## Acceptance Criteria

- Passed: **5**
- Failed: **1**
- Unverified: **0**
- Blocked: **1**

## Blocking Defects

GOV-01, ENV-01, LIFE-01, LIFE-02, TEST-01, DOC-01, DOC-02.

## Security or Data Blockers

Interrupted runs leave a loopback trust-auth PostgreSQL process and temporary synthetic database artifacts. No production/real-data exposure was identified.

## Regressions

Not fully assessed: 103 unit/security tests pass, but 16 integration tests fail before validating their intended behaviors; app and CI gates were not run.

## Approved Limitations

System-only outcome; synthetic/local environment; no product/UI/API/schema/migration scope; app E2E/accessibility/performance/formal security sign-off outside this package.

## Unapproved Deviations

D-01, D-02, D-03, D-04, D-05.

## Required Remediation

Isolate branch dependencies/generated Prisma client; make cleanup signal- and setup-safe; add lifecycle tests; update contributor/artifact documentation; produce a clean ref; rerun all gates.

## Reverification Required

Lint; typecheck plus complete resolution proof; Prisma validation; generated-client branch identity; unit/security; focused migration integrity; parallel isolation; ordinary/non-zero/startup/setup/SIGINT/SIGTERM cleanup; full 343-test ephemeral suite; developer DB unchanged; clean final status.

## Permitted Next Action

Record the CR-04 architecture decision, then return WP-10/WP-11 for targeted remediation.

## Prohibited Next Action

Do not merge this package as complete, begin WP-12, or claim VS-02, EP-02, MS-01, internal-release, pilot, or production readiness.

## Immediate Next Step

Approve or reject the branch-local worktree dependency and Prisma-generation strategy in CR-04.
