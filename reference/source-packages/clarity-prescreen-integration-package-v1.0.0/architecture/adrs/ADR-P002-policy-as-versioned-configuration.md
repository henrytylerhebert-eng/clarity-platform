# ADR-P002 — Facility and Jurisdiction Policy as Versioned Configuration

- **Status:** Proposed

## Decision

Medical-clearance requirements, packet requirements, inclusion/exclusion processes, acceptance authority, minor/consent rules, transport categories, and exceptions are versioned profiles with source provenance, scope, approval, effective dates, tests, and supersession.

Policy extraction produces candidates only. Human approval is required before a rule affects a case.

## Consequences

- A second facility becomes a new profile, not a code fork.
- Historical case evaluations retain the rule version used at the time.
- Onboarding and approval tooling become first-class product capabilities.
- Stale/expired profiles create visible review states rather than silently continuing.

## Rejected

- Hard-code one hospital’s checklist or medical-clearance criteria.
- Treat uploaded policy text as immediately executable.
- Update active rules without version history.
