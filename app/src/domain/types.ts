export type ReviewStatus =
  | "Draft"
  | "Needs clinician review"
  | "Counsel validation required"
  | "Clinician reviewed"
  | "Signed locked"
  | "Unknown";

export type CaseStage =
  | "Referral"
  | "Intake"
  | "Assessment"
  | "Legal draft"
  | "Packet"
  | "Routing"
  | "Accepted";

export type AgeBand = "Adult" | "Geriatric" | "Youth" | "Unknown";
export type SourceType =
  | "Patient report"
  | "Family collateral"
  | "Law enforcement"
  | "ED staff"
  | "Outpatient provider"
  | "Clinician observation"
  | "Prior record"
  | "Referral document"
  | "AI draft";
export type RiskType = "Danger to self" | "Danger to others" | "Grave disability" | "Medical instability" | "Elopement" | "Vulnerability";
export type FacilityResponseKind = "Accept" | "Decline" | "Request more info" | "Waitlist" | "Pending";

export interface PatientToken {
  id: string;
  displayName: string;
  ageBand: AgeBand;
  pronouns?: string;
  location: string;
}

export interface SourceReference {
  id: string;
  caseId: string;
  type: SourceType;
  label: string;
  excerpt: string;
  confidence: "High" | "Medium" | "Low" | "Needs verification";
}

export interface RiskFinding {
  id: string;
  caseId: string;
  type: RiskType;
  summary: string;
  sourceReferenceIds: string[];
  severity: "Low" | "Moderate" | "High" | "Imminent" | "Unknown";
  reviewStatus: ReviewStatus;
}

export interface Encounter {
  id: string;
  caseId: string;
  mode: "Field" | "Clinical";
  startedAt: string;
  referralSource: string;
  insuranceStatus: "Unknown" | "Pending verification" | "Verified" | "Not provided";
}

export type HumanTriageStatus = "Not started" | "In progress" | "Needs authorized review" | "Reviewed";
export type HumanDisposition =
  | "Not recorded"
  | "Continue to intake"
  | "Emergency protocol activated"
  | "Medical evaluation required"
  | "Pending information"
  | "Alternate setting considered";

export interface PrescreenRecord {
  id: string;
  caseId: string;
  referralSource: string;
  referralReceivedAt: string;
  currentLocation: string;
  presentingConcern: string;
  immediateSafety: string;
  medicalConcerns: string;
  custodyContext: string;
  urgency: "Routine" | "Urgent" | "Emergent" | "Unknown";
  collateralStatus: "Missing" | "Partial" | "Documented" | "Unknown";
  triageStatus: HumanTriageStatus;
  humanDisposition: HumanDisposition;
  assignedOwner: string;
  nextAction: string;
  sourceReferenceIds: string[];
  updatedAt: string;
}

export type AdmissionCheckpointKind =
  | "psychiatrist-acceptance"
  | "medical-clearance"
  | "operational-readiness"
  | "arrival-handoff"
  | "admission-episode";

export type AdmissionCheckpointStatus =
  | "Pending"
  | "In progress"
  | "Needs review"
  | "Accepted"
  | "Approved"
  | "Complete"
  | "Declined"
  | "Blocked"
  | "Not built";

export interface AdmissionCheckpoint {
  id: string;
  caseId: string;
  kind: AdmissionCheckpointKind;
  status: AdmissionCheckpointStatus;
  owner: string;
  reviewAuthority: string;
  note: string;
  sourceArtifactIds: string[];
  occurredAt?: string;
  updatedAt: string;
}

export interface MedicalClearanceRecord {
  id: string;
  caseId: string;
  status: "Pending" | "In progress" | "Needs review" | "Approved" | "Not approved";
  reviewedBy?: string;
  reviewedAt?: string;
  facilityPolicyReference?: string;
  note: string;
  sourceReferenceIds: string[];
  updatedAt: string;
}

