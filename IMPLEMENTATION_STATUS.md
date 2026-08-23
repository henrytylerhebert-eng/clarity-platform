# Implementation Status

**As of 2026-08-23 (AI operating model merge and PR #43 reconciliation)**
on branch `docs/session-close-2026-07-29` after merging current `origin/main`.

- **AI operating model plan merged (PR #33).** Five active review-thread
  blockers were fixed and resolved on 2026-08-23: AGENTS.md remains
  authoritative over repository policy, ADR collision checks fetch/query open
  PR refs before `git log --all`, graph maintenance is skipped unless
  generated from the canonical checkout or normalized/excluding tooling, Stage
  1 precision bands now cover the 0.3–0.499 and zero-denominator cases, and the
  dated handoff no longer points operators at closed issue #34 as the live
  merge blocker. GitHub CI `verify` passed on PR #33 before merge.
- **PR #43 reconciliation.** The July regulatory-reference session notes below
  are preserved as historical status instead of replacing the newer 2026-08-10
  prescreen reconciliation block. The project-state block in `CLAUDE.md` now
  carries forward OD-13, OD-14, the dev-tool-only boundary for the regulatory
  corpus tool, and the graph-determinism issue without reviving stale PR #33,
  PR #32, issue #34, or audit-gate blockers.

**Verification this session:** docs-only conflict reconciliation; no product
code, schema, migration, runtime, generated graph output, PHI/PII, or secrets
changed. `git diff --check` must pass before push; CI is the authority after
this branch updates.

**As of 2026-08-10 (PR #32 review-response and main-reconciliation session)**
on branch `codex/om/prescreen-phase3-fix` (pushed to PR #32's head,
`claude/prescreen-phase3-persistence`). Two things landed:

1. **Closed both Gemini Code Assist review findings on PR #32.**
   `saveAssessmentDraft` and `submitPrescreen` now catch raw Prisma `P2002`
   unique-index contention (racing duplicate `assessmentVersionId`; racing
   duplicate submission on the same encounter) and map it to
   `PrescreenDomainValidationError` instead of letting a raw Prisma error
   escape the gateway — mirroring the pre-existing
   `isAssessmentIdUniqueViolation` pattern. Two new concurrency tests fire
   racing requests with distinct idempotency keys (a real DB-level race, not
   an idempotency replay) and assert exactly one winner, one domain-typed
   loser. Both review threads replied to and resolved.
2. **Brought PR #32 current with `main`** (was 6 commits / ~3 weeks behind;
   GitHub reported `mergeable: CONFLICTING`). Merge conflicts were confined
   to `CLAUDE.md` and `IMPLEMENTATION_STATUS.md` narrative — both resolved by
   interleaving history rather than picking a side. The merge also surfaced
   a real collision needing a code fix, not just a doc reconciliation: PR
   #36's new `contract-schema-enum-sync.test.ts` (Stage 0.4, landed on `main`
   after PR #32 branched) didn't know about the six prescreen schema enums
   PR #32 added (`PrescreenEncounterStatus`, `PrescreenAssessmentStatus`,
   `PatientWillingness`, `PossiblePathway`, `PrescreenReadinessTarget`,
   `PacketRequirementState`). Verified each against its domain-contracts
   array member-for-member before classifying all six as `MIRRORED` — no
   desync, just an invariant test that predated the enums it now covers.

**Verification this session:** root **435/435** (40 files, up from 353 on
PR #32's prior head and 388/389 on `main`'s prior head — the merged sum),
app **64/64**, lint, typecheck, `prisma validate` pass, zero residue delta
(28 orgs/15 cases, stable across every run this session — matches the
2026-07-29 session's recorded count exactly).

**Known gaps, both flagged, neither fixed here:**
- The required "verify" CI check did not trigger for the Gemini-fix push
  (confirmed via two direct GitHub API queries on the commit SHA, ~1 min
  apart: `total_count: 0` workflow runs). Cause undetermined — the merge
  commit's push may resolve it, or it may need repo Actions-settings review.
- `npm audit --audit-level=high` now reports 2 new high-severity findings
  repo-wide, disclosed after PR #37's audit-gate fix landed on 7/29:
  `brace-expansion` (a follow-up CVE past PR #37's 5.0.8, already has an
  open Dependabot fix, PR #44) and `nanoid` (<3.3.17, no open fix yet). This
  blocks every PR's CI right now, not specifically #32; left for the owner
  rather than bundled into this PR's diff.
- `graphify-out/` on this branch was found built from the wrong worktree
  (2,454 files pinned instead of the repo's 6,537 — same failure mode
  tracked by issue #40) and was NOT refreshed/committed here to avoid an
  unrelated 1.7M-line diff riding along with this fix.

**As of 2026-07-29 (regulatory-reference session, second half)** on `main`.
Two further merges after the block below: PR #41 (CMS research prompt + Phase 2
policy-index packet) and PR #42 (regulatory corpus tool). PR #33 (operating
model plan + ADR-0017) had seven review findings fixed in this session; five
later review blockers were resolved and PR #33 merged on 2026-08-23.

- **CMS regulatory reference, Phase 1 (PR #41).** A deep research prompt at
  `docs/legal/GEMINI_DEEP_RESEARCH_PROMPT_CMS_MEDICARE_MEDICAID.md`, following
  the house pattern of the LA OPC/PEC/CEC prompt. Its organising idea is that
  most CMS guidance is interpretive and each organization writes its own
  policies, so every returned requirement must be classified
  BINDING-SPECIFIC / BINDING-INTERPRETIVE / ORG-DISCRETION / NOT-APPLICABLE,
  and the interpretive and discretionary ones must state concretely what an
  organization has to decide and show a surveyor. The consolidated form of
  that — "the interpretation map" — is the specification input for Phase 2.
  **The research has NOT been executed** (OD-13). The surface enumeration is
  authored from model knowledge and marked `Assumed`, not a verified inventory.
- **Phase 2 captured, not designed (PR #41).**
  `docs/decisions/ORG_POLICY_INDEX_DECISION_PACKET.md` records the
  per-organization AI-native policy index at decision-packet altitude, notes it
  sits on the controlled-extraction and AI-agent steps at the END of the build
  sequence, and names five risks needing owner rulings: cross-tenant leakage
  through shared vector retrieval (nearest-neighbour search does not naturally
  respect a tenant predicate), policy-as-reference vs policy-as-authority,
  possible FDA clinical-decision-support scope, who authors default
  interpretations, and version staleness. Registered as OD-14.
- **Regulatory corpus tool (PR #42).** `scripts/regulatory-corpus/` collects
  federal regulatory text, stores it, and detects change. API-first: eCFR and
  the Federal Register both publish documented APIs, so nothing is scraped.
  Update detection does not diff text — the eCFR versioner exposes a
  per-section `amendment_date`, so `check` reads one request per title plus one
  per part and exits 2 on drift. `amended` and `content-changed` are reported
  separately so an editorial hash change cannot masquerade as an amendment.
  Tracked manifest/index/change-log; raw payloads in gitignored
  `.regulatory-cache/`. robots.txt is enforced locally (cms.gov publishes
  `Disallow: /*?`). Federal Register lookups return candidates for human
  confirmation, except RIN `0938-AU87` which was verified live and resolves the
  CMS-0057-F family exactly. **Live run: 17/17 sources retrieved.** 28 unit
  tests, none performing network I/O.
  **Scope boundary:** development tooling — no `@prisma/client`, no database,
  no patient or tenant data, and NOT a deployed worker. Scheduling remains an
  owner decision per the standing worker/deployment constraint.
- **PR #33 review findings from this session (seven, all valid).** Two were
  documents making false claims about themselves: ADR-0017 advertised R1 as
  "read-only by tool allowlist" while the plan disclaimed exactly that, and the
  ADR-collision check piped filenames to bare numbers through `sort -u`, which
  collapses the duplicate it is hunting — the plan asserted three collisions
  while shipping a command incapable of finding one. A **P1** had the handoff
  telling an operator to replay the FIX commits (`346ee85`, `1470e00`) rather
  than the vulnerable parents (`ad1b7e9`, and `1470e00`'s parent), which would
  have handed R1 already-fixed code and recorded a false no-go. Also fixed: T1
  has no contract (now a Stage 3 entry gate), R2's write targets were
  summarised as three when the contract lists four, Stage 1's outcome bands
  overlapped at exactly two findings, and the handoff blocked Stage 1 on all
  four Stage 0 sub-items when the plan requires only 0.1–0.3.
- **Verification on `main` at that session close:** root **416/417**, app
  **64/64**, lint, typecheck, `prisma validate`, `npm audit` clean. The single
  root failure was the shared-`clarity_dev` migration-ledger contention (issue
  #31); CI's ephemeral Postgres passed that step. Synthetic residue zero delta
  across runs (28 orgs / 15 cases / 28 users).
- **New issue:** #40 — `graphify-out/` is tracked but keyed by absolute
  worktree paths, so the CLAUDE.md-mandated `graphify update .` rewrites
  thousands of path entries from any worktree other than the one that last
  generated it. Needs a decision between untracking it, making it
  path-independent, or naming one canonical worktree.

**As of 2026-07-29 (merge-gate and CaseStatus-ruling session)** on `main`
after three merges: PR #37 (dependency audit), PR #36 (Stage 0.4 enum-sync
test), PR #38 (ADR-0018 `MEDICAL_TRANSFER_REQUIRED`).

- **Merge gate restored (PR #37, closes issue #34).** `npm audit
  --audit-level=high` had been failing on every PR — including docs-only
  ones — against two transitive dev advisories (`brace-expansion` <=5.0.7,
  `postcss` <=8.5.17), blocking all merges. Both fixed versions were already
  inside the ranges their parents declare, so the fix is lockfile-only: no
  `overrides` pin and no `package.json` change. Three packages moved
  (`brace-expansion` 5.0.8, `postcss` 8.5.25, `nanoid` 3.3.16).
- **Contracts↔schema enum mirror is now a machine check (PR #36, Stage 0.4).**
  `tests/unit/contract-schema-enum-sync.test.ts` classifies every schema enum
  as MIRRORED or NOT_MIRRORED and asserts membership as a set. Two parser
  defects found in review were fixed with regression tests: members carrying
  Prisma field attributes (`ACTIVE @map("active")`) were silently dropped, and
  indented `enum` declarations were skipped whole — each would have let the
  suite pass while enforcing nothing for the affected enum.
- **`CaseStatus` desync reduced from two values to one (PR #38, ADR-0018).**
  Owner ruled the two orphaned values separately because they are not
  symmetric. `MEDICAL_TRANSFER_REQUIRED` is mirrored as a non-terminal
  diversion: enterable from the review/routing span, exiting to any
  `ACTIVE_ORDER` state (including `CLOSED`), deliberately NOT a member of
  `ACTIVE_ORDER`, rationale mandatory. `RETURNED_FOR_MORE_INFORMATION` stays
  deferred and unrepresentable — it presumes an external returning actor,
  which belongs to the open cross-organization submission/receipt packet — and
  remains pinned in `KNOWN_DESYNC` against issue #35. No migration: the schema
  already declared both values.
- **Known limitation recorded, not resolved:** `TransitionCase` is permitted to
  `INTAKE_COORDINATOR` and `ORGANIZATION_ADMIN`, neither of which is a
  clinical role, so a non-clinician can set `MEDICAL_TRANSFER_REQUIRED`.
  Narrowing this needs a per-target-status role mechanism that does not exist.
  See ADR-0018 Consequences.
- **Verification this session:** root **388/389**, app **64/64**, lint,
  typecheck, `prisma validate`, `npm audit` clean. The single root failure is
  `tests/integration/migration-integrity.test.ts`, which fails locally only
  because the shared local `clarity_dev` carries 4 migrations belonging to the
  #30 and #32 branches (issue #31); a read-only ledger query confirmed that
  excluding those 4 rows leaves this branch's 12 exactly, in order, all
  finished and not rolled back. CI's ephemeral Postgres passed the root-test
  step on #36, #37, and #38. Synthetic residue showed zero delta across suite
  runs (28 orgs / 15 cases / 28 users before and after); the standing count
  exceeds issue #24's recorded 7/4 because of accumulation by other worktrees
  and nothing was deleted.
- **Owner rulings this session:** PR #30 (network-enrichment, 2,483 files /
  +1.4M lines, stale CI, expands the `agent_bridge/` tree that ADR-0017 would
  retire) is **held for owner review** — not merged, not edited. Consequently
  AI-operating-model Stage 0.1–0.3 remain HELD, since they rewrite the four
  files #30 touches.
- **Still open:** PR #33 (operating-model plan + ADR-0017) carries four
  unresolved P2 review findings, including an ADR claim that R1 is read-only
  which the plan's own residual-risk text contradicts. PR #29, #32 remain
  open; #18 is draft.

**As of 2026-07-19 (prescreen Phase 3 persistence session)** on branch
`claude/prescreen-phase3-persistence` (from `main` 8399edd, PR pending).
The owner authorized **local-only Phase 3 prescreen persistence** on the S2
precedent — explicitly not the provider-backed Cloud SQL/RLS gate, which
stays open. Delivered (ADR-0016): the prescreen gateway contract is async;
command contracts moved to `domain-contracts` (re-exported unchanged);
four tenant-scoped prescreen tables + a nullable idempotency
`requestFingerprint` column (two migrations, OD-6-shaped RLS on the new
tables); `PrismaPrescreenGateway` in `case-repository` (one tenant-context
transaction per command; namespaced keys `prescreen/<command>/<actor>/<key>`
with the shared ADR-0014 §5 fingerprint; replay reconstructs the original
result; governed-event/outbox storage reuse — no vocabulary expansion; real
tenant-checked `caseId` FK with non-revealing misses). The 9 prescreen HTTP
tests and the dev server now run on the persistent gateway — prescreen
state survives a restart. Session verification: root **353/353** (38
files, three consecutive runs — includes 10 new persistence proofs:
durability across clients, cross-connection replay, nested-body conflict,
one-winner concurrency, zero-residue failure, fail-closed RLS under a
NOBYPASSRLS role), app **64/64**, lint, typecheck, `prisma validate`; zero
residue from this session (pre-existing residue now 26 orgs/13 cases, all
from other sessions — issue #24 updated). Deviations, both tracked: the
two migrations were applied via the Prisma hotfix flow because unmerged
network-branch migrations occupy the shared ledger (issue #31, new), and
the migration-integrity test now asserts its stated intent (repository ⊆
ledger, none rolled back) until #31 resolves. ADR numbering: 0016 taken;
0015 left free for the network branch's collision fix (its PR #29
currently claims the already-assigned 0014). Not claimed: provider-backed
Cloud SQL/RLS, runtime-role app connection (dev connection is superuser),
fresh-ledger replay this session, outbox dispatch for prescreen events,
cross-org, UI, production readiness.

**As of 2026-07-19 (prescreen API-slice session)** on branch
`claude/clarity-opening-cfcdc5`, rebased onto `main` after the prescreen
hardening session (PR #27). The owner resolved the prescreen role-mapping
decision packet (ADR-0014: Option 3 narrow — `INTAKE_COORDINATOR` ≡
Central Intake, `PHYSICIAN_REVIEWER` ≡ authorized practitioner,
external/field roles deferred; first API slice same-organization only).
The same-organization prescreen HTTP slice is implemented on the existing
node:http server with the production role policy and the Phase 2
in-memory gateway. Post-rebase verification this session: root tests
**343/343** (including 38 prescreen-contract, 27 prescreen-service, and 9
new prescreen-API integration tests), app **64/64**, lint, typecheck,
`prisma validate`, zero synthetic residue from this session's runs against
local `clarity_dev`. Pre-existing synthetic residue from earlier sessions
(7 orgs / 4 cases) is tracked as a GitHub issue, not silently deleted.

**As of 2026-07-19 (prescreen hardening session).** Branch verification at the time: root tests **333/333** (including 38 prescreen-contract and 26 prescreen-service tests) against local `clarity_dev`; app tests 64/64; typecheck, lint, `prisma validate`, app build, and all 145 source-package checksums pass. Database residue counts were not remeasured in that pass.

**As of 2026-07-19** on `main` after the review-and-promotion session. Current verification evidence for this slice: root tests 268/268, app tests 64/64, typecheck, root lint, and `npm audit` (0 vulnerabilities) — run locally for PR #14 and re-run by the new CI `verify` job (Postgres-backed) on PR #15 before merge. Earlier bridge tests, app production build, and nested visualizer lint remain historical evidence and were not rerun in this pass. The exact branch, HEAD, and worktree state must be rechecked before each task. A capability appears in exactly one bucket. "Verified" means it ran in the current local verification pass unless a historical count is explicitly labeled.

## Current Clarity Persistence And Coordination Slice

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
- **Bridge:** the active repository-relative Antigravity file-mirror watcher is detected as `listener=running`; direct Antigravity CLI and agent consumption remain unverified.
- **Repository promotion and governance (2026-07-19 session):** the verified slice was promoted to protected `main` via PR #13 (reviewed, merged 7345dd8). PR #14 cleared all Dependabot alerts (vitest ^3.2.6, vite ^6.4.3, @playwright/test ^1.55.1; `npm audit` clean) and carried the H1/H3 replay-classification fix. Redundant PRs #6/#10/#11/#12 were closed as superseded; docs PRs #8 (operating manual + session rules) and #9 (MVP roadmap) were merged. PR #15 added the CI `verify` workflow (lint, typecheck, root + app tests against an ephemeral `clarity_dev` Postgres 16 service, Prisma validate/generate/migrate deploy, high-severity npm audit) and it passed on its own PR before merge. The §3a solo-maintainer protection is now live: PR-only, 0 required approvals with documented self-review, required `verify` status check (strict), conversation resolution, admin enforcement. CI closes the former OD-9 toolchain gap; hosting/backup portions of Phase 6 remain open.

## Prescreen product slice (2026-07-19 session)

- **Package onboarding (PRs #17 and #20):** `clarity-prescreen-integration-package-v1.0.0` is preserved under `reference/source-packages/` with provenance recorded. PR #20 restored `code/tests/transport.test.mjs` to its manifest bytes; all 145 checksums and the 31 reference tests now pass. Historical schema/OpenAPI/fixture evidence was not re-run because no runnable validation script ships.
- **Phase 1 contracts (PR #19 plus post-merge hardening):** repo-native prescreen contracts in `packages/domain-contracts/src/prescreen.ts` — willingness, four-domain orientation + gate, possible-pathway derivation (medical-stabilization precedence; routing hints, never decisions), encounter/assessment lifecycles, target-scoped packet readiness (named gaps, no aggregate score), fail-closed consent-authority and transport-qualification evaluators over configured rules, stable error codes, and an event envelope limited to the six command-coupled event types. Conservative review hardening routes NON_OPPOSED to authorized noncontested review, fails closed on missing privacy regime or overlapping approved consent rules, disqualifies providers with unresolved restrictions, and requires both sending- and receiving-facility approval. 38 unit tests.
- **Phase 2 command service (PR #23, ADR-0013):** `packages/prescreen-service` — six commands (StartPrescreenEncounter, SaveAssessmentDraft, AttestAssessment, CreateAssessmentSupplement, SubmitPrescreen, UpdatePacketRequirement) plus the read-only EvaluateTargetReadiness view, behind strict envelopes → injected explicit role policy → an atomic in-memory gateway (tenant-scoped reads, fresh-row state machine, versioned update, audit + outbox + idempotency committed together; failed commands leave zero residue — proven by test). Canonical recursively-sorted SHA-256 idempotency fingerprints close the reference package's nested-body replay defect. Submission records intent only: no acknowledgement, review, acceptance, admission, transport authority, or cross-organization access is expressible. 27 tests (includes the ADR-0014 §5 fingerprint-amendment test) covering all fourteen owner completion criteria plus post-merge review hardening (`docs/testing/PRESCREEN_SERVICE_TEST_MANIFEST.md`).
- **Role mapping resolved + same-org API slice (this branch, ADR-0014):** the owner ruled Option 3 narrowly — exactly two equivalences (`INTAKE_COORDINATOR` ≡ Central Intake coordinator; `PHYSICIAN_REVIEWER` ≡ authorized practitioner, PMHNP signer authority as configured policy, matrix-conditional capabilities excluded fail-closed), external/field roles deferred to the cross-org design, no enum change. `PRESCREEN_PRODUCTION_POLICY` (compile-checked against `UserRole`) + seven HTTP routes on the existing node:http server: strict bodies mirror the envelopes minus every server-derived field (`organizationId`, `actor`, `occurredAt`, and for submit `receivingOrganizationId` — all principal-derived/server-stamped; supplying any is a 400, and cross-org submission is structurally inexpressible). Stable error-code → status mapping (403/404/409/400, content-free). Phase 2 amendment: the idempotency fingerprint excludes `occurredAt` so HTTP retries replay instead of conflicting; nested-body conflicts unchanged. 9 integration tests over real HTTP with DB-backed auth (`docs/testing/PRESCREEN_API_TEST_MANIFEST.md`).
- **Phase 3 persistence (this branch, ADR-0016):** owner-authorized local bounded slice. Prescreen state persists in `clarity_dev` behind `PrismaPrescreenGateway` and survives restart; RLS (ENABLE+FORCE, fail-closed) covers the four new tables; all Phase 2 guarantees re-proven against Postgres (10 persistence tests + the 9 HTTP tests on the persistent gateway). See `docs/implementation/PRESCREEN_PHASE3_PERSISTENCE_IMPLEMENTATION.md` and `docs/testing/PRESCREEN_PERSISTENCE_TEST_MANIFEST.md`.
- **Not claimed for the prescreen slice:** provider-backed Cloud SQL/RLS evidence (separate, non-waived gate), runtime-role deployment for the app connection (local dev connection is superuser and bypasses RLS; the proof used a NOBYPASSRLS role), outbox dispatch/delivery for prescreen events, UI, cross-organization collaboration, roles beyond the two ruled equivalences, PMHNP scope configuration, clinical/legal approval of any rule content, production readiness.
- **Open decision packets:** the cross-organization submission/receipt model (successor to the resolved role-mapping packet — blocks field-originated prescreens and any external-actor work); consent-rule specificity ordering and fractional-age representation remain domain-review follow-ups in ADR-0013 (until an ordering policy is approved, overlapping consent rules fail closed).

## Completed (verified working)

- **API vertical slice** (`packages/api-service`, pre-decision ADR-0012 spike): the first HTTP entry point uses `node:http` and exposes login/logout/session plus `POST /api/cases/{caseKey}/decision-rationale`. Tenant and actor roles are derived exclusively from the verified principal (`AuthenticationService.authenticate` -> `actorFor`); there is no request field through which a caller can supply either, and unknown body fields are rejected (400). The slice proves one authenticated path from the prototype UI to the command service and Postgres audit trail. It does **not** resolve ADR-0012, which still proposes Fastify and requires owner approval. Verified: 8 API integration tests within the current 258-test root suite; app suite 64/64.

- **Authentication** (`packages/auth-service` + `PrismaAuthGateway`, ADR-0011 — MVP_ROADMAP Phase 3): server-side sessions over the existing `User`/roles model — opaque 32-byte bearer tokens stored only as SHA-256 hashes (returned exactly once, never audited), 8h default expiry, audited timestamp revocation (`SESSION_ISSUED`/`SESSION_REVOKED`, the first organization-level audit events with null caseId); `IdentityProvider` port (managed-IdP/OIDC adapter is deployment-phase work; dev provider is local-only, no passwords stored anywhere); the `principalToActor` bridge sources roles FROM THE DATABASE, retiring the trusted-caller-roles assumption at the authentication boundary (fully dead when the API layer is the sole entry — ADR-0012 Proposed); deactivating a user kills live sessions on the next request; all authentication failures are one indistinguishable error. Permission suites re-run against real session-derived principals. Migration `auth_sessions`. Verified: 8 integration tests, full suite **185/185**, app 37/37, zero residue.

- **Authorization readiness — preparation phase** (`packages/authorization-service` + `PrismaAuthorizationGateway`, ADR-0010 — MVP_ROADMAP Phase 2): RecordAuthorization (initial status DERIVED from the cited benefit quote: required→NOT_STARTED, not-required→NOT_REQUIRED, unknown→rejected; one record per coverage+LOC), TransitionAuthorizationPreparation (structurally limited to PREPARING/NOT_REQUIRED/UNABLE_TO_COMPLETE — SUBMITTED unreachable until the submission phase behind `assertHumanSubmitter`; existing state machine revalidated in-transaction; rationale required off the normal path), and AssessAuthorizationReadiness (pure derived per-coverage view: requirement + named gaps + statuses, **no aggregate score** per the readiness doctrine, verified by test). Migration `authorization_tenancy_and_versioning` (Authorization: organizationId, version); contract addition LEVELS_OF_CARE. Verified: 10 integration tests, full suite **177/177**, app 37/37, zero residue.

- **Manual insurance and benefits verification** (`packages/benefits-service` + `PrismaBenefitsGateway`, ADR-0009 — MVP_ROADMAP Phase 1): four commands (RecordInsuranceCoverage, VerifyEligibility, RecordBenefitVerification, RecordFinancialEducation) — human-performed only, no X12/payer APIs. Coverage requires ≥1 same-case APPROVED INSURANCE evidence item (the ADR-0008 review gate made structural); member/group/policy identifiers are structurally unacceptable input and stored nowhere (`*Encrypted` columns stay NULL until an encryption capability exists); eligibility attempts are immutable rows following the pre-existing eligibility state machine with version-guarded coverage rollup; benefit quotes are impossible to record without the not-a-payment-guarantee disclaimer and only against ACTIVE coverage; education records disclose uncertainties. Migration `coverage_tenancy_and_versioning` (InsuranceCoverage: organizationId, version). Contract correction: SUBSCRIBER_RELATIONSHIPS now mirrors the schema enum (CHILD → PARENT/GUARDIAN). Verified: 16 integration tests, full suite **167/167**, app 37/37, zero residue.

- **Evidence repository and human-review workflow** (`packages/evidence-service` + `PrismaEvidenceGateway`, ADR-0008): nine commands (CreateCandidateEvidence, CorrectCandidateEvidence, ApproveEvidence, RejectEvidence, RequestEvidenceClarification, SupersedeEvidence, CreateContradictionGroup, AddEvidenceToContradictionGroup, ResolveContradictionReview) — entirely human-driven, no OCR/extraction/AI. Evidence binds verbatim source text (immutable by construction) to the exact document version; every item starts CANDIDATE; approval is domain-scoped by category; corrections touch interpretation only; supersession freezes history in one transaction; contradiction groups make conflicts visible without resolving them; optimistic concurrency + idempotency replay (new `objectId` on idempotency records); audit metadata carries hashes and field names, never source text. Migration `evidence_review_and_contradiction_support` (EvidenceItem: organizationId, version, createdBy, creationMethod, reviewerNote, supersededById, evidenceFamilyId; new ContradictionGroup). Verified: 19 evidence tests, full suite **149/149**, app 37/37, zero residue.

- **Case foundation hardening** (this branch): (1) **Atomic assignee validation** (ADR-0005) — the AssignCase TOCTOU window is closed; assignee same-organization + `ACTIVE`-status checks run inside the command transaction and are re-asserted as a predicate on the conditional UPDATE itself; verified incl. a deterministic mid-transaction membership-change interleave (6 new tests). (2) **Reopen authority exact-named** — `ORGANIZATION_ADMIN` + mandatory rationale; `SYSTEM_ADMIN` provably cannot reopen; failed reopens write nothing. (3) **Lint baseline** (ADR-0006) — ESLint + typescript-eslint flat config, root `lint`/`typecheck` scripts, 0 errors. (4) Phase-0 milestone review (`docs/repository-audit/07_…`) and private-remote handoff guide (`docs/developer-handoff/…`); no remote exists, nothing pushed.
- **Document repository** (`packages/document-service` + `PrismaDocumentGateway`, ADR-0004 baseline + ADR-0007 hardening): four commands (UploadDocument, CreateDocumentVersion, ClassifyDocument, AccessDocument) behind the controlled-path pattern — strict envelopes, role policy, file validation (size/MIME/extension/filename, configurable), SHA-256 content-addressed dedupe, version families (migration `20260711141534`: `fileSizeBytes`, `documentFamilyId`; prior versions immutable), classification state machine (REJECTED terminal + rationale + distinct `DOCUMENT_REJECTED` audit), case-ownership checks, access auditing with VIEW/DOWNLOAD modes, sanitized filenames in audit metadata, and storage/DB **failure compensation** (bytes-first + compensating delete guarded by a reference count; `DOCUMENT_UPLOAD_FAILED`/`DOCUMENT_STORAGE_CLEANUP_COMPLETED`). Storage port has two adapters: in-memory and a dev-only `LocalFilesystemObjectStorage` (`.local-object-storage/`, git-ignored, traversal-proof opaque keys). Verified: 32 document tests (14 baseline + 18 hardening), full root suite **130/130**, app suite 37/37, zero residue. No OCR/AI extraction, no malware scanning, no cloud storage.
- **Case command service and workflow transition engine** (`packages/case-service`, branch `feat/case-command-service`): nine explicit commands behind one controlled path — strict envelopes, role policy (schema `UserRole` values), rationale rules, terminal-case protection, reopen gated to exactly `ORGANIZATION_ADMIN` with mandatory rationale (`SYSTEM_ADMIN` has no case-command rights), optimistic concurrency (`version` column + predicate), idempotency keys (`CommandIdempotencyRecord`), correlation ids, and audit events with previous/new state hashes — all atomic per command via the single approved Prisma gateway. Verified: 52/52 integration tests incl. all 12 required behaviors, full suite 91/91 (at the time; now 105/105 with document-service added). ADR-0003.
- **Tenant-scoped case repository** (`packages/case-repository`, branch `feat/tenant-scoped-case-repository`): Prisma-backed `CaseRepository` with organization scoping in every query/write predicate, atomic case-mutation + audit-event transactions, append-only audit writes with the restricted-identifier guard, optimistic concurrency on state transitions. Verified against local `clarity_dev`: 30/30 integration tests, 69/69 full root suite, cleanup leaves zero synthetic rows. See `docs/implementation/CASE_REPOSITORY_IMPLEMENTATION.md` and `docs/testing/CASE_REPOSITORY_TEST_MANIFEST.md`. **Audit integration: implemented** for case mutations (no DB-level immutability enforcement yet; no state hashes).

- `app/` crisis-path prototype: guided intake, drafts with prohibited-language guards, hash-chained custody ledger, compliance clocks (demo values), packet builder, simulated routing, bedboard, role-adaptive UX, and a read-only synthetic Product Studio registry. Current app suite 64/64; typecheck and production build pass. Frontend demo only (localStorage).
- **Louisiana e-PEC lifecycle** (Legal Status workspace): OPC issuance, PEC execution with a configurable exam-validity window check and a hash-sealed fingerprint, a bridge into the existing packet/routing pipeline for transmission and facility acceptance, and CEC execution (continue or discharge-forthwith) — all against a jurisdiction-configurable rule set (`epecRuleSets.ts`) so a second jurisdiction is a new config object, not a code change. Demo logic only; see `docs/legal/LEGAL_STATUS_ARCHITECTURE.md`.
- Canonical foundation Prisma schema: `prisma format` / `validate` / `generate` passed; migration `20260710233252_initial_clarity_foundation` generated and applied to local PostgreSQL 18.4.
- 3 synthetic cases validated (JSON + Zod synthetic-only schema).
- Repository audit trail (`docs/repository-audit/`), canonical doc set, ADR-0001/0002.
- Root safety/workflow test baseline: 39/39 passing.

## Scaffolded (contracts exist; no runtime behind them)

- `packages/domain-contracts`: shared state machines, audit helpers, payer-memory labeling, readiness dimensions, dark feature flags, and seed contracts. Case, evidence, benefits, authorization, document, and auth areas have implemented service foundations; remaining contracts without runtime must be evaluated individually rather than treating the entire package as scaffold-only.

## Documented only (no code)

- Model gateway, retrieval/citations, agent contracts (catalog only - files missing from package), packet approval workflow beyond demo, communications recording, analytics dashboards, production deployment topology, managed identity adapter, evaluation suites beyond the baseline, and expanded 43-model schema domains (WorkflowTask, ReferralPacket, etc.).
- **Clarity CIA integration bundle v1.0.0** (onboarded 2026-07-17 to `reference/source-packages/clarity_cia_integration_bundle_v1_0_0/`): Comprehensive Initial Assessment blueprint — 3-stage treatment-team workflow (field/crisis intake → nursing → social-services integration → final clinical review), 11-role permission model, restricted-capability signer rules, runtime JSON Schema, and orchestration prompts. Requirements it does not cover (per-facility exclusionary/inclusionary criteria and lab standards, physician→NP acceptance delegation, sending-facility nursing report artifact, ambient audio documentation assist) are captured in `docs/workflows/INTAKE_TO_ADMISSION_WORKFLOW.md`; the facility P&P/SOP ingestion pipeline is parked in `docs/roadmap/IMPLEMENTATION_ROADMAP.md` → Parking lot.

## Blocked

- **OD-1:** full master package v0.2.0 (72 of 87 files missing) — blocks re-verification of 12 summary-graded domains and the 7 missing synthetic cases.
- **OD-2:** counsel review of Louisiana statutory wording — blocks any legal-clock enforcement.
- **OD-3:** clinical criteria licensing — blocks necessity criteria mapping.

## Not started

- Production hosting for the app/API/database, managed identity-provider integration, production-wide RBAC/RLS enforcement, production object storage (S3/Blob), malware scanning, live evidence extraction, any live product agent, external integrations, test/lint/build CI, formatter toolchain, observability, and Node version pin. GitHub Pages publishes only the self-contained `docs/index.html` artifact and is not application deployment evidence.

## Requires clinical review

- Assessment content, guardrail vocabulary, bedboard compatibility heuristics, medical-necessity draft prompts.

## Requires legal review

- PEC/OPC/CEC instrument logic (implemented as demo logic, see Completed), compliance-clock configuration, custody/EMTALA language.

## Requires security review

- Everything in SECURITY.md "required controls"; any future integration or deployment.

## Requires developer decision

- OD-5 (API architecture), OD-6 (database hosting/RLS), OD-7 (pnpm/Turborepo timing), OD-8 (expanded-schema graduation), OD-9 (toolchain/CI).

## Next recommended action

~~Case repository~~ ~~case command service~~ ~~document repository~~ ~~foundation hardening~~ ~~evidence repository~~ ~~benefits verification~~ ~~authorization readiness~~ ~~authentication~~ **all done** (ADR-0003…ADR-0011).

**Current action:** The owner-approved prescreen chain now runs durable end-to-end locally: package onboarded (PR #17), Phase 1 contracts (PR #19/#27), Phase 2 command service (ADR-0013), same-org HTTP slice + role ruling (ADR-0014, PR #28), and **Phase 3 local persistence (ADR-0016, branch `claude/prescreen-phase3-persistence` — PR pending)**. Next: (1) merge order for the parallel network-enrichment branch (PRs #29/#30) — it must renumber its ADR off the already-assigned 0014 (0015 left free) and reconcile the shared-ledger contention (issue #31) before or at merge; (2) provider-backed Cloud SQL/RLS verification remains the separate, non-waived gate — still blocked on owner GCP access (`gcloud auth login` + intended project); (3) the cross-organization submission/receipt model is the successor decision packet before any field-originated prescreen or external-actor work; (4) a prescreen UI slice needs an owner scope decision; (5) prior H1/H2/H3, event-vocabulary, OD-6, migration-recovery, and outbox acceptances stand unchanged. Do not add Studio mutation, publication, feature-flag, worker, or deployment controls before server authorization and audit boundaries exist.
