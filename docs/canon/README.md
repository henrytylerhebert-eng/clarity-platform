# Clarity Canon — START HERE

**Package:** Clarity Shippable Product Definition & Implementation Package v1.0
**Package date:** 2026-09-20
**Landed in-repo:** 2026-09-20
**Status:** ACTIVE / CONTROLLING for product semantics, UX architecture, and the
implementation authorization gate.

This directory is the governing semantic canon for Clarity. It exists to stop conversational
drift: it separates what Clarity *means*, what is *locked*, what *exists in the repository
now*, what the *target* product should become, what may be *implemented now*, and what remains
*gated*.

Landing these documents is authorized by
[IMPLEMENTATION_AUTHORIZATION_IA-001.md](IMPLEMENTATION_AUTHORIZATION_IA-001.md) §10
("AUTHORIZED NOW — canonical architecture/docs work"). Landing them authorizes **no** code,
schema, migration, API, or UI change. See [ADR-0025](../architecture/ADR-0025-clarity-canon-package.md).

## Hard rule

> **Semantics authorize schema. Schema does not invent semantics.**

No developer or agent may add a new persisted status, score, aggregate, relationship,
authority, decision, or workflow object merely because it makes implementation easier.

## Read order

| # | Document | What it settles |
|---|---|---|
| 1 | [CURRENT_REPO_STATE.md](CURRENT_REPO_STATE.md) | What is actually implemented, and what is not |
| 2 | [SEMANTIC_DECISION_BASE_LOCK.md](SEMANTIC_DECISION_BASE_LOCK.md) | What is frozen and may not be reopened |
| 3 | [DECISION_REGISTER.md](DECISION_REGISTER.md) | LSR-01 → LSR-18, the locked longitudinal decisions |
| 4 | [OPEN_GAP_REGISTER.md](OPEN_GAP_REGISTER.md) | LONG-GAP-01 → 10, the only recognized open pre-schema questions |
| 5 | [CLARITY_CONSTITUTION.md](CLARITY_CONSTITUTION.md) | Truth, time, authority, provenance, tenancy, commands, no-collapse rules |
| 6 | [CURRENT_TARGET_SYSTEM_MAP.md](CURRENT_TARGET_SYSTEM_MAP.md) | Keep / extend / derive / gate / deprecate |
| 7 | [RUNTIME_WIRING_MAP.md](RUNTIME_WIRING_MAP.md) | The governed write, read/trace, and AI paths |
| 8 | [TREE_5_WORKSPACE_MODEL.md](TREE_5_WORKSPACE_MODEL.md) | The Crisis Ops Work surface model (inherits Tree 4) |
| 9 | [EXPERIENCE_ARCHITECTURE.md](EXPERIENCE_ARCHITECTURE.md) | Work / History / Explore / Flow / Ask Clarity |
| 10 | [LONGITUDINAL_MODEL.md](LONGITUDINAL_MODEL.md) | How the person's story is reconstructed across bounded records |
| 11 | [../architecture/LONGITUDINAL_VERTICAL_SLICE_CONTRACT_v0.1.md](../architecture/LONGITUDINAL_VERTICAL_SLICE_CONTRACT_v0.1.md) | The executable contract for that model (already merged) |
| 12 | [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) | Slice 0 → Slice 11 |
| 13 | [MIGRATION_DEPRECATION_PLAN.md](MIGRATION_DEPRECATION_PLAN.md) | Keep / extend / derive / migrate / deprecate / remove-later |
| 14 | [IMPLEMENTATION_AUTHORIZATION_IA-001.md](IMPLEMENTATION_AUTHORIZATION_IA-001.md) | **The gate in force.** What may be built now and what is held |
| 14b | [IMPLEMENTATION_AUTHORIZATION_IA-002.md](IMPLEMENTATION_AUTHORIZATION_IA-002.md) | **DRAFT, not in force.** Proposed three-slice opening of the persistence boundary |
| 14c | [reconciliation/CURRENT_TARGET_LONGITUDINAL_SCHEMA_RECONCILIATION_v0.1.md](reconciliation/CURRENT_TARGET_LONGITUDINAL_SCHEMA_RECONCILIATION_v0.1.md) | 9 objects proposed, 7 refused, per IA-001 §5.3 |
| 15 | [VERIFICATION_MATRIX.md](VERIFICATION_MATRIX.md) | Invariant → proof target → automated evidence |
| 16 | [SHIP_ACCEPTANCE.md](SHIP_ACCEPTANCE.md) | What "shippable" means (it does **not** mean PHI-ready) |
| 17 | [DEVELOPER_HANDOFF.md](DEVELOPER_HANDOFF.md) | Read order and classification rules for a developer or agent |
| — | [reconstruction/CLARITY_MASTER_TREE_v2.1.md](reconstruction/CLARITY_MASTER_TREE_v2.1.md) | **The reconciled product tree** — two-axis evidence/maturity + domain topology classification |
| — | [reconstruction/CLARITY_WHOLE_PRODUCT_RECONSTRUCTION_v0.1.md](reconstruction/CLARITY_WHOLE_PRODUCT_RECONSTRUCTION_v0.1.md) | Repository-grounded completeness audit behind that tree |
| — | [atlas/PLATFORM_ATLAS_v0.1.md](atlas/PLATFORM_ATLAS_v0.1.md) | Platform → applications → contexts → capabilities → layers → representations |
| — | [atlas/EXPERIENCE_ATLAS_v0.1.md](atlas/EXPERIENCE_ATLAS_v0.1.md) | Role → job → workspace → object → view → action → handoff |
| — | [atlas/SCREEN_AND_SCENARIO_ATLAS_v0.1.md](atlas/SCREEN_AND_SCENARIO_ATLAS_v0.1.md) | Surface × uncertainty-state × scenario coverage |
| — | [acceptance/TREE_4_ACCEPTANCE_CONTRACT_v0.1.md](acceptance/TREE_4_ACCEPTANCE_CONTRACT_v0.1.md) | **F1–F6 classified** against current `main`; current vs prototype vs target acceptance |
| — | [WHOLE_PRODUCT_SPEC.md](WHOLE_PRODUCT_SPEC.md) | The consolidated product specification |
| — | [AI_ARCHITECTURE.md](AI_ARCHITECTURE.md) | Ask Clarity: Query / Trace now, Command later |
| — | [conformance/VERIFICATION_MATRIX_CONFORMANCE_BASELINE_v0.1.md](conformance/VERIFICATION_MATRIX_CONFORMANCE_BASELINE_v0.1.md) | **Which invariants are actually enforced** — 9 ENFORCED / 6 PARTIAL / 2 MISSING / 4 N/A |
| — | [gap-closure/LONGITUDINAL_GAP_CLOSURE_v0.1.md](gap-closure/LONGITUDINAL_GAP_CLOSURE_v0.1.md) | **LONG-GAP-01 → 10 decisions**, with the 2026-09-20 amendment record appended |
| — | [review/OWNER_DECISION_PACKET_v0.1.md](review/OWNER_DECISION_PACKET_v0.1.md) | **Read this before ratifying anything.** Adversarial review: 2 gaps fail re-testing, 2 defects found in merged code, IA-002 and ADR-0026 not ratifiable as written |
| — | [CANON_RECONSTRUCTION_PASS_01_v0.1.md](CANON_RECONSTRUCTION_PASS_01_v0.1.md) | Source reconstruction pass behind the lock |
| — | [FIGMA_PATTERN_GAP_ANALYSIS_v0.1.md](FIGMA_PATTERN_GAP_ANALYSIS_v0.1.md) | UI pattern gap analysis |

