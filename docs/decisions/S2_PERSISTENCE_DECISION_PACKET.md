---
status: Recommended decisions recorded — awaiting owner approval
owner: Human project owner (approval); Claude (preparation); Codex (verification)
prepared_by: Claude Code (fable mode), 2026-07-18
lane: Lane B — S2 persistence decision system (agents/bridge/BUILD_TO_GOAL.md)
data_boundary: Synthetic only
related: ADR-0002, ADR-0003, ADR-0005, ADR-0012, OD-5, OD-6, OD-8, docs/08-reporting-metrics-rebuilder.md
---

# S2 Persistence Decision Packet

## Purpose

Resolve the Lane B questions so the human owner can approve (or amend) the S2
persistence implementation slice — episodes, episode-owned UR records,
documentation gaps, correction chains, governed events, outbox records, Prisma
gateways, and deterministic service tests — and route Lane C to Claude with
Codex verification.

Every decision below is **Recommended**, not approved. Routing Lane C work
against this packet constitutes owner approval of the decisions it cites;
amendments should be recorded in this file before routing.

## Decision spine

| Field | Answer |
|---|---|
| Goal | Approve the persistence design for the S2 episode/UR spine so implementation can start. |
| Owner | Human owner decides; Claude prepared; Codex verifies implementation. |
| Evidence | See "Evidence base" below — live schema, migrations, blueprint, module doc. |
| Options | Recorded per decision (D1–D10). |
| Constraints | Synthetic data only; `reference/` and source packages immutable; separate lanes for API/persistence/analytics/UX; no production writes or deployment. |
| Scope | Prisma schema additions + migrations, `packages/` gateways and services, deterministic tests. |
| Non-goals | HTTP routes (ADR-0012/OD-5), workers/publishers, marts, dashboards, frontend, external integrations, RLS enforcement (OD-6), reconciling the case-spine `Authorization` aggregate (D5). |
| Completion gate | Owner records approve/amend per decision; Lane C dispatched with this packet as its evidence. |
| Next decision | After Lane C ships and Codex verifies: whether to start the metric layer (blueprint Phase 2) or the outbox publisher. Owner decides. |

## Evidence base

- `Confirmed` — `prisma/schema.prisma` (28 models) with 10 migrations; tenancy
  by `organizationId` on every aggregate (31 occurrences), optimistic
  `version` tokens, `CommandIdempotencyRecord`, `AuditEvent` with state
  hashes. No episode, outbox, or domain-event tables exist.
- `Confirmed` — `packages/case-repository/` implements the gateway + mapper +
  `auditWriter` + `stateHash` idiom over Prisma.
- `Confirmed` — `reporting-metrics-rebuild-package/SCHEMA_BLUEPRINT.sql`
  (read-only reference) defines episode, episode_day, ur_authorization, and
  related tables, explicitly labeled "starter schema, not production-complete".
- `Confirmed` — `docs/08-reporting-metrics-rebuilder.md` requires PHI/analytics
  separation, configurable dimensions, event/fact tables, and versioned
  assumptions; Clarity and this module "share a common event spine but remain
  separable".
- `Confirmed` — `docs/decisions/OPEN_DECISIONS.md` OD-6 leaves database
  hosting and the RLS strategy undecided.
- `No measurements found` — no operational baselines exist; nothing in this
  packet may be justified by performance claims.

## Decisions

### D1 — Episode cardinality

**Question:** What is an episode, and how many can exist per patient?

**Recommended:** One episode per admission. A patient may accumulate many
episodes over time; at most **one active episode per (patient, program)** at a
time, enforced by a partial unique index on `(patientTokenId, programId)
WHERE status = 'ACTIVE'`. Concurrent active episodes in *different* programs
(e.g. inpatient → IOP step-down overlap) are allowed. An episode belongs to
exactly one program (and through it one facility). An episode MAY reference an
originating `BehavioralHealthCase` via a nullable `caseId`; the case spine
never owns episodes (the module must stay company-agnostic per docs/08).

**Alternatives rejected:** one-episode-per-patient-lifetime (breaks
readmission metrics); episode-per-level-of-care-change (blueprint models that
as discharge/admission event pairs instead).

### D2 — Patient identity boundary

**Question:** Adopt the blueprint's `patient_identity` table (MRN, legal name,
DOB)?

**Recommended:** **No.** Episodes reference the existing `PatientToken`
aggregate. The blueprint's PHI-bearing identity table conflicts with the
established PHI-minimizing token boundary and the module's own rule to
separate PHI from analytics. This is a deliberate, recorded divergence from
the blueprint.

### D3 — Ownership and tenancy

**Question:** How are S2 rows scoped?

**Recommended:** Every S2 table carries `organizationId` plus composite
indexes led by it, exactly like every existing aggregate. `Facility` and
`Program` become organization-owned dimension tables (the blueprint's
facility-rooted scoping is subsumed). App-layer scoping in gateways is
mandatory now; Postgres RLS remains deferred to OD-6 — the schema must be
RLS-ready (tenant key on every row, no cross-organization foreign keys) so
enabling RLS later is additive.

### D4 — Timezone versioning

