# Evidence Test Manifest

**Date:** 2026-07-11. Every test ran against local PostgreSQL `clarity_dev` this session (root total 149/149). Synthetic fixtures only; cleanup verified to leave zero rows in every table including `EvidenceItem` and `ContradictionGroup`.

## tests/integration/evidence-command-service.test.ts (7 tests)

| Area | Proves |
|---|---|
| Creation | CANDIDATE at version 0 bound to the exact `SourceDocument` row; verbatim `originalText` preserved; `HUMAN_ENTRY` with null confidence; own family root; audited once with `originalTextSha256` and **no source text** in metadata |
| Permissions | `READ_ONLY_AUDITOR` and `SYSTEM_ADMIN` cannot create; nothing written |
| Source policy | REJECTED-classification document refused (`RejectedSourceDocumentError`); a different case's document refused (`DocumentNotFoundError`) |
| Idempotency | same-key create replays: one row, one audit event |
| Tenant isolation | A cannot create on B's case (`CaseNotFoundError`) or attach B's document to A's case; A's approve/reject/supersede against B's evidence are non-revealing `EvidenceNotFoundError` misses; B's row byte-identical after all attempts |

## tests/integration/evidence-review-and-contradictions.test.ts (12 tests)

| Area | Proves |
|---|---|
| Approval | domain reviewer approves; `reviewedBy`/`reviewedAt` stamped; `originalText` untouched; exactly one `EVIDENCE_APPROVED` event |
| Domain scoping | legal/benefits/intake cannot approve clinical evidence; clinical cannot approve INSURANCE; the correct domain role can |
| Rationale rules | reject without reason and clarification without note rejected at the schema; with them, status + note land and are audited |
| Correction | interpretation-only update; `NEEDS_CLARIFICATION` returns to `CANDIDATE`; audit carries changed-field **names** and `fromStatus`; `originalText` byte-identical after normalized-value correction; APPROVED items refuse correction (`EvidenceStateError`) |
| Supersession | approved original frozen (`SUPERSEDED`, `supersededById` link, text intact, terminal); replacement is `CANDIDATE` in the same family; audited; creator role alone cannot supersede |
| Concurrency | stale `expectedVersion` fails with row unchanged; same-version race has exactly one winner (version 1 after both attempts) |
| Idempotency | same-key approval replays with no second audit event or version bump; audit-write failure rolls back mutation AND idempotency record, and the retry re-executes successfully |
| Contradictions | group of same-case items classifies as `TEMPORAL_CHANGE` with **no member status change**; membership grows via the audited add command; double-membership rejected; same-tenant cross-case grouping is a non-revealing miss; cross-tenant grouping fails at the case boundary; no group row leaks |

## Honest gaps

- Contradiction-group concurrency is stale-expectation based, not a live race.
- No remove-from-group command exists yet, so membership-removal auditing is untested (feature deferred).
- `HumanReview` table integration not exercised (evidence review facts live on the row + audit trail for now).
