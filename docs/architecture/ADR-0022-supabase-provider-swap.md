# ADR-0022: Provider Swap — Supabase Postgres Replaces Google Cloud SQL for OD-6's First Provider-Backed Proof

- **Status:** Accepted (owner-directed live in this session, 2026-09-13)
- **Owner ruling:** Tyler had an existing, previously-idle Supabase project
  (`clarity-platform`, ref `ipragrvmnhdnnltwyqbq`, `henrytylerhebert-eng`'s
  Org, created 2026-08-07) and directed swapping OD-6's recorded provider
  choice from Google Cloud SQL to this project, then explicitly authorized
  actually applying the schema to it — the first time OD-6's
  "provider-backed" step has happened at all. No GCP account/project was
  ever available for the original Cloud SQL choice, so that option remained
  pure recorded intent from 2026-07-19 until this swap.

## Context

[OD-6](../decisions/OD-6_PROVIDER_AND_RLS_DECISION_PACKET.md) recorded Google
Cloud SQL for PostgreSQL (`us-central1`, direct connections) as the selected
provider for the first provider-backed proof, explicitly noting "no
authenticated account or project was available." That remained true for
nearly two months. This session, Tyler asked to use an existing Supabase
project instead, so the provider changed — the RLS design, application
tenancy contract, and role-separation requirements OD-6 already recorded are
unchanged.

## Decisions

1. **Provider swap.** Google Cloud SQL for PostgreSQL (`us-central1`) →
   Supabase Postgres, project `ipragrvmnhdnnltwyqbq`, region `ca-central-1`.
   Nothing about the schema, RLS policy shape, or tenant-context contract
   changed — only the hosting provider.

2. **Connection topology.** Supabase's direct-connection host
   (`db.ipragrvmnhdnnltwyqbq.supabase.co:5432`) is IPv6-only on new projects
   and was unreachable from this session's sandbox network (confirmed via
   `dig`; general internet access was otherwise fine). Connected instead
   through Supabase's **session pooler**
   (`aws-0-ca-central-1.pooler.supabase.com:5432`, user
   `postgres.ipragrvmnhdnnltwyqbq`), which is IPv4-compatible and
   session-scoped — not the transaction-mode pooler on port 6543, which
   would break Prisma's prepared-statement usage. This is still OD-6's
   Option A ("direct or session-sticky connection path"), not Option B
   (transaction pooling); the original posture's provider-neutral
   requirements (transaction-local context via `set_config(..., true)`,
   no session-scoped tenant state) are unaffected by this connection choice.

3. **Schema deployed as-is.** All 25 existing Prisma migrations — the same
   files governing local `clarity_dev`, unmodified — were applied via
   `prisma migrate deploy` against the Supabase database. No new migration
   was authored; this is the existing schema landing on a new host, not a
   schema change.

4. **New Supabase-specific finding, found and fixed same session.** Supabase
   auto-provisions `anon` and `authenticated` Postgres roles with default
   grants across every table in `public` — the plumbing behind its own
   REST/PostgREST Data API — entirely independent of and unrelated to this
   project's own RLS/application-tenancy model. Verified immediately after
   migration: **420 grants each** for `anon` and `authenticated` across all
   60 public tables, **44 of which carry no RLS at all**
   (`User`, `BehavioralHealthCase`, `AuthSession`, `PatientToken`,
   `AuditEvent`, `Organization`, `InsuranceCoverage`, and others). This meant
   those tables would have been reachable through Supabase's Data API using
   nothing but the project's public anon key — a REST-exposure vector Cloud
   SQL would never have introduced, since it has no built-in REST layer.
   Fixed by revoking all current **and default (future)** `anon`/
   `authenticated` privileges on every table and sequence in `public`;
   re-verified zero grants remain for either role afterward.

5. **Runtime role unchanged from the existing accepted gap.** Prisma
   connects as the `postgres` role (superuser, bypasses RLS) on Supabase,
   same as the local `clarity_dev` dev connection. This is the same
   already-documented gap from ADR-0016/OD-6, not a new one introduced by
   this swap.

6. **Local test/dev boundary untouched.** `SUPABASE_DATABASE_URL` was added
   to the local, gitignored `.env` as a variable distinct from
   `DATABASE_URL`, which still points at local `clarity_dev` for every test
   suite and `devMain.ts`. `assertLocalClarityDevDatabase` was not touched
   and nothing in the app or test harness points at Supabase.

## Verified this session (2026-09-13)

All 25 migrations applied without error (`prisma migrate deploy`, clean
output, no manual SQL). Independently queried `information_schema.tables`
immediately after migration — confirmed only Supabase's standard internal
schemas (`auth`, `storage`, `realtime`, `vault`, `extensions`) existed
beforehand, and no unexpected pre-existing tables. Independently queried
`information_schema.role_table_grants` and `pg_class.relrowsecurity` /
`relforcerowsecurity` across all 60 public tables to confirm the
`anon`/`authenticated` exposure and RLS-coverage findings above (not taken
from any external report), then re-queried after the `REVOKE` to confirm
zero grants remain for either role.

## Explicitly NOT claimed

- Provider-backed RLS/tenancy verification on Supabase specifically — the
  `tests/integration/od6-rls.test.ts`-style acceptance suite (no-context
  denial, cross-tenant isolation, rollback cleanup, concurrent-context
  separation — all twelve of OD-6's Required Acceptance Tests) has not been
  run against this database; only local `clarity_dev` has that evidence.
- Any dedicated `NOSUPERUSER NOBYPASSRLS` runtime role on Supabase.
- Backup/restore, break-glass procedure, connection-secret rotation, or any
  operational-ownership plan for this Supabase project.
- Any expansion of RLS coverage — the 44 tables without RLS remain exactly
  as uncovered as before this swap. Closing the REST-API reachability of all
  60 tables is a different property from RLS coverage and must not be read
  as such.
- Any application code, dev server, or test pointed at Supabase —
  `DATABASE_URL` for the running app and every test suite remains local
  `clarity_dev`, unchanged.
- Production readiness, real/PHI data, HIPAA compliance, or any live
  deployment against this database.
