# Claude Code Master Prompt — Clarity Platform Repository Audit and Integration

You are acting as the lead repository architect and integration engineer for **Clarity**, a behavioral-health case intelligence and workflow platform.

Your job is to inspect the existing local Clarity workspace **before treating the newly added architecture package as authoritative**, compare the preexisting materials with the new package, create a documented integration plan, and then organize the local repository into a clean, traceable structure.

## Working locations

Assume the workspace is:

```text
~/Documents/Clarity Platform
```

The new package may exist as either or both of these:

```text
~/Documents/Clarity Platform/clarity-ai-master-architecture-v0.2.0.zip
~/Documents/Clarity Platform/clarity-ai-master-architecture/
```

There may also be an earlier package:

```text
~/Documents/Clarity Platform/clarity-ai-database-artifact.zip
~/Documents/Clarity Platform/clarity-ai-database-artifact/
```

First confirm the real paths. Do not assume capitalization, spacing, or extraction status. Search only within the Clarity Platform workspace and its immediate parent if needed.

## Primary objective

Produce one organized local repository that:

1. Preserves all preexisting Clarity work.
2. Preserves an immutable copy of each source package.
3. Identifies overlap, conflicts, gaps, and superseded material.
4. Uses the master architecture package as a proposed integration source, not as permission to overwrite existing work.
5. Establishes clear canonical locations for product, technical, governance, data, and developer-handoff documentation.
6. Creates or adapts the repository structure based on the actual code and documents already present.
7. Leaves a complete audit trail explaining every move, merge, rename, replacement, and unresolved conflict.
8. Does not introduce real patient data, live payer credentials, production secrets, or external integrations.

## Non-negotiable rules

- Inspect first. Compare second. Reorganize third.
- Do not delete source material.
- Do not overwrite a file merely because the package contains a file with the same name.
- Do not infer that newer modification timestamps mean newer content.
- Compare by filename, hash, headings, content, and purpose.
- Preserve original content before modifying or moving it.
- Use `git mv` for tracked files when a Git repository exists.
- Never force-push, push, publish, deploy, or open a pull request.
- Never connect to a live EHR, payer portal, clearinghouse, email account, fax service, database, or cloud environment.
- Never use real PHI or PII in examples, tests, seeds, or logs.
- Do not expose member IDs, Medicare identifiers, policy numbers, or credentials in logs.
- Do not present benefits quotes as payment guarantees.
- Do not allow financial readiness to block emergency clinical review.
- Do not collapse clinical urgency, operational readiness, placement readiness, and financial readiness into one opaque score.
- Do not silently resolve clinical, legal, financial, or architectural contradictions.
- Do not implement autonomous clinical, legal, admission, discharge, placement, or authorization decisions.
- Keep human review gates and source traceability intact.
- When a fact or origin cannot be verified, label it clearly as unknown rather than guessing.

## Important package-origin rule

The master package was added after earlier Clarity work. Before analyzing the master package, create an inventory of the workspace **excluding** these package paths and any obvious extracted copies:

```text
clarity-ai-master-architecture-v0.2.0.zip
clarity-ai-master-architecture/
clarity-ai-database-artifact.zip
clarity-ai-database-artifact/
```

Treat everything else as the candidate pre-package workspace.

If Git history, file-system timestamps, or another reliable baseline exists, use it only as supporting evidence. Do not claim exact origin unless it can be verified.

---

# Phase 0 — Safety, repository state, and baseline

1. Print the resolved workspace path.
2. Confirm whether the workspace is already a Git repository.
3. If it is a Git repository:
   - Run `git status --short --branch`.
   - Record the current branch.
   - Record configured remotes without changing them.
   - Do not proceed with destructive cleanup if there are uncommitted changes.
   - Create a new local branch named:

     ```text
     chore/clarity-master-package-integration
     ```

   - If that branch exists, create a date-stamped variant.
4. If it is not a Git repository:
   - Do not immediately initialize Git.
   - First complete the pre-package inventory.
   - Create a full local backup manifest and checksums.
   - Then initialize Git only if the workspace is clearly intended to become the Clarity repository.
   - Create a baseline commit containing only the preserved pre-integration state before reorganizing.
