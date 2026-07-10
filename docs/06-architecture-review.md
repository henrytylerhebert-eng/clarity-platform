# Clarity Platform Architecture Review

Date: 2026-07-08

## Review Scope

Reviewed the current Clarity platform document set under `/Users/tylerhebert/Documents/clarity-platform`, including:

- `README.md`
- `docs/01-project-architecture.md`
- `docs/02-claude-code-handoff.md`
- `docs/03-data-model.md`
- `docs/04-build-roadmap.md`
- `docs/05-source-document-index.md`
- `clarity-mh-architecture/` package docs, schema, types, RLS starter, workflows, compliance docs, implementation backlog, and acceptance tests.

This folder is not currently a git repository.

## Executive Judgment

The architecture direction is strong enough to proceed, but the project needs one cleaner canonical spine before implementation starts.

The strongest product architecture is:

> One continuous crisis case record that captures facts once, source-links them, and generates reviewed clinical, legal, transfer, payer, custody, and operational outputs.

The highest-risk implementation issue is not missing features. It is document drift: there are two architecture layers, two schema descriptions, two roadmap versions, and source indexes that now disagree about which materials are actually available. A build agent could overbuild, choose the wrong schema, or treat generated/reference files as production truth.

## Confirmed Strengths

1. Clear defensible wedge

The platform correctly avoids starting as a generic bed board or form builder. The near-term wedge is acute behavioral-health intake, medical-necessity documentation, Louisiana legal instrument custody, packet generation, and closed-loop routing.

2. Correct source-of-truth pattern

The continuous case record is the right data architecture. Clinical assessment, legal status, packet generation, routing, acceptance receipts, custody events, and later bed placement should all hang from one case spine.

3. Strong safety posture

The docs consistently frame AI and structured recommendations as draft decision support. They preserve clinician review and counsel validation for final clinical/legal determinations.

4. Good market distinction

The request-broadcast model is the right transfer-network direction. It avoids relying on stale facility-maintained census data and makes facilities respond to a live, packet-ready case.

5. Strong operational lane separation

The docs correctly require clinical screening and emergency review to proceed independently of insurance or benefits verification.

## Findings

### P1 - Canonical source conflict between top-level docs and architecture package

The top-level README says `docs/01-project-architecture.md` is the canonical architecture and module map, while the generated package also contains a separate product architecture, schema, prompts, implementation backlog, and source index.

Risk:

- A build session may not know whether `docs/03-data-model.md` or `clarity-mh-architecture/schema/prisma.schema.prisma` is authoritative.
- The handoff could accidentally treat source/context files as active implementation requirements.

Recommendation:

- Declare `docs/01-project-architecture.md`, `docs/03-data-model.md`, and `docs/04-build-roadmap.md` as the current human-reviewed canonical docs.
- Treat `clarity-mh-architecture/` as a generated architecture package and implementation kit.
- Add a short `docs/00-architecture-index.md` that says which documents are canonical, which are generated, and which are source context.

### P1 - Source index is stale after the document move

`docs/05-source-document-index.md` says several source documents were "not available as a local source file in this packet." Those documents now exist in `clarity-mh-architecture/sources/` and in the moved `Clarity MH` folder.

Risk:

- Future agents may underuse the source docs or rely on old thread summaries instead of reviewing the actual local materials.
- The project could accidentally preserve weaker, summary-derived assumptions after better source evidence is available.

Recommendation:

- Update `docs/05-source-document-index.md` to mark the moved files as available local context materials.
- Keep the source materials read-only and separate from canonical architecture.
- For every product claim sourced from the moved documents, mark one of: `source-confirmed`, `summary-derived`, `requires legal review`, `requires clinical review`, or `unknown`.

### P1 - Prisma schema and RLS starter do not align

The Supabase RLS starter assumes every tenant-owned table includes `organization_id` and uses UUID identities. The Prisma schema uses `String @default(cuid())` IDs and omits direct `organizationId` from many tenant-relevant child tables, including assessments, legal instruments, custody ledger events, transmissions, facility responses, referral packets, and evidence artifacts.

Risk:

