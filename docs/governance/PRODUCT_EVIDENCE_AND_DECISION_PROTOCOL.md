---
status: Integrated draft
owner: Product owner (Tyler) + compliance/technical reviewers
version: 1.0.0
last_integrated: 2026-07-18
source_artifacts:
  - README.md
  - GOVERNANCE.md
  - IMPLEMENTATION_STATUS.md
  - docs/05-source-document-index.md
  - docs/governance/AI_GOVERNANCE.md
  - docs/governance/HUMAN_APPROVAL_GATES.md
  - docs/architecture/ADR-0008-evidence-repository-and-human-review.md
  - docs/product/PRODUCT_VISION.md
  - docs/workflows/CASE_WORKFLOW.md
  - docs/decisions/OPEN_DECISIONS.md
  - docs/decisions/RISK_REGISTER.md
  - docs/product-studio/02-product-studio-product-definition.md
unresolved_conflicts: none
related_adrs: ADR-0001, ADR-0003, ADR-0008, ADR-0011, ADR-0012
---

# Product Evidence and Decision Protocol

## Operating Doctrine

This protocol governs product claims, status changes, roadmap movement, Product Studio evidence display, and Codex handoffs.

The repository already contains canonical records for architecture, ADRs, status, risks, roadmap, source handling, and human approval gates. This document does not replace them. It defines the rules for moving a claim or feature between those records.

Core doctrine:

- Output is not evidence.
- Speed is not progress.
- Automation is not understanding.
- Polish is not trust.

Clarity supports qualified professionals. It does not autonomously make clinical, legal, admission, discharge, placement, authorization, payer, or external-action decisions.

## Clarity Fit

This protocol is specific to Clarity's operating model:

- One case spine: referral -> intake -> source-linked evidence -> parallel clinical/legal/benefits/authorization/placement workstreams -> packet -> routing -> custody -> audit.
- Evidence before assertion: source facts, normalized interpretations, contradictions, and missing information stay distinct.
- Parallel readiness: clinical urgency, legal readiness, medical screening, benefits, authorization, placement, transport, and patient education move independently; no opaque combined score.
- Human finality: clinicians, counsel, UR/revenue-cycle, operations, security, technical owners, and Tyler/product owner make the domain decisions.
- Synthetic boundary: prototype and demo surfaces use synthetic data only unless formal security/privacy approval changes that boundary.
- Product Studio boundary: Studio may show status and evidence, but the local prototype is not a release console, flag console, public roadmap publisher, or production source of truth.

## Canonical Records

Use existing records as the authority for each domain. Do not copy their tables into this protocol.

| Need | Canonical record |
|---|---|
| Implemented, scaffolded, documented-only, blocked, not-started status | `IMPLEMENTATION_STATUS.md` |
| Architecture decisions | `docs/architecture/ADR-*.md` |
| Open owner/security/architecture decisions | `docs/decisions/OPEN_DECISIONS.md` |
| Product and safety risks | `docs/decisions/RISK_REGISTER.md` |
| Source document handling and claim labels | `docs/05-source-document-index.md` |
| Human approval gates | `docs/governance/HUMAN_APPROVAL_GATES.md` |
| AI and agent boundaries | `docs/governance/AI_GOVERNANCE.md` |
| Roadmap sequence and parking lot | `docs/roadmap/IMPLEMENTATION_ROADMAP.md` and `docs/04-build-roadmap.md` |
| Test and evaluation posture | `docs/testing/EVALUATION_STRATEGY.md` |
| Product Studio scope | `docs/product-studio/` |
| Agent/Codex execution handoff | `AGENTS.md`, `docs/AGENTS_TEMPLATE.md`, `docs/developer-handoff/DEVELOPER_BRIEF.md` |
| Security/privacy rules and required controls | `SECURITY.md`, `docs/security/SECURITY_AND_PRIVACY.md` |

When canonical records disagree, use the most specific current implementation/status record for implementation truth, record the conflict, and do not promote status until the conflict is resolved. For current capability status, `IMPLEMENTATION_STATUS.md` governs over older prose summaries.

## Clarity Evidence Spine

Every feature or claim should identify where it attaches to the Clarity spine:

| Spine point | Evidence question |
|---|---|
| Referral/case creation | What case fact, source, owner, and tenant boundary are being created or changed? |
| Intake/assessment | Which facts are observed, which are inferred, and which need clinical review? |
| Source document/evidence | Which exact source/version supports the claim, and is the evidence `CANDIDATE`, `APPROVED`, `REJECTED`, `NEEDS_CLARIFICATION`, or `SUPERSEDED` under ADR-0008? |
| Clinical/legal/benefits/authorization lanes | Which lane is allowed to proceed, which is blocked, and which human authority owns the block? |
| Packet/routing/custody | Which reviewed packet/version, facility response, transmission event, or custody event is being referenced? |
| Audit/history | What audit event, decision record, or verification artifact preserves why the action happened? |
| Learning/measurement | What baseline or result measurement exists? If none, say `No measurements found`. |

