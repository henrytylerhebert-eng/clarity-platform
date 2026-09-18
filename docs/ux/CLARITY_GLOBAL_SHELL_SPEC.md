---
status: specification proposal — no code changed
depends_on:
  - docs/ux/PRODUCT_TOPOLOGY_DECISION.md
  - docs/ux/CLARITY_NAVIGATION_ARCHITECTURE.md
  - docs/ux/CLARITY_SESSION_CONTINUITY.md
---

# Global Clarity shell

## Derivation, not prescription

The brief's example shell sketch (Home/Work, Crisis & Access, Episodes/UR,
Operating Assurance, Revenue Operations, Learning & Practice, Analytics,
Administration) is explicitly not a prescribed navigation. Checked against
what's actually built (per
[CLARITY_PRODUCT_TOPOLOGY.md](CLARITY_PRODUCT_TOPOLOGY.md) §1's
re-verification), three of those eight modules don't exist as navigable
surfaces today:

- **Episodes/UR** — Prisma models and pure derivation logic exist
  (`Episode`, `EpisodeAuthorization`, `AuthorizationReview`,
  `AuthorizationDayDecision`, `analytics.ts`); zero frontend component
  references any of it.
- **Analytics** — `analytics.ts` is Episode-day derivation logic, not a
  dashboard; no route, no screen.
- **Administration** — no admin screen exists anywhere in `app/src`. Org/user
  administration happens by direct database seed (`devMain.ts`) today, not
  through a UI.

Per the brief's own rule ("do not expose modules that are not actually
available"), the shell derived here reflects **what exists**, with the
not-yet-built modules named separately as a roadmap note rather than as nav
items.

## Derived structure

```
CLARITY
├── (product identity + session, always visible)
│
├── Crisis Ops                  — existing 18-workspace pipeline
│     (Case Queue, Command Center, New Case, Case Overview, Guided Intake,
│      Evidence Review, Medical Necessity, Legal Status, Benefits
│      Verification, Authorization Readiness, Packet Preview, Routing
│      Response, Milieu Bedboard, Custody Ledger, Training & SOPs,
│      Mock Admit Lab, Product Studio, IOP Reconciliation)
│
├── Operating Assurance         — existing one-case governed review workspace
│
└── Revenue Operations          — existing RevOps (Operations / Rates / Setup & access)

Not yet a navigable module (backend exists, no frontend — name only, do not
build a nav entry for these until a frontend is authorized):
  · Episodes / Utilization Review
  · Prescreen
```

Two of Crisis Ops's 18 workspaces are internal/demo tooling rather than case
work (Mock Admit Lab, Product Studio) and IOP Reconciliation is scoped to
`executive`-only in the demo persona model today — the shell should not
promote any of the three to platform-level peers of Crisis Ops, RevOps, and
Operating Assurance; they stay nested exactly where the domain evidence
already puts them.

