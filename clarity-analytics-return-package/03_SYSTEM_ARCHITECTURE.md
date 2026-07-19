# System Architecture

## Architecture recommendation

**Proposed and unverified:** Evolve Clarity as a modular monolith with separate deployable processes, not as a browser-only feature and not as a premature distributed microservice estate.

- `packages/api-service`: sole public HTTP adapter after ADR-0012 reconciliation.
- `packages/episode-service`: episode and admission commands.
- `packages/utilization-review-service`: post-admission authorization, review, documentation-gap, and assignment commands.
- `packages/analytics-service`: event validation, projection logic, mart writes, metric calculation, and queries.
- `packages/reporting-service`: reserved for later approved exports/submissions; not required for first slice.
- `packages/domain-contracts/src/{episode,utilization-review,analytics}`: Zod/type/state/event contracts.
- `app/src/...`: role-scoped Operations and Outcomes workspaces.
- canonical Prisma schema: operational state, governed events, audit links, deliveries/checkpoints.
- separate SQL-managed `analytics` schema: de-identified facts and metric snapshots.

The exact package names and paths must be checked against live repository conventions.

## Bounded contexts

```mermaid
flowchart TB
    subgraph Access["Case and Access"]
      Referral
      Intake
      Evidence
      Packet
      FacilityResponse
      Custody
    end

    subgraph Episode["Admission and Episode"]
      AdmissionHandoff
      EpisodeAggregate
      EpisodeDay
      Discharge
    end

    subgraph UR["Authorization and Utilization Review"]
      EpisodeAuthorization
      Review
      DayDecision
      DocumentationGap
      Assignment
    end

    subgraph Ops["Hospital Operations (later)"]
      Census
      BedStatus
      Throughput
    end

    subgraph Workforce["Workforce (later)"]
      StaffingActual
      StaffingBudget
    end

    subgraph Finance["Finance (later)"]
      ContractRate
      RevenueFact
      Adjustment
    end

    subgraph Analytics["Analytics"]
      GovernedEvent
      Projection
      MetricRegistry
      MetricSnapshot
      DataQuality
    end

    subgraph Reporting["Reporting (later)"]
      Export
      Attestation
      Submission
      Acknowledgement
    end

    Access -->|accepted case + source refs| Episode
    Episode -->|episode events| Analytics
    UR -->|review/gap/day events| Analytics
    Episode --> UR
    Ops --> Analytics
    Workforce --> Analytics
    Finance --> Analytics
    Analytics --> Reporting
```

### Ownership rule

- A bounded context owns its command state.
- Cross-context consumers receive immutable event contracts or read approved projections.
- The analytics context never becomes the authoritative writer of episode, authorization, documentation, staffing, or finance source state.
- Reporting never writes operational state.

## Referral-to-episode transition

```mermaid
sequenceDiagram
    participant UI as Admission Handoff UI
    participant API as Authenticated API
    participant CASE as Case service/repository
    participant EP as Episode service
    participant DB as PostgreSQL
    participant EVT as Governed event ledger
    participant W as Projection worker

    UI->>API: POST handoff + idempotency + expectedVersion
    API->>API: authenticate, derive actor/org/scope
    API->>EP: RecordAdmissionHandoff(command, actor)
    EP->>CASE: read accepted case in org scope
    CASE-->>EP: accepted case snapshot + version
    EP->>DB: begin transaction
    EP->>DB: create episode + link + admission record
    EP->>DB: append audit event
    EP->>EVT: append ADMISSION_RECORDED
    EP->>DB: create event delivery
    EP->>DB: commit
    EP-->>API: episode summary + versions
    API-->>UI: 201 Created
    W->>DB: claim delivery
    W->>DB: derive episode day and UR projections
    W->>DB: record checkpoint/recompute metadata
```

If existing case and episode writes cannot share a transaction through current gateways, that is a **Needs decision** boundary. Do not emulate atomicity with best-effort browser calls.

## Command, event, and query flow

