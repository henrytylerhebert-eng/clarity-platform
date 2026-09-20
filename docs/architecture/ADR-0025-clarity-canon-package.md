# ADR-0025: Adopt the Clarity Canon package as the governing semantic base, and IA-001 as the implementation gate

**Status:** Accepted — owner ratified 2026-09-20
**Date:** 2026-09-20

## Context

Clarity's product semantics, UX architecture, and longitudinal model were reconstructed across a
series of conversations, producing the "Clarity Shippable Product Definition & Implementation
Package v1.0" (package date 2026-09-20). That package contains the Semantic Decision Base Lock,
the Decision Register (LSR-01 → LSR-18), the Open-Gap Register (LONG-GAP-01 → 10), the Clarity
Constitution, the Tree 5 workspace model, the experience and longitudinal models, the
implementation and migration plans, the verification matrix, the ship-acceptance definition, and
Implementation Authorization IA-001.

Until now that package existed only outside the repository. Nothing in it bound an agent or
developer working in this codebase. Its stated purpose is to stop conversational drift, and it
cannot do that from outside the repository:

- the locked semantics (for example "`PendingDischarge` is derived, never an `EpisodeStatus`")
  were not discoverable from the code or from `CLAUDE.md`;
- the ten open pre-schema questions were not enumerated anywhere a session could find them, so
  a new question could be invented rather than recognized as already-open;
- most consequentially, **IA-001 — the gate that says which work is authorized and which is
  held — was not in the repository**, so a session could implement held work without ever
  encountering the hold.

The contract layer IA-001 §9 authorized has meanwhile landed: PR #133 merged as `4307093`,
adding `packages/domain-contracts/src/longitudinal.ts`,
`tests/data/longitudinal-day1-day39.ts`, `tests/unit/longitudinal-contracts.test.ts`, and
`docs/architecture/LONGITUDINAL_VERTICAL_SLICE_CONTRACT_v0.1.md`. So the repository already
carries the executable half of the canon while lacking the semantic half that explains and
constrains it.

## Decision

Land the canon package verbatim under `docs/canon/`, with an index at `docs/canon/README.md`,
and adopt it as the governing semantic base for Clarity product work.

Specifically:

1. **`docs/canon/` is the semantic canon.** The Semantic Decision Base Lock, the Decision
   Register, and the Open-Gap Register are controlling. The 18 LSR decisions are locked; the 10
   LONG-GAP questions are the only recognized longitudinal pre-schema questions for this pass.

2. **IA-001 is the implementation gate.** `docs/canon/IMPLEMENTATION_AUTHORIZATION_IA-001.md`
   §2 (the authorization matrix) and §10 (AUTHORIZED NOW / HELD / PROHIBITED BY CANON) govern
   what may be built. The persistence and write boundary stays closed until **IA-002** is
   issued, which requires the vertical-slice contract (done), the ten gap decisions (open),
   current→target schema reconciliation, and a specific ADR per persistence boundary.

3. **The governing rule is: semantics authorize schema; schema does not invent semantics.** No
   new persisted status, score, aggregate, relationship, authority, decision, or workflow object
   may be added because it makes implementation easier.

4. **Documents land verbatim as dated artifacts.** They are not rewritten to match today's
   `main`. Known staleness is recorded in `docs/canon/README.md` rather than by editing the
   source documents — notably that IA-001 was written against `main` at `43028c7` and that its
   §9 "next authorized slice" has since been delivered by `4307093`.

5. **The canon is additive to the repository's existing rules.** Root `CLAUDE.md` and
   `AGENTS.md` continue to apply in full: synthetic-data-only, the disposable-database test
   guards, the single-Prisma-package boundary, the command pattern, tenancy in every predicate,
   append-only audit, and the truth-discipline reporting rules. Where the canon is stricter, the
   stricter rule wins.

6. **`CLAUDE.md` and `AGENTS.md` point at the canon** so a session encounters the gate before
   doing longitudinal work rather than after.

## Consequences

**Enabling.** A session can now answer "is this authorized?" from the repository. Held work is
visible as held. The ten open gaps are enumerated, so the next semantic step is a defined set of
decisions rather than an open-ended design conversation.

**Constraining.** Work that is held by IA-001 — Prisma changes, migrations, longitudinal write
repositories and command services, mutating longitudinal APIs, the actual-discharge command,
persistence-backed longitudinal UI mutation, and AI command execution — is now explicitly
blocked in-repo, not merely undiscussed. Unblocking any of it requires IA-002 plus a per-boundary
ADR.

**Cost of staleness.** Because the documents land verbatim, they will drift from `main` as work
proceeds. `docs/canon/README.md` carries the reconciliation notes; that file, not the source
documents, is where drift is recorded. A future canon revision should bump the package version
rather than silently edit a dated artifact.

**Not claimed.** This ADR authorizes documentation only. It does not claim production readiness,
HIPAA compliance, PHI readiness, clinical or legal approval, deployment, or that any invariant in
`docs/canon/VERIFICATION_MATRIX.md` currently has an automated test behind it. Several rows in
that matrix have no test today; identifying which is separate work.

## Alternatives considered

- **Leave the package outside the repository.** Rejected: it cannot govern sessions it is not
  visible to, which is the exact failure mode the package was written to prevent.
- **Rewrite the documents to match current `main` before landing.** Rejected: it would destroy
  the dated-artifact provenance that makes IA-001 auditable, and it conflicts with the
  repository's truth-discipline rule that historical evidence is preserved, not restated.
- **Land only IA-001 and the registers, omitting the product/UX documents.** Rejected: IA-001's
  authorization matrix cites the Constitution and the locked semantics as its authority basis;
  landing the gate without its basis would leave the gate unexplained.
- **Encode the locked semantics as lint rules or tests instead of documents.** Not rejected —
  deferred. `docs/canon/VERIFICATION_MATRIX.md` already names the invariants and their intended
  proof targets. Converting them into executable conformance tests is authorized work under
  IA-001 §10 ("semantic acceptance tests") and should be its own slice.

## References

- `docs/canon/README.md` — index, read order, and provenance notes
- `docs/canon/IMPLEMENTATION_AUTHORIZATION_IA-001.md` — the gate
- `docs/canon/SEMANTIC_DECISION_BASE_LOCK.md`, `docs/canon/DECISION_REGISTER.md`,
  `docs/canon/OPEN_GAP_REGISTER.md` — the locked base
- `docs/architecture/LONGITUDINAL_VERTICAL_SLICE_CONTRACT_v0.1.md` — the merged contract layer
- `4307093` (PR #133) — the commit delivering IA-001 §9
