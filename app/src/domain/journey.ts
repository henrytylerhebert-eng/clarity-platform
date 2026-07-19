import { sortCases } from "./selectors";
import { getAdmissionEpisode, isAdmissionEpisodeComplete } from "./admissionEpisode";
import { getNursingAssessment, isNursingAssessmentComplete } from "./nursingAssessment";
import type { RoleId } from "./roles";
import type {
  AdmissionCheckpoint,
  AdmissionCheckpointKind,
  AdmissionCheckpointStatus,
  AppState,
  DischargePlan,
  DischargePlanDomain,
  DischargePlanningDomain,
  HumanDisposition,
  HumanTriageStatus,
  LevelOfCareOption,
  MedicalClearanceRecord,
  PrescreenRecord,
} from "./types";

export type JourneyPhaseId = "prescreen" | "intake" | "admit" | "discharge" | "postdischarge";
export type JourneyStatus =
  | "Complete"
  | "In progress"
  | "Pending"
  | "Needs review"
  | "Blocked"
  | "External wait"
  | "Not built"
  | "Not applicable";

export interface JourneyMilestone {
  id: string;
  phase: JourneyPhaseId;
  label: string;
  responsibleRoleId: RoleId;
  responsibleLabel: string;
  status: JourneyStatus;
  evidence: string;
  nextStep: string;
}

export interface JourneyPhaseReading {
  phase: JourneyPhaseId;
  label: string;
  milestones: JourneyMilestone[];
  completed: number;
  built: number;
  notBuilt: number;
  percent: number;
}

export interface JourneyReading {
  caseId: string;
  phases: JourneyPhaseReading[];
  nextAction: JourneyMilestone | null;
  buildGaps: JourneyMilestone[];
}

export interface HandoffItem {
  caseId: string;
  caseLabel: string;
  priority: AppState["cases"][number]["priority"];
  milestone: JourneyMilestone;
}

export interface HandoffGroup {
  responsibleLabel: string;
  items: HandoffItem[];
}

export const journeyPhaseOrder: Array<{ id: JourneyPhaseId; label: string }> = [
  { id: "prescreen", label: "Prescreen" },
  { id: "intake", label: "Intake" },
  { id: "admit", label: "Admit" },
  { id: "discharge", label: "Discharge planning" },
  { id: "postdischarge", label: "Post-discharge" },
];

export const monitoredPhases: JourneyPhaseId[] = ["prescreen", "intake", "admit", "discharge"];

const defaultDomainDefinitions: Array<{ kind: DischargePlanningDomain; label: string; owner: string; note: string }> = [
  { kind: "patient-goals", label: "Patient goals and preferences", owner: "Clinical/social-services integrator", note: "Prompt for the person's goals and preferences; confirmation is required." },
  { kind: "family-supports", label: "Family, caregiver, and supports", owner: "Clinical/social-services integrator", note: "Identify supports, consent boundaries, and unresolved collateral." },
  { kind: "housing", label: "Housing and placement", owner: "Central intake coordinator", note: "Record housing, homelessness, nursing-home, or assisted-living needs." },
  { kind: "step-down-level", label: "Step-down level of care", owner: "Authorized clinician", note: "Select a configured next setting only after qualified review." },
  { kind: "primary-care", label: "Primary-care follow-up", owner: "Central intake coordinator", note: "Default prompt; appointment is not arranged until confirmed." },
  { kind: "psychiatric-medication-management", label: "Psychiatric medication management", owner: "Authorized clinician", note: "Default prompt when appropriate; requires human confirmation." },
  { kind: "medications", label: "Medication reconciliation and prescriptions", owner: "Nurse / prescriber", note: "Reconcile and route to the authorized prescriber; no order is inferred." },
  { kind: "transportation", label: "Discharge transportation", owner: "Central intake coordinator", note: "Document the transport plan or the unresolved external wait." },
  { kind: "community-resources", label: "Community resources", owner: "Clinical/social-services integrator", note: "Capture referrals, benefits, and community support needs." },
  { kind: "notifications", label: "Required notifications", owner: "Compliance / legal reviewer", note: "Counsel-validated checklist; no statutory conclusion is automated." },
];

