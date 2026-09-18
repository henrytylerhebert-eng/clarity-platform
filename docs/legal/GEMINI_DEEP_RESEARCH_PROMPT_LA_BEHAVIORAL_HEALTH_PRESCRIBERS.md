---
status: Proposed research prompt — not executed, not reviewed
version: 0.1.0
data_boundary: no patient data; public professional-licensure data only
authored_by: Claude (session 2026-09-13), at owner request
classification_note: |
  This enumeration of source registries and statutory citations is AUTHORED
  FROM MODEL KNOWLEDGE and is therefore `Assumed` under
  docs/discovery/DISCOVERY_CLASSIFICATION_STANDARD.md — a starting scaffold to
  be confirmed, corrected, and extended by the research, not a verified
  inventory. Nothing produced by this research becomes a Clarity role policy,
  credentialing rule, or signer-authority determination until OD-3 (clinical
  licensing review) and counsel review (OD-2) are closed.
---

# Deep Research Prompt — Louisiana Psychiatrist and PMHNP Directory & Scope of Practice

**Purpose.** Clarity's Louisiana Legal Status workflow (OPC → PEC → CEC) and its
prescreen role model both currently treat "authorized practitioner" as a
placeholder: `PHYSICIAN_REVIEWER` is mapped to a physician signer, and
psychiatric mental-health nurse-practitioner (PMHNP) signer scope is recorded
as "configured policy" — i.e., not yet resolved against actual Louisiana law.
This research has two separate goals, and they should not be conflated:

1. **Scope-of-practice and signer-authority research** — who may currently
   execute a Louisiana Physician's Emergency Certificate (PEC) or otherwise
   act as an "authorized practitioner" for crisis-placement purposes: physician
   only, or also PMHNPs/APRNs under some supervision or independent-practice
   condition. This is regulatory research.
2. **Provider directory acquisition mechanics** — how a *complete, current*
   roster of Louisiana-licensed psychiatrists and PMHNPs could actually be
   obtained from authoritative sources, for a possible later ingestion effort.
   This is a data-sourcing research task, not a request to hand-enumerate every
   individual in this pass — see Section 3.

Paste everything below the line into Gemini Deep Research (or an equivalent
deep-research tool) as a single prompt.

---

## ROLE AND CONTEXT

You are conducting research to support a software team building "Clarity," a
behavioral-health case-intelligence platform focused on crisis placement in
Louisiana. The system holds **synthetic data only** and is not a deployed
clinical system. You are not being asked to identify, contact, or compile a
dossier on any specific patient or private individual — only **public
professional-licensure information** about psychiatrists and psychiatric
nurse practitioners practicing in Louisiana, and the Louisiana statutes and
board rules governing their scope of practice.

### What Clarity currently does with this information (verified from the
codebase, treat as ground truth)

- Louisiana Legal Status workspace implements OPC (Order of Protective
  Custody) → PEC (Physician's Emergency Certificate) → CEC (Coroner's
  Emergency Certificate) as configurable rule sets (`epecRuleSets.ts`), demo
  logic only, not legally authoritative.
- The prescreen role-mapping decision (ADR-0014) currently rules
  `PHYSICIAN_REVIEWER` ≡ an authorized practitioner signer and explicitly
  defers PMHNP signer scope to "configured policy" — meaning no one has yet
  determined, against actual Louisiana law, what an APRN/PMHNP may sign
  independently versus under a collaborative practice agreement.
- There is no provider directory feature today. Facility matching and
  routing are demo/synthetic logic; no real practitioner data is stored
  anywhere in the system.

### What this research does NOT authorize

- It does not authorize adding real individually-identified provider data to
  Clarity's database. Any future ingestion is a separate, later decision.
- It does not resolve the PMHNP signer-authority open question by itself —
  see "What this does not establish" at the end of this file.
- It is not a request for any patient, case, or clinical data.

## SECTION 1 — SCOPE-OF-PRACTICE AND SIGNER-AUTHORITY RESEARCH

