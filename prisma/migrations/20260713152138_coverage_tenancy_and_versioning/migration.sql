/*
  Warnings:

  - Added the required column `organizationId` to the `InsuranceCoverage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "InsuranceCoverage" ADD COLUMN     "organizationId" TEXT NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "InsuranceCoverage_organizationId_caseId_idx" ON "InsuranceCoverage"("organizationId", "caseId");
