# Navigation and Role Map

**Status:** Proposed and unverified. Exact role keys, router conventions, feature-flag mechanism, and component locations must be checked in the live repository.

## 1. Product-shell decision

Clarity should expose two sibling product modules that share identity, scope, case/episode links, and the governed event spine:

```text
Clarity
├─ Access & Admission
│  ├─ Case Queue
│  ├─ Command Center
│  ├─ Intake / Evidence / Readiness
│  ├─ Packet / Routing / Acceptance / Transport / Custody
│  └─ Admission Handoff                 contextual transition
├─ Operations & Outcomes
│  ├─ My UR Work                        initial slice
│  ├─ Utilization Review                initial slice
│  ├─ Authorization Risk                initial slice
│  ├─ Episode Search                    initial slice, scope-gated
│  ├─ Documentation Gaps                initial slice
│  ├─ Audit & Corrections               initial slice, capability-gated
│  ├─ Hospital Operations               later
│  ├─ Workforce                         later
│  ├─ Finance                           later
│  ├─ Executive Intelligence            later
│  └─ Regulatory Reporting              disabled until governed
└─ Product & Learning
   ├─ Training / SOPs
   ├─ Mock Admit Lab
   └─ Product Studio                    remains read-only/synthetic
```

Do not add post-admission cards to the existing intake Command Center as a shortcut. A contextual `Record admission` action belongs on an accepted case; the post-admission workspaces live under the separate Operations & Outcomes shell.

## 2. Proposed route map

```text
/access/cases/:caseKey/admission-handoff

/operations
/operations/ur
/operations/ur/my-work
/operations/ur/queue
/operations/ur/episodes/:episodeId
/operations/ur/episodes/:episodeId/authorizations/:authorizationId
/operations/ur/documentation-gaps
/operations/authorization-risk
/operations/audit
/operations/audit/events/:eventId

/operations/hospital-operations       [later, feature-disabled]
/operations/workforce                 [later, feature-disabled]
/operations/finance                   [later, feature-disabled]
/operations/executive                 [later, feature-disabled]
/operations/regulatory                [disabled until governance]
```

URLs do not carry organization/facility authorization grants. Scope comes from the authenticated session and server-authorized selector options. Unknown or unauthorized resource IDs return the same non-revealing not-found behavior.

## 3. Capability-first navigation

The UI may use friendly role labels, but visibility and actions are computed from server-issued capabilities plus scope grants. Hiding an item is convenience, not security; every API route enforces the same capability and scope.

| Navigation item | Minimum capability | PHI level | Default users | Notes |
|---|---|---|---|---|
| Admission Handoff | `episode.admissionHandoff.create` | minimum-necessary PHI | admissions coordinator / authorized receiving actor | Contextual only; accepted case and destination scope required. |
| My UR Work | `ur.queue.read` | operational PHI | UR specialist | Defaults to current actor assignment. |
| Utilization Review queue | `ur.queue.read` | operational PHI | UR specialist/manager | Manager breadth is controlled by scope grants. |
| Episode UR detail | `episode.readOperational` plus UR read | operational PHI | UR/authorized clinician/HIM | Direct URL is denied without subject/scope access. |
| Documentation Gaps | `ur.gap.manage` or `ur.gap.respond` | operational PHI | UR, clinician reviewer, HIM, nursing | Actions differ by capability/state. |
| Authorization Risk | `analytics.authorizationRisk.read` | de-identified aggregate | UR manager, program director, executive | Episode drill-through requires a separate operational capability. |
| Audit & Corrections | `audit.provenance.read` | minimum necessary / restricted | auditor, UR manager, data-quality reviewer | Correction commands require separate capabilities. |
| Executive Intelligence | later aggregate capability | de-identified aggregate | approved executives | Not activated in initial slice. |
| Regulatory Reporting | approved prepare/release capabilities | governed export | reporting specialists/approvers | Hidden and route-disabled until governance decision. |
| System administration | platform admin capability | no routine PHI | system admin | No implicit episode or analytics access. |

The authoritative row-level matrix is `contracts/authorization-matrix.csv`.

## 4. Role-adaptive landing behavior

| Capability profile | Landing | First decision supported | Never implied |
|---|---|---|---|
| admissions handoff only | accepted-case handoff tasks | Is the accepted case ready for an authorized admission fact to be recorded? | admission appropriateness or placement selection |
| UR specialist | My UR Work | Which assigned review/gap needs human action next, and what source fact is missing? | payer decision |
| UR manager | full UR queue | Where is workload or authorization exposure accumulating, and who should own follow-up? | clinical necessity |
| documentation contributor | assigned documentation gaps | What evidence/attestation must I complete or dispute? | automatic note completion |
| program/facility leader aggregate only | Authorization Risk | Where are approved, denied, pending, expired, or at-risk days concentrated? | patient-level access |
| auditor | Audit & Corrections | What source, actor, correction, and projection produced this visible fact? | mutation rights |
| analytics steward | metric/quality governance later | Is a definition/data-quality state approved for publication? | source-fact editing |
| system administrator | admin area | Is platform configuration healthy? | blanket PHI browsing |

When a user has multiple profiles, prefer the last explicitly selected module if still authorized; otherwise use the highest-frequency operational workspace, not the broadest data scope.

## 5. Operations shell anatomy

### Persistent header

