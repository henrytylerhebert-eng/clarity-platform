# Codex Execution Handoff

## Scope of this prompt

This prompt is for the **first approved coding slice only: S1 — domain contracts and deterministic logic**. It intentionally does not ask Codex to modify Prisma, create routes, add UI, or deploy workers. That keeps the first change reviewable and forces unresolved architecture/security decisions to surface before persistence.

All generated code is **Proposed and unverified** until Codex runs the live repository.

## Prompt for Codex

```text
You are working in the live `clarity-platform` repository.

Goal
----
Implement only the first approved Clarity Hospital Operations and Outcomes Intelligence slice:
domain contracts, schemas, state machines, deterministic episode-day authorization derivation,
and focused tests. Do not add database migrations, service runtimes, API routes, workers,
frontend workspaces, feature flags, external integrations, or deployment code in this change.

Authoritative design inputs
---------------------------
Read, in order:

1. the live repository working tree and existing implementation;
2. current canonical docs and accepted ADRs;
3. `clarity-analytics-return-package/01_SOURCE_AND_ASSUMPTION_REGISTER.md`;
4. `clarity-analytics-return-package/03_SYSTEM_ARCHITECTURE.md`;
5. `clarity-analytics-return-package/04_DOMAIN_AND_EVENT_MODEL.md`;
6. `clarity-analytics-return-package/07_API_AND_SERVICE_CONTRACTS.md`;
7. `clarity-analytics-return-package/10_METRIC_REGISTRY.md`;
8. `clarity-analytics-return-package/contracts/analytics-event-envelope.schema.json`;
9. `clarity-analytics-return-package/contracts/event-catalog.md`;
10. `clarity-analytics-return-package/contracts/metric-definition.schema.json`.

Preflight — mandatory before editing
------------------------------------
1. Run and report:
   - `git status --short`
   - current branch
   - `git rev-parse HEAD`
   - relevant uncommitted diffs
2. Preserve all dirty work. Do not reset, clean, checkout over, stash, amend, or reformat unrelated files.
3. Inspect:
   - root package/workspace/test scripts;
   - `packages/domain-contracts` directory structure, barrel exports, ID brands, Zod version,
     enum conventions, error/result patterns, state-machine style, and test style;
   - existing authorization readiness contracts and state machines;
   - existing analytics/prototype event types so names do not collide;
   - current `UserRole` enum only for references; do not invent new persisted roles in this slice;
   - current formatting/lint/TypeScript conventions.
4. Confirm whether the owner has accepted the decisions that affect S1:
   - post-admission authorization is a separate episode-owned contract;
   - coverage outcome and risk flags are separate;
   - correction is append-only/superseding;
   - exact facility timezone is required for service-date derivation;
   - first-slice metrics remain draft.
5. If any of those decisions are unresolved in the live repo, stop and report the exact blocker.
6. If proposed paths conflict with current conventions, use current conventions and document the mapping.

Implementation boundary
-----------------------
Add contracts under the existing `packages/domain-contracts` conventions for:

A. Episode
- Episode status for the first slice: ACTIVE, DISCHARGED, CLOSED.
- Admission handoff command input contract excluding organizationId, actorId, roles,
  event classification, and metric fields.
- Case/episode link relationship contract.
- Facility timezone/service-date input contract.
- No admission acceptance decision logic.

B. Post-admission utilization review
- Episode authorization requirement/status.
- Authorization review type/status.
- Inclusive date-range decision contract: APPROVED, DENIED, PENDING.
- Controlled denial reason hook/type without proprietary criteria.
- Documentation-gap categories/status transitions.
- UR assignment contract.
- Do not modify existing pre-admission authorization readiness behavior.

C. Episode-day derivation
- Coverage status:
  NOT_REQUIRED, APPROVED, DENIED, PENDING, EXPIRED, UNREQUESTED, UNKNOWN.
- Risk codes:
  REVIEW_DUE_SOON, REVIEW_OVERDUE, AUTH_EXPIRES_SOON, AUTH_EXPIRED,
  DOCUMENTATION_GAP, SOURCE_DISAGREEMENT, DATA_INCOMPLETE.
- Pure deterministic function(s) taking active, already-authorized source facts and returning
  coverage status, risk codes, quality state, and lineage inputs.
- Treat at-risk as an overlapping risk dimension, never a mutually exclusive coverage outcome.
- Conflicting overlapping approved/denied ranges must return UNKNOWN plus SOURCE_DISAGREEMENT;
  do not guess precedence beyond the approved rules.
- No current-time calls inside pure logic; pass evaluation time/date and threshold configuration.

D. Governed event envelope
- Implement a TypeScript/Zod equivalent of the supplied JSON Schema, adapted to repository style.
- Separate envelope from event-specific payload schemas.
- Include event/schema versions, tenant/scope, aggregate, subject references, effective/recorded time,
  actor/source, correlation/causation, PHI classification, quality, review, correction,
  metric eligibility, payload hash, and payload.
- Client command schemas must not allow callers to set server-owned envelope fields.

E. Metric definition contract
- Implement the registry contract needed to validate checked-in first-slice draft definitions.
- No arbitrary SQL/expression execution.
- Define draft metadata for:
  approved patient days, denied patient days, pending patient days, expired patient days,
  at-risk patient days, open documentation gaps, concurrent reviews due.
- Keep denial-rate definition draft/unapproved unless the live decision log proves a denominator
  was approved.
- Preserve `NO_MEASUREMENTS_FOUND` versus numeric zero.

Required tests
--------------
Use the repository's existing test framework/style. At minimum test:

1. every schema accepts a valid synthetic object and rejects unknown/prohibited fields;
2. admission command cannot accept organizationId, actorId, roles, or acceptance decision;
3. inclusive range validation and start <= end;
4. denied range requires a controlled denial reason according to the approved contract;
5. documentation-gap allowed and prohibited transitions;
6. approved day;
7. denied day;
8. pending day;
9. expired day;
10. unrequested day;
11. authorization not required;
12. unknown due to conflicting overlap;
13. approved plus AUTH_EXPIRES_SOON;
14. multiple risk flags without duplicate codes;
15. superseded facts excluded from active inputs;
16. deterministic output for same inputs;
17. event correction requires superseded event and reason code;
18. original event shape cannot mutate historical event semantics;
19. metric definition rate requires a denominator;
20. no-measurement status is distinct from zero.

Guardrails
----------
- Synthetic data only.
- Do not add real PHI, credentials, external endpoints, or payer criteria.
- Do not create autonomous clinical, admission, discharge, placement, legal, or authorization logic.
- Do not treat the workbook or reporting SQL as the transactional system of record.
- Do not change current pre-admission authorization service behavior.
- Do not add direct browser/event/analytics writes.
- Do not alter unrelated files or reformat the repository broadly.
- Label newly added design/code documentation as Proposed and unverified where appropriate.
- Prefer existing ID, enum, Zod, state-machine, error, test, and export patterns over this package's
  illustrative names.
- If a generated schema cannot be represented safely using current patterns, stop and explain instead
  of inventing a parallel framework.

Verification
------------
Discover exact commands from the live repository, then run focused and full checks appropriate to
the change. Expected categories include:

- focused domain-contract tests;
- root tests;
- lint;
- typecheck;
- app tests/build only if shared contracts affect the app;
- `git diff --check`.

Do not claim success unless the commands actually pass. Report exact command output summaries and
any pre-existing failures separately.

Return
------
Provide:

1. preflight findings and any design-to-repository path/name mapping;
2. files changed;
3. contract/state-machine behavior implemented;
4. tests added;
5. commands run and results;
6. unresolved decisions or deviations;
7. explicit confirmation that no schema/API/UI/deployment changes were made;
8. recommended next slice, but do not implement it.
```

## After S1 approval

The next Codex prompt should implement S2, the additive Prisma/event persistence foundation. It must be generated after inspecting the exact live schema and accepted ADRs rather than copying the proposed Prisma fragment blindly.

## What Codex should verify before editing

- dirty work and current HEAD;
- accepted ADR-0012 and roadmap priority;
- exact package conventions;
- exact current authorization semantics;
- exact IDs/roles/error/state-machine patterns;
- whether event/analytics names already exist;
- whether the proposed decisions are owner-approved.

## Files Codex is expected to touch for S1

Only the live equivalents of:

- domain-contract episode files/tests;
- domain-contract utilization-review files/tests;
- domain-contract analytics event/metric files/tests;
- package barrel exports;
- accepted design/ADR documentation if required.

No Prisma, API, UI, worker, or deployment files in S1.

## Checks Codex should run after approval

- focused new contract/state-machine tests;
- complete root test suite;
- lint;
- typecheck;
- app tests/build if shared exports affect it;
- `git diff --check`;
- inspect diff for unrelated formatting or accidental PHI.
