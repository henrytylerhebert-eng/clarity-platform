# 18 — UX Enhancement Roadmap (prioritized)

**Audit date:** 2026-07-18. Implementation is **not authorized yet** — this is the plan the audit proposes, ordered by the framework's P0→P3 discipline. "Evidence" cites the verified finding; hazards reference `14-…-hazard-register.md`.

## P0 — Blocking (for any non-demo use)

| # | Finding | Evidence | Proposed change | Files (expected) |
|---|---|---|---|---|
| P0-1 | No enforcement in front of the UI; actor roles are trusted caller input; auth-service unconsumed | `ARCHITECTURE.md`; A-1 in role matrix | Build the API layer: HTTP boundary that authenticates via `AuthenticationService.authenticate()`, builds actors only via `actorFor()`, and exposes the existing services. This single step retires the largest standing assumption and connects the two halves. | new `packages/api` (or `app/server`), no service changes needed |
| P0-2 | Single-click legal-instrument execution, no review-and-confirm, no signer identity (H-2) | `LegalStatus.tsx` | Add review-and-confirm step summarizing all entered data + applicable deadlines before signature; keep e-sign blocked pending LDH/counsel (already policy) | `app/src/workspaces/LegalStatus.tsx` |

## P1 — High impact

| # | Finding | Proposed change |
|---|---|---|
| P1-1 | Pages workflow publishes all of `docs/` publicly; stale `feat/authentication` trigger (H-8) | Narrow artifact path to an explicit public dir; drop deleted-branch trigger. **Do before next push to `main`.** |
| P1-2 | No app↔backend role mapping (matrix finding) | Add `RoleId → UserRole[]` mapping in `app/src/domain/roles.ts` (or domain-contracts) as the contract for the API phase |
| P1-3 | Legal-status domain lacks a role-gated service wrapper (A-2) | Add `legal-hold-service` (or fold into case-service) with a role policy mirroring `WORKSTREAM_ROLE_POLICY.legalReview` |
| P1-4 | Read paths un-gated beyond documents (A-3) | Design view-permission model (role + relationship + category) before API exposure; encode SUD/psychotherapy-note categories as restricted classes |
| P1-5 | Wrong-patient cues absent (H-1) | Second identifier in case header + switcher; identity-verification state chip |
| P1-6 | Arrival time uncaptured → OPC exam clocks are static reference (H-5) | `arrivedAt` capture + live dual 8h/12h countdowns via existing `evaluateClock` |
| P1-7 | Audit chain integrity (H-6) | Hash-chain `AuditEvent` per organization (pattern exists in `hashLedger.ts`) |
| P1-8 | Capacity freshness absent (H-7) | `lastVerifiedAt` + stale badge on bedboard units/beds |
| P1-9 | Demo personas can execute actions their backend counterpart cannot (A-5, H-4) | Persona-gate legal/benefits actions in the app to mirror backend policy (display parity) |
| P1-10 | Accessibility never evaluated; zero a11y tooling | Add axe-core to vitest + CI; run first manual keyboard/screen-reader pass on Legal Status and case switcher (the two riskiest flows) |

## P2 — Important

- Confirmation on "Reset demo data" (H-3).
- Rule-parity test between `app/src/domain/epecRuleSets.ts` and `packages/legal-hold-forms` (H-10).
- Auth hardening backlog: rate limiting, session rotation, idle timeout, OIDC adapter (A-6) — pre-production gate list.
- Permission-denied / restricted-view states in app (0 exist today) with the framework's approved explanation copy.
- Empty/loading/stale state consistency pass across workspaces.
- Notification design carries `metricsSafePayload` discipline (H-9).
- CI: add typecheck/lint/test workflow (none exists — only Pages deploy).

## P3 — Enhancement

- `telemedicine` field rename (H-12); mobile field-responder layout; visual polish; motion.

## Explicitly deferred / blocked

- Any statutory-clock *enforcement* — blocked by OD-2 (counsel) and the binding non-enforcement rule.
- E-signature execution — blocked pending written LDH/coroners'/sheriffs' confirmation (verification memo §5/§6.3).
- Cross-organization professional/patient tracking — blocked pending a data-governance decision (raised 2026-07-17, unanswered).
