---
status: Phase 1 research executed — not reviewed, not a Clarity rule
version: 0.1.0
date_executed: 2026-09-12
executed_by: Tyler Hebert, using a deep-research tool outside this session (per docs/legal/GEMINI_DEEP_RESEARCH_PROMPT_CMS_MEDICARE_MEDICAID.md)
data_boundary: no patient data; regulatory text and citations only
classification_note: |
  This file answers OD-13's "whether to execute the research" question — the
  research has now been executed. It does NOT close OD-13: "who reviews its
  output before any of it informs a rule" remains open, and nothing here
  becomes a Clarity rule, validation rule, state-machine transition, role
  permission, or readiness criterion until an ADR closes both OD-2 (counsel
  review of Louisiana statutory wording) and OD-3 (clinical criteria
  licensing/governance). Citations below were produced by the executing
  tool's own web research, not independently re-verified line-by-line inside
  this repository session — treat "Confidence" fields as the tool's own
  self-assessment, not a Clarity-side verification result.
---

# Federal Regulatory Guidance Index and Interpretation Map for Clarity

**Purpose.** A durable, citable reference index of federal (and, where the
research surfaced it, Louisiana state) regulatory guidance bearing on the
workflows Clarity models — separating what is *binding* from what is *left to
organizational interpretation*. This is Phase 1 (reference acquisition); see
"What this does not establish" at the end of this file. Produced by executing
`docs/legal/GEMINI_DEEP_RESEARCH_PROMPT_CMS_MEDICARE_MEDICAID.md` in full.

The behavioral health regulatory landscape operates at the intersection of
acute emergency stabilization, stringent privacy boundaries, and highly
specialized reimbursement criteria. For an event-driven, tenant-scoped case
intelligence platform like Clarity, architectural compliance depends on
isolating binding regulatory mandates from the interpretive policy space left
to the implementing organization. This index covers the case repository,
immutable evidence tracking, authorization readiness, crisis prescreening, and
episode-owned utilization review — bounded by what Clarity actually does: it
does not submit claims, perform algorithmic clinical decision support, execute
OCR on clinical text, or interface directly with payers/HIEs.

## Section 1: Core Regulatory Reference Index

### A. EMTALA — emergency screening, stabilization, and transfer

EMTALA is the most aggressively enforced regulatory surface for any facility
managing acute psychiatric presentations. It applies to Medicare-participating
hospitals with dedicated emergency departments, explicitly including
specialized psychiatric intake/assessment units (CMS memorandum
QSO-19-15-EMTALA reaffirms psychiatric hospitals are not exempt). A central
tension is "boarding" — prolonged ED detention awaiting specialized inpatient
placement. For Clarity's packet-preparation/routing workflow, EMTALA's
sequencing must be respected: the medical screening examination (MSE) must
occur without delay, entirely divorced from manual insurance/benefits
verification.

#### CMS-A01
- **Requirement:** Medicare-participating hospitals with a dedicated ED (including psychiatric intake units) must provide a Medical Screening Examination (MSE) within the facility's capability to any individual requesting examination, without delaying the examination to inquire about payment status or insurance coverage.
- **Primary citation:** 42 CFR 489.24(a) and (d)(4); SOM Appendix V. https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-489/subpart-B/section-489.24
- **Effective/compliance date:** Currently in force.
- **Class:** BINDING-INTERPRETIVE
- **CoP or CoP-of-payment:** Participation
- **Clarity workflow:** Prescreen slice; Insurance and benefits verification
- **Organization must define:** Who qualifies as a "Qualified Medical Person" (QMP) authorized to perform the MSE, and what clinical components constitute an appropriate psychiatric MSE for the facility's routine capabilities.
- **Confidence:** High
- **Still open:** Counsel must verify Clarity's manual benefits-verification workflow is structurally gated/decoupled until the MSE is logged complete.

#### CMS-A02
- **Requirement:** An unstabilized patient with a psychiatric emergency medical condition (EMC) may only be transferred if the patient/representative requests it, or a physician (or QMP with physician countersignature) certifies in writing that the medical benefits of the receiving facility outweigh the increased transfer risks.
- **Primary citation:** 42 CFR 489.24(e)(1)(ii); SOM Appendix V.
- **Effective/compliance date:** Currently in force.
- **Class:** BINDING-SPECIFIC
- **CoP or CoP-of-payment:** Participation
- **Clarity workflow:** Packet preparation; Routing; Legal-status instruments
- **Organization must define:** The acceptable clinical format of the risk/benefit summary for psychiatric-specific transfers (the signature requirement itself is fully specified).
- **Confidence:** High
- **Still open:** Whether an electronic attestation in Clarity's packet prep satisfies "signed certification" prior to physical transit — needs MAC/state survey agency validation.

