ALTER TABLE "SurveillanceBlueprint" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SurveillanceBlueprint" FORCE ROW LEVEL SECURITY;
CREATE POLICY "sr02_rls_surveillanceblueprint" ON "SurveillanceBlueprint" USING ("organizationId" = current_setting('app.current_organization_id', true)) WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));

ALTER TABLE "SurveillanceBlueprintVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SurveillanceBlueprintVersion" FORCE ROW LEVEL SECURITY;
CREATE POLICY "sr02_rls_surveillanceblueprintversion" ON "SurveillanceBlueprintVersion" USING ("organizationId" = current_setting('app.current_organization_id', true)) WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));

ALTER TABLE "SurveillanceApplicabilityProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SurveillanceApplicabilityProfile" FORCE ROW LEVEL SECURITY;
CREATE POLICY "sr02_rls_surveillanceapplicabilityprofile" ON "SurveillanceApplicabilityProfile" USING ("organizationId" = current_setting('app.current_organization_id', true)) WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));

ALTER TABLE "SurveillanceSceneVariant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SurveillanceSceneVariant" FORCE ROW LEVEL SECURITY;
CREATE POLICY "sr02_rls_surveillancescenevariant" ON "SurveillanceSceneVariant" USING ("organizationId" = current_setting('app.current_organization_id', true)) WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));

ALTER TABLE "SurveillanceReviewerPolicy" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SurveillanceReviewerPolicy" FORCE ROW LEVEL SECURITY;
CREATE POLICY "sr02_rls_surveillancereviewerpolicy" ON "SurveillanceReviewerPolicy" USING ("organizationId" = current_setting('app.current_organization_id', true)) WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));

ALTER TABLE "SurveillanceReviewerAssignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SurveillanceReviewerAssignment" FORCE ROW LEVEL SECURITY;
CREATE POLICY "sr02_rls_surveillancereviewerassignment" ON "SurveillanceReviewerAssignment" USING ("organizationId" = current_setting('app.current_organization_id', true)) WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));

ALTER TABLE "SurveillanceCriterion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SurveillanceCriterion" FORCE ROW LEVEL SECURITY;
CREATE POLICY "sr02_rls_surveillancecriterion" ON "SurveillanceCriterion" USING ("organizationId" = current_setting('app.current_organization_id', true)) WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));

ALTER TABLE "SurveillanceExpectedStateRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SurveillanceExpectedStateRule" FORCE ROW LEVEL SECURITY;
CREATE POLICY "sr02_rls_surveillanceexpectedstaterule" ON "SurveillanceExpectedStateRule" USING ("organizationId" = current_setting('app.current_organization_id', true)) WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));

ALTER TABLE "SurveillanceEvidenceRequirement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SurveillanceEvidenceRequirement" FORCE ROW LEVEL SECURITY;
CREATE POLICY "sr02_rls_surveillanceevidencerequirement" ON "SurveillanceEvidenceRequirement" USING ("organizationId" = current_setting('app.current_organization_id', true)) WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));

ALTER TABLE "SurveillanceCaptureStep" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SurveillanceCaptureStep" FORCE ROW LEVEL SECURITY;
CREATE POLICY "sr02_rls_surveillancecapturestep" ON "SurveillanceCaptureStep" USING ("organizationId" = current_setting('app.current_organization_id', true)) WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));

ALTER TABLE "SurveillanceAuthorityBinding" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SurveillanceAuthorityBinding" FORCE ROW LEVEL SECURITY;
CREATE POLICY "sr02_rls_surveillanceauthoritybinding" ON "SurveillanceAuthorityBinding" USING ("organizationId" = current_setting('app.current_organization_id', true)) WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));

ALTER TABLE "SurveillanceOrganizationRuleBinding" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SurveillanceOrganizationRuleBinding" FORCE ROW LEVEL SECURITY;
CREATE POLICY "sr02_rls_surveillanceorganizationrulebinding" ON "SurveillanceOrganizationRuleBinding" USING ("organizationId" = current_setting('app.current_organization_id', true)) WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));

ALTER TABLE "SurveillanceTrendIdentity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SurveillanceTrendIdentity" FORCE ROW LEVEL SECURITY;
CREATE POLICY "sr02_rls_surveillancetrendidentity" ON "SurveillanceTrendIdentity" USING ("organizationId" = current_setting('app.current_organization_id', true)) WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));

ALTER TABLE "SurveillanceRound" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SurveillanceRound" FORCE ROW LEVEL SECURITY;
CREATE POLICY "sr02_rls_surveillanceround" ON "SurveillanceRound" USING ("organizationId" = current_setting('app.current_organization_id', true)) WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));

ALTER TABLE "SurveillanceSceneInstance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SurveillanceSceneInstance" FORCE ROW LEVEL SECURITY;
CREATE POLICY "sr02_rls_surveillancesceneinstance" ON "SurveillanceSceneInstance" USING ("organizationId" = current_setting('app.current_organization_id', true)) WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));

ALTER TABLE "SurveillanceApplicabilityResolution" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SurveillanceApplicabilityResolution" FORCE ROW LEVEL SECURITY;
CREATE POLICY "sr02_rls_surveillanceapplicabilityresolution" ON "SurveillanceApplicabilityResolution" USING ("organizationId" = current_setting('app.current_organization_id', true)) WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));

ALTER TABLE "SurveillanceCriterionRuntime" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SurveillanceCriterionRuntime" FORCE ROW LEVEL SECURITY;
CREATE POLICY "sr02_rls_surveillancecriterionruntime" ON "SurveillanceCriterionRuntime" USING ("organizationId" = current_setting('app.current_organization_id', true)) WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));

