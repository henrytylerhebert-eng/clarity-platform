# Clarity Three-Agent Bridge Protocol

The canonical record for Clarity work shared between Claude Code, Codex, and
Antigravity is this directory. It is deliberately repository-local,
git-trackable, and separate from other projects' bridge mailboxes.

## Authority Order

1. The project owner or authorized human operator's latest explicit decision.
2. The canonical Clarity documentation named by README.md.
3. Local agent guidance and this bridge configuration.
4. Current repository state and executed evidence.
5. Approved bridge decisions recorded in LEDGER.md.
6. The active task message.
7. Agent recommendations.

When these conflict, record the conflict and request the smallest human
decision. Do not silently reinterpret a higher authority.

## Roles

- Antigravity is the orchestrator. It decomposes, routes, reviews evidence,
  handles authorized browser or account-context work, and resolves ordinary
  disagreements. It does not silently install, authorize, deploy, or create a
  competing tracker.
- Claude Code is the primary executor. It performs explicitly assigned
  integration work and reports files, commands, evidence, failures, and
  residual risk. It does not expand scope or make external changes without
  approval.
- Codex is the independent reviewer and diagnostician. It is read-only by
  default for bridge-dispatched work and may make narrow fixes only when the
  assignment explicitly grants that authority.
- The human approval authority owns scope changes, production actions,
  credentialed work, publishing, deployment, irreversible changes, and
  unresolved disagreements.

## Layout

~~~
agents/bridge/
|-- PROJECT_CONFIGURATION.md
|-- PROTOCOL.md
|-- STARTUP_PROMPT.md
|-- ANTIGRAVITY_ORCHESTRATOR.md
|-- CHECK_IN_TEMPLATE.md
|-- LEDGER.md
|-- bridge.py
|-- agent-bridge
|-- inbox/{claude,codex,antigravity}/
\-- archive/
~~~

The inboxes and archive are the record. A notification channel, if configured
later, is only a wake mechanism and cannot be treated as delivery or
completion proof.

## Message Contract

Use the CLI to allocate every ID and create every canonical message. Do not
write an inbox file or hand-allocate an ID.

~~~
./agents/bridge/agent-bridge post codex claude review parser-boundary \
  --approval not-required \
  --body "Review the parser boundary and return findings only."
~~~

Messages include ID, sender, recipient, type, status, transport, posting time,
owner, and approval state. The body must state a bounded objective, scope,
current evidence, constraints, requested action, required response, and a
completion gate.

Use these lifecycle values:

~~~
open -> acknowledged -> in_progress -> result or review -> closed -> archived
~~~

Only the assigned owner or the human authority may advance a message. A
message must be closed before it can be archived.

~~~
./agents/bridge/agent-bridge update claude MSG-0001_codex-to-claude_example.md acknowledged
./agents/bridge/agent-bridge update claude MSG-0001_codex-to-claude_example.md in_progress
./agents/bridge/agent-bridge update claude MSG-0001_codex-to-claude_example.md result
./agents/bridge/agent-bridge update claude MSG-0001_codex-to-claude_example.md closed
./agents/bridge/agent-bridge archive MSG-0001_codex-to-claude_example.md
~~~

## Direct Worker Rules

The CLI can make one bounded, synchronous call to Codex or Claude.

- Codex runs ephemeral with a read-only sandbox.
- Claude runs non-persistently in plan mode with an explicit budget cap.
- Antigravity has no verified direct CLI adapter for this project. Queue its
  canonical message and obtain a visible acknowledgment before treating it as
  received.

~~~
./agents/bridge/agent-bridge ask --from codex --to claude --type question \
  --slug bridge-review --direct --max-budget-usd 0.25 \
  --body "Review the project bridge configuration. Do not modify files."
~~~

Direct execution is never permission to write, deploy, publish, send, authorize
an account, or use a live system.

## Evidence and Safety

- Label assertions Confirmed, Inferred, or Unknown.
- Attach paths, command output, test results, URLs, screenshots, or other
  direct evidence to material conclusions.
- Do not include credentials, tokens, keys, PHI, or private contact data. The
  CLI rejects common credential-shaped values and caps bodies at 256 KiB.
- Keep source packages and documents read-only. Do not import them as live app
  data.
- Stop for human approval before production writes, deployments, external
  messages, installations, permissions, credential entry, destructive changes,
  or scope-changing architecture decisions.
- After four dispatches on one unresolved issue, stop and escalate with the
  evidence, remaining Unknowns, and the smallest decision needed.

## Operator Commands

~~~
npm run bridge:doctor
npm run bridge:status
npm run bridge:test
./agents/bridge/agent-bridge list
./agents/bridge/agent-bridge thread MSG-0001 --show
~~~

The CLI only proves what it directly reports. In particular, a running app or
listener is not proof that Antigravity read a task, and a command's presence is
not proof of authentication.
