# Housekeeping document drift — 2026-09-19

**STATUS: RESOLVED.** The 23 constraint and index names drift was incidentally resolved by the application of the `add_review_in_progress` migration during Access Slice 2A.

# Housekeeping document drift — 2026-09-19

**Scope:** non-product documentation accuracy only. **Not Access architecture.**
Nothing here blocks Access work, and Access work does not block any of it.

**Measured at:** `origin/main = 26b598c`, 2026-09-19, by direct observation
(`git branch`, `git worktree list`, `git stash list`,
`prisma migrate diff --from-schema-datasource prisma --to-schema-datamodel prisma`).

## D1 — Stale counts in the canonical status block

`CLAUDE.md` ("Project state") and `IMPLEMENTATION_STATUS.md` carry counts from a
2026-09-18 audit that have since moved.

| Claim | Stated | Measured 2026-09-19 |
|---|---|---|
| Local branches | 64 | **44** |
| Remote branches | 99 | **108** |
| Worktrees | 10 | **14** |
| Stashes | 0 | 0 (correct) |

These are inventory counts, not capability claims. They drift with ordinary work.
Recommended fix: either refresh them, or stop carrying raw counts in the status
block and point to the commands that produce them. Carrying a number that must be
hand-edited after every branch operation guarantees recurring drift.

## D2 — Constraint/index name drift is 23, not 20

Both `CLAUDE.md` and `IMPLEMENTATION_STATUS.md` state that **20** constraint/index
names differ between the migration chain and the Prisma schema. The measured
figure is **23**: 11 `RenameForeignKey` + 12 `RenameIndex`.

The surrounding characterization is **correct and unchanged**: the drift is
**names only**, there are zero structural statements, and it reproduces on every
clean replay. Causes are hand-named foreign keys and PostgreSQL's 63-byte
identifier truncation.

Reproduce with:

```bash
npx prisma migrate diff --from-schema-datasource prisma --to-schema-datamodel prisma --script
```

Note the argument is the schema **folder** (`prisma`), not `prisma/schema.prisma`.
`package.json#prisma.schema` is set to the folder, and passing the single file
omits `prisma/assurance.prisma`, which produces a misleading diff full of
`DropTable` statements for the Assurance models.

## D3 — The drift issue has never been filed

The status block instructs: "Separately file an issue for the constraint-name
drift above." As of 2026-09-19 the open issues are **#1, #2, #3, #4, #5, #35**
only. No drift issue exists. Draft below.

---

### Issue draft — Constraint and index name drift between migration chain and Prisma schema

**Labels:** `housekeeping`, `database`

**Body:**

23 constraint and index **names** differ between the applied migration chain and
the names Prisma derives from `prisma/`. There are **no structural differences** —
the diff contains only `RenameForeignKey` (11) and `RenameIndex` (12) statements,
no added, dropped or altered tables, columns, or constraints.

Reproduce:

```bash
npx prisma migrate diff --from-schema-datasource prisma --to-schema-datamodel prisma --script
```

Causes:

1. Hand-named foreign keys in migration SQL (for example
   `AssuranceApplicabilityDecision_case_fkey`) where Prisma derives the full
   column-list name.
2. PostgreSQL's 63-byte identifier truncation producing a different tail than
   Prisma's own truncation, for example
   `AssuranceApplicabilityDecision_organizationId_assuranceCaseId_i` versus
   `AssuranceApplicabilityDecision_organizationId_assuranceCase_idx`.

Affected tables: the `Assurance*` family (11 FK renames, 8 index renames) and
`IopReconciliationImport` / `IopReconciliationExceptionReview` (4 index renames).

This reproduces on every clean replay, so it is a property of the chain, not
residue in any one database. The rebuilt `clarity_dev` (Phase 3B Gate B) shows it,
and a freshly migrated ephemeral database will too.

**Impact:** cosmetic today. `prisma migrate status` is clean and the schema is
structurally correct. The risk is future: a `migrate dev` run could try to
"correct" these names and generate a no-op rename migration, and anyone reading
a raw `migrate diff` may mistake it for real drift.

**Not proposed here:** any migration to reconcile the names. Renaming 23
constraints to satisfy a cosmetic diff is its own risk, and the decision belongs
to the owner. This issue exists so the drift is recorded rather than
rediscovered.
