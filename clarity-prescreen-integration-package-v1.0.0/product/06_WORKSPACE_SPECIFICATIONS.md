# Workspace Specifications

## 1. Crisis Case Start

**Goal:** establish a safe, minimal case without delaying urgent action.  
**Actions:** create/link case, record location/contact, rapid safety answers, activate emergency protocol, save draft.  
**Required states:** duplicate candidate, identity unknown, offline draft, unauthorized organization, emergency interruption.

## 2. Guided Prescreen

**Goal:** collect the maximum relevant information through progressive questions.  
**Layout:** section navigation, question panel, source panel, help/definitions, completion issues, save state.  
**Actions:** answer, mark unknown/not assessed, add source, add narrative, attach evidence, flag contradiction, defer.  
**Accessibility:** keyboard-complete, screen-reader labels, no color-only status, large touch targets.

## 3. Review & Attest

**Goal:** let the assessor review exactly what Central Intake will receive.  
**Sections:** crisis summary, observations, patient statements, collateral, orientation, willingness, safety, medical, medications, unknowns, contradictions, packet items.  
**Actions:** edit draft, acknowledge warnings, attest, cancel, return to section.  
**Post-attestation:** read-only version with `Create supplement` and `Request correction` actions.

## 4. Referral Packet Builder

**Goal:** assemble a source-indexed packet for a named target.  
**Columns:** requirement, source rule, requiredness, status, freshness, document/version, owner, blocking effect, next action.  
**Actions:** upload, link existing document, request, mark unavailable with reason, mark not applicable with authority, submit for review.

## 5. Central Intake Workbench

**Goal:** coordinate the case without reconstructing it by phone.  
**Header:** source organization, assessor, current location, target, elapsed time, willingness, orientation, legal/medical/packet states.  
**Panels:** assessment summary, blockers/dependencies, packet, communications, review requests, destination routing.  
**Actions:** acknowledge, request information, assign, present to reviewer, create packet version, route, record response.

## 6. Communications & Tasks

**Goal:** show “waiting on whom, for what, since when.”  
**Views:** open requests, overdue, external waits, internal waits, escalated, completed.  
**Actions:** log call, send structured request through approved channel, acknowledge, assign, change due time with reason, escalate, close.

## 7. Authorized Review

**Goal:** show the reviewer the source and uncertainty needed for a human decision.  
**Actions:** request more information, record review, record decision within authority, add rationale/conditions.  
**Guardrail:** no single AI score or hidden recommendation.

## 8. Facility Routing & Response

**Goal:** submit a governed packet and capture a structured response.  
**Actions:** select approved destination, preview minimum necessary packet, transmit, record receipt, respond to information request, record acceptance/decline/redirect.

## 9. Transport & Custody

**Goal:** create a qualified plan and preserve custody.  
**Panels:** authority, destination, patient needs, allowed categories, qualified providers, arranger/carrier, pickup, documents, handoff.  
**Blocked states:** missing authority, expired instrument, destination not confirmed, no qualified provider, medical capability mismatch, credential stale.

## 10. Facility Configuration

**Goal:** create approved, versioned profiles from facility policy.  
**Roles:** onboarding drafter, clinical approver, legal approver, operations approver, privacy approver.  
**Actions:** ingest source, map candidate requirement, review, test with synthetic scenarios, approve, schedule effective date, supersede, rollback.

## 11. Operational Trends

**Goal:** show aggregate process behavior.  
**Examples:** time to Central Intake acknowledgement, information-request cycles, reassessment wait, time to acceptance response, transport wait, custody exceptions.  
**Guardrail:** no patient-level capacity or legal-status prediction.
