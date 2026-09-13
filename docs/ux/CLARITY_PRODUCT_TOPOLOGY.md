---
status: analysis — informs the UX foundation reconciliation; not yet an accepted ADR
depends_on: none (this is the anchor document for the reconciliation series)
informs:
  - docs/ux/PRODUCT_TOPOLOGY_DECISION.md
  - docs/ux/CLARITY_NAVIGATION_ARCHITECTURE.md
  - docs/ux/CLARITY_SESSION_CONTINUITY.md
  - docs/ux/CLARITY_GLOBAL_SHELL_SPEC.md
  - docs/ux/CLARITY_INFORMATION_ARCHITECTURE.md
verified_against: main @ 4002fc8, both dev servers running (npm run dev + npm run api:dev)
---

# Clarity product topology

## 0. Method and re-verification

The brief this document answers explicitly warns not to trust the prior session's
live-audit baseline without re-checking it against the repository. It was
re-checked, this session, by:

- Reading `app/src/main.tsx`, `app/src/App.tsx`, `app/src/CrisisOpsApp.tsx`,
  `app/src/domain/roles.ts`, `app/src/domain/api.ts`,
  `app/src/workspaces/OperatingAssurance.tsx`, `app/src/workspaces/RevOps.tsx`
  directly, line by line, rather than from memory of the earlier browser pass.
- Enumerating every Prisma model in `prisma/schema.prisma` and
  `prisma/assurance.prisma` (59 models) and every `domain-contracts` module (35
  files) and checking which ones actually have a frontend consumer, with
  `grep`, not assumption. Three material corrections came out of this:
  - **Prescreen has a fully built command service and API (`packages/prescreen-service`,
    7 HTTP routes) and zero frontend.** No component in `app/src` references it.
    It is a real backend capability with no UI today — it must not appear as a
    navigable surface in any shell/IA recommendation.
  - **Network enrichment is contract-only** (`networkEnrichment*.ts` in
    domain-contracts) — no runtime package, no route, no frontend. Same
    treatment: not a navigable surface.
  - **"Analytics" is not a product area today.** `domain-contracts/analytics.ts`
    is Episode-day derivation logic (coverage/risk/data-quality/eligibility
    state machines) and a governed-event envelope — pure functions with no
    route and no screen. Any shell design that lists "Analytics" as a nav
    item because the domain-contracts filename suggests it would violate the
    brief's own "do not expose modules that are not actually available" rule.
- Confirming `AssuranceCase.caseKey` is a **plain string field**, not a foreign
  key to `BehavioralHealthCase.id` (`prisma/assurance.prisma:82-102`) — the
  cross-reference between Operating Assurance and a Crisis Ops case is a
  shared-identifier convention, not a database-enforced relation. This matters
  for §6 below.
