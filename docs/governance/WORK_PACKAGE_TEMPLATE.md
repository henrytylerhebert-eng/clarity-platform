# Work Package Template

Per the [AI Operating Model Plan](AI_OPERATING_MODEL_PLAN.md) (Stage 0.3), every
bounded implementation slice — whether done by a human, T1, or any other
contributor — states its scope, prohibited paths, and required acceptance evidence
before work starts. Copy the block below into the work's tracking issue, PR
description, or planning doc and fill it in.

```text
# Work Package: <name>
Approved by: <owner> on <date>     ADR (if shared contract touched): <ADR-00NN | none>
Goal: <one sentence>
In scope — files/packages: <explicit list>
Prohibited paths (require an ADR): prisma/schema.prisma · domain-contracts enum
  arrays · new case-repository gateways · new api-service routes · cross-package
  refactors
Acceptance evidence required:
  [ ] tests written AND run this session — exact counts: ____
  [ ] npm run lint · npm run typecheck · npm test · npx prisma validate — all pass
  [ ] zero synthetic residue in clarity_dev
  [ ] R1 verdict attached, including its "not checked" list
  [ ] docs updated (implementation doc + test manifest with honest gaps)
Explicitly NOT claimed: <list>
Open questions / blocked on: <list>
```

The "R1 verdict attached" line applies once R1 (the Invariant Verifier role, Stage 1)
exists; until then, leave it unchecked and say so under "Open questions / blocked on."
