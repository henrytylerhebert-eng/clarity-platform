import type {
  BlockingClass,
  CaseEpisodeRelationship,
  CaseStatus,
  GuidanceSignal,
  GuidanceSuppressionReason,
  JourneyDisposition,
  JourneyPhase,
  JourneyPhaseEvidence,
  NextWorkKind,
  PacketRequirementState,
  PrescreenEncounterStatus,
  PrescreenReadinessTarget,
  Workstream,
  WorkstreamStatus,
} from "@clarity/domain-contracts";

/**
 * Presentation vocabulary for the Access Snapshot. Every map is a
 * `Record<Enum, string>`, so a value added to the contract fails compilation here
 * instead of surfacing to a user as a raw enum. `label()` still falls back to the raw
 * value so a server that is newer than this bundle degrades to readable-ish text
 * rather than "undefined".
 *
 * These are display strings only. They carry no policy: what is blocked, waiting or a
 * candidate is decided by the contract, never re-derived here.
 */

export type BadgeTone = "neutral" | "good" | "warn" | "danger" | "info";

const label = <K extends string>(map: Readonly<Record<K, string>>, key: K): string => map[key] ?? key;

// ---------------------------------------------------------------------------
// Journey
// ---------------------------------------------------------------------------

const PHASE_LABELS: Record<JourneyPhase, string> = {
  REFERRAL: "Referral",
  PRESCREEN: "Prescreen",
  QUALIFIED_REVIEW: "Qualified review",
  FACILITY_REVIEW: "Facility review",
  PRE_ADMISSION: "Pre-admission",
  TRANSFER_HANDOFF: "Transfer / handoff",
  ADMISSION: "Admission",
};

/** Position along the journey. A Record, so a new phase must be placed to compile. */
const PHASE_POSITION: Record<JourneyPhase, number> = {
  REFERRAL: 0,
  PRESCREEN: 1,
  QUALIFIED_REVIEW: 2,
  FACILITY_REVIEW: 3,
  PRE_ADMISSION: 4,
  TRANSFER_HANDOFF: 5,
  ADMISSION: 6,
};

export const JOURNEY_PHASE_ORDER: readonly JourneyPhase[] = (Object.keys(PHASE_POSITION) as JourneyPhase[]).sort(
  (a, b) => PHASE_POSITION[a] - PHASE_POSITION[b],
);

export const phaseLabel = (phase: JourneyPhase): string => label(PHASE_LABELS, phase);

const DISPOSITION_LABELS: Record<JourneyDisposition, string> = {
  ON_TRACK: "On track",
  BLOCKED: "Blocked",
  DIVERTED: "Diverted",
  EXCEPTION: "Exception",
  CLOSED: "Closed",
};

const DISPOSITION_TONES: Record<JourneyDisposition, BadgeTone> = {
  ON_TRACK: "good",
  BLOCKED: "danger",
  DIVERTED: "warn",
  EXCEPTION: "warn",
  CLOSED: "neutral",
};

export const dispositionLabel = (disposition: JourneyDisposition): string => label(DISPOSITION_LABELS, disposition);
export const dispositionTone = (disposition: JourneyDisposition): BadgeTone => DISPOSITION_TONES[disposition];

// ---------------------------------------------------------------------------
// Source statuses
// ---------------------------------------------------------------------------

const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  DRAFT: "Draft",
  INTAKE_IN_PROGRESS: "Intake in progress",
  DOCUMENTS_PENDING: "Documents pending",
  DOCUMENTS_RECEIVED: "Documents received",
  EVIDENCE_PROCESSING: "Evidence processing",
  EVIDENCE_REVIEW: "Evidence review",
  REVIEW_IN_PROGRESS: "Review in progress",
  INFORMATION_INCOMPLETE: "Information incomplete",
  PACKET_PREPARATION: "Packet preparation",
  READY_FOR_ROUTING: "Ready for routing",
  ROUTING_IN_PROGRESS: "Routing in progress",
  FACILITY_RESPONSE_PENDING: "Facility response pending",
  ACCEPTED: "Accepted",
  TRANSPORT_PENDING: "Transport pending",
  HANDOFF_IN_PROGRESS: "Handoff in progress",
  TRANSFER_COMPLETE: "Transfer complete",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
  WITHDRAWN: "Withdrawn",
  NO_PLACEMENT_FOUND: "No placement found",
  REFERRED_TO_ALTERNATIVE_LEVEL: "Referred to alternative level of care",
  MEDICAL_TRANSFER_REQUIRED: "Medical transfer required",
  CLINICAL_REVIEW: "Clinical review",
  LEGAL_REVIEW: "Legal review",
  BENEFITS_REVIEW: "Benefits review",
  AUTHORIZATION_PREPARATION: "Authorization preparation",
};

