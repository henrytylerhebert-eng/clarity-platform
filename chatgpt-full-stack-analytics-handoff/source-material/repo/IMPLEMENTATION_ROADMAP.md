---
status: Integrated draft — reconciles C-2
owner: TBD
version: 1.0.0
last_integrated: 2026-07-10
source_artifacts:
  - MASTER_ARCHITECTURE.md §25, FIRST_25_GITHUB_ISSUES.md, REQUIREMENTS_TRACEABILITY sprint column (partial package)
  - docs/04-build-roadmap.md (crisis generation)
  - INTEGRATION_PLAN.md sprint mapping (database artifact)
unresolved_conflicts: "15-roadmap-and-sprints/ROADMAP.md missing from package"
related_requirements: all
related_adrs: ADR-0001, ADR-0002
---

# Implementation Roadmap

## Where we actually are

- **Done (prototype):** Jul 8 roadmap v0.1 (intake spine) and v0.2 (command center, routing, role UX) are implemented in `app/` as a frontend demo.
- **Done (service foundations):** tenant-scoped case repository, command services for case/document/evidence/benefits/authorization, authentication service, Prisma-backed adapters, and one authenticated `node:http` API vertical slice.
- **Done (current review slice):** read-only synthetic Product Studio registry in the local app.
- **Not production-ready:** no confirmed production hosting, managed identity provider, production-wide RBAC/RLS, object storage, observability, external integrations, or controlled release evidence. No live product agent exists.

## Reconciled sequence (package 15-step sequence governs the platform build)

| Stage | Content | Status |
|---|---|---|
| 1. Foundation | Repo, CI, lint/format, env validation, synthetic-only banner | Repo/tests/lint/typecheck done; Node pin, formatter, env validation, and quality CI open |
| 2. Case spine | Tenant-scoped repositories, case + parallel-status state machine, workflow tasks, audit helper, fixtures | Repository + command service implemented; broader workflow tasks open |
| 3. Workflow | Tasks, deadlines, blockers, escalation | Documented |
| 4–6. Documents / Evidence / Case intelligence | Upload+checksum, classification, candidate evidence, review UI, contradictions, timeline | Document/evidence service foundations implemented; production storage/scanning and full UI open |
| 7. Clinical + legal | Necessity workbench, jurisdictional rule sets | Demo in app/; production open |
| 8–10. Insurance -> benefits -> authorization | Foundation-schema domains behind feature flags | Manual benefits and authorization-readiness service foundations implemented; external payer integrations open |
| 11. Packet + facility | Versioned approved packets, profile matching | Demo in app/ |
| 12. Custody + communication | Ledger (demo implemented), recorded channels | Partial demo |
| 13. Analytics | Reporting-metrics substrate (`reporting-metrics-rebuild-package/`) | Analysis done; build open |
| 14. Hardening | Security controls, evaluation suites | Open |
| 15. Controlled pilot | Requires clinical/legal/security sign-offs | Open |

## Next concrete issue

Reconcile ADR-0012 with the implemented `packages/api-service` spike and decide hosting/tenancy (OD-5/OD-6). Then implement one authorized read-only Product Studio server projection before any mutation or release-control surface.

## Intake-to-admission lane (added 2026-07-17)

The Clarity CIA integration bundle (`reference/source-packages/clarity_cia_integration_bundle_v1_0_0/`)
is the assessment-documentation blueprint for the intake-to-admission treatment-team workflow. The
canonical requirements statement — adaptable roles (intake ≠ nurse), physician acceptance with
per-facility NP delegation, sending-facility nursing report, per-facility lab standards and
exclusionary/inclusionary criteria, audio-assisted nurse documentation — lives in
`docs/workflows/INTAKE_TO_ADMISSION_WORKFLOW.md`. The facility configuration layer
(`FacilityAdmissionProfile`) follows the same configuration-not-truth pattern as the e-PEC
jurisdictional rule sets.

## Parking lot

Explicitly deprioritized by the product owner — do not schedule; revisit when priorities change.

| Item | Added | Why parked | Where specified |
|---|---|---|---|
| Facility policies/procedures/SOP ingestion pipeline (to auto-inform documentation configuration and the CIA runtime) | 2026-07-17 | Appropriate for the roadmap but not a high priority now, per product owner | `docs/workflows/INTAKE_TO_ADMISSION_WORKFLOW.md` R8 |