If a feature does not attach to the case spine, roadmap, governance, or Product Studio projection, treat it as a candidate or parking-lot item until Tyler/product owner approves its product role.

## Claim Classifications

Every material product, implementation, safety, performance, clinical, legal, security, or release claim must carry one of these labels when the evidence is not obvious from the surrounding canonical record.

| Label | Meaning | Minimum support |
|---|---|---|
| `verified` | Confirmed in the live repository during the current work session. | File inspection plus a relevant passing command, test, build, schema check, or manual verification note. |
| `implemented` | Code exists in the verified implementation surface. | Repository path plus current inspection; status still needs test evidence before "verified working." |
| `scaffolded` | Contract, type, schema, route, or placeholder exists without full runtime behavior. | Path plus stated missing runtime. |
| `documented-only` | Described in canonical docs but not implemented. | Canonical doc path. |
| `source-confirmed` | Directly supported by available local source material. | Source path and section/summary. |
| `summary-derived` | Carried from a synthesis, generated summary, or secondary artifact. | Source path plus note that it was not independently verified. |
| `inference` | Reasoned interpretation from confirmed evidence. | Evidence plus the inference stated separately. |
| `unverified` | Plausible or previously reported, but not checked in this session. | Reason it remains unchecked. |
| `unknown` | Repository/source evidence is insufficient. | State the gap and fastest path to resolve. |
| `No measurements found` | No baseline/result metric exists in the repository. | Search or source check showing no measurement artifact. |
| `requires clinical review` | Clinical content, safety, level-of-care, criteria, diagnosis, or assessment policy needs qualified review. | Clinical owner required before promotion. |
| `requires legal review` | Statutory, consent, hold, form, custody, EMTALA, retention, e-signature, or admissibility claim needs counsel. | Legal owner required before promotion. |
| `requires security review` | Auth, PHI/PII, tenancy, secrets, audit, storage, deployment, integration, logging, or data export concern needs security review. | Security owner required before promotion. |
| `requires operational review` | Workflow, staffing, handoff, transport, bed management, facility response, or training practice needs operational validation. | Operational owner required before promotion. |
| `requires technical decision` | Architecture, hosting, data model, integration, API, CI/toolchain, or release boundary needs an ADR or tech-lead decision. | ADR/open-decision record required before build. |

## Clarity Claim Review Matrix

Use the domain matrix below before promoting a Clarity claim.

| Claim type | Valid evidence | Cannot be claimed from |
|---|---|---|
| Product value or ROI | Baseline/result measurement artifact, pilot review, product-owner decision | Demo polish, stakeholder enthusiasm, elapsed build time |
| Clinical usefulness | Qualified clinical review, approved evaluation, source-linked evidence review | AI summary, seed scenario, UI copy, non-clinician inference |
| Legal/status correctness | Counsel-approved rule pack, official form/source verification, legal decision record | Demo legal-clock behavior, generated statutory summary, unreviewed source packet |
| Evidence quality | ADR-0008 evidence status, exact source version, contradiction review, reviewer action | Extracted text, narrative summary, candidate evidence |
| Payer/authorization readiness | Approved insurance evidence, human verification, UR/revenue-cycle review, tested transition | Medical-necessity draft alone, benefits quote without disclaimer, payer memory |
| Placement readiness | Charge-nurse/operations review, documented override reason, operational policy | Bedboard heuristic, availability display, combined priority score |
| Security/privacy readiness | Security review, tenant/auth tests, redacted logging/audit proof, deployment controls | Existence of auth service, local demo role selector, docs-only control list |
| Production/API readiness | Accepted ADR, owner decision, route tests, hosting/migration/rollback evidence | `node:http` spike alone, local dev server, GitHub Pages docs publication |
| Product Studio readiness | Server-owned projection, verified principal policy, audit/denial tests | Static component data, localStorage, hidden navigation |

## Status Change Evidence

No capability may move to a stronger status without evidence in the canonical record.

