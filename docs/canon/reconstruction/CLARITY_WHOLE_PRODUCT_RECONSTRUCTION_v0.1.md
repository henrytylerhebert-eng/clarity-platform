# Clarity Whole-Product Reconstruction v0.1

**Date:** 2026-09-20
**Audited at:** `main` `44961b2`, plus branch `fix/slice-0-5-semantic-protections`
**Author's standing:** **Not an independent review.** I authored or co-authored the canon package,
the gap closure, the reconciliation, IA-002, ADR-0026 and the owner review during this session,
and I have read Tyler's Master Tree v1.0. This is a **repository-grounded completeness audit by an
informed participant.** Where a claim rests on something I wrote rather than on running code, it is
tagged so you can discount it.

## Evidence classes used throughout

| Tag | Meaning |
|---|---|
| **[RUNTIME]** | Executable code with tests that run in CI |
| **[SCHEMA]** | A Prisma model/enum exists; runtime may or may not consume it |
| **[CONTRACT]** | Typed contract only — no persistence, no service, no API |
| **[PROTOTYPE]** | Ships in `app/` on local/demo state, behind the unauthenticated role picker |
| **[AUTHORED-CANON]** | Exists because I wrote it this session. Lowest independent weight |
| **[PLANNING]** | `docs/` or `reference/` only |
| **[ABSENT]** | Discussed in conversation or the Master Tree; **no artifact of any kind** |

---

# 1. One-sentence product definition

Clarity is a governed operational-intelligence platform for behavioral-health access and inpatient
operations that preserves the difference between what was observed, what was claimed, what was
decided by whom under what authority, what was planned, and what was computed — across referral,
placement, admission, stay, transition and follow-up, within one organization's records.

# 2. One-page product model

```
                         CLARITY
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
  GOVERNED TRUTH                          CONTROLLED KNOWLEDGE
  command → transaction →                 RuleSet / Rule       [SCHEMA]
  audit → governed event                  jurisdiction, version,
  → outbox → read model                   effective date, approval
        │
        ├── Access / Crisis Ops   REFERRAL → ADMISSION      [RUNTIME, partial]
        ├── Inpatient Episode + UR                          [RUNTIME]
        ├── Operating Assurance                             [RUNTIME]
        ├── Revenue Operations                              [RUNTIME]
        ├── Learning & Practice                             [RUNTIME]
        ├── Network Enrichment                              [CONTRACT]
        └── Longitudinal (plan→barrier→transition→continuity) [CONTRACT]
                                    │
        ┌───────────────────────────┴──────────────────────┐
        │              REPRESENTATIONS                     │
        │  Work [RUNTIME] · History [ABSENT] · Explore     │
        │  [ABSENT] · Flow [ABSENT] · Ask Clarity [ABSENT] │
        └──────────────────────────────────────────────────┘
```

The load-bearing asymmetry: **the governed core is real and the representation layer is almost
entirely absent.** Four of the five representations named in the canon have zero implementation.

# 3. Complete product tree

See §§4–21. The organizing correction to the Master Tree is that Clarity has **seven bounded
operational contexts, not three modules**, and that **Learning & Practice and Network Enrichment
are two of them.**

# 4. Application / module map

| Context | Status | Evidence |
|---|---|---|
| **Access / Crisis Ops** | Mixed | `packages/case-service`, `prescreen-service`, read model at `GET /api/access/cases/:caseKey`; most `app/` screens **[PROTOTYPE]** |
| **Inpatient Episode + Utilization Review** | **[RUNTIME]** + **[SCHEMA]** | `Episode`, `EpisodeAuthorization`, `AuthorizationReview`, `AuthorizationDayDecision`, `DocumentationGap`; `utilizationReview.ts` |
| **Operating Assurance** | **[RUNTIME]** | `assurance-service`, 6 API routes, 10 Prisma models, `prisma/assurance.prisma` |
| **Revenue Operations** | **[RUNTIME]** | `rev-ops-service` (1,414 lines), 11 API routes, workspace/receipt/export/rate-release |
| **Learning & Practice** | **[RUNTIME]** | `learning-practice-service` (1,141 lines) — see §17 |
| **Network Enrichment** | **[CONTRACT]** | 1,719 contract lines across 4 modules; ADR-0019 **Proposed**; no service, no tables |
| **Longitudinal** | **[CONTRACT]** | `longitudinal.ts`; no persistence; IA-002 not ratified |
| **Administration / control plane** | **[SCHEMA]** | `Organization`, `User`, `AuthSession`, `FacilityProfile`, `RuleSet` |

