# Access Reconciliation Decision Log

This is a package-local proposed decision log. It is not a replacement for the repository's canonical Open Decisions register.

## ARD-001 — Access journey
**Proposed:** seven-stage Access journey:
Referral → Prescreen → Qualified Review → Facility Review → Pre-Admission → Transfer/Handoff → Admission.

Status: OWNER REVIEW.

## ARD-002 — Prescreen convergence
**Proposed:** Prescreen becomes the canonical domain engine; Guided Intake becomes UX material to harvest rather than a competing domain model.

Status: OWNER REVIEW.

## ARD-003 — Parallel workstreams
**Proposed:** Clinical, medical, legal, evidence, benefits, authorization, placement, and transport are parallel lanes rather than a fixed screen sequence.

Status: OWNER REVIEW.

## ARD-004 — Role authority
**Proposed:** every capability distinguishes SEE / DO / REVIEW / DECIDE / OWN.

Status: OWNER REVIEW.

## ARD-005 — Scenario Registry
**Proposed:** one canonical Access Scenario Registry; physical fixtures may differ but map to canonical scenario IDs.

Status: OWNER REVIEW.

## ARD-006 — Synthetic-mode separation
**Proposed:** Operational, Scenario Lab, Learning & Practice, and Developer/Internal modes are separated.

Status: OWNER REVIEW.

## ARD-007 — No invented operational facts
**Proposed:** operational-looking screens do not fabricate clinically, legally, financially, or operationally meaningful facts for display.

Status: OWNER REVIEW.

## ARD-008 — JourneyPhase
**Proposed:** expose `JourneyPhase` as a deterministic user-facing projection over existing bounded-context states, not as a replacement state machine.

Status: OWNER REVIEW.

## ARD-009 — Admission boundary
**Proposed:** Access ends at confirmed admission; Episode begins there.

Status: OWNER REVIEW.

## ARD-010 — Housekeeping freeze
**Proposed:** no Access refactor code until the repository truth layer is reconciled.

Status: OWNER INTENT EXPRESSED; needs formal repo disposition if it becomes operating policy.
