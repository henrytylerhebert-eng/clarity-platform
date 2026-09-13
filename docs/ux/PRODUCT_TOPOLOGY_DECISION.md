---
status: recommendation — awaiting owner ruling
supersedes: nothing (first topology ruling of its kind)
full_analysis: docs/ux/CLARITY_PRODUCT_TOPOLOGY.md
---

# Product topology decision

## Recommendation

**ONE PLATFORM, with several applications.**

Not "one product with bounded workspaces" — Crisis Ops (clinical case
placement) and RevOps (financial operations) do not share a user, a workflow,
or a domain vocabulary; flattening them into one workspace list would force
irrelevant navigation on both audiences.

Not a **product suite of intentionally separate applications** — Crisis Ops,
RevOps, and Operating Assurance already share one `Organization`/`User`/role
model, one authentication mechanism, one audit trail, and one deployable
backend process. A product suite's defining property is that its members
*don't* need to share those things; Clarity's already do, by construction, not
by accident.

## Why, in one pass per dimension

| Dimension | Points toward | Because |
|---|---|---|
| Workflow continuity | Several apps | Crisis Ops is one case-stage pipeline; RevOps never touches a case; Operating Assurance touches a case by a loose string key, not a shared picker |
| Role continuity | One platform | One `UserRole` enum, one `User` table, one org, shared by every service |
| Shared objects | One platform (identity) / several apps (domain) | `Organization`/`User`/`FacilityProfile`/`AuditEvent` are hard-shared; case/workflow aggregates are bounded per app |
| Shared authentication | One platform (mechanism) / broken today (presentation) | One `apiLogin`, four independent UI states — a bug, not evidence of separateness |
| Shared navigation needs | Several apps, poorly connected | No path at all between two of the three trees today |
| Domain boundaries | Several apps | Clinical/legal placement vs. financial operations vs. compliance governance are different bodies of logic with different regulatory referents |
| Security boundaries | One platform | None found between trees; boundaries are role-based, uniformly |
| Deployment boundaries | One platform | One Vite build, one Fastify process, one database |
| User mental models | Several apps, one shared role | Different day-to-day jobs; compliance/legal officers plausibly touch both Crisis Ops and Operating Assurance |
| Cross-domain workflows | Not yet built, but intended | Backend already carries a case↔assurance-case correspondence; no UI expresses it |
| Backend architecture | One platform | Modular monolith, conditional route registration per gateway, one tenancy root |

## What follows from this

1. **Session/identity is a platform concern.** One authentication context
   should span all three trees. See
   [CLARITY_SESSION_CONTINUITY.md](CLARITY_SESSION_CONTINUITY.md).
2. **Navigation is a platform concern.** One router, one shell, product areas
   as first-class navigation destinations rather than a link, a floating
   button, and a raw pathname check each doing it differently. See
   [CLARITY_NAVIGATION_ARCHITECTURE.md](CLARITY_NAVIGATION_ARCHITECTURE.md)
   and [CLARITY_GLOBAL_SHELL_SPEC.md](CLARITY_GLOBAL_SHELL_SPEC.md).
3. **Domain logic stays separate.** Crisis Ops's workspaces, RevOps's tabs,
   and Operating Assurance's review flow should not be merged, reordered, or
   cross-contaminated. This decision is about the container, not the
   contents.
4. **Prescreen and Episode/UR are a later, separate decision.** The backend
   already models them as peers of the three built applications, but neither
   has a frontend today. Whether they become a fourth and fifth application
   under this same shell — or stay backend-only for now — is explicitly out
   of scope for this reconciliation and belongs to the owner alongside the
   product's actual roadmap priorities.

## What this does not decide

- It does not decide RevOps's or Operating Assurance's internal navigation
  (tabs, forms, workflows) — those are unaffected.
- It does not decide whether Crisis Ops's 18-workspace flat list should be
  regrouped internally — that's an information-architecture question, not a
  topology one, and belongs in
  [CLARITY_INFORMATION_ARCHITECTURE.md](CLARITY_INFORMATION_ARCHITECTURE.md).
- It does not authorize any code change. See
  [CLARITY_UX_MIGRATION_PRECONDITIONS.md](CLARITY_UX_MIGRATION_PRECONDITIONS.md)
  for the smallest slice that would begin acting on this decision, proposed
  and explicitly not started.