**Master Tree omission:** it names three operational modules (Crisis Ops, Operating Assurance,
Revenue Operations) plus a candidate. It omits **Learning & Practice** (implemented) and **Network
Enrichment** (1,719 contract lines) entirely.

# 5. Representation map

| Representation | Status | Evidence |
|---|---|---|
| **Work** | **[RUNTIME]** | `ClarityShell`, `CrisisOpsApp`, router with deep links, 26 workspaces |
| **History** | **[ABSENT]** as a surface | `AuditEvent` + `GovernedEvent` **[RUNTIME]** provide the substrate; `/api/assurance/cases/:caseKey/history` is the only history endpoint |
| **Explore** | **[ABSENT]** | One incidental string match, no implementation |
| **Flow** | **[ABSENT]** | One incidental string match. Requires governed cross-Case query, which does not exist |
| **Ask Clarity** | **[ABSENT]** | `grep -rlE "\bllm\b\|anthropic\|openai\|claude-\|gpt-"` over `packages/*/src` and `app/src` → **zero matches**. No AI runtime exists |
| **Learning & Practice** | **[RUNTIME]** | Not a representation — a bounded context. See §17 |
| **Guide / Collaborate** | **[ABSENT]** | Concept only |
| **Spatial / 3D** | **[ABSENT]** | Correctly subordinate to Explore, which is itself absent |

# 6. Actor / user map

**[RUNTIME]** `USER_ROLES` — 13 members: `SYSTEM_ADMIN`, `ORGANIZATION_ADMIN`,
`INTAKE_COORDINATOR`, `CLINICAL_REVIEWER`, `PHYSICIAN_REVIEWER`, `UTILIZATION_REVIEWER`,
`LEGAL_REVIEWER`, `BENEFITS_VERIFICATION_SPECIALIST`, `AUTHORIZATION_SPECIALIST`,
`FACILITY_REVIEWER`, `TRANSPORT_COORDINATOR`, `COMPLIANCE_REVIEWER`, `READ_ONLY_AUDITOR`.

**[PROTOTYPE]** 9 demo personas in `app/`, asserted by `App.test.tsx`. **Not an authorization
boundary anywhere.**

**The `SEE / DO / REVIEW / DECIDE / OWN` authority grammar is [ABSENT].** It appears in exactly two
canon prose files (`WHOLE_PRODUCT_SPEC.md`, `CANON_RECONSTRUCTION_PASS_01`) and **nowhere in code,
schema or tests.** The Master Tree treats it as settled; it is unmodelled. What exists instead is a
flat role list plus per-endpoint allow-lists (ADR-0024 pattern).

External actors are modelled only as data, not as users: `PayerProfile`, `PlanProfile`,
`FacilityProfile`, `CustodyPartyType`. There is **no partner-facing surface** — Collaborate is
absent, so EDs, SNFs and receiving facilities have no seat.

# 7. Care-system map

**[RUNTIME/SCHEMA]** supported: referral source, organization, facility, program/unit, payer, plan,
custody party (`CustodyPartyType`), legal instrument (`LegalStatusRecord`, `LegalStatusType`),
receiving facility, transport (workstream), patient/family education (`FinancialEducationRecord`,
`EducationRecipientType`, `EducationMethod`).

