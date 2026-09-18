---
status: Draft — product-owner review required before external use
owner: Tyler Hebert
version: 1.0.0
date: 2026-09-14
scope: The gate every external Clarity claim passes through. Companion to CLARITY_MESSAGING_FOUNDATION.md.
governs: website copy, decks, one-pagers, demo scripts, emails, conference talks,investor conversations, job posts
---

# Clarity — Claims and Evidence Ledger

Root `CLAUDE.md` hard rule 4 forbids claiming production readiness, HIPAA
compliance, malware protection, working external integrations, or approved
clinical/legal rules. This ledger operationalizes that rule for anything
customer-facing, and adds the marketing-specific hazards: measured outcomes,
ROI, and competitor comparisons.

**The rule:** a claim may be made externally only if it appears in §1 below, in
the form given. If a sentence makes a claim §1 doesn't cover, **change the
sentence, not the ledger.** Adding a row to §1 requires the evidence column to
be filled with a real artifact — not an intention.

---

## 1. Claims that may be made today

| # | Claim, in the form it may be stated | Evidence | Caveat that must travel with it |
|---|---|---|---|
| C-1 | "One capture becomes the intake record, risk findings, medical-necessity draft, legal instrument scaffold, referral packet, and custody events without retyping." | `app/src/domain/packets.ts`, `epec.ts`, `GuidedIntake.tsx` | Demonstrated in the prototype on synthetic data. |
| C-2 | "Every evidence item enters review as a candidate; nothing auto-approves, and an item with no source reference cannot be approved." | `app/src/domain/services.ts` (`evidenceStatusFromReview`, `buildEvidenceLedger`) | Prototype behavior. |
| C-3 | "Draft language asserting 'meets InterQual / MCG / ASAM / LOCUS' or 'admission is medically necessary' is blocked before review." | `app/src/domain/guardrails.ts` (`prohibitedCriteriaPatterns`) | It is a language guard, not a clinical-criteria engine. |
| C-4 | "Custody events are SHA-256 hashed over canonical JSON and chained; altering one breaks verification." | `app/src/domain/hashLedger.ts`, `hashLedger.test.ts` | Tamper-*evident*, not tamper-proof; no key management or external anchoring exists. |
| C-5 | "The benefits lane runs in parallel and cannot block the clinical lane." | `docs/workflows/CASE_WORKFLOW.md`, `docs/09-personas-and-role-ux.md` design rule 7, persona 4 guardrails | Stated product boundary, enforced in prototype UI. |
| C-6 | "Louisiana OPC/PEC/CEC rules are configuration, not hard-coded law; a second jurisdiction is a new rule set." | `app/src/domain/epecRuleSets.ts`, `docs/legal/LEGAL_STATUS_ARCHITECTURE.md` | No second jurisdiction has been built. |
| C-7 | "Where the printed OBH form and the statute disagree on a custody window, both values are carried and the conflict is named." | `epecRuleSets.ts` `custodyWindowsMinutes` + `DEADLINE_CONFLICTS`; `docs/legal/LOUISIANA_OPC_PEC_CEC_FORM_VERIFICATION.md` | Neither value is asserted as correct; counsel validation is required. |
| C-8 | "Eight personas share one canonical case record and see it through different lenses; a new persona is a config entry, not a new code path." | `app/src/domain/roles.ts`, `roles.test.ts` (role invariants), `docs/09-personas-and-role-ux.md` | Prototype role scoping is display-only; it is not authentication. |
| C-9 | "Three applications — Crisis Ops, Operating Assurance, RevOps — share one organization/user/role model, one authentication mechanism, one audit trail, and one deployable backend." | `docs/ux/PRODUCT_TOPOLOGY_DECISION.md`, `app/src/ClarityShell.tsx`, `app/src/domain/AuthContext.tsx` | Local only. |
| C-10 | "Tenancy appears in every predicate; a record id is never authorization." | Root `CLAUDE.md` architecture invariants; `packages/case-repository` gateways | Enforced locally against `clarity_dev`; no provider-backed RLS verification has been performed. |
| C-11 | "The product displays *No measurements found* rather than an unmeasured improvement claim." | `docs/09-personas-and-role-ux.md` persona 8 focus KPIs | This is a feature. Say it as one. |
| C-12 | "20 architecture decision records govern the build; 18 are accepted." | `docs/architecture/ADR-*.md` on `main` (18 marked `Accepted`, ADR-0019 `Proposed`) | Count as of 2026-09-14; re-check before quoting. Never call a proposed ADR accepted. |
| C-13 | "RevOps keeps budget, actual activity, forecast, and collections as four distinct data layers, so estimated revenue is never presented as cash." | `docs/product/INPATIENT_REV_OPS_PRODUCT_DEFINITION.md` §5 | Synthetic data; no hospital pilot. |
| C-14 | "The operating model behind RevOps reflects ten years of the product owner's workbook-based hospital operations practice." | `INPATIENT_REV_OPS_PRODUCT_DEFINITION.md` §1 | Owner-reported operational evidence. Time savings and error reduction are **not** measured. |
| C-15 | "Operating Assurance is designed so the client operates the workspace and the consultant remains the supervisory control plane." | `docs/discovery/operating-assurance/PRODUCT_INTELLIGENCE_BRIEF.md` | Product definition stage. Not implemented as described; no corpus use or pilot is authorized. |

