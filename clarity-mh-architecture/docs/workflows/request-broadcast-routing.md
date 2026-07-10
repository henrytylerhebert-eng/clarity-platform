# Request-Broadcast Routing

## Why not build a bed registry first

Traditional registries fail when facilities do not maintain live census data. Stale bed counts destroy trust.

The better MVP is a request-broadcast model:

> Send a complete patient packet to eligible facilities and make them respond to a live case.

## Core workflow

1. Case reaches packet-ready state.
2. System maps patient needs to facility capability profile.
3. User selects eligible facilities or recommended broadcast group.
4. Packet is transmitted.
5. Facilities respond with accept, decline, or request more info.
6. System tracks response time, reason codes, and next best routing options.

## Facility capability profile

Fields:

- facility name
- program types accepted
- adult/adolescent/child/geriatric
- male/female/nonbinary rooming constraints
- acuity limits
- involuntary status accepted
- substance use / detox capacity
- medical exclusions
- payer accepted
- Medicaid MCO accepted
- transportation constraints
- ADA/isolation capacity
- average response time
- average acceptance rate
- last verified date

## Matching factors

- age group
- legal status
- risk level requiring supervision
- medical suitability
- payer
- unit/program type
- bed/milieu safety
- distance/transport
- prior decline history
- receiver-specific packet requirements

## Response design

Facility response options:

- Accept
- Decline
- Request more info
- Hold pending clinical review
- Hold pending insurance review

Reason codes are mandatory on decline.

## Analytics

Track:

- broadcast-to-first-response time
- broadcast-to-acceptance time
- decline reasons by facility
- missing-document requests
- payer-related declines
- medical exclusion declines
- legal-documentation declines
- conversion by referral source

## Integration posture

Clarity can integrate with external referral systems later. The Clarity differentiator is not raw bed listing. It is the completeness, legality, and custody of the packet being routed.
