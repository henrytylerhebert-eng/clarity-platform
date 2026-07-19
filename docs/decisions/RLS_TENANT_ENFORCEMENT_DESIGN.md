---
status: Proposed design; security and provider decision required
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
security becomes part of the Clarity persistence boundary. This record does
not add policies, change Prisma schema, or authorize production data.

## Current Repository Boundary

- S2 gateways scope reads and writes with `organizationId` predicates.
- Cross-organization rejection is covered by deterministic integration tests.
- `prisma/migrations/20260718231432_s2_episode_persistence/migration.sql`
  contains no RLS policy or tenant-context machinery.
- Prisma uses the configured database connection; the provider, pooling mode,
  and role/session model for production are not recorded as accepted.

## Options

| Option | Description | Assessment |
|---|---|---|
| A | Keep application predicates as the only enforcement through the synthetic pilot boundary. | Lowest implementation change; not sufficient as the final production defense-in-depth posture. |
| B | Add RLS policies to the S2 tables now. | Rejected for now: provider, pooling, tenant context, policy coverage, and error-equivalence tests are unresolved. |
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

No RLS migration, Prisma policy helper, tenant-context middleware, or provider
configuration change is authorized by this document. The current application
predicates remain the verified synthetic-only control until OD-6 and the
security review are resolved.
