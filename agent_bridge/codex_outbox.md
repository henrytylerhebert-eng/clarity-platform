# Clarity Network Enrichment — Packet 11 Master Execution Prompt

You are working in the local Clarity Platform repository:

`/Users/tylerhebert/Documents/clarity-platform`

## Execution mode

This task is running through Codex Spark with constrained usage.

Operate efficiently:

* Do not perform a broad repository audit.
* Do not reread the entire documentation tree.
* Inspect only the files and patterns necessary for this packet.
* Reuse existing contracts, services, gateways, error classes, audit helpers, idempotency behavior, test utilities, and Prisma conventions.
* Do not regenerate architecture that already exists.
* Do not spend output tokens explaining standard implementation choices.
* Do not ask for another approval. The product decisions in this prompt are approved by Tyler.
* Do not continue into Packet 12 or later packets.
* Do not use the web.
* Do not add live scraping, egress, workers, or external integrations.
* Do not repeat complete source files in the final response.
* Keep the final report evidence-based and concise.

Implement the packet. Do not merely propose it.

---

# 1. Approved product decisions

Treat the following as owner-approved decisions.

## Decision A — Canonical ownership

A dedicated Clarity Network/CRM domain owns approved canonical data for:

* organizations;
* parent organizations;
* physical locations and campuses;
* programs and levels of care;
* contact points;
* personnel relationships;
* payer-participation records;
* facility-admission profiles;
* transport-capability profiles;
* network relationships.

The Network Enrichment domain owns only:

* research and enrichment runs;
* entity-resolution candidates;
* candidate field values;
* source evidence;
* conflicts;
* freshness information;
* review packages;
* field-level review decisions;
* correction and supersession history;
* future promotion intent.

The enrichment service must not become a second canonical CRM system of record.

## Decision B — Approval and promotion are separate

Review approval and canonical CRM promotion are separate actions.

A reviewer may approve a candidate field without directly mutating the canonical CRM.

Future canonical promotion must use a separate controlled command, permission, transaction, audit event, and concurrency check.

Packet 11 must not implement canonical CRM mutation.

## Decision C — Field-level review

A review package may contain mixed outcomes.

For example:

* one field may be approved;
* another rejected;
* another marked stale;
* another placed in conflict;
* another may require clinical review;
* another may require legal review.

Do not require all-or-nothing package approval.

Package-level status must be derived from or reconciled with field-level states.

## Decision D — Sensitive-field review

The following categories require category-specific review before becoming eligible for future canonical promotion:

* admission authority;
* physician or nurse-practitioner delegation;
* medical-clearance requirements;
* laboratory requirements;
* inclusionary criteria;
* exclusionary criteria;
* accepted legal statuses;
* custody requirements;
* secure transport requirements;
* law-enforcement transport;
* minor or guardian pathways;
* payer participation;
* capacity or bed-count claims;
* arrival and handoff procedures;
* other clinical, legal, payer, transport, or safety-sensitive operational claims.

Do not invent clinical or legal reviewer authority.

Map these requirements to existing repository roles and policies where they exist. When no final role exists, represent the required reviewer category as configurable policy rather than hard-coded statutory or clinical truth.

## Decision E — Google assets

Existing Google Sheets, CRM seed files, and Apps Script assets are classified as:

* historical prototypes;
* seed-data sources;
* controlled future import/export adapters.

They are not:

* the canonical CRM;
* the enrichment runtime;
* the review system;
* the production database;
* the source of production authorization;
* the production automation layer.

Do not delete those assets. Document their status.

## Decision F — Packet 11 boundary

Packet 11 introduces persistent candidate-enrichment and review-state infrastructure only.

It does not introduce:

* live web research;
* browser automation;
* Google search;
* CMS, Medicare, LDH, licensing, or facility-site integrations;
* production egress;
* scheduled jobs;
* workers;
* queues;
* autonomous agents;
* canonical CRM writes;
* facility matching;
* routing decisions;
* current-patient benefit verification;
* production deployment.

---

# 2. Expected repository state to verify

