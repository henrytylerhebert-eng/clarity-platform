# Access Snapshot UI — Test Manifest

**Code:** `app/src/features/access-snapshot/` — `AccessSnapshot.tsx`, `accessPresentation.ts`, `AccessSnapshot.css`
**Wiring:** `app/src/CrisisOpsApp.tsx` (workspace `access`), `app/src/domain/roles.ts`, `app/src/domain/api.ts` (`apiAccessGetCase`)
**Tests:** `AccessSnapshot.test.tsx`, `accessPresentation.test.ts`, and one boundary test in `app/src/App.test.tsx`
**Baseline:** branched from `origin/main` at `c00dabd` (2026-09-19), which contains Access Slice 4A.1
(`GET /api/access/cases/:caseKey`, ADR-0024) and Slice 4B (`deriveAccessGuidance()`).

This is a **read-only view** of the governed Access case read model. It renders what the API
returned for the verified session and nothing else. It shows no patient identity, does not touch
the local demo case state, assigns nothing, and re-derives no policy: what is blocked, waiting or
a candidate is decided by the contract, never by this UI.

## What it renders, and from where

| Section | Source (`AccessCaseReadModel`) | Rule the UI follows |
|---|---|---|
| Journey rail + disposition | `journey.phase`, `journey.disposition`, `journey.evidence` | Phase `null` is shown as "cannot be determined", never guessed; disposition is always shown |
| What needs attention | `guidance.signals` where class is not `SATISFIED` / `NOT_APPLICABLE` | Grouped by `scope`; badge tone follows `blockingClass`; an empty list says "not a clearance" |
| Satisfied or not applicable | the remaining `guidance.signals` | Collapsed; recorded facts are not attention items |
| Candidate next work | `guidance.nextWork`, `guidance.suppressed` | Every item is "Candidate / Not assigned"; `responsibleRoleCode` is deliberately **not** shown |
| Workstreams | `sourceState.workstreams` | All eight lanes in contract order; a blocked lane is not a blocked journey |
| Prescreen source state | `sourceState.prescreen*`, `packetRequirementEvidence`, `guidance.packetReadiness` | `NOT_AVAILABLE`, `LOADED_EMPTY` and `LOADED` are three different statements; `AMBIGUOUS` warns instead of choosing |

Every contract enum reaches the user as a translated label. The label maps in
`accessPresentation.ts` are `Record<Enum, string>`, so a value added to the contract fails
`tsc` instead of leaking a raw token.

## Requirement → test coverage

| Requirement | Test(s) |
|---|---|
| Signed-out state keeps the title, offers the shared dev sign-in, requests nothing | `AccessSnapshot — signed out and signing in` (2); `App.test.tsx` boundary test |
| Demo patient identity absent from the parent shell while Access is active | `App.test.tsx` › `removes the local demo patient identity from the parent shell …` |
| Verified session named; audit disclosure shown only once a case is loaded | `names the verified session and requests the default synthetic case once` |
| Key is trimmed; empty key cannot be requested | `trims the key and submits on Enter`; `does not allow an empty key to be requested` |
| No patient identity and no internal ids rendered | `renders no patient identity and none of the contract's internal ids` |
| No raw enum value anywhere on a fully populated snapshot | `never shows a raw enum value anywhere on a fully populated snapshot`; `accessPresentation.test.ts` (every contract value has a label) |
| Each disposition; rail order, current phase, passed phases | `shows the … disposition`; `orders the rail, marks the current phase …` |
| Null phase not fabricated; evidence and Admission provenance explained | `does not fabricate a phase …`; `explains the phase in plain language …`; `says where the Admission phase comes from` |
| Signals grouped, worded from recorded facts; requirement label lookup and fallback | `groups signals by scope …`; `falls back to the requirement code …` |
| Badge tone by blocking class (never a satisfied fact painted as a warning) | `colors each badge by blocking class …`; `accessPresentation.test.ts` |
| Satisfied / not-applicable kept out of attention; empty list is not a clearance | `keeps satisfied and not-applicable signals out …`; `does not present an empty attention list as a clearance` |
| A blocked workstream does not make the journey blocked | `does not call the whole journey blocked because one workstream is` |
| Next work non-binding, no assignment implied, suppression explained | `labels every candidate as non-binding …`; `explains suppressed work in plain language` |
| Prescreen NONE / SELECTED / AMBIGUOUS; packet evidence three states; per-target readiness | `AccessSnapshot — Prescreen source state` (5) |
| 403 / 404 / unreachable messages (real `describeApiError`); 404 non-revealing | `AccessSnapshot — errors` (3) |
| Fail closed: a failed refresh removes the previous case | `fails closed: a failed refresh removes the previous case …` |
| Refresh reloads the case on screen, not the edited field; no polling | `refreshes the case on screen even after the key field has been edited`; `loads once per explicit action and never polls` |
| One session's case never shown to the next session | `AccessSnapshot — session isolation` (2) |

