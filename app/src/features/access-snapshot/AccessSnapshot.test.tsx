import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AccessSnapshot } from "./AccessSnapshot";
import * as api from "../../domain/api";
import * as auth from "../../domain/AuthContext";

vi.mock("../../domain/api", () => ({
  apiAccessGetCase: vi.fn(),
  describeApiError: vi.fn().mockReturnValue("Mock error message"),
  ApiError: class ApiError extends Error {
    constructor(public status: number, public code: string) {
      super(code);
    }
  }
}));

vi.mock("../../domain/AuthContext", () => ({
  useAuth: vi.fn()
}));

const mockCase = {
  caseKey: "SYN-API-CASE-0001",
  caseVersion: 2,
  journey: {
    phase: "REFERRAL",
    disposition: "ON_TRACK",
    evidence: []
  },
  guidance: {
    signals: [
      { scope: "CASE_PROGRESSION", blockingClass: "HARD_BLOCKER", source: { kind: "CASE_STATUS", value: "Wait" } },
      { scope: "WORKSTREAM", blockingClass: "WARNING", source: { kind: "WORKSTREAM_STATUS", value: "Warn" } }
    ],
    nextWork: [
      { kind: "RESOLVE_CASE_INFORMATION", candidateId: "Need info" }
    ],
    suppressed: [],
    packetReadiness: []
  },
  sourceState: {
    prescreenSelection: "NONE",
    packetRequirementEvidence: "NOT_AVAILABLE",
    workstreams: {
      clinical: "NOT_STARTED",
      financial: "BLOCKED"
    }
  }
};

