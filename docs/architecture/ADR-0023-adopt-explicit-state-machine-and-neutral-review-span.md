# ADR-0023: Adopt Explicit State Machine and Neutral Review Span (Option B2)

**Status:** Accepted — owner ratified 2026-09-19

## Context & Problem Statement

The Access domain's current state machine relies on brittle positional array-index math (`fi - ti <= 3`) which mathematically breaks when modifying pipeline vocabularies. Furthermore, four existing lane-shaped statuses (`CLINICAL_REVIEW`, `LEGAL_REVIEW`, `BENEFITS_REVIEW`, `AUTHORIZATION_PREPARATION`) create valid but contradictory representations with the authoritative parallel workstreams (clinical, legal, medical screening, benefits, authorization, etc.). As established by PR #110 evidence, the positional logic resulted in failing tests and fragile behavioral boundaries when new states were naively inserted.

## Options Considered

*   **Option A:** Status quo (rejected due to contradictions with parallel workstreams).
*   **Option B1:** Positional replacement (rejected as mathematically brittle and highly coupled to vocabulary size).
*   **Option B2:** Explicit Semantic Graph with neutral review span (chosen).
*   **Option C:** Pure independent lanes with derived-only state (rejected as premature without cross-domain readiness gates).

## Decision

We will adopt the **Option B2** explicit semantic transition model and collapse the four legacy lane statuses into a single neutral status: `REVIEW_IN_PROGRESS`.

*   **Neutral Review Span:** `REVIEW_IN_PROGRESS` signifies entry into the concurrent review span. It does not certify that any workstream is complete, nor does it function as a strict target-readiness gate.
*   **Explicit Transition Graph Authority:** Positional index arithmetic is entirely eliminated. The 181-edge G2 compatibility graph implements explicit forward and rework logic mathematically derived from current behaviors to guarantee zero collateral mutations.
*   **Readable / Writable / Legacy Contract:**
    *   `WRITABLE_CASE_STATUSES` (22 values) encompasses the active pipeline.
    *   `LEGACY_CASE_STATUSES` (4 values) encompasses the old lanes.
    *   `CASE_STATUSES` (26 values) encompasses the full TypeScript domain union.
*   **Exact Graph Counts:** G0 (187 edges), G1 pure normalized (154 edges), Target-normalized historical transform (173 edges), and complete G2 compatibility runtime graph (181 edges).
*   **Operational Write Prohibition:** Legacy statuses become read-only historical states; the domain service and public repository methods will structurally reject commands attempting to write, transition, or reopen into them.
*   **Reopen Targets:** Reopen targets are strictly explicitly mapped to `WRITABLE_CASE_STATUSES` (minus `CLOSED`).
*   **Information Incomplete:** Disposition is mapped mathematically equivalent to current behaviors; it exits to active pipeline states, maintaining the broad-jump.
*   **Medical-Diversion:** Entry and exit compatibility maps exactly to current normalized equivalents without expanding authority.
*   **Synthetic Fixture Invariant:** `syntheticCase.ts` enforces `z.enum(WRITABLE_CASE_STATUSES)`. Historical testing utilizes test-only paths outside `data/synthetic-cases/`.
*   **Immutable History:** Past `CASE_STATUS_CHANGED` events are preserved literally and untouched.
*   **OD-22 / OD-24 Isolation:** `RETURNED_FOR_MORE_INFORMATION` remains Prisma-only and isolated. Medical diversion policy remains untouched.
*   **JourneyPhase:** Explicitly out of scope; remains derived and unimplemented for now.
*   **Review-to-Packet Meaning:** Transitioning to `PACKET_PREPARATION` means coordinator-level assembly has begun, not a target-readiness gate.

## PostgreSQL Migration & Rollback

`ALTER TYPE CaseStatus ADD VALUE 'REVIEW_IN_PROGRESS'` is strictly forward-only.
*   **Rollback Window 1 (Pre-write):** Reverting code before `REVIEW_IN_PROGRESS` is written leaves a harmless dormant enum value.
*   **Rollback Window 2 (Post-write):** Reverting code after the status is written causes `parseEnum()` to crash on those rows. Recovery requires forward-fix or explicit row data mitigation. Audit histories remain immutable.

## Consequences

Operational code gains absolute structural safety against new legacy writes. Legacy rows maintain safe forward exits. Positional brittleness is permanently eliminated.