#### CMS-A03
- **Requirement:** A transferring hospital must send all available medical records related to the emergency condition — history, observations, preliminary diagnosis, test results, physician certification — to the receiving facility.
- **Primary citation:** 42 CFR 489.24(e)(2)(iii); SOM Appendix V.
- **Effective/compliance date:** Currently in force.
- **Class:** BINDING-SPECIFIC
- **CoP or CoP-of-payment:** Participation
- **Clarity workflow:** Documents and evidence; Packet preparation
- **Organization must define:** The exact compilation of documents constituting "all available medical records" for a psychiatric hold, mapped to Clarity's evidence categories.
- **Confidence:** High
- **Still open:** Whether Clarity's "named gaps" reporting should hard-stop on missing statutory records or remain advisory — needs counsel decision.

#### CMS-A04
- **Requirement:** A hospital with specialized capabilities (including psychiatric hospitals) and capacity must accept an appropriate transfer of an individual requiring those capabilities, when the transferring facility lacks capability to stabilize.
- **Primary citation:** 42 CFR 489.24(f); SOM Appendix V.
- **Effective/compliance date:** Currently in force.
- **Class:** BINDING-INTERPRETIVE
- **CoP or CoP-of-payment:** Participation
- **Clarity workflow:** Facility response; Acceptance
- **Organization must define:** How "capacity" (staffed vs. physical beds) and "capability" (e.g., ability to manage violent restraints, medical comorbidities) are dynamically defined and documented to defend any refusal.
- **Confidence:** High — "reverse dumping" is a primary enforcement focus for psychiatric facilities.
- **Still open:** How a facility using Clarity documents a capacity/capability-based rejection to survive a CMS EMTALA investigation.

#### CMS-A05
- **Requirement:** Hospitals must maintain a central log on each individual who comes to the ED seeking assistance, indicating whether they were treated, admitted, stabilized, transferred, or discharged.
- **Primary citation:** 42 CFR 489.20(r)(3); SOM Appendix V.
- **Effective/compliance date:** Currently in force.
- **Class:** BINDING-SPECIFIC
- **CoP or CoP-of-payment:** Participation
- **Clarity workflow:** Case repository (status lifecycle)
- **Organization must define:** Mapping Clarity's status-lifecycle states (intake, transfer complete, cancelled, etc.) to the required EMTALA log dispositions.
- **Confidence:** High — the central log is typically the first artifact requested in a CMS complaint survey.
- **Still open:** Whether Clarity's append-only audit trail/case repository can function as the legal "central log," or a separate master log must be kept in the EHR.

### B. Hospital Conditions of Participation (42 CFR 482)

The CoPs set baseline health/safety standards for Medicare/Medicaid
participation. Psychiatric hospitals face additional special conditions
("B-tags," §§482.61–482.62) demanding extensive documentation of treatment
degree/intensity. Clarity's immutable evidence binders and versioned documents
must accommodate strict reporting timelines (e.g., next-business-day
restraint/seclusion death reporting) and the two-physician UR committee
structure.

#### CMS-B01
- **Requirement:** Hospitals must report to CMS any death occurring while a patient is in restraint or seclusion, within 24 hours of removal (or one week if reasonably related), by telephone no later than close of the next business day, and document it in the medical record.
- **Primary citation:** 42 CFR 482.13(g).
- **Effective/compliance date:** Currently in force.
- **Class:** BINDING-SPECIFIC
- **CoP or CoP-of-payment:** Participation
- **Clarity workflow:** Episodes, utilization review, and audit (append-only corrections)
- **Organization must define:** The operational pathway for Quality Management/Nursing Supervisor to execute the telephonic report and log the exact timestamp.
- **Confidence:** High
- **Still open:** Ensure evidence/document versioning captures the death-report timestamp immutably without violating historical-record integrity.

