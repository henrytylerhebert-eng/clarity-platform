/*
  Warnings:

  - Added the required column `organizationId` to the `Authorization` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Authorization" ADD COLUMN     "organizationId" TEXT NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Authorization_organizationId_caseId_idx" ON "Authorization"("organizationId", "caseId");
