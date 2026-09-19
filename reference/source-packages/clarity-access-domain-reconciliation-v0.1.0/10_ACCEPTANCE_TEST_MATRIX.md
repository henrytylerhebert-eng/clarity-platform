# Access Acceptance Test Matrix

**Status:** PROPOSED_ARCHITECTURE

## Minimum acceptance dimensions

Every canonical scenario should test:

1. normalized input facts;
2. source provenance;
3. triggered rules;
4. rule precedence;
5. possible pathways;
6. blocked transitions;
7. missing information;
8. generated work requirements;
9. role ownership;
10. decision authority;
11. bounded-context state;
12. JourneyPhase projection;
13. user-facing explanation;
14. audit/provenance output;
15. prohibited conclusions.

## Initial scenario expectations

| Scenario | Required assertions |
|---|---|
| ACCESS-SC-001 | Willing/oriented does not become autonomous admission; qualified review remains visible |
| ACCESS-SC-002 | Failed orientation gate blocks only dependent path; no legal/clinical overconclusion |
| ACCESS-SC-003 | Unknown remains unknown; system requests qualified review |
| ACCESS-SC-004 | Opposed/PEC activates legal/emergency review; no automated admission authority |
| ACCESS-SC-005 | Custody/legal work appears with preserved provenance |
| ACCESS-SC-006 | Transfer requirements remain distinct from acceptance/admission |
| ACCESS-SC-007 | Reassessment work generated; no capacity prediction |
| ACCESS-SC-008 | Consent/relationship evidence required; no authority assumed |
| ACCESS-SC-009 | Age-specific rule required; practitioner review remains human |
| ACCESS-SC-010 | Target packet gaps block facility routing, not unrelated workstreams |
| ACCESS-SC-011 | Proposed: medical-stabilization concern takes precedence over placement progression |
| ACCESS-SC-012 | Proposed: guardian unavailable remains unknown and produces work, not a legal conclusion |

## Role projection tests

For each scenario, test at least:

- Central Intake;
- relevant professional reviewer;
- receiving-facility role when applicable.

Assert that:

- Central Intake can see status without receiving unauthorized decision controls;
- reviewers see only the work they can perform/review;
- users never receive buttons solely because they can view the case.

## Fixture-separation tests

Future UI tests should prove:

- Scenario Lab is visibly synthetic;
- operational mode has no demo-role selector;
- operational mode has no "Reset demo data";
- operational mode has no "Simulate tamper";
- missing backend financial data shows an explicit missing/unknown state rather than generated values.

## Refactor regression gate

The future Access refactor is not complete until all accepted canonical scenarios replay against both:

- domain behavior;
- intended user-facing projection.
