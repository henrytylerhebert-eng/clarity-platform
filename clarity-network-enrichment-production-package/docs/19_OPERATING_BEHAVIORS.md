# Required Operating Behaviors

## Research run

- A run is immutable after completion except for an explicit cancellation or failure annotation.
- Retries create attempt records; they do not erase prior failures.
- The run records prompt, source-policy, schema and tool versions.

## Candidate submission

- Reject the entire package when structural integrity fails.
- Accept no candidate without evidence.
- Discovery-only sources may identify URLs but may not support values.
- Candidate submission is idempotent.

## Review

- Review is field-level, not all-or-nothing at profile level.
- Low-risk contact fields may use one authorized reviewer.
- Acceptance authority and transport/custody configuration require distinct review roles under the proposed policy.
- Same actor cannot satisfy multiple separation-of-duty approvals.
- Stale human-confirmed data remains visible and is not silently demoted or replaced.

## Canonical update

- Only an authenticated server-owned command can update canonical data.
- The command uses optimistic concurrency and writes audit in the same transaction.
- The old value remains linked through supersession.
- A rollback is another governed version, not deletion.

## Routing consumption

- Default search returns approved fields only.
- Candidate and stale fields are visible only to permitted reviewers unless explicitly requested.
- Sensitive values expose operational-use status and approval version.
- Routing logic cannot treat unknown or stale information as a negative fact.

## Failure behavior

- Source outage yields partial or failed run status, never fabricated data.
- Conflicting sources yield `CONFLICT`, never automatic selection.
- Ambiguous entity resolution creates a human task and blocks extraction publication.
- Unauthorized tenant access returns equivalent not-found/denial behavior without revealing record existence.
