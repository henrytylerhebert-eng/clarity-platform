# RevOps financial-rate implementation

Status: authorized scope; implementation requirements documented. Rate ingestion and the facility payment engine are not implemented by this document.

Updated: 2026-09-09. Official sources below were checked on this date.

**2026-09-13 update:** R1's Louisiana Medicaid release registry is implemented
(ADR-0021) — see the Build sequence table below and
[docs/implementation/REV_OPS_RATE_RELEASE_REGISTRY.md](../implementation/REV_OPS_RATE_RELEASE_REGISTRY.md)
for what changed and its honest gaps. The CMS IPF FY2026 base-component source
was deliberately NOT converted to this registry (see that doc's Context
section for why). R2–R5 remain exactly as documented below — unstarted, and
R2 specifically remains blocked on the still-missing hospital identifiers.

## Accepted scope and selected profile

Tyler accepted **Dunder Mifflin Hospital - Restored Operations 2026** as the workbook baseline and authorized MVP definition, interface updates, workbook parity, and real financial-rate implementation. Workbook acceptance is complete as a product decision. It does not turn a public base rate, fictional workbook contract, or computed allowance into an actual payment.

The selected implementation target is a **specific Louisiana hospital profile**. Its identity and provider identifiers are pending from Tyler. Preserve Dunder Mifflin as the demonstration name and label the underlying reference profile explicitly once supplied. Do not silently substitute Opelousas, a statewide average, another hospital, or a generic national facility.

Required starting inputs are the hospital's legal name/location, Medicare CCN for the relevant hospital or psychiatric unit, and Louisiana Medicaid provider ID. Confirm Type 2 NPI and the billing entity/program relationship where needed. These identifiers have different meanings and are not interchangeable. Patient records remain synthetic; official public rates can be real.

## Existing implementation and workbook evidence

