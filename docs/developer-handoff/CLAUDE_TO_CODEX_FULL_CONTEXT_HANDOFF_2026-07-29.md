# Claude → Codex Full-Context Session Handoff

**Project:** Clarity Platform
**Prepared:** 2026-07-29 (America/Chicago)
**Purpose:** Start a new Codex session with the complete product, planning, execution, implementation, verification, and cross-session memory needed to continue this lane without restarting or losing boundaries.

---

## Paste This Into the New Session

> Continue the Clarity work exactly where the July 29 Claude session left off. Treat this handoff and the linked repository artifacts as context, but verify the live checkout before making current-state claims.
>
> Work in:
>
> `<historical-worktree>`
>
> Read `AGENTS.md`, then this file, then the four artifacts in **Artifact chain** below. Preserve every existing uncommitted change. Do not reset, clean, switch branches, merge, commit, install dependencies, or run `prisma generate` unless I explicitly authorize it.
>
> The immediate blocker is CR-04: this worktree resolves `@prisma/client` from the parent checkout, so its generated Prisma client does not match this branch's schema. First verify the repository state and explain the safest bounded options for isolating per-worktree dependencies. Do not execute that fix until the owner/tech-lead decision is explicit.
>
> Keep these boundaries intact: synthetic data only; no production-readiness, HIPAA-compliance, clinical, legal, payer, placement, or outcome claims without the required evidence and human approval. Separate verified current facts from historical session evidence, proposals, inference, and unknowns.

---

## 1. Real Target and Current Checkout

The desktop task opened with a stale local path as its working directory, but that path did not exist when this handoff was prepared. The live repository and the relevant Claude worktree were:

```text
Repository: <repository-root>
Worktree:   <historical-worktree>
Remote:     https://github.com/henrytylerhebert-eng/clarity-platform.git
Branch:     claude/repo-product-intelligence-a4a509
HEAD:       8399eddad4cb8575d94f9b31db27eb00f73e4bcf
Base:       origin/main at the same commit when checked
```

The July 29 Claude session made no commit. Its work remains uncommitted:

```text
 M package.json
 M tsconfig.json
?? docs/developer-handoff/WP-10-11_IMPLEMENTATION_HANDOFF.md
?? docs/product/EXECUTION_ARCHITECTURE.md
?? docs/product/PRODUCT_BUILD_PLAN_AND_REQUIREMENTS.md
?? docs/product/REPOSITORY_PRODUCT_INTELLIGENCE_BRIEF.md
?? scripts/with-ephemeral-database.ts
```

This handoff is an additional untracked file. Preserve all of these files as one shared lane. Do not absorb unrelated changes from the parent checkout.

---

## 2. Source Session Reviewed

The most recent local Claude session associated with this project was verified by modification time and transcript content:

```text
Session ID:
[local session identifier redacted]

Transcript:
[local session transcript path redacted; derived execution state, not project truth]

Session window:
2026-07-29 18:59–19:59 America/Chicago
```

The user-supplied WP-10/WP-11 package was also reviewed:

```text
[local user attachment path redacted; source was reviewed in-session]
```

The Claude session is one continuous chain with four phases:

1. Reconstruct the real product from repository evidence.
2. Convert that assessment into a product direction, PRD, and build plan.
3. Convert the plan into an execution architecture and work packages.
4. Execute the first dependency-free engineering package, WP-10 + WP-11.

---

## 3. Artifact Chain

Read these in order. Later artifacts correct some claims in earlier ones.

1. [`docs/product/REPOSITORY_PRODUCT_INTELLIGENCE_BRIEF.md`](../product/REPOSITORY_PRODUCT_INTELLIGENCE_BRIEF.md)
   - 23-section evidence-led product assessment.
   - Reconstructs users, workflows, implementation, product story versus truth, maturity, contradictions, and immediate decisions.
   - Its original `342/343` branch-baseline claim was invalidated later in the same session. Do not repeat that number as branch truth.

2. [`docs/product/PRODUCT_BUILD_PLAN_AND_REQUIREMENTS.md`](../product/PRODUCT_BUILD_PLAN_AND_REQUIREMENTS.md)
   - 15-artifact plan: direction, decisions, minimum complete product outcome, focused PRD, scope, slices, change map, validation, backlog, milestones, and risk-first plan.
   - The recommended user/workflow is conditional on decision D1.

3. [`docs/product/EXECUTION_ARCHITECTURE.md`](../product/EXECUTION_ARCHITECTURE.md)
   - 22-part execution model with milestones, epics, slices, work packages, contracts, test traceability, handoff rules, change control, and first package.
   - Corrects the earlier claim that all candidate gateway reads were already tested.

