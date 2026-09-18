# ADR Index

Authoritative inventory of every Architecture Decision Record number ever used in this
repository — on `main`, on any branch, and on any durable recovery ref. Created 2026-09-18
during Housekeeping Phase 2B (owner decision OD-HK2-008).

**A directory listing of `docs/architecture/` is not sufficient and must not be used to pick
the next number.** Numbers 0015 and 0020 were claimed on unmerged branches while 0019, 0021
and 0022 landed on `main`, so `main` alone showed two gaps that looked free and were not.

## Allocation rules

1. **A number is permanently reserved on first use anywhere** — any ref, any branch, merged or
   not, including `recovery/machine-only/*`. Never reuse a number.
2. **Abandoned numbers stay intentionally vacant.** A gap is information: it records that a
   number was claimed and its work did not land. A gap is not an error to be closed.
3. **Never renumber an ADR to close a gap.** Renumbering breaks every inbound citation in
   commits, PRs, code comments and other ADRs.
4. **Inspect all refs before allocating**, never `main` alone:
   ```bash
   git log --all --diff-filter=A --name-only --pretty=format: -- 'docs/architecture/ADR-*' \
     | grep -o 'ADR-[0-9]\{4\}' | sort -u | tail -1
   ```
   Take that maximum + 1. Fetch first; consider PR refs if the work may live only in a PR.
5. **Update this index in the same commit that creates an ADR.** An ADR without an index row
   is an incomplete change.
6. **Do not self-ratify.** Status stays `Proposed` until the owner accepts it.

Filename convention: `docs/architecture/ADR-NNNN-kebab-case-title.md`.

## Inventory

| # | Status | Date | Subject | Location |
|---|---|---|---|---|
| 0001 | Accepted | 2026-07-10 | Repository and integration strategy | `main` |
| 0002 | Accepted | 2026-07-10 | Canonical data model | `main` |
| 0003 | Accepted | 2026-07-11 | Case command service and workflow transition engine | `main` |
| 0004 | Accepted | 2026-07-11 | Document command service | `main` |
| 0005 | Accepted | 2026-07-11 | Atomic assignee tenant validation | `main` |
| 0006 | Accepted | 2026-07-11 | Linting and code-quality baseline | `main` |
| 0007 | Accepted | 2026-07-11 | Document storage abstraction, versioning, failure compensation | `main` |
| 0008 | Accepted | 2026-07-11 | Evidence repository and human-review workflow | `main` |
| 0009 | Accepted | 2026-07-13 | Manual insurance and benefits verification | `main` |
| 0010 | Accepted | 2026-07-13 | Authorization readiness (preparation phase) | `main` |
| 0011 | Accepted | 2026-07-14 | Authentication: sessions, identity port, principal bridge | `main` |
| 0012 | Accepted in part | 2026-07-14 | API architecture (OD-5) — native-Fastify migration open; see DRIFT-06 | `main` |
| 0013 | Accepted | 2026-07-19 | Prescreen command service (Phase 2, in-memory slice) | `main` |
| 0014 | Accepted | 2026-07-19 | Prescreen role mapping and same-organization API slice | `main` |
| **0015** | **Accepted (2026-07-19) — HISTORICAL** | 2026-07-19 | Network-enrichment invariant remediation | `main` (preserved 2026-09-18); originated on `codex/om/sync-main` |
| 0016 | Accepted | 2026-07-19 | Prescreen Phase 3 persistence (local bounded slice) | `main` |
| 0017 | Accepted | 2026-07-29 | Development-agent operating model; three-agent bridge retirement | `main` |
| 0018 | Accepted | 2026-07-29 | `MEDICAL_TRANSFER_REQUIRED` semantics; `RETURNED_FOR_MORE_INFORMATION` deferred | `main` |
| 0019 | **Proposed** | 2026-08-23 | Network-enrichment contract kernel | `main` |
| **0020** | **Accepted (2026-09-12)** | 2026-09-12 | Operating Assurance implementation ratified retroactively past its discovery gate | `main` (extracted 2026-09-18); originated on the PR #73 branch |
| 0021 | **Proposed** | 2026-09-13 | Persisted Louisiana Medicaid rate-release registry (R1) | `main` |
| 0022 | Accepted | 2026-09-13 | Provider swap — Supabase Postgres replaces Cloud SQL for OD-6 | `main` |

**Next safe number: `ADR-0023`.** Not yet created.

## Notes on the two reconciled numbers

**ADR-0015** records an owner-directed 2026-07-19 remediation of the network-enrichment
package. That implementation lineage never merged: PRs #29 and #30 were closed unmerged, and
`packages/network-enrichment-service` does not exist on `main`. ADR-0019 supersedes only the
*contract* portion of that lineage and explicitly does not supersede its service, API,
migration, UI or tooling work. ADR-0015 is preserved because it is the only document
explaining orphan migration `20260720014914_network_review_append_only_audit`, which remains
in the local `clarity_dev` ledger, and because its findings are reusable invariant lessons.
**It is not evidence that a network-enrichment service exists today.**

**ADR-0020** ratifies, after the fact, that Operating Assurance was implemented past its own
discovery-lifecycle gate. The decision is current and unchanged; only its path onto `main`
differs, because PR #73 was extracted rather than merged wholesale.

## Related

- `docs/architecture/ARCHITECTURE_DRIFT_REGISTER.md` — DRIFT-08 is the contradiction ADR-0020 decides.
- `docs/recovery/2026-09-18-housekeeping-phase-1-truth-reconciliation.md` — Phase 1 record.
- `.claude/skills/architecture-decision-records/SKILL.md` — ADR authoring skill, with a Clarity conformance note pinning these rules.
