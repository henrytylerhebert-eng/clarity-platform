# Test and Verification Plan

**Artifact status:** All proposed diagrams, schemas, commands, examples, and code-like contracts in this file are **Proposed and unverified** unless a statement is explicitly classified otherwise.


## Test standard

No implementation is complete because a dashboard renders. Completion requires evidence that commands, tenancy, event atomicity, corrections, projections, metrics, privacy, and non-happy-path UI states behave as designed.

All tests use synthetic data.

## Test layers

```text
contract/schema
→ pure domain/state/metric
→ repository/gateway integration
→ service command integration
→ API integration
→ projector/replay/recompute
→ mart/privacy
→ frontend component/workspace
→ end-to-end synthetic flow
→ security/operational verification
```

## 1. Contract tests

### Event envelope

- valid native event accepted;
- required organization/event/schema fields enforced;
- unknown fields rejected where intended;
- invalid UUID/date/version rejected;
- correction requires target event and reason code;
- original event cannot claim a superseded target;
- external source uniqueness fields required;
- classification/quality/review/eligibility enums validated;
- payload hash format validated;
- event-specific payload schema matches catalog.

### Metric definition

- immutable key/version pattern;
- approved definition requires owner/reviewer/effective date/evidence;
- rate requires denominator;
- minimum denominator nonnegative;
- source events/facts present;
- calculation ref/version present;
- no arbitrary SQL property;
- empty-state label fixed to `NO_MEASUREMENTS_FOUND`.

### API

Validate generated/openapi schemas against examples and runtime Zod schemas. Avoid hand-maintained drift by deriving where current repository conventions permit.

## 2. Pure domain tests

### Episode lifecycle

- accepted handoff creates active episode;
- invalid transition rejected;
- discharge/close rules when later enabled;
- corrected admission does not delete original;
- facility-local service date conversion at midnight and DST boundaries using approved date library;
- missing timezone blocks derivation.

### Authorization review

- valid requested date range;
- start after end rejected;
- denied outcome requires controlled reason;
- partial decision ranges supported;
- conflicting overlap detected;
- pending then approved transition;
- correction targets active event/version;
- stale correction conflicts;
- no autonomous outcome derivation.

### Documentation gaps

- every allowed transition;
- disallowed transition;
- resolution attestation required;
- reopen after resolve;
- correction/supersession;
- bounded summary length/content policy;
- assignment does not grant capability.

### Episode-day derivation

- approved;
- denied;
- pending;
- expired;
- unrequested;
- not required;
- unknown due to conflict;
- approved plus expires-soon risk;
- multiple risk flags;
- superseded decision ignored;
- late correction changes only affected dates.

### Metrics

For every metric definition/version:

- numerator inclusion;
- exclusion;
- distinct episode-day behavior;
- no double count after replay;
- at-risk overlaps approved but is counted once;
- no data returns null/status, not zero;
- insufficient denominator;
- suppressed status;
- quality-excluded facts;
- corrected fact produces new snapshot.

## 3. Repository/gateway integration tests

Use the repository's approved local PostgreSQL integration pattern.

### Tenant predicates

For every read/write:

- same ID in two organizations;
- cross-org read returns no row/non-revealing error;
- cross-org mutation writes nothing;
- cross-org relation ID rejected;
- organization ID cannot be supplied in command;
- facility/program/unit belongs to organization;
- scope changes mid-transaction are rechecked where relevant.

### Concurrency

- two admission handoffs on same case;
- two review updates from same version;
- two corrections on same active event;
- assignment conflict;
- one succeeds, one receives conflict;
- audit/event/idempotency counts remain correct.

### Atomicity

Inject failure after each proposed write:

1. aggregate state;
2. audit;
3. governed event;
4. delivery;
5. idempotency result.

Verify transaction leaves either all success records or none.

### Immutability

- runtime repository exposes no update/delete for governed event/audit;
- direct runtime DB role update/delete fails when DB controls are enabled;
- correction creates new event;
- original hash unchanged.

### Idempotency

- same key/same request replays;
- same key/different request conflicts;
- same key in another org is independent;
- source duplicate ignored/reconciled;
- replay does not duplicate events/audit/projections.

## 4. Service tests

### Admission handoff

- authorized role/scope succeeds;
- case not accepted fails;
- stale version fails;
- missing timezone fails;
- already active episode fails/idempotent replay;
- packet/custody reference outside case/org fails;
- actor/organization derived from session;
- no acceptance decision made.

### UR commands

- open linked authorization;
- invalid source coverage fails;
- review/day decisions append event;
- gap creation in same command atomic;
- correction and late entry;
- actor lacks capability;
- outside facility/program scope;
- no payer member identifier field accepted.

## 5. API integration tests

Preserve the existing adapter test style.

- authentication required;
- roles from database/session, not body;
- unknown request fields rejected;
- body size and content type;
- idempotency header required;
- status/error mapping;
- cross-tenant 404 equivalence;
- in-scope role 403;
- validation 400 versus domain 422;
- concurrency 409;
- request/correlation IDs;
- no PHI in error/log capture;
- cursor pagination stable with inserts;
- ETag/freshness metadata;
- no `POST /events` or direct queue patch route.

