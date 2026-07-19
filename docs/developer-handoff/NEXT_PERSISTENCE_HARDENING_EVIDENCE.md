---
status: Preliminary Codex evidence; recommendations only
owner: Codex for repository evidence; human owner, technical lead, and security reviewer decide
date: 2026-07-19
data_boundary: synthetic only
related_packet: docs/decisions/NEXT_PERSISTENCE_HARDENING_DECISION_PACKET.md
---

# Next Persistence Hardening Evidence

## Truth Boundary

This is a repository-grounded evidence memo, not an approval record. Claude's
approved analysis assignment is queued as `MSG-0048`; a direct recovery attempt
failed with HTTP 429 session-limit exhaustion and was archived as `MSG-0050`
and `MSG-0051`. The recommendations below are Codex analysis and require the
human gates in the decision packet.

## Confirmed Facts

1. S2 persists organization predicates in the Prisma gateway and exercises
   cross-organization rejection in `tests/integration/s2-episode-persistence.test.ts`.
2. The canonical schema uses PostgreSQL through `DATABASE_URL`; no RLS policy
   or RLS migration is present in the S2 migration.
3. The S2 migration is additive and has been applied to the local synthetic
   `clarity_dev` database. No production promotion or restore evidence exists.
4. Admission replay is deterministic on
   `(organizationId, sourceAcceptanceId)`. A concurrent race can still surface
   a unique-constraint error before a retry re-reads the accepted link.
5. Governed events and `PENDING` outbox rows are written in the same transaction
   as the source mutation and audit write. No dispatcher or worker exists.
6. The S1 event vocabulary has an authorization-day-decision event but no
   dedicated review-recorded or documentation-gap-transition payload schema.
7. `EpisodeSchema` requires `programId`, while the Prisma `Episode.programId`
   column remains nullable/source-owned by the S2 decision.
8. The current repository adapter is a persistence boundary, not an HTTP or
   service-runtime boundary.

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

Keep the source-acceptance natural key and active-admission guard. Add an
explicit unique-conflict recovery policy in a later implementation slice:
re-read the organization-scoped link, compare the command identity, and return
the existing result only when the natural key matches. Do not hide unrelated
unique violations as successful replays.

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

Resolve whether `programId` is a required domain admission input or a nullable
source-owned reference. Align the S1 Zod contract, Prisma nullability, mapper,
and admission command together; do not fix only one layer.

### 7. Command-service boundary

Defer command services and HTTP routes until the hardening decisions are
accepted. Keep the next implementation slice limited to the smallest approved
repository or domain-contract change.

## Proposed Next Implementation Shape

No implementation is authorized by this memo. If the owner accepts the
recommendations, the next bounded slice should be selected explicitly from:

- contract reconciliation for event vocabulary and `programId`;
- deterministic unique-conflict replay handling;
- migration promotion/recovery documentation and tests;
- a separately governed outbox delivery design.

RLS, production deployment, workers, APIs, analytics, UX, integrations, and
real data remain outside this proposed boundary.
