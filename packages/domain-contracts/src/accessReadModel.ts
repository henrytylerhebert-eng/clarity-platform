import type { JourneyProjection } from "./journeyPhase.js";
import type { AccessGuidanceProjection } from "./accessGuidance.js";
import type { CaseStatus } from "./caseStateMachine.js";
import type { UrgencyLevel } from "./caseStateMachine.js";
import type { WorkstreamStatuses } from "./workstreams.js";
import type { PrescreenEncounterStatus } from "./prescreen.js";
import type { CaseEpisodeRelationship } from "./episode.js";

export const PACKET_REQUIREMENT_EVIDENCE_STATES = [
  "NOT_AVAILABLE",
  "LOADED_EMPTY",
  "LOADED",
] as const;

export type PacketRequirementEvidenceState = typeof PACKET_REQUIREMENT_EVIDENCE_STATES[number];

export interface AccessCaseReadModel {
  readonly caseKey: string;
  readonly caseVersion: number;

  readonly journey: JourneyProjection;

  readonly guidance: Omit<AccessGuidanceProjection, "journey">;

  readonly sourceState: {
    readonly caseStatus: CaseStatus;
    readonly urgency: UrgencyLevel;
    readonly workstreams: WorkstreamStatuses;

    readonly prescreenSelection: "NONE" | "SELECTED" | "AMBIGUOUS";

    readonly packetRequirementEvidence: PacketRequirementEvidenceState;

    readonly prescreen?: {
      readonly status: PrescreenEncounterStatus;
      readonly version: number;
    };

    readonly episodeRelationships: readonly CaseEpisodeRelationship[];
  };
}
