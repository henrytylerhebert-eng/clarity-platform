---
status: analysis + recommendation — no code changed
depends_on: docs/ux/PRODUCT_TOPOLOGY_DECISION.md (one platform, several applications)
---

# Navigation architecture

## Current state, audited directly from source

| Concern | Crisis Ops | Operating Assurance | RevOps |
|---|---|---|---|
| Entry point | `app/src/main.tsx` renders `<App/>` by default | `App.tsx` internal `useState<"crisis-ops" \| "operating-assurance">` | `main.tsx`: `window.location.pathname.endsWith("/rev-ops")` |
| React root | Shared with Operating Assurance (`App.tsx` owns both) | Shared with Crisis Ops | **Separate root**, mounted directly by `main.tsx`, bypassing `App.tsx` entirely |
| Workspace switching | Client state (`workspace` in `CrisisOpsApp.tsx`) | N/A (single screen) | Client state (`tab` in `RevOps.tsx`) |
| URL reflects state? | No — `workspace`, `roleId`, `selectedCaseId` are all unaddressable client state | No — no URL involvement at all | Partially — only the `/rev-ops` boundary itself; internal tab/period/hospital selection is unaddressable |
| Browser Back behavior | Back leaves the app (there was never a forward navigation) | Back leaves the app | Back leaves `/rev-ops` entirely (a real navigation happened) — inconsistent with Crisis Ops/Assurance, where Back never engaged in the first place |
| Refresh behavior | Resets to `workspace: "queue"`, `roleId: "all"` — case selection (`selectedCaseId`) also resets | Resets to `module: "crisis-ops"` — **Operating Assurance is unreachable by refresh**, only by re-clicking the button | Resets to `mode: "medicaid"` inside the Rates tab; RevOps itself stays if the pathname persists (it does, since it's a real navigation) |
| Deep linking | None. No workspace, case, or role is linkable. | None. Not addressable by any URL. | None to a specific tab/workspace/period; `/rev-ops` itself is the only linkable unit |
| Cross-tree navigation | → RevOps: sidebar text link, full reload. → Operating Assurance: floating button, no reload. | → Crisis Ops: back-arrow button, no reload. → RevOps: **no path** | → Crisis Ops: "Clarity" wordmark link, full reload. → Operating Assurance: **no path** |

Three different navigation *models* — client-state tab switching, a
component-level boolean toggle, and raw-pathname full-page routing — for what
§3's topology ruling establishes is one platform. None is inherently wrong in
isolation; the problem is that a developer or a user has no way to predict
which model applies to a given screen without already knowing the
implementation.

## Recommendation: one router, all three trees as top-level routes

Given the topology ruling (one platform, several applications, shared
identity/tenancy, no deployment boundary), the architecturally justified
routing model is a **single client-side router mounted once**, with Crisis
Ops, Operating Assurance, and RevOps as its top-level route branches, and each
application's existing internal state (workspace, tab, case, period) promoted
to nested, addressable path segments over time — not all at once.

### Why one router, not three separate apps kept as-is

- **No deployment or security boundary justifies separateness** (topology
  §"deployment boundaries," §"security boundaries"). Micro-frontends or
  separate deployables solve problems Clarity doesn't have; they would add
  build/deploy complexity for zero isolation benefit given one Fastify
  process already serves all three.
- **The "one session truth" requirement (§4 of the brief, and
  [CLARITY_SESSION_CONTINUITY.md](CLARITY_SESSION_CONTINUITY.md)) needs one
  React tree** to hold the auth context above all consumers. Three separately
  mounted trees each need their own copy of that context today, which is the
  direct cause of the four-sign-in-surfaces problem.
- **Deep linking and refresh-stability are basic product requirements** a
  reviewer, a support engineer, or a bookmarked "current case" link all need,
  and none of the three current models provide them.

### Why not full route parity on day one

A single router does not require flattening every internal tab into a route
immediately. `RevOps`'s period/hospital selection and `CrisisOpsApp`'s
`workspace`/`selectedCaseId` state can migrate to URL params incrementally,
workspace by workspace, without blocking the platform-level routing change.
Forcing full route parity in one pass is exactly the "migrate all workspaces"
scope this reconciliation is told not to do yet (brief §13).

### Concrete route shape (illustrative, not prescriptive)

```
/                              → Crisis Ops, default workspace
/crisis-ops/:workspaceId       → Crisis Ops, addressable workspace (future increment)
/crisis-ops/:workspaceId/:caseId
/assurance                     → Operating Assurance landing
/assurance/:caseKey            → a specific assurance case (future increment)
/rev-ops                       → RevOps landing (preserves the existing bookmark)
/rev-ops/:tab                  → addressable tab (future increment)
```

The `/rev-ops` path is deliberately preserved rather than renamed, so any
existing bookmark or shared link keeps working — a router migration is not
the moment to also rename URLs.

### What must not regress

- `IopReconciliation`'s and `RevOps`'s and `OperatingAssurance`'s own internal
  logic, forms, and validation are untouched by a routing change — only the
  *mounting* mechanism moves.
- The demo role selector (`roles.ts`) stays exactly as scoped today; it is
  orthogonal to routing and must not be reinterpreted as real authorization
  during this work.
- `RevOpsRateRelease`'s deliberate lack of tenant scoping (ADR-0021) is a data
  concern, not a routing concern, and is unaffected either way.

## What this document does not decide

- The exact router library/version (a decision for the implementing session,
  constrained only by "load a library, don't paste one," per this repo's
  existing conventions).
- Whether nested routes are added in the same change that introduces the
  router, or as follow-on, per-workspace work. §14's proposed slice
  recommends the latter.
