# Implementation Status

**As of 2026-07-13** (post authorization readiness, branch `feat/authorization-readiness`, stacked on `feat/insurance-benefits` → `feat/evidence-repository`; remote `github.com/henrytylerhebert-eng/clarity-platform`, protected `main`, open PRs #7/#8/#9/#10 pending the §3a merge queue). A capability appears in exactly one bucket. "Verified" means it ran in this session.

## Completed (verified working)

- **Authorization readiness — preparation phase** (`packages/authorization-service` + `PrismaAuthorizationGateway`, ADR-0010 — MVP_ROADMAP Phase 2): RecordAuthorization (initial status DERIVED from the cited benefit quote: required→NOT_STARTED, not-required→NOT_REQUIRED, unknown→rejected; one record per coverage+LOC), TransitionAuthorizationPreparation (structurally limited to PREPARING/NOT_REQUIRED/UNABLE_TO_COMPLETE — SUBMITTED unreachable until the submission phase behind `assertHumanSubmitter`; existing state machine revalidated in-transaction; rationale required off the normal path), and AssessAuthorizationReadiness (pure derived per-coverage view: requirement + named gaps + statuses, **no aggregate score** per the readiness doctrine, verified by test). Migration `authorization_tenancy_and_versioning` (Authorization: organizationId, version); contract addition LEVELS_OF_CARE. Verified: 10 integration tests, full suite **177/177**, app 37/37, zero residue.

- **Manual insurance and benefits verification** (`packages/benefits-service` + `PrismaBenefitsGateway`, ADR-0009 — MVP_ROADMAP Phase 1): four commands (RecordInsuranceCoverage, VerifyEligibility, RecordBenefitVerification, RecordFinancialEducation) — human-performed only, no X12/payer APIs. Coverage requires ≥1 same-case APPROVED INSURANCE evidence item (the ADR-0008 review gate made structural); member/group/policy identifiers are structurally unacceptable input and stored nowhere (`*Encrypted` columns stay NULL until an encryption capability exists); eligibility attempts are immutable rows following the pre-existing eligibility state machine with version-guarded coverage rollup; benefit quotes are impossible to record without the not-a-payment-guarantee disclaimer and only against ACTIVE coverage; education records disclose uncertainties. Migration `coverage_tenancy_and_versioning` (InsuranceCoverage: organizationId, version). Contract correction: SUBSCRIBER_RELATIONSHIPS now mirrors the schema enum (CHILD → PARENT/GUARDIAN). Verified: 16 integration tests, full suite **167/167**, app 37/37, zero residue.

- **Evidence repository and human-review workflow** (`packages/evidence-service` + `PrismaEvidenceGateway`, ADR-0008): nine commands (CreateCandidateEvidence, CorrectCandidateEvidence, ApproveEvidence, RejectEvidence, RequestEvidenceClarification, SupersedeEvidence, CreateContradictionGroup, AddEvidenceToContradictionGroup, ResolveContradictionReview) — entirely human-driven, no OCR/extraction/AI. Evidence binds verbatim source text (immutable by construction) to the exact document version; every item starts CANDIDATE; approval is domain-scoped by category; corrections touch interpretation only; supersession freezes history in one transaction; contradiction groups make conflicts visible without resolving them; optimistic concurrency + idempotency replay (new `objectId` on idempotency records); audit metadata carries hashes and field names, never source text. Migration `evidence_review_and_contradiction_support` (EvidenceItem: organizationId, version, createdBy, creationMethod, reviewerNote, supersededById, evidenceFamilyId; new ContradictionGroup). Verified: 19 evidence tests, full suite **149/149**, app 37/37, zero residue.

- **Case foundation hardening** (this branch): (1) **Atomic assignee validation** (ADR-0005) — the AssignCase TOCTOU window is closed; assignee same-organization + `ACTIVE`-status checks run inside the command transaction and are re-asserted as a predicate on the conditional UPDATE itself; verified incl. a deterministic mid-transaction membership-change interleave (6 new tests). (2) **Reopen authority exact-named** — `ORGANIZATION_ADMIN` + mandatory rationale; `SYSTEM_ADMIN` provably cannot reopen; failed reopens write nothing. (3) **Lint baseline** (ADR-0006) — ESLint + typescript-eslint flat config, root `lint`/`typecheck` scripts, 0 errors. (4) Phase-0 milestone review (`docs/repository-audit/07_…`) and private-remote handoff guide (`docs/developer-handoff/…`); no remote exists, nothing pushed.
- **Document repository** (`packages/document-service` + `PrismaDocumentGateway`, ADR-0004 baseline + ADR-0007 hardening): four commands (UploadDocument, CreateDocumentVersion, ClassifyDocument, AccessDocument) behind the controlled-path pattern — strict envelopes, role policy, file validation (size/MIME/extension/filename, configurable), SHA-256 content-addressed dedupe, version families (migration `20260711141534`: `fileSizeBytes`, `documentFamilyId`; prior versions immutable), classification state machine (REJECTED terminal + rationale + distinct `DOCUMENT_REJECTED` audit), case-ownership checks, access auditing with VIEW/DOWNLOAD modes, sanitized filenames in audit metadata, and storage/DB **failure compensation** (bytes-first + compensating delete guarded by a reference count; `DOCUMENT_UPLOAD_FAILED`/`DOCUMENT_STORAGE_CLEANUP_COMPLETED`). Storage port has two adapters: in-memory and a dev-only `LocalFilesystemObjectStorage` (`.local-object-storage/`, git-ignored, traversal-proof opaque keys). Verified: 32 document tests (14 baseline + 18 hardening), full root suite **130/130**, app suite 37/37, zero residue. No OCR/AI extraction, no malware scanning, no cloud storage.
- **Case command service and workflow transition engine** (`packages/case-service`, branch `feat/case-command-service`): nine explicit commands behind one controlled path — strict envelopes, role policy (schema `UserRole` values), rationale rules, terminal-case protection, reopen gated to exactly `ORGANIZATION_ADMIN` with mandatory rationale (`SYSTEM_ADMIN` has no case-command rights), optimistic concurrency (`version` column + predicate), idempotency keys (`CommandIdempotencyRecord`), correlation ids, and audit events with previous/new state hashes — all atomic per command via the single approved Prisma gateway. Verified: 52/52 integration tests incl. all 12 required behaviors, full suite 91/91 (at the time; now 105/105 with document-service added). ADR-0003.
- **Tenant-scoped case repository** (`packages/case-repository`, branch `feat/tenant-scoped-case-repository`): Prisma-backed `CaseRepository` with organization scoping in every query/write predicate, atomic case-mutation + audit-event transactions, append-only audit writes with the restricted-identifier guard, optimistic concurrency on state transitions. Verified against local `clarity_dev`: 30/30 integration tests, 69/69 full root suite, cleanup leaves zero synthetic rows. See `docs/implementation/CASE_REPOSITORY_IMPLEMENTATION.md` and `docs/testing/CASE_REPOSITORY_TEST_MANIFEST.md`. **Audit integration: implemented** for case mutations (no DB-level immutability enforcement yet; no state hashes).

- `app/` crisis-path prototype: guided intake, drafts with prohibited-language guards, hash-chained custody ledger, compliance clocks (demo values), packet builder, simulated routing, bedboard, role-adaptive UX — unit tests 37/37, Playwright smoke 16/16, typecheck + production build pass. Frontend demo only (localStorage).
- Canonical foundation Prisma schema: `prisma format` / `validate` / `generate` passed; migration `20260710233252_initial_clarity_foundation` generated and applied to local PostgreSQL 18.4.
- 3 synthetic cases validated (JSON + Zod synthetic-only schema).
- Repository audit trail (`docs/repository-audit/`), canonical doc set, ADR-0001/0002.
- Root safety/workflow test baseline: 39/39 passing.

## Scaffolded (contracts exist; no runtime behind them)

- `packages/domain-contracts`: workstream + case state machines, append-only audit helper with restricted-identifier guard, payer-memory labeling, separate readiness dimensions, 6 dark feature flags, seed loader. The benefits/eligibility contracts now have a real implementation (see Completed); the **authorization** contracts still have none (next phase).

## Documented only (no code)

- API/services, model gateway, retrieval/citations, agent contracts (catalog only — files missing from package), tenancy enforcement at persistence, packet approval workflow beyond demo, communications recording, analytics dashboards, evaluation suites beyond the baseline, expanded 43-model schema domains (WorkflowTask, ReferralPacket, etc.).

## Blocked

- **OD-1:** full master package v0.2.0 (72 of 87 files missing) — blocks re-verification of 12 summary-graded domains and the 7 missing synthetic cases.
- **OD-2:** counsel review of Louisiana statutory wording — blocks any legal-clock enforcement.
- **OD-3:** clinical criteria licensing — blocks necessity criteria mapping.

## Not started

- Backend services, authentication, RBAC/RLS, production object storage (S3/Blob — metadata persistence, validation, versioning, and a dev-only filesystem adapter are done; see Completed), malware scanning, real evidence pipeline, any live agent, any external integration, CI, formatter toolchain (lint baseline exists — ADR-0006), Node version pin (OD-9).

## Requires clinical review

- Assessment content, guardrail vocabulary, bedboard compatibility heuristics, medical-necessity draft prompts.

## Requires legal review

- PEC/OPC/CEC instrument logic, compliance-clock configuration, custody/EMTALA language.

## Requires security review

- Everything in SECURITY.md "required controls"; any future integration or deployment.

## Requires developer decision

- OD-5 (API architecture), OD-6 (database hosting/RLS), OD-7 (pnpm/Turborepo timing), OD-8 (expanded-schema graduation), OD-9 (toolchain/CI).

## Next recommended action

~~Case repository~~ ~~case command service~~ ~~document repository~~ ~~foundation hardening~~ ~~evidence repository~~ ~~benefits verification~~ ~~authorization readiness~~ **all done** (ADR-0003…ADR-0010). The MVP backend slices are complete.

**Issue: "Implement authentication (MVP_ROADMAP Phase 3)"** — the first MVP blocker: real identity for the existing `User`/roles model (managed IdP recommended), session verification middleware-ready for the API phase, retiring the "actor roles are trusted caller input" assumption that every ADR has carried, and re-running the permission suites against real principals. Prerequisites to unblock first: the §3a merge queue (PRs #7 → #8 → #9 → retarget #10 → #10 → this branch's PR). In parallel per the roadmap: 2–3 intake-staff conversations before Phase 5 locks the UI, and the OD-5 API architecture decision can be drafted during Phase 3.
