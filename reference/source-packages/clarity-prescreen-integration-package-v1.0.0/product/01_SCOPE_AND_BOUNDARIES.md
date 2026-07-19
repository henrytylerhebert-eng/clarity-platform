# Scope and Boundaries

## Start and stopping points

### Starts

- A crisis contact, referral, officer encounter, field assessment, facility call, or Central Intake request creates or links a prescreen encounter.

### Ends

The prescreen workflow ends when one of these terminal outcomes is recorded:

- accepted and handed off to the destination;
- redirected to another service or level of care;
- declined with a structured reason and next-step plan;
- medically escalated and transferred to another workflow;
- closed because the request was withdrawn, the patient left, or contact was lost;
- duplicate or erroneous encounter voided without deleting history.

## In scope for the first complete product

- Rapid case start.
- Guided field prescreen.
- Source attribution and collateral.
- Safety and emergency interruption.
- Willingness, orientation, and possible pathway identification.
- Assessment review, attestation, corrections, and supplements.
- Referral packet requirements and document status.
- Central Intake receive/review/request-more-information workflow.
- Communications and workflow tasks.
- Authorized clinical/legal/acceptance review requests.
- Facility routing and response.
- Transport qualification and custody handoff.
- Minor/guardian authority checks through configurable rules.
- Facility profiles and governed policy ingestion.
- Audit timeline and operational trend events.
- REST/OpenAPI boundary and adapter contracts.

## Explicit non-goals for the first slice

- Automated diagnosis.
- Automated dangerousness or grave-disability determination.
- Automated capacity determination.
- Automated OPC, PEC, or CEC execution.
- Automated medical clearance.
- Automated admission acceptance or decline.
- Predictive patient-level disposition.
- Proprietary medical-necessity criteria replication.
- Live EHR, CAD/RMS, payer, transport, or facility integrations.
- Production PHI.
- Legal deadline enforcement before counsel approval.
- Automatic publication of rules extracted from policy documents.
- Production deployment.

## Relationship to existing Clarity

Prescreen should reuse and extend the existing patterns for:

- case identity and tenant scope;
- evidence and document versions;
- benefits as a parallel non-blocking lane;
- legal status and custody events;
- packet preview and facility response;
- authenticated actor derivation;
- controlled commands, idempotency, optimistic concurrency, and audit.

Prescreen should not be implemented as a giant replacement for all existing workspaces. It should become the coordinating experience and domain boundary that links them.

## Privacy boundary

- Raw source files remain in the transactional PHI zone.
- Field users see the minimum necessary information for their role and assignment.
- External users do not receive unrestricted access to the full case.
- Operational dashboards use de-identified or minimum-necessary data.
- Sensitive narrative, document text, tokens, and legal instruments are not logged.