| Proposed move | Required evidence |
|---|---|
| Parking lot -> candidate | Problem statement, affected users, non-goals, risks, dependency check, product-owner approval. |
| Candidate -> planned | Feature brief, claim labels, impacted canonical records, dependencies, test strategy, risk update, approval owner. |
| Planned -> build-ready | Acceptance criteria, ADR/open-decision checks, data boundary, security/privacy review if applicable, synthetic-data plan. |
| Build-ready -> implemented | Code paths, tests or manual verification, docs updated, no unresolved owner/security/architecture blocker. |
| Implemented -> verified working | Focused tests pass, relevant lint/type/schema/build checks pass or are explicitly `[Unverified]`, screenshots/manual smoke evidence where UI behavior matters. |
| Verified working -> release candidate | Release-readiness packet, rollback plan, security/privacy review where applicable, clinical/legal/operational gates completed where applicable. |
| Release candidate -> released | Approved deployment/release record, version, audience, feature flags, migration state, monitoring/rollback evidence. |
| Released -> measured | Baseline and post-release measurement artifact with collection method; otherwise say `No measurements found`. |
| Any status -> blocked | Blocking decision, owner, risk, dependency, and next action recorded in the proper canonical record. |

Evidence can be a test run, build output, schema validation, ADR, approved review note, source citation, screenshot/manual verification, measurement artifact, or audited decision record. A generated document, polished UI, or agent summary is an artifact until verified against one of those evidence types.

## Clarity Capability Buckets

When updating `IMPLEMENTATION_STATUS.md`, use these buckets consistently:

| Bucket | Clarity meaning |
|---|---|
| Completed (verified working) | Implemented in `app/`, `packages/*`, `prisma/`, or `tests/` and verified with current commands or clearly labeled historical evidence. |
| Scaffolded | Contracts, state machines, adapters, schemas, route shells, or UI shells exist, but the user-facing or runtime loop is incomplete. |
| Documented only | Canonical docs describe the capability, but no runtime implementation exists. |
| Blocked | A named owner, legal, clinical, security, operational, architecture, source, or measurement decision blocks progress. |
| Not started | No implementation work has begun beyond source/context material. |
| Requires review | Domain content exists but cannot be promoted without the named qualified reviewer. |

Do not use "built," "done," "ready," "released," or "production" without mapping the claim to one of these buckets and naming the evidence.

## Human-Owned Decision Points

Humans own every material decision. Automation may draft, organize, compare, flag, and prepare review packets.

| Decision area | Approval authority | System boundary |
|---|---|---|
| Product priority, roadmap movement, public promise, pilot readiness | Tyler/product owner | May recommend and summarize evidence; may not commit scope or publish promises autonomously. |
| Clinical assessment, risk, medical necessity, level of care, safety language | Qualified clinical reviewer/physician reviewer | May draft and surface gaps; may not make determinations. |
| Legal status, OPC/PEC/CEC, clocks, forms, custody authority, consent, EMTALA | Counsel/legal reviewer | May display configured warnings; may not declare validity or enforce statutory truth without counsel-approved rule pack. |
| Security, privacy, PHI/PII, tenancy, auth, secrets, logging, data export, deployment exposure | Security/privacy reviewer | May identify gaps; may not approve production data use or deployment exposure. |
| Operational workflow, staffing, handoff, facility response, bed placement practice, training adoption | Operational owner | May surface blockers; may not assign placement or operational policy. |
| Architecture, API, persistence, integration, CI/toolchain, release boundary | Technical lead/architecture owner | May prototype behind explicit labels; material changes require ADR/open-decision update. |
| Authorization, benefits, payer communication, financial education | UR/revenue-cycle owner | May prepare readiness views; may not submit to payer or promise payment. |

Approvals are domain-scoped. One approval does not transfer across domains: product approval does not create legal approval, clinical approval does not create security approval, and technical implementation does not create release approval.

## Feature Stage Gates

Use this stage sequence for feature briefs, Product Studio records, roadmap moves, and Codex handoffs:

`Observe -> Capture -> Map -> Evaluate -> Decide -> Design -> Build -> Validate -> Release -> Measure -> Learn`

Gate requirements:

- `Observe`: separate observed facts from interpretation.
- `Capture`: record sources, affected users, assumptions, and unknowns.
- `Map`: identify workflow location, data model touchpoints, owners, risks, dependencies, ADRs, tests, metrics, and parking-lot links.
- `Evaluate`: state supporting evidence, contradicting evidence, missing evidence, and safety implications.
- `Decide`: record the human owner, decision, rationale, alternatives, and dissent or uncertainty.
- `Design`: define review gates, non-goals, states, permissions, and failure modes.
- `Build`: preserve synthetic-only boundaries unless formal approval exists; keep implementation scope narrow.
- `Validate`: run focused tests/checks and document what remains `[Unverified]`.
- `Release`: require release-readiness evidence before any production or public claim.
- `Measure`: attach baseline and result metrics, or say `No measurements found`.
- `Learn`: update decisions, risks, roadmap, and parking lot without rewriting history.

