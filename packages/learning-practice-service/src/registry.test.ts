import { describe, expect, it } from "vitest";
import { InMemoryLearningPracticeGateway } from "./gateway.js";
import { PracticeLabService } from "./practiceLab.js";
import { NoticeAcknowledgeEvaluator } from "./evaluator.js";
import { RecognitionService } from "./recognition.js";
import { LearningRegistryService } from "./registry.js";
import { CENTRAL_INTAKE_ROLE, CONTRADICTION_COMPETENCY_ID } from "./seed.js";

const learner = { organizationId: "org-synthetic", actorId: "learner-synthetic", caseRef: "case-synthetic-demo", roleFamily: CENTRAL_INTAKE_ROLE } as const;

describe("My Path synthetic registry", () => {
  it("shows the Central Intake module without claiming demonstration before acknowledgement", () => {
    const registry = new LearningRegistryService(new InMemoryLearningPracticeGateway());
    const path = registry.getCentralIntakePath(learner);
    expect(path.pathway.roleFamily).toBe("INTAKE_COORDINATOR");
    expect(path.modules).toHaveLength(1);
    expect(path.competencies[0]).toMatchObject({ competency: { competencyId: CONTRADICTION_COMPETENCY_ID }, evidence: [], demonstrated: false });
    path.modules.length = 0;
    expect(registry.getCentralIntakePath(learner).modules).toHaveLength(1);
    expect(() => registry.getCentralIntakePath({ ...learner, roleFamily: "READ_ONLY_AUDITOR" })).toThrow("not eligible");
  });

  it("reflects confirmed synthetic evidence only for the learner within their organization", () => {
    const gateway = new InMemoryLearningPracticeGateway();
    const practice = new PracticeLabService(gateway);
    const registry = new LearningRegistryService(gateway);
    const session = practice.start(learner);
    practice.act(learner.organizationId, learner.actorId, session.sessionId, "IDENTIFY_CONTRADICTION", ["FACT-A", "FACT-B"]);
    practice.act(learner.organizationId, learner.actorId, session.sessionId, "PRESERVE_BOTH_SOURCES", ["FACT-A", "FACT-B"]);
    practice.act(learner.organizationId, learner.actorId, session.sessionId, "ESCALATE_FOR_REVIEW", ["review-queue:clinical"]);
    practice.complete(learner.organizationId, learner.actorId, session.sessionId);
    const result = new NoticeAcknowledgeEvaluator(gateway).evaluate({ ...learner, sessionId: session.sessionId, scenarioId: session.scenarioId });
    expect(registry.getCentralIntakePath(learner).competencies[0]?.demonstrated).toBe(false);
    new RecognitionService(gateway).acknowledge(result.candidate!.candidateId, learner);
    expect(registry.getCentralIntakePath(learner).competencies[0]?.demonstrated).toBe(true);
    expect(registry.getCentralIntakePath({ ...learner, organizationId: "foreign" }).competencies[0]?.evidence).toEqual([]);
    expect(registry.getCentralIntakePath({ ...learner, actorId: "foreign" }).competencies[0]?.evidence).toEqual([]);
  });
});