#### CMS-B02
- **Requirement:** When restraint/seclusion manages violent or self-destructive behavior, the patient must be seen face-to-face within 1 hour of initiation by a physician or other trained licensed practitioner.
- **Primary citation:** 42 CFR 482.13(e)(12).
- **Effective/compliance date:** Currently in force.
- **Class:** BINDING-SPECIFIC
- **CoP or CoP-of-payment:** Participation
- **Clarity workflow:** Documents and evidence
- **Organization must define:** Which non-physician practitioners (e.g., properly trained RNs) are authorized by policy to perform the 1-hour assessment.
- **Confidence:** High — a central focus of B-tag surveyor enforcement.
- **Still open:** Whether the 1-hour assessment is a required evidence category before routing a transfer packet for highly acute patients.

#### CMS-B03
- **Requirement:** A UR committee of two or more practitioners (at least two doctors of medicine/osteopathy) must carry out the UR function; a "not medically necessary" determination must be preceded by consultation with the treating practitioner.
- **Primary citation:** 42 CFR 482.30(b) and (d).
- **Effective/compliance date:** Currently in force.
- **Class:** BINDING-SPECIFIC
- **CoP or CoP-of-payment:** Participation
- **Clarity workflow:** Episodes, utilization review, and audit
- **Organization must define:** UR committee composition and the internal mechanism for pre-denial attending-physician consultation.
- **Confidence:** High
- **Still open:** What UR metadata Clarity must expose in episode-owned UR tracking to demonstrate two-physician committee involvement.

#### CMS-B04
- **Requirement:** Hospitals must have an effective discharge-planning process; on transfer, all necessary medical information (current illness course, post-discharge goals, treatment preferences) must go to the receiving facility at time of discharge.
- **Primary citation:** 42 CFR 482.43(b) (CMS-3317-F revisions).
- **Effective/compliance date:** Currently in force (transfer protocols effective July 1, 2025).
- **Class:** BINDING-INTERPRETIVE
- **CoP or CoP-of-payment:** Participation
- **Clarity workflow:** Packet preparation; Routing; Transfer complete
- **Organization must define:** What documents constitute "necessary medical information" for varying levels of behavioral-health step-down/lateral transfer.
- **Confidence:** High
- **Still open:** What automated/manual checks should gate a "transfer complete" status transition on discharge-plan presence.

#### CMS-B05
- **Requirement:** Psychiatric hospitals (B-tags) must maintain medical records permitting determination of treatment degree/intensity, including a comprehensive psychiatric evaluation (medical history, physical/intellectual disabilities).
- **Primary citation:** 42 CFR 482.61(b); SOM Appendix AA.
- **Effective/compliance date:** Currently in force.
- **Class:** BINDING-INTERPRETIVE
- **CoP or CoP-of-payment:** Participation
- **Clarity workflow:** Documents and evidence
- **Organization must define:** Clinical templates ensuring every component of the psychiatric evaluation is documented.
- **Confidence:** High
- **Still open:** Since Clarity performs no OCR/AI inference on clinical content, human review must certify each evidence document fulfills §482.61(b).

### C. Medicare coverage and payment for inpatient psychiatric care

The CoP/Condition-of-Payment distinction is severe: failing a CoP triggers
remediation; failing a condition of payment means immediate claim denial and
recoupment. IPFs face a strict 12th-day recertification (not the general
20-day rule), and care must be "active treatment," not custodial. Louisiana's
MAC (Jurisdiction H) is Novitas Solutions.

#### CMS-C01
- **Requirement:** Medicare Part A pays for IPF services only if a physician certifies at admission (or as soon as reasonable) that services are required for active treatment/diagnostic study; first recertification is required by the 12th hospitalization day, then every 30 days.
- **Primary citation:** 42 CFR 424.14(a) and (d).
- **Effective/compliance date:** Currently in force.
- **Class:** BINDING-SPECIFIC
- **CoP or CoP-of-payment:** Payment
- **Clarity workflow:** Episodes, utilization review, and audit
- **Organization must define:** Operational alerts/triggers ensuring physician sign-off before the 12th-day deadline.
- **Confidence:** High — a heavily audited IPF-specific condition of payment.
- **Still open:** How Clarity's episode lifecycle visually tracks the 12-day clock and surfaces documentation gaps to UR.