The following information comes from the latest owner handoff. Verify it instead of assuming it:

* Expected branch: `codex/om/sync-main`
* Expected working tree: clean
* Expected branch state: ahead of its origin
* Latest reported accepted commit: `2b9cc49`
* Network Enrichment Packet 2, Packet 2+, Packet 8, Packet 9, and Packet 10 are reported complete.
* Current runtime is synthetic and in memory.
* Existing network-enrichment service files include:

  * `packages/domain-contracts/src/networkEnrichment.ts`
  * `packages/network-enrichment-service/src/reviewCommands.ts`
  * `packages/network-enrichment-service/src/reviewGateway.ts`
  * `packages/network-enrichment-service/src/runtime.ts`
  * `packages/network-enrichment-service/src/index.ts`
  * `packages/network-enrichment-service/test/`
* Existing API composition includes:

  * `packages/api-service/src/reviewCommandCaller.ts`
  * `packages/api-service/src/server.ts`
  * `packages/api-service/src/devMain.ts`
  * `packages/api-service/src/index.ts`
  * `tests/integration/api-service.test.ts`
* Existing decision and evidence records include:

  * `docs/developer-handoff/NEXT_PERSISTENCE_HARDENING_EVIDENCE.md`
  * `docs/decisions/NETWORK_ENRICHMENT_PACKET_10_REVIEW_AND_ACCEPTANCE_RECORD.md`
  * `docs/decisions/NETWORK_ENRICHMENT_PACKET_7_ARTIFACT_POLICY_EXCEPTION.md`
  * `docs/decisions/CRM_UI_ARCHITECTURE_REVIEW_PACKET.md`

Locate the actual open-decisions file rather than assuming its exact spelling.

Do not modify unrelated dirty work if repository state differs from the expected state.

---

# 3. Packet 11 objective

Implement a tenant-safe, persistent, auditable foundation for Network Enrichment candidate data and field-level review.

The completed slice must support:

```text
Synthetic enrichment package
→ persistent enrichment run
→ persistent entity candidate
→ persistent candidate fields
→ persistent field evidence
→ persistent conflicts
→ field-level review decisions
→ package-state reconciliation
→ immutable audit history
```

The implementation must preserve the existing service and API behavior where possible.

Do not expand the HTTP route surface unless a route is strictly required to prove the persistent implementation.

Prefer replacing or supplementing the in-memory gateway behind the existing interface through dependency injection.

---

# 4. Required targeted inspection

Before editing, inspect only:

1. `git status`, branch, HEAD, and scoped recent history.
2. The files listed in Section 2.
3. `prisma/schema.prisma`.
4. Existing Prisma gateway patterns in:

   * case;
   * document;
   * evidence;
   * benefits;
   * authorization;
   * authentication.
5. Existing command-idempotency and audit patterns.
6. Existing organization-scoping predicates.
7. Existing optimistic-concurrency behavior.
8. Existing domain error classes and API mappings.
9. Relevant tests and test database cleanup patterns.
10. The CRM architecture review packet and relevant open decisions.

Do not inventory every package or read immutable reference packages.

---

# 5. Record the approved architecture decision

Before or alongside implementation:

1. Update `docs/decisions/CRM_UI_ARCHITECTURE_REVIEW_PACKET.md` from `needs_review` to the appropriate accepted status, preserving its existing history.
2. Record Tyler’s approval of Decisions A–F.
3. Create the Packet 11 execution and acceptance document using the repository’s existing decision-record format.

Suggested path:

`docs/decisions/NETWORK_ENRICHMENT_PACKET_11_PERSISTENCE_EXECUTION_AND_ACCEPTANCE.md`

The document must state:

* goal;
* approved ownership boundary;
* allowed scope;
* exclusions;
* expected files;
* required tests;
* rollback boundary;
* completion evidence;
* remaining decisions.

Do not mark OD-5 or OD-6 resolved unless existing repository evidence independently proves they are resolved.

---

# 6. Persistence model

Map these concepts to existing repository naming and Prisma conventions. Do not create duplicate entities where a current equivalent already exists.

