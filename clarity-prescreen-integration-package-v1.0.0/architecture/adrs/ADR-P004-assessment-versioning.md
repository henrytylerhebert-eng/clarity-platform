# ADR-P004 — Immutable Attested Assessments

- **Status:** Proposed

## Decision

Assessment drafts may be edited. Attestation creates an immutable `AssessmentVersion`. Post-attestation changes are corrections or supplements referencing the prior version, reason, source, actor, and effect.

## Consequences

- Central Intake and facility reviewers can see what changed after submission.
- A packet references an exact assessment version.
- Corrections require projection recomputation but do not delete history.
- Draft autosave and server version conflicts need explicit UX.

## Rejected

- Overwrite the latest assessment in place.
- Store only a generated PDF.
- Create a new case for every supplement.
