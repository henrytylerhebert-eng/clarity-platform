# 00 — Executive Experience Audit

**Date:** 2026-07-18 · **Mode:** inspection and audit only; no product code changed.
**Companion files:** `01-repository-map.md`, `03-role-authority-access-matrix.md`, `14-clinical-and-operational-safety-hazard-register.md`, `18-ux-enhancement-roadmap.md`.

> ⚠️ **Read before pushing:** `.github/workflows/pages.yml` publishes the entire `docs/` tree — including this audit — to public GitHub Pages on push to `main`. See P1-1 in the roadmap. Narrow the publish path first if these documents are not intended to be public.

## What was inspected

Repository structure, all five service permission maps, the auth service and session gateway in full, the Prisma schema (roles, audit, sessions, legal status), the app's role model, persistence, analytics, and legal workspace, the CI/CD pipeline, governance documents, and the baseline test/build status. Evidence labels follow the framework's standard; this document contains **no unlabeled assumptions**.

## The one-paragraph verdict

Clarity is **two well-built halves that have never been introduced.** The backend half is genuinely strong: single controlled command paths per domain, real server-side role policies with documented deliberate exclusions, tenant scoping asserted inside every gateway and covered by dedicated security test suites, audit events committed atomically with mutations, hashed session tokens, and a legal domain that is unusually honest about statutory uncertainty (dual-deadline display, binding non-enforcement rule, counsel gates). The frontend half is a coherent role-scoped demo with real workflow depth. But no API layer connects them: the UI enforces nothing (0 permission-denied states exist), actor roles remain trusted caller input despite an auth service built to retire exactly that assumption, and the two halves use two different role vocabularies with no mapping. Nothing here is a latent surprise — the repo says this about itself — but it is the single fact from which almost every P0/P1 finding derives.

## Current readiness

- **As a stakeholder demo with synthetic data:** ready, with two caveats worth fixing first (single-click legal execution H-2; Pages over-publication H-8).
- **As a deployable clinical system:** not ready, by its own declaration; the gap list is finite and mostly already designed (see roadmap P0-1).

## Baseline (observed runtime findings)

- Root: 214/214 tests green (27 files, incl. security suites). App: 63/63 green (10 files). Typecheck and lint clean.
- No hardcoded secrets found (light scan); `.env` gitignored; DB guard refuses non-local databases in tests.
- No accessibility tooling exists; WCAG conformance is **unknown**, not "passing."

## Top strengths to preserve (verified)

1. ADR-enforced single command path per domain; no Prisma outside the gateway package.
2. Deliberate role exclusions (SYSTEM_ADMIN has zero case rights; auditor/compliance are read-shaped) — documented in code, not just docs.
3. Category-scoped evidence review with in-transaction category verification.
4. Atomic audit-with-mutation writes; hash-chained custody ledger in the app.
5. Statutory honesty: form-vs-statute conflicts displayed, never silently resolved; no automated release/detention logic anywhere.
6. Synthetic-data discipline throughout (namespaced fixtures, fictional cohort, labeled training workspace).
7. Token handling in auth-service (hash-only storage, one-time return, uniform failures, audited revocation).

## Highest-risk findings (full detail in companions)

| Priority | Finding |
|---|---|
| P0-1 | No enforcement layer; roles are caller input; auth-service unconsumed (documented, but blocking) |
| P0-2 | Liberty-depriving instruments execute on a single click with no review-and-confirm and no signer identity |
| P1-1 | Public Pages deploy of the entire internal docs tree, incl. risk registers and this audit |
| P1-2…P1-10 | Role-vocabulary gap, un-gated reads, missing legal-status role policy, wrong-patient cues, arrival-clock capture, audit-chain integrity, capacity freshness, persona/authority parity, a11y unknown |

## What this audit did not do

No runtime journey walkthroughs beyond those already performed in the 2026-07-17 session (Legal Status, Evidence, Benefits, Authorization verified in-browser); no Phase 8 design-system token audit; no Phase 10 integration audit (no integrations exist); no compliance gap analysis beyond repo-verifiable facts — items requiring counsel remain labeled as such in the source documents.

## Recommended next production step (one, concrete)

**Build the thin API layer (roadmap P0-1):** authenticate with the existing `AuthenticationService`, construct actors only via `actorFor()`, expose the existing services unchanged, and point the app's Legal Status workspace at it for one command (`RecordDecisionRationale`) end-to-end. That single vertical slice connects the halves, retires the trusted-roles assumption on a real path, forces the role-mapping decision (P1-2), and gives every subsequent UI feature a pattern to follow.