4. [`docs/developer-handoff/WP-10-11_IMPLEMENTATION_HANDOFF.md`](WP-10-11_IMPLEMENTATION_HANDOFF.md)
   - Detailed implementation and verification record for hermetic typecheck and the ephemeral PostgreSQL runner.
   - This is the immediate technical handoff, subject to the live corrections in this document.

---

## 4. Stable Product and Governance Memory

These are standing boundaries, not feature suggestions:

- Clarity is a behavioral-health case-intelligence and access-orchestration project. It is not a deployed clinical system.
- The local prototype and current development work are synthetic-only.
- Human approval remains final for clinical, legal, admission, discharge, placement, authorization, payer, security, operational, product, and release decisions.
- Output is not evidence. A document, demo, route, generated client, passing command, or polished UI proves only the specific thing verified.
- A historical test result must be rerun before it becomes a current-state claim.
- Preserve dirty worktrees and concurrent agent/user work. Never reset or silently merge lanes.
- Fail-closed rules and tenant boundaries must not be weakened to make tests pass.
- Product Studio and prototype surfaces are projections/demos, not canonical mutation or release-control systems.
- `Unknown`, `[Unverified]`, and `No measurements found` are required when evidence is absent.

The repository's intended case spine is:

```text
referral
→ intake
→ source-linked evidence
→ parallel clinical/legal/benefits/authorization/placement workstreams
→ packet
→ routing
→ custody
→ audit
```

The working code, tests, schemas, and current status records outrank aspirational or stale prose.

---

## 5. Product Findings Carried Forward

### Product direction is unresolved

The repository contains incompatible product theses and user definitions:

- One thesis centers a receiving-facility/case-coordination product.
- Another open-branch thesis centers a public-safety coordination directory and grant-funded operating model.
- Different documents name different primary users.

Do not silently select one. Decision D1 must name the primary user, and D2 must classify the public-safety/grant thesis as the product, a funding strategy, or a parked bet.

### Proposed minimum complete outcome

The plan proposes, conditionally:

> For an `INTAKE_COORDINATOR`, move a referral into an owned, prioritized, explainable, closed case whose full history can be read back after reload.

This is a proposed synthesis, not an approved product fact. If D1 selects a field responder or cross-organization actor, the PRD, permissions, data boundary, and slices must be re-derived.

### Structural findings

- **F1 — no real case-spine entry point:** `CreateCase` requires `patientTokenId`, but no command/service/gateway creates a `PatientToken`; only raw Prisma setup code does.
- **F2 — read layer without read policy:** tested tenant-scoped case reads exist, but reads do not have an explicit service-layer role policy or audit decision.
- **F3 — no audit-read path:** production code writes audit events, while tests read them with raw Prisma. The user-facing audit timeline needs a new gateway/read path.
- **TG-01 correction:** five gateway reads have no test references and no service-layer callers: `listDocumentsForCase`, `listEvidenceForCase`, `listCoveragesForCase`, `findEvidence`, and `findCoverage`. Treat them as speculative surface until characterized or removed.
- **Reachability remains the main implementation gap:** much of the backend service foundation is not reachable through a complete browser workflow.

### High-priority product/governance decisions

- **D1:** Name the primary user.
- **D2:** Resolve the product-thesis conflict.
- **D3:** Have an authorized privacy owner determine the tracked workbook's data classification; do not inspect or distribute possible PHI casually.
- **D4:** Remove or correct any unsupported “HIPAA-compliant” claim.
- **D7:** Decide read authorization and read auditing before exposing reads.
- **D8:** Define acceptable `PatientToken` input and the initial PHI boundary.
- **D9:** Execute or defer the Fastify/API architecture decision before expanding routes.
- **D10:** Define pilot data classification and environment before external use.

The non-engineering decisions WP-01 (primary user) and WP-03 (workbook data status) are high leverage, but this session did not close them.

---

## 6. WP-10 + WP-11 Implementation State

### WP-10 — Hermetic typecheck

Implemented in `tsconfig.json`:

```json
"@clarity/prescreen-service": ["./packages/prescreen-service/src/index.ts"]
```

The execution plan originally called for `baseUrl`. Claude correctly discovered that TypeScript 5.7 accepts these relative `paths` entries without it. The missing package mapping was the actual defect, so `baseUrl` was not added.

Current verification:

```text
npm run lint                         Passed
npm run typecheck                    Passed
npx tsc --noEmit --listFiles         Passed
Parent-checkout package files         0
Worktree prescreen-service files      8
```

