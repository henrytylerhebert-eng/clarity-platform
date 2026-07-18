# Observability, Deployment, and Rollback

**Artifact status:** All proposed diagrams, schemas, commands, examples, and code-like contracts in this file are **Proposed and unverified** unless a statement is explicitly classified otherwise.


## Observability goals

Operators must know:

- whether commands are succeeding safely;
- whether events are being projected;
- whether the queue/dashboard is fresh and complete;
- whether data is quarantined or corrected;
- whether tenant/security boundaries are being denied as expected;
- whether metrics were recomputed;
- without putting PHI in telemetry.

## Structured logging

### Safe base fields

```json
{
  "timestamp": "2026-07-18T21:00:00Z",
  "level": "info",
  "service": "clarity-api",
  "version": "git-sha",
  "environment": "synthetic-local",
  "requestId": "req_...",
  "correlationId": "corr_...",
  "route": "POST /api/v1/cases/:caseKey/admission-handoffs",
  "actorId": "opaque-user-id",
  "organizationId": "opaque-org-id",
  "capability": "episode.admissionHandoff.create",
  "decision": "ALLOW",
  "aggregateType": "Episode",
  "aggregateId": "opaque-episode-id",
  "eventId": "opaque-event-id",
  "statusCode": 201,
  "durationMs": 42
}
```

Actor/aggregate IDs may themselves be restricted and should be reviewed; they are preferable to names/source text.

### Never log

- authorization header, bearer/session token, IdP assertion;
- raw body;
- patient name/MRN/DOB/contact;
- payer member/group/policy ID;
- note/gap/correction narrative;
- source document text;
- raw external payload;
- query result rows;
- database connection string/secrets;
- cryptographic key/tokenization input.

### Log events

- command accepted/denied/failed;
- idempotent replay/key conflict;
- event appended;
- delivery claimed/projected/retried/quarantined;
- recompute started/completed/failed;
- metric snapshot calculated/suppressed/pending;
- export lifecycle later;
- RLS/context failure;
- security rate limit/body limit.

## Metrics

### API

- request count by route template/status;
- latency distribution;
- authentication failures;
- authorization denials by capability/reason;
- validation/concurrency/idempotency conflicts;
- active requests;
- database error count.

### Event/projector

- appended events by type;
- pending/retry/quarantined deliveries;
- oldest pending age;
- event sequence lag;
- processing latency;
- retry count;
- dead-letter/quarantine count;
- checkpoint by projector;
- replay/recompute duration;
- unsupported schema version.

### UR operational

- open queue item count by organization/facility and reason code (telemetry access restricted);
- overdue review count;
- open gap count;
- projection stale count;
- source disagreement count.

These telemetry counts are operational health indicators and must not be exposed as ungoverned business dashboards.

### Mart/metrics

- facts loaded/rejected;
- de-identification failure;
- prohibited-field guard failure;
- source watermark lag;
- snapshot calculation duration/failure;
- no-data/insufficient/suppressed response counts;
- active definition versions;
- recompute queue depth.

### Database

- connection pool;
- transaction duration;
- lock waits/deadlocks;
- query latency;
- table/index growth;
- RLS policy errors;
- replication/backup health when available.

## Tracing

Trace:

```text
HTTP request
→ auth
→ command service
→ transaction
→ event append
```

and separately:

```text
event delivery
→ projector
→ operational projection
→ mart transform
→ metric recompute
```

Link through correlation/event/recompute IDs. Do not attach payloads or patient attributes.

## Alerts

No thresholds are invented here. Establish thresholds from observed synthetic/pilot baselines.

Alert classes:

- API unavailable/readiness failed;
- authentication provider unavailable;
- DB unavailable/pool exhausted;
- oldest event-delivery age above approved SLO;
- repeated projector failure/quarantine spike;
- mart freshness beyond approved window;
- metric recompute failures;
- prohibited-field/privacy guard failure — high severity;
- cross-tenant/RLS test canary failure — high severity;
- audit/event immutability control failure — high severity;
- backup/restore failure;
- export failure/acknowledgement later.

## Health endpoints

### Liveness

Process is running; no dependency checks that create restart loops.

### Readiness

- configuration loaded;
- database reachable;
- required migrations compatible;
- identity/auth dependency according to API needs;
- worker can claim/commit;
- analytics schema/role available for analytics process;
- no known incompatible schema version.

Health responses contain no secrets, tenant counts, or PHI.

## Deployment units

**Proposed:**

1. static React client;
2. API process;
3. projection worker;
4. analytics/metric worker;
5. explicit migration job;
6. PostgreSQL;
7. identity provider;
8. observability stack.

