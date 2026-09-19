-- AlterEnum
ALTER TYPE "CaseStatus" ADD VALUE 'REVIEW_IN_PROGRESS';

-- RenameForeignKey
ALTER TABLE "AssuranceApplicabilityDecision" RENAME CONSTRAINT "AssuranceApplicabilityDecision_case_fkey" TO "AssuranceApplicabilityDecision_organizationId_assuranceCas_fkey";

-- RenameForeignKey
ALTER TABLE "AssuranceDocumentReference" RENAME CONSTRAINT "AssuranceDocumentReference_case_fkey" TO "AssuranceDocumentReference_organizationId_assuranceCaseId_fkey";

-- RenameForeignKey
ALTER TABLE "AssuranceEvaluation" RENAME CONSTRAINT "AssuranceEvaluation_case_fkey" TO "AssuranceEvaluation_organizationId_assuranceCaseId_fkey";

-- RenameForeignKey
ALTER TABLE "AssuranceEvidenceExpectation" RENAME CONSTRAINT "AssuranceEvidenceExpectation_case_fkey" TO "AssuranceEvidenceExpectation_organizationId_assuranceCaseI_fkey";

-- RenameForeignKey
ALTER TABLE "AssuranceEvidenceSubmission" RENAME CONSTRAINT "AssuranceEvidenceSubmission_case_fkey" TO "AssuranceEvidenceSubmission_organizationId_assuranceCaseId_fkey";

-- RenameForeignKey
ALTER TABLE "AssuranceEvidenceSubmission" RENAME CONSTRAINT "AssuranceEvidenceSubmission_expectation_fkey" TO "AssuranceEvidenceSubmission_organizationId_expectationId_fkey";

-- RenameForeignKey
ALTER TABLE "AssuranceParticipantAssignment" RENAME CONSTRAINT "AssuranceParticipantAssignment_case_fkey" TO "AssuranceParticipantAssignment_organizationId_assuranceCas_fkey";

-- RenameForeignKey
ALTER TABLE "AssuranceReviewDecision" RENAME CONSTRAINT "AssuranceReviewDecision_case_fkey" TO "AssuranceReviewDecision_organizationId_assuranceCaseId_fkey";

-- RenameForeignKey
ALTER TABLE "AssuranceReviewDecision" RENAME CONSTRAINT "AssuranceReviewDecision_evaluation_fkey" TO "AssuranceReviewDecision_organizationId_evaluationId_fkey";

-- RenameForeignKey
ALTER TABLE "AssuranceSourceConflict" RENAME CONSTRAINT "AssuranceSourceConflict_case_fkey" TO "AssuranceSourceConflict_organizationId_assuranceCaseId_fkey";

-- RenameForeignKey
ALTER TABLE "AssuranceSourceReference" RENAME CONSTRAINT "AssuranceSourceReference_case_fkey" TO "AssuranceSourceReference_organizationId_assuranceCaseId_fkey";

-- RenameIndex
ALTER INDEX "AssuranceApplicabilityDecision_organizationId_assuranceCaseId_i" RENAME TO "AssuranceApplicabilityDecision_organizationId_assuranceCase_idx";

-- RenameIndex
ALTER INDEX "AssuranceDocumentReference_assuranceCaseId_kind_referenceKey_ve" RENAME TO "AssuranceDocumentReference_assuranceCaseId_kind_referenceKe_key";

-- RenameIndex
ALTER INDEX "AssuranceEvidenceSubmission_organizationId_expectationId_versio" RENAME TO "AssuranceEvidenceSubmission_organizationId_expectationId_ve_key";

-- RenameIndex
ALTER INDEX "AssuranceParticipantAssignment_organizationId_assuranceCaseId_a" RENAME TO "AssuranceParticipantAssignment_organizationId_assuranceCase_idx";

-- RenameIndex
ALTER INDEX "AssuranceReviewDecision_organizationId_assuranceCaseId_createdA" RENAME TO "AssuranceReviewDecision_organizationId_assuranceCaseId_crea_idx";

-- RenameIndex
ALTER INDEX "AssuranceSourceConflict_organizationId_assuranceCaseId_status_i" RENAME TO "AssuranceSourceConflict_organizationId_assuranceCaseId_stat_idx";

-- RenameIndex
ALTER INDEX "AssuranceSourceReference_assuranceCaseId_sourceFamilyKey_versio" RENAME TO "AssuranceSourceReference_assuranceCaseId_sourceFamilyKey_ve_key";

-- RenameIndex
ALTER INDEX "AssuranceSourceReference_organizationId_assuranceCaseId_current" RENAME TO "AssuranceSourceReference_organizationId_assuranceCaseId_cur_idx";

-- RenameIndex
ALTER INDEX "IopReconciliationExceptionReview_organizationId_idempotencyKey_" RENAME TO "IopReconciliationExceptionReview_organizationId_idempotency_key";

-- RenameIndex
ALTER INDEX "IopReconciliationExceptionReview_organizationId_importId_issueK" RENAME TO "IopReconciliationExceptionReview_organizationId_importId_is_idx";

-- RenameIndex
ALTER INDEX "IopReconciliationImport_organizationId_facilityId_programId_cut" RENAME TO "IopReconciliationImport_organizationId_facilityId_programId_idx";

-- RenameIndex
ALTER INDEX "IopReconciliationImport_organizationId_integrationId_snapshotHa" RENAME TO "IopReconciliationImport_organizationId_integrationId_snapsh_key";
