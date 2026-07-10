# Codex Master Prompt — Clarity MH / Blue Partner Build

You are working in Codex on **Clarity MH**, a Louisiana-first behavioral health crisis intake, medical-necessity, digital emergency certificate, referral-routing, and treatment-continuity platform.

Treat this architecture package as the current product source of truth. Your first job is to inspect the repository, not to immediately code.

## Product definition

Clarity MH is not a generic second-brain app.

Clarity MH is a clinical workflow platform that supports:

1. Guided crisis intake from the first call, field contact, ED referral, hospital inquiry, 988 handoff, mobile-crisis interaction, or law-enforcement encounter.
2. Structured psychiatric screening across adult, geriatric, adolescent, and child populations.
3. Medical-necessity documentation for level-of-care review.
4. Louisiana legal-status workflows for voluntary, OPC, PEC, and CEC pathways.
5. Hash-chained custody for legal instruments, source records, media references, transmission events, and acceptance receipts.
6. Request-broadcast routing to receiving facilities, crisis programs, or lower levels of care.
7. Treatment-team continuity after admission through collateral follow-up, care actions, concurrent review, discharge planning, and step-down routing.
8. AI/MCP support that summarizes and flags missing facts but never replaces licensed clinical judgment.

The product thesis is:

> One guided capture at the moment of crisis produces four reviewed outputs: clinical assessment, medical-necessity narrative, legal instrument, and referral packet.

## Core wedge

Do **not** start by building a generic bed registry.

Do **not** start by building a proprietary criteria engine.

Do **not** start by building an AI chatbot.

Start with the data spine and workflow spine:

Referral / call / field contact  
→ intake case  
→ structured assessment  
→ source-grounded risk and functional facts  
→ medical-necessity snapshot draft  
→ legal instrument draft/sign/seal when applicable  
→ referral packet  
→ secure transmission  
→ facility accept/decline/more-info response  
→ custody/audit ledger

## Architecture docs to read first

Read these files in order before making changes:

1. `README.md`
2. `docs/product/00-product-thesis.md`
3. `docs/product/01-module-architecture.md`
4. `docs/product/03-mvp-scope.md`
5. `docs/workflows/clinical-intake-workflow.md`
6. `docs/workflows/epec-chain-of-custody-workflow.md`
7. `docs/workflows/request-broadcast-routing.md`
8. `docs/compliance/clinical-safety-guardrails.md`
9. `docs/compliance/emtala-parallel-financial-lane.md`
10. `docs/compliance/rbac-audit-custody.md`
11. `schema/prisma.schema.prisma`
12. `types/clarity-mh.types.ts`
13. `implementation/epics-and-issues.md`
14. `implementation/acceptance-tests.md`

## Before coding: repo inspection report

Inspect the existing repo and respond with:

1. Framework and package manager.
2. Existing route structure.
3. Existing data layer / ORM / database approach.
4. Existing auth approach.
5. Existing API/server approach.
6. Existing tests and test commands.
7. Existing environment variables and config files.
8. Whether `clarity-epec.jsx` or any prototype code is already present.
9. Gaps between the repo and this architecture package.
10. Smallest safe implementation plan for the current repo.

Do not rewrite the app from scratch unless the repo is empty or unrecoverable.

## Non-negotiable clinical and legal safety rules

The system must not:

- Diagnose independently.
- Decide level of care independently.
- Certify medical necessity independently.
- Say “patient meets InterQual criteria,” “patient meets MCG criteria,” “patient meets ASAM criteria,” or “patient meets LOCUS criteria” unless licensed criteria are formally integrated and counsel-approved.
- Block emergency clinical screening because insurance is missing.
- Gate EMTALA-relevant screening behind benefit verification.
- Generate final signed notes without licensed clinician review.
- Store real PHI in demo or test data.
- Use proprietary criteria text, thresholds, or scoring logic without explicit license.
- Infer missing facts.
- Treat an AI summary as a source of truth.
- Hard-code statutory deadlines until counsel validates trigger events and required language.

All AI outputs must be:

- `draft`
- `requires_clinician_review: true`
- `source_grounded`
- linked to source field IDs or source references
- explicitly labeled when data is missing or conflicting

## Preferred stack if the repo allows

Use the existing repo stack when possible.

If the repo is flexible, prefer:

