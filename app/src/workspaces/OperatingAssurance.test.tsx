import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  apiAssuranceEvaluate,
  apiAssuranceGetCase,
  apiAssuranceGetHistory,
  apiAssuranceReview,
  apiAssuranceReviseEvidence,
  apiAssuranceSubmitEvidence,
  type AssuranceCaseViewDto,
  type VerifiedPrincipal,
} from "../domain/api";
import { OperatingAssurance } from "./OperatingAssurance";

vi.mock("../domain/api", async () => {
  const actual = await vi.importActual<typeof import("../domain/api")>("../domain/api");
  return {
    ...actual,
    apiAssuranceGetCase: vi.fn(),
    apiAssuranceGetHistory: vi.fn(),
    apiAssuranceSubmitEvidence: vi.fn(),
    apiAssuranceReviseEvidence: vi.fn(),
    apiAssuranceEvaluate: vi.fn(),
    apiAssuranceReview: vi.fn(),
  };
});

const contributor: VerifiedPrincipal = {
  userId: "user-contributor",
  organizationId: "org-a",
  displayName: "Contributor",
  roles: [],
  sessionId: "session-contributor",
  expiresAt: "2026-09-14T00:00:00Z",
};

const reviewer: VerifiedPrincipal = {
  userId: "user-reviewer",
  organizationId: "org-a",
  displayName: "Reviewer",
  roles: ["COMPLIANCE_REVIEWER"],
  sessionId: "session-reviewer",
  expiresAt: "2026-09-14T00:00:00Z",
};

function view(overrides: Partial<AssuranceCaseViewDto> = {}): AssuranceCaseViewDto {
  return {
    id: "case-id-1",
    organizationId: "org-a",
    facilityProfileId: "facility-1",
    caseKey: "oa-case-1",
    title: "Monthly environmental assurance",
    assuranceStatement: "Required evidence is documented.",
    version: 1,
    participants: [
      {
        userId: contributor.userId,
        role: "EVIDENCE_CONTRIBUTOR",
        authorityBasis: null,
        active: true,
        grantedAt: "2026-09-13T00:00:00Z",
      },
      {
        userId: reviewer.userId,
        role: "QUALIFIED_REVIEWER",
        authorityBasis: "Synthetic reviewer authority",
        active: true,
        grantedAt: "2026-09-13T00:00:00Z",
      },
    ],
    applicability: [
      {
        id: "app-1",
        status: "APPROVED",
        rationale: "Synthetic applicability approved.",
        approvedBy: "owner-1",
        approvedAt: "2026-09-13T00:00:00Z",
        version: 1,
        createdAt: "2026-09-13T00:00:00Z",
      },
    ],
    sources: [
      {
        id: "source-1",
        sourceFamilyKey: "SYN-AUTH",
        versionLabel: "v1",
        title: "Synthetic authority",
        authorityClass: "FEDERAL_REGULATION",
        citation: "SYN-CITATION",
        sourceUri: null,
        effectiveAt: null,
        currentness: "CURRENT",
        rightsStatus: "PERMITTED",
      },
    ],
    documentReferences: [
      {
        id: "policy-1",
        kind: "POLICY",
        referenceKey: "POLICY-1",
        title: "Synthetic policy",
        versionLabel: "v1",
        locator: null,
        createdAt: "2026-09-13T00:00:00Z",
      },
      {
        id: "sop-1",
        kind: "SOP",
        referenceKey: "SOP-1",
        title: "Synthetic SOP",
        versionLabel: "v1",
        locator: null,
        createdAt: "2026-09-13T00:00:00Z",
      },
    ],
    evidenceExpectations: [
      {
        id: "expectation-1",
        code: "MONTHLY_ROUND",
        prompt: "Provide date, owner, and follow-up status.",
        requiredKeys: ["roundDate", "owner", "followUpStatus"],
        createdAt: "2026-09-13T00:00:00Z",
        submissions: [],
      },
    ],
    sourceConflicts: [],
    evaluations: [],
    ...overrides,
  };
}

function loadMocks(caseView: AssuranceCaseViewDto) {
  vi.mocked(apiAssuranceGetCase).mockResolvedValue(caseView);
  vi.mocked(apiAssuranceGetHistory).mockResolvedValue([
    {
      kind: "EVIDENCE",
      id: "history-evidence",
      occurredAt: "2026-09-13T00:00:00Z",
      state: "SUBMITTED",
      version: 1,
    },
  ]);
}

async function loadCase(principal: VerifiedPrincipal, caseView: AssuranceCaseViewDto) {
  loadMocks(caseView);
  render(<OperatingAssurance principal={principal} />);
  fireEvent.change(screen.getByLabelText("Operating Assurance case key"), { target: { value: caseView.caseKey } });
  fireEvent.click(screen.getByRole("button", { name: "Load case" }));
  await screen.findByText(caseView.title);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(apiAssuranceSubmitEvidence).mockResolvedValue({} as never);
  vi.mocked(apiAssuranceReviseEvidence).mockResolvedValue({} as never);
  vi.mocked(apiAssuranceEvaluate).mockResolvedValue({} as never);
  vi.mocked(apiAssuranceReview).mockResolvedValue({} as never);
});

