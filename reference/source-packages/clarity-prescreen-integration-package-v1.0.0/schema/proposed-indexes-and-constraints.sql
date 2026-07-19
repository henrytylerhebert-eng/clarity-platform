-- Proposed PostgreSQL hardening beyond what Prisma can express directly.
-- Reconcile table/column names with generated migration names and the live schema.

-- 1. At most one active facility profile per facility at an instant.
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_facility_profile
ON "FacilityAdmissionProfile" ("organizationId", "facilityId")
WHERE "status" = 'ACTIVE' AND "effectiveTo" IS NULL;

-- 2. Attested assessment must have attestation identity/time/hash.
ALTER TABLE "PrescreenAssessmentVersion"
ADD CONSTRAINT ck_attested_assessment_fields
CHECK (
  "status" NOT IN ('ATTESTED','CORRECTED','SUPERSEDED')
  OR ("attestedBy" IS NOT NULL AND "attestedAt" IS NOT NULL AND "contentHash" IS NOT NULL)
);

-- 3. Draft assessments cannot claim attestation.
ALTER TABLE "PrescreenAssessmentVersion"
ADD CONSTRAINT ck_draft_has_no_attestation
CHECK (
  "status" <> 'DRAFT'
  OR ("attestedBy" IS NULL AND "attestedAt" IS NULL)
);

-- 4. Completed tasks require completion time.
ALTER TABLE "PrescreenWorkflowTask"
ADD CONSTRAINT ck_completed_task_time
CHECK ("status" <> 'COMPLETED' OR "completedAt" IS NOT NULL);

-- 5. Packet requirement explanation gates.
ALTER TABLE "ReferralPacketRequirement"
ADD CONSTRAINT ck_packet_requirement_reason
CHECK (
  "state" NOT IN ('UNAVAILABLE_WITH_REASON','NOT_APPLICABLE_WITH_AUTHORITY')
  OR "unavailableReason" IS NOT NULL
);

-- 6. Custody event hash chain sequence is append-only at service layer.
-- Add a database role that can INSERT but not UPDATE/DELETE after the production role model is approved.

-- 7. RLS skeleton: transaction-local setting must be set by the API transaction.
-- Do not enable until every service transaction sets app.organization_id and tests pass.
ALTER TABLE "PrescreenEncounter" ENABLE ROW LEVEL SECURITY;
CREATE POLICY prescreen_encounter_org_policy ON "PrescreenEncounter"
USING ("organizationId" = current_setting('app.organization_id', true))
WITH CHECK ("organizationId" = current_setting('app.organization_id', true));

-- Repeat equivalent policies for every tenant-owned table through a reviewed migration.

-- 8. Outbox ordering/idempotency.
CREATE UNIQUE INDEX IF NOT EXISTS uq_outbox_aggregate_version
ON "PrescreenOutboxEvent" ("organizationId", "aggregateType", "aggregateId", "aggregateVersion", "eventType");

-- 9. Prevent overlapping active consent rule versions only after a deterministic scope-key design is accepted.
-- An exclusion constraint using tstzrange is recommended when nullable scope fields are normalized.
