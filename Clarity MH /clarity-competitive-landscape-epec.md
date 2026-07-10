# Clarity / Blue Partner — Competitive Landscape & Legislative Playbook
## Digital Chain of Custody for Emergency Certificates (PEC / OPC / CEC)

**Prepared:** July 2026 | **Scope:** Louisiana behavioral health crisis documentation & transfer

---

## 1. Problem Definition

When law enforcement or clinicians initiate an involuntary hold in Louisiana (Order for Protective Custody → Physician's Emergency Certificate → Coroner's Emergency Certificate), the process is:

- **Paper-native.** The current LDH OBH-1 PEC form (revised Aug 2025) is a static PDF with "Original to Hospital — One Copy to Examining Physician" triplicate logic.
- **Siloed.** Officer notes, CAD entries, ER intake, and the legal certificate live in separate systems with no shared record.
- **Custody-blind.** No hashing, no audit trail, no acceptance receipt. Transfers rely on faxes, hand-carried paper, and burned discs.
- **High-stakes.** Delays in hospital acceptance extend detention, delay care, and expose officers/clinicians to legal risk from under- or mis-documentation.

**The core unsolved job:** a statutorily-valid emergency certificate, executed and attested digitally, transmitted with evidence-grade chain of custody, and closed with a hospital acceptance receipt.

---

## 2. Competitive Matrix

