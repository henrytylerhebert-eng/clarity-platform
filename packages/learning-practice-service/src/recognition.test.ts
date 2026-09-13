import { describe, expect, it } from "vitest";
import type { RecognitionCandidate } from "@clarity/domain-contracts";
import { InMemoryLearningPracticeGateway } from "./gateway.js";
import { PracticeLabService } from "./practiceLab.js";
import { NoticeAcknowledgeEvaluator } from "./evaluator.js";
import { RecognitionService } from "./recognition.js";
import { CENTRAL_INTAKE_ROLE } from "./seed.js";

const learner = { organizationId: "org-synthetic", actorId: "learner-synthetic", caseRef: "case-synthetic-demo", roleFamily: CENTRAL_INTAKE_ROLE } as const;
// Explicitly configured simulation identity: this is not a new live reviewer role.
const reviewer = { ...learner, actorId: "reviewer-synthetic" };
function setup(configureReviewer = true) {
  let tick = 0;
  const now = () => new Date(Date.UTC(2026, 8, 13, 1, 0, tick++)).toISOString();
  const gateway = new InMemoryLearningPracticeGateway();
  const practice = new PracticeLabService(gateway, now);
  const evaluator = new NoticeAcknowledgeEvaluator(gateway);
  const recognition = new RecognitionService(gateway, now, configureReviewer ? reviewer : undefined);
  const session = practice.start(learner);
  practice.act(learner.organizationId, learner.actorId, session.sessionId, "IDENTIFY_CONTRADICTION", ["FACT-A", "FACT-B"]);
  practice.act(learner.organizationId, learner.actorId, session.sessionId, "PRESERVE_BOTH_SOURCES", ["FACT-A", "FACT-B"]);
  practice.act(learner.organizationId, learner.actorId, session.sessionId, "ESCALATE_FOR_REVIEW", ["review-queue:clinical"]);
  practice.complete(learner.organizationId, learner.actorId, session.sessionId);
  const evaluationContext = { ...learner, sessionId: session.sessionId, scenarioId: session.scenarioId };
  const evaluation = evaluator.evaluate(evaluationContext);
  expect(evaluation.candidate).not.toBeNull();
  const candidate = evaluation.candidate as RecognitionCandidate;
  const evidence = () => gateway.listCompetencyEvidence(learner.organizationId, learner.actorId);
  return { gateway, evaluator, recognition, candidate, evaluationContext, evidence };
}

