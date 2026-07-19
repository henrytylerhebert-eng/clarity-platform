# Contributing and Change Control

1. Preserve the source hierarchy and label proposed behavior.
2. Never add real PHI, credentials, secrets, or production identifiers to this package.
3. Add or change a clinical, legal, consent, facility, or transport rule only with source provenance, effective date, approval state, and tests.
4. Keep domain contracts independent of UI framework, database adapter, partner system, and hosting provider.
5. Add deterministic tests for every state transition and safety invariant.
6. Do not weaken tenant scope, authenticated actor derivation, idempotency, concurrency, audit, or human authority.
7. Update `CHANGELOG.md`, verification evidence, package manifest, and checksums for every release.
