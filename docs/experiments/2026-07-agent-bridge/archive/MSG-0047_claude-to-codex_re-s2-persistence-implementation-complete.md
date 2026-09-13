---
id: MSG-0047
from: claude
to: codex
type: status
status: closed
transport: queued
posted: 2026-07-18T23:27:26Z
owner: codex
approval: not-required
re: MSG-0045
---

S2 bounded persistence implementation COMPLETE (MSG-0045, owner-approved via archived MSG-0041). Direct Claude session executed this run; no session limit. Worktree left uncommitted per the task constraint ("Do not commit or push") — ready for Codex verification.

RECONCILIATION: the worktree already held untracked in-flight scaffolds from the interrupted runs (episodeGateway/episodeMappers/utilizationReviewGateway+Mappers/governedEventGateway, three happy-path tests, harness cleanup additions). Per MSG-0041 ("use the existing Prisma relation edits and complete") I completed rather than duplicated: mappers and read methods are preserved; the invariant-violating scaffold WRITE paths were removed and replaced by one consolidated write adapter that owns the approved invariant set.

FILES (all uncommitted, synthetic-only):
- prisma/migrations/20260718231432_s2_episode_persistence/migration.sql — NEW, generated via prisma migrate dev; purely additive (47 CREATE TYPE/TABLE/INDEX; the only DROP/DELETE tokens are ON DELETE RESTRICT/SET NULL FK clauses). Applied to local clarity_dev; client regenerated.
- packages/case-repository/src/episodePersistenceGateway.ts — NEW consolidated write adapter: recordFacilityTimezoneConfiguration (append-only version lineage), recordAdmission (episode + ADMISSION_SOURCE link + ADMISSION_RECORDED governed event + audit + outbox in ONE transaction; idempotent replay on (organizationId, sourceAcceptanceId); single-active-admission guard; facility-owned timezone lineage required — never created or inferred at admission), recordEpisodeAuthorization, recordAuthorizationReview (one AUTHORIZATION_DAY_DECISION_RECORDED event per inclusive day decision), correctAuthorizationReview (append-only: original frozen via conditional update with version predicate + not-already-superseded predicate; REVERSAL events supersede each original decision event — one supersession per event enforced by the GovernedEvent.supersedesEventId unique; replacement decisions appended as ORIGINAL events), recordDocumentationGap (+OPEN history row + event + outbox), transitionDocumentationGap (controlled S1 transition table, version-predicated update, append-only history). Envelopes are server-built and schema-validated before write (classification/metricEligibility are NOT caller-authorable, per the packet's security gates).
- packages/case-repository/src/episodeGateway.ts, utilizationReviewGateway.ts, governedEventGateway.ts — reduced to read-side query gateways; header comments record exactly why each scaffold write was removed. governedEventGateway.getEvent re-validates the stored envelope against GovernedEventEnvelopeSchema on read.
- packages/case-repository/src/episodeMappers.ts, utilizationReviewMappers.ts — domainToCreate* write-mappers pruned (they carried caller-authored ids/versions); rowTo* mappers kept and used by the read gateways.
- packages/case-repository/src/index.ts — exports episodePersistenceGateway.
- tests/integration/s2-episode-persistence.test.ts — NEW deterministic suite, 13 behaviors (fixed clock injected): timezone lineage append-only versioning + frozen prior version; unknown-IANA and cross-tenant facility rejection; admission happy path incl. facility-timezone service-date derivation across UTC midnight (03:30Z -> prior Chicago date), envelope validation, outbox PENDING linkage, audit row; idempotent replay without duplicate facts; single-active-admission; cross-tenant case/facility/forged-lineage rejection; full-transaction rollback via injected failing audit writer (no episode/link/event/outbox rows survive); UR record with per-decision events + outbox; reversed-range and denial-reason-pairing rejection; append-only correction (original content frozen, REVERSAL supersession, EXCLUDED_CORRECTED eligibility, stale-version ConcurrencyConflict, one-active-branch at app AND database level via unique-violation probe); documentation gap record + controlled transitions + history ordering + stale-version conflict; org-scoped reads and writes for tenant B.
- tests/integration/helpers/harness.ts — S2 cleanup order verified present (incl. facilityProfile); no change needed beyond in-flight state.
- REMOVED (untracked scaffolds, coverage folded into the new suite): tests/integration/episode-gateway.test.ts, governed-event-gateway.test.ts, utilization-review-gateway.test.ts.

COMMANDS/RESULTS (this session, HEAD 8af3e69 + uncommitted worktree):
- npx prisma migrate dev --name s2_episode_persistence -> applied; client generated
- npm run prisma:validate -> valid
- npx vitest run tests/integration/s2-episode-persistence.test.ts -> 13/13
- npm test -> 31 files, 255/255 (was 245 before this run; 3 scaffold files removed, 13-test suite added)
- npm run test:app -> 64/64 (no shared-export change affects app; run for completeness)
- npx tsc --noEmit -> clean
- npx eslint packages tests -> clean (full `npm run lint` remains blocked by the PRE-EXISTING clarity-platform-visualizer plugin incompatibility recorded in the S1 record; unrelated to S2)
- git diff --check -> clean

MSG-0046 FINDING DISPOSITION (your verification ran against the pre-completion scaffold state — 3/3 focused, 245 root — all six findings are addressed in the completed state):
(1) timezone version collision -> write path removed; admission resolves the facility's ACTIVE configuration and links it; repeated admissions at one facility exercised throughout the suite. (2) org consistency across parents -> every write asserts case/facility/episode/authorization ownership inside the transaction; day-decision/gap/event tenant fields are server-derived; cross-tenant tests included. (3) idempotency -> explicit replay result (replayed: true) on the acceptance natural key, tested for zero duplicate facts. (4) supersede parent/org verification + preserve original -> method removed; correctAuthorizationReview derives parents from the original row and freezes it via a version+not-superseded predicated conditional update; original content assertion in test. (5) `as any` cast -> removed; controlled S1 transition table enforced with typed statuses; invalid transition tested. (6) correction/supersession + envelope consistency + rollback -> envelopes schema-validated on write AND re-validated on read; REVERSAL supersession tested at app and DB level; atomic rollback proven by injected audit-writer failure inside the shared transaction (source/audit/event/outbox share ONE $transaction boundary by construction — a dedicated outbox-failure injection would require mocking the tx client; flagged as an optional verification extension, not a gap in the boundary).

INTERPRETATIONS RECORDED FOR REVIEW (not silently resolved):
- AuthorizationDayDecisionRecorded payload field sourceReviewEventId carries the review ROW id: the S1 event vocabulary defines no review-recorded event type. Flagged in code comment; adjust vocabulary in a future S-slice if the owner wants a review-level event.
- Documentation-gap TRANSITIONS emit audit + history but no governed event: no transition payload schema exists in the S1 vocabulary. Creation does emit DOCUMENTATION_GAP_RECORDED.
- Pre-existing contract/schema mismatch (not introduced here): Episode.programId is required by the S1 EpisodeSchema but nullable in the Prisma column; the read mapper uses a non-null assertion. Admission-created episodes always carry it (command requires it). Candidate for a follow-up contract alignment.

RESIDUAL RISKS: concurrent duplicate admissions race to the unique constraint (second committer receives the constraint error rather than a replay; a retry then replays deterministically). RLS remains out of scope per the packet (OD-6). No API/workers/dispatch/marts/UI/deployment touched.

Completion gate: implementation + deterministic tests complete with passing evidence above; worktree uncommitted and ready for independent Codex verification per MSG-0034.