1. **PEC execution authority.** Locate the current, in-force text of
   Louisiana R.S. Title 28 (the Louisiana Mental Health Law) governing who may
   execute a Physician's Emergency Certificate. Confirm whether the statute
   restricts this to a licensed physician (M.D./D.O.) only, or whether any
   amendment has extended PEC (or an equivalent emergency-certification)
   authority to advanced practice registered nurses, specifically
   psychiatric-mental-health nurse practitioners. Cite the exact section
   number and the most recent amendment date. If a bill has been introduced
   or passed recently expanding this authority, report its status precisely
   (introduced / passed committee / enacted / effective date).
2. **CEC execution authority** (coroner or designated physician) — confirm
   who may execute a Coroner's Emergency Certificate under the same title,
   for comparison.
3. **Louisiana APRN practice-authority classification.** Confirm Louisiana's
   current classification for nurse practitioners under the
   AANP/national-conference-of-state-legislatures framework: full, reduced,
   or restricted practice authority, as of the retrieval date. State whether
   this differs for psychiatric-mental-health NPs specifically versus other
   NP specialties.
4. **Collaborative Practice Agreement (CPA) requirements.** If Louisiana
   requires a CPA between a PMHNP and a supervising/collaborating physician,
   summarize: what the CPA must contain, whether it limits prescriptive
   authority for controlled substances (especially Schedule II psychiatric
   medications), and whether it bears on emergency-certification signing
   authority specifically (a CPA governing prescribing does not automatically
   confer certification-signing authority — treat these as separate
   questions and say so explicitly if the statute is silent on one).
5. **Louisiana State Board of Medical Examiners (LSBME)** — confirm psychiatrist
   licensure requirements (M.D./D.O., residency/board-eligibility
   expectations if any are legally required rather than merely customary),
   and whether LSBME publishes any list of physicians authorized to execute
   emergency certificates (some states maintain a specific "coroner's
   physician" or "certifying physician" designation/roster — confirm whether
   Louisiana does).
6. **Louisiana State Board of Nursing (LSBN)** — confirm APRN/PMHNP licensure
   requirements, national certification requirements (e.g., ANCC PMHNP-BC),
   and any LSBN rule specifically addressing emergency mental-health
   certification authority.

## SECTION 2 — WHERE THE INTERPRETATION SPACE IS

For each item in Section 1, classify using the same framework Clarity uses
elsewhere:

| Class | Meaning |
|---|---|
| **BINDING-SPECIFIC** | The statute/rule states a specific, testable rule (exact license type required, exact CPA content). |
| **BINDING-INTERPRETIVE** | Binding but stated as a standard ("qualified," "appropriate supervision") that an organization must operationalize. |
| **ORG-DISCRETION** | The board/statute expects an organization-level credentialing policy but does not dictate its content. |
| **UNRESOLVED / CONFLICTING** | Statute and board rule appear to conflict, or the statute is silent on a question this research was asked to answer. |

For anything **BINDING-INTERPRETIVE**, **ORG-DISCRETION**, or
**UNRESOLVED/CONFLICTING**, state concretely what a receiving facility or a
platform like Clarity would need to decide and be able to show — e.g., "a
policy naming which PMHNPs on staff have delegated PEC-adjacent authority,
if any, and under what physician co-signature process."

## SECTION 3 — PROVIDER DIRECTORY ACQUISITION MECHANICS

Do **not** attempt to hand-enumerate every individually licensed psychiatrist
and PMHNP in Louisiana in this research pass — that is a bulk-data problem,
not a research-summarization problem, and a plausible-looking partial list
would be worse than none. Instead, identify and document the **authoritative
mechanism** by which a complete, current roster could later be obtained,
following the same acquisition discipline Clarity already uses for its CMS
regulatory-corpus tool: prefer an official bulk-download file or documented
API over an interactive search form, and never propose scraping a licensee
lookup portal that disallows it.

For each of the following, report: does an official bulk file or API exist;
its exact URL; its format (CSV/XLSX/API schema); its update cadence; what
fields it contains (name, license number, license status/expiration, address,
specialty/taxonomy, discipline/board-action history if public); and whether
its terms of use or robots.txt permit programmatic retrieval.

7. **LSBME licensee lookup / open-data file**, if one exists, filtered to
   active psychiatrists (or all physicians, noting how specialty would need
   to be cross-referenced against board certification data separately, since
   state medical boards typically license "physician," not "psychiatrist," as
   the credential — specialty is usually a secondary, self-reported or
   ABMS-verified attribute).