export type NursingAssessmentStatus = "Not started" | "In progress" | "Needs review" | "Safety interrupt" | "Complete" | "Amendment in progress";
export type NursingAnswerState = "Answered" | "Unknown" | "Unable to obtain" | "Declined" | "Not assessed" | "Not applicable" | "Conflicting";
export type NursingHandoffStatus = "Reviewed" | "Not reviewed" | "Conflicting" | "Not applicable";
export type NursingReconciliationStatus = "Not started" | "Reconciled" | "Partially reconciled" | "Conflict open" | "Not applicable";
export type NursingMedicalStability = "Stable for current setting" | "Requires urgent provider review" | "Requires emergency transfer" | "Unable to determine";
export type NursingMedicationStatus = "Complete and verified" | "Complete, partially verified" | "Incomplete, pending" | "Unable to complete";
export type NursingObservationRecommendation = "Routine" | "Increased observation" | "Continuous observation recommendation" | "Unable to determine";
export type NursingOrderStatus = "Ordered" | "Pending provider review" | "Not ordered" | "Not applicable";

export interface NursingVitalSigns {
  id: string;
  capturedAt: string;
  temperature: string;
  heartRate: string;
  respiratoryRate: string;
  bloodPressure: string;
  oxygenSaturation: string;
  sourceReferenceIds: string[];
}

export interface NursingAssessmentRecord {
  id: string;
  caseId: string;
  recordVersion: number;
  status: NursingAssessmentStatus;
  assessedAt: string;
  nurseId: string;
  nurseCredentials: string;
  informationSources: SourceType[];
  sourceReliability: "Reliable" | "Partially reliable" | "Unable to determine" | "Conflicting";
  sourceReferenceIds: string[];
  fieldProvenance: Record<string, string[]>;
  stage1HandoffStatus: NursingHandoffStatus;
  reconciliationStatus: NursingReconciliationStatus;
  arrivalCondition: string;
  legalStatusVerification: "Verified" | "Reported not verified" | "Conflicting" | "Not applicable";
  medicalClearanceSourceAndStatus: string;
  immediateNursingPriorities: string[];
  vitalSigns: NursingVitalSigns[];
  painStatus: "Yes" | "No" | "Unknown";
  painDetails: string;
  acuteMedicalComplaints: string;
  physicalFindings: string;
  neurologicFindings: string;
  currentMedicalStability: NursingMedicalStability;
  medicalEscalationActions: string;
  allergyStatus: "Known allergies" | "No known allergies" | "Unable to verify" | "Conflicting information";
  allergiesSummary: string;
  medicationList: string[];
  medicationReconciliationStatus: NursingMedicationStatus;
  medicationSources: SourceType[];
  medicationOpenItems: string;
  intoxicationFindings: string;
  withdrawalFindings: string;
  overdoseHistory: string;
  withdrawalManagement: "None identified" | "Monitor in current setting" | "Urgent provider evaluation" | "Specialty withdrawal management" | "Emergency medical transfer" | "Unable to determine";
  pregnancyStatus: "Pregnant" | "Not pregnant" | "Possible" | "Unknown" | "Not applicable" | "Declined";
  nutritionHydration: string;
  sleepPattern: string;
  adlStatus: string;
  mobilityAndFallRisk: string;
  nursingMentalStatus: {
    appearance: string;
    behavior: string;
    speech: string;
    mood: string;
    affect: string;
    thoughtProcess: string;
    thoughtContent: string;
    perception: string;
    orientationAttentionMemory: string;
    insightJudgmentImpulseControl: string;
  };
  suicideSelfHarmReassessment: string;
  violenceAggressionReassessment: string;
  vulnerabilityElopementReassessment: string;
  riskSummary: string;
  observationRecommendation: NursingObservationRecommendation;
  recommendedPrecautions: string[];
  authorizedOrderStatus: NursingOrderStatus;
  educationAndUnderstanding: string;
  referralsOrConsults: string[];
  nursingSummary: string;
  completionAttestation: boolean;
  conflictNotes: string[];
  previousVersionId?: string;
  updatedAt: string;
}

