# Clarity — Holistic Platform Synthesis
## Competitor Feedback, Feature Adoption Map & the "One Capture, Four Outputs" Thesis

**Prepared:** July 2026 · Companion to the e-PEC competitive landscape doc

---

## 1. The reframe

The expanded vision — central-intake coaching from the first phone call, structured clinical screening, insurance-aligned medical necessity documentation, level-of-care determination, bed routing, and treatment-team continuity — spans **four product categories that are sold separately today**:

| Layer | Today's incumbent | Their age & footprint |
|---|---|---|
| Crisis intake & documentation | iCarol | Founded 2004; serves ~half of US 988 centers + all of Canada's 988 |
| Transfer & bed matching | XFERALL, OpenBeds | XFERALL: 80–90% transfer-time reduction, ~60–90 min median acceptance; OpenBeds: 14+ states |
| Medical necessity / UR criteria | InterQual (Optum) & MCG | The two dominant criteria tools industry-wide |
| Legal instrument & custody | **Nobody** | Clarity's existing wedge |

No vendor spans more than one layer well. The buyer (ED, behavioral hospital, coroner, crisis center, CMHC) stitches these together manually — usually with phone calls, faxes, and a UR nurse re-typing what the intake worker already heard.

**The Clarity thesis: one guided capture at the moment of crisis produces four outputs simultaneously —**
1. a clinical assessment (screening, MSE elements, risk),
2. a medical-necessity-ready summary aligned to the payer's criteria,
3. a legal instrument (PEC/OPC) if criteria are met,
4. a transfer/routing packet with acceptance receipt.

---

## 2. What the field feedback actually says (and the design lesson in each)

### OpenBeds — the registry that starved
Michigan discontinued its OpenBeds-hosted registry citing **lack of engagement and cost**. Root cause pattern: registries depend on receiving facilities voluntarily keeping bed counts fresh; when they don't, data goes stale, referrers stop trusting it, and the loop dies.
**Design lesson → Don't build a registry. Build a request-broadcast.** Push the patient's needs out; make facilities respond to a live case, not maintain a census.

### XFERALL — proof the broadcast model wins
XFERALL matches patient needs to facility capabilities and broadcasts transfer requests to multiple facilities at once, with 1-click facility responses and no faxing. Results: transfer times cut 80–90%; median acceptance just over 60 minutes vs. national ED waits of 7–8+ hours; 70% of BH patients placed in under three hours in earlier deployments. Now includes mobile crisis teams as senders and discharge/step-down coordination, plus accept/deny analytics per facility.
**Adopt:** simultaneous multi-facility broadcast; 1-click accept/request-more-info; sender types beyond hospitals (mobile crisis, CIT, social workers); step-down routing at discharge; accept/deny analytics.
**Beat:** XFERALL moves a *summary*; Clarity moves a *legally executed, hash-verified instrument* with the clinical narrative and custody ledger attached. XFERALL also doesn't touch medical necessity or the legal hold.

### iCarol — the intake incumbent's shape and its ceiling
Built by crisis-line volunteers in 2004; strengths users rely on: configurable/interactive assessment forms, multi-channel contact (call/chat/SMS), documentation and call notes, follow-up management, resource & referral database, volunteer/staff scheduling, and funder-grade reporting. It's the default for 988 centers.
**Adopt:** form configurability without vendor involvement; multi-channel intake; automated follow-up scheduling; resource directory; reporting built for funders (this is how nonprofits justify renewal).
**Beat:** iCarol *documents* a call; it doesn't *coach* one. It has no medical-necessity engine, no payer-criteria crosswalk, no legal instrument execution, no transfer network. The counselor still hangs up and starts the "real" paperwork.

### Julota — customization as strength and as trap
Users praise deep workflow customization and responsive staff ("no aversion to using it… staff have been very responsive"). But a decade in, Julota is ~23 people with ~$2.2M raised — the services-heavy custom-build model doesn't compound.
**Adopt:** 42 CFR Part 2 + HIPAA consent management; CAD/RMS/EHR connector posture; customized outcomes reporting for grants/policymakers.
**Beat:** ship configurable *products* (templates per statute, per payer, per program type), not consulting engagements.

### InterQual / MCG — the criteria layer's confession
The UR world's own literature is the strongest validation of the intake-coaching concept:
- "Reviewers can only match what appears in the chart — a patient's actual clinical picture is irrelevant to the review if the record doesn't reflect it."
- "The biggest documentation gap isn't missing information — it's clinical reasoning that exists in the provider's head but never makes it into the written record."
- InterQual BH reviewers assess exactly five domains: **risk of harm, functional status, treatment history, environmental stressors, engagement in care.**
- Top behavioral health denials: **CO-197 (no authorization on file)** — the single most common — and **CO-50 (not medically necessary)**, usually a mismatch between what the clinician wrote and what the payer wanted to see.
- Best practice per RCM operators: "tie clinical documentation templates to payer criteria so notes pass medical necessity review on first read" and "mine denial letters for patterns."
**Adopt:** structure the intake so every captured element maps to a criteria domain; track authorizations with expiration alerts; build the denial-feedback loop into the product.
**Beat:** InterQual/MCG are reference libraries used *after* the fact by UR nurses. Clarity applies the crosswalk *during the crisis call*, when the information is still available and the family is still on the line.

---

