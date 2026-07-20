import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DefaultNetworkReviewApiClient } from "../domain/networkReviewApi";
import { getSyntheticEnrichmentPackages } from "../domain/enrichmentFixtures";
import { NetworkReviewWorkspace } from "./NetworkReviewWorkspace";

describe("NetworkReviewWorkspace", () => {
  it("renders tabular queue with synthetic packages and filters by search query", async () => {
    render(<NetworkReviewWorkspace />);
    expect(screen.getByText("Network Enrichment Review Workspace")).toBeInTheDocument();
    expect(screen.getByText("St. Jude Behavioral Health Center")).toBeInTheDocument();
    expect(screen.getByText("Acadiana Recovery Center")).toBeInTheDocument();
    expect(screen.getByText("Cajun Coast Crisis Stabilization")).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/Search by candidate facility/i);
    fireEvent.change(searchInput, { target: { value: "St. Jude" } });

    expect(screen.getByText("St. Jude Behavioral Health Center")).toBeInTheDocument();
    expect(screen.queryByText("Acadiana Recovery Center")).not.toBeInTheDocument();
  });

  it("navigates into package detail and displays canonical vs candidate field comparison with diffs", async () => {
    const user = userEvent.setup();
    render(<NetworkReviewWorkspace />);

    const reviewButtons = screen.getAllByRole("button", { name: /Review Package/i });
    await user.click(reviewButtons[0]);

    expect(screen.getByText("St. Jude Behavioral Health Center")).toBeInTheDocument();
    expect(screen.getByText("facility.contact.phone")).toBeInTheDocument();
    expect(screen.getByText("clinical.inpatientDetoxAvailable")).toBeInTheDocument();
    expect(screen.getByText("legal.opcAcceptance")).toBeInTheDocument();
  });

  it("enforces role gating for clinical and legal field decisions when user lacks required authority", async () => {
    const user = userEvent.setup();
    // User with only FACILITY_REVIEWER role
    render(<NetworkReviewWorkspace userRoles={["FACILITY_REVIEWER"]} />);

    const reviewButtons = screen.getAllByRole("button", { name: /Review Package/i });
    await user.click(reviewButtons[0]);

    // Ops field (phone) has Approve button enabled
    expect(screen.getByRole("button", { name: /Approve facility.contact.phone/i })).toBeEnabled();

    // Clinical field (inpatientDetoxAvailable) requires CLINICAL_REVIEWER -> should show Authority lock message
    expect(screen.getByText(/Requires CLINICAL_REVIEWER \/ PHYSICIAN_REVIEWER Authority/i)).toBeInTheDocument();
  });

  it("opens Evidence Drawer on Info button click and displays extracted source evidence", async () => {
    const user = userEvent.setup();
    render(<NetworkReviewWorkspace />);

    const reviewButtons = screen.getAllByRole("button", { name: /Review Package/i });
    await user.click(reviewButtons[0]);

    const evidenceButtons = screen.getAllByRole("button", { name: /Evidence/i });
    await user.click(evidenceButtons[0]);

    expect(screen.getByText("Field Evidence & Authority Trace")).toBeInTheDocument();
    expect(screen.getByText("DIRECT_DIRECTORY_EXTRACT")).toBeInTheDocument();
  });

  it("stages decisions and submits package decisions to update package state", async () => {
    const user = userEvent.setup();
    render(<NetworkReviewWorkspace userRoles={["FACILITY_REVIEWER", "COMPLIANCE_REVIEWER", "CLINICAL_REVIEWER", "LEGAL_REVIEWER"]} />);

    const reviewButtons = screen.getAllByRole("button", { name: /Review Package/i });
    await user.click(reviewButtons[0]);

    const approvePhoneButton = screen.getByRole("button", { name: /Approve facility.contact.phone/i });
    await user.click(approvePhoneButton);

    expect(screen.getByText(/1 decisions staged/i)).toBeInTheDocument();
    const submitButton = screen.getByRole("button", { name: /Submit Package Decisions/i });
    await user.click(submitButton);

    expect(screen.queryByText(/decisions staged/i)).not.toBeInTheDocument();
  });

  it("loads packages from the API client path when initial packages are provided as empty", async () => {
    const synthetic = getSyntheticEnrichmentPackages();
    const apiPackages = [
      {
        ...synthetic[0],
        packageRecord: {
          ...synthetic[0].packageRecord,
          reviewPackageId: "pkg-api-smoke-01",
          sourceCandidateId: "candidate-api-smoke",
        },
        canonicalData: {
          ...synthetic[0].canonicalData,
          entityName: "API Smoke Candidate",
        },
      },
    ];

    const fetchSpy = vi.spyOn(window, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(apiPackages),
    } as unknown as Response);
    try {
      render(
        <NetworkReviewWorkspace
          apiClient={new DefaultNetworkReviewApiClient("/api/network-enrichment/synthetic")}
          initialPackages={[]}
        />,
      );

      expect(screen.queryByText("API Smoke Candidate")).not.toBeInTheDocument();
      expect(await screen.findByText("API Smoke Candidate")).toBeInTheDocument();

      expect(fetchSpy).toHaveBeenCalledWith("/api/network-enrichment/synthetic/packages", {
        headers: { "content-type": "application/json" },
      });
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
