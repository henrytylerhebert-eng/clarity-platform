---
status: Complete for feat/tenant-scoped-case-repository
owner: TBD
version: 1.0.0
last_integrated: 2026-07-11
source_artifacts:
  - tests/ (39 baseline tests, all still present and passing)
  - tests/integration/ (30 database-backed tests, clarity_dev)
unresolved_conflicts: none
related_requirements: REQ-001…REQ-003
related_adrs: ADR-0001, ADR-0002
---

# Case Repository Test Manifest

**Porting policy:** baseline tests whose behavior has a persistence surface in the `CaseRepository` contract were given database-backed ports in `tests/integration/`. The originals were **retained** as pure contract tests — they still guard the pure functions the repository revalidates, and deleting them would reduce coverage. Baseline tests for domains the contract does not persist (benefits schema, authorization/eligibility transition tables, payer memory, readiness, feature flags) are retained unchanged: the issue explicitly forbids adding benefits/payer/authorization persistence here.

## Counts (from the verified run, 2026-07-11)

| Metric | Count |
|---|---|
| Baseline tests discovered | **39** |
| Baseline tests ported to DB-backed equivalents | **21** |
| Baseline tests retained as pure contract tests (no persistence surface) | **18** |
| Baseline tests passing | **39/39** |
| Additional DB tests beyond the ports | **9** |
| Database-backed integration tests (total) | **30/30 passing** |
| Full root suite | **69 run, 69 passed, 0 failed, 0 skipped** |
| App workspace suite (unchanged by this issue) | 37/37 unit, typecheck + build pass |

## Baseline-to-port mapping

Abbreviations: CR = `tests/integration/case-repository.test.ts`, TI = `tenant-isolation.test.ts`, AP = `audit-persistence.test.ts`, SS = `synthetic-seed.test.ts`.

| # | Baseline test (original file) | Behavior | Disposition | DB port |
|---|---|---|---|---|
| 1 | creates a tenant-scoped case in DRAFT… (workflow/case-lifecycle) | Case creation, initial workstreams | Ported (original retained) | CR: creates…and reads it back |
| 2 | allows the forward path | Valid status transitions | Ported | CR: persists the forward path |
| 3 | rejects invalid jumps and mutations of terminal cases | Invalid transitions | Ported (split: invalid-jump + terminal) | CR: rejects invalid jumps…; rejects mutations of terminal cases |
| 4 | allows cancellation…information-incomplete detours | Exception paths | Ported | CR: allows cancellation…detours |
| 5 | updates one workstream without touching siblings | Workstream independence | Ported | CR: updates one workstream… |
| 6 | supports simultaneously divergent workstreams | Parallel statuses | Ported | CR: …persisted on one row |
| 7 | rejects invalid workstream transitions | Workstream guard | Ported | CR: rejects invalid workstream transitions… |
| 8 | proceeds with emergency clinical review while blocked | Emergency/fairness rule | Ported | CR: emergency clinical review proceeds… |
| 9 | appends sequenced, frozen events (unit/audit) | Audit ordering | **Adapted**: DB has no in-memory sequence; ordering proven via timestamp/id over three mutations with a deterministic clock | AP: every mutation writes an ordered audit event… |
| 10 | exposes only snapshots… | Append-only | **Adapted**: immutability proven by re-reading the first row after later mutations | AP: earlier audit events are unchanged… |
| 11–14 | rejects payload containing memberId / medicareNumber / policyNumber / ssn (security) | Restricted-identifier guard | Ported (guard now runs inside the DB transaction; rejection also proves rollback) | AP: it.each rejects mutation metadata containing %s |
| 15 | rejects restricted identifiers nested at depth | Deep guard | Ported | AP: rejects…nested at depth |
| 16 | accepts payloads without raw identifiers | Guard specificity | Ported | AP: accepts safe metadata… |
| 17 | scoped listing never returns another org's records (security/org-isolation) | List isolation | Ported | TI: list operations never return… |
| 18 | direct cross-org access throws instead of returning data | Cross-tenant denial | **Adapted**: repository semantics are a non-revealing miss (undefined / uniform CaseNotFoundError) per the issue's rule 7, instead of the pure helper's "access denied" throw. The pure helper test is retained unchanged. | TI: cannot read B's case; cannot transition or update B's case; miss is indistinguishable |
| 19 | same-organization access passes | Same-tenant access | Ported | TI: tenant A can create and read its own case |
| 20–26 | benefits suite: extraction review gate, subscriber relationship, eligibility transitions ×2, disclaimer ×2, quote schema (workflow/benefits, 7 tests) | Benefits contracts | **Retained unchanged** — no benefits persistence in the CaseRepository contract; adding it is explicitly out of scope | — |
| 27–30 | authorization transitions ×3 + human-submitter gate (workflow/authorization) | Authorization contracts | **Retained unchanged** — same reason | — |
| 31–33 | payer memory ×3 (unit/payer-memory) | Provenance labeling | **Retained unchanged** — same reason | — |
| 34–36 | readiness ×3 (unit/readiness) | No combined score | **Retained unchanged** — same reason | — |
| 37 | loads and validates every fixture as synthetic (data/synthetic-cases) | Seed loading | Ported: fixtures now persist through the repository and are read back | SS: persists every validated fixture… |
| 38 | fixtures contain no realistic identifiers | Data hygiene | Ported: check now runs over persisted rows + audit trail | SS: persisted rows and their audit trail… |
| 39 | ships all six payer-stack flags dark | Feature flags | **Retained unchanged** — no persistence surface | — |

## Additional tests (not ports — new coverage required by the issue)

| Requirement | Test |
|---|---|
| Audit failure rolls back case creation | AP: a failing audit write rolls back case creation entirely (injected failing writer) |
| Audit failure rolls back a transition | AP: a failing audit write rolls back a status transition |
| Audit event carries correct tenant/case ids, actor, action, reason, metadata | AP: every mutation writes an ordered audit event… (assertions) |
| Audit queries tenant-scoped | TI: audit events remain tenant-scoped |
| Cross-tenant update denied, target row untouched | TI: cannot transition or update tenant B's case |
| Cross-tenant miss reveals nothing | TI: a cross-tenant miss is indistinguishable from a nonexistent case |
| Cleanup does not touch other tenants | TI: cleanup of one tenant's records… (third tenant created and removed) |
| Mapping preserves enums, nulls, dates | CR: preserves enums, null closedAt, and Date instances |
| Duplicate/invalid writes follow contract error behavior | CR: rejects a duplicate case key without confirming where it is in use; unknown status/workstream guards in implementation |

## How the suite runs

`npx vitest run` from the repo root runs everything (69 tests). Integration files self-guard: they refuse to run unless `DATABASE_URL` points at local `clarity_dev` **and** the foundation migration is applied. Each file creates UUID-namespaced tenants and deletes only its own records on teardown; a post-run check confirmed zero synthetic rows remained.
