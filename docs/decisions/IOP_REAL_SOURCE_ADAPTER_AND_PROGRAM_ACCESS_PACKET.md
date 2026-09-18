---
status: PENDING_OWNER_AND_SECURITY_DECISIONS
scope: IOP reconciliation only; no connector or real data authorization
---

# IOP real-source adapter and program-access packet

## Objective

Define the minimum approved inputs for one read-only, source-owned IOP import. This packet does not authorize a connector, credentials, PHI, production deployment, billing action, or clinical decision.

## Source decision record

| Required decision | Owner | Recorded value | Gate |
| --- | --- | --- | --- |
| Authoritative EHR/export for enrollment and plan versions | IOP operations | `[Unknown]` | Required before adapter code |
| Authoritative note-audit export | Compliance | `[Unknown]` | Required before adapter code |
| Authoritative charge and EMR-billable export | Revenue cycle | `[Unknown]` | Required before adapter code |
| Export transport and credential custodian | Source owner + security | `[Unknown]` | Required before credentials |
| Stable IDs and correction/version semantics | Source owner | `[Unknown]` | Required before mapping |
| Cutoff and late-correction policy | IOP operations + revenue cycle | `[Unknown]` | Required before close |
| Minimum necessary fields and retention | Privacy + security | `[Unknown]` | Required before non-synthetic data |

The adapter must receive immutable source snapshots with stable source record IDs and source versions for enrollment, plan, attendance, note audit, charge line, and EMR billable line. A late correction creates a new source version and a new reconciliation snapshot; it never mutates a closed receipt.

## Permission matrix

| Actor | View | Import | Review exception | Close | Grant/revoke |
| --- | ---: | ---: | ---: | ---: | ---: |
| Organization admin with active program grant | Yes | Yes | Yes | Yes | No |
| Utilization or compliance reviewer with active program grant | Yes | No | Yes | No | No |
| Program director with active program grant | `[Decision]` | `[Decision]` | `[Decision]` | `[Decision]` | No |
| Security administrator | Audit only | No | No | No | Yes |
| Any actor without an active program grant | No | No | No | No | No |

Grants must be server-resolved, effective-dated, revocable, program-specific, and recorded with grantor identity. Browser role or program claims never confer permission.

**Proposed default for program directors:** view and review only after an active program grant; import and close stay with an organization admin until IOP operations and compliance approve a narrower delegated-close policy. This is a conservative proposal, not a recorded owner decision.

## Provider RLS remediation

Supabase Postgres is the recorded OD-6 provider. Its schema is deployed, but the
current Prisma runtime connection is the `postgres` role, which bypasses RLS.
That connection must not be used for an RLS-backed IOP import path.

Before any provider-backed IOP RLS migration:

1. Security creates a dedicated, `NOSUPERUSER NOBYPASSRLS` runtime role and a separate migration role.
2. The runtime role receives only the exact table/sequence privileges required by the API; Supabase `anon` and `authenticated` remain without public-table grants.
3. The deployed API uses the runtime role through a server-held secret; browser clients never receive a database credential.
4. A provider-backed test runs the OD-6 no-context, cross-tenant, rollback, concurrency, and non-revealing denial cases, extended with wrong-program and revoked-grant cases.
5. Security records the runtime-role, secret-rotation, backup/recovery, and break-glass evidence before an RLS policy is treated as enabled for any non-synthetic workload.

## Owner action record

| Owner | Action required to clear the gate | Evidence to attach |
| --- | --- | --- |
| IOP operations | Name the authoritative enrollment/plan and attendance export; approve cutoff behavior | Export specification and sample header only |
| Compliance | Name the note-audit source and approve independent-review semantics | Field map and audit-state glossary |
| Revenue cycle | Name charge and EMR-billable sources; approve correction timing | Field map and a late-charge example |
| Privacy + security | Approve minimum fields, retention, credential custodian, and runtime database role | Data inventory and access-control review |
| Technical owner | Approve program-grant model and run provider-backed RLS proof | Migration review and test receipt |

## Required implementation sequence

1. Record the seven source decisions above and approve the permission matrix.
2. Add `ProgramScope`, `ProgramGrant`, and source-integration-to-program bindings through an additive migration.
3. Enforce the grant in API authentication, gateway queries, and transaction-local database context.
4. Add RLS `USING` and `WITH CHECK` policies only after the OD-6 provider/runtime-role security gate is approved; retain application predicates after RLS.
5. Prove denial for cross-tenant, wrong-program, revoked-grant, browser-claim, and post-close mutations.
6. Run a real Fastify plus browser synthetic end-to-end suite: unauthenticated denial, import, independent audit, exception review, close receipt, reload, and non-revealing wrong-scope denial.
7. Build one nonproduction, read-only adapter for the approved source and reconcile it in parallel with the accepted workbook before any production enablement.

## Acceptance evidence

| Gate | Evidence required |
| --- | --- |
| Source mapping | Signed source-field map, stable-ID examples, cutoff/correction cases |
| Access control | Migration review, grant/revocation tests, API denial tests, direct RLS tests using a non-bypass runtime role |
| Browser path | Real local HTTP browser test using synthetic data and persisted receipt reload |
| Adapter | Nonproduction run receipt, source snapshot hash, record-count reconciliation, reviewed exceptions |
| Production enablement | IOP operations, privacy, security, revenue-cycle, and source-owner approvals |

## Explicit exclusions

- No credential storage or connector activation.
- No real patient or operational data.
- No writeback to EHR, note, charge, or billing systems.
- No automated clinical, compliance, or billability determination.
- No claim that local RLS proves provider-backed or production readiness.