## Evidence (run 2026-09-19 pre-merge, plus one post-merge run dated 2026-09-20)

| Check | Result |
|---|---|
| `npm run verify` (lint, typecheck, `prisma validate`, unit, integration on a throwaway database) | exit 0 — unit 51 files / 565 tests; integration 34 files / 295 tests |
| `npm run test:app` | exit 0 — 25 files / 215 tests (63 in `features/access-snapshot`, 1 in `App.test.tsx` for this feature) |
| `npm --workspace app run build` | exit 0 |
| Mutation check of the tests themselves | 6 distinct deliberate regressions in 7 runs (dropped session key; refresh uses the typed key; raw case status, run twice because the first run exposed a weak guard; raw prescreen status; raw suppression reason; stale case kept on error) — each failed the intended test; source restored byte-for-byte |
| `npx playwright test --config app/playwright.config.ts smoke/clarity-v01.spec.ts` (2026-09-20, post-merge) | 20/20 passed across the desktop and mobile projects, including `role switching scopes workspaces to each stakeholder segment`, which covers the `roles.ts` change. No CI step runs this suite |
| Live run: `npm run api:dev` + Vite against local `clarity_dev` | signed-out view; sign-in with the synthetic intake assertion; `SYN-API-CASE-0001` returned `200` and rendered; a nonexistent key returned `404` and rendered the non-revealing alert with the previous case removed; exactly one `ACCESS_CASE_VIEWED` audit row was written, none for the `404` |

The mutation check found and fixed a weak guard in this suite's own raw-enum test:
`textContent` concatenates adjacent elements, which hid a raw token from a word-boundary
match. The test now joins text nodes with spaces.

## Honest gaps

- **Enter-to-submit is verified in jsdom only.** The browser tool used for the live run could not
  synthesize an implicit form submission — a throwaway control form with the same structure also
  produced zero submits — so this is a tool limitation, not evidence about the UI. The DOM has the
  input inside the form with an enabled default submit button. The button path was verified live.
- **The live run exercised only the seed case** (Referral, On track, no signals, no Prescreen
  encounter). Populated states — signals, packet readiness, ambiguity, Admission, suppression —
  are covered by typed-fixture component tests, not against a live API holding such data.
- **The live `403` path (a `SYSTEM_ADMIN` session) was not exercised.** It is covered by a test that
  uses the real `describeApiError`.
- **No Access-specific Playwright spec exists.** `clarity-v01.spec.ts` never opens the `access`
  workspace, so nothing end-to-end exercises this view. Stated precisely, because the blanket
  claim that "Playwright was not run" was wrong: CI's `verify` job **does** run `test:oa-e2e`,
  but that config's `testMatch` limits it to `operating-assurance.spec.ts`. The Crisis Ops suite
  `clarity-v01.spec.ts` is run by **no** CI step; it was run locally post-merge (20/20, desktop +
  mobile) and is the evidence that this change did not break the existing shell, not evidence
  about the Access view itself.
- Visual review of **this view** was one desktop viewport (1360 px). The smoke suite's mobile
  project exercises the shell at narrow width but never opens `access`, so the Access Snapshot's
  own `@media (max-width: 768px)` single-column layout is still unverified at runtime. Keyboard
  navigation and screen-reader behaviour were not reviewed beyond the semantics the markup uses
  (regions, lists, `aria-current`, `role="alert"`).
- `roles.ts` lists the `access` workspace for five demo personas. Demo personas are not an
  authorization boundary: the API decides by the verified principal's roles
  (`ACCESS_CASE_READ_POLICY`).
- `graphify update .` was not run: from a worktree it rewrites the tracked, absolute-path-keyed
  manifest (issue #40).
- Pre-existing, not from this change: 15 `no-explicit-any` lint warnings in
  `tests/integration/access-api.test.ts` and 2 in `legacy-persistence-compatibility.test.ts`.

## Not claimed

Production readiness, HIPAA compliance, malware protection, working external integrations, or
approved clinical or legal rules. Synthetic data only. Nothing here is a clinical, legal,
placement or readiness determination; every statement shown is a rendering of a recorded status
or of the existing packet-readiness evaluator.
