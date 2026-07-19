# Network Enrichment Event Catalog

| Event | Trigger | Minimum metadata |
|---|---|---|
| `NETWORK_ENRICHMENT_RUN_REQUESTED` | Authorized run command accepted | run, actor, tenant, source-policy version |
| `NETWORK_ENRICHMENT_RUN_STARTED` | Worker begins | worker, prompt/model/tool versions |
| `NETWORK_SOURCE_FETCHED` | Approved source retrieval completes | domain, source type, status, content hash; no body |
| `NETWORK_SOURCE_BLOCKED` | Egress or policy denies source | rule, domain, reason |
| `NETWORK_ENTITY_RESOLUTION_COMPLETED` | Candidate scoring completes | status, selected ID, scores, human-review flag |
| `NETWORK_CANDIDATE_SUBMITTED` | Valid candidate stored | field path, evidence count, review route |
| `NETWORK_CONFLICT_DETECTED` | Competing values found | field path, candidate IDs |
| `NETWORK_CANDIDATE_PARTIALLY_APPROVED` | Multi-review quorum incomplete | actor, role, remaining roles |
| `NETWORK_CANDIDATE_APPROVED` | Approval quorum completed | actor, field path, prior/new state |
| `NETWORK_CANDIDATE_REJECTED` | Reviewer rejects | rationale code, actor |
| `NETWORK_CANONICAL_FIELD_SUPERSEDED` | Approved value replaces prior | old/new version references |
| `NETWORK_FIELD_MARKED_STALE` | Freshness policy triggers | policy version, next action |
| `NETWORK_ENRICHMENT_RUN_COMPLETED` | Run closes | counts, limitations, validation result |
| `NETWORK_ENRICHMENT_RUN_FAILED` | Terminal failure | safe error code, retryability |

Events must be append-only, tenant-scoped, correlated, and free of unrestricted source content, secrets, and PHI.
