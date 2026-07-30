---
status: Proposed research prompt — not executed, not reviewed
version: 0.1.0
data_boundary: no patient data; regulatory text only
authored_by: Claude (session 2026-07-29), at owner request
classification_note: |
  Section 1's platform description is Owner Defined / Verified from the
  repository. Section 2's enumeration of regulatory surfaces is AUTHORED FROM
  MODEL KNOWLEDGE and is therefore `Assumed` under
  docs/discovery/DISCOVERY_CLASSIFICATION_STANDARD.md — it is a starting
  scaffold to be confirmed, corrected, and EXTENDED by the research, not a
  verified inventory. Nothing produced by this research becomes a Clarity rule
  until OD-2 (counsel review) and OD-3 (clinical licensing review) are closed.
---

# Deep Research Prompt — CMS / Medicare / Medicaid Guidance Surface for Clarity

**Purpose.** Build a durable, citable reference index of federal regulatory
guidance that bears on the workflows Clarity models, and — critically —
separate what is *binding* from what is *left to organizational
interpretation*. That separation is the deliverable that matters: it is the
scaffold the Phase 2 per-organization policy index hangs on (see
`docs/decisions/ORG_POLICY_INDEX_DECISION_PACKET.md`).

**This is Phase 1 (reference acquisition).** It produces a reference, not
compliance. See "What this does not establish" at the end of this file.

Paste everything below the line into Gemini Deep Research (or an equivalent
deep-research tool) as a single prompt.

---

## ROLE AND CONTEXT

You are conducting federal regulatory research to support a software team
building "Clarity," a behavioral-health case-intelligence platform focused on
crisis placement in Louisiana. Your job is to produce a **structured reference
index of federal guidance**, with primary-source citations, that distinguishes
binding requirements from interpretive guidance from areas deliberately left
to each provider organization's own policies and procedures.

Read Section 1 carefully before researching. Clarity's scope is narrower than
a typical EHR or utilization-management system, and research aimed at the
wrong scope will be useless. In particular, do **not** research claims
submission, coding/billing mechanics, or clinical decision algorithms — the
system does none of those.

### What Clarity currently does (verified from the codebase, treat as ground truth)

- **Case repository and command service.** A tenant-scoped behavioral-health
  case with a status lifecycle (intake → documents → evidence → clinical /
  legal / benefits review → authorization preparation → packet preparation →
  routing → facility response → acceptance → transport → handoff → transfer
  complete → closed), plus explicit exception paths (information incomplete,
  no placement found, referred to alternative level of care, medical transfer
  required, cancelled, withdrawn). Eight parallel workstreams track
  independently.
- **Documents and evidence.** Versioned documents; evidence items bind
  *verbatim source text* to an exact document version and are immutable by
  construction. Every evidence item starts as a candidate and requires human
  review scoped by category. Contradictions between evidence items are made
  visible without being resolved automatically.
- **Insurance and benefits verification.** Entirely human-performed. No X12,
  no payer APIs, no eligibility clearinghouse. Benefit quotes cannot be
  recorded without a not-a-payment-guarantee disclaimer. Member/group/policy
  identifiers are structurally rejected as input and stored nowhere.
- **Authorization readiness (preparation phase only).** Records whether
  authorization is required, derived from a cited benefit quote; tracks
  preparation status and named gaps. It deliberately produces **no aggregate
  readiness score**. Submission to a payer is structurally unreachable in the
  current build.
- **Prescreen slice.** A crisis prescreen encounter with a four-domain
  orientation assessment, willingness capture, attestation, supplements, and
  a target-scoped packet-readiness view that reports *named gaps* rather than
  a score. It derives "possible pathways" as routing hints only — never
  decisions — with medical-stabilization precedence. Consent-authority and
  transport-qualification evaluators run over configured rules and **fail
  closed** on missing privacy regime, overlapping consent rules, unresolved
  transport restrictions, or missing sending/receiving facility approval.
  Submission records *intent only*: no acknowledgement, review, acceptance,
  admission, or transport authority is expressible, and cross-organization
  submission is structurally impossible today.
- **Legal-status instruments.** Louisiana OBH involuntary-commitment forms
  (OPC / PEC / CEC — see the companion prompt
  `GEMINI_DEEP_RESEARCH_PROMPT_LA_OPC_PEC_CEC.md`). Clarity captures data and
  reproduces the official form; it does not alter the legal effect of the
  instrument.
