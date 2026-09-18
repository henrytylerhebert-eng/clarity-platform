# Governance incident record: real-world facility-directory loader (2026-07-19)


> **PRESERVED AS HISTORICAL — 2026-09-18 (Housekeeping Phase 2B, owner decision OD-HK2-003).**
> Body unchanged; first landed on `main` on 2026-09-18 from the `codex/om/sync-main` lineage,
> which was never merged. Preserved because it is the repository's only record of a
> synthetic-only boundary breach and of the owner ruling that contained it.
>
> **Remediation re-verified 2026-09-18 by read-only query against local `clarity_dev`:**
> **0** organizations whose id does not begin with `synthetic-`; all **101** `FacilityProfile`
> rows belong to synthetic organizations, with **0** rows orphaned to a missing organization.
> The containment described below still holds. No row was read for content, and nothing was
> modified.
>
> The loader and agent prompt this record describes live only on the unmerged lineage and its
> recovery ref. Related: [`../architecture/ADR-0015-network-enrichment-invariant-remediation.md`](../architecture/ADR-0015-network-enrichment-invariant-remediation.md).

**Status:** Contained and remediated 2026-07-19 per owner ruling (same day).
**Owner ruling:** treat as a governance incident, not a test-fixture event —
quarantine/purge any loaded rows, harden the loader to opt-in-only, keep an
evidence snapshot, and record the incident.

## What happened

The packet-based network-enrichment work on `codex/om/sync-main` added
`scripts/seed_facilities.ts`: an unguarded loader that read a real-world
Louisiana behavioral-health facility directory CSV from a hardcoded personal
Google Drive path and bulk-inserted the rows into `FacilityProfile` under an
organization named `Louisiana Healthcare Network` — no synthetic prefixing,
no dry-run mode, no opt-in gate, writes on every invocation, and a direct
`@prisma/client` import outside `packages/case-repository` (a second
invariant breach). A companion live web-research agent prompt sat in the
operational tree at `tools/prompts/facility-enrichment-agent.md` while
`IMPLEMENTATION_STATUS.md` lists "any live product agent" as Not started.

This violates the repository's synthetic-only posture: "synthetic" prefixes
all test fixtures, and `clarity_dev` is assumed to contain synthetic data
only. Facility-directory data is public business data, not PHI — the breach
is of the governance boundary, not of patient privacy.

## Evidence snapshot (audit run 2026-07-19, local `clarity_dev`)

Counts taken before any remediation, after the day's full test runs:

| Table | Count | Finding |
|---|---|---|
| `Organization` | 18 | All names `Synthetic `/`synthetic-` prefixed; **no `Louisiana Healthcare Network` row exists** |
| `FacilityProfile` | 0 | **Zero rows** |
| `NetworkReviewPackage` | 168 | Synthetic test residue (separate issue, below) |
| `NetworkEntityCandidate` | 25 | Synthetic test residue |
| `User` | 18 | Synthetic test residue |
| `BehavioralHealthCase` | 9 | Synthetic test residue |

**Conclusion:** no real-world rows were present in `clarity_dev` at audit
time. Either the loader was never executed against this database or its rows
were removed before this audit. There was nothing to quarantine or purge;
the containment action collapses to this evidence snapshot. Whether the
loader ran against some other database cannot be determined from this
repository. `[Unverified]`: any execution history of the script.

## Remediation (completed this session)

1. `scripts/seed_facilities.ts` deleted from the operational tree (original
   preserved in git history). Replaced by
   `scripts/maintenance/legacy/seed_facilities.ts`, which:
   - refuses to run without `ALLOW_REAL_WORLD_DIRECTORY_SEED=true`;
   - defaults to **dry-run**; writes require an explicit `--confirm`;
   - has **no default CSV path** — `--file` is required; optional
     `--dataset-id` labels the load;
   - prints a real-data warning banner;
   - obtains its client from `@clarity/case-repository`
     (`createPrismaClient`) instead of importing `@prisma/client` directly.
2. `tools/prompts/facility-enrichment-agent.md` moved to
   `reference/planning/facility-enrichment-agent-prompt.md` with a
   "planning material only — not wired to run" header. Owner classified it
   as dormant planning material, never executed. Live enrichment/egress
   remains gated by OD-13.
3. This record.

## Retention decision

No real-world data is retained in `clarity_dev`. If a future load is
authorized, it must target a non-synthetic database (or a clearly excluded
org/namespace), never a database used by the synthetic test harness, per
the owner ruling.

## Related finding (tracked separately, not part of this incident)

The synthetic residue counts above show the DB-backed suites do not fully
clean up after themselves (organizations/users/cases and especially
network-enrichment rows accumulate across runs). This contradicts the
"zero synthetic residue" discipline and predates this incident's audit; it
is a test-harness hygiene defect, not a real-data breach.
