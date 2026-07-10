-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('SENDING_FACILITY', 'RECEIVING_FACILITY', 'HOSPITAL_SYSTEM', 'CRISIS_PROVIDER', 'TRANSPORT_PROVIDER', 'PAYER', 'ADMINISTRATIVE');

-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'LOCKED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SYSTEM_ADMIN', 'ORGANIZATION_ADMIN', 'INTAKE_COORDINATOR', 'CLINICAL_REVIEWER', 'PHYSICIAN_REVIEWER', 'UTILIZATION_REVIEWER', 'LEGAL_REVIEWER', 'BENEFITS_VERIFICATION_SPECIALIST', 'AUTHORIZATION_SPECIALIST', 'FACILITY_REVIEWER', 'TRANSPORT_COORDINATOR', 'COMPLIANCE_REVIEWER', 'READ_ONLY_AUDITOR');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('DRAFT', 'INTAKE_IN_PROGRESS', 'DOCUMENTS_PENDING', 'DOCUMENTS_RECEIVED', 'EVIDENCE_PROCESSING', 'EVIDENCE_REVIEW', 'INFORMATION_INCOMPLETE', 'CLINICAL_REVIEW', 'LEGAL_REVIEW', 'BENEFITS_REVIEW', 'AUTHORIZATION_PREPARATION', 'PACKET_PREPARATION', 'READY_FOR_ROUTING', 'ROUTING_IN_PROGRESS', 'FACILITY_RESPONSE_PENDING', 'ACCEPTED', 'TRANSPORT_PENDING', 'HANDOFF_IN_PROGRESS', 'TRANSFER_COMPLETE', 'CLOSED', 'CANCELLED', 'WITHDRAWN', 'NO_PLACEMENT_FOUND', 'REFERRED_TO_ALTERNATIVE_LEVEL', 'MEDICAL_TRANSFER_REQUIRED', 'RETURNED_FOR_MORE_INFORMATION');

