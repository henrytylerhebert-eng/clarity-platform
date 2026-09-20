# Clarity Master Tree v2.0 — reconciled

**Date:** 2026-09-20
**Supersedes:** Master Tree v1.0 (conversation artifact, never in-repo)
**Reconciles:** Master Tree v1.0 × [Whole-Product Reconstruction v0.1](CLARITY_WHOLE_PRODUCT_RECONSTRUCTION_v0.1.md) × repository at `main` `44961b2`
**Status:** Proposed structure. Ratifies nothing, authorizes nothing.

## How to read this tree

Every node carries an evidence tag. **A tree without tags is how v1.0 came to omit implemented
capabilities and assert absent ones** — the tags are the correction, not decoration.

| Tag | Meaning |
|---|---|
| **[R]** | RUNTIME — code + tests that execute |
| **[S]** | SCHEMA — Prisma model exists; runtime may not consume it |
| **[C]** | CONTRACT — typed contract only |
| **[P]** | PROTOTYPE — ships in `app/` on local/demo state |
| **[K]** | AUTHORED-CANON — written this session; least independent weight |
| **[D]** | PLANNING/REFERENCE only |
| **[X]** | ABSENT — no artifact of any kind |

**Changes from v1.0 are marked** `NEW`, `CORRECTED` or `DEMOTED`.

---

# 0. TREE LINEAGE

```
Tree 0  operational meaning, trust as a UX property          LOCKED  [D] 86 lines, no standalone doc
Tree 1  identity ≠ role ≠ visibility ≠ authority             LOCKED  [D] SEE/DO/REVIEW/DECIDE/OWN is [X]
Tree 2  Workspace → Object → Object View                     LOCKED  [D] IA only
Tree 3  structural constraints                        CURRENT-STATE  [D] explicitly not doctrine
Tree 4  global shell + 6 proof flows              LOCKED + PROVEN   [D] no standalone doc; suite ungated
Tree 5  Crisis Ops workspace model                           LOCKED  [K] TREE_5_WORKSPACE_MODEL.md
```

`NEW` — **Tree 4's six proof flows are the only cross-module acceptance specification Clarity
has.** They belong in §14, not buried in a 931-line reconstruction narrative:

```
F1  Cases → Case → Clinical → back to Cases
F2  Clinical Review → Case/Clinical → complete → return
F3  Case → Assurance Finding → return to Case
F4  Case → facility change → Case invalidated → Cases in new scope
F5  Case → Revenue Operations → remembered Crisis Ops Case context
F6  session expired → sign in → revalidated Case context
```

---

# 1. CONSTITUTION [K]

```
1.1  Product identity — governed operational intelligence, not EHR/payer engine/chatbot
1.2  Mental model — where am I · what is happening · what needs attention · what next ·
     what's in the way · why · who owns it · what evidence · what happened before
1.3  Human authority — consequential clinical/legal/placement/payer decisions stay human
1.4  Progressive disclosure — operational → domain → evidence → provenance → technical
1.5  No-collapse constitution  (see 2.4)
```

---

# 2. SEMANTIC & EPISTEMIC CORE

```
2.1  Truth categories [K]
     FACT · OBSERVATION · CLAIM · DECISION · PLAN · PREFERENCE · INFERENCE · DERIVED STATE

2.2  Quality & eligibility machinery [R]          CORRECTED — v1.0 had no equivalent
     DATA_QUALITY_STATES      VALID · VALID_WITH_WARNINGS · PENDING_REVIEW ·
                              QUARANTINED · REJECTED · CORRECTED · SUPERSEDED
     METRIC_ELIGIBILITY       ELIGIBLE · ELIGIBLE_WITH_WARNING · PENDING_REVIEW ·
                              EXCLUDED_CORRECTED · EXCLUDED_SUPERSEDED ·
                              EXCLUDED_QUALITY · EXCLUDED_POLICY
     → a three-way eligible/pending/excluded split, not a boolean. This is the repository's
       real epistemic engine and it predates the canon.

2.3  Provenance [R] — source · recorder · effective time · recorded time · received time ·
     version · evidence · correction · supersession

2.4  No-collapse rules — FOUR independent families, not one   CORRECTED
     2.4.1  Referral readiness is four separate dimensions; no combining function  [R] readiness.ts
     2.4.2  Payer memory is historical and unconfirmed; never current verification [R] payerMemory.ts   NEW
     2.4.3  Longitudinal LSR-01…LSR-18                                            [K] longitudinal.ts
     2.4.4  Person ≠ Case ≠ Episode ≠ Journey; plan ≠ fact; waiting ≠ blame       [K]
```

---

# 3. IDENTITY, SCOPE & AUTHORITY

