---
status: Implemented and verified against clarity_dev
owner: TBD
version: 1.0.0
last_integrated: 2026-07-13
source_artifacts:
  - packages/authorization-service/ (command service, role policy)
  - packages/case-repository/src/authorizationGateway.ts (approved Prisma adapter)
  - packages/domain-contracts/src/authorization.ts (state machine, readiness assessment, LEVELS_OF_CARE)
  - prisma/migrations/*_authorization_tenancy_and_versioning
unresolved_conflicts: "payer submission/decision phases deferred (assertHumanSubmitter gate reserved); actor roles trusted from caller until auth exists"
related_requirements: REQ-009 lineage (source REQ matrix missing — OD-1)
related_adrs: ADR-0010 (decision record), ADR-0009, ADR-0003
---

# Authorization Readiness (Preparation Phase)

Per case and coverage: is payer authorization required, what's missing, and where does preparation stand. Human-performed; no payer submission. Decisions: **ADR-0010**.

## Command flow

```text
caller → AuthorizationCommandService.<command>(envelope)
  1. Zod strict parse — no status field on RecordAuthorization (derived from
     the cited quote); TransitionAuthorizationPreparation accepts ONLY
     PREPARING | NOT_REQUIRED | UNABLE_TO_COMPLETE (SUBMITTED unreachable)
  2. role policy (record/transition: AUTHORIZATION_SPECIALIST,
     UTILIZATION_REVIEWER; readiness view adds benefits/intake/org-admin)
  3. rationale rules (NOT_REQUIRED and UNABLE_TO_COMPLETE need a reason)
  4. PrismaAuthorizationGateway — ONE transaction:
       scoped reads: case {id, org} → coverage {id, org, caseId}
                     → quote {id, coverageId}
       initial status derived from quote.authorizationRequired
       canTransitionAuthorization revalidated on the fresh row
       conditional UPDATE {id, org, caseId, version} + increment
       atomic audit event; idempotency record with objectId replay
```

## Commands

| Command | Rule highlights | Audit action |
|---|---|---|
| `RecordAuthorization` | initial status derived (true→NOT_STARTED, false→NOT_REQUIRED, null→rejected); quote must belong to the named coverage; one record per (coverage, LOC) | `AUTHORIZATION_RECORDED` |
| `TransitionAuthorizationPreparation` | preparation targets only (structural); state machine revalidated; rationale for NOT_REQUIRED/UNABLE_TO_COMPLETE; version-guarded | `AUTHORIZATION_STATUS_CHANGED` |
| `AssessAuthorizationReadiness` | derived per-coverage view: requirement + named gaps + authorization statuses; **no aggregate score** (readiness doctrine, verified by test); tenant-scoped, role-gated read (unaudited — derived metadata) | — |

## Verified (this session, local clarity_dev — 10 integration tests)

Recording: NOT_STARTED derived from a requiring quote with the derivation in audit metadata; NOT_REQUIRED derived from a non-requiring quote; null requirement rejected with nothing written; cross-coverage quote citation refused; duplicate (coverage, LOC) refused; benefits/intake/auditor cannot record; idempotent replay (one row, one event). Transitions: NOT_STARTED→PREPARING audited; SUBMITTED structurally unreachable (envelope rejects it); rationale required before the state machine even gets to say UNABLE_TO_COMPLETE is illegal from NOT_STARTED; stale version fails safely; PREPARING→NOT_REQUIRED with reason lands. Tenant isolation: A cannot record against or transition B's records (non-revealing misses); B's row byte-identical. Readiness: two-coverage case reports PRIMARY REQUIRED with no gaps (eligibility confirmed + preparation underway) and SECONDARY UNKNOWN with `ELIGIBILITY_NOT_CONFIRMED` + `BENEFIT_QUOTE_MISSING`; REQUIRED-but-not-started and unverified-requirement gaps flagged; no `score`/`overallReadiness` property exists; cross-tenant read is a non-revealing miss; auditor may not read the view.

Full root suite **177/177**; app 37/37; lint, typecheck, `prisma validate`, `migrate status` clean; zero synthetic residue.

## Known limitations

1. No authentication — roles are trusted envelope input (unchanged platform assumption).
2. Submission/decision phases deferred: authorization numbers, dates, units, denial/appeal fields exist in the schema but are written by no command yet; `assertHumanSubmitter` is reserved for that phase.
3. Readiness reads are unaudited (derived metadata; document access remains audited because content is sensitive).
4. No staleness signal on quotes feeding the requirement derivation; re-verification cadence is future work.
