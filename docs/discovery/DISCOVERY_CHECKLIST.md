---
status: Proposed facilitator and reviewer checklist
version: 0.1.0
---

# Workflow Discovery Checklist

## Before The Session

- [ ] Workflow name and discovery ID created.
- [ ] Human owner identified.
- [ ] SME/domain participants identified.
- [ ] Authority and source material recorded.
- [ ] Synthetic/data boundary confirmed.
- [ ] Repository boundary set to documentation-only.
- [ ] Related case, workstream, ADRs, contracts, and scenarios listed.
- [ ] Non-goals and known unknowns recorded.

## During Discovery

- [ ] Phase 0 contract confirmed.
- [ ] Terms captured before workflow steps.
- [ ] Ambiguous terms preserved verbatim.
- [ ] Every answer classified.
- [ ] Every answer appended to the ledger.
- [ ] Workflow stages captured in order.
- [ ] Entry and exit criteria recorded for each stage.
- [ ] Owners, participants, approvals, dependencies, and handoffs recorded.
- [ ] Failure and correction paths recorded.
- [ ] Decisions separated from facts and readiness states.
- [ ] Data meaning captured before field design.
- [ ] Independent readiness dimensions preserved.
- [ ] Blockers have owners and evidence.
- [ ] Every action classified as audit, source, timeline, readiness, derived, or none.
- [ ] New event consumers are named or event proposals are deferred.
- [ ] Concepts map to existing domain objects or are marked potential new objects.
- [ ] Corrections preserve the original answer.

## Before Owner Review

- [ ] All phase statuses are current.
- [ ] No material unknown is hidden in prose.
- [ ] Terminology glossary is internally consistent or contradictions are shown.
- [ ] Workflow has no unreviewed skipped stage.
- [ ] Decision owners and outcome sets are complete.
- [ ] Source/evidence map is complete or blocked explicitly.
- [ ] Readiness/dependency map is separate by dimension.
- [ ] Audit and governed-event catalogs are distinct.
- [ ] Domain mapping identifies all potential new objects.
- [ ] Output traceability matrix links requirements to ledger IDs.
- [ ] Implementation scope and exclusions are explicit.

## Owner Gate

- [ ] Owner accepts discovery scope.
- [ ] Domain reviewers accept domain interpretations.
- [ ] Security/privacy reviewer accepts the data boundary and unresolved risks.
- [ ] Required legal, clinical, payer, authorization, placement, or operations
      reviewers are identified and their status is recorded.
- [ ] Owner decisions are recorded in canonical decision records where needed.
- [ ] Final status is `DISCOVERY_INCOMPLETE`, `OWNER_REVIEW`,
      `APPROVED_FOR_CONTRACT`, or `IMPLEMENTATION_READY` with rationale.

## Handoff

- [ ] Accepted outputs are routed to canonical repository documents.
- [ ] Implementation prompt cites discovery IDs and files.
- [ ] Exact implementation exclusions are stated.
- [ ] Required tests and verification commands are stated.
- [ ] Independent verification owner is named.
- [ ] No implementation claim is made before tests and repository checks pass.
