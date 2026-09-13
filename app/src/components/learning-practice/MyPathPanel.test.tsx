import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { applyNoticeAction, demoLearner, evaluatePractice, recordPracticeAction, startPractice, type ScenarioAction } from "../../domain/learningPractice";
import { MyPathPanel } from "./MyPathPanel";
afterEach(cleanup);
function ready() {
  return evaluatePractice((["IDENTIFY_CONTRADICTION", "PRESERVE_BOTH_SOURCES", "ESCALATE_FOR_REVIEW", "COMPLETE_SCENARIO"] as ScenarioAction[]).reduce((state, action) => recordPracticeAction(state, demoLearner, action), startPractice()), demoLearner);
}
it("counts only confirmed synthetic evidence, never completed actions or pending candidates", () => {
  const state = ready();
  const { rerender } = render(<MyPathPanel state={state} viewer={demoLearner} />);
  expect(screen.getByText("Not yet demonstrated")).toBeVisible();
  const confirmed = applyNoticeAction(state, demoLearner, "ACKNOWLEDGE");
  rerender(<MyPathPanel state={confirmed} viewer={demoLearner} />);
  expect(screen.getByText("Demonstrated in synthetic practice")).toBeVisible();
  expect(screen.getByText(/SYNTHETIC_DEMONSTRATION/)).toBeVisible();
  expect(screen.getByText(/No measurements found/)).toBeVisible();
  const foreign = { ...confirmed, evidence: confirmed.evidence.map(item => ({ ...item, organizationId: "other" })) };
  rerender(<MyPathPanel state={foreign} viewer={demoLearner} />);
  expect(screen.getByText(/0 confirmed synthetic/)).toBeVisible();
  rerender(<MyPathPanel state={{ ...confirmed, evidence: confirmed.evidence.map(item => ({ ...item, personId: "other" })) }} viewer={demoLearner} />);
  expect(screen.getByText(/0 confirmed synthetic/)).toBeVisible();
});
it("keeps a contested observation undemonstrated", () => {
  const state = applyNoticeAction(ready(), demoLearner, "CONTEST", "Needs review");
  render(<MyPathPanel state={state} viewer={demoLearner} />);
  expect(screen.getByText(/0 confirmed synthetic/)).toBeVisible();
  expect(screen.getByText("Not yet demonstrated")).toBeVisible();
});

it("rejects mismatched evidence types, competencies, roles and contested observation confidence", () => {
  const confirmed = applyNoticeAction(ready(), demoLearner, "ACKNOWLEDGE");
  const { rerender } = render(<MyPathPanel state={confirmed} viewer={demoLearner} />);
  for (const patch of [{ competencyId: "other" }, { roleScope: "other" }, { evidenceType: "LIVE_OBSERVED" }]) {
    const invalid = structuredClone(confirmed);
    Object.assign(invalid.evidence[0], patch);
    rerender(<MyPathPanel state={invalid} viewer={demoLearner} />);
    expect(screen.getByText(/0 confirmed synthetic/)).toBeVisible();
  }
  const contested = structuredClone(confirmed);
  contested.observation!.confidence = "CONTESTED";
  rerender(<MyPathPanel state={contested} viewer={demoLearner} />);
  expect(screen.getByText(/0 confirmed synthetic/)).toBeVisible();
});
