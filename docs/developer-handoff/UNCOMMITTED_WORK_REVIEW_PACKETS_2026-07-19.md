# Uncommitted Work Review Packets - 2026-07-19

## Purpose

Freeze feature work and separate the current dirty tree into reviewable packets before any commit or PR is created.

Current branch: `codex/om/sync-main`
Current HEAD: `504037c93762d1cea4875064aa5491b67373e93d`

## Verification Snapshot

Run on 2026-07-19:

- `npm run lint` - passed
- `git diff --check` - passed
- `npm run typecheck` - passed
- `npm test` - passed, 35 test files / 285 tests

## Packet 1: Synthetic Directory CRM Prototype

Recommended commit title:

`feat: add synthetic directory crm prototype`

Implementation status:

- Implemented as a synthetic/read-only UI prototype.
- No backend persistence, Prisma schema, RLS, production auth, EMR sync, live referral send, bed reservation, consult request, or user provisioning.

Candidate files:

- `app/src/domain/directoryCrm.ts`
- `app/src/domain/directoryCrm.test.ts`
- `app/src/workspaces/DirectoryCrm.tsx`
- `app/src/App.tsx`
- `app/src/App.test.tsx`
- `app/src/domain/roles.ts`
- `app/src/domain/roles.test.ts`
- `app/src/styles.css`

Review notes:

- `App.tsx`, `App.test.tsx`, `roles.ts`, and `styles.css` contain adjacent work from other UI slices. Review hunks carefully before committing this packet.
- Keep action labels constrained to prepare/add/queue style language.
- Keep "Synthetic only", "Needs review", and "No live send" visible.

## Packet 2: Public Safety Apps Script CRM + Research Package

Recommended commit title:

`docs/tools: add public safety apps script crm research package`

Implementation status:

- Scaffolded Apps Script CRM package for Google Sheets.
- Source-backed research rows are included, but the research remains human-review gated.
- `Populate Seed Data` is now wired into the custom menu.

Candidate files:

- `docs/developer-handoff/PUBLIC_SAFETY_APPS_SCRIPT_CRM_PROMPT.md`
- `tools/apps-script/public-safety-crm/README.md`
- `tools/apps-script/public-safety-crm/Code.gs`
- `tools/apps-script/public-safety-crm/Config.gs`
- `tools/apps-script/public-safety-crm/Menu.gs`
- `tools/apps-script/public-safety-crm/Schema.gs`
- `tools/apps-script/public-safety-crm/Search.gs`
- `tools/apps-script/public-safety-crm/ReviewQueue.gs`
- `tools/apps-script/public-safety-crm/GrantTracker.gs`
- `tools/apps-script/public-safety-crm/SeedData.gs`
- `tools/apps-script/public-safety-crm/appsscript.json`
- `docs/research/clarity_public_safety_crisis_directory_research.md`
- `docs/research/clarity_public_safety_crisis_directory_table.csv`
- `docs/research/clarity_grant_opportunities_for_crisis_coordination.md`

Review notes:

- Research facts should stay `Needs Review` until source-audited.
- Do not claim agency partnership, deployment, grant approval, or production readiness.
- The Apps Script package has not been executed inside Google Sheets in this session.

## Packet 3: Prescreen / Operations / Persistence Work

Recommended status:

Hold for separate review.

Reason:

This lane includes domain contracts, package imports, operations backbone work, seed tooling, bridge state, and multiple UI workspaces. It should not be bundled with the Directory CRM prototype or Apps Script CRM package.

Candidate files and directories:

