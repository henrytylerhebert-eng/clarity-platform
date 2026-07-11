---
status: Implemented and verified against clarity_dev
owner: TBD
version: 1.0.0
last_integrated: 2026-07-11
source_artifacts:
  - packages/case-service/ (implementation)
  - packages/case-repository/src/caseCommandGateway.ts (approved Prisma adapter)
  - prisma/migrations/20260711133547_case_version_and_command_idempotency
unresolved_conflicts: "MEDICAL_TRANSFER_REQUIRED status vocabulary gap (OD-8); actor roles trusted from caller until auth exists"
related_requirements: REQ-001…REQ-004
related_adrs: ADR-0003 (decision record), ADR-0001, ADR-0002
---

# Case Command Service

The application boundary for every case action. Architecture and decisions: **ADR-0003**. This document covers usage and test coverage.

## Command flow

```text
caller → CaseCommandService.<command>(envelope)
  1. Zod strict parse (unknown fields rejected; roles/actor validated)
  2. assertPermitted / assertWorkstreamPermitted   (PermissionDeniedError)
  3. rationale rules                               (RationaleRequiredError)
  4. PrismaCaseCommandGateway — ONE transaction:
       idempotency-key check (replay → prior result, no re-execution)
       scoped read { id, organizationId }          (CaseNotFoundError, non-revealing)
       expectedVersion check                        (ConcurrencyConflictError)
       decide(freshCase) — state machines, terminal rules (TerminalCaseError)
       updateMany { id, organizationId, version } + version increment
       audit insert (action, actor, command, correlationId, reason,
                     previousStateHash, newStateHash, metadata)
       idempotency record insert
       scoped re-read → CommandResult { case, replayed }
```

## Envelope fields

Every command: `organizationId`, `actor { actorId, actorType?, roles? }`, `correlationId?`, `idempotencyKey?` (min 8 chars), `reason?`. Case commands add `caseKey` and `expectedVersion?`. `CreateCase` adds `patientTokenId`, `urgency?`, `currentLocation?`; other commands add their specific payloads (`assigneeUserId`, `urgency`, `currentLocation`, `to`, `workstream`+`to`, `decisionContext`, `reopenTo`).

## Verified behavior (all 12 required tests ran against clarity_dev)

| # | Required behavior | Test |
|---|---|---|
| 1 | Valid transitions succeed | case-command-service: "valid transitions succeed" |
| 2 | Invalid transitions fail | "invalid transitions fail and change nothing" (row + version unchanged) |
| 3 | Tenant A cannot command Tenant B's case | "tenant A cannot command tenant B's case…" (+ same-org assignee check) |
| 4 | Unauthorized roles blocked | auditor/no-command, benefits-vs-clinical workstream, compliance inspect-only |
| 5 | One audit event per mutation | "…exactly one audit event with command, correlation id, and state hashes" |
| 6 | Failed audit write rolls back | "a failed audit write rolls back the whole command" (case AND idempotency record roll back; retry succeeds) |
| 7 | Stale version → concurrency error | "a stale expectedVersion fails safely"; "two staff…first wins" |
| 8 | Idempotency-key reuse safe | create replay (no duplicate row), transition replay (no second audit event/version bump), cross-command reuse rejected |
| 9 | Workstreams update independently | "role-appropriate actors move their workstreams independently" (overall status not erased) |
| 10 | Financial readiness can't block emergency clinical review | benefits BLOCKED → clinical workstream + CLINICAL_REVIEW transition both proceed on an EMERGENT case |
| 11 | Terminal case immutable except permitted path | every command rejected with TerminalCaseError; reopen requires ORGANIZATION_ADMIN + rationale and is audited CASE_REOPENED |
| 12 | Rationale required for high-impact actions | urgency change, close, reopen, CANCELLED transition all reject without reason |

Suite totals this run: **52 integration tests** (2 command-service files: 22; prior repository files: 30, updated for cleanup of idempotency records), full root suite **91/91**, app suite untouched (37/37 + typecheck).

## Known limitations

1. Actor roles are trusted from the caller — no authentication layer exists yet; the service is the authorization point only.
2. ~~`AssignCase` checks the assignee's organization just before the transaction (small TOCTOU window)~~ **Closed 2026-07-11 (ADR-0005):** assignee validation (same organization + `ACTIVE` status) now runs inside the command transaction and is re-asserted as a predicate on the conditional UPDATE itself; a mid-transaction membership change rolls the whole command back. Verified by `tests/integration/case-assignment-atomicity.test.ts`.
3. `RecordDecisionRationale` is audit-only (no `DecisionRecord` table in the foundation schema — expanded-draft model, OD-8).
4. Idempotency records are never expired; a retention policy is future work.
5. Version tokens protect against lost updates, not multi-command sagas.