- Confirming there is **no facility/tenant selector anywhere in the frontend**.
  `organizationId` is never chosen by a user; it is derived server-side from
  the authenticated principal and only ever displayed read-only
  (`CrisisOpsApp.tsx:601`, the sidebar's `<dt>Organization</dt>`).

## 1. What actually exists (re-verified topology)

Three independently-mounted React trees, one repository, one backend:

| Tree | Entry mechanism | File | Session state |
|---|---|---|---|
| Crisis Ops | Default route (`/`) | `app/src/CrisisOpsApp.tsx`, mounted by `app/src/App.tsx` | `apiPrincipal` in `App`'s parent, `CrisisOpsApp` component state; own login panel in the sidebar |
| Operating Assurance | Client-state toggle inside `App.tsx` (`module === "operating-assurance"`), a floating button, no URL change | `app/src/workspaces/OperatingAssurance.tsx` | Separate `principal` state owned by `App.tsx` itself |
| RevOps | `window.location.pathname.endsWith("/rev-ops")` in `app/src/main.tsx` — a full page load, not a route | `app/src/workspaces/RevOps.tsx` | Separate `principal` state owned by `RevOps` |

A fourth, narrower case: **IOP Reconciliation**, one of the 18 workspaces inside
the Crisis Ops tree, keeps its *own* `principal` state
(`app/src/workspaces/IopReconciliation.tsx`) rather than using Crisis Ops's
shared session panel — so signing in at the Crisis Ops sidebar does not
authenticate IOP Reconciliation, even though both call the same `apiLogin` and
share the same module-scoped `bearerToken` in `app/src/domain/api.ts`. Verified
live this session's predecessor: sign in via the sidebar, the sidebar panel
flips to "Sign out," IOP Reconciliation still reads "Sign in."

## 2. The evidence, organized by the required dimensions

### Workflow continuity

Crisis Ops's 18 workspaces are stages of one pipeline (`intake → evidence →
medical → legal → benefits → authorization → packet → routing`), reinforced by
the shared "Selected case" banner that most of them render
(`CrisisOpsApp.tsx`'s `activeCase` prop threading). A user moving between
these workspaces is visibly working the same case forward.

RevOps's workflow (hospital/unit setup → budget → actuals → reconciliation →
close → payment scenarios) does not touch a `BehavioralHealthCase` at any
point — it is patient-day/financial-operations continuity, not case
continuity. Operating Assurance's workflow (bind applicability → submit
evidence → evaluate → qualified review) *does* operate against a specific
case, addressed by `caseKey`, but that case identity is asserted by the
frontend caller, not looked up from a shared case list.

**Reading:** one workflow continuum (Crisis Ops) plus two workflows that
either don't touch the case object (RevOps) or touch it by convention rather
than by a shared picker (Operating Assurance).

### Role continuity

`UserRole` (`prisma/schema.prisma`) is one enum shared by every service:
`ORGANIZATION_ADMIN`, `PHYSICIAN_REVIEWER`, `COMPLIANCE_REVIEWER`,
`UTILIZATION_REVIEWER`, `INTAKE_COORDINATOR`, etc. RevOps's dev users,
Operating Assurance's dev users, and the core API's dev users are all rows in
the same `User` table under the same `organizationId`
(`packages/api-service/src/devMain.ts`'s `DEV_USERS` array + `ASSURANCE_DEV_USERS`).
ADR-0014 (prescreen role mapping) explicitly reasons about this shared role
set. There is no evidence of a second, independent role system anywhere.

Crisis Ops's demo role selector (`roles.ts`, 9 personas: field responder,
central intake, clinician, UR/benefits, receiving facility, charge nurse,
compliance, executive) is explicitly **not** this role system — it's an
unauthenticated display filter, documented as such in the UI copy itself
("Demo role scoping only — not authentication"). It scopes *only* Crisis Ops's
own 18 workspaces; note that `iop-reconciliation` and `studio` are visible
only to `all` and `executive` in that scoping, and no persona sees RevOps or
Operating Assurance at all — those two are reached by a different mechanism
entirely (a sidebar link, a floating button), invisible to the persona model.

**Reading:** one real (server-verified) role system underneath; one
Crisis-Ops-only demo persona layer on top that doesn't know the other two
trees exist.

### Shared objects

| Object | Shared how | Evidence |
|---|---|---|
| `Organization` | Hard FK, universal | Every tenant-scoped table carries `organizationId`; one row per tenant across all three trees |
| `User` / role | Hard FK, universal | One `User` table, one `UserRole` enum, `packages/api-service/src/devMain.ts` |
| `FacilityProfile` | Hard FK, cross-domain | Referenced by `RevOpsWorkspace`, `IopReconciliationImport`, `Episode`-adjacent tables, and Crisis Ops's referral/routing logic |
| `BehavioralHealthCase` | **Soft** reference from Operating Assurance | `AssuranceCase.caseKey` is a plain string, not an FK (`prisma/assurance.prisma:82`) — same identifier value by convention, not a join |
| `AuditEvent` | Hard FK, universal | Every command service writes through `PrismaCaseAuditWriter`; one audit trail regardless of which tree the actor was in |
| `Document` / `EvidenceItem` | Case-scoped, Crisis-Ops-only today | No RevOps/Operating-Assurance/IOP reference to these |
| Rate/release registry (`RevOpsRateRelease`) | Deliberately **not** tenant-scoped (ADR-0021) | Public reference data, visible across every organization |

**Reading:** identity, tenancy, role, and audit are unified at the platform
level. Domain aggregates (the actual case/workflow objects) are bounded per
application, cross-referenced by shared identifier where they touch at all,
not merged into one graph.

### Shared authentication

One mechanism (`POST /api/auth/login` → `AuthenticationService.authenticate`),
four independent presentation states (§1). This is a presentation-layer
fragmentation, not a backend one — see
[CLARITY_SESSION_CONTINUITY.md](CLARITY_SESSION_CONTINUITY.md).

### Shared navigation needs

A reviewer walking "the full closed-loop journey" (Crisis Ops's own "all
workspaces" demo-role description) currently cannot reach Operating Assurance
from RevOps or vice versa without knowing a URL or a floating button exists.
Crisis Ops ↔ RevOps has a link each way; Crisis Ops ↔ Operating Assurance has
a toggle each way; Operating Assurance ↔ RevOps has nothing. See
[CLARITY_NAVIGATION_ARCHITECTURE.md](CLARITY_NAVIGATION_ARCHITECTURE.md).

### Domain boundaries

Genuinely distinct: crisis case placement (clinical/legal), revenue
operations (financial), operating assurance (compliance/evidence-governance),
and — not yet built — prescreen and episode/UR. These are different bodies of
domain logic with different regulatory referents (EMTALA/state commitment law
for Crisis Ops; CMS coverage/payment rules for RevOps; internal
policy-governance for Operating Assurance).

### Security boundaries

None found between the trees at the tenant level — same `organizationId`,
same session mechanism, same audit trail. The only security boundary that
exists is role-based (who may call which command), which is uniform across
trees.

### Deployment boundaries

None. One `app/` Vite build, one `api-service` Fastify process
(`packages/api-service/src/server.ts` registers routes from every domain
conditionally on which gateways are passed in). There is no evidence anywhere
in the build tooling, `package.json` scripts, or CI configuration of separate
deployable units per tree.

### User mental models

A Crisis Ops user (intake coordinator, clinician, compliance officer) has no
occasion to open RevOps — different persona, different job. A RevOps user
(finance/ops) has no occasion to open Legal Status. But **Operating Assurance
and Crisis Ops share a user**: a compliance/legal officer role exists in both
the Crisis Ops persona list *and* is the natural audience for Operating
Assurance's qualified-reviewer gate. The mental-model boundary tracks role and
job function, not "which React tree renders it" — which is exactly the kind
of internal architecture detail the brief says must stay invisible.

### Cross-domain workflows

Currently zero *enforced* cross-domain workflows (no command in one service
calls into another). One *intended* cross-domain relationship exists today
only as a shared string key: an Operating Assurance case is meant to
correspond to a Crisis Ops case. The dev fixture makes this concrete —
`devMain.ts`'s `CASE_KEY` (`SYN-API-CASE-0001`) is reused as
`assuranceDevFixture.caseKey`. There is no UI path from a Crisis Ops case
screen to its Operating Assurance status, or back.

### Backend architecture

Fastify (`packages/api-service`), one process, conditional route
registration per gateway (`server.ts`'s `if (deps.iopReconciliation) …`
pattern). One Prisma client, one PostgreSQL database, one `Organization`
table as the tenancy root. This is a **modular monolith serving one tenancy
model**, not a set of independently deployable services.

## 3. Answering the primary question

Given the evidence above, none of the three offered labels fits cleanly
without qualification — the honest answer names which two axes disagree:

- On **identity, tenancy, role, audit, and deployment**, Clarity is
  unambiguously **one platform**: one `Organization`, one `User`/role model,
  one session mechanism, one audit trail, one deployable backend.
- On **workflow, domain logic, and user mental model**, Clarity is **several
  applications**: Crisis Ops (case placement), RevOps (revenue operations),
  Operating Assurance (compliance governance) — plus two not-yet-surfaced
  domains (Prescreen, Episode/UR) that the backend already anticipates as
  peers, not sub-features, of the three that exist.

That combination is the textbook definition of **ONE PLATFORM with several
applications** — not "one product with bounded workspaces" (too monolithic; a
RevOps financial-operations user and a Crisis Ops intake coordinator are not
plausibly the same workflow with different screens) and not a **product
suite of intentionally separate applications** (too fragmented; a product
suite does not usually share one `Organization`/`User`/role/audit model and a
single deployable backend the way these three do — that architecture already
assumes eventual convergence, it just hasn't been given a shell yet).

The full reasoning and direct recommendation are in
[PRODUCT_TOPOLOGY_DECISION.md](PRODUCT_TOPOLOGY_DECISION.md).

## 4. What this rules in and out for the rest of the series

- **Ruled in:** one canonical router spanning all three trees (they already
  share identity/tenancy — routing should stop pretending otherwise); one
  session/auth context; one global shell with product-area navigation.
- **Ruled out:** merging Crisis Ops, RevOps, and Operating Assurance into one
  flat workspace list (their domain logic and personas are too distinct); a
  full micro-frontend split into independently deployable apps (nothing in
  the evidence justifies that cost — the backend is already one deployable
  unit and there's no security or deployment boundary requiring separation).
- **Left open, explicitly, for an owner decision:** whether Prescreen and
  Episode/UR get frontend surfaces at all in the near term, and if so, whether
  they join this shell as first-class product areas or nest under Crisis Ops.
  This document only establishes that the backend already treats them as
  peer bounded contexts, not that they should be built next.
