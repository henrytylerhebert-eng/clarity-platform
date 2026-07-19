# Clarity Three-Agent Bridge Configuration

This file is the filled project-configuration block for the local bridge. Read
it before dispatching or accepting a task.

| Field | Value |
|---|---|
| Project name | Clarity Platform |
| Project root | /Users/tylerhebert/Documents/clarity-platform |
| Repository | https://github.com/henrytylerhebert-eng/clarity-platform.git |
| Default branch | main |
| Canon entry | README.md, followed by the canonical documentation it names |
| Local agent rules | Repository `AGENTS.md`, then `/Users/tylerhebert/.codex/AGENTS.md`; the repository-local file takes precedence |
| Human approval authority | Project owner or authorized human operator |
| Live systems | None confirmed. This repository is a local prototype and service foundation only. |
| Primary checks | npm test; npm run lint; npm run typecheck; npm run test:app; cd app && npm run build; cd app && npm run smoke |
| Bridge CLI | agents/bridge/agent-bridge |
| Canonical mailbox | agents/bridge |
| Wake transport | FILE_MIRROR. `agent_bridge/` is the Clarity-specific notification layer; Antigravity watcher consumption remains separately verified. |
| Antigravity direct CLI | NO. An app installation was detected, but no usable direct CLI endpoint was verified. |
| Claude write access | Explicit assignment required. The bridge only invokes Claude in plan mode. |
| Codex write access | Explicit assignment required. Bridge-dispatched review work is read-only by default. |

## Current Boundaries

- All bridge messages must remain free of credentials, tokens, real PHI, real
  patient details, and private contact data.
- Use only the repository's synthetic fixtures and the separated mock-use
  training materials in any agent task.
- Source packages in reference/ are immutable context, not executable task
  inputs or a substitute for canonical documentation.
- The current branch, commit, worktree state, installed tools, authentication,
  and listener state must be rechecked at the beginning of each task. This
  file does not freeze those facts.

## Capability Statement

Confirmed: the project-local CLI can create, lifecycle-manage, archive, and
inspect canonical messages. Claude Code is installed locally. Antigravity's
desktop app is present.

Confirmed: Claude completed the queued reviews in `MSG-0011` and `MSG-0012`
on 2026-07-18 and reported a clean executor check-in in `MSG-0010`.

Unknown: the automated `agent-bridge ask --direct` adapter previously hid the
worker's API error behind a generic exit status. The adapter now surfaces safe
Claude API error detail; current CLI authentication still requires a successful
health check before direct dispatch is trusted.

Unknown: Codex authentication and any project-specific live wake transport. A
queued message is not proof that an agent received or completed work.
