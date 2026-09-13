import { describe, expect, it, vi } from "vitest";
import type { ScenarioAction, SyntheticWorkflowEvent } from "@clarity/domain-contracts";
import { InMemoryLearningPracticeGateway } from "./gateway.js";
import { PracticeLabService } from "./practiceLab.js";
import { NoticeAcknowledgeEvaluator } from "./evaluator.js";
import { CENTRAL_INTAKE_ROLE } from "./seed.js";

const context = { organizationId: "org-synthetic", actorId: "learner-synthetic", caseRef: "case-synthetic-demo", roleFamily: CENTRAL_INTAKE_ROLE } as const;
const actions: Exclude<ScenarioAction, "COMPLETE_SCENARIO">[] = ["IDENTIFY_CONTRADICTION", "PRESERVE_BOTH_SOURCES", "ESCALATE_FOR_REVIEW"];
const now = () => "2026-09-13T01:00:00.000Z";
function setup(selectedActions = actions, complete = true) {
  const gateway = new InMemoryLearningPracticeGateway();
  const practice = new PracticeLabService(gateway, now);
  const evaluator = new NoticeAcknowledgeEvaluator(gateway);
  const session = practice.start(context);
  for (const action of selectedActions) practice.act(context.organizationId, context.actorId, session.sessionId, action,
    action === "ESCALATE_FOR_REVIEW" ? ["review-queue:clinical"] : ["FACT-A", "FACT-B"]);
  if (complete) practice.complete(context.organizationId, context.actorId, session.sessionId);
  const evaluationContext = { ...context, sessionId: session.sessionId, scenarioId: session.scenarioId };
  const events = gateway.listWorkflowEvents(context.organizationId, context.caseRef, context.actorId, session.scenarioId, session.sessionId);
  return { gateway, practice, evaluator, session, evaluationContext, events };
}

