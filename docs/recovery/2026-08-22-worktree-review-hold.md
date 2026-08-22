# Clarity Worktree Review Hold

Created: 2026-08-22

This note records Clarity worktrees that should be reviewed later instead of cleaned up with ordinary generated state.

## Current Decision

Keep the live Clarity recovery lanes until their changes are reviewed, promoted, or intentionally rejected.

## Live Worktrees To Review

Candidate recovery lanes:

- `/Users/tylerhebert/.codex/worktrees/clarity-ai-agent-readiness`
- `/Users/tylerhebert/.codex/worktrees/clarity-drive-pattern-parking-lot`
- `/Users/tylerhebert/.codex/worktrees/clarity-admission-replay-active-check`
- `/Users/tylerhebert/.codex/worktrees/clarity-prescreen-source-package-fix`
- `/Users/tylerhebert/.codex/worktrees/clarity-prescreen-slice1-main`

Claude review lanes:

- `/Users/tylerhebert/Documents/clarity-platform/.claude/worktrees/ai-operating-model-handoff-7c884e`
- `/Users/tylerhebert/Documents/clarity-platform/.claude/worktrees/clarity-build-to-goal-operating-doc-011dc7`
- `/Users/tylerhebert/Documents/clarity-platform/.claude/worktrees/clarity-opening-cfcdc5`
- `/Users/tylerhebert/Documents/clarity-platform/.claude/worktrees/graphify-progress-review-f535e6`
- `/Users/tylerhebert/Documents/clarity-platform/.claude/worktrees/h1-h2-audit-infrastructure-49906f`
- `/Users/tylerhebert/Documents/clarity-platform/.claude/worktrees/project-progress-update-2df83e`
- `/Users/tylerhebert/Documents/clarity-platform/.claude/worktrees/review-pull-push-requests-8d60aa`

## Review Rules

- Do not delete dirty or unique worktrees until their diff is inspected.
- Preserve synthetic-only and governance boundaries.
- Promote accepted changes through normal Clarity branches or pull requests.
- Generated Graphify output can be removed after any useful reviewed report is promoted.

## Completed Cleanup

Dead Clarity Git worktree records pointing to missing `/private/tmp` paths were pruned on 2026-08-22.
