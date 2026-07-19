---
status: Proposed phase guide
version: 0.1.0
---

# Data Discovery Guide

## Objective

Capture the meaning and ownership of data before proposing fields, schemas, or
interfaces. Data discovery asks what a value means and why it exists; it does
not design the database prematurely.

## Data Meaning Record

| Field | Required content |
|---|---|
| Data ID | Stable ID, such as `DATA-014` |
| Name as spoken | Source wording |
| Meaning | Plain-language definition |
| Purpose | Why the value exists |
| Creator | Person, role, system, or source that creates it |
| Consumer | Person, role, system, or decision that uses it |
| Evidence source | Exact source document, report, observation, or record |
| Classification | WDP classification |
| Sensitivity | Synthetic, operational, PHI-restricted, legal, payer, or unknown |
| Required/optional | Required for which stage and under what condition |
| Mutability | Immutable, append-only, correction-only, or mutable with versioning |
| Versioning | Version, effective date, source revision, or none with rationale |
| Lifecycle | Created, active, superseded, closed, retained, or deleted policy |
| Validation | Format, range, relationship, or human review |
| Freshness | When it expires or must be reverified |
| Unknowns | Missing meaning, source, owner, or policy |

## Data Questions

- Is this a source fact, normalized interpretation, decision, readiness state,
  event, audit record, or derived observation?
- What would be unsafe to infer if the value is blank?
- Who may enter, review, correct, or supersede it?
- What source version supports it?
- Does a later value replace the old value, or create a new history record?
- What does `Unknown` mean here, and how is it different from `Pending`,
  `Not Required`, or `No Measurements Found`?
- Does the value belong to the Case, Episode, workstream, document, evidence,
  review, facility, payer, transport, custody, or audit boundary?
- What tenant, actor, and source ownership must be enforced?

## Data Boundary Rules

- Do not collect a name, identifier, or sensitive fact merely because a form can
  display it.
- Keep patient identity separate from source-linked operational facts when the
  repository uses a token boundary.
- Keep source text beside, not instead of, normalized interpretation.
- Never overwrite an approved or historical source fact without a correction or
  supersession relationship.
- Do not put restricted identifiers into audit metadata.
- A field that cannot be explained by purpose, owner, source, lifecycle, and
  consumer is not ready for implementation.

## Gate

Phase 4 is complete only when implementation-relevant data elements have a
meaning record and source/owner, or are explicitly blocked as unknown. A field
list by itself is not a completed data discovery.
