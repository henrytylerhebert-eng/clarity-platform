# Clarity Platform — Session Operating Rules

Full manual: [docs/developer-handoff/CLAUDE_OPERATING_MANUAL.md](docs/developer-handoff/CLAUDE_OPERATING_MANUAL.md) (v1.0). This file is its project-level tailoring per the manual's Section 15. When rules conflict, this file wins.

## What this project is

Clarity is a behavioral-health case-intelligence platform (Louisiana crisis-placement focus). **Synthetic data only — it is not a deployed clinical system.** Owner: Tyler Hebert. Private remote: `github.com/henrytylerhebert-eng/clarity-platform`; `main` is protected — PR-only, no direct pushes, no force-pushes/deletions. Required approvals are **0** under the temporary solo-maintainer policy (handoff guide §3a); every PR still gets a documented self-review, and the 1-review requirement returns per §3a's triggers.

Build sequence (agreed): case repository → case command service → documents → **evidence (done)** → insurance/benefits → authorization readiness → authentication → API → UI → controlled extraction → AI agents. Do not jump ahead in this sequence without an explicit user decision.

## Session open / close (mandatory)

- **Open:** read `IMPLEMENTATION_STATUS.md` (current state + next recommended action) and restate the project state in ≤5 lines before doing new work. Verify `git status` is clean before starting.
- **Close:** update `IMPLEMENTATION_STATUS.md`, maintain the local graph when useful using [GRAPHIFY_WORKFLOW.md](docs/developer-handoff/GRAPHIFY_WORKFLOW.md), and end with completed items + the single next action. `graphify-out/` is generated, ignored worktree state; never stage its caches or generated reports.

## Hard rules (truth discipline)

1. **Never claim a test passed unless it ran in this session.** Report exact counts. Use only: written / run / tested / committed / pushed / deployed — highest TRUE state.
2. **Database:** integration tests run only against local `clarity_dev` (`assertLocalClarityDevDatabase` enforces this — do not weaken it). After any suite, verify zero synthetic residue.
3. **Never add real patient data, real insurance identifiers, PHI/PII, or secrets** — anywhere, including audit metadata, commit messages, and docs. `.env` and `.local-object-storage/` stay untracked.
4. **Not claimed, ever:** production readiness, HIPAA compliance, malware protection, working external integrations, or approved clinical/legal rules. Final reports carry an honesty statement listing what is NOT claimed.
5. Migrations: smallest possible, applied to local `clarity_dev` only, justified in an ADR.

## Architecture invariants (do not violate; propose changes via ADR)

- **One Prisma package:** only `packages/case-repository` imports `@prisma/client`. Services (`case-service`, `document-service`, `evidence-service`) go through their gateway adapters.
- **Command pattern everywhere:** strict Zod envelopes → role policy (exact `UserRole` enum values, no "admin" shorthand) → one transaction (tenant-scoped reads, state machine on the fresh row, conditional versioned UPDATE, atomic audit event, idempotency record). New capabilities reuse this; never reinvent.
- **Tenancy in every predicate.** A record id is never authorization. Cross-tenant misses are non-revealing errors.
- **Append-only audit** with the restricted-identifier guard; metadata carries hashes/field-names, never source text, file bytes, or raw filenames.
- **Immutability by construction** where required (evidence `originalText`/category, document versions): no change-set type may express the forbidden update.
- Contracts live in `packages/domain-contracts` (pure; enum arrays mirror `prisma/schema.prisma` — keep in sync).

## Workflow

