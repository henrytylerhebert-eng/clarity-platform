# Synthetic Data & Fixture Policy

**Status:** PROPOSED_ARCHITECTURE

## Principle

> **Synthetic is safe and useful. Hidden synthetic is confusing.**

Synthetic data remains the default for development and testing until production-data controls are approved.

## Fixture classes

### 1. Scenario fixtures
Purpose:
- deterministic domain behavior;
- rule testing;
- regression testing.

May appear:
- Scenario Lab;
- automated tests.

Must not masquerade as operational patient state.

### 2. UX fixtures
Purpose:
- layout;
- interaction;
- empty/populated-state design.

May appear:
- explicit Demo/Scenario environments.

### 3. Training fixtures
Purpose:
- Learning & Practice;
- role-play;
- competency rehearsal.

May appear:
- training product surfaces only.

### 4. Engineering fixtures
Purpose:
- auth;
- tenancy;
- migration;
- failure injection;
- concurrency;
- security tests.

May appear:
- developer/internal tooling only.

## Prohibited prototype pattern

Do not generate meaningful-looking patient, payer, financial, legal, or clinical facts solely from arbitrary identifiers just to populate a screen.

If the source does not exist, display:

- Not recorded
- Not available
- Not yet verified
- No source connected
- Unknown
- Not assessed

as appropriate.

## Current repository example

VERIFIED_REPO_FACT:
The prototype `deriveCoverage(caseId)` uses deterministic case-id logic to generate payer/coverage/benefit display state.

Disposition:
Remove that pattern from operational-looking Access UX during the future refactor. Use actual synthetic backend records or an explicit Scenario fixture instead.

## Fixture identity

Every fixture should include:
- fixture class;
- canonical scenario ID where applicable;
- synthetic-only flag;
- source/provenance;
- intended test surface;
- prohibited reuse;
- version.

## No duplicate truth

Different test harnesses may require different physical fixtures.

But when two fixtures represent the same scenario, both should reference the same canonical `ACCESS-SC-*` identity.
