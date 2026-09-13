# Clarity Live Bridge Rules

`agent_bridge/` is a wake layer only. `agents/bridge/` is the canonical mailbox
and ledger.

For Antigravity:

1. Watch this project's `claude_outbox.md`.
2. Read the canonical message path named in each notification.
3. Acknowledge the canonical message before routing work.
4. Reply through `agents/bridge/agent-bridge`.
5. Archive only after the requested work is complete.

The presence of a watcher is not proof of agent consumption. A canonical
acknowledgment or result is required.
