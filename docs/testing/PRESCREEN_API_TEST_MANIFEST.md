# Prescreen API slice test manifest (ADR-0014)

**File:** `tests/integration/prescreen-api.test.ts` (9 tests, real HTTP
against the node:http server, database-backed authentication over local
`clarity_dev`, Phase 2 in-memory prescreen gateway). Run 2026-07-19
locally (re-run after the rebase onto the prescreen hardening session);
root suite **343/343**, app **64/64**; lint, typecheck, and
`prisma validate` pass; zero synthetic residue from this session's runs.

## What each test proves

| Guarantee | Test |
|---|---|
| Full same-org flow with the production policy: coordinator starts/drafts, physician attests, coordinator submits; the recorded receiving organization is the principal's own; attestation is recorded against the database-backed user | "coordinator starts and drafts, physician attests, coordinator submits…" |
| Readiness view reachable by both ruled roles; named blockers, no aggregate score | "the readiness view is reachable by both ruled roles…" |
| HTTP retries with the same key and body replay (200, `replayed: true`); a changed body under the same key is a 409 `idempotency_key_reused` | "an idempotency key replays with the same body…" |
| ADR-0014 policy enforced over HTTP: coordinator cannot attest; physician cannot start/submit | "the coordinator cannot attest; the physician cannot start, draft, or submit" |
| `SYSTEM_ADMIN` holds zero prescreen capability, including the read-only view | "SYSTEM_ADMIN holds zero prescreen capability…" |
| Unauthenticated requests are a uniform 401 | "unauthenticated prescreen requests are a uniform 401" |
| `organizationId`, `actor`, `occurredAt`, and `receivingOrganizationId` in a body are a 400 — never a silent overwrite; cross-org submission is structurally inexpressible | "organizationId, actor, occurredAt, and receivingOrganizationId in a body are a 400…" |
| Cross-tenant probes (mutation and read) are non-revealing 404s | "a coordinator from another tenant cannot see the encounter at all (404, not 403)" |
| Stale `expectedVersion` is a 409 `prescreen_version_conflict` with a content-free body | "a stale expectedVersion is a 409 version conflict…" |

## Honest gaps

- **Prescreen state is process-local and non-durable.** The gateway is the
  Phase 2 in-memory implementation; a server restart loses all prescreen
  state. Persistence is Phase 3 behind the provider-backed Cloud SQL/RLS
  gate. The DATABASE is exercised only for authentication, sessions, and
  their audit events.
- **Two roles only.** `INTAKE_COORDINATOR` and `PHYSICIAN_REVIEWER` per the
  ADR-0014 ruling; no external/field actor is representable, so
  field-originated prescreens are untested and untestable in this slice.
- **PMHNP signer-scope configuration is not yet a tested rule.** The ruling
  places PMHNP authority in configured policy; no configuration surface
  exists yet, so `PHYSICIAN_REVIEWER` is currently undifferentiated.
- **`occurredAt` is server-stamped.** Clinically observed times live inside
  draft content (`observedAt`); the envelope records arrival time. Whether
  any prescreen command needs a caller-supplied clinical event time is a
  domain-review follow-up.
- **Not covered:** UI, event delivery, cross-organization workflows,
  concurrency beyond single-process determinism, load, malformed-transport
  fuzzing beyond the strict-schema and JSON-parse paths.
