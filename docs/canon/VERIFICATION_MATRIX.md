# Verification Matrix v1.0

| Invariant | Proof target | Automated evidence |
|---|---|---|
| Episode remains inpatient-stay scoped | contracts/schema/read model | contract/schema tests |
| Longitudinal journey is projection-first | projection shape | unit test: no aggregate id/status |
| Planned discharge ≠ actual discharge | plan + discharge fact | unit test |
| Clinical LOC ≠ payer LOC ≠ availability ≠ preference ≠ actual | LOC profile | unit test |
| Clinical readiness is human decision | authority + decision record | authority/contract test |
| PendingDischarge is derived | projection function | unit test |
| TransitionReadiness is derived | component projection | unit test |
| Missing continuity data remains unknown under partial coverage | continuity projection | unit test |
| No causal blame from waiting state | barrier contract | negative assertion |
| No universal score | projections/UI | contract/UI assertions |
| Tree 4 shell is preserved | routing/navigation | browser regression |
| Work uses governed truth | read-model source | integration/UI test |
| History reconstructs source events | timeline | deterministic fixture test |
| Explore does not own truth | inspector/source trace | read-only integration test |
| Ask Clarity cites governed sources | Query/Trace output | AI conformance test |
| AI cannot establish decision authority | command gate | negative authorization test |
| AI command cannot bypass domain service | architecture boundary | integration/conformance test |
| Cross-tenant traversal is blocked | query/repository | tenant-isolation test |
| Unknown is not guessed | read/projection | unit/conformance tests |
| UI does not present candidate as assignment | copy/behavior | app test |
| Source correction preserves history | event/decision lineage | integration test |

## Verification levels

**L0 — contract**
types/schemas/state machines compile and validate.

**L1 — pure logic**
deterministic unit tests prove derivations.

**L2 — repository**
tenant-scoped persistence and history are proven.

**L3 — service/API**
authority, command, idempotency, event output, conflict behavior.

**L4 — UI**
rendered behavior across desktop/mobile/accessibility.

**L5 — human usability**
real users demonstrate comprehension/task success.

**L6 — production evidence**
only after deployment/security/integration approval.


