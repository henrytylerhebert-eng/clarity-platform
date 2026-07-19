# POC Domain Review And Contract Approval

## Decision

**Approved for synthetic proof of concept and customer discovery.**

This approval covers the shared journey dependency vocabulary, the component
crosswalk, the local CIA Nursing Stage 2 workspace, and the local case-owned
admission episode adapter described in this package.

It does **not** approve production clinical use, legal reliance, facility
admission criteria, payer policy enforcement, level-of-care automation,
authentication, real-patient persistence, or autonomous decisions.

| Field | Decision |
|---|---|
| Owner | Tyler / product owner |
| Approval scope | Synthetic/local POC and customer discovery |
| Data boundary | Synthetic only |
| Runtime boundary | Local AppState and existing bounded backend contracts |
| Production status | Not approved |
| Domain-owner review | Required before configured rules are presented as authoritative |

## Contract Review

The crosswalk is approved as the coordination map for this prototype. The
Journey Monitor and Dependency Map remain derived projections. Source
workspaces own edits, provenance, review state, corrections, and audit history.

The shared contract is approved with these invariants:

- Prescreen facts are separate from human triage and disposition.
- Nursing assessment is a source-linked RN record and does not issue medical,
  medication, observation, legal, or admission orders.
- Medical screening, medical clearance, medical necessity, psychiatrist
  acceptance, arrival/handoff, and admission episode remain separate.
- Financial and authorization work remains parallel and cannot block emergency
  clinical review.
- Unknown, not assessed, unable to obtain, declined, and conflicting states do
  not count as complete.
- Corrections append a new version and preserve prior source records and audit
  history.
- Product gaps remain visible as `Not built` and never count as patient
  progress.

The POC also uses a local operations payer configuration adapter for Medicare,
Medicaid, VA, and commercial profile families. These profiles are versioned
workflow prompts, not payer policy. VA remains local as a profile over the
existing `OTHER` coverage category because the shared persistence enum has no
approved VA value; this is an explicit contract decision still pending owner
review.

The canonical payer reference comparison and persistence gap register is in
`20_CANONICAL_PAYER_REFERENCE_REVIEW.md`.

## Domain-Owner Review Register

These are review gates for customer discovery and later configuration. The
prototype may display and test the workflow around them, but it must not claim
that the rules are clinically, legally, contractually, or operationally
authoritative until an appropriate owner approves them.

| Domain | What needs owner review | Current status | Evidence required before authoritative configuration |
|---|---|---|---|
| Clinical | RN Stage 2 required fields, safety interrupts, reconciliation rules, scope-of-practice wording | Pending domain owner | Named clinical owner, approved field/gate matrix, reviewed synthetic scenarios |
| Legal | Legal-status source verification, custody/handoff wording, notification prompts | Pending domain owner | Named legal owner, jurisdiction/profile review, approved wording and scenarios |
| Facility | Acceptance authority, medical-clearance policy, lab standards, exclusionary/inclusionary criteria, handoff requirements | Pending facility owner | Facility profile, policy references, authorized approver, facility walkthrough |
| Payer | Benefits and authorization timing, documentation expectations, escalation language, Medicare/Medicaid/VA/commercial profile content | Pending payer/UR owner | Payer or UR profile, source references, parallel-lane acceptance |
| Level of care | Configured options, rationale fields, review authority, no-score/no-automation boundary | Pending clinical/UR owner | Approved option set, rationale template, human-review workflow |

## Discovery Use

For customer discovery, reviewers can trace one synthetic case from referral to
Stage 2, admission episode, and post-admission UR projection. Discovery notes
must distinguish:

1. What the customer says the workflow requires.
2. What the current synthetic prototype demonstrates.
3. What remains a domain decision or production engineering gate.

No customer statement, screenshot, or walkthrough is evidence of clinical,
legal, payer, facility, or level-of-care validity.

## Follow-Up Decision Packet

The next approval needed is not another broad product approval. Each domain
owner should review the register above and approve or revise only the rules
within that owner's authority. The resulting profiles should be versioned and
linked to the source artifacts used by the workspace evaluator.
