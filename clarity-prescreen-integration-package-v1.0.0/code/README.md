# TypeScript Reference Implementation

This is proposed, dependency-free reference code. It demonstrates deterministic prescreen behavior and does not modify the live Clarity repository.

It includes:

- orientation and willingness pathway derivation;
- encounter state transitions;
- target-specific packet readiness;
- transport category and provider qualification;
- consent-authority rule evaluation;
- immutable assessment attestation/supplement behavior;
- idempotent in-memory command handling;
- event envelope construction.

Run:

```bash
npm install
npm test
```

Before repository integration, Codex must map these concepts to existing error classes, actor types, Zod conventions, service gateways, audit helpers, and Prisma adapters.