#### CMS-C02
- **Requirement:** IPF PPS requires CoP (482.61) recordkeeping compliance for payment; care must meet "active treatment" (improving condition), not custodial care. Freestanding psychiatric hospitals face a 190-day Medicare lifetime limit.
- **Primary citation:** 42 CFR 412.404; Medicare Benefit Policy Manual (Pub. 100-02) Ch. 2.
- **Effective/compliance date:** Currently in force.
- **Class:** BINDING-INTERPRETIVE
- **CoP or CoP-of-payment:** Payment
- **Clarity workflow:** Documents and evidence; Utilization review
- **Organization must define:** Documentation standards proving "active treatment" (multidisciplinary plans, progress notes) for MAC audit defense.
- **Confidence:** High
- **Still open:** Whether Clarity's evidence taxonomy maps cleanly to the active-treatment artifacts needed for audit defense.

#### CMS-C03
- **Requirement:** Novitas Solutions' Local Coverage Determinations dictate specific medical-necessity requirements for psychiatric codes in Louisiana (LCD L35101, LCA A57130).
- **Primary citation:** Novitas LCD L35101; LCA A57130.
- **Effective/compliance date:** Currently in force.
- **Class:** BINDING-INTERPRETIVE
- **CoP or CoP-of-payment:** Payment
- **Clarity workflow:** Authorization readiness (preparation phase)
- **Organization must define:** Translation of LCD clinical criteria into the facility's internal "named gaps" checklist.
- **Confidence:** High — Novitas confirmed as Jurisdiction H MAC.
- **Still open:** Routine clinical-compliance review of Novitas LCD updates to keep Clarity's configured evidence categories current.

### D. Medicaid and the IMD exclusion

The IMD exclusion prohibits federal Medicaid match for adult (21–64)
psychiatric inpatient care in facilities over 16 beds — a foundational
constraint on the whole placement landscape. Louisiana holds a Section 1115
SMI/SUD waiver and has a pending Reentry waiver. Clarity's prescreen routing
hints must account for age, payer, target-facility IMD status, and waiver
applicability.

#### CMS-D01
- **Requirement:** The IMD exclusion prohibits federal Medicaid match for adult (21–64) inpatient psychiatric care in facilities over 16 beds, absent a waiver.
- **Primary citation:** Social Security Act §1905(a)(B).
- **Effective/compliance date:** Currently in force.
- **Class:** BINDING-SPECIFIC
- **CoP or CoP-of-payment:** Payment
- **Clarity workflow:** Prescreen slice (routing hints); Insurance and benefits verification
- **Organization must define:** Maintaining an accurate registry of target facilities' bed counts and IMD status.
- **Confidence:** High — foundational Medicaid statutory limitation.
- **Still open:** Whether "possible pathways" routing hints strictly filter out >16-bed IMDs for Medicaid adults 21–64, failing closed absent a logged waiver exception.

#### CMS-D02
- **Requirement:** Louisiana operates under a Section 1115 SUD/OUD demonstration waiver (Healthy Louisiana) providing IMD-exclusion exceptions under specific parameters; a Reentry Demonstration waiver for justice-involved individuals is pending.
- **Primary citation:** CMS-approved 1115 waivers (Louisiana), medicaid.gov demonstration list.
- **Effective/compliance date:** SUD waiver in force (expires Dec 31, 2027); Reentry waiver pending.
- **Class:** ORG-DISCRETION
- **CoP or CoP-of-payment:** Payment
- **Clarity workflow:** Authorization readiness; Prescreen routing hints
- **Organization must define:** Operational policy for which patients qualify under 1115 waiver criteria to permit IMD routing.
- **Confidence:** High, per medicaid.gov tracking as researched.
- **Still open:** Track Reentry waiver approval to potentially expand routing hints for justice-involved population.

#### CMS-D03
- **Requirement:** Medicaid MCOs must decide standard authorization requests within 14 calendar days, and expedited requests (life/health jeopardy) within 72 hours.
- **Primary citation:** 42 CFR 438.210(d).
- **Effective/compliance date:** Currently in force.
- **Class:** BINDING-SPECIFIC
- **CoP or CoP-of-payment:** Payment (applies to MCO, impacts provider)
- **Clarity workflow:** Episodes, utilization review, and audit
- **Organization must define:** Internal escalation when Healthy Louisiana MCOs miss the 72-hour expedited deadline for crisis placements.
- **Confidence:** High
- **Still open:** How Clarity surfaces aging authorization requests to trigger peer-to-peer review.

