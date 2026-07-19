# Prescreen service test manifest (Phase 2)

**Files:** `tests/unit/prescreen-service.test.ts` (25 tests, in-memory — no
database), `tests/unit/prescreen-contracts.test.ts` (35 tests, Phase 1
contracts). Run 2026-07-19 locally: **60/60**; root suite **328/328**.

## Owner completion criteria → tests

| Criterion | Test(s) |
|---|---|
| Start is idempotent | "start is idempotent: same key and body replays…" |
| Changed-body key reuse fails | "idempotency key reuse with a changed body fails, including nested-only changes" |
| Unauthorized roles fail without disclosing resource existence | "unauthorized roles fail before any read…" |
| Cross-organization access fails | "cross-organization access fails with the same non-revealing error as a miss"; "rejects an unknown supplement parent from another organization…" |
| Stale expected versions fail | "stale expected versions fail deterministically" |
| Drafts can be updated | "drafts can be updated in place and re-derive the possible pathway" |
| Attested versions cannot be edited | "attested versions cannot be edited" |
| Supplements reference the attested parent | "supplements require and reference the attested parent…"; "a supplement cannot cite a draft parent" |
| Medical stabilization retains precedence | "medical stabilization retains precedence over willing-and-oriented" (service); contracts suite precedence test |
| Possible pathways never become final legal/admission decisions | "possible pathways never become final legal or admission decisions" (vocabulary + strict-envelope rejection of a smuggled `legalStatus`) |
| Submission references an immutable assessment version | "submission references an immutable assessment version and records intent only"; "submission of a draft version is impossible" |
| Failed commands leave no residue | "failed commands leave no state, audit, outbox, or idempotency residue" |
| Focused tests, root tests, typecheck, targeted lint, build/schema checks | This manifest's run counts; typecheck/lint/prisma validate recorded in the implementation doc |
| Changed-path diff review | Performed at PR self-review; diff touches only the new package, tests, docs, lockfile, status records |

## Additional guarantees tested beyond the criteria

- Audit events, outbox envelopes, and idempotency records stay in lockstep
  (one each per successful command; actions mirror event types).
- Audit/outbox payloads never contain assessment narrative, presenting
  concern, or location text (hash-only discipline).
- Submission replay returns the recorded result without a second transition.
- Packet-requirement changes emit previous/new state and readiness derives
  named blockers, then clears them.
- Submission grants the receiving organization nothing (its reads miss).

## Honest gaps

- **No persistence:** restart durability, transactional behavior under a
  real database, RLS interaction, and concurrent-writer races beyond
  single-process determinism are NOT tested here — they are Phase 3 scope
  behind the provider-backed verification gate.
- **No API/UI:** HTTP status mapping of the stable error codes is untested
  (no routes exist).
- **Role policy is synthetic:** no production role authorizes anything.
- Consent/transport evaluators are contract-tested (Phase 1) but not wired
  into any Phase 2 command — no command needs them yet.
