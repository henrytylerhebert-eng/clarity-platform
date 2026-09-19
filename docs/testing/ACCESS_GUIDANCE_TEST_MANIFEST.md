# Access Guidance Projection — Test Manifest (Access Slice 4B)

**Code:** `packages/domain-contracts/src/accessGuidance.ts` — `deriveAccessGuidance()`
**Tests:** `tests/unit/access-guidance.test.ts` (30 tests, unit, no database)
**Baseline:** branched from `origin/main` at `44c3ec2` (2026-09-19), which contains Slice 3
(PR #115, `899ca98`).

This is a **pure, derived projection**. It is not a WorkItem engine, not a workflow, and not
an assignment or prioritization mechanism. Nothing is persisted. Every candidate is marked
`nonBinding: true`.

## Signal mappings

Every class is a direct reading of an existing status, or of `evaluatePacketReadiness`.

| Scope | Source fact | BlockingClass | Why this is not new policy |
|---|---|---|---|
| `CASE_PROGRESSION` | `CaseStatus = INFORMATION_INCOMPLETE` | `HARD_BLOCKER` | JourneyPhase already reports this status as disposition `BLOCKED` |
| `CASE_PROGRESSION` | `CaseStatus = FACILITY_RESPONSE_PENDING` | `EXTERNAL_WAIT` | The status names a wait on an external party. No timing, SLA or escalation is attached |
| — | `MEDICAL_TRANSFER_REQUIRED`, `REFERRED_TO_ALTERNATIVE_LEVEL`, `NO_PLACEMENT_FOUND`, `CLOSED`, `CANCELLED`, `WITHDRAWN` | *(no signal)* | Already conveyed by `journey.disposition`; classifying them would invent policy (OD-24 is open) |
| `PRESCREEN` | `PrescreenEncounterStatus = NEEDS_INFORMATION` | `HARD_BLOCKER` | The encounter cannot advance until information returns. Scoped to the prescreen, not the case |
| `PRESCREEN_TARGET` | requirement listed in `evaluatePacketReadiness(target).blockers` | `HARD_BLOCKER` | Reuses the existing evaluator |
| `PRESCREEN_TARGET` | requirement listed in `.warnings` | `WARNING` | Reuses the existing evaluator |
| `PRESCREEN_TARGET` | relevant requirement in `ACCEPTED_FOR_PACKET` | `SATISFIED` | The evaluator's unflagged residue |
| `PRESCREEN_TARGET` | relevant requirement in `NOT_APPLICABLE_WITH_AUTHORITY` | `NOT_APPLICABLE` | The evaluator's unflagged residue. Any other unflagged state **throws** (fail closed) |
| `WORKSTREAM` | `BLOCKED` | `HARD_BLOCKER` | Workstream status, scoped to that lane |
| `WORKSTREAM` | `PENDING_REVIEW` | `REVIEW_GATE` | Workstream status |
| `WORKSTREAM` | `READY`, `COMPLETE` | `SATISFIED` | Workstream status |
| `WORKSTREAM` | `NOT_APPLICABLE` | `NOT_APPLICABLE` | Workstream status |
| — | `NOT_STARTED`, `IN_PROGRESS` | *(no signal)* | No attention to report |

## Next-work mapping

| Signal | NextWorkKind | Role / workspace | Suppressed when |
|---|---|---|---|
| `CASE_PROGRESSION` `HARD_BLOCKER` | `RESOLVE_CASE_INFORMATION` | none | — (`INFORMATION_INCOMPLETE` is not terminal) |
| `PRESCREEN` `HARD_BLOCKER` | `RESOLVE_PRESCREEN_INFORMATION` | none | — (`NEEDS_INFORMATION` is not terminal) |
| `PRESCREEN_TARGET` `HARD_BLOCKER` | `RESOLVE_PACKET_REQUIREMENT`, one per requirement across all targets it blocks | the requirement's own `responsibleRoleCode` (only if present) and `resolutionWorkspace` | prescreen is terminal (`PRESCREEN_TERMINAL`) |
| `WORKSTREAM` `BLOCKED` | `RESOLVE_WORKSTREAM_BLOCK` | none | case is terminal (`CASE_TERMINAL`) |
| `WORKSTREAM` `PENDING_REVIEW` | `REVIEW_WORKSTREAM` | none | case is terminal |
| `WORKSTREAM` `READY` | `START_READY_WORKSTREAM` | none | case is terminal |
| `EXTERNAL_WAIT`, `WARNING`, `SATISFIED`, `NOT_APPLICABLE` | *(none)* | — | — |

"Terminal" is derived, not declared: a status is terminal if the existing state machine gives
it no outgoing transition. For cases that is `CLOSED`, `CANCELLED` and `WITHDRAWN`, which
`assertNotTerminal` guards on workstream updates. For prescreens it is `HANDED_OFF`,
`REDIRECTED`, `DECLINED` and `CANCELLED`, which both gateways guard on
`updatePacketRequirement`. A suppressed candidate is recorded in `suppressed`, together with
its signal and the reason.

## Requirement → test coverage

| Requirement | Test(s) |
|---|---|
| Case information incomplete | `case information incomplete → CASE_PROGRESSION HARD_BLOCKER …` |
| Medical diversion without next-work assignment | `medical diversion is reported through JourneyPhase only …` |
| Facility response pending | `facility response pending → EXTERNAL_WAIT with no candidate …` |
| Prescreen needs information without whole-case blocking | `prescreen needs information blocks the prescreen, not the whole case` |
| Packet blockers and warnings | `packet blockers and warnings map through evaluatePacketReadiness …`; `classifies every PacketRequirementState …` |
| Workstream blocked / review / ready | `BLOCKED / PENDING_REVIEW / READY map to their candidates with no role assigned` |
| No candidates for not-started / in-progress / complete / not-applicable | `NOT_STARTED, IN_PROGRESS, COMPLETE and NOT_APPLICABLE produce no candidates` |
| Emergent fairness protection | `blocked benefits and authorization never block emergent clinical progression`; `urgency changes nothing …` |
| JourneyPhase isolation | `journey equals deriveJourneyProjection for every case status …` (25 × 13 combinations) |
| Absent vs empty packet requirements | `absent packet requirements claim nothing; empty requirements report every target ready` |
| Deterministic ordering | `output is identical for any input order …`; `repeated calls are identical and the input is not mutated` |
| Duplicate suppression | `duplicate requirements collapse to one signal per target and one candidate per requirement` |
| Traceability | `every candidate and suppression traces to emitted signals; every actionable signal is accounted for` |
| No global primary blocker | `there is no global primary blocker field` |
| No persistence / API dependency | `the module imports only sibling pure contracts` |
| Terminal suppression | `terminal case keeps workstream signals …`; `terminal prescreen keeps readiness signals …` |

## Honest gaps

- **Unit-level only.** Nothing reads real case, prescreen or requirement rows into this
  projection. Slice 4A (the tenant-scoped Access read API) will be the first caller, and it is
  not started.
- **Empty requirements mean "ready".** With `packetRequirements: []`, every target reports
  `ready: true`, because that is what `evaluatePacketReadiness` returns. The projection does
  not know whether requirements *should* exist for a target: no requirement-generation policy
  exists, and none is invented here. Callers must pass `undefined` when requirements were not
  loaded.
- **Duplicate requirement codes with conflicting states.** Both states are reported as
  separate signals. The gateways key requirements by code, so this should not arise from
  persisted data. The projection does not resolve the conflict.
- **No target-relative blocking** beyond the five `PrescreenReadinessTarget`s. No
  per-transition blocking for case transitions (spec §7 proposal) is implemented.
- **Workstream candidates carry no role.** The eight workstreams have no role mapping in the
  contracts, and none is invented here.
- **Diversions and exceptions produce no work.** `MEDICAL_TRANSFER_REQUIRED` (OD-24 open),
  `REFERRED_TO_ALTERNATIVE_LEVEL` and `NO_PLACEMENT_FOUND` emit no candidates. Workstream
  candidates are still offered during a non-terminal diversion, because no command rejects
  them there. Whether they should be withheld is a clinical/owner question, not decided here.
- **`FACILITY_RESPONSE_PENDING` as `EXTERNAL_WAIT`** is a naming-level reading of the status.
  No timing semantics exist.
- **No clinical, legal, placement, timing, escalation, SLA or readiness policy** is claimed or
  implemented.
