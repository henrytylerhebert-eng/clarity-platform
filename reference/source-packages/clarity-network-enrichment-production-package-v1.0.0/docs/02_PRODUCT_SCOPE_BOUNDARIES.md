# Product Scope and Boundaries

## Primary user

Network data reviewer or central-intake operations lead responsible for keeping the Clarity directory accurate enough for routing and handoff preparation.

## Primary workflow

1. Request research for an organization, location or program.
2. Resolve the correct real-world entity.
3. Collect field candidates from approved sources.
4. Attach field-level evidence and freshness metadata.
5. Surface conflicts and unresolved fields.
6. Route sensitive fields to the correct reviewer.
7. Approve, reject or supersede each field through a controlled command.
8. Publish approved values to role-scoped network profiles.
9. Reverify values on policy-driven schedules.

## In scope

- Healthcare organizations, facilities, programs, locations and public business contacts.
- Behavioral-health, acute-care, post-acute, rehabilitation, coroner, transport and community-resource records.
- Public payer-participation statements with strict disclaimers.
- Candidate facility-admission and transport profiles.
- Source authority, provenance, freshness, conflict and review logic.
- Controlled canonical updates and audit contracts.

## Out of scope for the first production slice

- Autonomous admission, placement, legal, clinical, payer or transport decisions.
- Current-patient eligibility or benefit verification.
- Real-time bed availability without an approved live source.
- Unrestricted crawling of the public web.
- Private personal contact information or personal social media.
- PHI.
- Automatic activation of facility criteria.
- Cross-tenant sharing without explicit authority and purpose limitation.

## Operational use states

| State | Meaning |
|---|---|
| `RESEARCH_ONLY` | May be viewed by reviewers but not used by routing logic. |
| `REQUIRES_REVIEW` | Candidate can enter an authorized review queue. |
| `APPROVED_REFERENCE` | Approved directory information; still subject to freshness. |
| `APPROVED_OPERATIONAL` | Approved for the explicitly named operational use and scope. |
| `SUSPENDED` | Temporarily unavailable due to conflict, staleness or incident. |
| `RETIRED` | Historical only. |
