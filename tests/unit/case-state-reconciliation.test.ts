
/**
 * Characterization test suite for state reconciliation boundaries.
 * 
 * [Architecture Change Documentation - Slice 2A]
 * - Vocabulary replacement: CLINICAL_REVIEW, LEGAL_REVIEW, BENEFITS_REVIEW, AUTHORIZATION_PREPARATION replaced with REVIEW_IN_PROGRESS.
 * - Removal of positional implementation detail: Tests that explicitly asserted positional step-forwards/step-backs have been updated to assert the new explicit semantic graph edges.
 * - Normalized compatibility behavior: Rework steps from REVIEW_IN_PROGRESS are now explicitly EVIDENCE_REVIEW, EVIDENCE_PROCESSING, DOCUMENTS_RECEIVED.
 * - Intentional new neutral-span behavior: The single REVIEW_IN_PROGRESS state encompasses all these concerns concurrently.
 */
import { describe, expect, it } from "vitest";
import {
  canBeginClinicalReview,
  canTransitionCase,
  initialWorkstreamStatuses,
  transitionCase,
  updateWorkstream,
  WORKSTREAMS,
  type CaseStatus,
  type ClarityCase,
} from "@clarity/domain-contracts";

/** The parallel workstreams naming the same concerns. */

/** A legal walk from DRAFT into REVIEW_IN_PROGRESS, one permitted step at a time. (Vocabulary replacement) */
const WALK_TO_REVIEW_IN_PROGRESS = [
  "INTAKE_IN_PROGRESS",
  "DOCUMENTS_PENDING",
  "DOCUMENTS_RECEIVED",
  "EVIDENCE_PROCESSING",
  "EVIDENCE_REVIEW",
  "REVIEW_IN_PROGRESS",
] as const satisfies readonly CaseStatus[];

function syntheticCase(overrides: Partial<ClarityCase> = {}): ClarityCase {
  return {
    caseKey: "synthetic-reconciliation-0001",
    organizationId: "synthetic-org-reconciliation",
    status: "DRAFT",
    urgency: "ROUTINE",
    workstreams: initialWorkstreamStatuses(),
    ...overrides,
  };
}

describe("Test A — contradictory representations are structurally prevented by the neutral span", () => {
  it("walks DRAFT to REVIEW_IN_PROGRESS while workstreams stay NOT_STARTED", () => {
    let c = syntheticCase();
    for (const next of WALK_TO_REVIEW_IN_PROGRESS) {
      c = transitionCase(c, next);
    }

    // Overall status says the case is in the review span. (Intentional new neutral-span behavior)
    expect(c.status).toBe("REVIEW_IN_PROGRESS");

    // The workstreams that name those same concerns never started.
    expect(c.workstreams.clinical).toBe("NOT_STARTED");
    expect(c.workstreams.legalReview).toBe("NOT_STARTED");

    // Every step above was a permitted transition; nothing was forced.
    expect(c.workstreams.benefits).toBe("NOT_STARTED");
  });

  it("permits the inverse: clinical COMPLETE while overall status is still DRAFT", () => {
    let workstreams = initialWorkstreamStatuses();
    workstreams = updateWorkstream(workstreams, "clinical", "IN_PROGRESS");
    workstreams = updateWorkstream(workstreams, "clinical", "COMPLETE");

    const c = syntheticCase({ status: "DRAFT", workstreams });

    expect(c.status).toBe("DRAFT");
    expect(c.workstreams.clinical).toBe("COMPLETE");
  });
});

describe("Test B — status and workstream transitions are decoupled", () => {
  it("advancing overall CaseStatus leaves every workstream untouched", () => {
    // Vocabulary replacement: CLINICAL_REVIEW -> REVIEW_IN_PROGRESS
    const before = syntheticCase({ status: "EVIDENCE_REVIEW" });
    const after = transitionCase(before, "REVIEW_IN_PROGRESS");

    expect(after.status).toBe("REVIEW_IN_PROGRESS");
    expect(after.workstreams).toEqual(before.workstreams);
    for (const workstream of WORKSTREAMS) {
      expect(after.workstreams[workstream]).toBe(before.workstreams[workstream]);
    }
  });

  it("advancing a workstream cannot advance overall status", () => {
    const before = syntheticCase({ status: "DRAFT" });
    const workstreams = updateWorkstream(before.workstreams, "clinical", "IN_PROGRESS");

    expect(Object.keys(workstreams).sort()).toEqual([...WORKSTREAMS].sort());
    expect(workstreams).not.toHaveProperty("status");
    expect(before.status).toBe("DRAFT");
  });

  it("status transition validity never consults workstream state", () => {
    const blockedClinical = updateWorkstream(
      initialWorkstreamStatuses(),
      "clinical",
      "BLOCKED",
    );

    // Vocabulary replacement: CLINICAL_REVIEW -> REVIEW_IN_PROGRESS
    const withFresh = syntheticCase({ status: "EVIDENCE_REVIEW" });
    const withBlocked = syntheticCase({
      status: "EVIDENCE_REVIEW",
      workstreams: blockedClinical,
    });

    expect(canTransitionCase(withFresh.status, "REVIEW_IN_PROGRESS")).toBe(true);
    expect(canTransitionCase(withBlocked.status, "REVIEW_IN_PROGRESS")).toBe(true);

    // And the transition actually succeeds with the lane blocked.
    expect(transitionCase(withBlocked, "REVIEW_IN_PROGRESS").status).toBe("REVIEW_IN_PROGRESS");
  });
});

describe("Test C — the neutral span replaces strict sequential lane-shaped ordering", () => {
  // Removal of positional implementation detail
  it("refuses to step from a legacy state to another legacy state", () => {
    expect(canTransitionCase("CLINICAL_REVIEW", "LEGAL_REVIEW")).toBe(false);
    expect(canTransitionCase("LEGAL_REVIEW", "BENEFITS_REVIEW")).toBe(false);
  });

  it("allows a bounded step back for rework from the neutral span (normalized compatibility behavior)", () => {
    expect(canTransitionCase("REVIEW_IN_PROGRESS", "EVIDENCE_REVIEW")).toBe(true);
    expect(canTransitionCase("REVIEW_IN_PROGRESS", "EVIDENCE_PROCESSING")).toBe(true);
    expect(canTransitionCase("REVIEW_IN_PROGRESS", "DOCUMENTS_RECEIVED")).toBe(true);
    
    // beyond the explicit rework window it is false
    expect(canTransitionCase("REVIEW_IN_PROGRESS", "DRAFT")).toBe(false);
  });
});

describe("Test D — the emergency case", () => {
  it("advances an EMERGENT case into PACKET_PREPARATION while benefits and authorization are BLOCKED", () => {
    let workstreams = initialWorkstreamStatuses();
    workstreams = updateWorkstream(workstreams, "benefits", "BLOCKED");
    workstreams = updateWorkstream(workstreams, "authorization", "BLOCKED");

    // Vocabulary replacement: CLINICAL_REVIEW -> REVIEW_IN_PROGRESS
    let c = syntheticCase({ status: "REVIEW_IN_PROGRESS", urgency: "EMERGENT", workstreams });

    // The intended state: clinical review may proceed despite blocked financials.
    expect(canBeginClinicalReview(c)).toBe(true);

    // The overall status nonetheless advances straight to PACKET_PREPARATION
    c = transitionCase(c, "PACKET_PREPARATION");

    expect(c.status).toBe("PACKET_PREPARATION");
    expect(c.workstreams.benefits).toBe("BLOCKED");
    expect(c.workstreams.authorization).toBe("BLOCKED");
  });
});