## Release-Readiness Evidence

A Clarity release-readiness packet must include:

- What changed and the exact files/areas affected.
- Which case-spine point or Product Studio projection the change affects.
- What evidence ran: tests, lint, typecheck, build, schema, smoke/manual checks, accessibility/security checks where applicable.
- What did not run and why.
- Human approvals required and obtained.
- Risks updated or accepted.
- Dependencies and open decisions checked.
- Data boundary: synthetic only, approved pilot data, or production data.
- Deployment/release boundary: local demo, docs artifact, preview, production deployment, or external integration.
- Domain boundary: clinical, legal, benefits/authorization, placement, security, or operations.
- Audit boundary: whether a material mutation creates or needs an append-only audit event.
- Rollback or disable path.
- Metrics baseline/result status, with `No measurements found` when absent.
- Known follow-up work and owner.

GitHub Pages or other static documentation publication is not application deployment evidence unless the release packet explicitly proves that deployment surface.

## Product Studio Rules

Product Studio may display evidence status. It must not become the canonical mutation or release-control surface until the required server-owned registry, authorization, audit, tenancy, and release decisions are implemented and verified.

Product Studio should display:

- Lifecycle stage and whether the stage is `verified`, `unverified`, `blocked`, or `parked`.
- Evidence links back to canonical records, not duplicated long-form evidence.
- Missing evidence and `No measurements found` states.
- Required approval authority and current gate state.
- Risk, dependency, ADR, test, metric, and parking-lot links.
- Whether a record is synthetic prototype data, server-owned internal product state, sanitized advisor view, or public projection.
- Case-spine placement when the concept affects a workflow lane.
- The next human decision packet, not just the next build task.

Product Studio must not:

- Mutate roadmap, release, feature-flag, deployment, clinical, legal, authorization, placement, or security state from the local prototype.
- Treat localStorage/static component data as canonical product state.
- Publish roadmap content or expose security detail without explicit publication policy.
- Hide the difference between feedback volume, evidence quality, and human decision.

The first production Product Studio server projection should be read-only. Mutation commands for roadmap, flags, release approval, publication, or deployment require separate ADR/open-decision coverage and denial tests.

## Codex Rules

Codex should distinguish artifacts from evidence:

- A document is an artifact until tied to sources, owner approval, or verification.
- A test claim is evidence only when the command actually ran and passed in the current session or is clearly labeled historical.
- A screenshot/manual observation is evidence for display state only, not backend authority.
- A prototype proves interaction intent, not production auth, tenancy, data durability, deployment, or clinical/legal correctness.
- A generated summary may guide inspection, but it is not canonical truth.
- Performance, adoption, transfer-speed, acceptance-rate, packet-quality, or outcome claims require measurement artifacts; otherwise report `No measurements found`.
- A service foundation proves a controlled command path only for the commands tested; it does not prove full API, hosting, tenancy, release, or PHI readiness.
- A role-scoped demo UI proves display intent only; hidden routes or role selectors are not security controls.

Before changing status, Codex must check the relevant canonical records and either update the proper record or state why the status remains `[Unverified]`, `Unknown`, blocked, or parked.

## Anti-Duplication Rules

- Do not create a second implementation-status table. Update `IMPLEMENTATION_STATUS.md`.
- Do not create a second risk register. Update `docs/decisions/RISK_REGISTER.md`.
- Do not create a second open-decision list. Update `docs/decisions/OPEN_DECISIONS.md`.
- Do not create a second roadmap or parking lot. Update `docs/roadmap/IMPLEMENTATION_ROADMAP.md` or `docs/04-build-roadmap.md`.
- Do not copy source-document summaries into product truth. Link to `docs/05-source-document-index.md` and preserve claim labels.
- Do not create an ADR inside a feature brief. Create or update `docs/architecture/ADR-*.md`.
- Do not treat Product Studio as the source of truth until a server-owned registry ADR and implementation exist.
- When a new artifact overlaps an existing canonical record, add a short pointer to the canonical record instead of duplicating the content.

## Stop Conditions

Stop and request/record a decision before proceeding when:

- The change would make or imply a clinical, legal, admission, discharge, placement, authorization, or payer decision.
- Real PHI/PII or production data would be used without formal approval.
- A release/deployment/publication claim lacks evidence.
- A proposed Product Studio mutation depends on unresolved auth, tenancy, audit, feature-flag, or release-control architecture.
- A status promotion conflicts with `IMPLEMENTATION_STATUS.md`, an ADR, an open decision, a risk, or the source index.
- A security, owner, legal, clinical, operational, or architecture approval is required and not recorded.
