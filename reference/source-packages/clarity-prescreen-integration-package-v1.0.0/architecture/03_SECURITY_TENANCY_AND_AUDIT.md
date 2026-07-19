# Security, Tenancy, and Audit Architecture

## Identity

- Production identity provider remains an owner decision.
- API accepts authenticated sessions/tokens only.
- Verified principal maps to internal actor, organization memberships, roles, assignments, and status.
- External users receive scoped identity and expiration; no shared accounts.

## Authorization inputs

- organization membership;
- role/capability;
- case relationship/assignment;
- facility/program scope;
- legal/clinical credential or delegated authority;
- requested action;
- data sensitivity;
- sharing agreement/purpose;
- record state.

## Tenant isolation

Initial design:

- shared PostgreSQL database and schema;
- `organizationId` on every tenant-owned row;
- organization predicates in every repository query/write;
- transaction-local tenant context and PostgreSQL RLS before production;
- no caller-supplied tenant override;
- deny and audit cross-tenant identifier enumeration.

## Cross-organization case collaboration

Use an explicit `CaseAccessGrant` or equivalent:

- source organization;
- recipient organization;
- case;
- purpose;
- allowed projection/capabilities;
- effective/expiration time;
- granting authority;
- revocation;
- audit.

Do not copy the whole case into another tenant merely to share a packet.

## Field-level controls

Separate projections for:

- assessor;
- Central Intake;
- clinical reviewer;
- transport provider;
- external referral source;
- aggregate executive user.

Transport users receive only the approved transport packet and necessary safety/medical information.

## Audit

Audit events contain:

- event ID;
- organization/case/object scope;
- actor/source system;
- action and outcome;
- event and recorded times;
- correlation/causation;
- previous/new state hashes or version references;
- profile/rule versions;
- sanitized metadata;
- reason/rationale where required.

Never include:

- access tokens;
- passwords;
- full request bodies;
- raw clinical narrative;
- source document text;
- unrestricted identifiers;
- legal instrument contents.

## Security controls before production

- managed identity and MFA policy;
- encryption at rest/in transit;
- secret management and rotation;
- RLS verification;
- object storage access control and malware scanning;
- rate limits, CORS, CSP/security headers;
- redacted structured logging;
- backup/restore evidence;
- vulnerability and dependency scanning;
- SAST/DAST and penetration testing;
- incident response and breach workflow;
- retention/deletion/legal hold;
- business associate and data-use agreements.
