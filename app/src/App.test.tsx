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
});
