# API and Service Contracts

## Boundary

The browser never writes to enrichment tables directly. HTTP routes authenticate, validate transport input, map errors and delegate. Business authorization remains in services/policies.

## Proposed routes

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/network-enrichment/runs` | Start a bounded research run. |
| GET | `/api/network-enrichment/runs/:runId` | Read run status and provenance. |
| POST | `/api/network-enrichment/runs/:runId/candidate-package` | Internal agent/worker submission. |
| GET | `/api/network-enrichment/review-queue` | Role-scoped review queue. |
| POST | `/api/network-enrichment/candidates/:candidateId/approve` | Approve one field. |
| POST | `/api/network-enrichment/candidates/:candidateId/reject` | Reject one field. |
| POST | `/api/network-enrichment/conflicts/:conflictId/resolve` | Resolve a conflict. |
| GET | `/api/network-directory/organizations/:id` | Read approved profile with freshness. |
| GET | `/api/network-directory/search` | Search approved entities only by default. |

## Common command envelope

```json
{
  "commandId": "uuid",
  "idempotencyKey": "opaque-client-key",
  "expectedVersion": 3,
  "correlationId": "uuid",
  "payload": {}
}
```

Tenant, actor ID and roles are never accepted from the request body.

## Error shape

```json
{
  "error": {
    "code": "CONCURRENCY_CONFLICT",
    "message": "The record changed before this command completed.",
    "requestId": "req_...",
    "details": []
  }
}
```

## Status mapping

- 400 malformed transport/input
- 401 authentication failure
- 403 permission denied
- 404 tenant-safe not found
- 409 idempotency or concurrency conflict
- 422 domain validation or review requirement
- 429 rate limit
- 503 dependency unavailable

## Query metadata

Every network-profile response returns:

- profile version;
- generated time;
- field freshness summary;
- conflict count;
- source coverage;
- operational-use status;
- data-quality state;
- permissions applied.