```
3.1  Identity [R]        AuthSession → AuthenticatedPrincipal → actorFor() → CommandActor
3.2  Organization [R]    tenant boundary; cross-org read THROWS, never returns empty
3.3  Facility [R]        FacilityProfile + FacilityTimezoneConfiguration            NEW
3.4  Program / Unit [S]  Episode.programId / unitId, source-owned
3.5  Role [R]            13 USER_ROLES
3.6  Permission [R]      per-endpoint allow-lists (ADR-0024 pattern)
3.7  Authority grammar   SEE / DO / REVIEW / DECIDE / OWN                    [X]   DEMOTED
     → appears in two prose files, nowhere in code, schema or tests.
       v1.0 treated it as settled. It is unmodelled.
3.8  Assignment / ownership [X] — no ownership model exists
3.9  Demo persona [P]    9 personas; NOT an authorization boundary anywhere
```

---

# 4. CARE SYSTEM MODEL

```
4.1  Care Journey — implemented phases [R]        CORRECTED — stops at ADMISSION
     REFERRAL → PRESCREEN → QUALIFIED_REVIEW → FACILITY_REVIEW →
     PRE_ADMISSION → TRANSFER_HANDOFF → ADMISSION
     dispositions held SEPARATELY: ON_TRACK · BLOCKED · DIVERTED

4.2  Care Journey — contract-only continuation [C]
     treatment → LOC planning → transition → discharge → continuity

4.3  Parallel workstreams — EIGHT [R]              CORRECTED
     clinical · legalReview · medicalScreening · benefits · authorization ·
     placement · transportation · patientEducation
     → v1.0 omitted patientEducation entirely and collapsed medicalScreening into clinical

4.4  Level-of-care dimensions — never collapsed
     clinically recommended · payer-authorized · available · patient-preferred · actual
     vocabulary: LevelOfCare enum [R] — 10 members, sufficient in-episode,
     INSUFFICIENT for continuity's next-LOC (OD-D open)

4.5  Recovery / function profile      [X] derived-only by lock; no implementation
4.6  Support / environment profile    [X] same
4.7  Care intensity profile           [X] same
```

---

# 5. BOUNDED OPERATIONAL CONTEXTS — seven, not three `CORRECTED`

```
5.1  ACCESS / CRISIS OPS                     [R] partial + [P] majority
     ├── Referral                            [S]
     ├── BehavioralHealthCase                [R]  CaseStatus state machine
     ├── Prescreen  — a BOUNDED CONTEXT, not an intake tab        CORRECTED
     │     encounters → draft → attest → supplements → submit →
     │     requirements → readiness                              [R] 7 API routes
     ├── Medical necessity review            [S]
     ├── Legal status + custody              [R] API-backed; e-PEC/OPC/CEC rules [P]
     ├── Coverage / eligibility / benefits / authorization   [S]+[C]
     ├── Placement / facility response / handoff  [P]
     └── Access read model + guidance        [R] GET /api/access/cases/:caseKey

5.2  INPATIENT EPISODE + UTILIZATION REVIEW  [R]
     Episode (admission-anchored) · CaseEpisodeLink · EpisodeAuthorization ·
     AuthorizationReview · AuthorizationDayDecision · DocumentationGap (+ history)

5.3  OPERATING ASSURANCE                     [R] 10 models · 6 routes
     expectation → evidence → evaluation → review → finding → correction → closure → trend
     evaluation outcomes include RIGHTS_RESTRICTED · STALE_SOURCE     NEW
     → Assurance already models source rights and source freshness

5.4  REVENUE OPERATIONS                      [R] 1,414 lines · 11 routes
     workspaces · commands · revisions · comparison · history · receipts ·
     receipt export · rate-release registry · XLSX · members
     IOP reconciliation: import → exception review → close receipt
     NOT billing. Claims and cash are [X]

5.5  LEARNING & PRACTICE                     [R] 1,141 lines · 6 modules     NEW — absent from v1.0
     ├── registry — modules: DRAFT · ACTIVE · RETIRED · SUPERSEDED
     ├── evaluator
     ├── recognition — candidates: RECOGNITION · COACHING · HUMAN_REVIEW · NO_ACTION
     ├── observations — RECORDED · NEEDS_REVIEW · READY_TO_ACKNOWLEDGE · SUPERSEDED
     │     with confidence
     ├── acknowledgement — ACKNOWLEDGE · ADD_CONTEXT · CONTEST ·
     │     RESOLVE_CONTEST · DISMISS          ← the observed person can contest
     ├── competency evidence
     └── practiceLab — scenarios + synthetic workflow events
     → This is workforce observation, recognition and coaching over REAL work.
       Scenario practice is ONE module of six. v1.0's §M covered only that one.

5.6  NETWORK ENRICHMENT                      [C] 1,719 lines · ADR-0019 Proposed   NEW
     entity resolution · research accuracy · evidence · freshness ·
     conflict detection · human review / persistence workflow
     → no service, no tables. Proceed-or-retire decision open.

5.7  LONGITUDINAL                            [C] contract-only; IA-002 NOT ratified
     DischargePlan · TransitionBarrier · CareTransition · DestinationAttempt ·
     LOC recommendation · clinical discharge readiness · actual discharge ·
     continuity events
     derived only: PendingDischarge · TransitionReadiness · LongitudinalCareJourney
     REFUSED persistence: the three profiles · monolithic Continuity · any score
```

