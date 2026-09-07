# Inpatient Rev Ops systems map

Proposed product architecture for review; not a deployed-system inventory.
Read with the [product definition](INPATIENT_REV_OPS_PRODUCT_DEFINITION.md).
Tyler's established workbook workflow supplies the functional baseline.

## Product and information flow

```mermaid
flowchart TB
    subgraph Sources[Source systems and inputs]
        W[Operating and budget workbooks]
        U[Authorized staff entry]
        E[Future approved clinical and census sources]
        P[Future approved payroll and payment sources]
    end

    subgraph Shared[Shared platform services across workflows]
        I[Identity and tenant / facility permissions]
        C[Hospital setup, roles and custom fields]
        V[Import mappings, validation and reconciliation]
        A[Provenance, audit and correction history]
        M[Calendar, metric definitions and versioned rules]
    end

    subgraph Hospital[Hospital workspaces within an authorized tenant]
        S[Organization and facility setup]
        B[Finance: budget planning and approval]
        O[Admissions and nursing: daily operations]
        R[Benefits and UR: authorization follow-up]
        T[Staffing: hours and cost reconciliation]
        F[Finance: forecast review]
        K[Revenue cycle: collections reconciliation]
    end

    subgraph Data[Separate information layers]
        DB[(Budget versions)]
        DA[(Actual activity and review facts)]
        DF[(Forecast snapshots)]
        DC[(Posted collections and reversals)]
    end

    subgraph Reporting[Authorized reporting]
        Q[Metric calculations and comparable-period checks]
        D[Facility dashboards and source drill-down]
        G[Organization rollups and exports]
    end

    W --> V
    U --> V
    E -. Future adapters .-> V
    P -. Future adapters .-> V
    V --> B
    V --> O
    V --> R
    V --> T
    V --> K
    C --> S
    S --> B
    B --> DB
    O --> DA
    R --> DA
    T --> DA
    DA --> F
    DB -. Planning baseline .-> F
    M --> F
    F --> DF
    K --> DC
    DB --> Q
    DA --> Q
    DF --> Q
    DC --> Q
    M --> Q
    Q --> D
    D --> G
    I -. Enforces access throughout .-> Hospital
    I -. Enforces access throughout .-> Reporting
    A -. Records lineage and changes .-> Data
```

The shared controls apply to all persistence, reads, mutations, imports, jobs
and exports, not only the diagram endpoints. Every source is routed to its
appropriate layer. No line implies an implemented integration. Future adapters
are optional source connections requiring their own scoped implementation.

## Boundaries and ownership

| Boundary | Owns | Must not imply |
|---|---|---|
| Organization/tenant | Its facilities, configuration, users and authorized records | Access to another hospital organization's records |
| Facility/unit | Local operational scope, programs, capacity and reporting dimensions | A separate duplicate of the same episode at each transfer |
| Existing Clarity case/episode | Shared case and episode identity and established domain boundaries | A new parallel clinical chart owned by Rev Ops |
| Clinical/source systems | Their original clinical and operational records | Automatic integration merely because the product has a matching field |
| Budget | Approved targets and version history | Missing actuals filled from planned values |
| Actual activity | Observed events, reconciled census, staffing and review facts | Rate-derived revenue being recognized accounting revenue |
| Forecast | Assumptions, rules, cutoffs and reproducible estimates | Verified cash or a guarantee of payment |
| Collections | Posted receipts, allocations, refunds and reversals | Current-period revenue for every receipt posted this month |
| Reporting | Permission-aware derived views using aligned definitions | A second editable source of truth |

Custom fields belong to scoped record definitions with validation and history.
They do not replace core identifiers, change access or silently modify formulas.
Imports keep original source locators and mapping versions; source conflicts
require reconciliation rather than automatic overwrite.

## Workflow over the hospital stay

```mermaid
flowchart LR
    PRE[Referral and benefits review] --> ADM[Actual admission]
    ADM --> STAY[Daily census, transfers and staffing]
    ADM --> UR[Initial and concurrent UR]
    STAY --> PLAN[Discharge planning]
    PLAN --> DIS[Actual discharge]
    DIS --> POST[Post-stay finance reconciliation]
    UR --> POST
    POST -. Payment source required .-> CASH[Posted collections]
```

UR proceeds alongside the stay. Its completion is not a discharge prerequisite.
Expected discharge informs forecast only. Financial exposure must not determine
care or block emergency clinical review. Budget setup happens before and outside
the stay; the approved baseline persists as actual activity arrives.

## First vertical slice

```mermaid
flowchart LR
    S[Configure hospital and access] --> C[Define cost-center field]
    C --> I[Preview and validate patient-day budget import]
    I --> B[Approve budget baseline]
    B --> A[Record synthetic daily actuals]
    A --> R[Reconcile and correct activity]
    R --> V[View traceable budget variance]
```

Prove this entire persisted workflow across two synthetic tenants, including
unauthorized requests, repeated imports, source reconciliation, corrections,
custom-field history and calendar handling. Forecast and collections remain
outside that slice. The first slice uses explicitly sourced aggregate daily
actuals; episode-event integration is a separate expansion, not an implied
capability. Do not count aggregate imports and episode-derived totals twice.

Architect horizontally. Implement vertically. Validate replacement fidelity
end-to-end. Expand only after the completed slice meets its acceptance checks.

This map adds no stack choice, API contract, database schema, implementation
status or deployment claim. Architecture decisions remain in the existing ADR
process; [implementation status](../../IMPLEMENTATION_STATUS.md) remains the
authority for what actually exists.