function defaultPrescreen(state: AppState, caseId: string): PrescreenRecord {
  const caseRecord = state.cases.find((item) => item.id === caseId);
  const encounter = state.encounters.find((item) => item.caseId === caseId);
  const assessment = state.assessments.find((item) => item.caseId === caseId);
  const riskFindings = state.riskFindings.filter((item) => item.caseId === caseId);
  return {
    id: `prescreen-derived-${caseId}`,
    caseId,
    referralSource: encounter?.referralSource ?? "Unknown",
    referralReceivedAt: encounter?.startedAt ?? caseRecord?.openedAt ?? "Unknown",
    currentLocation: caseRecord?.patientToken.location ?? "Unknown",
    presentingConcern: assessment?.presentingProblem ?? "Unknown",
    immediateSafety: riskFindings.length ? riskFindings.map((item) => `${item.type}: ${item.summary}`).join("; ") : "Unknown",
    medicalConcerns: assessment?.medicalConcerns ?? "Unknown",
    custodyContext: "Unknown",
    urgency: caseRecord?.priority ?? "Unknown",
    collateralStatus: assessment?.collateralStatus ?? "Unknown",
    triageStatus: "Not started",
    humanDisposition: "Not recorded",
    assignedOwner: caseRecord?.assignedOwner ?? "Unassigned",
    nextAction: "Record the authorized human triage and next path.",
    sourceReferenceIds: state.sourceReferences.filter((item) => item.caseId === caseId).map((item) => item.id),
    updatedAt: caseRecord?.openedAt ?? "Unknown",
  };
}

export function getPrescreenRecord(state: AppState, caseId: string): PrescreenRecord {
  return state.prescreenRecords?.find((item) => item.caseId === caseId) ?? defaultPrescreen(state, caseId);
}

export function hasStoredPrescreen(state: AppState, caseId: string): boolean {
  return Boolean(state.prescreenRecords?.some((item) => item.caseId === caseId));
}

function defaultCheckpoint(
  caseId: string,
  kind: AdmissionCheckpointKind,
  status: AdmissionCheckpointStatus,
  owner: string,
  reviewAuthority: string,
  note: string,
  updatedAt: string,
): AdmissionCheckpoint {
  return {
    id: `admission-${kind}-${caseId}`,
    caseId,
    kind,
    status,
    owner,
    reviewAuthority,
    note,
    sourceArtifactIds: [],
    updatedAt,
  };
}

