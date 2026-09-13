# CLPR-0 through CLPR-3 synthetic vertical slice

Implementation owner: Codex. Designated review owner: Claude.
Review acceptance: [Unverified]; this document does not record Claude approval.

## Scope and provenance

The implementation adapts the supplied
`Clarity_CLPR_Claude_Codex_Handoff_v0_1.zip`, reconciled by
`docs/planning/clpr/CLPR_INTEGRATION_RESOLUTION.md` and the owner's
`CLPR_FILE_OWNERSHIP.json` allowlist. The package's standalone test results
are historical source information, not verification of this integration.

Target worktree:
`/Users/tylerhebert/Documents/clarity-platform/.claude/worktrees/review-pull-push-requests-8d60aa`.
Branch: `claude/clarity-clpr-codex-handoff-7434af`.
Preflight HEAD: `5348202f8b90ba55b32a8aee811bc6c4e6633995`.
The target already contained untracked `docs/planning/clpr/` handoff files;
those files are preserved without edits. The primary checkout was clean on
`main` at the same HEAD.

The slice demonstrates Central Intake learning pathway → contradiction
practice → synthetic workflow events → deterministic PracticeObservation →
Notice & Acknowledge → context/contest/review → confirmed synthetic
CompetencyEvidence → My Path. It attaches to the intake/evidence and learning
parts of Clarity's case spine. It does not change Episode or clinical,
placement, legal, financial, or operational decision authority.

## Repository adaptations

- Service imports use the domain-contract barrel and the existing root
  TypeScript/Vitest package maps. No standalone build harness is imported.
- The canonical Central Intake role value is `INTAKE_COORDINATOR`.
- The app mirrors the vocabulary locally, following its existing standalone
  architecture. Its session state is independent of the service.
- Components live in `app/src/components/learning-practice/` and extend the
  existing Training & SOPs workspace.
- The fixture lives in `data/synthetic-practice-scenarios/`. It is not a
  BehavioralHealthCase fixture and is never passed to `loadSyntheticCases`.
- Both fictional source accounts now refer to the same simulated checkpoint
  T0. The original package described different time windows, which could
  represent a change over time rather than a contradiction. Neither account
  is selected as the truth.
- Gateway operations are organization-scoped. Practice mutations also check
  learner ownership. Evaluation is isolated to a single attempt.
- Recognition requires both contradictory source references and escalation
  for review. Outcome events cannot create or strengthen recognition.
- Contest resolution uses an explicitly configured, distinct synthetic
  reviewer identity. This is a local simulation, not production authentication
  or a new live authorization policy.

No Prisma schema, repository adapter, HTTP route, role enum, canonical case
fixture, dependency version, or app build configuration is changed. CLPR-4
live recognition remains disabled and deferred. All learning records are
process-local or component-session-local and disappear on reset/reload.
The source package's manual metadata is supplied provenance; qualified content
approval and demonstrated training effectiveness remain [Unverified].
No measurements found.

## Collision and report boundaries

Apply-time checks found no active edits to the training workspace, domain
barrel, CLPR paths, or canonical case fixtures. Another worktree had an
unrelated `tsconfig.json` addition for the prescreen-service alias. This
worktree adds only the CLPR alias; a future merge must retain both additions.
Open PR #66 touches `IMPLEMENTATION_STATUS.md`, so this slice leaves that
optional status file unchanged. PR #63 has no overlap.

This allowed document carries the implementation return record. The source
package's requested `docs/planning/.../CLPR_IMPLEMENTATION_RETURN.md` is
outside the owner's file allowlist and is not added. No commits, PR, merge,
publication, or deployment are included.

## Verification

Current integrated verification is pending implementation completion.
Preflight checks: unchanged main passed `npm run typecheck` and
`npm run lint`; target `npm run prisma:validate` passed.

## Remaining review and deferred work

Claude's designated post-implementation review and owner acceptance remain
pending. Production API/hosting/tenancy decisions, authenticated learning
records, durable event provenance, retention/privacy policy, clinical/content
review, and security acceptance are outside this synthetic slice. No live
employee observation, compensation/reward integration, or production
recognition is enabled.
