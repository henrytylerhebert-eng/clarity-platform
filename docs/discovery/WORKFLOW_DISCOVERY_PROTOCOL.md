---
status: Proposed normative protocol
owner: Human project owner with domain, technical, security, and operations review
version: 0.1.0
date: 2026-07-19
data_boundary: synthetic only for examples; no production data
---

# Workflow Discovery Protocol

## 1. Mission

The WDP converts an interview with a product owner or subject-matter expert
into a traceable implementation contract without inventing requirements.

```text
human expertise
  -> structured discovery
  -> terminology and ownership
  -> normalized workflow
  -> decisions and readiness
  -> event and audit proposals
  -> existing Clarity domain mapping
  -> implementation-readiness review
  -> approved implementation handoff
```

The WDP is domain-agnostic. It can be used for crisis intake, legal status,
benefits verification, authorization readiness, placement, utilization review,
MAR processing, discharge planning, referral management, reporting, or a future
module. The protocol does not decide what any domain policy means.

## 2. Normative Rules

The terms `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative.

- The facilitator MUST preserve the speaker's meaning before proposing a
  normalized term.
- Every material statement MUST have one WDP evidence classification.
- Unknowns MUST remain visible and MUST NOT be converted into assumptions.
- Ambiguous terminology MUST be recorded as ambiguous until the owner or SME
  resolves it.
- Workflow stages MUST be captured in sequence without silently merging or
  skipping stages.
- A decision MUST identify its owner, evidence, possible outcomes, prerequisites,
  approvals, exceptions, and correction behavior.
- A field MUST be described by purpose, creator, consumer, evidence, mutability,
  lifecycle, and confidence before it is proposed for implementation.
- Readiness MUST be represented by separate dimensions and dependencies. The WDP
  MUST NOT create a single opaque score from independent workstreams.
- Events, audit actions, timeline entries, and derived observations MUST remain
  separate concepts unless an accepted domain decision explicitly combines
  them.
- Corrections MUST append a new record and preserve the original record.
- A discovered concept that does not fit an existing Clarity domain object MUST
  be marked `Potential New Domain Object`; it MUST NOT create a new object by
  default.
- Discovery MUST NOT authorize software, data, policy, external action, or
  production use.
- A workflow with a material unresolved question MUST be `DISCOVERY_INCOMPLETE`,
  not `IMPLEMENTATION_READY`.

## 3. Roles

| Role | Responsibility |
|---|---|
| Human owner | Defines authority, resolves owner decisions, accepts or rejects the discovery output |
| SME/interviewee | Supplies domain meaning, current practice, exceptions, evidence, and terminology |
| Facilitator | Asks phase questions, prevents scope drift, and does not fill gaps from memory |
| Recorder | Maintains the session record and append-only discovery ledger |
| Domain reviewer | Checks clinical, legal, benefits, authorization, placement, operations, or other domain meaning |
| Technical reviewer | Checks repository fit, state-machine implications, data ownership, and implementation boundaries |
| Security/privacy reviewer | Checks tenant, identity, audit, retention, sensitive data, and external-action implications |
| Implementation agent | Receives only accepted outputs and reports repository-grounded implementation evidence |

One person MAY hold multiple roles in a synthetic exercise, but the discovery
record MUST disclose the overlap and any required dual-control or independent
review gate.

## 4. Status Model

| Status | Meaning | May route to implementation? |
|---|---|---:|
| `PLANNED` | Scope exists but the interview has not started | No |
| `IN_PROGRESS` | Discovery is actively collecting records | No |
| `DISCOVERY_INCOMPLETE` | A material question, authority, or domain boundary remains unresolved | No |
| `OWNER_REVIEW` | Required outputs are assembled and awaiting owner/domain review | No |
| `APPROVED_FOR_CONTRACT` | Owner accepted the discovery outputs as the basis for contract design | No, unless implementation gate also passes |
| `IMPLEMENTATION_READY` | Required outputs, decisions, evidence, and exclusions are complete | Only within the explicitly approved slice |
| `SUPERSEDED` | A later discovery record replaces this package | No; follow the superseding record |

## 5. Phase Sequence

### Phase 0: Discovery Contract

Establish workflow name, scope, authority, participants, synthetic boundary,
repository boundary, current implementation status, assumptions, owner
decisions, and known unknowns. Produce the session header. Gate: the owner or
authorized facilitator confirms the scope and non-goals.

### Phase 1: Terminology Discovery

Define important terms before describing the workflow. For every term capture
meaning, owner, creator, consumer, start, end, evidence, documents, events,
unknowns, and owner decisions. Gate: no term with material ambiguity may be
treated as canonical.

### Phase 2: Workflow Discovery

Walk one stage at a time. Capture purpose, entry, exit, inputs, outputs, owner,
participants, evidence, documents, approvals, dependencies, failure paths,
correction paths, and audit implications. Gate: every stage has an explicit
entry and exit condition, or is marked incomplete.

### Phase 3: Decision Discovery

Turn each consequential decision into a decision object. Capture purpose, owner,
evidence, outcomes, prerequisites, approvals, exceptions, appeals, correction,
audit event, governed event, and readiness impact. Gate: no decision is
represented as an implicit rule or recommendation.

### Phase 4: Data Discovery

Collect meaning, not a premature field list. For each data element capture
purpose, creator, consumer, evidence source, mutability, versioning, lifecycle,
confidence, required/optional status, sensitivity, and unknowns. Gate: every
required element has a source and owner, or is explicitly blocked.

### Phase 5: Readiness Discovery

For every stage answer: `Can this progress?` Record target, readiness state,
satisfied requirements, missing requirements, blockers, dependencies,
responsible owner, workspace, evidence, rule provenance, freshness, review
requirements, and unknowns. Gate: dimensions remain separate and no combined
score hides a blocker.

### Phase 6: Event Discovery

For every meaningful action distinguish source fact, audit action, governed
event, timeline entry, readiness change, and derived observation. Capture
trigger, actor, evidence, state before/after, correction, supersession, and
unknowns. Gate: each proposed governed event has a named consumer and owner, or
is explicitly deferred.

### Phase 7: Domain Discovery

Map concepts to existing Clarity objects whenever possible: Case, Episode,
Assessment, Evidence, Document, Benefits Verification, Authorization, Review,
Documentation Gap, MAR, Transport, Custody, Timeline, Audit Event, Governed
Event, and Outbox Event. Mark mismatches as `Potential New Domain Object` and
record the owner decision required. Gate: no new object is implied by a label
alone.

### Phase 8: Implementation Readiness

Assemble the normalized workflow, terminology glossary, actor/role matrix,
decision matrix, source/evidence maps, data ownership map, readiness matrix,
dependency map, exception/correction matrices, event catalogs, domain mapping,
owner decisions, unresolved questions, fixture readiness, and focused test
scenarios. Gate: the final status is `DISCOVERY_INCOMPLETE` unless all material
unknowns have an accepted disposition.

## 6. Interview Loop

For each question:

1. Ask the smallest question that can resolve one concept.
2. Record the answer verbatim or with a clearly marked paraphrase.
3. Assign one classification from `DISCOVERY_CLASSIFICATION_STANDARD.md`.
4. Link the answer to the workflow, term, decision, data element, readiness
   stage, event, or domain concept it affects.
5. Identify contradictions with earlier answers.
6. Append a correction or supersession record instead of editing history.
7. Ask the next question only after recording the current result.

The facilitator MUST ask at most three focused questions in one interaction
unless the owner requests a batch review.

## 7. Completion And Handoff

The discovery package is complete only when:

- all phases have a status;
- all material terms are defined or marked unresolved;
- every workflow stage has entry/exit conditions;
- every decision has an owner and outcome set;
- every implementation-relevant data element has meaning and source;
- every readiness blocker has an owner;
- every proposed event has a consumer decision or explicit deferral;
- every concept maps to an existing domain object or has a new-object gate;
- the owner has reviewed the output and exclusions;
- the implementation-readiness guide marks the package `IMPLEMENTATION_READY`.

The implementation handoff MUST cite discovery IDs and artifact paths. A code
agent MUST not infer requirements from a transcript when the accepted output is
available.

## 8. Repository Integration

The WDP package lives under `docs/discovery/`. It feeds, but does not replace:

- `docs/architecture/ADR-*.md` for architectural decisions;
- `docs/decisions/OPEN_DECISIONS.md` for unresolved owner/security gates;
- `docs/workflows/` for accepted workflow requirements;
- `docs/clinical/`, `docs/legal/`, and `docs/payer-and-benefits/` for domain
  requirements and qualified review;
- `packages/domain-contracts/` for implemented contracts and state machines;
- `prisma/schema.prisma` for the canonical persistence model;
- `IMPLEMENTATION_STATUS.md` for verified implementation status;
- `docs/developer-handoff/` for accepted implementation instructions.

The WDP ledger is a traceability record, not a transactional source of truth.
