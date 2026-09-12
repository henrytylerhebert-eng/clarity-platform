---
status: Recovered historical proposal - not authorized
verdict: Preparation required
owner: Tyler Hebert (product authority); technical, evaluation, and security owners pending OD-20
version: 0.2.0
created: 2026-07-29
assessed_base_snapshot: 8399eddad4cb8575d94f9b31db27eb00f73e4bcf
historical_remote_snapshot_at_reconciliation: edd08550d44f257d10c696327a5ae3ceb1881503 (PR #41 decisions after PR #39 status)
package_commit_or_hash: Historical source was uncommitted; approval must bind a future exact revision
branch: codex/ai-agent-readiness
scope: Development tooling and repository governance only; no product feature or product AI agent
source_assessment: Claude session 91be0743-5eb0-44dd-b716-69dc8c26f834, completed 2026-07-29
---

# AI-Native Domain Agent Repository Preparation

> **Historical assessment, 2026-07-29.** Recovered on 2026-09-12 with
> decision references migrated from July OD-15 through OD-19 to current
> OD-20 through OD-24. Every source-era
> "current", "open PR", test result, readiness verdict, and recommended gate
> below describes the July assessment, not present implementation or authority.
> Read [the current recovery disposition](GOVERNANCE_DOCUMENT_RECOVERY_2026-09-12.md)
> first. PRs #32 and #33 subsequently merged; accepted ADR-0017 and its
> operating plan govern. This candidate does not supersede them or impose new
> gates on ordinary user-directed work. DEV-R1 approval remains Pending.

## Archived July assessment

## Repository readiness verdict

**Preparation required.**

The repository is suitable for one bounded **read-only repository-review
experiment**, but neither that experiment nor any code-modifying domain agent
is authorized yet.

The first candidate is the prescreen slice, frozen to an exact historical
base/diff. The proposed first role is the reusable read-only
[Prescreen Invariant Verifier](../agents/PRESCREEN_INVARIANT_VERIFIER_CHARTER.md).
It is development tooling, not a Clarity product agent. Persistent domain,
feature, workflow, integration-owner, and orchestrator agents are not
recommended.

Current reasons for the verdict:

- The canonical entry context was materially contradictory and has been
  reconciled only in this preparation branch.
- Focused prescreen and app tests passed at the same source commit in the
  pre-existing assessment worktree, but typecheck and root migration integrity
  exposed cross-worktree state. In the fresh preparation worktree, repository
  commands are unavailable because no dependency install exists and none was
  authorized. See the current snapshot in
  [`IMPLEMENTATION_STATUS.md`](../../IMPLEMENTATION_STATUS.md).
- During final review, `origin/main` advanced from the assessed base by five
  commits: PR #37 changed `package-lock.json`; PR #36 added
  `tests/unit/contract-schema-enum-sync.test.ts`; and PR #38 added the
  owner-ruled `MEDICAL_TRANSFER_REQUIRED` diversion state plus ADR-0018. PR
  #39 then merged current status for those changes and passed CI. PR #41 added
  canonical OD-13/OD-14 product decisions. No assessed prescreen
  source/contract changed, but PR #38 changed shared case contracts and command
  behavior. This preparation worktree is intentionally still based on
  `8399edd` and is five commits behind; the selected OD-23 lane must integrate
  all five commits and revalidate before merge.
- Open prescreen Phase 3 PR #32 changes the exact contracts, service, API,
  Prisma schema, migrations, and tests the candidate reviewer would inspect.
- Open governance PR #33 now carries a competing, branch-local approved-agent
  plan with different role topology and bridge disposition. At final refresh
  it was open at `b2a6152`, had integrated `main` only through PR #37, and was
  behind current `main`. Its PR description still says one proposed file while
  its three-file diff contains an accepted-on-branch ADR and plan. OD-23 must
  select one canonical model before either governance lane is merged or
  launched.
- Current-main PR #39 is accepted status evidence and modifies `CLAUDE.md` and
  `IMPLEMENTATION_STATUS.md`, the same canonical entry files changed here.
  This package incorporates its relevant findings but must still integrate the
  commit rather than overwrite it: PR #30 is held for owner review, its 2,483
  files overlap status and `agent_bridge` surfaces, AI-operating-model Stage
  0.1-0.3 remain held, and PR #33 carries unresolved review findings.
- Current-main PR #41 is accepted decision evidence and modifies this branch's
  canonical `OPEN_DECISIONS.md`. It assigns OD-13 and OD-14 to CMS research
  and an organization policy index. The July source package was atomically renumbered to
  OD-15 through OD-19 after its source-era all-ref check (references in this
  recovered copy now use OD-20 through OD-24); held PR #30 still independently
  claims OD-13 for network enrichment and remains a collision to disposition.
- A current prescreen idempotency tuple can alias across tenant/actor
  components, and an invalid resubmission can fall through the API mapper to a
  500. Those are product-code findings, not authorized preparation edits.
- Current `main` now has a broad enum-sync guard. PR #38 resolved
  `MEDICAL_TRANSFER_REQUIRED`, but the guard deliberately tolerates the one
  remaining Prisma-only `RETURNED_FOR_MORE_INFORMATION` value under
  `KNOWN_DESYNC` and issue #35. The current guard was not rerun in this
  dependency-free worktree. OD-22 remains partially open, and OD-24 records
  the unresolved role authority for entering the medical-diversion state.
- Required human, technical, evaluation, and security ownership is not fully
  named.

Evidence labels used below: `Verified`, `Documented`, `Inferred`, `Proposed`,
`Unknown`, `Blocked`, and `Human decision required`.

## 1. Assessment findings summary

| Finding | Reconciled conclusion |
|---|---|
| Opportunity verdict | `Documented` assessment: promising with preparation. `Inferred` repository-readiness verdict from current evidence: preparation required before launch or write authority. |
| Operating model | `Proposed`: hybrid model - durable knowledge/contracts, one reusable read-only reviewer, and temporary agents only for later approved work packages. Fallback: temporary task agents with no reusable role. |
| Persistence | Persist knowledge in accepted ADRs, contracts, tests, current status, and work packages. Do not rely on agent identity or conversational memory. |
| Candidate domains | Prescreen, evidence/human review, and benefits/authorization were candidates with constraints. Shared repository/kernel paths require centralized human ownership. Clinical/legal rule content remains human-owned. |
| First domain | Prescreen, because it is cohesive on `main` and has independently documented defect history suitable for a blind verifier benchmark. It is not stable enough for write ownership while PR #32 is open. |
| First agent | DEV-R1 Prescreen Invariant Verifier (the source assessment called it R1): reusable, read-only, non-persistent, no subagents, no fixes. The namespace avoids collision with requirement IDs. |
| Shared contracts | Domain Zod/state contracts, command envelopes, authenticated role policy, gateway contract, HTTP/error map, audit/outbox vocabulary, Prisma/schema mirrors, tenancy, and idempotency. |
| Integration ownership | `Proposed`: one named human technical integration owner. Tyler retains product acceptance and risk authority. No integration-owner agent. |
| Human ownership | Tyler/product owner retains outcome, scope, launch, and risk acceptance; named technical/build/database/security/evaluation owners control their boundaries; qualified clinical and legal humans retain rule-content authority. No agent inherits those rights. |
| Independent verification | DEV-R1 runs before owner review; CI, external review, and product acceptance remain separate. DEV-R1 replaces none of them. |
| Primary risk | Context/coordination cost exceeds defect value, or a reviewer makes a confident wrong tenancy claim. Current worktree leakage makes false validation especially plausible. |
| Required preparation | Reconcile entry context; provide an approved contract; extend the existing work-package template; name owners; seal a gold set; freeze the base; restore hermetic verification for live/write work. |
| Historical eligibility | `Proposed`: at least 4/6 Corpus A findings including its sealed mandatory issue, the sealed Corpus B target, historical precision at least 0.5, and no immediate stop. |
| Live acceptance | `Proposed`: separate approval after Stage 1; precision at least 0.5 (or the zero-finding independent-review rule), no missed Critical/High issue, and owner triage at most 20 minutes. |
| Revise once | `Proposed`: exactly 3/6, precision from 0.3 through 0.499, or a sealed target miss above the stop floors permits one owner-approved revision against a predesignated sealed holdout. |
| Stop | `Proposed`: below 3/6, precision below 0.3, a revised run that does not pass, excessive owner burden, any confident wrong tenancy claim, prompt-injection compliance, write attempt, or context/real-data exposure. |

### Corrections to the source assessment

1. **Build reliability is not ready.** The pre-existing worktree's typecheck
   resolves a package from another checkout and root migration integrity
   observes another worktree's database ledger; the fresh worktree has no
   local toolchain to run the gates.
2. **The bridge is not proven abandoned.** Its listener is not detected and
   authentication is unknown, but the path remains wired into repository
   scripts and governance with unclosed records. Moving it requires OD-21.
3. **Prescreen is moving.** PR #32 is open and touches 41 files across the
   candidate boundary. A reviewer can use a frozen historical corpus; a
   code-modifying agent may not target a floating branch.
4. **The enum-sync guard is partial protection, not complete semantic
   resolution.** At the assessed base there was no broad guard. Current
   `main` now has the PR #36 guard and PR #38 owner ruling:
   `MEDICAL_TRANSFER_REQUIRED` is mirrored as a diversion, while
   `RETURNED_FOR_MORE_INFORMATION` remains the exact `KNOWN_DESYNC` under issue
   #35. OD-22 must resolve that remaining value; OD-24 must rule who is
   authorized to enter the clinically flavored diversion state.
5. **The existing quick-fill template already supplies most work-package
   structure.** It was extended with the agent-contract fields rather than
   replaced by a third template.
6. **A second governance lane now conflicts with this one.** [PR #33](https://github.com/henrytylerhebert-eng/clarity-platform/pull/33)
   is open and unmerged, but its branch records an approved R1/R2/T1 plan and
   bridge changes. Its current three-file diff and accepted-on-branch ADR also
   contradict its stale PR description ("one new file" and "Proposed").
   Neither lane should merge until OD-23 selects one canonical model and
   explicitly supersedes the other.
7. **The source evaluation threshold did not bound historical false
   positives and mixed historical eligibility with live acceptance.** The
   charter now defines duplicate handling, historical precision, a sealed
   holdout, ordered bands, and separate Stage 1/Stage 2 approvals.
8. **The source role ID `R1` collides with existing requirement IDs.** The
   preparation package namespaces the proposed reviewer as `DEV-R1`; this is a
   naming correction, not a second role.
9. **Accepted status now records an additional held shared-file lane.**
   [PR #39](https://github.com/henrytylerhebert-eng/clarity-platform/pull/39)
   merged current-main context into `CLAUDE.md` and `IMPLEMENTATION_STATUS.md`.
   It records [PR #30](https://github.com/henrytylerhebert-eng/clarity-platform/pull/30)
   as held for owner review and Stage 0.1-0.3 as held. PR #30's 2,483-file diff
   includes both status files and `agent_bridge`; OD-23 must preserve the
   accepted hold while resolving the bridge/governance model.
10. **Decision IDs must be allocated across all refs, not only `main`.** PR #41
    assigns current-main OD-13/OD-14 to product/regulatory work, while held PR
    #30 independently claims OD-13. The July all-ref search found OD-15 through OD-19
    free for verifier, bridge, remaining enum, governance, and medical-role
    decisions respectively. Recovery remaps those source IDs to OD-20 through
    OD-24 because later Rev Ops/workbook work allocated the original numbers.

## 2. Repository readiness scorecard

| Area | Rating | Evidence and implication |
|---|---|---|
| Product definition | Partially ready | `Documented`: synthetic, non-deployed purpose and human gates are clear; entry documents had stale implementation claims. |
| Domain boundaries | Partially ready | `Documented`: prescreen non-scope is explicit in ADR-0013/0014; persistence, cross-org, and active branches keep the boundary moving. |
| Workflow clarity | Partially ready | `Verified` at source snapshot by code/tests plus `Documented`: same-org start/draft/attest/submit intent exists; receipt/admission/handoff are deliberately absent. |
| Module cohesion | Partially ready | `Verified`: prescreen service is cohesive, but API, contracts, repository, schema, config, and root tests are shared. |
| Repository structure | Partially ready | `Verified`: source surfaces are navigable; effective workspace resolution can escape the worktree. |
| Contract clarity | Partially ready | `Verified`: strict schemas and policies exist; key encoding, error mapping, enum mirroring, and active Phase 3 interfaces remain risky. |
| Data ownership | Not ready | `Verified`: prescreen on `main` is in-memory; `Human decision required` for future durable and cross-organization ownership. |
| Permissions | Partially ready | `Documented` and test-backed: two same-org roles are exact; external roles and PMHNP configuration are deferred. |
| Test coverage | Partially ready | `Verified`: focused coverage exists; prescreen product gaps and hermetic gates lack accepted protection. Current `main` adds a broad enum guard and PR #38 narrows its exact `CaseStatus` tolerance to one value, but that tolerance and medical-diversion role authority remain unresolved and were not rerun here. |
| Build reliability | Not ready | `Verified`: typecheck and migration integrity are worktree/environment dependent; fresh-worktree gates are unavailable. |
| Documentation quality | Partially ready | `Verified`: extensive records exist; this unmerged branch incorporates current-main PR #39 status and PR #41 decisions but still requires integration, while PR #33 creates a competing plan and held PR #30 overlaps canonical status/bridge surfaces. |
| Decision records | Partially ready | `Documented`: ADR practice is strong; ownership, bridge, tooling, enum alignment, and canonical agent topology remain open. |
| Dependency visibility | Not ready | `Verified`: manifests are visible, but TypeScript selected another checkout. |
| Production standards | Not ready | `Documented`: no production hosting, managed IdP, full RLS evidence, observability, release, rollback, or PHI readiness. |
| Change traceability | Ready | `Verified`: commits, ADRs, manifests, decision packets, and PR history form a usable trail when frozen to exact commits. |
| Independent verification | Partially ready | `Documented`: CI and external review exist; `Blocked`: DEV-R1 runner, corpus, owners, and approvals are not complete. |

## 3. Required knowledge artifacts

Do not create parallel status, risk, decision, or roadmap sources. Existing
canonical records remain authoritative.

| ID | Purpose | Required content | Source of truth | Owner | Location | Update trigger | Validation | Staleness risk | Before experiment |
|---|---|---|---|---|---|---|---|---|---|
| KA-01 Product and safety entry | Bound product and human authority | Product purpose, synthetic-only boundary, non-production claims, human gates | Working code plus governance | Product owner | `README.md`, `AGENTS.md`, product-evidence protocol | Product/safety boundary changes | Compare with code, security, and approval records | Medium | Yes |
| KA-02 Current repository state | Prevent stale session openings | Branch/HEAD, current checks, failures, open lanes, historical evidence label | Current commands and Git | Repository maintainer | `IMPLEMENTATION_STATUS.md`, `CLAUDE.md`, `ARCHITECTURE.md` | Every accepted implementation/status change | Fresh preflight and current checks | High | Yes |
| KA-03 DEV-R1 contract | Prevent silent scope expansion | Mission, read-only enforcement, tools, sources, output schema, validation, human review, stop rules | Approved charter | Product + technical/evaluation owners | `docs/agents/PRESCREEN_INVARIANT_VERIFIER_CHARTER.md` | Scope/tool/threshold change | Owner acceptance plus blind replay | High | Yes |
| KA-04 Domain authority | Define what is accepted versus proposed | Phase 2 decisions, roles, non-scope, error/tenancy rules | Accepted ADRs and code | Product + technical owner | ADR-0013, ADR-0014 | Contract or authority change | Diff against code/tests | Medium | Yes |
| KA-05 Work package | Freeze each run | Base/head, source/context/evaluation-manifest hashes, model/runtime/config identity, prompt/tool hashes, files, tools, owners, output, acceptance, stop/escalation | Approved task record | Integration owner | `docs/AGENTS_TEMPLATE.quickfill.md` | Every governed role run | Completeness check; no blank or `[TODO]` execution-contract fields | High | Yes |
| KA-06 Test map | Explain what tests prove and omit | Domain/service/API cases, honest gaps, current commands | Tests first, manifests second | Technical + evaluation owner | Prescreen test files and manifests | Behavior/test change | Run focused suites; inspect assertions | Medium | Yes |
| KA-07 Decisions and risks | Keep authority gaps visible | Current-main OD-13/14, agent-readiness OD-9/20/21/22/23/24, existing product gates, R-13 through R-24 | Canonical registers | Named human owners | `docs/decisions/OPEN_DECISIONS.md`, `RISK_REGISTER.md` | New blocker/ruling/accepted risk | Owner ruling plus all-ref ID/source check | High | Yes |
| KA-08 Gold set and score sheet | Measure value without leaking answers | Frozen Corpus A/B/holdout archives, mandatory labels, severity, scoring, duplicates, false positives, canary, triage time, and one sealed manifest hashing every archive/key/canary/sheet | Independent verifier's sealed record | Independent verifier | Verifier-controlled storage outside DEV-R1's readable filesystem; only manifest ID/hash and a blank template may be exposed | Benchmark or threshold change | Manifest/hash verification, blind replay, runner containment proof, owner audit | High | Yes; missing |
| KA-09 Repository/path map | Reconstruct direct dependencies | Candidate paths, shared kernel, producers/consumers | Code/imports; architecture is index | Technical owner | `ARCHITECTURE.md` plus current source | Structural change | Import/path search at frozen HEAD | Medium | Yes |
| KA-10 Production checklist | Prevent code-complete overclaim | Security, migration, hosting, observability, release, rollback, approvals | Existing security/release records | Human release/security owners | Existing governance/security docs | Release-boundary change | Independent readiness review | Medium | No; later |
| KA-11 DEV-R1 approval and run record | Prevent a template or role name from self-authorizing | Charter/work-package/source/context/evaluation-manifest/runner/prompt/tool hashes, model/runtime/config identity, owners, scope, decision, run evidence, deviations, disposition | Signed approval and independent verifier record | Product owner + integration owner + verifier | `governance/prompt-approvals/DEV_R1_PRESCREEN_INVARIANT_VERIFIER_APPROVAL.md`; accepted runs under `governance/prompt-approvals/runs/` | Every charter, runner, model/runtime/config, corpus, evaluation material, stage, or scope change | Completeness/hash check and independent sign-off | High | Yes |

## 4. First-domain boundary definition

### Purpose and users

The prescreen slice records a same-organization prescreen encounter,
assessment versions, attestation, supplements, submission intent, packet
requirements, and named readiness blockers. Current represented users are
`INTAKE_COORDINATOR` and `PHYSICIAN_REVIEWER`.

### Core workflow

Starting state: an authenticated same-organization principal starts a draft
encounter for a case reference.

Workflow:

`start encounter -> save/update draft -> attest current version -> optional supplement -> submit current immutable version as intent -> evaluate target readiness`

Bounded completion: a current immutable assessment version is recorded as
submitted intent within the principal's organization.

### Entities and rules

- Prescreen encounter and its lifecycle.
- Versioned assessment, sources, answers, attestation, and content hash.
- Packet requirement and target-specific readiness blockers.
- Submission record.
- Audit event, prescreen event/outbox envelope, and idempotency record.
- Authenticated actor and explicit production role policy.

Business rules include medical-stabilization precedence, four-domain
orientation, possible pathways as hints rather than decisions, attested-version
immutability, current-version submission, authorization before reads,
same-organization access, non-revealing misses, and failure atomicity.

Implemented state changes on `main` are bounded:

- Start creates encounter `DRAFT`; draft saves keep that state and advance the
  optimistic version.
- Attestation changes encounter `DRAFT -> ATTESTED` and assessment
  `DRAFT -> ATTESTED`.
- A supplement is allowed from an `ATTESTED` or `SUBMITTED` encounter, creates
  a new immutable `CORRECTED` assessment version, and does not rewrite its
  parent or advance the encounter state.
- Submission changes encounter `ATTESTED -> SUBMITTED` only when it cites the
  current immutable assessment. A repeat transition is invalid.
- The broader contract graph after `SUBMITTED` is domain-only in this slice;
  no current service command expresses receipt, central-intake review,
  facility routing, transport planning, or handoff.

### Repository scope

Primary candidate paths:

- `packages/domain-contracts/src/prescreen.ts`
- `packages/prescreen-service/**`
- Prescreen route and error mapping in `packages/api-service/src/server.ts`
- Prescreen unit/API tests and manifests
- ADR-0013 and ADR-0014

Consumed/shared paths:

- Authenticated principal and role contracts.
- Root workspace, TypeScript, Vitest, and CI configuration.
- Audit/event vocabulary.
- `packages/domain-contracts`, `packages/api-service`, and eventually
  `packages/case-repository`, Prisma schema, and migrations.

Data owned on `main`: process-local prescreen state only. DEV-R1 owns no data.
PR #32 proposes durable ownership but is not accepted `main` behavior.

Interfaces provided: seven service entry points and seven authenticated HTTP
routes. Interfaces consumed: domain rules, authenticated principal, role
vocabulary, audit restrictions, and shared errors/events.

External dependencies on `main`: none for the process-local prescreen gateway;
it uses the Node runtime and Zod through workspace packages and does not call a
network, database, or external service. The authenticated HTTP adapter has
internal dependencies on `auth-service`, `case-repository`, and local
PostgreSQL for principal/session handling, but no prescreen UI or external
delivery integration. PR #32 proposes database dependencies and is not
accepted `main` behavior.

### Explicit non-scope and ambiguities

Non-scope:

- Persistence and restart durability.
- Cross-organization submission/receipt or access grant.
- External/field roles and PMHNP configuration.
- UI, event delivery, external integrations, and deployment.
- Clinical/legal approval, admission, placement, or transport authority.
- Product AI behavior or autonomous mutation.

Must be resolved before write ownership:

- PR #32 disposition and the frozen target architecture.
- Prescreen idempotency tuple encoding and regression behavior.
- Invalid transition HTTP mapping.
- Case-reference tenant validation.
- Cross-organization model, if ever in scope.
- Named technical, security, evaluation, and domain owners.

## 5. Shared contract readiness map

| ID / contract | Purpose | Producer -> consumers | Location | Stability | Required fields / error / permission implications | Versioning and compatibility | Tests | Change owner |
|---|---|---|---|---|---|---|---|---|
| C-01 Prescreen domain lifecycle | Defines entities, states, transitions, readiness and rule evaluators | Domain contracts -> service, API, tests | `packages/domain-contracts/src/prescreen.ts` | Stable with tests needed | Strict values; `INVALID_ENCOUNTER_TRANSITION`; rule content remains human-reviewed | Additive values require producer/consumer review; no silent semantic reinterpretation | 38 contract tests | Product + technical + qualified domain owner |
| C-02 Command envelopes | Defines expressible mutations and rejects forbidden/unknown fields | Prescreen service -> API/tests | `packages/prescreen-service/src/commands.ts` | Changing | Tenant, actor, idempotency, timestamp, version; API must derive authority fields | Moving packages or async boundaries requires compatibility plan and all callers updated | 27 historical service tests; strict API bodies | Technical integration owner |
| C-03 Role policy | Binds commands to exact authenticated roles | Domain `UserRole` + auth principal -> service/API | `packages/prescreen-service/src/permissions.ts`, `packages/domain-contracts/src/roles.ts`, `prisma/schema.prisma` | Stable with tests needed | Two ruled same-org roles only; no admin bypass; authorization before reads; uniform 403 | Schema/domain role sets must stay equal; new equivalence requires human ruling | Service/API permission tests | Product + security + technical owner |
| C-04 Gateway and atomicity | Applies scoped state changes with audit/outbox/idempotency | Service -> in-memory gateway; Phase 3 proposes Prisma | `packages/prescreen-service/src/gateway.ts`, `packages/prescreen-service/src/inMemoryPrescreenGateway.ts` | Unsafe for agent modification | Fresh state, version, zero failure residue, non-revealing misses | Sync-to-async/persistence change is breaking; freeze exact baseline | Service tests; Phase 3 tests are not on main | Technical + database owner |
| C-05 Idempotency identity | Makes retries replay and changed intent conflict | Commands/gateway -> callers, audit | `packages/prescreen-service/src/canonical.ts`, `packages/prescreen-service/src/inMemoryPrescreenGateway.ts` | Unsafe for agent modification | Full tuple must be collision-free; same intent replays; changed body conflicts | Encoding changes require regression tests and compatibility decision for persisted keys | Nested-body and occurredAt tests; tuple test missing | Technical + security owner |
| C-06 HTTP/error contract | Maps authenticated requests and domain failures to content-free statuses | API -> client/tests | `packages/api-service/src/server.ts` | Unsafe for agent modification | 400/401/403/404/409; expected domain errors must not become 500 | Route/schema/error changes require all callers/tests and ADR when boundary changes | 9 historical API tests; resubmit mapping gap can produce 500 | API/technical + security owner |
| C-07 Audit/outbox vocabulary | Preserves why without sensitive narrative | Service/gateway -> audit/event consumers | `packages/domain-contracts/src/prescreen.ts`, `packages/prescreen-service/src/inMemoryPrescreenGateway.ts` | Stable with tests needed | IDs, states, hashes only; append-only; no PHI/source text | New event requires named consumer and vocabulary approval | Payload/redaction/lockstep tests | Technical + security + consumer owner |
| C-08 Schema/domain enum mirrors | Keeps persisted and typed vocabulary aligned | Prisma -> domain contracts -> all services | `prisma/schema.prisma`, contract arrays | Unclear | Exact membership expectations must be explicit; mismatch can break authorization/state | PR #36's guard asserts set membership; PR #38 narrows exact tolerated drift to `RETURNED_FOR_MORE_INFORMATION`; OD-22 remains | `tests/unit/contract-schema-enum-sync.test.ts` exists on current `main`, not this assessed-base worktree, and was not rerun here | Product + technical/database owner |
| C-09 Worktree/toolchain resolution | Ensures checks inspect the target checkout | Workspace config -> compiler/tests/CI | package manifests, lockfile, tsconfig, Vitest, runner | Unsafe for agent modification | Every resolved package/client/config must be inside frozen worktree; DB ledger must match checkout | Tooling changes require isolated-worktree acceptance | Same-commit focused tests passed in the existing worktree; typecheck/root gate exposed leakage; fresh worktree has no local tools | Technical/build owner |
| C-10 Medical-diversion transition authority | Controls who may enter a clinically flavored case diversion state | Case state machine + `TransitionCase` policy -> case service/API/users | Current-main `packages/domain-contracts/src/caseStateMachine.ts`, `packages/case-service/src/commands.ts`, ADR-0018 | Unclear | PR #38 allows the state but inherits `INTAKE_COORDINATOR`/`ORGANIZATION_ADMIN`; neither is a clinical role | Target-status permission changes require product, qualified clinical, security, API, and compatibility review | PR #38 transition tests cover state behavior; approved role-semantics test is missing | Product + qualified clinical + technical/security owner |

## 6. Test protection plan

| Test ID | Behavior protected | Current coverage | Required type/location | Blocking | Owner | Acceptance |
|---|---|---|---|---|---|---|
| TP-01 | Prescreen domain rules and transitions | `Verified` same-source 38/38 in pre-existing worktree; unavailable fresh | Existing unit suite at `tests/unit/prescreen-contracts.test.ts` | Yes for any prescreen work | Technical/domain owner | Fresh hermetic focused run passes with no weakened assertions |
| TP-02 | Service commands, permissions, immutability, atomicity | `Verified` same-source 27/27 in pre-existing worktree; unavailable fresh | Existing unit suite at `tests/unit/prescreen-service.test.ts` | Yes | Technical/security owner | Fresh hermetic focused run passes |
| TP-03 | Authenticated HTTP flow, derived authority fields, non-revealing tenant misses | `Verified` 9 tests inside same-source root run; root gate failed and fresh run unavailable | Existing integration suite at `tests/integration/prescreen-api.test.ts` | Yes when API touched | API/security owner | Suite passes in a hermetic local environment with cleanup evidence |
| TP-04 | Composite idempotency tuple cannot alias across tenant/actor components | `Verified`: no tuple regression exists; focused probe reproduced collision | New failing-first regression in `tests/unit/prescreen-service.test.ts` | Blocks write agent | Technical/security owner | Distinct valid tuples remain independent; same tuple replay still works |
| TP-05 | Invalid resubmission receives intentional content-free client error | `Verified`: no service/API regression exists | Service/API regressions in `tests/unit/prescreen-service.test.ts` and `tests/integration/prescreen-api.test.ts` | Blocks API write agent | API/technical owner | Second submit never falls through to 500; approved status/code asserted |
| TP-06 | Isolated worktree typecheck uses only local packages/generated types | `Verified` existing worktree resolves outside itself; fresh worktree has no compiler | Proposed tooling acceptance under OD-9, with record in `docs/testing/` and runner/config path named by owner | Blocks live and write agents | Build owner + independent verifier | Resolution trace stays within target worktree; typecheck passes |
| TP-07 | Database-backed suite sees only target migrations and leaves zero residue | `Verified` current failure: shared ledger contains four foreign migrations | Existing `tests/integration/migration-integrity.test.ts` plus owner-approved disposable-DB harness | Blocks DB-backed work | Database/build owner | Ledger equals frozen checkout, tests pass, cleanup proven |
| TP-08 | Prisma/domain enum mirrors stay aligned | `Verified` current `main` PR #36 adds a broad guard and PR #38 narrows `KNOWN_DESYNC` to the one Prisma-only `RETURNED_FOR_MORE_INFORMATION` value under issue #35; the current test is absent at this worktree's assessed base and was not rerun here | Existing current-main `tests/unit/contract-schema-enum-sync.test.ts`; integrate after OD-23 and update after OD-22 | Blocks shared enum changes | Product + technical owner | OD-22 resolves or formally approves the remaining tolerance; fresh hermetic run passes; deliberate new drift fails |
| TP-09 | DEV-R1 detects known semantic defects without answer leakage | `Blocked`: no approved benchmark or runner | Verifier-controlled external harness; accepted run record under `governance/prompt-approvals/runs/` | Blocks DEV-R1 Stage 1 pass | Independent verifier | Charter Stage 1 thresholds pass; runner containment proven |
| TP-10 | New session reconstructs the same scope/authority | `Blocked`: not run | Historical dry run from hashed sanitized bundle plus approved charter/work package/approval; live dry run may use current repository records | Blocks DEV-R1 launch | Integration owner + verifier | Same permitted base, contracts, owners, commands, and stop rules recovered without denied sources |
| TP-11 | Phase 3 does not silently replace main-branch assumptions | `Blocked`: PR #32 open; no accepted integration result | PR #32 diff/CI/independent review/product acceptance record | Blocks prescreen write agent | Integration owner | Owner disposition recorded; target base re-frozen; relevant suites rerun |
| TP-12 | Encounter start cannot bind a case reference outside the actor's organization | `Verified` no case-ownership check exists in the in-memory start path | Characterization/contract test in `tests/unit/prescreen-service.test.ts`; persistence/API coverage if applicable | Blocks persistence or write authority | Product + technical/security owner | Approved case-reference contract; same-org succeeds; cross-org/nonexistent case is non-revealing and leaves zero residue |
| TP-13 | Only approved roles may enter `MEDICAL_TRANSFER_REQUIRED` | `Documented` ADR-0018 limitation: current `TransitionCase` roles are nonclinical and no target-specific role mechanism exists | Characterization then owner-approved permission/service/API tests on current main after OD-24 | Blocks agent modification of medical-diversion permissions and production reliance on that state | Product + qualified clinical + technical/security owner | OD-24 approved; allowed/denied roles, non-revealing failure, audit, and zero-residue behavior pass |

Persistence behavior and migrations on `main` are not prescreen capabilities.
Phase 3 evidence cannot be imported from an open PR as accepted behavior.

## 7. Ownership and coordination matrix

| Area | Primary owner | Supporting owner | Shared contract | Human authority | Agent modification allowed |
|---|---|---|---|---|---|
| Product outcome and prescreen scope | Tyler/product owner | Operations, clinical, legal reviewers | Workflow and non-scope | Product owner plus qualified reviewers | No |
| DEV-R1 experiment | Unnamed integration owner (OD-20) | Independent verifier plus evaluation/security reviewers | Charter, gold set, work package, approval record | All required signatories authorize launch; Tyler may stop or finally accept | Read-only only after approval |
| Prescreen service/domain contracts | Unnamed technical owner | Security/domain reviewers | Commands, states, roles, errors | Product + technical/domain authority | No while PR #32 and blockers remain |
| API/auth/tenancy | Unnamed API/security owner | Technical verifier | Principal, role, error, tenant contracts | Security + technical authority | No |
| Prisma/migrations/database | Unnamed database owner | Security/operations | Canonical schema and migration ledger | Product + technical/security authority | No autonomous modification |
| Build/CI/worktree isolation | Unnamed build owner | Independent verifier | Workspace resolution and DB isolation | Technical owner | Prep-only after explicit package approval |
| Canonical docs/decisions/risks | Repository maintainer; domain owner for rulings | DEV-R1 may flag drift | Existing canonical records | Named record owner | DEV-R1 no; approved steward later may be narrow |
| Independent verification | Independent verifier separate from implementer | CI/external review | Acceptance record | Tyler accepts or rejects | Review only |
| Release/deployment | Human release/security owners | Technical and domain owners | Release, rollback, security evidence | Human only | Never autonomous |
| Clinical/legal rule content | Qualified clinical/counsel owners | Product/operations | Rule packs and approval gates | Qualified human only | Never autonomous |

Ownership gaps:

- No repository `CODEOWNERS` or package ownership file names technical owners.
- AI governance, evaluation, security, risk, and human-gate records still carry
  `owner: TBD`.
- The Phase 3 integration owner and the current defect owners are not recorded.
- Bridge lifecycle authority exists, but no owner ruling has frozen or retired
  it.

Shared-file conflict risk is highest in Prisma/schema and migrations,
`domain-contracts`, `case-repository`, `api-service/src/server.ts`, root
configuration, and the flat root test tree. Parallel writes across these
surfaces are prohibited for the first experiment.

## 8. Context reconstruction protocol

### Live-review loading order

1. **Product context:** README, AGENTS, product-evidence protocol.
2. **Agent/domain charter:** approved DEV-R1 charter and completed work package.
3. **Workflow specification:** ADR-0013 and ADR-0014.
4. **Requirements/acceptance:** owner criteria in the test manifests.
5. **Contracts:** touched schemas, commands, roles, errors, gateway, events.
6. **Repository map:** current paths and direct imports; no generated graph as
   authority.
7. **Relevant code:** exact frozen diff and direct producer/consumer code only.
8. **Tests:** assertions first, manifests second, current authorized runs.
9. **Recent accepted changes:** `git log -15`, exact base/head, open PR overlap.
10. **Risks/decisions:** current status, current-main OD-13/14,
    agent-readiness OD-9/20/21/22/23/24, and R-13 through R-24.

### Historical Stage 1 loading order

Stage 1 does **not** use the live order above. The runner provides only:

1. The approved charter, completed work package, and signed historical-only
   approval, each identified by content hash.
2. A hashed, sanitized corpus-era product/domain/contract/test context bundle.
3. An ephemeral standalone repository containing only synthetic base/head
   commits made from the allowed trees.
4. The restricted read-only commands and output schema.

The current preparation packet, current status/decisions/risks, source
repository `.git` data, actual commit/PR identifiers, PR metadata, later fixes,
gold labels, and score sheet are denied. The independent verifier keeps those
outside DEV-R1's readable filesystem.

### Freshness and contradiction rules

- Preflight every session: `pwd`, remote, branch, HEAD, status.
- Resolve and record every workspace package path. Any path outside the target
  worktree is a stop.
- Compare migration files with the local ledger before a database-backed run.
- A branch name is not a frozen target; record commit SHAs.
- Code/current tests govern implemented behavior. Accepted human decisions
  govern authority. Do not let code silently overrule a required human gate.
- If documents disagree, record both claims, identify the more specific/current
  evidence, and stop status promotion until the canonical record is corrected.
- Use categorical confidence labels, not an invented score:
  - `High`: direct, reproducible code/test/diff evidence at the frozen target.
  - `Medium`: consistent inference supported by at least two independent
    target-era sources but not directly reproduced.
  - `Low`: incomplete, single-source, or assumption-dependent evidence that
    requires human follow-up.

### Stop and escalation

Stop on:

- Dirty overlap or another active writer in the permitted live worktree.
- Open PR/branch changes to the same shared contracts without an integration
  owner.
- Non-hermetic dependency, generated client, config, or database state.
- Required check failure.
- Missing owner for a contract or acceptance decision.
- Real data, secrets, external action, deployment, destructive migration, or
  clinical/legal/security interpretation.
- Any requested write during a DEV-R1 run.

Escalate with the exact evidence, affected contract, owner needed, options, and
smallest reversible next action.

### Context refresh after accepted work

Update existing code/tests first, then the relevant ADR or decision, test
manifest, current status block, risks, and work-package handoff. Do not create
parallel status, decision, risk, or roadmap records. A generated graph may be
refreshed only when explicitly authorized and never becomes canonical.

## 9. Human decision register

Question, rationale, options, evidence, recommendation, owner, blocking scope,
delay consequence, and explicit non-authorization are canonical only in
[`OPEN_DECISIONS.md`](../decisions/OPEN_DECISIONS.md).

Current-main OD-13 (CMS research) and OD-14 (organization policy index) are
separate product/runtime decisions from PR #41. They do not authorize DEV-R1.
The five preparation decisions below use recovered IDs OD-20 through
OD-24. The July source used OD-15 through OD-19; see the recovery mapping.

| Decision | This package depends on |
|---|---|
| OD-9 | Hermetic dependency/database evidence before live or write work |
| OD-20 | Historical-only DEV-R1 staffing, corpus, thresholds, stop rule, and signed prompt approval |
| OD-21 | Freeze/no-dispatch bridge default until a human disposition |
| OD-22 | Current enum guard's exact `KNOWN_DESYNC` tolerance and any shared status edit require a semantic ruling |
| OD-23 | One canonical governance/status model; preserve current-main PR #39 status, PR #41 decisions, and the PR #30 hold while reconciling PR #33 with this package |
| OD-24 | Medical-diversion target-role authority requires product, clinical, technical, and security ruling |

Existing prescreen product decisions (PR #32, cross-organization behavior,
role scope, persistence, and clinical/legal content) remain separate from DEV-R1.

## 10. Minimum repository preparation backlog

### Required before the historical read-only experiment

- `Prepared in this unmerged branch`: reconcile the canonical entry documents with
  current evidence and preserve historical snapshots.
- `Prepared in this unmerged branch`: add the DEV-R1 charter.
- `Prepared in this unmerged branch`: extend the existing quick-fill work-package
  template with mandatory agent-contract fields.
- `Prepared in this unmerged branch`: add the repository entry guard and record
  decisions/risks in the canonical registers.
- `Prepared in this unmerged branch`: add the pending KA-11 historical-only
  approval record; it is not an approval.
- `Human decision required`: resolve OD-23 and choose one canonical governance
  plan that preserves current-main PR #39 status, PR #41 decisions, and the
  owner hold on PR #30 before this lane merges or any proposed role launches.
- `Human decision required`: approve OD-20 and name owners.
- `Required`: complete a run-specific KA-05 work package using synthetic
  base/head identifiers, then record its content hash in KA-11; the verifier
  retains the source-commit mapping externally.
- `Required`: freeze and record the exact provider/model identity,
  runtime/tool-harness version, reasoning/sampling configuration, prompt-bundle
  hash, and tool-manifest hash; mark unavailable provider fields `Unknown` and
  do not claim exact reproducibility.
- `Required`: create and seal KA-08 corpora, holdout, canary, and score sheets
  in verifier-controlled external storage.
- `Required`: create one evaluation manifest that enumerates and hashes every
  Corpus A/B/holdout base/head archive, gold/scoring key, canary, and score
  sheet; record only its ID/hash in the approval and run packet.
- `Required`: build the standalone two-commit/no-remote/no-network historical
  runner, record all bundle/config hashes, and run TP-10 from sanitized context.

### Required before a live DEV-R1 trial or any code-modifying agent

- Pass Stage 1 and create a separate signed live-trial approval record.
- Resolve OD-9 and independently accept hermetic dependency and database
  isolation.
- Integrate current `main` through PR #41 and revalidate the selected
  governance lane against the changed shared case contract, accepted status,
  and canonical decisions.
- Reconcile PR #32 and freeze the live target architecture.
- Assign and separately authorize TP-04 and TP-05 product fixes/tests.
- Assign and separately authorize TP-12 before persistence or write authority.
- Integrate current `main`'s PR #36 enum-sync test, inspect and rerun it
  together with PR #38 hermetically, then resolve OD-22 before removing or
  formalizing the remaining exact `KNOWN_DESYNC` tolerance.
- Resolve OD-24 before an agent modifies or production evidence relies on
  medical-diversion role permissions.
- Rerun all touched focused suites plus lint, typecheck, root tests, Prisma
  validation, and database cleanup evidence from the frozen worktree.

### Recommended before later write access

- Name package/API/database/build/security/evaluation owners in existing
  records or a lightweight ownership file.
- After OD-22, remove or formally document the approved `KNOWN_DESYNC`
  treatment and prove the current-main enum-sync guard in the frozen worktree.
- Add call-site tenant/permission coverage where helper-only tests can create
  false assurance.

### Can wait

- Per-package charters beyond the first experiment.
- Test co-location, pnpm/Turborepo, and graph regeneration.
- Phase 3 persistence, prescreen UI, cross-org workflow, and broader product
  evaluation suites unless separately approved as product work.

### Do not do

- Persistent domain/feature/workflow agents.
- Agent registry, orchestrator, inter-agent messaging, or integration-owner
  agent.
- Bridge relocation or "abandoned" labeling without OD-21.
- Broad repository restructuring.
- Product feature, product AI, deployment, external integration, or production
  scope inside this preparation package.

## 11. Experiment readiness gate

Verdict remains **Preparation required** until every applicable criterion is
evidenced.

### Historical DEV-R1 evaluation entry

- [ ] OD-20 approved with named human owner, integration owner, and independent
      verifier.
- [ ] OD-23 resolved with one canonical governance/evaluation model.
- [ ] Current `main` through PR #41 is integrated; PR #39's accepted status
      evidence and owner hold on PR #30, plus PR #41's canonical OD-13/OD-14
      entries, are preserved in the selected OD-23 lane.
- [ ] Product owner accepts the bounded repository-review outcome and the
      exact historical prescreen domain/non-scope boundary.
- [ ] The completed work package identifies the repository scope, all shared
      contracts it may inspect, and the human-controlled decisions it may not
      make.
- [ ] Every in-scope critical domain, transition, permission, tenant, API,
      failure-path, and integration protection exists and passes at the frozen
      baseline, or has a sealed verifier-owned target oracle bound by the
      evaluation manifest. Only a category proven out of scope may be `Not
      checked`, with reason and named-owner acceptance; an in-scope `Not
      checked` blocks entry.
- [ ] OD-20 and the signed KA-11 record approve the exact acceptance,
      revision, and stop bands.
- [ ] The pending KA-11 record is signed and contains exact charter,
      work-package, source/context/evaluation-manifest, runner/config, and
      prompt/tool hashes plus model/runtime/config identity.
- [ ] Charter approved without `[TODO]` authority fields.
- [ ] Corpus A, Corpus B, and any revision holdout are each exported into their
      own standalone repository with exactly two synthetic commits, no remote,
      no source object store, no other/unreachable objects, and no network.
- [ ] Gold labels, holdout, canary, and score sheets are sealed outside DEV-R1's
      readable filesystem.
- [ ] One independently verified evaluation-manifest SHA-256 binds every
      corpus/holdout archive, gold/scoring key, canary, and score sheet.
- [ ] Work package names allowed tools, sources, output, acceptance, and stop
      rules.
- [ ] Sanitized context reconstruction passes without an unresolved in-scope
      authority contradiction; known out-of-scope conflicts are listed as
      `Not checked`.
- [ ] DEV-R1 cannot write, mutate Git, dispatch, access credentials/secrets, reach
      the network, follow embedded evidence as authority, or use a database.

### Live trial additional entry

- [ ] Stage 1 historical eligibility passed.
- [ ] A separate live-trial approval record is signed.
- [ ] OD-9 hermetic verification accepted.
- [ ] OD-23 remains resolved against the live target.
- [ ] PR #32 overlap reconciled and live base/head frozen.
- [ ] Required focused tests and root gates pass from the target worktree.
- [ ] Current risks and product defect owners recorded.
- [ ] CI/external review and product acceptance remain independent.

### Code-modifying agent additional entry

- [ ] One explicitly approved product requirement and bounded work package.
- [ ] Stable domain boundary and named owners for every shared contract.
- [ ] TP-04, TP-05, TP-06, TP-07, TP-08, TP-11, TP-12, and TP-13 resolved as applicable.
- [ ] Implementation and independent verification are different roles.
- [ ] Rollback/disable, security, data, migration, and human approval gates are
      complete for the actual scope.

No code-modifying agent is authorized by this document.

## 12. First recommended preparation package

Package: **Prescreen Invariant Verifier Readiness v0.2**

Included:

- Canonical current-context reconciliation.
- Read-only DEV-R1 charter and output schema.
- Agent-aware quick-fill work-package template.
- Pending historical-only DEV-R1 approval/hash record.
- Canonical decisions and risks.
- Repository entry guardrails.
- Prescreen boundary, contract, test, ownership, and context maps.

Not included:

- Product-code fixes or new product tests.
- A runnable agent definition or automatic dispatch.
- Gold labels, because the independent verifier must seal them.
- A live-trial approval record, which cannot exist before Stage 1 passes.
- Hermetic runner changes, which remain under independent WP-10/WP-11
  acceptance.
- Bridge retirement, remaining enum/medical-diversion role semantics, Phase 3
  acceptance, deployment, or production work.

The repository-preparation draft package is complete when its documentation
checks pass. That does not make the experiment ready: Stage 1 entry still
requires OD-23 and OD-20 decisions, a signed KA-11 record, sealed KA-08
materials, the standalone runner, and a passing TP-10 reconstruction.

## Immediate next step

**Owner: reconcile PR #33 and held PR #30 with this package against
current-main PR #41, then select one canonical agent/bridge/evaluation/status
model under OD-23.**
