---
status: Provider swapped to Supabase Postgres and schema deployed (2026-09-13, see amendment below); a Supabase-specific REST-exposure gap was found and fixed same session; provider-backed RLS/role-separation acceptance tests still not run against the new provider
decision: OD-6
owner: Tyler/product owner with technical and security review
date: 2026-07-19 (superseded in part 2026-09-13 — see amendment)
data_boundary: synthetic only
related_decisions:
  - docs/architecture/ADR-0011-authentication.md
  - docs/architecture/ADR-0012-api-architecture.md
  - docs/architecture/ADR-0022-supabase-provider-swap.md
  - docs/decisions/RLS_TENANT_ENFORCEMENT_DESIGN.md
  - docs/decisions/S2_MIGRATION_PROMOTION_AND_RECOVERY_CHECKLIST.md
---

# OD-6 Provider And RLS Decision Packet

## Purpose

Resolve the database provider/session posture and the conditions for
PostgreSQL row-level security (RLS) without claiming production readiness.
This packet turns the existing RLS design into a decision-ready boundary and
records the bounded local synthetic implementation that followed the accepted
posture.

## Confirmed Repository Evidence

| Area | Confirmed fact | Consequence |
|---|---|---|
| Database engine | `prisma/schema.prisma` uses the PostgreSQL Prisma provider and `DATABASE_URL` | The application contract is PostgreSQL-compatible |
| Current database scope | Integration tests are guarded to local `clarity_dev` on localhost | Local evidence cannot be promoted to provider or production evidence |
| Application tenancy | Current gateways include `organizationId` in tenant-owned query and write predicates | Application isolation is the verified synthetic control |
| Identity | `AuthenticationService` verifies a token, then loads roles and organization from the database-backed session/principal | RLS context must come from server-authenticated principal state, never request input |
| Development identity | `LocalDevIdentityProvider` is synthetic and development-only | It cannot be used as a production identity provider or tenant authority |
| Production identity direction | ADR-0011 recommends a managed OIDC adapter behind the existing port | OIDC provider/account selection remains deployment work |
| API direction | ADR-0012 accepts the thin Fastify direction in part and keeps hosting/RLS separately gated | API acceptance does not authorize provider or RLS rollout |
| Current RLS state | The local synthetic database now has a transaction-local context helper, an additive episode-persistence RLS migration, and deterministic isolation tests | No provider-backed or production isolation claim is made; broader model coverage remains open |
| Connection state | Tyler recorded Google Cloud SQL for PostgreSQL in `us-central1` with direct connections | Provider credentials, runtime roles, break-glass procedure, and provider-backed tests remain to be configured and verified |

## Recommended Posture

### Posture decision

Accept the following provider-neutral posture for the initial controlled pilot:

1. Use one managed PostgreSQL database with a shared schema and
   `organizationId` on every tenant-owned source record.
2. Keep application-layer organization predicates as a required control and
   add PostgreSQL RLS as defense in depth before any real data or production
   pilot.
3. Set tenant context only inside the transaction that performs the work,
   using a server-controlled value derived from the authenticated principal.
4. Use a runtime database role that is not the table owner and does not have
   `BYPASSRLS`.
5. Keep migrations and emergency recovery under a separate restricted role and
   an auditable, owner-controlled procedure. Ordinary application requests
   must not use that role.
6. Do not use session-scoped tenant state. Transaction-local state must expire
   at transaction end so connection reuse cannot carry one organization's
   context into another request.
7. Use Google Cloud SQL for PostgreSQL in `us-central1` with direct
   connections for the first provider-backed proof. Revisit pooling only after
   the direct-connection path and recovery evidence are verified.

This records the selected provider/session direction. It does not authorize
production configuration, live data, or deployment. A separate explicit
execution request authorized the bounded local synthetic slice below.

## Bounded Local Synthetic Implementation

The following local-only slice is implemented and verified:

- `packages/case-repository/src/tenantContext.ts` sets
  `app.current_organization_id` with `set_config(..., true)` inside each S2
  episode-persistence transaction.
- `prisma/migrations/20260719123000_od6_episode_persistence_rls/migration.sql`
  enables and forces direct tenant policies for timezone lineage, episodes,
  case links, episode-owned authorization, documentation gaps, governed
  events, and transactional outbox rows.
- Episode, utilization-review, governed-event, and persistence gateway reads
  and writes establish the context before accessing protected records.
- `tests/integration/od6-rls.test.ts` proves no-context denial, cross-tenant
  isolation, rollback cleanup, non-bypass runtime-role posture, and separate
  concurrent contexts against local `clarity_dev`.

The slice intentionally leaves `AuditEvent`, `CommandIdempotencyRecord`,
inherited child models, global/reference models, provider configuration, and
production role management outside its policy migration. Existing application
organization predicates remain required for those paths.

## Local Provider And Security Evidence

