# Clarity Master Tree v2.1 — reconciled, two-axis

**Date:** 2026-09-20
**Supersedes:** Master Tree v1.0 (conversation artifact, never in-repo)
**Reconciles:** Master Tree v1.0 × [Whole-Product Reconstruction v0.1](CLARITY_WHOLE_PRODUCT_RECONSTRUCTION_v0.1.md) × repository at `main` `44961b2`
**Status:** Proposed structure. Ratifies nothing, authorizes nothing.
**v2.1 (2026-09-20):** two-axis evidence/maturity model; §5 replaced by Domain Topology Classification.

## How to read this tree

**v2.1 amendment.** v2.0 used a single tag, which collapsed *"does an artifact exist?"* with
*"how implemented is this?"* — so History, Explore, Flow and Ask Clarity were marked `[X]`
(absent) when governing canon documents for them exist in this repository. They are absent from
**runtime**, not from the **repository**. That is a different and less damning statement, and the
tree must be able to say it.

Two independent axes now.

### Axis 1 — evidence source (a node may carry several)

| Tag | Meaning |
|---|---|
| `[R]` | **Runtime** — executing implementation plus tests |
| `[S]` | **Schema** — a persisted/modelled shape exists |
| `[C]` | **Contract** — a typed contract exists |
| `[P]` | **Prototype** — working frontend or local-only implementation |
| `[K]` | **Canon** — a governing architecture/product artifact exists in `docs/canon/` |
| `[D]` | **Planning/Reference** — planning or reference evidence only |
| `[X]` | **Truly absent** — no repository artifact supports the concept |

`[X]` is now reserved for genuine nothingness and is rare.

### Axis 2 — implementation maturity (exactly one)

`IMPLEMENTED` · `PARTIAL` · `SCHEMA_ONLY` · `CONTRACT_ONLY` · `PROTOTYPE` · `CANON_ONLY` ·
`PLANNING_ONLY` · `ABSENT` · `DEPRECATED` · `UNKNOWN`

Written as **`[evidence] MATURITY`**, e.g. `[K][R-substrate] CANON_ONLY`.

`[K]`-sourced nodes rest on documents written during this session and carry the least independent
weight; that is an evidence-quality caveat, not a maturity claim.

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
3.7  Authority grammar   SEE / DO / REVIEW / DECIDE / OWN        [K] CANON_ONLY   DEMOTED
     → canon states it (WHOLE_PRODUCT_SPEC, CANON_RECONSTRUCTION); nothing in code,
       schema or tests implements it. v1.0 treated it as settled. It is unmodelled.
3.8  Assignment / ownership  [X] ABSENT — no ownership model in canon or code
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

