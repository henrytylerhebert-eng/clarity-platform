# Canonical Payer Reference Review

## Review decision

The four operations profiles are suitable for synthetic customer discovery as
read-only configuration prompts. They are not yet suitable for backend
`PayerProfile` or `PlanProfile` persistence. Revenue-cycle / utilization-review
approval remains required for profile fields, profile-specific source
references, escalation language, and VA representation.

## Authority order

| Authority | Status | Use in this slice |
|---|---|---|
| Working code and `prisma/schema.prisma` | Canonical implementation | Defines the persisted payer, plan, coverage, benefits, and authorization nouns and enums. |
| `packages/domain-contracts` and accepted ADRs | Binding behavior | Defines evidence gates, verification states, disclaimers, human submission, and transition rules. |
| `docs/` workflow and governance documents | Current product and governance intent | Defines parallel financial work, review ownership, and synthetic/production boundaries. |
| `reference/` source packages | Read-only context | Useful for requirements and vocabulary; it does not override working implementation or accepted ADRs. |

## Crosswalk findings

| Canonical concept | Confirmed requirement | Current profile treatment | Gap before persistence |
|---|---|---|---|
| `PayerProfile` | Organization-owned payer identity, aliases, contacts, carve-out, historical timing and pend/denial memory | Local profile id, label, coverage family, prompts, version, and review status | Owner-approved legal name, aliases, contacts, carve-out, timing, and historical-memory fields |
| `PlanProfile` | Plan type, network relationship, benefit pattern, authorization pattern, exclusions, historical reimbursement, confidence, validation date | No plan-specific rule or reimbursement data is invented | Customer-specific plan records and source-backed validation |
| `InsuranceCoverage` | Case-linked coverage order, coverage type, source documents, human review, eligibility and benefits children | Synthetic projection only; no backend write | Current-patient source evidence and authenticated command path |
| Eligibility / benefits | Human verification, proof, timestamp, unresolved questions, benefit disclaimer | Walkthrough prompts only | Revenue-cycle-approved source references and live/manual workflow mapping |
| Authorization | Separate readiness lifecycle; human submits external action; no payment guarantee | Readiness mirror and profile escalation prompt | Owner-approved escalation language and command-backed workflow |
| VA representation | Shared enum has no VA value | Local VA profile over `OTHER`; explicitly visible as unresolved | Domain decision: durable enum/profile mapping and source authority |

## Profile review checklist

The walkthrough exposes the same checklist for each profile:

1. Profile fields: confirm required operational fields and ownership.
2. Source references: attach current, profile-specific source artifacts.
3. Escalation language: approve who receives unresolved payer questions and
   what may be said without implying a decision.
4. VA representation: decide whether VA is a durable coverage type, a payer
   profile, or a separate referral/eligibility pathway.

The current references reviewed are `prisma/schema.prisma`,
`packages/domain-contracts/src/benefits.ts`,
`docs/architecture/ADR-0009-manual-insurance-benefits-verification.md`, and
`docs/architecture/ADR-0010-authorization-readiness.md`.

## Discovery boundary

Customer walkthroughs may compare all four profiles and identify missing
workflow needs. A walkthrough does not validate payer policy, establish
eligibility, guarantee payment, approve authorization, or authorize a clinical
or placement decision. Notes must distinguish customer-reported practice,
prototype behavior, and owner-approved configuration.
