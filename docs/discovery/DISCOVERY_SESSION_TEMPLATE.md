---
status: Template
version: 0.1.0
data_boundary: synthetic only unless a separate approved privacy boundary exists
---

# Workflow Discovery Session

## Session Header

| Field | Value |
|---|---|
| Discovery ID | `DISC-[YYYYMMDD]-[WORKFLOW]-[NNN]` |
| Workflow name | `[Required]` |
| Workflow version | `[Required]` |
| Session date/time | `[Required; include timezone]` |
| Facilitator | `[Required]` |
| Recorder | `[Required]` |
| Human owner | `[Required]` |
| Authority/source | `[Owner, SME, approved document, or Unknown]` |
| Participants | `[Names or synthetic role labels]` |
| Scope | `[What is included]` |
| Non-goals | `[What is explicitly excluded]` |
| Repository boundary | `docs only during discovery` |
| Data boundary | `synthetic only` |
| Current status | `PLANNED` |
| Related case/workstream | `[Existing Clarity area or Unknown]` |
| Related records | `[Paths, ADRs, requirements, scenarios]` |

## Discovery Contract

### Objective

`[What should this discovery make understandable?]`

### Authority

`[Who can define, verify, approve, or reject the workflow?]`

### Known Assumptions

| Assumption | Classification | Owner | Expiration/review trigger |
|---|---|---|---|
| `[Assumption]` | `Assumed` | `[Owner]` | `[Trigger]` |

### Known Unknowns

| Unknown | Affected phase | Owner to resolve | Blocking? |
|---|---|---|---:|
| `[Unknown]` | `[Phase]` | `[Owner]` | `[Yes/No]` |

## Participant Matrix

| Person/role | Relationship to workflow | Authority | Evidence supplied | Review responsibility |
|---|---|---|---|---|
| `[Person or synthetic role]` | `[Role]` | `[Authority or Unknown]` | `[Source]` | `[Review]` |

## Phase Record

Use one block for each phase. Do not mark a phase complete while a material
unknown is unresolved.

### Phase 0: Discovery Contract

- Status: `PLANNED | IN_PROGRESS | DISCOVERY_INCOMPLETE | OWNER_REVIEW`
- Notes:
- Owner decisions:
- Ledger IDs:
- Blocking unknowns:

### Phase 1: Terminology

- Status:
- Terms discovered:
- Ambiguous terms:
- Owner decisions:
- Ledger IDs:
- Blocking unknowns:

### Phase 2: Workflow

- Status:
- Stages discovered:
- Skipped or disputed stages:
- Exceptions:
- Ledger IDs:
- Blocking unknowns:

### Phase 3: Decisions

- Status:
- Decisions discovered:
- Unowned decisions:
- Appeals/corrections:
- Ledger IDs:
- Blocking unknowns:

### Phase 4: Data

- Status:
- Data elements discovered:
- Source gaps:
- Sensitive-data concerns:
- Ledger IDs:
- Blocking unknowns:

### Phase 5: Readiness

- Status:
- Readiness dimensions:
- Blockers and owners:
- Freshness requirements:
- Ledger IDs:
- Blocking unknowns:

### Phase 6: Events

- Status:
- Source events:
- Audit events:
- Derived events:
- Consumers:
- Ledger IDs:
- Blocking unknowns:

### Phase 7: Domains

- Status:
- Existing domain mappings:
- Potential new domain objects:
- Related contracts/ADRs:
- Ledger IDs:
- Blocking unknowns:

### Phase 8: Implementation Readiness

- Status:
- Required outputs complete:
- Owner decisions complete:
- Exclusions confirmed:
- Final status: `DISCOVERY_INCOMPLETE | OWNER_REVIEW | IMPLEMENTATION_READY`

## Session Closeout

### Accepted Statements

| Discovery ID | Statement | Classification | Accepted by | Date |
|---|---|---|---|---|
| `[ID]` | `[Statement]` | `[Classification]` | `[Owner/reviewer]` | `[Date]` |

### Corrections And Supersessions

| Record ID | Supersedes | Reason | New record | Reviewer |
|---|---|---|---|---|
| `[ID]` | `[ID]` | `[Reason]` | `[ID]` | `[Reviewer]` |

### Owner Gate

- Decision: `[ ] Continue discovery` `[ ] Accept for contract design` `[ ] Approve implementation readiness` `[ ] Defer` `[ ] Reject`
- Owner:
- Date:
- Notes:

No implementation may begin from this template alone. The completed session
must cite the accepted output package and discovery ledger.
