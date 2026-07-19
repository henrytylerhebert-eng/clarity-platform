# ADR-0014: Network enrichment contracts (Phase 1 — contracts-only slice)

- **Status:** Proposed (implemented as a contracts-only slice; wider adoption gated on the open decisions below)
- **Date:** 2026-07-19
- **Source material:** `reference/source-packages/clarity-network-enrichment-production-package-v1.0.0` (onboarded this branch, 54/54 checksums verified; see `reference/source-packages/NETWORK_ENRICHMENT_PACKAGE_ONBOARDING_NOTE.md`)

## Context

The owner delivered the Clarity Network Enrichment production package: a
proposed architecture for enriching facility, organization, program, contact,
payer, admission-profile, and transport-capability network data from public
sources, with candidate-only AI output, field-level evidence, source
authority, freshness, conflict handling, and human approval gates.

The package's own integration guide requires mapping into the live tree
without creating a second system of record. Inspection of the live repository
found these seams and conflicts:

| Package concept | Live repository seam | Resolution in this slice |
|---|---|---|
| Contract types/enums (`src/types.ts`) | `packages/domain-contracts` | **Adopted** as `src/networkEnrichment.ts` (Zod + pure functions, `Network`-prefixed names) |
| Normalization, entity resolution, source authority, freshness, conflict detection, review routing, package validation, URL safety, accuracy metrics | same module | **Adopted** verbatim in behavior; deterministic and side-effect free |
| Review command service (`src/service.ts`: submit/approve/reject) | future `packages/network-enrichment-service` following the controlled `*-service` pattern | **Not adopted** — blocked on the reviewer-role mapping decision (below) |
| Proposed Prisma fragment (`prisma/proposed-network-enrichment.prisma`) | `prisma/schema.prisma` (`Organization`, `FacilityProfile`, `PayerProfile` already exist) | **Not adopted** — canonical entity ownership unresolved (below) |
| OpenAPI routes (`contracts/openapi.yaml`) | `packages/api-service` | **Not adopted** — ADR-0012 is accepted only in part; no new HTTP surface |
| RLS SQL (`sql/rls-policies.sql`) | OD-6 provider-backed RLS gate | **Not adopted** — same gate as all other RLS work |
| Agent prompts (`prompts/`) | future enrichment worker | **Not adopted** — no live agent, scraping, or egress in this slice |
| Synthetic fixtures (`fixtures/`, `examples/`) | `tests/data/` | **Adopted** (12 entity-resolution scenarios + 1 valid candidate package) |
| Reference tests (`tests/`) | `tests/unit/` | **Ported** to vitest with added invariant coverage |

## Decision

Adopt the package's **contract layer only**, as
`packages/domain-contracts/src/networkEnrichment.ts`:

1. **Vocabularies** for entity-resolution status, review state, freshness
   state, source type (with the fixed authority tier table), operational-use
   status, evidence scope, and confidence — all `Network`-prefixed to keep the
   shared contract namespace unambiguous.
2. **Deterministic normalization** (entity name with legal-suffix stripping,
   NANP phone digits, website host, postal code, address key, stable JSON).
3. **Deterministic, explainable entity resolution** over pre-fetched
   candidates: weighted named signals, hard identifier-conflict detection,
   package-proposed thresholds (MATCHED ≥ 0.80 score, ≥ 0.15 margin, at least
   one strong signal); every non-MATCHED outcome requires human review.
4. **Source authority**: per-field-path maximum source tiers, tightened for
   operational use; `DISCOVERY_ONLY` sources can never support a populated
   field.
5. **Freshness**: verification-interval classification and next-review
   derivation with the package's default interval table.
6. **Conflict detection** that preserves and surfaces conflicting candidate
   values; nothing auto-resolves.
7. **Review-routing policy**: sensitive admission/legal/transport/payer/
   license field paths route to specialized reviewer roles, with
   `ALL_DISTINCT` dual review for acceptance authority and transport
   capability; `canAgentReplaceNetworkField` returns false for
   `HUMAN_CONFIRMED`.
8. **Candidate-package validation**: strict Zod envelope
   (`clarity.network-enrichment.v1`) plus cross-field rules — every candidate
   field cites evidence that actually supports its field path from a source
   allowed to support it, canonical UTC ISO timestamps, unknown scalars are
   `null` (the string "Unknown" is rejected), and agent output cannot carry
   `HUMAN_CONFIRMED` or mark sensitive fields anything but `REQUIRES_REVIEW`.
9. **Outbound URL safety validator** (HTTPS-only, no credentials, no
   private/loopback/internal hosts, optional allowlist) — validation only; no
   code in this slice performs network access.
10. **Deterministic accuracy metrics** for synthetic-fixture evaluation.

The reviewer-role names (`NETWORK_REVIEWER`, `FACILITY_CLINICAL_GOVERNANCE`,
`FACILITY_LEGAL_COMPLIANCE`, `FACILITY_OPERATIONS`, `PAYER_BENEFITS_REVIEWER`,
`COMPLIANCE_REVIEWER`) are adopted **as a proposed vocabulary only**
(`NetworkReviewerRole`), explicitly distinct from the schema `UserRole` enum.
Nothing authorizes against them at runtime.

## Invariants enforced by this slice

- Candidate data cannot become canonical here: the module has no persistence,
  no gateway, and no command surface; promotion requires a future authorized
  server command.
- Agent output cannot set `HUMAN_CONFIRMED` (policy + validator + tests).
- Every populated candidate field must cite supporting evidence.
- Discovery-only sources cannot support populated fields.
- Unknown scalar values are `null`, never `"Unknown"`.
- Conflicts are preserved and visible, never collapsed.
- Human-confirmed values are never agent-replaceable.
- Sensitive admission/payer/transport/legal fields remain `REQUIRES_REVIEW`.
- Payer/financial review routing is independent of clinical review routing
  (financial data cannot gate emergency clinical review).
- No PHI anywhere: the domain is facility/organization network data; fixtures
  are synthetic.

## Open decisions this ADR does NOT resolve (each blocks a later slice)

1. **Canonical entity ownership.** The package proposes an
   organization → location → program network model; the live schema owns
   `Organization`, `FacilityProfile`, and `PayerProfile`. Whether network
   enrichment extends those models or introduces new network tables is an
   owner + ADR decision. Until then: no Prisma changes.
2. **Reviewer-role mapping.** Package reviewer roles vs. schema `UserRole`
   (only `COMPLIANCE_REVIEWER` overlaps today). Same class of decision as the
   prescreen role-mapping packet. Blocks the review command service.
3. **API surface.** ADR-0012 is accepted only in part; enrichment routes are
   not approved.
4. **Live enrichment worker.** Scraping/egress, source allowlist, secrets,
   and worker runtime are unapproved; the URL-safety validator ships without
   any fetching code.
5. **Operational admission criteria.** Facility admission/exclusion/lab
   criteria content requires clinical and legal review before any operational
   use (existing standing rule).

## Consequences

- The enrichment agent's output format, validation rules, and review-routing
  policy are now testable, versioned repository contracts (26 unit tests).
- The next slice (review command service over an in-memory gateway, mirroring
  ADR-0013) has a stable contract foundation and a single named blocker: the
  reviewer-role mapping decision.
- Nothing operational changed: no schema, no routes, no workers, no egress.
