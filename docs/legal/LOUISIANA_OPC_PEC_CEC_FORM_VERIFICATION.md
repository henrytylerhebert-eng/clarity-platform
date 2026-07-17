# Louisiana OPC / PEC / CEC — Form-Level Verification Memo

**Date:** 2026-07-17
**Purpose:** Verify the "Louisiana OPC, PEC, and CEC Legal Accuracy, Workflow Design, Accessibility, and Implementation Readiness Review" against (a) the actual official OBH form PDFs supplied as ground truth, and (b) primary statutory text retrieved on the date above. This memo records what is confirmed, what needs correction, and what the review missed. It is not legal advice; all statutory timing, trigger events, e-signature validity, and attestation language remain subject to counsel validation.

**Ground-truth artifacts inspected:**

| Form | Revision on face of form | File |
|---|---|---|
| OBH-1 (PEC) — Physician's Emergency Certificate | Rev. 08/2025 | `OBH_1Physicians_Emergency_Certificate.pdf-7.pdf.pdf` |
| OBH-20 — Order for Protective Custody | Rev. 03/2017 | `OBH 20 Order for Protective Custody.pdf` |
| OBH-2 (CEC) — Coroner's Emergency Certificate | Rev. 05/2017 | `OBH 2 Coroner's Emergency Certificate.pdf` |

**Statutory sources checked (2026-07-17):** La. R.S. 28:53 and 28:53.2 (FindLaw compilation), La. R.S. 28:52.4 (FindLaw compilation), enrolled 2025 HB 137 (Act 148) from legis.la.gov. Counsel must confirm no later-session amendments; the FindLaw currency lines are ambiguous and the enrolled act is the only text verified against the official legislature source.

---

## 1. Core claims CONFIRMED against form and statute

### 1.1 The 8-hour vs 12-hour OPC examination conflict is real
- **OBH-20 (Rev. 03/2017), verbatim:** "This order for custody shall be effective for seventy-two hours from its issuance and shall be delivered to the Director of the treatment facility or to the coroner's office by the individual who has transported the patient. The person in custody shall be examined within eight hours of his/her arrival, or be released."
- **R.S. 28:53.2(D), verbatim:** "The person in custody shall be examined within twelve hours of his arrival at the treatment facility or coroner's office or he shall be released."
- The review's dual-alert recommendation (statutory 12-hour timer, escalation warning ahead of the 8-hour form deadline, no alteration of the generated form text) stands.

### 1.2 The 12-hour transport/delivery deadline is statutory — but NOT printed on the form
- **R.S. 28:53.2, verbatim:** "Without delay, and in no event more than twelve hours after being taken into protective custody, the person shall be delivered to a treatment facility or the office of the coroner."
- The OBH-20 form contains **no transport deadline of any kind**. TRC-002's "Official Form Auth: OBH-20 Rev 03/17" is wrong as to the deadline; the source is statute only. The form provides only `DATE:` / `TIME TAKEN INTO CUSTODY:` / `Officer's Signature` fields to anchor that clock.

### 1.3 72-hour OPC validity — confirmed on both form and statute
Form and R.S. 28:53.2 agree the order is effective for seventy-two hours from issuance.

### 1.4 The "28 Day" checkbox conflict is real
- **OBH-1 (Rev. 08/2025)** still prints the checkbox "Substance Abuse (28 Day)" and its header instruction still reads: "for a period not to exceed 15 days, or 28 days, for substance abuse (Title 28:52.4)."
- **R.S. 28:52.4(A)** contains **no 28-day period anywhere**; it authorizes detention "for a medically necessary period" on request of "a parent, spouse, legal guardian, or the major child of the person if that child has attained the age of eighteen years."
- Note this conflict is on **OBH-1 Rev. 08/2025 itself** — the most recently revised form in the set — not only on the older OBH-1A. LDH re-issued the PEC form in 08/2025 (post-Act 369 of 2017) without fixing it. The review's TRC-007 attributes the checkbox only to OBH-1A; correct it to cover both.
- The prohibition on any automated 28-day countdown or release logic stands.

