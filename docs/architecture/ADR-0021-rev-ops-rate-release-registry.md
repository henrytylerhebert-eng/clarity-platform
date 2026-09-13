# ADR-0021: Persisted Louisiana Medicaid rate-release registry (R1)

## Status

Proposed.

## Context

[docs/product/REVOPS_FINANCIAL_RATE_IMPLEMENTATION.md](../product/REVOPS_FINANCIAL_RATE_IMPLEMENTATION.md)
defines a five-phase build sequence (R1–R5) for RevOps financial-rate work,
owner-accepted 2026-09-09:

- **R1 — release registry:** import immutable published rate releases with
  publisher, source URL, checksum, effective interval, and source row/page;
  retain corrections and supersession. Explicitly authorized to proceed
  regardless of OD-19.
- **R2 — provider and contract applicability:** bind the *real, supplied*
  Louisiana hospital profile to payer/contract scope. Blocked on OD-19 (the
  hospital's provider identifiers are still pending from the owner).
- R3 (separate calculators), R4 (operational integration), R5 (financial
  reconciliation) — later, larger, and out of scope here.

Today, [packages/rev-ops-service/src/pricing.ts](../../packages/rev-ops-service/src/pricing.ts)
reads the two Louisiana Medicaid inpatient per-diem releases (566 + 560 = 1,126
rows, July 2025 and July 2026) from a bundled, checked-in JSON file
([data/public-rates/la-inpatient-2026.json](../../data/public-rates/la-inpatient-2026.json)).
That file is itself already source-hashed and citation-complete — this ADR is
not about improving its provenance. It is about R1's other requirement:
*retain corrections and supersession* without a code deploy, and let a future
new release (e.g. January 2027) be recorded as data rather than a file
replacement.

This ADR deliberately narrows R1 to the **Louisiana Medicaid release list
only**. The CMS FY2026 IPF wage-base source
(`IPF_2026_SOURCE` in `pricing.ts`) is a single, already-cited constant object
with no row-level content and no realistic near-term correction — it is not
converted here. A future FY2027 IPF release is a new constant object in code,
not a row in this registry.

The RevOps commercial contract-rate scenario tool (`RevOpsPricing.tsx`'s
"Commercial and managed-plan terms" mode) is explicitly **not** touched by
this ADR. It is keyed to a fictional `"Dunder Mifflin Hospital"` label and
sits on the R2 side of the line — persisting it now risks a "registry" that
looks more authoritative than the still-missing real profile (OD-19) permits.

## Decision

Add one new table, `RevOpsRateRelease`, holding published Louisiana Medicaid
inpatient per-diem releases. Corrections are modeled as evidence-service
already does it (ADR-0008): a correction inserts a new immutable row and
flips exactly two fields — `status` and `supersededById` — on the row it
replaces. No release's `payload`, `sha256`, `sourceUrl`, or effective interval
is ever mutated after creation.

### Deliberate exception to "tenancy in every predicate"

`RevOpsRateRelease` carries **no `organizationId` column**, and its rows are
readable by any authenticated principal regardless of organization. This is a
considered exception to the architecture invariant, not an oversight:

- The content is a public, government-published rate schedule. The same LA
  Medicaid per-diem rate applies identically to every organization; there is
  no tenant-specific fact to protect, and forcing an `organizationId` would
  mean duplicating the identical row once per tenant for no isolation benefit.
- The *act* of recording or correcting a release is still attributed and
  audited: `recordedByOrganizationId` and `recordedBy` are retained on the
  row, and every create/correct emits a tenant-scoped audit event (`caseId:
  null`, mirroring the existing pattern for IOP-reconciliation and
  session-lifecycle events) under the *acting* organization — matching "every
  material mutation is atomic with its audit event," just without a
  read-side tenant filter, since there is no tenant boundary to enforce on
  read.
- Only `ORGANIZATION_ADMIN` may record or correct a release (write-gated);
  any authenticated principal may read the list (there is nothing to hide).

### Schema

```prisma
model RevOpsRateRelease {
  id                       String              @id @default(cuid())
  programMethod            String              // "LA_MEDICAID_INPATIENT_PER_DIEM" only, for now
  releaseId                String              @unique
  publisher                String
  sourceUrl                String
  sha256                   String
  retrievedAt              DateTime
  effectiveFrom            DateTime
  effectiveThrough         DateTime
  payload                  Json                // sheet, rowCount, rows[] (RevOpsMedicaidRow shape)
  status                   String              @default("ACTIVE") // ACTIVE | SUPERSEDED
  supersededById           String?
  supersededBy             RevOpsRateRelease?  @relation("RateReleaseSupersession", fields: [supersededById], references: [id])
  supersedes               RevOpsRateRelease[] @relation("RateReleaseSupersession")
  recordedByOrganizationId String
  recordedBy               String
  recordedAt               DateTime            @default(now())

  @@index([programMethod, status, effectiveFrom, effectiveThrough])
}
```

`programMethod` is a plain string, not an enum, so a future second release
family does not require a schema migration to add an enum member — it is
validated against a fixed literal set (currently one value) at the Zod layer
instead, matching how `domain-contracts` already validates open-ended string
fields elsewhere without enum churn.

### Command and read shape

One command, `RecordRateRelease` (create-only; a correction is expressed by
passing `supersedesReleaseId`, never by editing a release in place), behind
the existing envelope discipline: Zod parse → role check
(`ORGANIZATION_ADMIN` only) → one transaction (find-and-validate the
optional superseded release, insert the new row, flip the old row's two
fields if superseding, write the audit event). One read, `ListRateReleases`
(`programMethod` required, `includeSuperseded` optional), no permission
narrower than "authenticated."

`packages/rev-ops-service/src/pricing.ts`'s pure calculation functions
(`calculateLaInpatientScenario`, etc.) are **unchanged** — they already accept
`releases: RevOpsMedicaidRelease[]` as a parameter. Only the caller changes:
`RevOpsPricing.tsx` fetches the current release list from the API instead of
importing the bundled JSON directly. The bundled JSON file remains checked in
as the source-hashed seed data (`devMain.ts` upserts it as the initial two
`ACTIVE` rows); it is not deleted.

## Consequences

- A future corrected or additional Louisiana Medicaid release (e.g. a
  restated July 2026 sheet, or the January 2027 release once published) is
  recorded through the API, immediately visible to every session, with the
  prior release preserved and inspectable — no code deploy required.
- `RevOpsRateRelease` is the first table in this schema with no
  `organizationId` column. Any reviewer auditing "tenancy in every
  predicate" compliance should treat this table as a named, ADR-justified
  exception, not a gap.
- R2 (real provider binding) remains fully blocked on OD-19 and is untouched
  by this change. Nothing here lets a calculation apply to the actual
  Dunder Mifflin Hospital profile.
- The commercial contract-rate scenario tool remains ephemeral
  (`useState`-only, per-session) until a separate, later ADR addresses it —
  deliberately, to avoid conflating a public release registry with
  synthetic-facility contract examples.

## Not claimed

Production readiness, resolution of OD-19, a complete R1 (this covers one of
potentially several release families), or any change to R2–R5.