**[ABSENT]:** EMS, law-enforcement, court, coroner and community-service actors as *modelled
participants* — the e-PEC/OPC/CEC instruments exist **[PROTOTYPE]** in `app/src/domain/epec.ts`
with rule sets, but the issuing authorities are not first-class.

# 8. Care Journey map

**[RUNTIME]** `JOURNEY_PHASES` = `REFERRAL → PRESCREEN → QUALIFIED_REVIEW → FACILITY_REVIEW →
PRE_ADMISSION → TRANSFER_HANDOFF → ADMISSION`, with `JOURNEY_DISPOSITIONS` (`ON_TRACK`, `BLOCKED`,
`DIVERTED`, …) held **separately** from phase. Derived, not stored.

**The implemented journey stops at ADMISSION.** Everything the Master Tree places after it —
treatment, LOC planning, transition, discharge, continuity — is **[CONTRACT]** only.

**[RUNTIME]** `WORKSTREAMS` — 8 parallel lanes: `clinical`, `legalReview`, `medicalScreening`,
`benefits`, `authorization`, `placement`, `transportation`, **`patientEducation`**.

**Master Tree omission:** `patientEducation` is a first-class workstream with backing schema
(`FinancialEducationRecord`). The Master Tree has no patient-education lane. `medicalScreening` is
also distinct from `clinical` and the tree collapses them.

# 9. Core object map

59 Prisma models, 60 enums. Grouped:

- **Identity/scope:** `Organization`, `User`, `AuthSession`, `FacilityProfile`,
  `FacilityTimezoneConfiguration`, `PatientToken`
- **Access:** `Referral`, `BehavioralHealthCase`, `PrescreenEncounter`,
  `PrescreenAssessmentVersion`, `PrescreenSubmission`, `PrescreenPacketRequirement`,
  `MedicalNecessityReview`, `LegalStatusRecord`, `CustodyEvent`
- **Evidence:** `SourceDocument`, `EvidenceItem`, `HumanReview`, `ContradictionGroup`
- **Coverage:** `InsuranceCoverage`, `InsuranceSubscriber`, `EligibilityVerification`,
  `EligibilityProof`, `BenefitVerification`, `BenefitVerificationSource`, `Authorization`,
  `PayerProfile`, `PlanProfile`
- **Episode:** `Episode`, `CaseEpisodeLink`, `EpisodeAuthorization`, `AuthorizationReview`,
  `AuthorizationDayDecision`, `DocumentationGap`, `DocumentationGapStatusHistory`
- **Assurance:** 10 models
- **RevOps:** `RevOpsWorkspace`, `RevOpsChange`, `RevOpsRateRelease`
- **IOP:** `IopSourceIntegration`, `IopReconciliationImport`, `IopReconciliationExceptionReview`,
  `IopReconciliationCloseReceipt`
- **Knowledge:** `RuleSet`, `Rule`
- **Education:** `FinancialEducationRecord`
- **Platform:** `AuditEvent`, `GovernedEvent`, `OutboxRecord`, `CommandIdempotencyRecord`

**Master Tree omissions with schema behind them:** `ContradictionGroup`, `HumanReview`,
`PayerProfile`/`PlanProfile`/`NetworkStatus`, `FinancialEducationRecord`, `RuleSet`/`Rule`,
`CommandIdempotencyRecord`, `FacilityTimezoneConfiguration`.

# 10. Semantic / epistemic map

**[RUNTIME]** `DATA_QUALITY_STATES` (VALID → SUPERSEDED) and `METRIC_ELIGIBILITY_STATES`
(ELIGIBLE / PENDING_REVIEW / EXCLUDED_*) are the repository's real epistemic machinery — a
three-way eligible/pending/excluded split, not a boolean.

**[RUNTIME] Three independent no-collapse rules exist in code**, only one of which the canon names:
1. `readiness.ts` — "Referral readiness is four SEPARATE dimensions. There is intentionally no
   function that combines them into one number."
2. `payerMemory.ts` — organization-specific historical payer knowledge is "always labeled
   historical and unconfirmed for the current patient, and can never be consumed as current-patient
   verification."
