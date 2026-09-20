import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  AccessCaseReadModel,
  GuidanceSignal,
  JourneyDisposition,
  NextWorkCandidate,
  PacketReadinessResult,
  WorkstreamStatuses,
} from "@clarity/domain-contracts";
import { ApiError, apiAccessGetCase, type VerifiedPrincipal } from "../../domain/api";
import { useAuth } from "../../domain/AuthContext";
import { AccessSnapshot } from "./AccessSnapshot";

// The real describeApiError and ApiError are kept on purpose: the 403/404 tests must
// prove what a user actually reads, not what a mock claims.
vi.mock("../../domain/api", async () => {
  const actual = await vi.importActual<typeof import("../../domain/api")>("../../domain/api");
  return { ...actual, apiAccessGetCase: vi.fn() };
});
vi.mock("../../domain/AuthContext", () => ({ useAuth: vi.fn() }));

type AuthValue = ReturnType<typeof useAuth>;

const intake: VerifiedPrincipal = {
  userId: "synthetic-user-api-intake",
  organizationId: "synthetic-org-api-dev",
  displayName: "Synthetic Intake Coordinator",
  roles: ["INTAKE_COORDINATOR"],
  sessionId: "session-intake",
  expiresAt: "2099-01-01T00:00:00Z",
};

const physician: VerifiedPrincipal = {
  userId: "synthetic-user-api-physician",
  organizationId: "synthetic-org-api-dev",
  displayName: "Synthetic Physician Reviewer",
  roles: ["PHYSICIAN_REVIEWER"],
  sessionId: "session-physician",
  expiresAt: "2099-01-01T00:00:00Z",
};

function authAs(principal: VerifiedPrincipal | null, busy = false): void {
  const value: AuthValue = {
    principal,
    busy,
    error: null,
    login: vi.fn<AuthValue["login"]>(),
    logout: vi.fn<AuthValue["logout"]>(),
  };
  vi.mocked(useAuth).mockReturnValue(value);
}

const ALL_NOT_STARTED: WorkstreamStatuses = {
  clinical: "NOT_STARTED",
  legalReview: "NOT_STARTED",
  medicalScreening: "NOT_STARTED",
  benefits: "NOT_STARTED",
  authorization: "NOT_STARTED",
  placement: "NOT_STARTED",
  transportation: "NOT_STARTED",
  patientEducation: "NOT_STARTED",
};

let sequence = 0;

const signal = (partial: Omit<GuidanceSignal, "signalId">): GuidanceSignal => ({
  // Shaped like the real composite ids so a leak into the UI would be caught.
  signalId: JSON.stringify([partial.scope, partial.source.kind, ++sequence]),
  ...partial,
});

const candidate = (
  partial: Omit<NextWorkCandidate, "candidateId" | "nonBinding" | "signalIds">,
): NextWorkCandidate => ({
  candidateId: JSON.stringify(["CANDIDATE", partial.kind, ++sequence]),
  nonBinding: true,
  signalIds: [],
  ...partial,
});

function readModel(
  overrides: {
    journey?: AccessCaseReadModel["journey"];
    guidance?: Partial<AccessCaseReadModel["guidance"]>;
    sourceState?: Partial<AccessCaseReadModel["sourceState"]>;
    caseVersion?: number;
  } = {},
): AccessCaseReadModel {
  return {
    caseKey: "SYN-API-CASE-0001",
    caseVersion: overrides.caseVersion ?? 2,
    journey: overrides.journey ?? {
      phase: "PRESCREEN",
      disposition: "ON_TRACK",
      evidence: [{ source: "CASE_STATUS", sourceValue: "INTAKE_IN_PROGRESS", supportsPhase: "PRESCREEN" }],
    },
    guidance: { signals: [], packetReadiness: null, nextWork: [], suppressed: [], ...overrides.guidance },
    sourceState: {
      caseStatus: "INTAKE_IN_PROGRESS",
      urgency: "ROUTINE",
      workstreams: ALL_NOT_STARTED,
      prescreenSelection: "NONE",
      packetRequirementEvidence: "NOT_AVAILABLE",
      episodeRelationships: [],
      ...overrides.sourceState,
    },
  };
}

