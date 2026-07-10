import { describe, expect, it } from "vitest";
import {
  canTransitionCase,
  transitionCase,
  canBeginClinicalReview,
  initialWorkstreamStatuses,
  updateWorkstream,
  type ClarityCase,
} from "@clarity/domain-contracts";

function makeCase(overrides: Partial<ClarityCase> = {}): ClarityCase {
  return {
    caseKey: "synthetic-test-case",
    organizationId: "org-1",
    status: "DRAFT",
    urgency: "ROUTINE",
    workstreams: initialWorkstreamStatuses(),
    ...overrides,
  };
}

describe("case creation", () => {
  it("creates a tenant-scoped case in DRAFT with all workstreams NOT_STARTED", () => {
    const c = makeCase();
    expect(c.status).toBe("DRAFT");
    expect(c.organizationId).toBe("org-1");
    expect(Object.values(c.workstreams)).toEqual(Array(8).fill("NOT_STARTED"));
  });
});

describe("case state transitions", () => {
  it("allows the forward path", () => {
    let c = makeCase();
    c = transitionCase(c, "INTAKE_IN_PROGRESS");
    c = transitionCase(c, "DOCUMENTS_PENDING");
    c = transitionCase(c, "DOCUMENTS_RECEIVED");
    expect(c.status).toBe("DOCUMENTS_RECEIVED");
  });

  it("rejects invalid jumps and mutations of terminal cases", () => {
    expect(canTransitionCase("DRAFT", "TRANSFER_COMPLETE")).toBe(false);
    expect(canTransitionCase("CLOSED", "INTAKE_IN_PROGRESS")).toBe(false);
    expect(canTransitionCase("CANCELLED", "DRAFT")).toBe(false);
    expect(() => transitionCase(makeCase({ status: "CLOSED" }), "DRAFT")).toThrow(/Invalid case transition/);
  });

  it("allows cancellation from any active state and information-incomplete detours", () => {
    expect(canTransitionCase("EVIDENCE_REVIEW", "CANCELLED")).toBe(true);
    expect(canTransitionCase("CLINICAL_REVIEW", "INFORMATION_INCOMPLETE")).toBe(true);
    expect(canTransitionCase("INFORMATION_INCOMPLETE", "CLINICAL_REVIEW")).toBe(true);
  });
});

describe("parallel workstream updates", () => {
  it("updates one workstream without touching siblings", () => {
    const s0 = initialWorkstreamStatuses();
    const s1 = updateWorkstream(s0, "benefits", "IN_PROGRESS");
    expect(s1.benefits).toBe("IN_PROGRESS");
    expect(s1.clinical).toBe("NOT_STARTED");
    expect(s1.placement).toBe("NOT_STARTED");
  });

  it("supports simultaneously divergent workstreams", () => {
    let s = initialWorkstreamStatuses();
    s = updateWorkstream(s, "clinical", "IN_PROGRESS");
    s = updateWorkstream(s, "legalReview", "IN_PROGRESS");
    s = updateWorkstream(s, "legalReview", "PENDING_REVIEW");
    s = updateWorkstream(s, "medicalScreening", "IN_PROGRESS");
    s = updateWorkstream(s, "medicalScreening", "COMPLETE");
    s = updateWorkstream(s, "benefits", "IN_PROGRESS");
    expect(s).toMatchObject({
      clinical: "IN_PROGRESS",
      legalReview: "PENDING_REVIEW",
      medicalScreening: "COMPLETE",
      benefits: "IN_PROGRESS",
      placement: "NOT_STARTED",
    });
  });

  it("rejects invalid workstream transitions", () => {
    const s = initialWorkstreamStatuses();
    expect(() => updateWorkstream(s, "benefits", "COMPLETE")).toThrow(/Invalid benefits transition/);
  });
});

describe("emergency clinical review vs financial readiness", () => {
  it("proceeds with emergency clinical review while benefits/authorization are BLOCKED", () => {
    let ws = initialWorkstreamStatuses();
    ws = updateWorkstream(ws, "benefits", "BLOCKED");
    ws = updateWorkstream(ws, "authorization", "BLOCKED");
    const emergent = makeCase({ urgency: "EMERGENT", workstreams: ws });
    expect(canBeginClinicalReview(emergent)).toBe(true);
  });
});
