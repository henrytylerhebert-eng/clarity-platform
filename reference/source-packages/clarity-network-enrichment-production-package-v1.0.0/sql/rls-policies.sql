-- Proposed and unverified. Adapt to the accepted database/tenant context strategy.
ALTER TABLE "NetworkEnrichmentRun" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NetworkCandidateField" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NetworkFieldEvidence" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NetworkConflictSet" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NetworkReviewDecision" ENABLE ROW LEVEL SECURITY;

CREATE POLICY network_enrichment_run_tenant ON "NetworkEnrichmentRun"
  USING ("organizationId" = current_setting('app.organization_id', true))
  WITH CHECK ("organizationId" = current_setting('app.organization_id', true));

CREATE POLICY network_candidate_tenant ON "NetworkCandidateField"
  USING ("organizationId" = current_setting('app.organization_id', true))
  WITH CHECK ("organizationId" = current_setting('app.organization_id', true));

CREATE POLICY network_evidence_tenant ON "NetworkFieldEvidence"
  USING ("organizationId" = current_setting('app.organization_id', true))
  WITH CHECK ("organizationId" = current_setting('app.organization_id', true));

CREATE POLICY network_conflict_tenant ON "NetworkConflictSet"
  USING ("organizationId" = current_setting('app.organization_id', true))
  WITH CHECK ("organizationId" = current_setting('app.organization_id', true));

CREATE POLICY network_decision_tenant ON "NetworkReviewDecision"
  USING ("organizationId" = current_setting('app.organization_id', true))
  WITH CHECK ("organizationId" = current_setting('app.organization_id', true));