export type AdmissionEpisodeStatus = "ACTIVE" | "DISCHARGED" | "CLOSED";
export type AdmissionEpisodeRelationship = "ADMISSION_SOURCE" | "TRANSFER_SOURCE" | "READMISSION_SOURCE";
export type AdmissionEpisodeReviewStatus = "Not recorded" | "Recorded" | "Needs review";

export interface AdmissionEpisodeRecord {
  id: string;
  caseId: string;
  sourceAcceptanceId: string;
  relationship: AdmissionEpisodeRelationship;
  facilityId: string;
  facilityName: string;
  programId?: string;
  unitId?: string;
  facilityTimezone: string;
  timezoneSourceReferenceId: string;
  admittedAt: string;
  serviceDate: string;
  status: AdmissionEpisodeStatus;
  admissionOrdersStatus: AdmissionEpisodeReviewStatus;
  initialPostAdmissionReviewStatus: AdmissionEpisodeReviewStatus;
  sourcePacketVersionId?: string;
  sourceCustodyEventId?: string;
  sourceReferenceIds: string[];
  linkedAt: string;
  linkedBy: string;
  updatedAt: string;
}

export interface AdmissionReadiness {
  caseId: string;
  checkpoints: AdmissionCheckpoint[];
  medicalClearance?: MedicalClearanceRecord;
}

export type DischargePlanningStatus = "Not started" | "In progress" | "Needs review" | "Confirmed" | "Not applicable";
export type LevelOfCareOption =
  | "Inpatient"
  | "IOP / intensive outpatient"
  | "Residential / 28-day program"
  | "Outpatient"
  | "Home with supports"
  | "Nursing home"
  | "Assisted living"
  | "Shelter or housing support"
  | "Other configured setting"
  | "Unknown";

export type DischargePlanningDomain =
  | "patient-goals"
  | "family-supports"
  | "housing"
  | "step-down-level"
  | "primary-care"
  | "psychiatric-medication-management"
  | "medications"
  | "transportation"
  | "community-resources"
  | "notifications";

export interface DischargePlanDomain {
  id: string;
  kind: DischargePlanningDomain;
  label: string;
  status: DischargePlanningStatus;
  owner: string;
  note: string;
  selectedLevelOfCare?: LevelOfCareOption;
  sourceReferenceIds: string[];
  dueAt?: string;
  updatedAt: string;
}

export interface DischargePlan {
  id: string;
  caseId: string;
  status: DischargePlanningStatus;
  domains: DischargePlanDomain[];
  dispositionReviewStatus: "Not started" | "Needs authorized review" | "Reviewed";
  updatedAt: string;
}

export interface Assessment {
  id: string;
  caseId: string;
  mode: "Field" | "Clinical";
  presentingProblem: string;
  precipitatingEvents: string;
  dangerToSelf: string;
  dangerToOthers: string;
  graveDisability: string;
  orientation: string;
  psychosis: string;
  moodSleepAppetite: string;
  psychiatricHistory: string;
  treatmentHistory: string;
  substanceUse: string;
  medicalConcerns: string;
  environmentalStressors: string;
  collateralContacts: string;
  protectiveFactors: string;
  lowerLevelConsidered: string;
  mentalStatus: string;
  collateralStatus: "Missing" | "Partial" | "Documented";
  formulation: string;
  reviewStatus: ReviewStatus;
}

export interface MedicalNecessitySnapshot {
  id: string;
  caseId: string;
  severityEvidence: string[];
  functionalImpairment: string[];
  lowerLevelConsidered: string;
  missingItems: string[];
  draftNarrative: string;
  reviewStatus: ReviewStatus;
}

