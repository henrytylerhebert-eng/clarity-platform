import { describe, expect, it } from "vitest";
import {
  deriveJourneyProjection,
  CASE_STATUSES,
  PRESCREEN_ENCOUNTER_STATUSES,
  type CaseStatus,
  type JourneyProjectionInput,
  type CaseEpisodeRelationship
} from "@clarity/domain-contracts";

describe("JourneyPhase Projection", () => {
  describe("Enum Coverage", () => {
    it("classifies every CaseStatus explicitly without crashing", () => {
      for (const status of CASE_STATUSES) {
        const input: JourneyProjectionInput = { caseStatus: status };
        const result = deriveJourneyProjection(input);
        expect(result.disposition).toBeDefined();
      }
    });
    
    it("classifies every PrescreenEncounterStatus explicitly without crashing", () => {
      for (const pre of PRESCREEN_ENCOUNTER_STATUSES) {
        const input: JourneyProjectionInput = { caseStatus: "DRAFT", prescreenStatus: pre };
        const result = deriveJourneyProjection(input);
        expect(result.disposition).toBeDefined();
      }
    });
  });

  describe("Base Case Status -> Phase Derivation", () => {
    it("derives REFERRAL from DRAFT", () => {
      const { phase, disposition } = deriveJourneyProjection({ caseStatus: "DRAFT" });
      expect(phase).toBe("REFERRAL");
      expect(disposition).toBe("ON_TRACK");
    });
    
    it("derives PRESCREEN from intake phases", () => {
      const statuses: CaseStatus[] = [
        "INTAKE_IN_PROGRESS", "DOCUMENTS_PENDING", "DOCUMENTS_RECEIVED",
        "EVIDENCE_PROCESSING", "EVIDENCE_REVIEW"
      ];
      for (const status of statuses) {
        const { phase } = deriveJourneyProjection({ caseStatus: status });
        expect(phase).toBe("PRESCREEN");
      }
    });

    it("derives QUALIFIED_REVIEW from review phases", () => {
      const statuses: CaseStatus[] = [
        "REVIEW_IN_PROGRESS", "PACKET_PREPARATION", "READY_FOR_ROUTING"
      ];
      for (const status of statuses) {
        const { phase } = deriveJourneyProjection({ caseStatus: status });
        expect(phase).toBe("QUALIFIED_REVIEW");
      }
    });

    it("derives FACILITY_REVIEW from routing phases", () => {
      const statuses: CaseStatus[] = [
        "ROUTING_IN_PROGRESS", "FACILITY_RESPONSE_PENDING", 
        "NO_PLACEMENT_FOUND", "REFERRED_TO_ALTERNATIVE_LEVEL"
      ];
      for (const status of statuses) {
        const { phase } = deriveJourneyProjection({ caseStatus: status });
        expect(phase).toBe("FACILITY_REVIEW");
      }
    });

    it("derives PRE_ADMISSION from ACCEPTED", () => {
      const { phase } = deriveJourneyProjection({ caseStatus: "ACCEPTED" });
      expect(phase).toBe("PRE_ADMISSION");
    });

    it("derives TRANSFER_HANDOFF from transport phases", () => {
      const statuses: CaseStatus[] = [
        "TRANSPORT_PENDING", "HANDOFF_IN_PROGRESS", "TRANSFER_COMPLETE"
      ];
      for (const status of statuses) {
        const { phase } = deriveJourneyProjection({ caseStatus: status });
        expect(phase).toBe("TRANSFER_HANDOFF");
      }
    });
  });

  describe("Legacy Non-Inflation Invariant", () => {
    it("normalizes legacy statuses to QUALIFIED_REVIEW and sets legacyCompatibility", () => {
      const legacies: CaseStatus[] = [
        "CLINICAL_REVIEW", "LEGAL_REVIEW", "BENEFITS_REVIEW", "AUTHORIZATION_PREPARATION"
      ];
      for (const legacy of legacies) {
        const { phase, evidence } = deriveJourneyProjection({ caseStatus: legacy });
        expect(phase).toBe("QUALIFIED_REVIEW");
        expect(evidence[0]?.legacyCompatibility).toBe(true);
      }
    });
  });

  describe("Detour Honesty", () => {
    it("returns null phase and proper disposition for detour statuses with no other evidence", () => {
      const detours: { status: CaseStatus, disp: string }[] = [
        { status: "INFORMATION_INCOMPLETE", disp: "BLOCKED" },
        { status: "MEDICAL_TRANSFER_REQUIRED", disp: "DIVERTED" },
        { status: "CLOSED", disp: "CLOSED" },
        { status: "CANCELLED", disp: "CLOSED" },
        { status: "WITHDRAWN", disp: "CLOSED" }
      ];
      for (const detour of detours) {
        const { phase, disposition, evidence } = deriveJourneyProjection({ caseStatus: detour.status });
        expect(phase).toBeNull();
        expect(disposition).toBe(detour.disp);
        expect(evidence).toHaveLength(0);
      }
    });

    it("allows other evidence to supply the phase even when case status is a detour", () => {
      const { phase, disposition, evidence } = deriveJourneyProjection({ 
        caseStatus: "MEDICAL_TRANSFER_REQUIRED", 
        prescreenStatus: "FACILITY_ROUTING" 
      });
      expect(phase).toBe("FACILITY_REVIEW");
      expect(disposition).toBe("DIVERTED");
      expect(evidence).toHaveLength(1);
      expect(evidence[0]?.source).toBe("PRESCREEN_STATUS");
    });
  });

  describe("Episode Linkage -> Admission", () => {
    it("sets phase to ADMISSION when valid case-to-episode link exists, ignoring earlier case state", () => {
      const inputs: JourneyProjectionInput[] = [
        { caseStatus: "ACCEPTED", episodeRelationships: ["ADMISSION_SOURCE"] },
        { caseStatus: "TRANSFER_COMPLETE", episodeRelationships: ["TRANSFER_SOURCE"] },
        { caseStatus: "READY_FOR_ROUTING", episodeRelationships: ["READMISSION_SOURCE"] },
      ];
      for (const input of inputs) {
        const { phase, evidence } = deriveJourneyProjection(input);
        expect(phase).toBe("ADMISSION");
        expect(evidence.some(e => e.supportsPhase === "ADMISSION")).toBe(true);
      }
    });
    
    it("ignores unrecognized episode relationships", () => {
      const { phase } = deriveJourneyProjection({ 
        caseStatus: "ACCEPTED", 
        episodeRelationships: ["UNKNOWN_SOURCE" as CaseEpisodeRelationship] 
      });
      expect(phase).toBe("PRE_ADMISSION");
    });
  });

  describe("Furthest-Evidence Wins / Conflict Tests", () => {
    it("earlier CaseStatus + later Prescreen", () => {
      const { phase } = deriveJourneyProjection({ caseStatus: "DRAFT", prescreenStatus: "FACILITY_ROUTING" });
      expect(phase).toBe("FACILITY_REVIEW");
    });

    it("later CaseStatus + earlier Prescreen", () => {
      const { phase } = deriveJourneyProjection({ caseStatus: "ACCEPTED", prescreenStatus: "DRAFT" });
      expect(phase).toBe("PRE_ADMISSION");
    });

    it("legacy CaseStatus + later Prescreen", () => {
      const { phase } = deriveJourneyProjection({ caseStatus: "CLINICAL_REVIEW", prescreenStatus: "HANDED_OFF" });
      expect(phase).toBe("TRANSFER_HANDOFF");
    });
    
    it("transfer CaseStatus + earlier Prescreen", () => {
      const { phase } = deriveJourneyProjection({ caseStatus: "TRANSFER_COMPLETE", prescreenStatus: "FACILITY_ROUTING" });
      expect(phase).toBe("TRANSFER_HANDOFF");
    });

    it("Episode link + every earlier phase", () => {
      const { phase } = deriveJourneyProjection({ 
        caseStatus: "TRANSFER_COMPLETE", 
        prescreenStatus: "HANDED_OFF",
        episodeRelationships: ["ADMISSION_SOURCE"]
      });
      expect(phase).toBe("ADMISSION");
    });
  });
  
  describe("Workstream Non-Influence Invariant", () => {
    it("demonstrates same case status / prescreen / episode -> same journey phase regardless of unpassed workstream data", () => {
      // The function signature itself does not accept workstreams, proving they don't influence it.
      // But we demonstrate that purely from the domain boundary:
      const baseInput: JourneyProjectionInput = {
        caseStatus: "REVIEW_IN_PROGRESS",
      };
      
      const { phase: p1 } = deriveJourneyProjection(baseInput);
      
      // Even if another bounded context knows benefits is BLOCKED, the projection is purely based on the explicit input.
      const { phase: p2 } = deriveJourneyProjection(baseInput);
      expect(p1).toBe(p2);
      expect(p1).toBe("QUALIFIED_REVIEW");
    });
  });
});
