import { assessAuthorizationReadiness, buildEvidenceLedger, deriveCoverage } from "./services";
import { getAdmissionReadiness, getDischargePlan, getPrescreenRecord } from "./journey";
import { getNursingAssessment } from "./nursingAssessment";
import type { AppState } from "./types";
import type { WorkspaceId } from "./roles";

export const TARGET_TRANSITIONS = [
  "clinical-legal-review",
  "packet-transmission",
  "facility-acceptance-routing",
  "transport-custody-handoff",
  "admission-transition",
  "discharge-readiness",
] as const;

export type TargetTransition = (typeof TARGET_TRANSITIONS)[number];

export const TARGET_LABELS: Record<TargetTransition, string> = {
  "clinical-legal-review": "Ready for clinical/legal review",
  "packet-transmission": "Ready to transmit governed packet",
  "facility-acceptance-routing": "Ready for facility acceptance and routing",
  "transport-custody-handoff": "Ready for transport, custody transfer, and handoff",
  "admission-transition": "Ready for psychiatrist acceptance, clearance, and admission",
  "discharge-readiness": "Ready for reviewed disposition and aftercare",
};

export const MAP_WORKSTREAMS = [
  "Prescreen",
  "Intake and evidence",
  "Clinical review",
  "Legal status",
  "Medical screening",
  "Benefits and eligibility",
  "Authorization readiness",
  "Packet readiness",
  "Routing and facility response",
  "Placement or milieu readiness",
  "Transport and custody",
  "Admission handoff",
  "Discharge planning",
] as const;

export type MapWorkstream = (typeof MAP_WORKSTREAMS)[number];

export const NODE_STATUSES = [
  "missing",
  "incomplete",
  "unknown",
  "contradictory",
  "stale",
  "waiting-internal",
  "waiting-external",
  "review-required",
  "failed-rejected",
  "blocked-by-dependency",
  "warning",
  "complete",
  "not-applicable",
] as const;

export type DependencyNodeStatus = (typeof NODE_STATUSES)[number];
export type BlockingClass = "hard-blocker" | "review-gate" | "external-wait" | "warning" | "satisfied" | "not-applicable";
export type ReviewState = "unreviewed" | "clinical-review-required" | "legal-review-required" | "reviewed" | "system-derived" | "restricted";
export type ProvenanceKind = "directly-recorded" | "derived-from-synthetic-state" | "configured-demo-rule" | "restricted-detail";
export type FreshnessState = "fresh" | "stale" | "unknown";

export interface DependencyNode {
  id: string;
  label: string;
  workstream: MapWorkstream;
  status: DependencyNodeStatus;
  blockingClass: BlockingClass;
  dependencyIds: string[];
  ownerRole: string;
  assignedUser: string;
  dueTime: string;
  source: string;
  reviewState: ReviewState;
  resolutionWorkspace: WorkspaceId;
  lastChangedAt: string;
  escalationState: "none" | "watch" | "escalated";
  provenanceKind: ProvenanceKind;
  freshness: FreshnessState;
  waitType: "internal" | "external" | "none";
  restrictedDetail: boolean;
  explanation: string;
  wouldChangeStatus: string;
}

export interface DependencyEdge {
  from: string;
  to: string;
  reason: string;
}

export interface ChangeDigestItem {
  id: string;
  changedAt: string;
  workstream: MapWorkstream;
  summary: string;
  actorOrSource: string;
  blockerChange: "new-blocker" | "cleared-blocker" | "status-changed" | "reassignment" | "version-change";
}

export interface CaseDependencyMap {
  caseId: string;
  targetTransition: TargetTransition;
  evaluatedAt: string;
  rulesOrProjectionVersion: "local-readiness-map-v0.1";
  dataFreshness: FreshnessState;
  reviewState: "synthetic-read-only";
  permissionScope: "demo-role-scoped";
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  warnings: string[];
  unresolvedContradictions: string[];
  changeDigest: ChangeDigestItem[];
}

const WORKSPACE_BY_WORKSTREAM: Record<MapWorkstream, WorkspaceId> = {
  Prescreen: "prescreen",
  "Intake and evidence": "evidence",
  "Clinical review": "medical",
  "Legal status": "legal",
  "Medical screening": "intake",
  "Benefits and eligibility": "benefits",
  "Authorization readiness": "authorization",
  "Packet readiness": "packet",
  "Routing and facility response": "routing",
  "Placement or milieu readiness": "bedboard",
  "Transport and custody": "ledger",
  "Admission handoff": "admit",
  "Discharge planning": "discharge",
};

