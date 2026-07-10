# 06 — Unresolved Questions

**Date:** 2026-07-10. Things this integration could not resolve; do not let future sessions assume answers. Cross-referenced with `docs/decisions/OPEN_DECISIONS.md` (OD numbers).

1. **Where is the rest of the master package?** (OD-1) 72 of 87 files never reached this machine — no ZIP, no extracted tree, no `manifest.json`. Until obtained: agent contracts, API architecture, UI spec, evaluation strategy detail, commercial model, roadmap detail, executive decision log, 7 synthetic cases, and diagrams are **unknown**, and 12 integration-matrix domains were graded on `MASTER_ARCHITECTURE.md` summaries alone.
2. **Would the full package's domain specs contradict the Jul 8 deep documents** (legal instruments, custody, bedboard) that this integration kept canonical for those domains? Unknown (C-1 residual).
3. **Exact current Louisiana statutory wording and official forms** (OD-2) — unknown in both generations; nothing statutory is enforced.
4. **Payer criteria packs and facility authorization rules** (OD-11) — unknown.
5. **Product name** — "Clarity", "Clarity AI", "Clarity MH", "Clarity Crisis Platform" all appear in sources (OD-4).
6. **Origin of the loose root files** — manual download presumed from `(1)`/`copy` suffixes; download integrity unverifiable without a manifest.
7. **Whether the QA report's package-level claims (87 files, 10 cases, 0 JSON errors) are accurate** — only the subset present could be verified (it checked out exactly for that subset).
8. **Baseline operational measurements** (OD-12) — none exist ("No measurements found").
9. **Prior Prisma validation** — the package says it never validated; both schemas validated cleanly here, so the package's warning about "expected schema corrections" appears moot, but only for CLI validity — semantic review by a developer/DBA remains open.
10. **`graphify-out/` freshness** — the knowledge graph predates this reorganization; regenerate with `graphify update .` (attempted at end of session — see validation summary).
