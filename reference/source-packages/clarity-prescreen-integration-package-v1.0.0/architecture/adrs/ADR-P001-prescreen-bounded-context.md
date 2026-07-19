# ADR-P001 — Prescreen as a Bounded Context

- **Status:** Proposed
- **Decision owner:** Clarity product/architecture owner

## Context

The prototype contains Guided Intake, Evidence Review, Legal Status, Packet Preview, Routing, and Custody surfaces. Prescreen discovery now defines a broader field-to-Central-Intake workflow with assessment versions, source attribution, communications, tasks, packet readiness, transport, and configuration.

## Decision

Create a Prescreen bounded context linked to the existing Case spine. Prescreen owns encounters, assessment versions, source statements, willingness, orientation observations, attestation, supplements, and target-specific submission status.

## Consequences

- Existing workspaces remain domain destinations rather than being duplicated inside one form.
- Prescreen can be reused by private, public, municipal, state, and hospital teams.
- A new service/runtime is required; frontend-only localStorage state is insufficient.
- Repository placement must be reconciled with current package conventions before implementation.

## Rejected

- Treat the two paper tools as one static digital form.
- Add all data to the existing Case aggregate.
- Build a separate product with no shared case/evidence/custody spine.
