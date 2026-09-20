# Runtime Wiring Map

## Governing write path

```text
HUMAN / AUTHORIZED EXTERNAL SOURCE
            │
            ▼
         COMMAND
            │
            ▼
      DOMAIN SERVICE
       │          │
       ▼          ▼
   AUTHORITY     RULES
       │          │
       └────┬─────┘
            ▼
        REPOSITORY
            │
      ┌─────┴─────┐
      ▼           ▼
 CANONICAL      GOVERNED
   STATE          EVENT
      │           │
      └─────┬─────┘
            ▼
        READ MODEL
            │
  ┌─────────┼───────────┬─────────┬────────────┐
  ▼         ▼           ▼         ▼            ▼
 WORK     HISTORY     EXPLORE    FLOW      ASK CLARITY
```

## Governing read/trace path

```text
User question / UI selection
          │
          ▼
       Query
          │
          ▼
Governed read model / projection
          │
          ├── source facts
          ├── decisions
          ├── evidence
          ├── provenance
          ├── effective time
          └── derivation trace
          │
          ▼
     Explanation / view
```

## AI path

```text
User
 │
 ▼
Ask Clarity
 │
 ├── Query
 ├── Trace
 └── Candidate proposal
       │
       ▼
 human review / available-command projection
       │
       ▼
 governed Command
```

The model never bypasses the command gateway.