-- CreateEnum
CREATE TYPE "ParallelWorkstreamStatus" AS ENUM ('NOT_STARTED', 'READY', 'IN_PROGRESS', 'PENDING_REVIEW', 'COMPLETE', 'BLOCKED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "UrgencyLevel" AS ENUM ('ROUTINE', 'URGENT', 'EMERGENT');

-- CreateEnum
CREATE TYPE "LevelOfCare" AS ENUM ('INPATIENT_PSYCHIATRIC', 'CRISIS_STABILIZATION', 'RESIDENTIAL', 'PARTIAL_HOSPITALIZATION', 'INTENSIVE_OUTPATIENT', 'OUTPATIENT', 'MEDICAL_ADMISSION_WITH_PSYCHIATRIC_CONSULT', 'SUBSTANCE_USE_DETOX', 'SUBSTANCE_USE_RESIDENTIAL', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "LegalStatusType" AS ENUM ('VOLUNTARY', 'INVOLUNTARY_EMERGENCY', 'COURT_ORDERED', 'PROTECTIVE_CUSTODY', 'GUARDIAN_CONSENT', 'MINOR_CONSENT', 'CORRECTIONAL_CUSTODY', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('REFERRAL_FORM', 'EMERGENCY_DEPARTMENT_NOTE', 'PSYCHIATRIC_EVALUATION', 'NURSING_NOTE', 'LAB_REPORT', 'MEDICATION_LIST', 'LEGAL_HOLD_DOCUMENT', 'INSURANCE_CARD', 'BENEFITS_VERIFICATION', 'AUTHORIZATION_RECORD', 'DISCHARGE_SUMMARY', 'TRANSPORT_RECORD', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentClassificationStatus" AS ENUM ('PENDING', 'CLASSIFIED', 'NEEDS_REVIEW', 'REJECTED');

-- CreateEnum
CREATE TYPE "EvidenceStatus" AS ENUM ('CANDIDATE', 'APPROVED', 'REJECTED', 'NEEDS_CLARIFICATION', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "EvidenceCategory" AS ENUM ('PRESENTING_PROBLEM', 'SUICIDE_RISK', 'VIOLENCE_RISK', 'PSYCHOSIS', 'MANIA', 'SUBSTANCE_USE', 'WITHDRAWAL', 'COGNITION', 'MEDICAL', 'MEDICATION', 'ALLERGY', 'LEGAL_STATUS', 'CUSTODY', 'INSURANCE', 'AUTHORIZATION', 'GUARDIANSHIP', 'PLACEMENT', 'TRANSPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "ReviewObjectType" AS ENUM ('EVIDENCE', 'SUMMARY', 'MEDICAL_NECESSITY', 'LEGAL_STATUS', 'BENEFITS_VERIFICATION', 'AUTHORIZATION', 'FACILITY_MATCH', 'PACKET', 'CUSTODY_HANDOFF');

-- CreateEnum
CREATE TYPE "ReviewDecision" AS ENUM ('APPROVED', 'APPROVED_WITH_EDITS', 'REJECTED', 'NEEDS_MORE_INFORMATION');

-- CreateEnum
CREATE TYPE "RuleDomain" AS ENUM ('LEGAL', 'CLINICAL', 'PAYER', 'FACILITY', 'WORKFLOW');

-- CreateEnum
CREATE TYPE "RuleSetStatus" AS ENUM ('DRAFT', 'APPROVED', 'RETIRED');

-- CreateEnum
CREATE TYPE "RuleOutcome" AS ENUM ('PASS', 'WARNING', 'BLOCK', 'REQUIRES_REVIEW', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('INFORMATIONAL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "CoverageOrder" AS ENUM ('PRIMARY', 'SECONDARY', 'TERTIARY');

-- CreateEnum
CREATE TYPE "CoverageType" AS ENUM ('MEDICARE', 'MEDICAID', 'MEDICARE_ADVANTAGE', 'COMMERCIAL', 'SUPPLEMENTAL', 'TRICARE', 'SELF_PAY', 'OTHER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "SubscriberRelationship" AS ENUM ('SELF', 'SPOUSE', 'PARENT', 'GUARDIAN', 'OTHER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "CoverageStatus" AS ENUM ('UNVERIFIED', 'ACTIVE', 'INACTIVE', 'UNCLEAR', 'UNABLE_TO_VERIFY');

-- CreateEnum
CREATE TYPE "VerificationMethod" AS ENUM ('PORTAL', 'ELECTRONIC_TRANSACTION', 'PHONE', 'FAX', 'MANUAL', 'OTHER');

-- CreateEnum
CREATE TYPE "EligibilityStatus" AS ENUM ('PENDING', 'ACTIVE_CONFIRMED', 'INACTIVE', 'UNCLEAR', 'FAILED');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('INPATIENT_PSYCHIATRIC', 'PARTIAL_HOSPITALIZATION', 'INTENSIVE_OUTPATIENT', 'OUTPATIENT_BEHAVIORAL_HEALTH', 'SUBSTANCE_USE', 'OTHER');

-- CreateEnum
CREATE TYPE "NetworkStatus" AS ENUM ('IN_NETWORK', 'OUT_OF_NETWORK', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "DisclaimerStatus" AS ENUM ('REQUIRED', 'PROVIDED');

-- CreateEnum
CREATE TYPE "AuthorizationStatus" AS ENUM ('NOT_STARTED', 'PREPARING', 'SUBMITTED', 'PENDING', 'APPROVED', 'PARTIALLY_APPROVED', 'DENIED', 'NOT_REQUIRED', 'UNABLE_TO_COMPLETE');

-- CreateEnum
CREATE TYPE "EducationRecipientType" AS ENUM ('PATIENT', 'SPOUSE', 'PARENT', 'GUARDIAN', 'LEGAL_REPRESENTATIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "EducationMethod" AS ENUM ('IN_PERSON', 'PHONE', 'VIDEO', 'ELECTRONIC', 'WRITTEN');

-- CreateEnum
CREATE TYPE "AcknowledgementStatus" AS ENUM ('ACKNOWLEDGED', 'DECLINED', 'UNABLE', 'DEFERRED');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('DRAFT', 'READY', 'SENT', 'PENDING', 'MORE_INFORMATION_REQUESTED', 'ACCEPTED', 'DENIED', 'NO_BED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CustodyPartyType" AS ENUM ('HOSPITAL', 'LAW_ENFORCEMENT', 'EMS', 'TRANSPORT_VENDOR', 'FAMILY', 'RECEIVING_FACILITY', 'OTHER');

-- CreateEnum
CREATE TYPE "AuditActorType" AS ENUM ('USER', 'SYSTEM', 'AGENT', 'INTEGRATION');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OrganizationType" NOT NULL,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
    "jurisdictionCodes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "roles" "UserRole"[],
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientToken" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "externalPatientReference" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "age" INTEGER,
    "sex" TEXT,
    "preferredLanguage" TEXT,
    "guardianStatus" TEXT,
    "privacyFlags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BehavioralHealthCase" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientTokenId" TEXT NOT NULL,
    "assignedUserId" TEXT,
    "status" "CaseStatus" NOT NULL DEFAULT 'DRAFT',
    "urgency" "UrgencyLevel" NOT NULL DEFAULT 'ROUTINE',
    "currentLocation" TEXT,
    "requestedLevelOfCare" "LevelOfCare",
    "currentLegalStatus" "LegalStatusType",
    "clinicalStatus" "ParallelWorkstreamStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "legalReviewStatus" "ParallelWorkstreamStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "medicalScreeningStatus" "ParallelWorkstreamStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "benefitsStatus" "ParallelWorkstreamStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "authorizationStatus" "ParallelWorkstreamStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "placementStatus" "ParallelWorkstreamStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "transportationStatus" "ParallelWorkstreamStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "patientEducationStatus" "ParallelWorkstreamStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BehavioralHealthCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceDocument" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "sourceOrganization" TEXT,
    "authorName" TEXT,
    "serviceDate" TIMESTAMP(3),
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "classificationStatus" "DocumentClassificationStatus" NOT NULL DEFAULT 'PENDING',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceItem" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "category" "EvidenceCategory" NOT NULL,
    "subcategory" TEXT,
    "originalText" TEXT NOT NULL,
    "normalizedValue" JSONB,
    "pageNumber" INTEGER,
    "sectionLabel" TEXT,
    "sourceAuthor" TEXT,
    "sourceTimestamp" TIMESTAMP(3),
    "extractionConfidence" DOUBLE PRECISION,
    "status" "EvidenceStatus" NOT NULL DEFAULT 'CANDIDATE',
    "contradictionGroupId" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvidenceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HumanReview" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "objectType" "ReviewObjectType" NOT NULL,
    "objectId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "decision" "ReviewDecision" NOT NULL,
    "rationale" TEXT,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HumanReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalStatusRecord" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "statusType" "LegalStatusType" NOT NULL,
    "authorizingAuthority" TEXT,
    "initiatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "formDocumentId" TEXT,
    "signatureStatus" TEXT,
    "reviewStatus" "ParallelWorkstreamStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalStatusRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalNecessityReview" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "requestedLevel" "LevelOfCare" NOT NULL,
    "criteriaSetId" TEXT NOT NULL,
    "criteriaVersion" TEXT NOT NULL,
    "supportingEvidence" JSONB NOT NULL,
    "missingEvidence" JSONB NOT NULL,
    "contradictions" JSONB NOT NULL,
    "draftNarrative" TEXT,
    "reviewerId" TEXT,
    "decision" "ReviewDecision",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalNecessityReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleSet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" "RuleDomain" NOT NULL,
    "jurisdiction" TEXT,
    "issuingAuthority" TEXT,
    "version" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "reviewDate" TIMESTAMP(3),
    "status" "RuleSetStatus" NOT NULL DEFAULT 'DRAFT',
    "sourceDocumentIds" TEXT[],
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RuleSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rule" (
    "id" TEXT NOT NULL,
    "ruleSetId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "conditionExpression" JSONB NOT NULL,
    "outcome" "RuleOutcome" NOT NULL,
    "messageTemplate" TEXT NOT NULL,
    "citationReference" TEXT,
    "severity" "Severity" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayerProfile" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "aliases" TEXT[],
    "portalUrlLabel" TEXT,
    "eligibilityPhone" TEXT,
    "authorizationPhone" TEXT,
    "faxNumber" TEXT,
    "behavioralHealthCarveOut" TEXT,
    "typicalVerificationMinutes" INTEGER,
    "typicalAuthorizationHours" INTEGER,
    "commonPendReasons" TEXT[],
    "commonDenialReasons" TEXT[],
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanProfile" (
    "id" TEXT NOT NULL,
    "payerProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "planType" "CoverageType" NOT NULL,
    "knownNetworkRelationship" "NetworkStatus" NOT NULL DEFAULT 'UNKNOWN',
    "commonBenefitStructure" JSONB,
    "authorizationPattern" JSONB,
    "commonExclusions" TEXT[],
    "historicalReimbursement" JSONB,
    "confidenceLevel" DOUBLE PRECISION,
    "lastValidatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceSubscriber" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "fullName" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "relationshipToPatient" "SubscriberRelationship" NOT NULL,
    "employerName" TEXT,
    "sourceDocumentIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsuranceSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceCoverage" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "patientTokenId" TEXT NOT NULL,
    "coverageOrder" "CoverageOrder" NOT NULL,
    "payerProfileId" TEXT,
    "planProfileId" TEXT,
    "payerNameRaw" TEXT,
    "planNameRaw" TEXT,
    "memberIdEncrypted" TEXT,
    "groupNumberEncrypted" TEXT,
    "policyNumberEncrypted" TEXT,
    "coverageType" "CoverageType" NOT NULL,
    "subscriberRelationship" "SubscriberRelationship" NOT NULL,
    "subscriberId" TEXT,
    "status" "CoverageStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "sourceDocumentIds" TEXT[],
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsuranceCoverage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EligibilityVerification" (
    "id" TEXT NOT NULL,
    "insuranceCoverageId" TEXT NOT NULL,
    "method" "VerificationMethod" NOT NULL,
    "status" "EligibilityStatus" NOT NULL,
    "effectiveDate" TIMESTAMP(3),
    "terminationDate" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "payerRepresentative" TEXT,
    "referenceNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EligibilityVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EligibilityProof" (
    "id" TEXT NOT NULL,
    "eligibilityVerificationId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EligibilityProof_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BenefitVerification" (
    "id" TEXT NOT NULL,
    "insuranceCoverageId" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "networkStatus" "NetworkStatus" NOT NULL DEFAULT 'UNKNOWN',
    "deductibleAmountCents" INTEGER,
    "deductibleMetCents" INTEGER,
    "coinsurancePercent" DOUBLE PRECISION,
    "copayAmountCents" INTEGER,
    "outOfPocketMaxCents" INTEGER,
    "outOfPocketMetCents" INTEGER,
    "authorizationRequired" BOOLEAN,
    "notificationRequired" BOOLEAN,
    "coverageLimit" TEXT,
    "exclusions" TEXT[],
    "quotedAt" TIMESTAMP(3),
    "verificationReference" TEXT,
    "disclaimerStatus" "DisclaimerStatus" NOT NULL DEFAULT 'REQUIRED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BenefitVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BenefitVerificationSource" (
    "id" TEXT NOT NULL,
    "benefitVerificationId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BenefitVerificationSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Authorization" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "insuranceCoverageId" TEXT NOT NULL,
    "requestedLevelOfCare" "LevelOfCare" NOT NULL,
    "status" "AuthorizationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "authorizationNumber" TEXT,
    "requestedAt" TIMESTAMP(3),
    "decisionAt" TIMESTAMP(3),
    "approvedStartDate" TIMESTAMP(3),
    "approvedEndDate" TIMESTAMP(3),
    "approvedUnits" INTEGER,
    "nextReviewDate" TIMESTAMP(3),
    "denialReason" TEXT,
    "appealStatus" TEXT,
    "assignedUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Authorization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialEducationRecord" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "benefitVerificationId" TEXT,
    "recipientType" "EducationRecipientType" NOT NULL,
    "recipientName" TEXT,
    "method" "EducationMethod" NOT NULL,
    "language" TEXT,
    "interpreterUsed" BOOLEAN NOT NULL DEFAULT false,
    "topicsReviewed" TEXT[],
    "uncertaintiesDisclosed" TEXT[],
    "acknowledgementStatus" "AcknowledgementStatus" NOT NULL,
    "educatedBy" TEXT NOT NULL,
    "educatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialEducationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacilityProfile" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "programs" "LevelOfCare"[],
    "acceptedAges" JSONB,
    "acceptedCoverageTypes" "CoverageType"[],
    "medicalCapabilities" TEXT[],
    "exclusionCriteria" TEXT[],
    "legalStatusCapabilities" "LegalStatusType"[],
    "transportationRules" TEXT[],
    "referralRequirements" TEXT[],
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacilityProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "packetVersion" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3),
    "status" "ReferralStatus" NOT NULL DEFAULT 'DRAFT',
    "responseAt" TIMESTAMP(3),
    "responseReason" TEXT,
    "requestedInformation" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustodyEvent" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "fromPartyType" "CustodyPartyType" NOT NULL,
    "fromPartyName" TEXT,
    "toPartyType" "CustodyPartyType" NOT NULL,
    "toPartyName" TEXT,
    "authority" TEXT,
    "location" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "transportProvider" TEXT,
    "documentationIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustodyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "caseId" TEXT,
    "actorType" "AuditActorType" NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "objectId" TEXT,
    "previousStateHash" TEXT,
    "newStateHash" TEXT,
    "reason" TEXT,
    "modelMetadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddressHash" TEXT,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE INDEX "PatientToken_organizationId_idx" ON "PatientToken"("organizationId");

-- CreateIndex
CREATE INDEX "BehavioralHealthCase_organizationId_status_idx" ON "BehavioralHealthCase"("organizationId", "status");

-- CreateIndex
CREATE INDEX "BehavioralHealthCase_assignedUserId_idx" ON "BehavioralHealthCase"("assignedUserId");

-- CreateIndex
CREATE INDEX "BehavioralHealthCase_patientTokenId_idx" ON "BehavioralHealthCase"("patientTokenId");

-- CreateIndex
CREATE INDEX "SourceDocument_organizationId_caseId_idx" ON "SourceDocument"("organizationId", "caseId");

-- CreateIndex
CREATE UNIQUE INDEX "SourceDocument_caseId_sha256_version_key" ON "SourceDocument"("caseId", "sha256", "version");

-- CreateIndex
CREATE INDEX "EvidenceItem_caseId_category_status_idx" ON "EvidenceItem"("caseId", "category", "status");

-- CreateIndex
CREATE INDEX "EvidenceItem_documentId_idx" ON "EvidenceItem"("documentId");

-- CreateIndex
CREATE INDEX "HumanReview_caseId_objectType_idx" ON "HumanReview"("caseId", "objectType");

-- CreateIndex
CREATE INDEX "HumanReview_reviewerId_idx" ON "HumanReview"("reviewerId");

-- CreateIndex
CREATE INDEX "LegalStatusRecord_caseId_jurisdiction_idx" ON "LegalStatusRecord"("caseId", "jurisdiction");

-- CreateIndex
CREATE INDEX "MedicalNecessityReview_caseId_idx" ON "MedicalNecessityReview"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "RuleSet_name_version_key" ON "RuleSet"("name", "version");

-- CreateIndex
CREATE UNIQUE INDEX "Rule_ruleSetId_code_key" ON "Rule"("ruleSetId", "code");

-- CreateIndex
CREATE INDEX "PayerProfile_organizationId_legalName_idx" ON "PayerProfile"("organizationId", "legalName");

-- CreateIndex
CREATE INDEX "PlanProfile_payerProfileId_name_idx" ON "PlanProfile"("payerProfileId", "name");

-- CreateIndex
CREATE INDEX "InsuranceSubscriber_caseId_idx" ON "InsuranceSubscriber"("caseId");

-- CreateIndex
CREATE INDEX "InsuranceCoverage_caseId_coverageOrder_idx" ON "InsuranceCoverage"("caseId", "coverageOrder");

-- CreateIndex
CREATE INDEX "InsuranceCoverage_payerProfileId_idx" ON "InsuranceCoverage"("payerProfileId");

-- CreateIndex
CREATE INDEX "EligibilityVerification_insuranceCoverageId_verifiedAt_idx" ON "EligibilityVerification"("insuranceCoverageId", "verifiedAt");

-- CreateIndex
CREATE UNIQUE INDEX "EligibilityProof_eligibilityVerificationId_documentId_key" ON "EligibilityProof"("eligibilityVerificationId", "documentId");

-- CreateIndex
CREATE INDEX "BenefitVerification_insuranceCoverageId_serviceType_idx" ON "BenefitVerification"("insuranceCoverageId", "serviceType");

-- CreateIndex
CREATE UNIQUE INDEX "BenefitVerificationSource_benefitVerificationId_documentId_key" ON "BenefitVerificationSource"("benefitVerificationId", "documentId");

-- CreateIndex
CREATE INDEX "Authorization_caseId_status_idx" ON "Authorization"("caseId", "status");

-- CreateIndex
CREATE INDEX "Authorization_insuranceCoverageId_idx" ON "Authorization"("insuranceCoverageId");

-- CreateIndex
CREATE INDEX "FinancialEducationRecord_caseId_educatedAt_idx" ON "FinancialEducationRecord"("caseId", "educatedAt");

-- CreateIndex
CREATE INDEX "FacilityProfile_organizationId_name_idx" ON "FacilityProfile"("organizationId", "name");

-- CreateIndex
CREATE INDEX "Referral_caseId_status_idx" ON "Referral"("caseId", "status");

-- CreateIndex
CREATE INDEX "Referral_facilityId_idx" ON "Referral"("facilityId");

-- CreateIndex
CREATE INDEX "CustodyEvent_caseId_occurredAt_idx" ON "CustodyEvent"("caseId", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditEvent_organizationId_timestamp_idx" ON "AuditEvent"("organizationId", "timestamp");

-- CreateIndex
CREATE INDEX "AuditEvent_caseId_timestamp_idx" ON "AuditEvent"("caseId", "timestamp");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehavioralHealthCase" ADD CONSTRAINT "BehavioralHealthCase_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehavioralHealthCase" ADD CONSTRAINT "BehavioralHealthCase_patientTokenId_fkey" FOREIGN KEY ("patientTokenId") REFERENCES "PatientToken"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehavioralHealthCase" ADD CONSTRAINT "BehavioralHealthCase_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceDocument" ADD CONSTRAINT "SourceDocument_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "BehavioralHealthCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceItem" ADD CONSTRAINT "EvidenceItem_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "BehavioralHealthCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceItem" ADD CONSTRAINT "EvidenceItem_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "SourceDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HumanReview" ADD CONSTRAINT "HumanReview_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "BehavioralHealthCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HumanReview" ADD CONSTRAINT "HumanReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalStatusRecord" ADD CONSTRAINT "LegalStatusRecord_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "BehavioralHealthCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalNecessityReview" ADD CONSTRAINT "MedicalNecessityReview_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "BehavioralHealthCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rule" ADD CONSTRAINT "Rule_ruleSetId_fkey" FOREIGN KEY ("ruleSetId") REFERENCES "RuleSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayerProfile" ADD CONSTRAINT "PayerProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanProfile" ADD CONSTRAINT "PlanProfile_payerProfileId_fkey" FOREIGN KEY ("payerProfileId") REFERENCES "PayerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceCoverage" ADD CONSTRAINT "InsuranceCoverage_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "BehavioralHealthCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceCoverage" ADD CONSTRAINT "InsuranceCoverage_patientTokenId_fkey" FOREIGN KEY ("patientTokenId") REFERENCES "PatientToken"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceCoverage" ADD CONSTRAINT "InsuranceCoverage_payerProfileId_fkey" FOREIGN KEY ("payerProfileId") REFERENCES "PayerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceCoverage" ADD CONSTRAINT "InsuranceCoverage_planProfileId_fkey" FOREIGN KEY ("planProfileId") REFERENCES "PlanProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceCoverage" ADD CONSTRAINT "InsuranceCoverage_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "InsuranceSubscriber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EligibilityVerification" ADD CONSTRAINT "EligibilityVerification_insuranceCoverageId_fkey" FOREIGN KEY ("insuranceCoverageId") REFERENCES "InsuranceCoverage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EligibilityProof" ADD CONSTRAINT "EligibilityProof_eligibilityVerificationId_fkey" FOREIGN KEY ("eligibilityVerificationId") REFERENCES "EligibilityVerification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EligibilityProof" ADD CONSTRAINT "EligibilityProof_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "SourceDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BenefitVerification" ADD CONSTRAINT "BenefitVerification_insuranceCoverageId_fkey" FOREIGN KEY ("insuranceCoverageId") REFERENCES "InsuranceCoverage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BenefitVerificationSource" ADD CONSTRAINT "BenefitVerificationSource_benefitVerificationId_fkey" FOREIGN KEY ("benefitVerificationId") REFERENCES "BenefitVerification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BenefitVerificationSource" ADD CONSTRAINT "BenefitVerificationSource_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "SourceDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Authorization" ADD CONSTRAINT "Authorization_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "BehavioralHealthCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Authorization" ADD CONSTRAINT "Authorization_insuranceCoverageId_fkey" FOREIGN KEY ("insuranceCoverageId") REFERENCES "InsuranceCoverage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialEducationRecord" ADD CONSTRAINT "FinancialEducationRecord_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "BehavioralHealthCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialEducationRecord" ADD CONSTRAINT "FinancialEducationRecord_benefitVerificationId_fkey" FOREIGN KEY ("benefitVerificationId") REFERENCES "BenefitVerification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityProfile" ADD CONSTRAINT "FacilityProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "BehavioralHealthCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "FacilityProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustodyEvent" ADD CONSTRAINT "CustodyEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "BehavioralHealthCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "BehavioralHealthCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
