# Case Dependency Map Contract

Implementation file: `app/src/domain/caseDependencyMap.ts`.

Map-level fields:

- `caseId`
- `targetTransition`
- `evaluatedAt`
- `rulesOrProjectionVersion`
- `dataFreshness`
- `reviewState`
- `permissionScope`
- `nodes`
- `edges`
- `warnings`
- `unresolvedContradictions`
- `changeDigest`

Node fields:

- `workstream`
- `status`
- `blockingClass`
- `dependencyIds`
- `ownerRole`
- `assignedUser`
- `dueTime`
- `source`
- `reviewState`
- `resolutionWorkspace`
- `lastChangedAt`
- `escalationState`
- `provenanceKind`
- `freshness`
- `waitType`
- `restrictedDetail`
- `explanation`
- `wouldChangeStatus`

State distinctions implemented:

Missing, incomplete, unknown, contradictory, stale, internal wait, external wait, review required, failed/rejected, blocked by dependency, warning, complete, and not applicable.

