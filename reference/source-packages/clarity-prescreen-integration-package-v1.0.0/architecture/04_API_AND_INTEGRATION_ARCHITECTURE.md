# API and Integration Architecture

## Principle

System-agnostic does not mean “connect to anything automatically.” It means the canonical domain is independent of vendors, and each integration is implemented through a versioned adapter with explicit authentication, mapping, provenance, acknowledgements, retries, and failure handling.

## Public interface layers

1. **Native Clarity REST API** described by OpenAPI.
2. **Healthcare adapters** for FHIR and HL7 v2 when a partner supports them.
3. **Event/webhook adapters** for asynchronous updates.
4. **Secure file adapters** for SFTP/CSV/PDF/document feeds.
5. **Manual-entry adapter** for approved human-attested workflows.

## Canonical model rule

External codes remain in mapping tables. The core domain receives canonical concepts plus source metadata:

```text
sourceSystem
sourceObjectType
sourceObjectId
sourceVersion
mappingVersion
receivedAt
sourceOccurredAt
provenance
```

## FHIR candidates

Potential mappings to validate with each implementation guide:

- Patient / RelatedPerson
- Practitioner / PractitionerRole
- Organization / Location
- Encounter
- Questionnaire / QuestionnaireResponse
- Observation
- Condition
- MedicationRequest / MedicationAdministration
- DocumentReference / Binary
- ServiceRequest
- Consent
- Task
- Communication
- Provenance

Do not assume base FHIR resources alone satisfy jurisdictional prescreen or legal workflows.

## HL7 v2 candidates

- ADT for patient/encounter movement;
- ORU for results;
- MDM for documents;
- ORM/OML for orders;
- custom/local interfaces only behind explicit mapping and governance.

## Webhooks/events

- sign payloads;
- include event ID/schema version;
- support idempotent replay;
- retry with bounded exponential backoff;
- dead-letter failed events;
- expose delivery status;
- prevent webhooks from bypassing domain authorization.

## Files/imports

- quarantine and malware scan;
- validate MIME, extension, size, schema, and encoding;
- map source values through an approved mapping version;
- create import batch and row-level results;
- never silently discard invalid rows;
- support correction and reprocessing.

## Framework decision

The current repository’s `node:http` spike and proposed Fastify ADR must be reconciled before route expansion. The package’s domain and OpenAPI contracts remain framework-independent.