The local synthetic baseline is PostgreSQL on `localhost`, database
`clarity_dev`, with the RLS migration applied. The focused integration proof
creates a disposable `NOSUPERUSER NOBYPASSRLS` role and verifies no-context
denial, tenant isolation, rollback cleanup, and concurrent context separation.
This is direct technical evidence for the local boundary. It is not a selected
production provider, provider-backed pooling evidence, or human security
acceptance.

## Provider And Connection Decision

| Option | Description | Decision posture |
|---|---|---|
| A | Managed PostgreSQL with a direct or session-sticky connection path and transaction-local context | Viable if connection limits, failover, backups, region, and operational ownership are accepted |
| B | Managed PostgreSQL with transaction pooling, provided the Prisma transaction path and `set_config(..., true)` behavior are verified on the selected provider | Recommended compatibility target; avoids session-scoped tenant state but requires provider-specific integration tests |
| C | Database-per-tenant or schema-per-tenant isolation | Deferred; materially changes routing, migrations, operations, and the current shared-schema contract |
| D | RLS enabled immediately on the local synthetic database | Rejected as a decision shortcut; local enablement would not resolve provider, runtime-role, policy-coverage, or recovery questions |

### Recorded Choice

Tyler selected Option A for the first provider-backed proof: Google Cloud SQL
for PostgreSQL, `us-central1`, direct connections. The application contract
continues to require transaction-local context and organization predicates.
Transaction pooling remains a later compatibility decision, not an implicit
change to this slice.

## Tenant Context Contract

The future runtime boundary should establish context as follows:

```text
verified bearer token
  -> AuthenticationService.authenticate()
  -> database-backed AuthenticatedPrincipal
  -> principal.organizationId
  -> begin transaction
  -> set_config('app.current_organization_id', organizationId, true)
  -> tenant-scoped queries and writes
  -> commit or rollback
  -> transaction-local context disappears
```

Rules:

- The context value MUST come from the verified server principal.
- The browser, URL, request body, assertion, and caller-supplied actor MUST
  NOT set tenant context.
- Missing, empty, malformed, or conflicting context MUST fail closed.
- The context setter MUST run before the first tenant-owned query in the
  transaction.
- All tenant-owned mutations and reads MUST use the same transaction boundary
  that established context.
- A raw Prisma client path that can touch tenant-owned tables without the
  context wrapper MUST be prohibited in the production runtime boundary.
- Organization predicates remain in application queries even after RLS is
  enabled; RLS is not permission to remove them.

## Database Role Separation

| Role | Intended use | RLS bypass | Migration authority | Break-glass |
|---|---|---:|---:|---:|
| Runtime application role | API/service transactions | No | No | No |
| Migration role | Explicit release migration job | Separate reviewed privilege | Yes, only for migration | No ordinary request access |
| Recovery/break-glass role | Provider-approved restore or emergency repair | Separate reviewed privilege | Controlled | Yes, auditable and time-limited |
| Local test role | `clarity_dev` deterministic tests | Local-only test setup | Local-only | No production access |

The selected provider must document how table ownership, `BYPASSRLS`, role
grants, connection secrets, rotation, and audit records are managed. A
`SYSTEM_ADMIN` application role is not a database RLS bypass.

## Policy Coverage Map

RLS policy design must classify every Prisma model before a migration. Direct
`organizationId` coverage is straightforward; inherited child records need an
explicit parent-existence policy or a deliberately approved direct tenant key.

| Classification | Current model examples | Required design treatment |
|---|---|---|
| Direct tenant-owned | `User`, `AuthSession`, `PatientToken`, `BehavioralHealthCase`, `SourceDocument`, `EvidenceItem`, `PayerProfile`, `InsuranceCoverage`, `Authorization`, `FacilityProfile`, `AuditEvent`, `CommandIdempotencyRecord`, `FacilityTimezoneConfiguration`, `Episode`, `CaseEpisodeLink`, `EpisodeAuthorization`, `AuthorizationReview`, `AuthorizationDayDecision`, `DocumentationGap`, `DocumentationGapStatusHistory`, `GovernedEvent`, `OutboxRecord` | RLS `USING` and `WITH CHECK` compare the row tenant to transaction-local context |
| Inherited through a tenant-owned parent | `HumanReview`, `LegalStatusRecord`, `MedicalNecessityReview`, `PlanProfile`, `EligibilityVerification`, `EligibilityProof`, `BenefitVerification`, `BenefitVerificationSource`, `FinancialEducationRecord`, `Referral`, `CustodyEvent` | Use an explicit parent relationship policy and test joins, direct IDs, inserts, updates, and deletes |
| Global/reference or policy-owned | `Organization`, `RuleSet`, `Rule` and any future shared reference records | Explicitly classify as global, organization-owned, or restricted; do not assume RLS coverage from a name |

This map is a design inventory, not proof that every relationship is currently
ready for policy SQL. The migration must be generated from the live schema and
reviewed against every foreign key and access path.

## Required Acceptance Tests

Before an RLS migration or tenant-context helper is approved, deterministic
tests must prove:

1. No tenant context returns no tenant-owned rows and cannot insert a tenant
   row.