function node(input: Omit<DependencyNode, "resolutionWorkspace"> & { resolutionWorkspace?: WorkspaceId }): DependencyNode {
  return {
    resolutionWorkspace: input.resolutionWorkspace ?? WORKSPACE_BY_WORKSTREAM[input.workstream],
    ...input,
  };
}

function mostRecentAt(values: Array<string | undefined>, fallback: string): string {
  return values.filter(Boolean).sort().at(-1) ?? fallback;
}

function isClinicalReviewReady(status: string | undefined): boolean {
  return status === "Clinician reviewed" || status === "Signed locked";
}

export function buildCaseDependencyMap(
  state: AppState,
  caseId: string,
  targetTransition: TargetTransition,
  evaluatedAt = "2026-07-08T15:00:00.000Z",
): CaseDependencyMap {
  const caseRecord = state.cases.find((item) => item.id === caseId);
  const assessment = state.assessments.find((item) => item.caseId === caseId);
  const evidenceItems = buildEvidenceLedger(state, caseId);
  const sources = state.sourceReferences.filter((item) => item.caseId === caseId);
  const medical = state.medicalNecessitySnapshots.find((item) => item.caseId === caseId);
  const legal = state.legalInstruments.find((item) => item.caseId === caseId);
  const packet = state.referralPackets.find((item) => item.caseId === caseId);
  const referrals = state.facilityReferrals.filter((item) => item.caseId === caseId);
  const responses = state.facilityResponses.filter((response) => referrals.some((referral) => referral.id === response.referralId));
  const ledgerEvents = state.custodyLedgerEvents.filter((item) => item.caseId === caseId);
  const clocks = state.complianceClocks.filter((item) => item.caseId === caseId);
  const prescreen = getPrescreenRecord(state, caseId);
  const nursingAssessment = getNursingAssessment(state, caseId);
  const admission = getAdmissionReadiness(state, caseId);
  const discharge = getDischargePlan(state, caseId);
  const coverage = deriveCoverage(caseId);
  const authorization = assessAuthorizationReadiness(coverage);
  const owner = caseRecord?.assignedOwner ?? "Unassigned";
  const lastChanged = mostRecentAt(
    [
      caseRecord?.openedAt,
      ...ledgerEvents.map((event) => event.occurredAt),
      ...responses.map((response) => response.respondedAt),
      ...referrals.map((referral) => referral.sentAt),
      coverage.verifiedAt,
    ],
    evaluatedAt,
  );

  const nodes: DependencyNode[] = [
    node({
      id: "prescreen-triage",
      label: "Authorized human triage and disposition",
      workstream: "Prescreen",
      status: prescreen.triageStatus === "Reviewed" && prescreen.humanDisposition !== "Not recorded" ? "complete" : prescreen.triageStatus === "Needs authorized review" ? "review-required" : "incomplete",
      blockingClass: prescreen.triageStatus === "Reviewed" && prescreen.humanDisposition !== "Not recorded" ? "satisfied" : "review-gate",
      dependencyIds: [],
      ownerRole: "Authorized clinical / medical reviewer",
      assignedUser: prescreen.assignedOwner,
      dueTime: "Due time not configured",
      source: `Human triage: ${prescreen.triageStatus}; disposition: ${prescreen.humanDisposition}`,
      reviewState: prescreen.triageStatus === "Reviewed" ? "reviewed" : "clinical-review-required",
      lastChangedAt: prescreen.updatedAt,
      escalationState: prescreen.triageStatus === "Needs authorized review" ? "escalated" : "watch",
      provenanceKind: state.prescreenRecords?.some((item) => item.caseId === caseId) ? "directly-recorded" : "derived-from-synthetic-state",
      freshness: "unknown",
      waitType: "internal",
      restrictedDetail: false,
      explanation: "Prescreen supports human triage and disposition; the projection does not make those decisions.",
      wouldChangeStatus: "Record the authorized human next path in Prescreen.",
    }),
    node({
      id: "intake-collateral",
      label: "Collateral and intake facts",
      workstream: "Intake and evidence",
      status: assessment?.collateralStatus === "Documented" && sources.length ? "complete" : assessment ? "incomplete" : "missing",
      blockingClass: assessment?.collateralStatus === "Documented" && sources.length ? "satisfied" : "hard-blocker",
      dependencyIds: [],
      ownerRole: "Central intake coordinator",
      assignedUser: owner,
      dueTime: clocks.find((clock) => clock.lane === "Clinical")?.startedAt ?? "Due time not configured",
      source: assessment ? "Synthetic guided intake assessment" : "No assessment in local state",
      reviewState: assessment?.reviewStatus === "Clinician reviewed" ? "reviewed" : "unreviewed",
      lastChangedAt: assessment ? caseRecord?.openedAt ?? evaluatedAt : evaluatedAt,
      escalationState: assessment?.collateralStatus === "Missing" ? "watch" : "none",
      provenanceKind: assessment ? "directly-recorded" : "derived-from-synthetic-state",
      freshness: assessment?.collateralStatus === "Missing" ? "unknown" : "fresh",
      waitType: "internal",
      restrictedDetail: false,
      explanation:
        assessment?.collateralStatus === "Documented"
          ? "Collateral is recorded for this synthetic case."
          : "Collateral is not fully recorded, so the reviewer cannot see the source trail for this target.",
      wouldChangeStatus: "Record or verify collateral in Guided Intake or Evidence Review.",
    }),
    node({
      id: "evidence-review",
      label: "Source-linked evidence review",
      workstream: "Intake and evidence",
      status: evidenceItems.some((item) => item.status === "APPROVED") ? "complete" : evidenceItems.length ? "review-required" : "missing",
      blockingClass: evidenceItems.some((item) => item.status === "APPROVED") ? "satisfied" : "review-gate",
      dependencyIds: ["prescreen-triage"],
      ownerRole: "Clinician reviewer",
      assignedUser: "Clinician reviewer (unassigned)",
      dueTime: "Due time not configured",
      source: evidenceItems.length ? "Risk findings and linked source references" : "No evidence items in local state",
      reviewState: evidenceItems.some((item) => item.status === "APPROVED") ? "reviewed" : "clinical-review-required",
      lastChangedAt: mostRecentAt(sources.map((source) => source.id), caseRecord?.openedAt ?? evaluatedAt),
      escalationState: evidenceItems.length ? "watch" : "escalated",
      provenanceKind: "derived-from-synthetic-state",
      freshness: evidenceItems.length ? "fresh" : "unknown",
      waitType: "internal",
      restrictedDetail: false,
      explanation: "Evidence status is surfaced as a review gate; candidate evidence is not treated as approved truth.",
      wouldChangeStatus: "Approve, reject, or request clarification in Evidence Review.",
    }),
    node({
      id: "clinical-review",
      label: "Clinical draft review",
      workstream: "Clinical review",
      status: isClinicalReviewReady(medical?.reviewStatus) ? "complete" : medical ? "review-required" : "missing",
      blockingClass: isClinicalReviewReady(medical?.reviewStatus) ? "satisfied" : "review-gate",
      dependencyIds: ["evidence-review"],
      ownerRole: "Clinician reviewer",
      assignedUser: "Lead clinician",
      dueTime: clocks.find((clock) => clock.lane === "Clinical")?.startedAt ?? "Due time not configured",
      source: medical ? "Medical necessity snapshot" : "No clinical draft in local state",
      reviewState: isClinicalReviewReady(medical?.reviewStatus) ? "reviewed" : "clinical-review-required",
      lastChangedAt: caseRecord?.openedAt ?? evaluatedAt,
      escalationState: medical?.reviewStatus === "Needs clinician review" ? "watch" : "none",
      provenanceKind: "derived-from-synthetic-state",
      freshness: medical?.missingItems.length ? "stale" : "fresh",
      waitType: "internal",
      restrictedDetail: false,
      explanation: "The map can say review is pending; it cannot decide medical necessity or level of care.",
      wouldChangeStatus: "A qualified reviewer completes the clinical review in Medical Necessity.",
    }),
    node({
      id: "legal-counsel-review",
      label: "Legal status counsel validation",
      workstream: "Legal status",
      status: legal?.reviewStatus === "Signed locked" ? "complete" : legal ? "review-required" : "unknown",
      blockingClass: legal?.reviewStatus === "Signed locked" ? "satisfied" : "review-gate",
      dependencyIds: ["intake-collateral"],
      ownerRole: "Legal/compliance reviewer",
      assignedUser: "Counsel reviewer (unassigned)",
      dueTime: clocks.find((clock) => clock.lane === "Legal")?.startedAt ?? "Due time not configured",
      source: legal ? "Legal Status workspace synthetic instrument" : "No legal instrument in local state",
      reviewState: legal?.reviewStatus === "Signed locked" ? "reviewed" : "legal-review-required",
      lastChangedAt: mostRecentAt(ledgerEvents.map((event) => event.occurredAt), caseRecord?.openedAt ?? evaluatedAt),
      escalationState: legal?.reviewStatus === "Counsel validation required" ? "escalated" : "watch",
      provenanceKind: legal?.ruleSetId ? "configured-demo-rule" : "derived-from-synthetic-state",
      freshness: legal?.clockStatus === "Unknown" ? "unknown" : "fresh",
      waitType: "internal",
      restrictedDetail: false,
      explanation: "Counsel validation remains a gate; the prototype does not declare a hold valid or invalid.",
      wouldChangeStatus: "Complete counsel validation or document the unresolved legal review state.",
    }),
    node({
      id: "medical-screening",
      label: "Medical screening evidence",
      workstream: "Medical screening",
      status: nursingAssessment?.status === "Complete" && nursingAssessment.currentMedicalStability === "Stable for current setting" ? "complete" : nursingAssessment ? nursingAssessment.currentMedicalStability === "Unable to determine" ? "incomplete" : "review-required" : assessment?.medicalConcerns && !/unknown/i.test(assessment.medicalConcerns) ? "warning" : "unknown",
      blockingClass: targetTransition === "clinical-legal-review" ? "warning" : "review-gate",
      dependencyIds: ["intake-collateral"],
      ownerRole: "Sending nurse or clinician reviewer",
      assignedUser: "Medical reviewer (unassigned)",
      dueTime: "Due time not configured",
      source: nursingAssessment ? `RN Stage 2 v${nursingAssessment.recordVersion}: ${nursingAssessment.currentMedicalStability}` : assessment ? "Assessment medical concerns field" : "No assessment in local state",
      reviewState: nursingAssessment?.status === "Complete" ? "reviewed" : "clinical-review-required",
      lastChangedAt: nursingAssessment?.updatedAt ?? caseRecord?.openedAt ?? evaluatedAt,
      escalationState: "watch",
      provenanceKind: nursingAssessment ? "directly-recorded" : "derived-from-synthetic-state",
      freshness: "unknown",
      waitType: "external",
      restrictedDetail: true,
      explanation: "Medical-screening detail may be restricted; blanks and unknowns are not interpreted as negative findings or clearance.",
      wouldChangeStatus: "Document screening status or restricted-detail placeholder in Guided Intake.",
    }),
    node({
      id: "medical-clearance",
      label: "Medical clearance approval",
      workstream: "Medical screening",
      status: admission.medicalClearance.status === "Approved" ? "complete" : admission.medicalClearance.status === "Not approved" ? "failed-rejected" : admission.medicalClearance.status === "Needs review" ? "review-required" : "incomplete",
      blockingClass: admission.medicalClearance.status === "Approved" ? "satisfied" : "review-gate",
      dependencyIds: ["medical-screening", "clinical-review"],
      ownerRole: "Authorized medical reviewer",
      assignedUser: admission.medicalClearance.reviewedBy ?? "Medical reviewer (unassigned)",
      dueTime: "Due time not configured",
      source: admission.medicalClearance.note,
      reviewState: admission.medicalClearance.status === "Approved" ? "reviewed" : "clinical-review-required",
      lastChangedAt: admission.medicalClearance.updatedAt,
      escalationState: admission.medicalClearance.status === "Not approved" ? "escalated" : "watch",
      provenanceKind: state.medicalClearanceRecords?.some((item) => item.caseId === caseId) ? "directly-recorded" : "derived-from-synthetic-state",
      freshness: "unknown",
      waitType: "internal",
      restrictedDetail: true,
      explanation: "Medical clearance is a separate human approval and cannot be inferred from screening, medical necessity, or packet completeness.",
      wouldChangeStatus: "Record authorized medical clearance in Admission Readiness.",
    }),
    node({
      id: "psychiatrist-acceptance",
      label: "Psychiatrist acceptance",
      workstream: "Admission handoff",
      status: admission.checkpoints.find((item) => item.kind === "psychiatrist-acceptance")?.status === "Accepted" ? "complete" : "review-required",
      blockingClass: admission.checkpoints.find((item) => item.kind === "psychiatrist-acceptance")?.status === "Accepted" ? "satisfied" : "review-gate",
      dependencyIds: ["clinical-review", "medical-clearance"],
      ownerRole: "Receiving/admitting psychiatrist",
      assignedUser: "Psychiatrist (unassigned)",
      dueTime: "Due time not configured",
      source: "Admission Readiness checkpoint",
      reviewState: "clinical-review-required",
      lastChangedAt: caseRecord?.openedAt ?? evaluatedAt,
      escalationState: "watch",
      provenanceKind: state.admissionCheckpoints?.some((item) => item.caseId === caseId && item.kind === "psychiatrist-acceptance") ? "directly-recorded" : "derived-from-synthetic-state",
      freshness: "unknown",
      waitType: "internal",
      restrictedDetail: false,
      explanation: "Psychiatrist acceptance is separate from medical clearance and facility logistics.",
      wouldChangeStatus: "Record the authorized psychiatrist acceptance in Admission Readiness.",
    }),
    node({
      id: "admission-episode",
      label: "Case-owned admission episode",
      workstream: "Admission handoff",
      status: admission.checkpoints.find((item) => item.kind === "admission-episode")?.status === "Complete" ? "complete" : admission.checkpoints.find((item) => item.kind === "admission-episode")?.status === "Needs review" ? "review-required" : "incomplete",
      blockingClass: targetTransition === "admission-transition" ? "review-gate" : "warning",
      dependencyIds: ["psychiatrist-acceptance", "medical-clearance", "facility-response", "transport-custody", "admission-handoff"],
      ownerRole: "Receiving facility",
      assignedUser: state.admissionEpisodes?.find((item) => item.caseId === caseId)?.linkedBy ?? "Receiving facility (unassigned)",
      dueTime: "Admission episode due time not configured",
      source: state.admissionEpisodes?.find((item) => item.caseId === caseId)?.id ?? "No case-owned episode in local state",
      reviewState: admission.checkpoints.find((item) => item.kind === "admission-episode")?.status === "Complete" ? "reviewed" : "clinical-review-required",
      lastChangedAt: state.admissionEpisodes?.find((item) => item.caseId === caseId)?.updatedAt ?? caseRecord?.openedAt ?? evaluatedAt,
      escalationState: admission.checkpoints.find((item) => item.kind === "admission-episode")?.status === "Complete" ? "none" : "watch",
      provenanceKind: state.admissionEpisodes?.some((item) => item.caseId === caseId) ? "directly-recorded" : "derived-from-synthetic-state",
      freshness: state.admissionEpisodes?.some((item) => item.caseId === caseId) ? "fresh" : "unknown",
      waitType: "internal",
      restrictedDetail: false,
      explanation: "The episode is a case-owned linkage and operational record; it does not infer admission from arrival, acceptance, or clearance alone.",
      wouldChangeStatus: "Create or complete the case-owned episode in Admission Readiness, then record orders and initial post-admission review.",
    }),
    node({
      id: "benefits-verification",
      label: "Benefits verification",
      workstream: "Benefits and eligibility",
      status: coverage.coverageStatus === "ACTIVE" ? "complete" : coverage.coverageStatus === "UNABLE_TO_VERIFY" ? "failed-rejected" : "unknown",
      blockingClass: "warning",
      dependencyIds: [],
      ownerRole: "Benefits or UR specialist",
      assignedUser: coverage.verifiedBy ?? "UR specialist (unassigned)",
      dueTime: clocks.find((clock) => clock.lane === "Financial")?.startedAt ?? "Parallel lane; no clinical hold",
      source: coverage.payerProfileId
        ? `${coverage.payerProfileLabel} (${coverage.payerProfileVersion}) + synthetic coverage snapshot`
        : "Deterministic synthetic coverage snapshot",
      reviewState: coverage.verifiedBy ? "reviewed" : "unreviewed",
      lastChangedAt: coverage.verifiedAt ?? caseRecord?.openedAt ?? evaluatedAt,
      escalationState: coverage.coverageStatus === "ACTIVE" ? "none" : "watch",
      provenanceKind: "derived-from-synthetic-state",
      freshness: coverage.verifiedAt ? "fresh" : "unknown",
      waitType: coverage.coverageStatus === "ACTIVE" ? "none" : "external",
      restrictedDetail: false,
      explanation: "Financial readiness is visible as a parallel lane and never blocks emergency clinical review.",
      wouldChangeStatus: "Verify eligibility and benefit quote in Benefits Verification.",
    }),
    node({
      id: "authorization-readiness",
      label: "Authorization readiness",
      workstream: "Authorization readiness",
      status: authorization.gaps.length ? "incomplete" : "complete",
      blockingClass: targetTransition === "clinical-legal-review" ? "warning" : "review-gate",
      dependencyIds: ["benefits-verification", "clinical-review"],
      ownerRole: "Benefits or UR specialist",
      assignedUser: "UR specialist (unassigned)",
      dueTime: "Parallel lane; no clinical hold",
      source: coverage.payerProfileId
        ? `${coverage.payerProfileLabel} (${coverage.payerProfileVersion}) + authorization readiness mirror`
        : "Authorization readiness mirror from synthetic coverage",
      reviewState: "system-derived",
      lastChangedAt: coverage.verifiedAt ?? caseRecord?.openedAt ?? evaluatedAt,
      escalationState: authorization.gaps.length ? "watch" : "none",
      provenanceKind: "derived-from-synthetic-state",
      freshness: coverage.verifiedAt ? "fresh" : "unknown",
      waitType: authorization.gaps.includes("AUTHORIZATION_REQUIREMENT_UNVERIFIED") ? "external" : "internal",
      restrictedDetail: false,
      explanation: "Authorization status reports preparation gaps; it does not predict payer approval or denial.",
      wouldChangeStatus: "Complete human authorization preparation steps in Authorization Readiness.",
    }),
    node({
      id: "packet-version",
      label: "Governed packet version",
      workstream: "Packet readiness",
      status: packet?.status === "Sent" || packet?.status === "Ready" ? "complete" : packet ? "incomplete" : "missing",
      blockingClass: packet?.status === "Sent" || packet?.status === "Ready" ? "satisfied" : "hard-blocker",
      dependencyIds: ["clinical-review", "legal-counsel-review", "evidence-review"],
      ownerRole: "Central intake coordinator",
      assignedUser: owner,
      dueTime: "Due time not configured",
      source: packet ? `Packet ${packet.id}, ${packet.completeness}% complete` : "No packet in local state",
      reviewState: "system-derived",
      lastChangedAt: mostRecentAt(ledgerEvents.filter((event) => event.eventType.includes("PACKET")).map((event) => event.occurredAt), evaluatedAt),
      escalationState: packet && packet.completeness >= 90 ? "none" : "escalated",
      provenanceKind: "derived-from-synthetic-state",
      freshness: packet?.status === "Sent" ? "stale" : "fresh",
      waitType: "internal",
      restrictedDetail: false,
      explanation: "Packet readiness depends on reviewed source material and may become stale after new evidence arrives.",
      wouldChangeStatus: "Generate, review, or resend the packet from Packet Preview.",
    }),
    node({
      id: "facility-response",
      label: "Facility response",
      workstream: "Routing and facility response",
      status: referrals.some((referral) => referral.status === "Accepted") ? "complete" : referrals.length ? "waiting-external" : "missing",
      blockingClass: referrals.some((referral) => referral.status === "Accepted") ? "satisfied" : "external-wait",
      dependencyIds: ["packet-version"],
      ownerRole: "Receiving facility",
      assignedUser: referrals[0]?.facilityName ?? "Facility not selected",
      dueTime: "External response time not configured",
      source: responses.length ? "Synthetic facility response records" : "No response in local state",
      reviewState: "system-derived",
      lastChangedAt: mostRecentAt(responses.map((response) => response.respondedAt), evaluatedAt),
      escalationState: referrals.some((referral) => referral.status === "Accepted") ? "none" : "watch",
      provenanceKind: "directly-recorded",
      freshness: responses.length ? "fresh" : "unknown",
      waitType: "external",
      restrictedDetail: false,
      explanation: "The map can show response state and requests; it cannot decide whether facility acceptance is appropriate.",
      wouldChangeStatus: "Record a facility response or requested update in Routing Response.",
    }),
    node({
      id: "transport-custody",
      label: "Transport and custody handoff",
      workstream: "Transport and custody",
      status: ledgerEvents.some((event) => event.eventType === "FACILITY_RESPONSE_RECEIVED") ? "review-required" : "missing",
      blockingClass: targetTransition === "transport-custody-handoff" ? "review-gate" : "warning",
      dependencyIds: ["facility-response", "legal-counsel-review"],
      ownerRole: "Field responder / central intake",
      assignedUser: owner,
      dueTime: clocks.find((clock) => clock.label.includes("Disposition"))?.startedAt ?? "Due time not configured",
      source: ledgerEvents.length ? "Hash-chained custody ledger" : "No custody events in local state",
      reviewState: "system-derived",
      lastChangedAt: mostRecentAt(ledgerEvents.map((event) => event.occurredAt), evaluatedAt),
      escalationState: targetTransition === "transport-custody-handoff" ? "watch" : "none",
      provenanceKind: "derived-from-synthetic-state",
      freshness: ledgerEvents.length ? "fresh" : "unknown",
      waitType: "internal",
      restrictedDetail: false,
      explanation: "Custody events remain auditable, but the prototype does not conclude transfer authority.",
      wouldChangeStatus: "Verify custody chain and add handoff acknowledgement through existing custody workflow.",
    }),
    node({
      id: "admission-handoff",
      label: "Receiving-facility handoff acknowledgement",
      workstream: "Admission handoff",
      status: targetTransition === "transport-custody-handoff" ? "waiting-external" : "not-applicable",
      blockingClass: targetTransition === "transport-custody-handoff" ? "external-wait" : "not-applicable",
      dependencyIds: ["transport-custody"],
      ownerRole: "Receiving nurse",
      assignedUser: "Receiving nurse (unassigned)",
      dueTime: "External acknowledgement not configured",
      source: "No production handoff acknowledgement contract in local prototype",
      reviewState: "restricted",
      lastChangedAt: lastChanged,
      escalationState: targetTransition === "transport-custody-handoff" ? "watch" : "none",
      provenanceKind: "restricted-detail",
      freshness: "unknown",
      waitType: "external",
      restrictedDetail: true,
      explanation: "The current app can show the missing acknowledgement state; it has no production handoff contract.",
      wouldChangeStatus: "Future receiving-facility handoff acknowledgement contract; current slice links to Case Overview.",
    }),
    node({
      id: "discharge-plan",
      label: "Discharge planning domains",
      workstream: "Discharge planning",
      status: discharge.domains.some((item) => item.status === "Needs review") ? "review-required" : discharge.domains.every((item) => item.status === "Confirmed" || item.status === "Not applicable") ? "complete" : "incomplete",
      blockingClass: targetTransition === "discharge-readiness" ? "review-gate" : "warning",
      dependencyIds: ["clinical-review", "facility-response"],
      ownerRole: "Central intake / clinical-social services",
      assignedUser: caseRecord?.assignedOwner ?? "Unassigned",
      dueTime: "Discharge due time not configured",
      source: `${discharge.domains.filter((item) => item.status === "Confirmed" || item.status === "Not applicable").length}/${discharge.domains.length} domains confirmed or not applicable`,
      reviewState: discharge.dispositionReviewStatus === "Reviewed" ? "reviewed" : "clinical-review-required",
      lastChangedAt: discharge.updatedAt,
      escalationState: "watch",
      provenanceKind: state.dischargePlans?.some((item) => item.caseId === caseId) ? "directly-recorded" : "derived-from-synthetic-state",
      freshness: "unknown",
      waitType: "internal",
      restrictedDetail: false,
      explanation: "Family, housing, step-down, medication, follow-up, transportation, and notification work remains visible without blocking admission by default.",
      wouldChangeStatus: "Confirm or explicitly resolve each domain in Discharge Planning.",
    }),
  ];

  const selected = nodes.filter((item) => {
    if (targetTransition === "clinical-legal-review") {
      return ["prescreen-triage", "intake-collateral", "evidence-review", "clinical-review", "legal-counsel-review", "medical-screening", "benefits-verification"].includes(item.id);
    }
    if (targetTransition === "packet-transmission") {
      return [
        "prescreen-triage",
        "intake-collateral",
        "evidence-review",
        "clinical-review",
        "legal-counsel-review",
        "medical-screening",
        "benefits-verification",
        "authorization-readiness",
        "packet-version",
      ].includes(item.id);
    }
    if (targetTransition === "facility-acceptance-routing") {
      return [
        "prescreen-triage",
        "intake-collateral",
        "evidence-review",
        "clinical-review",
        "legal-counsel-review",
        "medical-screening",
        "benefits-verification",
        "authorization-readiness",
        "packet-version",
        "facility-response",
      ].includes(item.id);
    }
    if (targetTransition === "admission-transition") {
      return ["clinical-review", "medical-screening", "medical-clearance", "psychiatrist-acceptance", "facility-response", "transport-custody", "admission-handoff", "admission-episode"].includes(item.id);
    }
    if (targetTransition === "discharge-readiness") {
      return ["clinical-review", "psychiatrist-acceptance", "medical-clearance", "discharge-plan"].includes(item.id);
    }
    return nodes;
  });

  const applicableIds = new Set(selected.map((item) => item.id));
  let addedDependency = true;
  while (addedDependency) {
    addedDependency = false;
    for (const item of nodes.filter((candidate) => applicableIds.has(candidate.id))) {
      for (const dependencyId of item.dependencyIds) {
        if (!applicableIds.has(dependencyId) && nodes.some((candidate) => candidate.id === dependencyId)) {
          applicableIds.add(dependencyId);
          addedDependency = true;
        }
      }
    }
  }
  const applicable = nodes.filter((item) => applicableIds.has(item.id));

  const nodeIds = new Set(applicable.map((item) => item.id));
  const edges = applicable.flatMap((item) =>
    item.dependencyIds
      .filter((dependencyId) => nodeIds.has(dependencyId))
      .map((dependencyId) => ({ from: dependencyId, to: item.id, reason: `${item.label} depends on ${dependencyId}.` })),
  );
  const unresolvedContradictions = [
    ...(medical?.missingItems.length ? [`Clinical draft has ${medical.missingItems.length} missing item(s).`] : []),
    ...(legal?.reviewStatus === "Counsel validation required" ? ["Legal status remains counsel-validation required."] : []),
    ...(packet?.status === "Sent" && medical?.missingItems.length ? ["Packet was sent while later display still shows missing clinical packet item(s)."] : []),
  ];

  return {
    caseId,
    targetTransition,
    evaluatedAt,
    rulesOrProjectionVersion: "local-readiness-map-v0.1",
    dataFreshness: applicable.some((item) => item.freshness === "stale") ? "stale" : applicable.some((item) => item.freshness === "unknown") ? "unknown" : "fresh",
    reviewState: "synthetic-read-only",
    permissionScope: "demo-role-scoped",
    nodes: applicable,
    edges,
    warnings: [
      "Read-only synthetic prototype. Demo role scoping is not backend authorization.",
      "This map reports operational blockers and review gates; it does not make clinical, legal, payer, placement, admission, discharge, authorization, or custody decisions.",
      "No universal readiness score is calculated.",
    ],
    unresolvedContradictions,
    changeDigest: [
      {
        id: "change-primary-blocker",
        changedAt: lastChanged,
        workstream: applicable.find((item) => item.blockingClass === "hard-blocker" || item.blockingClass === "review-gate")?.workstream ?? "Intake and evidence",
        summary: primaryBlocker(applicable)?.label ?? "No blocking item available for this target.",
        actorOrSource: "Synthetic readiness projection",
        blockerChange: "status-changed",
      },
      ...(packet?.status === "Sent"
        ? [
            {
              id: "change-packet-version",
              changedAt: mostRecentAt(referrals.map((referral) => referral.sentAt), lastChanged),
              workstream: "Packet readiness" as const,
              summary: `Packet ${packet.id} is marked ${packet.status}; compare against new evidence before reuse.`,
              actorOrSource: "Packet Preview",
              blockerChange: "version-change" as const,
            },
          ]
        : []),
      ...(responses.length
        ? [
            {
              id: "change-facility-response",
              changedAt: mostRecentAt(responses.map((response) => response.respondedAt), lastChanged),
              workstream: "Routing and facility response" as const,
              summary: `${responses.length} facility response(s) recorded for this case.`,
              actorOrSource: "Routing Response",
              blockerChange: "status-changed" as const,
            },
          ]
        : []),
    ],
  };
}

