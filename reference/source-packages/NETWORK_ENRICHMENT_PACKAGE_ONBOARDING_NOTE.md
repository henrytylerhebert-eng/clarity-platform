# Onboarding note — clarity-network-enrichment-production-package v1.0.0-proposed

**Onboarded:** 2026-07-19, copied verbatim (excluding nothing; the package has
no `node_modules/`) from the untracked directory
`clarity-network-enrichment-production-package/` in the primary checkout into
`reference/source-packages/clarity-network-enrichment-production-package-v1.0.0/`.
Committed as proposed source material; nothing in it changes live Clarity
code, contracts, schema, or configuration.

## Integrity verification (run at onboarding)

- `MANIFEST.sha256` covers 54 files. Result at the source location: **54 OK,
  0 mismatches**. Re-verified in the onboarded copy: **54 OK, 0 mismatches**.

## Verification re-run at onboarding (2026-07-19, local)

- The package's standalone `node --test` suite was **not** re-run in place;
  its logic was instead ported to repo-native contracts
  (`packages/domain-contracts/src/networkEnrichment.ts`) and verified there
  with the repository's vitest toolchain (see
  `docs/testing/NETWORK_ENRICHMENT_CONTRACTS_TEST_MANIFEST.md`).
- The package's own `VERIFICATION.md` results remain historical evidence.

## Status boundary

Per the package's own `README.md` (version `1.0.0-proposed`): it is a proposed
implementation contract, not evidence that the repository has accepted
ADR-0012 hosting, managed identity, RLS, or live enrichment integrations.
Adopted in this repository per ADR-0014 (contracts-only slice). The package's
proposed Prisma fragment, review command service, OpenAPI routes, RLS SQL, and
agent prompts are **not** adopted; each is gated on the open decisions listed
in ADR-0014.
