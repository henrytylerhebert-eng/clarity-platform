-- The partial unique index cannot be represented by Prisma schema syntax.
-- It enforces the S2 admission invariant at the database boundary while
-- allowing a later admission after the prior episode is discharged or closed.
CREATE UNIQUE INDEX "Episode_active_source_case_key"
ON "Episode" ("sourceCaseId")
WHERE "status" = 'ACTIVE';