#### CMS-D04
- **Requirement:** For Medicaid beneficiaries under 21, EPSDT mandates comprehensive coverage; PRTF inpatient psychiatric services require independent-team certification of need.
- **Primary citation:** 42 CFR 441 Subpart D (§441.152).
- **Effective/compliance date:** Currently in force.
- **Class:** BINDING-SPECIFIC
- **CoP or CoP-of-payment:** Payment
- **Clarity workflow:** Documents and evidence; Packet preparation
- **Organization must define:** Composition of the independent certification team and PRTF-specific evidence templates in Clarity.
- **Confidence:** High
- **Still open:** Ensure authorization readiness distinguishes adult IPF vs. pediatric PRTF documentary requirements.

#### CMS-D05
- **Requirement:** ARP §9813 provides enhanced FMAP for qualifying community-based mobile crisis intervention services.
- **Primary citation:** Social Security Act §1947 (added by ARP §9813).
- **Effective/compliance date:** Currently in force.
- **Class:** BINDING-INTERPRETIVE
- **CoP or CoP-of-payment:** Payment
- **Clarity workflow:** Prescreen slice
- **Organization must define:** If mobile crisis teams use Clarity, they must document community-based location and multidisciplinary-team response to qualify for enhanced match.
- **Confidence:** Medium — implementation varies by state Medicaid agency.
- **Still open:** Verify how LDH incorporates ARP §9813 into its provider manuals.

### E. Prior authorization and interoperability

CMS-0057-F's operational mandates (decision timeframes, specific denial
reasons) became enforceable January 1, 2026; API mandates (FHIR PA API) take
effect January 1, 2027. Because Clarity captures authorization outcomes
manually rather than transmitting to payers, it must accommodate manual
transcription of specific denial reasons. Adjacent ASTP/ONC information
blocking rules bear on Clarity's fail-closed consent behavior.

#### CMS-E01
- **Requirement:** Impacted payers must send prior-authorization decisions within 72 hours (expedited) / 7 calendar days (standard), with a specific denial reason.
- **Primary citation:** CMS-0057-F; 89 FR 8758.
- **Effective/compliance date:** Operational timeframes/denial-reason requirements apply from January 1, 2026; API mandates from January 1, 2027.
- **Class:** BINDING-SPECIFIC
- **CoP or CoP-of-payment:** Payment (payer-side; impacts provider workflow)
- **Clarity workflow:** Episodes, utilization review, and audit
- **Organization must define:** Internal SLAs for escalating delayed authorization responses against the statutory clocks.
- **Confidence:** High — published final rule.
- **Still open:** How manual recording of authorization outcomes forces capture of the payer's specific denial reason, since Clarity has no direct payer-API interaction.

#### NON-CMS-E02
- **Requirement:** ASTP/ONC information-blocking rules prohibit practices likely to interfere with access/exchange/use of electronic health information, absent an applicable exception (e.g., preventing harm, privacy).
- **Primary citation:** 45 CFR Part 171.
- **Effective/compliance date:** Currently in force.
- **Class:** BINDING-INTERPRETIVE
- **CoP or CoP-of-payment:** Participation (OIG civil monetary penalties)
- **Clarity workflow:** Authentication and API; Documents and evidence; Prescreen slice (consent-authority)
- **Organization must define:** Documented reliance on the Privacy Exception or Preventing Harm Exception when Clarity's consent-authority evaluator deliberately fails closed and restricts transmission.
- **Confidence:** High — active OIG enforcement area.
- **Still open:** Counsel must verify the fail-closed design does not itself trigger information-blocking exposure.

### F. Quality reporting

#### CMS-F01
- **Requirement:** The IPFQR program requires submission of quality measures (including transition-of-care/follow-up-after-hospitalization) to avoid an annual payment-update reduction.
- **Primary citation:** 42 CFR 412.404; SSA §1886(s)(4).
- **Effective/compliance date:** Currently in force.
- **Class:** ORG-DISCRETION
- **CoP or CoP-of-payment:** Payment (penalty-based)
- **Clarity workflow:** Documents and evidence
- **Organization must define:** Evidence templates capturing transition-of-care/follow-up data needed for IPFQR abstraction.
- **Confidence:** High
- **Still open:** Since Clarity doesn't report directly to CMS, verify external quality-abstraction tools can access Clarity's immutable evidence.

### G. Program integrity and documentation sufficiency