The persistence layer must represent the following concepts.

## 6.1 Enrichment run

A durable record of one enrichment attempt.

Required concepts:

* ID;
* tenant organization ID;
* schema version;
* input identity;
* status;
* source type or synthetic origin;
* created by;
* created time;
* submitted time;
* correlation ID;
* version;
* supersession or correction relationship where applicable.

## 6.2 Entity candidate

A possible organization, location, campus, or program match.

Required concepts:

* enrichment-run relationship;
* candidate entity type;
* requested name and location;
* normalized identity signals;
* candidate canonical reference when one is known;
* resolution status;
* resolution confidence;
* explanation or structured match signals;
* ambiguity reason;
* active, inactive, closed, renamed, or unknown state;
* version.

Do not merge ambiguous entities.

## 6.3 Review package

A reviewable collection of candidate fields.

Required concepts:

* enrichment-run relationship;
* entity-candidate relationship;
* package status;
* submitted by;
* submitted time;
* assigned reviewer or reviewer category where supported;
* terminal-state protection;
* version;
* idempotency support.

Preserve existing package states unless extension is required.

Do not replace a working state machine without evidence.

## 6.4 Candidate field

Candidate fields must be individually reviewable.

Required concepts:

* tenant organization ID;
* review-package relationship;
* entity-candidate relationship;
* field path;
* field category;
* original observed representation;
* normalized candidate value;
* current canonical snapshot when supplied;
* value type;
* review state;
* operational-use status;
* sensitivity category;
* freshness state;
* source effective date when known;
* retrieved date;
* last human verification when known;
* version;
* supersession relationship.

Use validated structured data.

Avoid unrestricted JSON where stable typed columns or validated discriminated values are practical. JSON may be used for heterogeneous values only behind schema validation.

Unknown values must use `null`, not the string `"Unknown"`.

## 6.5 Evidence record

Evidence must be reusable and immutable.

Required concepts:

* tenant organization ID;
* source type;
* source authority tier;
* source title;
* source URL where applicable;
* retrieved timestamp;
* published or effective date;
* minimum-necessary evidence excerpt or faithful summary;
* source scope;
* source status;
* confidence;
* content hash where appropriate;
* originating run;
* created by;
* immutable creation timestamp.

Do not place full page bodies, unrestricted HTML, credentials, PHI, or private contact information into evidence or audit metadata.

## 6.6 Field-to-evidence relationship

Candidate fields and evidence require a many-to-many relationship:

* one field may rely on multiple evidence records;
* one evidence record may support multiple candidate fields.

Do not copy the same evidence body into every candidate field.

## 6.7 Conflict record

Conflicting values must remain visible.

Required concepts:

* tenant organization ID;
* review package;
* field path;
* competing candidate-field references;
* conflict type;
* authority difference;
* date difference;
* scope difference;
* reason;
* status;
* required reviewer category;
* resolution decision;
* resolved by;
* resolved at;
* version.

Do not implement automatic “highest confidence wins” behavior.

## 6.8 Field review decision

Review decisions must be durable and auditable.

Required concepts:

* candidate field;
* reviewer identity;
* reviewer role or category;
* decision;
* rationale;
* prior state;
* resulting state;
* decision time;
* correlation ID;
* version.

Preserve prior decisions rather than overwriting them.

## 6.9 Future promotion boundary

Packet 11 may define a contract or inactive model for future promotion intent if needed.

It must not:

* mutate canonical CRM data;
* mark a field as canonically applied;
* bypass a future controlled promotion command.

---

# 7. Review and state behavior

Use existing domain states where they already exist.

The resulting architecture must support, either directly or through mapped existing values:

* `UNRESEARCHED`
* `CANDIDATE`
* `SOURCE_CONFIRMED`
* `HUMAN_CONFIRMED`
* `CONFLICT`
* `STALE`
* `REJECTED`
* `SUPERSEDED`
* `DEPRECATED`

Only authorized human review behavior may assign a human-confirmed state.

Agent, import, submission, or synthetic creation paths must not assign `HUMAN_CONFIRMED`.

## Package behavior

