# Human Review and Approval Workflow

## Review states

`UNRESEARCHED → CANDIDATE → SOURCE_CONFIRMED → HUMAN_CONFIRMED`

Alternate paths:

- `CANDIDATE → CONFLICT`
- `CANDIDATE → REJECTED`
- `HUMAN_CONFIRMED → STALE`
- `HUMAN_CONFIRMED → SUPERSEDED`
- any active state → `DEPRECATED`

## Field routing

| Field class | Minimum reviewer |
|---|---|
| Identity, address, website, general contact | Network reviewer |
| Admissions contact/hours | Network reviewer or facility administrator |
| Payer participation | Payer/benefits reviewer |
| License/certification | Compliance reviewer |
| Clinical service line and age range | Facility administrator; clinical review when used operationally |
| Admission labs, inclusion/exclusion criteria | Facility clinical governance reviewer |
| Legal status, guardian or custody requirements | Facility legal/compliance reviewer |
| Acceptance authority/delegation | Facility clinical and legal governance as applicable |
| Transport and law-enforcement handoff | Facility operations plus legal/compliance when jurisdictional |

## Controlled commands

- `StartEnrichmentRun`
- `SubmitCandidatePackage`
- `ApproveCandidateField`
- `RejectCandidateField`
- `RequestCandidateClarification`
- `ResolveCandidateConflict`
- `SupersedeCanonicalField`
- `SuspendCanonicalField`
- `MarkFieldStale`

Each command requires:

- verified actor and tenant from the session;
- command ID and idempotency key;
- expected version for optimistic concurrency;
- rationale when departing from the normal recommendation;
- audit event in the same transaction;
- no client-supplied roles or tenant identifiers.

## Approval behavior

Approval copies only the approved normalized value and the minimum provenance reference into the canonical network profile. The candidate, evidence and decision history remain immutable.

## Conflict behavior

A conflict cannot be resolved by deleting the losing value. The resolution records the selected value, rejected alternatives, rationale, reviewer and effective date.