### 1.5 Signer eligibility and NP verbal approval — confirmed
Enrolled HB 137 (Act 148 of 2025) text of R.S. 28:53(B)(1) confirms the eligible signers: LSBME-licensed/permitted physician; PA acting per clinical practice guidelines; PMHNP; "other nurse practitioner who acts in accordance with a collaborative practice agreement and receives verbal approval for executing the certificate from his collaborating physician"; or psychologist. The OBH-1 form has **no field** for the collaborating physician or the verbal-approval attestation — confirmed gap; the proposed attestation screen + audit-log capture stands (whether an addendum must appear visually remains a clarification-register item).

### 1.6 Telehealth — Act 148 of 2025 verified from the enrolled act
The enrolled bill's underscored additions are exactly "psychologist, medical psychologist," in the telehealth sentence. Post-amendment, telehealth examination is available to a **psychiatrist, psychologist, medical psychologist, or PMHNP** — note this list does **not** include general physicians, PAs, or other NPs; Clarity's telehealth path must gate on these four roles specifically (the review's matrix did not state this restriction). Conditions confirmed: licensed healthcare professional physically in the room who can assist with "the information listed in Paragraph (4) of this Subsection"; medical clearance prior to admission to a mental health treatment facility. Also confirmed and worth surfacing in the UI risk language: "Failure to conduct an examination prior to the execution of the certificate will be evidence of gross negligence."

### 1.7 Exam-before-signature window — confirmed
R.S. 28:53 requires the examination date to be "not more than seventy-two hours prior to the date of the signature of the certificate." OBH-1 carries `EXAMINATION DATE` / `EXAMINATION TIME` and separate `DATE SIGNED` / `TIME SIGNED` fields, so this is machine-validatable from form data.

### 1.8 CEC 72-hour independent examination — confirmed
- **OBH-2 header, verbatim:** "To be completed by the coroner or his deputy within seventy-two hours after admission of any person by emergency certificate to a treatment facility. The completion of this certificate is a necessary precondition to the person's continued confinement."
- Form carries `ADMISSION DATE` / `ADMISSION TIME` and `EXAMINATION DATE` / `EXAMINATION TIME` — the 72-hour clock anchors to admission as specified.
- Statute confirms the alternative-physician rule when the coroner executed the original certificate ("a second examination shall be made within the seventy-two hour period... by any physician at the treatment facility"). The PEC-signer ≠ CEC-signer hard stop stands.

---

## 2. Findings the review MISSED (visible on the actual forms)

These require additions or corrections to the field-traceability matrix and workflow spec.

1. **OBH-1 "1st / 2nd" certificate checkboxes.** The CHECK row includes `1st` / `2nd` boxes. The matrix has no requirement ID for certificate sequence. Clarity must capture whether this is the first or second emergency certificate and drive any second-exam workflow accordingly.
2. **OBH-1 "Order For Protective Custody Date: ____" field.** Links a PEC to a preceding OPC. Not in the matrix. When a case originates from an OPC, Clarity should auto-populate this from the OPC issuance record (single source of truth; prevents transcription mismatch between documents).
3. **OBH-1 "Willing to seek voluntary admission upon arrival at the treating facility" checkbox** (part of criteria group 2, alongside "Unwilling" and "Unable to seek voluntary admission"). Not in the matrix. This is a distinct disposition-relevant selection and must be modeled.
4. **TRC-006 validation rule is wrong as written.** The form instruction reads "check where appropriate in **both 1 & 2**." Correct rule: at least one selection from group 1 (Dangerous to self / Dangerous to others / Gravely disabled) **AND** at least one selection from group 2 (Unwilling / Unable / Willing-upon-arrival) — not "at least one must be selected" overall. OBH-2 Conclusion A carries the same two-group structure.
5. **OBH-2 Conclusion B is a release pathway the workflow spec omits.** OBH-2 requires "Complete either A or B," where B states: "Based on my examination of the above person named, I conclude that he/she is not a proper subject for emergency admission," with its own signature/date/time block. A CEC can therefore **terminate** the hold, not only continue it. The event table ("CEC Execution → Authorizes continuation of the 15-day hold") is incomplete; Clarity needs a Conclusion-B branch that triggers the release/disposition workflow.
6. **Signer-label mismatch on OBH-1 Rev. 08/2025.** Despite the statute authorizing PAs, PMHNPs, NPs, and psychologists, the form's fields still read "NAME OF EXAMINING PHYSICIAN," "SIGNATURE OF EXAMINING PHYSICIAN," and "LA MEDICAL LICENSE NUMBER." Two consequences: (a) non-physician signers execute a line labeled "physician" — add to the authoritative-clarification register; (b) TRC-004's validation ("format validation against state board patterns") must accept **Board of Nursing, PA, and psychology board** license formats, not just LSBME patterns, or it will hard-block lawful signers.
7. **OBH-2 also prints "LA MEDICAL LICENSE NUMBER"** for the coroner/deputy signature blocks — same license-format caveat, plus a clarification item for parishes with non-physician coroners.
8. **OBH-1 header cites "Sections 53 and 63."** The review never mentions R.S. 28:63. Verify what §63 provides (it is cited on the operative form) before finalizing helper text.
9. **Facsimile-fidelity details** for the PDF generator: OBH-1's title is printed as one word, "EMERGENCYCERTIFICATE"; OBH-1 corner note "Complete Prior to Admission"; distribution footers on OBH-1 and OBH-2: "ORIGINAL TO HOSPITAL – ONE COPY TO EXAMINING PHYSICIAN"; OBH-20's bolded R.S. 28:53.2(B)(5) crisis-management text box. Under the no-alteration rule these must be reproduced exactly — including the typo — until LDH revises the form.
10. **OBH-20 transport clause enumerates the disposition set:** transport is "for immediate examination by a physician to determine if he should be voluntarily admitted, admitted by emergency certificate, admitted as a non-contested admission or discharged." The workflow's post-OPC branch should model all four outcomes (the review's resolution overlay lists only three).
11. **OBH-20 demographic capture is minimal** (name/address, Race, Sex, Age, nearest relative/relationship/telephone) — note "Age," not date of birth. The global Case Header should derive Age for OBH-20 output rather than adding a DOB field to the facsimile.

