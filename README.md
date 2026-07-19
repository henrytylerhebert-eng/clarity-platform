# Clarity Platform

Behavioral-health **case intelligence and access orchestration** for the messy operational space between crisis referral and care transition.

This repository contains the Clarity architecture, domain contracts, backend service foundations, and a working local prototype. It is **not a deployed clinical system**. The prototype uses synthetic data only.

## What Clarity is

Clarity helps qualified behavioral-health professionals turn fragmented referrals, assessments, legal documents, payer information, facility criteria, and operational communications into structured, source-linked, human-reviewed workflows:

> referral -> intake -> evidence -> parallel clinical/legal/benefits workstreams -> packet -> routing -> custody -> audit

The first product wedge is a crisis-intake and access workflow: guided intake, review-gated medical-necessity and legal drafts, referral packet generation, simulated facility response, custody ledger, role-aware command center, milieu-aware bedboard demo, and role-specific onboarding/SOP training.

## The problem it solves

Behavioral-health crisis access is often slowed down by operational fragmentation:

- Referral stories get retold across calls, notes, PDFs, spreadsheets, and facility handoffs.
- Clinical, legal, financial, routing, and placement work often move in parallel without a shared case spine.
- Missing collateral, unsupported risk claims, payer gaps, and legal-clock uncertainty are hard to see early.
- Packet quality and facility responses are difficult to audit after the fact.
- Leaders often lack a live operational picture of cases, bottlenecks, readiness, and custody.

Clarity exists to make the source, uncertainty, rule, owner, deadline, and history behind each material action visible. It does **not** replace professional judgment; it creates a structured environment where qualified people can review, approve, correct, and audit the work.

## Who it is for

Clarity is being shaped for:

- Crisis and central-intake teams that coordinate referrals and handoffs.
- Field responders who need fast, structured capture without retyping the story later.
- Clinician reviewers who need source-linked risk and medical-necessity drafts.
- UR / benefits specialists who need a parallel financial lane that does not block emergency clinical review.
- Receiving facilities that need clear packets and structured response reasons.
- Charge nurses and inpatient leaders who need placement context beyond simple bed availability.
- Compliance/legal reviewers who need draft status, counsel-validation gates, and custody/audit history.
- Program directors who need a credible command-center view before investing in production integrations.

## What the prototype demonstrates

The local app in `app/` demonstrates a synthetic proof-of-concept workflow:

1. Create or select a crisis referral.
2. Capture structured guided intake facts.
3. Add source-linked risk findings.
4. Review draft medical-necessity support and missing facts.
5. Review legal-status draft scaffolding with counsel warnings.
6. Generate a referral packet preview without retyping the story.
7. Simulate facility routing and response.
8. Verify material custody events through a hash-chained ledger.
9. Review command-center status by stakeholder role.
10. Review onboarding, SOP checklists, competency evidence, and PEC chain-of-custody practice per position.
11. Discuss roadmap priority through a POC feature map and feedback board.

The Command Center now includes a stakeholder-facing explanation of each tool: what it does, what problem it solves, who it serves, and the correlated workflow. The Training & SOPs workspace turns detailed SOP context into role-specific synthetic practice while keeping clinical and legal review requirements explicit.

## What this is not

- Not a production clinical, legal, admission, discharge, placement, authorization, or payer-decision system.
- Not a substitute for clinician, counsel, UR, receiving-facility, or charge-nurse judgment.
- Not a PHI-ready deployment.
- Not connected to EHR, CAD/RMS, payer, facility, bedboard, or messaging systems.
- Not a claim that transfer speed, acceptance rates, documentation quality, or outcomes have improved.

Where no measurement exists, the project says `No measurements found`. Where a claim needs review, it remains `Unknown`, `requires clinical review`, or `requires legal review`.

## Repository map

