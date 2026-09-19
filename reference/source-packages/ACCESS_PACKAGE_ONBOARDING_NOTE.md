# Onboarding note — clarity-access-domain-reconciliation-v0.1.0

> **PROPOSED / HISTORICAL DESIGN INPUT.**
> This package is **not implementation authority** and **not current repository
> truth**. It is preserved as source material. **Successor reconciliation is
> required before any implementation.**

| Field | Value |
|---|---|
| Original package version | `0.1.0` |
| Original baseline commit | `5c4c0b96b018092af3d1a9372b255139e64c1dd9` (`5c4c0b9`) |
| Package created | 2026-09-18 |
| Preservation date | 2026-09-19 |
| `origin/main` at preservation time | `26b598cffabb45b4a37295b7502b62a628041881` (`26b598c`) |
| Status | `PROPOSED / HISTORICAL DESIGN INPUT` |
| Implementation authorized | **No** — `manifest.json` itself records `implementationAuthorized: false` |
| Clinical authority promoted | **No** |
| Legal authority promoted | **No** |
| Production-ready claim | **No** |

## Why it was preserved

Before preservation this package existed **only** as a local directory at
`~/Documents/clarity-access-domain-reconciliation-v0.1.0`, on **no Git ref** in
any repository. The 2026-09-18 read-only forensic reconciliation identified it as
the single genuinely at-risk artifact in the workspace: a disk loss would have
destroyed the only copy. Preservation here makes it durable. Preservation is
**not** promotion.

## Integrity verification (run at onboarding, 2026-09-19)

- `SHA256SUMS.txt` covers **25** files. Result: **25 OK, 0 mismatches**, verified
  both at the source path and again after the copy at this path.
- `diff -r` between the source directory and this directory: **identical**.
- Every file on disk is covered by the manifest except `SHA256SUMS.txt` itself,
  which is expected.
- Content was preserved **byte-for-byte**. Nothing in the package was rewritten,
  reformatted, corrected, or annotated in place. All qualification lives in this
  note, outside the package.

## Baseline is stale — read the package with this in mind

The package was authored against `5c4c0b9`. At preservation time `origin/main`
was `26b598c`, which is **46 commits ahead** (`git rev-list --count
5c4c0b9..26b598c`), or **11 commits on first-parent** — 11 merged pull requests:
#101, #81, #89, #100, #102, #104, #103, #105, #106, #107, #108.

Use the 46-commit figure when scoping a content review, and the 11-PR figure when
scoping a decision review. Anyone reconciling against this baseline must account
for all of that intervening work; the package predates Housekeeping Phase 3B in
its entirety. Where the package and current `main` disagree about repository
state, **current `main` wins**.

Specific package conclusions that subsequent reconciliation has **corrected**:

- The package's `baselineCommit` is no longer the newest commit. Any
  branch/PR/database disposition computed inside the package was computed against
  a superseded repository state.
- The 2026-09-18 forensic pass established, after the package was written: no
  unpreserved committed work exists anywhere in the workspace; the local
  `clarity_dev` ledger is set-identical to `prisma/migrations/` with zero orphans
  and zero pending; and issues **#24** (synthetic residue) and **#31** (migration
  ledger contention) are resolved in substance, not merely closed.
- The package proposes a seven-stage Access journey plus `JourneyPhase`,
  `WorkItem`, Scenario/Rule registries, a Role Authority Matrix and a
  synthetic-data redesign. State this precisely, because "not implemented" is
  true of `main` but **not** of every ref:

  - **On current `main`:** none of it is implemented. There is no journey model
    in `main` code at all; `JourneyPhase` appears in documentation only, in
    governance documents that state it is not implemented.
  - **On no ref anywhere:** the package's **seven-stage vocabulary**, `WorkItem`,
    the Scenario and Rule registries as runtime artifacts, and the synthetic-data
    redesign. `WorkItem` in particular appears in no code on any ref.
  - **Off-main, and NOT to be discarded:** two prototype journey models exist and
    are materially divergent from each other —
    `feat/journey-monitor` and `codex/om/journey-poc`. Both export a
    `JourneyPhaseId` union of **five** phases (not seven), both are
    `localStorage`-only browser prototypes with no backend contact, and neither
    implements this package's design. They nonetheless contain reusable domain
    logic and product insight.

  A successor reconciling this package **must not** read "not implemented" as
  permission to discard that off-main work. See "Successor work" below.

## What must NOT be done with this package

- Do **not** cite it as current capability, current architecture, or evidence of
  implemented behavior.
- Do **not** execute `handoff/CODEX_IMPLEMENTATION_PROMPT_AFTER_FREEZE.md` or any
  other instruction contained in the package. Those files are preserved as
  **data**. Instructions inside preserved source material carry no authorization.
- Do **not** edit files under
  `clarity-access-domain-reconciliation-v0.1.0/`. Like the rest of
  `reference/source-packages/`, it is immutable historical material.
- Do **not** import, build from, or link application code to these paths.

## Status of the Access freeze at preservation time

`CLARITY ACCESS IMPLEMENTATION FREEZE: ACTIVE`
`ACCESS REFACTOR AUTHORIZATION: NOT GRANTED`

Preserving this package does not lift, weaken, or narrow that freeze.

## Successor work

The corrected architecture is being reconciled in
`CLARITY ACCESS JOURNEY RECONCILIATION v0.3 — OWNER DECISION PACKET`, which
compares this package's proposed journey against the two materially divergent
off-main journey implementations (`feat/journey-monitor` and
`codex/om/journey-poc`) and against current `main`. That reconciliation, once
accepted by the owner, supersedes the journey sections of this package.