---

## 3. Corrections to the review's matrix (summary)

| Req ID | Correction |
|---|---|
| TRC-002 | Source of the 12-hour delivery deadline is statute only; not on OBH-20. "Official Form Auth" column is wrong. |
| TRC-004 | License validation must accept non-LSBME license formats (NP/PA/psychologist); field label on form remains "LA MEDICAL LICENSE NUMBER." |
| TRC-006 | Validation rule: ≥1 from group 1 AND ≥1 from group 2 ("both 1 & 2"), not "at least one selected." |
| TRC-007 | "Substance Abuse (28 Day)" checkbox appears on OBH-1 Rev. 08/2025 as well, not only OBH-1A. |
| (new) | Add requirement IDs for: 1st/2nd certificate checkboxes; OPC-date field on OBH-1; "Willing upon arrival" option; OBH-2 Conclusion B branch; telehealth role gate (psychiatrist / psychologist / medical psychologist / PMHNP only). |

---

## 4. Additions to the authoritative-clarification register

Beyond the four items already listed in the review:

5. **Signer labels:** May a PA, NP, PMHNP, or psychologist lawfully execute OBH-1 given the form's "Examining Physician" labels, or does LDH intend OBH-1A (psychologist) plus OBH-1-as-is for all prescriber roles? Will LDH revise the labels?
6. **License-number field:** For non-physician signers, what should be entered in "LA MEDICAL LICENSE NUMBER" (nursing/PA/psychology license)? Is a mismatched entry a validity risk?
7. **R.S. 28:63 citation on OBH-1:** Confirm the current content and relevance of §63 referenced on the form face.
8. **Second certificate ("2nd" checkbox):** Confirm the current statutory basis and timing for a second emergency certificate and the intended use of the 1st/2nd checkboxes.
9. **Conclusion B mechanics:** When the coroner completes OBH-2 Conclusion B, what release/notification steps are required of the facility, and on what timeline?

---

## 5. Second-pass cross-verification (Gemini deep-research report, 2026-07-17)

