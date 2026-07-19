---
status: Proposed boundary; architecture and operations decision required
owner: Technical lead with operations review
date: 2026-07-19
data_boundary: synthetic only
related_decisions: S2 persistence decision packet, ADR-0012, OD-6, OD-9
---

# Outbox Delivery Boundary Decision

## Purpose

Separate the verified transactional outbox write from future event delivery.
This record does not add a worker, lease columns, external integration, or
delivery configuration.

## Current Facts

- `writeGovernedEventWithOutbox` writes the governed event and `OutboxRecord`
  in the same transaction as the source mutation and audit write.
- New outbox records remain `PENDING`.
- The repository has no dispatcher, worker, claim protocol, retry state,
  dead-letter state, or external delivery adapter.
- The source-of-truth operational facts remain transactional records; governed
  events and outbox records are separate append-oriented delivery artifacts.

## Recommended Boundary

Keep the repository gateway responsible only for atomic persistence. A future
delivery slice should own:

1. Claiming with a lease and bounded visibility timeout.
2. At-least-once delivery and consumer idempotency.
3. Retry classification, exponential backoff, and a dead-letter policy.
4. Operator replay with an audit trail.
5. Metrics and alerts for age, attempts, failures, and dead letters.
6. Tenant and event-type authorization for every delivery target.

The future slice must not infer clinical, legal, admission, placement, payer,
or authorization decisions from delivery state.

## Options

| Option | Description | Assessment |
|---|---|---|
| A | Add worker and lease columns to the S2 persistence migration now. | Rejected: speculative runtime and schema scope before an owner, consumer, or deployment boundary exists. |
| B | Keep `PENDING` persistence and design delivery as a separately approved slice. | Recommended: preserves atomic source truth and keeps delivery failure independent. |
| C | Deliver synchronously from the repository transaction. | Rejected: couples external availability to source writes and weakens rollback semantics. |

## Required Decisions Before Implementation

- Delivery owner and runtime boundary.
- Target systems and event-type allowlist.
- Lease, retry, backoff, and dead-letter semantics.
- Consumer idempotency key and replay behavior.
- Observability, alerting, and operator permissions.
- Tenant enforcement and secret/configuration ownership.

## Gate

No outbox worker, scheduler, lease/attempt migration, external delivery, or
API surface is authorized by this document. The S2 outbox remains a
transactional `PENDING` record only.
