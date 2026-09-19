# Access Progression Owner Decisions

This document serves as the canonical record of owner-ratified decisions for the Access Progression domain (Phases 4C–4E), finalized on 2026-09-19.

## Accepted Owner Direction

The following decisions have been explicitly accepted by the owner and form the authoritative basis for current architecture:

*   **Seven-stage target journey:** The future target architecture encompasses Referral, Prescreen, Qualified Review, Facility Review, Pre-Admission, Transfer / Handoff, and Admission.
*   **JourneyPhase derived, not persisted:** The `JourneyPhase` concept remains an analytical derivation and will not be persisted to the database. It is explicitly deferred to a future slice.
*   **Parallel workstreams authoritative for lane work:** The eight parallel workstreams (clinical, legal, medical screening, benefits, authorization, placement, transportation, patient education) possess ultimate authority over their respective lane states. `CaseStatus` must no longer attempt to sequence them.
*   **REVIEW_IN_PROGRESS neutral case lifecycle span:** Adopted as the single, coarse case-level review-span state. It signifies entry into the concurrent review span, but does not assert that all workstreams have started or completed.
*   **Explicit semantic state graph:** Positional array-index arithmetic (`+1` / `<=3`) for state transitions is entirely replaced by a mathematically explicit 181-edge compatibility semantic transition graph.
*   **Four legacy statuses readable/non-writable:** `CLINICAL_REVIEW`, `LEGAL_REVIEW`, `BENEFITS_REVIEW`, and `AUTHORIZATION_PREPARATION` are retained for historical audit readability and forward-exit compatibility, but no operational runtime writer may create or transition into them.
*   **SYN-01…SYN-10 remain reference fixtures:** Unchanged.
*   **Referral/CustodyEvent retained:** Retained pending runtime/cross-org design.
*   **Provenance as Access design requirement:** Accepted as a core architectural requirement.
*   **Access-R-004 and Access-R-006:** Remain verified rules within their exact scopes.

## Still Open / Externally Owned

The following remain unresolved or depend on separate future direction, explicitly separated from the current slice of work:

*   **OD-22:** (`RETURNED_FOR_MORE_INFORMATION` desync).
*   **OD-24:** (Medical-diversion authority/policy).
*   **INFORMATION_INCOMPLETE broad-jump semantics:** Broad-jump behavior remains preserved as normalized current behavior; whether it is too permissive is a separate future decision.
*   **Facility-review/cross-org runtime.**
*   **Transport/custody runtime.**
*   **Qualified clinical/legal/facility policy gates:** Explicit target-readiness rules dictating movement out of `REVIEW_IN_PROGRESS` are deferred.
