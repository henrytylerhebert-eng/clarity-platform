---
status: implemented locally; not merged to main; no independent review yet
related_artifacts:
  - docs/architecture/ADR-0021-rev-ops-rate-release-registry.md
  - docs/product/REVOPS_FINANCIAL_RATE_IMPLEMENTATION.md
  - prisma/schema.prisma (RevOpsRateRelease)
  - packages/domain-contracts/src/revOpsRateReleasePersistence.ts
  - packages/case-repository/src/revOpsRateReleaseGateway.ts
  - packages/api-service/src/revOpsRateReleaseRoutes.ts
  - packages/rev-ops-service/src/pricing.ts
  - app/src/workspaces/RevOpsPricing.tsx
---

# RevOps rate-release registry (R1) — implementation record

## What this is

Implements R1 from
[docs/product/REVOPS_FINANCIAL_RATE_IMPLEMENTATION.md](../product/REVOPS_FINANCIAL_RATE_IMPLEMENTATION.md)
for the Louisiana Medicaid inpatient per-diem release family only, per
[ADR-0021](../architecture/ADR-0021-rev-ops-rate-release-registry.md). Before
this change, `RevOpsPricing.tsx` read the two published releases (July 2025 /
July 2026, 1,126 rows total) from a bundled, checked-in JSON file. It now
reads them from a new database table via `GET /api/rev-ops/rate-releases`, and
a new release or a correction can be recorded live through
`POST /api/rev-ops/rate-releases` — no code deploy required.

## What did NOT change

- `calculateLaInpatientScenario` and every other pure function in
  `packages/rev-ops-service/src/pricing.ts` are byte-identical to before. Only
  the caller (`RevOpsPricing.tsx`) changed what it passes in.
- The CMS IPF FY2026 base-component source (`IPF_2026_SOURCE`) is untouched —
  it is a single already-cited constant object with no row-level content, and
  converting it to this registry would add ceremony without a correction use
  case (see ADR-0021's Context section).
- The commercial contract-rate scenario tool (`RevOpsPricing.tsx`'s
  "Commercial and managed-plan terms" mode) is untouched. It remains
  ephemeral (`useState`-only), still keyed to the fictional
  `"Dunder Mifflin Hospital"` label. This was a deliberate scope line — see
  ADR-0021 — because it sits on the R2 (provider-applicability) side of the
  build sequence, which stays blocked on OD-19.
- Nothing about R2–R5 changed. No calculation applies to the actual Dunder
  Mifflin Hospital profile after this change any more than it did before.

## What's new

- **Schema:** `RevOpsRateRelease` (migration
  `20260913212932_rev_ops_rate_release_registry`) — the first table in this
  schema with no `organizationId` column, a deliberate, ADR-documented
  exception to "tenancy in every predicate": the content is public,
  government-published reference data identical for every organization.
  `recordedByOrganizationId`/`recordedBy` attribute the write for audit
  purposes only; they are not a read-side filter.
- **Contract:** `packages/domain-contracts/src/revOpsRateReleasePersistence.ts`
  — `RecordRateReleaseRequestSchema` (strict Zod envelope) and
  `revOpsRateReleasePermissionsFor` (`ORGANIZATION_ADMIN` gets `view` +
  `record`; every other authenticated role gets `view` only — there is
  nothing tenant-sensitive to hide from a read).
- **Gateway:** `packages/case-repository/src/revOpsRateReleaseGateway.ts` —
  `record()` (create-only; a correction is expressed by passing
  `supersedesReleaseId`, which flips exactly `status`/`supersededById` on the
  replaced row inside the same transaction — its `payload`/`sha256`/
  `sourceUrl`/effective dates are never rewritten, mirroring `EvidenceItem`'s
  supersession pattern from ADR-0008) and `list()` (a plain read, no
  transaction, no tenant predicate — nothing to isolate).
- **Routes:** `packages/api-service/src/revOpsRateReleaseRoutes.ts` —
  `GET /api/rev-ops/rate-releases?programMethod=...&includeSuperseded=...` and
  `POST /api/rev-ops/rate-releases`, registered in `server.ts` and `devMain.ts`.
- **Dev seed:** `devMain.ts` upserts the same two checked-in, source-hashed
  releases (`data/public-rates/la-inpatient-2026.json`) as the initial
  `ACTIVE` rows on every restart — idempotent, matching the file's existing
  bootstrap pattern for the IOP facility/integration fixtures.
- **Frontend:** `RevOpsPricing.tsx`'s "Louisiana Medicaid inpatient" mode
  fetches `GET /api/rev-ops/rate-releases` on mount instead of importing the
  static JSON; the provider list, rate types, and the calculation itself are
  now all driven by the fetched, persisted releases. The submit button is
  disabled until the fetch resolves; a failed fetch shows the API's error
  message instead of silently rendering an empty picker.

## Honest gaps

- Only the Louisiana Medicaid release family is persisted. A second release
  family (e.g. a future CMS IPF FY2027 addendum, if it grows a row-level
  correction need) is a new `programMethod` literal plus its own request-body
  shape — not automatically supported by this slice.
- No UI exists yet to actually call `POST /api/rev-ops/rate-releases` — an
  `ORGANIZATION_ADMIN` can record or correct a release today only via a direct
  API call, not through `RevOpsPricing.tsx`. Building that form was out of
  scope for this pass; the read side (what most users need) was prioritized.
- `list()`'s lack of a tenant predicate means any authenticated principal in
  any organization sees every recorded release, by design (see ADR-0021) —
  this is not a bug, but it is a real behavior a reviewer should not mistake
  for a missed tenancy check on a normal RevOps table.
- No independent review of this ADR/implementation has occurred. Nothing here
  is claimed as production-ready.

## Test manifest

Run this session against local `clarity_dev` (shared with other worktrees;
counts before/after confirmed unaffected — see below):

- `npm run lint` — clean.
- `npm run typecheck` — clean.
- `npx prisma validate` — clean.
- `npm run test:app` — **145/145** (22 files; +2 from before, both new:
  `RevOpsPricing.test.tsx`'s two tests covering the fetch-then-calculate path
  and the fetch-failure path). Also fixed `RevOps.test.tsx`'s `apiRevOps` mock,
  which pre-dated this change and did not know about `describeApiError` or
  the new `/rate-releases` path — both are now handled there.
- Root `npm test` — **771/771** (76 files; +9 from before: 6 new unit tests in
  `tests/unit/rev-ops-rate-release-persistence.test.ts` covering permission
  boundaries and the four documented rejection paths, 3 new integration tests
  in `tests/integration/rev-ops-rate-release-persistence.test.ts` covering
  permission denial, cross-tenant read visibility, duplicate-releaseId
  rejection, correction/supersession content-immutability, and rejecting a
  supersede target that doesn't exist / isn't active / is a different
  `programMethod`).
- **Residue:** `RevOpsRateRelease` has no `organizationId`, so the shared test
  harness's tenant-scoped `dispose()` cannot reach rows created against it —
  confirmed by re-running the integration test twice and hitting a real
  `release_id_already_recorded` collision on the second run before this was
  fixed. The integration test now deletes its own fixed set of `releaseId`s
  in an explicit `afterAll`, verified by running the suite twice consecutively
  with zero leftover rows both times. `organization` row count (401) and
  `RevOpsRateRelease` row count (0, since `devMain.ts` never ran this session)
  were checked before and after this session's full test runs and are
  unchanged.

## Not claimed

Production readiness, resolution of OD-19, R2 (real provider/contract
binding), R3 (additional calculators), R4 (operational integration into
RevOps activity), R5 (financial reconciliation), or independent review of
ADR-0021.
