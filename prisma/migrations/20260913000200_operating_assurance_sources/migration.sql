-- TWP-OA-002 part 2: assurance source, tenant-document, and expectation records.
CREATE TABLE "AssuranceSourceReference" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "assuranceCaseId" TEXT NOT NULL,
  "sourceFamilyKey" TEXT NOT NULL,
  "versionLabel" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "authorityClass" "AssuranceAuthorityClass" NOT NULL,
  "citation" TEXT NOT NULL,
  "sourceUri" TEXT,
  "effectiveAt" TIMESTAMP(3),
  "currentness" "AssuranceSourceCurrentness" NOT NULL,
  "rightsStatus" "AssuranceSourceRightsStatus" NOT NULL,
  "supersededBySourceId" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssuranceSourceReference_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AssuranceSourceReference_organizationId_id_key" ON "AssuranceSourceReference"("organizationId", "id");
CREATE UNIQUE INDEX "AssuranceSourceReference_assuranceCaseId_sourceFamilyKey_versionLabel_key" ON "AssuranceSourceReference"("assuranceCaseId", "sourceFamilyKey", "versionLabel");
CREATE INDEX "AssuranceSourceReference_organizationId_assuranceCaseId_currentness_idx" ON "AssuranceSourceReference"("organizationId", "assuranceCaseId", "currentness");
ALTER TABLE "AssuranceSourceReference" ADD CONSTRAINT "AssuranceSourceReference_case_fkey" FOREIGN KEY ("organizationId", "assuranceCaseId") REFERENCES "AssuranceCase"("organizationId", "id") ON DELETE CASCADE ON UPDATE RESTRICT;

CREATE TABLE "AssuranceDocumentReference" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "assuranceCaseId" TEXT NOT NULL,
  "kind" "AssuranceReferenceKind" NOT NULL,
  "referenceKey" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "versionLabel" TEXT NOT NULL,
  "locator" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssuranceDocumentReference_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AssuranceDocumentReference_assuranceCaseId_kind_referenceKey_versionLabel_key" ON "AssuranceDocumentReference"("assuranceCaseId", "kind", "referenceKey", "versionLabel");
CREATE INDEX "AssuranceDocumentReference_organizationId_assuranceCaseId_idx" ON "AssuranceDocumentReference"("organizationId", "assuranceCaseId");
ALTER TABLE "AssuranceDocumentReference" ADD CONSTRAINT "AssuranceDocumentReference_case_fkey" FOREIGN KEY ("organizationId", "assuranceCaseId") REFERENCES "AssuranceCase"("organizationId", "id") ON DELETE CASCADE ON UPDATE RESTRICT;

CREATE TABLE "AssuranceEvidenceExpectation" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "assuranceCaseId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "requiredKeys" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssuranceEvidenceExpectation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AssuranceEvidenceExpectation_organizationId_id_key" ON "AssuranceEvidenceExpectation"("organizationId", "id");
CREATE UNIQUE INDEX "AssuranceEvidenceExpectation_assuranceCaseId_code_key" ON "AssuranceEvidenceExpectation"("assuranceCaseId", "code");
CREATE INDEX "AssuranceEvidenceExpectation_organizationId_assuranceCaseId_idx" ON "AssuranceEvidenceExpectation"("organizationId", "assuranceCaseId");
ALTER TABLE "AssuranceEvidenceExpectation" ADD CONSTRAINT "AssuranceEvidenceExpectation_case_fkey" FOREIGN KEY ("organizationId", "assuranceCaseId") REFERENCES "AssuranceCase"("organizationId", "id") ON DELETE CASCADE ON UPDATE RESTRICT;
