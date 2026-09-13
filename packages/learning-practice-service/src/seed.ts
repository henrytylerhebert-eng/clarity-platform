import type {
  Competency,
  LearningModuleVersion,
  ObservableBehaviorRuleVersion,
  PracticeScenario,
  RolePathwayVersion,
} from "@clarity/domain-contracts";

export const CENTRAL_INTAKE_ROLE = "INTAKE_COORDINATOR";
export const CONTRADICTION_COMPETENCY_ID = "COMP-EI-03";
export const CONTRADICTION_MODULE_ID = "MOD-EI-03";
export const CONTRADICTION_RULE_ID = "OBS-EI-03";
export const CONTRADICTION_SCENARIO_ID = "SCN-EI-03";

export const learningModule: LearningModuleVersion = {
  moduleId: CONTRADICTION_MODULE_ID,
  version: "1.0.0",
  title: "Contradictions & Source Reliability",
  status: "ACTIVE",
  sourceArtifact: "Behavioral Health CMO-CRO Master Manual",
  sourceVersion: "1.0.0",
  organizationEdition: "SYNTHETIC_DEMO",
  audienceRoles: [CENTRAL_INTAKE_ROLE],
  prerequisites: [],
  owner: "Learning & Practice",
};

export const competency: Competency = {
  competencyId: CONTRADICTION_COMPETENCY_ID,
  domain: "EVIDENCE_INTEGRITY",
  definition:
    "Preserves contradictory source statements, avoids silently choosing a winner, and routes the contradiction for qualified review.",
  owner: "Central Intake Training",
  allowedEvidenceTypes: ["SYNTHETIC_DEMONSTRATION", "TRAINER_ASSESSMENT", "ASSURANCE_EVIDENCE"],
};

export const centralIntakePathway: RolePathwayVersion = {
  pathwayId: "PATH-CENTRAL-INTAKE-001",
  version: "1.0.0",
  roleFamily: CENTRAL_INTAKE_ROLE,
  moduleIds: [CONTRADICTION_MODULE_ID],
  organizationEdition: "SYNTHETIC_DEMO",
  recertificationRuleId: null,
};

export const contradictionScenario: PracticeScenario = {
  scenarioId: CONTRADICTION_SCENARIO_ID,
  version: "1.0.0",
  title: "Preserve Contradictory Collateral",
  syntheticFixtureVersion: "1.0.0",
  roleFamily: CENTRAL_INTAKE_ROLE,
  targetCompetencyId: CONTRADICTION_COMPETENCY_ID,
  moduleId: CONTRADICTION_MODULE_ID,
  expectedActions: ["IDENTIFY_CONTRADICTION", "PRESERVE_BOTH_SOURCES", "ESCALATE_FOR_REVIEW", "COMPLETE_SCENARIO"],
  criticalErrors: ["SILENTLY_RESOLVE_CONTRADICTION"],
  initialFacts: [
    {
      factId: "FACT-A",
      sourceLabel: "Synthetic sending-nurse collateral",
      statement: "At simulated handoff checkpoint T0, the patient was oriented to person, place, time, and situation and denied current thoughts of death.",
      sourceReliability: "MODERATE",
    },
    {
      factId: "FACT-B",
      sourceLabel: "Synthetic field-responder note",
      statement: "At simulated handoff checkpoint T0, the patient was not oriented to place and reported current passive thoughts of death.",
      sourceReliability: "MODERATE",
    },
  ],
};

export const contradictionRule: ObservableBehaviorRuleVersion = {
  ruleId: CONTRADICTION_RULE_ID,
  version: "1.0.0",
  competencyId: CONTRADICTION_COMPETENCY_ID,
  triggerEvents: ["PRACTICE_SCENARIO_COMPLETED"],
  evaluatorType: "DETERMINISTIC",
  requiredEvidence: ["CONTRADICTION_IDENTIFIED", "CONTRADICTION_PRESERVED", "CONTRADICTION_ESCALATED"],
  prohibitedInputs: [
    "ADMISSION_COUNT",
    "CENSUS",
    "REVENUE",
    "REFERRAL_CONVERSION",
    "LENGTH_OF_STAY",
    "DENIAL_RATE",
    "PATIENT_DISPOSITION",
    "CASE_READINESS_SCORE",
  ],
  organizationEdition: "SYNTHETIC_DEMO",
};

// In-memory policy is immutable; consumers receive clones from the service.
function deepFreeze(value: object): void {
  Object.values(value).forEach((child: unknown) => {
    if (child && typeof child === "object") deepFreeze(child);
  });
  Object.freeze(value);
}
[learningModule, competency, centralIntakePathway, contradictionScenario, contradictionRule].forEach(deepFreeze);
