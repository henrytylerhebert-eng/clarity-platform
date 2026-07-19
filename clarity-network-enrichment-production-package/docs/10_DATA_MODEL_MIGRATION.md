# Data Model and Migration

## Staged strategy

1. Add enrichment-only tables without changing current organization/facility ownership.
2. Link candidates to current canonical IDs through nullable references.
3. Backfill no production data during the first slice.
4. Add controlled approval commands.
5. Add canonical directory extensions only after current entity models are mapped.
6. Add RLS and cross-tenant denial tests before production data.

## Required persistence capabilities

- immutable enrichment runs and evidence;
- versioned candidates and review decisions;
- idempotency records;
- optimistic concurrency;
- audit events in the same transaction as decisions;
- supersession links;
- field-level freshness policy version;
- outbox for downstream projections.

## Data migration rules

- Never replace existing human-confirmed values during backfill.
- Import legacy records as `CANDIDATE` unless a documented verification source exists.
- Preserve original raw display values and normalized values separately.
- Maintain aliases and merge history.
- Do not automatically merge duplicates; create review tasks.
- Rollback removes new projections, not historical audit records.

See `prisma/proposed-network-enrichment.prisma` and `sql/rls-policies.sql`.