## 3. The guided intake — mapping the clinical vision to structured capture

The intake coach walks the crisis worker through, in plain language, while auto-organizing into criteria domains:

| Intake coaching thread (as described) | Criteria domain it feeds | Also feeds |
|---|---|---|
| Danger to self / others / gravely disabled, altered mental status | Risk of harm | PEC/OPC statutory grounds (verbatim reuse) |
| Precipitating events: job loss, divorce, homelessness, moving, family conflict, substance use | Environmental stressors | Clinical narrative; social determinants coding (Z-codes) |
| First episode vs. lifelong history; prior admissions/treatment | Treatment history | "Failure of less-restrictive level" argument for medical necessity |
| Eating & sleeping patterns; depth of depression, anxiety, insomnia | Functional status | Severity scales (PHQ-9, GAD-7, C-SSRS prompts) |
| Orientation ×4 (person/place/time/situation); hallucinations (auditory/visual/olfactory), paranoia, delusions, loss of touch with reality | Risk of harm + functional status | MSE section of the PEC narrative |
| Willingness to accept help; family engagement; collateral contacts to schedule | Engagement in care | Follow-up tasks; collateral-informant log for ground-truthing during stay |
| Insurance identified early in call | — | Payer-specific criteria pack loads; auth workflow starts (kills CO-197) |

**Output on completion:** an auto-drafted "Medical Necessity Summary" — why hospitalization (or a lower level of care) is clinically necessary, written in the structure the payer's reviewer will score it against — plus the PEC-ready findings if statutory criteria are met.

**Level-of-care engine:** hospitalization is high-value but not the only objective. Use LOCUS/CALOCUS (mental health) and ASAM Criteria (SUD) dimensions to recommend across the continuum: inpatient, crisis receiving center, PHP, IOP, outpatient + safety plan, mobile crisis follow-up. Same capture, defensible recommendation at any level.

**Continuity:** post-admission, the intake record becomes the treatment team's baseline — collateral-informant scheduling, ground-truth consolidation across family interviews, concurrent-review updates feeding continued-stay criteria, and discharge step-down routing through the same broadcast network.

**Guardrail (non-negotiable):** the coach is clinical decision *support*. A licensed clinician makes the determination; criteria tools "do not replace clinical decision-making." Every AI-suggested phrase is attributable, editable, and logged in the custody ledger.

---

## 4. Consolidated feature adoption map

**From XFERALL:** multi-facility broadcast · 1-click facility response · mobile-crisis/social-worker/CIT sender roles · accept-deny analytics · discharge step-down routing
**From OpenBeds:** closed-loop referral status · statewide gap analytics for OBH/funders · public treatment-finder front door (Treatment Connection analog) · outpatient appointment referrals, not just beds
**From iCarol:** counselor-editable form builder · multi-channel intake (call/text/chat) · follow-up scheduler · resource directory · funder-grade reporting · volunteer/staff ops for nonprofit centers
**From Julota:** 42 CFR Part 2 consent engine · CAD/RMS/EHR/HIE connectors · grant outcomes dashboards
**From InterQual/MCG practice:** payer criteria packs (per-plan crosswalks incl. CMS NCD/LCD → custom criteria → ASAM fallback logic) · auth tracking with expiry alerts · denial-letter feedback loop · concurrent review support
**Clarity-only (defensible core):** guided intake coaching with patient advocacy stance · one-capture/four-outputs · statutory instrument execution (LA first, state packs later) · hash-chained custody ledger end to end · collateral-informant ground-truthing workflow

## 5. Users this now serves
Police officers · field assessment specialists · mobile crisis clinicians · social workers · home-visit nurses · 988/crisis-line counselors · ED intake · behavioral hospital central intake/admissions · UR teams · coroners · treatment teams post-admission.

## 6. Open research threads (candidates for the next session)
1. **Payer criteria acquisition** — InterQual/MCG licensing costs vs. building crosswalks from publicly posted plan medical policies (Carelon, Optum, BCBS LA, Louisiana Medicaid MCO criteria are largely public). Legal review of criteria IP.
2. **LOCUS/ASAM licensing** — AACP (LOCUS) and ASAM both license their instruments for software embedding; terms and cost.
3. **XFERALL's Louisiana presence** — verify whether any LA health system is on their network yet (their expansion is CA/TX-centric); if absent, LA network effect is still buildable.
4. **988 unified platform direction** — SAMHSA's consolidation plans could commoditize the intake layer; track whether Vibrant/SAMHSA mandate a national system.
5. **Reimbursement rails** — Louisiana Medicaid mobile crisis / CRC billing codes (H2011, S9484, crisis stabilization per-diems) to quantify the ROI story for buyers.
6. **Pricing benchmarks** — Julota's $10K–65K/yr per program; XFERALL and OpenBeds contract values via state procurement records (GovSpend/state transparency portals).

---
*Sources: XFERALL product pages and Feb 2026 Southern California expansion release; Hospital Council of Northern & Central California; iCarol product/988 documentation; Julota site, CB Insights, PitchBook, LeadIQ profiles; Bamboo Health OpenBeds releases and Delaware DTRN case studies; Michigan LARA MiCARE discontinuation; Optum InterQual criteria documentation; Carelon medical necessity policy hierarchy; behavioral health RCM denial analyses (MedHeave, Behave Health, Solum).*
