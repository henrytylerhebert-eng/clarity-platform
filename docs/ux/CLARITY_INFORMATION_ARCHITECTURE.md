---
status: design principles — no code changed
depends_on:
  - docs/ux/PRODUCT_TOPOLOGY_DECISION.md
  - docs/ux/CLARITY_GLOBAL_SHELL_SPEC.md
  - docs/ux/CLARITY_LANGUAGE_REGISTRY.md
---

# Information architecture

Per the brief, this document assumes topology and language are settled and
asks only: does the current app let a user answer these seven questions, and
where does it fail to?

## The seven questions, checked against the running app

| Question | Answered today? | Evidence |
|---|---|---|
| Where am I? | **Partially.** Crisis Ops answers it well (sidebar highlight + topbar label per workspace). Operating Assurance answers it (one screen, one topbar). RevOps answers it weakly — no persistent "you are in Revenue Operations, inside Clarity" framing once past the login screen; the hospital masthead dominates instead (see brand hierarchy in [CLARITY_GLOBAL_SHELL_SPEC.md](CLARITY_GLOBAL_SHELL_SPEC.md)) | Live audit |
| What am I working on? | **Yes, within Crisis Ops** — the "Selected case" banner threads through 15 of 18 workspaces. **No, across product areas** — nothing carries "case-004" from Crisis Ops into Operating Assurance; the assurance `caseKey` must be retyped | Live audit; `AssuranceCase.caseKey` is a plain string, not a shared selection |
| What state is it in? | **Yes, and well** — `StatusBadge` vocabulary (Synthetic only / Human review required / Review-gated) plus explicit workflow states (Draft, Routing, Accepted) are used consistently within each workspace | Live audit |
| What needs my attention? | **Weakly.** Case Queue's table surfaces per-case flags (missing flags, risk findings) but there is no cross-workspace or cross-product-area "here is what needs a decision from you today" view | Live audit; no task/alert concept exists anywhere (confirmed in [CLARITY_GLOBAL_SHELL_SPEC.md](CLARITY_GLOBAL_SHELL_SPEC.md)) |
| Why? | **Yes, where it matters most.** Rationale is structurally required at the points that matter — review decisions, case reopening, contract-rate corrections — matching the "why" answer to an actual accountability requirement rather than decorating every screen with it | Cross-referenced against `case-service`/`assurance-service` rationale-required rules |
| Who owns it? | **Partially.** Audit events record `actorId`/`actorType` on every mutation (`AuditEvent`, universal). Surfaced to the *user*, though, only in a few places (RevOps history, IOP reconciliation reviewer attribution) — not as a general "who's on this case" concept | Live audit + schema |
| What happens next? | **Yes, within one workspace's own flow** (e.g., Legal Status's OPC→PEC→CEC sequence explains the next statutory step inline). **No, across the platform** — nothing tells a Crisis Ops user that a case they're closing also has an open Operating Assurance evaluation, or vice versa | Live audit |

## Where the architecture should carry the weight, invisibly

Per the brief: "use the system architecture as an invisible organizing
mechanism," "do not expose unnecessary engineering architecture." Three
concrete applications of that rule, grounded in what's actually built:

1. **The audit trail already knows "who owns it."** Every mutation across
   every domain writes one `AuditEvent` row with `actorId`. The IA
   recommendation is not to build a new ownership model — it's to surface the
   one that already exists more consistently, without exposing the word
   "AuditEvent" or "actorType: USER" to a clinician.
2. **The command/gateway pattern already knows what's real vs. synthetic.**
   Every persisted domain (Crisis Ops's case commands, RevOps, IOP
   Reconciliation, Operating Assurance) goes through the same
   Zod-envelope → role-check → transaction discipline. The IA should signal
   "this workflow is backed by that discipline" through the existing
   `StatusBadge` vocabulary (see §7's maturity signaling below), never
   through implementation words like "Postgres," "Prisma," or "gateway."
3. **Bounded contexts should stay bounded in the IA, not just in the
   database.** Because RevOps and Crisis Ops are genuinely separate domains
   (topology §2), the IA should not force one unified "search everything" or
   "one timeline of everything" view across them — that would expose an
   engineering aspiration (a shared data model) the domain evidence doesn't
   support today.

## Implementation-maturity signaling (brief §7)

The app currently mixes three maturity levels with no visual distinction
between them: fully persisted (IOP Reconciliation, most of RevOps, Operating
Assurance), partially persisted (Legal Status's one "Decision rationale"
action inside an otherwise-local workspace), and entirely synthetic/local
(the remaining Crisis Ops workspaces). A reviewer cannot tell which is which
without reading source.

**The fix is not a healthcare-facing label.** The brief is explicit: never
tell a clinical user "this workspace is backed by PostgreSQL." The existing
`StatusBadge` vocabulary already contains the *right* words for the concepts
that actually matter to a clinical or operational user — "Synthetic only,"
"Human review required," "Review-gated" describe **data provenance and
workflow safety**, not database technology, and should stay exactly as they
are in any build a clinical audience sees.

Implementation maturity (persisted vs. local-only vs. integration-pending) is
a **developer/reviewer/demo-operator concern**, per the brief's own framing.
Recommendation: a separate, explicitly-labeled **developer/demo mode** —
gated behind a build flag or a keyboard shortcut, never on by default in
anything shown to a clinical audience — that overlays a small, technical
badge (e.g., a corner marker reading "persisted" / "local only" / "partial")
on top of the existing clinical `StatusBadge` vocabulary, not replacing it.
This keeps the two concerns — clinical governance vocabulary and technical
maturity vocabulary — visibly, structurally separate, per the brief's
explicit instruction not to confuse them.

## What this document does not do

- It does not design a task/alert/search system. The evidence audit above
  found no domain model mature enough to justify one yet; inventing the IA
  for a feature that doesn't exist would violate the same "do not expose
  what isn't available" discipline applied throughout this series.
- It does not specify the developer/demo-mode toggle's exact implementation
  (a query param, a keyboard shortcut, a build-time flag) — that is an
  implementation decision for §14's proposed slice, not an IA decision.
