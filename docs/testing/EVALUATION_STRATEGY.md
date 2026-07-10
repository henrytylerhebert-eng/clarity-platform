---
status: Integrated draft — package strategy file missing
owner: TBD
version: 0.9.0
last_integrated: 2026-07-10
source_artifacts:
  - MASTER_ARCHITECTURE.md §24 (partial package)
  - reference/source-packages/clarity-mh-architecture/implementation/acceptance-tests.md
  - app/ Vitest + Playwright suites (implemented)
  - tests/ (integration-session baselines)
unresolved_conflicts: "13-testing-and-evaluation/TEST_AND_EVALUATION_STRATEGY.md missing from package"
related_requirements: REQ matrix testing rows
related_adrs: ADR-0001
---

# Test and Evaluation Strategy

## Implemented today

- **`app/` unit tests (Vitest):** domain logic — bedboard, clocks, guardrails, hash ledger, packets, roles, storage.
- **`app/` smoke tests (Playwright):** closed-loop journey, desktop + mobile.
- **`tests/` root workspace (Vitest):** safety and workflow baselines added by the integration session — case creation, state transitions (valid + invalid), parallel workstream updates, append-only audit, organization isolation, insurance-extraction review requirement, subscriber relationship, eligibility status changes, benefits disclaimer, authorization transitions, emergency-review-vs-financial-block, payer-memory labeling, no combined referral score, synthetic seed loading, no sensitive identifiers in audit logs.
- **Data checks:** JSON validity of `data/synthetic-cases/`.

## Target evaluation suites (documented, not yet implemented)

Extraction accuracy; citation support; contradiction detection; clinical/legal prohibited-language; benefits/payment-language; tenant isolation; prompt injection; workflow integrity; human factors; fairness. Synthetic coverage must grow to the package's 10-case set (7 missing — gap) spanning commercial, Medicare Advantage, traditional Medicare, supplemental, uninsured, minors, coordination of benefits, medical exclusion, legal deadlines, no-bed.

## Rule

A check is only reported as passing if it actually ran and passed — see `docs/repository-audit/06_VALIDATION_SUMMARY.md` for the current honest state.