- TypeScript
- Next.js or React
- Supabase or PostgreSQL
- Prisma or Supabase client
- Zod validation
- Role-based access control
- Server-side audit logging
- Hash-chain custody ledger
- Demo data only
- No real PHI

Do not force a migration unless necessary.

## Phase 1 implementation target: data spine

Implement the data spine first:

- Organization
- Facility
- User
- Patient
- IntakeCase
- Encounter
- Assessment
- AssessmentSection
- MentalStatusExam
- RiskFinding
- SourceReference
- MedicalNecessitySnapshot
- LegalInstrument
- CustodyLedgerEvent
- Transmission
- FacilityResponse
- ReferralPacket
- AuditLog
- AIOutput

Minimum domain rules:

- Every case belongs to an organization.
- Every patient belongs to an organization.
- Every encounter belongs to a patient and case.
- Every assessment belongs to an encounter.
- Every clinically important finding can reference one or more sources.
- Every legal instrument has draft, signed, sealed, transmitted, accepted, declined, or voided lifecycle states.
- Every major write creates an audit event.
- Every custody event includes previous hash, current hash, payload hash, actor, timestamp, and event type.
- Medical-necessity output is a snapshot of documented facts, not a decision.

## Phase 1 UI target

Create or adapt these routes only if the repo structure supports them:

- `/cases`
- `/cases/new`
- `/cases/[caseId]`
- `/cases/[caseId]/intake`
- `/cases/[caseId]/assessment`
- `/cases/[caseId]/medical-necessity`
- `/cases/[caseId]/legal`
- `/cases/[caseId]/routing`
- `/cases/[caseId]/packet`
- `/command-center`

If the repo uses a different router, create equivalent screens/components and document the mapping.

## Phase 1 acceptance criteria

The implementation is acceptable when:

1. A fake/demo case can be created.
2. Referral source and patient location can be captured.
3. Legal status can be marked voluntary, OPC, PEC, CEC, unknown, or not yet assessed.
4. An assessment draft can be created and saved.
5. Suicide/self-harm, danger to others, grave disability, MSE, substance use, medical suitability, collateral, and lower-level alternatives can be recorded.
6. Source references can be attached to clinical facts.
7. A medical-necessity snapshot can be generated from structured facts, but only as a draft.
8. A legal instrument can be created as a draft and hash-sealed on signature.
9. A transmission event can be logged.
10. A facility can accept, decline, or request more information.
11. The custody ledger can be re-hashed and verified.
12. Audit logs are created for all writes.
13. Clinical workflow is not blocked by insurance/benefits status.
14. Guardrail tests prevent forbidden language like “meets InterQual” unless explicitly configured for licensed criteria.
15. Tests pass.
16. No seed data looks like real PHI.

## Implementation instructions

Work in small changes.

Use this order:

1. Add domain types and validation schemas.
2. Add database schema/migrations or local data model.
3. Add audit/custody hashing utilities.
4. Add seed/demo data.
5. Add basic routes/components.
6. Add medical-necessity snapshot builder.
7. Add legal instrument lifecycle.
8. Add request-broadcast routing skeleton.
9. Add tests.
10. Document remaining gaps.

Do not claim a feature works unless it is implemented and tested.

Do not add real external integrations in Phase 1. Use interfaces/adapters and mock providers.

Do not add proprietary criteria content.

Do not store real PHI.

## Suggested implementation files

Adapt names to the repo, but likely files include:

- `src/domain/clarity-mh/types.ts`
- `src/domain/clarity-mh/schemas.ts`
- `src/domain/clarity-mh/medicalNecessity.ts`
- `src/domain/clarity-mh/custodyLedger.ts`
- `src/domain/clarity-mh/legalInstrument.ts`
- `src/domain/clarity-mh/routing.ts`
- `src/domain/clarity-mh/audit.ts`
- `src/domain/clarity-mh/guardrails.ts`
- `src/data/demo/clarityMhSeed.ts`
- `src/app/cases/...` or equivalent
- `src/app/command-center/...` or equivalent
- `tests/clarity-mh/custodyLedger.test.ts`
- `tests/clarity-mh/medicalNecessity.test.ts`
- `tests/clarity-mh/guardrails.test.ts`

## Final response after implementation

Report:

1. What you inspected.
2. What you changed.
3. Files changed.
4. How to run locally.
5. How to test.
6. What remains incomplete.
7. What requires legal/clinical review.
8. Next issue list.
9. Any assumptions you made because the repo lacked context.
