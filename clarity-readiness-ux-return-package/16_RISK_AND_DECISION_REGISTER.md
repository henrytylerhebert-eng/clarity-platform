# Risk And Decision Register

## Risks

- The map could be mistaken for production authorization unless synthetic/read-only labels remain visible.
- Local view-model fields could drift from future service contracts.
- Missing workflow task/backend dependency model limits operational truth.
- Activity history could be mistaken for compliance-grade audit.
- Facility response state could be mistaken for facility-criteria decision support.

## Decisions Tyler must approve before next production-oriented slice

- Whether to create a server-owned read projection for the map.
- Whether dependency/blocker/task semantics graduate into domain contracts.
- Whether URL-based workspace state is worth a routing change.
- Which target transition vocabulary becomes canonical.
- Which owner is responsible for operational validation of protective-custody readiness workflow.

