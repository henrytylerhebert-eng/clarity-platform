# Clarity — Emerging-State Architecture

Current state ([CLARITY_CURRENT_STATE.md](CLARITY_CURRENT_STATE.md)) plus every
component that is genuinely built and tested but not yet integrated into the live
product, plus partial/hybrid pieces. This is the "what already exists, waiting to be
connected" picture — not a proposal for new infrastructure.

```mermaid
flowchart TB
    U[Users / Roles]

    subgraph EXP[Experience Layer — app/]
        RO[RevOps / Operating Workbook — REAL]
        LS[Legal Status — HYBRID]
        MOCK["12 mock-only workspaces:<br/>Case Queue, Command Center, Guided Intake,<br/>Evidence Review, Medical Necessity,<br/>Benefits Verification, Authorization Readiness,<br/>IOP Reconciliation, Packet Preview,<br/>Routing/Facility Response, Bedboard/Custody,<br/>Learning/Practice — localStorage only"]
    end

    subgraph APP[Application / API Layer]
        FA[Fastify server]
        NR[Native Fastify routes]
        CC[node:http-style catch-all<br/>DRIFT-06: migration pending]
    end

    subgraph DOM[Domain Platform — built, integration depth varies]
        CASE[Case repository + command service<br/>BUILT, only decision-rationale wired]
        DOC[Document repository<br/>BUILT, not frontend-wired]
        EVI[Evidence repository<br/>BUILT, not frontend-wired]
        BEN[Benefits verification<br/>BUILT, not frontend-wired]
        AUTHZ[Authorization readiness<br/>BUILT, not frontend-wired]
        EPUR[Episode / UR<br/>API exists, IOP frontend not wired]
        PRE[Prescreen service<br/>BUILT, no dedicated frontend]
        REVS[RevOps service — REAL, wired]
        OA[Operating Assurance<br/>BUILT, no frontend surface at all]
        CLPR["Learning/Practice service<br/>BUILT — INTEGRATION PENDING<br/>in-memory only, no Prisma/API"]
        LHF["legal-hold-forms<br/>BUILT — INTEGRATION PENDING<br/>never imported by app/"]
        NET["Network-enrichment contracts<br/>DESIGNED only, ADR-0019 Proposed"]
        OUT[Governed events + outbox<br/>write-path only, no dispatcher process]
    end

    subgraph DATA[Data Foundation]
        PG[(PostgreSQL — clarity_dev)]
    end

    U --> EXP
    EXP --> FA
    FA --> NR
    FA --> CC
    NR --> REVS
    NR --> EPUR
    NR --> OA
    CC --> CASE
    CC --> PRE

    CASE --> PG
    DOC --> PG
    EVI --> PG
    BEN --> PG
    AUTHZ --> PG
    EPUR --> PG
    PRE --> PG
    REVS --> PG
    OA --> PG
    OUT --> PG
    CLPR -.->|no persistence| CLPR
    LHF -.->|no persistence| LHF
```

## Integration-pending items, by evidence

| Component | Built? | Integration gap | Source |
| --- | --- | --- | --- |
| CLPR / Learning-Practice | Yes, 16/16 tests | No Prisma, no tenant context, no audit writer, no API; frontend uses a separate local mock, not this package | Ledger §10 |
| legal-hold-forms | Yes, tested | Never imported anywhere in `app/src` | Ledger §12 |
| 12 mock-only workspaces | Backend exists for most | No `domain/api.ts` import; single shared `localStorage` blob | DRIFT-11 |
| ADR-0012 routing | Partial | Catch-all routes need native Fastify registration | DRIFT-06 |
| Network-enrichment | Contracts only | No runtime slice built (PR #30 closed as superseded) | Ledger §13 |

## What this diagram does not add

No new infrastructure, no new services, no message broker, no external integration —
every box above already exists in the repository today. "Emerging" describes *reach*
(what could be connected with wiring work already scoped), not *new construction*.
