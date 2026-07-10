# Synthetic Cases

**Source:** `reference/source-packages/clarity-ai-database-artifact/data/synthetic-cases/` (copied verbatim 2026-07-10; provenance in `docs/repository-audit/06_FILE_MOVE_MAP.md`).

All cases are fabricated (`privacyFlags: ["SYNTHETIC_ONLY"]`, `SYN-00x` references, fictional facilities). **No real patient data, member IDs, Medicare identifiers, or policy numbers may ever be added to this directory.** JSON validity is enforced by `tests/data/synthetic-cases.test.ts`.

The master package v0.2.0 claims 10 synthetic cases; only these 3 were locally available (the package's `17-synthetic-cases/` directory was missing from the download). The remaining 7 — covering traditional Medicare, supplemental, minors, coordination of benefits, medical exclusion, legal deadlines, and no-bed scenarios — are an open gap tracked in `docs/repository-audit/06_UNRESOLVED_QUESTIONS.md`.