"Learning & Practice" (the brief's own example) is real
(`learning-practice-service`, the `Training & SOPs` workspace's
`MyPathPanel`/`PracticeLabScenario`/`NoticeAcknowledgeCard` components) but
has no persistence layer and lives entirely inside Crisis Ops today. It stays
a Crisis Ops workspace in this shell rather than being promoted to a
top-level module — promoting it would be a scope decision about the
product's learning strategy, which this reconciliation does not have grounds
to make.

## What the shell must establish

| Requirement | Current state | Shell responsibility |
|---|---|---|
| Clarity product identity | Inconsistent — plain "Clarity" mark in Crisis Ops, no mark change in Operating Assurance beyond a subtitle swap, RevOps's own masthead outranks the Clarity mark entirely | One persistent identity element, present identically in every product area |
| Authenticated identity | Four independent panels (see [CLARITY_SESSION_CONTINUITY.md](CLARITY_SESSION_CONTINUITY.md)) | One sign-in surface, one "who am I" display, consumed everywhere |
| Tenant/facility context | Read-only `organizationId` display only, no selection needed (confirmed: no multi-tenant-per-user case exists) | Continue displaying it read-only; do not add a switcher that solves a nonexistent problem |
| Role context | Two unrelated things today: the real server-verified `roles[]`, and Crisis Ops's unauthenticated demo persona filter | Keep both, **visibly distinguished** — the shell should never let a reader mistake the demo persona picker for a security boundary |
| Global navigation | Three incompatible mechanisms (client tab state, boolean toggle, raw pathname) | One product-area switcher (Crisis Ops / Operating Assurance / Revenue Operations), using the router from [CLARITY_NAVIGATION_ARCHITECTURE.md](CLARITY_NAVIGATION_ARCHITECTURE.md) |
| Workspace navigation | Crisis Ops's own sidebar list; RevOps's own tab bar; Operating Assurance has none (single screen) | Each product area keeps its own internal workspace nav — the shell does not flatten these into one list |
| Search | Does not exist anywhere in the current app | Not proposed here — no evidence of a searchable object model uniform enough across all three areas to justify one global search box; flag as a later, separately-scoped question |
| Tasks/work | Does not exist as a concept. Closest analog is Crisis Ops's Case Queue (a table, not a task list) | Not proposed here for the same reason as search — inventing "Home/Work" as a landing concept before any task-object model exists would be designing ahead of the domain |
| Alerts | Does not exist as a concept | Not proposed here |
| Current-object context | Crisis Ops has it ("Selected case" banner, threaded via `activeCase`); RevOps and Operating Assurance each have their own, unrelated, current-object concept (selected workspace/hospital; the typed-in `caseKey`) | Preserve each area's own current-object banner; do not force one universal object model across three genuinely different domains |

## Preserve, explicitly (brief §11)

None of these need rebuilding. The shell's job is to make them reachable
through fewer front doors, not to replace them:

- **Tool-workspace banner pattern** (Mock Admit Lab / Product Studio / IOP
  Reconciliation's eyebrow-title-pill header, distinct from the case-scoped
  "Selected case" banner). Already a working, load-bearing distinction —
  extend it, don't touch it.
- **`StatusBadge`** and its existing vocabulary (`Synthetic only`,
  `Human review required`, `Review-gated`, `Verified API boundary`). Reused
  as-is; §7 below adds to this vocabulary rather than replacing it.
- **Case-scoped banners** in the 15 Crisis Ops workspaces that use them.
- **The dark, information-dense visual language** shared across all three
  trees today, confirmed still consistent at the CSS/component level even
  though the trees are separately mounted.

## Brand hierarchy (brief §8)

```
Clarity                              ← the platform, one persistent mark
  → Crisis Ops / Operating Assurance / Revenue Operations   ← product area
      → Organization (tenant)         ← e.g. a hospital system, read-only display
          → Facility                  ← e.g. a specific hospital/unit, where applicable
              → Workspace             ← the 18 Crisis Ops workspaces, RevOps tabs, etc.
                  → Current object    ← the selected case, the selected RevOps workspace, the assurance case
```

**RevOps specifically:** today, "DUNDER MIFFLIN HOSPITAL · RESTORED
OPERATIONS 2026" renders as the single most prominent line in the RevOps
header, above "RevOps MVP." Per the hierarchy above, the correct order of
prominence is Clarity (platform) → Revenue Operations (product area) →
Dunder Mifflin Hospital (organization/tenant, read from the authenticated
principal, not hardcoded) → the current workspace. The synthetic customer
name should never be the first or largest thing on the screen — it is tenant
context, not product identity, and today's implementation has those two
inverted.

## What this document does not do

- It does not specify pixel-level layout, color, or component code — that is
  implementation, not specification, and is out of scope per brief §13.
- It does not decide whether "Home/Work," search, tasks, or alerts should
  ever be built — it declines to invent them ahead of a domain model that
  would justify them, and says so rather than filling the brief's example
  structure in by default.
