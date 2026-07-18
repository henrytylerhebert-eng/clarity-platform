---
status: Verified implementation; owner acceptance pending
owner: Tyler/product owner with technical review
date: 2026-07-18
branch: main
head: 8af3e69d0f7d057d2ed903c78f3e7428b131e492
data_boundary: synthetic only
related_artifacts:
  - clarity-analytics-return-package/17_CODEX_EXECUTION_HANDOFF.md
  - clarity-analytics-return-package/04_DOMAIN_AND_EVENT_MODEL.md
  - packages/domain-contracts/src/episode.ts
  - packages/domain-contracts/src/utilizationReview.ts
  - packages/domain-contracts/src/analytics.ts
  - tests/unit/episode-utilization-contracts.test.ts
  - tests/unit/analytics-contracts.test.ts
---

# S1 Review And Acceptance Record

## Purpose

This record captures the reviewable evidence for S1: domain contracts and deterministic logic for episode identity, episode-owned post-admission utilization review, governed events, episode-day authorization derivation, and draft metric definitions.

This is an acceptance record, not an S2 execution authorization. The earlier owner instruction authorized implementation of S1. Explicit post-implementation acceptance as the foundation for persistence remains a separate owner decision below.

## Source And Truth Classification

| Artifact | Classification | Authority in this record |
|---|---|---|
| `packages/domain-contracts/` | Source | Implemented contract and pure-logic behavior |
| `tests/` | Source/evidence | Focused and regression behavior |
| Test, typecheck, lint, and build output | Derived evidence | Current-session verification only |
| `clarity-analytics-return-package/` | Reference/context | Proposed design input; not transactional truth |
| This document | Review artifact | Records evidence and owner decisions; does not replace canonical code or ADRs |

## Preflight

- Repository: `/Users/tylerhebert/Documents/clarity-platform`
- Remote: `https://github.com/henrytylerhebert-eng/clarity-platform.git`
- Branch: `main`
- HEAD: `8af3e69d0f7d057d2ed903c78f3e7428b131e492`
- Worktree: already dirty before S1 documentation; existing user changes were preserved.
- S1 additions: three domain modules, barrel exports, one synthetic fixture file, and two focused test files.

## Implemented S1 Contract Surface

### Episode

- Episode identity and lifecycle: `ACTIVE`, `DISCHARGED`, `CLOSED`.
- Explicit lifecycle transition guard.
- Admission handoff input with caller-owned organization, actor, role, acceptance-decision, event-classification, and metric fields rejected.
- Case-to-episode link relationships: `ADMISSION_SOURCE`, `TRANSFER_SOURCE`, `READMISSION_SOURCE`.
- Facility timezone configuration requires an explicit facility-configuration source and source reference.
- Facility-local service-date derivation uses the supplied timezone only.

### Episode-owned utilization review

- Separate post-admission episode authorization requirement and lifecycle.
- Review types and decision statuses.
- Inclusive authorization date ranges.
- Approved, denied, and pending day decisions.
- Controlled denial reasons; denied ranges require a reason.
- Documentation-gap categories, statuses, and allowed transitions.
- Utilization-review assignment contract.
- Review corrections require a superseded event and controlled reason code.

### Episode-day authorization derivation

- Coverage outcomes: `NOT_REQUIRED`, `APPROVED`, `DENIED`, `PENDING`, `EXPIRED`, `UNREQUESTED`, `UNKNOWN`.
- Separate risk codes for due soon, overdue, expiring soon, expired, documentation gaps, source disagreement, and incomplete data.
- Conflicting active approved/denied overlap returns `UNKNOWN` plus `SOURCE_DISAGREEMENT`.
- Risk flags may overlap an outcome; `atRisk` is derived from risk codes and never replaces coverage status.
- Superseded facts are excluded from active derivation.
- Evaluation time and thresholds are explicit inputs; the pure logic does not call the current clock.
- Output includes quality state, active lineage IDs, excluded superseded IDs, timezone, and derivation version.

### Governed events and metrics

