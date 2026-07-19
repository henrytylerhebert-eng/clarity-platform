---
status: OWNER_REVIEW
discovery_id: DISC-20260719-PC-001
version: 0.1.0
data_boundary: synthetic only
---

# Synthetic Fixture And Focused Test Scenarios

This is a documentation fixture specification, not executable seed data.

## Inferred Fixture Values

| Area | Synthetic value | Classification |
|---|---|---|
| Patient | `synthetic-patient-michael-scot-001`, display label Michael Scot, age 65 | `Source Reported` / `Assumed` |
| Case | `synthetic-case-peralta-michael-scot-001` | `Owner Defined` |
| PEC | `PEC-SYN-20260718-001`, issued 2026-07-18 14:00 Central, expires 2026-07-21 14:00 Central | `Assumed` / `Derived` |
| Coroner source | Dr. Jim Halpert, `COR-SYN-20260718-001` | `Source Reported` / `Assumed` |
| Sending site | Lafayette General Emergency Department | `Assumed` |
| Receiving site | Oceans of Lafayette, Geriatric Behavioral Health, Unit G-3, bed G-312 | `Assumed` |
| Facility timezone | `America/Chicago`, `tzcfg-olf-20260719-v1` | `Assumed` |
| Coverage | Medicare Part A primary; Humana secondary; Medicaid coordination record; Aetna/Amanda contact note | `Assumed` |
| Medications | Exelon 9.5 mg/24-hour patch daily; Cymbalta 60 mg PO daily; Abilify 10 mg PO daily | `Assumed` |
| MAR | Exelon patch changed 2026-07-18 08:00; Cymbalta and Abilify last accepted 2026-07-17 08:00 and were refused 2026-07-18 08:00; no known drug allergies reported; prescriber review required | `Assumed` |
| Medical screen | BP 138/82, pulse 88, respirations 18, temperature 98.6 F, SpO2 97% on room air, glucose 102; no acute injury or identified medical instability in the synthetic packet | `Assumed` |
| Initial UR outcome | `PENDING` | `Assumed` |
| Initial risk flags | `DOCUMENTATION_GAP`, `DUE_DATE_EXPOSURE` | `Derived` |
| Facility acceptance | April 18:20 Central; Angela 18:35 Central; Janis receives nursing handoff 20:20 Central | `Assumed` |
| Transport | Andy departs Lafayette General 19:05 Central and arrives Oceans 20:10 Central | `Assumed` |
| Admission | 2026-07-18 20:10 Central after acceptance and arrival | `Assumed` |

## Focused Test Scenarios

1. MAR expands to Medication Administration Record and remains separate from
   medication authorization.
2. PEC issue plus 72 hours derives the expected expiration using the explicit
   facility timezone.
3. A missing timezone blocks service-date derivation rather than using the
   browser or server timezone.
4. The source case links to one admitted Episode after accepted handoff.
5. Pre-admission authorization readiness remains unchanged.
6. Post-admission UR is owned by the Episode and attributed to Victor's
   scenario role.
7. The initial coverage outcome is `PENDING`.
8. `PENDING` and `DOCUMENTATION_GAP` coexist without replacing one another.
9. `AT_RISK` is rejected as an authorization outcome.
10. Approved, denied, pending, expired, unrequested, unknown, and not-required
    remain distinct coverage outcomes.
11. Benefits facts retain the raw narrative and derived normalization.
12. Aetna/Amanda is not silently created as a fourth active coverage.
13. A medication refusal becomes evidence/gap data, not an autonomous order.
14. Facility acceptance is recorded as a named human source fact.
15. `ADMISSION_RECORDED.v1` occurs only after accepted handoff and admission.
16. `AUTHORIZATION_DAY_DECISION_RECORDED.v1` carries source and correction
    references.
17. A documentation gap creates `DOCUMENTATION_GAP_RECORDED.v1` but a status
    transition remains history/audit.
18. Corrections preserve the original record and enforce one active branch.
19. Tenant, actor, correlation, and event-envelope fields are server-governed.
20. No test invokes an autonomous clinical, legal, admission, placement,
    payer, or medication decision.

## Fixture Exclusion

Do not load this table into production, a real patient chart, a real payer
workflow, or a live facility integration. Executable test data requires a
separate owner-approved implementation slice.
