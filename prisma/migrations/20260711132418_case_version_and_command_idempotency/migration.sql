-- AlterTable
ALTER TABLE "BehavioralHealthCase" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "CommandIdempotencyRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "commandType" TEXT NOT NULL,
    "caseId" TEXT,
    "resultVersion" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommandIdempotencyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommandIdempotencyRecord_organizationId_createdAt_idx" ON "CommandIdempotencyRecord"("organizationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommandIdempotencyRecord_organizationId_idempotencyKey_key" ON "CommandIdempotencyRecord"("organizationId", "idempotencyKey");