A package may contain mixed dispositions.

Package status should reflect field outcomes without erasing them.

Examples:

* all fields awaiting review;
* partially reviewed;
* approved with unresolved conflicts;
* partially approved;
* rejected;
* completed for current review stage.

Do not allow a package-level approval to silently approve every field.

## Terminal behavior

Preserve the existing terminal-transition protections.

A terminal package or field decision must not transition again except through an explicit future correction or supersession command.

---

# 8. Service and gateway behavior

Preserve existing public contracts where practical.

## Required gateway capabilities

The persistent gateway should support the minimum operations needed by current commands, including:

* create or submit a review package;
* retrieve a package by tenant scope;
* retrieve candidate fields and evidence;
* approve an eligible field;
* reject a field;
* record or resolve a conflict where already supported;
* persist field-level decisions;
* reconcile package status;
* enforce version predicates;
* enforce idempotency;
* write audit events atomically.

If current commands only support package-level approval or rejection, refactor them carefully toward field-level review while preserving compatibility or explicitly versioning the contract.

Do not silently change existing API semantics.

## Runtime composition

Preferred pattern:

```text
Existing command caller
→ existing service interface
→ persistent Prisma gateway
```

Retain the in-memory gateway for:

* isolated unit tests;
* synthetic fixtures;
* development scenarios where appropriate.

Do not let development composition accidentally become the production default.

---

# 9. Tenancy and authorization

Every tenant-owned query and mutation must include organization scope in the persistence predicate.

The organization must come from the verified principal or server-owned actor context.

Never accept caller-controlled:

* `organizationId`;
* tenant ID;
* actor ID;
* roles;
* reviewer authority.

Required protections:

* cross-tenant identifier enumeration resistance;
* equivalent not-found behavior where appropriate;
* cross-tenant review denial;
* cross-tenant evidence denial;
* cross-tenant conflict denial;
* no system-admin bypass unless an explicit audited platform policy already exists.

Do not establish a new authorization model inside the gateway.

Use existing policy and command-layer patterns.

---

# 10. Idempotency, concurrency, and atomicity

## Idempotency

Preserve current behavior:

* same idempotency key plus same normalized payload safely replays;
* same idempotency key plus different payload returns conflict;
* replay does not duplicate review decisions, evidence, candidate fields, conflicts, or audit events.

Use the existing command-idempotency pattern.

Do not create a second idempotency subsystem.

## Optimistic concurrency

Mutations must require the expected version where the current architecture uses versioned state.

A stale version must return the existing concurrency-conflict taxonomy.

## Atomicity

Each state mutation must atomically persist:

* target state;
* review decision;
* package reconciliation where applicable;
* idempotency outcome;
* audit event.

A failed command must not leave partial rows.

---

# 11. Audit and supersession

Use the existing append-only audit infrastructure.

Audit metadata may contain:

* record IDs;
* field paths;
* source classifications;
* prior and resulting states;
* hashes;
* reviewer category;
* correlation ID;
* version.

Audit metadata must not contain:

* unrestricted source excerpts;
* full web-page content;
* credentials;
* bearer tokens;
* PHI;
* private personal contact data;
* unrestricted candidate payloads.

Evidence correction must not mutate the original evidence record.

Corrections should create a superseding record or explicit correction relationship.

Candidate-field corrections must preserve their prior value and decision history.

---

# 12. Sensitive-field policy

Implement or extend a deterministic policy helper that maps field categories to reviewer requirements.

At minimum, distinguish:

* normal business identity/contact data;
* payer-related data;
* admission operations;
* clinical criteria;
* legal-status requirements;
* custody and transport;
* capacity claims.

The helper must answer:

* required reviewer category;
* whether one review is sufficient;
* whether specialized review is required;
* whether the field may become eligible for future promotion;
* whether unresolved conflict blocks eligibility.

Do not encode facility-specific clinical thresholds or statutory interpretations.

Represent them as configurable candidate information requiring qualified review.

---

# 13. Google Sheets and Apps Script classification

Locate Packet 5 CRM seed and Apps Script assets.

