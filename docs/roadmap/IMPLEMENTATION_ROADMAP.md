---
status: Integrated draft — reconciles C-2
owner: TBD
version: 1.2.0
last_integrated: 2026-07-10
last_scoped_reconciliation: 2026-09-12
source_artifacts:
  - MASTER_ARCHITECTURE.md §25, FIRST_25_GITHUB_ISSUES.md, REQUIREMENTS_TRACEABILITY sprint column (partial package)
  - docs/04-build-roadmap.md (crisis generation)
  - INTEGRATION_PLAN.md sprint mapping (database artifact)
  - docs/discovery/operating-assurance/README.md
unresolved_conflicts: "15-roadmap-and-sprints/ROADMAP.md missing from package"
related_requirements: all
related_adrs: ADR-0001, ADR-0002
---

# Implementation Roadmap

## Current RevOps authorization — 2026-09-09

Tyler accepted **Dunder Mifflin Hospital - Restored Operations 2026** and authorized
the MVP/interface update, full workbook parity, and real financial-rate
implementation. [Workbook acceptance](../product/RESTORED_WORKBOOK_ACCEPTANCE.md)
is complete; previous acceptance-first restrictions are superseded. Remaining
gaps describe undelivered work, not excluded MVP scope.

Follow the [workbook function map](../product/WORKBOOK_TO_PLATFORM_WORKFLOW_MAP.md)
for the dependency sequence: P0 accepted baseline/technical setup; P1 IP activity;
P2 IOP operations/review; P3 payer/rate and financial calculations; P4 role staffing
and costs; P5 invoices/collections; P6 forecasting/management reports; P7 controlled
source pilot. The [initial IOP build plan](WORKBOOK_BASELINE_IOP_REVIEW_BUILD_PLAN.md)
remains a useful first increment. P3 official-source/version/standalone calculation
work can run alongside it; financial integration follows the activity it needs.

The selected Louisiana hospital provider identifier is pending; that affects only
facility-specific rates requiring it. Verify official methods/effective dates and
required facility/contract inputs, with synthetic activity for tests. Owner scope
acceptance does not verify payment results, complete parity, or approve production
and real patient data. Current delivery evidence remains in
[implementation status](../../IMPLEMENTATION_STATUS.md).

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

## Earlier RevOps delivery sequence — retained as history

The inpatient Rev Ops patient-day slice merged in PR #49 with synthetic
[verification evidence](../testing/REV_OPS_PATIENT_DAY_VERIFICATION.md).
Tyler selected hospital onboarding and additional fields in both setup and data
entry; that slice merged in PR #50 after review and synthetic verification.
See its [brief](../product/INPATIENT_REV_OPS_ONBOARDING_FIELDS_BRIEF.md)
and [evidence](../testing/REV_OPS_ONBOARDING_FIELDS_VERIFICATION.md).
Census-upload reconciliation merged in PR #51 after scoped review and synthetic
verification. The subsequently approved bounded workflow is
[month-end readiness and accountable close](../product/INPATIENT_REV_OPS_MONTH_CLOSE_BRIEF.md).
It merged in PR #52 as `c9a00bd` after review; post-merge CI passed. See the
[evidence record](../testing/REV_OPS_MONTH_CLOSE_VERIFICATION.md).
The next authorized slice is [operational census receipt review and export](../product/INPATIENT_REV_OPS_EXPORT_BRIEF.md),
now implemented for local synthetic verification and pending review. Future receipts
snapshot the approved Daily Midnight Census Count definition; legacy definitions
remain unknown. Historical budgets remain selected as recorded. See [OD-15–17](../decisions/OPEN_DECISIONS.md)
for hospital/production decisions and the [evidence record](../testing/REV_OPS_EXPORT_VERIFICATION.md).
Merge, deployment and a real-hospital pilot remain separate decisions.
The [detailed execution plan](INPATIENT_REV_OPS_IMPLEMENTATION_PLAN.md)
remains grounded in the established workbook workflow. This lane does not change
the platform priority below or establish production readiness.

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
| Organization policy control record and index skeleton | 2026-07-29 | OD-14 has no accepted design; tenant partitioning, policy-as-reference boundary, privacy, and qualified review remain open | `docs/discovery/SHARED_DRIVE_OPERATING_PATTERN_AUDIT.md` SD-01 |
| Regulatory-change impact review packet | 2026-07-29 | The regulatory corpus can detect source changes, but applicability and policy impact remain human decisions | `docs/discovery/SHARED_DRIVE_OPERATING_PATTERN_AUDIT.md` SD-02 |
| Survey-readiness evidence matrix / tracer | 2026-07-29 | Useful evidence structure, but it must not make an automatic compliance determination | `docs/discovery/SHARED_DRIVE_OPERATING_PATTERN_AUDIT.md` SD-03 |
| Program assurance cycle (risk -> plan -> measure -> committee -> corrective action) | 2026-07-29 | Requires accepted metric definitions, operational ownership, and a corrective-action boundary | `docs/discovery/SHARED_DRIVE_OPERATING_PATTERN_AUDIT.md` SD-04 |
| SOP authoring, committee-action, and role-competency template kit | 2026-07-29 | Valuable for SME handoff and training, but source authority, approval, renewal, and evidence rules are not yet governed | `docs/discovery/SHARED_DRIVE_OPERATING_PATTERN_AUDIT.md` SD-05, SD-06, SD-08 |
| Compliance calendar and organization-onboarding readiness checklist | 2026-07-29 | Organization applicability, licensing interpretation, tenancy, and production onboarding are unresolved | `docs/discovery/SHARED_DRIVE_OPERATING_PATTERN_AUDIT.md` SD-07, SD-09 |
| Closeout and after-action review packet | 2026-07-29 | A useful corrective-action pattern, but client findings must remain excluded and closure needs governed evidence and review | `docs/discovery/SHARED_DRIVE_OPERATING_PATTERN_AUDIT.md` SD-10 |

The operating-assurance rows above recover the July 29 parking lot. They remain
parked; the [recovery index](../discovery/operating-assurance/README.md) records
historical definition-stage acceptance separately from unstarted requirements,
architecture, implementation, and pilot work. Product/repository home and
corpus-use decisions remain OD-26 and OD-27.
