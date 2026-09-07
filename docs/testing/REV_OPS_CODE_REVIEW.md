# Rev Ops first slice: code review guide

Status: draft review package. Owner walkthrough and local test/debug pass are
complete. Merge, release and expansion remain separate decisions.

## Review order

1. `docs/product/INPATIENT_REV_OPS_FIRST_SLICE_BRIEF.md`: approved counting,
   correction, delegation and budget-phasing rules. Other product documents
   describe proposed later scope, not implemented capability.
2. `packages/domain-contracts/src/revOps.ts` and
   `packages/rev-ops-service/src/index.ts`: strict commands, immutable budget
   baselines, current actuals with retained revisions, completeness and comparisons.
3. `packages/case-repository/src/revOpsGateway.ts`, `prisma/schema.prisma`, and
   the four `20260907000*` migrations: atomic state/journal updates, revision
   conflicts, organization RLS, unit-scoped permissions and audit retention.
4. `packages/api-service/src/server.ts`, `revOpsRoutes.ts`, `revOpsImport.ts`:
   thin Fastify migration, verified principal boundaries, import validation,
   source references and replay behavior. Existing API contracts are regression-tested.
5. `app/src/workspaces/RevOps.tsx` and the dedicated browser tests: setup through
   reporting, delegated census work and server logout. The workspace uses the
   server rather than the surrounding prototype's role selector/localStorage.

## Highest-value review questions

- Can any request supply or bypass organization, actor, permission or revision
  authority? Verify grants are evaluated from persisted state on each command.
- Can corrections, repeated uploads, closed periods, parent deletion/key updates or budget
  amendments discard prior evidence? The retention regression first reproduced
  a cascading-delete bypass, then passed after the third migration. The fourth
  migration prevents parent key changes from rewriting journal references.
- Can workbook structures expand beyond byte limits? `revOpsXlsx.ts` decodes the
  validated ZIP entries once and uses namespace-aware SAX parsing of bounded cell
  values. It never constructs ExcelJS workbook objects. Bounds apply to unused
  worksheets too; merges, column ranges, validations and dimensions cannot trigger
  model expansion. Ordinary stored/deflated ZIP files are supported; ZIP64 and
  ambiguous containers are rejected. Review the limits in the verification record.
- Are full-month and phased comparisons clearly distinguished, with missing
  census dates represented as unknown? Can an upload be mistaken for collections
  or forecast data? Neither later lane has a write path here.
- Is the bounded JSON aggregate acceptable for this synthetic vertical slice?
  There are explicit budget/day/revision limits, but no production scale evidence.
  Wider normalization, retention and archive policies need review before rollout.
- Rev Ops enforces one timezone across its units in a facility. It does not yet
  reconcile its configured timezone with the existing versioned episode timezone
  configuration. Decide that integration before linking episode-derived activity.

## Reproduce locally

Use an isolated local PostgreSQL database named `clarity_dev`, and set
`DATABASE_URL` for that database. The integration harness refuses other database
names/remote hosts. Do not copy production connection strings or data.

```sh
npm ci
npm run prisma:validate
npm run prisma:generate
npx prisma migrate deploy
npm run lint
npm run typecheck
npm test
npm run test:app
npm --workspace app run build
npm audit --audit-level=high
```

For browser checks, install the Chrome channel expected by the existing
Playwright configs if it is not available. Start the isolated API in one terminal:

```sh
API_PORT=4316 npm run api:dev
```

Then run:

```sh
npm --workspace app run smoke
cd app
npx playwright test --config playwright.revops.config.ts
```

The dedicated config starts Vite on port 5175 and expects the API on 4316.
Local tests use synthetic development assertions. Production identity, deployment,
rollback, real hospital imports and performance remain unverified.

## Evidence and scope notes

Current results and the before/after debug findings live in
[the verification record](REV_OPS_PATIENT_DAY_VERIFICATION.md).
CI runs lint, typecheck, root/app tests, migrations and dependency audit.
App build, browser journeys and process-restart proof were performed locally;
they are not currently separate GitHub CI jobs.

The lockfile includes Fastify, ExcelJS and CSV parsing dependencies, the ExcelJS
UUID override, and resolved transitive updates from installation/audit remediation.
Saxes 6 is now a direct runtime dependency and JSZip is a direct test dependency;
both versions were already in the lockfile. ExcelJS is retained for fixture tests,
but the Rev Ops upload path no longer invokes its model loader.
No workbook binaries, patient records, `.env` values or generated screenshots
are included. Existing smoke-selector and prescreen-fixture fixes are separated
from feature code in the commit history for review.

This repository is Clarity. Opportunity Machine/MiroFish integration is outside
the change: no evidence-to-capital capability is claimed and no reusable MiroFish
infrastructure is changed.
