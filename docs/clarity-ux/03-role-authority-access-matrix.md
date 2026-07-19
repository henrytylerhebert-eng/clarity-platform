# 03 — Role, Authority, and Access Matrix

**Audit date:** 2026-07-18. All entries are **Verified repository findings** from `packages/*/src/permissions.ts`, `prisma/schema.prisma` (`enum UserRole`), and `app/src/domain/roles.ts`, unless labeled otherwise.

## Two role vocabularies exist, with no mapping

| Vocabulary | Where | Members | Enforced? |
|---|---|---|---|
| `UserRole` (backend) | Prisma enum + all service permission maps | 13 roles: SYSTEM_ADMIN, ORGANIZATION_ADMIN, INTAKE_COORDINATOR, CLINICAL_REVIEWER, PHYSICIAN_REVIEWER, UTILIZATION_REVIEWER, LEGAL_REVIEWER, BENEFITS_VERIFICATION_SPECIALIST, AUTHORIZATION_SPECIALIST, FACILITY_REVIEWER, TRANSPORT_COORDINATOR, COMPLIANCE_REVIEWER, READ_ONLY_AUDITOR | Yes — thrown `PermissionDeniedError` in every service, tested |
| `RoleId` (app demo) | `app/src/domain/roles.ts` | 9 personas: all, field, central, clinician, ur, facility, nurse, compliance, executive | **No** — display scoping only; the sidebar states "Demo role scoping only — not authentication," and a session panel explains roles are asserted, not proven |

**Finding (P1):** there is no translation table between the two vocabularies. When the UI is wired to the services, every app persona must resolve to a `UserRole[]` set — that mapping does not exist anywhere in the repo.

## Backend command → role matrix (verified, complete)

### case-service (`COMMAND_ROLE_POLICY`, `WORKSTREAM_ROLE_POLICY`)

| Command | Allowed roles |
|---|---|
| CreateCase / AssignCase / TransitionCase / CloseCase | INTAKE_COORDINATOR, ORGANIZATION_ADMIN |
| ReopenCase | ORGANIZATION_ADMIN |
| UpdateCaseUrgency | INTAKE_COORDINATOR, CLINICAL_REVIEWER, PHYSICIAN_REVIEWER |
| UpdateCaseLocation | INTAKE_COORDINATOR, TRANSPORT_COORDINATOR |
| RecordDecisionRationale | 11 roles (all operational + COMPLIANCE_REVIEWER) |
| Workstream: clinical / medicalScreening | CLINICAL_REVIEWER, PHYSICIAN_REVIEWER |
| Workstream: legalReview | LEGAL_REVIEWER |
| Workstream: benefits | BENEFITS_VERIFICATION_SPECIALIST |
| Workstream: authorization | AUTHORIZATION_SPECIALIST, UTILIZATION_REVIEWER |
| Workstream: placement | INTAKE_COORDINATOR, FACILITY_REVIEWER |
| Workstream: transportation | TRANSPORT_COORDINATOR, INTAKE_COORDINATOR |
| Workstream: patientEducation | BENEFITS_VERIFICATION_SPECIALIST, INTAKE_COORDINATOR |

### document-service

| Command | Allowed roles |
|---|---|
| UploadDocument / CreateDocumentVersion | 9 operational roles (excludes UR, compliance, auditor, sysadmin) |
| ClassifyDocument | INTAKE_COORDINATOR, ORGANIZATION_ADMIN, CLINICAL_REVIEWER, PHYSICIAN_REVIEWER |
| AccessDocument | 12 roles incl. COMPLIANCE_REVIEWER and READ_ONLY_AUDITOR ("oversight requires being able to read what it audits") |

### evidence-service

Create: 7 operational roles. Review (approve/reject/clarify/supersede) is **category-scoped**: clinical categories → CLINICAL_REVIEWER/PHYSICIAN_REVIEWER; LEGAL_STATUS/CUSTODY/GUARDIANSHIP → LEGAL_REVIEWER; INSURANCE → BENEFITS; AUTHORIZATION → AUTH_SPECIALIST/UR; PLACEMENT → FACILITY/INTAKE; TRANSPORT → TRANSPORT_COORDINATOR; OTHER → INTAKE/ORG_ADMIN. Category is read inside the transaction so a caller cannot lie about it. **This is a strength — preserve it.**

### benefits-service / authorization-service

Verification restricted to BENEFITS_VERIFICATION_SPECIALIST; coverage capture shared with INTAKE_COORDINATOR; authorization recording restricted to AUTHORIZATION_SPECIALIST/UTILIZATION_REVIEWER; readiness view readable by 5 feeder/consumer roles.

### Deliberate, documented exclusions (strength — preserve)

- SYSTEM_ADMIN: **zero case-level rights anywhere** — platform administration is not clinical operations.
- READ_ONLY_AUDITOR: no command anywhere; AccessDocument only.
- COMPLIANCE_REVIEWER: RecordDecisionRationale + AccessDocument only; cannot alter case state.

## Authority gaps (findings)

| # | Finding | Evidence label | Priority |
|---|---|---|---|
| A-1 | **CommandActor roles are still trusted caller input.** `auth-service` exists to retire this (its own comment says so) but nothing outside tests calls `actorFor()`; there is no API layer to enforce it. Any code path constructing an actor can claim any roles. | Verified | P0 (blocks any real deployment; documented) |
| A-2 | **`PrismaLegalStatusGateway` has no role-permission layer.** Every other domain routes through a service with a role policy; legal-status create/list checks tenant ownership only. No `legal-hold-service` wrapper exists. | Verified | P1 |
| A-3 | **Read paths are largely un-gated.** Only AccessDocument models a view permission. Case reads, evidence reads, legal-status lists, benefits reads have tenant scoping but no role check. No field/category-level view restrictions (e.g., SUD data) exist. | Verified | P1 |
| A-4 | No relationship/assignment-based access (care-team, case assignment, purpose-of-use, time-bound access), no emergency/break-glass model, no consent gating of reads. | Verified absence | P1 (design work, pre-API) |
| A-5 | App personas grant workspace visibility that exceeds their backend counterpart's authority — e.g., demo "compliance" persona can open Legal Status and execute a PEC in the prototype, while backend COMPLIANCE_REVIEWER can mutate nothing. Harmless today (client-only), misleading as a demo of the product's authority model. | Verified | P2 |
| A-6 | Auth hardening not present: no login rate limiting/lockout, no session rotation, no idle timeout distinct from TTL, no MFA/SSO (dev IdP only, explicitly labeled). | Verified absence | P2 at current stage; P0 gate before production |

## What is genuinely good here

Server-side enforcement exists at the service layer and is *tested* (`tests/security/organization-isolation`, `tests/integration/tenant-isolation`, per-service permission tests). Tenant scoping is asserted inside every gateway before any write, and audit events commit atomically with mutations. The auth service hashes tokens (stores SHA-256 only, returns the bearer exactly once), uses uniform login failures, and keeps revoked session rows for audit. These patterns match ADR intent and should be preserved through the API build-out, not replaced.