- [Workbook function F30 and rule N39](WORKBOOK_TO_PLATFORM_WORKFLOW_MAP.md) identify the payment-method boundary and workbook reference sheets: `MEDICARE_REFERENCE`, `IPF_FACTORS`, `BENEFITS_REFERENCE`, `LA_IP_JAN_JUN`, `LA_IP_JUL_DEC`, the `LA_SBH_*` sheets, `CONTRACT_RATES`, `DECISIONS`, and `SETUP`.
- [RevOps service](../../packages/rev-ops-service/src/index.ts) currently returns `forecast: null` and `collections: null`. [RevOps contracts](../../packages/domain-contracts/src/revOps.ts) and the [schema](../../prisma/schema.prisma) support the bounded aggregate operating workspace; inspection did not establish an executable Medicare/Medicaid/commercial allowance engine.
- [AT30](../testing/WORKBOOK_PLATFORM_ACCEPTANCE_MATRIX.md#at30) remains a required application proof. Acceptance authorizes building the missing behavior; passing workbook examples do not prove application calculation parity.

## Official release calendar and source register

| Method | Release selection for calendar 2026 | Verified official source and implementation consequence |
|---|---|---|
| Medicare IPF PPS, FY2026 | Discharges from October 1, 2025 through September 30, 2026 | [CMS FY2026 implementation guidance](https://www.cms.gov/files/document/mm14206-inpatient-psychiatric-facilities-prospective-payment-system-fy-2026-updates.pdf). Select by discharge date; do not price a cross-year stay by splitting ordinary census days at September 30. |
| Medicare IPF PPS, FY2027 | Discharges from October 1, 2026 through September 30, 2027 | [Published FY2027 final rule](https://www.govinfo.gov/content/pkg/FR-2026-07-31/pdf/2026-15588.pdf). The full 2026 workbook therefore requires a second IPF fiscal-year release. The rule identifies Addenda A/B and the wage-index tables; extract and verify them before activating FY2027 calculations. |
| Medicare hospital outpatient IOP/PHP | CY2026 annual policy plus the applicable quarterly update by service date | [CMS CY2026 final rule](https://www.cms.gov/medicare/payment/prospective-payment-systems/hospital-outpatient/regulations-notices/cms-1834-fc) and [quarterly Addenda A/B](https://www.cms.gov/medicare/payment/prospective-payment-systems/hospital-outpatient-pps/quarterly-addenda-updates). The checked quarterly page lists January, April, and July 2026, with July revised July 21. An October 2026 addendum was not listed in the checked page; its verification remains open. |
| Louisiana Medicaid inpatient hospital | Select the provider/type row and its effective date; annual workbook halves are reporting periods | [Louisiana inpatient per-diem index](https://www.lamedicaid.com/provweb1/fee_schedules/InPat_Fee.htm) lists current July 1, 2026 and previous July 1, 2025 releases. The January–June 2026 workbook tab does not establish a January 2026 inpatient rate release. |
| Louisiana specialized behavioral health | January 1, 2026 and July 1, 2026 versions, with row-level qualifiers | [Louisiana SBH index](https://www.lamedicaid.com/provweb1/fee_schedules/SBH_Fee.htm) lists these two releases and a legend. Retain procedure, modifiers, provider type, unit basis, limits, and applicability evidence. |
| Commercial, Medicare Advantage, Medicaid managed care | Effective agreement/amendment and applicable program/payment policy | Require the selected facility's payer/product/network agreement or other applicable authoritative payment terms. A public Medicare or Medicaid schedule alone does not establish this facility's contracted allowance. |

For Louisiana inpatient ingestion, the index links the [current XLSX](https://www.lamedicaid.com/provweb1/fee_schedules/Inpatient_Hospital_Per_Diem_Listing_Current.xlsx) and [July 2025 XLSX](https://www.lamedicaid.com/provweb1/fee_schedules/Inpatient_Hospital_Per_Diem_Listing_07-01-25.xlsx). For SBH it links the [current XLSX](https://www.lamedicaid.com/provweb1/fee_schedules/SBH_FS.XLSX), [January 2026 PDF](https://www.lamedicaid.com/provweb1/fee_schedules/SBH_FS_01-01-2026.pdf), and [legend](https://www.lamedicaid.com/provweb1/fee_schedules/SBH_legend.xlsx). Index contents and link targets were checked; the downloadable Louisiana data rows were not extracted or reconciled in this task. A mutable URL containing `Current` must be archived and hashed during ingestion; it is not a release identifier.

## Public reference inputs versus facility application

**Medicare IPF.** The official [FY2026 Addendum A](https://www.cms.gov/files/document/fy-2026-addendum-ipf-pps-final-payment-updates.pdf) publishes a federal daily base of $892.87, or $875.44 for the quality-reporting reduction branch, with a 79% labor share. These can be loaded as public reference inputs now. They are not the selected hospital's final per diem. The [CMS IPF overview](https://www.cms.gov/medicare/payment/prospective-payment-systems/inpatient-psychiatric-facility) describes patient, facility, outlier, interrupted-stay and ECT adjustments. Implement the documented methodology with the correct annual files, provider-specific wage index/history and applicable cap, rural/transition status, teaching inputs, qualifying ED status, quality-reporting branch, cost-to-charge information, and synthetic stay/diagnosis/comorbidity/age/ECT facts. Verify the result against a qualified independent calculation or CMS Pricer before presenting it as a validated allowance. Do not infer provider-specific inputs from the fictional display name.

**Hospital IOP/PHP.** CMS retains separate hospital and CMHC payment structures, with three-service and four-or-more-service daily tiers. IOP and PHP have distinct program requirements. [CMS CY2026 IOP/PHP policy](https://www.cms.gov/newsroom/fact-sheets/calendar-year-2026-hospital-outpatient-prospective-payment-system-opps-ambulatory-surgical-center). Load the applicable APC/HCPCS/status-indicator release and validate facility setting, billable service composition, date, units, modifiers, packaging and wage adjustments. Workbook attendance, participant-days, or group counts alone do not establish billable services or program eligibility. FQHC, RHC and OTP methods need their own supported calculation paths when added.

**Louisiana Medicaid.** Public inpatient provider rows and SBH procedure/provider/modifier schedules can be ingested before the hospital ID arrives. Applying them requires an exact provider and covered setting match, effective row selection, and the relevant fee-for-service or managed-care authority. The inpatient per diem, SBH service rate, and managed-care capitation are different units and payment relationships. Do not use a capitation rate as the hospital's reimbursement. Unknown or unmatched rows remain unpriced, with the reason visible.

**Commercial and managed plans.** Store payer, product/plan, network status, funding arrangement (including ASO where relevant), contract version, facility/program, effective dates, payment basis, carve-outs and amendment precedence separately. HMO/PPO/EPO names identify plan design, not a numeric fee. Use a verified contract/schedule and identified terms for real pricing; preserve fictional workbook contracts as synthetic examples. Public transparency files may supply reference evidence but require an exact facility/plan/service match and reconciliation to the governing terms. No commercial dollars are supplied by this document.

## Build sequence

| Phase | Deliverable | Required evidence before advancing |
|---|---|---|
| R1 — release registry | **Louisiana Medicaid inpatient per-diem: implemented (ADR-0021), 2026-09-13** — persisted, tenant-attributed-but-not-tenant-scoped registry with correction/supersession support, replacing the bundled JSON as the runtime source. CMS IPF FY2026 base-component source remains a code constant, deliberately not converted (single value, no row-level correction shape). | Row counts, key-field checks, sampled dollar/unit comparisons to originals; no inferred rates — see the implementation doc's test manifest for what actually ran |
| R2 — provider and contract applicability | Bind the supplied real Louisiana profile and explicit payer/product/network/contract scope to supported methods; use synthetic patient activity | Exact identifier match, setting/method match, effective dates and missing-input reasons; no automatic nearest-hospital fallback |
| R3 — separate calculators | Implement and test IPF FY2026/FY2027, applicable CY2026 hospital IOP/OPPS, Louisiana inpatient and SBH, then supplied commercial methods | Method-specific golden cases and boundary tests; independent expected values; transparent calculation trace |
| R4 — operational integration | Apply reviewed rules to eligible synthetic activity; show rate release, provider profile, basis, exceptions and modeled allowance in RevOps | Drill-through from result to activity and source/version; operational counts survive missing rates; no hidden zero substitution |
| R5 — financial reconciliation | Reconcile modeled allowance to separate charges, benefit liability, claims/remittance adjustments and collections; support effective-dated revisions | Immutable prior close/receipt, explicit revision/review, and separate budget/actual/forecast/cash values |

R1 can proceed while identifiers and contracts are pending. R2 prevents activation for the selected hospital until applicability inputs exist. This is an input dependency, not a renewed workbook-acceptance gate.

## Acceptance tests

1. **Release boundaries:** IPF discharge on September 30 versus October 1 selects FY2026 versus FY2027. Include a stay spanning both dates. Inpatient and SBH Medicaid June 30 versus July 1 selects the correct provider/service row. OPPS quarter changes resolve to the verified release, including corrections.
2. **Identity and setting:** Missing/wrong CCN, Medicaid provider ID, hospital-versus-CMHC setting, or unit relationship returns an explicit missing/unsupported result. No substitution of another provider or national base as final allowance.
3. **Method mechanics:** Independent synthetic examples cover IPF quality branches, wage adjustment and cap, rural/transition/teaching, interrupted stays, outlier and ECT where supported; OPPS three versus four-plus qualifying services, invalid service composition and packaging; Medicaid unit/modifier/provider distinctions; contract percentage/per-diem/case-rate terms only when supplied and supported.
4. **Missing and conflicting data:** A zero rate is distinct from a missing rate. Overlapping applicable contract versions are an exception, not first-match pricing. Unpriced activity remains in census/attendance totals and is reported separately from priced allowance.
5. **Lineage and revision:** Every calculation saves inputs, method version, release hash, source row, applicable profile, rounding and result. A corrected rate creates a new calculation/version; previous reviewed closes and receipts remain reproducible.
6. **Financial meaning:** Approved budget, operating actuals, modeled allowance, benefit liability, posted charges, forecast and cash collections stay distinct. An allowance does not automatically become a paid claim or patient responsibility.
7. **Extension:** Add a future year or payer/product using new releases/configuration and supported methods without altering historical results. Unsupported methods remain visible rather than being forced into a flat rate.

## Current verification and next action

This task verified official CMS documents and Louisiana index/link metadata, and inspected the existing RevOps implementation boundary. It did not ingest the full tables, validate the selected provider, execute financial calculators, or run application tests. Performance: No measurements found.

Next: receive the selected hospital identifiers, archive the exact official releases, and implement R1 plus the provider applicability record using existing repository patterns. Treat both public-rate provenance and future workbook-to-application parity as independently testable evidence.
