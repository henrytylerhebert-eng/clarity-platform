---
status: Integrated draft
owner: TBD (requires compliance review)
version: 1.0.0
last_integrated: 2026-07-10
source_artifacts:
  - MASTER_ARCHITECTURE.md §9, §17, §19 (partial package)
  - MASTER_BUILD_PROMPT.md core rules (partial package)
  - reference/source-packages/clarity-mh-architecture/docs/compliance/clinical-safety-guardrails.md
  - app/src/domain/guardrails.ts (implemented)
unresolved_conflicts: none
related_requirements: REQ-008, REQ-014
related_adrs: ADR-0001
---

# Human Approval Gates

Every material output crosses a qualified-human gate before it can support downstream action. These gates are architectural invariants, not UI conveniences.

| Gate | What the human does | What the system may not do |
|---|---|---|
| Evidence review | Approve, correct, reject, or request clarification on each candidate evidence item | Use unapproved/rejected evidence in approved output |
| Insurance extraction | Review extracted coverage fields | Advance eligibility/benefits on unreviewed fields |
| Clinical drafts | Qualified reviewer approves necessity/summary drafts | Emit prohibited determinations (guardrail-blocked) |
| Legal instruments | Qualified signer executes and attests | Declare a hold valid or authorize transfer |
| Packet | Approver versions and approves before export | Transmit unapproved packets |
| Communications | Authorized human sends | Auto-send any external message |
| Authorization | Authorized human records/initiates external action | Submit to a payer autonomously |
| Placement | Charge-nurse decision final; overrides need documented reason | Auto-assign a bed |
| Custody | Human confirms handoff parties/authority | Close a case with missing handoff data |

Drafts are always labeled draft vs. approved, with reviewer, source links, and rule/prompt/model versions visible (UI musts, §23).
