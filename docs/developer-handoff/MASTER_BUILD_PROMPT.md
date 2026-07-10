---
status: Integrated — package original preserved; pointer document
owner: TBD
version: 1.0.0
last_integrated: 2026-07-10
source_artifacts:
  - reference/source-packages/clarity-ai-master-architecture-v0.2.0-partial/MASTER_BUILD_PROMPT.md (canonical text)
unresolved_conflicts: none
related_requirements: all
related_adrs: ADR-0001
---

# Master Build Prompt

The canonical build-prompt text is preserved unmodified at
`reference/source-packages/clarity-ai-master-architecture-v0.2.0-partial/MASTER_BUILD_PROMPT.md`. Use it verbatim when starting an implementation session, together with:

- `docs/developer-handoff/DEVELOPER_BRIEF.md` (repository-adapted brief)
- `docs/architecture/SYSTEM_ARCHITECTURE.md` and ADR-0001/ADR-0002
- `docs/repository-audit/06_UNRESOLVED_QUESTIONS.md` (things a build session must not assume)

## Core rules (restated for quick reference)

1. Source before summary. 2. Structured evidence before narrative. 3. Deterministic rules before model judgment. 4. Workflow before autonomous agents. 5. Human approval before external action. 6. Every material mutation creates an audit event. 7. Missing information remains visible. 8. Contradictions are not silently resolved. 9. Workstreams proceed in parallel. 10. Financial readiness cannot block emergency clinical review. 11. Historical payer memory cannot replace current-patient verification. 12. No opaque payer-weighted referral score. 13. All model outputs validate against schemas.
