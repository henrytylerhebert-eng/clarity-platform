# Before and After Review

## Before

- Command Center contained a useful feature map and roadmap feedback table, but product concepts were presented as disconnected explanatory cards and rows.
- There was no dedicated route for product, build, and run context.
- Technical placement, visibility, release boundary, and next action were not inspectable together.
- Demo role scoping existed, but no Product Studio-specific visibility boundary was stated in the UI.

## After

- Product Studio provides one synthetic registry with lifecycle, owner, visibility, impact radius, technical placement, evidence, risks, and next human action.
- Product, Build, and Run lenses preserve the selected concept while changing the review context.
- Parking Lot is a filter over the same registry rather than a disconnected backlog.
- The UI distinguishes read-only prototype state from production authorization, publication, feature flags, and deployment.

## Residual risk

The registry is static component data, not canonical product state. This is intentional for the first review slice and must be replaced by an authorized server projection before operational use.
