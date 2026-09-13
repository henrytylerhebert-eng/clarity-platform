-- TWP-OA-002 part 4: assurance source conflict history.
CREATE TABLE "AssuranceSourceConflict" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "assuranceCaseId" TEXT NOT NULL,
  "leftSourceId" TEXT NOT NULL,
  "rightSourceId" TEXT NOT NULL,
  "status" "AssuranceConflictStatus" NOT NULL DEFAULT 'OPEN',
  "note" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedBy" TEXT,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "AssuranceSourceConflict_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AssuranceSourceConflict_organizationId_assuranceCaseId_status_idx" ON "AssuranceSourceConflict"("organizationId", "assuranceCaseId", "status");
ALTER TABLE "AssuranceSourceConflict" ADD CONSTRAINT "AssuranceSourceConflict_case_fkey" FOREIGN KEY ("organizationId", "assuranceCaseId") REFERENCES "AssuranceCase"("organizationId", "id") ON DELETE CASCADE ON UPDATE RESTRICT;
