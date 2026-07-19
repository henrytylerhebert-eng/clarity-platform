---
status: Decision work approved; implementation remains gated
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
synthetic-only boundary. This packet defines the next decisions without
authorizing implementation. Its purpose is to prevent persistence hardening,
production tenancy, event vocabulary, and runtime concerns from collapsing into
one oversized slice.

## Proposed Boundary

If approved, the next slice would resolve and document:

- database tenant enforcement and the timing of RLS;
- migration promotion, restore, and recovery evidence;
- production retry semantics for idempotency and concurrent admissions;
- outbox failure, retry, ownership, and observability boundaries;
- governed event vocabulary for review corrections and documentation-gap
  transitions;
- the `Episode.programId` domain-contract versus Prisma-nullability mismatch;
- whether command services belong in a later repository-runtime slice.

This packet does not authorize API routes, API framework changes, workers,
outbox dispatch, analytics marts, dashboards, frontend changes, Product Studio,
external integrations, deployment, production flags, or real data.

## Decisions Required

| # | Decision | Current evidence | Human gate |
|---:|---|---|---|
| 1 | RLS timing and database tenant enforcement | S2 has organization predicates and cross-tenant tests; RLS is still OD-6. | Security and technical approval |
| 2 | Migration recovery model | S2 migration is additive and applied locally; no production restore evidence exists. | Technical and operations approval |
| 3 | Concurrent admission retry semantics | Current behavior protects uniqueness; a racing second writer may receive a constraint error before retry replay. | Technical decision |
| 4 | Outbox ownership and failure handling | S2 persists `PENDING` rows atomically; no dispatcher or retry worker exists. | Architecture and operations decision |
| 5 | Event vocabulary expansion | Review-row identifiers and gap-transition events lack dedicated S1 payload schemas. | Domain and governance decision |
| 6 | Program identity contract | S1 requires `programId`; Prisma persistence keeps it nullable/source-owned. | Domain and technical decision |
| 7 | Command-service boundary | S2 uses a repository persistence adapter; HTTP/runtime work remains excluded. | Technical lead decision |

## Required Evidence Before Any Implementation

1. Tenant enforcement and RLS decision recorded in `OPEN_DECISIONS.md` or a
   dedicated ADR.
2. Additive migration promotion and restore procedure reviewed by the
   technical and security owners.
3. Deterministic concurrency and replay semantics defined for the command
   boundary.
4. Outbox failure ownership and retry policy defined without adding a worker.
5. Event payload schemas either extended deliberately or the current
   interpretation accepted as an interim boundary.
6. Program identity mismatch resolved without weakening the synthetic-only
   contract accidentally.
7. Explicit implementation approval naming files, tests, and exclusions.

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
