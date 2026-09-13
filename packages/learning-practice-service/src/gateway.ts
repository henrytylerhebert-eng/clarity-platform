import { assertSameOrganization } from "@clarity/domain-contracts";
import type {
  Acknowledgement,
  CompetencyEvidence,
  PracticeObservation,
  RecognitionCandidate,
  SyntheticWorkflowEvent,
} from "@clarity/domain-contracts";

export interface LearningPracticeGateway {
  appendWorkflowEvent(organizationId: string, event: SyntheticWorkflowEvent): void;
  listWorkflowEvents(organizationId: string, caseRef: string, actorId: string, scenarioId: string, sessionId: string): SyntheticWorkflowEvent[];
  saveObservation(organizationId: string, observation: PracticeObservation): void;
  getObservation(organizationId: string, observationId: string): PracticeObservation | undefined;
  saveCandidate(organizationId: string, candidate: RecognitionCandidate): void;
  getCandidate(organizationId: string, candidateId: string): RecognitionCandidate | undefined;
  getCandidateByObservation(organizationId: string, observationId: string): RecognitionCandidate | undefined;
  saveAcknowledgement(organizationId: string, record: Acknowledgement): void;
  listAcknowledgements(organizationId: string, candidateId: string): Acknowledgement[];
  saveCompetencyEvidence(organizationId: string, evidence: CompetencyEvidence): void;
  listCompetencyEvidence(organizationId: string, personId: string, competencyId?: string): CompetencyEvidence[];
}

const key = (organizationId: string, id: string) => JSON.stringify([organizationId, id]);
const copy = <T>(value: T): T => structuredClone(value);

/** Process-local synthetic adapter. Callers are trusted in-process services, not authenticated API clients. */
export class InMemoryLearningPracticeGateway implements LearningPracticeGateway {
  private events = new Map<string, SyntheticWorkflowEvent>();
  private observations = new Map<string, PracticeObservation>();
  private candidates = new Map<string, RecognitionCandidate>();
  private acknowledgements = new Map<string, Acknowledgement>();
  private competencyEvidence = new Map<string, CompetencyEvidence>();

  appendWorkflowEvent(organizationId: string, event: SyntheticWorkflowEvent): void {
    assertSameOrganization(organizationId, event);
    if (event.synthetic !== true || event.reviewState !== "SYNTHETIC") throw new Error("Only synthetic events are supported");
    this.append(this.events, organizationId, event.eventId, event);
  }

  listWorkflowEvents(organizationId: string, caseRef: string, actorId: string, scenarioId: string, sessionId: string): SyntheticWorkflowEvent[] {
    return [...this.events.values()].filter((event) =>
      event.organizationId === organizationId && event.caseRef === caseRef && event.actorId === actorId &&
      event.scenarioId === scenarioId && event.sessionId === sessionId,
    ).map(copy);
  }

  saveObservation(organizationId: string, observation: PracticeObservation): void {
    assertSameOrganization(organizationId, observation);
    const existing = this.getObservation(organizationId, observation.observationId);
    if (existing && JSON.stringify({ ...existing, state: observation.state, confidence: observation.confidence }) !== JSON.stringify(observation)) {
      throw new Error("Observation attribution and evidence are immutable");
    }
    this.observations.set(key(organizationId, observation.observationId), copy(observation));
  }

  getObservation(organizationId: string, observationId: string): PracticeObservation | undefined {
    return copy(this.observations.get(key(organizationId, observationId)));
  }

  saveCandidate(organizationId: string, candidate: RecognitionCandidate): void {
    assertSameOrganization(organizationId, candidate);
    if (!this.getObservation(organizationId, candidate.observationId)) throw new Error("Practice observation not found in organization");
    const existing = this.getCandidate(organizationId, candidate.candidateId);
    const linked = this.getCandidateByObservation(organizationId, candidate.observationId);
    if (linked && linked.candidateId !== candidate.candidateId) throw new Error("Observation already has a recognition candidate");
    if (existing) {
      if (existing.observationId !== candidate.observationId || existing.type !== candidate.type || existing.createdAt !== candidate.createdAt) {
        throw new Error("Candidate attribution is immutable");
      }
      const allowed = existing.state === "READY_TO_ACKNOWLEDGE" ? ["CONTESTED", "CONFIRMED", "DISMISSED"]
        : existing.state === "CONTESTED" ? ["CONFIRMED", "DISMISSED"] : [];
      if (candidate.state !== existing.state && !allowed.includes(candidate.state)) throw new Error("Invalid recognition state transition");
    }
    this.candidates.set(key(organizationId, candidate.candidateId), copy(candidate));
  }

  getCandidate(organizationId: string, candidateId: string): RecognitionCandidate | undefined {
    return copy(this.candidates.get(key(organizationId, candidateId)));
  }

  getCandidateByObservation(organizationId: string, observationId: string): RecognitionCandidate | undefined {
    return copy([...this.candidates.values()].find((candidate) => candidate.organizationId === organizationId && candidate.observationId === observationId));
  }

  saveAcknowledgement(organizationId: string, record: Acknowledgement): void {
    assertSameOrganization(organizationId, record);
    if (!this.getCandidate(organizationId, record.candidateId)) throw new Error("Recognition candidate not found in organization");
    this.append(this.acknowledgements, organizationId, record.acknowledgementId, record);
  }

  listAcknowledgements(organizationId: string, candidateId: string): Acknowledgement[] {
    return [...this.acknowledgements.values()].filter((record) => record.organizationId === organizationId && record.candidateId === candidateId).map(copy);
  }

  saveCompetencyEvidence(organizationId: string, evidence: CompetencyEvidence): void {
    assertSameOrganization(organizationId, evidence);
    const observation = this.getObservation(organizationId, evidence.sourceRef);
    const candidate = this.getCandidateByObservation(organizationId, evidence.sourceRef);
    if (!observation || observation.actorId !== evidence.personId || observation.competencyId !== evidence.competencyId ||
      candidate?.state !== "CONFIRMED" || observation.confidence === "CONTESTED" || observation.state === "SUPERSEDED" ||
      evidence.evidenceType !== "SYNTHETIC_DEMONSTRATION") {
      throw new Error("Confirmed synthetic observation is required for competency evidence");
    }
    this.append(this.competencyEvidence, organizationId, evidence.evidenceId, evidence);
  }

  listCompetencyEvidence(organizationId: string, personId: string, competencyId?: string): CompetencyEvidence[] {
    return [...this.competencyEvidence.values()].filter((record) => record.organizationId === organizationId && record.personId === personId &&
      (competencyId === undefined || record.competencyId === competencyId)).map(copy);
  }

  private append<T>(store: Map<string, T>, organizationId: string, id: string, value: T): void {
    const recordKey = key(organizationId, id);
    const existing = store.get(recordKey);
    if (existing !== undefined) {
      if (JSON.stringify(existing) !== JSON.stringify(value)) throw new Error("Conflicting immutable record identity");
      return;
    }
    store.set(recordKey, copy(value));
  }
}
