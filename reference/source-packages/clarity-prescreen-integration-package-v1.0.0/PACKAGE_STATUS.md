# Package Status

## Delivered state

| Area | Status | Meaning |
|---|---|---|
| Product definition | Complete for implementation review | Scope, actors, workflows, states, rules, and non-goals are defined. |
| Architecture | Complete for ADR review | One recommended architecture and bounded contexts are provided. |
| API/contracts | Complete as proposed contracts | OpenAPI, schemas, events, permissions, and errors are reviewable. |
| Data model | Complete as proposed model | Prisma and SQL constraints are supplied; not applied to the repository. |
| Reference code | Complete as standalone reference | Must compile and pass included tests before release of this package. |
| UX | Complete for design and implementation planning | Screen hierarchy, states, actions, and accessibility are specified. |
| Legal rules | Baseline researched; production enforcement blocked | Facility/counsel review and effective-date verification remain required. |
| Clinical rules | Product-owner workflow captured; production enforcement blocked | Hospital-approved clinical governance remains required. |
| Transport registry | Architecture complete; live credential verification required | Provider availability cannot be inferred from a static package. |
| Repository integration | Planned, not executed | No live Clarity files are changed by this package. |
| Production deployment | Not included | Hosting, managed identity, RLS, secrets, monitoring, and release evidence remain open. |

## Owner-defined decisions carried into the package

1. Prescreen is the front door and operating heart of Clarity.
2. The primary external users are crisis-response officers and public/private prescreen assessment teams.
3. The receiving hospital and Central Intake remain the primary decision and coordination users.
4. Patient willingness, orientation, formal-voluntary eligibility, admission authority, legal status, and transport authority are separate fields and states.
5. Orientation is recorded for person, place, time, and situation.
6. A patient not oriented to all four cannot proceed through the formal-voluntary pathway at the prescreen level; an authorized hospital role determines the appropriate pathway.
7. A noncontested patient does not object but cannot provide knowing and voluntary consent; hospital intake and an authorized practitioner own the final status.
8. OPC, PEC, and CEC transport uses ambulance, law enforcement when authorized, or an approved secured patient-transport pathway; family/self/rideshare transport is blocked under those configured instrument paths.
9. Intoxication and fluctuating orientation require situational clinical reassessment; Clarity may trend operational patterns but may not infer individual capacity.
10. Minor and guardian authority is represented through a rule matrix, not a universal “guardian signs everything” switch.
11. Facility medical-clearance, inclusionary, exclusionary, consent, and transport-exception rules are configured through governed onboarding and policy ingestion.
12. Integrations are contract-first, vendor-neutral, adapter-based, and system-agnostic.
13. MAR means Medication Administration Record.
14. TAR means Treatment Authorization Request.

## Release blockers for production use

- Clinical approval of assessment content and escalation logic.
- Legal review of jurisdictional instrument, consent, minor, custody, and transport rules.
- Security/privacy threat model and production control verification.
- Accepted production API/hosting/tenancy ADR.
- Managed identity and production authorization enforcement.
- Facility-specific configuration approval.
- Live transport-provider credential and service-area verification.
- PHI handling, retention, encryption, logging, backup, and incident-response approval.

## Package verification completed

- Standalone TypeScript reference build: **passed**.
- Standalone reference tests: **31 passed, 0 failed**.
- JSON Schema example validation: **passed**.
- Ten synthetic assessment fixtures validated: **passed**.
- OpenAPI YAML parse and expected path inventory: **passed**.
- Packaged binary-media scan: **passed; no images or PDFs included**.

Evidence is stored under `verification/`.
