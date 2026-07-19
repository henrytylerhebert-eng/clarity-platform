# Clarity Bridge Wake Layer

This directory is a notification layer for the canonical mailbox in
`agents/bridge/`. The canonical mailbox remains the source of truth.

- `claude_outbox.md` is the append-only wake stream for Antigravity.
- `antigravity_outbox.md` is the append-only wake stream for Codex/Claude.
- The bridge creates short references here after it durably writes a canonical
  message.

The Antigravity session must watch this project's `claude_outbox.md`. A watcher
for another repository does not consume Clarity work.
