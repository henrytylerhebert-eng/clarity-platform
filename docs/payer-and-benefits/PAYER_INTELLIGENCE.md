---
status: Integrated draft
owner: TBD
version: 1.0.0
last_integrated: 2026-07-10
source_artifacts:
  - MASTER_ARCHITECTURE.md §13, §26 (partial package)
  - reporting-metrics-rebuild-package/ (metrics substrate, Jul 8)
unresolved_conflicts: "Package payer spec and commercial model missing"
related_requirements: REQ matrix payer rows
related_adrs: ADR-0001
---

# Payer Intelligence

## Payer and plan memory

Organization-specific historical knowledge: payer aliases, portal instructions, contact numbers, carve-outs, common requirements, pend/denial patterns, typical verification and authorization times.

The local synthetic app now exposes four operations configuration families —
Medicare, Medicaid, VA, and commercial — through
`app/src/domain/payerProfiles.ts`. They are versioned discovery prompts only;
they do not replace current-patient verification or encode authoritative payer
criteria. Backend `PayerProfile`/`PlanProfile` management remains deferred.
The canonical comparison for this POC slice is recorded in
`clarity-readiness-ux-return-package/20_CANONICAL_PAYER_REFERENCE_REVIEW.md`.

**Binding rule (tested):** payer memory is always labeled **historical and unconfirmed for the current patient** and can never substitute for current-patient verification (`packages/domain-contracts/src/payerMemory.ts`). Feature flags: `payer_memory`, `contract_rate_intelligence` (default off).

## Analytics and ROI

The `reporting-metrics-rebuild-package/` (formula inventory, metric definitions, dashboard modules, SQL blueprint) is the existing metrics substrate — company-agnostic utilization-review operating intelligence. Package-side ROI framing (§26) measures time, touches, rework, verification/authorization cycle time, packet quality, access, denials, audit. Both are hypotheses until baselined; **no operational measurements exist** ("No measurements found" register in the Jul 8 README).

## Referral prioritization

Financial readiness may be shown alongside — never blended into — clinical urgency, operational readiness, and placement readiness. No opaque combined score (tested in domain contracts).
