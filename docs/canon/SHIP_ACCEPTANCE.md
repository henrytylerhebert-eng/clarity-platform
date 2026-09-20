# Shippable Product Acceptance v1.0

## Definition of “shippable” in this package

A Clarity product release is shippable when:

1. semantics are explicit;
2. persistence is authorized by ADR/implementation gate;
3. authority and tenant boundaries are enforced;
4. Work/History/Explore/Flow/Ask Clarity read from the same governed truth;
5. consequential mutations use governed commands;
6. provenance/history/correction are preserved;
7. unknown/missing states are represented honestly;
8. acceptance tests prove no-collapse rules;
9. desktop/mobile/accessibility checks pass for shipped surfaces;
10. release claims distinguish verified implementation from planned design.

This definition does not itself mean PHI-ready or production-clinical-ready.

Those require separate security/privacy/clinical/legal/integration approvals.

## Product acceptance: whole experience

### Work
- Cases scan shows what deserves attention and why.
- Case Workspace preserves context.
- authorized actions are obvious.
- candidate work is not presented as assignment.
- technical details are available but not dominant.

### History
- user can reconstruct what changed and when.
- effective vs recorded time is preserved.
- superseded decisions remain traceable.
- longitudinal intervals are understandable.

### Explore
- 2D relationship view uses the same truth as Work.
- no graph edge invents authority or causality.
- inspector opens precise conventional detail.

### Flow
- uses governed cross-Case data.
- shows operational movement and waits.
- does not become a competing source of status.

### Ask Clarity
- supports Query / Trace.
- answers distinguish fact/observation/claim/inference/decision/derived state.
- unknown remains unknown.
- candidate proposals are clearly labeled.
- command execution remains gated until authorized.

## Longitudinal acceptance

A synthetic person with multiple bounded records can be viewed longitudinally without:

- redefining Episode;
- overwriting prior decisions;
- collapsing LOC dimensions;
- inventing one health/readiness score;
- treating discharge as outcome;
- treating missing continuity data as negative evidence.

## Release line

### Ready now
- contract/pure-projection longitudinal slice on current `main`;
- canon package;
- semantic lock;
- Tree 5 implementation spec;
- read-only UX prototyping/research.

### Next to ship
- Work + History read-only vertical slice using Day 1 → Day 39.

### Gated
- persistence;
- mutating API;
- governed longitudinal UI commands;
- actual-discharge command;
- AI commands.

## Final pre-release question

Can an authorized user answer, without guessing:

- What is happening?
- Why?
- How do we know?
- What is missing/unknown?
- What changed over time?
- What can I do?
- What requires someone else’s authority?
- What happened after transition?

If not, the product slice is not ready to ship.


