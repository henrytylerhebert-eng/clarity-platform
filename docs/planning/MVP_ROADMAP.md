# MVP Roadmap and Blind Spots

**As of:** 2026-07-13. Owner: Tyler Hebert. Status: adopted for execution (this session). Estimates are labeled estimates — solo maintainer + AI pair, in working sessions, not calendar dates.

## Bottom line

The backend is verified for four workflow layers (cases, documents, evidence, governance) but **none of the product is user-reachable** — no authentication, no API, no wired UI. The MVP path is one more thin business slice (manual insurance/benefits verification), then a vertical build: auth → API → thin UI → pilot hardening. Production-readiness after MVP is dominated by external gates (security review, counsel, hosting/BAA), not code.

## What exists today (verified 2026-07-13, suite 151/151)

| Capability | State | MVP-ready? |
|---|---|---|
| Case lifecycle (9 commands, state machine, 8 workstreams) | Tested | **Yes** |
| Documents (upload, versioning, classification, access audit) | Tested | **Yes** (storage adapter is dev-only) |
| Evidence + human review + contradictions | Tested (PR #7) | **Yes** |
| Tenancy, append-only audit, concurrency, idempotency | Tested throughout | **Yes** |
| Insurance/benefits verification | Schema + contracts only | **No — next build (Phase 1)** |
| Authorization readiness | Contracts only | No (Phase 2) |
| Authentication | Absent; roles are trusted caller input | **No — MVP blocker (Phase 3)** |
| API layer | Absent (OD-5 undecided) | **No — MVP blocker (Phase 4)** |
| UI | `app/` prototype is localStorage-only, unwired | **No — MVP blocker (Phase 5)** |
| Hosting, CI, real object storage, backups | None (OD-6, OD-9) | **No — pilot blocker (Phase 6)** |

## MVP definition

**For a single pilot organization's intake team, Clarity is a tenant-scoped case workspace: create a crisis-placement case, attach documents, record reviewed evidence, verify insurance/benefits manually, and track the 8 workstreams — with a complete audit trail — replacing the binder/fax/whiteboard status quo.**

**Explicitly OUT of MVP:** AI extraction and agents, OCR, automated eligibility (X12 270/271), facility routing/bedboard network, transport coordination, compliance-clock enforcement (blocked by OD-2), medical-necessity criteria (OD-3), multi-org referral sending, e-signature, reporting dashboards. One tenant, one pilot site, **de-identified or synthetic data only** — this exclusion keeps the HIPAA cliff out of MVP.

## Phases to MVP

| # | Phase | Deliverable | Depends on | Est. sessions |
|---|---|---|---|---|
| 0 | Merge queue | PRs #7/#8 landed; §3a protection set | Owner | — |
| 1 | Manual insurance/benefits verification | Coverage, eligibility, benefit-verification commands consuming approved INSURANCE evidence | #0 | 1–2 |
| 2 | Authorization readiness (minimal) | Per-case readiness assessment from existing contracts; no payer integration | #1 | 1 |
| 3 | Authentication | Real identity (managed IdP recommended); retires the trusted-roles assumption; permission tests re-run against real principals | — | 2–3 |
| 4 | Minimal API (decides OD-5) | Thin HTTP layer mapping 1:1 onto existing command envelopes — no new business rules; contract tests | #3 | 2–3 |
| 5 | Thin operational UI | Case list/detail, document upload, evidence review queue, benefits worksheet, workstream board. Decision: wire vs. harvest vs. retire the `app/` prototype | #4 | 3–6 |
| 6 | Pilot hardening | Hosting (OD-6), CI with Postgres service (OD-9; issues #2/#5), S3-compatible storage adapter behind the existing port, backups, error monitoring | #4–5 | 2–4 |

**MVP exit criteria:** a named pilot user completes a full synthetic case end-to-end through the UI; every mutation appears in the audit trail; suite green in CI; restore-from-backup rehearsed once.

## MVP → production-ready (start long-lead items during Phases 3–6)

1. **Real-data readiness (the HIPAA cliff):** the first real patient makes `PatientToken` PHI. Requires BAA-capable hosting, encryption at rest/in transit, access-controlled logs, workforce policies, breach process. Also triggers §3a's review-restoration clause.
2. **Database-level tenancy (RLS)** as the backstop behind app-layer scoping (OD-6).
3. **Security review + pen test** of the API surface; malware scanning (issue #4) and content sniffing (issue #3) before real uploads; rate limiting.
4. **Counsel review (OD-2)** before legal-clock/PEC/OPC/CEC language; **clinical licensing (OD-3)** before necessity criteria.
5. **Audit hardening:** DB-level append-only enforcement (revoke UPDATE/DELETE or hash-chaining) before audit claims carry compliance weight.
6. **Operational basics:** backfill-safe migration discipline for shared DBs, idempotency-record retention, monitoring/alerting, incident runbook, DR objectives.

## Blind spots (ranked by damage potential)

1. **Zero user validation.** The workflow model is architecture-derived, never checked against a working intake coordinator. De-risk with 2–3 intake-staff interviews **before Phase 5 locks the UI.**
2. **Bus factor of one, reviewed by bots.** No Louisiana behavioral-health domain expert has reviewed the domain rules (role policies, state machines, category-approval map). A domain review is not a code review.
3. **The `app/` prototype fork.** Real UX thinking, zero shared contracts with the backend. Decide (wire / harvest / retire) at Phase 5 or risk building the product twice.
4. **"Synthetic only" is policy, not enforcement.** The schema stores DOB/sex/external references; nothing technical blocks real PHI. Keep the pilot de-identified and add a data-classification check at intake paths in Phase 4.
5. **Positioning: an MVP with no "intelligence."** Right build order (the evidence pipeline is the funnel automation will feed), but pilot value must be pitched as workflow/audit/coordination — no AI promises in pilot conversations.
6. **No performance dimension.** All tests are functional, single-user, local. Basic load pass belongs in Phase 6.
7. **OD-8 debt.** Graduating the expanded 43-model schema against live data later means real migrations; budget for it.

## Five buckets

- **KNOWN:** the capability table above (every row verified by running the suite/commands this session).
- **INFERRED:** session estimates; the MVP cut line (from the agreed build sequence and product docs).
- **UNKNOWN:** pilot-user workflow fit; Louisiana regulatory specifics; hosting constraints.
- **NEEDS VALIDATION (ranked):** workflow fit with real intake staff; the MVP definition itself; IdP and hosting choices.
- **ACTION:** (1) merge queue + §3a command (owner); (2) Phase 1 build; (3) line up intake-staff conversations in parallel.