---

# 6. SHARED PLATFORM CAPABILITIES

```
6.1  Command pattern [R]   Zod → role policy → one transaction (tenant-scoped read,
     state machine on fresh row, conditional versioned UPDATE, atomic audit,
     idempotency record) → governed event → outbox
6.2  Append-only audit [R]    AuditEvent + restricted-identifier guard
6.3  Governed events / outbox [R]
6.4  Idempotency [R]          CommandIdempotencyRecord; fingerprint excludes occurredAt
6.5  Evidence [R]             SourceDocument · EvidenceItem · HumanReview ·
                              ContradictionGroup                                NEW
6.6  Documents [R]            versioning + storage abstraction + compensation
6.7  Correction / supersession [R] — proven for evidence, prescreen, assurance,
                              UR, rate releases; [X] for longitudinal
6.8  Payer memory [R]         historical, unconfirmed, never verification       NEW
6.9  Patient financial education [S]  FinancialEducationRecord ·
                              EducationMethod · EducationRecipientType          NEW
6.10 Feature flags [R]        payer stack ships dark until enabled              NEW
6.11 Synthetic-only fixture guard [R]  a fixture that cannot prove it is synthetic
                              must not load
6.12 Search [X] · Attention [C] · Assignment [X] · Source connections [S] partial
```

---

# 7. CONTROLLED KNOWLEDGE `NEW — v1.0 listed this as aspirational R7`

```
7.1  RuleSet [S]   domain (LEGAL · CLINICAL · PAYER · FACILITY · WORKFLOW) ·
                   jurisdiction · issuingAuthority · version · effectiveDate ·
                   reviewDate · status · sourceDocumentIds · approvedBy · approvedAt
7.2  Rule [S]      RuleOutcome
7.3  Consumer      [P] ONLY — app/src/domain/epecRuleSets.ts drives Louisiana
                   e-PEC/OPC/CEC behind the unauthenticated demo-role picker

→ A complete, versioned, approval-bearing knowledge model exists in the schema and is
  consumed exclusively by ungoverned prototype code. This is the highest-value
  governed-truth gap in the repository.
```

---

# 8. REPRESENTATIONS `CORRECTED — only one has code`

```
8.1  WORK          [R]  ClarityShell · router · 26 workspaces
                        API-backed: Access Snapshot · IOP Reconciliation · Legal ·
                        Operating Assurance · Operating Workbook · RevOps ·
                        RevOps Pricing · RevOps Receipt Export          ← EIGHT, not three
8.2  HISTORY       [X]  substrate exists (AuditEvent, GovernedEvent); one endpoint
                        (/api/assurance/cases/:caseKey/history); no surface
8.3  EXPLORE       [X]
8.4  FLOW          [X]  requires governed cross-Case query, which does not exist
8.5  ASK CLARITY   [X]  zero AI runtime in the repository
8.6  GUIDE         [X]
8.7  COLLABORATE   [X]  without it, partners have no seat; referral is one-directional
8.8  Spatial / 3D  [X]  subordinate to Explore, which is itself absent

→ The canon presents 8.1–8.5 as "representations over the same governed world."
  Four of five have no implementation. Stating them as current architecture
  overstates the product.
```

---

# 9. EXPERIENCE / IA

```
9.1  Platform shell [R]   scope · module · identity · environment · session
9.2  Module → Workspace → Object → Object View   [D] Tree 2, IA only
9.3  Cases workspace       [P]  needs governed cross-Case query
9.4  Case shell            [P]  Overview · Intake · Clinical · Legal · Coverage ·
                                Placement/Handoff · History
9.5  Routing [R]           deep links · back/forward · session continuity ·
                           tenant/role context preserved (7 tests)
9.6  Responsive            [P]  one IA, different density
9.7  Accessibility         [D]  WCAG 2.2 AA target; no automated gate
```

---

# 10. DESIGN & INTERACTION SYSTEM [P]

```
10.1 Principles — dense · calm · trustworthy · operational · information-rich
10.2 Tables first-class · cards only where structure benefits
10.3 Status vocabulary — must distinguish known · unknown · derived · suggested ·
     human-decided · pending · missing · not-applicable · historical · superseded ·
     demo · unavailable · unauthorized        [P] StatusBadge.tsx only
10.4 Action classes — primary · secondary · destructive · human-decision · suggested
```

