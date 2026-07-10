export type AgeGroup = 'child' | 'adolescent' | 'adult' | 'geriatric' | 'unknown';
export type CaseStatus = 'draft' | 'active' | 'needs_clinical_review' | 'needs_more_info' | 'ready_for_routing' | 'routing' | 'accepted' | 'declined' | 'admitted' | 'closed' | 'voided';
export type LegalStatus = 'unknown' | 'voluntary' | 'voluntary_contested' | 'opc_pending' | 'opc_active' | 'pec_draft' | 'pec_signed' | 'cec_pending' | 'cec_signed' | 'court_committed';
export type SourceType = 'patient_report' | 'family_collateral' | 'law_enforcement' | 'ems' | 'ed_staff' | 'outpatient_provider' | 'prior_record' | 'school' | 'court' | 'clinician_observation' | 'lab_result' | 'medication_record' | 'payer_document' | 'referral_document' | 'media_reference' | 'ai_draft';
export type ReviewStatus = 'draft' | 'needs_more_information' | 'ready_for_clinician_review' | 'clinician_reviewed' | 'signed_locked' | 'voided';
export type RiskType = 'suicide_self_harm' | 'violence_homicide' | 'grave_disability' | 'substance_withdrawal' | 'medical_instability' | 'elopement' | 'abuse_neglect' | 'self_neglect';
export type ClinicianRiskLevel = 'not_assessed' | 'low' | 'moderate' | 'high' | 'imminent' | 'clinician_override';
export type LegalInstrumentType = 'opc' | 'pec' | 'cec' | 'voluntary_consent' | 'legal_status_note';
export type FacilityResponseType = 'accept' | 'decline' | 'request_more_info' | 'hold_pending_review' | 'no_response_timeout';

export interface SourceReferenceDTO {
  id: string;
  sourceType: SourceType;
  sourceNameOrRole?: string;
  linkedFieldPath?: string;
  confidence?: 'high' | 'medium' | 'low' | 'conflicting' | 'needs_verification';
  note?: string;
  quoteExcerpt?: string;
  timestamp: string;
}

export interface RiskFindingDTO {
  id: string;
  riskType: RiskType;
  observedBehavior?: string;
  patientStatement?: string;
  collateralStatement?: string;
  clinicianObservation?: string;
  timeframe?: string;
  clinicianRiskLevel: ClinicianRiskLevel;
  protectiveFactors?: string;
  accessToMeans?: string;
  mitigationSteps?: string;
  sourceReferenceIds: string[];
  reviewStatus: ReviewStatus;
}

export interface AssessmentDTO {
  id: string;
  caseId: string;
  reviewStatus: ReviewStatus;
  presentingProblem?: string;
  crisisTimeline?: string;
  precipitatingEvents?: string;
  mentalStatus?: Record<string, unknown>;
  medicalClearance?: Record<string, unknown>;
  substanceUse?: Record<string, unknown>;
  functionalStatus?: Record<string, unknown>;
  ageSpecific?: Record<string, unknown>;
  riskFindings: RiskFindingDTO[];
  sourceReferences: SourceReferenceDTO[];
}

export interface MedicalNecessitySnapshotDTO {
  id: string;
  assessmentId: string;
  riskOfHarmEvidence?: unknown[];
  functionalImpairment?: unknown[];
  treatmentHistory?: unknown[];
  environmentalStressors?: unknown[];
  engagementInCare?: unknown[];
  graveDisability?: unknown[];
  lowerLocConsidered?: unknown[];
  needFor24HourCare?: unknown[];
  medicalSuitability?: unknown[];
  missingItems?: string[];
  draftNarrative?: string;
  reviewStatus: ReviewStatus;
}

export interface CustodyLedgerEventDTO {
  id: string;
  caseId: string;
  eventType: string;
  actorUserId?: string;
  actorRole?: string;
  timestamp: string;
  payload: Record<string, unknown>;
  artifactHashes?: string[];
  previousHash?: string;
  eventHash: string;
}

export interface AIOutputDTO {
  id: string;
  outputType: string;
  generatedText: string;
  sourceRefs: string[];
  missingDataFlags: string[];
  confidenceNotes?: string;
  requiresClinicianReview: true;
  reviewStatus: 'draft' | 'needs_more_information' | 'ready_for_clinician_review' | 'clinician_reviewed' | 'voided';
}
