---
status: registry — partial verification against live sources; not a substitute for OD-13 (CMS regulatory research, not yet executed) or OD-2/OD-3 (counsel/clinical review)
depends_on: docs/ux/PRODUCT_TOPOLOGY_DECISION.md (terminology audit runs after topology, per brief §9-10 ordering)
---

# Clarity language registry

## Epistemic status (read before using this table)

This registry separates four columns, per the brief:

- **Engineering term** — the code identifier (a `WorkspaceId`, a Prisma model,
  a route path). Never shown to a user.
- **Domain term** — Clarity's own internal name for the concept, as it
  appears in the UI today.
- **Industry term** — the standard CMS/SAMHSA/HHS/AHRQ or professional term
  for the same or closest concept, where one exists.
- **User-facing term** — what should actually render on screen, which is
  usually the domain term, sometimes adjusted toward the industry term where
  the current wording obscures a term clinicians and UR staff already know.

A handful of the industry-term rows below were checked live against SAMHSA
and secondary CMS-adjacent sources this session (cited per row). This is
**not** the executed version of the CMS/Medicare/Medicaid deep-research
prompt already sitting at
`docs/legal/GEMINI_DEEP_RESEARCH_PROMPT_CMS_MEDICARE_MEDICAID.md` (OD-13,
still not run) or the Louisiana psychiatrist/PMHNP prompt
(`docs/legal/GEMINI_DEEP_RESEARCH_PROMPT_LA_BEHAVIORAL_HEALTH_PRESCRIBERS.md`).
Treat every row here as `Assumed`-to-`Verified-for-general-usage`, never as
`Verified-for-Clarity's-specific-regulatory-posture`, until those research
passes run and OD-2/OD-3 close.

## Core workflow terms