#### CMS-G01
- **Requirement:** Medical records must have secure author identification and protected authentication integrity; corrections/amendments must be clearly identifiable with a reliable audit trail of the original entry, date, and author of the alteration.
- **Primary citation:** 42 CFR 482.24(b); Medicare Program Integrity Manual (Pub. 100-08) Ch. 3.
- **Effective/compliance date:** Currently in force.
- **Class:** BINDING-SPECIFIC
- **CoP or CoP-of-payment:** Both
- **Clarity workflow:** Episodes, utilization review, and audit (append-only corrections)
- **Organization must define:** Policy validating that Clarity's append-only model (metadata carries hashes/field names, not source text) satisfies the org's interpretation of a "legal medical record" amendment.
- **Confidence:** High
- **Still open:** Counsel must confirm Clarity's immutability/append-only audit design aligns with Pub. 100-08 amendment rules.

### H. Privacy and consent (non-CMS)

HIPAA permits TPO disclosure of PHI without specific consent; 42 CFR Part 2
has historically been stricter for SUD records. The 2024 final rule
(effective April 16, 2024; compliance required February 16, 2026) aligns Part
2 much more closely with HIPAA — a single prior consent can now cover future
TPO disclosures, and strict segregation of Part 2 data is no longer required
(though SUD counseling notes still need separate consent). This bears
directly on Clarity's fail-closed consent-authority evaluator.

#### NON-CMS-H01
- **Requirement:** Under the 2024 Part 2 final rule, SUD records can be used/disclosed for TPO based on a single prior patient consent; receiving-entity segregation is no longer strictly required, though SUD counseling notes still require separate specific consent.
- **Primary citation:** 42 CFR Part 2 (89 FR 12472).
- **Effective/compliance date:** Effective April 16, 2024; compliance required by February 16, 2026 (currently in force).
- **Class:** BINDING-SPECIFIC
- **CoP or CoP-of-payment:** Participation (civil/criminal penalties aligned with HIPAA)
- **Clarity workflow:** Prescreen slice (consent-authority evaluator)
- **Organization must define:** Consent-collection forms meeting the new TPO standard; staff training on identifying separately maintained SUD counseling notes.
- **Confidence:** High — recent SAMHSA final rule.
- **Still open:** Map the new TPO single-consent logic into Clarity's configured consent-authority rules engine, which currently fails closed on missing/overlapping consent rules.

#### NON-CMS-H02
- **Requirement:** HIPAA Privacy/Security Rules govern the minimum-necessary standard; treatment-purpose disclosures are broadly excepted; state law may be more restrictive.
- **Primary citation:** 45 CFR Parts 160 and 164.
- **Effective/compliance date:** Currently in force.
- **Class:** BINDING-INTERPRETIVE
- **CoP or CoP-of-payment:** N/A (OCR enforcement)
- **Clarity workflow:** Case repository; Authentication and API
- **Organization must define:** RBAC (sourced from the database) mapped to the minimum-necessary standard.
- **Confidence:** High
- **Still open:** Validation of the synthetic-data-only boundary before any production launch.

#### NON-CMS-H03
- **Requirement:** ACA §1557 requires meaningful access for limited-English-proficiency individuals and effective communication for people with disabilities.
- **Primary citation:** 45 CFR Part 92.
- **Effective/compliance date:** Currently in force.
- **Class:** BINDING-INTERPRETIVE
- **CoP or CoP-of-payment:** Participation (OCR enforcement)
- **Clarity workflow:** Prescreen slice (orientation assessment, willingness capture)
- **Organization must define:** How language-access services are procured and documented during the crisis prescreen encounter.
- **Confidence:** High
- **Still open:** Whether Clarity needs a field recording certified-interpreter use during prescreen.

#### NON-CMS-H04
- **Requirement:** MHPAEA requires non-quantitative treatment limitations (e.g., prior-auth requirements) on mental-health benefits to be no more stringent than on medical/surgical benefits.
- **Primary citation:** 45 CFR 146.136 (DOL, HHS, Treasury).
- **Effective/compliance date:** Currently in force.
- **Class:** BINDING-INTERPRETIVE
- **CoP or CoP-of-payment:** N/A
- **Clarity workflow:** Authorization readiness
- **Organization must define:** Escalation/reporting for payer authorization hurdles that may violate parity law.
- **Confidence:** High
- **Still open:** Tracking payer denial trends in Clarity's authorization outcomes to support MHPAEA comparative-analysis reporting.

### I. Telehealth