Do not remove or rewrite them unless necessary.

Add a concise status notice in the appropriate documentation stating:

> Google Sheets and Apps Script assets are legacy seed/import/export tooling. They are not the canonical CRM, production enrichment runtime, review system, authorization boundary, or production database.

Do not add Apps Script to the runtime composition.

---

# 14. API boundary

Do not add new API routes unless existing routes cannot prove Packet 11.

Existing routes must continue to:

* derive the actor and tenant from the authenticated principal;
* reject principal-field smuggling;
* reject unknown payload fields;
* map not-found behavior consistently;
* map concurrency conflict consistently;
* map idempotency replay drift to conflict;
* map invalid terminal transitions consistently.

The API must remain a thin transport adapter.

Do not place review policy, tenant policy, or persistence rules directly in `server.ts`.

---

# 15. Required tests

Add focused tests using the repository’s existing structure.

At minimum, prove:

1. Persistent submission creates the expected package and candidate-field records.
2. Persistent replay with the same idempotency key and same payload does not duplicate rows.
3. Replay drift returns conflict.
4. Every read is scoped by organization.
5. Every write is scoped by organization.
6. Cross-tenant package access fails.
7. Cross-tenant field review fails.
8. Cross-tenant evidence access fails.
9. Caller-supplied principal or organization fields remain rejected.
10. A stale expected version returns concurrency conflict.
11. A missing review ID maps to the current not-found behavior.
12. A terminal package cannot transition again.
13. One field can be approved while another is rejected.
14. Rejecting one field does not reject unrelated fields.
15. Package status reconciles correctly from mixed field outcomes.
16. Submission cannot assign `HUMAN_CONFIRMED`.
17. Human-confirmed fields cannot be silently replaced by an agent or submission path.
18. Sensitive fields require the appropriate reviewer category.
19. An unresolved sensitive conflict blocks future promotion eligibility.
20. Evidence is immutable.
21. Evidence can support multiple fields.
22. A field can reference multiple evidence records.
23. Corrections preserve supersession history.
24. Audit writes occur in the same transaction as state changes.
25. A forced transaction failure leaves no partial persistence.
26. Failed commands do not leave orphan idempotency records.
27. Existing Packet 8–10 regressions still pass.
28. Test cleanup leaves no synthetic persistence residue.

Use synthetic data only.

---

# 16. Likely files

Inspect repository conventions before deciding final placement.

Expected areas may include:

```text
prisma/schema.prisma
prisma/migrations/

packages/domain-contracts/src/networkEnrichment.ts

packages/network-enrichment-service/src/
  reviewCommands.ts
  reviewGateway.ts
  runtime.ts
  index.ts
  prismaReviewGateway.ts

packages/network-enrichment-service/test/

packages/api-service/src/
  reviewCommandCaller.ts
  server.ts
  devMain.ts
  index.ts

tests/integration/
  api-service.test.ts
  network-enrichment-persistence.test.ts

docs/decisions/
docs/developer-handoff/
```

Do not create files solely to match this list.

Follow existing naming and colocated-test patterns.

---

# 17. Migration rules

When Prisma changes are required:

* use one scoped migration;
* preserve existing data;
* do not modify canonical organization or facility ownership models unless necessary;
* do not create duplicate organization, facility, program, or contact tables;
* add indexes for tenant-scoped lookups;
* add uniqueness constraints that include tenant scope where appropriate;
* avoid globally unique business identifiers when tenant semantics require otherwise;
* use restrictive foreign-key behavior;
* do not use cascading deletion where it would erase evidence, decisions, or audit history;
* ensure the migration is backward-compatible with the current application version where practical.

Run Prisma formatting and validation.

---

# 18. Explicit exclusions

Do not implement any of the following:

* live enrichment agent;
* web search;
* URL fetching;
* egress allowlists;
* SSRF controls for a network client;
* CMS adapter;
* Medicare adapter;
* LDH adapter;
* licensing-board adapter;
* facility-website crawler;
* browser automation;
* cron;
* worker;
* queue;
* Google Apps Script runtime;
* canonical CRM mutation;
* canonical promotion command;
* production deployment;
* CRM UI;
* review workspace UI;
* referral matching;
* routing behavior;
* admission decisioning;
* current-patient insurance verification;
* predictive scoring.

