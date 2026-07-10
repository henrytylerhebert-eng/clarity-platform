# ADR-0002 — Canonical Data Model

- **Status:** Accepted
- **Date:** 2026-07-10
- **Owner:** _placeholder — tech lead_
- **Related:** `docs/repository-audit/05_SCHEMA_COMPARISON.md`, `05_SCHEMA_VALIDATION_RESULTS.md`, conflict C-3

## Context

Four schema artifacts competed: the Jul 8 crisis-generation Prisma schema (22 models, patient-identified, no payer stack), a reporting-only SQL blueprint, the Jul 10 **foundation** schema (25 models, 35 enums — byte-identical in the database artifact and the master package), and the Jul 10 **expanded target draft** (43 models, 56 enums). Neither Jul 10 schema had ever been CLI-validated (per the package's own QA report).

## Decision

1. The **foundation schema is canonical** at `prisma/schema.prisma`. It is the smallest schema satisfying the REQ matrix's early sprints, tokenizes patient identity (`PatientToken`), carries all eight parallel workstream statuses on `BehavioralHealthCase`, and covers the payer stack.
2. Validation performed this session: `prisma format` ✅, `prisma validate` ✅, `prisma generate` ✅, and initial migration `20260710233252_initial_clarity_foundation` applied to a local PostgreSQL 18.4 dev database. **No schema corrections were needed.**
3. The **expanded draft is the adoption target**, preserved immutably in the source package; also validates cleanly. Models graduate individually (WorkflowTask, ReferralPacket/PacketItem, CommunicationRecord first) with their own migrations and ADR amendments (OD-8).
4. The Jul 8 schema is **superseded** (historical, preserved). Crisis-wedge concepts it models that neither Jul 10 schema carries (Encounter, assessment detail, legal-instrument versioning, bedboard entities) must be re-introduced deliberately, not lost — tracked in OD-8.
5. PostgreSQL remains the target; SQLite substitution is not permitted without a documented tradeoff.

## Consequences

- Sprint-1 repositories/state machines build against a validated, migrated schema.
- Restricted identifier fields (member IDs, Medicare numbers) exist in the schema; masking/encryption is an unimplemented control tracked in the risk register (R-8) — schema presence is not protection.
- Divergence between contracts (`packages/domain-contracts`) and schema enums is a build-breaking condition once a backend exists; keep them aligned.
