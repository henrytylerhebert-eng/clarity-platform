# Document Security Boundaries

**Date:** 2026-07-11. What the document subsystem does and does not protect. Companion to ADR-0007 and SECURITY.md. Nothing here is a production-privacy or compliance claim.

## Enforced boundaries (each backed by a test in `tests/integration/document-hardening.test.ts` or `document-command-service.test.ts`)

1. **Tenant scoping on every metadata operation.** Every gateway query/write carries `organizationId`; every command first verifies the case belongs to the caller's tenant (`{ id: caseId, organizationId }`). A document id is never authorization by itself; a guessed id from another tenant yields the same non-revealing error as a missing one.
2. **Storage keys are not capabilities, but they are also not reachable.** Bytes are only obtainable through `AccessDocument`, which runs the permission policy and the tenant-scoped ownership check and writes a `DOCUMENT_ACCESSED` audit row before any byte is returned. Nothing exposes a "fetch by storage key" path to callers; the adapter's `get` is package-internal. (A caller with direct filesystem access is outside this trust boundary — the local adapter is development-only.)
3. **Path traversal cannot reach the filesystem.** Keys are adapter-generated (`caseId/sha256`), both segments allowlist-validated, and every resolved path is verified to remain under the storage root. User filenames never touch paths.
4. **Filenames never control storage, and never enter audit metadata raw.** Validation rejects separators/`..`/control characters outright; audit rows get a sanitized, bounded rendering (`sanitizeFilenameForAudit`) because user filenames may embed identifiers.
5. **Audit metadata carries no content.** No file bytes, no extracted text, and the pre-existing restricted-identifier guard (member IDs, policy numbers, Medicare IDs, credentials) aborts any audit write that would include them — inside the same transaction as the mutation it describes.
6. **Failure paths cannot cross tenants.** Compensating cleanup only deletes a stored object when *no committed row anywhere* references it, so a failed cross-tenant upload cannot destroy the victim's bytes, and failure-audit rows are never attached to a case the caller does not own.
7. **Roles gate every command.** Upload/classify/version exclude `READ_ONLY_AUDITOR`, `COMPLIANCE_REVIEWER`, and `SYSTEM_ADMIN`; access includes the two oversight roles but still excludes `SYSTEM_ADMIN`. Rejection (terminal) requires a recorded rationale.

## Explicit non-protections (open, by design or by phase)

- **Authentication does not exist.** Actor identity and roles are trusted caller input through the command envelope; the service is an authorization point only. Any real deployment requires an upstream identity layer first.
- **Malware scanning is not implemented.** No scanner is installed or invoked; uploaded bytes are never executed or parsed, but they are stored as-is. Open requirement — do not represent uploads as scanned.
- **Local storage is development-only.** No encryption at rest, durability, or backup properties; `.local-object-storage/` must never hold non-synthetic content and is git-ignored.
- **Content sniffing is not performed.** Validation checks declared MIME type against extension and an allowlist; it does not verify bytes match the declared type (magic-number checking is future work).
- **No database-level enforcement (RLS)** — tenant isolation is application-layer, per OD-6.
- **Orphaned objects** can persist if compensation itself fails (surfaced via the rethrown error's `cause`); they are unreferenced, content-addressed synthetic bytes, removable by a future sweep.
- **Idempotency-key replay** exists for case commands only; document upload retry-safety is content-hash-based (identical bytes → duplicate detection, not a second row).