2. Organization A cannot read, update, delete, enumerate, or insert as
   organization B.
3. Direct ID lookups preserve non-revealing not-found behavior across tenants.
4. Child records cannot be reached through a parent belonging to another
   organization.
5. Audit events, governed events, outbox rows, corrections, and idempotency
   records cannot cross tenants.
6. The runtime application role cannot bypass RLS or read migration-only data.
7. The migration role is not usable through ordinary API authentication.
8. A transaction rollback clears tenant context and leaves no state for the
   next transaction on a reused connection.
9. Concurrent transactions for different organizations cannot observe each
   other's context.
10. Organization scope comes from a database-backed authenticated principal;
    caller-supplied organization fields are rejected or ignored.
11. RLS-denied and nonexistent identifiers map to the approved non-revealing
    application error behavior.
12. Policy coverage and migration replay are verified on the selected provider,
    not only on local `clarity_dev`.

## Rollout And Recovery Boundary

The local synthetic slice is complete. The selected provider-backed
implementation may extend policy coverage and runtime-role configuration. It
must be preceded by:

- provider, region, direct-connection, backup, and operational ownership
  acceptance;
- a migration/recovery plan linked to
  `S2_MIGRATION_PROMOTION_AND_RECOVERY_CHECKLIST.md`;
- a backward-compatible application deployment that can set context before
  policies are enforced;
- a policy coverage review and provider-backed isolation test;
- explicit owner and security approval naming files and commands.

No provider account, secret, deployment, live tenant, API route, worker, outbox
delivery, or production data is authorized by this packet.

## Owner Decision (2026-07-19, original)

- Decision: `[x] Accept recommended posture`  `[x] Select provider/connection option`  `[ ] Revise`  `[ ] Defer`
- Provider: `Google Cloud SQL for PostgreSQL`
- Region: `us-central1`
- Connection/pooling mode: `Direct connection`
- Owner/security approver: `Tyler Hebert / Clarity product owner`
- Date: `2026-07-19`
- Notes: Tyler accepted the recommended posture and selected the provider,
  region, and direct connection mode. The local synthetic slice is verified.
  `gcloud` is installed locally, but no authenticated account or project was
  available during this pass, so provider-backed tests, Cloud SQL role setup,
  backup/restore, and production implementation remain unverified. Application
  predicates remain required alongside the local RLS boundary. No provider
  secret, live tenant, or production deployment is authorized by this record.

## Amendment — 2026-09-13: Provider Swapped To Supabase, First Provider-Backed Write

Full detail, evidence, and the RLS-vs-REST-exposure distinction are in
[ADR-0022](../architecture/ADR-0022-supabase-provider-swap.md); this section
records the owner decision itself.

Tyler had an existing, previously-idle Supabase project (`clarity-platform`,
ref `ipragrvmnhdnnltwyqbq`, region `ca-central-1`, created 2026-08-07) and, in
this session, directed swapping the provider from Google Cloud SQL to it,
then explicitly authorized applying the schema — the first time this
packet's "provider-backed" step has actually happened. All 25 existing
Prisma migrations were applied unchanged. Supabase's default `anon`/
`authenticated` REST-API grants (present on all 60 public tables, 44 without
RLS) were found and revoked same session — a Supabase-specific exposure
class Cloud SQL would never have had, unrelated to this packet's RLS design.

**Still not satisfied by this amendment** — every item in
[Required Acceptance Tests](#required-acceptance-tests) above remains
unverified against the new provider; only the local `clarity_dev` evidence
exists. No dedicated non-superuser runtime role has been created on Supabase
(Prisma still connects as `postgres`, mirroring the same accepted local-dev
gap). No backup/restore, break-glass, or secret-rotation plan exists for this
project. No application code or test points at Supabase — `DATABASE_URL` for
the app and every test suite remains local `clarity_dev`.

### Owner Decision (2026-09-13, current)

- Decision: `[x] Accept recommended posture`  `[x] Select provider/connection option`  `[ ] Revise`  `[ ] Defer`
- Provider: `Supabase Postgres` (project `ipragrvmnhdnnltwyqbq`)
- Region: `ca-central-1`
- Connection/pooling mode: `Session pooler` (`aws-0-ca-central-1.pooler.supabase.com:5432`) — the direct host is IPv6-only and unreachable from this session's network; session-pooler mode preserves the "not transaction pooling" requirement from the original Option A choice
- Owner/security approver: `Tyler Hebert / Clarity product owner`
- Date: `2026-09-13`
- Notes: supersedes the provider/region/connection fields of the 2026-07-19
  decision above; every other posture requirement recorded there (shared
  schema, application-layer predicates, transaction-local context, non-owner
  runtime role, separate migration/recovery role, no session-scoped tenant
  state) is unchanged and still required. This record authorizes exactly
  what was done — schema migration and closing the anon/authenticated
  REST-exposure gap — and nothing beyond that; it does not authorize
  production configuration, live/real data, application deployment against
  this database, or any broader RLS rollout.
