# Test and Verification Plan

## Test pyramid

### Domain unit tests

- orientation gate;
- willingness/pathway derivation;
- encounter transitions;
- readiness blockers/warnings;
- consent rule matching;
- transport qualification;
- task and custody state machines;
- event envelope and correction behavior.

### Service tests

- strict command validation and unknown fields;
- actor/organization derived from principal;
- capability and assignment policy;
- idempotency replay and mismatch;
- optimistic concurrency;
- transaction atomicity;
- audit/outbox in same transaction;
- tenant isolation and error equivalence;
- immutable attestation and packet versions.

### Persistence tests

- organization predicate on every read/write;
- same-organization foreign references;
- unique version constraints;
- cleanup and zero residue;
- RLS tests before production;
- outbox replay/deduplication.

### API tests

- auth failures indistinguishable;
- body/field limits;
- status code mapping;
- pagination/cursor stability;
- field filtering;
- CORS/rate/security headers;
- no client-supplied tenant/role.

### UI tests

- guided question branching;
- unknown/not-assessed behavior;
- source attribution;
- review/attestation;
- stale/version conflict;
- Central Intake request/supplement loop;
- packet blocker navigation;
- transport qualification states;
- keyboard and screen-reader behavior;
- responsive/mobile interruption recovery.

### End-to-end scenarios

Use all fixtures in `synthetic/`:

1. willing/oriented;
2. willing/not oriented;
3. non-opposed/unknown orientation;
4. opposed with PEC;
5. OPC law-enforcement pickup;
6. CEC transfer;
7. intoxication/fluctuating reassessment;
8. minor parental pathway;
9. minor age 16 voluntary request;
10. missing packet requirements.

## Security tests

- cross-tenant identifier enumeration;
- external secure-link expiry and replay;
- attachment type/size/malware handling;
- log redaction;
- privilege escalation;
- transport provider registry leakage;
- profile approval bypass;
- consent authority spoofing;
- webhook signature/replay;
- CSV formula injection.

## Performance tests

Set targets after measuring current patterns. At minimum test:

- concurrent draft autosave;
- Central Intake queue pagination;
- packet manifest generation;
- large document metadata lists;
- outbox backlog/replay;
- provider qualification over scoped registry;
- profile evaluation latency.

## Required completion evidence per slice

- exact files changed;
- migration status;
- focused test names/counts;
- root test/lint/typecheck/build results;
- Prisma format/validate/generate results when schema changes;
- security/privacy review notes;
- no synthetic residue;
- `git diff --check`;
- known limitations and rollback boundary.
