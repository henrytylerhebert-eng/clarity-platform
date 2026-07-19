# Contradiction Register

| ID | Sources in conflict | Exact conflict | Risk | Temporary interpretation | Owner | Must stop? |
|---|---|---|---|---|---|---|
| CR-001 | `IMPLEMENTATION_STATUS.md`, `ARCHITECTURE.md` | Architecture prose still says no backend/API/auth exists; status file records service foundations and a `node:http` API slice. | Reviewers may understate or overstate implemented capability. | Treat `IMPLEMENTATION_STATUS.md` and current code as implementation truth. | Tech lead | No |
| CR-002 | ADR-0012, `packages/api-service` | ADR accepts Fastify direction in part; implemented slice is `node:http`. | New routes could silently resolve the adapter decision. | Do not add API routes in this slice. | Product owner + tech lead | Yes for API work |
| CR-003 | Role-adaptive frontend, auth service | Frontend role selector scopes display only; backend authorization is session-derived. | Display scoping could be mistaken for security. | Label map permission scope as demo role scoped. | Security + tech lead | No |
| CR-004 | LocalStorage prototype, service persistence | Frontend readiness map reads local state; service foundations are not wired into this UI. | Synthetic behavior could be overstated as durable production capability. | Mark synthetic/local-only in UI and docs. | Tech lead | No |
| CR-005 | Case workflow docs, current AppState | Docs name workflow tasks/deadlines/blockers; AppState lacks first-class task dependency records. | Decorative map risk. | Use local view-model only and document backend prerequisite. | Product owner + tech lead | No |
| CR-006 | Proposed readiness-map language, existing readiness doctrine | Package asks for target readiness; repo forbids a universal readiness score. | Scoring creep. | Use target transitions and blocking classes, no score. | Product owner | No |
| CR-007 | Prisma transactional model, reporting packages | Transactional case state and reporting metrics are separate. | Analytics scope creep. | Do not implement metrics runtime. | Tech lead | No |
| CR-008 | User-facing activity, compliance-grade audit | App has user-facing audit logs and custody ledger; full audit metadata is broader. | Compliance claims would be unsupported. | Display split views and label missing audit contracts. | Compliance + security | No |
| CR-009 | Receiving facility stakeholder, central intake operator | Product-wide stakeholder differs from this slice operator. | UX may overfit intake and miss receiving facility needs. | Anchor slice on intake but preserve receiving-facility handoff lanes. | Product owner | No |
| CR-010 | Great Game concepts, patient-level readiness | Future operating performance layer could misuse patient readiness as score. | Unsafe employee/patient scoring. | Document compatibility only; no implementation. | Product owner | No |