| Domain term (Clarity UI) | Engineering term | Industry term | Status | Recommendation |
|---|---|---|---|---|
| Medical Necessity | `medical` (`WorkspaceId`) | **Medical necessity** — a real, standard term; the threshold question in every utilization-review decision [1] | Verified as standard | Keep as-is — this is already the correct industry word |
| (not yet a named workspace; backend-only) | `utilizationReview.ts`, `Episode`/`EpisodeAuthorization` | **Utilization review (UR)** — standard term, distinct from medical necessity itself [1] | Verified as standard | If/when Episode/UR gets a frontend, name it "Utilization Review," not a Clarity-specific coinage |
| Benefits Verification | `benefits` (`WorkspaceId`) | **Eligibility and benefits verification** — standard term, explicitly distinguished from prior authorization in industry usage [2] | Verified as standard | Keep — matches industry usage precisely |
| Authorization Readiness | `authorization` (`WorkspaceId`) | **Prior authorization** is the standard industry term for the underlying process [2][3] | Partially Clarity-specific | "Readiness" is a deliberate, and correct, Clarity product concept — the workspace tracks *preparation* before a submission that this build does not yet make (submission is structurally unreachable, per `IMPLEMENTATION_STATUS.md`'s authorization-readiness entry). Do not rename to "Prior Authorization" outright; that would claim a capability (actual submission/adjudication) Clarity does not have. Consider "Prior Authorization Readiness" if disambiguation with the industry term is ever needed |
| Evidence Review | `evidence` (`WorkspaceId`) | No single standard industry synonym; closest is clinical/UR "documentation review" | Clarity-specific, deliberately | Keep — "Evidence" is a considered Clarity term of art (candidate → approved, contradiction-tracked) with more precision than generic "documentation" |
| Legal Status | `legal` (`WorkspaceId`) | Maps to Louisiana-specific statutory instruments (OPC, PEC, CEC — La. R.S. 28) and, at the federal level, involuntary-commitment/hold concepts | Verified, jurisdiction-specific | Keep — already named precisely for its actual scope (one state's instruments), not overgeneralized to "Commitment" |
| Custody Ledger / "chain of custody" | `ledger` (`WorkspaceId`), `CustodyEvent` | **Custody / hold / detention** are real terms used in EMTALA-and-state-commitment-law discussion of transporting behavioral health patients under legal hold [4] | Verified as grounded, not invented | Keep |
| Milieu Bedboard | `bedboard` (`WorkspaceId`) | **Milieu** (therapeutic milieu) is a real inpatient psychiatric nursing term; **bedboard** is a real hospital-operations term for a bed-management display | Verified as grounded (compound coinage) | Keep — the compound is Clarity's own, but both halves are real, correctly-used clinical/ops vocabulary, not invented jargon |
| Packet Preview / Packet Preparation | `packet` (`WorkspaceId`) | No single standard synonym; closest general concept is a "referral packet" in placement/transfer workflows | Clarity-specific, grounded in practice | Keep |
| Routing Response | `routing` (`WorkspaceId`) | Corresponds to EMTALA's "appropriate transfer" / receiving-facility acceptance concept [4] | Clarity-specific, grounded | Keep |

## Product/platform terms

| Domain term | Engineering term | Notes |
|---|---|---|
| Case Queue, Command Center, Case Overview, New Case, Guided Intake | `queue`, `command`, `overview`, `new`, `intake` | Plain product language, no industry-standard alternative needed; no change recommended |
| Training & SOPs | `training` (`WorkspaceId`) | Standard operations-management term ("SOP"); no change |
| Mock Admit Lab, Product Studio | `mock-admits`, `studio` | Internal/developer-facing tools, not clinical workflow — see §7 below on keeping these clearly marked as such, not renamed to sound clinical |
| IOP Reconciliation / IOP Attendance Reconciliation | `iop-reconciliation` (`WorkspaceId`) | **IOP** (Intensive Outpatient Program) is a standard CMS/behavioral-health level-of-care term. "Reconciliation" here means source-evidence linkage integrity, not financial reconciliation — worth a one-line UI clarifier since "reconciliation" is overloaded across this same codebase (RevOps also uses "reconciliation" for a different, financial concept — see below) |
| RevOps / Revenue Operations | `RevOps*` throughout | "RevOps" (Revenue Operations) is standard finance/ops shorthand outside healthcare; inside healthcare finance, "Revenue Cycle Management (RCM)" is the more standard umbrella term. Recommend keeping "RevOps" as Clarity's internal product-area name (already established, low switching value) while ensuring any *user-facing* copy that describes the area's job uses recognizable RCM vocabulary (budget, actuals, patient-day, per-diem, contract rate) rather than "RevOps" jargon |
| Census-upload / Actuals Reconciliation (inside RevOps) | `RevOpsReconciliation.tsx` | Same overload risk as above — this is a *data reconciliation* (saved vs. incoming rows), unrelated to IOP Reconciliation's *evidence-linkage* reconciliation. No rename needed, but the two should never appear near each other in one navigation list without a qualifier |
| Operating Assurance | `AssuranceCase`, `assurance-service` | "Assurance" in a governance/compliance sense (applicability, evidence, qualified review) is standard usage in quality/compliance functions generally; no closer single CMS/SAMHSA term applies since this is an internal governance capability, not a CMS-defined program |

## Status-vocabulary terms (the `StatusBadge` set — preserve, per brief §11)

| Term | What it communicates | Keep as-is? |
|---|---|---|
| Synthetic only | Data/workflow boundary: no real PHI, demonstration data | Yes — precise, load-bearing, already understood by every reviewer of this repo |
| Human review required | Workflow/safety boundary: no automated determination is final | Yes |
| Review-gated | Workflow boundary: an action is blocked pending review | Yes |
| Verified API boundary | Technical/trust boundary: this screen's actions pass through the real, database-backed session — see §7 for where this crosses into implementation-maturity signaling that should *not* reach production copy verbatim | Keep the underlying distinction; see §7 for phrasing guidance |

## Crisis-response vocabulary Clarity does *not* currently use

Checked against SAMHSA's 2025 Model Behavioral Health Crisis Services
Definitions [5] and the 988/mobile-crisis continuum [6]: terms like **988**,
**Mobile Crisis Team**, **Crisis Stabilization Unit**, **Community Outreach
Team**, and **Co-Responder Team** do not appear anywhere in Clarity's current
UI copy. This is not an inconsistency to fix — Clarity's actual scope (a
receiving-hospital/legal-instrument workflow, per
`GEMINI_DEEP_RESEARCH_PROMPT_LA_OPC_PEC_CEC.md`) sits at a different point in
the crisis continuum than the pre-hospital, dispatch-facing services those
SAMHSA terms describe. Flagging this only so a future feature that *does*
touch pre-hospital dispatch does not casually reuse Clarity's existing
hospital-side vocabulary for a materially different SAMHSA-defined concept.

## Open items for OD-13 / counsel review, not resolved here

- Whether "Authorization Readiness" should ever be renamed once real
  submission exists (see table above).
- Full verification of every Louisiana-specific statutory term against
  current R.S. Title 28 text — deferred to the LA OPC/PEC/CEC prompt.
- Full verification of Medicare/Medicaid coverage terminology against
  primary CMS sources — deferred to OD-13's CMS prompt, still not executed.

## Sources

- [1] [Medical Necessity Documentation in Mental Health: A Therapist's Guide to Utilization Review, Authorizations, and Insurance Notes](https://www.mentalyc.com/blog/medical-necessity-documentation-utilization-review-and-authorizations)
- [2] [Eligibility Verification & Prior Authorization: Complete 2026 Guide](https://claimmaxrcm.com/eligibility-verification-and-prior-authorization/)
- [3] [U.S. GAO — Medicare Advantage: CMS Oversight of Prior Authorization Criteria Should Target Behavioral Health Services](https://www.gao.gov/products/gao-25-107342)
- [4] [EMTALA and Psychiatric Hospitals](https://blog.thesullivangroup.com/emtala-and-psychiatric-hospitals)
- [5] [Model Behavioral Health Crisis Services Definitions Public Comment | 988 Crisis Systems Help](https://988crisissystemshelp.samhsa.gov/model-behavioral-health-crisis-services-definitions-public-comment)
- [6] [National Behavioral Health Crisis Care Guidance | SAMHSA](https://www.samhsa.gov/mental-health/national-behavioral-health-crisis-care)
