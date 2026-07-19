import type { AppState, NursingAssessmentRecord } from "./types";

export function getNursingAssessment(state: AppState, caseId: string): NursingAssessmentRecord | undefined {
  return state.nursingAssessments?.find((item) => item.caseId === caseId);
}

export function createDefaultNursingAssessment(state: AppState, caseId: string, updatedAt = new Date().toISOString()): NursingAssessmentRecord {
  const sourceReferenceIds = state.sourceReferences.filter((item) => item.caseId === caseId).map((item) => item.id);
  return {
    id: `nursing-assessment-${caseId}`,
    caseId,
    recordVersion: 1,
    status: "Not started",
    assessedAt: updatedAt,
    nurseId: "",
    nurseCredentials: "",
    informationSources: [],
    sourceReliability: "Unable to determine",
    sourceReferenceIds,
    fieldProvenance: sourceReferenceIds.length ? { stage2_record: sourceReferenceIds } : {},
    stage1HandoffStatus: "Not reviewed",
    reconciliationStatus: "Not started",
    arrivalCondition: "",
    legalStatusVerification: "Reported not verified",
    medicalClearanceSourceAndStatus: "",
    immediateNursingPriorities: [],
    vitalSigns: [],
    painStatus: "Unknown",
    painDetails: "",
    acuteMedicalComplaints: "",
    physicalFindings: "",
    neurologicFindings: "",
    currentMedicalStability: "Unable to determine",
    medicalEscalationActions: "",
    allergyStatus: "Unable to verify",
    allergiesSummary: "",
    medicationList: [],
    medicationReconciliationStatus: "Incomplete, pending",
    medicationSources: [],
    medicationOpenItems: "",
    intoxicationFindings: "",
    withdrawalFindings: "",
    overdoseHistory: "",
    withdrawalManagement: "Unable to determine",
    pregnancyStatus: "Unknown",
    nutritionHydration: "",
    sleepPattern: "",
    adlStatus: "",
    mobilityAndFallRisk: "",
    nursingMentalStatus: {
      appearance: "",
      behavior: "",
      speech: "",
      mood: "",
      affect: "",
      thoughtProcess: "",
      thoughtContent: "",
      perception: "",
      orientationAttentionMemory: "",
      insightJudgmentImpulseControl: "",
    },
    suicideSelfHarmReassessment: "",
    violenceAggressionReassessment: "",
    vulnerabilityElopementReassessment: "",
    riskSummary: "",
    observationRecommendation: "Unable to determine",
    recommendedPrecautions: [],
    authorizedOrderStatus: "Pending provider review",
    educationAndUnderstanding: "",
    referralsOrConsults: [],
    nursingSummary: "",
    completionAttestation: false,
    conflictNotes: [],
    updatedAt,
  };
}

export function isNursingAssessmentComplete(record: NursingAssessmentRecord | undefined): boolean {
  return Boolean(
    record
    && record.status === "Complete"
    && record.completionAttestation
    && record.nurseId.trim().length > 0
    && record.nurseCredentials.trim().length > 0
    && record.sourceReferenceIds.length > 0
    && record.stage1HandoffStatus === "Reviewed"
    && record.reconciliationStatus !== "Conflict open"
    && record.currentMedicalStability !== "Unable to determine"
    && record.medicationReconciliationStatus !== "Incomplete, pending"
    && record.conflictNotes.length === 0,
  );
}
