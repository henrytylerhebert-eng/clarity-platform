# Clarity Platform — Session Operating Rules

Full manual: [docs/developer-handoff/CLAUDE_OPERATING_MANUAL.md](docs/developer-handoff/CLAUDE_OPERATING_MANUAL.md) (v1.0). This file is its project-level tailoring per the manual's Section 15. When rules conflict, this file wins.

## What this project is

Clarity is a behavioral-health case-intelligence platform (Louisiana crisis-placement focus). **Synthetic data only — it is not a deployed clinical system.** Owner: Tyler Hebert. Private remote: `github.com/henrytylerhebert-eng/clarity-platform`; `main` is protected — PR-only, no direct pushes, no force-pushes/deletions. Required approvals are **0** under the temporary solo-maintainer policy (handoff guide §3a); every PR still gets a documented self-review, and the 1-review requirement returns per §3a's triggers.

Build sequence (agreed): case repository → case command service → documents → **evidence (done)** → insurance/benefits → authorization readiness → authentication → API → UI → controlled extraction → AI agents. Do not jump ahead in this sequence without an explicit user decision.

## Session open / close (mandatory)

- **Open:** read `IMPLEMENTATION_STATUS.md` (current state + next recommended action) and restate the project state in ≤5 lines before doing new work. Verify `git status` is clean before starting.
- **Close:** update `IMPLEMENTATION_STATUS.md` when implementation or verified status changed, refresh generated graph output only when the assignment authorizes generated artifacts, and end with completed items + the single next action.

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
- Named reusable, persistent, or temporary domain-aware roles under the proposed operating model must pass the entry gate in `docs/developer-handoff/AI_NATIVE_DOMAIN_AGENT_REPOSITORY_PREPARATION.md` and complete the execution contract in `docs/AGENTS_TEMPLATE.quickfill.md`. An ordinary user-directed Codex/Claude session is outside this role gate only when it is not assigned domain-aware code or shared-contract modification. Any one-off, temporary, reusable, or persistent agent assigned such modification must complete the gate, a separate approval record, and a bounded work package; direct user authorization defines task scope but does not waive the gate for domain-changing work. OD-15 can authorize only the bounded read-only DEV-R1 trial; it can never grant code-modification authority.
- Validation gate before a code/behavior completion claim: `npm run lint`, `npm run typecheck`, `npm test`, `npx prisma validate` — all must actually run and pass. Documentation-only work uses scoped link/format/metadata validation and must explicitly list unavailable code gates.
- Commit style: conventional prefixes (`feat:`/`fix:`/`test:`/`docs:`/`chore:`), body explains the why.
- ADR numbering is a shared surface; check `docs/architecture/` and every open PR before allocating. Current `main` contains ADR-0001 through ADR-0014 and ADR-0018; unmerged lanes claim 0015 through 0017.
- Out-of-scope findings become GitHub issues, not silent scope creep (backlog: issues #1–#5).

## House terminology

Adopt these exactly: tenant = `organizationId`; case = `BehavioralHealthCase`; the 8 parallel workstreams; command/gateway/service layering; "synthetic" prefixes all test fixtures; open decisions are `OD-n` (see `IMPLEMENTATION_STATUS.md`).

## Standing assumptions (labeled, in force)

- Authentication and database-sourced roles exist for the bounded API slice. Managed identity-provider integration and production-wide authorization remain unimplemented.
- Local filesystem object storage is development-only.
- REQ numbering is inferred lineage; the source REQ matrix is missing (OD-1).

## Project state (update on every phase change)

```
PROJECT STATE: Clarity Platform — updated 2026-07-29
Objective: local, tested, tenant-scoped backend foundation for behavioral-health case workflows (synthetic only)
Current phase: prescreen product slice — package onboarded (PRs #17/#20), Phase 1 contracts + hardening (PRs #19/#27), Phase 2 command service (PR #23, ADR-0013), role mapping resolved + same-org HTTP API slice merged via PR #28 (ADR-0014); Phase 3 persistence is open in PR #32 and is not accepted main-branch behavior. Parallel agent-governance work: Stage 0.4 landed in PR #36; Stage 0.1-0.3 and PR #30 remain held by the owner; no role launch is authorized.
Decisions: solo-maintainer §3a protection is LIVE (PR-only, approvals 0, required strict "verify" check, conversation resolution, admin enforcement); prescreen role mapping ruled Option-3-narrow (INTAKE_COORDINATOR ≡ Central Intake, PHYSICIAN_REVIEWER ≡ authorized practitioner, PMHNP scope as configured policy, external/field roles deferred, same-org only, receivingOrganizationId principal-derived); prescreen Phase 2 approved same-org synthetic-only with submission-as-intent; NON_OPPOSED routing remains an authorized-review pathway; contract evaluators fail closed for missing privacy regime, overlapping consent rules, unresolved transport restrictions, and missing sending/receiving facility approvals; idempotency fingerprint excludes occurredAt (ADR-0014 §5); current-main ADR-0018 rules MEDICAL_TRANSFER_REQUIRED as a diversion but leaves its role authority open; PR #30 is held for owner review because its 2,483-file diff overlaps canonical status and agent_bridge surfaces; event-vocabulary expansion stays gated on named consumers and domain review
Open decisions: OD-1 (missing master package), OD-2 (counsel review), OD-3 (clinical licensing), OD-5 (API hosting), OD-6 (provider-backed DB/RLS evidence), OD-7 (pnpm/Turborepo), OD-8 (schema graduation), OD-9 (hermetic local verification), OD-13 (CMS regulatory research), OD-14 (organization policy index), OD-15 (read-only verifier ownership/approval), OD-16 (bridge disposition), OD-17 (remaining RETURNED_FOR_MORE_INFORMATION alignment), OD-18 (single canonical agent-governance plan), OD-19 (medical-diversion role authority), cross-org prescreen submission/receipt, prescreen UI scope
Current evidence: see the top block of IMPLEMENTATION_STATUS.md. On 2026-07-29, checks at assessed base 8399edd in a pre-existing worktree passed prescreen units/app/lint/Prisma validation while root migration integrity and typecheck exposed shared database/workspace state. The fresh preparation worktree has no installed dependencies, so repository commands are unavailable there. During final review, origin/main advanced five commits to edd0855: PR #37's package-lock update, PR #36's enum-mirror guard, PR #38's MEDICAL_TRANSFER_REQUIRED diversion ruling, PR #39's accepted status record, and PR #41's OD-13/OD-14 product decisions. PR #39 records green CI and historical PR #38 session results; none were reproduced here. The current guard tolerates only RETURNED_FOR_MORE_INFORMATION; this branch remains behind all five commits. Historical counts are labeled in IMPLEMENTATION_STATUS.md.
Next action: integrate current main through PR #41, then reconcile open governance PR #33 and held PR #30 with this preparation package to select one canonical agent/bridge/evaluation/status plan; hermetic verification and all product, deployment, clinical, legal, and security gates remain separate
```