const PRESCREEN_STATUS_LABELS: Record<PrescreenEncounterStatus, string> = {
  DRAFT: "Draft",
  ATTESTED: "Attested",
  SUBMITTED: "Submitted",
  CENTRAL_INTAKE_REVIEW: "Central intake review",
  NEEDS_INFORMATION: "Needs information",
  AUTHORIZED_REVIEW: "Authorized review",
  FACILITY_ROUTING: "Facility routing",
  TRANSPORT_PLANNING: "Transport planning",
  HANDED_OFF: "Handed off",
  REDIRECTED: "Redirected",
  DECLINED: "Declined",
  CANCELLED: "Cancelled",
};

const EPISODE_RELATIONSHIP_LABELS: Record<CaseEpisodeRelationship, string> = {
  ADMISSION_SOURCE: "Admission source",
  TRANSFER_SOURCE: "Transfer source",
  READMISSION_SOURCE: "Readmission source",
};

export const caseStatusLabel = (status: CaseStatus): string => label(CASE_STATUS_LABELS, status);
export const prescreenStatusLabel = (status: PrescreenEncounterStatus): string =>
  label(PRESCREEN_STATUS_LABELS, status);
export const episodeRelationshipLabel = (relationship: CaseEpisodeRelationship): string =>
  label(EPISODE_RELATIONSHIP_LABELS, relationship);

/**
 * "Why this phase?" line. `sourceValue` is typed `string` by the contract, so it is
 * narrowed by `source` here rather than cast.
 */
export function describeJourneyEvidence(evidence: JourneyPhaseEvidence): string {
  const compat = evidence.legacyCompatibility ? " (legacy compatibility)" : "";
  const supports = `supports ${phaseLabel(evidence.supportsPhase)}`;
  switch (evidence.source) {
    case "CASE_STATUS":
      return `Case status: ${caseStatusLabel(evidence.sourceValue as CaseStatus)} — ${supports}${compat}`;
    case "PRESCREEN_STATUS":
      return `Prescreen status: ${prescreenStatusLabel(evidence.sourceValue as PrescreenEncounterStatus)} — ${supports}${compat}`;
    case "EPISODE_LINK":
      return `Episode link: ${episodeRelationshipLabel(evidence.sourceValue as CaseEpisodeRelationship)} — ${supports}${compat}`;
  }
}

// ---------------------------------------------------------------------------
// Guidance
// ---------------------------------------------------------------------------

const BLOCKING_CLASS_LABELS: Record<BlockingClass, string> = {
  HARD_BLOCKER: "Blocked",
  REVIEW_GATE: "Review needed",
  EXTERNAL_WAIT: "Waiting externally",
  WARNING: "Attention",
  SATISFIED: "Satisfied",
  NOT_APPLICABLE: "Not applicable",
};

const BLOCKING_CLASS_TONES: Record<BlockingClass, BadgeTone> = {
  HARD_BLOCKER: "danger",
  REVIEW_GATE: "warn",
  EXTERNAL_WAIT: "info",
  WARNING: "warn",
  SATISFIED: "good",
  NOT_APPLICABLE: "neutral",
};

export const blockingClassLabel = (blockingClass: BlockingClass): string => label(BLOCKING_CLASS_LABELS, blockingClass);
export const blockingClassTone = (blockingClass: BlockingClass): BadgeTone => BLOCKING_CLASS_TONES[blockingClass];

/** SATISFIED and NOT_APPLICABLE are recorded facts, not attention items. */
export const isAttentionClass = (blockingClass: BlockingClass): boolean =>
  blockingClass !== "SATISFIED" && blockingClass !== "NOT_APPLICABLE";

const WORKSTREAM_LABELS: Record<Workstream, string> = {
  clinical: "Clinical",
  legalReview: "Legal review",
  medicalScreening: "Medical screening",
  benefits: "Benefits",
  authorization: "Authorization",
  placement: "Placement",
  transportation: "Transportation",
  patientEducation: "Patient education",
};

const WORKSTREAM_STATUS_LABELS: Record<WorkstreamStatus, string> = {
  NOT_STARTED: "Not started",
  READY: "Ready",
  IN_PROGRESS: "In progress",
  PENDING_REVIEW: "Pending review",
  COMPLETE: "Complete",
  BLOCKED: "Blocked",
  NOT_APPLICABLE: "Not applicable",
};

const WORKSTREAM_STATUS_TONES: Record<WorkstreamStatus, BadgeTone> = {
  NOT_STARTED: "neutral",
  READY: "info",
  IN_PROGRESS: "info",
  PENDING_REVIEW: "warn",
  COMPLETE: "good",
  BLOCKED: "danger",
  NOT_APPLICABLE: "neutral",
};