3. `longitudinal.ts` — the LSR-10/LSR-15 rules.

**Master Tree omission:** payer memory is a genuine epistemic capability — institutional memory
that may inform but never verify — and appears in no tree.

**Semantic leakage found:**
- `actor.ts` header still states *"Actor roles are supplied by the caller: authentication/
  authorization infrastructure is upstream and does not exist yet — documented assumption."*
  **This is stale.** ADR-0011 retired it and `CLAUDE.md` says so. A contract file contradicts an
  accepted ADR.
- `caseStateMachine.ts` records `RETURNED_FOR_MORE_INFORMATION` as a **known Prisma-only desync**
  (OD-22).

# 11. Authority map

**[RUNTIME]:** identity → `AuthSession` → `AuthenticatedPrincipal` → `actorFor(principal)` →
`CommandActor`. `organizationId` and roles come from the database-backed principal, never the
request body (ADR-0011). `organizationScope.ts` makes a cross-organization read **a thrown error,
not a silent empty result**.

**[ABSENT]:** SEE/DO/REVIEW/DECIDE/OWN; assignment/ownership as a modelled concept; delegation;
revocation; approval-of-authority-change (the OD-A/OD-B/OD-C gap).

# 12. Workflow map

**[RUNTIME]** the command pattern: strict Zod envelope → role policy → one transaction
(tenant-scoped read, state machine on the fresh row, conditional versioned UPDATE, atomic audit
event, idempotency record) → governed event → outbox. Proven by `case-command-concurrency`,
`case-assignment-atomicity`, `outbox-delivery`, `audit-persistence` integration tests.

**[RUNTIME]** Prescreen is a genuine bounded context with its own lifecycle:
`encounters → draft → attest → supplements → submit → requirements → readiness` (7 API routes).
**The Master Tree collapses Prescreen into "Intake."** It is not intake; it is an attested,
versioned, requirement-gated assessment with its own submission and readiness model.

**[RUNTIME]** Assurance lifecycle: expectation → evidence submission → evaluation
(`SUPPORTED` / `PARTIALLY_SUPPORTED` / `MISSING_EVIDENCE` / `CONFLICT` / `STALE_SOURCE` /
`APPLICABILITY_PENDING` / `RIGHTS_RESTRICTED` / `REVIEW_REQUIRED`) → review decision
(`ACCEPT` / `REJECT` / `REQUEST_MORE_EVIDENCE` / `REVIEW_REQUIRED`) → conflict → history.

**Master Tree omission:** `RIGHTS_RESTRICTED` and `STALE_SOURCE` are evaluation outcomes — Assurance
already models **source rights and source freshness**, which the tree treats as absent concerns.

# 13. Experience map

**[RUNTIME]** Work only. Router with deep links, back/forward, session continuity across areas,
tenant/role context preservation (7 router tests).

**API-backed surfaces (corrected inventory):** Access Snapshot, IOP Reconciliation, Legal Status,
**Operating Assurance, Operating Workbook, RevOps, RevOps Pricing, RevOps Receipt Export**.

> **Finding — `IMPLEMENTATION_STATUS.md` understates this.** The project-state block names only
> `access`, `iop-reconciliation` and `legal` as API-backed. Five more workspaces import
> `domain/api`. The stale claim is on `main`.

**[PROTOTYPE]** (local/demo state): Bedboard, CaseOverview, CaseQueue, CommandCenter, CustodyLedger,
GuidedIntake, MedicalNecessity, MockAdmitLab, NewCase, PacketPreview, ProductStudio, RoutingResponse,
TrainingSops, AuthorizationReadiness, BenefitsVerification, EvidenceReview, RevOpsFields,
RevOpsMonthClose, RevOpsReconciliation.

# 14. Screen / IA map

**Tree lineage status — this is the largest documentation gap in the product.**