```mermaid
flowchart LR
    C[Authenticated command] --> V[Transport validation]
    V --> P[Domain authorization policy]
    P --> S[Command service]
    S --> TX[(Atomic transaction)]
    TX --> STATE[Operational state]
    TX --> AUDIT[Append-only audit]
    TX --> EVENT[Governed event]
    TX --> DELIVERY[Projection delivery]
    DELIVERY --> WORKER[Idempotent projector]
    WORKER --> OP[Operational read model]
    WORKER --> MART[De-identified mart]
    OP --> Q1[Operational query service]
    MART --> Q2[Metric query service]
    Q1 --> API[API response]
    Q2 --> API
```

### Command rules

- actor, organization, roles, and scope come only from the verified principal;
- unknown request fields are rejected;
- every mutating command has idempotency and correlation IDs;
- state-changing commands use expected version/optimistic concurrency;
- command success, audit event, governed event, and delivery are atomic;
- clients never provide event classification, metric eligibility, audit actor, or tenant ID.

### Event rules

- event payloads are immutable;
- a correction is a new event that references the event it supersedes;
- external events are quarantined until mapping, tenant, schema, provenance, and quality checks pass;
- delivery/checkpoint rows may be updated; event and audit payloads may not;
- projectors are replayable and idempotent.

### Query rules

- operational queries enforce organization and facility/program/unit scopes;
- aggregate queries return definition, freshness, completeness, quality, and suppression metadata;
- executive/aggregate endpoints do not return direct patient identifiers;
- no query result implies clinical, legal, placement, discharge, or payer approval.

## PHI-to-analytics flow

```mermaid
flowchart TD
    S1[Native commands] --> PHI[(Transactional PHI zone)]
    S2[EHR / payer / batch adapters later] --> INBOX[Validated ingestion inbox]
    INBOX --> PHI
    PHI --> GE[Governed event zone]
    GE --> MIN[Field minimization]
    MIN --> TOK[Tokenization / generalization]
    TOK --> DQ{Quality and governance checks}
    DQ -- fail --> QUAR[Quarantine + human review]
    DQ -- pass --> MART[(De-identified analytics mart)]
    MART --> METRIC[Versioned metric calculation]
    METRIC --> DASH[Role-scoped dashboard]
    METRIC --> EXP[Approved export process later]
```

Operational users may receive PHI from operational endpoints when their role and scope require it. Aggregate dashboards are not a route around operational access controls.

## Initial deployment topology

```mermaid
flowchart TB
    subgraph Public
      CDN[Static React client]
      LB[HTTPS ingress]
    end

    subgraph AppNet["Approved private application network"]
      API[Node/Fastify API process]
      PW[Projection worker process]
      MW[Metric/mart worker process]
      MIG[Explicit migration job]
    end

    subgraph Data
      PG[(Managed PostgreSQL)]
      TXS[transactional/public schema]
      AES[event/audit tables]
      ANS[analytics schema]
      KMS[Key management / secrets]
    end

    subgraph Control
      IDP[Managed OIDC provider - unknown]
      OBS[Logs/metrics/traces]
    end

    CDN --> LB --> API
    API --> IDP
    API --> TXS
    PW --> AES
    PW --> TXS
    MW --> AES
    MW --> ANS
    API --> ANS
    MIG --> PG
    API --> OBS
    PW --> OBS
    MW --> OBS
    KMS --> API
    KMS --> MW
```

### Database roles

**Proposed:**

- `clarity_api_tx`: read/write allowed operational tables through approved service paths; read governed event metadata needed for provenance; no analytics DDL.
- `clarity_projection_worker`: read events, write operational projections/checkpoints; cannot alter source operational aggregates.
- `clarity_analytics_worker`: read minimum event fields, write analytics schema; no patient identity-table access unless a controlled tokenization function requires it.
- `clarity_analytics_reader`: read approved mart views only.
- `clarity_migrator`: migration-time DDL; not used by app runtime.
- `clarity_auditor`: read-only approved audit/provenance views.

Role names are proposals; provider and migration tooling are unknown.

## Tenancy topology

```mermaid
flowchart TD
    ORG[Organization tenant] --> F1[Facility]
    ORG --> F2[Facility]
    F1 --> P1[Program]
    F1 --> P2[Program]
    P1 --> U1[Unit]
    P1 --> U2[Unit]
    PRINCIPAL[Verified principal] --> MEMBERSHIP[Organization membership]
    MEMBERSHIP --> GRANT[Facility/program/unit scope grants]
    GRANT --> QUERY[Allowed query intersection]
    QUERY --> ORG
```

