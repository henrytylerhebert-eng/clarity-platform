---
status: analysis + architecture proposal — no code changed
depends_on: docs/ux/PRODUCT_TOPOLOGY_DECISION.md
---

# Session continuity

## Audit

### The mechanism (one, shared, correctly built)

`app/src/domain/api.ts`:

- `bearerToken` is a single **module-level** variable, not React state. It is
  set by `apiLogin(assertion)` (`POST /api/auth/login`) and cleared by
  `apiLogout()` (`POST /api/auth/logout`). Every `apiRevOps`, `apiIopReconciliation`,
  `apiAssurance*`, and core-API call reads this same variable via the shared
  `request()` helper's `token: true` option.
- Because it's module-level, it is **already shared across every React tree**
  in the same page load. A login performed anywhere is, at the network layer,
  a login everywhere — confirmed directly: after signing in via the Crisis
  Ops sidebar, a raw call to any `apiRevOps`/`apiIopReconciliation` endpoint
  would already succeed with that token.
- Server-side, `AuthenticationService.authenticate` derives `organizationId`,
  `userId`, and `roles` from the verified session on every request — never
  from a client-supplied field (enforced structurally: unknown body fields
  are a 400, per `packages/api-service/src/server.ts`'s own doc comment).

**The mechanism has no defect.** One token, one server-derived principal, one
audit trail. The problem is entirely in the four places that independently
*ask* for that token and independently *remember* whether they got one.

### The four presentation states (the actual defect)

| Surface | Owns | File |
|---|---|---|
| Crisis Ops sidebar | `apiPrincipal`, `apiAssertion`, `apiLoginError` | `CrisisOpsApp.tsx` |
| IOP Reconciliation | `principal`, `assertion`, `loginBusy`, `loginError` | `IopReconciliation.tsx` |
| Operating Assurance | `principal`, `assertion`, `loginError` | `App.tsx` (holds it, passes down as a prop) |
| RevOps | `principal` | `RevOps.tsx` |

Each calls the same `apiLogin`/`apiLogout`. None reads any of the others'
state. Each was built in a separate session, against a separate workspace,
with no shared context to reach for — which is *why* four exist, not because
any of them mis-modeled the network call.

### Why this happened (root cause, not blame)

There has never been a React tree that sits *above* all consumers of
`bearerToken`. `main.tsx` mounts either `<App/>` (which itself only covers
Crisis Ops + Operating Assurance) or `<RevOps/>` — never both under one parent.
Every workspace that needed a verified session had no ancestor component to
put that state on, so it went local. This is a direct, structural consequence
of the navigation fragmentation in
[CLARITY_NAVIGATION_ARCHITECTURE.md](CLARITY_NAVIGATION_ARCHITECTURE.md) — the
two problems share one fix.

## The four concepts the brief requires kept separate

These are genuinely different things today, and must stay different — the
fix for session continuity must not collapse them:

| Concept | What it is today | Where it lives | Should it change? |
|---|---|---|---|
| **Authentication** | A verified server session behind a bearer token; `userId`, `organizationId`, `roles` are all server-derived | `bearerToken` (module var) + one `VerifiedPrincipal` per login | **Yes — lift to one shared context** |
| **Role selection** | Crisis Ops's demo persona picker (`roles.ts`); explicitly not authentication, filters which of the 18 workspaces show | `roleId` client state in `CrisisOpsApp.tsx` | **No — leave as a Crisis-Ops-scoped demo affordance.** Do not let it start influencing real permission checks; do not merge it with the verified principal's real `roles[]` |
| **Workspace context** | Which of the 18 Crisis Ops workspaces, which RevOps tab, which Operating Assurance case-key are active | Scattered client state per tree | Migrates to URL params per [CLARITY_NAVIGATION_ARCHITECTURE.md](CLARITY_NAVIGATION_ARCHITECTURE.md), independently of the auth fix |
| **Tenant/facility context** | Does not exist as a user choice anywhere. `organizationId` is 1:1 with the authenticated principal, read-only, never selected | Not present in any component's state | **No change needed** — there is no multi-tenant-per-user case to solve for today; inventing a facility switcher now would be building for a requirement that doesn't exist |

## The smallest correct architecture

One `AuthProvider` (a React context), mounted once, above every tree that
currently needs `bearerToken`:

- Holds exactly what today's four copies hold: `principal: VerifiedPrincipal | null`,
  `login(assertion)`, `logout()`, `error`.
- Wraps `bearerToken` calls exactly as `api.ts` does today — **no change to
  the network layer, the token storage, or the server contract.** This is a
  presentation-layer consolidation, not an authentication change.
- Crisis Ops, IOP Reconciliation, Operating Assurance, and RevOps each stop
  owning their own `principal`/`assertion`/`error` state and instead consume
  the context. Their own sign-in *forms* can stay wherever it makes sense for
  each surface to render one (a case can be made that a global shell should
  own the one sign-in form entirely — see
  [CLARITY_GLOBAL_SHELL_SPEC.md](CLARITY_GLOBAL_SHELL_SPEC.md) — but that is a
  navigation decision, not a session-continuity requirement).

### What this explicitly does not do

- Does not change how `bearerToken` is stored (still module memory, still
  cleared on reload — that existing "no persistence" security posture is
  untouched).
- Does not change server-side session/expiry/revocation behavior.
- Does not merge the demo role selector into the real role system.
- Does not introduce a tenant/facility picker.
- Does not weaken tenant isolation in any way — every server-side
  `organizationId` derivation stays exactly as strict as it is today; this
  document only touches which React component *asks the user to sign in* and
  *remembers that they did*.

## Acceptance shape (for the eventual implementing slice, not started here)

A session established in any one of the four current surfaces should read as
established in all of them, verified the same way the defect was verified:
sign in once, navigate to each of the other three surfaces, confirm each
shows "signed in" without a second prompt.
