# Prescreen service test manifest (Phase 2)

**Files:** `tests/unit/prescreen-service.test.ts` (27 tests, in-memory — no
database), `tests/unit/prescreen-contracts.test.ts` (38 tests, Phase 1
contracts + hardening). Run 2026-07-19 locally after the rebase onto the
hardening session: **65/65**; root suite **343/343**.

**Amendment (same day, ADR-0014 §5):** the idempotency fingerprint now
excludes `occurredAt` — the key identifies command intent, and a retry's
arrival time is not intent. One test added ("a retry with the same key and
body but a later occurredAt is a replay…"); the nested-body conflict
guarantee is unchanged and still tested. API-slice coverage lives in
`PRESCREEN_API_TEST_MANIFEST.md`.

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
- **No UI.** *(Superseded in part: the same-organization HTTP API slice now
  exists and is tested — see `PRESCREEN_API_TEST_MANIFEST.md`.)*
- **Role policy:** the production policy covers exactly the two roles ruled
  in ADR-0014; external/field roles remain unmapped and untestable until
  the cross-organization design exists.
- Consent/transport evaluators are contract-tested (Phase 1) but not wired
  into any Phase 2 command — no command needs them yet.
