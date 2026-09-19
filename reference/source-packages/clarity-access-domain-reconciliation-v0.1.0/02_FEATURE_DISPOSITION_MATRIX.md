# Access Feature Disposition Matrix

**Status:** PROPOSED_ARCHITECTURE based on VERIFIED_REPO_FACT inspection.

| Current feature | Current observed role | Disposition | Target |
|---|---|---|---|
| Case Queue | Synthetic case list/work queue | MERGE | Access Home / Work Queue |
| Command Center | Coordination + clocks + POC/product content | SPLIT + MERGE | Operations → Access Home; product content → Internal |
| New Case | Creates Case + Encounter + Assessment together | REFACTOR | Referral |
| Case Overview | Summary over case artifacts | KEEP + REDESIGN | Patient Journey Summary |
| Guided Intake | localStorage field/clinical assessment UI | MERGE/HARVEST | Prescreen UX |
| Prescreen backend | Versioned assessment + rules + API + persistence | PROMOTE | Canonical Access prescreen engine |
| Evidence Review | Derived source/risk review view | EMBED | Prescreen / Qualified Review panel |
| Medical Necessity | Clinical documentation support | EMBED | Clinical workstream |
| Legal Status | Legal/custody workflow | KEEP AS LANE | Legal workstream |
| Benefits Verification | Prototype display scaffolding plus separate real backend capability | REWIRE | Financial workstream |
| Authorization Readiness | Prototype derived readiness plus separate backend capability | REWIRE | Financial / UR workstream |
| Packet Preview | Referral packet assembly | MERGE | Facility Review |
| Routing Response | Simulated facility response | MOVE UNTIL CROSS-ORG READY | Scenario Lab → later Receiving Facility UX |
| Milieu Bedboard | Post-acceptance placement support | MOVE | Pre-Admission |
| Custody Ledger | Cross-cutting history/provenance | KEEP, NOT STAGE | Case Timeline / History |
| Training & SOPs | Onboarding/training | MOVE | Learning & Practice |
| Mock Admit Lab | Synthetic scenario/training tool | MOVE | Scenario Lab |
| Product Studio | Internal product tooling | MOVE | Developer/Internal |
| IOP Reconciliation | Separate program-operations domain | MOVE | Operations |
| Demo role selector | Unverified display scoping | DEV/SCENARIO ONLY | Scenario Lab |
| Reset demo data | Fixture reset control | DEV/SCENARIO ONLY | Scenario Lab |
| Tamper simulation | Integrity demonstration | DEV/SCENARIO ONLY | Internal/Scenario Lab |

## Immediate product implications

### Guided Intake vs Prescreen
Do not continue evolving both as independent product concepts.

- **Prescreen** should own canonical domain logic.
- **Guided Intake** should be treated as UX material to harvest where valuable.

### Evidence
Evidence is a supporting capability, not a patient journey stage.

### Medical / Legal / Benefits / Authorization
These are parallel workstreams, not a sequential forced path.

### Packet / Routing
These belong to facility review and receiving-organization interaction.

### Bedboard
This belongs after acceptance in pre-admission.

### Training / Mock / Product Studio
These should never sit beside the operational patient journey as peer workspaces.

## Removal criterion

A workspace should not be preserved merely because code already exists.

Keep code only when it has a clear target role in:

- journey;
- workstream;
- role home;
- scenario/testing;
- training;
- developer/internal tooling.
