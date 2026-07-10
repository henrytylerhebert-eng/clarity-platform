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
    | "DOCUMENTATION_GAP";
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
  auditLogs: AuditLog[];
  analyticsEvents: AnalyticsEvent[];
}
