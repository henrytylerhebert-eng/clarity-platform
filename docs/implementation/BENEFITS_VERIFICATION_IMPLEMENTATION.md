---
status: Implemented and verified against clarity_dev
owner: TBD
version: 1.0.0
last_integrated: 2026-07-13
source_artifacts:
  - packages/benefits-service/ (command service, role policy)
  - packages/case-repository/src/benefitsGateway.ts (approved Prisma adapter)
  - packages/domain-contracts/src/benefits.ts (contracts incl. pre-existing binding rules)
  - prisma/migrations/*_coverage_tenancy_and_versioning
unresolved_conflicts: "member/group/policy identifiers deferred until an encryption capability exists; actor roles trusted from caller until auth exists"
related_requirements: REQ-008 lineage (source REQ matrix missing — OD-1)
related_adrs: ADR-0009 (decision record), ADR-0008, ADR-0003
---

# Manual Insurance and Benefits Verification

The first business-value vertical slice (MVP_ROADMAP Phase 1): a specialist verifies coverage by phone/portal and Clarity records it. Human-performed only. Decisions: **ADR-0009**.

## Command flow

```text
caller → BenefitsCommandService.<command>(envelope)
  1. Zod strict parse — member/group/policy identifier fields DO NOT EXIST
     on any envelope; passing one fails the strict parse
  2. role policy (RecordInsuranceCoverage/RecordFinancialEducation: specialist
     + intake; VerifyEligibility/RecordBenefitVerification: specialist only)
  3. PrismaBenefitsGateway — ONE transaction:
       scoped reads: case {id, org} → coverage {id, org, caseId}
                     → cited documents {id, caseId, org}
                     → cited evidence {id, org, caseId, INSURANCE, APPROVED}
       binding rules: UNKNOWN relationship blocks eligibility;
                      canTransitionEligibility across attempts;
                      quotes only against ACTIVE coverage;
                      disclaimer structurally required
       conditional coverage rollup {id, org, caseId, version} + increment
       atomic audit event (ids/enums/counts — no amounts, no identifiers)
       idempotency record with objectId replay
```

## Commands

| Command | Rule highlights | Audit action |
|---|---|---|
| `RecordInsuranceCoverage` | starts `UNVERIFIED` v0; requires ≥1 same-case APPROVED INSURANCE evidence item; cites card documents; PRIMARY/SECONDARY/TERTIARY ordering | `INSURANCE_COVERAGE_RECORDED` |
| `VerifyEligibility` | new immutable attempt row per payer contact; proofs linked (case-owned only); outcome rolls up onto coverage status (PENDING doesn't); attempts follow the eligibility state machine | `ELIGIBILITY_VERIFICATION_RECORDED` |
| `RecordBenefitVerification` | ACTIVE coverage only; `disclaimerProvided: true` literal (quote impossible without the disclaimer); cost-share fields in cents; sources linked | `BENEFIT_VERIFICATION_RECORDED` |
| `RecordFinancialEducation` | recipient/method/topics + `uncertaintiesDisclosed` (honest-uncertainty rule) + acknowledgement; optional link to a same-case quote | `FINANCIAL_EDUCATION_RECORDED` |

## Verified (this session, local clarity_dev — 16 integration tests)

Coverage: UNVERIFIED creation citing approved evidence + card document, audited with evidence ids; candidate/wrong-category/cross-case evidence refused with nothing written; `memberId`/`groupNumber`/`policyNumber` rejected at the envelope; intake may record but not verify; auditor may do nothing; idempotent replay (one row, one event); audit-failure rollback incl. idempotency record with successful retry. Tenant isolation: A cannot record on B's case, verify B's coverage (non-revealing miss), or cite B's documents as proof; B's coverage byte-identical after attempts. Eligibility: attempt + proofs + `ACTIVE` rollup + version 1, audited with rollup; UNKNOWN relationship blocked; `FAILED → ACTIVE_CONFIRMED` rejected and `FAILED → PENDING → ACTIVE_CONFIRMED` accepted (state machine honored); stale coverage version fails safely. Quotes: refused against non-ACTIVE coverage; impossible without the disclaimer (false and missing both rejected, zero rows); recorded with sources + `PROVIDED` + audit metadata carrying no dollar amounts. Education: recorded with uncertainties + acknowledgement, linked to the quote, audited; cross-case quote links refused.

Full root suite **167/167**; app 37/37; lint, typecheck, `prisma validate`, `migrate status` clean; zero synthetic residue across all nine table groups.

## Known limitations

1. No authentication — roles are trusted envelope input (unchanged platform assumption).
2. Member/group/policy identifiers are not stored anywhere (deliberate — ADR-0009 §3); the `*Encrypted` columns stay NULL until an encryption capability exists.
3. No eligibility re-verification scheduling or expiry; no coordination-of-benefits logic beyond coverage ordering.
4. Education records are append-only with no correction path yet.
5. PayerProfile/payer-memory management deferred; raw payer/plan names only.
