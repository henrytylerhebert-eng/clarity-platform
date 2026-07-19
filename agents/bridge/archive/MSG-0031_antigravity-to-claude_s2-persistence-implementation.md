---
id: MSG-0031
from: antigravity
to: claude
type: task
status: closed
transport: queued
posted: 2026-07-18T22:45:47Z
owner: claude
approval: approved
---

Goal: Implement S2 persistence boundary. 
Evidence: S1 is accepted (docs/developer-handoff/S1_REVIEW_AND_ACCEPTANCE_RECORD.md) and S2 decisions are resolved (docs/decisions/S2_PERSISTENCE_DECISION_PACKET.md). 
Scope: Episodes, UR records, documentation gaps, correction chains, governed events, outbox records, Prisma gateways, deterministic tests. 
Constraints: Synthetic data only. No HTTP routes, API framework, workers, marts, UI integrations, or deployment changes. Additive schema only.
Action: Translate S2 decisions into Prisma schema additions, thin Prisma gateways, and deterministic tests. 
Completion gate: Return evidence of passing deterministic persistence test matrix (including cross-organization rejection and replay behavior), lint, and typecheck.