describe("governed synthetic evaluator", () => {
  it("creates an explainable deterministic observation and returns the same result on retry", () => {
    const env = setup();
    const first = env.evaluator.evaluate(env.evaluationContext);
    expect(first.candidate?.state).toBe("READY_TO_ACKNOWLEDGE");
    expect(first.observation).toMatchObject({ confidence: "DETERMINISTIC", ruleId: "OBS-EI-03", ruleVersion: "1.0.0", episodeRef: null });
    expect(first.observation?.evidenceRefs).toEqual(expect.arrayContaining(["FACT-A", "FACT-B", "review-queue:clinical"]));
    const retry = env.evaluator.evaluate(env.evaluationContext);
    expect(retry.observation).toEqual(first.observation);
    expect(retry.candidate).toEqual(first.candidate);
  });

  it("requires completion and each controllable behavior", () => {
    const unfinished = setup(actions, false);
    expect(unfinished.evaluator.evaluate(unfinished.evaluationContext).reason).toBe("Scenario is not complete");
    for (const missing of actions) {
      const env = setup(actions.filter((action) => action !== missing));
      expect(env.evaluator.evaluate(env.evaluationContext)).toMatchObject({ candidate: null, reason: expect.stringContaining("Missing required evidence") });
    }
  });

  it("rejects the declared behaviors recorded out of order", () => {
    const env = setup(["ESCALATE_FOR_REVIEW", "IDENTIFY_CONTRADICTION", "PRESERVE_BOTH_SOURCES"]);
    expect(env.evaluator.evaluate(env.evaluationContext)).toMatchObject({ candidate: null, reason: expect.stringContaining("declared order") });
  });

  it("blocks recognition after silent contradiction resolution", () => {
    const env = setup([...actions, "SILENTLY_RESOLVE_CONTRADICTION"]);
    expect(env.evaluator.evaluate(env.evaluationContext)).toMatchObject({ candidate: null, reason: expect.stringContaining("Critical error") });
  });

  it("cannot combine partial evidence from separate sessions", () => {
    const env = setup(["IDENTIFY_CONTRADICTION", "PRESERVE_BOTH_SOURCES"]);
    const second = env.practice.start(context);
    env.practice.act(context.organizationId, context.actorId, second.sessionId, "ESCALATE_FOR_REVIEW", ["review-queue:clinical"]);
    env.practice.complete(context.organizationId, context.actorId, second.sessionId);
    expect(env.evaluator.evaluate(env.evaluationContext).candidate).toBeNull();
    expect(env.evaluator.evaluate({ ...env.evaluationContext, sessionId: second.sessionId }).candidate).toBeNull();
  });

  it.each(["ADMISSION_RECORDED", "REVENUE_RECORDED", "CENSUS_UPDATED"] as const)("ignores %s in recognition identity, evidence and confidence", (eventType) => {
    const env = setup();
    const first = env.evaluator.evaluate(env.evaluationContext);
    env.gateway.appendWorkflowEvent(context.organizationId, {
      ...env.events[0]!, eventId: `outcome-${eventType}`, eventType, dataQuality: "UNKNOWN", evidenceRefs: [`outcome:${eventType}`],
    });
    const after = env.evaluator.evaluate(env.evaluationContext);
    expect(after.observation).toEqual(first.observation);
    expect(after.candidate).toEqual(first.candidate);
    expect(after.observation?.evidenceRefs.join(" ")).not.toContain("outcome:");
  });

  it("cannot recognize outcome-only events", () => {
    const env = setup([]);
    for (const eventType of ["ADMISSION_RECORDED", "REVENUE_RECORDED", "CENSUS_UPDATED"] as const) {
      env.gateway.appendWorkflowEvent(context.organizationId, { ...env.events[0]!, eventId: eventType, eventType, evidenceRefs: ["outcome:revenue"] });
    }
    expect(env.evaluator.evaluate(env.evaluationContext).candidate).toBeNull();
  });

  it.each([[], ["FACT-A"], ["FACT-B"], ["FACT-A", "FACT-B", "outcome:admission"], ["UNKNOWN"]].map((references) => ({ references })))("rejects missing or ungoverned source references $references", ({ references }) => {
    const env = setup();
    const events = structuredClone(env.events);
    events[1]!.evidenceRefs = references;
    vi.spyOn(env.gateway, "listWorkflowEvents").mockReturnValue(events);
    expect(env.evaluator.evaluate(env.evaluationContext)).toMatchObject({ candidate: null, reason: expect.stringContaining("source references") });
  });

  it.each([
    { dataQuality: "PARTIAL" }, { dataQuality: "UNKNOWN" }, { synthetic: false }, { reviewState: "LIVE" },
    { organizationId: "foreign" }, { actorId: "foreign" }, { sessionId: "foreign" }, { caseRef: "foreign" },
    { scenarioId: "unknown" }, { eventType: "UNKNOWN" }, { recordedAt: "bad timestamp" }, { schemaVersion: "2.0.0" },
  ])("fails closed on invalid event metadata %j", (patch) => {
    const env = setup();
    const events = structuredClone(env.events);
    events[1] = { ...events[1], ...patch } as SyntheticWorkflowEvent;
    vi.spyOn(env.gateway, "listWorkflowEvents").mockReturnValue(events);
    expect(env.evaluator.evaluate(env.evaluationContext).candidate).toBeNull();
  });

  it("rejects missing start, duplicate completion, post-completion behavior and changed facility attribution", () => {
    for (const mutation of [
      (events: SyntheticWorkflowEvent[]) => events.slice(1),
      (events: SyntheticWorkflowEvent[]) => [...events, { ...events.at(-1)!, eventId: "extra-complete" }],
      (events: SyntheticWorkflowEvent[]) => [...events, { ...events[1]!, eventId: "extra-behavior" }],
      (events: SyntheticWorkflowEvent[]) => events.map((event, index) => index === 1 ? { ...event, facilityId: "foreign-facility" } : event),
    ]) {
      const env = setup();
      vi.spyOn(env.gateway, "listWorkflowEvents").mockReturnValue(mutation(env.events));
      expect(env.evaluator.evaluate(env.evaluationContext).candidate).toBeNull();
    }
  });

  it("denies foreign organization or learner and unsupported evaluation contexts", () => {
    const env = setup();
    expect(env.evaluator.evaluate({ ...env.evaluationContext, organizationId: "foreign" }).candidate).toBeNull();
    expect(env.evaluator.evaluate({ ...env.evaluationContext, actorId: "foreign" }).candidate).toBeNull();
    expect(env.evaluator.evaluate({ ...env.evaluationContext, scenarioId: "unknown" }).candidate).toBeNull();
    expect(env.evaluator.evaluate({ ...env.evaluationContext, sessionId: "" }).candidate).toBeNull();
  });
});