A small pilot may run the two workers in one process, but keep separate entry points/config/credentials so they can split without contract changes.

## Environment configuration

- validated at startup;
- secrets through approved secret manager;
- no production defaults;
- facility timezone is data, not environment;
- feature flags server-owned;
- worker concurrency and lease settings explicit;
- redaction enabled;
- environment banner preserves synthetic-only state until approved.

Unknown provider-specific settings remain open.

## Deployment sequence

### D0 — Pre-deploy

- approved ADRs/decisions;
- clean/reviewed diff;
- tests/lint/typecheck/build/Prisma pass;
- migration SQL reviewed;
- backup/restore evidence for target;
- privacy/security review for enabled data;
- feature flags off;
- rollback version/artifacts identified.

### D1 — Migration

Run explicit additive migration with migrator role. Verify schema version and old app compatibility.

### D2 — API/service deploy

Deploy code with routes/features disabled. Verify liveness/readiness, auth, current routes, and no behavior regressions.

### D3 — Projection worker shadow

Process synthetic/pilot events and build projections. Do not expose UI. Verify lag, replay, and expected fixtures.

### D4 — Analytics worker shadow

Load allowlisted facts and calculate snapshots. Run privacy/prohibited-field checks and compare expected metrics.

### D5 — Internal query enablement

Enable API queries only for test/admin-approved synthetic scope. Verify authorization and responses.

### D6 — UI enablement

Enable per tenant/role. Monitor errors, lag, queue discrepancies, and user feedback.

### D7 — Real-data pilot

Only after managed identity, RLS, security/privacy, backup, retention, and operational approval.

## Rollback strategy

### API/UI rollback

- disable feature flags;
- remove navigation;
- revert API/client deployment;
- keep additive schema;
- do not delete events/audit.

### Worker rollback

- stop new worker version;
- restore prior worker version;
- reset/branch projector checkpoint only through approved operation;
- rebuild projection from immutable ledger;
- do not edit source events.

### Mart rollback

- revoke/disable aggregate query;
- stop mart worker;
- switch active metric snapshot/view to prior approved run/definition;
- retain new facts/snapshots for audit or quarantine;
- correct through new run, not destructive rewrite.

### Migration rollback

Prefer forward fix because additive data and PostgreSQL enum changes can make down migration unsafe. A destructive rollback requires explicit backup restore approval and audit.

### Bad event/data rollback

There is no delete-based business rollback. Append correction/reversal, recompute affected projection/metrics, and preserve history.

## Release compatibility

- schema backward compatible with one prior app version where feasible;
- event consumers ignore unsupported future event types safely and quarantine unsupported required versions;
- event schemas are versioned;
- metric definitions are versioned;
- API uses `/v1`;
- frontend tolerates stale/projection-pending metadata;
- migrations do not require all workers to update simultaneously without a documented sequence.

## Runbooks

### Projection lag

1. inspect queue depth/oldest delivery;
2. identify event type/projector/version;
3. confirm DB/locks;
4. isolate poison event to quarantine;
5. resume unrelated processing;
6. reprocess after fix;
7. verify watermark and queue/dashboard freshness.

### Source disagreement

1. identify conflicting active events;
2. mark affected facts `PENDING_REVIEW`;
3. prevent metric publication if policy requires;
4. authorized human selects/corrects source;
5. append correction;
6. recompute;
7. close quality issue.

### Privacy guard failure

1. disable mart query/worker;
2. preserve logs without copying prohibited data;
3. identify affected schema/build;
4. revoke reader access if required;
5. assess exposure under incident process;
6. fix allowlist/schema;
7. rebuild mart from governed events;
8. document approval before re-enable.

### Cross-tenant anomaly

1. disable affected route/feature;
2. preserve security audit;
3. verify principal, predicates, RLS, cache keys;
4. assess exposure;
5. patch and run full cross-tenant suite;
6. rotate/revoke access as required;
7. owner/security approval before re-enable.

### Metric dispute

1. freeze affected metric status/display;
2. show `Definition under review` or prior approved version;
3. inspect definition, source events, fixtures, calculation;
4. approve new version if changed;
5. recompute with lineage;
6. never silently replace history.

## Disaster recovery

Before production:

- define recovery point/time objectives;
- automated encrypted backups;
- restore test including audit/event tables;
- key/KMS recovery;
- migration/version inventory;
- worker checkpoint recovery;
- mart rebuild procedure from event ledger;
- incident contacts;
- evidence that rollback does not erase corrections/audit.

No recovery claims are made by this package.