- RLS policies cannot be directly applied to the proposed Prisma schema.
- Tenant isolation would rely on joins through `IntakeCase`, which is possible but more complex and easy to get wrong.
- Mixing CUID strings with Supabase `auth.users` UUIDs creates identity friction.

Recommendation:

- Before implementation, choose one of two paths:
  - Supabase-native path: use UUID primary keys and explicit `organization_id` on tenant-owned tables.
  - App-layer prototype path: keep local TypeScript/JSON or Prisma CUIDs, but do not present the RLS starter as directly deployable.
- For a production-track architecture, add explicit tenant scope fields to all legally or clinically sensitive tables.

### P1 - Data model omits several entities required by the docs

The first-pass data model includes compliance clocks, pitfall guards, attestations, packet artifacts, redactions, facility referrals, consent/sharing grants, form packs, escalation policies, units, rooms, beds, acuity profiles, placement recommendations, and placement decisions.

The generated Prisma schema covers part of the spine but omits or compresses several of those concepts.

Risk:

- The prototype could lose important architecture commitments: configurable legal clocks, consent segmentation, redaction-as-derivative-artifact, packet artifact inclusion modes, and explicit facility referral lifecycle.
- The schema could look "complete" while failing the platform safety model.

Recommendation:

- Do not treat the generated Prisma schema as complete.
- Create a canonical `v0.1 data spine` with three tiers:
  - Phase 1 required: Case, Patient, Encounter, Assessment, SourceReference, RiskFinding, MedicalNecessitySnapshot, LegalInstrument, CustodyLedgerEvent, ReferralPacket, FacilityReferral/Transmission, FacilityResponse, AuditLog.
  - Phase 2 required: ComplianceClock, FormPack, Attestation, EvidenceArtifact, PacketArtifact, Redaction.
  - Phase 3 required: Consent, SharingGrant, Unit/Room/Bed, AcuityProfile, PlacementRecommendation, PlacementDecision, EscalationPolicy.

### P2 - MVP scope is broader than the phase discipline

The handoff asks the first prototype to demonstrate intake, assessment, legal/custody, transfer packet, facility response, command center, and milieu bedboard. The MVP package also lists 16 must-have items.

Risk:

- The first build could become a wide demo with shallow logic instead of a reliable vertical slice.
- Bedboard and command-center work could pull attention away from the defensible wedge: intake to packet to legal/custody to routing response.

Recommendation:

- Define `MVP v0.1` as intake spine only:
  - case queue,
  - case creation,
  - guided intake,
  - source references,
  - risk findings,
  - medical necessity draft,
  - legal status and legal draft,
  - custody ledger,
  - referral packet preview,
  - simulated facility response.
- Move command center, bedboard, analytics, and AI provider abstraction to `v0.2+`.
- Keep bedboard as a demo scenario and future module, not a Phase 1 dependency.

### P2 - Legal-status model needs a non-enforcement configuration layer

The docs correctly say Louisiana clocks and form requirements require counsel validation. The data model should make that explicit, not just mention it in prose.

Risk:

- Developers may encode deadlines, role permissions, or form attestation language as fixed application logic.

Recommendation:

- Add `LegalRulePack` or expand `FormPack` to include:
  - jurisdiction,
  - instrument type,
  - trigger event,
  - clock duration,
  - form version,
  - signer role requirements,
  - counsel review status,
  - effective date,
  - source citation,
  - enforcement mode: `display_only | warn | block`.

### P2 - Facility routing needs separate referral and transmission concepts

The first-pass model includes `facility_referrals`; the generated schema uses `Transmission` plus `FacilityResponse`.

Risk:

- A transmission is a delivery event. A referral is the clinical/business routing object that can have status, recipient, packet version, response due time, and reroute history.

Recommendation:

- Keep both:
  - `FacilityReferral`: the routing request lifecycle.
  - `Transmission`: one delivery attempt/channel for a packet or referral.
  - `FacilityResponse`: the recipient's response to a referral.

### P2 - AI prompt templates need a governed output lifecycle

The AI guardrails are strong, and the generated schema includes `AIOutput`. The architecture should bind AI outputs to source references and review states as first-class workflow objects.

Risk:

- Draft text could be mistaken for clinician-reviewed content.

Recommendation:

