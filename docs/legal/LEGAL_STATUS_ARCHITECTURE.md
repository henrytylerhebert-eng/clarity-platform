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

## Implementation status (2026-07-17)

The OPC → PEC → transmission/acceptance → CEC lifecycle described above is implemented as demo logic
in `app/`, replacing the earlier flat draft-status stub in the LegalStatus workspace:

- `app/src/domain/epecRuleSets.ts` — the jurisdictional-rule-set config (§11's target mechanism): statute
  refs, window minutes, examiner types, finding/condition option lists, and decline reason codes. Only
  `la-epec-v1` (Louisiana) is populated today.
- `app/src/domain/epec.ts` — pure lifecycle functions (`issueOpc`, `executePec`, `executeCec`,
  `isPecExamWithinWindow`) that build the next `LegalInstrument` state and the ledger-event fields for
  the caller to append. No React, no app state — framework-free by design.
- `app/src/workspaces/LegalStatus.tsx` — the stage-based UI (OPC issuance, PEC execution and seal,
  transmission/acceptance bridge, CEC execution, frozen summary).
- Reused rather than duplicated: the existing hash-chained custody ledger (`custodyLedger.ts`/
  `hashLedger.ts`), compliance clocks (`clocks.ts`, `ComplianceClock` lane `"Legal"`), and the existing
  facility referral/response pipeline (`FacilityReferral`/`FacilityResponse`, the Packet Preview and
  Routing Response workspaces) — the e-PEC lifecycle links into that pipeline at the transmission stage
  instead of reimplementing accept/decline.

### Module boundary / standalone extraction

The e-PEC pieces above have a narrow, one-directional dependency on the rest of the app: they read
`LegalInstrument`/`CustodyLedgerEvent`/`ComplianceClock`/`FacilityReferral`/`FacilityResponse` from
`domain/types.ts` and call `appendCustodyLedgerEvent`/`readCaseClocks`, but nothing elsewhere in the app
depends on `epec.ts` or `epecRuleSets.ts`. To carve this out as a standalone Louisiana e-PEC product:

1. Keep `epecRuleSets.ts`, `epec.ts`, and `LegalStatus.tsx` together — they are the whole module.
2. Bring along the three integration seams they lean on: the hash-chained ledger
   (`hashLedger.ts`/`custodyLedger.ts`), the generic compliance-clock model (`clocks.ts`,
   `ComplianceClock`), and a minimal facility-referral/response model (a subset of
   `FacilityReferral`/`FacilityResponse`) — none of these are Clarity-specific and can ship as-is.
3. Drop the cross-links into Clarity's other workspaces (Medical Necessity, Bedboard, Case Queue) and
   swap in a standalone case list and auth layer in place of Clarity's `AppState`/role system.
4. Adding a second jurisdiction is adding a new `EpecRuleSet` to `epecRuleSets.ts` — no changes to
   `epec.ts` or `LegalStatus.tsx` are required for that step alone.
