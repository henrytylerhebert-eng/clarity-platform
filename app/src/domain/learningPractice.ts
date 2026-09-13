/** Standalone, in-memory synthetic vocabulary mirrored from learning-practice-service.
 * Demo actor checks are integrity guards, not production authentication or authorization.
 * No clinical Episode, patient-store access, API calls, or persistence belongs here.
 */
function immutable<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value).forEach(immutable);
    Object.freeze(value);
  }
  return value;
}
export const CENTRAL_INTAKE_ROLE = "INTAKE_COORDINATOR";
export const learningModule = immutable({
  moduleId: "MOD-EI-03", version: "1.0.0", title: "Contradictions & Source Reliability",
  status: "ACTIVE", organizationEdition: "SYNTHETIC_DEMO",
});
export const centralIntakePathway = immutable({
  pathwayId: "PATH-CENTRAL-INTAKE-001", version: "1.0.0", roleFamily: CENTRAL_INTAKE_ROLE,
  moduleIds: [learningModule.moduleId],
});
export const contradictionRule = immutable({
  ruleId: "OBS-EI-03", version: "1.0.0", competencyId: "COMP-EI-03",
  prohibitedInputs: ["Admissions", "Census", "Revenue", "Referral conversion", "Length of stay", "Denial rate", "Patient disposition", "Case readiness"],
});
export const contradictionScenario = immutable({
  scenarioId: "SCN-EI-03", version: "1.0.0", title: "Preserve Contradictory Collateral",
  roleFamily: CENTRAL_INTAKE_ROLE,
  initialFacts: [
    { factId: "FACT-A", sourceLabel: "Synthetic sending-nurse collateral", statement: "At simulated handoff checkpoint T0, the patient was oriented to person, place, time, and situation and denied current thoughts of death.", sourceReliability: "MODERATE" },
    { factId: "FACT-B", sourceLabel: "Synthetic field-responder note", statement: "At simulated handoff checkpoint T0, the patient was not oriented to place and reported current passive thoughts of death.", sourceReliability: "MODERATE" },
  ],
});
export type ScenarioAction = "IDENTIFY_CONTRADICTION" | "PRESERVE_BOTH_SOURCES" | "ESCALATE_FOR_REVIEW" | "SILENTLY_RESOLVE_CONTRADICTION" | "COMPLETE_SCENARIO";
export const practiceActions: { action: ScenarioAction; label: string }[] = [
  { action: "IDENTIFY_CONTRADICTION", label: "Identify contradiction" },
  { action: "PRESERVE_BOTH_SOURCES", label: "Preserve both sources" },
  { action: "ESCALATE_FOR_REVIEW", label: "Escalate for review" },
  { action: "SILENTLY_RESOLVE_CONTRADICTION", label: "Silently resolve contradiction (critical error)" },
];
/** The three governed behaviors must be recorded in this order; the critical-error path is always available. */
const ORDERED_PRACTICE_BEHAVIORS: ScenarioAction[] = ["IDENTIFY_CONTRADICTION", "PRESERVE_BOTH_SOURCES", "ESCALATE_FOR_REVIEW"];
export function isPracticeActionAvailable(action: ScenarioAction, completedActions: ScenarioAction[]): boolean {
  const position = ORDERED_PRACTICE_BEHAVIORS.indexOf(action);
  if (position < 0) return true;
  return ORDERED_PRACTICE_BEHAVIORS.slice(0, position).every(prior => completedActions.includes(prior));
}
const actionEvents = {
  IDENTIFY_CONTRADICTION: "CONTRADICTION_IDENTIFIED",
  PRESERVE_BOTH_SOURCES: "CONTRADICTION_PRESERVED",
  ESCALATE_FOR_REVIEW: "CONTRADICTION_ESCALATED",
  SILENTLY_RESOLVE_CONTRADICTION: "CONTRADICTION_SILENTLY_RESOLVED",
  COMPLETE_SCENARIO: "PRACTICE_SCENARIO_COMPLETED",
} as const;
export type SyntheticWorkflowEventType = typeof actionEvents[ScenarioAction] | "PRACTICE_SCENARIO_STARTED" | "ADMISSION_RECORDED" | "REVENUE_RECORDED" | "CENSUS_UPDATED";
export interface ActorScope { organizationId: string; actorId: string; roleFamily: string }
export const demoLearner: ActorScope = immutable({ organizationId: "SYNTHETIC_DEMO", actorId: "synthetic-learner", roleFamily: CENTRAL_INTAKE_ROLE });
export const demoReviewer: ActorScope = immutable({ organizationId: "SYNTHETIC_DEMO", actorId: "synthetic-reviewer", roleFamily: "CLINICAL_REVIEWER" });
export interface SyntheticWorkflowEvent {
  eventId: string; sessionId: string; organizationId: string; actorId: string; scenarioId: string;
  eventType: SyntheticWorkflowEventType; recordedAt: string; synthetic: true;
  dataQuality: "COMPLETE" | "PARTIAL" | "UNKNOWN"; evidenceRefs: string[];
}
export interface PracticeObservation {
  observationId: string; organizationId: string; actorId: string; competencyId: string;
  ruleId: string; ruleVersion: string; moduleVersion: string;
  confidence: "DETERMINISTIC" | "CONTESTED" | "HUMAN_REVIEWED" | "SUPERSEDED";
  evidenceRefs: string[]; episodeRef: null;
}
export interface RecognitionCandidate {
  candidateId: string; observationId: string; organizationId: string;
  state: "READY_TO_ACKNOWLEDGE" | "CONTESTED" | "CONFIRMED" | "DISMISSED";
}
export interface CompetencyEvidence {
  evidenceId: string; organizationId: string; personId: string; roleScope: string; competencyId: string;
  evidenceType: "SYNTHETIC_DEMONSTRATION"; sourceRef: string;
}
export type NoticeAction = "ACKNOWLEDGE" | "ADD_CONTEXT" | "CONTEST" | "DISMISS" | "CONFIRM_CONTEST" | "DISMISS_CONTEST";
export interface PracticeState {
  sessionId: string; owner: ActorScope; actions: ScenarioAction[]; events: SyntheticWorkflowEvent[];
  completed: boolean; observation: PracticeObservation | null; candidate: RecognitionCandidate | null;
  evidence: CompetencyEvidence[]; history: { actorId: string; action: NoticeAction; context: string }[];
  reason: string;
}
function assertRecognitionScope(state: PracticeState) {
  const { candidate, observation, owner } = state;
  if (!candidate && !observation) return;
  if (!candidate || !observation || candidate.organizationId !== owner.organizationId || observation.organizationId !== owner.organizationId || observation.actorId !== owner.actorId || candidate.observationId !== observation.observationId) throw new Error("Recognition records do not belong to this learner and organization");
}
function assertOwner(state: PracticeState, actor: ActorScope) {
  if (state.owner.organizationId !== actor.organizationId) throw new Error("Cross-organization access denied");
  if (state.owner.actorId !== actor.actorId || actor.roleFamily !== CENTRAL_INTAKE_ROLE) throw new Error("Only the owning learner may access this practice");
  assertRecognitionScope(state);
}
export function readPractice(state: PracticeState, actor: ActorScope): PracticeState {
  assertOwner(state, actor);
  return structuredClone(state);
}
function eventFor(state: PracticeState, eventType: SyntheticWorkflowEventType, evidenceRefs: string[]): SyntheticWorkflowEvent {
  return {
    eventId: `${state.sessionId}:event:${state.events.length + 1}`, sessionId: state.sessionId,
    organizationId: state.owner.organizationId, actorId: state.owner.actorId,
    scenarioId: contradictionScenario.scenarioId, eventType, recordedAt: new Date().toISOString(),
    synthetic: true, dataQuality: "COMPLETE", evidenceRefs,
  };
}
export function startPractice(actor: ActorScope = demoLearner): PracticeState {
  if (actor.roleFamily !== CENTRAL_INTAKE_ROLE) throw new Error("Role is not eligible for this scenario");
  if (!actor.organizationId.trim() || !actor.actorId.trim()) throw new Error("Practice owner and organization are required");
  const state: PracticeState = {
    sessionId: `synthetic-practice:${crypto.randomUUID()}`, owner: { ...actor }, actions: [], events: [], completed: false,
    observation: null, candidate: null, evidence: [], history: [], reason: "Scenario is not complete",
  };
  state.events.push(eventFor(state, "PRACTICE_SCENARIO_STARTED", []));
  return state;
}
export function recordPracticeAction(state: PracticeState, actor: ActorScope, action: ScenarioAction): PracticeState {
  assertOwner(state, actor);
  if (!Object.prototype.hasOwnProperty.call(actionEvents, action)) throw new Error("Unknown practice action");
  if (state.completed) throw new Error("Practice is complete; reset to start another attempt");
  if (state.actions.includes(action)) return state;
  const next = structuredClone(state);
  next.events.push(eventFor(next, actionEvents[action], action === "COMPLETE_SCENARIO" ? [] : action === "ESCALATE_FOR_REVIEW" ? ["review-queue:clinical"] : ["FACT-A", "FACT-B"]));
  next.actions.push(action);
  next.completed = action === "COMPLETE_SCENARIO";
  return next;
}
/** Evaluation is tied to this complete attempt and ignores all outcome inputs. */
export function evaluatePractice(state: PracticeState, actor: ActorScope): PracticeState {
  assertOwner(state, actor);
  const governedTypes = ["CONTRADICTION_IDENTIFIED", "CONTRADICTION_PRESERVED", "CONTRADICTION_ESCALATED", "PRACTICE_SCENARIO_COMPLETED"];
  const outcomes = ["ADMISSION_RECORDED", "REVENUE_RECORDED", "CENSUS_UPDATED"];
  const governed = state.events.filter(event => !outcomes.includes(event.eventType));
  const relevant = governed.filter(event => governedTypes.includes(event.eventType));
  const reject = (reason: string): PracticeState => ({ ...state, reason, observation: null, candidate: null, evidence: [] });
  const starts = governed.filter(event => event.eventType === "PRACTICE_SCENARIO_STARTED");
  const completions = governed.filter(event => event.eventType === "PRACTICE_SCENARIO_COMPLETED");
  if (!state.completed || !completions.length) return reject("Scenario is not complete");
  if (governed.some(event => event.organizationId !== actor.organizationId || event.actorId !== actor.actorId || event.sessionId !== state.sessionId || event.scenarioId !== contradictionScenario.scenarioId || event.synthetic !== true || event.dataQuality !== "COMPLETE" || !Number.isFinite(Date.parse(event.recordedAt)))) return reject("Invalid, foreign, or incomplete practice evidence");
  if (starts.length !== 1 || completions.length !== 1 || governed[0] !== starts[0] || governed[governed.length - 1] !== completions[0] || new Set(governed.map(event => event.eventId)).size !== governed.length || governed.some((event, index) => index > 0 && Date.parse(event.recordedAt) < Date.parse(governed[index - 1].recordedAt))) return reject("Invalid practice lifecycle or event sequence");
  if (governed.some(event => event.eventType === "CONTRADICTION_SILENTLY_RESOLVED")) return reject("Critical error: contradiction was silently resolved. Reset for a new attempt.");
  const missing = governedTypes.filter(type => !relevant.some(event => event.eventType === type));
  if (missing.length) return reject(`Missing required evidence: ${missing.join(", ")}`);
  const orderedBehaviors = governedTypes.slice(0, 3);
  const orderIndexes = orderedBehaviors.map(type => governed.findIndex(event => event.eventType === type));
  if (orderIndexes.some((index, position) => position > 0 && index <= orderIndexes[position - 1]!)) {
    return reject(`Required behavior was not recorded in the declared order: ${orderedBehaviors.join(" -> ")}`);
  }
  const requiredRefs: Partial<Record<SyntheticWorkflowEventType, string[]>> = {
    PRACTICE_SCENARIO_STARTED: [], PRACTICE_SCENARIO_COMPLETED: [],
    CONTRADICTION_IDENTIFIED: ["FACT-A", "FACT-B"], CONTRADICTION_PRESERVED: ["FACT-A", "FACT-B"],
    CONTRADICTION_ESCALATED: ["review-queue:clinical"],
  };
  if (governed.some(event => {
    const refs = requiredRefs[event.eventType];
    return !refs || event.evidenceRefs.length !== refs.length || !refs.every(ref => event.evidenceRefs.includes(ref));
  })) return reject("Action evidence must reference both source facts or the clinical review queue as required");
  // Full length-delimited tuple avoids ambiguous joins or a short, collision-prone hash.
  const observationId = `obs:${JSON.stringify([actor.organizationId, actor.actorId, state.sessionId, contradictionRule.ruleId, contradictionRule.version, relevant.map(event => event.eventId).sort()])}`;
  if (state.observation?.observationId === observationId && state.candidate) return state;
  const observation: PracticeObservation = {
    observationId, organizationId: actor.organizationId, actorId: actor.actorId,
    competencyId: contradictionRule.competencyId, ruleId: contradictionRule.ruleId, ruleVersion: contradictionRule.version,
    moduleVersion: `${learningModule.moduleId}@${learningModule.version}`, confidence: "DETERMINISTIC",
    evidenceRefs: [...new Set(relevant.flatMap(event => [event.eventId, ...event.evidenceRefs]))], episodeRef: null,
  };
  return { ...state, observation, candidate: { candidateId: `candidate:${observationId}`, organizationId: actor.organizationId, observationId, state: "READY_TO_ACKNOWLEDGE" }, reason: "Governed synthetic behavior evidence supports a recognition candidate" };
}
export function applyNoticeAction(state: PracticeState, actor: ActorScope, action: NoticeAction, context = "", configuredReviewer?: ActorScope): PracticeState {
  if (state.owner.organizationId !== actor.organizationId) throw new Error("Cross-organization access denied");
  const isResolution = action === "CONFIRM_CONTEST" || action === "DISMISS_CONTEST";
  if (isResolution) {
    if (!configuredReviewer || actor.organizationId !== configuredReviewer.organizationId || actor.actorId !== configuredReviewer.actorId || actor.roleFamily !== configuredReviewer.roleFamily || actor.actorId === state.owner.actorId) throw new Error("A separate synthetic reviewer is required");
  } else assertOwner(state, actor);
  assertRecognitionScope(state);
  if (!state.candidate || !state.observation) throw new Error("No recognition candidate");
  if (isResolution ? state.candidate.state !== "CONTESTED" : state.candidate.state !== "READY_TO_ACKNOWLEDGE") throw new Error("Action is not available in the current recognition state");
  if (action !== "ACKNOWLEDGE" && !context.trim()) throw new Error("Synthetic context is required");
  if (!["ACKNOWLEDGE", "ADD_CONTEXT", "CONTEST", "DISMISS", "CONFIRM_CONTEST", "DISMISS_CONTEST"].includes(action)) throw new Error("Unknown notice action");
  const next = structuredClone(state);
  const candidate = next.candidate!;
  const observation = next.observation!;
  next.history.push({ actorId: actor.actorId, action, context: context.trim() });
  if (action === "CONTEST") {
    candidate.state = "CONTESTED";
    observation.confidence = "CONTESTED";
    next.evidence = [];
  } else if (action === "DISMISS" || action === "DISMISS_CONTEST") {
    candidate.state = "DISMISSED";
    observation.confidence = "SUPERSEDED";
    next.evidence = [];
  } else if (action === "ACKNOWLEDGE" || action === "CONFIRM_CONTEST") {
    candidate.state = "CONFIRMED";
    if (isResolution) observation.confidence = "HUMAN_REVIEWED";
    next.evidence = [{ evidenceId: `evidence:${candidate.candidateId}`, organizationId: state.owner.organizationId, personId: state.owner.actorId,
      roleScope: CENTRAL_INTAKE_ROLE, competencyId: observation.competencyId, evidenceType: "SYNTHETIC_DEMONSTRATION", sourceRef: observation.observationId }];
  }
  return next;
}