export interface LegalInstrument {
  id: string;
  caseId: string;
  legalStatus: "Unknown" | "Voluntary" | "OPC" | "PEC" | "CEC" | "Court committed";
  requiredFactsComplete: boolean;
  clockStatus: "Display only" | "Active" | "Due soon" | "Unknown";
  draftText: string;
  reviewStatus: ReviewStatus;
  // Louisiana e-PEC lifecycle (optional overlay — existing consumers reading only the
  // fields above are unaffected). See app/src/domain/epecRuleSets.ts for the
  // jurisdiction-configurable statute refs, windows, and option lists behind this.
  ruleSetId?: string;
  opc?: OpcRecord;
  pec?: PecRecord;
  cec?: CecRecord;
}

export interface OpcRecord {
  issuedAt: string;
  requestor: string;
  relation: string;
  observed: string;
  grounds: string[];
  expiresAt: string;
}

export interface PecRecord {
  examinerName: string;
  examinerType: string;
  examinedAt: string;
  findings: string[];
  conditions: string[];
  telemedicine: boolean;
  narrative: string;
  executedAt: string;
  sealHash?: string;
  transmittedAt?: string;
  facilityResponseId?: string;
  // Fields reconciled against the official OBH-1 / OBH-1A forms — see
  // docs/legal/LOUISIANA_OPC_PEC_CEC_FORM_VERIFICATION.md. All optional so existing
  // seeded instruments remain valid.
  /** Which printed form this signer executes: psychologists use OBH-1A, everyone else OBH-1. */
  form?: "OBH-1" | "OBH-1A";
  /** The "1st" / "2nd" checkbox printed in the CHECK row of OBH-1 / OBH-1A. */
  certificateSequence?: "1st" | "2nd";
  /** Required attestation when a non-psychiatric NP signs (La. R.S. 28:53(B)(1)). */
  collaboratingPhysicianName?: string;
  /** Printed in the form's "LA MEDICAL LICENSE NUMBER" field regardless of issuing board. */
  examinerLicenseNumber?: string;
  /** One-of-one control number printed on the generated form and used to trace the instance. */
  formInstanceId?: string;
}

export interface CecRecord {
  examinerName: string;
  findings: string[];
  conditions: string[];
  /**
   * Maps to OBH-2's "Complete either A or B": Continued = Conclusion A (needs treatment),
   * Discharged = Conclusion B ("not a proper subject for emergency admission"), which ends
   * the legal basis for the hold and triggers the R.S. 28:53.1 discharge-notification duties.
   */
  outcome: "Continued" | "Discharged";
  dischargeReason?: string;
  executedAt: string;
  recordFrozenAt: string;
  /** Printed in OBH-2's "LA MEDICAL LICENSE NUMBER" field; also the independence cross-check key. */
  examinerLicenseNumber?: string;
  /** One-of-one control number printed on the generated OBH-2. */
  formInstanceId?: string;
}

export interface CustodyLedgerEvent {
  id: string;
  caseId: string;
  eventType: string;
  actor: string;
  occurredAt: string;
  payload: Record<string, unknown>;
  previousHash: string | null;
  eventHash: string;
}

export interface ReferralPacket {
  id: string;
  caseId: string;
  status: "Draft" | "Ready" | "Sent";
  completeness: number;
  includedArtifactLabels: string[];
  packetHash: string;
}

export interface FacilityReferral {
  id: string;
  caseId: string;
  packetId: string;
  facilityName: string;
  status: "Draft" | "Sent" | "Accepted" | "Declined" | "Info requested" | "Waitlisted";
  sentAt?: string;
}

export interface FacilityResponse {
  id: string;
  referralId: string;
  response: FacilityResponseKind;
  reasonCode?: string;
  note: string;
  respondedAt?: string;
}

export interface AuditLog {
  id: string;
  caseId: string;
  action: string;
  actor: string;
  occurredAt: string;
}

