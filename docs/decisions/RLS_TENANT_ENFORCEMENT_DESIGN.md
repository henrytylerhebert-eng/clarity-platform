---
status: Accepted posture; bounded local synthetic slice verified; provider implementation remains gated
owner: Technical lead with security review
date: 2026-07-19
data_boundary: synthetic only
related_decisions: OD-6, ADR-0012, S2 persistence decision packet
decision_packet: docs/decisions/OD-6_PROVIDER_AND_RLS_DECISION_PACKET.md
---

# RLS Tenant Enforcement Design

The decision-ready OD-6 packet is
[OD-6_PROVIDER_AND_RLS_DECISION_PACKET.md](OD-6_PROVIDER_AND_RLS_DECISION_PACKET.md).
This document remains the shorter design boundary and is subordinate to the
accepted owner/security decision when one exists.

## Purpose

Define the evidence and decisions required before PostgreSQL row-level
security becomes part of the production Clarity persistence boundary. This
record also documents the bounded local synthetic RLS slice executed after the
OD-6 posture acceptance. It does not authorize production data.

## Current Repository Boundary

- S2 gateways scope reads and writes with `organizationId` predicates.
- Cross-organization rejection is covered by deterministic integration tests.
- `packages/case-repository/src/tenantContext.ts` sets transaction-local
  tenant context for the S2 episode persistence gateways.
- `prisma/migrations/20260719123000_od6_episode_persistence_rls/migration.sql`
  enables direct organization policies for the bounded S2 episode-persistence
  tables.
- `tests/integration/od6-rls.test.ts` proves local no-context denial,
  cross-tenant read/write isolation, rollback cleanup, non-bypass runtime role
  posture, and concurrent context separation.
- `AuditEvent`, `CommandIdempotencyRecord`, inherited child records, and
  global/reference models remain outside this local policy migration.
- Prisma uses the configured database connection; the provider, pooling mode,
  and role/session model for production are not recorded as accepted.

## Options

| Option | Description | Assessment |
|---|---|---|
| A | Keep application predicates as the only enforcement through the synthetic pilot boundary. | Lowest implementation change; not sufficient as the final production defense-in-depth posture. |
| B | Add a bounded RLS boundary to the S2 episode-persistence tables locally. | Implemented for synthetic `clarity_dev`; provider, pooling, broader policy coverage, and production role controls remain unresolved. |
| C | Accept the application predicates for the current synthetic boundary and design RLS before any real data or production pilot. | Recommended. Preserves the current tested boundary while making the security gate explicit. |

## Recommended Design Inputs

Before implementation, the owner and security reviewer must decide:

1. Provider and pooling mode, including whether transaction-local settings
   survive the chosen connection path.
2. The trusted source of `organizationId` for each transaction. It must come
   from authenticated server context, never a browser-supplied tenant field.
3. A transaction-local tenant context mechanism, such as `SET LOCAL`, and the
   behavior when context is absent or malformed.
4. Policy coverage for every organization-owned table, including governed
   events, audit events, outbox rows, corrections, and child records.
5. Cross-tenant read, write, enumeration, and error-equivalence tests.
6. Migration ownership, rollback/restore posture, and a break-glass procedure
   that is auditable and unavailable to ordinary application requests.

## Gate

The owner accepted the recommended posture in the OD-6 packet, and the
explicit execution request authorized the bounded local synthetic migration,
helper, and tests described above. Provider identity, connection mode,
security review, provider-backed tests, broader policy coverage, and production
implementation authorization remain open. Application predicates remain
required alongside the local RLS boundary.
