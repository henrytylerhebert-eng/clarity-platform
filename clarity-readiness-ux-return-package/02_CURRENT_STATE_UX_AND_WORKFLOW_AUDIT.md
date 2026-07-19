# Current State UX And Workflow Audit

## Confirmed implementation surface

- `app/` contains a local React/Vite prototype with role-adaptive navigation, case queue, guided intake, evidence review, medical necessity, legal status, benefits, authorization, packet, routing, bedboard, custody ledger, training, mock admits, and Product Studio.
- `packages/*-service` contains service foundations and tests, but the frontend prototype still primarily runs on local synthetic state.
- `packages/api-service` has a bounded authenticated `node:http` vertical slice, but this package did not add to it.

## UX findings

- Existing workspaces already map well to resolution destinations.
- The case queue shows many signals but does not explain dependency order or target-specific blockers.
- Role scoping is visible but explicitly not backend authorization.
- Activity and custody/audit surfaces exist, but compliance-grade audit is not fully represented in the frontend prototype.

## Slice fit

The Case Dependency Map fills the gap between case queue scanning and workspace execution. It should remain a read-only explanation layer.