export function getAdmissionReadiness(state: AppState, caseId: string): {
  checkpoints: AdmissionCheckpoint[];
  medicalClearance: MedicalClearanceRecord;
} {
  const caseRecord = state.cases.find((item) => item.id === caseId);
  const stored = state.admissionCheckpoints?.filter((item) => item.caseId === caseId) ?? [];
  const storedByKind = new Map(stored.map((item) => [item.kind, item]));
  const referrals = state.facilityReferrals.filter((item) => item.caseId === caseId);
  const placements = state.placementRecommendations.filter((item) => item.caseId === caseId);
  const ledgerEvents = state.custodyLedgerEvents.filter((item) => item.caseId === caseId);
  const updatedAt = caseRecord?.openedAt ?? "Unknown";
  const arrivalRecorded = ledgerEvents.some((item) => /ARRIVAL|CUSTODY_TRANSFER|HANDOFF/i.test(item.eventType));
  const facilityAccepted = referrals.some((item) => item.status === "Accepted");
  const placementReady = placements.some((item) => item.status === "Accepted");
  const episode = getAdmissionEpisode(state, caseId);
  const episodeComplete = isAdmissionEpisodeComplete(episode);
  const operationalStatus: AdmissionCheckpointStatus = facilityAccepted && placementReady
    ? "Complete"
    : facilityAccepted || placements.some((item) => item.status === "Suggested")
      ? "In progress"
      : "Pending";
  const defaults: AdmissionCheckpoint[] = [
    defaultCheckpoint(caseId, "psychiatrist-acceptance", "Pending", "Receiving/admitting psychiatrist", "Psychiatrist", "Acceptance must be recorded by the authorized admitting psychiatrist.", updatedAt),
    defaultCheckpoint(caseId, "medical-clearance", "Pending", "Authorized medical reviewer", "Medical reviewer", "Medical clearance is separate from nursing screening and medical necessity.", updatedAt),
    defaultCheckpoint(caseId, "operational-readiness", operationalStatus, "Central intake / facility / charge nurse", "Facility policy owners", facilityAccepted ? "Facility response recorded; bed and transport remain separate operational dependencies." : "Facility acceptance, bed, and transport are not complete.", updatedAt),
    defaultCheckpoint(caseId, "arrival-handoff", arrivalRecorded ? "Complete" : "Pending", "Receiving facility and transport", "Receiving nurse / custody owner", arrivalRecorded ? "Arrival or custody handoff event is present in the ledger." : "No arrival, custody transfer, or receiving handoff event is present.", updatedAt),
    defaultCheckpoint(caseId, "admission-episode", episodeComplete ? "Complete" : episode ? "Needs review" : "Pending", "Receiving facility", "Admission workflow owner", episodeComplete ? "Case-owned episode, admission orders, and initial post-admission review are recorded." : episode ? "Case-owned episode exists but orders or initial post-admission review remain unresolved." : "Create the case-owned admission episode after the preceding admit checkpoints are satisfied.", updatedAt),
  ];
  const checkpoints = defaults.map((item) => storedByKind.get(item.kind) ?? item);
  const clearance = state.medicalClearanceRecords?.find((item) => item.caseId === caseId) ?? {
    id: `clearance-derived-${caseId}`,
    caseId,
    status: "Pending" as const,
    facilityPolicyReference: "Synthetic facility policy placeholder",
    note: "No first-class medical-clearance approval is recorded in local state.",
    sourceReferenceIds: [],
    updatedAt,
  };
  return { checkpoints, medicalClearance: clearance };
}

function defaultDischargePlan(state: AppState, caseId: string): DischargePlan {
  const timestamp = state.cases.find((item) => item.id === caseId)?.openedAt ?? "Unknown";
  const domains: DischargePlanDomain[] = defaultDomainDefinitions.map((definition) => ({
    id: `discharge-${definition.kind}-${caseId}`,
    kind: definition.kind,
    label: definition.label,
    status: "Not started",
    owner: definition.owner,
    note: definition.note,
    selectedLevelOfCare: definition.kind === "step-down-level" ? "Unknown" : undefined,
    sourceReferenceIds: [],
    updatedAt: timestamp,
  }));
  return {
    id: `discharge-plan-derived-${caseId}`,
    caseId,
    status: "In progress",
    domains,
    dispositionReviewStatus: "Not started",
    updatedAt: timestamp,
  };
}

export function getDischargePlan(state: AppState, caseId: string): DischargePlan {
  return state.dischargePlans?.find((item) => item.caseId === caseId) ?? defaultDischargePlan(state, caseId);
}

export function buildDefaultDischargeDomain(kind: DischargePlanningDomain, caseId: string, updatedAt: string): DischargePlanDomain {
  const definition = defaultDomainDefinitions.find((item) => item.kind === kind) ?? defaultDomainDefinitions[0];
  return {
    id: `discharge-${definition.kind}-${caseId}`,
    kind: definition.kind,
    label: definition.label,
    status: "Not started",
    owner: definition.owner,
    note: definition.note,
    selectedLevelOfCare: definition.kind === "step-down-level" ? "Unknown" : undefined,
    sourceReferenceIds: [],
    updatedAt,
  };
}