- Require every generated output to store:
  - source reference IDs,
  - missing data flags,
  - prohibited language scan result,
  - reviewer ID,
  - review status,
  - final accepted text snapshot if clinician-reviewed.

### P3 - Naming and folder structure should be cleaned before build

There are duplicate source locations:

- `Clarity MH /`
- `clarity-mh-architecture/sources/`
- `source-notes/`
- top-level `docs/`

Risk:

- Build agents and humans will waste time asking which artifact to trust.

Recommendation:

Adopt this folder structure:

```text
clarity-platform/
  docs/
    00-architecture-index.md
    01-project-architecture.md
    02-implementation-handoff.md
    03-data-model.md
    04-build-roadmap.md
    05-source-document-index.md
    06-architecture-review.md
  context/
    source-documents/
    source-notes/
  generated/
    clarity-mh-architecture/
  prototype/
    clarity-epec.prototype.jsx
  app/ or repo-root once implementation starts
```

## Recommended Architecture Decisions

### Decision 1 - Keep one canonical case spine

Everything should attach to `Case`:

- encounters,
- assessments,
- source references,
- risk findings,
- medical necessity snapshots,
- legal instruments,
- custody ledger events,
- packets,
- facility referrals,
- facility responses,
- compliance clocks,
- consent/sharing grants,
- later bed placement recommendations.

### Decision 2 - Use source references as the trust layer

Every important clinical/legal claim should carry source provenance:

- patient report,
- collateral report,
- clinician observation,
- law enforcement,
- prior record,
- legal document,
- lab/vital/medical record,
- media reference,
- AI draft.

### Decision 3 - Build the request-broadcast before the bed registry

The routing layer should start with packet-ready live-case broadcast, response capture, and decline analytics. Facility capability profiles matter, but live census is not the first dependency.

### Decision 4 - Keep clinical and financial lanes parallel in the model and UI

Clinical screening, safety action, and legal review cannot be blocked by benefits verification. Insurance should be visible as a parallel readiness lane, not a gate.

### Decision 5 - Treat legal clocks as configuration, not truth

The system can display and simulate clocks, but enforcement modes must remain configurable and counsel-gated.

## Best Next Build Sequence

### Step 1 - Documentation consolidation

Create an architecture index and update source index. Mark files as:

- canonical,
- generated implementation kit,
- source context,
- prototype/reference.

### Step 2 - Data spine freeze

Create the `v0.1` entity list and decide whether the first implementation is:

- local JSON/TypeScript prototype,
- Prisma/Postgres app,
- Supabase-native app.

Do not mix Supabase RLS assumptions with Prisma CUID schema until the identity and tenant model is settled.

### Step 3 - Build Phase 1 prototype

Build only:

- case list,
- new case,
- guided intake,
- source references,
- risk findings,
- medical necessity draft,
- legal status draft,
- custody ledger,
- packet preview,
- simulated facility referral response.

### Step 4 - Add tests before expanding

Minimum acceptance tests:

- no AI output can become final without review,
- prohibited criteria language is blocked,
- clinical lane works while insurance is unknown,
- custody hash verifies when untouched,
- custody hash fails after tampering,
- facility decline requires reason code.

### Step 5 - Expand to command center and bedboard

Only after the intake-to-packet-to-response flow works, add:

- command center,
- SLA clocks,
- packet completeness dashboard,
- bedboard/milieu recommendation prototype,
- pilot metrics dashboard.

## Current Unknowns

- Exact current Louisiana statutory wording and official form requirements.
- Current official e-signature acceptance requirements for each legal instrument.
- Current hospital-specific assessment forms.
- Current payer criteria packs and facility-specific authorization rules.
- Live competitor feature state.
- Baseline transfer timing.
- First-submission acceptance rate.
- Current packet completeness rate.
- Documentation-error rate.
- Pilot outcome measurements.

No measurements found for current workflow performance.

## Bottom Line

Proceed, but tighten the project before coding:

1. Nominate canonical docs.
2. Update the source index now that context documents are local.
3. Resolve schema/RLS mismatch.
4. Narrow v0.1 to the data spine and intake-to-packet-to-response workflow.
5. Keep legal, clinical, and AI outputs review-gated.