describe("Notice & Acknowledge", () => {
  it("exposes evidence, confidence, rule version and contestability", () => {
    const env = setup();
    const card = env.recognition.getNoticeCard(env.candidate.candidateId, learner);
    expect(card.ruleVersionLabel).toBe("OBS-EI-03@1.0.0");
    expect(card.confidence).toBe("DETERMINISTIC");
    expect(card.evidenceRefs).toEqual(expect.arrayContaining(["FACT-A", "FACT-B"]));
    expect(card.allowedActions).toEqual(["ACKNOWLEDGE", "ADD_CONTEXT", "CONTEST", "DISMISS"]);
    expect(env.evidence()).toEqual([]);
  });

  it("acknowledgement creates exactly one synthetic demonstration and a scoped audit history", () => {
    const env = setup();
    expect(env.recognition.acknowledge(env.candidate.candidateId, learner).state).toBe("CONFIRMED");
    expect(env.evidence()).toHaveLength(1);
    expect(env.evidence()[0]).toMatchObject({ organizationId: learner.organizationId, personId: learner.actorId, roleScope: "INTAKE_COORDINATOR", evidenceType: "SYNTHETIC_DEMONSTRATION" });
    expect(env.recognition.getAcknowledgementHistory(env.candidate.candidateId, learner).map((record) => record.action)).toEqual(["ACKNOWLEDGE"]);
    expect(() => env.recognition.acknowledge(env.candidate.candidateId, learner)).toThrow("not ready");
    expect(env.evaluator.evaluate(env.evaluationContext).candidate?.state).toBe("CONFIRMED");
    expect(env.evidence()).toHaveLength(1);
  });

  it("context alone is visible in history but creates no evidence", () => {
    const env = setup();
    expect(env.recognition.addContext(env.candidate.candidateId, learner, "  Sources differ at the same checkpoint.  ").state).toBe("READY_TO_ACKNOWLEDGE");
    expect(env.evidence()).toEqual([]);
    expect(env.recognition.getAcknowledgementHistory(env.candidate.candidateId, learner)[0]?.context).toBe("Sources differ at the same checkpoint.");
  });

  it("a contest freezes evidence, including evaluator retries and acknowledgement attempts", () => {
    const env = setup();
    const contested = env.recognition.contest(env.candidate.candidateId, learner, "Please check event attribution.");
    expect(contested).toMatchObject({ state: "CONTESTED", reviewOwnerId: reviewer.actorId });
    expect(env.recognition.getNoticeCard(contested.candidateId, learner)).toMatchObject({ confidence: "CONTESTED", allowedActions: [] });
    expect(env.evaluator.evaluate(env.evaluationContext).candidate?.state).toBe("CONTESTED");
    expect(() => env.recognition.acknowledge(contested.candidateId, learner)).toThrow("not ready");
    expect(() => env.recognition.addContext(contested.candidateId, learner, "extra")).toThrow("not ready");
    expect(env.evidence()).toEqual([]);
  });

  it("only a configured distinct demo reviewer can confirm a contest", () => {
    const env = setup();
    env.recognition.contest(env.candidate.candidateId, learner, "Please review the source sequence.");
    for (const actor of [learner, { ...reviewer, actorId: "someone-else" }, { ...reviewer, organizationId: "foreign" }]) {
      expect(() => env.recognition.resolveContest({ candidateId: env.candidate.candidateId, actor, resolution: "CONFIRM", context: "Review" })).toThrow();
    }
    expect(env.evidence()).toEqual([]);
    const result = env.recognition.resolveContest({ candidateId: env.candidate.candidateId, actor: reviewer, resolution: "CONFIRM", context: "Simulated reviewer confirmed the governed event bundle." });
    expect(result.state).toBe("CONFIRMED");
    expect(env.gateway.getObservation(learner.organizationId, result.observationId)?.confidence).toBe("HUMAN_REVIEWED");
    expect(env.evidence()).toHaveLength(1);
    expect(env.evidence()[0]?.evidenceType).toBe("SYNTHETIC_DEMONSTRATION");
    expect(env.recognition.getAcknowledgementHistory(result.candidateId, learner).map((record) => record.actorId)).toEqual([learner.actorId, reviewer.actorId]);
  });

  it("denies contest resolution by default without configured reviewer authority", () => {
    const env = setup(false);
    env.recognition.contest(env.candidate.candidateId, learner, "Review");
    expect(() => env.recognition.resolveContest({ candidateId: env.candidate.candidateId, actor: reviewer, resolution: "CONFIRM", context: "Review" })).toThrow("configured distinct");
    expect(env.evidence()).toEqual([]);
  });

  it.each(["direct", "contested"])("dismissal (%s) never creates evidence or reopens recognition on retry", (mode) => {
    const env = setup();
    if (mode === "contested") {
      env.recognition.contest(env.candidate.candidateId, learner, "Wrong attribution");
      env.recognition.resolveContest({ candidateId: env.candidate.candidateId, actor: reviewer, resolution: "DISMISS", context: "Confirmed wrong attribution." });
    } else env.recognition.dismiss(env.candidate.candidateId, learner, "Wrong attribution");
    expect(env.evidence()).toEqual([]);
    expect(env.evaluator.evaluate(env.evaluationContext).candidate?.state).toBe("DISMISSED");
    expect(env.gateway.getObservation(learner.organizationId, env.candidate.observationId)?.confidence).toBe("SUPERSEDED");
    expect(() => env.recognition.acknowledge(env.candidate.candidateId, learner)).toThrow("not ready");
  });

  it("requires a reason for context, contest, dismissal and resolution without mutating on failure", () => {
    const env = setup();
    for (const call of [
      () => env.recognition.addContext(env.candidate.candidateId, learner, " "),
      () => env.recognition.contest(env.candidate.candidateId, learner, " "),
      () => env.recognition.dismiss(env.candidate.candidateId, learner, " "),
    ]) expect(call).toThrow("Context is required");
    expect(env.recognition.getAcknowledgementHistory(env.candidate.candidateId, learner)).toEqual([]);
    expect(env.recognition.getNoticeCard(env.candidate.candidateId, learner).state).toBe("READY_TO_ACKNOWLEDGE");
    env.recognition.contest(env.candidate.candidateId, learner, "Review");
    expect(() => env.recognition.resolveContest({ candidateId: env.candidate.candidateId, actor: reviewer, resolution: "CONFIRM", context: " " })).toThrow("Context is required");
    expect(env.evidence()).toEqual([]);
  });

  it("denies every learner read and action across organizations or actors", () => {
    const env = setup();
    for (const actor of [{ ...learner, organizationId: "foreign" }, { ...learner, actorId: "foreign" }]) {
      for (const call of [
        () => env.recognition.getNoticeCard(env.candidate.candidateId, actor),
        () => env.recognition.getAcknowledgementHistory(env.candidate.candidateId, actor),
        () => env.recognition.acknowledge(env.candidate.candidateId, actor),
        () => env.recognition.addContext(env.candidate.candidateId, actor, "context"),
        () => env.recognition.contest(env.candidate.candidateId, actor, "context"),
        () => env.recognition.dismiss(env.candidate.candidateId, actor, "context"),
      ]) expect(call).toThrow();
    }
    expect(env.recognition.getAcknowledgementHistory(env.candidate.candidateId, learner)).toEqual([]);
    expect(env.evidence()).toEqual([]);
  });
});