WP-10 is complete on the current uncommitted tree.

### WP-11 — Per-session database isolation

Implemented:

- `scripts/with-ephemeral-database.ts`
- `package.json` script: `test:ephemeral`

The runner creates a per-session PostgreSQL **instance**, not merely a uniquely named database:

1. Creates a temporary data directory.
2. Selects a loopback port.
3. Initializes and starts PostgreSQL.
4. Creates a database literally named `clarity_dev`.
5. Runs `prisma migrate deploy`.
6. Runs the wrapped command.
7. Stops PostgreSQL and removes the data/socket directories in `finally`.

This design preserves `assertLocalClarityDevDatabase` unchanged. A unique database name would fail the guard, and two databases named `clarity_dev` cannot coexist on one server. Separate servers on separate ports satisfy the unchanged guard.

Platform details that must be preserved:

- The Unix socket directory must use a short path because PostgreSQL's macOS socket-path limit is 103 bytes.
- `LC_ALL=C` is applied consistently to `initdb` and `pg_ctl` because PostgreSQL 18 failed to start under the inherited locale.
- Startup failures print the server log before cleanup removes the data directory.
- `--auth=trust`, `fsync=off`, and `--no-sync` are valid only for this loopback-only, synthetic, disposable cluster.

Fresh verification while preparing this handoff:

```text
npm run test:ephemeral -- npx vitest run tests/integration/migration-integrity.test.ts
Result: 2/2 passed
Migrations applied: 12/12
Cleanup: runner reported the data directory destroyed
```

WP-11's mechanism works. Its full-suite acceptance criterion is not complete.

---

## 7. Blocking Technical Finding: CR-04

The worktree has a local `node_modules` directory containing only tool caches, not a complete dependency installation. Node therefore walks upward and resolves:

```text
@prisma/client:
<repository-root>/node_modules/@prisma/client

Generated client:
<repository-root>/node_modules/.prisma/client
```

That parent checkout is on `codex/om/prescreen-phase3-fix`. Its generated client contains:

- `CommandIdempotencyRecord.requestFingerprint` (30 type-declaration occurrences)
- `PrescreenEncounter`
- `PrescreenAssessmentVersion`
- other Phase-3 prescreen models

This worktree's schema contains none of those additions. Therefore the generated client and the 12-migration ephemeral database describe different schemas.

Historical Claude evidence from the source session:

```text
Shared developer database: 342/343, migration-integrity failed
Ephemeral branch database: 327/343, 16 failed
Ephemeral migration-integrity: 2/2 passed
Unit + security: 103/103 passed
```

All 16 ephemeral full-suite failures reduced to the mismatched generated client expecting `CommandIdempotencyRecord.requestFingerprint`.

Interpretation:

- `342/343` was not a valid measurement of this branch.
- The shared database happened to match the parent-generated client, hiding the branch mismatch.
- WP-11 isolated the database and exposed a second contamination channel: shared generated dependencies.
- No full-suite result from this worktree should be promoted as trustworthy until CR-04 is resolved and rerun.

### Decision required

Approve or reject:

1. A complete, isolated `node_modules` installation per worktree.
2. Adding `prisma generate` to the ephemeral runner after dependency isolation.

Do **not** run `prisma generate` before isolation. In the current state it writes into the parent checkout's shared generated client and can break the parent's active Phase-3 lane.

CR-05 also remains: ratify the ephemeral-instance approach as the standing interpretation of WP-11.

---

## 8. Corrections and Drift to Keep Visible

Later evidence supersedes these earlier claims:

| Earlier claim | Current truth |
|---|---|
| This branch was `342/343` | Invalid measurement caused by a shared database and parent-generated Prisma client |
| All proposed gateway reads existed and were tested | Only the relevant case reads were confirmed tested; five gateway reads are uncalled and untested |
| Add `baseUrl` to fix worktree typecheck | Not required in TypeScript 5.7; the missing prescreen-service path mapping was sufficient |
| WP-11 should create a uniquely named database | The unchanged guard requires `clarity_dev`; a separate ephemeral PostgreSQL instance is required |
| `scripts/with-ephemeral-database.ts` is 135 lines | Current file is **176 lines** |
| Bare `npm run prisma:validate` always passes | In a shell without `DATABASE_URL`, it fails with P1012; with a safe local-form URL it validates successfully |

Also note: `ARCHITECTURE.md` contains stale prose claiming there is no backend/API/auth/tenancy enforcement. The product brief flags that contradiction; this session did not edit the stale source.

---

## 9. Verification Performed While Preparing This Handoff

These are current checks from the live worktree:

