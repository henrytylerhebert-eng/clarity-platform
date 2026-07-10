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
- **Done (this integration):** repository organization, canonical schema selected and validated (see ADR-0002 and validation results), synthetic fixtures, domain-contracts scaffold, safety-test baseline.
- **Nothing else is built.** No backend, API, auth, tenancy, persistence, or agents.

## Reconciled sequence (package 15-step sequence governs the platform build)

| Stage | Content | Status |
|---|---|---|
| 1. Foundation | Repo, CI, lint/format, env validation, synthetic-only banner | Partially done (repo, tests); CI/lint open |
| 2. Case spine | Tenant-scoped repositories, case + parallel-status state machine, workflow tasks, audit helper, fixtures | Contracts scaffolded; persistence open |
| 3. Workflow | Tasks, deadlines, blockers, escalation | Documented |
| 4–6. Documents / Evidence / Case intelligence | Upload+checksum, classification, candidate evidence, review UI, contradictions, timeline | Documented (demo analogs in app/) |
| 7. Clinical + legal | Necessity workbench, jurisdictional rule sets | Demo in app/; production open |
| 8–10. Insurance → benefits → authorization | Foundation-schema domains behind feature flags | Schema + contracts only |
| 11. Packet + facility | Versioned approved packets, profile matching | Demo in app/ |
| 12. Custody + communication | Ledger (demo implemented), recorded channels | Partial demo |
| 13. Analytics | Reporting-metrics substrate (`reporting-metrics-rebuild-package/`) | Analysis done; build open |
| 14. Hardening | Security controls, evaluation suites | Open |
| 15. Controlled pilot | Requires clinical/legal/security sign-offs | Open |

## Next concrete issue

See `IMPLEMENTATION_STATUS.md` → "Next recommended action". FIRST_25_GITHUB_ISSUES.md (preserved in the package copy) is the backlog seed; issues 1–5 are effectively complete after this session.
