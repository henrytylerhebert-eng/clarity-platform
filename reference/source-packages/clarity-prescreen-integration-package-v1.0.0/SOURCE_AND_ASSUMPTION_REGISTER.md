# Source and Assumption Register

## Classification labels

- **Confirmed:** Directly supported by the supplied Clarity repository snapshot or an official source.
- **Owner decision:** Explicit product-owner workflow direction.
- **Proposed:** Recommended product or technical design.
- **Unknown:** Evidence is not available in the package.
- **Needs approval:** Requires an authorized clinical, legal, security, compliance, or product decision.

## Source hierarchy

1. Current Clarity implementation and tests in the live repository.
2. `IMPLEMENTATION_STATUS.md` and accepted ADRs.
3. Canonical architecture, workflow, governance, and roadmap documents.
4. Product-owner decisions in the prescreen discovery sessions.
5. Official statutes, regulations, and agency sources.
6. Proposed architecture and reference code in this package.

## Material claims

| Claim | Classification | Source or handling |
|---|---|---|
| Clarity has a React/TypeScript prototype and service foundations. | Confirmed | `source-material/clarity-snapshot/IMPLEMENTATION_STATUS.md` |
| Current production API/hosting boundary is unresolved. | Confirmed | `source-material/clarity-snapshot/ADR-0012-api-architecture.md` |
| Communications, general workflow tasks, and durable referral-packet runtime are not production capabilities today. | Confirmed | `IMPLEMENTATION_STATUS.md` |
| Prescreen should become Clarity’s core field-to-intake module. | Owner decision | Prescreen discovery direction. |
| A person not oriented to person, place, time, and situation should not use the formal-voluntary pathway at prescreen. | Owner decision; needs clinical/legal approval | Implemented as a configurable gate and review route, not a universal capacity conclusion. |
| A noncontested pathway is distinct from voluntary and opposed pathways. | Confirmed/owner decision | Official Louisiana baseline plus workflow direction. |
| OPC/PEC/CEC transport should block family/self/rideshare transport. | Owner decision; needs local policy validation | Configurable transport policy. |
| Law enforcement may be involved when executing an OPC pickup. | Confirmed | Official Louisiana OPC baseline. |
| Acadian is an ambulance-service candidate. | Confirmed category; live eligibility unknown | Current license, contract, capability, and service area must be checked at dispatch. |
| Secure Patient Delivery markets behavioral-health/PEC transport. | Confirmed public representation; current eligibility unknown | Live carrier, insurance, local authorization, and regulatory standing must be checked. |
| MediTrans may coordinate transportation while another carrier performs the trip. | Confirmed role; trip qualification unknown | Capture arranging organization and actual carrier separately. |
| Parents/guardians may sign every minor consent. | Not adopted | Authority varies by age, pathway, document, treatment, privacy regime, and facility policy. |
| The completed source assessment may be included. | Prohibited | It contains patient-level information and is intentionally excluded. |
| The reference code compiles and tests pass. | Must be verified during packaging | Recorded in `package-manifest.json` after execution. |
| The feature is production-ready. | Unknown/false for this package | This is an implementation handoff, not a deployment. |

## Unknowns intentionally preserved

- The current live repository working tree after the supplied snapshot.
- Final API framework and hosting provider.
- Production identity provider.
- Exact tenant isolation and RLS design.
- Exact facility policies and effective versions.
- Live transport-provider credentials, service areas, contracts, and trip availability.
- Final Louisiana counsel interpretation and hospital governance decisions.
- Outcome improvements, time savings, denial reductions, or acceptance improvements.
