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

## CRM Directory Searching

If you need to query medical or facility contacts, DO NOT attempt to read the raw CSV files. They contain over 19,000 records and will exceed your token limits.
Read `agent_bridge/DIRECTORY_INDEX.md` for instructions on how to use the `agent_bridge/directory_search.py` script to filter and search the CRM.

## Platform Memory Ledger

To avoid relying on token context for long-term project decisions and platform facts, you MUST use the local Platform Memory Ledger.
Before executing tasks or making architectural decisions, query the memory ledger:
`python3 agent_bridge/memory_cli.py query --type <TYPE>`

If you uncover a new domain decision or architecture rule, you MUST log it into the memory ledger using the `memory_cli.py create` command according to the rules in `docs/governance/PLATFORM_MEMORY_SYSTEM.md`.