/** Sign in, open the default case, and wait for it to render. */
async function openCase(model: AccessCaseReadModel = readModel(), principal: VerifiedPrincipal = intake) {
  authAs(principal);
  vi.mocked(apiAccessGetCase).mockResolvedValue(model);
  const user = userEvent.setup();
  const view = render(<AccessSnapshot />);
  await user.click(screen.getByRole("button", { name: "Open case" }));
  await screen.findByText(`Case ${model.caseKey}`);
  return { user, ...view };
}

const region = (name: string) => within(screen.getByRole("region", { name }));

/**
 * All rendered text, one text node per entry. `textContent` concatenates adjacent
 * elements with no separator ("Waiting externally" + "FACILITY_..." -> "...externallyFACILITY_..."),
 * which hides a raw token from a word-boundary match; joining with spaces does not.
 */
function pageText(): string {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const parts: string[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) parts.push(node.textContent ?? "");
  return parts.join(" ");
}

/** Anything shaped like ENUM_VALUE that reached the page was not translated for the user. */
const RAW_ENUM_TOKEN = /\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b/;

beforeEach(() => {
  vi.resetAllMocks();
});

describe("AccessSnapshot — signed out and signing in", () => {
  it("keeps the workspace title, offers the shared dev sign-in, and requests nothing", () => {
    authAs(null);
    render(<AccessSnapshot />);

    expect(screen.getByRole("heading", { name: "Case Status" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Authentication required" })).toBeInTheDocument();
    expect(screen.getByText("Sign in to view governed case status.")).toBeInTheDocument();
    expect(screen.getByLabelText("Development assertion")).toHaveValue("syn-assert-api-intake-dev");
    expect(screen.getByText("Development-only synthetic assertion.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open case" })).not.toBeInTheDocument();
    expect(apiAccessGetCase).not.toHaveBeenCalled();
  });

  it("shows a signing-in state while the session is being established", () => {
    authAs(null, true);
    render(<AccessSnapshot />);

    expect(screen.getByText("Signing in…")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open case" })).not.toBeInTheDocument();
  });
});

describe("AccessSnapshot — loading a case", () => {
  it("names the verified session and requests the default synthetic case once", async () => {
    authAs(intake);
    render(<AccessSnapshot />);
    expect(screen.getByText("Verified session Synthetic Intake Coordinator (synthetic-org-api-dev)")).toBeInTheDocument();
    expect(screen.queryByText(/case-detail access is audited/)).not.toBeInTheDocument();

    vi.mocked(apiAccessGetCase).mockResolvedValue(readModel());
    await userEvent.click(screen.getByRole("button", { name: "Open case" }));

    expect(await screen.findByText("Case SYN-API-CASE-0001")).toBeInTheDocument();
    expect(screen.getByText("Version 2")).toBeInTheDocument();
    expect(screen.getByText("Verified case state")).toBeInTheDocument();
    expect(screen.getByText(/case-detail access is audited/)).toBeInTheDocument();
    expect(apiAccessGetCase).toHaveBeenCalledExactlyOnceWith("SYN-API-CASE-0001");
  });

  it("trims the key and submits on Enter", async () => {
    authAs(intake);
    vi.mocked(apiAccessGetCase).mockResolvedValue(readModel());
    const user = userEvent.setup();
    render(<AccessSnapshot />);

    const input = screen.getByLabelText("Case key");
    await user.clear(input);
    await user.type(input, "  SYN-API-CASE-0009  {Enter}");

    expect(apiAccessGetCase).toHaveBeenCalledExactlyOnceWith("SYN-API-CASE-0009");
  });

  it("does not allow an empty key to be requested", async () => {
    authAs(intake);
    const user = userEvent.setup();
    render(<AccessSnapshot />);

    await user.clear(screen.getByLabelText("Case key"));

    expect(screen.getByRole("button", { name: "Open case" })).toBeDisabled();
    expect(apiAccessGetCase).not.toHaveBeenCalled();
  });

  it("renders no patient identity and none of the contract's internal ids", async () => {
    await openCase(
      readModel({
        guidance: {
          signals: [
            signal({
              scope: "CASE_PROGRESSION",
              blockingClass: "HARD_BLOCKER",
              source: { kind: "CASE_STATUS", value: "INFORMATION_INCOMPLETE" },
            }),
          ],
          nextWork: [candidate({ kind: "RESOLVE_CASE_INFORMATION", scope: "CASE_PROGRESSION" })],
        },
      }),
    );

    const text = pageText();
    expect(text).not.toMatch(/date of birth|\bdob\b|patient name|\bmrn\b|\bssn\b/i);
    expect(text).not.toContain("CANDIDATE");
    expect(text).not.toContain("CASE_PROGRESSION");
  });

  it("never shows a raw enum value anywhere on a fully populated snapshot", async () => {
    const readiness: PacketReadinessResult[] = [
      {
        target: "FACILITY_ROUTING",
        ready: false,
        blockers: [
          {
            requirementCode: "PSYCH_EVAL",
            label: "Psychiatric evaluation",
            state: "MISSING",
            responsibleRoleCode: "INTAKE_COORDINATOR",
            resolutionWorkspace: "prescreen",
            sourceRuleId: "synthetic-rule-1",
            sourceRuleVersion: 1,
          },
        ],
        warnings: [],
      },
    ];
    await openCase(
      readModel({
        journey: {
          phase: "FACILITY_REVIEW",
          disposition: "ON_TRACK",
          evidence: [
            { source: "CASE_STATUS", sourceValue: "FACILITY_RESPONSE_PENDING", supportsPhase: "FACILITY_REVIEW" },
            { source: "PRESCREEN_STATUS", sourceValue: "FACILITY_ROUTING", supportsPhase: "FACILITY_REVIEW" },
            { source: "EPISODE_LINK", sourceValue: "ADMISSION_SOURCE", supportsPhase: "ADMISSION" },
          ],
        },
        guidance: {
          packetReadiness: readiness,
          signals: [
            signal({
              scope: "CASE_PROGRESSION",
              blockingClass: "EXTERNAL_WAIT",
              source: { kind: "CASE_STATUS", value: "FACILITY_RESPONSE_PENDING" },
            }),
            signal({
              scope: "PRESCREEN",
              blockingClass: "HARD_BLOCKER",
              source: { kind: "PRESCREEN_STATUS", value: "NEEDS_INFORMATION" },
            }),
            signal({
              scope: "PRESCREEN_TARGET",
              blockingClass: "HARD_BLOCKER",
              target: "FACILITY_ROUTING",
              source: {
                kind: "PACKET_REQUIREMENT",
                value: "MISSING",
                requirementCode: "PSYCH_EVAL",
                sourceRuleId: "synthetic-rule-1",
                sourceRuleVersion: 1,
              },
            }),
            signal({
              scope: "WORKSTREAM",
              blockingClass: "REVIEW_GATE",
              workstream: "medicalScreening",
              source: { kind: "WORKSTREAM_STATUS", value: "PENDING_REVIEW" },
            }),
            signal({
              scope: "WORKSTREAM",
              blockingClass: "SATISFIED",
              workstream: "legalReview",
              source: { kind: "WORKSTREAM_STATUS", value: "COMPLETE" },
            }),
          ],
          nextWork: [
            candidate({ kind: "RESOLVE_PACKET_REQUIREMENT", scope: "PRESCREEN_TARGET", requirementCode: "PSYCH_EVAL" }),
            candidate({ kind: "REVIEW_WORKSTREAM", scope: "WORKSTREAM", workstream: "medicalScreening" }),
          ],
          suppressed: [
            { kind: "RESOLVE_WORKSTREAM_BLOCK", signalId: '["WORKSTREAM","x"]', reason: "CASE_TERMINAL" },
            { kind: "RESOLVE_PACKET_REQUIREMENT", signalId: '["PRESCREEN_TARGET","y"]', reason: "PRESCREEN_TERMINAL" },
          ],
        },
        sourceState: {
          caseStatus: "FACILITY_RESPONSE_PENDING",
          urgency: "URGENT",
          workstreams: { ...ALL_NOT_STARTED, medicalScreening: "PENDING_REVIEW", legalReview: "COMPLETE", benefits: "BLOCKED" },
          prescreenSelection: "SELECTED",
          prescreen: { status: "FACILITY_ROUTING", version: 4 },
          packetRequirementEvidence: "LOADED",
          episodeRelationships: ["ADMISSION_SOURCE"],
        },
      }),
    );

    expect(pageText()).not.toMatch(RAW_ENUM_TOKEN);
  });
});

describe("AccessSnapshot — journey position", () => {
  it.each<[JourneyDisposition, string]>([
    ["ON_TRACK", "On track"],
    ["BLOCKED", "Blocked"],
    ["DIVERTED", "Diverted"],
    ["EXCEPTION", "Exception"],
    ["CLOSED", "Closed"],
  ])("shows the %s disposition as %s", async (disposition, expected) => {
    await openCase(readModel({ journey: { phase: "PRESCREEN", disposition, evidence: [] } }));

    const journey = region("Where this case is");
    expect(journey.getByText(expected)).toBeInTheDocument();
    expect(journey.getAllByText("Prescreen").length).toBeGreaterThan(0);
  });

  it("orders the rail, marks the current phase, and dims the phases already passed", async () => {
    await openCase(readModel({ journey: { phase: "QUALIFIED_REVIEW", disposition: "ON_TRACK", evidence: [] } }));

    const items = within(screen.getByRole("list", { name: "Journey phases" })).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "Referral",
      "Prescreen",
      "Qualified review",
      "Facility review",
      "Pre-admission",
      "Transfer / handoff",
      "Admission",
    ]);
    expect(items[2]).toHaveAttribute("aria-current", "step");
    expect(items[2]).toHaveClass("active");
    expect(items[0]).toHaveClass("preceding");
    expect(items[1]).toHaveClass("preceding");
    for (const later of items.slice(3)) {
      expect(later).not.toHaveClass("active");
      expect(later).not.toHaveClass("preceding");
      expect(later).not.toHaveAttribute("aria-current");
    }
  });

  it("does not fabricate a phase when the contract reports none, but still shows the disposition", async () => {
    await openCase(readModel({ journey: { phase: null, disposition: "DIVERTED", evidence: [] } }));

    const journey = region("Where this case is");
    expect(journey.getByText("Current phase cannot be determined from the available case evidence.")).toBeInTheDocument();
    expect(journey.getByText("Diverted")).toBeInTheDocument();
    expect(journey.queryByText("Why am I seeing this?")).not.toBeInTheDocument();
    for (const item of within(screen.getByRole("list", { name: "Journey phases" })).getAllByRole("listitem")) {
      expect(item).not.toHaveAttribute("aria-current");
    }
  });

  it("explains the phase in plain language, including legacy compatibility", async () => {
    await openCase(
      readModel({
        journey: {
          phase: "QUALIFIED_REVIEW",
          disposition: "ON_TRACK",
          evidence: [
            { source: "CASE_STATUS", sourceValue: "CLINICAL_REVIEW", supportsPhase: "QUALIFIED_REVIEW", legacyCompatibility: true },
            { source: "PRESCREEN_STATUS", sourceValue: "AUTHORIZED_REVIEW", supportsPhase: "QUALIFIED_REVIEW" },
          ],
        },
      }),
    );

    expect(screen.getByText("Case status: Clinical review — supports Qualified review (legacy compatibility)")).toBeInTheDocument();
    expect(screen.getByText("Prescreen status: Authorized review — supports Qualified review")).toBeInTheDocument();
  });

  it("says where the Admission phase comes from", async () => {
    await openCase(
      readModel({
        journey: {
          phase: "ADMISSION",
          disposition: "ON_TRACK",
          evidence: [{ source: "EPISODE_LINK", sourceValue: "ADMISSION_SOURCE", supportsPhase: "ADMISSION" }],
        },
      }),
    );

    expect(screen.getByText("Admission is shown because this case is linked to a recorded admission episode.")).toBeInTheDocument();
    expect(screen.getByText("Episode link: Admission source — supports Admission")).toBeInTheDocument();
  });
});

describe("AccessSnapshot — what needs attention", () => {
  const signals: GuidanceSignal[] = [
    signal({
      scope: "CASE_PROGRESSION",
      blockingClass: "HARD_BLOCKER",
      source: { kind: "CASE_STATUS", value: "INFORMATION_INCOMPLETE" },
    }),
    signal({
      scope: "PRESCREEN",
      blockingClass: "HARD_BLOCKER",
      source: { kind: "PRESCREEN_STATUS", value: "NEEDS_INFORMATION" },
    }),
    signal({
      scope: "PRESCREEN_TARGET",
      blockingClass: "HARD_BLOCKER",
      target: "FACILITY_ROUTING",
      source: {
        kind: "PACKET_REQUIREMENT",
        value: "MISSING",
        requirementCode: "PSYCH_EVAL",
        sourceRuleId: "synthetic-rule-1",
        sourceRuleVersion: 1,
      },
    }),
    signal({
      scope: "WORKSTREAM",
      blockingClass: "HARD_BLOCKER",
      workstream: "benefits",
      source: { kind: "WORKSTREAM_STATUS", value: "BLOCKED" },
    }),
    signal({
      scope: "WORKSTREAM",
      blockingClass: "REVIEW_GATE",
      workstream: "clinical",
      source: { kind: "WORKSTREAM_STATUS", value: "PENDING_REVIEW" },
    }),
    signal({
      scope: "CASE_PROGRESSION",
      blockingClass: "EXTERNAL_WAIT",
      source: { kind: "CASE_STATUS", value: "FACILITY_RESPONSE_PENDING" },
    }),
  ];

  const readiness: PacketReadinessResult[] = [
    {
      target: "FACILITY_ROUTING",
      ready: false,
      blockers: [
        {
          requirementCode: "PSYCH_EVAL",
          label: "Psychiatric evaluation",
          state: "MISSING",
          resolutionWorkspace: "prescreen",
          sourceRuleId: "synthetic-rule-1",
          sourceRuleVersion: 1,
        },
      ],
      warnings: [],
    },
  ];

  it("groups signals by scope and describes each recorded fact in words", async () => {
    await openCase(readModel({ guidance: { signals, packetReadiness: readiness } }));

    const attention = region("What needs attention");
    for (const title of ["Case progression", "Intake", "Packet readiness", "Workstreams"]) {
      expect(attention.getByRole("heading", { name: title })).toBeInTheDocument();
    }
    expect(attention.getByText("Information incomplete")).toBeInTheDocument();
    expect(attention.getByText("Needs information")).toBeInTheDocument();
    expect(attention.getByText("Facility response pending")).toBeInTheDocument();
    expect(attention.getByText("Facility routing · Psychiatric evaluation — Missing")).toBeInTheDocument();
    expect(attention.getByText("Benefits — Blocked")).toBeInTheDocument();
    expect(attention.getByText("Clinical — Pending review")).toBeInTheDocument();
  });

  it("falls back to the requirement code when no readiness label is available", async () => {
    await openCase(readModel({ guidance: { signals, packetReadiness: null } }));

    expect(region("What needs attention").getByText("Facility routing · PSYCH_EVAL — Missing")).toBeInTheDocument();
  });

  it("colors each badge by blocking class, not by whether it is a hard blocker", async () => {
    await openCase(readModel({ guidance: { signals, packetReadiness: readiness } }));

    const attention = region("What needs attention");
    expect(attention.getAllByText("Blocked")[0]).toHaveClass("badge-danger");
    expect(attention.getByText("Review needed")).toHaveClass("badge-warn");
    expect(attention.getByText("Waiting externally")).toHaveClass("badge-info");
  });

  it("keeps satisfied and not-applicable signals out of the attention list", async () => {
    await openCase(
      readModel({
        guidance: {
          signals: [
            signal({
              scope: "WORKSTREAM",
              blockingClass: "HARD_BLOCKER",
              workstream: "benefits",
              source: { kind: "WORKSTREAM_STATUS", value: "BLOCKED" },
            }),
            signal({
              scope: "WORKSTREAM",
              blockingClass: "SATISFIED",
              workstream: "clinical",
              source: { kind: "WORKSTREAM_STATUS", value: "READY" },
            }),
            signal({
              scope: "WORKSTREAM",
              blockingClass: "NOT_APPLICABLE",
              workstream: "transportation",
              source: { kind: "WORKSTREAM_STATUS", value: "NOT_APPLICABLE" },
            }),
          ],
        },
      }),
    );

    const attention = region("What needs attention");
    const groups = attention.getByText("Benefits — Blocked").closest(".signals-grouped");
    expect(groups).not.toBeNull();
    expect(within(groups as HTMLElement).queryByText("Clinical — Ready")).not.toBeInTheDocument();
    expect(within(groups as HTMLElement).queryByText("Transportation — Not applicable")).not.toBeInTheDocument();

    const recorded = attention.getByText("Satisfied or not applicable (2)").closest("details");
    expect(recorded).not.toBeNull();
    expect(within(recorded as HTMLElement).getByText("Clinical — Ready")).toBeInTheDocument();
    expect(within(recorded as HTMLElement).getByText("Transportation — Not applicable")).toBeInTheDocument();
    expect(within(recorded as HTMLElement).getByText("Satisfied")).toHaveClass("badge-good");
  });

  it("does not present an empty attention list as a clearance", async () => {
    await openCase(readModel());

    const attention = region("What needs attention");
    expect(attention.getByRole("heading", { name: "Nothing flagged" })).toBeInTheDocument();
    expect(attention.getByText(/This is not a clearance\./)).toBeInTheDocument();
    expect(attention.queryByText(/all clear/i)).not.toBeInTheDocument();
  });

  it("does not call the whole journey blocked because one workstream is", async () => {
    await openCase(
      readModel({
        journey: { phase: "PRESCREEN", disposition: "ON_TRACK", evidence: [] },
        guidance: {
          signals: [
            signal({
              scope: "WORKSTREAM",
              blockingClass: "HARD_BLOCKER",
              workstream: "benefits",
              source: { kind: "WORKSTREAM_STATUS", value: "BLOCKED" },
            }),
          ],
        },
        sourceState: { workstreams: { ...ALL_NOT_STARTED, benefits: "BLOCKED" } },
      }),
    );

    const journey = region("Where this case is");
    expect(journey.getByText("On track")).toBeInTheDocument();
    expect(journey.queryByText("Blocked")).not.toBeInTheDocument();

    const lanes = region("Workstreams");
    expect(lanes.getByText("A blocked lane does not necessarily mean the patient journey is blocked.")).toBeInTheDocument();
    expect(lanes.getByText("Benefits").parentElement).toHaveTextContent("Blocked");
  });
});

describe("AccessSnapshot — candidate next work", () => {
  it("labels every candidate as non-binding and never implies an assignment", async () => {
    await openCase(
      readModel({
        guidance: {
          nextWork: [
            candidate({ kind: "RESOLVE_CASE_INFORMATION", scope: "CASE_PROGRESSION" }),
            candidate({ kind: "REVIEW_WORKSTREAM", scope: "WORKSTREAM", workstream: "clinical" }),
            candidate({
              kind: "RESOLVE_PACKET_REQUIREMENT",
              scope: "PRESCREEN_TARGET",
              requirementCode: "PSYCH_EVAL",
              responsibleRoleCode: "INTAKE_COORDINATOR",
              resolutionWorkspace: "prescreen",
            }),
          ],
          packetReadiness: [
            {
              target: "FACILITY_ROUTING",
              ready: false,
              blockers: [
                {
                  requirementCode: "PSYCH_EVAL",
                  label: "Psychiatric evaluation",
                  state: "MISSING",
                  resolutionWorkspace: "prescreen",
                  sourceRuleId: "synthetic-rule-1",
                  sourceRuleVersion: 1,
                },
              ],
              warnings: [],
            },
          ],
        },
      }),
    );

    const work = region("Suggested next steps");
    expect(work.getAllByText("Not assigned")).toHaveLength(3);
    expect(work.getByText("Resolve case information")).toBeInTheDocument();
    expect(work.getByText("Review workstream")).toBeInTheDocument();
    expect(work.getByText("Clinical")).toBeInTheDocument();
    expect(work.getByText("Psychiatric evaluation")).toBeInTheDocument();

    // The candidate carries a responsible role from its source requirement; showing it
    // would read as an assignment, which this view must not make.
    expect(pageText()).not.toContain("INTAKE_COORDINATOR");
    expect(work.queryByText(/assigned to|responsible/i)).not.toBeInTheDocument();
  });

  it("says so when there is no candidate work", async () => {
    await openCase(readModel());

    expect(region("Suggested next steps").getByRole("heading", { name: "No next work" })).toBeInTheDocument();
  });

  it("explains suppressed work in plain language", async () => {
    await openCase(
      readModel({
        guidance: {
          suppressed: [
            { kind: "RESOLVE_WORKSTREAM_BLOCK", signalId: '["WORKSTREAM","a"]', reason: "CASE_TERMINAL" },
            { kind: "RESOLVE_PACKET_REQUIREMENT", signalId: '["PRESCREEN_TARGET","b"]', reason: "PRESCREEN_TERMINAL" },
          ],
        },
      }),
    );

    const work = region("Suggested next steps");
    expect(work.getByText("Work not currently actionable")).toBeInTheDocument();
    expect(work.getByText("Resolve workstream block — The case is in a terminal status")).toBeInTheDocument();
    expect(work.getByText("Resolve packet requirement — The Prescreen encounter is in a terminal status")).toBeInTheDocument();
  });
});

describe("AccessSnapshot — workstreams", () => {
  it("lists all eight lanes in contract order with human status labels", async () => {
    await openCase(
      readModel({
        sourceState: {
          workstreams: {
            clinical: "IN_PROGRESS",
            legalReview: "PENDING_REVIEW",
            medicalScreening: "READY",
            benefits: "BLOCKED",
            authorization: "NOT_STARTED",
            placement: "COMPLETE",
            transportation: "NOT_APPLICABLE",
            patientEducation: "NOT_STARTED",
          },
        },
      }),
    );

    const rows = region("Workstreams")
      .getAllByText(/^(Clinical|Legal review|Medical screening|Benefits|Authorization|Placement|Transportation|Patient education)$/)
      .map((node) => node.parentElement?.textContent);
    expect(rows).toEqual([
      "ClinicalIn progress",
      "Legal reviewPending review",
      "Medical screeningReady",
      "BenefitsBlocked",
      "AuthorizationNot started",
      "PlacementComplete",
      "TransportationNot applicable",
      "Patient educationNot started",
    ]);
  });
});

describe("AccessSnapshot — Intake status", () => {
  it("says so when no active encounter is selected", async () => {
    await openCase(readModel());

    expect(region("Intake status").getByText("No active intake review is selected from governed data.")).toBeInTheDocument();
  });

  it("shows the selected encounter's status and version", async () => {
    await openCase(
      readModel({ sourceState: { prescreenSelection: "SELECTED", prescreen: { status: "CENTRAL_INTAKE_REVIEW", version: 3 } } }),
    );

    const prescreen = region("Intake status");
    expect(prescreen.getByText("Status: Central intake review")).toBeInTheDocument();
    expect(prescreen.getByText("Version: 3")).toBeInTheDocument();
  });

  it("warns instead of guessing when more than one encounter is active", async () => {
    await openCase(readModel({ sourceState: { prescreenSelection: "AMBIGUOUS" } }));

    const warning = screen.getByRole("alert");
    expect(warning).toHaveTextContent("Multiple active intake reviews exist.");
    expect(warning).toHaveTextContent("Do not guess which review is current.");
    expect(region("Intake status").queryByText(/^Status:/)).not.toBeInTheDocument();
  });

  it("distinguishes packet evidence that was not supplied from evidence that is empty", async () => {
    const { unmount } = await openCase(readModel({ sourceState: { packetRequirementEvidence: "NOT_AVAILABLE" } }));
    expect(screen.getByText("Packet requirement data is not available for this view.")).toBeInTheDocument();
    unmount();

    await openCase(readModel({ sourceState: { packetRequirementEvidence: "LOADED_EMPTY" } }));
    expect(screen.getByText(/currently has no configured packet requirements/)).toBeInTheDocument();
    expect(screen.getByText("This does not mean the real-world packet is complete.")).toBeInTheDocument();
  });

  it("shows per-target readiness when packet evidence is loaded", async () => {
    await openCase(
      readModel({
        sourceState: { packetRequirementEvidence: "LOADED" },
        guidance: {
          packetReadiness: [
            { target: "CENTRAL_INTAKE_REVIEW", ready: true, blockers: [], warnings: [] },
            {
              target: "FACILITY_ROUTING",
              ready: false,
              blockers: [
                {
                  requirementCode: "PSYCH_EVAL",
                  label: "Psychiatric evaluation",
                  state: "MISSING",
                  resolutionWorkspace: "prescreen",
                  sourceRuleId: "synthetic-rule-1",
                  sourceRuleVersion: 1,
                },
              ],
              warnings: [],
            },
          ],
        },
      }),
    );

    const prescreen = region("Intake status");
    const ready = prescreen.getByText("Central intake review").parentElement;
    expect(ready).toHaveTextContent("Ready");
    expect(ready).toHaveTextContent("0 blocking, 0 warning");
    const notReady = prescreen.getByText("Facility routing").parentElement;
    expect(notReady).toHaveTextContent("Not ready");
    expect(notReady).toHaveTextContent("1 blocking, 0 warning");
  });
});

describe("AccessSnapshot — errors", () => {
  async function failWith(error: ApiError) {
    authAs(intake);
    vi.mocked(apiAccessGetCase).mockRejectedValue(error);
    const user = userEvent.setup();
    render(<AccessSnapshot />);
    await user.click(screen.getByRole("button", { name: "Open case" }));
    return await screen.findByRole("alert");
  }

  it("explains a 403 without showing any case", async () => {
    const alert = await failWith(new ApiError(403, "permission_denied"));

    expect(alert).toHaveTextContent("Case could not be loaded");
    expect(alert).toHaveTextContent("The verified session is not permitted to perform this action.");
    expect(screen.queryByText(/^Case SYN/)).not.toBeInTheDocument();
  });

  it("explains a 404 without confirming whether the case exists elsewhere", async () => {
    const alert = await failWith(new ApiError(404, "case_not_found"));

    expect(alert).toHaveTextContent("The requested resource is not visible to this session's organization.");
    expect(alert).not.toHaveTextContent("SYN-API-CASE-0001");
    expect(screen.queryByText(/^Case SYN/)).not.toBeInTheDocument();
  });

  it("tells the user how to start the API when it is unreachable", async () => {
    const alert = await failWith(new ApiError(0, "api_unreachable"));

    expect(alert).toHaveTextContent("npm run api:dev");
  });

  it("fails closed: a failed refresh removes the previous case rather than showing it beside the error", async () => {
    const { user } = await openCase();
    expect(screen.getByText("Case SYN-API-CASE-0001")).toBeInTheDocument();

    vi.mocked(apiAccessGetCase).mockRejectedValue(new ApiError(403, "permission_denied"));
    await user.click(screen.getByRole("button", { name: "Refresh case" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("not permitted");
    expect(screen.queryByText("Case SYN-API-CASE-0001")).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Where this case is" })).not.toBeInTheDocument();
  });
});

describe("AccessSnapshot — refresh and freshness", () => {
  it("refreshes the case on screen even after the key field has been edited", async () => {
    const { user } = await openCase();
    const input = screen.getByLabelText("Case key");
    await user.clear(input);
    await user.type(input, "SYN-API-CASE-9999");

    await user.click(screen.getByRole("button", { name: "Refresh case" }));

    expect(apiAccessGetCase).toHaveBeenCalledTimes(2);
    expect(apiAccessGetCase).toHaveBeenLastCalledWith("SYN-API-CASE-0001");
  });

  it("loads once per explicit action and never polls", async () => {
    await openCase();
    expect(apiAccessGetCase).toHaveBeenCalledTimes(1);

    vi.useFakeTimers();
    try {
      await vi.advanceTimersByTimeAsync(30 * 60 * 1000);
    } finally {
      vi.useRealTimers();
    }

    expect(apiAccessGetCase).toHaveBeenCalledTimes(1);
  });
});

describe("AccessSnapshot — session isolation", () => {
  it("does not show one session's case to the next session", async () => {
    const { rerender } = await openCase(readModel(), intake);
    expect(screen.getByText("Case SYN-API-CASE-0001")).toBeInTheDocument();
    const callsBefore = vi.mocked(apiAccessGetCase).mock.calls.length;

    authAs(physician);
    rerender(<AccessSnapshot />);

    expect(screen.queryByText("Case SYN-API-CASE-0001")).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Where this case is" })).not.toBeInTheDocument();
    expect(screen.getByText("Verified session Synthetic Physician Reviewer (synthetic-org-api-dev)")).toBeInTheDocument();
    expect(apiAccessGetCase).toHaveBeenCalledTimes(callsBefore);
  });

  it("drops the case and the lookup when the session ends", async () => {
    const { rerender } = await openCase();

    authAs(null);
    rerender(<AccessSnapshot />);

    expect(screen.queryByText("Case SYN-API-CASE-0001")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open case" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Authentication required" })).toBeInTheDocument();
  });
});