4.5  Recovery / function profile       [K] CANON_ONLY  derived-only by lock
4.6  Support / environment profile     [K] CANON_ONLY  derived-only by lock
4.7  Care intensity profile            [K] CANON_ONLY  derived-only by lock
```

---

# 5. DOMAIN TOPOLOGY CLASSIFICATION `NEW — replaces "seven bounded contexts"`

v2.0 called seven things "bounded operational contexts." Pressure-tested, **they are not all the
same kind of thing.** Package, module, screen, bounded context and product application had become
synonyms. Classes used: `PLATFORM` · `APPLICATION` · `BOUNDED_CONTEXT` · `SHARED_CAPABILITY` ·
`SEMANTIC_LAYER` · `REPRESENTATION` · `RENDERER` · `CONTROL_PLANE` · `DEVELOPMENT_TOOL`.

A capability may occupy different classes at different architectural levels; where it does, both
are named.

**Canonical-state ownership** is the decisive column. A thing that owns canonical state is a
bounded context. A thing that only projects another domain's state is not, however large it is.

| Area | Topology | Evidence | Maturity | Primary objects | Primary users / jobs | Owns canonical state? |
|---|---|---|---|---|---|---|
| **Clarity** | `PLATFORM` | `[R][S][C][K]` | `PARTIAL` | — | — | n/a |
| **Crisis Ops** | `APPLICATION` | `[R][P]` | `PARTIAL` | — (hosts Access surfaces) | Intake coordinator, clinical/legal reviewers | **No** — an application shell over Access, Prescreen, Legal |
| **Access** | `BOUNDED_CONTEXT` | `[R][S][C][K]` | `PARTIAL` | `BehavioralHealthCase`, `Referral`, `CaseEpisodeLink` | Intake, access coordination | **Yes** |
| **Prescreen** | `BOUNDED_CONTEXT` | `[R][S][C]` | `IMPLEMENTED` | `PrescreenEncounter`, `PrescreenAssessmentVersion`, `PrescreenSubmission`, `PrescreenPacketRequirement` | Intake coordinator, qualified reviewer | **Yes** — own aggregate, lifecycle, attestation, API |
| **Episode / UR** | `BOUNDED_CONTEXT` | `[R][S][C]` | `IMPLEMENTED` | `Episode`, `EpisodeAuthorization`, `AuthorizationReview`, `AuthorizationDayDecision`, `DocumentationGap` | Utilization reviewer, physician reviewer | **Yes** — *no application of its own; there is no inpatient app* |
| **Operating Assurance** | `APPLICATION` + `BOUNDED_CONTEXT` | `[R][S][C][P]` | `IMPLEMENTED` | `AssuranceCase`, expectations, submissions, evaluations, review decisions, conflicts | Compliance/quality reviewer | **Yes** |
| **Revenue Operations** | `APPLICATION` + `BOUNDED_CONTEXT` | `[R][S][C][P]` | `IMPLEMENTED` | `RevOpsWorkspace`, `RevOpsChange`, `RevOpsRateRelease`, IOP import/review/receipt | Finance, rev-ops analyst | **Partly** — owns workspaces, revisions, receipts, rate releases; **projects** census/patient-days from Episode |
| **Learning & Practice** | `BOUNDED_CONTEXT` + `SHARED_CAPABILITY` | `[R][C][P]` | `IMPLEMENTED` | learning modules, observations, recognition candidates, acknowledgements, competency evidence, practice scenarios | Every operational role (observed); supervisors (review) | **Yes** for its own observations/recognitions; **observes** work owned by every other context — hence dual class |
| **Network Enrichment** | `BOUNDED_CONTEXT` *(candidate)* | `[C][D]` | `CONTRACT_ONLY` | entity resolution, research evidence, freshness, conflicts, human review | Network/provider data steward | **Would**; no service or tables exist. ADR-0019 Proposed |
| **Longitudinal / transition / continuity** | `SEMANTIC_LAYER` | `[C][K]` | `CONTRACT_ONLY` | discharge plan, barrier, transition, destination attempt, LOC recommendation, readiness decision, discharge fact, continuity events | Case management, UR, discharge planning | **No — today.** `CORRECTED`: v2.0 called this a bounded context. It owns nothing; it describes relationships among Episode, plans and events. It *becomes* a bounded context only if IA-002 authorizes persistence |
| **Controlled Knowledge** | `SHARED_CAPABILITY` | `[S][P]` | `SCHEMA_ONLY` | `RuleSet`, `Rule` | Legal, clinical, payer, facility, workflow — **all** domains | **Yes** for rule sets; consumed cross-domain, so not a context of its own. Only consumer today is prototype e-PEC code |
| **Evidence** | `SHARED_CAPABILITY` | `[R][S][C]` | `IMPLEMENTED` | `SourceDocument`, `EvidenceItem`, `HumanReview`, `ContradictionGroup` | Every reviewing role | **Yes** for evidence records; explicitly **not** a journey lane |
| **Authentication / authorization** | `CONTROL_PLANE` + `SHARED_CAPABILITY` | `[R][S][C]` | `IMPLEMENTED` | `User`, `AuthSession`, principal, `CommandActor` | All | **Yes** for identity/session |
| **Administration** | `CONTROL_PLANE` | `[S][K]` | `SCHEMA_ONLY` | `Organization`, `FacilityProfile`, `FacilityTimezoneConfiguration` | Org admin | **Yes** |
| **Work** | `REPRESENTATION` | `[R][P][K]` | `PARTIAL` | projects every context's objects | All operational roles | **No** — projection only |
| **History** | `REPRESENTATION` | `[K]` + `[R]` substrate | `CANON_ONLY` | `AuditEvent`, `GovernedEvent` substrate exists; one endpoint | All | **No** |
| **Explore** | `REPRESENTATION` | `[K]` | `CANON_ONLY` | relationships across contexts | Analysts, reviewers | **No** |
| **Flow** | `REPRESENTATION` | `[K]` | `CANON_ONLY` | cross-Case movement; **requires governed cross-Case query, which does not exist** | Operations leadership | **No** |
| **Ask Clarity** | `REPRESENTATION` | `[K]` | `CANON_ONLY` | query/trace over governed truth | All | **No — and must never** |
| **Learn** | `REPRESENTATION` | `[K][P]` | `PROTOTYPE` | projects Learning & Practice | All roles | **No** `CORRECTED`: Learn is the *experience*; Learning & Practice is the *context*. v1.0 and v2.0 both blurred them |
| **Guide** | `APPLICATION` *(candidate)* | `[K]` | `CANON_ONLY` | patient/family-facing projection | Patient, family | **No** — different audience and auth boundary, so an application rather than a representation |
| **Collaborate** | `APPLICATION` *(candidate)* | `[K]` | `CANON_ONLY` | partner-facing referral/handoff view | EDs, SNFs, receiving facilities, EMS | **No** — distinct auth boundary; without it referral is one-directional |
| **Spatial / 3D** | `RENDERER` | `[K][D]` | `CANON_ONLY` | — | — | **No** — a renderer under Explore, which is itself `CANON_ONLY` |
| **Experience Simulator** | `DEVELOPMENT_TOOL` | `[K][D]` | `PLANNING_ONLY` | atlases, scenarios, truth inspector | Product, design, engineering | **No** |
| **Product Studio / Mock Admit Lab** | `DEVELOPMENT_TOOL` | `[P]` | `PROTOTYPE` | synthetic cohorts, registry | Development | **No** |

## What the classification changed

1. **Longitudinal is a `SEMANTIC_LAYER`, not a bounded context.** It owns no canonical state. This
   is the most consequential reclassification: it explains why IA-002 is about *creating* a bounded
   context rather than exposing one.
2. **Crisis Ops is an `APPLICATION`; Access is the `BOUNDED_CONTEXT`.** They were treated as one
   thing. The application hosts surfaces from Access, Prescreen, Legal and Evidence.
3. **Episode / UR is a bounded context with no application.** There is no inpatient app — its
   objects surface through RevOps and Assurance. That is a genuine product gap, not an oversight.
4. **Learning & Practice is dual-class** — a bounded context that also functions as a shared
   capability, because it observes work owned by every other context.
5. **Controlled Knowledge is a `SHARED_CAPABILITY`**, not a context: `RuleSet` is consumed by
   legal, clinical, payer, facility and workflow domains alike.
6. **Learn ≠ Learning & Practice.** One is a representation, the other a bounded context.
7. **Guide and Collaborate are applications, not representations** — each has its own audience and
   authorization boundary.
8. **Seven "bounded contexts" resolves to five true contexts** (Access, Prescreen, Episode/UR,
   Operating Assurance, Revenue Operations), **one dual-class** (Learning & Practice), **one
   candidate** (Network Enrichment) and **one semantic layer** (Longitudinal).

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
6.12 Search [K] CANON_ONLY · Attention [C] CONTRACT_ONLY ·
     Assignment [X] ABSENT · Source connections [S] SCHEMA_ONLY
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

# 8. REPRESENTATIONS `CORRECTED — canon exists; runtime does not`

v2.0 tagged four of these `[X]`. That was wrong: **governing canon documents exist for all of
them.** They are absent from runtime, not from the repository.

```
8.1  WORK          [R][P][K]  PARTIAL
                   ClarityShell · router · 26 workspaces
                   API-backed: Access Snapshot · IOP Reconciliation · Legal ·
                   Operating Assurance · Operating Workbook · RevOps ·
                   RevOps Pricing · RevOps Receipt Export     ← EIGHT, not three
