---
status: Living document
owner: TBD
version: 1.2.0
last_integrated: 2026-07-29
source_artifacts:
  - docs/06-architecture-review.md (Jul 8 findings + unknowns)
  - docs/repository-audit/03_CONFLICT_REGISTER.md, 03_GAP_ANALYSIS.md
  - docs/developer-handoff/AI_NATIVE_DOMAIN_AGENT_REPOSITORY_PREPARATION.md
  - https://github.com/henrytylerhebert-eng/clarity-platform/pull/30
  - https://github.com/henrytylerhebert-eng/clarity-platform/pull/32
  - https://github.com/henrytylerhebert-eng/clarity-platform/pull/33
  - https://github.com/henrytylerhebert-eng/clarity-platform/pull/36
  - https://github.com/henrytylerhebert-eng/clarity-platform/pull/37
  - https://github.com/henrytylerhebert-eng/clarity-platform/pull/38
  - https://github.com/henrytylerhebert-eng/clarity-platform/pull/39
  - https://github.com/henrytylerhebert-eng/clarity-platform/pull/41
source_snapshot: 8399eddad4cb8575d94f9b31db27eb00f73e4bcf
live_remote_snapshot: edd08550d44f257d10c696327a5ae3ceb1881503 (PR #41 decisions after PR #39 status)
unresolved_conflicts: "Package 18-open-decisions-and-risks/OPEN_DECISIONS.md missing — this file re-seeds it"
related_requirements: —
related_adrs: ADR-0001, ADR-0002
---

# Open Decisions

| # | Decision needed | Owner type | Blocking |
|---|---|---|---|
| OD-1 | Obtain the full master package v0.2.0 (72 files missing); re-run comparison for 12 summary-graded domains | Product owner | Canonical status of agent/API/UI/eval/commercial domains |
| OD-2 | Louisiana statutory wording, official forms, trigger/duration language | Counsel | Any legal-clock or instrument enforcement |
| OD-3 | Clinical criteria licensing (InterQual/MCG or payer-specific) and clinician governance of assessment content | Clinical + legal | Medical-necessity criteria mapping |
| OD-4 | Product naming: "Clarity", "Clarity MH", "Clarity AI", "Clarity Crisis Platform" all appear; pick one | Product owner | Branding in docs/UI |
| OD-5 | Reconcile the accepted Fastify direction in `packages/api-service` with the implemented `node:http` spike; separately approve the production API boundary, hosting, and deployment | Product owner + tech lead | Additional HTTP routes and production API deployment |
| OD-6 | Database hosting + RLS strategy (recommended posture accepted; provider/session and security details remain); see [OD-6 provider and RLS decision packet](OD-6_PROVIDER_AND_RLS_DECISION_PACKET.md) | Tech lead + security | Provider-backed migrations, tenancy tests, and security review |
| OD-7 | pnpm/Turborepo migration timing (deferred by ADR-0001) | Tech lead | None immediately |
| OD-8 | Expanded 43-model schema adoption path (which models graduate when) | Tech lead | ADR-0002 follow-up |
| OD-9 | Finish the toolchain boundary: Node version pin, formatter, and hermetic worktree-local dependency/database isolation. CI `verify` exists, but the 2026-07-29 isolated-worktree typecheck resolved a package from another checkout and migration integrity observed another worktree's local database migrations. | Tech lead | Reproducible local verification and any code-modifying agent experiment |
| OD-10 | The 7 missing synthetic cases (recreate vs. obtain) | Product owner | Evaluation coverage |
| OD-11 | Payer criteria packs and facility authorization rules (unknown in both generations) | Revenue cycle | Benefits/auth workflows beyond schema |
| OD-12 | Baseline operational measurements (transfer timing, acceptance rate, packet completeness) | Product owner | ROI claims, pilot design |
| OD-13 | CMS/Medicare/Medicaid regulatory reference acquisition: whether to execute the Phase 1 deep research prompt (`docs/legal/GEMINI_DEEP_RESEARCH_PROMPT_CMS_MEDICARE_MEDICAID.md`), and who reviews its output before any of it informs a rule | Product owner + counsel (OD-2) + clinical (OD-3) | Any regulatory grounding for readiness, authorization, transfer, or consent logic |
| OD-14 | Per-organization AI-native policy & procedure index (Phase 2); see the current-main [`ORG_POLICY_INDEX_DECISION_PACKET.md`](https://github.com/henrytylerhebert-eng/clarity-platform/blob/edd08550d44f257d10c696327a5ae3ceb1881503/docs/decisions/ORG_POLICY_INDEX_DECISION_PACKET.md). Unresolved: tenant-safe retrieval partitioning, reference-vs-authority scope, FDA CDS implications, who authors default interpretations, version staleness | Product owner + tech lead + counsel | Controlled extraction and product-AI-agent steps of the build sequence |
| OD-15 | Approve, revise, or reject the bounded historical-only Prescreen Invariant Verifier evaluation; name the technical integration owner, independent verifier, and required evaluation/security reviewers; approve its sealed corpus, success threshold, and stop rule. | Product owner + tech lead + security/evaluation reviewers | DEV-R1 historical evaluation and roles launched under this proposed operating model; never ordinary user-directed tooling or code modification |
| OD-16 | Decide the repository bridge disposition: keep active, freeze in place, or retire through an approved migration that closes/archives governed messages and updates every script/link. Until decided, preserve `agents/bridge/` in place and do not treat it as an authenticated dispatch channel. | Product owner + tech lead | Bridge dispatch, relocation, or retirement; not the read-only verifier |
| OD-17 | Resolve the remaining `CaseStatus` contradiction. Current-main ADR-0018/PR #38 mirrors `MEDICAL_TRANSFER_REQUIRED`; Prisma-only `RETURNED_FOR_MORE_INFORMATION` remains deliberately unrepresentable and pinned in `KNOWN_DESYNC` under issue #35 pending cross-organization submission/receipt semantics. | Product owner + tech lead | Removal or formal acceptance of the remaining exact test tolerance and any shared returned-packet status change |
| OD-18 | Reconcile open PR #33's approved-on-branch AI operating model and held PR #30's bridge/status overlap with this preparation package against accepted current-main PR #39 status and PR #41 decisions; select one canonical agent topology, bridge ruling, evaluation design, status narrative, and change-control record. | Product owner + tech lead | Merge of this governance lane, disposition of PR #30/#33, and launch of any role defined by them |
| OD-19 | Decide which roles may enter `MEDICAL_TRANSFER_REQUIRED` and whether `TransitionCase` needs target-status permission rules. ADR-0018 records that current allowed roles (`INTAKE_COORDINATOR`, `ORGANIZATION_ADMIN`) are not clinical roles. | Product owner + qualified clinical reviewer + tech/security lead | Agent modification of medical-diversion permissions and any production reliance on that state |

## Agent-readiness decision detail

The sections below are the canonical detail for the decisions referenced by
the repository-preparation packet. The packet links here and does not create a
second decision register. Current-main OD-13 and OD-14 are separate
product/regulatory decisions added by PR #41; this package uses the all-ref
free range OD-15 through OD-19 for its agent-readiness decisions.

### OD-9 - Hermetic local verification

- **Status:** Open.
- **Question / why it matters:** How will a fresh worktree prove that compiler,
  test, generated-client, and database state belong only to its frozen
  checkout? Without this, a passing or failing gate can describe another lane.
- **Options:** (A) independently accept a WP-10/WP-11-style hermetic runner;
  (B) use per-worktree installs/configuration plus a disposable database; (C)
  continue manual shared state and keep live/code-modifying agents blocked.
- **Evidence:** At source `8399edd`, typecheck in the pre-existing worktree
  resolved `@clarity/prescreen-service` from another checkout, and migration
  integrity saw four migrations not present at that checkout. The fresh
  preparation worktree has no local toolchain.
- **Recommended safe default:** Keep live and code-modifying agent work blocked
  until an independent verifier accepts a worktree-local dependency trace and
  disposable database proof.
- **Owner / approvers:** Technical/build owner; database and independent
  verification owners when database gates are in scope.
- **Required evidence:** Exact runner/config revision, all resolved paths,
  migration-ledger equality, commands/results, cleanup evidence, and an
  independent acceptance record.
- **Blocks / consequence of delay:** Live or code-modifying agent launch;
  verification remains unable to distinguish the target checkout from shared
  local state.

### OD-15 - DEV-R1 historical evaluation only

- **Status:** Open; the approval record is
  [`Pending`](../../governance/prompt-approvals/DEV_R1_PRESCREEN_INVARIANT_VERIFIER_APPROVAL.md).
- **Question / why it matters:** Approve, revise, or reject one blind,
  historical, read-only evaluation of charter `DEV-R1`, and name accountable
  owners for scope, scoring, security, and acceptance.
- **Options:** (A) approve the historical evaluation only after every entry
  condition is met; (B) revise the charter/evaluation; (C) reject it.
- **Evidence:** The completed assessment found value in independent invariant
  review, while current repository state shows answer-leakage, hermeticity, and
  ownership risks. The proposed charter and preparation packet are at
  `docs/agents/PRESCREEN_INVARIANT_VERIFIER_CHARTER.md` and
  `docs/developer-handoff/AI_NATIVE_DOMAIN_AGENT_REPOSITORY_PREPARATION.md`.
- **Recommended safe default:** Approve nothing until a product owner,
  technical integration owner, independent verifier/gold custodian, evaluation
  reviewer, and security reviewer are named; then permit only Stage 1
  historical evaluation.
- **Required evidence before decision:** Final charter content hash, completed
  work-package and runner identifiers, runner/config hash, sanitized context
  hashes, sealed gold/score sheet outside DEV-R1's readable filesystem, write and
  network denial proof, and the approved scoring/stop bands.
- **Decision / acceptance record:**
  `governance/prompt-approvals/DEV_R1_PRESCREEN_INVARIANT_VERIFIER_APPROVAL.md`.
  The eventual run record must separately capture run ID, hashes, exact
  commands, output hash, score, deviations, and owner disposition.
- **Explicit non-authorization:** OD-15 cannot authorize a live PR trial,
  database-backed command, edit, product/runtime agent, later role, or any
  code-modification authority. A live trial requires a separate approval
  record after Stage 1 passes.
- **Blocks / consequence of delay:** Only DEV-R1 and roles launched under this
  proposed model remain blocked. An ordinary user-directed tool session is
  outside the role gate only when it is not assigned domain-aware code or
  shared-contract modification; any one-off or temporary agent assigned that
  work remains gated. Delay preserves the current manual review process.

### OD-16 - Repository bridge disposition

- **Status:** Open.
- **Question / why it matters:** Reactivate, freeze in place, or retire
  `agents/bridge/` without losing governed-message history or implying
  authentication that has not been verified.
- **Options:** (A) reactivate through an explicitly approved authenticated
  transport; (B) freeze in place with no dispatch or relocation; (C) retire
  through an ADR-backed migration that closes/archives messages and updates
  all scripts and links atomically.
- **Evidence:** The 2026-07-29 status command succeeded but found no listener;
  authentication states were `Unknown`. The bridge remains referenced by
  repository scripts, protocol, README, and ledger records.
- **Recommended safe default:** Freeze in place; no dispatch and no relocation.
- **Owner / required evidence:** Product and technical owners; current status,
  ledger/open-message inventory, inbound link/script inventory, and named
  lifecycle owners.
- **Explicit non-authorization:** Recording a disposition does not authorize
  dispatch unless the selected option separately approves the authenticated
  transport and operating controls.
- **Blocks / consequence of delay:** Dispatch, relocation, or retirement.
  Delay leaves visible ambiguity but preserves evidence.

### OD-17 - Remaining CaseStatus contract authority

- **Status:** Partially resolved on current `main`. ADR-0018/PR #38 rules and
  mirrors `MEDICAL_TRANSFER_REQUIRED`; `RETURNED_FOR_MORE_INFORMATION` remains
  open under issue #35.
- **Question / why it matters:** Should `RETURNED_FOR_MORE_INFORMATION` become
  canonical behavior, be removed from Prisma, or remain an intentional
  non-mirror? Its name presumes an external return actor and receipt lifecycle
  that have not been decided.
- **Options:** (A) remove the Prisma value through an approved compatible
  migration; (B) add it to domain behavior after the cross-organization
  sender/return authority and transitions are approved; (C) formally retain
  the explicit non-mirror allowlist.
- **Evidence:** `prisma/schema.prisma`,
  `packages/domain-contracts/src/caseStateMachine.ts`, and ADR-0003 disagree at
  source `8399edd`. Current `origin/main` commit `98898c3` adds
  `tests/unit/contract-schema-enum-sync.test.ts`; current-main commit `d058065`
  adds ADR-0018 and `MEDICAL_TRANSFER_REQUIRED` behavior and narrows
  `KNOWN_DESYNC.CaseStatus` to exactly `RETURNED_FOR_MORE_INFORMATION`, still
  citing issue #35. Those changes are not present at this preparation
  worktree's assessed base and were not rerun here.
- **Recommended safe default:** Make no further shared status edit and do not
  broaden the remaining tolerance until product semantics, data compatibility,
  and consumers are reviewed.
- **Owner / required evidence:** Product, technical, and database owners;
  affected API/service/fixture inventory, compatibility/data check,
  cross-organization sender/receipt authority, accepted semantics, and a fresh
  green mirror-or-allowlist test with the remaining `KNOWN_DESYNC` entry
  removed or formally accepted.
- **Blocks / consequence of delay:** Shared status changes and disposition of
  the exact `KNOWN_DESYNC` tolerance remain blocked; the current guard prevents
  unrecorded widening but does not resolve the known drift.

### OD-18 - Competing agent-governance plans

- **Status:** Open; [PR #33](https://github.com/henrytylerhebert-eng/clarity-platform/pull/33)
  is open, unmerged, and actively changing. At final refresh its head was
  `b2a6152032fb0fcddf2abe8e5df18d168b91e70c`; it had merged `main` through
  PR #37 but was behind current-main PRs #38, #39, and #41. Refresh its head
  and merge state immediately before disposition.
- **Accepted current status:** [PR #39](https://github.com/henrytylerhebert-eng/clarity-platform/pull/39)
  merged as `7b2ca0d5ff12f29e58fd560cb41e11ab892de74c` with green CI. It changes
  `CLAUDE.md` and `IMPLEMENTATION_STATUS.md`, the same canonical entry files
  changed here, and records additional PR #33 findings plus the owner hold on
  PR #30. [PR #41](https://github.com/henrytylerhebert-eng/clarity-platform/pull/41)
  then merged as `edd08550d44f257d10c696327a5ae3ceb1881503`, adding canonical
  OD-13/OD-14 product decisions to this same register. This branch must
  integrate and preserve both accepted records.
- **Question / why it matters:** Which single agent topology, bridge
  disposition, evaluation design, and canonical artifact should govern? PR
  #33 contains a branch-local owner-approval/ADR claim plus R1/R2/T1 and bridge
  changes; this package proposes one historical-only DEV-R1 and keeps the bridge
  frozen pending OD-16. Merging both unreconciled would create conflicting
  authority.
- **Options:** (A) supersede/close PR #33 and use this corrected package; (B)
  revise this package from explicitly selected PR #33 evidence, then close the
  redundant lane; (C) correct and adopt PR #33, then abandon this branch. Every
  option preserves the current owner hold on PR #30 until its oversized
  product/bridge/status scope is separately split, rejected, or approved.
- **Evidence:** Review the full current diffs and records of
  [PR #30](https://github.com/henrytylerhebert-eng/clarity-platform/pull/30),
  [PR #33](https://github.com/henrytylerhebert-eng/clarity-platform/pull/33),
  [PR #39](https://github.com/henrytylerhebert-eng/clarity-platform/pull/39),
  [PR #41](https://github.com/henrytylerhebert-eng/clarity-platform/pull/41),
  and this branch, including bridge, role, approval, replay-isolation, scoring,
  and current-status boundaries. An approval recorded only on an unmerged
  branch is not accepted `main` behavior. PR #33's description says "one new file" and
  "Proposed," while its current three-file diff contains an accepted-on-branch
  ADR, plan, and handoff. PR #39 records PR #30 as held for owner review, with
  AI-operating-model Stage 0.1-0.3 held; PR #30's 2,483-file diff includes both
  canonical status files and `agent_bridge`. Open PR #32 remains at head
  `4d883f3` against the old assessed base. Current-main PR #41 assigns OD-13
  and OD-14 to product/regulatory decisions, while held PR #30 independently
  claims OD-13; an all-ref allocation check is therefore part of
  reconciliation. This preparation branch is five commits behind current
  `origin/main` (`edd0855`); PR #33 is behind current main. The selected lane
  needs current-main integration and revalidation.
- **Recommended safe default:** Merge neither governance lane and keep PR #30
  held until Tyler and a technical owner select one model and record which
  evidence and decisions survive.
- **Required exit record:** One canonical artifact, one bridge ruling, one
  evaluation/approval path, one reconciled entry/status narrative, and
  explicit disposition of PR #30 and PR #33 plus preservation of accepted PR
  #39 evidence and PR #41 decisions by an authorized owner.
- **Blocks / consequence of delay:** Both governance merges, bridge/status
  disposition inside PR #30, and all roles defined by those plans. Delay does
  not block ordinary user-directed repository work that is not domain-aware
  code/shared-contract modification; any temporary agent assigned that work
  is still governed by the entry gate.

### OD-19 - Medical-diversion transition authority

- **Status:** Open; explicitly left unresolved by current-main ADR-0018.
- **Question / why it matters:** Which roles may transition a case into
  `MEDICAL_TRANSFER_REQUIRED`, and does the case command policy need a
  target-status-specific permission mechanism?
- **Options:** (A) define a qualified clinical role/policy for this target
  state; (B) require a distinct human approval while preserving the command
  role; (C) accept the current roles with documented rationale and risk; (D)
  disable entry until the role model is ready.
- **Evidence:** ADR-0018 states `TransitionCase` currently permits
  `INTAKE_COORDINATOR` and `ORGANIZATION_ADMIN`, neither a clinical role. PR
  #38 tests transition topology but explicitly makes no claim that role gating
  is appropriate.
- **Recommended safe default:** Do not represent the current role policy as
  clinically approved and do not grant agent modification authority over it.
- **Owner / required evidence:** Product owner, qualified clinical reviewer,
  technical/security owner; target-role decision, API/service call inventory,
  allowed/denied role tests, audit behavior, and non-revealing zero-residue
  failure evidence.
- **Blocks / consequence of delay:** Medical-diversion permission changes and
  production reliance on that state; the accepted state topology may remain
  visible as bounded synthetic foundation behavior.
