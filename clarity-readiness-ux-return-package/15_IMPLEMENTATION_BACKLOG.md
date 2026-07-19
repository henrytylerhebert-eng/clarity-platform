# Implementation Backlog

| Item | Classification | User problem | Dependency | Area | Risk | Acceptance evidence | Reason not in slice |
|---|---|---|---|---|---|---|---|
| Server-owned read projection for dependency map | Near-term prerequisite | Local map is not durable or permission-filtered | OD-5/OD-6 | API/services/app | Auth/data divergence | Auth route tests, denial tests, projection tests | API expansion gated |
| First-class workflow task/blocker model | Backend dependency | Ownership/deadline semantics are presentation-only | Architecture decision | packages/prisma | Decorative map risk | Contract + service tests | Not approved here |
| Compliance-grade audit view | Security/privacy dependency | User history is not full audit evidence | Audit contract | services/app | Compliance overclaim | Audit metadata tests | Missing contract |
| Facility handoff acknowledgement | Backend dependency | Handoff state is placeholder | Facility workflow | services/app | False completion | Facility response/handoff tests | Requires owner decisions |
| Legal-clock authority | Legal review dependency | Legal timing cannot be enforced | Counsel review | legal/rules | Legal harm | Counsel-approved rule pack | Explicit stop point |
| Facility criteria packs | Clinical review dependency | Criteria cannot be evaluated safely | Facility governance | docs/services | Unsafe placement inference | Approved criteria profile | Explicit stop point |
| Payer authorization submission | Payer/contract dependency | Readiness does not submit payer work | UR/revenue-cycle approval | authorization-service | Payment overclaim | Human-submission tests | Explicit stop point |
| Post-admission analytics | Future post-admission analytics work | Operations metrics need governed events | Metrics/event spine | reporting | Patient-level scoring creep | Aggregated metric contracts | Out of scope |
| URL route persistence | Preserve as-is for now | Linkable state would help handoff | Router decision | app | Routing churn | Existing convention or router tests | App has stateful workspace convention |

