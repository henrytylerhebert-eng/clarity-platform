import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { applyNoticeAction, demoLearner, evaluatePractice, recordPracticeAction, startPractice, type ScenarioAction } from "../../domain/learningPractice";
import { NoticeAcknowledgeCard } from "./NoticeAcknowledgeCard";
afterEach(cleanup);
function ready() {
  return evaluatePractice((["IDENTIFY_CONTRADICTION", "PRESERVE_BOTH_SOURCES", "ESCALATE_FOR_REVIEW", "COMPLETE_SCENARIO"] as ScenarioAction[]).reduce((state, action) => recordPracticeAction(state, demoLearner, action), startPractice()), demoLearner);
}
it("shows governed evidence, version, confidence and contestable actions with required context", () => {
  const onAction = vi.fn();
  render(<NoticeAcknowledgeCard state={ready()} viewer={demoLearner} onAction={onAction} />);
  expect(screen.getByText(/OBS-EI-03@1.0.0/)).toHaveTextContent("DETERMINISTIC");
  fireEvent.click(screen.getByText(/Evidence references/));
  expect(screen.getByText("FACT-A")).toBeVisible();
  expect(screen.getByText("FACT-B")).toBeVisible();
  expect(screen.getByText("review-queue:clinical")).toBeVisible();
  for (const name of ["Add context", "Contest", "Dismiss candidate"]) expect(screen.getByRole("button", { name })).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Synthetic context only"), { target: { value: "A synthetic context" } });
  fireEvent.click(screen.getByRole("button", { name: "Contest" }));
  expect(onAction).toHaveBeenCalledWith("CONTEST", "A synthetic context");
  expect(screen.getByLabelText("Synthetic context only")).toHaveValue("");
});
it("contested notice replaces acknowledgement with explicitly simulated reviewer actions", () => {
  const state = applyNoticeAction(ready(), demoLearner, "CONTEST", "Needs simulated review");
  const onAction = vi.fn();
  render(<NoticeAcknowledgeCard state={state} viewer={demoLearner} onAction={onAction} />);
  expect(screen.getByText(/no actual reviewer approval/)).toBeVisible();
  expect(screen.queryByRole("button", { name: "Acknowledge" })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Synthetic context only"), { target: { value: "Unsupported" } });
  fireEvent.click(screen.getByRole("button", { name: "Simulate reviewer dismissal" }));
  expect(onAction).toHaveBeenCalledWith("DISMISS_CONTEST", "Unsupported");
});
it("does not expose action buttons for dismissed candidates", () => {
  const state = applyNoticeAction(ready(), demoLearner, "DISMISS", "Not representative");
  render(<NoticeAcknowledgeCard state={state} viewer={demoLearner} onAction={vi.fn()} />);
  expect(screen.getByText("DISMISSED")).toBeVisible();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
