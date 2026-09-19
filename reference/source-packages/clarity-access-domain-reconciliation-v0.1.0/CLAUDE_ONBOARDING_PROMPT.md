# Claude Onboarding Prompt

Copy the prompt below into Claude Code with this entire folder available.

---

You are onboarding to the **Clarity Access Domain Reconciliation v0.1.0** design package.

Repository of interest:
`henrytylerhebert-eng/clarity-platform`

The package was built from a read-only inspection of GitHub `main` at:

`5c4c0b96b018092af3d1a9372b255139e64c1dd9`

Your first task is **not implementation**.

## Operating mode

HOUSEKEEPING / READ-ONLY RECONCILIATION.

Do not:
- edit product code;
- redesign UI;
- create migrations;
- delete branches/worktrees;
- merge PRs;
- rebase;
- reset databases;
- change fixtures;
- modify state machines;
- add roles;
- add integrations;
- deploy;
- promote any clinical/legal/facility rule to authority.

Read this package in this order:

1. `README.md`
2. `HOUSEKEEPING_FREEZE.md`
3. `00_EXECUTIVE_BRIEF.md`
4. `01_ACCESS_PATIENT_JOURNEY.md`
5. `02_FEATURE_DISPOSITION_MATRIX.md`
6. `03_ACCESS_OBJECT_MODEL.md`
7. `04_ACCESS_RULE_REGISTRY.md`
8. `05_ACCESS_SCENARIO_REGISTRY.md`
9. `06_ACCESS_ROLE_AUTHORITY_MATRIX.md`
10. `07_ACCESS_STATE_RECONCILIATION.md`
11. `08_ACCESS_UX_INFORMATION_ARCHITECTURE.md`
12. `09_SYNTHETIC_DATA_POLICY.md`
13. `10_ACCEPTANCE_TEST_MATRIX.md`
14. `12_DECISION_LOG.md`

Then read the current repository truth sources:
- `README.md`
- `ARCHITECTURE.md`
- `IMPLEMENTATION_STATUS.md`
- `CLAUDE.md`
- `AGENTS.md`
- relevant ADRs;
- Access/Crisis Ops/Prescreen source code;
- open PRs related to Access/Prescreen;
- local worktrees/branches only if they are available.

## Your job during housekeeping

Produce a **Reconciliation Report**, not code.

For every claim in this package classify it as:

- `CONFIRMED_BY_CURRENT_MAIN`
- `CONFIRMED_BY_LOCAL_ONLY_WORK`
- `PROPOSED_AND_COMPATIBLE`
- `PROPOSED_BUT_CONFLICTS_WITH_CURRENT_ARCHITECTURE`
- `SUPERSEDED`
- `UNKNOWN`
- `OWNER_DECISION_REQUIRED`
- `QUALIFIED_REVIEW_REQUIRED`

Specifically determine:

1. whether Guided Intake and Prescreen should converge as proposed;
2. all current duplicate/synthetic/demo data sources;
3. which UI surfaces are operational, training, scenario, or developer tools;
4. every current lifecycle/state representation touching Access;
5. every role model touching Access;
6. which scenario fixtures are canonical, duplicate, or stale;
7. whether any local-only work changes this package materially;
8. which open PRs affect this architecture;
9. what must be preserved before cleanup;
10. the smallest safe implementation sequence after housekeeping.

## Required output

Create no repository changes.

Return:

- Executive finding
- Repo baseline
- Local-state delta, if accessible
- Feature disposition reconciliation
- Patient-journey reconciliation
- Rule/scenario reconciliation
- Role/authority reconciliation
- Synthetic-data reconciliation
- State-model reconciliation
- Open-PR impact
- Conflicts
- Unknowns
- Owner decisions
- Qualified-review gates
- Proposed freeze-exit checklist
- Recommended first bounded implementation slice

Do not treat polished documentation as proof. Use code, migrations, tests, actual repository state, and explicit owner decisions as evidence.

End with:

`IMPLEMENTATION AUTHORIZATION: NOT GRANTED`

until Tyler explicitly lifts the freeze.
