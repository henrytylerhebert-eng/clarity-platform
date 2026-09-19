# Housekeeping Freeze

## Owner intent

Freeze new Clarity Access implementation while the existing repository, local worktrees, branches, migration state, open PRs, source material, and canonical status documents are reconciled.

## Allowed during freeze

- read-only repository inspection;
- local-vs-main inventory;
- branch/worktree/stash inventory;
- open-PR disposition analysis;
- documentation truth repair;
- identification of redundant or superseded artifacts;
- scenario and rule cataloging;
- fixture provenance review;
- design review of this package;
- owner decisions recorded as proposed decisions.

## Not allowed during freeze

Without explicit owner authorization, do not:

- redesign the production UI;
- add new Access features;
- merge Guided Intake and Prescreen in code;
- delete old workspaces;
- change state machines;
- create migrations;
- introduce production roles;
- create cross-organization data flows;
- replace synthetic fixtures;
- hard-code facility criteria;
- encode legal or clinical conclusions;
- modify live integrations;
- deploy anything;
- treat this package as an implementation mandate.

## Freeze exit gate

The freeze may be lifted only after:

1. local and GitHub state have been reconciled;
2. stale/open PRs have been dispositioned;
3. canonical current-state docs match actual `main`;
4. migration/database drift is understood;
5. repository visibility/source-material risk is resolved;
6. the owner approves the Access Patient Journey;
7. the owner approves the Feature Disposition Matrix;
8. the owner approves the initial Scenario/Rule architecture;
9. a bounded implementation work package is written;
10. exact acceptance tests are named before code changes begin.

## Rule

> **Preserve first. Reconcile second. Decide third. Implement last.**
