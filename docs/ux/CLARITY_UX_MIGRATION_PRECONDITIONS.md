---
status: proposal only — NOT implemented, NOT started. Requires explicit approval before any code change.
depends_on: every other document in docs/ux/ this series produced
---

# UX migration preconditions

## What this reconciliation does not authorize (brief §13, restated as a gate)

None of the following are in scope for the slice proposed below, and none
should be inferred from anything else in this series:

- Redesigning any individual screen's layout or content
- Rewriting any existing React component's internal logic
- Migrating any workspace's internal state to URL params (that is explicitly
  deferred, per [CLARITY_NAVIGATION_ARCHITECTURE.md](CLARITY_NAVIGATION_ARCHITECTURE.md))
- Micro-frontends or new microservices — the topology ruling found no
  deployment or security boundary that would justify either
- Any change to clinical domain logic, command/gateway packages, or Prisma
  schema
- Any change to security or tenant-isolation boundaries
- Renaming any persisted domain object (`BehavioralHealthCase`,
  `AssuranceCase`, etc.) — only §9's *display* language is in scope, never
  the underlying identifiers
- Removing or weakening any human-review gate
- A design-system rewrite — [CLARITY_GLOBAL_SHELL_SPEC.md](CLARITY_GLOBAL_SHELL_SPEC.md)
  explicitly preserves `StatusBadge`, the tool-workspace banner, and the
  existing visual language

## The smallest slice that establishes product continuity

**Goal:** fix the one concretely-demonstrated defect (four independent,
non-syncing sign-in surfaces) and give the platform one canonical router,
without touching any workspace's internal behavior.

### Files affected

| File | Change |
|---|---|
| `app/src/domain/AuthContext.tsx` (new) | One `AuthProvider` + `useAuth()` hook. Holds exactly what the four existing local-`principal` implementations hold today (`principal`, `login`, `logout`, `error`, `busy`) — no new fields, no new server calls. Wraps the existing `apiLogin`/`apiLogout` from `app/src/domain/api.ts` verbatim |
| `app/src/main.tsx` | Replace the `window.location.pathname.endsWith("/rev-ops")` check with a router (`createBrowserRouter`/`RouterProvider` or equivalent) defining three top-level routes: `/` (Crisis Ops), `/assurance` (Operating Assurance), `/rev-ops` (RevOps, path preserved for existing bookmarks). Wrap the router in `<AuthProvider>` |
| `app/src/App.tsx` | Remove its own `principal`/`assertion`/`loginError` state and `handleLogin`/`handleLogout`; consume `useAuth()`. The `module` boolean toggle either becomes a nested route (`/assurance`) or stays as-is temporarily if `main.tsx`'s routing absorbs Operating Assurance directly — implementer's call, not a topology decision |
| `app/src/CrisisOpsApp.tsx` | Remove `apiPrincipal`/`apiAssertion`/`apiLoginError` state and `handleApiLogin`/`handleApiLogout`; consume `useAuth()`. No change to `workspace`, `roleId`, `selectedCaseId`, or any of the 18 workspaces' own rendering |
| `app/src/workspaces/RevOps.tsx` | Remove its own `principal` state and inline `apiLogin`/`apiLogout` calls; consume `useAuth()`. No change to tabs, forms, or RevOps-internal logic |
| `app/src/workspaces/OperatingAssurance.tsx` | Currently takes `principal` as a prop from `App.tsx` — only the *source* of that prop changes (from local state to `useAuth()`, threaded through `App.tsx`); the component's own internals are untouched |
| `app/src/workspaces/IopReconciliation.tsx` | Remove its own `principal`/`assertion`/`loginBusy`/`loginError` state and inline `apiLogin`/`apiLogout`/`signIn`/`signOut`; consume `useAuth()`. No change to import/review/close logic |
| `app/package.json` | Add one routing dependency (illustrative: `react-router-dom`) |
| `app/src/App.test.tsx`, `RevOps.test.tsx`, `IopReconciliation.test.tsx`, `OperatingAssurance.test.tsx` (if it exists) | Update to render through a shared test wrapper providing `AuthProvider` (and a router context if the library requires one for rendering), matching whatever pattern each file's existing `vi.mock("../domain/api", …)` already sets up |
| New: one integration-style app test | Proves the fix: sign in through one surface's form, assert every other surface's session-dependent UI reflects "signed in" without a second prompt |

