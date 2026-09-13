# Agent Bridge — Retired Experiment

**Status: abandoned experiment. Preserved as evidence, not as an operating model.**
Three-agent bridge (orchestrator / executor / reviewer), active 2026-07-16 →
2026-07-19, retired 2026-09-12. Landing one work package required three dispatch
attempts (MSG-0030 → MSG-0033 → MSG-0045), a duplicate dispatch (MSG-0031), a
stale-branch misroute (MSG-0038), infrastructure failures (MSG-0032, MSG-0036), and
two owner interventions. Do not treat any file here as current guidance.

## What this directory is

This is the full, unmodified contents of the former `agents/bridge/` directory
(protocol docs, orchestrator/dispatch scripts, `LEDGER.md`, and all 52 archived and
inboxed messages) plus the former root `agent_bridge/` directory — the notification
mirror for the same retired canonical mailbox — moved here under
`agent_bridge-notification-mirror/`, quarantined alongside it rather than left
pointing at a moved directory. Nothing was edited or deleted; every file's content is
byte-identical to its pre-move version.

See [ADR-0017](../../architecture/ADR-0017-agent-operating-model-and-bridge-retirement.md)
for the accepted decision this quarantine executes, and the
[AI Operating Model Plan](../../governance/AI_OPERATING_MODEL_PLAN.md) (Stage 0.2)
for the task this directory's move satisfies.

## What is not here

No live entry point references this directory. `package.json`'s `bridge:doctor` /
`bridge:status` / `bridge:test` scripts have been removed, `README.md`'s Quick Start no
longer documents them, and `IMPLEMENTATION_STATUS.md`'s Bridge bullet has been
corrected to describe retirement rather than a running listener.
