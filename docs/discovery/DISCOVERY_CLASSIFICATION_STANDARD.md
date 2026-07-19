---
status: Proposed classification standard
version: 0.1.0
data_boundary: synthetic only for examples
---

# Discovery Classification Standard

Every material statement, answer, term, data element, decision, and event
proposal receives exactly one classification at the time it is recorded.

## Allowed Values

| Classification | Meaning | What it may support |
|---|---|---|
| `Owner Defined` | The human product owner explicitly defines the meaning or boundary. | Discovery scope and owner decisions; not independent evidence |
| `Source Reported` | A participant or source document reports the statement. | Candidate evidence and follow-up questions |
| `Observed` | A person directly observed an action, state, or result and the observer is recorded. | Candidate evidence; review still may be required |
| `Verified` | A qualified reviewer or authoritative source confirmed the statement for the stated scope and time. | Accepted requirements within the verified scope |
| `Derived` | The statement is calculated or interpreted from identified inputs using a named rule/version. | Derived readiness or analytics proposal; never source truth by itself |
| `Assumed` | A temporary working assumption is necessary to continue discovery. | Planning only; must have an owner and review trigger |
| `Unknown` | Available information is insufficient to classify the statement. | A visible gap; cannot support an implementation claim |
| `Owner Decision Required` | The evidence exists but a human owner must choose among material alternatives. | Blocking decision record only |

## Rules

- `Source Reported` is not `Verified` merely because the source sounds
  authoritative.
- `Observed` is not a clinical, legal, payer, or placement determination.
- `Derived` MUST name its inputs, rule, evaluation time, and version.
- `Assumed` MUST include an expiration or review trigger.
- `Unknown` MUST include the fastest path to resolution where known.
- `Owner Decision Required` MUST identify the decision owner and alternatives.
- A classification MUST NOT be upgraded silently. Append a new ledger record
  when a reviewer changes it.

## History

When a statement changes:

1. Preserve the original record.
2. Create a new record with the new classification or answer.
3. Set `supersedes` on the new record.
4. Set `supersededBy` on the old record through an append-only correction record.
5. Record who made the correction, why, and when.

## Relationship To Existing Clarity Labels

WDP classifications are discovery-local and more granular than the product
evidence/status labels in `docs/governance/PRODUCT_EVIDENCE_AND_DECISION_PROTOCOL.md`.
When a discovery output moves into a canonical evidence, ADR, or implementation
record, apply that record's existing label and preserve the WDP discovery ID as
traceability. Do not replace the existing governance vocabulary with this
classification list.
