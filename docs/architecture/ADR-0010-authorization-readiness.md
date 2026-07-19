# ADR-0010 — Authorization Readiness (Preparation Phase)

- **Status:** Accepted
- **Date:** 2026-07-13
- **Related:** ADR-0009 (benefits — the requirement source), ADR-0003 (command pattern), `docs/planning/MVP_ROADMAP.md` (Phase 2), `docs/implementation/AUTHORIZATION_READINESS_IMPLEMENTATION.md`

## Context

With benefits verification recorded (ADR-0009), the case knows — per quote — whether payer authorization is required. Phase 2's deliverable is exactly that knowledge made operational: per case and coverage, is authorization required, what's missing, and where does preparation stand. **No payer submission, no integrations** — this is the readiness layer the submission phase will build on.

## Decisions

### 1. The initial status is derived, never asserted

`RecordAuthorization` takes a coverage, a level of care, and the **benefit quote that answers the requirement question**. The initial status comes from the quote: `authorizationRequired: true → NOT_STARTED`, `false → NOT_REQUIRED` (a positive "we checked" record), `null → rejected` (`AuthorizationRequirementUnknownError` — re-verify benefits first). The command envelope has no status field; a caller cannot claim an authorization state the recorded facts don't support. The cited quote must belong to the named coverage (which is itself tenant- and case-scoped) — enforced in-transaction.

### 2. The phase boundary is structural

`TransitionAuthorizationPreparation` accepts only `PREPARING | NOT_REQUIRED | UNABLE_TO_COMPLETE` — `SUBMITTED` and payer-decision statuses are not legal envelope values, so submission is unreachable through this service by construction, not by convention. The existing `canTransitionAuthorization` state machine is still re-validated against the fresh row inside the transaction (e.g. `NOT_STARTED → UNABLE_TO_COMPLETE` is illegal even with the right envelope). When the submission phase arrives, it extends this service behind the existing `assertHumanSubmitter` contract — agents may prepare; only a human may submit.

### 3. Readiness is a derived per-coverage view with named gaps — and deliberately no score

`assessAuthorizationReadiness` (pure function in `domain-contracts`, assembled by the gateway from recorded facts) reports, per coverage: the requirement (`REQUIRED | NOT_REQUIRED | UNKNOWN`, from quotes), named actionable gaps (`ELIGIBILITY_NOT_CONFIRMED`, `BENEFIT_QUOTE_MISSING`, `AUTHORIZATION_REQUIREMENT_UNVERIFIED`, `AUTHORIZATION_NOT_STARTED`), and the authorization records with statuses. Honoring the readiness doctrine (`readiness.ts`: dimensions are displayed side by side, never blended): there is **no aggregate score, no ranking, no combined flag** — verified by test. Nothing here may ever feed a blend that includes financial readiness.

### 4. Rationale rules

Leaving the normal preparation path requires a documented reason: transitions to `NOT_REQUIRED` (asserting/confirming a payer position) and `UNABLE_TO_COMPLETE` both demand one.

### 5. One record per (coverage, level of care)

Duplicates are refused in this phase (`DuplicateAuthorizationError`). Re-requests, appeals, and concurrent-review reopenings belong to the submission/decision phase where the state machine already models them.

### 6. Schema change (justified; table verified empty)

Migration `authorization_tenancy_and_versioning`: `Authorization` gains `organizationId` and `version` (+ index `[organizationId, caseId]`) — the same tenancy-on-the-row and optimistic-concurrency discipline as every other aggregate. Contract addition: `LEVELS_OF_CARE` mirror of the schema enum (none existed).

### 7. Roles

`RecordAuthorization`/`TransitionAuthorizationPreparation`: `AUTHORIZATION_SPECIALIST`, `UTILIZATION_REVIEWER` (matching the case service's `authorization` workstream policy). The readiness view is readable by those plus `BENEFITS_VERIFICATION_SPECIALIST`, `INTAKE_COORDINATOR`, and `ORGANIZATION_ADMIN`. Auditor/compliance/system-admin: nothing.

## Out of scope (deliberate)

Payer submission and decision recording (SUBMITTED/PENDING/APPROVED/PARTIALLY_APPROVED/DENIED — next phase, behind `assertHumanSubmitter`); appeal workflows; authorization numbers/dates/units (columns exist, written by the decision phase); assignment of authorization work (`assignedUserId` unused); notification-requirement tracking as its own workflow (surfaced in readiness facts only).

## Consequences

- The packet/routing phases can consume the readiness view directly: a case's coverages each carry requirement + gaps, human-readable and machine-checkable.
- Audit vocabulary: `AUTHORIZATION_RECORDED` (with the derivation: quote id, `authorizationRequired`, `initialStatus`), `AUTHORIZATION_STATUS_CHANGED` (from/to).
- Known limits: readiness reads are not audited (derived metadata, consistent with other list reads — document access remains audited because content is sensitive); no re-assessment triggers or staleness warnings on quotes; `UNABLE_TO_COMPLETE` is reachable only from `PREPARING` per the pre-existing machine.
