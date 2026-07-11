---
status: Superseded by DOCUMENT_REPOSITORY_IMPLEMENTATION.md (2026-07-11 hardening pass — filesystem storage, validation, versioning, compensation)
owner: TBD
version: 1.0.0
last_integrated: 2026-07-11
source_artifacts:
  - packages/document-service/ (implementation)
  - packages/case-repository/src/documentGateway.ts (approved Prisma adapter)
  - packages/domain-contracts/src/documents.ts (contracts)
unresolved_conflicts: "REQ-005/REQ-006 vocabulary is inferred (source REQ matrix missing, OD-1); actor roles trusted from caller until auth exists"
related_requirements: REQ-005, REQ-006
related_adrs: ADR-0004 (decision record), ADR-0002, ADR-0003
---

# Document Service

The application boundary for every document action (upload, classify, access). Architecture and decisions: **ADR-0004**. This document covers usage and test coverage.

## Command flow

```text
caller → DocumentCommandService.<command>(envelope)
  1. Zod strict parse
  2. assertDocumentPermitted                      (PermissionDeniedError)
  3. rationale rule (Classify → REJECTED)          (RationaleRequiredError)
  4. [UploadDocument only] storage.put(content)    — content-addressed, before the transaction
  5. PrismaDocumentGateway — ONE transaction:
       case-ownership check { id: caseId, organizationId }   (CaseNotFoundError)
       UploadDocument:   sha256 dedupe check → create-or-reuse → audit
       ClassifyDocument: scoped read → expectedClassificationStatus check
                          (DocumentConcurrencyConflictError) → state-machine
                          check → conditional write → audit
       AccessDocument:   scoped read (DocumentNotFoundError) → audit
```

## Envelope fields

Every command: `organizationId`, `actor { actorId, actorType?, roles? }`, `correlationId?`, `reason?`, `caseId`. `UploadDocument` adds `documentType`, `filename`, `mimeType`, `content` (`Uint8Array`), and optional `sourceOrganization`/`authorName`/`serviceDate`. `ClassifyDocument`/`AccessDocument` add `documentId`; `ClassifyDocument` adds `to` and optional `expectedClassificationStatus`.

No idempotency-key field exists on these commands — SHA-256 content dedupe is `UploadDocument`'s retry-safety net; `Classify`/`Access` act on an existing document id, so a retry is naturally a no-op or repeat read. See ADR-0004 decision 5.

## Verified behavior (14 integration tests against clarity_dev)

| Area | Test |
|---|---|
| Upload creates PENDING doc, version 1, correct sha256, one `DOCUMENT_UPLOADED` audit | "creates a PENDING document at version 1 and records DOCUMENT_UPLOADED" |
| Case-ownership check: missing case and cross-tenant case both fail, nothing written | "case-ownership check: uploading against a nonexistent or foreign case fails without writing" |
| SHA-256 duplicate detection: identical bytes reuse the row, no second insert, upload still audited | "detects a duplicate by SHA-256…" |
| Different bytes for the same case produce two distinct documents | "different content for the same case produces a second distinct document" |
| Permission enforcement: auditor and platform admin cannot upload | "read-only auditors and platform admins cannot upload" |
| Valid classification transition succeeds and is audited with from/to | "valid transitions succeed and record DOCUMENT_CLASSIFIED" |
| Invalid transition rejected, row unchanged | "invalid transitions are rejected and change nothing" |
| REJECTED requires rationale and is terminal | "REJECTED requires rationale and is terminal" |
| Stale `expectedClassificationStatus` fails safely; first writer wins | "a stale expectedClassificationStatus fails safely…" |
| Permission enforcement: auditor cannot classify | "read-only auditors cannot classify" |
| Classifying a nonexistent document fails non-revealingly | "classifying a document that does not exist for the case fails…" |
| Access returns original bytes and audits `DOCUMENT_ACCESSED`, even for a read-only auditor | "returns the original bytes and records DOCUMENT_ACCESSED…" |
| Permission enforcement: platform admin cannot access content | "platform admins cannot access document content" |
| Tenant isolation on access | "tenant B cannot access tenant A's document" |

Suite totals this run: **14 new integration tests** (1 file); full root suite **105/105** (up from 91/91 pre-existing); app suite untouched (**37/37** + typecheck). Cleanup leaves zero synthetic rows (`sourceDocument` count and document-audit-action count both 0 after the run).

## Known limitations

1. Actor roles are trusted from the caller — no authentication layer exists yet (same assumption as the case command service).
2. `InMemoryDocumentStorage` (packages/document-service/src/storage.ts) is process-local and non-persistent — the seam for a real object-storage adapter, not a production store.
3. No OCR, AI extraction, or `EvidenceItem` linkage — explicitly out of scope for this issue.
4. `SourceDocument.version` (document revision) is untouched; every upload is version 1.
5. `classifyDocument`'s concurrency guard is exercised via a client-supplied stale value in tests, not a genuine two-transaction race (same testing approach used for case commands' `expectedVersion`).
