# Codex Quickstart — Clarity MH

## Use this package in Codex

1. Unzip this package.
2. Copy the full folder into your target repo, ideally at:

```bash
mkdir -p docs/clarity-mh-architecture
cp -R clarity-mh-codex-architecture-package/* docs/clarity-mh-architecture/
```

3. Open Codex in the target repo.
4. Paste `CODEX_MASTER_PROMPT.md` first.
5. Tell Codex:

```text
Read docs/clarity-mh-architecture/CODEX_MASTER_PROMPT.md and the referenced architecture files. Do not code yet. First inspect the repository and return the repo inspection report plus the smallest safe implementation plan.
```

6. After the inspection report, approve only Phase 1 unless you intentionally want Codex to go further.

## Recommended first Codex task

```text
Implement Phase 1 only: the Clarity MH data spine, validation schemas, custody ledger hashing utility, demo seed data, and guardrail tests. Do not build external integrations. Do not add real PHI. Do not use proprietary criteria language. Keep all AI outputs as drafts requiring clinician review.
```

## Recommended second Codex task

```text
Build the basic case workflow UI: cases list, new intake case, case dashboard, assessment draft screen, medical necessity snapshot screen, legal instrument lifecycle screen, routing screen, and referral packet preview. Use demo data and the Phase 1 domain model. Keep clinical and financial lanes separate.
```

## Recommended third Codex task

```text
Connect the ePEC prototype logic to the production domain model: OPC draft, PEC draft/sign/seal, transmission, acceptance/decline receipt, CEC draft, custody ledger verification, and legal instrument audit trail. Keep statutory deadlines configurable and counsel-validation gated.
```

## Do not let Codex start with

- AI chatbot
- statewide bed registry
- proprietary payer criteria engine
- real EHR integration
- real PHI
- final legal attestation language
- hard-coded Louisiana statutory clocks without counsel validation

## Good first milestone

A demo user can create a case, document risk and functional findings, generate a draft medical-necessity snapshot, create a draft legal instrument, hash-seal it, transmit it to a mock facility, receive an accept/decline response, and verify the custody ledger.
