---
status: Integrated draft
owner: TBD (requires revenue-cycle review)
version: 1.0.0
last_integrated: 2026-07-10
source_artifacts:
  - MASTER_ARCHITECTURE.md §12–13, §15 (partial package)
  - reference/source-packages/clarity-ai-database-artifact/docs/INTEGRATION_PLAN.md
  - prisma/schema.prisma (verification/coverage models)
  - data/synthetic-cases/*.json
unresolved_conflicts: "05-benefits-and-payer-intelligence/BENEFITS_AND_PAYER_SPEC.md missing from package"
related_requirements: REQ matrix insurance/benefits rows
related_adrs: ADR-0001, ADR-0002
---

# Benefits Verification

Net-new domain contributed by the Jul 10 packages; nothing pre-existing covered it. Added as a **parallel workstream** on the existing case spine — explicitly not a restart (INTEGRATION_PLAN).

## Workflow separation (each its own record and status)

Data extraction (human-reviewed insurance-card/document extraction) → subscriber relationship → coverage order (primary/secondary) → eligibility → service-specific benefits (deductible, coinsurance, copay, out-of-pocket, service coverage, network status) → authorization requirement → patient education → claim outcome.

Verification proof captures: method, proof artifact, representative, reference number, timestamp, unresolved questions.

## Binding rules (tested where implementable today)

1. **A benefit quote is never a payment guarantee** — every quoted-benefit surface carries the disclaimer (contract: `packages/domain-contracts/src/benefits.ts`; test enforces it).
2. Extracted insurance fields **require human review** before they support downstream steps.
3. Raw member IDs / Medicare identifiers / policy numbers are restricted-access fields — never written to logs or audit payloads (test: `tests/security/no-sensitive-identifiers-in-audit.test.ts`).
4. Financial readiness is a separate dimension — see CASE_WORKFLOW emergency rule.
5. Feature-flagged: `benefits_verification`, `patient_financial_education` (default off).

## Patient financial education

Plain-language benefit summary separating verified fact, estimate, unresolved uncertainty, and final claim outcome; records recipient, language, interpreter, method, acknowledgement, staff member.
