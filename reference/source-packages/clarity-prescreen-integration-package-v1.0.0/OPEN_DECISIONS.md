# Open Decisions

These items do not block architecture review or synthetic implementation. They block production enforcement, deployment, or live use.

## Product and operations

1. Exact primary launch organization and pilot facility.
2. Whether the initial user starts from an existing Clarity case or may create a temporary prescreen-only case.
3. Required offline/mobile behavior for field teams.
4. Notification channels allowed during the first pilot.
5. Whether external referral sources receive accounts, secure links, or assisted-entry workflows.

## Clinical and legal

1. Facility-approved crisis assessment content and high-risk escalation protocol.
2. Authorized roles for voluntary, noncontested, PEC, CEC, OPC, and minor pathways in each jurisdiction/facility.
3. Reassessment policy for intoxication, delirium, dementia, psychosis, and fluctuating orientation.
4. Medical-clearance baseline and facility-specific exceptions.
5. Consent and disclosure matrix by age, admission status, treatment, HIPAA, and 42 CFR Part 2.
6. Definition and local authorization of contracted secured patient transport.
7. Transport restraint, observation, accompaniment, and emergency-exception policies.

## Technical

1. Accept or revise ADR-0012 and determine the production API adapter.
2. Hosting provider, network boundary, data region, backups, and disaster recovery.
3. Production identity provider and external-user identity model.
4. Tenant model, RLS, platform-admin policy, and cross-organization sharing.
5. Object storage, malware scanning, document rendering, and retention.
6. Integration priorities: FHIR, HL7 v2, Direct messaging, SFTP, payer, transport, or EHR.
7. Event bus/runtime choice, if asynchronous integration is required in the initial pilot.

## Governance

1. Who approves facility profiles and policy-derived rules.
2. Review cadence and expiration behavior for transport-provider credentials.
3. Incident escalation and audit-review ownership.
4. Data retention, legal hold, deletion, and correction policy.
5. Rules for aggregate operational trending and minimum cohort size.
