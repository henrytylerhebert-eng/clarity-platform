# Residue mechanism reproduction — 2026-09-18

**Phase:** Housekeeping Phase 3B, Gate A.5 (owner decision OD-HK3-004)
**Repository:** `origin/main` at `577bcc5`
**Databases used:** disposable ephemeral instances only (`npm run test:ephemeral`). **The persistent `clarity_dev` was not touched.**

## Question

Phase 3A established *what* persisted in `clarity_dev` — whole test tenants with their
organization, user and patient token all intact, and **never a partial-cleanup state** — but
could not establish *why* for the 274-organization cohort created on 2026-09-13. Phase 3A
recorded that cohort as `UNKNOWN` rather than assigning a cause.

This is one bounded attempt to explain it. It does not try to recreate that session; it tests
whether the two candidate mechanisms actually produce the observed signature.

## Setup

A disposable PostgreSQL instance per run, created and destroyed by
`scripts/with-ephemeral-database.ts`, migrated with the canonical current-main chain. Two
throwaway probe scripts drove the real integration harness (`tests/integration/helpers/harness.ts`)
and were deleted afterwards. No production code was altered to force a reproduction.

## H1 — cleanup encounters a relation the database does not have

This is the mechanism **proven** for the 2026-09-08 cohort: the harness deleted `revOps*` and
`iopReconciliation*` rows before those migrations had been applied to `clarity_dev` (ledger
shows them applied 2026-09-12 22:32, after that cohort was created).

Simulated by dropping one table the cleanup targets, then calling `dispose()`.

```
tenants created:                 {"orgs":2,"users":2,"tokens":2}
dropped AssuranceReviewDecision  (first table deleteTenantRecords touches)
dispose() threw:                 true
counts after failed dispose:     leaked orgs = 2
base triple intact:              users = 2, tokens = 2
```

**Result: REPRODUCED.** A throw anywhere in the cleanup sequence leaks the *entire* tenant with
its base triple intact — exactly the signature Phase 3A observed.

## H2 — the process dies before `afterAll` runs

A child process created a tenant pair and was killed with `SIGKILL` before any cleanup.

```
child signal/status:             status=137 (SIGKILL)
orgs after child death:          leaked = 2
base triple intact:              users and tokens present for both
```

**Result: REPRODUCED.** Identical signature.

## Finding

**Both mechanisms produce exactly the same database signature.** The observed state — whole
tenants, base triple intact, no partial cleanup — is therefore **not diagnostic**. It cannot
discriminate between a cleanup that threw and a process that died, and by extension it cannot
identify which of them produced the 2026-09-13 cohort.

This retroactively validates Phase 3A's refusal to assign a cause from the data alone.

## Outcome

`PARTIALLY REPRODUCED`

- The **mechanism class** is reproduced, and it demonstrably produces the observed signature.
- The **specific 2026-09-13 trigger remains UNKNOWN** and, on this evidence, is not recoverable
  from the database state. No root cause is claimed for that cohort.

## Why this does not block the rebuild

The future control does not depend on explaining the past. Phase 3B Gate A makes the failure
mode unreachable rather than merely less likely: the integration harness now refuses any
database not marked `CLARITY_DISPOSABLE_DATABASE=1`, so a cleanup that throws — or a process
that dies — can only ever leak rows into a throwaway database that is destroyed moments later.

Both historical mechanisms remain possible; neither can now reach a persistent database.

## Not claimed

No root cause for the 2026-09-13 cohort. No claim that these are the only two possible
mechanisms. No production readiness, HIPAA, clinical or legal claim. Synthetic data only.
