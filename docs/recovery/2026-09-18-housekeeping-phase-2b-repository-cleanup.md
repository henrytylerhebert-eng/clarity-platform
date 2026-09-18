# Housekeeping Phase 2B — Repository Governance Cleanup

**Date:** 2026-09-18
**Starting `origin/main`:** `6e30d84` (merge of PR #101, Phase 1 truth repair)
**Ending `origin/main`:** `f0cd909 (plus this record's own merge)`
**Scope:** Git/GitHub repository state and documentation only

> **This record does not authorize product implementation.**
> **CLARITY ACCESS IMPLEMENTATION FREEZE: ACTIVE.**
> **ACCESS REFACTOR AUTHORIZATION: NOT GRANTED.**
> **DATABASE HOUSEKEEPING: NOT STARTED** — Phase 3 owns it.

---

## 1. What Phase 2B did

Phase 2A turned every stale branch, ADR and PR into an explicit owner decision. Phase 2B
executed those decisions: it landed the documentation that was only reachable from stale refs,
reconciled the ADR numbering that had silently collided, and closed the pull requests whose
content `main` already carried.

No application code, schema, migration, test or database row changed.

## 2. Pull requests landed

| PR | Content |
|---|---|
| #81 | Louisiana psychiatrist/PMHNP scope-of-practice research prompt |
| #89 | CMS/Medicare/Medicaid regulatory reference index |
| #100 | IOP real-source-adapter and program-access decision packet (OD-28) |
| #102 | PR #73 architecture extraction — ADR-0020, drift register, matrices, ledger, state docs, full tree, ADR skill |
| #103 | ADR-0015 and the network-enrichment real-data incident record, preserved as historical |
| #104 | Six build-to-goal product and handoff documents extracted from PR #93 |
| #105 | `ADR_INDEX.md` and the corrected ADR-numbering rule |

## 3. Pull requests closed, with evidence

Each close comment carries the specific evidence, not a generic "stale" note.

| PR | Basis |
|---|---|
| #63 | All files already on `main`; zero unique additions remained |
| #73 | Value extracted to #102; not merged wholesale because its only conflicting file was the one PR #101 had just repaired |
| #82 | `main`'s `IMPLEMENTATION_STATUS.md` is 835 lines with the 2026-09-18 block; the branch's is 586 lines without it — merging would have deleted the repaired truth layer |
| #88 | Content durably preserved on `origin/claude/recovery-iop-reconciliation-wip-2026-09-14`; `main`'s IOP path supersedes it (`32bad2b`, `490449a`) |
| #91 | All 3 unique files verified individually present on `main` |
| #92 | All 13 unique files verified individually present on `main` |
| #93 | Value extracted to #104 (six documents, not the three Phase 2A reported) |
| #94 | Both fixes already resolved on `main` — see §5 |
| #95 | `main` is **newer**: it has `isSubmissionUniqueViolation`, the branch does not; merging would have regressed the gateway |

**No branch was deleted for any of these.** Every closed PR's head branch remains on `origin`
as its preserving ref.

## 4. ADR numbering — root cause fixed

The repository's own rule caused the collision it now prevents. `CLAUDE.md` said:

> ADR numbering is sequential; check `docs/architecture/` for the next free number
> (0001–0008 taken as of 2026-07-11).

Listing that directory **on `main`** is exactly how 0015 and 0020 were double-claimed: both sat
on unmerged branches while 0019, 0021 and 0022 landed, so `main` alone showed two gaps that
looked free and were not. The parenthetical had also been stale for two months.

`docs/architecture/ADR_INDEX.md` is now authoritative, cross-checked at 22 rows against 22
numbers ever added on any ref. A number is permanently reserved on first use anywhere including
durable refs; abandoned numbers stay vacant; renumbering to close a gap is forbidden because it
breaks inbound citations; allocation requires an all-refs check. **Next safe number: ADR-0023**,
deliberately not created.

## 5. Two corrections to the Phase 2A packet

Recorded because both changed what Phase 2B actually did.

**PR #94's fixes were already on `main`; no replacement was created.** Phase 2A reported both
absent. That finding was wrong: it grepped `packages/api-service/src/server.ts`, which was
accurate before the Fastify migration and is not any more. On current `main` the role-sort fix
lives at `packages/api-service/src/prescreenRoutes.ts:107`, and the malformed-path 500 is gone
structurally — no manual `decodeURIComponent` anywhere in `api-service`, path params validated
by a strict Zod schema, and `ZodError` mapped to 400 at `server.ts:104`. Creating the approved
replacement PR would have been a no-op edit to working code, so it was not created.

No regression test was added for that behaviour, and none is needed. Reading ADR-0012 in full
while building the ADR index showed the coverage already exists on `main`:
`tests/integration/api-service.test.ts:164` and `tests/integration/prescreen-api.test.ts:328`
each assert that `%zz` and `%E0%A4%A` return a content-free 400, and ADR-0012's 2026-09-12 note
records both suites passing unmodified through the Fastify migration "including both
malformed-percent-encoding cases". An earlier note on the #94 closure called such a test a
possible Phase 3 follow-up; that note was corrected on the PR.

**PR #93 had six absent documents, not three.** The Phase 2A figure came from a partial check of
four paths. All six were extracted in #104.

## 6. Artifacts evaluated and deliberately not landed

- **PR #73's edit to `CLPR_SYNTHETIC_VERTICAL_SLICE.md`** — PR #99 had already recorded that
  acceptance in `CLPR_IMPLEMENTATION_RETURN.md` *and corrected its test-count attribution*.
  Re-landing would have reintroduced the uncorrected 755/755 and 132/132 counts.
- **`.claude/agents/doc-updater.md`** — targets `docs/CODEMAPS/` and `/update-codemaps` /
  `/update-docs`, none of which exist in this project.
- **PR #93's `package.json` and `tsconfig.json` edits** — config, outside a docs disposition.
  `scripts/with-ephemeral-database.ts` and its `test:ephemeral` script were already on `main`.

## 7. Truth repairs applied to extracted material

Every extracted snapshot carries a dated banner. Corrections are marked inline so the original
findings stay auditable:

- **DRIFT-09** superseded by PR #101.
- **DRIFT-10** closed on `main` via PR #99's `CLPR_IMPLEMENTATION_RETURN.md`.
- **DRIFT-11** partially corrected. The broad frontend/backend disconnection finding still holds
  — most workspaces import no API client — but two specifics were false: Operating Assurance
  *does* have a frontend surface (325 lines, API-backed) and IOP Reconciliation *is* API-backed.
  7 of 26 workspaces import an API client on current `main`.
- **DRIFT-13** corroborated and promoted in importance — see §9.
- Architecture ledger §7 and §9 corrected for the same two stale claims; its 2026-09-12 suite
  counts labelled historical.
- ADR-0015 and the incident record carry an **OD-13 disambiguation**: their `OD-13` means the
  network-enrichment service/worker boundary, **not** current `main`'s OD-13 (CMS regulatory
  reference acquisition). The collision is recorded in
  `docs/developer-handoff/AI_NATIVE_DOMAIN_AGENT_REPOSITORY_PREPARATION.md`.