#### CMS-I01
- **Requirement:** Telehealth flexibilities for buprenorphine initiation/psychiatric assessment have been made permanent under certain rules, but state law heavily regulates modality. In Louisiana, if the initial PEC examination is conducted via telehealth, the subsequent 72-hour coroner examination must be in-person.
- **Primary citation:** LA RS 28:53(B)(2)(b) and (c); SAMHSA 42 CFR Part 8 final rule.
- **Effective/compliance date:** Currently in force.
- **Class:** BINDING-SPECIFIC
- **CoP or CoP-of-payment:** Participation (state civil-rights requirement)
- **Clarity workflow:** Legal-status instruments; Prescreen slice
- **Organization must define:** Tagging the modality (telehealth vs. in-person) of the initial evaluation so the subsequent evaluation complies with the alternating-modality requirement.
- **Confidence:** High — explicit in Louisiana statute.
- **Still open:** Ensure Clarity's form replication captures/surfaces the modality flag to prevent illegal telehealth stacking.

### J. Other facility and provider types

#### CMS-J01
- **Requirement:** CMHCs and CCBHCs must meet specific CoPs to participate in Medicare, including partial hospitalization services and 24/7 crisis intervention.
- **Primary citation:** 42 CFR 485 Subpart J.
- **Effective/compliance date:** Currently in force.
- **Class:** BINDING-INTERPRETIVE
- **CoP or CoP-of-payment:** Participation
- **Clarity workflow:** Prescreen slice (target-scoped packet-readiness)
- **Organization must define:** If a CMHC is a placement target, routing hints must understand its specific licensing capability (partial hospitalization vs. acute inpatient).
- **Confidence:** High
- **Still open:** Mapping the evidence gaps CMHCs require for acceptance, vs. standard IPFs.

## Section 2: Surfaces we missed

Given Clarity's Louisiana crisis-placement focus, the research also
surfaced state-level surfaces not in the original scaffold:

#### NON-CMS-M01
- **Requirement:** LDH discharge-planning notification — facilities discharging a patient admitted under a PEC must notify any currently treating behavioral-health professional (absent patient objection) and provide a summary to the receiving follow-up provider within 24 hours of discharge.
- **Primary citation:** LA RS 28:53.1.
- **Effective/compliance date:** Currently in force.
- **Class:** BINDING-SPECIFIC
- **CoP or CoP-of-payment:** Participation (state licensing)
- **Clarity workflow:** Case repository (closed status)
- **Organization must define:** SOP for identifying existing providers and transmitting the required summary post-discharge.
- **Confidence:** High — explicit state statutory requirement for PEC discharges.
- **Still open:** How the 24-hour follow-up notification is logged as immutable evidence in Clarity's closed-case state.

#### CMS-M02
- **Requirement:** Louisiana PEC/CEC involuntary-hold clocks — a patient may be held up to 72 hours under a PEC; within that window, a coroner or secondary physician must independently examine the patient to issue a CEC, permitting an involuntary hold up to 15 total days.
- **Primary citation:** LA RS 28:53.
- **Effective/compliance date:** Currently in force.
- **Class:** BINDING-SPECIFIC
- **CoP or CoP-of-payment:** Participation (state law; false-imprisonment liability)
- **Clarity workflow:** Legal-status instruments
- **Organization must define:** Escalation/alerting protocols as the 72-hour clock approaches expiration without a registered CEC.
- **Confidence:** High — foundational Louisiana behavioral-health law.
- **Still open:** Confirm Clarity's workflow visually surfaces the exact PEC expiration timestamp to routing/packet-prep teams.

## Section 3: Contradictions and tensions

Surfaced for organizational counsel to resolve via internal policy — **not**
resolved automatically by Clarity:

1. **EMTALA mandates vs. IMD exclusion constraints.** EMTALA requires
   stabilizing treatment, often via inpatient psychiatric admission; the IMD
   exclusion restricts bed availability for Medicaid adults 21–64 at
   facilities over 16 beds absent a waiver. A hospital may face a stabilizing
   transfer obligation to a facility Medicaid won't pay.
2. **Involuntary-hold clocks vs. payer-authorization clocks.** A Louisiana PEC
   gives a strict 72-hour hold window; CMS-0057-F gives payers up to 72 hours
   to decide an expedited prior-authorization request. The legal authority to
   hold may expire exactly as the payer authorizes transfer.
3. **EMTALA information-transfer vs. privacy frameworks.** EMTALA requires
   sending all available medical records to effect a safe transfer; Part 2
   historically restricted SUD-data transfer (though the 2024 alignment on
   TPO consent mitigates much of this).