Document later work. Do not begin it.

---

# 19. Future packet sequence

Record this approved sequence without implementing it:

## Packet 12

Read-only and review-capable Network Enrichment workspace:

* review queue;
* candidate versus canonical values;
* evidence;
* source authority;
* conflicts;
* freshness;
* field-level decisions;
* audit history.

## Packet 13

Controlled canonical-promotion command:

* separate permission;
* canonical concurrency check;
* dry-run;
* approved-field selection;
* audit;
* rollback or correction boundary.

## Packet 14

Controlled seed import/export adapter:

* CSV or spreadsheet import;
* validation;
* deduplication;
* candidate creation only;
* no direct canonical writes.

## Packet 15

Production egress and source-connector boundary.

## Packet 16

First approved official-source adapter.

## Packet 17

Agent orchestration and candidate generation.

## Packet 18

Freshness monitoring, re-verification, and stale-data queue.

---

# 20. Verification sequence

Run focused checks first.

At minimum:

```bash
git status --short
git branch --show-current
git rev-parse HEAD
git diff --check

npm run test --workspace=packages/network-enrichment-service
npm run lint --workspace=packages/network-enrichment-service

npx vitest run tests/integration/api-service.test.ts --root .
npx tsc --noEmit
```

When Prisma or persistent integration behavior is added, also run the repository’s established equivalents of:

```bash
npx prisma format
npx prisma validate
npx prisma generate
```

Run focused persistence integration tests.

Then run the full root test suite if the focused tests pass and no unrelated baseline failure prevents it.

Run app tests only if app files or shared contracts used by the app changed.

Do not report a passing command unless it actually ran and passed.

If a command fails because of a pre-existing unrelated issue, report:

* exact command;
* exact failure;
* evidence that it is unrelated;
* which scoped checks still passed.

---

# 21. Acceptance criteria

Packet 11 is complete only when:

* approved ownership decisions are recorded;
* CRM architecture packet status reflects owner approval;
* candidate enrichment data persists through a tenant-scoped gateway;
* field-level review persists;
* evidence and conflicts persist;
* mixed field dispositions work;
* package status reconciles correctly;
* sensitive-field reviewer requirements are enforced;
* idempotency replay and replay drift work;
* optimistic concurrency works;
* audit writes are atomic;
* evidence and decisions preserve history;
* no canonical CRM mutation exists;
* no live egress exists;
* no Apps Script runtime has been introduced;
* focused tests pass;
* migration validation passes when applicable;
* the working tree contains only Packet 11 changes.

---

# 22. Commit behavior

After all required checks pass:

1. Review the scoped diff.
2. Run `git diff --check`.
3. Confirm no unrelated files were changed.
4. Create one intentional commit:

```text
feat: persist network enrichment review state
```

Do not push.

If checks do not pass, do not commit.

---

# 23. Final response format

Keep the final response concise.

Return exactly these sections:

## 1. Completed

State what Packet 11 implemented.

## 2. Architecture decisions recorded

List the accepted ownership and review boundaries.

## 3. Files affected

List created and modified files.

## 4. Persistence behavior

Summarize:

* tenant scoping;
* field-level review;
* evidence;
* conflicts;
* freshness;
* supersession;
* idempotency;
* concurrency;
* audit.

## 5. Explicitly not implemented

Confirm no:

* live egress;
* scraping;
* Apps Script runtime;
* canonical CRM mutation;
* review UI;
* deployment.

## 6. Verification

List every command run and its actual result.

## 7. Remaining decisions

List only decisions that genuinely remain unresolved.

Do not reopen Decisions A–F.

## 8. Next packet

State:

`Packet 12 — Network Enrichment Review Workspace`

Provide no implementation for Packet 12.

## 9. Commit

Return the commit hash if a commit was created.

Do not include large code excerpts or repeat documentation contents.
