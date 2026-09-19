# Access Role & Authority Matrix

**Status:** PROPOSED_ARCHITECTURE

## Authority dimensions

Every capability must distinguish:

- **SEE** — can view status/information;
- **DO** — can perform the work;
- **REVIEW** — can review another actor's work;
- **DECIDE** — is authorized for the governed decision;
- **OWN** — accountable for getting the work completed.

Visibility is not authority.

## Initial role set

- Referral Source / Field Originator
- Central Intake Coordinator
- Assessment Clinician
- Authorized Practitioner
- Benefits / UR
- Receiving Admissions Coordinator
- Receiving Nurse
- Bed / Milieu Role
- Transport / Handoff Coordinator
- Compliance / Legal
- Program / Executive Oversight

These are capability roles, not required job titles.

## Initial matrix

| Capability | Referral/Field | Central Intake | Assessment Clinician | Authorized Practitioner | Benefits/UR | Receiving Admissions | Receiving Nurse | Bed/Milieu | Transport | Compliance/Legal |
|---|---|---|---|---|---|---|---|---|---|---|
| Start referral | DO | DO/OWN | SEE | SEE | SEE | SEE |  |  |  | SEE |
| Prescreen coordination | CONTRIBUTE | DO/OWN | REVIEW/DO as configured | SEE/REVIEW | SEE | SEE |  |  |  | SEE |
| Clinical assessment | SEE | SEE/OWN completion | DO/OWN | REVIEW/DECIDE where applicable | SEE | SEE | SEE |  |  | SEE |
| Clinical attestation |  | SEE/OWN completion | REVIEW as configured | DECIDE as configured |  | SEE |  |  |  | SEE |
| Legal workflow | CONTRIBUTE facts | SEE/OWN completion | CONTRIBUTE | SEE |  | SEE |  |  | SEE | REVIEW/DECIDE as configured |
| Benefits verification |  | SEE/OWN completion | SEE | SEE | DO/OWN | SEE |  |  |  | SEE |
| Authorization preparation |  | SEE/OWN completion | CONTRIBUTE | SEE | DO/OWN | SEE |  |  |  | SEE |
| Facility packet | CONTRIBUTE | DO/OWN | REVIEW relevant content | REVIEW relevant content | CONTRIBUTE | SEE/REVIEW | CONTRIBUTE |  |  | SEE |
| Facility response | SEE | COORDINATE/OWN follow-up | SEE | SEE | SEE | DO/OWN | SEE |  |  | SEE |
| Nursing report | CONTRIBUTE if sending nurse role is approved | COORDINATE | SEE | SEE |  | SEE | DO/OWN |  |  |  |
| Bed/milieu review |  | SEE | SEE | SEE |  | COORDINATE | SEE | DO/OWN/DECIDE per approved policy |  |  | SEE |
| Transfer/handoff | CONTRIBUTE | COORDINATE | SEE | SEE | SEE | COORDINATE | CONTRIBUTE/RECEIVE | SEE | DO/OWN | SEE |
| Admission confirmation |  | SEE | SEE | DECIDE only if facility policy grants |  | COORDINATE | CONTRIBUTE | CONTRIBUTE |  | SEE |

## Important boundary

The table above is a product-architecture proposal.

Final clinical, legal, nursing, admission, and facility authority must be configured from approved organizational policy and qualified review. Do not turn this matrix directly into production RBAC.
