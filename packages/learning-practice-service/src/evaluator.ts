import type { PracticeObservation, RecognitionCandidate, SyntheticWorkflowEvent, SyntheticWorkflowEventType } from "@clarity/domain-contracts";
import type { LearningPracticeGateway } from "./gateway.js";
import { stableId } from "./id.js";
import { CONTRADICTION_MODULE_ID, CONTRADICTION_SCENARIO_ID, contradictionRule, contradictionScenario } from "./seed.js";

const PROHIBITED_EVENT_TYPES = new Set<SyntheticWorkflowEventType>(["ADMISSION_RECORDED", "REVENUE_RECORDED", "CENSUS_UPDATED"]);
const BEHAVIOR_EVENT_TYPES = new Set<SyntheticWorkflowEventType>([
  "PRACTICE_SCENARIO_STARTED", "CONTRADICTION_IDENTIFIED", "CONTRADICTION_PRESERVED", "CONTRADICTION_ESCALATED",
  "CONTRADICTION_SILENTLY_RESOLVED", "PRACTICE_SCENARIO_COMPLETED",
]);

export interface EvaluationContext {
  organizationId: string;
  facilityId?: string | null;
  programId?: string | null;
  caseRef: string;
  actorId: string;
  scenarioId: string;
  sessionId: string;
}

export interface EvaluationResult {
  observation: PracticeObservation | null;
  candidate: RecognitionCandidate | null;
  reason: string;
}

const noRecognition = (reason: string): EvaluationResult => ({ observation: null, candidate: null, reason });

export class NoticeAcknowledgeEvaluator {
  constructor(private readonly gateway: LearningPracticeGateway) {}

  evaluate(context: EvaluationContext): EvaluationResult {
    if (context.scenarioId !== CONTRADICTION_SCENARIO_ID || !context.sessionId) return noRecognition("Unsupported scenario or missing session identity");
    // Operational outcomes never influence identity, confidence, completeness, or positive evidence.
    const events = this.gateway.listWorkflowEvents(context.organizationId, context.caseRef, context.actorId, context.scenarioId, context.sessionId)
      .filter((event) => !PROHIBITED_EVENT_TYPES.has(event.eventType));
    if (events.some((event) => event.organizationId !== context.organizationId || event.actorId !== context.actorId ||
      event.caseRef !== context.caseRef || event.scenarioId !== context.scenarioId || event.sessionId !== context.sessionId ||
      !BEHAVIOR_EVENT_TYPES.has(event.eventType) || event.synthetic !== true || event.reviewState !== "SYNTHETIC" ||
      event.schemaVersion !== "1.0.0" || event.dataQuality !== "COMPLETE" || !Number.isFinite(Date.parse(event.recordedAt)))) {
      return noRecognition("Invalid or incomplete synthetic evidence");
    }
    if (events.some((event) => event.eventType === "CONTRADICTION_SILENTLY_RESOLVED")) {
      return noRecognition("Critical error: contradiction was silently resolved");
    }
    const starts = events.filter((event) => event.eventType === "PRACTICE_SCENARIO_STARTED");
    const completions = events.filter((event) => event.eventType === "PRACTICE_SCENARIO_COMPLETED");
    const start = starts[0];
    const completion = completions[0];
    if (!completion) return noRecognition("Scenario is not complete");
    if (!start || starts.length !== 1 || completions.length !== 1 || events[0] !== start || events.at(-1) !== completion) {
      return noRecognition("Invalid practice session event sequence");
    }
    if (events.some((event) => event.facilityId !== start.facilityId || event.programId !== start.programId ||
      Date.parse(event.recordedAt) < Date.parse(start.recordedAt) || Date.parse(event.recordedAt) > Date.parse(completion.recordedAt)) ||
      (context.facilityId !== undefined && context.facilityId !== start.facilityId) ||
      (context.programId !== undefined && context.programId !== start.programId)) {
      return noRecognition("Inconsistent practice session attribution");
    }
    if (events.some((event) => !hasGovernedReferences(event))) return noRecognition("Required governed source references are missing or unsupported");
    const missing = contradictionRule.requiredEvidence.filter((required) => !events.some((event) => event.eventType === required));
    if (missing.length) return noRecognition(`Missing required evidence: ${missing.join(", ")}`);
    const requiredOrder = contradictionRule.requiredEvidence.map((required) => events.findIndex((event) => event.eventType === required));
    if (requiredOrder.some((index, position) => position > 0 && index <= requiredOrder[position - 1]!)) {
      return noRecognition(`Required behavior was not recorded in the declared order: ${contradictionRule.requiredEvidence.join(" -> ")}`);
    }

    const relevantEvents = events.filter((event) => [...contradictionRule.requiredEvidence, "PRACTICE_SCENARIO_COMPLETED"].includes(event.eventType));
    const observationId = stableId("obs", [context.organizationId, context.caseRef, context.actorId, context.sessionId,
      context.scenarioId, contradictionRule.ruleId, contradictionRule.version, ...relevantEvents.map((event) => event.eventId).sort()]);
    const existingCandidate = this.gateway.getCandidateByObservation(context.organizationId, observationId);
    const existingObservation = this.gateway.getObservation(context.organizationId, observationId);
    if (existingObservation && existingCandidate) {
      return { observation: existingObservation, candidate: existingCandidate, reason: "Existing deterministic result returned" };
    }
    const observation: PracticeObservation = {
      observationId,
      organizationId: context.organizationId,
      facilityId: start.facilityId,
      programId: start.programId,
      actorId: context.actorId,
      competencyId: contradictionRule.competencyId,
      ruleId: contradictionRule.ruleId,
      ruleVersion: contradictionRule.version,
      state: "READY_TO_ACKNOWLEDGE",
      confidence: "DETERMINISTIC",
      evidenceRefs: [...new Set(relevantEvents.flatMap((event) => [event.eventId, ...event.evidenceRefs]))].sort(),
      caseRef: context.caseRef,
      episodeRef: null,
      observedAt: completion.recordedAt,
      moduleVersion: `${CONTRADICTION_MODULE_ID}@1.0.0`,
      organizationEdition: contradictionRule.organizationEdition,
    };
    const candidate: RecognitionCandidate = {
      candidateId: stableId("cand", [observationId, "RECOGNITION"]),
      organizationId: context.organizationId,
      observationId,
      type: "RECOGNITION",
      state: "READY_TO_ACKNOWLEDGE",
      reviewOwnerId: null,
      createdAt: completion.recordedAt,
    };
    this.gateway.saveObservation(context.organizationId, observation);
    this.gateway.saveCandidate(context.organizationId, candidate);
    return { observation, candidate, reason: "Deterministic synthetic evidence supports recognition" };
  }
}

function hasGovernedReferences(event: SyntheticWorkflowEvent): boolean {
  if (!Array.isArray(event.evidenceRefs)) return false;
  const required = event.eventType === "CONTRADICTION_IDENTIFIED" || event.eventType === "CONTRADICTION_PRESERVED"
    ? contradictionScenario.initialFacts.map((fact) => fact.factId)
    : event.eventType === "CONTRADICTION_ESCALATED" ? ["review-queue:clinical"] : [];
  return event.evidenceRefs.every((reference) => required.includes(reference)) && required.every((reference) => event.evidenceRefs.includes(reference));
}