### Dependencies

- A router library (React Router is the natural choice given this is already
  a Vite + React app with no router today; any equivalent would do — the
  choice itself is an implementation detail, not an architecture decision
  this document needs to lock in).
- No backend, schema, or `packages/*` dependency changes. This slice is
  confined to `app/src/**` and `app/package.json`.

### Risks

- **Test-mock churn.** Several existing test files independently mock
  `apiLogin`/`apiLogout`/`apiRevOps`/etc. per file
  (`vi.mock("../domain/api", () => ({...}))`, seen in `RevOps.test.tsx`,
  `IopReconciliation.test.tsx`). Introducing a shared context requires each
  of these to render through the same provider, which is mechanical but
  touches every test file that exercises a session-gated surface — plan for
  that touching more files than the production-code list above.
- **Reload-as-reset behavior loss.** `/rev-ops` today gets a full page
  reload, which incidentally resets all in-memory state on every visit.
  Moving to client-side routing means RevOps's internal component state
  persists across a navigate-away-and-back within the same page load unless
  explicitly reset on route entry/exit. Needs a deliberate check, not an
  assumption that React's unmount/remount on route change covers every case
  RevOps's own code relies on.
- **Bookmark compatibility.** `/rev-ops` must keep working as a directly-typed
  URL, not just as an in-app link — verify the router config serves it on a
  fresh load, not only via client-side navigation.
- **Scope creep.** The single highest risk to this slice staying "smallest"
  is the temptation to also make workspace/tab/case state URL-addressable in
  the same change, since the router makes that easy. Explicitly deferred —
  see the migration sequence below.

### Migration sequence

1. Add the router dependency and `AuthContext.tsx` as pure additions — zero
   behavior change, fully revertible in isolation.
2. Wrap `main.tsx` in the router with the three routes rendering the
   *existing, unmodified* `CrisisOpsApp`/`App`/`RevOps` trees. Verify `/`,
   `/assurance`, and `/rev-ops` all still render exactly as before. This step
   alone should be a no-behavior-change commit.
3. Migrate one sign-in surface at a time to `useAuth()`, in order of
   isolation risk (smallest blast radius first): IOP Reconciliation → RevOps
   → Operating Assurance → Crisis Ops sidebar. Each step is independently
   testable and independently revertible.
4. Add the cross-surface continuity test; confirm it passes only after all
   four are migrated.
5. Do not proceed to URL-addressable workspace/tab/case state in this same
   change — that is separately scoped future work per
   [CLARITY_NAVIGATION_ARCHITECTURE.md](CLARITY_NAVIGATION_ARCHITECTURE.md).

### Acceptance criteria

- [ ] Signing in through any one of the four current surfaces makes all four
      read "signed in" without re-prompting, verified live (the same manual
      test that demonstrated the defect, now passing) and by an automated
      test.
- [ ] `/rev-ops` continues to work as a directly-loaded URL (bookmark
      compatibility).
- [ ] Zero diff outside `app/src/**` and `app/package.json` — no backend,
      schema, or `packages/*` changes.
- [ ] Zero diff to any command/gateway/service package's authentication or
      tenant-derivation logic — this is a presentation-layer change only.
- [ ] Full validation gate passes: `npm run lint`, `npm run typecheck`,
      `npm run test:app`, root `npm test`, `npx prisma validate` (expected
      unaffected, included for completeness since it's the project's
      standing gate).
- [ ] No workspace, tab, or case selection becomes URL-addressable in this
      change (confirmed by diff review, not just by intent).

### Tests

- New: one cross-surface session-continuity test (the acceptance test above).
- Updated: every existing test file that currently mocks a per-surface
  `principal`/login flow, to render through the shared `AuthProvider`
  instead.
- Unchanged: everything else — no new coverage is owed for workspace-internal
  logic this slice does not touch.

### Rollback strategy

Pure frontend change, no migration, no schema change, no backend
coordination. Rollback is a standard `git revert` of the `app/src/**` and
`app/package.json` diff. No data cleanup is implied by either direction —
`bearerToken`'s storage mechanism and the server's session model are
unchanged throughout.

## Explicit stop

This document proposes; it does not implement. No file listed above has been
created or modified as part of producing this reconciliation series. Await
approval before starting the sequence in this document.
