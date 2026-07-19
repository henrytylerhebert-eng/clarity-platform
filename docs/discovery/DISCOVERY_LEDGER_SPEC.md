---
status: Proposed append-only discovery ledger specification
version: 0.1.0
data_boundary: synthetic only for examples; no production data
---

# Discovery Ledger Specification

## Purpose

The Discovery Ledger preserves the path from an SME interview answer to an
accepted implementation requirement. It is a documentation traceability
record, not a runtime database, event store, audit table, or transactional
source of truth.

## Record Shape

Every ledger record MUST contain:

| Field | Requirement |
|---|---|
| `discoveryId` | Stable ID for the session or workflow |
| `recordId` | Unique record ID, such as `DL-[YYYYMMDD]-[NNNN]` |
| `question` | The exact question asked or the prompt that elicited the answer |
| `answer` | Verbatim answer or clearly labeled paraphrase |
| `owner` | Person/role responsible for the answer or follow-up |
| `timestamp` | Date/time with explicit timezone |
| `workflow` | Workflow and stage affected |
| `evidence` | Source document, participant, observation, or record reference |
| `classification` | One allowed value from the classification standard |
| `status` | `ACTIVE`, `SUPERSEDED`, `BLOCKED`, or `ACCEPTED` |
| `supersedes` | Prior record ID, or null for an original |
| `supersededBy` | Later record ID, or null while active |
| `affectedArtifacts` | Terms, steps, decisions, data, readiness, events, or domains affected |
| `reviewer` | Reviewer or null when not yet reviewed |
| `reviewNotes` | Contradictions, limitations, and follow-up |

## Append-Only Behavior

- Original answers MUST NOT be edited away.
- A correction is a new record that references the superseded record.
- A clarification that narrows scope MAY supersede an earlier answer while
  preserving the earlier context.
- A contradiction MUST be recorded as a contradiction, not resolved by the
  recorder's preference.
- A rejected answer remains visible with its rejection reason.
- A session closeout MUST list all active unresolved records.

## Ledger Statuses

| Status | Meaning |
|---|---|
| `ACTIVE` | Current record for discovery; not necessarily accepted |
| `BLOCKED` | Requires an owner, SME, security, legal, clinical, payer, or technical response |
| `ACCEPTED` | Accepted for the stated discovery output and scope |
| `SUPERSEDED` | Replaced by a later record; retained for traceability |

## Traceability Rules

Every implementation requirement MUST cite one or more accepted ledger records.
Every accepted ledger record SHOULD cite the output artifact it produced. A
missing link means the requirement is not implementation-ready.

## Minimum Example

```yaml
discoveryId: DISC-20260719-MAR-001
recordId: DL-20260719-0001
question: "What does MAR mean in this workflow?"
answer: "Medication Administration Record."
owner: "Product owner"
timestamp: "2026-07-19T15:00:00-05:00"
workflow: "Medication reconciliation / admission"
evidence: "Owner interview"
classification: "Owner Defined"
status: "ACCEPTED"
supersedes: null
supersededBy: null
affectedArtifacts: [terminology, workflow, data]
reviewer: "Domain reviewer"
reviewNotes: "Medication authorization remains a separate prescriber/facility gate."
```