8.2  HISTORY       [K] + [R] substrate   CANON_ONLY
                   substrate real: AuditEvent, GovernedEvent, outbox;
                   one endpoint (/api/assurance/cases/:caseKey/history); no surface
8.3  EXPLORE       [K]         CANON_ONLY   EXPERIENCE_ARCHITECTURE.md §Explore
8.4  FLOW          [K]         CANON_ONLY   blocked on governed cross-Case query
8.5  ASK CLARITY   [K]         CANON_ONLY   AI_ARCHITECTURE.md; zero AI runtime
8.6  LEARN         [K][P]      PROTOTYPE    representation over Learning & Practice
8.7  GUIDE         [K]         CANON_ONLY   application candidate (§5)
8.8  COLLABORATE   [K]         CANON_ONLY   application candidate (§5)
8.9  SPATIAL / 3D  [K][D]      CANON_ONLY   renderer under Explore
```

**The honest statement:** the canon designs five representations over one governed world; **only
Work is implemented**, and History has real substrate without a surface. Presenting 8.2–8.5 as
current architecture overstates the product — but calling them absent understates the design work
that exists.

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

# 12. EXPERIENCE SIMULATOR `[K][D] PLANNING_ONLY` `CORRECTED from [X]`

```
12.1 Platform Atlas · 12.2 Screen Atlas · 12.3 Scenario simulator ·
12.4 Truth Inspector · 12.5 Time controller · 12.6 Role switcher ·
12.7 Viewport switcher · 12.8 Failure console · 12.9 Legacy→Target inspector

→ v1.0 makes this a precondition for production build. No implementation exists;
  the specification does (v1.0 §T, and §§16–18 of this tree derive the three Atlases it needs).
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

# What v2.1 changes from v2.0

| # | Change |
|---|---|
| A | **Two axes replace one tag.** Evidence source (multi-valued) is now separate from implementation maturity. `[X]` is reserved for genuine nothingness |
| B | History, Explore, Flow, Ask Clarity, Guide, Collaborate, Spatial and the authority grammar move from `[X]` to **`[K] CANON_ONLY`** — canon exists, runtime does not |
| C | The Experience Simulator moves from `[X]` to **`[K][D] PLANNING_ONLY`** |
| D | **§5 is now a Domain Topology Classification**, not a list of "seven bounded contexts" |
| E | **Longitudinal is reclassified as a `SEMANTIC_LAYER`** — it owns no canonical state |
| F | **Crisis Ops (`APPLICATION`) is separated from Access (`BOUNDED_CONTEXT`)** |
| G | **Episode / UR is a bounded context with no application** — a real product gap |
| H | **Learning & Practice is dual-class**: bounded context + shared capability |
| I | **Learn (representation) ≠ Learning & Practice (context)** |
| J | **Guide and Collaborate are applications**, not representations — separate auth boundaries |
| K | Seven "contexts" resolve to **five true contexts, one dual-class, one candidate, one semantic layer** |
| L | Only `Assignment / ownership` remains `[X] ABSENT` |

# What v2.0 changed from v1.0 — the short list

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
