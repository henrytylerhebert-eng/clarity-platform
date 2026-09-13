import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { TrainingSops } from "../../workspaces/TrainingSops";
import { PracticeLabScenario } from "./PracticeLabScenario";
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
function completeCorrectly() {
  for (const name of ["Identify contradiction", "Preserve both sources", "Escalate for review", "Complete and evaluate practice"]) fireEvent.click(screen.getByRole("button", { name }));
}
it("extends Central Intake training while retaining onboarding, SOP phases, sources, PEC and role matrix", () => {
  render(<TrainingSops roleId="central" />);
  for (const name of ["Central Intake Practice Lab", "SOP phases built into workflow", "PEC chain-of-custody practice path", "Source boundaries", "Position training matrix", "Central intake coordinator onboarding"]) expect(screen.getByRole("heading", { name })).toBeVisible();
  expect(screen.getByText(/not oriented to place/)).toBeVisible();
  expect(screen.getByText(/denied current thoughts of death/)).toBeVisible();
});
it("shows the lab in all-workspaces demo and hides it for other role families", () => {
  const { rerender } = render(<TrainingSops roleId="all" />);
  expect(screen.getByRole("heading", { name: "Central Intake Practice Lab" })).toBeVisible();
  for (const roleId of ["field", "clinician", "facility", "nurse", "ur", "compliance", "executive"] as const) {
    rerender(<TrainingSops roleId={roleId} />);
    expect(screen.queryByRole("heading", { name: "Central Intake Practice Lab" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Source boundaries" })).toBeVisible();
  }
});
it("completes the pathway, acknowledges a notice, and resets without storage or network calls", () => {
  const store = vi.spyOn(Storage.prototype, "setItem");
  const fetch = vi.spyOn(globalThis, "fetch");
  render(<PracticeLabScenario />);
  expect(screen.getByText(/0 confirmed synthetic/)).toBeVisible();
  completeCorrectly();
  expect(screen.getByRole("region", { name: "Notice and Acknowledge" })).toBeVisible();
  expect(screen.getByText(/OBS-EI-03@1.0.0/)).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Acknowledge" }));
  expect(screen.getByText(/1 confirmed synthetic/)).toBeVisible();
  for (const name of ["Identify contradiction", "Preserve both sources", "Escalate for review", "Silently resolve contradiction (critical error)", "Complete and evaluate practice"]) expect(screen.getByRole("button", { name })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Reset synthetic practice" }));
  expect(screen.queryByRole("region", { name: "Notice and Acknowledge" })).not.toBeInTheDocument();
  expect(screen.getByText(/0 confirmed synthetic/)).toBeVisible();
  expect(screen.getByText(/previous events and competency evidence cleared/)).toBeVisible();
  expect(store).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
});
it("does not grant recognition for silent resolution and recovers with a fresh attempt", () => {
  render(<PracticeLabScenario />);
  fireEvent.click(screen.getByRole("button", { name: "Silently resolve contradiction (critical error)" }));
  completeCorrectly();
  expect(screen.getByText(/Critical error: contradiction was silently resolved/)).toBeVisible();
  expect(screen.queryByRole("region", { name: "Notice and Acknowledge" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Reset synthetic practice" }));
  completeCorrectly();
  expect(screen.getByRole("button", { name: "Acknowledge" })).toBeEnabled();
});
it("requires escalation and freezes contests before simulated reviewer confirmation", () => {
  render(<PracticeLabScenario />);
  fireEvent.click(screen.getByRole("button", { name: "Complete and evaluate practice" }));
  expect(screen.getByText(/Missing required evidence/)).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Reset synthetic practice" }));
  completeCorrectly();
  fireEvent.change(screen.getByLabelText("Synthetic context only"), { target: { value: "Synthetic source times checked" } });
  fireEvent.click(screen.getByRole("button", { name: "Add context" }));
  expect(screen.getByText(/0 confirmed synthetic/)).toBeVisible();
  fireEvent.change(screen.getByLabelText("Synthetic context only"), { target: { value: "Synthetic conflict needs reviewer" } });
  fireEvent.click(screen.getByRole("button", { name: "Contest" }));
  expect(screen.queryByRole("button", { name: "Acknowledge" })).not.toBeInTheDocument();
  expect(screen.getByText(/evidence is frozen/)).toBeVisible();
  expect(screen.getByRole("button", { name: "Simulate reviewer confirmation" })).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Synthetic context only"), { target: { value: "Simulated review confirms preserved uncertainty" } });
  fireEvent.click(screen.getByRole("button", { name: "Simulate reviewer confirmation" }));
  expect(screen.getByText(/HUMAN_REVIEWED is a simulated resolution/)).toBeVisible();
  expect(within(screen.getByRole("region", { name: "My Path" })).getByText(/1 confirmed synthetic/)).toBeVisible();
});
it("clears state when the workspace unmounts", () => {
  const first = render(<PracticeLabScenario />);
  completeCorrectly();
  fireEvent.click(screen.getByRole("button", { name: "Acknowledge" }));
  first.unmount();
  render(<PracticeLabScenario />);
  expect(screen.getByText(/0 confirmed synthetic/)).toBeVisible();
});
