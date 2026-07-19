---
status: H1 implemented and verified; remaining hardening decisions remain gated
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
synthetic-only boundary. H1 is now implemented and verified within the narrow
contract and admission-replay boundary recorded below. This packet continues
to separate the remaining persistence hardening, production tenancy, event
vocabulary, and runtime decisions.

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
| 3 | Concurrent admission retry semantics | H1 targets only the acceptance unique conflict, re-reads the organization-scoped link, compares command identity, and distinguishes replay from conflict. | H1 verified; production retry/observability remains gated |
| 4 | Outbox ownership and failure handling | S2 persists `PENDING` rows atomically; no dispatcher or retry worker exists. | Architecture and operations decision |
| 5 | Event vocabulary expansion | Review-row identifiers and gap-transition events lack dedicated S1 payload schemas. | Domain and governance decision |
| 6 | Program identity contract | H1 aligns the Zod contracts, event payloads, mapper, and already-nullable Prisma column as nullable/source-owned. | H1 verified; revisit only if a canonical program hierarchy becomes required |
| 7 | Command-service boundary | S2 uses a repository persistence adapter; HTTP/runtime work remains excluded. | Technical lead decision |

## Required Evidence Before Any Implementation

1. Tenant enforcement and RLS decision recorded in `OPEN_DECISIONS.md` or a
   dedicated ADR.
2. Additive migration promotion and restore procedure reviewed by the
   technical and security owners.
3. Deterministic concurrency and replay semantics defined for the command
   boundary. H1 evidence is recorded in the implementation section below.
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
generation, scoped lint, and `git diff --check` passed. Repository-wide lint
remains blocked by the unrelated visualizer React ESLint incompatibility.
