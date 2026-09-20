# Ask Clarity / AI Architecture v1.0

## Purpose

AI makes the governed system easier to query, trace, compare, and operate.

AI does not become the source of clinical, legal, payer, placement, or discharge truth.

## Interaction model

```text
Selection / question
      ↓
Context assembly
      ↓
Query / Trace
      ↓
Governed evidence + projections
      ↓
Structured answer
      ↓
Optional candidate proposal
      ↓
Human review
      ↓
Available governed command
```

## Allowed early capabilities

- natural-language retrieval;
- explain derived state;
- compare two time points;
- trace evidence/provenance;
- summarize changes;
- identify missing/unknown evidence;
- surface candidate attention;
- create clearly labeled non-binding proposal.

## Not yet allowed

- direct database writes;
- autonomous clinical decisions;
- autonomous discharge;
- autonomous placement/acceptance;
- autonomous legal status changes;
- autonomous payer decisions;
- causal blame from chronology;
- universal risk/readiness score used as authority.

## Contextual actions

Actions should depend on selected object.

Examples:

**Barrier**
- Explain
- Show source
- Show history
- Show what it blocks
- Compare before/after

**Decision**
- Show evidence considered
- Show superseded decision
- Show downstream effects

**Time interval**
- Summarize changes
- Show decisions
- Show new barriers
- Show resolved barriers

Selection supplies context, not authority.

## Commitment boundary

Preferred pattern:

> AI interpretation → candidate → evidence → human review → governed command.

Never:

> AI interpretation → database.


