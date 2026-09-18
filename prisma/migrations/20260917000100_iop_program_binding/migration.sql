ALTER TABLE "IopSourceIntegration" ADD COLUMN "programId" TEXT;
UPDATE "IopSourceIntegration" SET "programId" = 'UNBOUND_SYNTHETIC_PROGRAM' WHERE "programId" IS NULL;
ALTER TABLE "IopSourceIntegration" ALTER COLUMN "programId" SET NOT NULL;
CREATE INDEX "IopSourceIntegration_organizationId_programId_active_idx" ON "IopSourceIntegration"("organizationId", "programId", "active");