1. Clarity product switcher: `Access & Admission` / `Operations & Outcomes` / `Product & Learning`.
2. Workspace title and concise purpose.
3. authorized organization/facility/program/unit scope control;
4. timezone and selected period where relevant;
5. freshness/data-quality indicator;
6. current user menu and purpose-of-use indicator when configured.

### Left navigation

- Render only items for which the session has at least one usable scope grant.
- Show a count badge only when the count was returned by the matching scoped API and is not stale/suppressed.
- Do not reveal hidden item names through disabled links, autocomplete, or route suggestions for unauthorized users.
- Later modules may show `Not enabled` only to designated product/admin roles; ordinary users should not see speculative functionality.

### Scope selector

The selector receives server-authorized options and relationships:

```ts
// Proposed and unverified.
interface AuthorizedScopeOption {
  organizationId: string;
  organizationLabel: string;
  facilities: Array<{
    facilityId: string;
    facilityLabel: string;
    programs: Array<{
      programId: string;
      programLabel: string;
      units: Array<{ unitId: string; unitLabel: string }>;
    }>;
  }>;
}
```

Rules:

- no free-form organization ID;
- facility selection clears incompatible program/unit values;
- scope changes cancel in-flight queries and clear PHI detail drawers;
- scope is encoded in query parameters only using server-issued opaque/canonical IDs;
- API revalidates every scope;
- cross-organization is absent unless an explicit, approved cohort capability exists;
- selector labels are organization configuration, not a security decision.

## 6. Admission-to-episode transition UX

```text
Accepted case
  -> Record admission
  -> review acceptance provenance and destination
  -> enter/confirm admitted time and allowed references
  -> human attestation
  -> command accepted
  -> episode link returned
  -> Open episode UR detail
```

The handoff page remains inside Access & Admission to preserve case context. After success:

- show the new episode link only if `episode.readOperational` is granted;
- otherwise show a neutral success and return-to-case action;
- if the command committed but projection is pending, show `Admission recorded. Utilization-review views are still processing.`;
- an idempotent replay shows the original outcome and does not imply a second admission;
- an existing conflicting episode blocks a new handoff and directs the user to reviewed correction/reconciliation.

## 7. Breadcrumb and deep-link rules

Examples:

```text
Access & Admission / Case SYN-1001 / Admission Handoff
Operations & Outcomes / Utilization Review / Episode [minimum-necessary display]
Operations & Outcomes / Authorization Risk / Metric definition
Operations & Outcomes / Audit & Corrections / Event [short token]
```

- Breadcrumbs never expose patient names to aggregate-only roles.
- Episode links use a minimum-necessary display token configured for operational roles; browser history/title must avoid raw PHI where repository policy requires.
- Chart-to-queue drill-through carries only controlled filters and period/scope; the queue API independently authorizes and resolves rows.
- After an authorization loss, invalidate cached route data and return to the nearest authorized landing.

## 8. Route guard states

| State | UI behavior |
|---|---|
| session loading | shell skeleton; no previous tenant PHI rendered |
| authenticated, capability loading | neutral workspace skeleton |
| no module capability | non-revealing `This workspace is not available for your account.` and link to authorized home |
| scope grant missing | `You do not have access to this scope.`; no labels from the denied resource |
| resource absent or denied | shared not-found experience |
| feature disabled | route not registered for ordinary users; approved admin/product role receives `Not enabled` with decision reference |
| session expires | clear PHI cache/drawers, preserve only safe unsent form state according to policy, prompt re-authentication |
| capability changes mid-session | cancel requests, purge affected cache, announce access change, redirect |

## 9. Repository placement to verify

Suggested placement after Codex confirms existing patterns:

```text
app/src/navigation/operationsNavigation.ts
app/src/routes/operationsRoutes.tsx
app/src/layouts/OperationsOutcomesLayout.tsx
app/src/workspaces/AdmissionHandoff.tsx
app/src/workspaces/UtilizationReview.tsx
app/src/workspaces/AuthorizationRisk.tsx
app/src/workspaces/DocumentationGaps.tsx
app/src/workspaces/AuditCorrections.tsx
app/src/components/scope/AuthorizedScopeSelector.tsx
app/src/components/data-status/DataStatusBanner.tsx
app/src/policies/capabilityGuards.ts
```

Do not create these paths until repository preflight establishes the current router, navigation, authorization hooks, naming, and package boundaries.

## 10. Accessibility and responsive navigation

- desktop: persistent sidebar and scope header;
- tablet: collapsible sidebar; scope in a labelled popover/drawer;
- mobile: bottom/sheet module menu, single-column scope selection, no compressed desktop navigation;
- keyboard: skip link, logical tab order, current page with `aria-current`, focus moved to page heading after navigation;
- screen reader: scope change and stale/authorization state announced in a polite live region;
- status is never represented by color alone;
- route changes do not silently reset an in-progress human attestation.

## 11. Acceptance evidence

A navigation implementation is not complete until focused tests prove:

1. every route has a server capability and scope requirement;
2. an executive aggregate user cannot discover or open episode routes;
3. a system administrator cannot read episode PHI without a separate approved grant;
4. changing organization/facility clears cached PHI and prevents stale data flash;
5. direct URLs behave non-revealingly;
6. Admission Handoff is contextual and does not overload the intake Command Center;
7. Regulatory Reporting and cross-organization benchmarks remain disabled;
8. keyboard/mobile navigation exposes the same authorized actions;
9. the browser never writes to event or mart tables;
10. synthetic-only environments are visibly identified and never presented as measured outcomes.
