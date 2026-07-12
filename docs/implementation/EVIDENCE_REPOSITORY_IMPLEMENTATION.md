---
status: Implemented and verified against clarity_dev
owner: TBD
version: 1.0.0
last_integrated: 2026-07-11
source_artifacts:
  - packages/evidence-service/ (command service, role policy)
  - packages/case-repository/src/evidenceGateway.ts (approved Prisma adapter)
  - packages/domain-contracts/src/evidence.ts (contracts, status machine)
  - prisma/migrations/*_evidence_review_and_contradiction_support
unresolved_conflicts: "actor roles trusted from caller until auth exists; contradiction-membership removal deferred"
related_requirements: REQ-007 lineage (source REQ matrix missing — OD-1)
related_adrs: ADR-0008 (decision record), ADR-0007, ADR-0003
---

# Evidence Repository and Human-Review Workflow

Staff convert stored document content into reviewable, source-bound evidence — entirely human-driven (no OCR, no extraction, no AI). Decisions: **ADR-0008**. Test coverage: `docs/testing/EVIDENCE_TEST_MANIFEST.md`.

## Command flow

```text
caller → EvidenceCommandService.<command>(envelope)
  1. Zod strict parse
  2. role policy (create roles / domain-scoped review roles by the item's
     own immutable category / reviewer-union for contradictions)
  3. PrismaEvidenceGateway — ONE transaction:
       scoped reads: case {id, org} + document {id, caseId, org, not REJECTED}
                     + evidence {id, org, caseId}   (non-revealing misses)
       expectedVersion check → EvidenceConcurrencyConflictError
       status machine on the FRESH row → EvidenceStateError
       conditional UPDATE {id, org, caseId, version} + version increment
       atomic audit event (hash references, field names — never text/values)
       idempotency record with objectId (replay rehydrates the exact item)
```

## Commands

| Command | Rule highlights | Audit action |
|---|---|---|
| `CreateCandidateEvidence` | starts `CANDIDATE`, `HUMAN_ENTRY`, null confidence, own family root; document must belong to the same case+tenant and not be `REJECTED` | `EVIDENCE_CREATED` |
| `CorrectCandidateEvidence` | `CANDIDATE`/`NEEDS_CLARIFICATION` only; interpretation fields only (`originalText` inexpressible); clarified items return to `CANDIDATE` | `EVIDENCE_CORRECTED` |
| `ApproveEvidence` | domain reviewer for the item's category; stamps `reviewedBy`/`reviewedAt` | `EVIDENCE_APPROVED` |
| `RejectEvidence` | rationale mandatory (schema); terminal | `EVIDENCE_REJECTED` |
| `RequestEvidenceClarification` | note mandatory (schema) | `EVIDENCE_CLARIFICATION_REQUESTED` |
| `SupersedeEvidence` | domain reviewer + mandatory reason; freezes original (`SUPERSEDED`, `supersededById`), creates linked `CANDIDATE` in the same family — one transaction, two audit events | `EVIDENCE_SUPERSEDED` (+ `EVIDENCE_CREATED`) |
| `CreateContradictionGroup` | ≥2 same-case items, none already grouped; changes no statuses | `CONTRADICTION_GROUP_CREATED` |
| `AddEvidenceToContradictionGroup` | version-guarded on the group; one group per item | `EVIDENCE_ADDED_TO_CONTRADICTION` |
| `ResolveContradictionReview` | classification `DIRECT_CONFLICT`\|`TEMPORAL_CHANGE`\|`SOURCE_DISAGREEMENT`\|`UNCLEAR`; never touches member statuses | `CONTRADICTION_REVIEW_UPDATED` |

## Verified (this session, local clarity_dev)

19 evidence integration tests across two files (creation/source-integrity/isolation: 7; review/concurrency/contradictions: 12) — including: candidate-only creation with exact-version document binding and hash-only audit; rejected-document and cross-case document refusal; idempotent create/approve replay (no duplicate rows or audit events); ten cross-tenant behaviors as non-revealing misses; domain-scoped approval in both directions (legal/benefits/intake cannot approve clinical, clinical cannot approve insurance); rationale/note enforcement; correction history with changed-field names; approved-evidence edit refusal; supersession freezing + family linkage + candidate-not-approved replacement; stale-version failure; same-version race with exactly one winner; audit-failure rollback (mutation AND idempotency record) with successful retry; contradiction grouping/classification changing no member status.

Full root suite **149/149**; app suite **37/37**; lint, typecheck, `prisma validate` clean; zero synthetic residue (evidence and contradiction tables included in harness cleanup).

## Known limitations

1. No authentication — reviewer identity and roles are trusted envelope input (unchanged platform assumption).
2. One contradiction group per evidence item; no remove-from-group command yet (additions are audited; removal deferred until a workflow needs it).
3. Contradiction concurrency uses stale-expectation checks (same approach as case/document suites), not a live two-transaction race.
4. `HumanReview` (the generic review table in the foundation schema) is not yet written by evidence commands — review facts live on the evidence row + audit trail; wiring `HumanReview` rows is a candidate follow-up when other review object types arrive.
5. No query service beyond scoped `findEvidence`/`listEvidenceForCase` — API phase work (OD-5).
