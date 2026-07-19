# Behavioral Rules

## BR-001 — Source attribution is mandatory for material facts

Every material statement must distinguish:

- direct observation;
- patient report;
- family/support report;
- facility staff report;
- law-enforcement report;
- clinician report;
- document-derived fact;
- system-derived status;
- unknown/not assessed.

## BR-002 — Blanks are not negatives

An unanswered question remains `UNKNOWN` or `NOT_ASSESSED`. It cannot be displayed or exported as “No.”

## BR-003 — Willingness and orientation are independent

A patient may be willing but not oriented, non-opposed but unable to provide knowing consent, opposed, unable to communicate, fluctuating, or unknown.

## BR-004 — Orientation is recorded in four domains

Record person, place, time, and situation separately with supporting observations, source, assessor, and time.

## BR-005 — Formal-voluntary prescreen gate

Under the owner-defined launch rule, all four orientation domains must be recorded as oriented before the prescreen can mark `POSSIBLE_FORMAL_VOLUNTARY_REVIEW`. Failure of the gate does not declare incapacity or choose the next legal status. It creates an authorized-review requirement.

## BR-006 — Noncontested identification is not authorization

Prescreen staff may record `POSSIBLE_NONCONTESTED_PATHWAY` when the patient does not object and knowing/voluntary consent is not established. Only a configured authorized hospital role may record the final noncontested admission decision.

## BR-007 — Emergency interruption

High-risk or medical-emergency answers invoke the organization’s approved protocol. The system records the trigger, notification, destination, responsible party, and whether the prescreen remains active. It does not invent the protocol.

## BR-008 — Attested assessments are immutable

An attested version cannot be edited. Corrections and supplements reference the original version, state the reason, source, actor, and impact.

## BR-009 — Packet readiness is target-specific

A packet may be ready for Central Intake but not ready for physician review, facility routing, transport, or admission handoff. Every readiness result names the target.

## BR-010 — Facility rules require provenance

A blocking requirement must include facility/program scope, rule version, source document, effective date, approval state, and resolution destination.

## BR-011 — Financial work is parallel

Benefits and authorization may begin early but cannot block emergency clinical review or be used as an opaque priority score.

## BR-012 — OPC/PEC/CEC transport restriction

When an active instrument/profile requires secured transport, family, self, taxi, rideshare, and unsecured transport choices are not returned by the server. Allowed categories may include law enforcement, licensed ambulance, and approved contracted secure behavioral-health transport.

## BR-013 — Broker and carrier are separate

A broker or coordinator does not satisfy the actual-transporter field. Dispatch records both arranging organization and actual carrier.

## BR-014 — Restraint is separate from secured transport

Selecting secured transport does not imply restraint. Restraint authority, order, type, monitoring, and rationale are separate governed records.

## BR-015 — Minor authority is document-specific

Parent/guardian presence does not create universal consent authority. Rules evaluate age, pathway, document, treatment, relationship evidence, privacy regime, and facility policy.

## BR-016 — Patient position is preserved

A minor’s or adult’s expressed willingness, objection, inability to communicate, and changes over time remain visible even when another person has legal authority.

## BR-017 — Trend output is operational only

Historical timing or pathway patterns may support staffing and coordination. They may not declare patient capacity, dangerousness, diagnosis, or legal status.

## BR-018 — No silent cross-tenant sharing

Cross-organization access requires an explicit case relationship, approved sharing purpose, minimum-necessary projection, audit, and expiration.

## BR-019 — Idempotency and concurrency

Commands that create or change state require an idempotency key, correlation ID, expected version where applicable, and organization-scoped predicate.

## BR-020 — Error equivalence

Unauthorized users must not learn whether a case, document, facility, or provider exists through different error messages.