- Strict governed event envelope with tenant/scope, aggregate, subject, time, actor/source, correlation, quality, review, correction, metric eligibility, payload hash, and payload.
- Event-specific payload schemas are separate from the envelope.
- Corrections append a new event, preserve the original, and resolve active history through supersession.
- Draft metric registry contract with code-owned terms and filters; arbitrary SQL or expression execution is not supported.
- Draft definitions cover approved, denied, pending, expired, at-risk patient days, open documentation gaps, concurrent reviews due, and a clearly draft denied decisioned-day rate.
- `NO_MEASUREMENTS_FOUND` remains distinct from a calculated numeric zero.

## Focused Test Behaviors

The focused S1 suite contains 20 test behaviors:

1. Accept a valid synthetic admission handoff.
2. Reject caller-supplied organization, actor, roles, and acceptance-decision fields.
3. Require facility-owned timezone provenance.
4. Derive a facility-local service date from the supplied timezone.
5. Reject an unknown timezone.
6. Enforce episode lifecycle transition boundaries.
7. Validate the case-to-episode link shape.
8. Accept an inclusive one-day range.
9. Reject reversed date ranges.
10. Require controlled denial reasons and reject reasons on non-denials.
11. Allow approved documentation-gap transitions and reject terminal-state transitions.
12. Validate episode authorization and authorization review records.
13. Validate a documentation-gap record.
14. Require a superseded event and reason for review corrections.
15. Derive approved, denied, and pending coverage.
16. Derive expired, unrequested, not-required, and unknown coverage.
17. Quarantine conflicting approved/denied overlap as unknown with source disagreement.
18. Keep overlapping risk flags separate from approved coverage and deduplicate them.
19. Exclude superseded facts and produce deterministic repeated output.
20. Validate governed correction behavior, append-only history, draft metrics, denominator requirements, and no-measurement state.

## Intentional Exclusions

S1 did not modify or add:

- Prisma schema or migrations.
- API routes or API framework.
- Service runtimes or repository persistence.
- Projection workers or analytics marts.
- Frontend workspaces, navigation, or Product Studio.
- External integrations, deployment configuration, or production feature flags.
- Autonomous clinical, admission, discharge, legal, placement, payer, or authorization decisions.
- Real PHI, PII, payer identifiers, credentials, or external endpoints.

Existing pre-admission authorization-readiness behavior remains in `packages/domain-contracts/src/authorization.ts` and was not modified.

## Verification Evidence

| Check | Result |
|---|---|
| Focused S1 tests | Passed: 2 files, 20 tests |
| `npm test` | Passed: 30 files, 242 tests |
| `npm run typecheck` | Passed |
| `npx eslint packages tests` | Passed |
| `npm run test:app` | Passed: 10 files, 64 tests |
| `cd app && npm run build` | Passed |
| `git diff --check` | Passed |
| `npm run lint` | Blocked by unrelated `clarity-platform-visualizer` ESLint/plugin incompatibility: `contextOrFilename.getFilename is not a function` |

The full-lint failure is recorded technical debt. It is outside S1 and is not a reason to expand S2.

## Open Questions Before S2

- Whether Tyler accepts this S1 implementation as the foundation for persistence.
- Episode-to-case cardinality beyond the first approved admission-source rule.
- Canonical ownership and identity for facility, program, and unit.
- Timezone source versioning and correction policy.
- Transactional source tables versus governed event tables and outbox boundary.
- Correction-chain persistence and active-branch enforcement.
- Idempotency and optimistic-concurrency storage rules.
- Audit and outbox atomicity requirements.
- Tenant enforcement and whether RLS enters S2 or a later slice.
- Additive migration and rollback strategy.
- Whether S2 includes a thin repository/gateway layer or stops at Prisma persistence.

## Owner Acceptance

S1 implementation acceptance as the foundation for an S2 persistence design:

- Decision: `[x] Accepted`  `[ ] Changes requested`  `[ ] Deferred`
- Owner: Tyler / product owner
- Date: 2026-07-18
- Notes: S1 is accepted as the synthetic-only domain-contract foundation. This does not authorize production data, deployment, autonomous decisions, or expansion beyond the bounded S2 persistence scope.

S2 authorization is recorded separately in `docs/decisions/S2_PERSISTENCE_DECISION_PACKET.md` and remains limited to the bounded synthetic-only persistence scope described there.
