# ChatGPT Master Prompt: Clarity Hospital Operations and Outcomes Intelligence

You are acting as a senior product architect, healthcare workflow designer, data architect, security architect, full-stack engineering lead, and UX systems designer.

## Mission

Review the supplied Clarity platform context and produce a comprehensive, build-ready full-stack design for a post-admission hospital operations and outcomes-intelligence product that integrates seamlessly with Clarity's existing referral-through-admission workflow.

Your response must go beyond a conceptual roadmap. Produce concrete contracts and artifacts that Codex can evaluate and implement in the live repository without rediscovering the product boundary.

## Product Boundary

Clarity currently has two connected product domains:

1. `Access and Admission Orchestration`: referral, intake, evidence, clinical/legal/financial readiness, packet, request broadcast, facility response, acceptance, transport, custody, and admission handoff.
2. `Hospital Operations and Outcomes Intelligence`: episode management, utilization review, census, approved/denied days, documentation gaps, staffing burden, finance, quality, outcomes, executive intelligence, and eventually approved governing-agency reporting.

The second domain must share a governed event spine with the first but remain separable as a product/module. Do not turn the existing intake Command Center into an overloaded generic dashboard.

## Required Working Method

1. Read every root handoff document before proposing architecture.
2. Use the source hierarchy in `SOURCE_MANIFEST.md`.
3. Separate `Confirmed`, `Inferred`, `Proposed`, `Unknown`, and `Needs decision` statements.
4. Identify contradictions between current implementation, ADR-0012, the reporting SQL blueprint, and the target architecture.
5. Do not assume deployment, integrations, measurements, or production authorization exist.
6. Do not use the legacy workbook as a system of record.
7. Do not place raw PHI in aggregate dashboards or regulator exports.
8. Do not introduce autonomous clinical, admission, discharge, authorization, legal, or placement decisions.
9. Prefer human review, provenance, versioned metrics, correction history, and auditable decisions.
10. Preserve the existing TypeScript/React, service-package, domain-contract, Prisma, and controlled-command patterns unless you explicitly justify a staged change.

## Design Questions You Must Resolve

1. Where should the analytics runtime live relative to the production API boundary under ADR-0012?
2. Which operational events must be added at admission, during the episode, and at discharge?
3. Which events remain case-owned, which become episode-owned, and how are they linked?
4. How should tenant isolation, facility/program/unit scope, and cross-organization aggregation work?
5. What belongs in the PHI operational store versus the de-identified analytics mart?
6. How are corrections, late-arriving events, supersession, metric recomputation, and data-quality status represented?
7. How does each stakeholder contribute information through normal work instead of duplicate reporting entry?
8. Which acquisition path is appropriate for native workflow events, EHR/FHIR or HL7, payer systems, staffing/payroll, batch imports, and human attestation?
9. Which role-specific workspaces are needed, and what decisions may each workspace support?
10. What minimum governance boundary is required before any multi-facility benchmark or agency export?

## Required Initial Slice

Design the smallest production-shaped vertical slice around:

- admission-to-episode handoff;
- episode and episode-day event contracts;
- authorization reviews;
- approved, denied, pending, expired, and at-risk days;
- documentation gaps;
- a server-owned utilization-review work queue;
- an authorization-risk dashboard;
- immutable audit/provenance;
- role and tenant enforcement;
- synthetic fixtures and focused tests.

The initial slice must not require staffing, payroll, EHR, payer-portal, or regulator integrations to be operational. Define adapter boundaries for those later stages.

## Required Technical Deliverables

Return all artifacts specified in `05_REQUIRED_RETURN_PACKAGE.md`. At minimum, include:

- recommended architecture and ADR decisions;
- domain/entity model and lifecycle diagrams;
- event envelope and event catalog;
- Prisma-ready target data model or staged SQL/Prisma mapping;
- API route and command/query contracts;
- authorization and tenancy matrix;
- de-identification and analytics-mart design;
- ingestion and adapter contracts;
- metric-definition registry design;
- UX information architecture and detailed workspace specifications;
- loading, empty, error, stale-data, correction, and review states;
- implementation slices mapped to current repository paths;
- migration, test, observability, deployment, and rollback plans;
- risk register and explicit decision log;
- a final prompt for Codex to execute the approved first slice.

## Build Expectations

Produce build-ready examples, not pseudostrategy alone. Include TypeScript interfaces, example JSON event envelopes, OpenAPI-style request/response contracts, schema definitions, permission rules, and component/module placement.

If you generate code, label it `Proposed and unverified`. Do not claim it compiles or passes tests because you do not have the live repository runtime.

Do not fabricate benchmark values. UI examples must display `No measurements found` or an explicit insufficient-data state until valid event data exists.

## Return Instruction

Deliver the result as a self-contained folder named `clarity-analytics-return-package`. Follow the exact structure in `05_REQUIRED_RETURN_PACKAGE.md`. If downloadable file generation is unavailable, provide each file in a separately labeled fenced block with its intended path.

End with:

1. `Recommended decision`
2. `Decisions Tyler must approve`
3. `First implementation slice`
4. `What Codex should verify before editing`
5. `Files Codex is expected to touch`
6. `Checks Codex should run after approval`

