import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
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
