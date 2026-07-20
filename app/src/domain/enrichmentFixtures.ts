import type {
  NetworkReviewPackageRecord,
  NetworkReviewRecord,
  NetworkReviewFieldEvidenceRecord,
  NetworkReviewConflictRecord,
} from "@clarity/domain-contracts";

export interface SyntheticEnrichmentPackage {
  packageRecord: NetworkReviewPackageRecord;
  reviews: NetworkReviewRecord[];
  evidence: Record<string, NetworkReviewFieldEvidenceRecord[]>;
  conflicts: NetworkReviewConflictRecord[];
  canonicalData: {
    entityName: string;
    fields: Record<string, unknown>;
  };
}

export const SYNTHETIC_ENRICHMENT_PACKAGES: SyntheticEnrichmentPackage[] = [
  {
    packageRecord: {
      reviewPackageId: "pkg-syn-01",
      organizationId: "org-synthetic-a",
      caseId: "case-syn-101",
      sourceCandidateId: "cand-ldh-801",
      status: "CONFLICT",
      version: 1,
      submittedByActorId: "agent-enrichment-crawler",
      assignedReviewerCategory: ["CLINICAL_REVIEWER", "LEGAL_REVIEWER"],
      sourceRunId: "run-ldh-2026-07-19",
      packageStatusReason: "Contradiction detected on level of care and forensic custody capability",
      createdAt: "2026-07-19T10:00:00.000Z",
      updatedAt: "2026-07-19T10:00:00.000Z",
    },
    canonicalData: {
      entityName: "St. Jude Behavioral Health Center",
      fields: {
        "facility.name": "St. Jude Behavioral Health Center",
        "facility.contact.phone": "(337) 555-0120",
        "facility.contact.email": "intake@stjudebehavioral.org",
        "facility.licensing.stateId": "LA-BH-2024-904",
        "facility.capacity.inpatientBeds": 24,
        "clinical.levelOfCare": "Inpatient Psychiatric",
        "clinical.inpatientDetoxAvailable": false,
        "legal.opcAcceptance": false,
      },
    },
    reviews: [
      {
        reviewPackageId: "pkg-syn-01",
        reviewId: "rev-syn-101",
        organizationId: "org-synthetic-a",
        caseId: "case-syn-101",
        sourceCandidateId: "cand-ldh-801",
        fieldPath: "facility.contact.phone",
        sensitivityCategory: "NORMAL_OPERATIONAL",
        requiredCanonicalRoles: ["FACILITY_REVIEWER", "COMPLIANCE_REVIEWER"],
        createdByActorId: "agent-enrichment-crawler",
        currentValue: "(337) 555-0120",
        proposedValue: "(337) 555-0199",
        sourceReviewerRoles: ["NETWORK_REVIEWER"],
        status: "REVIEW_PENDING",
        version: 1,
        createdAt: "2026-07-19T10:00:00.000Z",
        updatedAt: "2026-07-19T10:00:00.000Z",
        audits: [
          {
            action: "SUBMIT_FOR_REVIEW",
            actorId: "agent-enrichment-crawler",
            actorType: "AGENT",
            commandId: "cmd-rev-101",
            correlationId: "corr-syn-01",
            reason: "Directory scan extracted updated direct intake line",
            occurredAt: "2026-07-19T10:00:00.000Z",
          },
        ],
      },
      {
        reviewPackageId: "pkg-syn-01",
        reviewId: "rev-syn-102",
        organizationId: "org-synthetic-a",
        caseId: "case-syn-101",
        sourceCandidateId: "cand-ldh-801",
        fieldPath: "clinical.inpatientDetoxAvailable",
        sensitivityCategory: "CLINICAL_CRITERIA",
        requiredCanonicalRoles: ["CLINICAL_REVIEWER", "PHYSICIAN_REVIEWER"],
        createdByActorId: "agent-enrichment-crawler",
        currentValue: false,
        proposedValue: true,
        sourceReviewerRoles: ["FACILITY_CLINICAL_GOVERNANCE"],
        status: "CONFLICT",
        version: 1,
        createdAt: "2026-07-19T10:00:00.000Z",
        updatedAt: "2026-07-19T10:00:00.000Z",
        audits: [
          {
            action: "SUBMIT_FOR_REVIEW",
            actorId: "agent-enrichment-crawler",
            actorType: "AGENT",
            commandId: "cmd-rev-102",
            correlationId: "corr-syn-01",
            reason: "LDH portal listing claims 24/7 medical detox unit open",
            occurredAt: "2026-07-19T10:00:00.000Z",
          },
        ],
      },
      {
        reviewPackageId: "pkg-syn-01",
        reviewId: "rev-syn-103",
        organizationId: "org-synthetic-a",
        caseId: "case-syn-101",
        sourceCandidateId: "cand-ldh-801",
        fieldPath: "legal.opcAcceptance",
        sensitivityCategory: "LEGAL_STATUS_REQUIREMENTS",
        requiredCanonicalRoles: ["LEGAL_REVIEWER", "COMPLIANCE_REVIEWER"],
        createdByActorId: "agent-enrichment-crawler",
        currentValue: false,
        proposedValue: true,
        sourceReviewerRoles: ["FACILITY_LEGAL_COMPLIANCE"],
        status: "REVIEW_PENDING",
        version: 1,
        createdAt: "2026-07-19T10:00:00.000Z",
        updatedAt: "2026-07-19T10:00:00.000Z",
        audits: [
          {
            action: "SUBMIT_FOR_REVIEW",
            actorId: "agent-enrichment-crawler",
            actorType: "AGENT",
            commandId: "cmd-rev-103",
            correlationId: "corr-syn-01",
            reason: "OPC parish court order authorization agreement verified",
            occurredAt: "2026-07-19T10:00:00.000Z",
          },
        ],
      },
    ],
    evidence: {
      "rev-syn-101": [
        {
          reviewId: "rev-syn-101",
          evidenceType: "DIRECT_DIRECTORY_EXTRACT",
          payload: {
            extractedText: "Direct Intake Desk: 337-555-0199 (24 Hours)",
            confidenceScore: 0.96,
          },
          evidenceSource: "https://ldh.la.gov/directory/stjude-behavioral",
        },
      ],
      "rev-syn-102": [
        {
          reviewId: "rev-syn-102",
          evidenceType: "CLINICAL_CAPABILITY_CLAIM",
          payload: {
            extractedText: "New 8-bed acute medical detoxification unit opened June 2026.",
            confidenceScore: 0.88,
          },
          evidenceSource: "https://ldh.la.gov/licenses/LA-BH-2024-904",
        },
      ],
      "rev-syn-103": [
        {
          reviewId: "rev-syn-103",
          evidenceType: "PARISH_COURT_AUTHORIZATION",
          payload: {
            extractedText: "Designated CEC/OPC receiving facility under Parish District Court Memorandum.",
            confidenceScore: 0.94,
          },
          evidenceSource: "https://court.parish.la.gov/opc/facilities/stjude",
        },
      ],
    },
    conflicts: [
      {
        conflictId: "cnf-syn-102",
        organizationId: "org-synthetic-a",
        reviewPackageId: "pkg-syn-01",
        status: "OPEN",
        reason: "LDH Registry indicates medical detox unit active, but facility website states outpatient transfer only",
        relatedReviewIds: ["rev-syn-102"],
      },
    ],
  },
  {
    packageRecord: {
      reviewPackageId: "pkg-syn-02",
      organizationId: "org-synthetic-a",
      caseId: "case-syn-102",
      sourceCandidateId: "cand-cms-402",
      status: "STALE",
      version: 1,
      submittedByActorId: "agent-enrichment-crawler",
      assignedReviewerCategory: ["BENEFITS_VERIFICATION_SPECIALIST"],
      sourceRunId: "run-cms-2026-04-01",
      packageStatusReason: "Source evidence retrieved > 90 days ago; re-verification recommended",
      createdAt: "2026-04-01T08:00:00.000Z",
      updatedAt: "2026-04-01T08:00:00.000Z",
    },
    canonicalData: {
      entityName: "Acadiana Recovery Center",
      fields: {
        "facility.name": "Acadiana Recovery Center",
        "payer.medicaidContractActive": true,
        "payer.medicareProviderNumber": "CCN-19-4028",
        "payer.commercialPayers": ["Louisiana Healthcare Connections", "Aetna Better Health"],
      },
    },
    reviews: [
      {
        reviewPackageId: "pkg-syn-02",
        reviewId: "rev-syn-201",
        organizationId: "org-synthetic-a",
        caseId: "case-syn-102",
        sourceCandidateId: "cand-cms-402",
        fieldPath: "payer.medicaidContractActive",
        sensitivityCategory: "PAYER_RELATED",
        requiredCanonicalRoles: ["COMPLIANCE_REVIEWER", "BENEFITS_VERIFICATION_SPECIALIST"],
        createdByActorId: "agent-enrichment-crawler",
        currentValue: true,
        proposedValue: true,
        sourceReviewerRoles: ["NETWORK_REVIEWER"],
        status: "STALE",
        version: 1,
        createdAt: "2026-04-01T08:00:00.000Z",
        updatedAt: "2026-04-01T08:00:00.000Z",
        audits: [
          {
            action: "SUBMIT_FOR_REVIEW",
            actorId: "agent-enrichment-crawler",
            actorType: "AGENT",
            commandId: "cmd-rev-201",
            correlationId: "corr-syn-02",
            reason: "Quarterly Medicaid contract verification scan",
            occurredAt: "2026-04-01T08:00:00.000Z",
          },
        ],
      },
    ],
    evidence: {
      "rev-syn-201": [
        {
          reviewId: "rev-syn-201",
          evidenceType: "PAYER_DIRECTORY_EXTRACT",
          payload: {
            extractedText: "Active MCO network contract confirmed via CMS NPPES database.",
            confidenceScore: 0.99,
          },
          evidenceSource: "https://npiregistry.cms.hhs.gov/provider-details/194028",
        },
      ],
    },
    conflicts: [],
  },
  {
    packageRecord: {
      reviewPackageId: "pkg-syn-03",
      organizationId: "org-synthetic-a",
      caseId: "case-syn-103",
      sourceCandidateId: "cand-nppes-103",
      status: "HUMAN_CONFIRMED",
      version: 2,
      submittedByActorId: "agent-enrichment-crawler",
      assignedReviewerCategory: ["FACILITY_REVIEWER"],
      sourceRunId: "run-nppes-2026-07-18",
      packageStatusReason: "All field decisions confirmed by human reviewer",
      createdAt: "2026-07-18T14:00:00.000Z",
      updatedAt: "2026-07-18T15:30:00.000Z",
    },
    canonicalData: {
      entityName: "Cajun Coast Crisis Stabilization",
      fields: {
        "facility.name": "Cajun Coast Crisis Stabilization",
        "facility.contact.address": "1200 Evangeline Thruway, Lafayette, LA 70501",
        "facility.capacity.inpatientBeds": 16,
      },
    },
    reviews: [
      {
        reviewPackageId: "pkg-syn-03",
        reviewId: "rev-syn-301",
        organizationId: "org-synthetic-a",
        caseId: "case-syn-103",
        sourceCandidateId: "cand-nppes-103",
        fieldPath: "facility.contact.address",
        sensitivityCategory: "NORMAL_OPERATIONAL",
        requiredCanonicalRoles: ["FACILITY_REVIEWER"],
        createdByActorId: "agent-enrichment-crawler",
        currentValue: "1200 Evangeline Thruway, Lafayette, LA 70501",
        proposedValue: "1200 Evangeline Thruway, Suite 100, Lafayette, LA 70501",
        sourceReviewerRoles: ["NETWORK_REVIEWER"],
        status: "HUMAN_CONFIRMED",
        version: 2,
        reviewedByActorId: "usr-reviewer-ops",
        reviewReason: "Suite number verified via physical facility handoff SOP",
        createdAt: "2026-07-18T14:00:00.000Z",
        updatedAt: "2026-07-18T15:30:00.000Z",
        audits: [
          {
            action: "SUBMIT_FOR_REVIEW",
            actorId: "agent-enrichment-crawler",
            actorType: "AGENT",
            commandId: "cmd-rev-301-sub",
            correlationId: "corr-syn-03",
            reason: "NPPES address suite update",
            occurredAt: "2026-07-18T14:00:00.000Z",
          },
          {
            action: "APPROVE_REVIEW",
            actorId: "usr-reviewer-ops",
            actorType: "USER",
            commandId: "cmd-rev-301-app",
            correlationId: "corr-syn-03-decision",
            reason: "Suite number verified via physical facility handoff SOP",
            occurredAt: "2026-07-18T15:30:00.000Z",
          },
        ],
      },
    ],
    evidence: {
      "rev-syn-301": [
        {
          reviewId: "rev-syn-301",
          evidenceType: "NPPES_RECORD",
          payload: {
            extractedText: "Practice location address line 2: Suite 100",
            confidenceScore: 0.98,
          },
          evidenceSource: "https://npiregistry.cms.hhs.gov/address/1200evangeline",
        },
      ],
    },
    conflicts: [],
  },
];

export function getSyntheticEnrichmentPackages(): SyntheticEnrichmentPackage[] {
  return structuredClone(SYNTHETIC_ENRICHMENT_PACKAGES);
}

export function getSyntheticEnrichmentPackageById(packageId: string): SyntheticEnrichmentPackage | undefined {
  const pkgs = getSyntheticEnrichmentPackages();
  return pkgs.find((p) => p.packageRecord.reviewPackageId === packageId);
}
