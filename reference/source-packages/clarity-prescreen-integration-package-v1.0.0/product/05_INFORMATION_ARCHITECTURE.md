# Information Architecture

## Primary navigation

1. **My Prescreens** — assigned, drafted, submitted, returned, waiting, completed.
2. **Start Prescreen** — rapid start and guided assessment.
3. **Central Intake** — incoming submissions, requests, review queues, routing.
4. **Packets** — requirements, documents, versions, readiness targets.
5. **Communications & Tasks** — open requests, deadlines, escalation, receipts.
6. **Facility Responses** — submissions, information requests, acceptance, decline, redirect.
7. **Transport & Custody** — plans, qualified providers, pickup, handoff, exceptions.
8. **Case Timeline** — source-linked, versioned, immutable material events.
9. **Configuration** — facility profiles, templates, transport providers, consent rules.
10. **Operational Trends** — aggregate cycle, wait, reassessment, communication, and handoff patterns.

## Selected-case workspace

The selected case header should always show:

- person display identity or protected token;
- current location;
- encounter owner;
- target destination/program;
- current prescreen phase;
- patient willingness;
- orientation summary with time;
- active legal/custody status;
- medical-screening status;
- packet readiness target;
- open blocker count;
- last material update and freshness;
- privacy banner and environment state.

## Case tabs

- Overview
- Prescreen
- Sources & Collateral
- Safety
- Medical
- Medications
- Legal & Consent
- Packet
- Communications
- Facility Review
- Transport & Custody
- Timeline

## Progressive disclosure

The field user first sees what is required now. Advanced or facility-specific questions appear when:

- an answer triggers them;
- a destination is selected;
- Central Intake requests them;
- the user opens the section intentionally.

## Status language

Use explicit states rather than percent-complete scores:

- Not started
- In progress
- Submitted
- Needs information
- Under review
- Waiting internally
- Waiting externally
- Review required
- Ready for named target
- Accepted
- Declined
- Redirected
- Cancelled
- Superseded
- Stale
- Unauthorized

## No-data states

- `No prescreen started`
- `No source provided`
- `Not assessed`
- `No document received`
- `No facility profile approved`
- `No qualified provider found`
- `No measurements found`

These states must never be replaced by implied negative findings.