ALTER TABLE "SurveillanceEvidenceRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SurveillanceEvidenceRequest" FORCE ROW LEVEL SECURITY;
CREATE POLICY "sr02_rls_surveillancerevidencerequest" ON "SurveillanceEvidenceRequest" USING ("organizationId" = current_setting('app.current_organization_id', true)) WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));

ALTER TABLE "SurveillanceEvidenceArtifact" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SurveillanceEvidenceArtifact" FORCE ROW LEVEL SECURITY;
CREATE POLICY "sr02_rls_surveillanceevidenceartifact" ON "SurveillanceEvidenceArtifact" USING ("organizationId" = current_setting('app.current_organization_id', true)) WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));

ALTER TABLE "SurveillanceEvidenceDerivation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SurveillanceEvidenceDerivation" FORCE ROW LEVEL SECURITY;
CREATE POLICY "sr02_rls_surveillanceevidencederivation" ON "SurveillanceEvidenceDerivation" USING ("organizationId" = current_setting('app.current_organization_id', true)) WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));

ALTER TABLE "SurveillanceObservation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SurveillanceObservation" FORCE ROW LEVEL SECURITY;
CREATE POLICY "sr02_rls_surveillanceobservation" ON "SurveillanceObservation" USING ("organizationId" = current_setting('app.current_organization_id', true)) WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));

ALTER TABLE "SurveillanceInterpretationDescriptor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SurveillanceInterpretationDescriptor" FORCE ROW LEVEL SECURITY;
CREATE POLICY "sr02_rls_surveillanceinterpretationdescriptor" ON "SurveillanceInterpretationDescriptor" USING ("organizationId" = current_setting('app.current_organization_id', true)) WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));

ALTER TABLE "SurveillanceEvidenceAssessment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SurveillanceEvidenceAssessment" FORCE ROW LEVEL SECURITY;
CREATE POLICY "sr02_rls_surveillanceevidenceassessment" ON "SurveillanceEvidenceAssessment" USING ("organizationId" = current_setting('app.current_organization_id', true)) WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));

ALTER TABLE "SurveillanceCandidateVariance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SurveillanceCandidateVariance" FORCE ROW LEVEL SECURITY;
CREATE POLICY "sr02_rls_surveillancecandidatevariance" ON "SurveillanceCandidateVariance" USING ("organizationId" = current_setting('app.current_organization_id', true)) WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));

ALTER TABLE "SurveillanceReviewPacket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SurveillanceReviewPacket" FORCE ROW LEVEL SECURITY;
CREATE POLICY "sr02_rls_surveillancereviewpacket" ON "SurveillanceReviewPacket" USING ("organizationId" = current_setting('app.current_organization_id', true)) WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));

ALTER TABLE "SurveillanceDecisionRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SurveillanceDecisionRecord" FORCE ROW LEVEL SECURITY;
CREATE POLICY "sr02_rls_surveillancedecisionrecord" ON "SurveillanceDecisionRecord" USING ("organizationId" = current_setting('app.current_organization_id', true)) WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));

ALTER TABLE "SurveillanceReviewedFinding" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SurveillanceReviewedFinding" FORCE ROW LEVEL SECURITY;
CREATE POLICY "sr02_rls_surveillancereviewedfinding" ON "SurveillanceReviewedFinding" USING ("organizationId" = current_setting('app.current_organization_id', true)) WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));

ALTER TABLE "SurveillanceFindingVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SurveillanceFindingVersion" FORCE ROW LEVEL SECURITY;
CREATE POLICY "sr02_rls_surveillancefindingversion" ON "SurveillanceFindingVersion" USING ("organizationId" = current_setting('app.current_organization_id', true)) WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));

ALTER TABLE "SurveillanceFindingCitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SurveillanceFindingCitation" FORCE ROW LEVEL SECURITY;
CREATE POLICY "sr02_rls_surveillancefindingcitation" ON "SurveillanceFindingCitation" USING ("organizationId" = current_setting('app.current_organization_id', true)) WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));

ALTER TABLE "SurveillanceImmediateCorrection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SurveillanceImmediateCorrection" FORCE ROW LEVEL SECURITY;
CREATE POLICY "sr02_rls_surveillanceimmediatecorrection" ON "SurveillanceImmediateCorrection" USING ("organizationId" = current_setting('app.current_organization_id', true)) WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));

ALTER TABLE "SurveillanceCorrectiveAction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SurveillanceCorrectiveAction" FORCE ROW LEVEL SECURITY;
CREATE POLICY "sr02_rls_surveillancecorrectiveaction" ON "SurveillanceCorrectiveAction" USING ("organizationId" = current_setting('app.current_organization_id', true)) WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));

ALTER TABLE "SurveillanceActionEvidence" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SurveillanceActionEvidence" FORCE ROW LEVEL SECURITY;
CREATE POLICY "sr02_rls_surveillanceactionevidence" ON "SurveillanceActionEvidence" USING ("organizationId" = current_setting('app.current_organization_id', true)) WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));

ALTER TABLE "SurveillanceTrendOccurrence" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SurveillanceTrendOccurrence" FORCE ROW LEVEL SECURITY;
CREATE POLICY "sr02_rls_surveillancetrendoccurrence" ON "SurveillanceTrendOccurrence" USING ("organizationId" = current_setting('app.current_organization_id', true)) WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));
