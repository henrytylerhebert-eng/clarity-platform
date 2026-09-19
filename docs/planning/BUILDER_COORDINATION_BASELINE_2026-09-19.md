---
status: active coordination baseline
owner: Tyler Hebert / product owner
last_verified: 2026-09-19
verification_commit: dc559e55ecc86986e8a34a614ac9bb346dc2c2bc
scope: repository coordination and handoff discipline only
---

# Builder coordination baseline

## Purpose and boundary

This is the single operating reference for coordinating Clarity builder work from
the stated verification commit. It reconciles **who may change what**, how work
is handed off, and how a branch earns review. It does not alter product scope,
approve a source adapter, authorize a real import, declare a production release,
or replace `IMPLEMENTATION_STATUS.md` as the capability-status record.

The governing agent model remains [ADR-0017](../architecture/ADR-0017-agent-operating-model-and-bridge-retirement.md): no persistent domain-agent mesh, no inter-agent message bus, and no silent transfer of owner decisions to an agent. The product owner retains all product, clinical, security, tenancy, release, and risk-acceptance decisions.

## Verified coordination snapshot

Verified by `git fetch origin`, `git worktree list --porcelain`, per-worktree
`git status --porcelain`, `git branch --merged/--no-merged origin/main`, and
`gh pr list --state open` on 2026-09-19:

| Item | Observed state | Required handling |
|---|---|---|
| Canonical remote baseline | `origin/main` and the current Access closure both resolve to `dc559e5` | New work starts from a fresh branch at this SHA or a later fetched `origin/main` SHA. |
| Shared checkout | `claude/slice-2a-closure`, with changes in ADR-0023, `synthetic-seed.test.ts`, untracked `legacy-persistence-compatibility.test.ts`, and `.codex/` files | **Held.** Do not switch, stash, reset, clean, rebase, commit, or incorporate these files without their owner's explicit handoff. |
| Linked worktrees | 17 registered; the shared checkout is the only observed dirty worktree | Existing clean worktrees are preservation artifacts, not implicit implementation lanes. |
| Munnder branch | `claude/munnder-diffline-familiarize-17e3d9` at `7afe508`, clean and behind the current baseline | **Parked.** It is not evidence of an active shared task, integration, or authority. It needs a bounded work package before reuse. |
| Historical Codex IOP worktrees | `codex/om/iop-production-readiness` and `codex/om/synthetic-iop-p2-records` remain on older commits | **Reference only.** Do not merge or replay them wholesale; recover a verified, narrowly scoped patch only when an approved package calls for it. |
| Open pull requests | None returned by `gh pr list --state open` at the snapshot | Recheck before any new package; this is a time-bound observation, not a standing claim. |

The shared checkout's uncommitted status is an ownership fact, not a quality finding.
No cleanup or branch deletion is authorized by this baseline.

## One-lane working agreement

The repository has shared choke points: Prisma schema and migrations, domain
contracts, case repository, API routes, and integration tests. Therefore only
one implementation package may modify a shared choke point at a time.

| Role | Permitted work | Prohibited work |
|---|---|---|
| Product owner | Select outcome, approve scope, accept risks, approve merges/releases | Delegating owner-only decisions through an inferred agent role |
| Package implementer (Codex **or** Claude) | Write one approved package in an isolated worktree and branch | Editing another package's worktree, making unscoped changes, direct pushes to `main` |
| Independent verifier | Inspect the exact candidate SHA, run declared checks, report findings | Repairing, committing, merging, or treating a prior run as current evidence |
| Continuity maintainer | Reconcile handoffs, branch ledger, status evidence, and decisions through review | Promoting capability claims without runtime or test evidence |
| Munnder lane | May become a package implementer or verifier only after a package records its role, branch, inputs, outputs, and acceptance checks | Acting as a standing coordinator or parallel owner |

Codex and Claude can both contribute, but they do not concurrently mutate the
same shared surface. For every package, name exactly one implementer and one
independent verifier. If either changes the candidate SHA, verification restarts
on the new SHA.

## Required handoff card

Every new task, chat, or model begins from this compact card instead of replaying
long histories:

```text
Package:
Owner decision / source record:
Baseline SHA:
Implementer:
Verifier:
Allowed paths:
Prohibited paths:
Synthetic / external-data boundary:
Acceptance criteria:
Required commands:
Known blockers and Unknowns:
```

The handoff must link the authoritative decision, workflow, or issue. It must
not repeat a capability inventory; `IMPLEMENTATION_STATUS.md` remains the
destination for verified capability status.

## Execution sequence

1. **Preflight.** Record `pwd`, remote, branch, SHA, worktree status, and fetched
   `origin/main`. Read `AGENTS.md`, the current-state block in
   `IMPLEMENTATION_STATUS.md`, the applicable ADR/decision, and only the files
   needed by the package.
2. **Claim one lane.** Create a fresh isolated worktree from the fetched
   baseline. Record its branch and allowed paths in the handoff card. Do not use
   an old parked worktree merely because it has a familiar name.
3. **Implement narrowly.** Reuse existing contracts and helpers. Preserve the
   synthetic-only boundary and do not couple the change to unrelated cleanup.
4. **Verify the exact SHA.** Run focused checks first, then the required broader
   gate. Record command, SHA, outcome, and known limits. A test result from a
   different worktree or revision is historical evidence only.
5. **Review and merge by PR.** The verifier reviews the final diff and checks
   declared prohibitions. The implementer opens a draft PR with the repository
   template; readiness and merge occur only after the owner-authorized PR path.
6. **Close the loop.** Update the single capability status record only when
   verified evidence supports it. Reclassify the branch/worktree as preserved,
   active, or ready for separately authorized retirement.

## Token-efficient quality rules

1. Start from the handoff card and exact SHA; do not re-ingest full chat history.
2. Read the smallest governing set: repo rules, current capability status, one
   decision/workflow record, and changed-code neighbors. Expand only when the
   diff or a failed check requires it.
3. Use targeted searches and focused tests before broad verification. Run the
   full gate once the candidate is stable, rather than repeatedly on unchanged
   code.
4. Keep evidence in PRs, ADRs, acceptance records, and this coordination
   baseline—not in model-specific memory or duplicate status tables.
5. Separate discovery, implementation, and verification turns. The verifier
   receives the final SHA and declared invariants, not an implementation stream.
6. State `[Unknown]` rather than consuming time reconstructing absent evidence.
   Escalate only owner decisions, security boundaries, real-source access, and
   material scope conflicts.

This reduces duplicate context loading and coordination churn while preserving
the safeguards that detect tenant, authorization, migration, and workflow
regressions.

## Immediate disposition

- **Active work:** the held shared checkout awaits its owner handoff.
- **Next clean package:** return to accepted synthetic workbook-to-platform
  reconciliation and the source-adapter decision packet; do not begin real
  imports or connectors.
- **Maintenance prerequisite:** before any worktree is removed, archive, prune,
  or branch is deleted, produce a separate owner-reviewed disposition list with
  exact branch, SHA, upstream, PR/merge relationship, and dirty-state proof.

## Acceptance for this coordination baseline

This baseline is adopted for a package only when its handoff card names one
implementer, one verifier, one baseline SHA, and its focused acceptance checks.
It is functioning when new work no longer begins from a stale worktree or an
unbounded historical chat, and when the current shared checkout remains
untouched until its owner resolves it.
