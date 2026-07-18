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
| Wake transport | NONE. No Clarity-specific listener is configured. |
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

Blocked: a direct Claude check on 2026-07-18 exited with status 1 and produced
no worker review. The earlier 2026-07-16 check reported HTTP 401. Human
reauthentication and a successful bridge check are required before Claude can
be treated as available.

Unknown: Codex authentication, whether an Antigravity agent has consumed a
message, and any project-specific live wake transport. A queued message is not
proof that an agent received or completed work.
