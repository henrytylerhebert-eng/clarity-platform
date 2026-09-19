import { type CaseStatus, CASE_STATUSES } from "./caseStateMachine.js";
import { type PrescreenEncounterStatus, PRESCREEN_ENCOUNTER_STATUSES } from "./prescreen.js";
import { type CaseEpisodeRelationship, CASE_EPISODE_RELATIONSHIPS } from "./episode.js";

export const JOURNEY_PHASES = [
  "REFERRAL",
  "PRESCREEN",
  "QUALIFIED_REVIEW",
  "FACILITY_REVIEW",
  "PRE_ADMISSION",
  "TRANSFER_HANDOFF",
  "ADMISSION",
] as const;
export type JourneyPhase = (typeof JOURNEY_PHASES)[number];

export const JOURNEY_DISPOSITIONS = [
  "ON_TRACK",
  "BLOCKED",
  "DIVERTED",
  "EXCEPTION",
  "CLOSED",
] as const;
export type JourneyDisposition = (typeof JOURNEY_DISPOSITIONS)[number];

export interface JourneyProjectionInput {
  readonly caseStatus: CaseStatus;
  readonly prescreenStatus?: PrescreenEncounterStatus;
  readonly episodeRelationships?: readonly CaseEpisodeRelationship[];
}

export interface JourneyPhaseEvidence {
  source: "CASE_STATUS" | "PRESCREEN_STATUS" | "EPISODE_LINK";
  sourceValue: string;
  supportsPhase: JourneyPhase;
  legacyCompatibility?: boolean;
}

export interface JourneyProjection {
  readonly phase: JourneyPhase | null;
  readonly disposition: JourneyDisposition;
  readonly evidence: readonly JourneyPhaseEvidence[];
}

const PHASE_WEIGHT: Record<JourneyPhase, number> = {
  REFERRAL: 1,
  PRESCREEN: 2,
  QUALIFIED_REVIEW: 3,
  FACILITY_REVIEW: 4,
  PRE_ADMISSION: 5,
  TRANSFER_HANDOFF: 6,
  ADMISSION: 7,
};

type Classification = {
  phase?: JourneyPhase;
  legacyCompatibility?: boolean;
  dispositionOnly?: true;
  nonPhaseDetermining?: true;
};

// 1. CaseStatus Mapping
const CASE_STATUS_MAPPING: Record<CaseStatus, Classification> = {
  // Referral
  DRAFT: { phase: "REFERRAL" },
  // Prescreen
  INTAKE_IN_PROGRESS: { phase: "PRESCREEN" },
  DOCUMENTS_PENDING: { phase: "PRESCREEN" },
  DOCUMENTS_RECEIVED: { phase: "PRESCREEN" },
  EVIDENCE_PROCESSING: { phase: "PRESCREEN" },
  EVIDENCE_REVIEW: { phase: "PRESCREEN" },
  // Qualified Review
  REVIEW_IN_PROGRESS: { phase: "QUALIFIED_REVIEW" },
  PACKET_PREPARATION: { phase: "QUALIFIED_REVIEW" },
  READY_FOR_ROUTING: { phase: "QUALIFIED_REVIEW" },
  // Legacy -> Qualified Review
  CLINICAL_REVIEW: { phase: "QUALIFIED_REVIEW", legacyCompatibility: true },
  LEGAL_REVIEW: { phase: "QUALIFIED_REVIEW", legacyCompatibility: true },
  BENEFITS_REVIEW: { phase: "QUALIFIED_REVIEW", legacyCompatibility: true },
  AUTHORIZATION_PREPARATION: { phase: "QUALIFIED_REVIEW", legacyCompatibility: true },
  // Facility Review
  ROUTING_IN_PROGRESS: { phase: "FACILITY_REVIEW" },
  FACILITY_RESPONSE_PENDING: { phase: "FACILITY_REVIEW" },
  NO_PLACEMENT_FOUND: { phase: "FACILITY_REVIEW" },
  REFERRED_TO_ALTERNATIVE_LEVEL: { phase: "FACILITY_REVIEW" },
  // Pre-Admission
  ACCEPTED: { phase: "PRE_ADMISSION" },
  // Transfer / Handoff
  TRANSPORT_PENDING: { phase: "TRANSFER_HANDOFF" },
  HANDOFF_IN_PROGRESS: { phase: "TRANSFER_HANDOFF" },
  TRANSFER_COMPLETE: { phase: "TRANSFER_HANDOFF" },
  // Detours / Terminations (No phase fabricated)
  INFORMATION_INCOMPLETE: { dispositionOnly: true },
  MEDICAL_TRANSFER_REQUIRED: { dispositionOnly: true },
  CLOSED: { dispositionOnly: true },
  CANCELLED: { dispositionOnly: true },
  WITHDRAWN: { dispositionOnly: true },
};

