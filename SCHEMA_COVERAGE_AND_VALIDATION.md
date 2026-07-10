# Schema Coverage and Validation Status

## 1. Foundation schema

The foundation schema covers:

- organizations
- users and roles
- patient tokens
- cases and parallel workstream statuses
- source documents
- evidence
- human reviews
- legal status
- medical necessity
- rules
- payer and plan profiles
- subscribers and coverage
- eligibility
- benefits
- authorization
- patient financial education
- facilities and referrals
- custody
- audit

## 2. Expanded target schema

The target draft additionally covers:

- workflow tasks
- case summaries
- prompt records
- agent runs
- knowledge sources
- citations
- rule evaluations
- referral packets
- packet items
- facility matches
- communications
- decision records
- retrospective reviews
- prioritization assessments
- payer contact events
- contract rates
- claim outcomes
- integration endpoints

## 3. Required developer validation

Run inside the actual repository:

```bash
pnpm prisma format
pnpm prisma validate
pnpm prisma generate
pnpm prisma migrate dev --name initial_clarity_domains
```

Then review:

- required versus optional fields
- delete behavior
- cascading relationships
- indexes
- unique constraints
- tenant keys
- personally identifiable data strategy
- money and percentage data types
- time-zone handling
- audit immutability
- versioning
- array-field portability
- JSON fields that should become normalized tables
- naming conventions
- migration reversibility

## 4. Expected schema revisions

The developer may need to revise:

- relation names
- reverse relation fields
- scalar-list defaults
- identifier encryption representation
- money representation
- enum growth strategy
- cross-organization sharing model
- patient identity vault design
- soft-delete or archival strategy
- event-store versus audit-table design
- knowledge chunk storage
- vector indexing extension
- Prisma support for selected database features

## 5. Validation acceptance criteria

- schema formats
- schema validates
- client generates
- clean database migration succeeds
- rollback or reset path tested
- seed script runs
- tenant-isolation tests pass
- core workflow fixture loads
- no real patient data present
- all sensitive fields documented
- all material mutations create an audit event through the service layer

## 6. Important limitation

A valid Prisma schema does not prove the product is secure, clinically safe, legally correct, or compliant. It proves only that the schema and database client meet the selected technical constraints.