- `packages/domain-contracts/src/index.ts`
- `packages/domain-contracts/src/prescreen/`
- `tests/unit/prescreen-contracts.test.ts`
- `clarity-prescreen-integration-package-v1.0.0/`
- `scripts/seed_facilities.ts`
- `package.json`
- `package-lock.json`
- `app/src/domain/admissionEpisode.ts`
- `app/src/domain/caseDependencyMap.ts`
- `app/src/domain/caseDependencyMap.test.ts`
- `app/src/domain/journey.ts`
- `app/src/domain/journey.test.ts`
- `app/src/domain/nursingAssessment.ts`
- `app/src/domain/operationsBackbone.ts`
- `app/src/domain/operationsBackbone.test.ts`
- `app/src/domain/payerProfiles.ts`
- `app/src/domain/payerProfiles.test.ts`
- `app/src/domain/services.ts`
- `app/src/domain/types.ts`
- `app/src/workspaces/AdmissionReadiness.tsx`
- `app/src/workspaces/CaseDependencyMap.tsx`
- `app/src/workspaces/DischargePlanning.tsx`
- `app/src/workspaces/JourneyMonitor.tsx`
- `app/src/workspaces/PayerProfileWalkthrough.tsx`
- `app/src/workspaces/Prescreen.tsx`
- `app/src/workspaces/AuthorizationReadiness.tsx`
- `app/src/workspaces/BenefitsVerification.tsx`
- `app/src/workspaces/EpisodeOperations.tsx`
- `app/src/workspaces/GuidedIntake.tsx`

Review notes:

- `scripts/seed_facilities.ts` adds local CSV import behavior and depends on `csv-parse`; verify whether this dependency belongs in the main repo before committing.
- Generated prescreen package lint issues were fixed mechanically, but the package itself needs product and architecture review before commit.
- Keep backend/API/RLS decisions separate from UI prototype acceptance.

## Packet 4: Bridge, Ledger, And Coordination Artifacts

Recommended status:

Hold or commit as a docs/governance packet only after confirming canonical bridge ownership.

Candidate files:

- `agent_bridge/antigravity_outbox.md`
- `agent_bridge/bridge_rules.md`
- `agent_bridge/DIRECTORY_INDEX.md`
- `agent_bridge/codex_outbox.md`
- `agent_bridge/directory_search.py`
- `agent_bridge/memory.db`
- `agent_bridge/memory_cli.py`
- `agents/bridge/LEDGER.md`
- `agents/bridge/inbox/antigravity/MSG-0049_codex-to-antigravity_next-persistence-hardening-orchestration.md`
- `agents/bridge/inbox/codex/MSG-0053_antigravity-to-codex_next-persistence-hardening-acknowledged.md`

Review notes:

- `memory.db` is a binary/local state artifact; decide whether it belongs in git before staging.
- Bridge files may be canonical coordination records. Confirm ownership before editing or committing.

## Open Decisions

1. Should Packet 1 be committed as the next prototype commit, even though shared app files include adjacent UI slice changes?
2. Should Packet 2 include research seed rows, or should the Apps Script tool ship separately from source data?
3. Should `csv-parse` and `scripts/seed_facilities.ts` stay in the main repo, move to a tooling branch, or remain uncommitted?
4. Should `agent_bridge/memory.db` be tracked, ignored, or exported to a text ledger artifact?

## Audit Addendum - 2026-07-19

This addendum supersedes the original branch and HEAD values above without
rewriting the original snapshot.

Refreshed repository state observed during the follow-up audit:

- Dirty checkout: `codex/om/sync-main`
- Latest observed HEAD: `884a8a0` (`fix: replay admissions across active-check races`)
- `origin/main`: `889e0c8`
- The dirty checkout contains mixed staged and unstaged CRM/UI changes plus
  bridge, Prescreen, operations, research, and package artifacts. No mixed
  commit or push is authorized by this record.
- `fb9f5dd` (Prescreen domain contract slice), `5489b5e` (synthetic operations
  backbone), and `884a8a0` (admission replay race correction) appeared in the
  local history during the audit. Their attribution and review state are not
  inferred from appearance alone.

The first isolated packet is now the admission replay hardening change. It was
rebased conceptually onto `origin/main` in a separate worktree at
`/Users/tylerhebert/Documents/clarity-platform-persistence-hardening`, verified
there, pushed as `codex/om/persistence-hardening`, and opened as draft PR #18:

`https://github.com/henrytylerhebert-eng/clarity-platform/pull/18`

Validation for that isolated packet:

- Focused S2 suite: 16/16, repeated three times
- Root suite: 34 files, 268/268
- Typecheck, lint, Prisma validation, and `git diff --check`: passed

The original dirty checkout remains preserved. Prescreen, operations backbone,
UX/UI, CRM tooling, research, bridge artifacts, and the local memory database
remain separate review packets and are not included in PR #18.

This review packet is itself still uncommitted and should be refreshed again if
the dirty checkout changes before the next packet is selected.
