# Deep Research Prompt — Louisiana OPC/PEC/CEC Outstanding Legal Questions

Paste everything below the line into Gemini Deep Research as a single prompt.

---

## ROLE AND CONTEXT

You are conducting legal/regulatory research to support a software team building "Clarity," a digital guided-workflow system that helps Louisiana clinicians, coroners, judges, and law enforcement complete the official Louisiana Department of Health (LDH) Office of Behavioral Health (OBH) involuntary-commitment forms: OBH-19 (Request for Protective Custody), OBH-20 (Order for Protective Custody / "OPC"), OBH-1 (Physician's Emergency Certificate / "PEC"), OBH-1A (Psychologist's Emergency Certificate), and OBH-2 (Coroner's Emergency Certificate / "CEC"). Clarity does not alter the legal effect of these instruments — it captures data and outputs an exact facsimile of the current official PDF. The system is legally sensitive because these forms authorize deprivation of a person's physical liberty.

We have already completed a first-pass legal/form audit (attached findings below, treat as verified baseline — do not re-derive, only extend, confirm, or correct). Your job is NOT to re-summarize what we already know. Your job is to find primary-source, dated, citable answers to the specific open questions in Section 3, and to actively look for anything material that the baseline audit may have missed, using the sources in Section 2.

## SECTION 1 — VERIFIED BASELINE (do not re-research, use as ground truth)

- OBH-20 (Rev. 03/2017) prints: "The person in custody shall be examined within eight hours of his/her arrival, or be released." La. R.S. 28:53.2(D) currently reads twelve hours. This conflict is confirmed on the actual form PDF and the current FindLaw statute compilation as of 2026-07-17.
- La. R.S. 28:53.2 also imposes a 12-hour transport/delivery deadline from custody-taking to arrival at the facility/coroner's office — this deadline does NOT appear anywhere on the OBH-20 form itself.
- OBH-1 (Rev. 08/2025 — the most recently reissued form in the set) still prints a "Substance Abuse (28 Day)" checkbox and header text citing a 28-day period under Title 28:52.4. The current text of La. R.S. 28:52.4(A), per FindLaw and Act 369 of 2017, replaced the 28-day cap with "a medically necessary period" and contains no 28-day reference anywhere.
- Act 148 of 2025 (enrolled HB 137, verified directly from legis.la.gov) amended R.S. 28:53(B)(1) to add "psychologist, medical psychologist," to the list of professionals who may conduct the telehealth examination. Confirmed: telehealth examination is limited to psychiatrist, psychologist, medical psychologist, or PMHNP — NOT general physicians, PAs, or other NPs.
- OBH-1's signature fields are still labeled "NAME OF EXAMINING PHYSICIAN," "SIGNATURE OF EXAMINING PHYSICIAN," and "LA MEDICAL LICENSE NUMBER," even though the statute authorizes PAs, PMHNPs, other NPs (with collaborating-physician verbal approval), and psychologists to execute it. OBH-2 has the same "LA MEDICAL LICENSE NUMBER" label for coroner/deputy signers.
- OBH-2 requires the coroner to "Complete either A or B" — Conclusion A continues the hold, Conclusion B is a finding that "he/she is not a proper subject for emergency admission," which functions as a release pathway not currently modeled in our workflow spec.
- OBH-1's header cites "Sections 53 and 63" of Title 28 — we have not yet researched what §63 currently says or why it's cited on this specific form.
- We could not fully verify Section 63's content, the current legislative status/rulemaking history around Act 148, or any statewide position on e-signature acceptance for these specific forms.

## SECTION 2 — WHERE TO LOOK (in priority order, cite everything with URL + retrieval date)

1. **legis.la.gov** — the Louisiana State Legislature site. Use this as the primary source for statute text (search "RS 28:53", "RS 28:53.2", "RS 28:52.4", "RS 28:63") and for enrolled/engrossed bill text (search by bill number and session year). Prefer the "Law.aspx" statute viewer and "ViewDocument.aspx" enrolled-bill PDFs over any secondary compilation. Note the "Current through" or session date shown on the statute page.
2. **ldh.la.gov** (Louisiana Department of Health, Office of Behavioral Health) — search for the current OBH-1, OBH-1A, OBH-2, OBH-19, and OBH-20 forms directly on LDH's site (not third-party mirrors) to confirm the revision dates we have are the most current in circulation, and to check whether LDH has published any bulletin, FAQ, interpretive guidance, or provider notice addressing the 8-hour/12-hour conflict or the 28-day language.
3. **Louisiana Administrative Code (LAC), Title 48** (behavioral health regulations) — via legis.la.gov or the Louisiana Register (doa.la.gov/osr or similar) — check whether OBH has promulgated any implementing regulation for R.S. 28:53 or 28:53.2 that supplements or clarifies the statutory deadlines, telehealth conditions, or e-signature acceptance, separate from the statute itself.
4. **Louisiana Attorney General opinions** (ag.louisiana.gov, opinion search) — search for any AG opinion after Opinion No. 00-386 (Dec. 13, 2000) addressing R.S. 28:53 or 28:53.2, especially anything on the 8-hour/12-hour discrepancy, electronic signatures on commitment forms, or law enforcement transport obligations.
5. **Louisiana Coroners' Association** (if a public website or published position statements exist) and **Louisiana State Board of Medical Examiners (lsbme.la.gov)**, **Louisiana State Board of Nursing (lsbn.state.la.us)**, **LSBEP / psychology board (lsbep.org)** — search each licensing board's site for any published guidance, FAQ, or advisory opinion on: (a) which license-number format non-physician PEC signers should use on OBH-1, (b) telehealth examination requirements under Act 148, (c) NP collaborative-practice/verbal-approval documentation expectations.
6. **Louisiana Uniform Electronic Transactions Act case law and secondary commentary** — search Louisiana appellate/district court opinions (via Justia, CaseMine, or Google Scholar) citing La. R.S. 9:2601 et seq. in the context of involuntary commitment, mental health holds, or emergency certificates specifically — not general e-signature commentary. We need to know if any Louisiana court has ruled on whether an e-signed PEC/CEC/OPC is valid.
7. **Recent Louisiana legislative sessions (2025 and 2026 Regular/Special Sessions)** on legis.la.gov's bill-tracking search — search for any bill (introduced, pending, or enacted) that amends R.S. 28:53, 28:53.2, or 28:52.4, or that directs LDH to revise the OBH forms. We need to know if the 8-hour/12-hour conflict or the 28-day form language is already the subject of pending legislation.
8. **EMTALA and Louisiana Hospital Association (LHA) Trust Funds materials** (lhatrustfunds.com) — check for anything published after September 2014 (the source cited in our baseline) addressing psychiatric hold timing, the 8-hour/12-hour issue, or facility liability exposure.

## SECTION 3 — SPECIFIC QUESTIONS, RANKED BY PRIORITY

### PRIORITY 1 — Blocks production launch (answer these first)

1. Has LDH issued, or is LDH known to be drafting, a revised OBH-20 that corrects the eight-hour examination deadline to match the twelve-hour statutory deadline in R.S. 28:53.2(D)? Search for any LDH provider bulletin, form-revision notice, or public statement. Report the most recent OBH-20 revision date you can find in circulation, and whether it differs from "Rev. 03/2017."
2. Has LDH issued, or is LDH known to be drafting, a revised OBH-1 or OBH-1A that removes or updates the "Substance Abuse (28 Day)" checkbox/header language to reflect the "medically necessary period" standard in R.S. 28:52.4? Report the most recent OBH-1 revision date you can find (we have Rev. 08/2025) and whether that revision already touched this language (it appears not to have — confirm).
3. Is there any Louisiana statute, administrative rule, AG opinion, or court decision specifically addressing whether LUETA-compliant electronic signatures are valid and accepted on OBH-1, OBH-1A, OBH-2, or OBH-20 — as opposed to general e-signature validity? We need a citable answer on whether any receiving facility, coroner's office, or law enforcement transport agency has a documented policy of accepting or rejecting e-signed versions of these specific forms.
4. Given Act 148's amendment (effective 08/01/2025) authorizing telehealth PEC examinations only for psychiatrist, psychologist, medical psychologist, or PMHNP — is there any subsequent guidance, correction, or 2026-session bill that further amends this list (e.g., extending telehealth to PAs or other NPs), and is there any indication of a pending challenge or ambiguity in how "medical psychologist" is defined/licensed in Louisiana relative to "psychologist"?

### PRIORITY 2 — Blocks specific features, not full launch

5. What does La. R.S. 28:63 currently say, and why is it cited alongside §53 on the face of OBH-1? Is §63 a separate admission pathway, a payment/cost provision, or something else relevant to the PEC workflow?
6. For a PA, PMHNP, other NP, or licensed psychologist executing OBH-1 (which is still labeled "Examining Physician" / "LA Medical License Number" on its face) — is there any board guidance (LSBME, LA Board of Nursing, LSBEP) on what license number/format a non-physician signer should enter in that field? Is there a risk that a non-MD license number in that field could be challenged as facially invalid?
7. Confirm current status of the "1st / 2nd" emergency certificate checkbox on OBH-1: what is the statutory basis for a second emergency certificate for the same patient/episode, and under what circumstances is it used (e.g., after a lapsed first certificate, after a facility transfer, after an OBH-2 Conclusion B release followed by re-detention)?
8. When a coroner completes OBH-2 with Conclusion B ("not a proper subject for emergency admission"), what specific statutory or regulatory obligations does the treatment facility have regarding release timing, notification, and documentation? Is release required immediately, or is there a grace period?
9. Is there a documented Louisiana Coroners' Association position, guidance document, or training material on the "independent examination" requirement in R.S. 28:53(G) — specifically on how rural/small parishes with a single available coroner-physician handle the conflict-of-interest scenario (same person as on-call ER physician and coroner)?

### PRIORITY 3 — Useful context, not launch-blocking

10. Search for any published incident, news report, or appellate case (post-2015) in Louisiana involving a challenge to an OPC, PEC, or CEC based on the 8-hour vs. 12-hour discrepancy, the 28-day substance-abuse detention question, or e-signature validity on these forms. We want real-world evidence of how this conflict has played out, if at all.
11. Are there other U.S. states with a similar "form text lags amended statute" problem on involuntary-commitment forms, and if so, how did that state's health department resolve it operationally (e.g., addendum, form reissue with transition period, formal guidance memo)? This is for comparative/process reference only, not binding on Louisiana.

## SECTION 4 — OUTPUT FORMAT REQUIRED

For every question above, structure your answer as:

- **Question #:**
- **Answer:** (state clearly if unresolved/no source found — do not speculate or infer a legal conclusion we did not ask for)
- **Source(s):** full URL(s) and retrieval date
- **Confidence:** High / Medium / Low, with one sentence on why
- **Still open:** what a human (counsel, LDH contact, coroners' association contact) would still need to confirm in writing

At the end, provide a short prioritized punch list: which Priority 1 items got a definitive answer, which remain open, and what the single next concrete action is for each open item (e.g., "call LDH OBH policy division," "file a public records request," "monitor 2026 Regular Session bill tracker for SB/HB amending R.S. 28:53.2").

Do not fabricate a citation. If you cannot find a primary source for a claim, say so explicitly rather than inferring from secondary commentary.