A deep-research pass was run against the Section 3 clarification register using the prompt in `GEMINI_DEEP_RESEARCH_PROMPT_LA_OPC_PEC_CEC.md`. The following items from that report were independently checked against primary sources (legis.la.gov, FindLaw) before being accepted.

### 6.1 Confirmed and added to the matrix

- **R.S. 28:53(A)(2)** — a substance-related/addictive-disorder patient may be detained "for one additional period, not to exceed fifteen days, provided that a second emergency certificate is executed." Verbatim-confirmed.
- **R.S. 28:53(G)(3)** — when the coroner executed the first certificate, "a second examination shall be made within the seventy-two hour period... by any physician at the treatment facility." Verbatim-confirmed; matches §1.6/§9 of this memo.
- **R.S. 28:53(G)(7)/(8)** — inter-parish transfer requires "a second physician's emergency certificate, when appropriate... executed by a physician at the admitting facility." Verbatim-confirmed.
- **R.S. 28:63** — good-faith civil/criminal immunity for apprehension, custody, examination, and confinement, conditioned on hospital personnel having documented nonviolent-crisis-intervention training within the preceding 12 months; criminal penalty for a willfully false application/certificate of up to 2 years imprisonment and/or a $10,000 fine. Verbatim-confirmed. This explains the "Sections 53 and 63" citation on the OBH-1 header (open item §4.7 resolved).
- **R.S. 28:53.1** — on discharge of a patient held under an emergency certificate, the facility must (a) notify the patient's current behavioral-health provider of discharge date/time unless the patient objects, (b) notify any follow-up provider within 24 hours of discharge with a clinical summary, and (c) give the patient LDH-published educational materials on self-harm warning signs before/at discharge. Verbatim-confirmed. **This is new — not in the original review or in Sections 1–5 of this memo.**

**Matrix impact:** the "2nd" certificate checkbox on OBH-1 (§2.1 of this memo) is driven by at least **two distinct, non-overlapping statutory triggers** — (i) the 15-day substance-disorder extension under (A)(2), and (ii) inter-parish transfer continuation under (G)(7)/(8) — plus the CEC-side coroner-conflict resubstitution under (G)(3), which is a *different* certificate (OBH-2, not OBH-1). These need separate workflow branches and separate audit-trail reason codes; a single boolean "is this the 2nd certificate" flag is insufficient. Add a new event: **any emergency-certificate-based discharge (including an OBH-2 Conclusion B release) must trigger the R.S. 28:53.1 notification workflow** — current-provider notice, 24-hour follow-up-provider notice with summary, and patient educational materials — as a hard-stop-adjacent checklist before the case can be marked closed.

### 6.2 Correction — Aldridge v. Greenbrier Hospital was mischaracterized

The Gemini report states the appellate court "ultimately granted summary judgment in favor of the defendants," citing this as evidence that Title 28 immunity reliably shields facilities and coroners. Direct review of the opinion shows the opposite: the Louisiana First Circuit **reversed in part**, holding the trial court abused its discretion by excluding the plaintiff's psychiatric expert affidavit, and **reinstated** the negligence claims for trial. The case did not turn on R.S. 28:63 immunity at all — it turned on expert-affidavit admissibility under La. C.C.P. art. 967. Corrected takeaway: a plaintiff can survive summary judgment on an OPC/PEC/CEC-chain negligence claim with a supportable expert affidavit challenging the diagnosis or commitment basis. This argues for *more* rigor in Clarity's immutable audit trail and clinical-finding-to-legal-criterion linkage (§8 of the original review), not less — do not cite this case as evidence that immunity forecloses liability.

### 6.3 Flag — likely fabricated citation, do not rely on it

The Gemini report quotes the Louisiana Medicaid Behavioral Health Services (BHS) Provider Manual as stating a specific three-part LUETA validity test ("(1) signer intentionally, voluntary agrees to electronically sign the document; (2) the electronic signature is attributable to signer... (3) appropriate security measures...") applied specifically to Orders of Protective Custody. This could not be verified. A direct text search of the actual 175-page manual PDF at the cited URL returned **zero occurrences** of "LUETA," "electronic signature," or "Order of Protective Custody." A web search for the exact quoted phrase also returned nothing. Treat this citation as unverified and likely fabricated. **Do not use it to soften the e-signature "must remain blocked pending written LDH/coroners'/sheriffs' confirmation" posture in Section 5 of this memo (originally §6 of the source review) — that posture stands as-is.**

