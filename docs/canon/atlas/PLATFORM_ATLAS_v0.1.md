# Platform Atlas v0.1

**Derived from:** [Master Tree v2.1](../reconstruction/CLARITY_MASTER_TREE_v2.1.md) §5
**Date:** 2026-09-20 · **Audited at:** `main` `4fbbf43`
**Status:** Derived artifact. Ratifies nothing. **Not** an instruction to build the simulator.

Axes: evidence `[R][S][C][P][K][D][X]` · maturity · owner/source of truth · **canonical-state
ownership vs projection**.

```
CLARITY  PLATFORM  [R][S][C][K]  PARTIAL
│
├── APPLICATIONS ─────────────────────────────────────────────────────────────
│   ├── Crisis Ops              [R][P]     PARTIAL      owns: nothing (shell)
│   ├── Operating Assurance     [R][S][C]  IMPLEMENTED  owns: assurance state
│   ├── Revenue Operations      [R][S][C]  IMPLEMENTED  owns: workspaces/receipts/rates
│   │                                                   projects: census, patient days
│   ├── Guide         (candidate) [K]      CANON_ONLY   patient/family audience
│   └── Collaborate   (candidate) [K]      CANON_ONLY   partner audience
│
├── BOUNDED CONTEXTS ─────────────────────────────────────────────────────────
│   ├── Access                  [R][S][C][K] PARTIAL      BehavioralHealthCase, Referral
│   ├── Prescreen               [R][S][C]    IMPLEMENTED  PrescreenEncounter + versions
│   ├── Episode / UR            [R][S][C]    IMPLEMENTED  Episode, authorizations, gaps
│   │                                                     ⚠ no application surfaces it
│   ├── Operating Assurance     [R][S][C]    IMPLEMENTED  (also an application)
│   ├── Revenue Operations      [R][S][C]    IMPLEMENTED  (also an application)
│   ├── Learning & Practice     [R][C][P]    IMPLEMENTED  observations, recognition,
│   │                                                     acknowledgements, competency
│   │                                                     (also a shared capability)
│   └── Network Enrichment (cand.) [C][D]    CONTRACT_ONLY  ADR-0019 Proposed
│
├── SHARED CAPABILITIES ──────────────────────────────────────────────────────
│   ├── Command pattern         [R]        IMPLEMENTED  Zod→policy→txn→audit→event→outbox
│   ├── Append-only audit       [R][S]     IMPLEMENTED  AuditEvent + identifier guard
│   ├── Governed events/outbox  [R][S]     IMPLEMENTED
│   ├── Idempotency             [R][S]     IMPLEMENTED  fingerprint excludes occurredAt
│   ├── Evidence                [R][S][C]  IMPLEMENTED  + ContradictionGroup
│   ├── Documents               [R][S][C]  IMPLEMENTED  versioning + compensation
│   ├── Correction/supersession [R]        PARTIAL      ⚠ absent for longitudinal
│   ├── Controlled Knowledge    [S][P]     SCHEMA_ONLY  RuleSet/Rule — ⚠ prototype-only consumer
│   ├── Payer memory            [R][C]     IMPLEMENTED  historical, never verification
│   ├── Patient financial education [S]    SCHEMA_ONLY  FinancialEducationRecord
│   ├── Feature flags           [R][C]     IMPLEMENTED  payer stack ships dark
│   ├── Synthetic-fixture guard [R]        IMPLEMENTED
│   ├── Learning & Practice     [R]        IMPLEMENTED  observes all contexts
│   ├── Search                  [K]        CANON_ONLY
│   ├── Attention               [C]        CONTRACT_ONLY
│   ├── Assignment / ownership  [X]        ABSENT
│   └── Source connections      [S]        SCHEMA_ONLY  IopSourceIntegration only
│
├── SEMANTIC LAYERS ──────────────────────────────────────────────────────────
│   ├── Truth categories        [K]        CANON_ONLY   FACT…DERIVED STATE
│   ├── Quality & eligibility   [R][C]     IMPLEMENTED  DATA_QUALITY / METRIC_ELIGIBILITY
│   ├── No-collapse families ×4 [R][C][K]  PARTIAL      readiness · payerMemory ·
│   │                                                   longitudinal · constitution
│   ├── Journey phase/disposition [R][C]   IMPLEMENTED  derived, stops at ADMISSION
│   ├── Workstreams (8)         [R][C]     IMPLEMENTED  incl. patientEducation
│   ├── Level of care           [R][S]     PARTIAL      ⚠ insufficient for continuity
│   └── Longitudinal            [C][K]     CONTRACT_ONLY  owns nothing today
│
├── REPRESENTATIONS ──────────────────────────────────────────────────────────
│   ├── Work                    [R][P][K]  PARTIAL      8 API-backed, 19 prototype
│   ├── History                 [K]+[R]sub CANON_ONLY   substrate real, no surface
│   ├── Explore                 [K]        CANON_ONLY
│   ├── Flow                    [K]        CANON_ONLY   blocked on cross-Case query
│   ├── Ask Clarity             [K]        CANON_ONLY   zero AI runtime
│   └── Learn                   [K][P]     PROTOTYPE
│
├── RENDERERS ────────────────────────────────────────────────────────────────
│   ├── Tables / forms / inspectors [P]    PROTOTYPE
│   └── Spatial / 3D            [K][D]     CANON_ONLY   under Explore
│
├── CONTROL PLANE ────────────────────────────────────────────────────────────
│   ├── Authentication          [R][S][C]  IMPLEMENTED  ADR-0011
│   ├── Authorization           [R][C]     PARTIAL      per-endpoint allow-lists
│   │                                                   ⚠ SEE/DO/REVIEW/DECIDE/OWN CANON_ONLY
│   ├── Organization / tenancy  [R][S][C]  IMPLEMENTED  cross-org read THROWS
│   └── Administration          [S][K]     SCHEMA_ONLY
│
└── DEVELOPMENT TOOLS ────────────────────────────────────────────────────────
    ├── Product Studio          [P]        PROTOTYPE
    ├── Mock Admit Lab          [P]        PROTOTYPE
    ├── Synthetic fixtures      [R]        IMPLEMENTED
    └── Experience Simulator    [K][D]     PLANNING_ONLY
```

