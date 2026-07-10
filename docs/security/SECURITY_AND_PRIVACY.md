---
status: Integrated draft — controls are requirements, not implemented claims
owner: TBD (requires security review)
version: 0.9.0
last_integrated: 2026-07-10
source_artifacts:
  - MASTER_ARCHITECTURE.md §22 (partial package)
  - reference/source-packages/clarity-mh-architecture/docs/compliance/rbac-audit-custody.md
  - reference/source-packages/clarity-mh-architecture/database/supabase-rls.sql (historical)
unresolved_conflicts: "10-security-and-governance/ missing from package; RLS starter misaligned with canonical schema (C-4.2)"
related_requirements: REQ matrix security rows
related_adrs: ADR-0001, ADR-0002
---

# Security and Privacy

> **Honesty note:** nothing below is implemented. The prototype has no authentication, no backend, and no persistence beyond localStorage. Describing controls is not compliance; HIPAA readiness requires implementation, review, and testing.

## Required controls (target)

Authentication + MFA; least privilege; tenant isolation (organization-scoped queries enforced at the repository layer); per-case permissions; encryption in transit and at rest; secrets management; object-store controls; field masking for restricted identifiers; append-only audit; backup/restore; model-provider governance; prompt-injection defense; incident response.

## Data rules (enforced now, in contracts and tests)

- **No real PHI/PII anywhere** — synthetic data only, until formal security/privacy review (`data/synthetic-cases/README.md`).
- Member IDs, Medicare identifiers, policy numbers, credentials: **restricted fields, never logged, never in audit payloads** (test: `tests/security/no-sensitive-identifiers-in-audit.test.ts`).
- Patient identity is tokenized (`PatientToken`) in the schema; display names in demos are synthetic.
- No live EHR, payer portal, clearinghouse, email, fax, database, or cloud connection may be added without security review.

## Historical note

The Jul 8 `supabase-rls.sql` starter is preserved but **superseded**: its ID strategy, tenant scoping, and table names do not align with the canonical schema (finding carried from `docs/06-architecture-review.md`). Row-level-security concepts must be re-derived for `prisma/schema.prisma` when a database exists.
