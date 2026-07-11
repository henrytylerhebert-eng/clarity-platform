# ADR-0004 — Document Command Service

- **Status:** Accepted
- **Date:** 2026-07-11
- **Owner:** _placeholder — tech lead_
- **Related:** ADR-0002 (canonical schema — `SourceDocument` already modeled), ADR-0003 (case command service — this decision extends the same pattern), `docs/implementation/DOCUMENT_SERVICE.md`

## Context

The canonical schema already had a `SourceDocument` model (case-scoped, with `storageKey`, `sha256`, `classificationStatus`), but nothing persisted, deduplicated, classified, or audited a document. Per the agreed build sequence (repository → command service → **documents** → evidence → insurance/benefits), documents are the next vertical slice, following the same controlled-path discipline ADR-0003 established for cases.

## Decision

1. **One controlled path, mirrored from ADR-0003.** All document actions flow through `@clarity/document-service` (`DocumentCommandService`): Zod envelope validation → role permission policy → rationale rule (for REJECTED classification) → a single `PrismaDocumentGateway` transaction (case-ownership check → business rule → conditional write → atomic audit event).
2. **No schema change.** `SourceDocument` already had every column this issue needs (`storageKey`, `sha256`, `classificationStatus`, `version`, `caseId`, `organizationId`). No migration.
3. **One approved Prisma adapter, extended, not duplicated.** `PrismaDocumentGateway` lives in `packages/case-repository` alongside `PrismaCaseCommandGateway` — that package remains the *only* one permitted to import `@prisma/client` (ADR-0003 decision #2). `document-service` depends on it exactly as `case-service` does.
4. **Three commands:** `UploadDocument`, `ClassifyDocument`, `AccessDocument`. `AccessDocument` is not a state mutation — it exists to produce a mandatory `DOCUMENT_ACCESSED` audit trail for PHI reads, so it goes through the same gateway/audit path as the mutating commands rather than being a bare repository read.
5. **SHA-256 content-addressed storage is the dedupe mechanism, not idempotency keys.** `DocumentStorage.put` (packages/document-service `InMemoryDocumentStorage`, a synthetic placeholder for a future S3/Blob adapter — `docs/01-project-architecture.md` already flags object storage as future work) keys blobs by `${caseId}/${sha256}`, so re-uploading identical bytes is a harmless idempotent overwrite. The gateway separately checks the database for an existing `{caseId, sha256}` row before creating one: a duplicate upload attempt returns the existing document (`duplicate: true`) and is still audited, but creates no second row. This is a different, purpose-built retry-safety net from the `CommandIdempotencyRecord` mechanism ADR-0003 introduced for case commands — a client-generated idempotency key protects against *retry of the same intent*; a content hash protects against *the same file arriving twice*, which is the actual risk for document intake. No `CommandIdempotencyRecord` usage was added for documents; this is a deliberate scope decision, not an oversight.
6. **Classification is a small, explicit state machine** (`domain-contracts/src/documents.ts`, `canTransitionDocumentClassification`), mirroring the existing workstream-status pattern: `PENDING → {CLASSIFIED, NEEDS_REVIEW, REJECTED}`, `NEEDS_REVIEW → {CLASSIFIED, REJECTED}`, `CLASSIFIED → {NEEDS_REVIEW}` (reopen for correction), `REJECTED → {}` (terminal — a rejected document is superseded by a fresh upload, not reclassified). `REJECTED` requires a rationale, mirroring the exit-state rationale rule for cases.
7. **Optimistic concurrency without a version column.** `classifyDocument` uses the freshly-read `classificationStatus` itself as the `updateMany` predicate (the same technique `PrismaCaseRepository.updateWorkstream` already uses), plus an optional client-supplied `expectedClassificationStatus` for the same "declare what you expect, fail safely if stale" ergonomics case commands offer via `expectedVersion`. No new column was added to `SourceDocument`; its existing `version` field means something different (document revision, unused by this issue) and was not repurposed.
8. **Case-ownership check on every command.** Every gateway method reads `{ id: caseId, organizationId }` on `BehavioralHealthCase` before touching a document, and every `SourceDocument` query/write is additionally scoped by its own `organizationId` column — the same non-revealing `CaseNotFoundError` used by case commands surfaces on a missing or foreign-tenant case.
9. **Role policy (`document-service/src/permissions.ts`):** `UploadDocument`/`ClassifyDocument` exclude `READ_ONLY_AUDITOR`, `COMPLIANCE_REVIEWER`, and `SYSTEM_ADMIN` (inspection and platform-admin roles do not create or judge case content). `AccessDocument` is deliberately broader — it includes `READ_ONLY_AUDITOR` and `COMPLIANCE_REVIEWER` (oversight requires being able to read what it audits) but still excludes `SYSTEM_ADMIN`.
10. **Audit vocabulary:** `DOCUMENT_UPLOADED`, `DOCUMENT_CLASSIFIED`, `DOCUMENT_ACCESSED` (REQ-005/REQ-006 — the referenced REQ matrix is still missing per OD-1; these names follow the same convention as the case command service's audit vocabulary).
11. **Contract move (small, backward-compatible refactor):** `CommandActorSchema`/`CommandActor` and the generic `PermissionDeniedError`/`RationaleRequiredError` moved from `@clarity/case-service` into `@clarity/domain-contracts` (`actor.ts`, `commandErrors.ts`) — they are cross-cutting command-service vocabulary, not case-specific, and `document-service` needed them without taking a dependency on `case-service`. `case-service`'s `commands.ts`/`errors.ts` re-export the same symbols, so no existing import breaks (verified: full 105-test suite and the app's 37-test suite both pass unchanged).

## Consequences

- Future document-upload UI/API call `DocumentCommandService` only, exactly as case mutations call `CaseCommandService`.
- A resubmitted file (same bytes, different filename) never creates a duplicate row; the audit trail still shows the resubmission attempt.
- `document-service` has no dependency on `case-service` — the two vertical slices only share `domain-contracts` and `case-repository`, keeping the layering that ADR-0003 established intact as the codebase grows.
- No OCR or AI extraction exists; `EvidenceItem` linkage (documents → extracted evidence) is explicitly out of scope and remains "documented only" per `IMPLEMENTATION_STATUS.md`.

## Known limitations

1. Actor roles remain caller-supplied; no authentication layer exists (same assumption as ADR-0003).
2. `InMemoryDocumentStorage` is process-local and non-persistent — a real object-storage adapter (S3/Blob) is future work; the `DocumentStorage` interface is the seam for it.
3. `classifyDocument`'s optimistic-concurrency check is exercised via a client-supplied stale `expectedClassificationStatus` (deterministic test), not a genuine two-transaction race — the same testing approach the case-command-service suite already uses for `expectedVersion`.
4. `SourceDocument.version` (document revision) is untouched by this issue; every upload creates version 1. Document supersession/revisioning is not implemented.
