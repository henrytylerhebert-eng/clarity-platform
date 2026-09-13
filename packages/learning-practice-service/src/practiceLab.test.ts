import { describe, expect, it } from "vitest";
import type { ScenarioAction } from "@clarity/domain-contracts";
import { InMemoryLearningPracticeGateway } from "./gateway.js";
import { PracticeLabService } from "./practiceLab.js";
import { CENTRAL_INTAKE_ROLE, contradictionScenario } from "./seed.js";

const context = { organizationId: "org-synthetic", actorId: "learner-synthetic", caseRef: "case-synthetic-demo", roleFamily: CENTRAL_INTAKE_ROLE } as const;
const now = () => "2026-09-13T01:00:00.000Z";

describe("synthetic Practice Lab", () => {
  it("rejects unknown scenarios and ineligible roles before creating a session", () => {
    const service = new PracticeLabService(new InMemoryLearningPracticeGateway(), now);
    expect(() => service.start(context, "unknown")).toThrow("Scenario not found");
    expect(() => service.start({ ...context, roleFamily: "READ_ONLY_AUDITOR" })).toThrow("not eligible");
    expect(() => service.start({ ...context, actorId: "" })).toThrow("required");
    expect(service.getScenario().initialFacts).toHaveLength(2);
  });

  it("uses different sessions with a frozen clock and returns isolated copies", () => {
    const gateway = new InMemoryLearningPracticeGateway();
    const service = new PracticeLabService(gateway, now);
    const first = service.start(context);
    const second = service.start(context);
    expect(first.sessionId).not.toBe(second.sessionId);
    first.context.actorId = "tampered";
    expect(service.getSession(context.organizationId, context.actorId, first.sessionId)?.context.actorId).toBe(context.actorId);
    const scenario = service.getScenario();
    scenario.initialFacts.length = 0;
    expect(service.getScenario().initialFacts).toHaveLength(2);
    expect(Object.isFrozen(contradictionScenario.initialFacts)).toBe(true);
  });

  it("denies cross-organization and different-actor reads and mutations", () => {
    const service = new PracticeLabService(new InMemoryLearningPracticeGateway(), now);
    const session = service.start(context);
    expect(service.getSession("foreign-org", context.actorId, session.sessionId)).toBeUndefined();
    expect(() => service.getSession(context.organizationId, "foreign-actor", session.sessionId)).toThrow("does not own");
    expect(() => service.act("foreign-org", context.actorId, session.sessionId, "IDENTIFY_CONTRADICTION")).toThrow("not found");
    expect(() => service.act(context.organizationId, "foreign-actor", session.sessionId, "IDENTIFY_CONTRADICTION")).toThrow("does not own");
    expect(() => service.complete(context.organizationId, "foreign-actor", session.sessionId)).toThrow("does not own");
    expect(service.getSession(context.organizationId, context.actorId, session.sessionId)?.actions).toEqual([]);
  });

  it("records scoped synthetic events and prevents post-completion mutations", () => {
    const gateway = new InMemoryLearningPracticeGateway();
    const service = new PracticeLabService(gateway, now);
    const session = service.start(context);
    const references = ["FACT-A", "FACT-B"];
    service.act(context.organizationId, context.actorId, session.sessionId, "IDENTIFY_CONTRADICTION", references);
    references.push("tampered");
    expect(() => service.act(context.organizationId, context.actorId, session.sessionId, "UNKNOWN" as Exclude<ScenarioAction, "COMPLETE_SCENARIO">)).toThrow("Unsupported");
    service.complete(context.organizationId, context.actorId, session.sessionId);
    expect(() => service.act(context.organizationId, context.actorId, session.sessionId, "PRESERVE_BOTH_SOURCES")).toThrow("already complete");
    expect(() => service.complete(context.organizationId, context.actorId, session.sessionId)).toThrow("already complete");
    const events = gateway.listWorkflowEvents(context.organizationId, context.caseRef, context.actorId, session.scenarioId, session.sessionId);
    expect(events.map((event) => event.eventType)).toEqual(["PRACTICE_SCENARIO_STARTED", "CONTRADICTION_IDENTIFIED", "PRACTICE_SCENARIO_COMPLETED"]);
    expect(events[1]?.evidenceRefs).toEqual(["FACT-A", "FACT-B"]);
    expect(events.every((event) => event.synthetic && event.sessionId === session.sessionId)).toBe(true);
  });
});
