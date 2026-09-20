# Developer / Agent Handoff

## Repository anchor

`henrytylerhebert-eng/clarity-platform`  
Start from `main` at or after `43070937c9a912ebf155b81536d60e8595f7d09a`.

## Mandatory read order

1. repository `AGENTS.md`
2. repository `README.md`
3. repository `ARCHITECTURE.md`
4. this package `00_START_HERE/README.md`
5. semantic lock + Decision Register
6. Constitution + Semantic Registry
7. Tree 5 Workspace Model
8. Longitudinal Model
9. Implementation Plan
10. Verification Matrix
11. IA-001

## Before adding any concept, classify it

Is it:

- Identity?
- Context?
- Entity?
- Relationship?
- Fact?
- Observation?
- Claim?
- Inference?
- Decision?
- Plan?
- Preference?
- Recorded state?
- Derived state?
- Requirement?
- Obligation?
- Action?
- Attention?
- Event?
- Projection?

If it fits two categories, stop and reconcile the overload.

## Existing-owner rule

Find the current domain owner before creating a new package/table/service.

Extend before creating.

Derive before persisting when reliable derivation is possible.

## No-schema invention rule

A UI, AI prototype, Figma prototype, or implementation convenience cannot authorize a new database field/table.

## Development pattern

`Query → Trace → Command`

Query asks what Clarity knows.

Trace explains why/how.

Command changes state through authority + validation + audit.

## Current next slice

Build **Work + History read-only** over the Day 1 → Day 39 longitudinal fixture/contracts.

No Prisma changes.

## Pull request requirements

Each PR should state:

- Canon decisions implemented
- Open gaps touched
- Persistence impact
- Authority impact
- Data classification impact
- Tests run with exact commands
- Unverified checks
- Rollback boundary
