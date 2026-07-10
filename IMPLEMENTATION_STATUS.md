# Implementation Status

**As of 2026-07-10** (post-integration). A capability appears in exactly one bucket. "Verified" means it ran in this session.

## Completed (verified working)

- `app/` crisis-path prototype: guided intake, drafts with prohibited-language guards, hash-chained custody ledger, compliance clocks (demo values), packet builder, simulated routing, bedboard, role-adaptive UX — unit tests 37/37, Playwright smoke 16/16, typecheck + production build pass. Frontend demo only (localStorage).
- Canonical foundation Prisma schema: `prisma format` / `validate` / `generate` passed; migration `20260710233252_initial_clarity_foundation` generated and applied to local PostgreSQL 18.4.
- 3 synthetic cases validated (JSON + Zod synthetic-only schema).
- Repository audit trail (`docs/repository-audit/`), canonical doc set, ADR-0001/0002.
- Root safety/workflow test baseline: 39/39 passing.

## Scaffolded (contracts exist; no runtime behind them)

- `packages/domain-contracts`: workstream + case state machines, append-only audit helper with restricted-identifier guard, benefits/eligibility/authorization contracts, payer-memory labeling, separate readiness dimensions, 6 dark feature flags, seed loader, org-scope repository interface.

## Documented only (no code)

- API/services, model gateway, retrieval/citations, agent contracts (catalog only — files missing from package), tenancy enforcement at persistence, packet approval workflow beyond demo, communications recording, analytics dashboards, evaluation suites beyond the baseline, expanded 43-model schema domains (WorkflowTask, ReferralPacket, etc.).

## Blocked

- **OD-1:** full master package v0.2.0 (72 of 87 files missing) — blocks re-verification of 12 summary-graded domains and the 7 missing synthetic cases.
- **OD-2:** counsel review of Louisiana statutory wording — blocks any legal-clock enforcement.
- **OD-3:** clinical criteria licensing — blocks necessity criteria mapping.

## Not started

- Backend services, authentication, RBAC/RLS, document storage, real evidence pipeline, any live agent, any external integration, CI, lint/format toolchain, Node version pin (OD-9).

## Requires clinical review

- Assessment content, guardrail vocabulary, bedboard compatibility heuristics, medical-necessity draft prompts.

## Requires legal review

- PEC/OPC/CEC instrument logic, compliance-clock configuration, custody/EMTALA language.

## Requires security review

- Everything in SECURITY.md "required controls"; any future integration or deployment.

## Requires developer decision

- OD-5 (API architecture), OD-6 (database hosting/RLS), OD-7 (pnpm/Turborepo timing), OD-8 (expanded-schema graduation), OD-9 (toolchain/CI).

## Next recommended action

**Issue: "Implement tenant-scoped case repository against the migrated schema."** Build a `CaseRepository` implementation (Prisma client, `clarity_dev`) satisfying `packages/domain-contracts/src/organizationScope.ts`, wire `AppendOnlyAuditLog` semantics to an `AuditEvent` table writer, and port the 39 baseline tests to run against the database (integration tier). This converts the validated schema + contracts into the first real platform capability without touching UI or agents.
