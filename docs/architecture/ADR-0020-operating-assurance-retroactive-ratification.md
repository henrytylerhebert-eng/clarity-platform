# ADR-0020: Operating Assurance implementation ratified retroactively past its own discovery-lifecycle gate

- **Status:** Accepted (owner ruling, 2026-09-12)
- **Decides:** the contradiction identified as DRIFT-08 in
  [ARCHITECTURE_DRIFT_REGISTER.md](ARCHITECTURE_DRIFT_REGISTER.md)
- **Builds on:** none directly; documents a process exception, not a technical design
- **Provenance:** authored 2026-09-12 on the PR #73 branch and extracted to `main` on
  2026-09-18 during Housekeeping Phase 2B, because PR #73 was not merged wholesale. The
  decision below is unchanged and remains **Accepted** — only its path to `main` differs.
  ADR number 0020 was claimed off-main from 2026-09-12 until that date. That history will be
  recorded in `docs/architecture/ADR_INDEX.md`, which Housekeeping Phase 2B Step F creates.

## Context

Operating Assurance's product-definition discovery lane
(`docs/discovery/operating-assurance/project-state.yaml`, `stage-manifest.yaml`,
`product-intelligence-stage-manifest.yaml`) recorded, from July 30 source decisions:
`lifecycle_status: paused`, `gates.requirement_readiness: not_started`,
`gates.execution_readiness: not_started`, and `next_allowed_skills:
[product-requirements-planning]` only. Both stage-manifest files list
`implementation_in_progress` as a **prohibited** entry state at that lifecycle stage, and
`PRODUCT_INTELLIGENCE_HANDOFF.md` states outright: "Implementation is prohibited by the
current lifecycle state."

Despite this, commits `9eeeda3` ("OA trust contracts and deterministic evaluator"),
`f6ff9eb` ("OA tenant-scoped persistence and immutable trust history"), `406c6d6` ("OA
commands, queries, and scoped review authority"), and `15a094d` ("OA authenticated
Fastify API") — all on this same branch, this same day — built the complete Operating
Assurance implementation: contracts and a deterministic evaluator
(`packages/domain-contracts/src/assurance.ts`), tenant-scoped Prisma persistence
(`packages/case-repository/src/assuranceGateway.ts`, a new multi-file
`prisma/assurance.prisma`), a full command/query service
(`packages/assurance-service`), and an authenticated Fastify API
(`packages/api-service/src/assuranceRoutes.ts`). This work is merged to `main`, tested
(part of this session's verified 755/755 root suite), and functioning.

The gap was found during a whole-platform architecture audit this session, not by the
implementation's own author at the time it happened.

## Decision

Tyler, as the repository owner, ratifies the Operating Assurance implementation
retroactively. He directly authorized this work; the discovery-lifecycle documents will
be updated to reflect that requirement and execution readiness were reached through
direct owner authorization on 2026-09-12, rather than through the normal
`product-requirements-planning` → `requirement_readiness` → `execution_readiness`
sequence the discovery lane otherwise prescribes.

## Alternatives Considered

### Alternative 1: Roll back to discovery-only
- **Pros:** restores strict adherence to the documented gate sequence; no code would
  need re-review under a retroactive standard.
- **Cons:** would discard merged, tested, working code for no technical reason — the
  implementation itself has no defect; the gap is purely procedural.
- **Why not:** the owner explicitly rejected this option when asked.

### Alternative 2: Leave the contradiction standing, unresolved
- **Pros:** no immediate work required.
- **Cons:** the repository's own discovery docs would keep asserting something false
  ("paused," "implementation prohibited") about code that has shipped — exactly the kind
  of documentation/code contradiction this audit exists to surface and close, not
  perpetuate.
- **Why not:** the owner explicitly rejected this option when asked; leaving it standing
  would also mislead any future session or reader of the discovery lane.

## Consequences

### Positive
- The discovery-lifecycle documents will match reality; a future reader of
  `project-state.yaml` will not be told the implementation is prohibited when it has
  already shipped.
- Establishes an explicit precedent: the owner can ratify work retroactively, and doing
  so is recorded as a numbered ADR rather than a silent doc edit — the exception is
  visible, not hidden.

### Negative
- The discovery lane's own process (opportunity → product definition → requirement
  readiness → execution readiness → implementation) was not actually followed in order
  for this slice. This ADR does not claim it was; it documents that it was not, and that
  the owner accepted the result anyway.
- Future OA work (frontend surface, further hardening) still has no completed
  requirement-readiness or execution-readiness artifact to build from — those stage
  outputs (if the discovery lane's own template expects specific deliverables at those
  gates) remain retroactively unwritten. Anyone resuming discovery-lane process for OA
  should treat this ADR as the record of why the lane's own history looks incomplete, not
  as evidence those artifacts exist.

## Follow-up

`docs/discovery/operating-assurance/project-state.yaml` — the actual per-project state
record — should be updated to reference this ADR and record the gates as reached via
direct owner authorization; tracked as P0-1 in
[ARCHITECTURE_IMPLEMENTATION_PLAN.md](ARCHITECTURE_IMPLEMENTATION_PLAN.md). The
`stage-manifest.yaml` and `product-intelligence-stage-manifest.yaml` files are generic,
reusable stage-gate templates shared across products ("Recovered historical proposed
stage contract; no workflow execution or new approval") — they are not project-specific
state and are deliberately left unmodified; this ADR is the record of why OA's own
history through them looks incomplete.