| Tree | Artifact | Status |
|---|---|---|
| Tree 0 — operational meaning, trust as a UX property | 86 lines of narrative for Trees 0–3 **combined**, inside `CANON_RECONSTRUCTION_PASS_01` | LOCKED, **no standalone doc** |
| Tree 1 — identity ≠ role ≠ visibility ≠ authority; SEE/DO/REVIEW/DECIDE/OWN | same | LOCKED, **unimplemented** |
| Tree 2 — Workspace → Object → Object View | same | LOCKED as IA |
| Tree 3 — structural constraints | same | **Current-state fact, explicitly not doctrine** |
| Tree 4 — global shell, 6 proof flows | **No standalone canon document** | "LOCKED + VISUALLY PROVEN" — but its only regression suite (`app/smoke/clarity-v01.spec.ts`) is run by **no CI step** |
| Tree 5 — Crisis Ops workspace model | `TREE_5_WORKSPACE_MODEL.md` | Never audited; unimplemented beyond Access Snapshot |

**Tree 4's six proof flows** (Cases→Case→Clinical→back; Clinical Review→complete→return;
Case→Assurance Finding→return; Case→facility change→invalidated→new scope; Case→RevOps→remembered
context; session expiry→re-auth→revalidated context) are the closest thing Clarity has to a
cross-module acceptance specification — and they exist only as prose inside a 931-line document.

# 15. Data / runtime architecture

`app/` → `api-service` (Fastify, ADR-0012) → domain services → `case-repository` (sole
`@prisma/client` holder) → PostgreSQL. Plus `AuditEvent`, `GovernedEvent`, `OutboxRecord`,
`CommandIdempotencyRecord`. 27 migrations. Supabase is the OD-6 provider (ADR-0022) though tenancy
tests against it remain open.

# 16. AI architecture

**[ABSENT] in its entirety.** Zero AI runtime. The architecture is designed (`AI_ARCHITECTURE.md`
**[AUTHORED-CANON]**) and nothing implements it. Rows 15–17 of the Verification Matrix are
**vacuously true**, which must never be reported as coverage.

# 17. Learning & Practice architecture — the most under-represented implemented capability

**[RUNTIME]** `learning-practice-service` — 1,141 lines, 6 tested modules: `registry`, `evaluator`,
`recognition`, `practiceLab`, `gateway`, `id`. Plus `learningPractice.ts` contracts and
`app/src/components/learning-practice/*`.

What it actually models:

- `LearningModuleStatus`: DRAFT / ACTIVE / RETIRED / **SUPERSEDED**
- `ObservationState`: RECORDED / NEEDS_REVIEW / READY_TO_ACKNOWLEDGE / SUPERSEDED
- `ObservationConfidence`
- `RecognitionCandidateType`: **RECOGNITION / COACHING / HUMAN_REVIEW / NO_ACTION**
- `AcknowledgementAction`: ACKNOWLEDGE / ADD_CONTEXT / **CONTEST / RESOLVE_CONTEST** / DISMISS
- `CompetencyEvidenceType`
- `ScenarioAction`, `SyntheticWorkflowEventType`

**This is not training.** It is a governed **recognition-and-coaching loop over observed real work**,
with confidence, human review, supersession, and a **contest/appeal path for the person being
observed**. The Master Tree's §M treats Learn as scenario-based education; that is only
`practiceLab`. The tree has no concept of workforce observation, recognition, coaching, competency
evidence, or contested observations — all implemented.

It also carries the same epistemic discipline as the clinical side: an observation is not a
finding, a candidate is not a decision, and the observed person can contest.

# 18. Revenue architecture

**[RUNTIME]** `rev-ops-service` 1,414 lines, 11 routes: workspaces, commands, comparison, history,
receipts, receipt export, rate releases, members, XLSX. `RevOpsRateRelease` is a persisted
Louisiana Medicaid rate-release registry (ADR-0021 **Proposed**). IOP reconciliation is separate:
import → exception review → close receipt, with `IopSourceIntegration` program binding.

Revenue is **not** billing. It is workspace-based operational finance with versioned revisions,
receipt hashes and export — closer to a governed workbook than a claims system. Claims and cash
are **[ABSENT]**.

