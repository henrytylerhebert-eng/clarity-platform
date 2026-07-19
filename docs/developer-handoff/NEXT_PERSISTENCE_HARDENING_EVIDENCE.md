---
status: Verified H1 implementation evidence; recommendations remain for later gates
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
2. The canonical schema uses PostgreSQL through `DATABASE_URL`; no RLS policy
   or RLS migration is present in the S2 migration.
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

## Recommendations

### 1. RLS and tenant enforcement

Keep organization predicates as the S2 application-layer control. Defer RLS
until the provider, connection/session model, migration ownership, and
security test strategy are accepted in OD-6 or a dedicated ADR. Do not add an
RLS migration as a mechanical follow-up.

### 2. Migration recovery

Treat Prisma migration application as forward-only. Require a reviewed
promotion checklist, backup/restore evidence, backward-compatible application
ordering, and a named recovery owner before production migration work.

### 3. Concurrent admission retries

H1 implemented the bounded recovery policy: re-read the organization-scoped
link after the targeted unique conflict, compare case, facility, admission
instant, and timezone source reference, and return the existing result only
when the natural key and command identity match. Do not hide unrelated unique
violations as successful replays. Production retry ownership and observability
remain outside this slice.

### 4. Outbox ownership and failure handling

Keep outbox persistence separate from delivery. Decide who owns claiming,
retry, dead-letter, observability, and replay before authorizing a dispatcher.
The next implementation should not add a worker implicitly to the repository
gateway.

### 5. Event vocabulary

Prefer extending the domain event vocabulary with explicit review-recorded and
documentation-gap-transition payload schemas before treating those events as
analytics or operational measurements. Until accepted, keep the current
interpretations visibly interim.

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

## Proposed Next Implementation Shape

The next bounded slice should be selected explicitly from:

- event-vocabulary domain decision and explicit consumer requirements;
- migration promotion/recovery documentation and tests;
- the proposed RLS design and OD-6 provider/session decision;
- the separately governed outbox delivery design.

RLS, production deployment, workers, APIs, analytics, UX, integrations, and
real data remain outside this proposed boundary.