5. Generate SHA-256 checksums for all files before moving anything.
6. Record file counts, file types, total size, and top-level directory structure.
7. Ignore generated or dependency directories where appropriate:
   - `node_modules`
   - `.next`
   - `dist`
   - `build`
   - `.turbo`
   - coverage output
   - OS metadata
8. Do not remove ignored files during this task.

Create:

```text
docs/repository-audit/00_BASELINE_AND_SAFETY.md
docs/repository-audit/00_PRE_INTEGRATION_CHECKSUMS.sha256
```

The baseline report must include:

- workspace path
- Git status
- current branch
- remotes
- ignored directories
- file totals
- unresolved safety concerns
- whether a baseline commit was created

---

# Phase 1 — Inventory the pre-package workspace

Inventory all files that existed outside the newly added package directories.

For every relevant file, capture:

- current path
- filename
- extension
- size
- checksum
- likely purpose
- major headings or exported symbols
- whether it appears to be product, technical, governance, research, design, code, data, prompt, or archive material
- whether it appears current, duplicated, partial, superseded, or unknown
- whether it contains sensitive or potentially real patient information
- whether it conflicts with another file

Inspect, at minimum:

- root documents
- architecture notes
- product requirements
- user stories
- schemas
- code
- package manifests
- lockfiles
- configuration
- database files
- prompts
- diagrams
- test files
- synthetic data
- design exports
- prior developer handoffs
- roadmaps
- legal or clinical reference notes

Create:

```text
docs/repository-audit/01_PRE_PACKAGE_INVENTORY.md
docs/repository-audit/01_PRE_PACKAGE_FILE_MANIFEST.csv
```

Do not move anything yet.

---

# Phase 2 — Inspect the master package separately

Inspect the master package without integrating it.

Read the following first, when present:

```text
README.md
MASTER_ARCHITECTURE.md
REQUIREMENTS_TRACEABILITY.md
QUALITY_ASSURANCE_REPORT.md
16-developer-handoff/DEVELOPER_BRIEF.md
16-developer-handoff/MASTER_BUILD_PROMPT.md
16-developer-handoff/REPOSITORY_STRUCTURE.md
16-developer-handoff/FIRST_25_GITHUB_ISSUES.md
16-developer-handoff/HANDOFF_CHECKLIST.md
08-data-and-database/DATA_DICTIONARY.md
08-data-and-database/SCHEMA_COVERAGE_AND_VALIDATION.md
08-data-and-database/prisma/schema.prisma
08-data-and-database/prisma/schema.foundation.prisma
```

Then inventory the full package.

Confirm:

- package version
- file count
- directory structure
- checksum or manifest availability
- synthetic-case count
- schema files
- requirement identifiers
- diagrams
- agent specifications
- workflow documents
- benefits-verification content
- developer-handoff content
- known validation limitations

Verify rather than assume any package claim. For example, recount files and parse JSON rather than relying only on the QA report.

Create:

```text
docs/repository-audit/02_MASTER_PACKAGE_INVENTORY.md
docs/repository-audit/02_MASTER_PACKAGE_FILE_MANIFEST.csv
```

Preserve an immutable source copy at:

```text
reference/source-packages/clarity-ai-master-architecture-v0.2.0/
```

If only a ZIP exists, retain the original ZIP in:

```text
reference/source-packages/
```

and extract a read-only working copy beneath the versioned directory.

Do the same for the earlier database package if present:

```text
reference/source-packages/clarity-ai-database-artifact/
```

Add a prominent note that `reference/source-packages/` is historical source material and not the canonical implementation location.

---

# Phase 3 — Compare existing work with the package

Build a content-level integration matrix. Do not compare only by filename.

For each major domain, identify:

- preexisting artifact
- package artifact
- overlap
- material differences
- contradictions
- missing details
- recommended canonical source
- merge action
- disposition of originals
- confidence in the recommendation

Compare at least these domains:

1. Product vision
2. Product boundaries
3. User roles
4. Case workflow
5. Clinical intelligence
6. Medical necessity
7. Medical screening
8. Legal-status workflow
9. Benefits verification
10. Eligibility
11. Authorization
12. Patient financial education
13. Payer and plan memory
14. Payer analytics and ROI
15. Referral prioritization
16. Facility matching
17. Packet generation
18. Communications
19. Transportation and custody
20. Agent architecture
21. Prompt registry
22. Model gateway
23. Knowledge retrieval and citations
24. Rules engine
25. Database schema
26. API and services
27. UI requirements
28. Security
29. Privacy
30. Audit
31. Testing and evaluation
32. Commercial model
33. Roadmap
34. Developer handoff
35. Open decisions and risks

Create:

```text
docs/repository-audit/03_INTEGRATION_MATRIX.md
docs/repository-audit/03_CONFLICT_REGISTER.md
docs/repository-audit/03_GAP_ANALYSIS.md
```

Conflict classifications:

- `DIRECT_CONFLICT`
- `PARTIAL_OVERLAP`
- `PACKAGE_EXPANDS_EXISTING`
- `EXISTING_EXPANDS_PACKAGE`
- `DUPLICATE_EQUIVALENT`
- `SUPERSEDED`
- `UNRESOLVED`
- `NO_CONFLICT`

Do not silently choose one side for any direct conflict. Record the decision and rationale.

---

# Phase 4 — Determine the actual repository strategy

Inspect the existing technical stack before imposing the package’s recommended monorepo.

Identify:

- package manager
- Node version
- framework
- TypeScript configuration
- database tooling
- ORM
- test framework
- linting and formatting
- build system
- CI configuration
- deployment configuration
- existing app/package boundaries

Then choose one of these strategies:

## Strategy A — Existing implementation is already viable

Adapt the package to the current repository. Do not replace the stack merely to match the architecture documents.

## Strategy B — Existing repository is mostly documents

Create a clean TypeScript monorepo scaffold using:

- pnpm
- Turborepo
- TypeScript
- Prisma
- PostgreSQL
- Zod
- Vitest
- Playwright

Do not add live AI, payer, EHR, or cloud integrations.

## Strategy C — Existing implementation is incompatible or fragmented

Preserve it under:

```text
archive/pre-integration/
```

Document why it is archived, then create a new clean scaffold. Do not archive working code without explicit evidence and a written rationale.

Create:

```text
docs/repository-audit/04_REPOSITORY_STRATEGY.md
docs/architecture/ADR-0001-repository-and-integration-strategy.md
```

---

# Phase 5 — Organize the local repository

Use the following as a target structure, adapting it to the actual stack:

```text
Clarity Platform/
├── apps/
│   ├── web/
│   ├── api/
│   ├── worker/
│   ├── admin/
│   └── docs/
├── packages/
│   ├── ui/
│   ├── config/
│   ├── database/
│   ├── auth/
│   ├── audit/
│   ├── case-domain/
│   ├── document-domain/
│   ├── evidence-domain/
│   ├── workflow-domain/
│   ├── rules-engine/
│   ├── ai-orchestrator/
│   ├── model-gateway/
│   ├── prompt-registry/
│   ├── retrieval/
│   ├── clinical-intelligence/
│   ├── legal-status/
│   ├── medical-necessity/
│   ├── medical-screening/
│   ├── insurance-domain/
│   ├── eligibility-verification/
│   ├── benefits-verification/
│   ├── authorization-management/
│   ├── payer-intelligence/
│   ├── patient-financial-education/
│   ├── facility-intelligence/
│   ├── packet-builder/
│   ├── communications/
│   ├── custody-ledger/
│   ├── observability/
│   └── integrations/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── data/
│   ├── synthetic-cases/
│   ├── rule-sets/
│   ├── facility-profiles/
│   └── evaluation-cases/
├── docs/
│   ├── product/
│   ├── architecture/
│   ├── workflows/
│   ├── clinical/
│   ├── legal/
│   ├── payer-and-benefits/
│   ├── governance/
│   ├── security/
│   ├── api/
│   ├── ui/
│   ├── testing/
│   ├── roadmap/
│   ├── developer-handoff/
│   ├── repository-audit/
│   └── decisions/
├── governance/
│   ├── model-cards/
│   ├── prompt-approvals/
│   ├── rule-approvals/
│   ├── risk-register/
│   ├── change-control/
│   └── incident-response/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── workflow/
│   ├── security/
│   ├── evaluation/
│   └── regression/
├── scripts/
├── reference/
│   └── source-packages/
├── archive/
│   └── pre-integration/
├── .github/
│   ├── workflows/
│   ├── ISSUE_TEMPLATE/
│   └── pull_request_template.md
├── README.md
├── ARCHITECTURE.md
├── SECURITY.md
├── GOVERNANCE.md
├── CONTRIBUTING.md
└── IMPLEMENTATION_STATUS.md
```

