# Access Scenario Registry v0.1

**Status:** PROPOSED_ARCHITECTURE using existing source fixtures.

The source fixtures are useful development evidence. Their legal, clinical, transport, consent, or facility-specific expected values remain **SOURCE_HYPOTHESIS** unless separately approved by a qualified reviewer.

## Initial registry

| Canonical ID | Existing fixture | Scenario | Journey phase | Canonical use |
|---|---|---|---|---|
| ACCESS-SC-001 | SYN-01 | Willing Oriented | Prescreen | Test willingness/orientation and human-review boundary |
| ACCESS-SC-002 | SYN-02 | Willing Not Oriented | Prescreen | Test failed orientation gate without overconclusion |
| ACCESS-SC-003 | SYN-03 | Nonopposed Unknown Orientation | Prescreen | Test Unknown preservation |
| ACCESS-SC-004 | SYN-04 | Opposed PEC | Qualified Review | Test legal/emergency review routing |
| ACCESS-SC-005 | SYN-05 | OPC Law Enforcement Pickup | Qualified Review | Test custody/legal branch |
| ACCESS-SC-006 | SYN-06 | CEC Transfer | Transfer/Handoff | Test destination/handoff requirements |
| ACCESS-SC-007 | SYN-07 | Intoxication Reassessment | Prescreen | Test reassessment + uncertainty |
| ACCESS-SC-008 | SYN-08 | Minor Parental Pathway | Prescreen | Test configured consent/relationship evidence |
| ACCESS-SC-009 | SYN-09 | Minor Sixteen Voluntary | Prescreen | Test age-specific review |
| ACCESS-SC-010 | SYN-10 | Missing Packet Items | Facility Review | Test target-specific readiness gaps |

## Next proposed scenarios

These should not be treated as verified source fixtures until authored and reviewed.

### ACCESS-SC-011 — Abrupt confusion / medical-instability concern
Candidate source: current `Geriatric Demo B`.

Purpose:
- prove medical-stabilization precedence;
- preserve psychiatric information capture;
- prevent placement progression while appropriate medical review is unresolved.

### ACCESS-SC-012 — Youth self-harm disclosure / guardian unavailable
Candidate source: current `Youth Demo C`.

Purpose:
- preserve unknown guardian/consent status;
- require missing collateral work;
- prevent the system from converting "guardian unavailable" into a legal conclusion.

## Fixture principle

A canonical scenario should test the whole system response, not one function.

Each scenario should define:

- initial facts;
- journey phase;
- applicable rules;
- possible pathways;
- blocked transitions;
- missing information;
- required work;
- role ownership;
- decision authority;
- prohibited conclusions;
- expected audit/provenance;
- expected user-facing projection.

## Do not duplicate fixture families

Current fixture sources should be reconciled into this registry:

- Prescreen synthetic fixtures;
- `data/synthetic-cases/`;
- `app/src/domain/seed.ts`;
- `data/mock-use-cohorts/`;
- CLPR practice scenarios.

They may remain physically separate for different test harnesses, but they should point back to one canonical scenario identity when they represent the same domain case.
