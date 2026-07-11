# ADR-0007 — Document Storage Abstraction, Versioning, and Failure Compensation

- **Status:** Accepted
- **Date:** 2026-07-11
- **Related:** ADR-0004 (document command service — baseline), ADR-0003, `docs/implementation/DOCUMENT_REPOSITORY_IMPLEMENTATION.md`, `docs/security/DOCUMENT_SECURITY_BOUNDARIES.md`
- **Numbering note:** the hardening brief referenced "ADR-0006" for this record; numbering shifted (0004 document service, 0005 assignee validation, 0006 linting).

## Context

ADR-0004 delivered document metadata persistence, SHA-256 dedupe, manual classification, and access auditing, with an in-memory storage placeholder. This ADR covers the hardening pass: a real (local) storage adapter behind the port, file validation, version families, and explicit handling of the fact that PostgreSQL and object storage cannot commit atomically together.

## Decisions

### 1. Storage port and adapters

`DocumentStorage` (domain-contracts) is the provider-neutral port: `put / get / delete / exists`. Two adapters exist in `document-service`:
- `InMemoryDocumentStorage` — tests and default wiring.
- `LocalFilesystemObjectStorage` — **development only**; root defaults to `.local-object-storage/` (git-ignored). Not a production store: no durability, encryption-at-rest, or access-control claims.

Keys are adapter-generated and opaque: `${caseId}/${sha256}` — both segments validated against strict allowlists (`[A-Za-z0-9_-]{1,128}` and 64 hex chars); every filesystem path is resolved and verified to stay under the root. **No caller-supplied filename or path ever forms a key**, so path traversal is rejected at the port boundary, not by convention. `delete` is idempotent. No public URLs exist; bytes are only reachable through the command service's authorization. Streaming (vs. whole-buffer `Uint8Array`) is deferred — acceptable at the 10 MiB default cap; noted as future work for larger limits.

### 2. Content-addressing is the dedupe and retry mechanism

Storage keys are derived from the bytes, so re-storing identical content is an idempotent overwrite, and the database-side `{caseId, organizationId, sha256}` check remains the source of truth for "this file already exists on this case" (returns the existing row, `duplicate: true`, still audited). Checksum equality is treated as *storage identity only* — never as proof two clinical documents are operationally interchangeable; the duplicate result deliberately surfaces the original document for a human to judge. Cross-case/cross-tenant identical bytes are never merged (keys embed the case id).

### 3. Version families (schema change, justified)

Migration `20260711141534_document_file_size_and_version_family` adds to `SourceDocument`:
- `fileSizeBytes Int` — required metadata the schema lacked; always measured from the stored bytes, never caller-reported.
- `documentFamilyId String` (indexed) — the first version's id, shared by all versions of the logical document. The current version is the family's max `version`; no "isCurrent" column to keep in sync.

The table was verified empty before applying (the non-null-without-default warning in the generated SQL is therefore moot). A corrected document is a **new row** (version = family max + 1, fresh checksum, status PENDING, mandatory reason, audited `DOCUMENT_VERSION_CREATED` with previous id/version in metadata); prior rows and bytes are never modified. Identical-bytes "new versions" are rejected (`DuplicateDocumentContentError`). No version chain exists in application memory — it is all persisted.

### 4. Validation before storage

`DocumentValidationPolicy` (configurable) runs before any byte is stored: empty file, size cap (default 10 MiB), MIME allowlist (prototype: pdf/png/jpeg/txt), extension↔MIME match, unsafe filenames (path separators, `..`, control characters — ordinary spaces allowed). A validation rejection touches neither storage nor the database. This is **not** malware scanning — that remains an open requirement (see security boundaries doc); no `PENDING_SECURITY_SCAN` status was added because the schema's classification enum has no such value and inventing one is an OD-8-style vocabulary decision.

### 5. Compensation instead of pretended atomicity

PostgreSQL and the object store cannot commit together, and no code claims they do. Order and failure paths:

1. Validate → `storage.put` → **one metadata transaction** (ownership check, dedupe/state machine, row write, audit event).
2. **Storage fails** → no metadata, no success audit, storage error surfaces.
3. **Transaction fails** → compensating cleanup: the object is deleted **only if no committed row references its key** (checked via a deliberately tenant-*unscoped* count: a failed cross-tenant attempt must never delete an object the victim tenant's row references, and a failed duplicate retry must not delete the original's shared object). Then two append-only audit rows are written outside the rolled-back transaction: `DOCUMENT_UPLOAD_FAILED` (failure *classification* only — error name, never message contents) and, when an object was removed, `DOCUMENT_STORAGE_CLEANUP_COMPLETED`. These are skipped when the failure was case-scoping itself (`CaseNotFoundError`) — there is no tenant-owned case to attach them to, and attaching to the foreign case would violate both FK semantics and tenant isolation.
4. **Compensation itself fails** → best-effort: the original error is rethrown with the cleanup error attached as `cause`; an orphaned object (bytes with no row) is the accepted residual, harmless because keys are content-addressed and unreferenced.

### 6. Audit vocabulary mapping

Canonical actions: `DOCUMENT_UPLOADED`, `DOCUMENT_CLASSIFIED`, `DOCUMENT_REJECTED` (classification → REJECTED), `DOCUMENT_ACCESSED` (with `metadata.accessMode: VIEW | DOWNLOAD` mapping the VIEWED/DOWNLOADED vocabulary), `DOCUMENT_VERSION_CREATED`, `DOCUMENT_UPLOAD_FAILED`, `DOCUMENT_STORAGE_CLEANUP_COMPLETED`. `DOCUMENT_UPLOAD_STARTED` is deliberately not emitted: a per-attempt "started" row doubles successful-upload audit volume without adding information the correlation id doesn't provide; failure visibility comes from `DOCUMENT_UPLOAD_FAILED`.

**Filenames are sanitized before entering audit metadata** (`sanitizeFilenameForAudit`): filenames are caller-supplied and may embed identifiers, so audit rows carry only a bounded `[A-Za-z0-9_-]` stem plus extension. Raw filenames live only in the `SourceDocument` row itself. Audit metadata never contains file bytes, extracted text, or restricted insurance identifiers (the pre-existing structural guard also runs on every write).

## Consequences

- A future S3/GCS adapter implements four methods and inherits every behavior above unchanged.
- Orphaned objects are possible only in the compensation-failed path; a periodic sweep (list keys, delete unreferenced) is trivial future work.
- The `DocumentQueryService` suggested by the brief was not built: `listDocumentsForCase` on the gateway is the only read beyond access, and a separate query layer would duplicate architecture ahead of the API phase (OD-5).
