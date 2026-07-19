# Security, Privacy and Tenancy

## Data classification

The enrichment domain should contain public business data and internal review metadata. It must not contain patient data or unrestricted personal data.

| Data | Classification |
|---|---|
| Public organization phone/address | Public business data |
| Public employee name/title/business email | Public professional data |
| Internal reviewer rationale | Confidential operational data |
| Source snapshot/excerpt | Controlled source evidence |
| Credentials/tokens | Secret; never stored in events/logs |
| PHI | Prohibited in this capability |

## Tenant model

- `organizationId` on every tenant-owned record.
- Tenant derived only from verified principal.
- Repository and service predicates on every read/write.
- PostgreSQL RLS before production as defense in depth.
- Platform administration uses separate explicit policy; no silent bypass.
- Cross-organization sharing requires an explicit relationship, purpose and audit record.

## Outbound-network controls

- Domain allowlist and denylist.
- DNS rebinding and private-address blocking.
- HTTPS required except approved government exceptions.
- Response size, MIME and timeout limits.
- Redirect limit and final-domain validation.
- Egress proxy logs without sensitive content.
- Malware/document scanning for downloaded files.

## Logging redaction

Never log:

- access tokens, cookies or authorization headers;
- unrestricted request/response bodies;
- full page HTML;
- private contact data;
- reviewer free text without structured redaction;
- any PHI.

## Retention

Retention periods require owner/security approval. Proposed starting points:

- candidate/evidence metadata: 7 years for governed auditability;
- raw downloaded source snapshots: shortest practical period, encrypted and access-controlled;
- transient fetch cache: 24 hours or less;
- security logs: 1 year;
- secrets: never persisted in application logs.
