# Governance

Clarity supports qualified professionals; it does not replace them. These invariants bind all contributions. Detail: [HUMAN_APPROVAL_GATES](docs/governance/HUMAN_APPROVAL_GATES.md) · [AI_GOVERNANCE](docs/governance/AI_GOVERNANCE.md) · [PRODUCT_EVIDENCE_AND_DECISION_PROTOCOL](docs/governance/PRODUCT_EVIDENCE_AND_DECISION_PROTOCOL.md).

## Non-negotiable invariants (tested where implementable)

1. No autonomous clinical, legal, admission, discharge, placement, or authorization decisions.
2. Every material mutation creates an append-only audit event.
3. Source before summary; evidence requires human review before it supports approved output.
4. Contradictions and missing information stay visible; never silently resolved.
5. Financial readiness never blocks emergency clinical review.
6. Clinical urgency, operational readiness, placement readiness, and financial readiness stay **separate** — no opaque combined score.
7. Benefits quotes are never payment guarantees; the disclaimer is structurally attached.
8. Payer memory is labeled historical and unconfirmed for the current patient.
9. Statutory logic (Louisiana PEC/OPC/CEC, clocks) is configuration pending counsel review — never enforced as truth.
10. Agents draft; authorized humans send, submit, sign, and decide. No agent runs without a contract (tools allowlist, output schema, prohibited actions, human-review rule).

## Review gates for changes

- Clinical content → clinician sign-off. Legal/statutory content → counsel. Payer/benefits language → revenue-cycle review. Security-relevant changes → security review. Material architecture changes → a new ADR under `docs/decisions/` / `docs/architecture/`.
- Prompt changes go through `governance/prompt-approvals/` (directory created with the first approval artifact).

## Decision records

Architectural decisions: versioned ADRs. Open questions: [OPEN_DECISIONS](docs/decisions/OPEN_DECISIONS.md). Risks: [RISK_REGISTER](docs/decisions/RISK_REGISTER.md). Integration provenance: `docs/repository-audit/`.

## Evidence and status changes

Product, implementation, roadmap, release, and measurement claims follow [PRODUCT_EVIDENCE_AND_DECISION_PROTOCOL](docs/governance/PRODUCT_EVIDENCE_AND_DECISION_PROTOCOL.md). Do not promote status because an artifact exists, a UI is polished, an agent completed a summary, or work moved quickly. Status changes require evidence in the appropriate canonical record.
