---
status: session handoff — read this first, then verify against current GitHub/repo state before acting
written_by: Claude Sonnet 5, ending a session due to usage limits
written_at: 2026-09-13
---

# Session handoff — Phase 2A (shared auth + router + global shell)

This session ran a long, multi-part arc in one sitting: a live UX audit of
the Clarity prototype → a full topology/navigation/session/IA reconciliation
(8 docs, PR #83) → the first approved implementation slice acting on that
reconciliation (Phase 2A, PR #84). It's ending on a usage limit, not because
the work is stuck. **Everything below is real, verified state — re-check the
specific claims that matter to what you do next, per this repo's own truth
discipline, rather than trusting this doc blind.**

## Where things stand right now

`main` is at `92ed7b9` (PR #83 merged this session — the 8 `docs/ux/*.md`
UX-reconciliation documents). **PR #84 is open, not yet merged**, containing
the actual Phase 2A implementation:

- Branch: `claude/phase-2a-auth-router-shell`
- 5 commits, each independently verified (lint/typecheck/`npm run test:app`
  after every one, not just at the end)
- `verify` CI was **pending** as of this write-up — check
  `gh pr checks 84` before assuming it passed
- Self-review already posted per §3a

**Check `gh pr view 84 --json state,mergedAt` and `gh pr checks 84` before
doing anything else.** If it's green, it's ready to merge. If CI failed,
the fix is almost certainly local — this was a clean, well-tested change.

### What PR #84 actually does

Fixes the concretely-demonstrated defect from the live audit: four
independent sign-in surfaces (Crisis Ops sidebar, IOP Reconciliation,
Operating Assurance, RevOps) that each called the same `apiLogin`/`apiLogout`
but kept separate React state, so signing in on one left the other three
still prompting.

- **New:** `app/src/domain/AuthContext.tsx` (`AuthProvider`/`useAuth()`),
  `app/src/components/SignInForm.tsx` (one shared sign-in form, replacing
  four bespoke copies — has an opt-in `defaultValue` prop RevOps uses to
  preserve its pre-existing one-click convenience default), `app/src/ClarityShell.tsx`
  (minimal layout: Clarity mark, area switcher, one identity display).
- **Router:** `react-router-dom` now drives `/`, `/assurance`, `/rev-ops`,
  and a catch-all → `/`, replacing a raw `pathname.endsWith("/rev-ops")`
  check in `main.tsx` and a client-state boolean toggle in `App.tsx`.
- **Migrated:** `CrisisOpsApp.tsx`, `IopReconciliation.tsx`,
  `App.tsx`'s `AssuranceRoute`, and `RevOps.tsx` all now consume
  `useAuth()` instead of owning local `principal` state.
- **Verified live** (not just unit tests) with a real running
  `npm run api:dev` + `npm run dev`: sign in once via Crisis Ops's sidebar,
  navigate to Operating Assurance (already signed in), navigate to Revenue
  Operations (already signed in, workspace data loaded), back to Crisis Ops
  (still signed in). This is the exact acceptance test from the Phase 2A
  brief, and it passes.
- Full detail, including two real regressions caught and fixed mid-flight
  (RevOps's pre-filled login default, and a missing data-load effect for
  "signed in elsewhere, then navigated here"), is in the PR body and commit
  messages — read those rather than re-deriving.

### What PR #84 deliberately does NOT do

No workspace redesigned, no clinical/domain logic touched, no security
boundary changed, no Prescreen/Analytics/Network-Enrichment UI added
(confirmed during the topology audit that none of those three have a
frontend — see `docs/ux/CLARITY_PRODUCT_TOPOLOGY.md` §0 if you need to
re-verify that claim), no micro-frontend, no design-system rewrite.

**One disclosed, accepted limitation, not a bug to silently fix:**
`ClarityShell`'s own "CLARITY" identity bar sits above each area's existing
chrome without editing that chrome — so Crisis Ops's own "Clarity / Crisis
Ops v0.2" brand block still renders too, just below the shell's own bar. A
small, known redundancy, deliberately left for a later visual-cleanup pass
per the brief's explicit "do not perform product-wide visual cleanup"
instruction. Do not "fix" this without it being asked for.

## Other open PRs, unrelated to Phase 2A, unaffected by it

| PR | What | State as of this write-up |
|---|---|---|
| #82 | `IMPLEMENTATION_STATUS.md` refresh for the #78/#79/#80 merges | Open, green |
| #81 | Gemini deep-research prompt, LA psychiatrist/PMHNP scope of practice | Open, green |
| #73 | Whole-platform architecture audit, docs-only | Open, untriaged, stale (opened 03:48 UTC the same day) — an owner call, not something to act on unprompted |
| #63 | Product-portfolio docs | Draft — an owner call |

Check current state with `gh pr list --state open` — this table is a
snapshot, not a live view.

## Source-of-truth documents for anything UX/topology-related

All under `docs/ux/`, merged to `main` in PR #83:

- `CLARITY_PRODUCT_TOPOLOGY.md` — the full evidence/reasoning
- `PRODUCT_TOPOLOGY_DECISION.md` — **the answer**: Clarity is ONE PLATFORM
  with several applications (Crisis Ops, Operating Assurance, RevOps) — not
  one monolithic product, not a suite of separate apps. Read this before any
  further navigation/session/IA work so you don't re-litigate it.
- `CLARITY_NAVIGATION_ARCHITECTURE.md`, `CLARITY_SESSION_CONTINUITY.md`,
  `CLARITY_GLOBAL_SHELL_SPEC.md` — what PR #84 implements
- `CLARITY_LANGUAGE_REGISTRY.md` — terminology audit (partially web-verified,
  cited; explicitly not a substitute for OD-13's still-unexecuted CMS
  research)
- `CLARITY_INFORMATION_ARCHITECTURE.md`, `CLARITY_UX_MIGRATION_PRECONDITIONS.md`
  — the latter is literally the spec PR #84 was built from; if you're
  scoping the *next* slice, start by re-reading its "Migration sequence"
  section for what was deliberately deferred (workspace/tab/case state
  becoming URL-addressable — explicitly NOT done in Phase 2A).

## What's actually next (not started, no code written for any of it)

1. **Get PR #84 merged** — the immediate action. Check CI, merge if green.
2. **Phase 2B candidates**, none scoped yet, all require the same
   verify-before-trusting discipline this session used throughout:
   - Make workspace/tab/case selection URL-addressable (deferred from Phase
     2A on purpose — see `CLARITY_NAVIGATION_ARCHITECTURE.md`'s "why not
     full route parity on day one").
   - Resolve the ClarityShell/area-chrome visual redundancy noted above —
     but that's a visual-cleanup call, likely wants explicit sign-off first
     given the brief's repeated "not yet" on visual redesign.
   - Evidence Review frontend wiring — the next-named P1-1 slice per PR
     #73's implementation plan (IOP Reconciliation was the first; done).
     Not scoped yet — would need the same investigation depth IOP
     Reconciliation and this Phase 2A slice each got.
3. **Unrelated, still open from earlier in this same session:** VS-OA-001
   Product Acceptance still needs an independent reviewer (unchanged, not
   something the implementing session can do itself — see
   `docs/developer-handoff/OPERATING_ASSURANCE_VS_OA_001_ACCEPTANCE_HANDOFF.md`).
   OD-19 (Louisiana hospital provider identifiers) still pending from the
   owner. GCP access for provider-backed Cloud SQL/RLS still not available.

## Working conventions this session used, worth continuing

- **Verify, don't trust memory** — re-read files fresh before editing them
  even within the same session; re-check GitHub state (`gh pr view`,
  `gh pr checks`) before asserting anything about a PR rather than
  extrapolating from when it was last checked.
- **Every PR gets a documented self-review** per §3a of
  `docs/developer-handoff/PRIVATE_REMOTE_AND_BRANCH_PROTECTION_GUIDE.md` —
  concrete evidence of what was actually checked, not a generic "looks
  good."
- **Live-verify UI changes** with real dev servers (`npm run dev` +
  `npm run api:dev`, `DATABASE_URL` from `.env` copied into the worktree —
  see the worktree-mechanics memory note, or just
  `export DATABASE_URL="$(grep -m1 '^DATABASE_URL=' .env | cut -d= -f2- | tr -d '"')"`)
  before claiming something works, not just a passing test suite.
- **Small, atomic, independently-revertible commits** — this session split
  Phase 2A into 5 commits specifically so any one could be reverted without
  unwinding the others.
- This worktree (`next-scope-of-work-dcbc2f`) had its branch fast-forwarded
  to `main` partway through the session for review purposes — it's not
  carrying unique unmerged work of its own beyond what's already described
  above. Every actual change this session made lives on its own
  feature branch and PR, not on this worktree's home branch.
