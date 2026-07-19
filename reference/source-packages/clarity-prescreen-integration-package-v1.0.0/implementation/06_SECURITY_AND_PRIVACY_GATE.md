# Security and Privacy Gate

No production PHI until all applicable items are verified.

## Identity and access

- managed identity provider and MFA;
- unique users; no shared accounts;
- external-user identity proofing and expiration;
- role/capability/assignment policy;
- organization scope and RLS tests;
- break-glass policy with reason and review;
- session revocation and deactivation.

## Data protection

- TLS and encryption at rest;
- secret/key management and rotation;
- field/object storage authorization;
- malware scanning and quarantine;
- backup encryption and restore test;
- approved retention/deletion/legal hold;
- secure deletion for temporary/offline data.

## Application controls

- strict validation and unknown-field rejection;
- request/body/file limits;
- CORS, CSP, security headers;
- rate limiting and abuse detection;
- idempotency and concurrency;
- audit/outbox atomicity;
- no direct browser database access;
- no PHI in logs/traces/analytics.

## External sharing

- explicit case access grants;
- minimum-necessary projections;
- secure-link expiration and one-time/revocation controls;
- download/print/access audit;
- channel and recipient verification;
- no unrestricted emailed attachments unless approved.

## Integrations

- source authentication;
- webhook signatures/replay controls;
- SFTP key/host verification;
- mapping/version validation;
- dead-letter and reconciliation;
- partner contracts/BAA/data-use agreement;
- incident notification terms.

## AI/policy ingestion

- source documents protected;
- prompts/outputs classified;
- no training reuse without approval;
- candidate output only;
- exact source citation;
- human approval;
- model/prompt/version audit;
- safety and privacy evaluation.

## Review evidence

- threat model;
- data-flow diagram;
- access-control test report;
- vulnerability scan;
- penetration test for production pilot;
- incident-response tabletop;
- backup/restore exercise;
- log/trace PHI review;
- signed clinical/legal/privacy approvals.
