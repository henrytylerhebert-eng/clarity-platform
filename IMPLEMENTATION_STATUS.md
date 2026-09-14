# Implementation Status

## Current verification snapshot

**As of 2026-07-29** for source commit
`8399eddad4cb8575d94f9b31db27eb00f73e4bcf` (`origin/main` when this
snapshot was taken), two environments were checked:

**Pre-existing Claude assessment worktree at the same source commit, before
its branch changed externally:**

- Prescreen contract/service unit tests: **65/65 passed**.
- App tests: **64/64 passed**.
- Root lint and `prisma validate`: passed.
- Root tests: **342/343 passed**. Migration integrity failed because the
  shared local `clarity_dev` ledger contains four migrations from other,
  unmerged worktrees that do not exist at this checkout.
- Root typecheck: failed. TypeScript resolved `@clarity/prescreen-service`
  through the parent checkout, whose Phase 3 async interfaces differ from
  this checkout's Phase 2 synchronous interfaces.
- Bridge doctor/status: CLI succeeded; Antigravity listener was **not
  detected** and all agent authentication states were `Unknown`.

**Fresh isolated `codex/ai-agent-readiness` preparation worktree:**

- No local dependency installation exists, and the assignment did not
  authorize installing dependencies.
- Focused tests, app tests, root tests, lint, typecheck, and Prisma validation
  were therefore unavailable (`vitest`, `eslint`, `tsc`, and `prisma` not
  found; `npx vitest` could not load the repository config without a local
  `vitest/config`).
- Documentation link/JSON checks and `git diff --check` are the applicable
  verification for this documentation-only branch.

**Remote drift during final review:** `origin/main` advanced to
`edd08550d44f257d10c696327a5ae3ceb1881503`, five commits beyond the assessed
base. Merged PR #37 changed only `package-lock.json` to patch transitive
development dependencies. Merged PR #36 added
`tests/unit/contract-schema-enum-sync.test.ts`. Merged PR #38 then added
ADR-0018 and `MEDICAL_TRANSFER_REQUIRED` as a domain diversion state, narrowing
the guard's `KNOWN_DESYNC` to exactly the Prisma-only
`RETURNED_FOR_MORE_INFORMATION` value under issue #35. ADR-0018 explicitly
leaves the medical-diversion role policy unresolved because the inherited
roles are nonclinical (OD-19). Merged PR #39 then recorded that current-main
session state in `CLAUDE.md` and `IMPLEMENTATION_STATUS.md` and passed CI. It
also records PR #30 as held for owner review, AI-operating-model Stage 0.1-0.3
as held, and unresolved PR #33 review findings. Merged PR #41 then added
current-main OD-13 (CMS regulatory research) and OD-14 (organization policy
index) to the canonical decision register. The preparation worktree remains at
assessed base `8399edd` and is five commits behind. Those changes are absent as
Git history here, and none of the unavailable fresh-worktree code gates were
rerun at the new remote commit.

**Accepted current-main evidence incorporated from PR #39, not reproduced in
this worktree:** PR #38's session reported root **388/389**, app **64/64**,
lint, typecheck, Prisma validation, and high-severity audit success; the one
local root failure was the shared-database migration ledger tracked by issue
#31. Ephemeral CI passed PRs #36-#39. PR #39 also records worktree-sensitive
`graphify` absolute-path churn; generated graph output is not canonical
evidence and should not be refreshed across worktrees without a bounded diff.

The earlier test and typecheck results are current-session evidence for the
same source commit, but not proof that this fresh worktree's dependency
boundary is usable. Together, both environments show the repository is **not
currently safe for a code-modifying domain agent**: validation is either
unavailable or can inspect code/database state from another worktree. See
`docs/developer-handoff/AI_NATIVE_DOMAIN_AGENT_REPOSITORY_PREPARATION.md`.

## Verification history (historical, not current)

