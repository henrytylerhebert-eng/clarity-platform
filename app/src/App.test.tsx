import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";
import { resetAppState } from "./domain/storage";

describe("App smoke", () => {
  beforeEach(async () => {
    await resetAppState();
  });

  it("loads seed cases and creates a new local case", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect((await screen.findAllByText("Packet Ready Demo D")).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /New Case/i }));
    await user.clear(screen.getByLabelText(/Patient token/i));
    await user.type(screen.getByLabelText(/Patient token/i), "Smoke Demo");
    await user.click(screen.getByRole("button", { name: /Create case/i }));

    expect(await screen.findByText("Smoke Demo")).toBeInTheDocument();
    expect(screen.getByText(/clinical screening can begin/i)).toBeInTheDocument();
  });

  it("shows custody verification for seeded packet case", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect((await screen.findAllByText("Packet Ready Demo D")).length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: /Custody Ledger/i }));
    await user.click(screen.getByRole("button", { name: /Verify custody chain/i }));
    expect(await screen.findByText("Verified")).toBeInTheDocument();
  });

  it("shows episode-owned utilization with separate coverage outcomes, risks, and audit history", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect((await screen.findAllByText("Packet Ready Demo D")).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Episode & UR" }));

    expect(await screen.findByRole("heading", { name: "Episode & UR" })).toBeInTheDocument();
    expect(screen.getByText("Episode-owned")).toBeInTheDocument();
    expect(screen.getByText(/Pre-admission authorization readiness remains/)).toBeInTheDocument();
    expect(screen.getByText("Separate authorization-risk flags")).toBeInTheDocument();
    expect(screen.getAllByText("Day at risk").length).toBeGreaterThan(0);
    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.getByText("Not required")).toBeInTheDocument();
    expect(screen.getAllByText("Jul 8, 2026").length).toBeGreaterThan(0);
    expect(screen.getByText("Correction supersedes event-004-review; original preserved")).toBeInTheDocument();
    expect(screen.getByText("DRAFT · not approved")).toBeInTheDocument();
  });

  it("issues an OPC and executes a sealed PEC for a fresh case in Legal Status", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect((await screen.findAllByText("Packet Ready Demo D")).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /New Case/i }));
    await user.clear(screen.getByLabelText(/Patient token/i));
    await user.type(screen.getByLabelText(/Patient token/i), "Legal Flow Demo");
    await user.click(screen.getByRole("button", { name: /Create case/i }));
    expect(await screen.findByText("Legal Flow Demo")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Legal Status/i }));
    expect(await screen.findByRole("heading", { name: /Order for Protective Custody/i })).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Name, agency"), "Sgt. Broussard");
    await user.type(screen.getByPlaceholderText(/Officer, family member/i), "Responding officer");
    await user.type(screen.getByPlaceholderText(/Facts observed firsthand/i), "Subject stated intent to harm self and refused voluntary transport at the scene.");
    await user.click(screen.getAllByRole("checkbox", { name: /Dangerous to self/i })[0]);
    await user.click(screen.getByRole("button", { name: /Issue OPC/i }));
    expect(await screen.findByText("OPC issued")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Name, credentials"), "Dr. Thibodeaux");
    // datetime-local values are local wall-clock time with no timezone designator, so build the
    // string from local date parts rather than toISOString() (which is UTC and would misrepresent
    // "an hour ago" once new Date(value) re-parses it as local time).
    const recentDate = new Date(Date.now() - 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    const recentExam = `${recentDate.getFullYear()}-${pad(recentDate.getMonth() + 1)}-${pad(recentDate.getDate())}T${pad(recentDate.getHours())}:${pad(recentDate.getMinutes())}`;
    fireEvent.change(screen.getByLabelText(/Actual examination date/i), { target: { value: recentExam } });
    expect(screen.getByText(/Within the statutory window/i)).toBeInTheDocument();

    const findingCheckbox = screen.getByRole("checkbox", { name: /Dangerous to self/i });
    await user.click(findingCheckbox);
    expect(findingCheckbox).toBeChecked();
    const conditionCheckbox = screen.getByRole("checkbox", { name: /Unwilling to seek voluntary admission/i });
    await user.click(conditionCheckbox);
    expect(conditionCheckbox).toBeChecked();
    await user.type(
      screen.getByPlaceholderText(/Time-stamped observations/i),
      "Acute suicidal ideation with plan; refuses safety planning; requires inpatient stabilization.",
    );
    await user.click(screen.getByRole("button", { name: /Review certificate for signature/i }));

    // Review-and-confirm gate: sealing stays disabled until the signer acknowledges identity.
    expect(await screen.findByText(/Review before signing/i)).toBeInTheDocument();
    const sealButton = screen.getByRole("button", { name: /Sign, attest & seal certificate/i });
    expect(sealButton).toBeDisabled();
    await user.click(screen.getByRole("checkbox", { name: /I am Dr. Thibodeaux/i }));
    expect(sealButton).toBeEnabled();
    await user.click(sealButton);

    expect(await screen.findByText("PEC executed & sealed")).toBeInTheDocument();
  });

  it("keeps the mock inpatient cohort separate from canonical cases and exposes review-gated drafts", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect((await screen.findAllByText("Packet Ready Demo D")).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Mock Admit Lab" }));
    expect(await screen.findByRole("heading", { name: "Mock Inpatient Admit Lab" })).toBeInTheDocument();
    expect(screen.getByText("Synthetic mock-use only")).toBeInTheDocument();
    expect(screen.getAllByText("Leslie Knope").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /Tom Haverford/ }));
    expect(screen.getAllByText("Employer-sponsored EPO").length).toBeGreaterThan(0);
    await user.click(screen.getByRole("tab", { name: "Decision path" }));
    expect(screen.getByText("Dual medical-behavioral review; psychiatric admission if medically cleared and behavioral-health need remains primary.")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "UR / chart draft" }));
    expect(screen.getByRole("heading", { name: "Draft chart and UR summary" })).toBeInTheDocument();
    expect(screen.getByText("Do not copy this training draft into a real chart or authorization request.")).toBeInTheDocument();
  });

  it("opens the read-only Product Studio registry for the program director demo role", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect((await screen.findAllByText("Packet Ready Demo D")).length).toBeGreaterThan(0);

    await user.selectOptions(screen.getByRole("combobox"), "executive");
    await user.click(screen.getByRole("button", { name: "Product Studio" }));
    expect(await screen.findByRole("heading", { name: "Make the product inspectable." })).toBeInTheDocument();
    expect(screen.getByText(/Read-only prototype\. Demo role scoping is not authentication/)).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Build" }));
    expect(screen.getByText("Technical placement")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Parking Lot" }));
    expect(screen.getByRole("heading", { name: "Production auth, tenancy, and release controls" })).toBeInTheDocument();
  });

  it("opens the read-only dependency map, filters it, and preserves target context across workspace navigation", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect((await screen.findAllByText("Packet Ready Demo D")).length).toBeGreaterThan(0);

    await user.selectOptions(screen.getByRole("combobox"), "central");
    await user.click(screen.getByRole("button", { name: "Dependency Map" }));
    expect(await screen.findByRole("heading", { name: "Case Dependency Map" })).toBeInTheDocument();
    expect(screen.getByText(/does not make clinical, legal, payer, placement/i)).toBeInTheDocument();
    expect(screen.getByText(/No universal readiness score/i)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/Target transition/i), "packet-transmission");
    await user.selectOptions(screen.getByLabelText(/^Workstream$/i), "Legal status");
    expect(screen.getByRole("heading", { name: "Legal status counsel validation" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "List" }));
    expect(screen.getByRole("table", { name: "Case dependency structured list" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Open legal/i }));
    expect(await screen.findByRole("heading", { name: "Legal Status" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Dependency Map" }));
    expect(screen.getByLabelText(/Target transition/i)).toHaveValue("packet-transmission");
  });

  it("opens the Central Intake journey workspaces and keeps the admission gates separate", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect((await screen.findAllByText("Packet Ready Demo D")).length).toBeGreaterThan(0);

    await user.selectOptions(screen.getByRole("combobox"), "central");
    await user.click(screen.getByRole("button", { name: "Journey Monitor" }));
    expect(await screen.findByRole("heading", { name: "Patient Journey Monitor" })).toBeInTheDocument();
    expect(screen.getByText(/Psychiatrist acceptance/)).toBeInTheDocument();
    expect(screen.getByText(/Medical clearance approval/)).toBeInTheDocument();
    expect(screen.getByText(/No universal readiness score/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Prescreen" }));
    expect(await screen.findByRole("heading", { name: "Prescreen" })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Triage status"), "Reviewed");
    await user.selectOptions(screen.getByLabelText("Human disposition"), "Continue to intake");

    await user.click(screen.getByRole("button", { name: "Admission Readiness" }));
    expect(await screen.findByRole("heading", { name: "Admission Readiness" })).toBeInTheDocument();
    expect(screen.getByText(/Medical clearance is separate from nursing screening/)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Acceptance status"), "Accepted");
    await user.selectOptions(screen.getByLabelText("Clearance status"), "Approved");
    expect(screen.getByText(/separate human checkpoints/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Discharge Planning" }));
    expect(await screen.findByRole("heading", { name: "Discharge Planning" })).toBeInTheDocument();
    expect(screen.getByText("Housing and placement")).toBeInTheDocument();
    expect(screen.getByText("Primary-care follow-up")).toBeInTheDocument();
    expect(screen.getByText("Psychiatric medication management")).toBeInTheDocument();
    expect(screen.getByText(/Default prompts require confirmation/)).toBeInTheDocument();
  });

  it("records a source-linked nursing Stage 2 and creates the case-owned episode after admit gates", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect((await screen.findAllByText("Packet Ready Demo D")).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Guided Intake" }));
    await user.click(screen.getByRole("tab", { name: /Stage 2/ }));
    await user.type(screen.getByLabelText("Nurse identifier"), "Synthetic RN 004");
    await user.type(screen.getByLabelText("Nurse credentials"), "RN");
    await user.selectOptions(screen.getByLabelText("Stage 1 handoff"), "Reviewed");
    await user.selectOptions(screen.getByLabelText("Reconciliation status"), "Reconciled");
    await user.selectOptions(screen.getByLabelText("Current medical stability"), "Stable for current setting");
    await user.selectOptions(screen.getByLabelText("Medication reconciliation"), "Complete and verified");
    await user.selectOptions(screen.getByLabelText("Record status"), "Complete");
    await user.click(screen.getByRole("checkbox", { name: /RN attestation recorded/i }));
    expect(await screen.findByText(/Stage 2 is complete for this synthetic case/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Milieu Bedboard" }));
    await user.click(screen.getByRole("button", { name: "Accept recommendation" }));

    await user.click(screen.getByRole("button", { name: "Admission Readiness" }));
    await user.selectOptions(screen.getByLabelText("Acceptance status"), "Accepted");
    await user.selectOptions(screen.getByLabelText("Clearance status"), "Approved");
    await user.click(screen.getByRole("button", { name: /Record synthetic arrival/i }));
    await user.click(screen.getByRole("button", { name: /Create case-owned admission episode/i }));
    await user.selectOptions(screen.getByLabelText("Admission orders"), "Recorded");
    await user.selectOptions(screen.getByLabelText("Initial post-admission review"), "Recorded");

    await user.click(screen.getByRole("button", { name: "Episode & UR" }));
    expect(await screen.findByText("episode-case-004")).toBeInTheDocument();
    expect(screen.getByText(/Episode-owned utilization review for/)).toBeInTheDocument();
  });
});
