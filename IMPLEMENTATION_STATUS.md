# Implementation Status

**As of 2026-07-11** (post document-service implementation). A capability appears in exactly one bucket. "Verified" means it ran in this session.

## Completed (verified working)

- **Document command service** (`packages/document-service`, branch `feat/case-command-service`): three explicit commands (UploadDocument, ClassifyDocument, AccessDocument) behind the same controlled-path pattern as the case command service — strict envelopes, role policy, SHA-256 content-addressed dedupe (no schema change; `SourceDocument` already had every needed column), a small classification state machine (PENDING/NEEDS_REVIEW/CLASSIFIED/REJECTED, REJECTED terminal + rationale-required), case-ownership checks, optimistic concurrency, and audit events (`DOCUMENT_UPLOADED`/`DOCUMENT_CLASSIFIED`/`DOCUMENT_ACCESSED`) — all atomic per command via `PrismaDocumentGateway` (added to the one approved Prisma package, `case-repository`). `CommandActor`/`PermissionDeniedError`/`RationaleRequiredError` moved from `case-service` into `domain-contracts` (backward-compatible re-export) so `document-service` shares them without depending on `case-service`. Verified: 14/14 new integration tests, full root suite 105/105, app suite untouched 37/37. Storage is a synthetic in-memory content-addressed placeholder (`InMemoryDocumentStorage`) — no real object-storage integration. No OCR/AI extraction. ADR-0004.
- **Case command service and workflow transition engine** (`packages/case-service`, branch `feat/case-command-service`): nine explicit commands behind one controlled path — strict envelopes, role policy (schema `UserRole` values), rationale rules, terminal-case protection, reopen gated to exactly `ORGANIZATION_ADMIN` with mandatory rationale (`SYSTEM_ADMIN` has no case-command rights), optimistic concurrency (`version` column + predicate), idempotency keys (`CommandIdempotencyRecord`), correlation ids, and audit events with previous/new state hashes — all atomic per command via the single approved Prisma gateway. Verified: 52/52 integration tests incl. all 12 required behaviors, full suite 91/91 (at the time; now 105/105 with document-service added). ADR-0003.
- **Tenant-scoped case repository** (`packages/case-repository`, branch `feat/tenant-scoped-case-repository`): Prisma-backed `CaseRepository` with organization scoping in every query/write predicate, atomic case-mutation + audit-event transactions, append-only audit writes with the restricted-identifier guard, optimistic concurrency on state transitions. Verified against local `clarity_dev`: 30/30 integration tests, 69/69 full root suite, cleanup leaves zero synthetic rows. See `docs/implementation/CASE_REPOSITORY_IMPLEMENTATION.md` and `docs/testing/CASE_REPOSITORY_TEST_MANIFEST.md`. **Audit integration: implemented** for case mutations (no DB-level immutability enforcement yet; no state hashes).

- `app/` crisis-path prototype: guided intake, drafts with prohibited-language guards, hash-chained custody ledger, compliance clocks (demo values), packet builder, simulated routing, bedboard, role-adaptive UX — unit tests 37/37, Playwright smoke 16/16, typecheck + production build pass. Frontend demo only (localStorage).
- Canonical foundation Prisma schema: `prisma format` / `validate` / `generate` passed; migration `20260710233252_initial_clarity_foundation` generated and applied to local PostgreSQL 18.4.
- 3 synthetic cases validated (JSON + Zod synthetic-only schema).
- Repository audit trail (`docs/repository-audit/`), canonical doc set, ADR-0001/0002.
- Root safety/workflow test baseline: 39/39 passing.

## Scaffolded (contracts exist; no runtime behind them)

- `packages/domain-contracts`: workstream + case state machines, append-only audit helper with restricted-identifier guard, benefits/eligibility/authorization contracts, payer-memory labeling, separate readiness dimensions, 6 dark feature flags, seed loader. The `CaseRepository` interface now has a real implementation (see Completed); the benefits/eligibility/authorization contracts still have none.

## Documented only (no code)

- API/services, model gateway, retrieval/citations, agent contracts (catalog only — files missing from package), tenancy enforcement at persistence, packet approval workflow beyond demo, communications recording, analytics dashboards, evaluation suites beyond the baseline, expanded 43-model schema domains (WorkflowTask, ReferralPacket, etc.).

## Blocked

- **OD-1:** full master package v0.2.0 (72 of 87 files missing) — blocks re-verification of 12 summary-graded domains and the 7 missing synthetic cases.
- **OD-2:** counsel review of Louisiana statutory wording — blocks any legal-clock enforcement.
- **OD-3:** clinical criteria licensing — blocks necessity criteria mapping.

## Not started

- Backend services, authentication, RBAC/RLS, real object storage (S3/Blob — document metadata persistence and a synthetic in-memory storage placeholder are done; see Completed), real evidence pipeline, any live agent, any external integration, CI, lint/format toolchain, Node version pin (OD-9).

## Requires clinical review

- Assessment content, guardrail vocabulary, bedboard compatibility heuristics, medical-necessity draft prompts.

## Requires legal review

- PEC/OPC/CEC instrument logic, compliance-clock configuration, custody/EMTALA language.

## Requires security review

- Everything in SECURITY.md "required controls"; any future integration or deployment.

## Requires developer decision

- OD-5 (API architecture), OD-6 (database hosting/RLS), OD-7 (pnpm/Turborepo timing), OD-8 (expanded-schema graduation), OD-9 (toolchain/CI).

## Next recommended action

~~Implement tenant-scoped case repository~~ **done**. ~~Case command service and state machine~~ **done** (`feat/case-command-service`). ~~Tenant-scoped document repository~~ **done** (`feat/case-command-service`, see Completed — ADR-0004).

**Issue: "Implement the evidence pipeline (human-review path, no AI extraction)."** Per the agreed sequence (repository → command service → documents → **evidence** → insurance/benefits → authorization → API → UI → extraction automation): `EvidenceItem` persistence linked to a `SourceDocument`, human-entered (not AI-extracted) evidence records against the existing `EvidenceCategory`/`EvidenceStatus` enums, review/approval transitions (`CANDIDATE → APPROVED/REJECTED/NEEDS_CLARIFICATION/SUPERSEDED`) through the same command-service pattern, case-ownership + document-ownership checks, and audit events for evidence creation and review decisions. Still no OCR or AI extraction — a human enters the evidence text/values; this issue is the persistence + review workflow only.