export function primaryBlocker(nodes: DependencyNode[]): DependencyNode | undefined {
  return nodes.find((item) => item.blockingClass === "hard-blocker")
    ?? nodes.find((item) => item.blockingClass === "review-gate")
    ?? nodes.find((item) => item.blockingClass === "external-wait")
    ?? nodes.find((item) => item.blockingClass === "warning");
}

export function filterDependencyNodes(
  nodes: DependencyNode[],
  filters: { workstream?: string; ownerRole?: string; status?: string; waitType?: string },
): DependencyNode[] {
  return nodes.filter((item) => {
    if (filters.workstream && filters.workstream !== "all" && item.workstream !== filters.workstream) return false;
    if (filters.ownerRole && filters.ownerRole !== "all" && item.ownerRole !== filters.ownerRole) return false;
    if (
      filters.status
      && filters.status !== "all"
      && item.blockingClass !== filters.status
      && item.status !== filters.status
      && item.freshness !== filters.status
    ) return false;
    if (filters.waitType && filters.waitType !== "all" && item.waitType !== filters.waitType) return false;
    return true;
  });
}

export function buildSyntheticDependencyQueue(state: AppState, targetTransition: TargetTransition, size: 5 | 25 | 100): CaseDependencyMap[] {
  if (!state.cases.length) return [];
  return Array.from({ length: size }, (_, index) => {
    const caseRecord = state.cases[index % state.cases.length];
    return buildCaseDependencyMap(state, caseRecord.id, targetTransition);
  });
}
