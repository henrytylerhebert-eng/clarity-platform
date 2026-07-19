# Onboarding note — clarity-prescreen-integration-package-v1.0.0

**Onboarded:** 2026-07-19, from the untracked directory
`clarity-prescreen-integration-package-v1.0.0/` in the primary checkout (no git
history existed for it). Committed verbatim as proposed source material; nothing
in it changes live Clarity code, contracts, schema, or configuration.

## Integrity verification (run at onboarding)

- `SHA256SUMS.txt` covers 145 files. Result: **144 OK, 1 mismatch**.
- Mismatch: `code/tests/transport.test.mjs` — 2,726 bytes on disk vs 2,671
  recorded in `FILE_INVENTORY.md`. The file was modified after the package
  manifest was generated, before onboarding; the original bytes are not
  recoverable. Content review: a coherent 7-test transport-qualification suite
  with no anomalous content. The deviation is recorded here rather than
  repaired, because rewriting either the file or the manifest would fabricate
  integrity evidence.
- `code/node_modules/` was present in the source directory but is **not** part
  of the manifest and was not onboarded. `code/dist/` **is** part of the
  manifest (shipped compiled output) and is onboarded; an in-session rebuild
  reproduced it byte-identically.

## Verification re-run at onboarding (2026-07-19, local)

- Standalone TypeScript build (`tsc`): passed.
- Standalone reference tests (`node --test`): **31 passed, 0 failed**.

Not re-run (no runnable script ships with the package; evidence under
`clarity-prescreen-integration-package-v1.0.0/verification/` remains
historical): JSON Schema example validation, ten synthetic fixture
validations, OpenAPI parse, binary-media scan.

## Status boundary

Per the package's own `PACKAGE_STATUS.md`: repository integration is planned,
not executed; production use is blocked pending clinical, legal, security,
hosting, identity, facility-configuration, transport-credential, and PHI
approvals. Onboarding this package asserts none of those. It is reference
material for the separately approved prescreen implementation phases.
