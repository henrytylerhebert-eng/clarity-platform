/**
 * Characterization tests for the CaseStatus / WorkstreamStatuses duplication.
 *
 * These tests assert what current `main` ALREADY DOES. They are not a proposal and
 * they do not encode a target design. If one of them fails, the runtime contract
 * changed and `docs/architecture/STATE_RECONCILIATION_SPEC.md` is now stale.
 *
 * Deliberate constraints (owner ruling, Access Slice 1):
 *  - public contracts only; no private implementation constant is exported to make
 *    a test possible. In particular the state machine's internal ordered pipeline
 *    is characterized through `canTransitionCase` behavior, never imported.
 *  - no source file is modified to make these pass.
 *  - invariants already proven elsewhere are CITED in the spec, not duplicated here:
 *    the emergency/fairness rule (tests/workflow/case-lifecycle.test.ts),
 *    ACCESS-R-006 prescreen precedence (tests/unit/prescreen-contracts.test.ts,
 *    tests/unit/prescreen-service.test.ts), and the RETURNED_FOR_MORE_INFORMATION
 *    enum desync (tests/unit/contract-schema-enum-sync.test.ts).
 *
 * Nothing here calls any observed combination invalid. Current code does not.
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

/** The four CaseStatus values that name the same concerns as parallel workstreams. */
const LANE_SHAPED_STATUSES = [
  "CLINICAL_REVIEW",
  "LEGAL_REVIEW",
  "BENEFITS_REVIEW",
  "AUTHORIZATION_PREPARATION",
] as const satisfies readonly CaseStatus[];

/** The parallel workstreams naming the same four concerns, in the same order. */
const DUPLICATED_WORKSTREAMS = ["clinical", "legalReview", "benefits", "authorization"] as const;

