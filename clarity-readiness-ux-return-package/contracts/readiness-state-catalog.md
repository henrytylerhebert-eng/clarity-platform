# Readiness State Catalog

Node statuses:

- `missing`
- `incomplete`
- `unknown`
- `contradictory`
- `stale`
- `waiting-internal`
- `waiting-external`
- `review-required`
- `failed-rejected`
- `blocked-by-dependency`
- `warning`
- `complete`
- `not-applicable`

Blocking classes:

- `hard-blocker`
- `review-gate`
- `external-wait`
- `warning`
- `satisfied`
- `not-applicable`

Rules:

- Financial readiness is a warning/parallel lane for emergency clinical review.
- Candidate or unreviewed evidence cannot be treated as approved truth.
- Unknown, stale, restricted, and external-wait states must remain visually distinct.