**2026-07-19 prescreen API-slice session.** On branch
`claude/clarity-opening-cfcdc5`, rebased onto `main` after the prescreen
hardening session (PR #27), the same-organization prescreen HTTP slice was
implemented on the existing node:http server with the production role policy
and Phase 2 in-memory gateway. Reported session evidence: root tests
**343/343** (including 38 prescreen-contract, 27 prescreen-service, and 9
prescreen-API integration tests), app **64/64**, lint, typecheck,
`prisma validate`, and zero new synthetic residue. Pre-existing synthetic
residue (7 orgs / 4 cases) was tracked rather than silently deleted.

**2026-07-19 prescreen hardening session.** Reported branch evidence:
root tests **333/333** (including 38 prescreen-contract and 26
prescreen-service tests) against local `clarity_dev`; app tests 64/64;
typecheck, lint, `prisma validate`, app build, and all 145 source-package
checksums passed. Database residue counts were not remeasured in that pass.

**2026-07-19 review-and-promotion session.** Reported `main` evidence:
root tests 268/268, app tests 64/64, typecheck, root lint, and `npm audit`
(0 vulnerabilities), run locally for PR #14 and by the Postgres-backed CI
`verify` job on PR #15 before merge. Earlier bridge tests, app production
build, and nested visualizer lint were historical even in that pass.

The exact branch, HEAD, worktree state, dependency resolution, and database
ledger must be rechecked before each task. A capability appears in exactly
one bucket. Only the top snapshot is current-session verification. Everything
below is a capability inventory at the named source snapshot with historical
verification evidence; its pass counts and "verified" wording are not current
evidence unless repeated in the top snapshot.

## Accepted Clarity persistence and coordination inventory

- **S1 domain foundation:** episode identity/lifecycle, admission linkage, episode-owned utilization review, authorization outcomes, separate risk flags, governed envelopes, append-only corrections, explicit facility timezone lineage, draft metrics, synthetic fixtures, and deterministic tests are implemented and owner-accepted.
- **S2 bounded persistence:** episodes, case links, episode-owned authorization facts, documentation gaps, corrections, governed events, transactional outbox rows, Prisma gateways, and deterministic integration tests are implemented and independently verified.
- **H1 hardening:** nullable source-owned `programId` is aligned across contracts, event payloads, mapper, and persistence; concurrent acceptance-key replay is deterministic and conflicting reuse raises `IdempotencyConflictError`.
- **H3 hardening:** an additive partial unique index enforces one active admission-source episode per case at the database boundary; losing concurrent writes raise `ActiveAdmissionExistsError`. PR #14 fixed the H1/H3 database-uniqueness interaction. PR #21 closes the separate read-window race where an identical winner commits between the acceptance-key lookup and active-admission lookup; deterministic integration coverage forces that interleaving. Exact admission identity replays, while a different acceptance identity remains a conflict.
- **Migration integrity:** local migration ledger and H3 index verification are covered by a read-only integration test; local fresh-database replay/restore is verified, while provider restore and production promotion remain unverified.
- **Event vocabulary:** current bounded source-versus-derived boundary accepted; the three emitted S2 events remain in force, with a named synthetic staging consumer contract and no deployed external consumer.
- **OD-6 posture:** recommended shared-schema PostgreSQL and transaction-local RLS posture accepted; provider, pooling mode, runtime roles, provider-backed tests, and implementation authorization remain gated.
- **OD-6 bounded local RLS:** transaction-local context and additive direct-tenant policies for the episode persistence tables are implemented and verified against local `clarity_dev`; audit/idempotency/inherited-model coverage, provider-backed evidence, runtime-role deployment, and production rollout remain gated.
- **Provider/session choice:** Google Cloud SQL for PostgreSQL in `us-central1` with direct connections is recorded; no authenticated GCP account/project was available for provider-backed execution in this pass.
- **Local provider/security evidence:** the local PostgreSQL boundary has a dedicated `NOSUPERUSER NOBYPASSRLS` runtime-role proof and transaction-local isolation tests; this is technical synthetic evidence, not Cloud SQL or independent security acceptance.
- **Local migration recovery:** all 12 migrations replayed into a disposable local database and restored into a second disposable database with both ledgers reporting 12 successful migrations; Cloud SQL restore and production promotion remain gated.
- **Synthetic outbox runtime:** a tenant-scoped dispatcher and in-process consumer are verified for the accepted three event types, retry preservation, and concurrent row locking; `Bayside Hospital Clarity Intake Receiver` is named as the first consumer contract, but external consumer/runtime delivery remains gated.
- **H2 governance:** the RLS tenant-enforcement, migration promotion/recovery, and outbox ownership records now contain bounded recommended operating designs. Local fresh migration replay/restore and synthetic outbox delivery are verified; provider-backed or production RLS, production migration promotion, external workers/consumers, APIs, and deployment remain unauthorized.
- **Workflow Discovery Protocol:** documentation-only requirements-acquisition package and inference-complete synthetic protective-custody session are committed under `docs/discovery/`. They preserve source, assumption, derived, review, and implementation boundaries; they do not add runtime behavior or promote inferred facts to verified domain truth.
- **Bridge:** the repository-relative bridge remains a canonical, referenced record, but the 2026-07-29 live check reported `listener=not detected`; direct Antigravity CLI, agent consumption, and all authentication states remain unverified. Do not dispatch through it or relocate it until OD-16 is decided.
- **Repository promotion and governance (2026-07-19 session):** the verified slice was promoted to protected `main` via PR #13 (reviewed, merged 7345dd8). PR #14 cleared all Dependabot alerts (vitest ^3.2.6, vite ^6.4.3, @playwright/test ^1.55.1; `npm audit` clean) and carried the H1/H3 replay-classification fix. Redundant PRs #6/#10/#11/#12 were closed as superseded; docs PRs #8 (operating manual + session rules) and #9 (MVP roadmap) were merged. PR #15 added the CI `verify` workflow (lint, typecheck, root + app tests against an ephemeral `clarity_dev` Postgres 16 service, Prisma validate/generate/migrate deploy, high-severity npm audit) and it passed on its own PR before merge. The §3a solo-maintainer protection is now live: PR-only, 0 required approvals with documented self-review, required `verify` status check (strict), conversation resolution, admin enforcement. CI closed the CI portion of OD-9; Node pinning, formatting, and hermetic local worktree/database isolation remain open. Hosting/backup portions of Phase 6 remain open.

## Prescreen product slice (2026-07-19 session)

- **Package onboarding (PRs #17 and #20):** `clarity-prescreen-integration-package-v1.0.0` is preserved under `reference/source-packages/` with provenance recorded. PR #20 restored `code/tests/transport.test.mjs` to its manifest bytes; all 145 checksums and the 31 reference tests now pass. Historical schema/OpenAPI/fixture evidence was not re-run because no runnable validation script ships.
- **Phase 1 contracts (PR #19 plus post-merge hardening):** repo-native prescreen contracts in `packages/domain-contracts/src/prescreen.ts` — willingness, four-domain orientation + gate, possible-pathway derivation (medical-stabilization precedence; routing hints, never decisions), encounter/assessment lifecycles, target-scoped packet readiness (named gaps, no aggregate score), fail-closed consent-authority and transport-qualification evaluators over configured rules, stable error codes, and an event envelope limited to the six command-coupled event types. Conservative review hardening routes NON_OPPOSED to authorized noncontested review, fails closed on missing privacy regime or overlapping approved consent rules, disqualifies providers with unresolved restrictions, and requires both sending- and receiving-facility approval. 38 unit tests.
- **Phase 2 command service (PR #23, ADR-0013):** `packages/prescreen-service` — six commands (StartPrescreenEncounter, SaveAssessmentDraft, AttestAssessment, CreateAssessmentSupplement, SubmitPrescreen, UpdatePacketRequirement) plus the read-only EvaluateTargetReadiness view, behind strict envelopes → injected explicit role policy → an atomic in-memory gateway (organization checks on existing prescreen rows, fresh-row state machine, versioned update, audit + outbox + idempotency committed together; failed commands leave zero residue — historically proven by test). Start does not validate case-reference tenancy, and the idempotency lookup currently uses an ambiguous composite string key (`R-14`). Canonical recursively-sorted SHA-256 request fingerprints close the reference package's nested-body defect but do not fix that tuple-key collision. Submission records intent only: no acknowledgement, review, acceptance, admission, transport authority, or cross-organization access is expressible. The 27-test count is historical (`docs/testing/PRESCREEN_SERVICE_TEST_MANIFEST.md`).
- **Role mapping resolved + same-org API slice (merged via PR #28, ADR-0014):** the owner ruled Option 3 narrowly — exactly two equivalences (`INTAKE_COORDINATOR` ≡ Central Intake coordinator; `PHYSICIAN_REVIEWER` ≡ authorized practitioner, PMHNP signer authority as configured policy, matrix-conditional capabilities excluded fail-closed), external/field roles deferred to the cross-org design, no enum change. `PRESCREEN_PRODUCTION_POLICY` (compile-checked against `UserRole`) + seven HTTP routes on the existing node:http server: strict bodies mirror the envelopes minus every server-derived field (`organizationId`, `actor`, `occurredAt`, and for submit `receivingOrganizationId` — all principal-derived/server-stamped; supplying any is a 400, and cross-org submission is structurally inexpressible). A command-error subset maps to content-free 403/404/409/400 responses; repeat submission can throw a transition error outside that mapping and fall through to 500 (`R-18`). Phase 2 amendment: the request fingerprint excludes `occurredAt` so HTTP retries replay instead of conflicting; nested-body conflicts unchanged. The 9-integration-test count is historical (`docs/testing/PRESCREEN_API_TEST_MANIFEST.md`).
- **Not claimed for the prescreen slice:** persistence or restart durability of prescreen state (the gateway is still in-memory; a restart loses it), migrations, UI, event delivery, cross-organization collaboration, roles beyond the two ruled equivalences, PMHNP scope configuration, clinical/legal approval of any rule content, production readiness. Prescreen Phase 3 persistence remains gated on the separate provider-backed Cloud SQL/RLS verification plus a Phase 3 design approval.
- **Open decision packets:** the cross-organization submission/receipt model (successor to the resolved role-mapping packet — blocks field-originated prescreens and any external-actor work); consent-rule specificity ordering and fractional-age representation remain domain-review follow-ups in ADR-0013 (until an ordering policy is approved, overlapping consent rules fail closed).

## Implemented / historical verification evidence

- **API vertical slice** (`packages/api-service`, pre-decision ADR-0012 spike): the first HTTP entry point uses `node:http` and exposes login/logout/session plus `POST /api/cases/{caseKey}/decision-rationale`. Tenant and actor roles are derived exclusively from the verified principal (`AuthenticationService.authenticate` -> `actorFor`); there is no request field through which a caller can supply either, and unknown body fields are rejected (400). The slice proves one authenticated path from the prototype UI to the command service and Postgres audit trail. It does **not** resolve ADR-0012, which still proposes Fastify and requires owner approval. Historical session evidence: 8 API integration tests within a reported 258-test root suite; app suite 64/64.

- **Authentication** (`packages/auth-service` + `PrismaAuthGateway`, ADR-0011 — MVP_ROADMAP Phase 3): server-side sessions over the existing `User`/roles model — opaque 32-byte bearer tokens stored only as SHA-256 hashes (returned exactly once, never audited), 8h default expiry, audited timestamp revocation (`SESSION_ISSUED`/`SESSION_REVOKED`, the first organization-level audit events with null caseId); `IdentityProvider` port (managed-IdP/OIDC adapter is deployment-phase work; dev provider is local-only, no passwords stored anywhere); the `principalToActor` bridge sources roles FROM THE DATABASE, retiring the trusted-caller-roles assumption at the authentication boundary (fully dead when the API layer is the sole entry — ADR-0012 Proposed); deactivating a user kills live sessions on the next request; all authentication failures are one indistinguishable error. Permission suites re-run against real session-derived principals. Migration `auth_sessions`. Verified: 8 integration tests, full suite **185/185**, app 37/37, zero residue.

- **Authorization readiness — preparation phase** (`packages/authorization-service` + `PrismaAuthorizationGateway`, ADR-0010 — MVP_ROADMAP Phase 2): RecordAuthorization (initial status DERIVED from the cited benefit quote: required→NOT_STARTED, not-required→NOT_REQUIRED, unknown→rejected; one record per coverage+LOC), TransitionAuthorizationPreparation (structurally limited to PREPARING/NOT_REQUIRED/UNABLE_TO_COMPLETE — SUBMITTED unreachable until the submission phase behind `assertHumanSubmitter`; existing state machine revalidated in-transaction; rationale required off the normal path), and AssessAuthorizationReadiness (pure derived per-coverage view: requirement + named gaps + statuses, **no aggregate score** per the readiness doctrine, verified by test). Migration `authorization_tenancy_and_versioning` (Authorization: organizationId, version); contract addition LEVELS_OF_CARE. Verified: 10 integration tests, full suite **177/177**, app 37/37, zero residue.

- **Manual insurance and benefits verification** (`packages/benefits-service` + `PrismaBenefitsGateway`, ADR-0009 — MVP_ROADMAP Phase 1): four commands (RecordInsuranceCoverage, VerifyEligibility, RecordBenefitVerification, RecordFinancialEducation) — human-performed only, no X12/payer APIs. Coverage requires ≥1 same-case APPROVED INSURANCE evidence item (the ADR-0008 review gate made structural); member/group/policy identifiers are structurally unacceptable input and stored nowhere (`*Encrypted` columns stay NULL until an encryption capability exists); eligibility attempts are immutable rows following the pre-existing eligibility state machine with version-guarded coverage rollup; benefit quotes are impossible to record without the not-a-payment-guarantee disclaimer and only against ACTIVE coverage; education records disclose uncertainties. Migration `coverage_tenancy_and_versioning` (InsuranceCoverage: organizationId, version). Contract correction: SUBSCRIBER_RELATIONSHIPS now mirrors the schema enum (CHILD → PARENT/GUARDIAN). Verified: 16 integration tests, full suite **167/167**, app 37/37, zero residue.

- **Evidence repository and human-review workflow** (`packages/evidence-service` + `PrismaEvidenceGateway`, ADR-0008): nine commands (CreateCandidateEvidence, CorrectCandidateEvidence, ApproveEvidence, RejectEvidence, RequestEvidenceClarification, SupersedeEvidence, CreateContradictionGroup, AddEvidenceToContradictionGroup, ResolveContradictionReview) — entirely human-driven, no OCR/extraction/AI. Evidence binds verbatim source text (immutable by construction) to the exact document version; every item starts CANDIDATE; approval is domain-scoped by category; corrections touch interpretation only; supersession freezes history in one transaction; contradiction groups make conflicts visible without resolving them; optimistic concurrency + idempotency replay (new `objectId` on idempotency records); audit metadata carries hashes and field names, never source text. Migration `evidence_review_and_contradiction_support` (EvidenceItem: organizationId, version, createdBy, creationMethod, reviewerNote, supersededById, evidenceFamilyId; new ContradictionGroup). Verified: 19 evidence tests, full suite **149/149**, app 37/37, zero residue.

- **Case foundation hardening** (historical Phase 0 implementation): (1) **Atomic assignee validation** (ADR-0005) — the AssignCase TOCTOU window is closed; assignee same-organization + `ACTIVE`-status checks run inside the command transaction and are re-asserted as a predicate on the conditional UPDATE itself; historical coverage includes a deterministic mid-transaction membership-change interleave. (2) **Reopen authority exact-named** — `ORGANIZATION_ADMIN` + mandatory rationale; `SYSTEM_ADMIN` has no reopen authority; failed reopens write nothing. (3) **Lint baseline** (ADR-0006) — ESLint + typescript-eslint flat config and root `lint`/`typecheck` scripts. (4) Phase-0 milestone review and private-remote handoff guide. Current remote/branch state is recorded in the top snapshot, not this historical entry.
- **Document repository** (`packages/document-service` + `PrismaDocumentGateway`, ADR-0004 baseline + ADR-0007 hardening): four commands (UploadDocument, CreateDocumentVersion, ClassifyDocument, AccessDocument) behind the controlled-path pattern — strict envelopes, role policy, file validation (size/MIME/extension/filename, configurable), SHA-256 content-addressed dedupe, version families (migration `20260711141534`: `fileSizeBytes`, `documentFamilyId`; prior versions immutable), classification state machine (REJECTED terminal + rationale + distinct `DOCUMENT_REJECTED` audit), case-ownership checks, access auditing with VIEW/DOWNLOAD modes, sanitized filenames in audit metadata, and storage/DB **failure compensation** (bytes-first + compensating delete guarded by a reference count; `DOCUMENT_UPLOAD_FAILED`/`DOCUMENT_STORAGE_CLEANUP_COMPLETED`). Storage port has two adapters: in-memory and a dev-only `LocalFilesystemObjectStorage` (`.local-object-storage/`, git-ignored, traversal-proof opaque keys). Verified: 32 document tests (14 baseline + 18 hardening), full root suite **130/130**, app suite 37/37, zero residue. No OCR/AI extraction, no malware scanning, no cloud storage.
- **Case command service and workflow transition engine** (`packages/case-service`, branch `feat/case-command-service`): nine explicit commands behind one controlled path — strict envelopes, role policy (schema `UserRole` values), rationale rules, terminal-case protection, reopen gated to exactly `ORGANIZATION_ADMIN` with mandatory rationale (`SYSTEM_ADMIN` has no case-command rights), optimistic concurrency (`version` column + predicate), idempotency keys (`CommandIdempotencyRecord`), correlation ids, and audit events with previous/new state hashes — all atomic per command via the single approved Prisma gateway. Verified: 52/52 integration tests incl. all 12 required behaviors, full suite 91/91 (at the time; now 105/105 with document-service added). ADR-0003.
- **Tenant-scoped case repository** (`packages/case-repository`, branch `feat/tenant-scoped-case-repository`): Prisma-backed `CaseRepository` with organization scoping in every query/write predicate, atomic case-mutation + audit-event transactions, append-only audit writes with the restricted-identifier guard, optimistic concurrency on state transitions. Verified against local `clarity_dev`: 30/30 integration tests, 69/69 full root suite, cleanup leaves zero synthetic rows. See `docs/implementation/CASE_REPOSITORY_IMPLEMENTATION.md` and `docs/testing/CASE_REPOSITORY_TEST_MANIFEST.md`. **Audit integration: implemented** for case mutations (no DB-level immutability enforcement yet; no state hashes).

- `app/` crisis-path prototype: guided intake, drafts with prohibited-language guards, hash-chained custody ledger, compliance clocks (demo values), packet builder, simulated routing, bedboard, role-adaptive UX, and a read-only synthetic Product Studio registry. Historical evidence includes a 64/64 app suite, typecheck, and production build. The frontend remains mostly localStorage-backed, with a bounded authentication and case decision-rationale API path; there is no prescreen UI wiring.
- **Louisiana e-PEC lifecycle** (Legal Status workspace): OPC issuance, PEC execution with a configurable exam-validity window check and a hash-sealed fingerprint, a bridge into the existing packet/routing pipeline for transmission and facility acceptance, and CEC execution (continue or discharge-forthwith) — all against a jurisdiction-configurable rule set (`epecRuleSets.ts`) so a second jurisdiction is a new config object, not a code change. Demo logic only; see `docs/legal/LEGAL_STATUS_ARCHITECTURE.md`.
- Canonical foundation Prisma schema: historical session evidence reported `prisma format` / `validate` / `generate` passing and migration `20260710233252_initial_clarity_foundation` applied to local PostgreSQL 18.4.
- 3 synthetic cases validated (JSON + Zod synthetic-only schema).
- Repository audit trail (`docs/repository-audit/`), canonical doc set, ADR-0001/0002.
- Root safety/workflow test baseline: 39/39 passing.

## Scaffolded (contracts exist; no runtime behind them)

- `packages/domain-contracts`: shared state machines, audit helpers, payer-memory labeling, readiness dimensions, dark feature flags, and seed contracts. Case, evidence, benefits, authorization, document, and auth areas have implemented service foundations; remaining contracts without runtime must be evaluated individually rather than treating the entire package as scaffold-only.

## Documented only (no code)

- Model gateway, retrieval/citations, product/runtime agent contracts (catalog only - files missing from the source package), packet approval workflow beyond demo, communications recording, analytics dashboards, production deployment topology, managed identity adapter, evaluation suites beyond the baseline, and expanded 43-model schema domains (WorkflowTask, ReferralPacket, etc.). The proposed DEV-R1 repository-review charter is a preparation artifact, not an implemented product/runtime agent.
- **Clarity CIA integration bundle v1.0.0** (onboarded 2026-07-17 to `reference/source-packages/clarity_cia_integration_bundle_v1_0_0/`): Comprehensive Initial Assessment blueprint — 3-stage treatment-team workflow (field/crisis intake → nursing → social-services integration → final clinical review), 11-role permission model, restricted-capability signer rules, runtime JSON Schema, and orchestration prompts. Requirements it does not cover (per-facility exclusionary/inclusionary criteria and lab standards, physician→NP acceptance delegation, sending-facility nursing report artifact, ambient audio documentation assist) are captured in `docs/workflows/INTAKE_TO_ADMISSION_WORKFLOW.md`; the facility P&P/SOP ingestion pipeline is parked in `docs/roadmap/IMPLEMENTATION_ROADMAP.md` → Parking lot.

## Blocked

- **OD-1:** full master package v0.2.0 (72 of 87 files missing) — blocks re-verification of 12 summary-graded domains and the 7 missing synthetic cases.
- **OD-2:** counsel review of Louisiana statutory wording — blocks any legal-clock enforcement.
- **OD-3:** clinical criteria licensing — blocks necessity criteria mapping.

## Not started

- Production hosting for the app/API/database, managed identity-provider integration, production-wide RBAC/RLS enforcement, production object storage (S3/Blob), malware scanning, live evidence extraction, any live product agent, external integrations, formatter toolchain, observability, and Node version pin. CI exists, but worktree-local dependency and database isolation remain unresolved. GitHub Pages publishes only the self-contained `docs/index.html` artifact and is not application deployment evidence.

## Requires clinical review

- Assessment content, guardrail vocabulary, bedboard compatibility heuristics, medical-necessity draft prompts.

## Requires legal review

- PEC/OPC/CEC instrument logic (implemented as demo logic, see Completed), compliance-clock configuration, custody/EMTALA language.

## Requires security review

- Everything in SECURITY.md "required controls"; any future integration or deployment.

## Requires developer decision

- OD-5 (API architecture), OD-6 (database hosting/RLS), OD-7 (pnpm/Turborepo timing), OD-8 (expanded-schema graduation), OD-9 (remaining toolchain and hermetic local verification), OD-13 (CMS regulatory research), OD-14 (organization policy index), OD-15 (read-only verifier ownership/approval), OD-16 (bridge disposition), OD-17 (remaining `RETURNED_FOR_MORE_INFORMATION` alignment), OD-18 (single canonical agent-governance plan), OD-19 (medical-diversion role authority).

## Next recommended action

~~Case repository~~ ~~case command service~~ ~~document repository~~ ~~foundation hardening~~ ~~evidence repository~~ ~~benefits verification~~ ~~authorization readiness~~ ~~authentication~~ **all done** (ADR-0003…ADR-0011).

**Current action:** Integrate accepted current main through PR #41, then reconcile open governance PR #33 and held PR #30 with the preparation packet on `codex/ai-agent-readiness` to select one canonical agent/bridge/evaluation/status model. Separately, before any prescreen implementation, resolve open Phase 3 PR #32, the current main-branch contract defects, remaining OD-17, OD-19, and hermetic local verification. Provider-backed Cloud SQL/RLS evidence, cross-organization submission/receipt, prescreen UI, and all product/deployment approval gates remain separate.