/** A legal walk from DRAFT into BENEFITS_REVIEW, one permitted step at a time. */
const WALK_TO_BENEFITS_REVIEW = [
  "INTAKE_IN_PROGRESS",
  "DOCUMENTS_PENDING",
  "DOCUMENTS_RECEIVED",
  "EVIDENCE_PROCESSING",
  "EVIDENCE_REVIEW",
  "CLINICAL_REVIEW",
  "LEGAL_REVIEW",
  "BENEFITS_REVIEW",
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

describe("Test A — contradictory representations are constructible", () => {
  it("walks DRAFT to BENEFITS_REVIEW through the clinical and legal positions while both workstreams stay NOT_STARTED", () => {
    let c = syntheticCase();
    for (const next of WALK_TO_BENEFITS_REVIEW) {
      c = transitionCase(c, next);
    }

    // Overall status says the case is positionally past clinical and legal review.
    expect(c.status).toBe("BENEFITS_REVIEW");

    // The workstreams that name those same concerns never started.
    expect(c.workstreams.clinical).toBe("NOT_STARTED");
    expect(c.workstreams.legalReview).toBe("NOT_STARTED");

    // Every step above was a permitted transition; nothing was forced.
    expect(c.workstreams.benefits).toBe("NOT_STARTED");
  });

  it("permits the inverse contradiction: clinical COMPLETE while overall status is still DRAFT", () => {
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
    const before = syntheticCase({ status: "EVIDENCE_REVIEW" });
    const after = transitionCase(before, "CLINICAL_REVIEW");

    expect(after.status).toBe("CLINICAL_REVIEW");
    expect(after.workstreams).toEqual(before.workstreams);
    for (const workstream of WORKSTREAMS) {
      expect(after.workstreams[workstream]).toBe(before.workstreams[workstream]);
    }
  });

  it("advancing a workstream cannot advance overall status", () => {
    const before = syntheticCase({ status: "DRAFT" });
    const workstreams = updateWorkstream(before.workstreams, "clinical", "IN_PROGRESS");

    // updateWorkstream returns only workstream state; it has no access to CaseStatus.
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

    // Identical from/to verdict whether or not the clinical lane is blocked.
    const withFresh = syntheticCase({ status: "EVIDENCE_REVIEW" });
    const withBlocked = syntheticCase({
      status: "EVIDENCE_REVIEW",
      workstreams: blockedClinical,
    });

    expect(canTransitionCase(withFresh.status, "CLINICAL_REVIEW")).toBe(true);
    expect(canTransitionCase(withBlocked.status, "CLINICAL_REVIEW")).toBe(true);

    // And the transition actually succeeds with the lane blocked.
    expect(transitionCase(withBlocked, "CLINICAL_REVIEW").status).toBe("CLINICAL_REVIEW");
  });
});

describe("Test C — the lane-shaped statuses are a strict sequential ordering", () => {
  it.each([
    ["CLINICAL_REVIEW", "LEGAL_REVIEW"],
    ["LEGAL_REVIEW", "BENEFITS_REVIEW"],
    ["BENEFITS_REVIEW", "AUTHORIZATION_PREPARATION"],
  ] as const satisfies readonly (readonly [CaseStatus, CaseStatus])[])(
    "permits %s to advance to the next lane-shaped status %s",
    (from, to) => {
      expect(canTransitionCase(from, to)).toBe(true);
    },
  );

  it("refuses to skip a lane-shaped status", () => {
    expect(canTransitionCase("CLINICAL_REVIEW", "BENEFITS_REVIEW")).toBe(false);
    expect(canTransitionCase("CLINICAL_REVIEW", "AUTHORIZATION_PREPARATION")).toBe(false);
    expect(canTransitionCase("LEGAL_REVIEW", "AUTHORIZATION_PREPARATION")).toBe(false);
  });

  it("allows a bounded step back for rework, which is why the ordering is a pipeline and not a set", () => {
    expect(canTransitionCase("BENEFITS_REVIEW", "CLINICAL_REVIEW")).toBe(true);
    // beyond the bounded rework window the ordering reasserts itself
    expect(canTransitionCase("AUTHORIZATION_PREPARATION", "EVIDENCE_REVIEW")).toBe(false);
  });

  it("orders concerns that the workstream contract treats as independent", () => {
    // Each lane-shaped CaseStatus names a concern that also exists as its own
    // parallel workstream, and the lanes carry no ordering between them.
    expect(LANE_SHAPED_STATUSES).toHaveLength(DUPLICATED_WORKSTREAMS.length);
    for (const workstream of DUPLICATED_WORKSTREAMS) {
      expect(WORKSTREAMS).toContain(workstream);
    }
    // Any lane may move first; there is no required sequence between lanes.
    let workstreams = initialWorkstreamStatuses();
    workstreams = updateWorkstream(workstreams, "authorization", "IN_PROGRESS");
    expect(workstreams.authorization).toBe("IN_PROGRESS");
    expect(workstreams.clinical).toBe("NOT_STARTED");
  });
});

describe("Test D — the emergency case that a single linear status cannot represent", () => {
  /**
   * Does NOT re-prove canBeginClinicalReview; tests/workflow/case-lifecycle.test.ts
   * already does that. This characterizes the reconciliation consequence: the status
   * machine will advance an EMERGENT case through the financial positions while the
   * financial lanes are BLOCKED, because it cannot see them.
   */
  it("advances an EMERGENT case into BENEFITS_REVIEW while benefits and authorization are BLOCKED", () => {
    let workstreams = initialWorkstreamStatuses();
    workstreams = updateWorkstream(workstreams, "benefits", "BLOCKED");
    workstreams = updateWorkstream(workstreams, "authorization", "BLOCKED");

    let c = syntheticCase({ status: "CLINICAL_REVIEW", urgency: "EMERGENT", workstreams });

    // The intended state: clinical review may proceed despite blocked financials.
    expect(canBeginClinicalReview(c)).toBe(true);

    // The overall status nonetheless advances straight through the financial positions.
    c = transitionCase(c, "LEGAL_REVIEW");
    c = transitionCase(c, "BENEFITS_REVIEW");

    expect(c.status).toBe("BENEFITS_REVIEW");
    expect(c.workstreams.benefits).toBe("BLOCKED");
    expect(c.workstreams.authorization).toBe("BLOCKED");
  });
});
