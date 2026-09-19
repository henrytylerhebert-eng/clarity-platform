# Clarity Access Domain Reconciliation v0.1.0

**Status:** Design baseline / implementation freeze package  
**Created:** 2026-09-18  
**Repository baseline inspected:** `henrytylerhebert-eng/clarity-platform` at `5c4c0b96b018092af3d1a9372b255139e64c1dd9`  
**Baseline commit time:** 2026-09-17T03:26:57Z

## Purpose

This package freezes a coherent design target for the **Clarity Access** domain while the main repository undergoes housekeeping, reconciliation, and truth repair.

It does **not** authorize implementation.

It consolidates the current Access/Crisis Ops/Prescreen material into a single proposed architecture built around:

1. one patient journey;
2. bounded domain objects;
3. parallel workstreams;
4. explicit role authority;
5. governed scenario/rule logic;
6. one canonical scenario registry;
7. clear separation between operational UX, scenario/testing UX, training UX, and developer tooling.

## Core design statement

> **The patient journey provides the spine.  
> Scenario/rule logic provides the branches.  
> Role authority determines who acts.  
> Scenario fixtures prove that changes do not alter behavior unexpectedly.**

## What this package resolves

- Current Access navigation mixes patient journey stages, parallel workstreams, role dashboards, training, testing, and internal tooling.
- `Guided Intake` and the backend `Prescreen` capability overlap substantially.
- Multiple synthetic/demo fixture systems exist for different purposes.
- Some prototype screens render deterministic synthetic display scaffolding that can look operational.
- The frontend `CaseStage`, backend `CaseStatus`, and `PrescreenEncounterStatus` are not presented through one user-facing journey model.
- Central Intake visibility and Central Intake authority are not cleanly separated.

## What this package does not resolve

- clinical policy;
- legal interpretation;
- statutory time requirements;
- facility-specific admission criteria;
- production identity or hosting;
- cross-organization referral architecture;
- production PHI readiness;
- payer integrations;
- final UX design;
- production authorization or admission authority.

Anything in those categories remains subject to qualified human review and future product decisions.

## Package contents

- `00_EXECUTIVE_BRIEF.md`
- `01_ACCESS_PATIENT_JOURNEY.md`
- `02_FEATURE_DISPOSITION_MATRIX.md`
- `03_ACCESS_OBJECT_MODEL.md`
- `04_ACCESS_RULE_REGISTRY.md`
- `05_ACCESS_SCENARIO_REGISTRY.md`
- `06_ACCESS_ROLE_AUTHORITY_MATRIX.md`
- `07_ACCESS_STATE_RECONCILIATION.md`
- `08_ACCESS_UX_INFORMATION_ARCHITECTURE.md`
- `09_SYNTHETIC_DATA_POLICY.md`
- `10_ACCEPTANCE_TEST_MATRIX.md`
- `11_IMPLEMENTATION_HANDOFF.md`
- `12_DECISION_LOG.md`
- `HOUSEKEEPING_FREEZE.md`
- `CLAUDE_ONBOARDING_PROMPT.md`
- `scenarios/access-scenario-registry.json`
- `scenarios/scenario-template.json`
- `rules/access-rule-registry.json`
- `schemas/access-scenario.schema.json`
- `schemas/access-rule.schema.json`
- `handoff/CLAUDE_READ_ONLY_RECONCILIATION_PROMPT.md`
- `handoff/CODEX_IMPLEMENTATION_PROMPT_AFTER_FREEZE.md`

## Recommended use

1. Download and unzip this package outside the repository.
2. Give Claude the entire folder.
3. Start with `CLAUDE_ONBOARDING_PROMPT.md`.
4. Keep implementation frozen while repository housekeeping runs.
5. Use the package to classify discoveries from local branches/worktrees.
6. After housekeeping, reconcile this package against the cleaned repository.
7. Only after explicit owner approval should `11_IMPLEMENTATION_HANDOFF.md` be activated.

## Status vocabulary

This package uses four truth labels:

- **VERIFIED_REPO_FACT** — directly observed in the inspected repository.
- **PROPOSED_ARCHITECTURE** — recommended target design, not implemented truth.
- **SOURCE_HYPOTHESIS** — behavior preserved from an existing synthetic/source artifact but not promoted to clinical/legal authority.
- **QUALIFIED_REVIEW_REQUIRED** — cannot be promoted without the named clinical, legal, operational, security, or facility review.

No generated artifact in this package is evidence of production readiness.
