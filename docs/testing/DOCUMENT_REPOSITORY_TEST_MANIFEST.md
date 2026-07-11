# Document Repository Test Manifest

**Date:** 2026-07-11. Every test below ran against local PostgreSQL `clarity_dev` in this session (root suite total 130/130). All fixtures are synthetic; cleanup verified to leave zero rows and no stored files.

## tests/integration/document-command-service.test.ts — baseline (14 tests)

| Area | Test |
|---|---|
| Upload | creates PENDING doc, version 1, correct sha256, one `DOCUMENT_UPLOADED` event |
| Ownership | nonexistent and foreign-tenant case both rejected, nothing written |
| Dedupe | identical bytes reuse the row (incl. different filename), attempt still audited; distinct bytes → distinct docs |
| Permissions | auditor + platform admin cannot upload; auditor cannot classify; platform admin cannot access |
| Classification | valid transition audited with from/to; invalid rejected row-unchanged; REJECTED rationale-required + terminal; stale expected status fails safely; missing document non-revealing |
| Access | original bytes returned + `DOCUMENT_ACCESSED` audited (incl. read-only auditor); tenant B blocked |

## tests/integration/document-hardening.test.ts — hardening (18 tests)

| Area | Test |
|---|---|
| Filesystem adapter | round-trip through disk with opaque `caseId/sha256` key + measured `fileSizeBytes`; traversal-shaped/malformed keys rejected (`../`, absolute, wrong arity, non-hex); delete idempotent, exists accurate |
| Validation | empty file; oversized (configurable cap); disallowed MIME; extension/MIME mismatch; unsafe filenames (traversal, separator, null byte) — each rejected with **zero** rows and zero `DOCUMENT_*` audit events; error carries machine-readable code |
| Versioning | new version preserves prior row + bytes, increments to 2, keeps per-version checksums, audited with previous id/version + mandatory reason; identical-bytes version rejected; missing reason (schema) and auditor role (policy) rejected; tenant B cannot version tenant A's document |
| Compensation | storage failure → no metadata, no success audit; metadata/audit failure → object deleted + `DOCUMENT_UPLOAD_FAILED` + `DOCUMENT_STORAGE_CLEANUP_COMPLETED`; failed duplicate retry cannot delete the original's shared object (bytes still readable); failed cross-tenant attempt cleans nothing of the victim's and attaches no audit rows to the foreign case |
| Audit safety | metadata contains sanitized filename (raw identifier-bearing name absent), `accessMode` recorded, no file bytes anywhere in metadata |

## Related case-foundation hardening tests (same session)

- `tests/integration/case-assignment-atomicity.test.ts` (6): atomic assignee validation incl. INACTIVE/LOCKED rejection and the deterministic mid-transaction membership-change interleave.
- `tests/integration/case-command-service.test.ts` (+1): failed reopen writes no mutation/audit/idempotency record; `SYSTEM_ADMIN` cannot reopen.

## Not covered (honest gaps)

- Concurrency on classification is exercised via a stale client-supplied expectation, not a live two-transaction race (same approach as the case suite's `expectedVersion`).
- No load/soak testing; no fuzzing of the validation policy; no magic-number content verification.
- Compensation-failure path (cleanup itself throwing) is implemented (`cause` attachment) but not integration-tested — it would require a storage adapter that fails only on delete; noted for a future pass.
