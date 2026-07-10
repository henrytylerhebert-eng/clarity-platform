---
status: Integrated draft — requires counsel review before any enforcement
owner: TBD (requires legal review)
version: 0.9.0
last_integrated: 2026-07-10
source_artifacts:
  - MASTER_ARCHITECTURE.md §11 (partial package)
  - docs/01-project-architecture.md §7–8 (legal/custody + compliance clocks)
  - reference/source-packages/clarity-mh-architecture/docs/workflows/epec-chain-of-custody-workflow.md
  - app/src/domain/clocks.ts, app/src/domain/custodyLedger.ts (implemented)
unresolved_conflicts: "04-legal-and-regulatory/ missing from package; Louisiana statutory wording unverified (C-4.4)"
related_requirements: REQ matrix legal rows
related_adrs: ADR-0001
---

# Legal-Status Architecture

## Model

The legal layer selects the approved **jurisdictional rule set**, identifies the documented legal-status type, checks forms/signatures/dates/required elements, calculates configured deadlines, distinguishes law vs. policy vs. operational practice, and shows source authority and version.

It does **not** declare a hold valid, decide competency, or authorize transfer.

## Louisiana launch wedge (deepest specification)

PEC / OPC / CEC instrument execution with attestations, the EPEC chain-of-custody lifecycle, and compliance clocks are specified in the Jul 8 documents and implemented as demo logic in `app/` (LegalStatus workspace, `clocks.ts`, hash-chained custody ledger).

## Non-enforcement rule (binding)

**All statutory triggers, durations, and form requirements are configuration, not statutory truth.** Exact current Louisiana statutory wording and official form requirements are unknown and require counsel review before any clock or instrument logic is enforced in software (carried from `docs/06-architecture-review.md`; open in `docs/decisions/OPEN_DECISIONS.md`). The package's jurisdictional-rule-set abstraction (§11) is the target mechanism for making this configurable per jurisdiction.
