# Clarity Bridge Safety

The durable mailbox at `agents/bridge/` is the only system of record. These
outbox files contain short wake references only.

- Outboxes are append-only.
- Agents must not write task bodies directly to outboxes.
- Messages must remain free of credentials, real PHI, and secrets.
- Human approval remains required for production, deployment, external
  integrations, and other irreversible actions.