---

# 11. FAILURE & UNCERTAINTY [C]

```
loading · empty · filtered-empty · partial · stale · unknown · contradictory ·
unavailable · unauthorized · forbidden · network failure · backend failure ·
session expired · scope invalid · object moved/superseded/closed ·
source unavailable · unknown commit result · reconciliation required

→ Access Snapshot proves several of these at [R]. No other surface does.
```

---

# 12. EXPERIENCE SIMULATOR [X] `the gate that does not exist`

```
12.1 Platform Atlas · 12.2 Screen Atlas · 12.3 Scenario simulator ·
12.4 Truth Inspector · 12.5 Time controller · 12.6 Role switcher ·
12.7 Viewport switcher · 12.8 Failure console · 12.9 Legacy→Target inspector

→ v1.0 makes this a precondition for production build. Zero artifacts exist.
```

---

# 13. LEGACY MIGRATION [K]

Dispositions: PRESERVE · RESHAPE · REUSE LOGIC · REUSE DATA MODEL · RELOCATE ·
TEMPORARY BRIDGE · DEV-ONLY · RETIRE. Mapping in the reconstruction §21.
Deletion gate: target route + workflow + authorization parity + semantic parity +
data preserved + tests + redirects + no production dependency.

---

# 14. ACCEPTANCE & VERIFICATION

```
14.1 Verification levels    L0 contract · L1 pure logic · L2 repository ·
                            L3 service/API · L4 UI · L5 human · L6 production
14.2 Conformance baseline   [K] 9 ENFORCED · 6 PARTIAL · 2 MISSING · 4 N/A
                            → two rows it rated ENFORCED were defective (Slice 0.5)
14.3 Tree 4 proof flows F1–F6                                    NEW — promoted here
14.4 Coverage matrix        [X]
14.5 Method lesson          an audit that inventories which tests EXIST cannot find
                            a hole the tests never REACH
```

---

# 15. IMPLEMENTATION PROGRAM & GATES

```
15.1 Gate chain   semantic contract → simulator proof → repo reconciliation →
                  persistence decision → API contract → UX acceptance → implementation
15.2 In force     IA-001 [K]. IA-002 DRAFT, not ratifiable as written.
                  ADR-0026 Proposed, BLOCKED.
15.3 Blocking owner decisions
     OD-A  what makes a LongitudinalAuthorityPolicy effective
     OD-B  does delegated / emergency authority exist
     OD-C  supersede or invalidate an improperly authorized decision
     OD-D  continuity's next-LOC vocabulary
15.4 Next authorized work — Slice 0.5 remainder, all under IA-001 §10:
     C-1 LOC enum typing · C-5 rejection-form no-collapse assertions ·
     C-6 schema-conformance tripwire · C-9 UNKNOWN barred from clinical
     recommendation · C-10 required projection scope
     (C-7 and C-8 landed in PR #137)
```

---

# What v2.0 changes from v1.0 — the short list

| # | Change | Kind |
|---|---|---|
| 1 | Learning & Practice added as a bounded context; it is workforce observation with a contest path, not training | `NEW` |
| 2 | Controlled Knowledge promoted from aspiration to §7 — `RuleSet` exists in schema, consumed only by prototype code | `NEW` |
| 3 | Network Enrichment added — 1,719 contract lines | `NEW` |
| 4 | Seven bounded contexts, not three modules + a candidate | `CORRECTED` |
| 5 | Eight workstreams incl. `patientEducation`; `medicalScreening` ≠ `clinical` | `CORRECTED` |
| 6 | Prescreen is a bounded context, not an intake tab | `CORRECTED` |
| 7 | Representations: only Work has code; four are `[X]` | `CORRECTED` |
| 8 | SEE/DO/REVIEW/DECIDE/OWN demoted to `[X]` | `DEMOTED` |
| 9 | Four no-collapse families, not one | `CORRECTED` |
| 10 | Quality/eligibility machinery added as §2.2 | `NEW` |
| 11 | Payer memory, financial education, contradiction groups, feature flags, timezone lineage added | `NEW` |
| 12 | Tree 4's six proof flows promoted into Acceptance | `NEW` |
| 13 | Care Journey stops at ADMISSION in implementation | `CORRECTED` |
| 14 | Eight API-backed workspaces, not three | `CORRECTED` |

## Honesty statement

This tree is a **proposed structure**. It ratifies nothing and authorizes nothing. `[K]` nodes rest
on documents I wrote this session and carry the least independent weight. `[X]` nodes are the
honest part: eight major concepts in v1.0 have no artifact of any kind, and a tree that cannot say
so is how the last one came to assert them. Nothing here claims production readiness, HIPAA
compliance, PHI readiness, or approved clinical or legal rules.