- **Episodes, utilization review, and audit.** Episode-owned utilization
  review, authorization outcomes, documentation gaps, append-only
  corrections, and an append-only audit trail whose metadata carries hashes
  and field names — never source text or file bytes.
- **Authentication and API.** Server-side sessions; roles sourced from the
  database. One same-organization HTTP slice exists.

### What Clarity explicitly does NOT do (do not research these)

It does not submit claims or generate bills; does not run OCR, extraction, or
AI inference on clinical content; does not make or recommend clinical
decisions; does not transmit anything to a payer, HIE, or another
organization; does not diagnose; does not compute a placement or acceptance
decision; is not deployed; and contains only synthetic data. There is no
production system, no external integration, and no claim of HIPAA compliance.

**Therefore:** research the *requirements that would constrain these
workflows and the records they produce*, and the *organizational policy
obligations* they imply. Do not research payer-side claim adjudication
mechanics.

## SECTION 2 — REGULATORY SURFACES TO COVER

This enumeration was authored from model knowledge and is an **unverified
starting scaffold**. Confirm each item exists and is current, correct
anything wrong, and **actively search for material surfaces this list
misses** — report those in a dedicated "Surfaces we missed" section. Cite
everything with a URL and retrieval date, and prefer primary sources
(eCFR, the Federal Register, CMS manuals on cms.gov, the CMS State
Operations Manual) over secondary commentary.

Where a rule has a compliance date, state it explicitly and say whether it is
already in force as of the retrieval date.

### A. EMTALA — emergency screening, stabilization, and transfer

Likely the single most relevant surface for a placement platform.

1. 42 CFR 489.24 and the State Operations Manual **Appendix V**. Cover:
   medical screening examination; what "stabilized" means for a
   *psychiatric* emergency specifically; the "appropriate transfer"
   requirements and the physician certification of benefits vs. risks; the
   obligation to send records with the patient; the **recipient hospital's
   duty to accept** an appropriate transfer when it has specialized
   capabilities ("reverse dumping"); the central log; on-call roster
   obligations; and signage/whistleblower provisions.
2. What documentation must exist at the *sending* facility at the moment of
   transfer, and what must accompany the patient. Map this against a
   "placement packet" concept.
3. Whether EMTALA obligations attach to a *prescreen* performed before the
   patient presents, or performed by a non-hospital crisis entity.
4. Any CMS guidance on EMTALA and behavioral-health boarding in emergency
   departments, and on transfer of patients under involuntary hold.

### B. Hospital Conditions of Participation (42 CFR 482)

5. **§482.13 patient rights** — including restraint and seclusion standards
   and the requirement to report deaths associated with restraint/seclusion
   to CMS; patient participation in care planning; advance directives.
6. **§482.24 medical records** — content, authentication/signature,
   retention, and timeliness.
7. **§482.30 utilization review** — the UR plan, who may make determinations,
   and what must be documented.
8. **§482.43 discharge planning** (as revised by CMS-3317-F) — the discharge
   planning process, patient/representative involvement, and the requirement
   to transfer necessary medical information to the receiving facility.
9. **§482.61 and §482.62 — special conditions for psychiatric hospitals**
   (the "B-tags"): medical records, individualized treatment plans, progress
   notes, and staffing requirements.
10. State Operations Manual **Appendix A** (hospitals) and **Appendix AA**
    (psychiatric hospitals) — the interpretive guidelines and survey
    procedures, which is where most of the *interpretation space* lives.

### C. Medicare coverage and payment for inpatient psychiatric care

11. Inpatient Psychiatric Facility PPS — 42 CFR 412 Subpart N.
12. **Physician certification and recertification** — 42 CFR 424.14
    specifically for inpatient psychiatric hospital services: who certifies,
    when, what the certification must state, and recertification intervals.
13. Medicare Benefit Policy Manual (Pub. 100-02) Chapter 2 (inpatient
    psychiatric hospital services) — active-treatment requirement, and the
    **190-day lifetime limit** for freestanding psychiatric hospitals.
14. The distinction between a freestanding psychiatric hospital and a
    distinct-part psychiatric unit, and whether it changes documentation or
    certification obligations.
15. Local Coverage Determinations / Articles applicable to Louisiana — the
    MAC for Louisiana is understood to be **Novitas Solutions (Jurisdiction
    H)**; confirm this and identify any LCD/LCA on inpatient psychiatric
    admission, medical necessity, or partial hospitalization.