Organization rules:

- Canonical implementation files must not live inside `reference/source-packages/`.
- Package source files may be copied, merged, or adapted into canonical locations only after comparison.
- Preserve source provenance in each integrated document’s front matter or header.
- Avoid two canonical files that describe the same system behavior.
- Use cross-links rather than duplicating long content.
- Use versioned ADRs for material architectural choices.
- Keep open questions visible.
- Keep superseded documents, but mark and relocate them.
- Do not leave unexplained files at the repository root.

---

# Phase 6 — Integrate the architecture documents

Create a canonical documentation map.

At minimum, establish:

```text
docs/product/PRODUCT_VISION.md
docs/product/PRODUCT_REQUIREMENTS.md
docs/architecture/SYSTEM_ARCHITECTURE.md
docs/workflows/CASE_WORKFLOW.md
docs/clinical/CLINICAL_INTELLIGENCE.md
docs/legal/LEGAL_STATUS_ARCHITECTURE.md
docs/payer-and-benefits/BENEFITS_VERIFICATION.md
docs/payer-and-benefits/AUTHORIZATION_MANAGEMENT.md
docs/payer-and-benefits/PAYER_INTELLIGENCE.md
docs/governance/HUMAN_APPROVAL_GATES.md
docs/governance/AI_GOVERNANCE.md
docs/security/SECURITY_AND_PRIVACY.md
docs/testing/EVALUATION_STRATEGY.md
docs/roadmap/IMPLEMENTATION_ROADMAP.md
docs/developer-handoff/DEVELOPER_BRIEF.md
docs/developer-handoff/MASTER_BUILD_PROMPT.md
docs/decisions/OPEN_DECISIONS.md
docs/decisions/RISK_REGISTER.md
```

Each canonical document must include:

- status
- owner placeholder
- version
- last integrated date
- source artifacts
- unresolved conflicts
- related requirements
- related ADRs

Do not flatten every package file into one enormous document. Preserve usable domain boundaries.

---

# Phase 7 — Integrate and validate the data artifacts

Select one canonical Prisma schema only after comparing:

- any preexisting schema
- `schema.prisma`
- `schema.foundation.prisma`
- the earlier database package schema

Place the proposed canonical schema at:

```text
prisma/schema.prisma
```

Before claiming it is valid:

1. Run `prisma format`.
2. Run `prisma validate`.
3. Run `prisma generate`.
4. If a local PostgreSQL development database is configured safely, generate an initial migration.
5. If no database is safely configured, use a schema-only validation path and document the missing requirement.
6. Do not fabricate a successful migration.
7. Do not include production credentials.
8. Do not use SQLite merely to bypass PostgreSQL-specific design choices without documenting the tradeoff.

Create:

```text
docs/repository-audit/05_SCHEMA_COMPARISON.md
docs/repository-audit/05_SCHEMA_VALIDATION_RESULTS.md
docs/architecture/ADR-0002-canonical-data-model.md
```

Integrate synthetic cases into:

```text
data/synthetic-cases/
```

Validate all JSON files. Confirm they contain no real patient information.

---

