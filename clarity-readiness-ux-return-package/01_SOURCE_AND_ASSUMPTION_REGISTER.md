# Source And Assumption Register

| Item | Status | Source | Note |
|---|---|---|---|
| Repository path | Confirmed | `pwd` | `/Users/tylerhebert/Documents/clarity-platform` |
| Branch and HEAD | Confirmed | `git status`, `git rev-parse HEAD` | `codex/om/sync-main`, `504037c93762d1cea4875064aa5491b67373e93d` |
| Existing dirty state | Confirmed | `git status --short --branch` | Bridge files were dirty before this slice and were preserved. |
| Product-wide primary stakeholder | Confirmed | `docs/workflows/INTAKE_TO_ADMISSION_WORKFLOW.md` | Receiving behavioral-health facility. |
| Slice primary operator | Accepted for this package | Attached execution package | Central intake coordinator. |
| Current app state model | Confirmed | `app/src/domain/types.ts`, `app/src/domain/seed.ts` | LocalStorage-backed synthetic prototype. |
| Readiness workstream vocabulary | Confirmed | `docs/workflows/CASE_WORKFLOW.md`, `packages/domain-contracts/src/workstreams.ts` | Parallel workstreams, financial readiness cannot block emergency clinical review. |
| ADR-0012 state | Confirmed | `docs/architecture/ADR-0012-api-architecture.md` | Fastify direction accepted in part; implemented spike remains `node:http`; production hosting/tenancy remain gated. |
| Measurements | No measurements found | Repo docs and tests reviewed | No baseline time-to-blocker or handoff-comprehension measurement exists. |

## Assumptions

- URL-based workspace state is not an established app routing convention, so the slice preserves case and target context in React state.
- Synthetic density scenarios can be generated from existing seed cases without adding canonical fixture data.
- The map may derive operational presentation from synthetic state, but it must label itself as read-only and non-authoritative.

