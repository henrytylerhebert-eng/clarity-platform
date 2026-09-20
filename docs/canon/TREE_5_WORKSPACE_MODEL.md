# Tree 5.1 — Crisis Ops Workspace Model v0.1

**Inheritance:** Tree 4 is locked and visually proven. Tree 5 consumes it.

## Controlling question

> What information does an operator need to scan across Cases to know which Case deserves attention and why, before opening it?

## Primary surface: Work

The traditional interface remains Clarity's primary operating surface.

The workspace model is:

```text
Cases
  ↓
Case
  ↓
Current state
  ↓
What needs attention
  ↓
Suggested next work
  ↓
Detailed domains
```

Not:

```text
many peer workspaces
  ↓
user interprets architecture
```

## Cases scan

The Cases surface must allow an authorized operator to answer quickly:

- Which Cases are in my authorized scope?
- Which deserve attention?
- Why?
- What is waiting?
- What is actionable?
- What changed since I last looked?

The Cases scan should not invent:

- clinical priority;
- causal blame;
- assignment;
- patient identity outside authorized disclosure;
- one universal severity/readiness score.

## Case workspace

Canonical Case navigation:

- Overview
- Intake
- Clinical
- Legal
- Coverage / Authorization
- Placement / Handoff
- History

Contextual representations:

- Work
- History
- Explore

Flow is a cross-Case operational representation when governed cross-Case query support exists.

## Overview order

1. Case context/header
2. Current journey position
3. Current disposition
4. What needs attention
5. Suggested next work
6. Compact workstream/lane states
7. relevant plan/transition status
8. Details & source evidence

## Attention hierarchy

Primary:

1. progression blockers;
2. review gates;
3. external waits;
4. warnings / source contradictions;
5. time-sensitive obligations.

De-emphasize:

- satisfied items;
- not-applicable items;
- technical provenance unless requested.

## Suggested next work

Language stays non-binding.

- Suggested ≠ Assigned
- Candidate ≠ Task
- Role hint ≠ assignment
- AI suggestion ≠ authority

## Workstream/lane rule

A blocked lane does not automatically mean the entire Case is blocked.

Phase, lane state, and disposition remain separate concepts.

## Case header

Show only safe, governed context:

- Case key / permitted person reference;
- journey phase;
- disposition;
- facility/scope;
- last refresh/version as secondary metadata.

Do not place local demo identity next to governed data.

## Why / Evidence / History / Explore

A user should be able to move progressively:

```text
What is happening?
      ↓
Why?
      ↓
How do you know?
      ↓
What changed?
      ↓
What is connected?
```

without leaving the same Case context.

## Tree 5.1 completion gate

A new operator should be able to understand within ~10 seconds:

- where Cases live;
- which Case deserves attention;
- where a selected Case is in the journey;
- what requires attention;
- what appears to be next.

This is a usability target, not a verified measurement until tested with users.


