# Verification

Verification date: 2026-07-19

## Commands run

```bash
npm run check
```

Result:

- TypeScript compilation: passed.
- Node test runner: 11 tests passed, 0 failed.
- Synthetic entity-resolution evaluation: 12 scenarios passed, 0 failed.

Additional validation:

- All JSON files under `contracts/`, `fixtures/`, and `examples/` parsed successfully.

## What this proves

The standalone reference implementation compiles and its included deterministic tests pass in the artifact environment.

## What this does not prove

- Compatibility with the live Clarity repository.
- Acceptance of ADR-0012.
- Production identity, tenancy, RLS, hosting, observability, or source integrations.
- Real-world enrichment accuracy.
- Clinical, legal, payer, transport, or facility-policy approval.

Codex must run the live repository's own verification suite after integration.