### D. Medicaid — including the IMD exclusion

16. The **IMD exclusion** (Institutions for Mental Diseases) for adults aged
    21–64: statutory basis, the 16-bed threshold, and what it means for
    placement options. This is high priority — it materially shapes which
    facilities are viable for which patients.
17. **Section 1115 SMI/SED demonstration waivers** permitting federal
    Medicaid payment for short-term IMD stays — the current CMS policy
    posture, required milestones, and **Louisiana's specific waiver status**.
18. Medicaid managed care — 42 CFR Part 438, especially **§438.210**
    (authorization of services, decision timeframes, notice requirements) and
    §438.400 et seq. (grievances and appeals, adverse benefit
    determinations).
19. EPSDT obligations for beneficiaries under 21, and Psychiatric Residential
    Treatment Facility requirements (42 CFR 441 Subpart G) if minors are in
    scope.
20. American Rescue Plan §9813 qualifying community-based **mobile crisis
    intervention services** (enhanced FMAP) — requirements and current status.
21. Louisiana-specific: Healthy Louisiana managed-care organization
    authorization requirements and any LDH Medicaid provider manual chapters
    governing behavioral-health admission, prescreening, or transfer.

### E. Prior authorization and interoperability — time-critical

22. **CMS-0057-F** (Interoperability and Prior Authorization Final Rule).
    Cover the Patient Access, Provider Access, Payer-to-Payer, and **Prior
    Authorization APIs**; the decision timeframes for expedited vs. standard
    requests; the requirement to communicate a **specific denial reason**;
    and public reporting of prior-authorization metrics. Our understanding is
    that operational requirements (timeframes, denial reasons) applied from
    **1 January 2026** and API requirements from **1 January 2027** —
    **confirm both dates and state what is in force now.** Identify which
    payer types are in scope and which are not.
23. CMS-9115-F (Interoperability and Patient Access) — what remains in force.
24. Adjacent but not CMS: ASTP/ONC **information blocking** (45 CFR Part 171)
    and its exceptions, and TEFCA participation. Label these clearly as
    non-CMS.

### F. Quality reporting

25. The **Inpatient Psychiatric Facility Quality Reporting (IPFQR)** program
    — the current measure set, and specifically any measure requiring
    documentation of follow-up after hospitalization or **transfer of health
    information** at discharge, since those imply data Clarity would need to
    capture.

### G. Program integrity and documentation sufficiency

26. Medicare Program Integrity Manual (Pub. 100-08) — medical record
    documentation expectations for establishing medical necessity, signature
    requirements (including electronic signatures and attestation), and
    amendment/correction/addendum rules for medical records. Clarity's
    append-only correction model must be checked against these.
27. The distinction between **conditions of participation** and **conditions
    of payment**, and which of the above is which. This distinction changes
    the consequence of non-conformance and should be stated for every item.

### H. Privacy and consent — flag clearly as non-CMS where applicable

28. **42 CFR Part 2** (confidentiality of substance use disorder patient
    records), including the 2024 final rule aligning Part 2 more closely with
    HIPAA — consent content requirements, redisclosure limits, and the
    segregation question. This bears directly on Clarity's consent-authority
    evaluator.
29. HIPAA Privacy and Security Rules (45 CFR Parts 160 and 164) only insofar
    as they govern **disclosures for treatment/placement coordination**,
    minimum necessary, and the treatment exception — plus how they interact
    with Part 2 and with state law that is more protective.
30. Section 1557 of the ACA, and language-access / effective-communication
    obligations at intake.
31. MHPAEA parity (Departments of Labor, HHS, and Treasury) — the
    non-quantitative treatment limitation comparative-analysis requirement,
    to the extent it constrains authorization practices. Label as non-CMS.

### I. Telehealth

32. Current CMS policy on behavioral-health services furnished via
    telehealth — what is permanent versus time-limited, and any in-person
    requirement — since prescreen may occur remotely.

### J. Other facility and provider types

33. Community Mental Health Center conditions (42 CFR 485 Subpart J) and
    Certified Community Behavioral Health Clinic requirements, to the extent
    either could be a Clarity tenant or a placement target.

## SECTION 3 — THE CLASSIFICATION THAT MATTERS MOST

For **every** requirement you report, assign exactly one:

| Class | Meaning |
|---|---|
| **BINDING-SPECIFIC** | The regulation states a specific, testable obligation (a deadline, a required data element, a required signature, a numeric threshold). Little interpretation space. |
| **BINDING-INTERPRETIVE** | The obligation is binding but stated as a standard or outcome ("appropriate," "adequate," "timely," "individualized"). The organization must define how it meets it. |
| **ORG-DISCRETION** | CMS expects a policy or procedure to exist but does not dictate its content. |
| **NOT-APPLICABLE** | Surfaced during research but does not bear on Clarity's scope — say why in one line. |

For everything classified **BINDING-INTERPRETIVE** or **ORG-DISCRETION**,
additionally answer: *what specifically would an individual organization have
to decide, write down, and be able to show a surveyor?* Be concrete. This
field is the direct input to Phase 2 and is the most valuable part of your
output.

Also flag, for each item, whether conformance is a **condition of
participation** (survey/certification consequence) or a **condition of
payment** (claim/audit consequence), or both.

## SECTION 4 — OUTPUT FORMAT REQUIRED

Produce one record per requirement, with a stable identifier so it can be
referenced later:

- **ID:** `CMS-<surface letter><sequence>` (e.g. `CMS-A03`)
- **Requirement:** one or two sentences, in plain language
- **Primary citation:** exact CFR section, manual chapter/section, or Federal
  Register document number — plus full URL and retrieval date
- **Effective / compliance date:** and whether in force as of retrieval
- **Class:** BINDING-SPECIFIC | BINDING-INTERPRETIVE | ORG-DISCRETION |
  NOT-APPLICABLE
- **CoP or CoP-of-payment:** participation | payment | both
- **Which Clarity workflow it touches:** name it from Section 1's list
- **What the organization must define itself:** concrete, or "nothing — fully
  specified"
- **Confidence:** High / Medium / Low, with one sentence why
- **Still open:** what a human (counsel, compliance officer, MAC, LDH
  contact) would need to confirm in writing

Then provide, as separate closing sections:

1. **Surfaces we missed** — anything material not in Section 2's scaffold,
   with the same record structure. Treat a short list here as a signal you
   did not search hard enough.
2. **Contradictions and tensions** — any place where two federal
   requirements, or a federal and a Louisiana requirement, pull in different
   directions (for example: EMTALA transfer obligations versus involuntary-hold
   timing, or Part 2 consent versus care-coordination disclosure). Do not
   resolve these; surface them.
3. **The interpretation map** — the consolidated list of everything an
   adopting organization must decide for itself, grouped by Clarity workflow.
   This is the Phase 2 scaffold; make it clean and complete.
4. **Top 10 by consequence** — ranked by what would most change how Clarity
   must behave, with one line each on why.

## SECTION 5 — RULES

- **Do not fabricate a citation.** If you cannot find a primary source, say
  so explicitly. A gap honestly reported is more useful than a plausible
  guess.
- **Do not issue legal or clinical opinions**, and do not state whether
  Clarity is or would be compliant. Report what the regulation requires; stop
  there.
- **Do not infer a requirement from secondary commentary** without saying
  that is what you did and flagging Confidence: Low.
- **Prefer eCFR and cms.gov over anything else.** Note the "current as of"
  date shown by eCFR.
- Where a requirement applies only to a specific provider type, payer type,
  age band, or state, **say so precisely** — over-generalized requirements
  are worse than none.
- Distinguish clearly between **CMS** sources and adjacent federal sources
  (SAMHSA, OCR, ASTP/ONC, DOL, FDA). The request is CMS-centered but
  neighbouring surfaces matter; label them.

---

## What this does not establish

Per this repository's truth-discipline rules, and stated here so the output is
not over-read later:

- Research output is **reference material**, not a Clarity rule. Nothing here
  becomes a validation rule, a state-machine transition, a role permission, or
  a readiness criterion without an ADR and the closure of **OD-2** (counsel
  review) and **OD-3** (clinical licensing review).
- The *text* of a regulation, cited to a primary source, may be recorded as
  `Verified` for what it says. Any mapping of that text onto Clarity's
  workflows is **`Derived`** and requires named human review before it can
  support an implementation claim.
- This produces no claim of HIPAA compliance, CMS compliance, certification
  readiness, survey readiness, or production readiness — and creates no
  approved clinical or legal rule content.
- Clarity holds synthetic data only and is not a deployed clinical system.