**Question:** How do we derive `service_date` (facility-local calendar days)
from UTC timestamps without corrupting history when a facility's timezone
changes?

**Recommended:** Store all instants as UTC `timestamptz`. Facility timezone is
**effective-dated configuration** (`FacilityTimezonePeriod`: facilityId, IANA
zone, effectiveFrom), not a mutable column. `episode_day` rows record the
timezone string used to derive their `service_date` at write time, so history
is self-describing and never retroactively re-derived. A timezone change
creates a new period going forward and emits a governed event; it never
rewrites existing days.

### D5 — UR record ownership and the case-spine boundary

**Question:** Who owns UR authorization and documentation-gap records, and how
do they relate to the existing case-spine `Authorization` model?

**Recommended:** UR records are **episode-owned**: `UrAuthorizationRecord`
(episode FK, payer FK, requested/approved/denied days, window, status,
denial reason) and `DocumentationGapRecord` (episode FK, gap type, identified/
resolved timestamps, payer-friction linkage). They are operational-intelligence
facts, **separate from** the case-spine `Authorization` aggregate, which
remains the workflow system of record (per docs/08: separable products,
shared event spine). Cross-linking or reconciling the two is an explicit
non-goal of S2 and a named future decision.

### D6 — Corrections

**Question:** How are recorded facts corrected without destructive updates?

**Recommended:** Append-only correction chains on fact tables (`episode_day`,
`UrAuthorizationRecord`, `DocumentationGapRecord`): a correction row carries
`correctionOfId` (self-FK to the row it supersedes), a required `reason`, and
the acting user; the superseded row's `isCurrent` flag flips false in the same
transaction. Reads of "current truth" filter `isCurrent`; full chains remain
queryable for audit. Every correction writes an `AuditEvent` with before/after
state hashes, reusing the existing audit discipline.

### D7 — Governed events and outbox

**Question:** How do S2 state changes become the "common event spine"?

**Recommended:** Transactional outbox. Each S2 mutation appends a
`DomainEventRecord` (organizationId, eventType, aggregate type/id, payload
JSON, occurredAt, schemaVersion) and a matching `OutboxRecord` (eventId,
publishedAt nullable, attempts) **in the same transaction** as the state
change. No publisher, worker, or consumer is built in S2 — outbox rows simply
accumulate; publishing is a separate, later assignment. Event payloads are
governed: versioned, synthetic-only, and PHI-free by construction (token
references only, per D2).

### D8 — Concurrency and idempotency

**Question:** How do concurrent writers and retries behave?

**Recommended:** Reuse the established discipline unchanged: optimistic
`version Int` on the episode aggregate root, commands carry `expectedVersion`
and fail with the existing `ConcurrencyConflict` taxonomy when stale;
`CommandIdempotencyRecord` guards retried commands. Day-level and UR fact
writes version through their owning episode.

### D9 — Migration recovery

**Question:** What is the migration and failure-recovery posture?

**Recommended:** Additive-only migrations in S2 (new tables, new enums; no
rewrites of existing tables beyond nullable FK additions). One concern per
migration, following the existing 10-migration granularity. The database
contains synthetic data only, so documented recovery is reset + re-seed
(`seedLoader` fixtures); no destructive rollback scripts. Each migration
lands with a smoke test proving forward application against `clarity_dev`.

### D10 — Repository/service depth

**Question:** How thick is the persistence layer?

**Recommended:** Mirror `packages/case-repository`: thin Prisma gateways +
pure mappers per aggregate, deterministic domain logic in contract-style
services that depend on gateway **interfaces**, unit tests against in-memory
fakes, integration tests against `clarity_dev`. No business rules in
gateways; no Prisma types leaking above the mapper boundary.

## ADR-0012 review (adjacent lane — recorded here, decided separately)

Reviewed `docs/architecture/ADR-0012-api-architecture.md` (Proposed) and its
2026-07-18 implementation note. **Verdict: recommend Accept Option A** —
Fastify thin command mapper, 1:1 routes onto existing command envelopes,
path/session-derived actor and tenant, mechanical error-taxonomy mapping. The
`node:http` spike in `packages/api-service` validates the auth/actor/tenant
handling and should be ported into the `packages/api` shape when Phase 4
starts; nothing in the spike contradicts the proposal. Options B–E remain
correctly rejected for the reasons stated in the ADR.

This is a review recommendation, not acceptance: OD-5 closes only when the
owner marks ADR-0012 **Accepted**. The API lane stays excluded from S2
regardless (Lane C non-goal).

## Approval and routing

- **Approve:** record approval here (or in the routing bridge message citing
  this packet at this HEAD) and dispatch Lane C to Claude with Codex named as
  verifier, per `agents/bridge/BUILD_TO_GOAL.md`.
- **Amend:** edit the affected decision(s), then route.
- **Residual risks:** OD-6 (hosting/RLS) can invalidate parts of D3's
  enforcement posture but not its schema shape; the D5 boundary intentionally
  defers case-spine reconciliation and will create temporary double-entry for
  authorization facts; `No measurements found` means all sizing/indexing
  choices are structural, not measured.
