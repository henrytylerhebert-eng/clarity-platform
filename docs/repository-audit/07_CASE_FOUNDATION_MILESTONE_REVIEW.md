# 07 — Case Foundation Milestone Review

**Date:** 2026-07-11. Independent verification of the case-foundation state before hardening work and the document-repository expansion. Every claim below was verified by running the stated command in this session; nothing is repeated from prior reports without re-execution.

## Verified branch and commits

- **Branch:** `feat/case-command-service` (`git status --short --branch`), working tree **clean**.
- **Remotes:** none (`git remote -v` returns nothing). Nothing has ever been pushed.
- **Tags:** none.
- **Commit history** (`git log --oneline --decorate -15`): the five reported case-command-service commits exist —
  `2f989eb` (case version + idempotency schema), `1efefe6` (contracts/gateway), `8054cd6` (command service), `f9b8630` (tests), `8ffedee` (docs) — on top of the case-repository branch line (`da9802a` …) and integration base (`f39e8cb`).

## Discrepancy vs. the reported state (material)

The task brief's "current reported state" describes the repository as it was **five commits ago**. Since then, the same branch gained a document command service (this session's earlier work):

- `94d7771` document domain contracts + shared `CommandActor`/command errors extracted to `domain-contracts`
- `c156f88` `PrismaDocumentGateway` in `case-repository`
- `d4b1029` `@clarity/document-service` (UploadDocument / ClassifyDocument / AccessDocument, in-memory content-addressed storage)
- `a37a3c1` 14 document integration tests (also fixed the `npm test` script — vitest 2.1.9 rejects repeated `--dir` flags)
- `4b457fd` ADR-0004-document-service.md + docs

Consequences for this work plan:
1. Baseline is **105/105 tests**, not 91/91 (91 + 14 document tests).
2. **ADR-0004 is taken** (`ADR-0004-document-service.md`). The assignee-validation ADR becomes **ADR-0005**, linting **ADR-0006**, document storage/compensation **ADR-0007**.
3. Phase 5 ("implement the document repository") is partially complete. What exists: metadata persistence, SHA-256 dedupe, manual classification state machine, case-ownership checks, access auditing, tenant scoping, 14 tests. What is missing vs. the new requirements: a filesystem (non-in-memory) storage adapter with delete/exists and traversal protection, file validation policy (MIME/extension/size/filename), file-size + version-family metadata (schema gap — see below), document versioning, storage/DB failure compensation, upload-failure and cleanup audit events, filename sanitization in audit metadata, and the corresponding tests/docs. Phase 5 work in this cycle extends the existing packages; it does not rebuild them.

## Verified schema and migration status

- `npx prisma migrate status`: datasource is PostgreSQL **`clarity_dev`** at `localhost:5432`; **2 migrations found; "Database schema is up to date!"** (`20260710233252_initial_clarity_foundation`, `20260711133547_case_version_and_command_idempotency`).
- `.env` `DATABASE_URL` points at `localhost:5432/clarity_dev` (credentials not recorded here).
- `npx prisma validate`: **valid**.
- Deprecation warning: `package.json#prisma` config property is deprecated in favor of `prisma.config.ts` (Prisma 7). Non-blocking; noted as future toolchain work.

## Verified test and typecheck results

- `npx tsc --noEmit`: **pass** (no output).
- `npm test` (vitest): **16 files, 105/105 passed** — includes the case-repository suite (30 across its 4 files), case-command-service suites (22), document suite (14), and the pre-existing unit/workflow/security/data baseline.
- **Zero synthetic residue** after the suite, verified by direct count query: organizations, users, patient tokens, cases (by `synthetic-*` prefix), plus total `SourceDocument`, `CommandIdempotencyRecord`, and `AuditEvent` counts — all **0**.

## Verified code-level findings

- **TOCTOU risk confirmed present:** `CaseCommandService.assignCase` validates the assignee via `gateway.findOrganizationUser(...)` *before* the gateway transaction opens (`packages/case-service/src/caseCommandService.ts`, "Assignee must exist in the SAME organization" block). A membership change between that check and the transaction commit could produce a committed cross-org assignment. Additionally, the check tests organization membership only — **`User.status` is never consulted**, so an `INACTIVE`/`LOCKED` user can currently be assigned. The schema supports the rule (`User.status UserStatus @default(ACTIVE)`). To be fixed in Phase 2.
- **Reopen authority:** the policy code is already exact — `COMMAND_ROLE_POLICY.ReopenCase = ["ORGANIZATION_ADMIN"]` (`packages/case-service/src/permissions.ts`), and `SYSTEM_ADMIN` appears in no command policy. ADR-0003 and `CASE_COMMAND_SERVICE.md` already name `ORGANIZATION_ADMIN` explicitly. Remaining ambiguity is cosmetic: the test fixture variable is named `admin` and one test comment says "admin without reason fails". There is **no test asserting `SYSTEM_ADMIN` cannot reopen**, and no test asserting a failed reopen writes no audit/idempotency record. To be closed in Phase 3.
- **No lint configuration** anywhere in the repo (no eslint/biome config files, no `lint` script at root or in `app/`). Confirmed by filesystem search. To be added in Phase 4.
- **Prisma import boundary holds:** `@prisma/client` is imported only inside `packages/case-repository` (the approved adapter package); `case-service` and `document-service` depend on the gateway only.

## Open risks (carried forward, unchanged)

1. Actor roles are trusted caller input — no authentication exists (documented assumption in ADR-0003/0004).
2. Document bytes live in a process-local in-memory store; no persistence, no validation of file content, no malware scanning.
3. Idempotency records have no retention/expiry policy.
4. No CI; test discipline is manual.
5. OD-1 (missing master-package files), OD-2 (counsel review), OD-3 (clinical licensing) remain blocked as recorded in `IMPLEMENTATION_STATUS.md`.

## Verdict

The case foundation is verified working as claimed (adjusted for the five newer document-service commits). Safe to proceed with hardening (Phases 1–4) and the document-repository expansion (Phase 5) on a dedicated integration branch.