/** Display order for the lanes, typed exhaustive by `WORKSTREAM_LABELS`; matches the contract's order. */
export const WORKSTREAM_ORDER = Object.keys(WORKSTREAM_LABELS) as Workstream[];

export const workstreamLabel = (workstream: Workstream): string => label(WORKSTREAM_LABELS, workstream);
export const workstreamStatusLabel = (status: WorkstreamStatus): string => label(WORKSTREAM_STATUS_LABELS, status);
export const workstreamStatusTone = (status: WorkstreamStatus): BadgeTone => WORKSTREAM_STATUS_TONES[status];

const PRESCREEN_TARGET_LABELS: Record<PrescreenReadinessTarget, string> = {
  CENTRAL_INTAKE_REVIEW: "Central intake review",
  AUTHORIZED_PRACTITIONER_REVIEW: "Authorized practitioner review",
  FACILITY_ROUTING: "Facility routing",
  TRANSPORT_PLANNING: "Transport planning",
  RECEIVING_HANDOFF: "Receiving handoff",
};

export const prescreenTargetLabel = (target: PrescreenReadinessTarget): string =>
  label(PRESCREEN_TARGET_LABELS, target);

const PACKET_REQUIREMENT_STATE_LABELS: Record<PacketRequirementState, string> = {
  NOT_STARTED: "Not started",
  REQUESTED: "Requested",
  RECEIVED: "Received",
  UNDER_REVIEW: "Under review",
  ACCEPTED_FOR_PACKET: "Accepted for packet",
  MISSING: "Missing",
  UNAVAILABLE_WITH_REASON: "Unavailable, reason recorded",
  NOT_APPLICABLE_WITH_AUTHORITY: "Not applicable, authority recorded",
  NEEDS_CLARIFICATION: "Needs clarification",
  STALE: "Stale",
  SUPERSEDED: "Superseded",
};

export const packetRequirementStateLabel = (state: PacketRequirementState): string =>
  label(PACKET_REQUIREMENT_STATE_LABELS, state);

const NEXT_WORK_LABELS: Record<NextWorkKind, string> = {
  RESOLVE_CASE_INFORMATION: "Resolve case information",
  RESOLVE_PRESCREEN_INFORMATION: "Resolve Prescreen information",
  RESOLVE_PACKET_REQUIREMENT: "Resolve packet requirement",
  RESOLVE_WORKSTREAM_BLOCK: "Resolve workstream block",
  REVIEW_WORKSTREAM: "Review workstream",
  START_READY_WORKSTREAM: "Start ready workstream",
};

export const nextWorkLabel = (kind: NextWorkKind): string => label(NEXT_WORK_LABELS, kind);

const SUPPRESSION_REASON_LABELS: Record<GuidanceSuppressionReason, string> = {
  CASE_TERMINAL: "The case is in a terminal status",
  PRESCREEN_TERMINAL: "The Prescreen encounter is in a terminal status",
};

export const suppressionReasonLabel = (reason: GuidanceSuppressionReason): string =>
  label(SUPPRESSION_REASON_LABELS, reason);

/**
 * requirementCode -> human label, read from the readiness blockers/warnings that already
 * carry `label`. Signals carry only the free-text code, so this is how a code becomes
 * a name without inventing one.
 */
export function requirementLabelIndex(
  packetReadiness: ReadonlyArray<{
    readonly blockers: ReadonlyArray<{ readonly requirementCode: string; readonly label: string }>;
    readonly warnings: ReadonlyArray<{ readonly requirementCode: string; readonly label: string }>;
  }> | null,
): ReadonlyMap<string, string> {
  const index = new Map<string, string>();
  for (const result of packetReadiness ?? []) {
    for (const item of [...result.blockers, ...result.warnings]) {
      if (!index.has(item.requirementCode)) index.set(item.requirementCode, item.label);
    }
  }
  return index;
}

/** The recorded fact a signal was read from, in words. The blocking class is shown separately. */
export function describeAccessSignal(
  signal: GuidanceSignal,
  requirementLabels: ReadonlyMap<string, string> = new Map(),
): string {
  const { source } = signal;
  switch (source.kind) {
    case "CASE_STATUS":
      return caseStatusLabel(source.value);
    case "PRESCREEN_STATUS":
      return prescreenStatusLabel(source.value);
    case "WORKSTREAM_STATUS": {
      const lane = signal.workstream === undefined ? "Workstream" : workstreamLabel(signal.workstream);
      return `${lane} — ${workstreamStatusLabel(source.value)}`;
    }
    case "PACKET_REQUIREMENT": {
      const name = requirementLabels.get(source.requirementCode) ?? source.requirementCode;
      const requirement = `${name} — ${packetRequirementStateLabel(source.value)}`;
      return signal.target === undefined ? requirement : `${prescreenTargetLabel(signal.target)} · ${requirement}`;
    }
  }
}