### 6.4 Not independently re-checked (lower stakes, accepted as reported)

Definitions of "psychologist" (LSBEP) vs. "medical psychologist" (LSBME, Act 251 of 2009, R.S. 37:1360.51 et seq.) as separate licensing tracks — consistent with public LSBME/LSBEP program descriptions and does not change any Clarity decision beyond what §1.6 of this memo already requires (route license-format validation by role). Absence of 2025/2026-session bills reconciling the 8-vs-12-hour or 28-day conflicts (HB 546, HB 231 reviewed as unrelated) — consistent with LDH form-repository check in §1.1–1.2 above; monitor future sessions rather than re-verify now.

## 6. OBH-19 (Request for Protective Custody) — field-traceability addition

OBH-19 was not in the original three-form ground-truth set; it was fetched directly from LDH (ldh.la.gov) and read in full during the `packages/legal-hold-forms` build. Unlike OBH-1/1A/2/20, OBH-19 is a peace-officer/credible-person application, not itself an operative legal instrument — the OPC (OBH-20) is what authorizes custody. Its fields:

| Req ID | Field | Legal Purpose | Authority | Notes |
|---|---|---|---|---|
| TRC-011 | Name/address/race/sex/age of person needing treatment | Identifies the subject of the request | La. R.S. 28:53.2 (predicate for coroner/judge review) | Feeds OBH-20's "Person to Be Taken Into Custody" block if the OPC issues |
| TRC-012 | Statement of facts / observations | Establishes the factual basis a coroner or judge reviews before issuing an OPC | La. R.S. 28:53.2 | Same objective-language guidance as OBH-1's History of Present Illness applies here |
| TRC-013 | "Is he/she unwilling to be treated on a voluntary basis?" | Documents the voluntariness predicate | La. R.S. 28:53.2 | Boolean; distinct from OBH-1's group-2 criteria (this form has no dangerousness checkboxes of its own — the narrative statement carries that weight) |
| TRC-014 | Signature (peace officer indicated) + date/time | Establishes who made the request and when | La. R.S. 28:53.2 | Not itself a custody deadline trigger — the clock starts at OBH-20 issuance/execution, not at OBH-19 signature |

No new legal conflicts were found on OBH-19 — its content is procedurally simple and matches its statutory role as a predicate application, not an execution instrument.

## 7. Implementation status

`packages/legal-hold-forms` (this repo) implements the structured data model, advisory deadline calculators, advisory structural validators, and fillable-PDF rendering for all five forms, wired into `document-service` (upload as `LEGAL_HOLD_DOCUMENT`) and `case-repository` (`LegalStatusRecord` creation, cited from a case decision rationale). See `/Users/tylerhebert/.claude/plans/adaptive-purring-aho.md` for the build plan. Field **positions** in the generated PDFs are a known first-pass approximation (estimated from visual layout, not measured with a coordinate tool) — text renders at a legible fixed size, but several fields land in the wrong row on visual QA and need a coordinate-tuning pass before this is presentation-ready. Nothing in the implementation auto-enforces a deadline or blocks a case transition, consistent with this memo's and `docs/legal/LEGAL_STATUS_ARCHITECTURE.md`'s non-enforcement rule.

## 8. Status

- The review's two headline conflicts (8 vs 12 hours; 28-day vs medically necessary period) are **verified as real** against the operative form text and current statute compilations.
- The review's interim design posture (statutory timers + form-deadline warnings; exact-facsimile output; wet-signature fallback; hard stops for telehealth, NP attestation, and CEC independence) is **supported** by everything verified here.
- The matrix and workflow spec need the Section 2/3 corrections before the field mapping is implementation-ready.
- Nothing here substitutes for counsel and LDH written clarification on the items in Section 4 and the review's own register.
