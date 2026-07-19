---
status: OWNER_REVIEW
discovery_id: DISC-20260719-PC-001
version: 0.1.0
data_boundary: synthetic only
---

# Output Traceability

| Requirement | Ledger IDs | Output | Canonical destination after acceptance | Implementation / verification |
|---|---|---|---|---|
| Define MAR without authorizing medication | `DL-0001`, `DL-0012`, `DL-0013` | Terminology, data, workflow | Medication domain decision or existing contract | Synthetic MAR review scenario; no code in this slice |
| Capture PEC source and 72-hour clock | `DL-0002` through `DL-0005` | Terminology, workflow, data | Legal workflow and human approval gate | Source timestamp/timezone test if later authorized |
| Preserve facility ownership and timezone | `DL-0004`, `DL-0007`, `DL-0018` | Data, readiness, events | Episode persistence contract | Explicit timezone derivation test already exists in S2 |
| Keep pre-admission authorization unchanged | `DL-0017` | Decisions, workflow | Existing authorization-readiness contract | Existing authorization test suite |
| Link post-admission UR to Episode | `DL-0016`, `DL-0018`, `DL-0019` | Decisions, domain mapping | Episode persistence and authorization contract | Episode-owned UR integration tests |
| Separate outcomes from risk flags | `DL-0019` | Decisions, readiness, events | Domain contracts and event vocabulary | Seven-state outcome and risk-separation tests |
| Preserve raw benefits narrative | `DL-0009` through `DL-0011` | Data, readiness | Benefits verification workflow | Source/raw/derived mapping test if later authorized |
| Use existing governed event vocabulary | `DL-0020` | Events, traceability | Event vocabulary decision packet | Event envelope and consumer tests |
| Preserve corrections and supersession | All records; especially `DL-0021` | Exceptions, ledger | Existing append-only contract | Correction and active-branch tests |
| Keep regulated decisions human-owned | `DL-0021` | Session, decisions, readiness | Human approval gates and domain docs | Review-gate verification |

No implementation file is authorized by this package. Any future handoff must
cite these discovery IDs and separately name the approved files, tests, owners,
and reviewer.
