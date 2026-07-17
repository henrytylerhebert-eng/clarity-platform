# ADR-0008 — Evidence Repository and Human-Review Workflow

- **Status:** Accepted
- **Date:** 2026-07-11
- **Related:** ADR-0003 (command pattern), ADR-0007 (document versioning — evidence cites exact document versions), `docs/implementation/EVIDENCE_REPOSITORY_IMPLEMENTATION.md`

## Context

Documents are stored and versioned; nothing yet converts their content into structured, reviewable facts. This layer is the bridge to future extraction automation — built **entirely human-driven**: no OCR, no automated extraction, no clinical scoring, no legal interpretation, no AI summaries. The design goal is that when automation eventually proposes evidence, it will flow through exactly this review pipeline, with `creationMethod` and `extractionConfidence` already reserved for it.

## Decisions

### 1. Source integrity is structural, not procedural

An evidence item permanently binds: the verbatim `originalText`, the exact `SourceDocument` **row** (a specific version under ADR-0007's family model), page/section when available, who entered it, and who reviewed it. Immutability of `originalText` is enforced **by construction**: no command schema and no gateway change-set type (`EvidenceChanges`) can express an original-text update — there is no code path to misuse. Corrections touch interpretation only (`normalizedValue`, subcategory, page/section, reviewer note). The system preserves the difference between source fact and interpretation: the normalized value lives beside, never instead of, the quoted text.

### 2. Review state machine

`CANDIDATE → {APPROVED, REJECTED, NEEDS_CLARIFICATION, SUPERSEDED}`; `NEEDS_CLARIFICATION → {CANDIDATE (via correction), APPROVED, REJECTED, SUPERSEDED}`; `APPROVED → {SUPERSEDED}` only; `REJECTED` and `SUPERSEDED` terminal. Every item begins as `CANDIDATE` — nothing is approved at creation, and `extractionConfidence` is always null for `HUMAN_ENTRY`. Approved evidence cannot be silently edited: the only exit is an explicit, rationale-required, audited supersession that freezes the original (status `SUPERSEDED`, `supersededById` link) and creates a new `CANDIDATE` in the same `evidenceFamilyId` — one transaction, two audit events (`EVIDENCE_CREATED` with `replacesEvidenceId`, `EVIDENCE_SUPERSEDED`). Superseded and rejected items remain fully retrievable.

### 3. Domain-scoped approval

Review authority binds to the evidence item's own category (clinical categories → `CLINICAL_REVIEWER`/`PHYSICIAN_REVIEWER`; `LEGAL_STATUS`/`CUSTODY`/`GUARDIANSHIP` → `LEGAL_REVIEWER`; `INSURANCE` → `BENEFITS_VERIFICATION_SPECIALIST`; `AUTHORIZATION` → `AUTHORIZATION_SPECIALIST`/`UTILIZATION_REVIEWER`; `PLACEMENT` → `FACILITY_REVIEWER`/`INTAKE_COORDINATOR`; `TRANSPORT` → `TRANSPORT_COORDINATOR`; `OTHER` → `INTAKE_COORDINATOR`/`ORGANIZATION_ADMIN`). No cross-domain approval shortcut exists. The category is pre-read through the tenant-scoped gateway before the permission check — safe because **no code path can change an item's category** (immutable by construction, like originalText); status is still revalidated inside the transaction. Creation is broader (the seven operational roles from the issue); `READ_ONLY_AUDITOR`, `COMPLIANCE_REVIEWER`, and `SYSTEM_ADMIN` mutate nothing. **Superseding always requires the domain reviewer** — it invalidates existing (possibly approved) evidence, which is a review-level act; creators fixing their own candidate use `CorrectCandidateEvidence`.

### 4. Contradiction groups make conflicts visible, never resolve them

A `ContradictionGroup` (new model) collects ≥2 same-case, same-tenant items; a reviewer may classify it (`DIRECT_CONFLICT | TEMPORAL_CHANGE | SOURCE_DISAGREEMENT | UNCLEAR`) and note it. Grouping and classification **never change any member's status** and never erase an item — verified by test. One group per item (the existing `contradictionGroupId` column became a real FK; a membership table was rejected as a second way to say the same thing while items belong to at most one group). Group mutations are version-guarded and audited (`CONTRADICTION_GROUP_CREATED` with member ids, `EVIDENCE_ADDED_TO_CONTRADICTION`, `CONTRADICTION_REVIEW_UPDATED`).

### 5. Schema change (justified, table verified empty)

Migration `20260711*_evidence_review_and_contradiction_support`: `EvidenceItem` gains `organizationId` (tenant scope directly on the row — case, document, and evidence ownership are checked **together** in every command), `version` (optimistic concurrency), `createdBy`, `creationMethod`, `reviewerNote`, `supersededById` (self-relation), `evidenceFamilyId` (indexed); new `ContradictionGroup` model; `CommandIdempotencyRecord` gains `objectId` so non-case commands can rehydrate their exact object on replay.

### 6. Same command discipline as ADR-0003/0007, reused not reinvented

Strict Zod envelopes → role policy → one gateway transaction (scoped reads, state machine on the fresh row, conditional `UPDATE … WHERE version = read-version`, atomic audit event, idempotency record). `PrismaEvidenceGateway` lives in `packages/case-repository` (still the only package importing `@prisma/client`). Audit metadata carries `originalTextSha256` — **never source text**, changed-field *names* (never values), and status from/to; the restricted-identifier guard runs on every write.

### 7. Policy: rejected documents cannot source evidence

Creating or superseding evidence against a document whose classification is `REJECTED` fails (`RejectedSourceDocumentError`) — a rejected document is superseded by a fresh upload (ADR-0007), and new facts should cite the good version. Deleted documents fail the scoped ownership read outright.

## Consequences

- Future extraction automation gets a ready-made funnel: propose `CANDIDATE` items with `creationMethod` ≠ `HUMAN_ENTRY` and a real confidence — review, contradiction, and audit machinery unchanged.
- The insurance/benefits vertical slice (next issue) can consume `APPROVED` `INSURANCE` evidence directly.
- Known limits: contradiction membership is single-group per item; there is no "remove from group" command yet (the audited-membership-change requirement is satisfied for additions; removal is deferred until a workflow needs it); reviewer identity is still caller-trusted (no authentication, unchanged assumption).