| Capability | Julota | Behavioral Health Link | Bamboo Health (OpenBeds / CMS) | Axon Evidence / Justice | NC eCourts (Tyler Odyssey) | **Clarity wedge** |
|---|---|---|---|---|---|---|
| Co-responder encounter tracking | ● Core | ◐ | ◐ | ○ | ○ | ◐ (capture layer) |
| Mobile crisis dispatch / GPS | ◐ | ● Core | ◐ (via CMS) | ○ | ○ | ○ |
| Bed registry / referral matching | ○ | ◐ (GA registry) | ● Core (14+ states) | ○ | ○ | ○ (integrate, don't build) |
| Closed-loop referral w/ acceptance | ◐ | ◐ | ● | ○ | ○ | ● (acceptance receipt on the *legal instrument*) |
| **Legal form execution (PEC/OPC/CEC)** | ○ | ○ | ○ | ○ | ◐ (court filings, not field execution) | ● **Core** |
| **Attestation / e-signature to statute** | ○ | ○ | ○ | ○ | ◐ | ● **Core** |
| **Evidence-grade chain of custody (hash, WORM, audit)** | ○ | ○ | ○ | ● Core (criminal evidence only) | ◐ | ● **Core** |
| Media attachment (BWC, audio, photos) | ◐ | ◐ | ○ | ● Core | ○ | ◐ (link, don't store) |
| Redaction / controlled sharing | ○ | ○ | ○ | ● (auto-redact) | ○ | ◐ (role-based redaction) |
| HIPAA / 42 CFR Part 2 posture | ● | ● | ● | ◐ (CJIS/FedRAMP, not clinical) | ○ | ● Required |
| DA / court packet export | ○ | ○ | ○ | ● (disclosure portal) | ● (e-filing) | ● (bridge clinical→legal) |
| Louisiana statutory alignment | ○ | ○ | ○ | ○ | n/a | ● **Only player** |

● = core strength | ◐ = partial | ○ = absent

---

## 3. Player Profiles & Strategic Read

### Julota — the coordination incumbent
- Interoperability layer connecting LE, co-responders, EMS, hospitals; single dashboard, single sign-on; HIPAA + 42 CFR compliant.
- Highly customizable workflows; strong grant-reporting story (customized outcomes reporting for funders/policymakers).
- **Gap:** tracks encounters and referrals; does not execute or custody the legal instrument. No statutory form validity, no attestation, no hash-verified transfer.
- **Read:** future integration partner or acquirer, not a head-to-head competitor if Clarity stays in the legal-instrument lane.

### Behavioral Health Link (BHL) — mobile crisis dispatch
- GPS-enabled dispatch, real-time field documentation, standardized assessments, staff-safety features. Runs Georgia's real-time bed registry.
- **Gap:** same as Julota — clinical/dispatch focus, no legal custody layer.

### Bamboo Health (OpenBeds + Crisis Management System) — the referral rail
- Closed-loop digital referral system across 14+ states; Delaware cut psychiatric referral response times by 98%. NC's BH SCAN registry. 988-aligned Crisis Management System dispatched mobile teams 4,395 times in two states in early months.
- **Cautionary data point:** Michigan discontinued its OpenBeds-hosted registry (MiCARE, Oct 2023), citing lack of engagement and cost. Adoption — not technology — kills products in this category.
- **Read:** OpenBeds proves the acceptance-receipt model at state scale. Clarity's acceptance receipt should attach to the *certificate*, not just the bed. Louisiana does not currently run OpenBeds statewide — both an opening and a signal that LDH hasn't prioritized this rail.

### Axon Evidence / Axon Justice — chain of custody, solved (for crime)
- Immutable audit trails, hash-preserved originals, auto-redaction, transcript search, secure cloud case-sharing with prosecutors (replacing burned DVDs). CJIS/FedRAMP certified.
- Third-party reviews note Axon's chain-of-custody automation is LEO-workflow-centric; prosecution-side tools (Guardify, VIDIZMO, NICE) compete on the disclosure side.
- **Gap:** built for criminal evidence and Brady disclosure — not civil commitment, not HIPAA clinical handoffs, not statutory health forms.
- **Read:** Axon defines the custody UX expectations (audit trail, hashing, secure share). Clarity should meet that bar but aim it at a market Axon structurally ignores. Note: many LA agencies already run Axon BWC — plan a "link, don't duplicate" media integration.

### The whitespace
Nobody combines: **(1)** statutorily-valid PEC/OPC/CEC execution + attestation, **(2)** evidence-grade custody (hash, WORM audit, acceptance receipt), **(3)** HIPAA-governed clinical handoff, **(4)** court/DA-ready export. That intersection is the Clarity wedge.

---

## 4. The North Carolina Playbook (Legislative Precedent)

NC is the proof that states will *mandate* exactly this pipeline. Timeline:

1. **2021** — NC Supreme Court adopts e-filing rules; Judicial Branch begins statewide rollout of Tyler Technologies' Odyssey ("eCourts"), phased by judicial district.
2. **2023** — Session Law 2023-103 (HB 193) requires **electronic filing of involuntary commitment documents**. Statute (G.S. 122C-261) amended so that in eCourts counties, original paper affidavits and custody orders are no longer required — the electronic filing *is* the record.
3. **April 2024** — IVC petitions in live counties **must** be eFiled; faxing prohibited. NC Psychiatric Association publishes clinician workflow guides (file numbers, confidential case search, reusable templates).
4. **October 13, 2025** — all 100 counties live. Fax and "secure electronic transmission" workarounds eliminated statewide. Emergency/disaster fallback governed by county courthouse guidance.

### What transfers to Louisiana
- **Statutory hook already exists.** La. R.S. 28:53 already permits PEC examination by telemedicine with a licensed professional in the room — the legislature has accepted digital process in this exact workflow. The next step (electronic execution + transmission of the certificate itself) is incremental, not radical.
- **Louisiana's structure is different in a useful way.** NC's process runs through clerks/magistrates (courts). Louisiana's runs through **physicians and parish coroners** (LDH forms OBH-1/OBH-2, coroner second exam within 72 hours). That means the LA pipeline is a *health-system* modernization, not a judicial IT project — faster to pilot, no Tyler-scale court procurement required.
- **Pilot → statute sequence.** NC legislated after infrastructure existed. The Clarity play: demonstrate the digital PEC pipeline in 1–2 parishes (coroner + hospital + one agency), then hand LDH/legislators a working model to standardize — positioning Clarity as the reference implementation.
- **Adoption design matters more than features.** NC succeeded with mandates + training + templates. Michigan's registry died from voluntary adoption + cost. Build for the mandate scenario; price for the pilot scenario.

---

## 5. Recommended Next Moves

1. **Statutory field mapping.** Map OBH-1 (PEC) and OBH-2 (CEC) fields + R.S. 28:53/53.2 attestation requirements to Clarity's data model. Identify anything requiring rule change vs. what's achievable today (the statute doesn't prohibit electronic execution — verify with LA counsel).
2. **Coroner-first GTM.** The parish coroner is the chokepoint actor (OPC issuance + mandatory 72-hour second exam). One coroner's office (EBR, Orleans, or Lafayette) as design partner unlocks both ends of the workflow.
3. **Acceptance-receipt pilot.** 90-day, 10-officer pilot with one receiving hospital: digital PEC packet → secure transmission → timestamped accept/decline with reason codes. Baseline vs. pilot on time-to-acceptance and first-submission acceptance rate.
4. **Integration posture, not competition.** Publish an integration story for Julota (encounter data), OpenBeds-style registries (bed matching), and Axon (BWC media links). Clarity is the legal-instrument layer that makes those systems court-defensible.
5. **Watch the mandate window.** Track LA legislative sessions and LDH rulemaking for crisis-system modernization (988 buildout, CRC licensing under LAC 48:I.53xx). An NC-style e-filing mandate for emergency certificates is the category-defining event; be the incumbent pilot when it lands.

---

*Sources: Julota product documentation; Behavioral Health Link; Bamboo Health OpenBeds/CMS releases and Delaware/NC case studies; Michigan LARA MiCARE discontinuation notice; Axon Evidence/Justice documentation and third-party DEMS comparisons (Guardify, VIDIZMO); NCDHHS IVC guidance; NC Session Law 2023-103; G.S. 122C-261; NC Judicial Branch eCourts; La. R.S. 28:53; LDH OBH-1/OBH-2 forms; Orleans & Plaquemines Parish coroner process documentation.*
