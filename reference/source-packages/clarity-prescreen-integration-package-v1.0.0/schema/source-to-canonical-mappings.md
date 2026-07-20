# Source-to-Canonical Mappings

## Mapping rule

Source-specific values are preserved as provenance and mapped to a canonical concept through an approved mapping version. Unknown values fail visibly; they are not silently coerced.

## Source-form mapping

| Source concept | Canonical object |
|---|---|
| Caller/referral source | `PrescreenEncounter.referralSourceJson` + communication contact |
| Patient demographics | Existing Clarity person/case identity boundary; not duplicated here |
| Presenting problem narrative | Prescreen answers with patient/source attribution |
| Hallucinations, paranoia, agitation, depression, etc. | Question-coded answers plus source-linked narrative; not automatic diagnoses |
| SI/HI/violence/grave-disability information | Safety-domain answers and evidence; human review required |
| Oriented x4 | Four `PrescreenOrientationObservation` domain findings |
| Voluntary/noncontested/involuntary notes | Willingness + possible pathway + authorized review record |
| Recent nursing notes | Document versions linked to packet requirements |
| MAR | Document type `MEDICATION_ADMINISTRATION_RECORD` |
| TAR | Document type `TREATMENT_AUTHORIZATION_REQUEST` |
| Labs/H&P/provider notes | Document versions + medical-screening requirement states |
| Falls/wounds/oxygen/precautions | Nursing/medical answers plus packet evidence |
| Return to facility/discharge plan | Placement/continuity answers and workflow tasks |
| Signature/title/date | Assessment attestation and actor identity |
| Faxed packet | `ReferralPacketTransmission`; do not treat fax as the packet itself |

## FHIR candidates

| Canonical concept | Candidate FHIR resources | Mapping caution |
|---|---|---|
| Person/case | Patient, Encounter | Partner profile and identifier authority required. |
| Assessor/organization | Practitioner, PractitionerRole, Organization | Credential/authority remains Clarity policy. |
| Assessment | QuestionnaireResponse, Observation | Preserve original questionnaire/version and source. |
| Documents | DocumentReference, Binary | Validate access and content security. |
| Medications | MedicationRequest, MedicationAdministration | MAR document and discrete administration data are different. |
| Tasks/communications | Task, Communication | Workflow semantics must match canonical states. |
| Consent | Consent | Legal authority still evaluated through approved rule matrix. |
| Provenance | Provenance | Do not lose source time, recorder, and transformation mapping. |

## HL7 v2 candidates

| Source message | Candidate use |
|---|---|
| ADT | Identity/encounter/location updates |
| ORU | Lab/result observations |
| MDM | Clinical documents |
| ORM/OML | Orders |

## Transport integrations

Always map:

- arranging organization;
- actual carrier;
- provider category;
- dispatch ID;
- vehicle/crew when available;
- accepted/pickup/arrival times;
- credential decision source;
- trip status;
- exception/cancellation.