describe("OperatingAssurance workspace", () => {
  it("requires a verified API principal; demo navigation alone cannot authorize OA work", () => {
    render(<OperatingAssurance principal={null} />);
    expect(screen.getByText("Verified API session required")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Load case" })).toBeNull();
  });

  it("renders the governed trust chain and visibly preserves fail-closed states without a compliant shortcut", async () => {
    const stale = view({
      sources: [{ ...view().sources[0]!, currentness: "STALE" }],
      evaluations: [
        {
          id: "eval-stale",
          evidenceSubmissionId: null,
          result: "STALE_SOURCE",
          reasonCodes: ["SOURCE_STALE"],
          requiresHumanReview: true,
          createdAt: "2026-09-13T01:00:00Z",
          revision: 2,
          reviewDecisions: [],
        },
      ],
    });
    await loadCase(contributor, stale);

    expect(screen.getByLabelText("Operating Assurance trust strip")).toBeVisible();
    for (const label of ["Authority", "Applicability", "Policy", "SOP", "Evidence", "Machine assistance", "Human review"]) {
      expect(screen.getByText(label)).toBeVisible();
    }
    expect(screen.getAllByText("Stale Source").length).toBeGreaterThan(0);
    expect(screen.getByText(/fail-closed state/i)).toBeVisible();
    expect(screen.queryByText(/^Compliant$/i)).toBeNull();
  });

  it("submits only expectationId and evidence payload, then refreshes server state", async () => {
    const caseView = view();
    await loadCase(contributor, caseView);
    fireEvent.change(screen.getByLabelText("Evidence roundDate"), { target: { value: "2026-09-13" } });
    fireEvent.change(screen.getByLabelText("Evidence owner"), { target: { value: "Synthetic Owner" } });
    fireEvent.change(screen.getByLabelText("Evidence followUpStatus"), { target: { value: "COMPLETE" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit evidence" }));

    await waitFor(() => expect(apiAssuranceSubmitEvidence).toHaveBeenCalledTimes(1));
    expect(apiAssuranceSubmitEvidence).toHaveBeenCalledWith({
      caseKey: caseView.caseKey,
      expectationId: "expectation-1",
      payload: {
        roundDate: "2026-09-13",
        owner: "Synthetic Owner",
        followUpStatus: "COMPLETE",
      },
    });
    expect(apiAssuranceGetCase).toHaveBeenCalledTimes(2);
  });

  it("revises evidence with only the prior submission id and payload", async () => {
    const existingSubmission = {
      id: "submission-1",
      expectationId: "expectation-1",
      payload: { roundDate: "2026-09-12", owner: "Old", followUpStatus: "OPEN" },
      status: "SUBMITTED" as const,
      version: 1,
      submittedBy: contributor.userId,
      submittedAt: "2026-09-13T00:00:00Z",
      reviewedBy: null,
      reviewedAt: null,
      supersededById: null,
    };
    const caseView = view({
      evidenceExpectations: [{ ...view().evidenceExpectations[0]!, submissions: [existingSubmission] }],
    });
    await loadCase(contributor, caseView);
    fireEvent.change(screen.getByLabelText("Evidence owner"), { target: { value: "Revised Owner" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit evidence revision" }));

    await waitFor(() => expect(apiAssuranceReviseEvidence).toHaveBeenCalledTimes(1));
    expect(apiAssuranceReviseEvidence).toHaveBeenCalledWith({
      caseKey: caseView.caseKey,
      priorSubmissionId: "submission-1",
      payload: {
        roundDate: "2026-09-12",
        owner: "Revised Owner",
        followUpStatus: "OPEN",
      },
    });
  });

  it("keeps machine evaluation human-review gated and sends only the approved evaluate envelope", async () => {
    const caseView = view();
    await loadCase(contributor, caseView);
    fireEvent.click(screen.getByRole("button", { name: "Run governed evaluation" }));
    await waitFor(() => expect(apiAssuranceEvaluate).toHaveBeenCalledTimes(1));
    expect(apiAssuranceEvaluate).toHaveBeenCalledWith({
      caseKey: caseView.caseKey,
      expectationId: "expectation-1",
    });
    expect(screen.getByText(/Machine assistance is not a compliance determination/i)).toBeVisible();
  });

  it("allows the qualified reviewer UI only when both backend-visible grants are present and sends no authority fields", async () => {
    const caseView = view({
      evaluations: [
        {
          id: "evaluation-1",
          evidenceSubmissionId: "submission-1",
          result: "SUPPORTED",
          reasonCodes: ["EVIDENCE_COMPLETE"],
          requiresHumanReview: true,
          createdAt: "2026-09-13T01:00:00Z",
          revision: 1,
          reviewDecisions: [],
        },
      ],
    });
    await loadCase(reviewer, caseView);
    fireEvent.change(screen.getByLabelText("Review decision"), { target: { value: "REJECT" } });
    fireEvent.change(screen.getByLabelText("Review rationale"), { target: { value: "Evidence does not support the bounded conclusion." } });
    const button = screen.getByRole("button", { name: "Record qualified review" });
    expect(button).toBeEnabled();
    fireEvent.click(button);

    await waitFor(() => expect(apiAssuranceReview).toHaveBeenCalledTimes(1));
    expect(apiAssuranceReview).toHaveBeenCalledWith({
      evaluationId: "evaluation-1",
      decision: "REJECT",
      rationale: "Evidence does not support the bounded conclusion.",
    });
  });

  it("surfaces API errors and does not render optimistic success", async () => {
    const caseView = view();
    loadMocks(caseView);
    vi.mocked(apiAssuranceGetCase).mockRejectedValueOnce(new ApiError(404, "assurance_resource_not_found"));
    render(<OperatingAssurance principal={contributor} />);
    fireEvent.change(screen.getByLabelText("Operating Assurance case key"), { target: { value: caseView.caseKey } });
    fireEvent.click(screen.getByRole("button", { name: "Load case" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("not visible to this session's organization");
    expect(screen.queryByText(caseView.title)).toBeNull();
  });
});
