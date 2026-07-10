# 06 — Integration Decisions

**Date:** 2026-07-10. Summary of every material decision; rationale in the linked artifacts.

| # | Decision | Where recorded |
|---|---|---|
| 1 | Workspace is `~/Documents/clarity-platform` (prompt's "Clarity Platform" path does not exist) | 00_BASELINE_AND_SAFETY |
| 2 | Master package treated as **partial** (15/87 files); claims dependent on missing files marked unknown, never assumed | 02_MASTER_PACKAGE_INVENTORY |
| 3 | Database artifact classified SUPERSEDED-by-inclusion (its schema is byte-identical to the master foundation schema) | 02, C-3 |
| 4 | Git initialized only after inventory + checksums; baseline commit captures the workspace as found | 00, commit 33849c9 |
| 5 | Package ZIPs force-added over the user's global `*.zip` ignore — immutable sources must be tracked | 06_FILE_MOVE_MAP |
| 6 | **Strategy A**: existing working prototype is viable; package adapted to it; nothing archived (`archive/pre-integration/` intentionally not created — no superseded *working code* existed) | 04, ADR-0001 |
| 7 | Master framing = umbrella vision; crisis generation = launch wedge; neither replaces the other (C-1) | 03_CONFLICT_REGISTER |
| 8 | npm workspaces now; pnpm+Turborepo deferred, not rejected (C-6) | ADR-0001 |
| 9 | Foundation schema canonical; expanded draft is the adoption target; Jul 8 schema superseded; both Jul 10 schemas CLI-validated this session (C-3) | ADR-0002, 05_* |
| 10 | Migration generated against a session-created local PostgreSQL 18.4 database `clarity_dev` (pre-checked non-existent) | 05_SCHEMA_VALIDATION_RESULTS |
| 11 | Historical Jul 8 docs preserved unedited except a path-migration banner on the index; canonical docs cross-link instead of duplicating | 053bdcf |
| 12 | All canonical docs carry provenance front matter; two docs (`DEVELOPER_BRIEF`, `MASTER_BUILD_PROMPT`) are adaptations/pointers with originals preserved | 053bdcf |
| 13 | Open decisions and risk register re-seeded locally because the package's versions are missing | docs/decisions/ |
| 14 | The 6 payer feature flags ship dark; safety invariants encoded as contracts + 39 tests | 197cdc8, 5d13461 |
| 15 | `reporting-metrics-rebuild-package/` stays at repo root as the live metrics substrate (canonical for domain 14), explained in README | 03 matrix row 14 |
| 16 | Nothing pushed; no remote configured; business-sensitive xlsx flagged before any future remote (R-11) | SECURITY.md |
