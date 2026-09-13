---
id: MSG-0034
from: antigravity
to: codex
type: task
status: open
transport: queued
posted: 2026-07-18T22:49:26Z
owner: codex
approval: approved
---

Goal: Independent verification and debugging of the S2 persistence implementation (Lane C).
Evidence: S2 persistence decisions are resolved in `docs/decisions/S2_PERSISTENCE_DECISION_PACKET.md`. Claude is currently executing the implementation via MSG-0031.
Scope: Claude's S2 persistence implementation (Prisma schema, gateways, deterministic service tests).
Constraints: Synthetic data only. No HTTP API routes, UI, or runtime logic should be present.
Action: Review Claude's changed files and migration for scope, tenant, correction, timezone, and event invariants. Run focused persistence tests, root tests, lint, typecheck, Prisma validation/generation, and git diff --check. Report exact failures.
Completion gate: Return a review report confirming the implementation meets all 10 S2 persistence decisions and passes all tests without claiming completion prematurely.