## 6. Projector tests

### Delivery semantics

- claims pending delivery;
- lease expiry/retry;
- processed-event uniqueness;
- crash before commit;
- crash after commit before acknowledgement;
- duplicate delivery;
- unsupported schema quarantined;
- poison event does not block unrelated tenant stream;
- per-aggregate ordering where required.

### Replay

- empty projection rebuild from ledger;
- same final state after replay;
- deterministic active correction chain;
- checkpoint reset in test;
- projector version change;
- no cross-tenant projection.

### Late/correction

- accepted late event recalculates affected dates;
- outside-window event pending review;
- correction supersedes outcome;
- metric recompute queued once per affected scope;
- prior snapshot remains auditable.

## 7. Mart and privacy tests

### Schema/data

- prohibited columns absent;
- prohibited fixture strings absent from mart;
- person/name/MRN/member IDs never written;
- gap summary dropped;
- actor identity generalized/dropped;
- organization scope present on every fact/snapshot;
- token differs across organizations under tenant-scoped policy;
- token stable within organization/version;
- mart writer cannot read unnecessary PHI tables under DB grants.

### Query response

- aggregate JSON schema forbids direct identifiers;
- row-level episode token absent from dashboard endpoint;
- suppressed value not inferable from totals;
- no-data status;
- partial coverage;
- stale status;
- correction metadata;
- definition version.

Use snapshot/privacy allowlist tests rather than only visual inspection.

## 8. Authorization matrix tests

Generate parameterized tests from `contracts/authorization-matrix.csv` where practical.

For every action:

- allowed role/capability in allowed scope;
- same role outside scope denied;
- adjacent role denied;
- org admin behavior explicit;
- system admin does not silently bypass;
- executive aggregate can read aggregate but not queue/episode;
- UR user can read queue but cross-org aggregate denied;
- auditor can view provenance with field redaction but cannot mutate unless correction capability exists.

## 9. Frontend tests

### Admission Handoff

- source values shown read-only;
- server errors focus correct section;
- double-submit prevented;
- idempotent replay message;
- already handed-off state;
- keyboard and screen reader labels;
- role/navigation guards do not replace API handling.

### UR queue

- loading;
- empty filtered;
- stale last-safe data;
- projection pending;
- partial source;
- corrected row;
- source disagreement;
- pagination/filter URL state;
- stable focus on refresh;
- mobile cards;
- no direct priority editing.

### Authorization Risk

- `No measurements found`;
- null not rendered as zero;
- insufficient denominator;
- suppression;
- stale/partial;
- definition drawer;
- at-risk overlap caveat;
- no patient identifiers in DOM/fixtures;
- aggregate-to-queue link only with capability.

### Accessibility

- automated checks;
- keyboard navigation;
- focus management;
- live regions;
- chart data table;
- status labels independent of color;
- zoom/reflow;
- reduced motion.

## 10. End-to-end synthetic scenario

### Scenario

1. login as admissions user in Org A;
2. open accepted synthetic case;
3. record admission handoff;
4. verify episode/event/audit;
5. login as UR user in facility scope;
6. open episode authorization;
7. record pending concurrent review and gap;
8. verify queue reason/due date;
9. record approved range and resolve gap;
10. verify episode days and queue update;
11. record correction extending approved range;
12. verify original event remains, projection recomputes, metric snapshot lineage updates;
13. login as executive;
14. verify aggregate-only dashboard and metadata;
15. login as Org B user with copied IDs;
16. verify all access and aggregation denied/non-revealing.

## 11. Performance tests

No target numbers should be invented. Establish baselines after implementation.

Measure:

- admission command latency;
- review/gap command latency;
- queue query latency by page/filter;
- aggregate query latency;
- events/second processing;
- maximum projection lag;
- replay throughput;
- recompute scope size;
- DB query plans/index use;
- UI bundle and render behavior.

Set service-level objectives only after observed baseline and operational approval.

## 12. Migration/deployment verification

- clean database migration;
- upgrade from current migration head;
- old API version works with additive schema;
- new worker disabled safely;
- analytics role cannot write transactional state;
- API role cannot write mart;
- backup and restore includes event/audit/mart as policy requires;
- feature flag rollback;
- no orphan delivery/event/idempotency rows;
- `git diff --check`.

## 13. Required commands

Codex must discover exact scripts. Expected categories:

```bash
git status --short
git diff --check
npm test
npm run lint
npm run typecheck
cd app && npm test
cd app && npm run build
npx prisma format
npx prisma validate
npx prisma generate
```

Run focused package/API/integration tests in addition to the full verified baseline. Do not claim prior counts still pass until rerun in the live tree.

## Completion evidence bundle

Each implementation PR should include:

- decision/ADR references;
- schema and contract diff;
- test manifest;
- exact commands and results;
- migration SQL review;
- sample redacted API responses;
- cross-tenant denial evidence;
- privacy/mart field evidence;
- projector replay evidence;
- screenshot or component evidence for all required UX states;
- known limitations and rollback instructions.