| Path | What it is |
|---|---|
| `app/` | Working prototype (Vite + React + TS): guided intake, medical-necessity/legal drafts, command center, stakeholder feature map, hash-chained custody ledger, packet builder, simulated routing, bedboard, Training & SOPs. `cd app && npm run dev` |
| `packages/domain-contracts/` | Domain types, Zod schemas, state machines, audit helper, feature flags — contracts only |
| `packages/*-service/` | Backend service foundations for case, document, evidence, benefits, authorization, and authentication workflows |
| `prisma/` | Canonical foundation schema (validated; initial migration generated) — ADR-0002 |
| `data/synthetic-cases/` | Validated synthetic fixtures (3 of a planned 10) |
| `data/mock-use-cohorts/` | Separated mock-use training cohorts; not canonical app seed data |
| `docs/` | Canonical documentation: `product/`, `architecture/` (incl. ADRs), `workflows/`, `discovery/`, `clinical/`, `legal/`, `payer-and-benefits/`, `governance/`, `security/`, `testing/`, `roadmap/`, `developer-handoff/`, `decisions/` |
| `docs/mock-use/` | Fictitious chart/UR training reports for stakeholder walkthroughs |
| `docs/00–09*.md` | Historical Jul 8 crisis-platform docs (preserved; see path-migration note in `00-architecture-index.md`) |
| `docs/repository-audit/` | Full integration audit trail: inventories, integration matrix, conflict register, gap analysis, schema validation, file move map |
| `reporting-metrics-rebuild-package/` | Reporting-metrics reverse-engineering analysis (metrics substrate) |
| `reference/source-packages/` | **Immutable** source packages (master architecture v0.2.0 partial, database artifact, Jul 8 package) — never edit, never treat as canonical |
| `reference/source-documents/` | Original research/source materials |
| `scripts/`, `tests/` | Seed script (contract-level) and safety/workflow baseline tests |

## Start here

For potential customers or POC reviewers:

- Open the shareable GitHub Pages artifact: `https://henrytylerhebert-eng.github.io/clarity-platform/`
- Read `docs/roadmap/POC_STAKEHOLDER_FEEDBACK_ROADMAP.md`.
- Run the local prototype and open **Command Center**.
- Open **Training & SOPs** to review onboarding paths and SOP practice by position.
- Use the feature map to mark each feature as must-have, helpful, confusing, missing, or later.

For developers:

- For human-supervised multi-agent work, start with agents/bridge/PROJECT_CONFIGURATION.md and agents/bridge/PROTOCOL.md.
- For a new workflow or requirements-acquisition session, start with [docs/discovery/README.md](docs/discovery/README.md); it is documentation-only and does not authorize implementation.
- Read `IMPLEMENTATION_STATUS.md` for what is complete, scaffolded, documented-only, blocked, and next.
- Read `docs/roadmap/IMPLEMENTATION_ROADMAP.md` for the platform sequence.
- Use `docs/developer-handoff/COMMAND_CENTER_MVP_PROMPT.md` for the next command-center/product-surface iteration.
- Keep source packages under `reference/` immutable.

## Quick start

```bash
npm install            # root workspace (app + packages)
npm test               # root safety/workflow suites (vitest)
cd app && npm test     # prototype domain tests
cd app && npm run dev  # http://127.0.0.1:5173
npx prisma validate    # canonical schema
npm run bridge:status  # local three-agent bridge capabilities and inboxes
npm run bridge:test    # bridge lifecycle and credential-guard checks
```

Useful app checks:

```bash
cd app
npm run build
npm run smoke
npm audit --omit=dev
```

## Ground rules

- **Synthetic data only.** No real PHI/PII anywhere, ever, until formal security review (`SECURITY.md`).
- **Human gates stay intact.** No autonomous clinical, legal, admission, placement, or authorization decisions (`GOVERNANCE.md`).
- **Evidence gates status.** Output is not evidence; speed is not progress; automation is not understanding; polish is not trust. Use `docs/governance/PRODUCT_EVIDENCE_AND_DECISION_PROTOCOL.md` before promoting product, release, measurement, or implementation claims.
- **Benefits quotes are not payment guarantees; payer memory is historical and unconfirmed; financial readiness never blocks emergency clinical review.** These are tested invariants, not slogans.
- The master architecture package is only **partially present** (15 of 87 files) — see `docs/repository-audit/02_MASTER_PACKAGE_INVENTORY.md` and open decision OD-1.

## Status

Current prototype status:

- Local app: guided intake, command center, role scoping, Training & SOPs, packet generation, simulated routing, custody ledger, and bedboard are implemented with synthetic data.
- Backend foundations: case, document, evidence, benefits, authorization, and authentication services are in place as repository/service layers, not as a deployed API product.
- Production deployment: not started.
- Live integrations: not started.
- Clinical/legal/payer validation: required before any real-world use.

See `IMPLEMENTATION_STATUS.md` for the honest breakdown (completed / scaffolded / documented-only / blocked) and `docs/decisions/OPEN_DECISIONS.md` for what needs a human decision.
