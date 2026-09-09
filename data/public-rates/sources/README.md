# Public payment source snapshots

Retrieved 2026-09-09 from the official publishers. No patient records are included.

| Archived file | Official source | SHA-256 |
| --- | --- | --- |
| LA-IP-2025-07-01.xlsx | https://www.lamedicaid.com/provweb1/fee_schedules/Inpatient_Hospital_Per_Diem_Listing_07-01-25.xlsx | 7a0be36855f688d515d2c8ad42a50ed3fb85cd7b17d05e705927cccd310c8b30 |
| LA-IP-2026-07-01.xlsx | https://www.lamedicaid.com/provweb1/fee_schedules/Inpatient_Hospital_Per_Diem_Listing_Current.xlsx | 143a108e30c88490a34e63ae6cbb09541bae2486c8ef9feb6d1cb0a032fd33f4 |
| CMS-IPF-FY2026-ADDENDUM-A.pdf | https://www.cms.gov/files/document/fy-2026-addendum-ipf-pps-final-payment-updates.pdf | b77f2efcc263a88567474425bff9bb8ff3a847ea81609370f9ccb9e8d46e19d9 |

The normalized `../la-inpatient-2026.json` contains 566 July 2025 and 560 July 2026 active-provider rows. Source sheet names, row numbers, row effective dates, release URLs, retrieval timestamps and hashes are retained. The extraction maps columns A provider ID, B facility, C hospital type, D rate type, J current per diem, K current per-diem effective date, and U Medicare number. Dollar values are converted to integer cents; blank rates and dates stay null. Closed-provider sheets are excluded. Other source columns remain available in these original bytes.

Do not infer a provider profile from Dunder Mifflin's display name. The public provider selector is an explicit scenario input and is not a saved hospital binding. Scenario coverage is bounded to calendar 2026 and also checked against each row's effective date. Missing or duplicate provider/rate-type rows are unpriced. July 2025 includes duplicate provider 2700146 / Other Rural rows; both releases include a missing rate for provider 1700070 / Acute. Neither is silently repaired.

The Louisiana calculation multiplies entered eligible days by a unique published per diem, splitting release boundaries. It does not establish eligibility, actual reimbursement, managed-care contracted payment, supplemental payment, benefit liability or cash. The Medicare calculator applies the published dollar labor/non-labor split to an entered wage index; it is a federal base component only. Facility/patient/stay adjustments and FY2027/OPPS/SBH engines are not implemented by this data snapshot.
