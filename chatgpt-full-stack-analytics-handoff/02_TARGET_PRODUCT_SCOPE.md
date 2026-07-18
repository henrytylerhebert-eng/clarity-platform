# Target Product Scope

## Product Thesis

Clarity should connect patient access orchestration to post-admission operating intelligence without collapsing clinical workflow, financial operations, and aggregate reporting into one unsafe data surface.

## End-to-End Product Spine

```text
Referral
-> Intake
-> Evidence review
-> Clinical, legal, financial, and operational readiness
-> Packet
-> Request broadcast
-> Facility response
-> Acceptance
-> Transport and custody
-> Admission handoff
-> Episode
-> Utilization review and concurrent review
-> Daily census and staffing burden
-> Documentation and quality events
-> Discharge and continuity
-> De-identified analytics
-> Approved stakeholder and agency reporting
```

## Product Modules

| Module | Primary purpose |
| --- | --- |
| Access Command Center | Referral-through-acceptance coordination |
| Admission Handoff | Convert an accepted case into a governed facility episode |
| Utilization Review | Reviews due, authorization risk, approved/denied days, documentation gaps |
| Hospital Operations | Admissions, discharges, census, patient days, occupancy, throughput |
| Clinical Documentation and Quality | Documentation completeness and quality/safety events |
| Staffing Operations | Actual/budget hours, agency use, overtime, observation burden |
| Financial and Payer Intelligence | Payer mix, revenue days, denial impact, contract assumptions |
| Executive Intelligence | Aggregate operating, access, quality, staffing, and financial trends |
| Regulatory Reporting | Approved, versioned, minimum-necessary jurisdictional submissions |
| Product Studio | Product evidence, decisions, release controls, and learning |

## Priority Metrics

Initial utilization-review metrics:

- approved days;
- denied days;
- denial rate;
- days at risk;
- authorization expiration risk;
- process-related denials;
- documentation-gap count;
- concurrent reviews due;
- payer/program/physician denial summaries.

Later operating metrics:

- admissions and discharges;
- patient days;
- average daily census;
- occupancy;
- average length of stay;
- payer mix;
- referral conversion;
- lost-referral reasons.

Later staffing and financial metrics:

- budget versus actual hours;
- agency hours and cost;
- one-to-one observation burden;
- labor per patient day;
- revenue days;
- projected and net projected revenue;
- denied-day adjustment;
- budget variance.

All improvement claims remain `Unknown` until baselines and measurements exist.

## Non-Goals for the First Slice

- Predictive denial scoring
- Autonomous authorization decisions
- Automated payer-portal operation
- Proprietary criteria replication
- Live payroll integration
- Multi-company benchmark marketplace
- Automated board narratives
- Direct governing-agency access
- Broad Product Studio mutation or deployment control