8. **LSBN licensee lookup / open-data file** for APRNs, filtered or
   cross-referenced to the PMHNP population specifically.
9. **NPPES NPI Registry** (CMS, national, public, documented bulk-download
   and API) — confirm the exact taxonomy codes for Psychiatry (`2084P0800X`)
   and Psychiatric/Mental Health Nurse Practitioner (`364S00000X`), confirm
   these are still current in the NUCC taxonomy, and describe how to query
   the NPPES bulk file or API filtered to Louisiana practice addresses and
   these taxonomy codes.
10. **CMS Care Compare / Provider Data Catalog** — confirm whether it
    publishes a Louisiana-filterable, taxonomy-filterable clinician file
    distinct from NPPES, and whether it adds anything NPPES lacks (e.g.,
    Medicare enrollment status, group affiliation).
11. **Louisiana Department of Health (LDH) Medicaid provider enrollment
    directory**, if public, for Healthy Louisiana behavioral-health
    prescribers — confirm what it adds and its update cadence.
12. **ABPN (American Board of Psychiatry and Neurology) certification
    verification** and **ANCC PMHNP-BC certification verification** — confirm
    whether either offers a bulk or per-lookup verification service, since
    board certification is separate from state licensure and neither LSBME
    nor LSBN necessarily confirms it.
13. Note any professional-association directory (e.g., Louisiana Psychiatric
    Medical Association, a state nurse-practitioner association) that is
    public but explicitly **membership-based and incomplete** — flag these as
    supplementary, not authoritative, since they will undercount non-members.

## SECTION 4 — OUTPUT FORMAT REQUIRED

Produce two separate outputs:

**A. Scope-of-practice findings** — one record per Section 1/2 item, with:
- **ID:** `LA-PX<sequence>`
- **Question:** restated in one sentence
- **Answer:** what the primary source says
- **Primary citation:** exact statute/rule section, full URL, retrieval date
- **Class:** BINDING-SPECIFIC | BINDING-INTERPRETIVE | ORG-DISCRETION |
  UNRESOLVED/CONFLICTING
- **What an organization/platform would need to decide:** concrete, or
  "nothing — fully specified"
- **Confidence:** High / Medium / Low, with one sentence why
- **Still open:** what a human (counsel, LSBME/LSBN contact) would need to
  confirm in writing before this becomes a Clarity rule

**B. Directory acquisition findings** — one record per Section 3 source, with:
- **Source name and URL**
- **Access mechanism:** bulk file | documented API | interactive search only
  (flag interactive-only sources as not suitable for programmatic ingestion
  without a separate terms-of-service review)
- **Fields available**
- **Update cadence**
- **Louisiana-filterable / taxonomy-filterable:** yes/no and how
- **Terms-of-use note:** anything restricting redistribution or automated
  retrieval

## SECTION 5 — RULES

- **Do not fabricate a citation, a URL, or a field list.** If a bulk-data
  mechanism does not appear to exist for a given board, say so plainly rather
  than describing its interactive search form as if it were one.
- **Do not issue a legal opinion** on whether a specific PMHNP may sign a
  specific document. Report what the statute/rule says and stop there.
- **Do not compile or infer information about any specific named
  individual's clinical practice, patient panel, malpractice history, or
  personal details** beyond what a state licensing board itself publishes as
  basic license-verification data (name, license number/status, address of
  record, specialty/taxonomy).
- Distinguish Louisiana state sources from federal sources (NPPES/CMS) and
  from private/association sources at every step.

---

## What this does not establish

- Research output is **reference material**, not a Clarity rule. It does not
  by itself resolve the PMHNP signer-authority open question in ADR-0014 or
  anywhere else — that requires an explicit owner ruling plus counsel review
  (OD-2) and clinical-licensing review (OD-3).
- It does not authorize building a provider-directory ingestion feature,
  storing any real practitioner's data, or contacting any practitioner. Those
  are separate, later decisions.
- It creates no approved clinical, legal, or credentialing rule content, and
  no claim of production readiness.
- Clarity holds synthetic data only and is not a deployed clinical system.
