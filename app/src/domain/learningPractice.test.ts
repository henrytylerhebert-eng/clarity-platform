import { describe, expect, it } from "vitest";
import {
  applyNoticeAction, CENTRAL_INTAKE_ROLE, centralIntakePathway, contradictionScenario, demoLearner,
  demoReviewer, contradictionRule, evaluatePractice, isPracticeActionAvailable, learningModule, readPractice,
  recordPracticeAction, startPractice,
  type PracticeState, type ScenarioAction, type SyntheticWorkflowEventType,
} from "./learningPractice";

const correct: ScenarioAction[] = ["IDENTIFY_CONTRADICTION", "PRESERVE_BOTH_SOURCES", "ESCALATE_FOR_REVIEW", "COMPLETE_SCENARIO"];
function attempt(actions = correct) {
  return actions.reduce((state, action) => recordPracticeAction(state, demoLearner, action), startPractice());
}
const candidate = () => evaluatePractice(attempt(), demoLearner);
function outcome(state: PracticeState, eventType: SyntheticWorkflowEventType) {
  return { ...state, events: [...state.events, { ...state.events[0], eventId: `${state.sessionId}:${eventType}`, eventType, evidenceRefs: ["outcome-must-not-count"] }] };
}

describe("standalone synthetic learning practice", () => {
  it("loads the Central Intake module and two conflicting sources at the same checkpoint", () => {
    expect(centralIntakePathway.roleFamily).toBe(CENTRAL_INTAKE_ROLE);
    expect(centralIntakePathway.moduleIds).toContain(learningModule.moduleId);
    expect(contradictionScenario.initialFacts).toHaveLength(2);
    expect(contradictionScenario.initialFacts.every(fact => fact.statement.includes("checkpoint T0"))).toBe(true);
    expect(() => startPractice({ ...demoLearner, roleFamily: "CLINICAL_REVIEWER" })).toThrow("Role is not eligible");
  });
  it("creates deterministic observation and candidate, with deduplicated evidence refs and no Episode", () => {
    const result = candidate();
    expect(result.candidate?.state).toBe("READY_TO_ACKNOWLEDGE");
    expect(result.observation?.confidence).toBe("DETERMINISTIC");
    expect(result.observation?.episodeRef).toBeNull();
    expect(result.observation?.evidenceRefs).toEqual(expect.arrayContaining(["FACT-A", "FACT-B", "review-queue:clinical"]));
    expect(new Set(result.observation?.evidenceRefs).size).toBe(result.observation?.evidenceRefs.length);
    expect(evaluatePractice(result, demoLearner)).toBe(result);
    expect(result.evidence).toEqual([]);
  });
  it.each([
    ["incomplete", correct.slice(0, -1)],
    ["missing escalation", ["IDENTIFY_CONTRADICTION", "PRESERVE_BOTH_SOURCES", "COMPLETE_SCENARIO"]],
    ["critical error", ["SILENTLY_RESOLVE_CONTRADICTION", ...correct]],
    ["out-of-order behaviors", ["ESCALATE_FOR_REVIEW", "IDENTIFY_CONTRADICTION", "PRESERVE_BOTH_SOURCES", "COMPLETE_SCENARIO"]],
  ] as [string, ScenarioAction[]][])("rejects %s", (_label, actions) => {
    expect(evaluatePractice(attempt(actions), demoLearner).candidate).toBeNull();
  });
  it("only makes the ordered behaviors available once their predecessors are recorded, leaving the critical-error path always open", () => {
    expect(isPracticeActionAvailable("IDENTIFY_CONTRADICTION", [])).toBe(true);
    expect(isPracticeActionAvailable("PRESERVE_BOTH_SOURCES", [])).toBe(false);
    expect(isPracticeActionAvailable("PRESERVE_BOTH_SOURCES", ["IDENTIFY_CONTRADICTION"])).toBe(true);
    expect(isPracticeActionAvailable("ESCALATE_FOR_REVIEW", ["IDENTIFY_CONTRADICTION"])).toBe(false);
    expect(isPracticeActionAvailable("ESCALATE_FOR_REVIEW", ["IDENTIFY_CONTRADICTION", "PRESERVE_BOTH_SOURCES"])).toBe(true);
    expect(isPracticeActionAvailable("SILENTLY_RESOLVE_CONTRADICTION", [])).toBe(true);
    expect(isPracticeActionAvailable("COMPLETE_SCENARIO", [])).toBe(true);
  });
  it.each(["ADMISSION_RECORDED", "REVENUE_RECORDED", "CENSUS_UPDATED"] as const)("ignores %s without strengthening ID, confidence or evidence", type => {
    const state = candidate();
    const result = evaluatePractice(outcome(state, type), demoLearner);
    expect(result.observation).toEqual(state.observation);
    expect(result.candidate).toEqual(state.candidate);
    expect(evaluatePractice(outcome(startPractice(), type), demoLearner).candidate).toBeNull();
  });
  it.each(["PARTIAL", "UNKNOWN"] as const)("rejects %s evidence quality", quality => {
    const state = attempt();
    state.events[1].dataQuality = quality;
    expect(evaluatePractice(state, demoLearner).candidate).toBeNull();
  });
  it("requires both sources and a clinical review reference, and rejects unknown source references", () => {
    for (const [eventIndex, refs] of [[1, ["FACT-A"]], [2, ["invented"]], [3, []]] as [number, string[]][]) {
      const state = attempt();
      state.events[eventIndex].evidenceRefs = refs;
      expect(evaluatePractice(state, demoLearner).candidate).toBeNull();
    }
  });
  it("isolates attempts and denies mixed learner, tenant, scenario, session, or non-synthetic evidence", () => {
    const earlier = attempt(["IDENTIFY_CONTRADICTION", "PRESERVE_BOTH_SOURCES", "COMPLETE_SCENARIO"]);
    const later = attempt(["ESCALATE_FOR_REVIEW", "COMPLETE_SCENARIO"]);
    expect(earlier.sessionId).not.toBe(later.sessionId);
    expect(evaluatePractice({ ...later, events: [...later.events, ...earlier.events] }, demoLearner).candidate).toBeNull();
    for (const [key, value] of [["actorId", "other"], ["organizationId", "other"], ["scenarioId", "other"], ["sessionId", "other"], ["synthetic", false]]) {
      const state = attempt();
      Object.assign(state.events[1], { [key as string]: value });
      expect(evaluatePractice(state, demoLearner).candidate).toBeNull();
    }
  });
  it("rejects all session reads, actions, evaluation, and acknowledgements by another owner or organization", () => {
    const state = candidate();
    for (const actor of [{ ...demoLearner, organizationId: "other" }, { ...demoLearner, actorId: "other" }]) {
      expect(() => readPractice(state, actor)).toThrow();
      expect(() => recordPracticeAction(state, actor, "IDENTIFY_CONTRADICTION")).toThrow();
      expect(() => evaluatePractice(state, actor)).toThrow();
      expect(() => applyNoticeAction(state, actor, "ACKNOWLEDGE")).toThrow();
    }
  });
  it("freezes completed sessions and does not mutate snapshots", () => {
    const state = startPractice();
    const next = recordPracticeAction(state, demoLearner, "IDENTIFY_CONTRADICTION");
    expect(state.actions).toEqual([]);
    expect(next.actions).toHaveLength(1);
    expect(recordPracticeAction(next, demoLearner, "IDENTIFY_CONTRADICTION")).toBe(next);
    expect(() => recordPracticeAction(attempt(), demoLearner, "SILENTLY_RESOLVE_CONTRADICTION")).toThrow("complete");
    expect(() => recordPracticeAction(attempt(), demoLearner, "COMPLETE_SCENARIO")).toThrow("complete");
  });
  it("adds context without evidence; acknowledge alone creates owner scoped synthetic evidence", () => {
    const contextual = applyNoticeAction(candidate(), demoLearner, "ADD_CONTEXT", " Source timing remained unresolved ");
    expect(contextual.evidence).toEqual([]);
    expect(contextual.history[0].context).toBe("Source timing remained unresolved");
    const confirmed = applyNoticeAction(contextual, demoLearner, "ACKNOWLEDGE");
    expect(confirmed.evidence).toHaveLength(1);
    expect(confirmed.evidence[0]).toMatchObject({ personId: demoLearner.actorId, organizationId: demoLearner.organizationId, roleScope: "INTAKE_COORDINATOR", evidenceType: "SYNTHETIC_DEMONSTRATION" });
    expect(() => applyNoticeAction(confirmed, demoLearner, "CONTEST", "later")).toThrow();
    expect(() => applyNoticeAction(confirmed, demoLearner, "ACKNOWLEDGE")).toThrow();
    expect(evaluatePractice(confirmed, demoLearner)).toBe(confirmed);
  });
  it("freezes policy, scenario facts and configured demo identities", () => {
    expect(Object.isFrozen(contradictionRule)).toBe(true);
    expect(Object.isFrozen(contradictionScenario.initialFacts)).toBe(true);
    expect(Object.isFrozen(demoReviewer)).toBe(true);
    expect(() => { contradictionScenario.initialFacts[0].factId = "changed"; }).toThrow();
    expect(() => { demoReviewer.actorId = demoLearner.actorId; }).toThrow();
  });
  it("rejects absent, foreign or incomplete start events and unbounded/duplicate lifecycle events", () => {
    const mutations: ((state: PracticeState) => void)[] = [
      state => { state.events.shift(); },
      state => { state.events[0].organizationId = "other"; },
      state => { state.events[0].dataQuality = "PARTIAL"; },
      state => { state.events.push({ ...state.events[1], eventId: "late-action" }); },
      state => { state.events[2].eventId = state.events[1].eventId; },
      state => { state.events[1].recordedAt = "not a date"; },
      state => { state.events[1].recordedAt = "1900-01-01T00:00:00Z"; },
      state => { state.events.push({ ...state.events[state.events.length - 1], eventId: "duplicate-completion" }); },
      state => { state.events[2].evidenceRefs.push("review-queue:clinical"); },
      state => { state.events[state.events.length - 1].evidenceRefs.push("FACT-A"); },
    ];
    for (const mutate of mutations) {
      const state = attempt();
      mutate(state);
      expect(evaluatePractice(state, demoLearner).candidate).toBeNull();
    }
  });
  it("denies nested foreign recognition records or broken observation linkage", () => {
    const mutations: ((state: PracticeState) => void)[] = [
      state => { state.candidate!.organizationId = "other"; },
      state => { state.observation!.organizationId = "other"; },
      state => { state.observation!.actorId = "other"; },
      state => { state.candidate!.observationId = "other-observation"; },
    ];
    for (const mutate of mutations) {
      const state = candidate();
      mutate(state);
      expect(() => readPractice(state, demoLearner)).toThrow("Recognition records");
      expect(() => applyNoticeAction(state, demoLearner, "ACKNOWLEDGE")).toThrow("Recognition records");
      expect(() => evaluatePractice(state, demoLearner)).toThrow("Recognition records");
    }
  });
  it("requires actual nonblank context", () => {
    for (const action of ["ADD_CONTEXT", "CONTEST", "DISMISS"] as const) expect(() => applyNoticeAction(candidate(), demoLearner, action, "  ")).toThrow("context");
  });
  it("freezes contests and requires a separately configured synthetic reviewer to confirm", () => {
    const contested = applyNoticeAction(candidate(), demoLearner, "CONTEST", "Synthetic source conflict requires review");
    expect(contested.evidence).toEqual([]);
    expect(contested.observation?.confidence).toBe("CONTESTED");
    expect(() => applyNoticeAction(contested, demoLearner, "ACKNOWLEDGE")).toThrow();
    expect(() => applyNoticeAction(contested, demoLearner, "CONFIRM_CONTEST", "reviewed", demoLearner)).toThrow("separate");
    expect(() => applyNoticeAction(contested, demoReviewer, "CONFIRM_CONTEST", "reviewed")).toThrow("separate");
    expect(() => applyNoticeAction(contested, { ...demoReviewer, actorId: "unconfigured" }, "CONFIRM_CONTEST", "reviewed", demoReviewer)).toThrow("separate");
    expect(() => applyNoticeAction(contested, { ...demoReviewer, organizationId: "other" }, "CONFIRM_CONTEST", "reviewed", demoReviewer)).toThrow("Cross-organization");
    expect(() => applyNoticeAction(contested, demoReviewer, "CONFIRM_CONTEST", "  ", demoReviewer)).toThrow("context");
    const confirmed = applyNoticeAction(contested, demoReviewer, "CONFIRM_CONTEST", "Simulated qualified review", demoReviewer);
    expect(confirmed.observation?.confidence).toBe("HUMAN_REVIEWED");
    expect(confirmed.candidate?.state).toBe("CONFIRMED");
    expect(confirmed.evidence).toHaveLength(1);
  });
  it("dismissed candidates and dismissed contests never create evidence", () => {
    const dismissed = applyNoticeAction(candidate(), demoLearner, "DISMISS", "Not representative");
    const contested = applyNoticeAction(candidate(), demoLearner, "CONTEST", "Needs review");
    const resolved = applyNoticeAction(contested, demoReviewer, "DISMISS_CONTEST", "Unsupported", demoReviewer);
    for (const state of [dismissed, resolved]) {
      expect(state.candidate?.state).toBe("DISMISSED");
      expect(state.evidence).toEqual([]);
      expect(evaluatePractice(state, demoLearner)).toBe(state);
      expect(() => applyNoticeAction(state, demoLearner, "ACKNOWLEDGE")).toThrow();
    }
  });
});
