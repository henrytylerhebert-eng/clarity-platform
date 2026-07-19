# ADR-P003 — Server-Owned Transport Qualification

- **Status:** Proposed

## Decision

Transport selection is a server-owned qualification result based on instrument/status, jurisdiction/facility profile, provider category, current credentials, service area, patient capability needs, contracts, destination, and approvals.

The provider registry separates the arranging organization from the actual carrier. Secured transport is not equivalent to restraint.

## Consequences

- The client cannot select a disallowed provider by altering payload fields.
- Provider status must be reverified and may expire.
- Dispatch preserves the exact qualification snapshot and rule versions.
- Static vendor names in this package are examples, not live eligibility claims.

## Rejected

- A dropdown containing all known vendors.
- Treat a broker as the actual transporter.
- Infer transport authority solely from patient willingness or facility acceptance.
