# Service Extraction Matrix

> **PRESERVED 2026-09-18 (Housekeeping Phase 2B).** Extracted from the unmerged PR #73
> branch rather than merging that PR wholesale, because its only conflicting file
> (`IMPLEMENTATION_STATUS.md`) was rewritten by PR #101's truth repair. This document is a
> **2026-09-12 snapshot** taken against `main` at `15a094d`; treat its statuses, counts and
> file sizes as historical to that date, not as current capability. Corrections applied on
> extraction are marked inline as **[CORRECTED 2026-09-18]**. See
> [`../recovery/2026-09-18-housekeeping-phase-1-truth-reconciliation.md`](../recovery/2026-09-18-housekeeping-phase-1-truth-reconciliation.md).

Default assumption per the modular-first principle: **KEEP IN MODULAR CORE**. A domain
only moves to CANDIDATE FOR FUTURE EXTRACTION or EXTRACT NOW on strong, cited evidence.
Every score below is 0 (no signal found) to 2 (real signal found) across nine factors;
scores are evidence-based, not aspirational.

| Domain | Independent scaling | Reliability isolation | Security isolation | Deployment independence | Data ownership clarity | Team ownership | Communication overhead if split | Transaction coupling (higher = harder to split) | Operational complexity introduced | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Case + command service | 0 | 0 | 0 | 0 | 2 (clear) | 0 | 2 (high — every domain reads case state) | 2 | 2 | **KEEP IN MODULAR CORE** |
| Document repository | 0 | 0 | 1 (file-handling is a distinct blast radius once real uploads exist) | 0 | 2 | 0 | 1 | 1 | 1 | **KEEP IN MODULAR CORE** |
| Evidence repository | 0 | 0 | 0 | 0 | 2 | 0 | 1 | 1 | 1 | **KEEP IN MODULAR CORE** |
| Benefits / Authorization | 0 | 0 | 1 (payer data sensitivity, no PHI extraction today) | 0 | 2 | 0 | 1 | 1 | 1 | **KEEP IN MODULAR CORE** |
| Episode / Utilization Review | 0 | 0 | 0 | 0 | 2 | 0 | 1 | 2 | 1 | **KEEP IN MODULAR CORE** |
| Prescreen | 0 | 0 | 0 | 0 | 2 | 0 | 1 | 1 | 1 | **KEEP IN MODULAR CORE** |
| RevOps / reporting | 1 (heaviest single workload — 47-metric recalculation over ~28k synthetic records) | 0 | 0 | 0 | 1 (shares `Account`/`ReferralSource`-shaped concepts with other domains per the ECC-conversation architecture review, not yet formalized in code) | 0 | 1 | 1 | 1 | **KEEP IN MODULAR CORE** — the one domain worth re-scoring if synthetic-workload volume grows an order of magnitude |
| Operating Assurance | 0 | 0 | 1 (distinct per-resource participant-grant authorization model, already isolated in code even though it's in-process) | 0 | 2 | 0 | 1 | 0 (deliberately no dependency on case-repository's other gateways beyond shared Prisma client) | 1 | **KEEP IN MODULAR CORE** |
| Learning/Practice (CLPR) | 0 | 0 | 0 | 0 | 2 (fully synthetic, no case data) | 0 | 0 (currently has zero live dependency on anything) | 0 | 0 | **KEEP IN MODULAR CORE** — also has no persistence yet, so extraction is not yet a meaningful question |
| Governed events / outbox | 0 | 1 (write-path already isolated by design — `FOR UPDATE SKIP LOCKED` claim semantics) | 0 | 0 | 1 | 0 | 1 | 1 | 1 (a real dispatcher would be a new process, not a new service boundary) | **KEEP IN MODULAR CORE** — if a dispatcher is built, it should be a worker process within the same deployment unit, not an extracted service |
| Network-enrichment | 0 | 0 | 0 | 0 | 1 (contracts only, no persistence) | 0 | 0 | 0 | 0 | **KEEP IN MODULAR CORE** — not built yet, so extraction is moot |

## Reading the scores

No domain scores above 1 on independent-scaling, reliability-isolation, deployment-
independence, or team-ownership — the four factors that would most directly justify
extraction. RevOps is the only domain with any real independent-scaling signal (its
recalculation workload is measurably heavier than any other domain's), and even there the
signal is a 1, not a 2 — worth re-checking if data volume grows materially, not acting on
today.

## Explicit non-recommendation

Per the operating principle, this matrix does **not** recommend Kubernetes, Redis, a
message broker, an API gateway, a data warehouse, or serverless infrastructure for any
domain. See [CLARITY_TARGET_STATE.md](CLARITY_TARGET_STATE.md) for where each of those
would become CONDITIONAL rather than OPTIONAL, and what evidence would need to exist
first.