// Guard to ensure every CaseStatus is mapped
for (const status of CASE_STATUSES) {
  if (!CASE_STATUS_MAPPING[status]) {
    throw new Error(`Unmapped CaseStatus in JourneyProjection: ${status}`);
  }
}

// 2. PrescreenEncounterStatus Mapping
const PRESCREEN_STATUS_MAPPING: Record<PrescreenEncounterStatus, Classification> = {
  // Prescreen
  DRAFT: { phase: "PRESCREEN" },
  ATTESTED: { phase: "PRESCREEN" },
  SUBMITTED: { phase: "PRESCREEN" },
  // Qualified Review
  CENTRAL_INTAKE_REVIEW: { phase: "QUALIFIED_REVIEW" },
  AUTHORIZED_REVIEW: { phase: "QUALIFIED_REVIEW" },
  // Facility Review
  FACILITY_ROUTING: { phase: "FACILITY_REVIEW" },
  // Transfer / Handoff
  TRANSPORT_PLANNING: { phase: "TRANSFER_HANDOFF" },
  HANDED_OFF: { phase: "TRANSFER_HANDOFF" },
  // Non-phase determining
  NEEDS_INFORMATION: { nonPhaseDetermining: true },
  REDIRECTED: { nonPhaseDetermining: true },
  DECLINED: { nonPhaseDetermining: true },
  CANCELLED: { nonPhaseDetermining: true },
};

for (const status of PRESCREEN_ENCOUNTER_STATUSES) {
  if (!PRESCREEN_STATUS_MAPPING[status]) {
    throw new Error(`Unmapped PrescreenEncounterStatus in JourneyProjection: ${status}`);
  }
}

export function deriveJourneyProjection(input: JourneyProjectionInput): JourneyProjection {
  const evidence: JourneyPhaseEvidence[] = [];

  // Case Status
  const caseMapping = CASE_STATUS_MAPPING[input.caseStatus];
  if (caseMapping.phase) {
    evidence.push({
      source: "CASE_STATUS",
      sourceValue: input.caseStatus,
      supportsPhase: caseMapping.phase,
      ...(caseMapping.legacyCompatibility ? { legacyCompatibility: true } : {})
    });
  }

  // Prescreen Status
  if (input.prescreenStatus) {
    const preMapping = PRESCREEN_STATUS_MAPPING[input.prescreenStatus];
    if (preMapping.phase) {
      evidence.push({
        source: "PRESCREEN_STATUS",
        sourceValue: input.prescreenStatus,
        supportsPhase: preMapping.phase
      });
    }
  }

  // Episode Link
  if (input.episodeRelationships && input.episodeRelationships.length > 0) {
    for (const rel of input.episodeRelationships) {
      if (CASE_EPISODE_RELATIONSHIPS.includes(rel)) {
        evidence.push({
          source: "EPISODE_LINK",
          sourceValue: rel,
          supportsPhase: "ADMISSION"
        });
      }
    }
  }

  // Find furthest phase
  let currentPhase: JourneyPhase | null = null;
  let maxWeight = 0;
  for (const ev of evidence) {
    const weight = PHASE_WEIGHT[ev.supportsPhase];
    if (weight > maxWeight) {
      maxWeight = weight;
      currentPhase = ev.supportsPhase;
    }
  }

  // Disposition
  let disposition: JourneyDisposition = "ON_TRACK";
  if (input.caseStatus === "INFORMATION_INCOMPLETE") {
    disposition = "BLOCKED";
  } else if (input.caseStatus === "MEDICAL_TRANSFER_REQUIRED" || input.caseStatus === "REFERRED_TO_ALTERNATIVE_LEVEL") {
    disposition = "DIVERTED";
  } else if (input.caseStatus === "NO_PLACEMENT_FOUND") {
    disposition = "EXCEPTION";
  } else if (input.caseStatus === "CLOSED" || input.caseStatus === "CANCELLED" || input.caseStatus === "WITHDRAWN") {
    disposition = "CLOSED";
  }

  return {
    phase: currentPhase,
    disposition,
    evidence
  };
}
