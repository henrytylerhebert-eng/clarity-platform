# Clarity Scope Ledger

Date: 2026-07-19  
Base: `codex/om/sync-main` at `504037c93762d1cea4875064aa5491b67373e93d`  
Purpose: separate the current dirty worktree into reviewable local branches without changing the source checkout.

During ledger creation, `codex/om/sync-main` advanced to `884a8a0` with three
commits. Those commits are preserved as existing work and are assigned here:

- `fb9f5dd` `feat: add prescreen domain contract slice` -> Prescreen integration.
- `5489b5e` `feat: add synthetic operations backbone` -> Directory and operations.
- `884a8a0` `fix: replay admissions across active-check races` -> Journey POC admission persistence support.

The scope branches are reconstructed from the pre-slice base plus the shared
ledger so each requested scope remains independently reviewable; no existing
commit is rewritten.

## Branches

| Scope | Branch | Commit intent | Boundary |
|---|---|---|---|
| Journey / Prescreen / Stage 2 / Admit / Discharge / Payer POC | `codex/om/journey-poc` | Synthetic local workflow and derived read-only projections | No production API, persistence, auth, notification, payer, facility, or clinical authority |
| Directory CRM and operations backbone | `codex/om/directory-operations` | Synthetic directory and operations discovery artifacts | No live capacity, referral send, bed reservation, user provisioning, or production permission model |
| Prescreen integration package | `codex/om/prescreen-integration` | Contracts-only prescreen Slice 1 and its reference package | No service, API, Prisma migration, frontend wiring, or production enforcement |
| Bridge, memory, and visualizer changes | `codex/om/bridge-memory-visualizer` | Coordination, local memory, directory-search, and visualizer pointer artifacts | No claim that agent consumption, persistence, or deployment is verified |

The four branches inherit a small ledger-only base commit from `codex/om/scope-ledger`. They are local branches only; no push, merge, or pull request is implied.

## Scope 1: Journey POC

### Included

- Journey Monitor and Case Dependency Map domain evaluators and tests.
- Prescreen local workspace and human triage/disposition gates.
- CIA nursing Stage 2 record, source links, completion evaluator, correction history, and tests.
- Admit checkpoint rail, psychiatrist acceptance, medical clearance, arrival/handoff, and case-owned admission episode adapter.
- Discharge Planning with early-starting family, housing, level-of-care, placement, and follow-up prompts.
- Four operations payer discovery profiles and canonical payer reference review.
- Existing app wiring and shared styles required to render this POC slice.
- `clarity-readiness-ux-return-package/` as the read-only UX/domain handoff for this slice.

### Shared-file note

The current app uses one workspace registry and one stylesheet. The POC branch carries the current app-shell changes in `app/src/App.tsx`, `app/src/App.test.tsx`, `app/src/domain/roles.ts`, `app/src/domain/roles.test.ts`, `app/src/domain/services.ts`, `app/src/domain/types.ts`, and `app/src/styles.css`. Those files contain a small amount of Directory CRM registration because the dirty worktree was developed in parallel. The Directory branch keeps its domain, workspace, and discovery artifacts separately; merging both branches requires a deliberate hunk-level reconciliation of those shared files.

### Not included

- `packages/domain-contracts/src/prescreen/` and the standalone prescreen package.
- Directory CRM domain, operations backbone domain, Apps Script CRM, and bridge/memory files.
- Backend `PayerProfile` / `PlanProfile` persistence.

### Open gates

- Clinical, legal, facility, payer/UR, and level-of-care owner review.
- Payer field/source/escalation approval and VA representation approval.
- Production auth, tenancy/RLS, API, audit, persistence, and notification design.

## Scope 2: Directory CRM And Operations

### Included

- `app/src/domain/directoryCrm.ts` and tests.
- `app/src/domain/operationsBackbone.ts` and tests.
- `app/src/workspaces/DirectoryCrm.tsx`.
- Directory CRM design, map, architecture review, developer handoff, and public-safety research artifacts.
- Apps Script public-safety CRM scaffold and synthetic/source-review-gated research rows.
- Facility CSV parser dependency and `scripts/seed_facilities.ts`, retained as an explicitly unapproved local import tool.
- Inpatient behavioral hospital operations parking-lot documentation.

### Not included

- Production organization/RBAC/RLS implementation.
- Live directory capacity, referral transmission, consult requests, bed reservations, or EMR synchronization.
- Clinical, legal, payer, placement, or admission decisioning.

### Open gates

- Decide whether CSV import tooling belongs in the main repository.
- Review source provenance, facility profile ownership, and data-sharing boundaries.
- Reconcile the Directory workspace wiring with the POC branch shared app shell.

## Scope 3: Prescreen Integration Package

### Included

- `packages/domain-contracts/src/prescreen/` and its root export.
- `tests/unit/prescreen-contracts.test.ts`.
- `clarity-prescreen-integration-package-v1.0.0/` including contracts, schemas, reference code, synthetic fixtures, UX specifications, and verification evidence.
- `docs/decisions/PRESCREEN_SLICE_1_DECISION_RECORD.md`.

### Status

Contracts-only, scaffolded, and locally verified. The package is reference material; repository contracts and tests govern the implemented Slice 1 behavior after review.

### Not included

- Prisma schema or migration.
- Service/repository/API implementation.
- Frontend integration or localStorage migration.
- Production identity, tenancy, RLS, transport exchange, or PHI/PII.

### Open gates

- Final package archival/ownership decision.
- Authenticated role and permission mapping.
- Correction, attestation, supplement, persistence, audit, retention, clinical, legal, security, facility, and transport approvals.

## Scope 4: Bridge, Memory, And Visualizer

### Included

- `agent_bridge/` coordination, directory-search, outbox, and local memory artifacts.
- `agents/bridge/` ledger and inbox status messages.
- `docs/governance/PLATFORM_MEMORY_SYSTEM.md`.
- The `clarity-platform-visualizer` submodule pointer update.

### Not included

- No assertion that a watcher consumed a message.
- No assertion that local memory is a canonical product database.
- No product workflow or production authorization change.

### Open gates

- Confirm canonical ownership of bridge records.
- Decide whether `agent_bridge/memory.db` is tracked, ignored, or exported as text.
- Review the visualizer submodule commit independently.

## Remaining Dirty Artifacts

The original `codex/om/sync-main` checkout also contains the existing review packet `docs/developer-handoff/UNCOMMITTED_WORK_REVIEW_PACKETS_2026-07-19.md`. It is not silently discarded or folded into a feature commit; this ledger supersedes its packet boundaries and records the current verification state.

Existing Claude worktrees, including `feat/journey-monitor` and `feat/prescreen-source-package`, are outside this operation and remain untouched.

## Verification Snapshot Before Scope Commits

- Root tests: `285/285` passed.
- App tests: `98/98` passed.
- Typecheck: passed.
- App production build: passed.
- Prisma validation: passed with the Prisma 7 configuration deprecation warning.
- Lint: currently fails on three errors and two warnings in the untracked prescreen reference package and `scripts/seed_facilities.ts`.
- `git diff --check`: currently fails on trailing whitespace in the current bridge outbox change.
- Browser smoke: `26/26` passed in the earlier implementation checkpoint; not rerun as part of this ledger creation.

## Commit Rule

No branch in this ledger is production-ready. Each commit is a scope-isolation and review artifact. Domain-owner approvals, security controls, backend persistence, and production integrations remain separate work.