**Test counts and verification runs** may be cited only from
`IMPLEMENTATION_STATUS.md`, with the session date attached, e.g. *"as recorded
for the 2026-09-13 session."* Never state a count from memory, and never state
one as current without re-running the gate.

---

## 2. Claims that may never be made

| Forbidden | Why | Say instead |
|---|---|---|
| Production-ready / deployed / live | It is a local prototype plus backend foundations. | "A working prototype on synthetic data, with tested backend foundations." |
| HIPAA-compliant / PHI-ready / secure | No security or privacy review has occurred. | "Synthetic data only, until formal security and privacy review." |
| Integrates with [EHR / payer / CAD / bedboard / messaging] | No external integration exists. | "Designed for these integrations; none is built." |
| Clinically validated / legally approved / counsel-cleared | Statutory content is flagged *counsel validation required*; clinical thresholds require review. | "Rule sets are configuration pending counsel validation." |
| Reduces boarding time / improves acceptance / cuts denials by N% | **No measurement exists.** | "No measurements found. Establishing a baseline is the point of the first pilot." |
| Saves X hours / ROI of Y | Pricing and ROI are explicitly unvalidated hypotheses. | "Value hypotheses we intend to measure, not results." |
| AI decides / automates the determination / auto-approves | The product's core boundary. | "Produces candidates for qualified human review." |
| Better than [named competitor] | No comparative evaluation has been done. | Describe the mechanism and let it differentiate. |
| Used by / trusted by / customers include | There are no customers. | "Seeking design partners." |
| Real patient story, or anything resembling one | Governance hard rule 3. | Composite scenario, labeled as synthetic. |

---

## 3. Pre-publication checklist

Run this on every external asset before it ships.

- [ ] Every claim traces to a row in §1, in that row's form, with its caveat.
- [ ] No claim appears from §2, including by implication or image.
- [ ] The honest-state paragraph (Messaging Foundation §7) appears, or a link to
      it does — not buried, not in 8-point type.
- [ ] No number is quoted without a date and a source artifact.
- [ ] No real patient, real facility, real payer, or real insurance identifier
      appears; all scenarios are synthetic and labeled.
- [ ] No PHI/PII and no secrets — including in screenshots, alt text, demo
      recordings, and metadata.
- [ ] Screenshots come from synthetic fixtures only, and any visible banner
      identifying the environment as synthetic has not been cropped out.
- [ ] Clinical language has had clinical review, or is marked as requiring it.
- [ ] Statutory language has had counsel review, or is marked as requiring it.
- [ ] Product owner has approved the final asset.

---

## 4. When a claim graduates

A row moves from §2 to §1 only when all four are true:

1. **The artifact exists** — code merged, or a document accepted on `main`.
2. **It was verified in a session, not remembered** — with the evidence recorded
   in `IMPLEMENTATION_STATUS.md` or a test manifest.
3. **The right reviewer signed off** — clinical claims by a clinician, statutory
   claims by counsel, security claims by a security review.
4. **The caveat is written before the claim is used** — the limit ships with the
   sentence, permanently.

Outcome claims additionally require a **measured baseline**. Until a pilot
produces one, the honest answer is the one the product itself gives:
**No measurements found.**
