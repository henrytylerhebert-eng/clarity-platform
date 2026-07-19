# Frontend Backend Divergence

| Capability | Frontend | Backend service | Authenticated API | Status |
|---|---|---|---|---|
| Selected-case routing | React state | N/A | N/A | Synthetic/local-only |
| Role visibility | Demo selector | Auth roles exist separately | Session-derived roles exist | Divergent; selector is not authorization |
| Authorization enforcement | Labels only | Auth/case command policy exists | Bounded route exists | Not wired to this workspace |
| Readiness evaluation | Implemented local view model | Readiness contracts exist | No route | Synthetic/local-only |
| Task ownership | Display fields only | Broader workflow tasks documented | No route | Proposed/backend dependency |
| Deadlines | Existing clocks displayed | Some service/audit foundations | No route | Partial |
| Blocker semantics | Implemented local presentation | Workflow docs/contracts partial | No route | Proposed contract |
| Provenance | Local source/review fields | Evidence service supports review | No map route | Partial |
| Audit history | App audit logs and ledger | Append-only service patterns | Limited route | Partial |
| Packet versioning | Demo packet hash/status | Document/evidence foundations | No packet route | Partial |
| Facility review evidence | Synthetic responses | Not production facility contract | No route | Demo only |
| Concurrent editing | Warning only | Optimistic concurrency in services | Limited route | Not implemented in UI |
| Persistent reassignment | Display only | Case service has assignment patterns | Not map route | Backend dependency |
| Server filtering | None | N/A | None | Not implemented |
| Post-admission episode linkage | Separate Episode workspace | S1/S2 episode foundations | No map route | Deferred |
| Analytics events and metrics | Synthetic events only | Outbox/event foundations | No metrics route | Deferred |

