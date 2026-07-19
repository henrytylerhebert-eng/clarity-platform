# Product Studio Enhancement Roadmap

## P0 blocking before production admin use

- Establish verified identity, organization scope, tenant isolation, and object-level authorization.
- Persist a server-owned Feature Concept registry and append-only decision/audit history.
- Separate roadmap publication, feature-flag activation, deployment, and release approval commands.
- Add audience projections that remove PHI, secrets, and unreleased security detail.

## P1 high-impact next slices

- Add a Feature Concept API contract and read-only server projection.
- Add decision-brief creation with explicit human approval and dissent capture.
- Add adapter metadata for repository, issue, design, CI, flag, deployment, and observability sources.
- Add audience preview tests for internal, advisor, customer, and public projections.
- Add a release-candidate view with gates, pilot cohort, evidence links, pause, and rollback records.

## P2/P3 follow-ups

- Structured feedback campaigns and moderation.
- Stale-item and missing-field detection.
- Accessible list alternatives for architecture maps and dependency graphs.
- Privacy-conscious Studio event taxonomy.
- Optional integrations and richer post-release review.

## Decision required next

Choose the authoritative persistence and tenancy strategy before adding mutation controls. The current prototype should remain read-only until that decision is recorded and verified.
