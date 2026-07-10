# 03 — Integration Matrix

**Date:** 2026-07-10
**Method:** content-level comparison (headings, models, purposes — not filenames). Pre-package = Jul 8 "Clarity Crisis Platform / Clarity MH" generation. Package = Jul 10 "Clarity AI" master architecture v0.2.0 (**partial**: only `MASTER_ARCHITECTURE.md` summary sections + developer-handoff + data files are locally present; domain deep-dive specs are missing, so several rows are graded on the summary alone).

Classifications: `DIRECT_CONFLICT`, `PARTIAL_OVERLAP`, `PACKAGE_EXPANDS_EXISTING`, `EXISTING_EXPANDS_PACKAGE`, `DUPLICATE_EQUIVALENT`, `SUPERSEDED`, `UNRESOLVED`, `NO_CONFLICT`.

| # | Domain | Preexisting artifact(s) | Package artifact(s) present locally | Classification | Canonical source going forward | Confidence |
|---|--------|------------------------|--------------------------------------|----------------|-------------------------------|------------|
| 1 | Product vision | `README.md`, `docs/01` §1, `clarity-mh…/00-product-thesis.md` — crisis intake/custody/transfer, Louisiana-first | `MASTER_ARCHITECTURE.md` §1–4, `README copy.md` — case intelligence + access orchestration, payer-agnostic | PARTIAL_OVERLAP (see CONFLICT C-1) | New `docs/product/PRODUCT_VISION.md` merging both, master framing on top, crisis-intake scope preserved as the launch wedge | Medium |
| 2 | Product boundaries | app README guardrails; `docs/01` §13 MVP boundary | `MASTER_ARCHITECTURE.md` §1, §22; `README copy.md` limitations | NO_CONFLICT (both prohibit autonomous clinical/legal decisions, real PHI) | Merged into PRODUCT_VISION + GOVERNANCE | High |
| 3 | User roles | `docs/09` — 8 personas, 5 implemented in `app/src/domain/roles.ts` | `MASTER_ARCHITECTURE.md` §5 workspace list; INTEGRATION_PLAN adds BENEFITS_VERIFICATION_SPECIALIST, AUTHORIZATION_SPECIALIST | PACKAGE_EXPANDS_EXISTING | `docs/09` remains persona canon; add the 2 payer-side roles | High |
| 4 | Case workflow | `docs/01` §4 workflows A–D; app workspaces | `MASTER_ARCHITECTURE.md` §6–7 spine + parallel workstreams | PACKAGE_EXPANDS_EXISTING (parallel workstreams generalize the linear intake pipeline) | New `docs/workflows/CASE_WORKFLOW.md` | High |
| 5 | Clinical intelligence | `clarity-mh…/workflows/clinical-intake-workflow.md`, assessment docs, app GuidedIntake/guardrails | §10 summary only (`03-clinical-intelligence/` spec **missing**) | EXISTING_EXPANDS_PACKAGE locally; package spec unknown | Existing docs + §10 summary; flag missing spec | Medium |
| 6 | Medical necessity | `clarity-mh…/prompts/medical-necessity-draft`, app MedicalNecessity workspace, guardrails | §10 bullet + REQ-013/014 | PARTIAL_OVERLAP | Existing prompt+workspace behavior, constrained by REQ-014 (no final admission decision) | Medium |
| 7 | Medical screening | — (not modeled pre-package) | §10, workstream status, foundation schema models | PACKAGE_EXPANDS_EXISTING | Package | High |
| 8 | Legal-status workflow | Deep: `docs/01` §7–8, legal instruments, PEC/OPC/CEC, compliance clocks, app LegalStatus + clocks.ts | §11 summary only (`04-legal-and-regulatory/` **missing**) | EXISTING_EXPANDS_PACKAGE | Existing Louisiana-specific docs; package §11 adds jurisdiction-ruleset abstraction | High |
| 9 | Benefits verification | — (UR/payer support named as persona only) | §12, INTEGRATION_PLAN, foundation schema (verification models), synthetic cases | PACKAGE_EXPANDS_EXISTING (net-new) | Package | High |
| 10 | Eligibility | — | §12, foundation schema | PACKAGE_EXPANDS_EXISTING | Package | High |
| 11 | Authorization | — | §14, foundation schema, INTEGRATION_PLAN sprint 6C | PACKAGE_EXPANDS_EXISTING | Package | High |
| 12 | Patient financial education | — | §15 | PACKAGE_EXPANDS_EXISTING | Package | High |
| 13 | Payer and plan memory | — | §13 ("historical and unconfirmed" rule) | PACKAGE_EXPANDS_EXISTING | Package | High |
| 14 | Payer analytics / ROI | `reporting-metrics-rebuild-package/` (deep, spreadsheet-derived) | §26 summary only (`14-commercial-model/` **missing**) | EXISTING_EXPANDS_PACKAGE | Existing rebuild package as the metrics substrate | Medium |
| 15 | Referral prioritization | app CaseQueue ordering; docs/06 Decision 4 (parallel lanes) | §8 emergency/fairness rule; REQ matrix | DUPLICATE_EQUIVALENT (same principle, independently stated) | Both; rule codified in GOVERNANCE | High |
| 16 | Facility matching | `clarity-mh…/workflows/request-broadcast-routing.md`, app RoutingResponse; bedboard rules | §16 facility profiles + fit categories (`06-placement-and-custody/` **missing**) | PARTIAL_OVERLAP (existing = broadcast routing; package = profile matching) | Merge in `docs/workflows/`; bedboard remains existing-only | Medium |
| 17 | Packet generation | app packets.ts + PacketPreview; `docs/01` one-capture/many-output | §17 versioned approved packet | DUPLICATE_EQUIVALENT | Existing implementation + §17 approval rule | High |
| 18 | Communications | request-broadcast docs (partial) | §17 channel list; drafts-vs-send rule | PACKAGE_EXPANDS_EXISTING | Package rule; existing routing detail | Medium |
| 19 | Transportation & custody | Deep: custody ledger (hash-chained, implemented + tested), EPEC lifecycle diagrams, custody workflow docs | §18 custody ledger summary (`06-placement-and-custody/` **missing**) | EXISTING_EXPANDS_PACKAGE | Existing implementation and docs | High |
| 20 | Agent architecture | 7 clinical prompts + AI/MCP layer doc | §19 agent catalog (18 agents) — `07-agent-architecture/` contracts **missing** | PARTIAL_OVERLAP; UNRESOLVED detail | §19 catalog as target; existing prompts as the only concrete contracts | Low |
| 21 | Prompt registry | `clarity-mh…/prompts/` (13 prompt files) | §19–20 governance summary | EXISTING_EXPANDS_PACKAGE (files) + PACKAGE_EXPANDS_EXISTING (governance) | Prompts move to governed `governance/prompt-approvals/` process; files stay canonical | Medium |
| 22 | Model gateway | — | §19–20, REPOSITORY_STRUCTURE `model-gateway` package | PACKAGE_EXPANDS_EXISTING | Package (documented only) | High |
| 23 | Knowledge retrieval & citations | source-provenance module doc | §20 retrieval properties | PACKAGE_EXPANDS_EXISTING | Package | Medium |
| 24 | Rules engine | pitfall guards implemented (`guardrails.ts`) + clocks | §20 deterministic rules | DUPLICATE_EQUIVALENT in principle | Existing implementation; package naming | High |
| 25 | Database schema | `clarity-mh…/schema/prisma.schema.prisma` (Jul 8); `SCHEMA_BLUEPRINT.sql` (reporting) | `schema.foundation.prisma` (=db artifact, 25 models); `schema(1) (1).prisma` expanded draft (43 models); dictionaries | DIRECT_CONFLICT (C-3) | Foundation schema proposed canonical — see `05_SCHEMA_COMPARISON.md` and ADR-0002 | High |
| 26 | API & services | — | `11-api-and-services/` **missing**; REPOSITORY_STRUCTURE only | UNRESOLVED (no local content) | Unknown — gap | — |
| 27 | UI requirements | Deep: `docs/09` + 11 implemented workspaces | §23 UI musts (`12-ui-and-experience/` **missing**) | EXISTING_EXPANDS_PACKAGE | Existing app + §23 rules | High |
| 28 | Security | `clarity-mh…/compliance/rbac-audit-custody.md`; supabase-rls.sql | §22 control list (`10-security-and-governance/` **missing**) | PARTIAL_OVERLAP | New SECURITY.md merging both | Medium |
| 29 | Privacy | app demo-data rule; compliance docs | §22; package README limitations | NO_CONFLICT | SECURITY.md | High |
| 30 | Audit | Implemented hash ledger + tests; rbac-audit doc | §9, AUDIT_RULES.md (db artifact), REQ audit events | PACKAGE_EXPANDS_EXISTING (event taxonomy) + EXISTING_EXPANDS_PACKAGE (hash chain implementation) | Both, merged in GOVERNANCE + AUDIT_RULES | High |
| 31 | Testing & evaluation | Vitest unit + Playwright smoke (implemented); acceptance-tests.md | §24 evaluation strategy (`13-testing-and-evaluation/` **missing**) | PARTIAL_OVERLAP | Existing tests + §24 target list | Medium |
| 32 | Commercial model | competitive-landscape-epec.md | §26 tiers/ROI (`14-commercial-model/` **missing**) | PARTIAL_OVERLAP; hypotheses only | Both, labeled hypotheses | Low |
| 33 | Roadmap | `docs/04` (v0.1→v0.3 + parking lot) | §25 15-step sequence; FIRST_25_GITHUB_ISSUES; REQ sprint column | DIRECT_CONFLICT (C-2: different sequencing assumptions) | New `docs/roadmap/IMPLEMENTATION_ROADMAP.md` reconciling both | Medium |
| 34 | Developer handoff | `docs/02-claude-code-handoff.md`; CODEX prompts | DEVELOPER_BRIEF, MASTER_BUILD_PROMPT, REPOSITORY_STRUCTURE, HANDOFF_CHECKLIST, FIRST_25_GITHUB_ISSUES | SUPERSEDED (Jul 8 handoffs are for the crisis-prototype build, which happened) | Package handoff set | High |
| 35 | Open decisions & risks | docs/06 findings + unknowns; README evidence status | `18-open-decisions-and-risks/` **missing** | UNRESOLVED (package side absent) | New `docs/decisions/OPEN_DECISIONS.md` seeded from docs/06 + this audit | High |

## Reading the matrix

- Rows 9–13 (the payer/benefits stack) are the package's genuinely new contribution — nothing pre-existing covers them.
- Rows 5, 8, 14, 19, 27 are places the pre-package material is **deeper than anything locally available** from the package; the package's missing domain specs may or may not exceed them — unknowable until the full package is provided.
- Row 25 and row 33 are the two live DIRECT_CONFLICTs; both are decided (with rationale) rather than silently resolved — see the conflict register.
