# Read-Only Vertical Slice Spec

## User story

As a central intake coordinator, I can open a protective-custody case, select a target transition, see what blocks that target, inspect dependency order and provenance, and jump to the existing workspace that resolves the item.

## Implemented behavior

- Open Dependency Map from role-aware navigation.
- Select case and target transition.
- View primary blocker.
- Toggle visual map and structured list.
- Filter by workstream, owner, status, and wait type.
- Open existing workspaces from each node.
- Return to map with selected case and target retained.
- View synthetic change digest.
- View separated activity and audit/provenance summaries.

## Explicitly not implemented

- Drag-and-drop status changes.
- Production persistence.
- API route.
- Migration.
- Facility criteria enforcement.
- Legal-clock authority.
- Scoring or prediction.

