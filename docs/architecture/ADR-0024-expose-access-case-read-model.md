# ADR-0024: Expose Access Case Read Model with Explicit Read Authorization and Detail-Read Auditing

**Status:** Accepted — owner ratified 2026-09-19

## Context

The Access projection (Slice 4B) requires a read policy before HTTP exposure. `EXECUTION_ARCHITECTURE.md` explicitly marked read authorization and read auditing as required gating decisions before exposing case reads over HTTP. Furthermore, the repository currently lacks a single unified API to expose the derived `JourneyProjection` and `AccessGuidanceProjection` for a case, requiring a definitive decision on source selection, ambiguity resolution, transaction isolation, and DTO shape.

## Decision

We authorize the creation of an authenticated, tenant-scoped, audited Access case-detail read endpoint (`GET /api/access/cases/:caseKey`) incorporating the following architectural bounds:

### 1. Read Authority (Option R3)
*   **Allowed:** The exact accepted allow-list:
*   `ORGANIZATION_ADMIN`
*   `INTAKE_COORDINATOR`
*   `CLINICAL_REVIEWER`
*   `PHYSICIAN_REVIEWER`
*   `UTILIZATION_REVIEWER`
*   `LEGAL_REVIEWER`
*   `BENEFITS_VERIFICATION_SPECIALIST`
*   `AUTHORIZATION_SPECIALIST`
*   `FACILITY_REVIEWER`
*   `TRANSPORT_COORDINATOR`
*   `COMPLIANCE_REVIEWER`
*   `READ_ONLY_AUDITOR`
*   **Denied:** `SYSTEM_ADMIN` is explicitly excluded to maintain the boundary between technical platform administration and clinical case operations.
*   **Scope:** This is **same-organization authority only**. It does not authorize cross-organization Facility Review, receiving-facility access into another tenant, external users, or any new mutation authority.

### 2. Detail-Read Auditing (Option B)
*   Every successful `GET /api/access/cases/:caseKey` must record an `ACCESS_CASE_VIEWED` audit event before returning the response.
*   **Fail Closed:** If the audit write fails, the request must fail closed (return `500 internal_error`) and no case-detail response will be returned.
*   **List Reads:** Future list-read auditing remains undecided and outside this ADR.
*   **Disclaimer:** This establishes an audited **case-detail workflow-intelligence read boundary**. It does **not** claim PHI readiness, HIPAA compliance, production deployment, or legal/clinical compliance certification.

### 3. Prescreen Source Selection (Option P1)
Current Prescreen selection from **non-terminal** encounters is defined as:
*   `0` active encounters → `NONE`
*   `1` active encounter → `SELECTED`
*   `>1` active encounters → `AMBIGUOUS`
*   Terminal statuses are: `HANDED_OFF`, `REDIRECTED`, `DECLINED`, `CANCELLED`.
*   We do not choose the latest encounter, merge requirements from competing active encounters, or allow callers to choose an encounter in this endpoint.

### 4. Ambiguity Resolution
When `prescreenSelection = AMBIGUOUS`:
*   Return the case-detail read model using case evidence, workstream state, and episode evidence.
*   Do not supply `prescreenStatus` or `packetRequirements` to `deriveAccessGuidance()`.
*   Guidance must produce `packetReadiness === null`.

### 5. Packet Readiness Semantics
*   `packetRequirements === undefined` means: packet requirement evidence was not supplied.
*   `packetRequirements === []` means: the selected encounter was loaded and has zero persisted requirement rows.
*   Current `evaluatePacketReadiness(target, [])` returns `ready = true` with zero blockers and warnings. This means there are no configured/persisted requirements in the supplied set that block the target. It must **not** be documented as "all real-world required documents have been proven present."

### 6. Implementation Bounds
*   **Transaction Isolation:** The repository snapshot must be assembled under `REPEATABLE READ` to prevent torn reads.
*   **Minimum-Necessary DTO:** Patient identity/chart content must be excluded.
*   **No API mutations:** The endpoint performs no case/workflow/domain mutation. A successful detail read intentionally appends the required access-audit event.
*   **Current status:** Journey/Guidance remain derived and non-persisted. WorkItem and UI remain unauthorized. OD-22 and OD-24 remain untouched.
