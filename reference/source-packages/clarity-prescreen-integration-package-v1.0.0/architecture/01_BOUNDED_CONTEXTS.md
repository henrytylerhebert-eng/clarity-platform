# Bounded Contexts

| Context | Responsibility | Owns | Does not own |
|---|---|---|---|
| Case & Identity Boundary | Case identity, tenant, assignment, overall lifecycle | case key, organization, relationships | prescreen answers, documents |
| Prescreen | Encounter, assessment versions, source statements, willingness, orientation, pathway flags | assessment and attestation | final clinical/legal/admission decision |
| Document & Evidence | Files, versions, classification, source-linked evidence, contradictions | source artifacts | assessment workflow state |
| Communications & Tasks | requests, contacts, ownership, deadlines, escalation, receipts | communication/task lifecycle | clinical conclusions |
| Referral Packet | target requirements, packet versions, manifests, transmissions | packet readiness and versions | facility policy source |
| Facility Policy | approved profiles, source mapping, versions, effective dates | configuration truth | patient facts |
| Clinical/Medical Review | authorized human review records | review decisions within authority | legal instruments |
| Legal & Consent | legal status, instrument references, signer/authority checks | legal/consent records | transport provider credentials |
| Facility Routing | destination submissions and responses | response lifecycle | admission episode |
| Transport & Custody | qualification, plan, dispatch, custody events | transport and handoff | provider licensing source registry |
| Provider Registry | provider category, credentials, service area, contracts, verification | provider eligibility inputs | trip decision without context |
| Analytics | de-identified operational facts and metrics | aggregate definitions/snapshots | transactional state |

## Key aggregate roots

- `PrescreenEncounter`
- `AssessmentVersion`
- `WorkflowTask`
- `ReferralPacket`
- `FacilityAdmissionProfile`
- `TransportProviderProfile`
- `TransportPlan`
- `ConsentAuthorityRuleSet`

## Cross-context references

Use opaque IDs and explicit service calls/events. Do not create ORM navigation that allows accidental cross-tenant or cross-context writes.

## Ownership rules

- Assessment text belongs to Prescreen.
- Uploaded records belong to Document/Evidence.
- A packet references immutable assessment and document versions.
- A facility profile owns requirements, not the packet.
- A transport plan snapshots the qualification decision and profile versions used.
- Analytics receives minimized event facts; it does not write operational state.