# Phase 8 — Scaffold implementation contracts, not full business logic

When the repository has no implementation yet, create only the initial contracts and safety-critical foundations:

- Zod schemas
- domain types
- repository interfaces
- case state-machine definitions
- parallel-workstream state definitions
- append-only audit helpers
- synthetic seed loader
- test harness
- feature flags

Do not build open-ended agents, live external integrations, or autonomous decision logic.

Required feature flags:

```text
benefits_verification
payer_memory
authorization_management
patient_financial_education
referral_prioritization
contract_rate_intelligence
```

Ensure the following remain separate:

- clinical urgency
- operational readiness
- placement readiness
- financial readiness

---

# Phase 9 — Tests and validation

Run all available checks appropriate to the repository:

- formatting
- linting
- TypeScript type check
- unit tests
- integration tests
- workflow tests
- security tests
- JSON parsing
- Markdown link checks
- Prisma format and validation
- package-manager integrity
- Git diff review

Add baseline tests for:

1. Case creation
2. Valid and invalid state transitions
3. Parallel workstream updates
4. Append-only audit events
5. Organization isolation
6. Insurance extraction review requirement
7. Subscriber relationship requirements
8. Eligibility status changes
9. Benefits disclaimer enforcement
10. Authorization transitions
11. Emergency clinical review proceeding when financial readiness is blocked
12. Payer memory labeled as historical and unconfirmed
13. No opaque combined referral score
14. Synthetic seed loading
15. No sensitive insurance identifiers written to audit logs

Do not report a check as passed unless it actually ran and passed.

---

# Phase 10 — Final integration outputs

Create or update:

```text
README.md
ARCHITECTURE.md
SECURITY.md
GOVERNANCE.md
CONTRIBUTING.md
IMPLEMENTATION_STATUS.md
```

Also create:

```text
docs/repository-audit/06_FILE_MOVE_MAP.md
docs/repository-audit/06_INTEGRATION_DECISIONS.md
docs/repository-audit/06_UNRESOLVED_QUESTIONS.md
docs/repository-audit/06_POST_INTEGRATION_REPOSITORY_MAP.md
docs/repository-audit/06_VALIDATION_SUMMARY.md
```

The file move map must list:

- original path
- final path
- action
- reason
- whether content changed
- source package or preexisting origin
- Git commit containing the move

The implementation status must separate:

- completed
- scaffolded
- documented only
- blocked
- not started
- requires clinical review
- requires legal review
- requires security review
- requires developer decision

---

# Git and commit strategy

Use small local commits. Suggested sequence:

1. `chore: capture pre-integration baseline`
2. `docs: add repository audit and package inventory`
3. `docs: add integration matrix and architecture decisions`
4. `chore: organize repository structure`
5. `docs: integrate canonical Clarity architecture`
6. `feat: add canonical data schema and synthetic cases`
7. `feat: scaffold domain contracts and state machines`
8. `test: add safety and workflow baselines`
9. `docs: add final integration report`

Do not push.

Do not squash away the audit trail.

---

# Final response format

At completion, report:

## Repository status
- resolved path
- branch
- commits created
- whether a remote exists
- whether anything was pushed

## Preexisting materials found
- major artifacts
- code stack
- important prior decisions
- sensitive-content concerns

## Package review
- version
- major contents
- validation performed
- package limitations

## Integration decisions
- what became canonical
- what was merged
- what was archived
- what remains unresolved

## Repository organization
- final top-level structure
- key canonical documents
- source-package location

## Technical validation
- commands run
- passes
- failures
- skipped checks and exact reasons

## Risks and open decisions
- architecture
- clinical
- legal
- privacy
- payer
- implementation

## Next recommended action
Provide one concrete next development issue.

## Honesty requirement
Do not claim that:
- the application is production-ready
- the Prisma schema is valid unless validation passed
- migrations exist unless they were generated
- tests passed unless they ran
- clinical or legal rules are approved
- payer integrations work
- patient data protections are complete

Begin now by locating the workspace and completing Phase 0. Do not reorganize any file until the pre-package inventory is complete.
