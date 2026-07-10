# 00 — Baseline and Safety Report

**Date:** 2026-07-10
**Prepared by:** Claude Code (repository audit and integration session)

## Workspace resolution

- **Resolved workspace path:** `/Users/tylerhebert/Documents/clarity-platform`
- The integration prompt referenced `~/Documents/Clarity Platform` (capitalized, spaced). No such directory exists. The actual workspace is the lowercase-hyphenated `clarity-platform` directory. All work occurs there.

## Git status

- **Not a Git repository** at session start (`git rev-parse` fails; no nested `.git` directories found at depth ≤ 4).
- **Branch:** none (pre-init).
- **Remotes:** none.
- Per the integration procedure for non-Git workspaces: the pre-package inventory and full checksum manifest were completed **before** Git initialization. Git was then initialized and a baseline commit created capturing the preserved pre-integration state before any reorganization. See `06_FILE_MOVE_MAP.md` for commit references.

## Package presence — actual vs. expected

The integration prompt expected:

| Expected | Found |
|---|---|
| `clarity-ai-master-architecture-v0.2.0.zip` | **NOT FOUND** anywhere in the workspace, `~/Documents`, `~/Downloads`, or `~/Desktop` |
| `clarity-ai-master-architecture/` (extracted) | **NOT FOUND** |
| `clarity-ai-database-artifact.zip` | **FOUND** at workspace root (15,794 bytes, mtime 2026-07-10 17:30) |
| `clarity-ai-database-artifact/` (extracted) | not present pre-session (extracted during Phase 2 into `reference/source-packages/`) |

**Material finding:** the master architecture package v0.2.0 arrived only as a **partial set of 16 loose files at the workspace root** (mtimes 2026-07-10 18:00–18:01, several with browser-download suffixes like `(1)`), not as a ZIP or directory. The package's own README (`README copy.md`) and QA report state the full package contains **87 files across 19 numbered directories**. Approximately **72 of 87 files are absent**, including the entire `00-executive-overview/` through `18-open-decisions-and-risks/` trees, `manifest.json`, and all diagrams. This is labeled throughout the audit as **PACKAGE INCOMPLETE — unverifiable content marked unknown**.

Loose master-package files found at root (all mtime 2026-07-10 ~18:00):

- `README copy.md` (the package README, v0.2.0)
- `MASTER_ARCHITECTURE.md`, `MASTER_ARCHITECTURE.html`
- `REQUIREMENTS_TRACEABILITY.md`
- `QUALITY_ASSURANCE_REPORT.md`
- `DEVELOPER_BRIEF.md`, `MASTER_BUILD_PROMPT.md`, `REPOSITORY_STRUCTURE.md`, `FIRST_25_GITHUB_ISSUES.md`
- `HANDOFF_CHECKLIST.md` and `HANDOFF_CHECKLIST (1).md` (byte-identical, SHA-256 `446f74e0…`)
- `DATA_DICTIONARY(1).md`, `SCHEMA_COVERAGE_AND_VALIDATION.md`
- `schema(1) (1).prisma` (expanded target draft: 1,484 lines, 43 models, 56 enums — matches the QA report's claims exactly)
- `schema.foundation.prisma` (foundation schema: 872 lines, 25 models, 35 enums)

`CLAUDE_CODE_CLARITY_INTEGRATION_PROMPT.md` (mtime 18:12) is the integration instruction document itself, not package content.

## Pre-package baseline (mtimes 2026-07-08)

Everything dated Jul 8 predates both packages and is treated as the candidate pre-package workspace: `Clarity MH /`, `clarity-mh-architecture/`, `app/`, `docs/00–09`, `reporting-metrics-rebuild-package/`, `source-notes/`, `README.md`, `.claude/launch.json`, `graphify-out/`. File-system timestamps are used only as **supporting evidence**; classification was confirmed by content (the Jul 8 material is the "Clarity MH / Crisis Platform" generation of the concept; the Jul 10 material is the "Clarity AI" generation).

## Checksums and totals

- **Checksum manifest:** `00_PRE_INTEGRATION_CHECKSUMS.sha256` — SHA-256 for **219 files**, generated before any file was moved, renamed, or modified.
- **Exclusions from checksums and counts:** `app/node_modules/` (176 MB, dependency install), `app/dist/` (288 KB, build output), `.DS_Store` (OS metadata). These were **not removed** — only excluded from the manifest.
- **Workspace size excluding node_modules:** ~6.1 MB.
- **File type counts (excl. exclusions):** 77 json, 72 md, 26 ts, 15 tsx, 4 txt, 3 prisma, 3 jsx, 3 html, 3 csv, 2 zip, 2 xlsx, 2 sql, 2 mmd, 2 docx, plus singletons.

## Top-level structure at baseline

```text
clarity-platform/
├── .claude/launch.json
├── CLAUDE_CODE_CLARITY_INTEGRATION_PROMPT.md   (integration instructions)
├── [16 loose master-package files — see above]
├── clarity-ai-database-artifact.zip
├── Clarity MH /                                (source docs + earlier package zip; note trailing space in name)
├── app/                                        (working Vite+React+TS prototype v0.2.0, tested)
├── clarity-mh-architecture/                    (extracted Jul 8 architecture package + sources)
├── docs/00–09*.md                              (Jul 8 synthesis/architecture docs)
├── graphify-out/                               (generated knowledge graph)
├── reporting-metrics-rebuild-package/          (spreadsheet reverse-engineering outputs)
├── source-notes/                               (conversation-thread source texts)
└── README.md                                   (Jul 8 packet README)
```

## Safety concerns at baseline

1. **No real PHI found.** App seed data uses synthetic tokens ("Adult Demo A", "pt-001"). Synthetic-case JSON in the database artifact uses fabricated members. Source documents (`CIA Comp initial Assesment guidance .md`, SOP manual, feasibility report) are policy/guidance material, not patient records. `Reporting Metrics Ops and Budget .xlsx` (1.6 MB) is operational/budget data from a prior employer context — treated as **business-sensitive**, kept local, never to be committed to any public remote (no remote exists; nothing is pushed).
2. **Duplicate/browser-suffixed filenames** at root (`(1)` variants, `README copy.md`) indicate manual download rather than controlled extraction — origin recorded as "manual download of individual package files, exact provenance unknown."
3. `Clarity MH ` directory name contains a **trailing space**, which is fragile on some tooling; handled during reorganization with `git mv`.
4. No uncommitted-changes risk existed (no repo); no destructive cleanup performed.

## Baseline commit

A Git repository was initialized **after** this inventory and the checksum manifest were complete. The first commit (`chore: capture pre-integration baseline`) contains the workspace exactly as found (plus this audit directory), before any reorganization. `app/node_modules/`, `app/dist/`, and OS metadata are excluded via `.gitignore` but remain on disk.
