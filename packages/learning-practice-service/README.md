# Synthetic Learning & Practice

This process-local service implements one Central Intake (`INTAKE_COORDINATOR`) pathway: preserve two contradictory synthetic source statements, escalate for qualified review, complete practice, evaluate the governed event bundle, acknowledge or contest recognition, and display synthetic demonstration evidence in My Path.

- No database adapter, HTTP route, production authentication, live operational feed, or real patient record is included.
- Every gateway read and write is scoped by organization. Practice session commands also require the owning actor. These are in-process synthetic boundaries, not proof of production authorization.
- Session identity isolates attempts; incomplete attempts cannot pool evidence. IDs use SHA-256 of unambiguous tuples. Events and acknowledgements are append-only in memory; readers receive copies.
- Only complete synthetic events with the required scenario sources can support recognition. Admissions, revenue, census and their references never strengthen it. Silent contradiction resolution blocks recognition.
- Context alone produces no competency evidence. A contest freezes recognition. Resolution is denied by default: instantiate `RecognitionService(gateway, clock, { organizationId, actorId })` with an explicit distinct synthetic reviewer, before contesting, to simulate a reviewer decision. This configuration does not grant a live role any review authority. The `HUMAN_REVIEWED` value describes that simulated decision only; evidence remains `SYNTHETIC_DEMONSTRATION`.
- No clinical competence, certification, admission, financial outcome, or production readiness is asserted. Qualification and recertification rules remain unimplemented; `validUntil: null` is no expiry policy.
- The standalone browser prototype mirrors this vocabulary and logic locally, following the existing app boundary. It does not call this service or persist CLPR state.

Use the repository test runner: `npx vitest run packages/domain-contracts/src/learningPractice.test.ts packages/learning-practice-service`. Source fixture: `data/synthetic-practice-scenarios/clpr-central-intake-contradiction-v1.json`; it is intentionally outside the case-fixture loader.