- Organization is the top-level tenant.
- Facility/program/unit scopes are narrower authorization dimensions, not alternate tenant IDs.
- Cross-organization analytics uses neither ordinary membership nor `SYSTEM_ADMIN` bypass. It requires an explicit aggregate grant and separate governed query path.
- Every tenant-owned operational and mart row includes `organizationId`.
- Facility/program/unit identifiers are validated as descendants of the organization in the same transaction.

## Runtime placement relative to ADR-0012

### Recommended

- **Public boundary:** one API adapter, consistent with ADR-0012.
- **Internal commands:** direct package/service calls inside the API process.
- **Asynchronous analytics:** separate worker process(es), no public route.
- **Queries:** API delegates to operational or analytics query services.
- **External ingestion later:** private authenticated adapter endpoints or batch jobs that normalize into the same event contract.

### Why not put the analytics worker in the API request lifecycle

- large replays and recomputation would increase command latency;
- correction and late-arrival handling needs checkpointed retries;
- mart credentials should not be present in the public API process if avoidable;
- workers need independent scaling and rollback;
- a failed metric calculation must not roll back a valid clinical/operational command.

### Why not make analytics a separate public microservice yet

- current identity/hosting/provider choices are open;
- service-to-service auth, networking, duplicate error policy, and deployment ownership would add unproven complexity;
- package and process separation preserves the future split.

## Event processing semantics

### Native writes

Use **atomic append plus idempotent projection**:

1. validate command;
2. write operational state;
3. append audit;
4. append governed event;
5. create delivery row;
6. commit;
7. worker claims delivery with lease;
8. projection transaction checks `(projectionName, eventId)` uniqueness;
9. write projection and processed-event record;
10. advance checkpoint.

### External writes

Use **ingestion receipt plus normalization**:

1. authenticate source;
2. record immutable raw receipt metadata and hash in restricted storage;
3. validate source schema;
4. map source values to canonical values;
5. resolve tenant/facility/program/unit;
6. run data-quality and duplicate checks;
7. create governed canonical event or quarantine record;
8. acknowledge source according to adapter contract.

Raw external payload retention is a **Needs decision** and should default to minimum necessary.

## Correction, supersession, and recomputation

```mermaid
sequenceDiagram
    participant U as Authorized user/source
    participant API as Command API
    participant E as Event ledger
    participant P as Projector
    participant M as Metric engine

    U->>API: correction command + target event + reason
    API->>E: append CORRECTION event (original remains immutable)
    E-->>P: new delivery
    P->>P: resolve active event chain
    P->>P: rebuild affected episode days / queue
    P-->>M: enqueue affected metric scopes/periods
    M->>M: calculate new snapshot version
    M->>M: mark prior snapshot superseded by lineage record
```

Late events use the same recomputation path. Historical source data is not silently overwritten.

## Architecture decision records to add

| Proposed ADR | Decision |
|---|---|
| ADR-0013 | Admission/Episode and UR bounded contexts; case-to-episode link |
| ADR-0014 | Governed event ledger, event delivery, and projector semantics |
| ADR-0015 | PHI operational zone and de-identified analytics schema |
| ADR-0016 | Tenancy hierarchy, scoped grants, and cross-org default deny |
| ADR-0017 | Metric registry, definition approval, snapshots, and recomputation |
| ADR-0018 | Server-owned UR queue and aggregate dashboard separation |
| ADR-0019 | Adapter normalization and source-quality quarantine |
| ADR-0020 | Correction/supersession policy and immutable history |

Numbering must be checked against the live `docs/architecture/` directory.

## Reversal triggers

Split analytics to a separate database/service when any of these become true:

- provider/regional residency requires physical separation;
- analytics queries materially affect transactional performance;
- event volume or retention requires independent storage/partitioning;
- separate operational teams own analytics;
- cross-organization benchmark authority demands stronger cryptographic or administrative separation;
- an approved streaming platform becomes required for multiple source systems;
- database-per-tenant is mandated.

Until then, keep interfaces split even if infrastructure is shared.
