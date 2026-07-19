---
status: Verified H1 and H3 implementation evidence; recommendations remain for later gates
owner: Codex for repository evidence; human owner, technical lead, and security reviewer decide
date: 2026-07-19
data_boundary: synthetic only
related_packet: docs/decisions/NEXT_PERSISTENCE_HARDENING_DECISION_PACKET.md
---

# Next Persistence Hardening Evidence

## Truth Boundary

This is a repository-grounded evidence memo, not an approval record. Claude's
options analysis arrived as `MSG-0052`. H1 implementation was then completed
locally within the owner-approved boundary; remaining recommendations still
require the human gates in the decision packet.

## Confirmed Facts

1. S2 persists organization predicates in the Prisma gateway and exercises
   cross-organization rejection in `tests/integration/s2-episode-persistence.test.ts`.
2. The canonical schema uses PostgreSQL through `DATABASE_URL`; the bounded
   local OD-6 migration adds direct tenant policies for episode-persistence
   records. No provider-backed or production RLS evidence exists.
3. The S2 migration is additive and has been applied to the local synthetic
   `clarity_dev` database. No production promotion or restore evidence exists.
4. H1 admission replay is deterministic on
   `(organizationId, sourceAcceptanceId)`: the targeted acceptance unique
   conflict is re-read and exact command identity returns `replayed: true`;
   mismatches throw `IdempotencyConflictError`, and unrelated unique errors
   remain errors.
5. Governed events and `PENDING` outbox rows are written in the same transaction
   as the source mutation and audit write. No dispatcher or worker exists.
6. The S1 event vocabulary has an authorization-day-decision event but no
   dedicated review-recorded or documentation-gap-transition payload schema.
7. H1 aligns `EpisodeSchema`, `AdmissionHandoffCommandSchema`, both admission
   event payload schemas, and the episode mapper with the already-nullable,
   source-owned Prisma `Episode.programId` column.
8. The current repository adapter is a persistence boundary, not an HTTP or
   service-runtime boundary.
9. The bridge health check now recognizes both absolute and repository-relative
   watcher paths. `npm run bridge:status` reports `listener=running` for the
   active `tail -f agent_bridge/claude_outbox.md` process, and the bridge suite
   covers both path forms.
10. H3 adds the additive migration
    `20260719011500_s2_active_admission_guard`, which enforces one `ACTIVE`
    admission-source episode per case at the database boundary. The gateway
    maps the losing Prisma unique conflict to `ActiveAdmissionExistsError`.
    The focused concurrent test passes with different acceptance ids.

## Recommendations

### 1. RLS and tenant enforcement

Keep organization predicates as the S2 application-layer control. The local
synthetic OD-6 slice now adds transaction-local context and direct tenant
policies for the bounded episode-persistence tables. Defer provider-backed
policy expansion until the provider, connection/session model, migration
ownership, and security test strategy are accepted. Do not treat the local
migration as production rollout evidence.

### 2. Migration recovery

Treat Prisma migration application as forward-only. Require a reviewed
promotion checklist, backup/restore evidence, backward-compatible application
ordering, and a named recovery owner before production migration work.

The repository now has a deterministic local integrity check at
`tests/integration/migration-integrity.test.ts`. It verifies the local
`_prisma_migrations` ledger and the H3 partial index without writing product
data. Fresh-database replay, provider restore, and production promotion remain
unverified.

### 3. Concurrent admission retries

H1 implemented the bounded recovery policy: re-read the organization-scoped
link after the targeted unique conflict, compare case, facility, admission
instant, and timezone source reference, and return the existing result only
when the natural key and command identity match. Do not hide unrelated unique
violations as successful replays. Production retry ownership and observability
remain outside this slice. The command identity is intentionally partial:
`programId`, `unitId`, `sourcePacketVersionId`, and `sourceCustodyEventId` are
not compared. A same-acceptance reuse that changes one of those fields replays
by the current contract; full admission-snapshot binding is deferred.

H3 closes the separate race where different acceptance ids admit the same case
concurrently. The application-level active-admission pre-check remains for
fast domain feedback, and the additive partial unique index is the authoritative
database boundary. The losing write is translated to
`ActiveAdmissionExistsError`, and the focused integration test proves exactly
one active episode and one case link remain.

Production promotion, backup/restore evidence, and operational retry ownership
remain outside this local synthetic-only slice.

### 4. Outbox ownership and failure handling

Keep outbox persistence separate from delivery. Decide who owns claiming,
retry, dead-letter, observability, and replay before authorizing a dispatcher.
The next implementation should not add a worker implicitly to the repository
gateway.

### 5. Event vocabulary

The owner accepted the current bounded event vocabulary: admission recorded,
authorization day decision recorded, and documentation gap recorded. Keep
review-level authorization actions, documentation-gap transitions, and derived
episode-day state as audit/history or draft derived concepts until each has a
named consumer, payload owner, retention decision, and tenant/security review.

### 6. Program identity

