# Rev Ops — resume on September 7, 2026

Saved at the end of September 6 in America/Chicago. Tyler requested a clean
stopping point for the night. Do not start more runtime work until he resumes.

## Start here

> Resume Rev Ops from `docs/developer-handoff/REV_OPS_RESUME_2026-09-07.md`.
> PR #49 is merged and verified. Continue on `codex/om/rev-ops-onboarding-fields`.
> Implement the next bounded onboarding/custom-field workflow with fields in
> both setup and data entry. Preserve budget/actual separation, accountable
> corrections, import replay, source history and server-enforced isolation.
> Architect horizontally, implement vertically, validate end-to-end, then expand.

## Exact checkpoint

- Repository: `/Users/tylerhebert/Documents/clarity-platform`
- Remote: `https://github.com/henrytylerhebert-eng/clarity-platform.git`
- Resume branch: `codex/om/rev-ops-onboarding-fields`
- Parent merge: `926b3776ae25df536ad3d2254d51c6d8019aff0a` — PR #49.
- Next-slice brief/status commit: `07f85d07e974e52d6a57d790f3dffd0493d44e7c`.
- This handoff is a subsequent documentation commit on the resume branch.
- No next-slice PR has been opened. Its runtime implementation has not started.

Run `pwd`, `git remote -v`, `git status --short --branch`, and
`git rev-parse HEAD`; fetch before comparing upstream. Preserve any newer work.
Read `AGENTS.md`, then the
[onboarding/fields brief](../product/INPATIENT_REV_OPS_ONBOARDING_FIELDS_BRIEF.md).
Implementation truth lives in [IMPLEMENTATION_STATUS.md](../../IMPLEMENTATION_STATUS.md).

## Completed and verified tonight

[PR #49](https://github.com/henrytylerhebert-eng/clarity-platform/pull/49) is merged.
It includes persisted patient-day budgets/actuals, delegated permissions,
corrections, source history and tenant isolation. The final XLSX fix prevents
unused-sheet structures from allocating workbook models and reads the original
sample's prefixed namespaces correctly.

- 480 root tests, 67 app tests and four Rev Ops desktop/mobile journeys passed.
- Original sample: approved budget 290; actuals 70; correction to 71; repeat
  upload preserved 71 and five history records; reload/fresh API read passed.
- Lint, typecheck, build, Prisma checks, audit and staged secret scans passed.
- [PR CI](https://github.com/henrytylerhebert-eng/clarity-platform/actions/runs/34080062032)
  and [post-merge CI](https://github.com/henrytylerhebert-eng/clarity-platform/actions/runs/34080240757)
  passed. The 18 migrations were tested on fresh PostgreSQL 16 and locally on 18.
- Existing Actions deprecation and visualizer-gitlink cleanup warnings are
  recorded; they did not fail CI and are not new Rev Ops defects.

Detailed evidence: [verification record](../testing/REV_OPS_PATIENT_DAY_VERIFICATION.md).
The existing Pages workflow republished only unchanged `docs/index.html`.
Rev Ops is not deployed; production identity, real data and cutover are unverified.

## Next implementation

Tyler explicitly selected **both setup and data entry**. Start with one complete
hospital/unit workspace flow using bounded text and single-select fields.
Reuse existing contracts, service, import parser, gateway transactions and UI.

1. Read the brief's definition lifecycle, required-value, compatibility and replay
   rules. Preserve existing workspaces without rewriting approved history.
2. Implement administrator configuration/resume, setup values, delegated entry,
   field mappings for imports and snapshots on budget/actual records.
3. Ensure metadata-only differences require corrections and create revisions,
   even when the patient-day count is unchanged. Rename/archive must not relabel
   historical values. Stale previews and invalid rows must fail atomically.
4. Prove the complete synthetic journey, including denied direct requests,
   cross-tenant isolation, restart persistence and backward compatibility.
5. Prepare a draft PR only after the bounded workflow is concrete and verified.

Do not add forecasts, collections, episode counting, sensitive-field access,
external integrations or production onboarding. New metadata must not change
calculations or permissions. No production performance measurements exist.

## Preserved local proof and restart

Durable local evidence directory (not committed to Git):
`/Users/tylerhebert/Documents/Clarity-RevOps-Local-Proof/2026-09-06`

It contains the stopped PostgreSQL 18 cluster in `pg/`, a logical
`clarity_dev.dump`, its readable manifest, workbook/dump SHA-256 values, both
sample XLSX variants, upload script, screenshots and selected test logs.
The copied cluster was started successfully and queried: workspace
`cmtqom0080005svhkdv28k5cv` retained revision 5, actuals 71 and five history rows.
It was stopped again. Logical dump archive readability was checked; a separate
logical restore was not run. Preserve these files; they contain synthetic data.

API 4316, Vite 5175 and the temporary PostgreSQL 55439 were stopped for the night.
Check those ports before restarting; do not kill unrelated processes.

Start the saved database (PostgreSQL 18):

```sh
/opt/homebrew/opt/postgresql@18/bin/pg_ctl \
  -D /Users/tylerhebert/Documents/Clarity-RevOps-Local-Proof/2026-09-06/pg \
  -l /Users/tylerhebert/Documents/Clarity-RevOps-Local-Proof/2026-09-06/postgres.log \
  -o '-p 55439 -h 127.0.0.1' -w start
```

From the repository, start API and frontend in separate terminals:

```sh
DATABASE_URL='postgresql://revops_test@127.0.0.1:55439/clarity_dev?schema=public' API_PORT=4316 npm run api:dev
```

```sh
API_PORT=4316 npm --workspace app run dev -- --host 127.0.0.1 --port 5175 --strictPort
```

Open `http://127.0.0.1:5175/rev-ops`. Use the existing synthetic development
sign-in flow; do not store or print session tokens. The API does not hot-reload:
restart it after backend edits. Use the isolated database URL explicitly for
tests and Prisma commands; do not rely on a possibly different `.env` target.

The preserved `upload-test.mjs` accepts `REVOPS_SAMPLE_FILE`,
`REVOPS_SAMPLE_HOSPITAL` and `REVOPS_SAMPLE_PROOF_DIR`. Supply a fresh synthetic
hospital name when rerunning because it refuses an already populated workspace.
Do not overwrite the preserved baseline report.

## Closeout verification

This closeout changes documentation only. No application tests were rerun solely
for the handoff. Check local links, `git diff --check`, staged secrets and remote
branch equality after pushing. The full passing runtime evidence above belongs
to the completed implementation pass, not new onboarding functionality.
