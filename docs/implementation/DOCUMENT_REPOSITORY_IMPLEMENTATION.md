---
status: Implemented and verified against clarity_dev
owner: TBD
version: 1.1.0
last_integrated: 2026-07-11
source_artifacts:
  - packages/document-service/ (command service, storage adapters, validation policy)
  - packages/case-repository/src/documentGateway.ts (approved Prisma adapter)
  - packages/domain-contracts/src/documents.ts (contracts, filename sanitizer)
  - prisma/migrations/20260711141534_document_file_size_and_version_family
unresolved_conflicts: "REQ-005/REQ-006 vocabulary inferred (source REQ matrix missing, OD-1); actor roles trusted from caller until auth exists"
related_requirements: REQ-005, REQ-006
related_adrs: ADR-0007 (storage/versioning/compensation), ADR-0004 (baseline service), ADR-0003
supersedes: docs/implementation/DOCUMENT_SERVICE.md (v1.0.0 — baseline before the hardening pass)
---

# Document Repository Implementation

The tenant-scoped document capability: metadata persistence, synthetic file storage behind a provider-neutral port, SHA-256 dedupe, version families, manual classification, access auditing, and storage/database failure compensation. Decisions: **ADR-0007** (and ADR-0004 for the baseline). Security posture: `docs/security/DOCUMENT_SECURITY_BOUNDARIES.md`. Test coverage: `docs/testing/DOCUMENT_REPOSITORY_TEST_MANIFEST.md`.

## Architecture

```text
DocumentCommandService            (packages/document-service — never imports Prisma)
  ├── DocumentValidationPolicy    (size/MIME/extension/filename, before any I/O)
  ├── DocumentStorage port        (domain-contracts)
  │     ├── InMemoryDocumentStorage          (tests/default)
  │     └── LocalFilesystemObjectStorage     (dev-only; .local-object-storage/, git-ignored)
  └── PrismaDocumentGateway       (packages/case-repository — the ONE Prisma package)
        metadata rows + atomic audit events, all tenant-scoped
```

## Commands

| Command | Behavior | Audit action |
|---|---|---|
| `UploadDocument` | validate → store bytes (content-addressed key `caseId/sha256`) → tx: ownership check, `{caseId, org, sha256}` dedupe (duplicate ⇒ existing row returned + audited, no insert), row insert (version 1, family = own id, `fileSizeBytes` measured), audit | `DOCUMENT_UPLOADED` |
| `CreateDocumentVersion` | same shape; prior version untouched; version = family max + 1; identical bytes rejected (`DuplicateDocumentContentError`); mandatory reason | `DOCUMENT_VERSION_CREATED` |
| `ClassifyDocument` | state machine `PENDING → {CLASSIFIED, NEEDS_REVIEW, REJECTED}`, `NEEDS_REVIEW → {CLASSIFIED, REJECTED}`, `CLASSIFIED → {NEEDS_REVIEW}`, `REJECTED` terminal + rationale-required; optional `expectedClassificationStatus` fails stale writers | `DOCUMENT_CLASSIFIED` / `DOCUMENT_REJECTED` |
| `AccessDocument` | ownership + permission check, audit **before** bytes are returned; `accessMode: VIEW\|DOWNLOAD` recorded in metadata | `DOCUMENT_ACCESSED` |

Failure-path actions (written outside the rolled-back transaction, never for case-scoping failures): `DOCUMENT_UPLOAD_FAILED`, `DOCUMENT_STORAGE_CLEANUP_COMPLETED`. `DOCUMENT_UPLOAD_STARTED` deliberately not emitted (ADR-0007 §6).

## Compensation model (no pretended atomicity)

Bytes first, then the metadata transaction. Transaction failure ⇒ delete the object **only when zero committed rows reference its key** (tenant-unscoped reference count — protects the victim of a failed cross-tenant attempt and the original of a failed duplicate retry), then audit failure + cleanup. Compensation failure ⇒ original error rethrown with cleanup error as `cause`; orphaned unreferenced bytes are the accepted residual.

## Validation defaults (configurable per service instance)

10 MiB cap; MIME allowlist `application/pdf`, `image/png`, `image/jpeg`, `text/plain` with matching extensions; empty files, extension/MIME mismatches, and unsafe filenames (separators, `..`, control characters) rejected before any I/O. Not malware scanning (open requirement).

## Roles

- Upload / Version: intake, org admin, clinical, physician, legal, benefits, authorization, facility, transport.
- Classify: intake, org admin, clinical, physician.
- Access: all operational roles + `COMPLIANCE_REVIEWER` + `READ_ONLY_AUDITOR` (oversight must read what it audits).
- `SYSTEM_ADMIN`: no document rights of any kind (platform ≠ clinical operations, per ADR-0003).

## Verified (this session, against local clarity_dev)

- 14 baseline document tests + 18 hardening tests (storage adapter round-trip and traversal rejection, all validation classes, versioning incl. duplicate-content and cross-tenant rejection, storage-failure and metadata-failure compensation, shared-object protection, cross-tenant cleanup safety, audit filename sanitization + access modes).
- Full root suite **130/130**; app suite **37/37**; `lint`, `typecheck`, `prisma validate` all clean; zero synthetic DB residue and storage directory removed after the run.

## Known limitations

1. No authentication; roles are trusted envelope input.
2. Local filesystem adapter is development-only (no durability/encryption/backup claims); real object storage is future work behind the same port.
3. No malware scanning, no content sniffing (declared MIME is checked against extension/allowlist only), no OCR, no AI classification, no text extraction.
4. Bytes are handled as whole `Uint8Array` buffers, not streams — fine at the 10 MiB cap, revisit for larger limits.
5. Orphaned storage objects possible if compensation itself fails; sweep is future work.
6. No `DocumentQueryService` — reads beyond access/list are deferred to the API phase (OD-5).