export interface Case {
  id: string;
  patientToken: PatientToken;
  currentStage: CaseStage;
  priority: "Routine" | "Urgent" | "Emergent";
  openedAt: string;
  assignedOwner: string;
  legalStatus: LegalInstrument["legalStatus"];
  packetCompleteness: number;
  routingStatus: FacilityReferral["status"];
}

export interface AnalyticsEvent {
  id: string;
  source: "clarity-v0.1";
  eventType:
    | "CASE_CREATED"
    | "ASSESSMENT_UPDATED"
    | "RISK_FINDING_ADDED"
    | "MED_NECESSITY_DRAFT_RENDERED"
    | "LEGAL_STATUS_UPDATED"
    | "PACKET_PREVIEWED"
    | "ROUTING_RESPONSE_RECEIVED"
    | "CUSTODY_CHAIN_VERIFIED"
    | "PACKET_SENT"
    | "DOCUMENTATION_GAP"
    | "OPC_ISSUED"
    | "PEC_EXECUTED"
    | "CEC_EXECUTED";
  occurredAt: string;
  organizationToken: string;
  caseId: string;
  metricsSafePayload: Record<string, string | number | boolean | null>;
}

export type ClockLane = "Clinical" | "Financial" | "Legal";

export interface ComplianceClock {
  id: string;
  caseId: string;
  label: string;
  lane: ClockLane;
  startedAt: string;
  targetMinutes: number;
  stoppedAt?: string;
  counselValidationRequired: boolean;
}

export interface AcuityProfile {
  acuityLevel: 1 | 2 | 3 | 4 | 5;
  aggressionRisk: "Low" | "Moderate" | "High" | "Unknown";
  elopementRisk: "Low" | "Moderate" | "High" | "Unknown";
  siPrecautions: boolean;
  vulnerableAdult: boolean;
  observationLevel: "Routine" | "Q15" | "1:1" | "Unknown";
}

export interface Unit {
  id: string;
  name: string;
  population: "Adult" | "Geriatric" | "Youth";
  acuityCeiling: number;
}

export interface Bed {
  id: string;
  unitId: string;
  room: string;
  label: string;
  nearNurseStation: boolean;
  nearExit: boolean;
  status: "Available" | "Occupied" | "Blocked";
  occupantToken?: string;
  occupantAcuity?: AcuityProfile;
}

export interface PlacementFlag {
  severity: "Info" | "Warning" | "Hard stop";
  code: string;
  message: string;
}

export interface PlacementRecommendation {
  id: string;
  caseId: string;
  bedId: string;
  candidateAcuity: AcuityProfile;
  rationale: string;
  status: "Suggested" | "Accepted" | "Overridden";
  overrideReason?: string;
  decidedBy?: string;
  decidedAt?: string;
}

export interface AppState {
  cases: Case[];
  encounters: Encounter[];
  prescreenRecords?: PrescreenRecord[];
  assessments: Assessment[];
  sourceReferences: SourceReference[];
  riskFindings: RiskFinding[];
  medicalNecessitySnapshots: MedicalNecessitySnapshot[];
  legalInstruments: LegalInstrument[];
  custodyLedgerEvents: CustodyLedgerEvent[];
  referralPackets: ReferralPacket[];
  facilityReferrals: FacilityReferral[];
  facilityResponses: FacilityResponse[];
  complianceClocks: ComplianceClock[];
  units: Unit[];
  beds: Bed[];
  placementRecommendations: PlacementRecommendation[];
  medicalClearanceRecords?: MedicalClearanceRecord[];
  admissionCheckpoints?: AdmissionCheckpoint[];
  nursingAssessments?: NursingAssessmentRecord[];
  nursingAssessmentHistory?: NursingAssessmentRecord[];
  admissionEpisodes?: AdmissionEpisodeRecord[];
  dischargePlans?: DischargePlan[];
  auditLogs: AuditLog[];
  analyticsEvents: AnalyticsEvent[];
}
