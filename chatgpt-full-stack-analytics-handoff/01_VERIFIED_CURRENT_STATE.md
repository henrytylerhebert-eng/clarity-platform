# Verified Current State

## Repository Shape

- Frontend prototype: React/TypeScript under `app/`.
- Backend foundations: service packages under `packages/` and shared contracts under `packages/domain-contracts`.
- Persistence: canonical Prisma foundation under `prisma/schema.prisma`.
- Current API: a narrow authenticated `node:http` vertical slice; the production API and hosting boundary remains under ADR-0012 review.
- Prototype state: largely localStorage-backed and synthetic.

## Implemented Prototype Surfaces

- Case Queue
- Command Center
- New Case
- Case Overview
- Guided Intake
- Evidence Review
- Medical Necessity
- Benefits Verification
- Authorization Readiness
- Legal Status
- Packet Preview
- Routing and Facility Response
- Milieu Bedboard
- Custody Ledger
- Training and SOPs
- Mock Admit Lab
- Read-only Product Studio

## Implemented Service Foundations

Repository documentation identifies controlled service foundations for case, document, evidence, benefits, authorization, and authentication domains. These foundations do not prove that the post-admission analytics runtime exists.

## Existing Analytics Seam

The frontend has a small `AnalyticsEvent` export seam with schema identifier `clarity.reporting-metrics-rebuilder.v0`.

Observed prototype events include:

- `CASE_CREATED`
- `ASSESSMENT_UPDATED`
- `RISK_FINDING_ADDED`
- `OPC_ISSUED`
- `PEC_EXECUTED`
- `CEC_EXECUTED`
- `PACKET_PREVIEWED`
- `PACKET_SENT`
- `ROUTING_RESPONSE_RECEIVED`

These are local prototype events, not a durable server event store.

## Current UX Boundary

The visible UX primarily supports referral through admission transition. It does not currently expose dedicated analytics, utilization-review, hospital-operations, staffing, finance, executive-reporting, or regulatory-reporting workspaces.

The current Command Center names a `Reporting Metrics Rebuilder Stub`, described as:

`Case event -> metrics-safe payload -> later reporting substrate`

## Reporting Package Status

Developed as source analysis and build specification:

- workbook reverse engineering;
- metric definitions;
- dashboard module definitions;
- sustainable architecture;
- migration plan;
- reporting SQL blueprint;
- dependency and formula analysis.

Not implemented as production software:

- reporting service;
- durable analytics event store;
- episode-day runtime;
- metric calculation engine;
- PHI/de-identified data pipeline;
- analytics mart;
- UR or executive dashboards;
- production ingestion adapters;
- governing-agency export workflow.

## Production Readiness Boundary

The following are not confirmed production capabilities:

- managed identity provider;
- production RBAC/RLS enforcement;
- production tenant isolation;
- cloud object storage;
- production observability;
- live EHR, payer, facility, payroll, or agency integrations;
- deployment/release evidence;
- operational outcome measurements.

## Existing Architectural Tension

The reporting SQL blueprint is a reporting-only star/fact model. It is complementary to, not a replacement for, the canonical case/workflow Prisma schema. ChatGPT must propose an explicit relationship between the transactional system and analytics model rather than merging them blindly.

