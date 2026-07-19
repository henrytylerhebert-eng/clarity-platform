# Full-Stack Team Handoff

## Product/design

- Validate field and Central Intake workflows with representative users.
- Convert workspace specs into wireframes/prototypes using the existing design system.
- Validate terminology: prescreen, noncontested, MAR, TAR, medical review, legal/custody status, secured transport.
- Test progressive disclosure and mobile interruption.

## Backend/domain

- Map reference contracts to existing domain types/Zod/state-machine conventions.
- Implement small aggregates and controlled commands.
- Preserve organization scope, idempotency, concurrency, audit, and human authority.
- Keep provider/policy configuration separate from patient facts.

## Data

- Reconcile proposed Prisma models with canonical schema.
- Design additive migrations and RLS strategy.
- Define outbox/projection mechanics.
- Keep analytics facts separate and de-identified.

## Frontend

- Reuse existing navigation, case header, evidence/document components, error handling, and role adaptation.
- Build assessment sections, review/attestation, Central Intake queue, packet readiness, communications/tasks, and transport.
- Treat server permissions and readiness results as authoritative.

## Integration

- Select one real partner/interface only after canonical runtime works.
- Define source authentication, mapping, acknowledgement, retry, reconciliation, and support ownership.
- Do not build FHIR/HL7 merely to claim interoperability.

## Security/privacy

- Lead threat model, external-user identity, cross-organization access, object storage, logging, retention, and incident controls.
- Validate minimum-necessary projections for transport and referral sources.

## Clinical/legal/compliance

- Approve assessment content, escalation, orientation gate use, admission roles, minor/consent matrix, instruments, transport categories/exceptions, and facility criteria.
- Approve effective dates and source language before profiles activate.

## QA

- Build deterministic tests from the synthetic scenarios.
- Verify accessibility, tenancy, authority, versioning, packet, communication, transport, and correction behaviors.
- Maintain release evidence and regression matrix.

## DevOps/SRE

- Establish environments, CI, migrations, secrets, monitoring, alerting, backup/restore, incident response, and rollback.
- Verify that logs/traces remain PHI-safe.