# 19. Assurance architecture

See §12. 10 Prisma models, 6 API routes, replay and review-safety integration tests. Models source
**rights**, source **currentness**, applicability decisions and conflicts — a documentary-evidence
governance engine, not surveillance rounds.

# 20. Policy / knowledge architecture

**[SCHEMA]** `RuleSet` — `domain` (`LEGAL` / `CLINICAL` / `PAYER` / `FACILITY` / `WORKFLOW`),
`jurisdiction`, `issuingAuthority`, `version`, `effectiveDate`, `reviewDate`, `status`,
`sourceDocumentIds`, `approvedBy`, `approvedAt` — plus `Rule` with `RuleOutcome`.

**This is a complete controlled-knowledge model, already in the schema.** Its only consumer is
**[PROTOTYPE]** frontend code: `app/src/domain/epecRuleSets.ts` driving Louisiana e-PEC/OPC/CEC
logic in `LegalStatus.tsx`.

**Finding:** the layer the Master Tree lists as an aspirational shared capability (R7) is
**already modelled with versioning, jurisdiction, issuing authority and approval** — and is being
consumed by unauthenticated prototype code. That is the highest-value governed-truth gap in the
repository.

# 21. Legacy map

| Surface | Disposition | Destination |
|---|---|---|
| CaseQueue | RESHAPE | Cases workspace (needs governed cross-Case query) |
| Access Snapshot | PRESERVE | Case Overview backbone |
| GuidedIntake | RESHAPE / consolidate | Case → Intake; reconcile with Prescreen |
| MedicalNecessity | RELOCATE | Case → Clinical |
| LegalStatus | PRESERVE (API-backed) | Case → Legal |
| BenefitsVerification, AuthorizationReadiness | RELOCATE | Case → Coverage |
| PacketPreview, RoutingResponse | RELOCATE | Case → Placement/Handoff |
| CustodyLedger | RELOCATE | Legal / History |
| Bedboard, CommandCenter | CONDITIONAL | Placement workspace, if it earns admission |
| EvidenceReview | RESHAPE | Evidence as cross-cutting capability |
| IopReconciliation | PRESERVE | Revenue Operations |
| TrainingSops | RESHAPE | Learning & Practice |
| MockAdmitLab, ProductStudio | DEV-ONLY | Development tooling |
| RevOps* (5 local) | RESHAPE | Consolidate into governed RevOps |

# 22–23. Current vs target; implemented / proposed / deferred

| Capability | Implemented | Locked target | Proposed | Deferred/Absent |
|---|---|---|---|---|
| Access referral→admission | Partial | ✓ | | |
| Prescreen | ✓ | | | |
| Episode + UR | ✓ | | | |
| Assurance | ✓ | | | |
| RevOps | ✓ | | ADR-0021 | Claims, cash |
| Learning & Practice | ✓ | | | |
| Evidence/audit/outbox | ✓ | | | |
| Knowledge/RuleSet | Schema only | | | Governed service |
| Network enrichment | | | ADR-0019 | Service, tables |
| Longitudinal | | ✓ **[AUTHORED-CANON]** | ADR-0026 | Persistence |
| History / Explore / Flow / Ask Clarity | | | | **All absent** |
| Guide / Collaborate | | | | Absent |
| Experience Simulator | | | | **Absent** |

# 24. Blind spots

**What a reader of only the UX/UI discussion would miss:** Learning & Practice's recognition and
contest model; payer memory; the `RuleSet` knowledge layer; `ContradictionGroup`; Prescreen as a
bounded context rather than a tab; `patientEducation` as a workstream; `FinancialEducationRecord`;
Assurance's source-rights and staleness semantics; the idempotency/outbox machinery; facility
timezone capture.

**What the canon under-represents:** Trees 0–3 (86 lines total); Tree 4 (no standalone document
despite being "LOCKED"); Learning & Practice (absent from `WHOLE_PRODUCT_SPEC`); Network
Enrichment; the knowledge layer; the three separate no-collapse rules that predate LSR-15.

