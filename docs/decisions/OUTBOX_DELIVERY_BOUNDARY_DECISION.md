---
status: Recommended ownership design; architecture and operations acceptance required
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

## Ownership Model

| Responsibility | Owner | Current boundary |
|---|---|---|
| Source mutation, governed event, and outbox write | Case repository / persistence owner | Owns one atomic transaction; may only create the `PENDING` outbox record |
| Delivery runtime | Future separately deployed integration/runtime owner | Owns claiming, leases, attempts, retry scheduling, and delivery status only after a separate approval |
| Target contract and consumer idempotency | Named target-system owner | Owns accepted event types, schema versions, deduplication, and acknowledgement behavior |
| Secrets, tenant authorization, and network access | Security/platform owner | Owns credentials, target allowlists, tenant boundaries, and rotation |
| Operations and replay | Named operations owner | Owns alerts, dead-letter review, operator replay, and incident records |
| Product and scope approval | Human project owner | Approves the target, event allowlist, data boundary, and any production rollout |

The repository owner is not the delivery owner. A future dispatcher must not
reach back into source tables to invent or amend clinical, legal, admission,
placement, payer, or authorization facts.

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

The recommended delivery contract is at-least-once. `governedEventId` is the
stable source event identity and must be carried as the consumer idempotency
key. A delivery attempt may fail, retry, or be replayed without changing the
source fact, governed envelope, or original outbox record. Delivery status is
operational state, not a replacement for source truth.

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

The owner must also name the first target consumer and the delivery runtime
owner. Without both, the repository remains the only implemented owner and the
outbox remains persistence-only.

## Gate

No outbox worker, scheduler, lease/attempt migration, external delivery, or
API surface is authorized by this document. The S2 outbox remains a
transactional `PENDING` record only. The ownership model above is a
recommendation awaiting architecture and operations acceptance.