function milestone(
  phase: JourneyPhaseId,
  id: string,
  label: string,
  responsibleRoleId: RoleId,
  responsibleLabel: string,
  status: JourneyStatus,
  evidence: string,
  nextStep: string,
): JourneyMilestone {
  return { id, phase, label, responsibleRoleId, responsibleLabel, status, evidence, nextStep };
}

function reviewStatus(status: string | undefined): JourneyStatus {
  if (status === "Clinician reviewed" || status === "Signed locked") return "Complete";
  if (status === "Needs clinician review" || status === "Counsel validation required") return "Needs review";
  return status ? "In progress" : "Pending";
}

function isResolvedAnswer(value: string): boolean {
  return Boolean(value.trim()) && !/^(unknown|not assessed|unable to obtain|declined|conflicting)$/i.test(value.trim());
}

function checkpointStatus(status: AdmissionCheckpointStatus): JourneyStatus {
  if (status === "Accepted" || status === "Approved" || status === "Complete") return "Complete";
  if (status === "Needs review") return "Needs review";
  if (status === "Blocked" || status === "Declined") return "Blocked";
  if (status === "Not built") return "Not built";
  return status;
}

export function deriveJourney(state: AppState, caseId: string, _nowIso: string): JourneyReading {
  const caseRecord = state.cases.find((item) => item.id === caseId);
  const encounter = state.encounters.find((item) => item.caseId === caseId);
  const assessment = state.assessments.find((item) => item.caseId === caseId);
  const riskFindings = state.riskFindings.filter((item) => item.caseId === caseId);
  const medicalNecessity = state.medicalNecessitySnapshots.find((item) => item.caseId === caseId);
  const legalInstrument = state.legalInstruments.find((item) => item.caseId === caseId);
  const prescreen = getPrescreenRecord(state, caseId);
  const admission = getAdmissionReadiness(state, caseId);
  const nursingAssessment = getNursingAssessment(state, caseId);
  const discharge = getDischargePlan(state, caseId);
  const sourceCount = state.sourceReferences.filter((item) => item.caseId === caseId).length;
  const sourcedRiskCount = riskFindings.filter((item) => item.sourceReferenceIds.length > 0).length;
  const dischargeConfirmed = discharge.domains.filter((item) => item.status === "Confirmed" || item.status === "Not applicable").length;
  const cecOutcome = legalInstrument?.cec?.outcome;

  const milestones: JourneyMilestone[] = [
    milestone("prescreen", "referral-received", "Referral received / case created", "field", "Field responder", caseRecord ? "Complete" : "Pending", caseRecord ? `Case opened ${caseRecord.openedAt}` : "No case record", "Create the case from the referral."),
    milestone("prescreen", "initial-screen", "Initial clinical and operational screen", "field", "Field responder / crisis clinician", isResolvedAnswer(prescreen.presentingConcern) && isResolvedAnswer(prescreen.immediateSafety) && isResolvedAnswer(prescreen.medicalConcerns) ? "Complete" : "In progress", "Immediate safety and medical context are captured as source facts; they are not autonomous triage.", "Complete the minimum screen and document unknowns."),
    milestone("prescreen", "human-triage-disposition", "Authorized human triage and disposition", "clinician", "Authorized clinical / medical reviewer", prescreen.triageStatus === "Reviewed" && prescreen.humanDisposition !== "Not recorded" ? "Complete" : prescreen.triageStatus === "Needs authorized review" ? "Needs review" : "Pending", `Triage: ${prescreen.triageStatus}; disposition: ${prescreen.humanDisposition}.`, "Record the authorized human next path."),
    milestone("prescreen", "prescreen-handoff", "Owner and next workflow assigned", "central", "Central intake coordinator", prescreen.assignedOwner !== "Unassigned" && prescreen.nextAction.trim() ? "Complete" : "Pending", `Owner: ${prescreen.assignedOwner}.`, "Assign the next owner and handoff task."),

    milestone("intake", "intake-stage-1", "Stage 1 — field / crisis intake", "field", "Field responder / crisis clinician", encounter && assessment ? "Complete" : "Pending", encounter && assessment ? "Encounter and initial assessment are present." : "No field/crisis intake record is available.", "Capture the brief safety-first intake."),
    milestone("intake", "intake-stage-2", "Stage 2 — nursing assessment", "nurse", "Registered nurse", !nursingAssessment ? "Pending" : isNursingAssessmentComplete(nursingAssessment) ? "Complete" : nursingAssessment.status === "Safety interrupt" ? "Blocked" : nursingAssessment.status === "Needs review" ? "Needs review" : "In progress", nursingAssessment ? `RN record v${nursingAssessment.recordVersion}; handoff ${nursingAssessment.stage1HandoffStatus}; reconciliation ${nursingAssessment.reconciliationStatus}.` : "No RN Stage 2 record has been started.", "Open Guided Intake Stage 2 and verify the handoff, medical screen, medication reconciliation, and nursing risk reassessment."),
    milestone("intake", "intake-stage-3", "Stage 3 — comprehensive clinical/social assessment", "clinician", "Clinical/social-services integrator", assessment ? assessment.formulation.trim() && assessment.collateralStatus === "Documented" ? "Complete" : "In progress" : "Pending", assessment ? `Collateral: ${assessment.collateralStatus}; formulation ${assessment.formulation.trim() ? "present" : "missing"}.` : "No comprehensive assessment is available.", "Complete the integrated assessment and seed discharge planning."),
    milestone("intake", "source-linked-evidence", "Material facts and risk findings source-linked", "clinician", "Clinician reviewer", riskFindings.length && sourcedRiskCount === riskFindings.length && sourceCount ? "Complete" : riskFindings.length || sourceCount ? "In progress" : "Pending", `${sourcedRiskCount}/${riskFindings.length} risk findings have source links; ${sourceCount} source reference(s) exist.`, "Resolve missing source links or contradictions in Evidence Review."),
    milestone("intake", "medical-necessity-review", "Medical-necessity support reviewed", "clinician", "Clinician reviewer", reviewStatus(medicalNecessity?.reviewStatus), medicalNecessity ? `Review status: ${medicalNecessity.reviewStatus}.` : "No medical-necessity draft is available.", "Review the draft; do not treat it as an autonomous level-of-care decision."),
    milestone("intake", "legal-status-review", "Legal status reviewed", "compliance", "Compliance / legal reviewer", legalInstrument?.reviewStatus === "Signed locked" ? "Complete" : legalInstrument ? "Needs review" : "Pending", legalInstrument ? `${legalInstrument.legalStatus}; ${legalInstrument.reviewStatus}.` : "No legal-status record is available.", "Route legal facts through the counsel-gated review workspace."),
    milestone("intake", "intake-final-review", "Final clinical review", "clinician", "Authorized clinical reviewer", reviewStatus(assessment?.reviewStatus), assessment ? `Assessment review status: ${assessment.reviewStatus}.` : "No assessment is available.", "Review conflicts, safety alerts, restricted details, and signatures."),

    ...admission.checkpoints.map((item) => milestone(
      "admit",
      `admit-${item.kind}`,
      item.kind === "psychiatrist-acceptance" ? "Psychiatrist acceptance" : item.kind === "medical-clearance" ? "Medical clearance approval" : item.kind === "operational-readiness" ? "Facility, bed, and transport readiness" : item.kind === "arrival-handoff" ? "Arrival and handoff" : "Admission episode",
      item.kind === "psychiatrist-acceptance" || item.kind === "medical-clearance" ? "clinician" : item.kind === "operational-readiness" ? "central" : item.kind === "arrival-handoff" ? "facility" : "nurse",
      item.owner,
      checkpointStatus(item.status),
      item.note,
      item.status === "Not built" ? "Build the admission episode surface." : `Record or resolve this checkpoint with ${item.reviewAuthority}.`,
    )),

    milestone("discharge", "discharge-plan-seeded", "Early discharge plan seeded", "clinician", "Clinical/social-services integrator", discharge.status === "Not started" ? "In progress" : "Complete", `${discharge.domains.length} planning domains are available; confirmation remains separate from the prompt.`, "Review patient goals, supports, housing, and likely next setting."),
    milestone("discharge", "disposition-review", "Disposition and level-of-care review", "clinician", "Authorized clinician", cecOutcome ? "Complete" : discharge.dispositionReviewStatus === "Reviewed" ? "Complete" : "Needs review", cecOutcome ? `CEC outcome recorded: ${cecOutcome}.` : "No final disposition source is recorded.", "Record the authorized disposition and step-down review."),
    milestone("discharge", "aftercare-domains", "Aftercare domains confirmed", "central", "Central intake coordinator", dischargeConfirmed === discharge.domains.length ? "Complete" : dischargeConfirmed ? "In progress" : "Pending", `${dischargeConfirmed}/${discharge.domains.length} domains confirmed or not applicable.`, "Confirm or explicitly leave unresolved each aftercare domain."),
    milestone("discharge", "discharge-notifications", "Required notifications reviewed", "compliance", "Compliance / legal reviewer", discharge.domains.find((item) => item.kind === "notifications")?.status === "Confirmed" ? "Complete" : "Needs review", "Notification duties remain counsel-gated and source-dependent.", "Complete the review-gated notification checklist."),

    milestone("postdischarge", "followup-contact", "Post-discharge follow-up contact", "central", "Central intake coordinator", "Not built", "No follow-up contact runtime exists in the prototype.", "Build follow-up tracking after the discharge planning slice."),
    milestone("postdischarge", "outcome-recorded", "Outcome recorded for network learning", "executive", "Executive / program director", "Not built", "No outcome analytics runtime is included in this slice.", "Keep outcome learning separate from transactional case decisions."),
  ];

  const phases: JourneyPhaseReading[] = journeyPhaseOrder.map(({ id, label }) => {
    const phaseMilestones = milestones.filter((item) => item.phase === id);
    const notBuilt = phaseMilestones.filter((item) => item.status === "Not built").length;
    const built = phaseMilestones.length - notBuilt;
    const completed = phaseMilestones.filter((item) => item.status === "Complete").length;
    const percent = built === 0 ? 0 : Math.round((completed / built) * 100);
    return { phase: id, label, milestones: phaseMilestones, completed, built, notBuilt, percent };
  });
  const nextAction = milestones.find((item) => ["Pending", "In progress", "Needs review", "Blocked", "External wait"].includes(item.status)) ?? null;
  return { caseId, phases, nextAction, buildGaps: milestones.filter((item) => item.status === "Not built") };
}

export function deriveHandoffFeed(state: AppState, nowIso: string): HandoffGroup[] {
  const groups = new Map<string, HandoffItem[]>();
  for (const caseRecord of sortCases(state.cases)) {
    const reading = deriveJourney(state, caseRecord.id, nowIso);
    if (!reading.nextAction) continue;
    const item: HandoffItem = { caseId: caseRecord.id, caseLabel: caseRecord.patientToken.displayName, priority: caseRecord.priority, milestone: reading.nextAction };
    const key = reading.nextAction.responsibleLabel;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups.entries()].map(([responsibleLabel, items]) => ({ responsibleLabel, items })).sort((a, b) => a.responsibleLabel.localeCompare(b.responsibleLabel));
}

export const levelOfCareOptions: LevelOfCareOption[] = [
  "Inpatient",
  "IOP / intensive outpatient",
  "Residential / 28-day program",
  "Outpatient",
  "Home with supports",
  "Nursing home",
  "Assisted living",
  "Shelter or housing support",
  "Other configured setting",
  "Unknown",
];

export type { HumanDisposition, HumanTriageStatus };
