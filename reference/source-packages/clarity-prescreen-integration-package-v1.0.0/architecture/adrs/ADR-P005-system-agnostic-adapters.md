# ADR-P005 — Contract-First, System-Agnostic Adapters

- **Status:** Proposed

## Decision

The canonical prescreen domain remains independent of the HTTP framework, EHR, transport vendor, file format, event bus, and hosting provider. External sources connect through adapters that map to versioned canonical commands/events and preserve provenance.

## Consequences

- REST/OpenAPI is the native interface, not the only interface.
- FHIR, HL7 v2, webhooks, SFTP/CSV, and document ingestion can be added without changing domain invariants.
- Each adapter needs mapping tests, acknowledgements, retries, and dead-letter handling.
- “Connect to anything” remains conditional on a supported interface and approved mapping.

## Rejected

- Source-system-specific fields inside core domain entities.
- Direct database integration from partners.
- Framework types in domain contracts.
