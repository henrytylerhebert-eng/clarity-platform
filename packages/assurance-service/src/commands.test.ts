import { describe, expect, it } from "vitest";
import {
  EvaluateAssuranceCommandSchema,
  ReviewAssuranceEvaluationCommandSchema,
  ReviseAssuranceEvidenceCommandSchema,
  SubmitAssuranceEvidenceCommandSchema,
} from "./commands.js";

describe("assurance command envelopes", () => {
  it("SubmitAssuranceEvidenceCommandSchema accepts a valid payload and rejects unknown fields or missing keys", () => {
    const valid = { caseKey: "syn-case-1", expectationId: "syn-exp-1", payload: { roundDate: "2026-09-12" } };
    expect(SubmitAssuranceEvidenceCommandSchema.parse(valid)).toEqual(valid);
    expect(() => SubmitAssuranceEvidenceCommandSchema.parse({ ...valid, extra: "forged" })).toThrow();
    expect(() => SubmitAssuranceEvidenceCommandSchema.parse({ caseKey: "syn-case-1" })).toThrow();
    expect(() => SubmitAssuranceEvidenceCommandSchema.parse({ ...valid, caseKey: "" })).toThrow();
  });

  it("ReviseAssuranceEvidenceCommandSchema accepts a valid payload and rejects unknown fields or missing keys", () => {
    const valid = { caseKey: "syn-case-1", priorSubmissionId: "syn-sub-1", payload: { owner: "Owner" } };
    expect(ReviseAssuranceEvidenceCommandSchema.parse(valid)).toEqual(valid);
    expect(() => ReviseAssuranceEvidenceCommandSchema.parse({ ...valid, extra: "forged" })).toThrow();
    expect(() => ReviseAssuranceEvidenceCommandSchema.parse({ caseKey: "syn-case-1", payload: {} })).toThrow();
  });

  it("EvaluateAssuranceCommandSchema accepts a valid payload and rejects unknown fields or missing keys", () => {
    const valid = { caseKey: "syn-case-1", expectationId: "syn-exp-1" };
    expect(EvaluateAssuranceCommandSchema.parse(valid)).toEqual(valid);
    expect(() => EvaluateAssuranceCommandSchema.parse({ ...valid, extra: "forged" })).toThrow();
    expect(() => EvaluateAssuranceCommandSchema.parse({ caseKey: "syn-case-1" })).toThrow();
  });

  it("ReviewAssuranceEvaluationCommandSchema accepts a valid decision, allows omitted rationale, and rejects an invalid decision or unknown fields", () => {
    const valid = { caseKey: "syn-case-1", evaluationId: "syn-eval-1", decision: "ACCEPT" } as const;
    expect(ReviewAssuranceEvaluationCommandSchema.parse(valid)).toEqual(valid);
    expect(
      ReviewAssuranceEvaluationCommandSchema.parse({ ...valid, decision: "REJECT", rationale: "Synthetic reason" }),
    ).toEqual({ ...valid, decision: "REJECT", rationale: "Synthetic reason" });
    expect(() => ReviewAssuranceEvaluationCommandSchema.parse({ ...valid, decision: "MAYBE" })).toThrow();
    expect(() => ReviewAssuranceEvaluationCommandSchema.parse({ ...valid, extra: "forged" })).toThrow();
  });
});
