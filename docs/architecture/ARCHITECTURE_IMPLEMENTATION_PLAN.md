# Architecture Implementation Plan

Backlog derived from [ARCHITECTURE_DRIFT_REGISTER.md](ARCHITECTURE_DRIFT_REGISTER.md) and
[PRODUCTION_READINESS_MATRIX.md](PRODUCTION_READINESS_MATRIX.md). P3/P4 items are recorded
for completeness and are explicitly **not** to be built now — no speculative
infrastructure gets implemented just because it appears on
[CLARITY_TARGET_STATE.md](CLARITY_TARGET_STATE.md).

---

## P0 — Architecture correctness / security-relevant

### P0-1: Reconcile Operating Assurance's discovery-lifecycle docs with its shipped implementation
- **Problem:** `docs/discovery/operating-assurance/project-state.yaml` and both
  stage-manifest files still record `lifecycle_status: paused` and prohibit
  `implementation_in_progress`, while OA is fully implemented and merged (DRIFT-08).
- **Evidence:** DRIFT-08.
- **Desired state:** discovery docs record that requirement/execution readiness were
  reached via direct owner authorization 2026-09-12, referencing commits
  `9eeeda3`…`15a094d`.
- **Files affected:** `docs/discovery/operating-assurance/project-state.yaml`,
  `stage-manifest.yaml`, `product-intelligence-stage-manifest.yaml`,
  `docs/architecture/ADR-0020-operating-assurance-retroactive-ratification.md` (new).
- **Dependencies:** none.
- **Acceptance criteria:** the three YAML/manifest files no longer contradict the merged
  code; ADR-0020 exists and is Accepted.
- **Tests required:** none (docs-only).
- **Migration impact:** none. **Security impact:** none — this is a documentation
  correction, not a behavior change. **Rollback:** trivial (revert the doc edit).
- **Codex implementation suitability:** high — mechanical doc edit once the owner ruling
  is recorded (already given this session).

### P0-2: Finish the ADR-0012 native-Fastify migration
- **Problem:** the original 4 routes and all 7 prescreen routes still run through a
  manual `app.all("/*", ...)` + `reply.hijack()` catch-all inside the Fastify shell
  (DRIFT-06).
- **Evidence:** `packages/api-service/src/server.ts:313-434`.
- **Desired state:** all routes use native Fastify route registration, matching
  `registerAssuranceRoutes`/RevOps/IOP; ADR-0012 status moves from "Accepted in part" to
  "Accepted."
- **Files affected:** `packages/api-service/src/server.ts`, possibly a new
  `prescreenRoutes.ts` mirroring `assuranceRoutes.ts`'s shape;
  `docs/architecture/ADR-0012-api-architecture.md`.
- **Dependencies:** none.
- **Acceptance criteria:** zero remaining `app.all("/*"` catch-all handlers; every
  existing integration test for the core API and prescreen routes still passes
  unmodified (request/response contracts must not change).