4. **"Reverse dumping" vs. bed-management autonomy.** EMTALA requires
   specialized facilities with capacity to accept appropriate transfers; an
   open physical bed doesn't automatically mean capability/capacity (e.g.,
   staffing shortages), but declaring a lack of capacity requires rigorous
   real-time documentation or the refusal risks a reverse-dumping citation.

## Section 4: The interpretation map

| Clarity workflow | Regulatory obligation | What the organization must define and document |
|---|---|---|
| Case repository & status | EMTALA central log (489.20) | Map status lifecycle to required EMTALA log dispositions; decide if Clarity is the primary legal log |
| Documents & evidence | Psych CoP records (482.61) | Clinical templates fulfilling the psychiatric-evaluation CoP in the immutable evidence locker |
| Documents & evidence | Discharge info (482.43) | Exactly which documents constitute "necessary medical information" for CMS-3317-F |
| Insurance & benefits | EMTALA MSE priority (489.24) | Sequencing policy so benefits verification doesn't start before MSE is documented complete |
| Auth readiness | LCD adherence (Novitas) | Translate L35101/A57130 criteria into the internal "named gaps" checklist |
| Auth readiness | Payer SLA escalation (CMS-0057-F) | Escalation protocol for 72-hour/7-day payer response violations |
| Prescreen slice | IMD exclusion routing | Registry of target facilities' bed counts and waiver status kept current |
| Prescreen slice | Part 2 consent evaluator | Map the 2024 single-TPO-consent rule into the consent-authority rules engine; define exactly when a consent gap forces a hard stop |
| Legal-status instruments | EMTALA cert. format (489.24) | Acceptable textual format for the physician risk/benefit summary |
| Legal-status instruments | LA PEC/CEC management | Alerting for the 72-hour PEC clock and the telehealth/in-person alternation rule |
| Episodes, UR, & audit | 12th-day recertification (424.14) | Operational trigger for physician sign-off before the 12th day |
| Episodes, UR, & audit | UR committee (482.30) | Committee composition and pre-denial consultation documentation |
| Episodes, UR, & audit | Restraint death reporting (482.13) | SOP for next-business-day CMS telephonic report and Clarity timestamp |

## Section 5: Top 10 by consequence

1. EMTALA appropriate transfer & reverse dumping (42 CFR 489.24) — shapes the entire routing/facility-response architecture.
2. Louisiana PEC/CEC 72-hour clock (LA RS 28:53) — a strict legal timer independent of operational delay; failure risks false-imprisonment liability.
3. 42 CFR Part 2 (89 FR 12472) — drives the consent-authority evaluator's fail-closed design; a misconfiguration violates federal privacy law.
4. IPF 12th-day physician recertification (42 CFR 424.14) — a rigid condition of payment; a missed signature forfeits subsequent inpatient days financially.
5. EMTALA central log requirements (42 CFR 489.20) — Clarity's state-machine transitions must mirror the statutory log dispositions surveyors audit first.
6. Medicaid IMD exclusion (SSA §1905) — shapes prescreen routing hints; a bad suggestion wastes critical crisis time.
7. Prior-auth timeframes (CMS-0057-F) — the 72-hour expedited window races against the 72-hour PEC hold.
8. Discharge-planning information transfer (42 CFR 482.43) — Clarity's "named gaps" feature is the primary compliance shield here.
9. Restraint/seclusion death reporting (42 CFR 482.13) — the append-only audit trail must flawlessly capture the report timestamp to survive an immediate-jeopardy survey.
10. Medical record integrity (Pub. 100-08) — Clarity's append-only/hash-metadata correction model must satisfy this manual's definition of a legal amendment.

## What this does not establish

Per this repository's truth-discipline rules, and stated here so the output
is not over-read later:

- Research output is **reference material**, not a Clarity rule. Nothing here
  becomes a validation rule, a state-machine transition, a role permission,
  or a readiness criterion without an ADR and the closure of **OD-2** (counsel
  review) and **OD-3** (clinical licensing review).
- The *text* of a regulation, cited to a primary source, may be recorded as
  `Verified` for what it says. Any mapping of that text onto Clarity's
  workflows is **`Derived`** and requires named human review before it can
  support an implementation claim.
- This produces no claim of HIPAA compliance, CMS compliance, certification
  readiness, survey readiness, or production readiness — and creates no
  approved clinical or legal rule content.
- Clarity holds synthetic data only and is not a deployed clinical system.
- Citations and dates above were not independently re-fetched/re-verified by
  Claude inside this repository session; they carry the executing tool's own
  research and self-assessed confidence only.
