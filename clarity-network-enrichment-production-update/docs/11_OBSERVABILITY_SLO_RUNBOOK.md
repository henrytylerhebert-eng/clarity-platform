# Observability, SLOs and Runbook

## Service indicators

- run-start success rate;
- source fetch success by domain/type;
- validation rejection rate;
- evidence coverage rate;
- unsupported-field rate;
- entity-resolution status distribution;
- conflict rate;
- stale-field count;
- review queue age;
- approval/rejection rate;
- canonical command failure rate;
- cross-tenant denial-test failures;
- outbound egress blocks.

## Proposed SLOs

These are proposed operational targets, not measured performance:

- API availability: 99.9% monthly for directory reads.
- Review command durability: 99.99% once acknowledged.
- Cross-tenant data exposure: zero tolerated events.
- Candidate fields without evidence: zero accepted packages.
- Human-confirmed overwrite by agent: zero tolerated events.

## Alerts

Page immediately for:

- cross-tenant access anomaly;
- canonical write without review event;
- agent overwrite attempt against human-confirmed value;
- secret/token detected in logs;
- source retrieval reaching private network ranges;
- audit transaction failure after canonical mutation.

## Incident response

1. Disable new enrichment runs.
2. Keep approved directory reads available where safe.
3. Suspend affected candidate/canonical fields.
4. Preserve logs, evidence hashes and audit trails.
5. Determine tenant/source/run scope.
6. Correct through supersession, never silent mutation.
7. Re-enable only after cause, test and reviewer signoff.
