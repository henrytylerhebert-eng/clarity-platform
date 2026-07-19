---
status: H1 implemented; H2 governance records drafted; production hardening remains gated
owner: Tyler/product owner with technical and security review
date: 2026-07-18
data_boundary: synthetic only
evidence:
  - docs/developer-handoff/S2_REVIEW_AND_ACCEPTANCE_RECORD.md
  - docs/developer-handoff/NEXT_PERSISTENCE_HARDENING_EVIDENCE.md
  - docs/decisions/S2_PERSISTENCE_DECISION_PACKET.md
  - 7b52870
---

# Next Persistence Hardening Decision Packet

## Purpose

S2 persistence is implemented and independently verified within its approved
synthetic-only boundary. H1 is now implemented and verified within the narrow
contract and admission-replay boundary recorded below. This packet continues
to separate the remaining persistence hardening, production tenancy, event
vocabulary, and runtime decisions.

## Proposed Boundary

The remaining hardening work now resolves and documents:

- database tenant enforcement and the timing of RLS;
- migration promotion, restore, and recovery evidence;
- production retry ownership and observability after the H1 replay behavior;
- outbox failure, retry, ownership, and observability boundaries;
- governed event vocabulary for review corrections and documentation-gap
  transitions;
- whether command services belong in a later repository-runtime slice.

This packet does not authorize API routes, API framework changes, workers,
outbox dispatch, analytics marts, dashboards, frontend changes, Product Studio,
external integrations, deployment, production flags, or real data.

## Decisions Required

| # | Decision | Current evidence | Human gate |
|---:|---|---|---|
| 1 | RLS timing and database tenant enforcement | Design record drafted; S2 still uses organization predicates and has no RLS migration. | Security and technical approval |
| 2 | Migration recovery model | Promotion/recovery checklist drafted; no production restore evidence exists. | Technical and operations approval |
| 3 | Concurrent admission retry semantics | H1 targets only the same-acceptance unique conflict, re-reads the organization-scoped link, and compares the approved partial command identity. Different acceptance ids can still race through the application-level active-admission guard. | H1 verified; partial-index migration fix remains gated |
| 4 | Outbox ownership and failure handling | Delivery boundary record drafted; S2 persists `PENDING` rows atomically and has no dispatcher or retry worker. | Architecture and operations decision |
| 5 | Event vocabulary expansion | Review-row identifiers and gap-transition events lack dedicated S1 payload schemas. | Domain and governance decision |
| 6 | Program identity contract | H1 aligns the Zod contracts, event payloads, mapper, and already-nullable Prisma column as nullable/source-owned. | H1 verified; revisit only if a canonical program hierarchy becomes required |
| 7 | Command-service boundary | Boundary is recorded: episode writes require a role-gated command service before any HTTP exposure. | Technical lead decision |

## Required Evidence Before Production Hardening

1. Tenant enforcement and RLS design reviewed and the OD-6 provider/session
   decision recorded.
2. Additive migration promotion and restore procedure reviewed by the
   technical and operations owners.
3. Production retry ownership and observability defined beyond H1's local
   deterministic replay behavior.
4. Outbox failure ownership and retry policy reviewed without adding a worker
   implicitly.
5. Event payload schemas either extended deliberately or the current
   interpretation accepted as an interim boundary.
6. Explicit implementation approval naming files, tests, and exclusions for
   any production-facing slice.

## Non-Goals

- No production database or live tenant data.
- No RLS migration until the security gate is recorded.
- No outbox worker or external delivery.
- No API routes or service runtime.
- No analytics projection, marts, dashboards, or UX.
- No autonomous clinical, legal, admission, discharge, placement, payer, or
  authorization decisions.

## Owner Decision

- Decision: `[x] Approve decision work`  `[ ] Revise packet`  `[ ] Defer`
- Owner: Tyler / product owner
- Date: 2026-07-18
- Notes: Tyler approved the bounded decision-work slice. This authorizes
  evidence gathering, option analysis, and updates to canonical decision
  records only. It does not authorize code, migrations, RLS, workers, runtime,
  deployment, or external changes.

## Owner Decision: H1 Implementation Authorization

- Decision: `[x] Approve H1 implementation`  `[ ] Revise scope`  `[ ] Defer`
- Owner: Tyler / product owner
- Date: 2026-07-19
- Scope: D6 Option A (`programId` nullable/source-owned) and D3 Option A
  (targeted same-acceptance replay recovery with explicit conflict handling).
- Constraints: no Prisma schema or migration, RLS, workers, APIs, event
  vocabulary, UI, deployment, external integration, or real data.
- Notes: This is the implementation authorization for the H1 slice only. It
  does not approve production hardening or the different-acceptance-id race
  fix described in Decision 3.

## H1 Implementation Record

The owner instruction to finish the approved first implementation slice
authorized the following bounded work:

- D6 Option A: make `programId` nullable in the admission command, episode,
  and admission event payload contracts; remove the mapper assertion. No
  Prisma schema or migration change was needed because persistence was already
  nullable/source-owned.
- D3 Option A: recover only the
  `CaseEpisodeLink(organizationId, sourceAcceptanceId)` unique race; re-read
  the organization-scoped link, replay exact command identity, and throw
  `IdempotencyConflictError` for a mismatch. Unrelated unique errors still
  propagate.

Changed files are limited to the domain contracts, episode mapper, episode
persistence gateway, and focused unit/integration tests. Prisma schema and
migrations, RLS, workers, APIs, event vocabulary, UI, deployment, and external
integrations remain excluded.

H1 verification: focused 36 tests passed; root 31 files / 258 tests passed;
app 10 files / 64 tests passed; app build, typecheck, Prisma validation and
generation, scoped lint, root lint, nested visualizer lint, and
`git diff --check` passed. Root lint now explicitly scopes out the nested
visualizer repository and Claude worktrees; each has its own repository or
process boundary.

## H1 Identity And Concurrency Limits

The H1 replay identity is intentionally partial and follows the approved
options memo. A same-acceptance replay matches only:

- `sourceCaseId`
- `facilityId`
- `admittedAt`
- `facilityTimezone.sourceReferenceId`

`programId`, `unitId`, `sourcePacketVersionId`, and `sourceCustodyEventId` are
not part of the H1 replay identity. Reusing an acceptance id with a different
value for one of those fields therefore replays the existing admission. This
is an explicit current contract, not an accidental claim of full-payload
idempotency; it must be revisited if the source acceptance key is later
required to bind the complete admission snapshot.

H1 does not make different acceptance ids mutually exclusive under concurrent
writes. The active-admission `findFirst` guard remains application-level and
can race. The next gated persistence slice must design and test a database
constraint or equivalent transaction strategy for one active
admission-source episode per case; a partial unique index on active episodes is
one candidate, not an approved migration.

## H2 Governance Records

The following records are drafted and intentionally remain proposed:

- `docs/decisions/RLS_TENANT_ENFORCEMENT_DESIGN.md`
- `docs/decisions/S2_MIGRATION_PROMOTION_AND_RECOVERY_CHECKLIST.md`
- `docs/decisions/OUTBOX_DELIVERY_BOUNDARY_DECISION.md`

They are evidence and decision inputs, not authorization for RLS migrations,
production migration promotion, outbox workers, external delivery, or real
data.
