---
status: Proposed output specification
version: 0.1.0
---

# Discovery Output Specification

## Required Package

Every completed WDP session produces these artifacts, even when some contain
explicit `Unknown` or `Owner Decision Required` entries:

1. Discovery session header and scope.
2. Append-only discovery ledger.
3. Terminology glossary.
4. Normalized workflow and stage map.
5. Actor and role matrix.
6. Decision matrix.
7. Source and evidence map.
8. Data ownership and lifecycle map.
9. Readiness matrix and dependency map.
10. Exception matrix.
11. Correction and supersession matrix.
12. Audit event catalog.
13. Governed event catalog.
14. Domain object mapping.
15. Unresolved questions and owner decisions.
16. Deterministic synthetic fixture readiness assessment.
17. Focused implementation test scenarios.

## Output Metadata

Each output MUST carry:

- discovery ID;
- workflow name and version;
- status;
- owner;
- date/time and timezone;
- data boundary;
- source/related records;
- classifications used;
- supersession references;
- reviewers and acceptance state.

## Traceability Matrix

| Requirement | Discovery ID(s) | Output artifact | Canonical destination | Implementation file(s) | Verification |
|---|---|---|---|---|---|
| `[Requirement]` | `[DL-ID]` | `[Output]` | `[ADR/workflow/contract]` | `[Path or Pending]` | `[Test/evidence]` |

No implementation requirement is complete without a discovery link and a
canonical destination.

## Canonical Routing

| Discovery output | Route after acceptance |
|---|---|
| Workflow requirement | `docs/workflows/` |
| Architecture or boundary decision | `docs/architecture/ADR-*.md` |
| Open security/owner decision | `docs/decisions/OPEN_DECISIONS.md` or a dedicated decision packet |
| Domain rule/contract | `packages/domain-contracts/` plus focused tests |
| Persistence requirement | `prisma/schema.prisma` and migration decision record |
| Evidence/review requirement | `docs/clinical/`, `docs/legal/`, payer docs, ADR-0008, or evidence contracts |
| Readiness requirement | Existing readiness contract/workflow or an explicit decision for a new dimension |
| Implementation status | `IMPLEMENTATION_STATUS.md` after verification |
| Agent handoff | `docs/developer-handoff/` with discovery IDs |

The WDP package remains the interview traceability layer. Accepted requirements
must be promoted into the more specific canonical record rather than copied
indefinitely.