- Discovery first (read existing code/ADRs), then implementation, then integration tests against `clarity_dev`, then docs (ADR + implementation doc + test manifest with **honest gaps**), then small commits, then PR to `main`. Never push directly to `main`.
- Bounded implementation slices state scope, prohibited paths, and required acceptance evidence up front using [docs/governance/WORK_PACKAGE_TEMPLATE.md](docs/governance/WORK_PACKAGE_TEMPLATE.md).
- Validation gate before any completion claim: `npm run lint`, `npm run typecheck`, `npm test`, `npx prisma validate` — all must actually run and pass.
- Commit style: conventional prefixes (`feat:`/`fix:`/`test:`/`docs:`/`chore:`), body explains the why.
- ADR numbering is sequential; check `docs/architecture/` for the next free number (0001–0008 taken as of 2026-07-11).
- Out-of-scope findings become GitHub issues, not silent scope creep (backlog: issues #1–#5).

## House terminology

Adopt these exactly: tenant = `organizationId`; case = `BehavioralHealthCase`; the 8 parallel workstreams; command/gateway/service layering; "synthetic" prefixes all test fixtures; open decisions are `OD-n` (see `IMPLEMENTATION_STATUS.md`).

## Standing assumptions (labeled, in force)

- Actor roles are trusted caller input — authentication does not exist yet.
- Local filesystem object storage is development-only.
- REQ numbering is inferred lineage; the source REQ matrix is missing (OD-1).

## Project state (update on every phase change)

```
PROJECT STATE: Clarity Platform — updated 2026-08-23
Objective: local, tested, tenant-scoped backend foundation for behavioral-health case workflows (synthetic only)
Current phase: prescreen product slice — package onboarded (PRs #17/#20), Phase 1 contracts + hardening (PRs #19/#27), Phase 2 command service (PR #23, ADR-0013), role mapping RESOLVED + same-org HTTP API slice MERGED (ADR-0014, PR #28); Phase 3 LOCAL persistence MERGED (ADR-0016, PR #32) — Prisma gateway, RLS'd tables, restart-durable dev server, plus raw Prisma unique-violation contention mapped to domain errors; provider-backed Cloud SQL/RLS verification remains the separate non-waived gate. Parallel governance thread: AI-operating-model plan + ADR-0017 MERGED (PR #33) after review-thread cleanup; Stage 0.4 landed (PR #36); Stage 0.1–0.3 HELD behind PR #30 by owner ruling; Stage 1 (R1 trial) requires Stage 0.1–0.3 on main and must replay vulnerable parent revisions, not fix commits. Regulatory reference thread: CMS research prompt written but NOT executed (OD-13); corpus acquisition tool merged (PR #42), dev tooling only, not a scheduled worker; per-org policy index captured as a decision packet (OD-14)
Decisions: solo-maintainer §3a protection is LIVE (PR-only, approvals 0, required strict "verify" check, conversation resolution, admin enforcement); prescreen role mapping ruled Option-3-narrow (INTAKE_COORDINATOR ≡ Central Intake, PHYSICIAN_REVIEWER ≡ authorized practitioner, PMHNP scope as configured policy, external/field roles deferred, same-org only, receivingOrganizationId principal-derived); prescreen Phase 2 approved same-org synthetic-only with submission-as-intent; NON_OPPOSED routing remains an authorized-review pathway; contract evaluators fail closed for missing privacy regime, overlapping consent rules, unresolved transport restrictions, and missing sending/receiving facility approvals; idempotency fingerprint excludes occurredAt (ADR-0014 §5); event-vocabulary expansion stays gated on named consumers and domain review; CaseStatus MEDICAL_TRANSFER_REQUIRED ruled a non-terminal diversion off ACTIVE_ORDER with mandatory rationale and RETURNED_FOR_MORE_INFORMATION deferred to the cross-org packet (ADR-0018); PR #30 held for owner review (2,483 files, stale CI, expands the agent_bridge tree ADR-0017 would retire)
Open decisions: OD-1 (missing master package), OD-2 (counsel review), OD-3 (clinical licensing), OD-5 (API — vertical slice merged, hosting undecided), OD-6 (DB hosting/RLS — provider posture accepted, provider-backed evidence gated), OD-7 (pnpm/Turborepo), OD-8 (schema graduation), OD-13 (execute CMS regulatory research and identify reviewer), OD-14 (per-org AI-native policy index — tenant-safe retrieval, reference-vs-authority, FDA CDS scope, default interpretations, staleness), cross-org prescreen submission/receipt model (successor packet — blocks field-originated prescreens), prescreen UI scope
Deliverables: PR #32 merged and reverified: root 435/435 (40 files, includes enum-sync coverage for the 6 prescreen schema enums it did not know about pre-merge), app 64/64, lint, typecheck, `prisma validate` pass, zero residue delta (28 orgs/15 cases, unchanged across that session); PR #33 merged after CI verify passed on 2026-08-23; 145/145 prescreen source-package checksums; tag clarity-foundation-v0.1; regulatory corpus tool with 17/17 sources retrieved (`npm run regulatory:check|sync|index|fr`, dev tooling only — not a worker, see docs/regulatory/README.md); ADRs accepted on main: 0001–0014 and 0016–0018 (17 files). ADR-0015 remains claimed on an unmerged branch. Allocate a new ADR number only after fetching/querying open PR refs and checking all refs, never main alone: `git fetch origin '+refs/pull/*/head:refs/remotes/origin/pr/*' --prune` then inspect `git log --all --name-only --pretty=format: -- "docs/architecture/ADR-*"` by filename
Open items needing owner input: disposition of PR #30 (held for owner review — 2,483 files, stale CI, expands the agent_bridge tree ADR-0017 retires; closing it as superseded is what unblocks Stage 0.1–0.3 and therefore Stage 1); whether MEDICAL_TRANSFER_REQUIRED should be clinician-gated (TransitionCase permits only INTAKE_COORDINATOR/ORGANIZATION_ADMIN — no per-target-status role mechanism exists); whether to execute the CMS research (OD-13); PRs #29 and #18 remain untriaged. Graphify issue #40 is addressed on this branch by keeping generated output local; see GRAPHIFY_WORKFLOW.md. Issue closure awaits merge.
Next action: rule on PR #30's disposition — it is the single blocker for AI-operating-model Stage 0.1–0.3 and Stage 1. Alternatives: provide GCP access (gcloud auth login + intended project) for the provider-backed Cloud SQL/RLS gate, or decide prescreen UI scope / cross-org packet. No Studio mutation/publication/feature-flag/worker/deployment controls before server authorization and audit boundaries exist — this explicitly includes scheduling the regulatory corpus tool.
```

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