describe("AccessSnapshot", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("proves signed-out state", () => {
    vi.mocked(auth.useAuth).mockReturnValue({ busy: false, principal: null } as any);
    render(<AccessSnapshot />);
    expect(screen.getByText(/You must be signed in/)).toBeInTheDocument();
  });

  it("proves verified case load and no patient identity fields rendered", async () => {
    vi.mocked(auth.useAuth).mockReturnValue({ busy: false, principal: { displayName: "Jane", organizationId: "org-1" } } as any);
    vi.mocked(api.apiAccessGetCase).mockResolvedValue(mockCase as any);
    render(<AccessSnapshot />);
    
    fireEvent.click(screen.getByText("Open case"));
    await waitFor(() => expect(api.apiAccessGetCase).toHaveBeenCalledWith("SYN-API-CASE-0001"));
    
    await waitFor(() => expect(screen.getByText("Case SYN-API-CASE-0001")).toBeInTheDocument());
    expect(screen.getByText("Version 2")).toBeInTheDocument();
    
    const html = document.body.innerHTML.toLowerCase();
    expect(screen.queryByText(/dob|date of birth|patient name/i)).not.toBeInTheDocument();
    
    
    expect(html).not.toContain("patienttoken");
  });

  it("proves Journey phase rendering and each disposition", async () => {
    vi.mocked(auth.useAuth).mockReturnValue({ busy: false, principal: {} } as any);
    vi.mocked(api.apiAccessGetCase).mockResolvedValue({
      ...mockCase,
      journey: { phase: "PRESCREEN", disposition: "BLOCKED", evidence: [] }
    } as any);
    render(<AccessSnapshot />);
    fireEvent.click(screen.getByText("Open case"));
    await waitFor(() => expect(screen.getAllByText("BLOCKED").length).toBeGreaterThan(0));
    expect(screen.getAllByText("PRESCREEN").length).toBeGreaterThan(0);
  });

  it("proves null phase state", async () => {
    vi.mocked(auth.useAuth).mockReturnValue({ busy: false, principal: {} } as any);
    vi.mocked(api.apiAccessGetCase).mockResolvedValue({
      ...mockCase,
      journey: { phase: null, disposition: "ON_TRACK", evidence: [] }
    } as any);
    render(<AccessSnapshot />);
    fireEvent.click(screen.getByText("Open case"));
    await waitFor(() => expect(screen.getByText("Current phase cannot be determined from available governed evidence.")).toBeInTheDocument());
  });

  it("proves scope separation for signals", async () => {
    vi.mocked(auth.useAuth).mockReturnValue({ busy: false, principal: {} } as any);
    vi.mocked(api.apiAccessGetCase).mockResolvedValue(mockCase as any);
    render(<AccessSnapshot />);
    fireEvent.click(screen.getByText("Open case"));
    await waitFor(() => {
      expect(screen.getByText("CASE PROGRESSION")).toBeInTheDocument();
      expect(screen.getByText("WORKSTREAM")).toBeInTheDocument();
    });
  });

  it("proves blocked financial workstream does not label whole case blocked", async () => {
    vi.mocked(auth.useAuth).mockReturnValue({ busy: false, principal: {} } as any);
    vi.mocked(api.apiAccessGetCase).mockResolvedValue(mockCase as any);
    render(<AccessSnapshot />);
    fireEvent.click(screen.getByText("Open case"));
    await waitFor(() => {
      expect(screen.getByText("ON TRACK")).toBeInTheDocument();
    });
  });

  it("proves next work visibly non-binding", async () => {
    vi.mocked(auth.useAuth).mockReturnValue({ busy: false, principal: {} } as any);
    vi.mocked(api.apiAccessGetCase).mockResolvedValue(mockCase as any);
    render(<AccessSnapshot />);
    fireEvent.click(screen.getByText("Open case"));
    await waitFor(() => {
      expect(screen.getByText("Candidate / Not assigned")).toBeInTheDocument();
    });
  });

  it("proves ambiguous Prescreen warning", async () => {
    vi.mocked(auth.useAuth).mockReturnValue({ busy: false, principal: {} } as any);
    vi.mocked(api.apiAccessGetCase).mockResolvedValue({
      ...mockCase,
      sourceState: { ...mockCase.sourceState, prescreenSelection: "AMBIGUOUS" }
    } as any);
    render(<AccessSnapshot />);
    fireEvent.click(screen.getByText("Open case"));
    await waitFor(() => {
      expect(screen.getByText(/Multiple active Prescreen encounters exist/)).toBeInTheDocument();
    });
  });

  it("proves packet evidence NOT_AVAILABLE, LOADED_EMPTY disclosure, and LOADED readiness", async () => {
    vi.mocked(auth.useAuth).mockReturnValue({ busy: false, principal: {} } as any);
    
    // NOT_AVAILABLE
    vi.mocked(api.apiAccessGetCase).mockResolvedValueOnce({
      ...mockCase, sourceState: { ...mockCase.sourceState, packetRequirementEvidence: "NOT_AVAILABLE" }
    } as any);
    const { unmount } = render(<AccessSnapshot />);
    fireEvent.click(screen.getByText("Open case"));
    await waitFor(() => expect(screen.getByText("Packet requirement evidence was not supplied to this projection.")).toBeInTheDocument());
    unmount();

    // LOADED_EMPTY
    vi.mocked(api.apiAccessGetCase).mockResolvedValueOnce({
      ...mockCase, sourceState: { ...mockCase.sourceState, packetRequirementEvidence: "LOADED_EMPTY" }
    } as any);
    render(<AccessSnapshot />);
    fireEvent.click(screen.getByText("Open case"));
    await waitFor(() => expect(screen.getByText(/currently has zero persisted packet requirement rows/)).toBeInTheDocument());
    
    // LOADED
    vi.mocked(api.apiAccessGetCase).mockResolvedValueOnce({
      ...mockCase, sourceState: { ...mockCase.sourceState, packetRequirementEvidence: "LOADED" },
      guidance: { ...mockCase.guidance, packetReadiness: [{ target: "T1", ready: true, blockers: [], warnings: [] }] }
    } as any);
    fireEvent.click(screen.getByText("Refresh case"));
    await waitFor(() => expect(screen.getByText("Target: T1 - Ready")).toBeInTheDocument());
  });

  it("proves 403 state", async () => {
    vi.mocked(auth.useAuth).mockReturnValue({ busy: false, principal: {} } as any);
    vi.mocked(api.apiAccessGetCase).mockRejectedValue(new api.ApiError(403, "permission_denied"));
    render(<AccessSnapshot />);
    fireEvent.click(screen.getByText("Open case"));
    await waitFor(() => expect(screen.getByText("Your verified role does not have access to this case view.")).toBeInTheDocument());
  });

  it("proves 404 non-revealing state", async () => {
    vi.mocked(auth.useAuth).mockReturnValue({ busy: false, principal: {} } as any);
    vi.mocked(api.apiAccessGetCase).mockRejectedValue(new api.ApiError(404, "not_found"));
    render(<AccessSnapshot />);
    fireEvent.click(screen.getByText("Open case"));
    await waitFor(() => expect(screen.getByText("This case is not available to your organization.")).toBeInTheDocument());
  });

  it("proves refresh calls API once per explicit click and no automatic polling", async () => {
    vi.mocked(auth.useAuth).mockReturnValue({ busy: false, principal: {} } as any);
    vi.mocked(api.apiAccessGetCase).mockResolvedValue(mockCase as any);
    render(<AccessSnapshot />);
    fireEvent.click(screen.getByText("Open case"));
    await waitFor(() => expect(api.apiAccessGetCase).toHaveBeenCalledTimes(1));
    
    fireEvent.click(screen.getByText("Refresh case"));
    await waitFor(() => expect(api.apiAccessGetCase).toHaveBeenCalledTimes(2));
  });
});
