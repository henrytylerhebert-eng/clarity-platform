import { randomUUID } from "node:crypto";
import type { ScenarioAction, SyntheticWorkflowEvent, SyntheticWorkflowEventType, UserRole } from "@clarity/domain-contracts";
import type { LearningPracticeGateway } from "./gateway.js";
import { stableId } from "./id.js";
import { CONTRADICTION_SCENARIO_ID, contradictionScenario } from "./seed.js";

export interface SyntheticPracticeContext {
  organizationId: string;
  facilityId?: string | null;
  programId?: string | null;
  caseRef: string;
  actorId: string;
  roleFamily: UserRole;
}

export interface PracticeSession {
  sessionId: string;
  context: SyntheticPracticeContext;
  scenarioId: string;
  startedAt: string;
  actions: ScenarioAction[];
  completedAt: string | null;
}

const ACTION_EVENT: Record<Exclude<ScenarioAction, "COMPLETE_SCENARIO">, SyntheticWorkflowEventType> = {
  IDENTIFY_CONTRADICTION: "CONTRADICTION_IDENTIFIED",
  PRESERVE_BOTH_SOURCES: "CONTRADICTION_PRESERVED",
  ESCALATE_FOR_REVIEW: "CONTRADICTION_ESCALATED",
  SILENTLY_RESOLVE_CONTRADICTION: "CONTRADICTION_SILENTLY_RESOLVED",
};

export class PracticeLabService {
  private sessions = new Map<string, PracticeSession>();

  constructor(private readonly gateway: LearningPracticeGateway, private readonly now: () => string = () => new Date().toISOString()) {}

  getScenario(scenarioId = CONTRADICTION_SCENARIO_ID) {
    if (scenarioId !== contradictionScenario.scenarioId) throw new Error("Scenario not found");
    return structuredClone(contradictionScenario);
  }

  start(context: SyntheticPracticeContext, scenarioId = CONTRADICTION_SCENARIO_ID): PracticeSession {
    this.getScenario(scenarioId);
    if (context.roleFamily !== contradictionScenario.roleFamily) throw new Error("Role is not eligible for this scenario");
    if (![context.organizationId, context.actorId, context.caseRef].every((value) => typeof value === "string" && value.trim())) {
      throw new Error("Organization, actor and synthetic case reference are required");
    }
    const session: PracticeSession = {
      sessionId: `session-${randomUUID()}`,
      context: { ...context, facilityId: context.facilityId ?? null, programId: context.programId ?? null },
      scenarioId, startedAt: this.now(), actions: [], completedAt: null,
    };
    this.emit(session, "PRACTICE_SCENARIO_STARTED", []);
    this.sessions.set(this.key(context.organizationId, session.sessionId), session);
    return structuredClone(session);
  }

  act(organizationId: string, actorId: string, sessionId: string, action: Exclude<ScenarioAction, "COMPLETE_SCENARIO">, evidenceRefs: string[] = []): PracticeSession {
    const session = this.requireSession(organizationId, actorId, sessionId);
    if (session.completedAt) throw new Error("Practice session is already complete");
    if (!Object.hasOwn(ACTION_EVENT, action)) throw new Error("Unsupported practice action");
    const updated = { ...session, actions: [...session.actions, action] };
    this.emit(updated, ACTION_EVENT[action], evidenceRefs);
    this.sessions.set(this.key(organizationId, sessionId), updated);
    return structuredClone(updated);
  }

  complete(organizationId: string, actorId: string, sessionId: string): PracticeSession {
    const session = this.requireSession(organizationId, actorId, sessionId);
    if (session.completedAt) throw new Error("Practice session is already complete");
    const updated: PracticeSession = { ...session, actions: [...session.actions, "COMPLETE_SCENARIO"], completedAt: this.now() };
    this.emit(updated, "PRACTICE_SCENARIO_COMPLETED", []);
    this.sessions.set(this.key(organizationId, sessionId), updated);
    return structuredClone(updated);
  }

  getSession(organizationId: string, actorId: string, sessionId: string): PracticeSession | undefined {
    const session = this.sessions.get(this.key(organizationId, sessionId));
    if (session && session.context.actorId !== actorId) throw new Error("Actor does not own this practice session");
    return session ? structuredClone(session) : undefined;
  }

  private key(organizationId: string, sessionId: string) { return JSON.stringify([organizationId, sessionId]); }

  private requireSession(organizationId: string, actorId: string, sessionId: string): PracticeSession {
    const session = this.getSession(organizationId, actorId, sessionId);
    if (!session) throw new Error("Practice session not found in organization");
    return session;
  }

  private emit(session: PracticeSession, eventType: SyntheticWorkflowEventType, evidenceRefs: string[]): void {
    const event: SyntheticWorkflowEvent = {
      eventId: stableId("evt", [session.sessionId, eventType, String(session.actions.length)]),
      sessionId: session.sessionId,
      schemaVersion: "1.0.0",
      organizationId: session.context.organizationId,
      facilityId: session.context.facilityId ?? null,
      programId: session.context.programId ?? null,
      caseRef: session.context.caseRef,
      actorId: session.context.actorId,
      eventType,
      recordedAt: this.now(),
      synthetic: true,
      scenarioId: session.scenarioId,
      dataQuality: "COMPLETE",
      reviewState: "SYNTHETIC",
      evidenceRefs: [...evidenceRefs],
    };
    this.gateway.appendWorkflowEvent(session.context.organizationId, event);
  }
}
