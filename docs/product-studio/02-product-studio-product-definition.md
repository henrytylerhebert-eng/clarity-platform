# Product Studio Product Definition

## Product promise

See the product. Shape the roadmap. Understand the impact. Control the release. Preserve the reasoning.

## Connected lenses

- Product: problem, users, workflow, outcome, evidence, and decision need.
- Build: services, routes, components, schemas, dependencies, tests, and linked delivery artifacts.
- Run: visibility, rollout state, reliability evidence, support signals, and rollback readiness.

## Lifecycle

`Observe -> Capture -> Map -> Evaluate -> Decide -> Design -> Build -> Validate -> Release -> Measure -> Learn`

The registry keeps lifecycle views attached to one concept. An idea is not automatically a commitment, a deployment is not automatically an activated feature, and feedback volume is not a roadmap decision.

## Prototype boundary

The first implementation is read-only and uses synthetic records in the React app. It intentionally does not publish roadmap content, mutate flags, approve releases, expose sensitive architecture, or make autonomous prioritization decisions.

## Evidence status boundary

Product Studio follows `docs/governance/PRODUCT_EVIDENCE_AND_DECISION_PROTOCOL.md`. It may display lifecycle stage, evidence status, missing evidence, required approval authority, risks, dependencies, ADR/test/metric links, and parking-lot state. It must link back to canonical records rather than duplicate them.

Until a server-owned Feature Concept registry, authorization, audit, tenancy, and release-control model are implemented and verified, Studio remains a read-only projection. It must not mutate roadmap, feature flags, deployment, release approval, clinical, legal, authorization, placement, or security state from the local prototype.