`DECISION_REGISTER.yaml`, `OPEN_GAP_REGISTER.yaml`, and
`IMPLEMENTATION_AUTHORIZATION_IA-001.yaml` are machine-readable mirrors of their `.md`
counterparts. If the two ever disagree, the `.md` is authoritative and the mismatch is a bug.

## Provenance and known staleness — read before citing

These documents are **dated artifacts**. They are landed verbatim, not edited to match today's
`main`. Two facts a reader needs:

- **IA-001 was written against `main` at `43028c7`.** Since then, PR #133 merged
  `4307093` — which is precisely the "Longitudinal Vertical Slice Contract v0.1 — executable
  contract layer" that IA-001 §9 named as the next authorized slice. That slice is therefore
  **delivered**: `packages/domain-contracts/src/longitudinal.ts`,
  `tests/data/longitudinal-day1-day39.ts`, `tests/unit/longitudinal-contracts.test.ts`, and
  `docs/architecture/LONGITUDINAL_VERTICAL_SLICE_CONTRACT_v0.1.md`. IA-001's §2 matrix, §5
  unlock conditions, and §10 HELD/PROHIBITED lists remain in force unchanged.
- **The open-gap register is no longer open, but two gaps did not survive review.** All ten
  LONG-GAP questions were closed or bounded on 2026-09-20; re-testing the same day moved
  **LONG-GAP-03 and LONG-GAP-08 to NOT YET RATIFIABLE**, and 04, 05, 06 and 10 to ratifiable only
  with amendment. The register preserves the questions verbatim; the decisions live in
  `gap-closure/` and the amendments in `review/`.
- **The persistence gate is still closed.** IA-002 exists only as a **DRAFT** awaiting owner
  ratification; until it is ratified, IA-001's HELD list governs unchanged. Until it is, no
  Prisma change, migration, longitudinal write repository, command service, mutating API,
  actual-discharge command, persistence-backed longitudinal UI mutation, or AI command
  execution is authorized — regardless of what any design document depicts.

## Relationship to the repository's other governing files

This canon is **additive**. It does not relax anything in the repository root
[CLAUDE.md](../../CLAUDE.md) or [AGENTS.md](../../AGENTS.md): synthetic-data-only, the
disposable-database test rule, the one-Prisma-package boundary, the command pattern, tenancy in
every predicate, append-only audit, and the truth-discipline reporting rules all continue to
apply in full. Where this canon is stricter — and on longitudinal semantics it is — the stricter
rule wins.

## Adding to the canon

The semantic freeze rule in [SEMANTIC_DECISION_BASE_LOCK.md](SEMANTIC_DECISION_BASE_LOCK.md) §3
governs. A new longitudinal semantic question may be raised only on documented evidence of a
contradiction, an impossible-as-written decision, an unrepresented workflow or authority
requirement, a provenance conflict the model cannot express, or a projection that cannot be
deterministically derived. It must cite that evidence, receive a new gap ID, and be approved
before any schema work.