H1 resolved the bounded S2 mismatch as nullable/source-owned and aligned the
S1 Zod contract, admission event payloads, mapper, and existing Prisma
nullability together. A future canonical program hierarchy could reopen this
decision as a deliberate breaking contract change.

### 7. Command-service boundary

Defer command services and HTTP routes until the hardening decisions are
accepted. Keep the next implementation slice limited to the smallest approved
repository or domain-contract change.

## H1 Implementation Evidence

Changed product files:

- `packages/domain-contracts/src/episode.ts`
- `packages/domain-contracts/src/analytics.ts`
- `packages/case-repository/src/episodeMappers.ts`
- `packages/case-repository/src/episodePersistenceGateway.ts`
- `tests/unit/episode-utilization-contracts.test.ts`
- `tests/unit/analytics-contracts.test.ts`
- `tests/integration/s2-episode-persistence.test.ts`

Focused coverage includes nullable program contracts, sequential acceptance-key
conflict handling, and two identical admissions racing through the real Prisma
gateway with exactly one persisted episode, link, and governed event.

The bridge health repair is limited to listener detection and its regression
test. It does not claim Antigravity agent consumption, direct CLI support, or
authentication; those remain runtime capabilities reported separately by the
bridge.

## H3 Implementation Evidence

Changed product files:

- `prisma/migrations/20260719011500_s2_active_admission_guard/migration.sql`
- `packages/case-repository/src/episodePersistenceGateway.ts`
- `tests/integration/s2-episode-persistence.test.ts`

The migration is additive and contains a partial unique index on
`Episode.sourceCaseId` for `status = 'ACTIVE'`. The gateway handles the
database conflict without treating unrelated unique violations as replay
success. The focused S2 suite passes 16 tests after this change.

## Proposed Next Implementation Shape

The next bounded slice should be selected explicitly from:

- event-vocabulary expansion only if a named consumer and explicit requirements
  are accepted;
- the provider-backed extension of the accepted OD-6 posture;
- the separately governed outbox delivery design.

The event-vocabulary decision packet is recorded at
`docs/decisions/EVENT_VOCABULARY_DECISION_PACKET.md`. Its current bounded
vocabulary is accepted; no new event type or consumer is implemented.

Provider-backed RLS, production deployment, workers, APIs, analytics, UX,
integrations, and real data remain outside this proposed boundary.

## Packet 2: Network Enrichment Review-Service Slice (APPROVED for minimal implementation)

This is the next approved narrow slice after Packet 2 decision closure:

- Scope: in-memory review command service for network enrichment artifacts.
- Synthetic boundary: no DB, no worker, no outbound integration.
- Approved gates:
  1. Reviewer-role mapping approved via existing `UserRole` aliases.
  2. Canonical ownership approved on existing `Organization` / `FacilityProfile`,
     with enrichment metadata kept synthetic.
  3. ADR-0014 policy defaults approved as the Packet 2 baseline.
  4. External worker/egress remains `OFF` in Packet 2.

Recommended execution artifacts:

- `packages/network-enrichment-service/src/reviewCommands.ts`
- `packages/network-enrichment-service/src/reviewGateway.ts`
- `packages/network-enrichment-service/src/index.ts`
- `packages/network-enrichment-service/test/reviewCommands.test.ts`
- optional `docs/decisions/NETWORK_ENRICHMENT_PACKET_2_REVIEW_AND_ACCEPTANCE_RECORD.md`

This packet does not authorize:
- any DB persistence,
- API routes,
- worker execution,
- outbox delivery,
- or any clinical/legal/placement autonomy.

When these files are completed, review and acceptance should be recorded before
the next persistence or runtime packet.

## Packet 2 Execution Evidence (Network Enrichment Review Slice)

Status: Completed (local code and tests in synthetic boundary; scope-limited review packet prepared).

- Scope files implemented:
  - `packages/domain-contracts/src/networkEnrichment.ts`
  - `packages/network-enrichment-service/src/reviewCommands.ts`
  - `packages/network-enrichment-service/src/reviewGateway.ts`
  - `packages/network-enrichment-service/src/index.ts`
  - `packages/network-enrichment-service/test/reviewCommands.test.ts`
  - `packages/network-enrichment-service/src/runtime.ts`
  - `packages/network-enrichment-service/test/reviewRuntime.test.ts`

- Gate checks maintained:
  - Reviewer-role mapping is Option A using existing `UserRole` aliases.
  - Canonical ownership remains synthetic and organization-correct.
  - ADR-0014 policy defaults not widened in this packet.
  - External worker and egress remain OFF.

- Safety assertions:
  - No `prisma`/`database` imports in Packet 2 service/gateway.
  - No outbound HTTP/fetch modules added.
  - No API route or server bootstrap added.

- Verification executed:
  - `npm run lint --workspace=packages/network-enrichment-service` (pass)
  - `npx tsc --noEmit` (pass)
  - `npm run test --workspace=packages/network-enrichment-service` (pass, 2 files / 7 tests)

- Verification commands prepared:
  - `npm run lint --workspace=packages/network-enrichment-service`
  - `npx tsc --noEmit`
  - `npm run test --workspace=packages/network-enrichment-service`