| Check | Result |
|---|---|
| Target/remote/branch/HEAD/status | Verified |
| `git diff --check` | Passed |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npx tsc --noEmit --listFiles` | 0 parent-checkout package files; 8 worktree prescreen-service files |
| Bare `npm run prisma:validate` | Failed: `DATABASE_URL` absent |
| Prisma validate with safe local-form `DATABASE_URL` | Passed; deprecation warning for `package.json#prisma` |
| Focused ephemeral `migration-integrity` | 2/2 passed; 12 migrations applied; cleanup reported |
| Full ephemeral suite | Not rerun while preparing this handoff |
| App tests/build/smoke | Not run |
| Security/audit/performance checks beyond the above | Not run |

The historical Claude results remain evidence from that session, not fresh current verification unless listed above.

---

## 10. Safe Next Move

### First: review and decide CR-04

The next agent should:

1. Re-run the repository preflight.
2. Confirm dependency resolution with `require.resolve`.
3. Review the safety and disk/install-time implications of per-worktree dependencies.
4. Present the smallest bounded implementation option.
5. Wait for explicit owner/tech-lead approval before installing dependencies or changing Prisma generation behavior.

### If CR-04 is approved

The bounded engineering objective is:

1. Give this worktree a complete isolated dependency tree.
2. Ensure `@prisma/client` and `.prisma/client` resolve inside this worktree.
3. Add `prisma generate` to the ephemeral flow at the correct point if approved.
4. Add or update a focused harness test if included in the approved package.
5. Run lint, typecheck, Prisma validate, hermetic file-resolution proof, unit/security, focused migration-integrity, then the full ephemeral suite.
6. Record actual counts; do not assume `343/343`.
7. Update the brief, build plan, execution architecture, and WP handoff wherever the invalid baseline or old WP-11 wording appears.
8. Reassess WP-11 against its Definition of Done.

### If CR-04 is not approved

Keep WP-11 partially complete, record the chosen alternative and its tradeoffs, and do not begin WP-12 on the premise that the worktree suite is trustworthy.

### Still not authorized

- No product route/UI/schema work.
- No change to tests merely to obtain green.
- No weakening `assertLocalClarityDevDatabase`.
- No inspection or distribution of possible PHI in the workbook.
- No PR merge/close, branch-protection change, commit, push, or deployment.
- No edits to the parent checkout's active changes.

---

## 11. Commands for a New Session

Run from the exact worktree path:

```bash
pwd
git remote -v
git status --short --branch
git rev-parse HEAD
git diff --check

node -p "require.resolve('@prisma/client/package.json')"
node -p "require.resolve('.prisma/client/package.json')"

npm run lint
npm run typecheck

DATABASE_URL='postgresql://clarity_local@127.0.0.1:5432/clarity_dev?schema=public' \
  npm run prisma:validate

npm run test:ephemeral -- \
  npx vitest run tests/integration/migration-integrity.test.ts
```

Do not run the full suite or `prisma generate` until you have confirmed which generated client will be used and where it will be written.

---

## 12. Handoff Definition of Done for the Next Session

Before claiming CR-04/WP-11 complete, require:

- The worktree resolves all dependencies and generated Prisma artifacts from its own isolated tree.
- The parent checkout is unchanged.
- The worktree's schema, migrations, and generated client describe the same branch state.
- Lint and typecheck pass.
- Typecheck includes no source files from outside the worktree.
- Prisma schema validation passes with the environment requirement explicitly stated.
- `migration-integrity` passes on the ephemeral instance.
- The complete ephemeral suite passes with recorded test/file counts, or remaining failures are reported without a completion claim.
- Cleanup leaves no runner-created database or socket directories and no stray runner-owned PostgreSQL process.
- Tests were not skipped or weakened.
- Documentation corrections are made through the entire artifact chain.
- CR-04 and CR-05 decisions and owners are recorded.
- No production, compliance, clinical, legal, security, or measured-outcome claim is inferred from local engineering evidence.

---

## 13. Short Status Summary

Clarity's next product direction is still conditional on unresolved owner decisions. The July 29 session nevertheless completed the product assessment, build plan, execution architecture, and the first engineering package.

WP-10 is complete on the uncommitted worktree. WP-11's ephemeral-instance mechanism is working and freshly reconfirmed for migration integrity, but full-suite acceptance remains incomplete because the worktree shares a generated Prisma client with a different parent branch.

The next valid engineering action is not a product slice. It is an explicit CR-04 decision followed, if approved, by isolated per-worktree dependencies, branch-local Prisma generation, and a fresh full-suite measurement.
