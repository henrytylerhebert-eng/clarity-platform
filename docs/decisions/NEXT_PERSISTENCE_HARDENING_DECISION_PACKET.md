---
status: H1 and H3 implemented; H2 governance records drafted; production hardening remains gated
owner: Tyler/product owner with technical and security review
date: 2026-07-18
data_boundary: synthetic only
evidence:
  - docs/developer-handoff/S2_REVIEW_AND_ACCEPTANCE_RECORD.md
  - docs/developer-handoff/NEXT_PERSISTENCE_HARDENING_EVIDENCE.md
  - docs/decisions/S2_PERSISTENCE_DECISION_PACKET.md
  - docs/decisions/EVENT_VOCABULARY_DECISION_PACKET.md
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
- governed event-vocabulary expansion for review corrections and
  documentation-gap transitions;
- whether command services belong in a later repository-runtime slice.

This packet does not authorize API routes, API framework changes, workers,
outbox dispatch, analytics marts, dashboards, frontend changes, Product Studio,
external integrations, deployment, production flags, or real data.

## Decisions Required

| # | Decision | Current evidence | Human gate |
|---:|---|---|---|
| 1 | RLS timing and database tenant enforcement | Recommended OD-6 posture accepted; a bounded local synthetic RLS slice now supplements the S2 organization predicates. Provider, pooling, runtime role, broader policy coverage, and security review remain open. | Provider-backed security and technical approval |
| 2 | Migration recovery model | Promotion/recovery checklist and deterministic local migration-integrity test are recorded; no fresh-database, provider restore, or production promotion evidence exists. | Technical and operations approval |
| 3 | Concurrent admission retry semantics | H1 handles same-acceptance replay. H3 adds an additive partial unique index for one ACTIVE admission-source episode per case and maps the losing database conflict to `ActiveAdmissionExistsError`. | H1/H3 verified locally; migration promotion and recovery remain gated |
| 4 | Outbox ownership and failure handling | Delivery boundary record drafted; S2 persists `PENDING` rows atomically and has no dispatcher or retry worker. | Architecture and operations decision |
| 5 | Event vocabulary expansion | Current bounded vocabulary is accepted: three emitted events, with audit/history-only actions and the draft derived event kept separate. No approved runtime consumer is identified for expansion. | Expansion requires a named consumer and domain/governance decision |
| 6 | Program identity contract | H1 aligns the Zod contracts, event payloads, mapper, and already-nullable Prisma column as nullable/source-owned. | H1 verified; revisit only if a canonical program hierarchy becomes required |
| 7 | Command-service boundary | Boundary is recorded: episode writes require a role-gated command service before any HTTP exposure. | Technical lead decision |

## Required Evidence Before Production Hardening

1. OD-6 provider/session details, runtime roles, policy coverage, and security
   review are recorded against the accepted posture.
2. Additive migration promotion and restore procedure reviewed by the
   technical and operations owners.
3. Production retry ownership and observability defined beyond H1's local
   deterministic replay behavior.
4. Outbox failure ownership and retry policy reviewed without adding a worker
   implicitly.
5. The accepted current event boundary remains in force; any expansion requires
   deliberate payload design, a named consumer, and a separate approval.
6. Explicit implementation approval naming files, tests, and exclusions for
   any production-facing slice.

## Non-Goals

- No production database or live tenant data.
- No provider-backed or production RLS rollout until the security gate is recorded.
- No outbox worker or external delivery.
- No API routes or service runtime.
- No analytics projection, marts, dashboards, or UX.
- No autonomous clinical, legal, admission, discharge, placement, payer, or
  authorization decisions.

## Owner Decision

- Decision: `[x] Approve decision work`  `[ ] Revise packet`  `[ ] Defer`
- Owner: Tyler / product owner
- Date: 2026-07-18
- Notes: Tyler approved the bounded decision-work slice. The later explicit
  execution request authorized the local synthetic OD-6 RLS helper, migration,
  and tests. This does not authorize provider-backed or production RLS,
  workers, runtime deployment, or external changes.

## Owner Decision: H1 Implementation Authorization

- Decision: `[x] Approve H1 implementation`  `[ ] Revise scope`  `[ ] Defer`
- Owner: Tyler / product owner
- Date: 2026-07-19
- Scope: D6 Option A (`programId` nullable/source-owned) and D3 Option A
  (targeted same-acceptance replay recovery with explicit conflict handling).
- Constraints: no Prisma schema or migration, RLS, workers, APIs, event
  vocabulary, UI, deployment, external integration, or real data.
- Notes: This was the implementation authorization for the H1 slice only. It
  did not approve production hardening or the different-acceptance-id race
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

H3 closes the different-acceptance-id race at the database boundary with the
additive migration
`20260719011500_s2_active_admission_guard`. The partial unique index permits a
later admission after the prior episode is no longer `ACTIVE`, while concurrent
admissions for the same source case produce one success and one
`ActiveAdmissionExistsError`. The gateway still keeps the application-level
pre-check for an immediate domain response; the database constraint is the
authoritative race boundary.

H3 is verified only against the local synthetic database. Production
promotion, backup/restore evidence, and operational retry ownership remain
gated by the migration and operations decisions below.

## H3 Implementation Record

The owner instruction to keep building after the independent H1/H2 audit
authorized the smallest remaining repository hardening item without opening
the production gates:

- add the additive partial unique index for one active admission-source
  episode per case;
- translate the resulting Prisma unique conflict into the existing
  `ActiveAdmissionExistsError` domain error;
- add a deterministic concurrent integration test using different acceptance
  ids;
- preserve the exclusions for RLS, production promotion, workers, APIs,
  event-vocabulary expansion, UI, deployment, external integrations, and real
  data.

The migration is applied to the local synthetic database. No production
promotion or rollback claim is made.

## H2 Governance Records

The following records are drafted and intentionally remain proposed:

- `docs/decisions/RLS_TENANT_ENFORCEMENT_DESIGN.md`
- `docs/decisions/S2_MIGRATION_PROMOTION_AND_RECOVERY_CHECKLIST.md`
- `docs/decisions/OUTBOX_DELIVERY_BOUNDARY_DECISION.md`

They are evidence and decision inputs, not authorization for RLS migrations,
production migration promotion, outbox workers, external delivery, or real
data.
