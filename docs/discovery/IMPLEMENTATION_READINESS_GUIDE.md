---
status: Proposed phase guide
version: 0.1.0
---

# Implementation Readiness Guide

## Objective

Decide whether discovery has produced a bounded, traceable implementation
contract. This guide is a gate, not an implementation plan.

## Required Output Checks

| Check | Complete when |
|---|---|
| Discovery contract | Scope, authority, participants, synthetic boundary, repository boundary, assumptions, and non-goals are accepted |
| Terminology | Material terms have definitions, owners, evidence, lifecycle, and ambiguity disposition |
| Workflow | Every stage has purpose, entry, exit, owner, inputs, outputs, dependencies, exceptions, corrections, and audit implications |
| Decisions | Every consequential decision has owner, evidence, outcomes, prerequisites, approvals, and correction behavior |
| Data meaning | Every implementation-relevant element has purpose, source, creator, consumer, lifecycle, mutability, sensitivity, and freshness |
| Readiness | Every target has separate dimensions, blockers, dependencies, owner, evidence, and rule provenance |
| Events | Every meaningful action has a class, consumer disposition, audit choice, and correction/supersession behavior |
| Domains | Every concept maps to an existing object or has a potential-new-object gate |
| Evidence | Source and review status are explicit; no narrative is silently upgraded |
| History | Corrections and supersessions preserve original answers and decisions |
| Safety | No autonomous clinical, legal, payer, admission, placement, or external action is introduced |
| Owner gate | Human owner and required domain/security reviewers accept the stated scope |

## Readiness Outcomes

### `DISCOVERY_INCOMPLETE`

Use when a material term, stage, authority, data source, decision owner,
readiness dependency, event consumer, or domain boundary is unresolved.

### `OWNER_REVIEW`

Use when the outputs are assembled but required owner or domain review has not
completed.

### `APPROVED_FOR_CONTRACT`

Use when the owner accepts the discovery outputs as the basis for contract
design, but implementation-specific technical decisions remain.

### `IMPLEMENTATION_READY`

Use only when the implementation slice is explicit, all material requirements
are traceable, exclusions are accepted, and the owner has authorized the exact
files, tests, migrations, services, or other changes in a separate handoff.

## Implementation Handoff

An implementation handoff MUST contain:

- discovery ID and session path;
- accepted output package path;
- ledger IDs for each material requirement;
- exact scope and exclusions;
- affected existing domain contracts and ADRs;
- required tests and acceptance behavior;
- human/security/clinical/legal/payer gates;
- unresolved risks and explicit `Unknown` values;
- requested implementation owner;
- independent verification owner;
- no claim of completion before repository checks pass.

## Post-Implementation Return

After implementation, the verification record MUST link back to discovery IDs
and identify:

- requirements implemented;
- requirements deferred or changed;
- tests and commands run;
- evidence not obtained;
- new corrections or supersessions;
- remaining owner decisions.

Discovery is not complete merely because code exists. A changed requirement
returns to the ledger and may move the workflow back to `DISCOVERY_INCOMPLETE`.