**What the repo implements that no product tree carries:** the five additional API-backed
workspaces; `RuleSet`; payer memory; contradiction groups; financial education; timezone lineage.

**Discussed but not earned:** Explore, Flow, Ask Clarity, Guide, Collaborate, spatial/3D, the
Experience Simulator, SEE/DO/REVIEW/DECIDE/OWN. **Eight major concepts with zero artifacts.**

# 25. Canon delta

- **CANON HAS / RECONSTRUCTION CONFIRMS:** command pattern, tenancy, append-only audit, Episode
  scoping, JourneyPhase derivation, Access read model, no-collapse discipline.
- **CANON HAS / RECONSTRUCTION DISAGREES:** `WHOLE_PRODUCT_SPEC` lists Work/History/Explore/Flow/
  Ask Clarity as "representations over the same governed world" — four of five have **no code**.
  Presenting them as a current architecture overstates the product.
- **RECONSTRUCTION FOUND / CANON MISSING:** Learning & Practice; Network Enrichment; `RuleSet`
  knowledge layer; payer memory; `readiness.ts` four-dimension rule; `patientEducation` workstream;
  contradiction groups; financial education.
- **CANON CONTAINS / REPO NO LONGER SUPPORTS:** `actor.ts`'s "authentication does not exist" comment
  (retired by ADR-0011).
- **CONCEPT DISCUSSED / NOT YET EARNED:** the eight in §24.
- **IMPLEMENTED / PRODUCT TREE MISSING:** the five extra API-backed workspaces; the stale
  `IMPLEMENTATION_STATUS` claim about which surfaces are governed.

# 26. Open questions

1. Is Learning & Practice a module, a shared capability, or a second product? It observes work
   across every context.
2. Does the `RuleSet` layer become a governed service, and who approves a rule set?
3. Is Prescreen consolidated with Guided Intake, or do both persist?
4. Does Network Enrichment (1,719 contract lines, ADR-0019 Proposed) proceed or retire?
5. Does Collaborate exist? Without it, partners have no seat and referral is one-directional.
6. What is the authority grammar — the flat role list that exists, or SEE/DO/REVIEW/DECIDE/OWN
   which does not?
7. Do Trees 0–4 get standalone canon documents, or does Tree 4 remain "locked" without a
   definition of what is locked?

# 27. Things to see in the Experience Simulator before production build

1. Tree 4's six proof flows, executed — the only cross-module acceptance spec Clarity has.
2. A Case where governed and prototype data appear side by side, visually distinguished (Tree 0).
3. The same Case under three roles, showing visibility without authority (Tree 1).
4. Prescreen attest → submit → readiness, distinct from Guided Intake.
5. All 8 workstreams including `patientEducation`, one blocked, with the Case **not** blocked.
6. A Learning & Practice observation → coaching candidate → **contested** → resolved.
7. An Assurance evaluation returning `RIGHTS_RESTRICTED` and `STALE_SOURCE`.
8. A legal instrument driven by a versioned `RuleSet` with jurisdiction and effective date visible.
9. Payer memory shown as historical and unconfirmed, refused as verification.
10. The Day 1→39 longitudinal scenario with `UNKNOWN` states genuinely reachable.
11. A within-organization journey that states its scope and says records elsewhere are **unknown**.
12. Session expiry mid-work, and a facility scope change invalidating the current Case.

## Honesty statement

No code, schema or migration was changed to produce this document. Claims tagged **[RUNTIME]** rest
on code and tests I read; **[AUTHORED-CANON]** claims rest on documents I wrote this session and
carry the least independent weight. This reconstruction covers all 14 packages, 59 Prisma models,
26 app workspaces and all six trees, but it is a **structural** audit — it does not claim every
behavior within each context has been verified. Nothing here claims production readiness, HIPAA
compliance, PHI readiness, or approved clinical or legal rules.