- **Tests required:** re-run `tests/integration/` API and prescreen suites (currently
  8 + 9 tests respectively, part of this session's 755/755) — no new tests needed if
  contracts are preserved exactly; add one test only if a route's error-mapping behavior
  was implicitly relying on the catch-all's generic handling.
- **Migration impact:** none (routing-only change, no schema/data change). **Security
  impact:** neutral-to-positive — native routing gets Fastify's built-in schema
  validation instead of hand-rolled regex path matching. **Rollback:** revert
  `server.ts`; no data-layer rollback needed.
- **Codex implementation suitability:** high — mechanical route-by-route conversion with
  an existing pattern to copy (`assuranceRoutes.ts`) and a full regression suite to catch
  contract drift.

### P0-3: Add Zod validation to Operating Assurance's command schemas
- **Problem:** `packages/assurance-service/src/commands.ts` uses plain TypeScript
  interfaces instead of the Zod envelopes every other command service uses — an
  unvalidated command boundary (DRIFT-02).
- **Evidence:** DRIFT-02.
- **Desired state:** assurance commands validate the same way prescreen/case commands do
  — Zod schema → parse → role/participant check → transaction.
- **Files affected:** `packages/assurance-service/src/commands.ts`.
- **Dependencies:** none.
- **Acceptance criteria:** malformed assurance command payloads are rejected at the
  envelope-parse stage (400-equivalent), matching every other command service's behavior;
  existing assurance-service tests still pass.
- **Tests required:** add rejection-path tests for malformed payloads per command,
  mirroring the existing pattern in `prescreen-service`'s command tests.
- **Migration impact:** none. **Security impact:** positive — closes an unvalidated input
  boundary. **Rollback:** trivial.
- **Codex implementation suitability:** high — direct pattern-copy from an existing
  command service.

---

## P1 — Foundations blocking product integration

### P1-1: Wire the frontend to real APIs, one vertical slice at a time
- **Problem:** 12 of 15 experience-layer surfaces are `localStorage`-only despite
  matching, tested backend packages existing (DRIFT-11) — the single largest gap between
  documented "Completed" status and actual product capability.
- **Evidence:** DRIFT-11.
- **Desired state:** each workspace calls its real backend through `app/src/domain/api.ts`
  instead of the shared `localStorage` blob.
- **Recommended first slice:** **IOP Reconciliation** — `packages/api-service/src/
  iopReconciliationRoutes.ts` already exists server-side; only the frontend needs wiring.
  Second slice: **Evidence Review** (evidence-service is the most mature, most-tested
  backend). Do not attempt all 12 at once.
- **Files affected (first slice):** `app/src/workspaces/IopReconciliation.tsx`,
  `app/src/domain/api.ts` (add an `apiIopReconciliation*` function family mirroring
  `apiRevOps`).
- **Dependencies:** none — the backend is already built and tested for this slice.
- **Acceptance criteria:** the workspace reads/writes through the real API; the existing
  `IopReconciliation.test.tsx` is extended (not replaced) to cover the API-backed path;
  no `localStorage` state remains for this workspace's domain data.
- **Tests required:** extend the existing 25-line test file; add one integration-style
  test exercising the full frontend→API→DB path if the project's testing conventions
  support it (check how `RevOps.test.tsx` does this — it's the only precedent).
- **Migration impact:** none. **Security impact:** neutral — the backend already enforces
  tenancy/authorization; this just makes the frontend use it. **Rollback:** revert the
  workspace file; backend is unaffected either way.
- **Codex implementation suitability:** high for IOP Reconciliation specifically (backend
  API already exists, one clear precedent to copy from RevOps); medium for the other 11
  surfaces (each needs its own slice planned, not batched).

### P1-2: Record the CLPR review-acceptance result
- **Problem:** `docs/implementation/CLPR_SYNTHETIC_VERTICAL_SLICE.md` still says
  "Review acceptance: [Unverified]" despite PR #68 having merged and this session's full
  suite (755/755 + 132/132, lint/typecheck/`prisma validate` clean) covering exactly the
  checklist in `CLPR_INTEGRATION_RESOLUTION.md` §F (DRIFT-10).
- **Files affected:** `docs/implementation/CLPR_SYNTHETIC_VERTICAL_SLICE.md`.
- **Dependencies:** none — evidence already gathered this session.
- **Acceptance criteria:** the review-acceptance line reflects this session's actual
  verification, dated, with the exact commands and counts.
- **Tests required:** none (doc-only). **Migration/Security impact:** none.
- **Codex implementation suitability:** high — mechanical.

### P1-3 through P1-6: Code consolidation (DRIFT-03, DRIFT-04, DRIFT-05, DRIFT-07)
These were fully scoped in the redundancy-cleanup plan approved earlier this session
(idempotency-helper extraction, canonical-JSON consolidation with a byte-equivalence
proof first, role-policy-guard extraction, `withTenantContext` consistency
investigation, and archiving the three dead reference packages). They remain valid,
low-risk, behavior-preserving work — deferred in this pass only because this session
pivoted to the audit-first architecture review before executing them. Each item's
acceptance criteria is unchanged: the existing test suite for every touched package must
still pass, with no new behavior.

---

## P2 — Productionization

Each item below is **CONDITIONAL on an actual pilot being authorized** — none of these
block continued development, per [PRODUCTION_READINESS_MATRIX.md](PRODUCTION_READINESS_MATRIX.md).

| ID | Problem | Desired state | Codex suitability |
| --- | --- | --- | --- |
| P2-1 | No production object-storage adapter | S3/Blob adapter implementing the existing storage port | High — port already defined, just needs a second adapter |
| P2-2 | No malware scanning | Scanner integration at upload time | Medium — needs a vendor/tool decision first (owner input) |
| P2-3 | No structured observability | Minimal structured logger (not necessarily a full APM) | High — additive, no architecture change |
| P2-4 | No secrets manager | Real secrets-manager integration | Medium — needs a hosting decision first |
| P2-5 | No hosting / deploy pipeline | A deploy workflow once a hosting target is chosen | Low until OD-5/OD-6 (hosting) is decided by the owner |
| P2-6 | No managed identity/OIDC adapter | Real `IdentityProvider` implementation against the existing port | Medium — port exists, needs an IdP vendor decision |
| P2-7 | No real backup/DR mechanism | A production backup/restore runbook beyond the local replay smoke test | Low — needs the hosting/provider decision first |
| P2-8 | Provider-backed Cloud SQL/RLS unverified | Run the existing local RLS test suite against real Cloud SQL | Blocked on GCP access (`gcloud auth login` + project) — not a code task |

---

## P3 — External integration enablement (do not build speculatively)

- **P3-1: Real outbox dispatcher/worker process.** CONDITIONAL — build only once a named,
  authorized external consumer exists. No such consumer exists today (the "Bayside
  Hospital" name in `OUTBOX_DELIVERY_BOUNDARY_DECISION.md` is explicitly a placeholder).
  When triggered: a single worker process reading the existing `OutboxRecord` table with
  the existing `SKIP LOCKED` claim logic — not a message broker.
- **P3-2: EHR/payer/clearinghouse/IdP/BI/ERP integrations.** FUTURE — no current
  evidence of need or authorization. Do not scaffold ports beyond what already exists
  (`IdentityProvider`) without a named target.

---

## P4 — Scale-driven architectural evolution (do not build speculatively)

- **P4-1: Re-score RevOps for extraction** if its synthetic workload volume grows an
  order of magnitude (currently ~28k records, 47 recalculated metrics — the only domain
  with any independent-scaling signal at all, per
  [SERVICE_EXTRACTION_MATRIX.md](SERVICE_EXTRACTION_MATRIX.md)).
- **P4-2: Message broker** — only if a real multi-consumer, independent-scaling need
  emerges from P3-1's dispatcher in production. Do not introduce Kafka/RabbitMQ/Redis
  Streams/NATS pre-emptively.
