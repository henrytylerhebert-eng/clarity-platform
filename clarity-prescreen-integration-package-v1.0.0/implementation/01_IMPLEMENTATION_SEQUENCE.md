# Implementation Sequence

Each slice must be independently verifiable and preserve dirty work.

## Slice 0 — Repository preflight and ADR reconciliation

**Goal:** verify current branch, working tree, package patterns, test baseline, and API/hosting decision.  
**Changes:** documentation/decision artifacts only unless owner approves architecture.  
**Evidence:** git state, current tests/typecheck/lint/build/Prisma validation.  
**Stop:** unresolved API/tenancy/security decision blocks route expansion.

## Slice 1 — Prescreen domain contracts

**Goal:** add deterministic types, schemas, orientation/willingness/pathway logic, encounter state machine, target readiness, and events.  
**No Prisma/API/UI.**  
**Tests:** willing/oriented; willing/not oriented; non-opposed; opposed; medical stabilization; invalid transitions; blank-not-negative.

## Slice 2 — Prescreen service and in-memory gateway

**Goal:** controlled commands for start, save draft, attest, supplement, submit.  
**Requirements:** strict envelopes, verified actor, policy, idempotency, expected version, audit contract.  
**Tests:** replay, key misuse, tenant isolation, immutable attestation, supplement chain, error equivalence.

## Slice 3 — Prisma persistence

**Goal:** add approved transactional models and Prisma gateway.  
**Migration:** additive tables/indexes only; no production data.  
**Tests:** transaction atomicity, organization predicates, version conflict, cleanup, no synthetic residue.

## Slice 4 — Read-only API and projections

**Goal:** expose authenticated list/detail projections without new mutation.  
**Dependency:** accepted API adapter decision.  
**Tests:** principal-derived tenant/roles, denied existence leakage, pagination, sensitive field filtering.

## Slice 5 — Assessment vertical slice

**Goal:** start → guided assessment → review → attest → Central Intake receive.  
**UI:** responsive, accessible, synthetic only.  
**Tests:** component/domain integration, keyboard, error recovery, version conflict.

## Slice 6 — Communications and workflow tasks

**Goal:** information request, owner, due time, acknowledgement, completion, escalation, communication timeline.  
**Tests:** external vs internal wait, reassignment history, channel failure, no raw message logging.

## Slice 7 — Durable referral packet

**Goal:** requirements, document linkage, target readiness, immutable packet manifest, transmission/receipt.  
**Tests:** exact document versions, stale/superseded documents, unavailable-with-reason, target-specific blockers.

## Slice 8 — Authorized review and facility response

**Goal:** reviewer authority, request-more-information, acceptance/decline/redirect, rationale and conditions.  
**Tests:** credential/delegation policy, no Central Intake authority escalation, audit.

## Slice 9 — Transport and custody

**Goal:** server-owned qualification, plan, arranger/carrier split, custody sequence, handoff.  
**Tests:** OPC/PEC/CEC blocked categories, credential stale, missing destination/instrument, broker actual carrier, hash/event chain.

## Slice 10 — Facility configuration

**Goal:** draft profile, source mapping, multi-domain approvals, effective versions, synthetic tests, activation/supersession.  
**Guardrail:** no automated publication from policy extraction.

## Slice 11 — Policy ingestion assistance

**Goal:** upload/classify policy and produce candidate requirements with exact source locations.  
**Requires:** document security, malware scanning, extraction review, model gateway governance.

## Slice 12 — External adapters

**Goal:** add one partner-specific integration through canonical commands/events.  
**Start with:** the highest-value available interface, not all standards at once.

## Slice 13 — Operational trends

**Goal:** aggregate process measures with versioned definitions, completeness/freshness, suppression, and `No measurements found` state.
