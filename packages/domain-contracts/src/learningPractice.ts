import type { UserRole } from "./roles.js";

export type OrganizationId = string;
export type ActorId = string;
export type CaseRef = string;
export type FacilityId = string;
export type ProgramId = string;

export type LearningModuleStatus = "DRAFT" | "ACTIVE" | "RETIRED" | "SUPERSEDED";
export type ObservationState = "RECORDED" | "NEEDS_REVIEW" | "READY_TO_ACKNOWLEDGE" | "SUPERSEDED";
export type ObservationConfidence =
  | "DETERMINISTIC"
  | "HUMAN_REVIEWED"
  | "SYNTHETIC_ASSESSED"
  | "INSUFFICIENT_EVIDENCE"
  | "CONTESTED"
  | "SUPERSEDED";
export type RecognitionCandidateType = "RECOGNITION" | "COACHING" | "HUMAN_REVIEW" | "NO_ACTION";
export type RecognitionState =
  | "PENDING"
  | "READY_TO_ACKNOWLEDGE"
  | "CONTESTED"
  | "CONFIRMED"
  | "DISMISSED"
  | "SUPERSEDED";
export type AcknowledgementAction = "ACKNOWLEDGE" | "ADD_CONTEXT" | "CONTEST" | "RESOLVE_CONTEST" | "DISMISS";
export type CompetencyEvidenceType =
  | "SYNTHETIC_DEMONSTRATION"
  | "LIVE_OBSERVED"
  | "TRAINER_ASSESSMENT"
  | "MANAGER_ACKNOWLEDGEMENT"
  | "ASSURANCE_EVIDENCE";

export interface LearningModuleVersion {
  moduleId: string;
  version: string;
  title: string;
  status: LearningModuleStatus;
  sourceArtifact: string;
  sourceVersion: string;
  organizationEdition: string | null;
  audienceRoles: UserRole[];
  prerequisites: string[];
  owner: string | null;
}

export interface Competency {
  competencyId: string;
  domain: string;
  definition: string;
  owner: string | null;
  allowedEvidenceTypes: CompetencyEvidenceType[];
}

export interface RolePathwayVersion {
  pathwayId: string;
  version: string;
  roleFamily: UserRole;
  moduleIds: string[];
  organizationEdition: string | null;
  recertificationRuleId: string | null;
}

export interface PracticeScenario {
  scenarioId: string;
  version: string;
  title: string;
  syntheticFixtureVersion: string;
  roleFamily: UserRole;
  targetCompetencyId: string;
  moduleId: string;
  expectedActions: ScenarioAction[];
  criticalErrors: ScenarioAction[];
  initialFacts: SyntheticFact[];
}

export interface SyntheticFact {
  factId: string;
  sourceLabel: string;
  statement: string;
  sourceReliability: "UNKNOWN" | "LOW" | "MODERATE" | "HIGH";
}

export type ScenarioAction =
  | "IDENTIFY_CONTRADICTION"
  | "PRESERVE_BOTH_SOURCES"
  | "ESCALATE_FOR_REVIEW"
  | "SILENTLY_RESOLVE_CONTRADICTION"
  | "COMPLETE_SCENARIO";

export type SyntheticWorkflowEventType =
  | "PRACTICE_SCENARIO_STARTED"
  | "CONTRADICTION_IDENTIFIED"
  | "CONTRADICTION_PRESERVED"
  | "CONTRADICTION_ESCALATED"
  | "CONTRADICTION_SILENTLY_RESOLVED"
  | "PRACTICE_SCENARIO_COMPLETED"
  | "ADMISSION_RECORDED"
  | "REVENUE_RECORDED"
  | "CENSUS_UPDATED";

export interface SyntheticWorkflowEvent {
  sessionId: string;
  eventId: string;
  schemaVersion: "1.0.0";
  organizationId: OrganizationId;
  facilityId: FacilityId | null;
  programId: ProgramId | null;
  caseRef: CaseRef;
  actorId: ActorId;
  eventType: SyntheticWorkflowEventType;
  recordedAt: string;
  synthetic: true;
  scenarioId: string;
  dataQuality: "COMPLETE" | "PARTIAL" | "UNKNOWN";
  reviewState: "SYNTHETIC";
  evidenceRefs: string[];
}

export interface ObservableBehaviorRuleVersion {
  ruleId: string;
  version: string;
  competencyId: string;
  triggerEvents: SyntheticWorkflowEventType[];
  evaluatorType: "DETERMINISTIC" | "HUMAN_REVIEWED" | "SYNTHETIC_ASSESSED" | "ASSURANCE_REVIEWED";
  requiredEvidence: SyntheticWorkflowEventType[];
  prohibitedInputs: string[];
  organizationEdition: string | null;
}

export interface PracticeObservation {
  observationId: string;
  organizationId: OrganizationId;
  facilityId: FacilityId | null;
  programId: ProgramId | null;
  actorId: ActorId;
  competencyId: string;
  ruleId: string;
  ruleVersion: string;
  state: ObservationState;
  confidence: ObservationConfidence;
  evidenceRefs: string[];
  caseRef: CaseRef | null;
  episodeRef: string | null;
  observedAt: string;
  moduleVersion: string | null;
  organizationEdition: string | null;
}

export interface RecognitionCandidate {
  organizationId: OrganizationId;
  candidateId: string;
  observationId: string;
  type: RecognitionCandidateType;
  state: RecognitionState;
  reviewOwnerId: string | null;
  createdAt: string;
}

export interface Acknowledgement {
  organizationId: OrganizationId;
  acknowledgementId: string;
  candidateId: string;
  actorId: ActorId;
  action: AcknowledgementAction;
  context: string | null;
  recordedAt: string;
}

export interface CompetencyEvidence {
  organizationId: OrganizationId;
  evidenceId: string;
  personId: ActorId;
  roleScope: UserRole | null;
  competencyId: string;
  evidenceType: CompetencyEvidenceType;
  sourceRef: string;
  validUntil: string | null;
  recordedAt: string;
}

export interface LearningPathView {
  pathway: RolePathwayVersion;
  modules: LearningModuleVersion[];
  competencies: Array<{
    competency: Competency;
    evidence: CompetencyEvidence[];
    demonstrated: boolean;
  }>;
}

export interface NoticeCardView {
  candidateId: string;
  observationId: string;
  title: string;
  observedBehavior: string;
  whyItMatters: string;
  competencyLabel: string;
  evidenceRefs: string[];
  ruleVersionLabel: string;
  confidence: ObservationConfidence;
  state: RecognitionState;
  allowedActions: AcknowledgementAction[];
}
