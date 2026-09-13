import { describe, expect, it } from "vitest";
import type { AssuranceEvaluationInput } from "@clarity/domain-contracts";
import { evaluateAssurance } from "../../packages/assurance-service/src/evaluator.js";

function baseInput(): AssuranceEvaluationInput {
  return {
    applicability: { status: "APPROVED", decisionId: "app-1" },
    sources: [
      {
        sourceId: "src-1",
        hasRequiredMetadata: true,
        currentness: "CURRENT",
        rights: "PERMITTED",
      },
    ],
    conflicts: [],
    expectation: { requiredKeys: ["roundDate", "owner", "followUpStatus"] },
    submission: {
      submissionId: "sub-1",
      payload: {
        roundDate: "2026-09-12",
        owner: "Synthetic Owner",
        followUpStatus: "OPEN",
      },
    },
  };
}

describe("evaluateAssurance", () => {
  it("returns SUPPORTED only for approved, current, permitted, conflict-free, complete support", () => {
    const result = evaluateAssurance(baseInput());

    expect(result).toEqual({
      result: "SUPPORTED",
      reasonCodes: ["EVIDENCE_COMPLETE"],
      requiresHumanReview: true,
      sourceIds: ["src-1"],
      evidenceSubmissionId: "sub-1",
    });
  });

  it("gives applicability the highest fail-closed precedence", () => {
    const input = baseInput();
    input.applicability = { status: "PENDING" };
    input.sources = [
      {
        sourceId: "src-1",
        hasRequiredMetadata: false,
        currentness: "SUPERSEDED",
        rights: "RESTRICTED",
      },
    ];
    input.conflicts = [{ conflictId: "conflict-1", status: "OPEN" }];
    delete input.submission;

    expect(evaluateAssurance(input).result).toBe("APPLICABILITY_PENDING");
  });

  it("returns UNKNOWN when required source metadata is absent before considering rights", () => {
    const input = baseInput();
    input.sources = [
      {
        sourceId: "src-1",
        hasRequiredMetadata: false,
        currentness: "CURRENT",
        rights: "RESTRICTED",
      },
    ];

    expect(evaluateAssurance(input)).toMatchObject({
      result: "UNKNOWN",
      reasonCodes: ["SOURCE_METADATA_INCOMPLETE"],
    });
  });

  it("returns UNKNOWN when no source is configured", () => {
    const input = baseInput();
    input.sources = [];

    expect(evaluateAssurance(input)).toMatchObject({
      result: "UNKNOWN",
      reasonCodes: ["SOURCE_METADATA_INCOMPLETE"],
    });
  });

  it("returns RIGHTS_RESTRICTED before stale-source or conflict evaluation", () => {
    const input = baseInput();
    input.sources = [
      {
        sourceId: "src-1",
        hasRequiredMetadata: true,
        currentness: "SUPERSEDED",
        rights: "RESTRICTED",
      },
    ];
    input.conflicts = [{ conflictId: "conflict-1", status: "OPEN" }];

    expect(evaluateAssurance(input)).toMatchObject({
      result: "RIGHTS_RESTRICTED",
      reasonCodes: ["SOURCE_RIGHTS_RESTRICTED"],
    });
  });

  it("returns REVIEW_REQUIRED when source rights are unknown", () => {
    const input = baseInput();
    input.sources = [
      {
        sourceId: "src-1",
        hasRequiredMetadata: true,
        currentness: "SUPERSEDED",
        rights: "UNKNOWN",
      },
    ];

    expect(evaluateAssurance(input)).toMatchObject({
      result: "REVIEW_REQUIRED",
      reasonCodes: ["SOURCE_RIGHTS_UNKNOWN"],
    });
  });

  it.each(["STALE", "SUPERSEDED"] as const)("returns STALE_SOURCE for %s authority", (currentness) => {
    const input = baseInput();
    input.sources = [
      {
        sourceId: "src-1",
        hasRequiredMetadata: true,
        currentness,
        rights: "PERMITTED",
      },
    ];
    input.conflicts = [{ conflictId: "conflict-1", status: "OPEN" }];

    expect(evaluateAssurance(input)).toMatchObject({
      result: "STALE_SOURCE",
      reasonCodes: ["SOURCE_STALE"],
    });
  });

  it("returns REVIEW_REQUIRED when source currentness is unknown", () => {
    const input = baseInput();
    input.sources = [
      {
        sourceId: "src-1",
        hasRequiredMetadata: true,
        currentness: "UNKNOWN",
        rights: "PERMITTED",
      },
    ];
    input.conflicts = [{ conflictId: "conflict-1", status: "OPEN" }];

    expect(evaluateAssurance(input)).toMatchObject({
      result: "REVIEW_REQUIRED",
      reasonCodes: ["SOURCE_CURRENTNESS_UNKNOWN"],
    });
  });

  it("returns CONFLICT before evidence completeness is considered", () => {
    const input = baseInput();
    input.conflicts = [{ conflictId: "conflict-1", status: "OPEN" }];
    delete input.submission;

    expect(evaluateAssurance(input)).toMatchObject({
      result: "CONFLICT",
      reasonCodes: ["SOURCE_CONFLICT_OPEN"],
    });
  });

  it("ignores resolved conflicts", () => {
    const input = baseInput();
    input.conflicts = [{ conflictId: "conflict-1", status: "RESOLVED" }];

    expect(evaluateAssurance(input).result).toBe("SUPPORTED");
  });

  it("returns UNKNOWN for an empty evidence expectation", () => {
    const input = baseInput();
    input.expectation = { requiredKeys: ["", "   "] };

    expect(evaluateAssurance(input)).toMatchObject({
      result: "UNKNOWN",
      reasonCodes: ["EVIDENCE_EXPECTATION_EMPTY"],
    });
  });

  it("returns MISSING_EVIDENCE when no submission exists", () => {
    const input = baseInput();
    delete input.submission;

    expect(evaluateAssurance(input)).toMatchObject({
      result: "MISSING_EVIDENCE",
      reasonCodes: ["EVIDENCE_NOT_SUBMITTED"],
    });
  });

  it("returns MISSING_EVIDENCE when a submission has none of the required values", () => {
    const input = baseInput();
    input.submission = {
      submissionId: "sub-empty",
      payload: { roundDate: "", owner: null, followUpStatus: [] },
    };

    expect(evaluateAssurance(input)).toMatchObject({
      result: "MISSING_EVIDENCE",
      reasonCodes: ["EVIDENCE_MISSING"],
      evidenceSubmissionId: "sub-empty",
    });
  });

  it("returns PARTIALLY_SUPPORTED when at least one but not all required keys are meaningful", () => {
    const input = baseInput();
    input.submission = {
      submissionId: "sub-partial",
      payload: { roundDate: "2026-09-12", owner: "" },
    };

    expect(evaluateAssurance(input)).toMatchObject({
      result: "PARTIALLY_SUPPORTED",
      reasonCodes: ["EVIDENCE_PARTIAL"],
    });
  });

  it("treats numeric zero and boolean false as present evidence rather than missing", () => {
    const input = baseInput();
    input.expectation = { requiredKeys: ["zeroValue", "falseValue"] };
    input.submission = {
      submissionId: "sub-zero-false",
      payload: { zeroValue: 0, falseValue: false },
    };

    expect(evaluateAssurance(input).result).toBe("SUPPORTED");
  });

  it("deduplicates and trims required evidence keys deterministically", () => {
    const input = baseInput();
    input.expectation = { requiredKeys: [" owner ", "owner", "followUpStatus"] };
    input.submission = {
      submissionId: "sub-normalized",
      payload: { owner: "Synthetic Owner", followUpStatus: "OPEN" },
    };

    expect(evaluateAssurance(input).result).toBe("SUPPORTED");
  });

  it("is deterministic for identical inputs", () => {
    const input = baseInput();

    expect(evaluateAssurance(input)).toEqual(evaluateAssurance(input));
  });

  it("always requires qualified human review, including SUPPORTED", () => {
    expect(evaluateAssurance(baseInput()).requiresHumanReview).toBe(true);
  });
});