## 8. Explicitly not done

`codex/om/sync-main` is **not retired** and remains `KEEP — DB/MIGRATION DEPENDENCY`. No
`recovery/machine-only/*` ref was touched. The two orphan migrations were **not landed**, the
ledger was **not modified**, no table or row changed, no synthetic residue was deleted, no
`prisma` command was run, and no worktree was removed.

## 9. Phase 3 handoff — evidence gathered, nothing acted on

Verified read-only during Phase 2B; `clarity_dev` counts are **identical** to the Phase 2B
baseline.

| Item | State |
|---|---|
| Organizations / cases | 401 / 1,192 — all synthetic, 0 outside the `synthetic-` prefix |
| `FacilityProfile` | 101 rows, all owned by synthetic orgs, 0 orphaned — the 2026-07-19 real-data incident remediation still holds |
| Migration ledger | 27 rows, 0 failed, 0 rolled back |
| Orphan entries (issue #31) | `20260720002049_packet11_persistence`, `20260720014914_network_review_append_only_audit` — both still present |
| Nine `Network*` tables | still present; `NetworkReviewPackage` 249, `NetworkReview` 249, `NetworkReviewAudit` 393 rows |
| Pending migration | `20260917000100_iop_program_binding` — still unapplied (0 ledger rows) |

**The most useful Phase 3 lead is DRIFT-13, but it is a lead, not a proof.** It measured the
suite moving `Organization` 338 → 400 and `BehavioralHealthCase` 1023 → 1191 across full-suite
runs; an independent 2026-09-18 count found 401 / 1,192, one above that endpoint. Those are
**aggregate before/after counts**. They are consistent with a cleanup gap but do **not**
establish one: they cannot distinguish a failed teardown hook from an intentionally persistent
setup or dev fixture, a crashed run, or another session's writes.

Phase 3 should therefore **diagnose before deleting**: attribute rows to a writer per fixture
family, then fix whatever is actually leaving them. Suggested order: diagnose the cause →
`synthetic-org-api-dev` fixture ruling → residue deletion → ledger decision → pending IOP
migration. Deleting first risks the deletion simply being undone.

ADR-0015 is now on `main` as the documentation needed to understand the orphan migrations
before any decision is taken about them.

## 10. Honesty statement

Not claimed: production readiness, HIPAA compliance, PHI handling, approved clinical or legal
rules, working external integrations, or provider-backed tenancy evidence. **No local test,
lint, or typecheck run is claimed by any Phase 2B change** — every PR was documentation-only and
was verified by `git diff --check`, scope inspection, Markdown link validation, and the
repository's own CI `verify` check, which passed on each merged PR. Nothing here changes product
behaviour or database state.
