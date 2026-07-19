# Test and Evaluation Plan

## Test layers

1. Pure domain tests: normalization, scoring, freshness, conflict and review policy.
2. Contract tests: schemas, nulls, URLs, enums, evidence coverage and version handling.
3. Service tests: tenant scoping, permissions, idempotency, concurrency and audit atomicity.
4. API integration tests: verified principal, error mapping, body limits and denial equivalence.
5. Security tests: SSRF, redirects, private IPs, prompt injection and log redaction.
6. Synthetic accuracy evaluation.
7. Human adjudication pilot before production thresholds.

## Required synthetic scenarios

The included fixture set covers:

- exact match;
- same-name/different-city;
- parent versus campus;
- hospital versus behavioral-health program;
- renamed facility;
- closed facility with historical website;
- conflicting phones;
- conflicting addresses;
- program-scoped payer participation;
- unofficial admission criteria;
- stale personnel;
- ambiguous identity.

## Metrics

- entity precision and recall;
- false-merge rate;
- field precision;
- unsupported-field rate;
- evidence coverage;
- conflict-detection rate;
- stale-data detection rate;
- authoritative-source utilization;
- human-review escalation rate.

Synthetic results validate logic only. They do not establish real-world accuracy.
