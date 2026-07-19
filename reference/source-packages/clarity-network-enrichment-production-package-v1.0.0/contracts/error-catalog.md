# Error Catalog

| Code | HTTP | Behavior |
|---|---:|---|
| `AUTHENTICATION_FAILED` | 401 | Non-revealing authentication failure. |
| `PERMISSION_DENIED` | 403 | Actor lacks required scope or role. |
| `NOT_FOUND` | 404 | Tenant-safe not found; avoid identifier leakage. |
| `VALIDATION_FAILED` | 422 | Schema, source, evidence, state or rationale rule failed. |
| `REVIEW_REQUIRED` | 422 | Sensitive field lacks approval quorum. |
| `CONCURRENCY_CONFLICT` | 409 | Expected version is stale. |
| `IDEMPOTENCY_CONFLICT` | 409 | Same key reused with different command input. |
| `SOURCE_NOT_ALLOWED` | 422 | Source type/domain is prohibited for the field. |
| `SOURCE_UNAVAILABLE` | 503 | Approved dependency unavailable. |
| `RATE_LIMITED` | 429 | Source or tenant limit reached. |
| `EGRESS_BLOCKED` | 422 | SSRF/private-network/redirect policy denied fetch. |
| `RUN_CANCELLED` | 409 | Run is no longer writable. |