## Canonical-state ownership summary

**Owns canonical state (9):** Access · Prescreen · Episode/UR · Operating Assurance · Revenue
Operations (partly) · Learning & Practice · Evidence · Controlled Knowledge · Auth/tenancy.

**Projects only (10):** Crisis Ops · Work · History · Explore · Flow · Ask Clarity · Learn ·
Guide · Collaborate · Longitudinal.

## P0 gaps this Atlas exposes

| # | Gap | Why it is P0 |
|---|---|---|
| 1 | **Episode/UR has no application** | A whole bounded context with no user-facing home; its objects surface only through RevOps and Assurance |
| 2 | **Controlled Knowledge is governed-in-schema, consumed-in-prototype** | Versioned, approval-bearing rule sets driving Louisiana e-PEC logic behind an unauthenticated role picker |
| 3 | **Correction/supersession absent for longitudinal** | A shared capability everywhere else; missing exactly where IA-002 wants to persist |
| 4 | **Assignment/ownership is the only true `ABSENT`** | Work, attention and handoff all presuppose it |
| 5 | **Authorization is `PARTIAL` while the authority grammar is `CANON_ONLY`** | The model the product is designed around is unimplemented |
| 6 | **Flow is blocked on governed cross-Case query** | Cases, Queue and Flow all need it; nothing provides it |
| 7 | **Case-context navigation does not survive a route change** `NEW 2026-09-20` | Found by the Tree 4 reconciliation (PR #139). `selectedCaseId` is component state, so leaving Crisis Ops for `/assurance` or `/rev-ops` resets the Case. **Four of six unmet Tree 4 acceptance requirements collapse into this one capability.** A navigation concern — must not be solved by persisting Case selection into governed storage |
