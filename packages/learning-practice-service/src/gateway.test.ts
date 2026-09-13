import { describe, expect, it } from "vitest";
import type { Acknowledgement, CompetencyEvidence, PracticeObservation, RecognitionCandidate, SyntheticWorkflowEvent } from "@clarity/domain-contracts";
import { InMemoryLearningPracticeGateway } from "./gateway.js";

const org = "org-synthetic";
const other = "other-synthetic-org";
const time = "2026-09-13T01:00:00.000Z";
const observation: PracticeObservation = {
  observationId: "observation-synthetic", organizationId: org, facilityId: null, programId: null, actorId: "same-learner",
  competencyId: "COMP-EI-03", ruleId: "OBS-EI-03", ruleVersion: "1.0.0", state: "READY_TO_ACKNOWLEDGE", confidence: "DETERMINISTIC",
  evidenceRefs: ["FACT-A", "FACT-B"], caseRef: "case-synthetic", episodeRef: null, observedAt: time, moduleVersion: "MOD-EI-03@1.0.0", organizationEdition: "SYNTHETIC_DEMO",
};
const candidate: RecognitionCandidate = { organizationId: org, candidateId: "candidate-synthetic", observationId: observation.observationId, type: "RECOGNITION", state: "READY_TO_ACKNOWLEDGE", reviewOwnerId: null, createdAt: time };
const acknowledgement: Acknowledgement = { organizationId: org, acknowledgementId: "ack-synthetic", candidateId: candidate.candidateId, actorId: observation.actorId, action: "ACKNOWLEDGE", context: null, recordedAt: time };
const evidence: CompetencyEvidence = { organizationId: org, evidenceId: "evidence-synthetic", personId: observation.actorId, roleScope: "INTAKE_COORDINATOR", competencyId: observation.competencyId, evidenceType: "SYNTHETIC_DEMONSTRATION", sourceRef: observation.observationId, validUntil: null, recordedAt: time };
const event: SyntheticWorkflowEvent = { organizationId: org, eventId: "event-synthetic", sessionId: "session-synthetic", schemaVersion: "1.0.0", facilityId: null, programId: null, caseRef: "case-synthetic", actorId: observation.actorId, eventType: "PRACTICE_SCENARIO_STARTED", recordedAt: time, synthetic: true, scenarioId: "SCN-EI-03", dataQuality: "COMPLETE", reviewState: "SYNTHETIC", evidenceRefs: [] };
function setup() {
  const gateway = new InMemoryLearningPracticeGateway();
  gateway.saveObservation(org, observation);
  gateway.saveCandidate(org, candidate);
  return gateway;
}

describe("organization-scoped in-memory learning gateway", () => {
  it("denies mismatched organization writes for every record kind", () => {
    const gateway = setup();
    for (const write of [
      () => gateway.appendWorkflowEvent(other, event),
      () => gateway.saveObservation(other, observation),
      () => gateway.saveCandidate(other, candidate),
      () => gateway.saveAcknowledgement(other, acknowledgement),
      () => gateway.saveCompetencyEvidence(other, evidence),
    ]) expect(write).toThrow("Cross-organization");
  });

  it("cannot link candidate, history or competency records to another organization's source", () => {
    const gateway = setup();
    expect(() => gateway.saveCandidate(other, { ...candidate, organizationId: other })).toThrow("not found");
    expect(() => gateway.saveAcknowledgement(other, { ...acknowledgement, organizationId: other })).toThrow("not found");
    expect(() => gateway.saveCompetencyEvidence(other, { ...evidence, organizationId: other })).toThrow("required");
    expect(gateway.getObservation(other, observation.observationId)).toBeUndefined();
    expect(gateway.getCandidate(other, candidate.candidateId)).toBeUndefined();
    expect(gateway.getCandidateByObservation(other, observation.observationId)).toBeUndefined();
  });

  it("supports identical record and learner IDs in separate organizations without overwriting or leaking", () => {
    const gateway = setup();
    gateway.saveObservation(other, { ...observation, organizationId: other, confidence: "INSUFFICIENT_EVIDENCE" });
    gateway.saveCandidate(other, { ...candidate, organizationId: other });
    gateway.saveCandidate(org, { ...candidate, state: "CONFIRMED" });
    gateway.saveAcknowledgement(org, acknowledgement);
    gateway.saveCompetencyEvidence(org, evidence);
    gateway.appendWorkflowEvent(org, event);
    gateway.appendWorkflowEvent(other, { ...event, organizationId: other, evidenceRefs: ["other"] });
    expect(gateway.getObservation(org, observation.observationId)?.confidence).toBe("DETERMINISTIC");
    expect(gateway.getObservation(other, observation.observationId)?.confidence).toBe("INSUFFICIENT_EVIDENCE");
    expect(gateway.getCandidate(other, candidate.candidateId)?.state).toBe("READY_TO_ACKNOWLEDGE");
    expect(gateway.listAcknowledgements(other, candidate.candidateId)).toEqual([]);
    expect(gateway.listCompetencyEvidence(other, observation.actorId)).toEqual([]);
    expect(gateway.listCompetencyEvidence(org, observation.actorId)).toHaveLength(1);
    expect(gateway.listWorkflowEvents(org, event.caseRef, event.actorId, event.scenarioId, event.sessionId)[0]?.evidenceRefs).toEqual([]);
    expect(gateway.listWorkflowEvents(org, event.caseRef, event.actorId, event.scenarioId, "other-session")).toEqual([]);
  });

  it("clones inputs and reads so consumers cannot alter stored evidence or event history", () => {
    const gateway = setup();
    const mutable = structuredClone(event);
    gateway.appendWorkflowEvent(org, mutable);
    mutable.evidenceRefs.push("tampered");
    const read = gateway.getObservation(org, observation.observationId)!;
    read.evidenceRefs.length = 0;
    expect(gateway.getObservation(org, observation.observationId)?.evidenceRefs).toEqual(["FACT-A", "FACT-B"]);
    const events = gateway.listWorkflowEvents(org, event.caseRef, event.actorId, event.scenarioId, event.sessionId);
    events[0]!.evidenceRefs.push("tampered again");
    expect(gateway.listWorkflowEvents(org, event.caseRef, event.actorId, event.scenarioId, event.sessionId)[0]?.evidenceRefs).toEqual([]);
  });

  it("deduplicates immutable records and rejects conflicting event/history identities", () => {
    const gateway = setup();
    gateway.appendWorkflowEvent(org, event);
    gateway.appendWorkflowEvent(org, event);
    expect(gateway.listWorkflowEvents(org, event.caseRef, event.actorId, event.scenarioId, event.sessionId)).toHaveLength(1);
    expect(() => gateway.appendWorkflowEvent(org, { ...event, actorId: "someone-else" })).toThrow("Conflicting immutable");
    gateway.saveAcknowledgement(org, acknowledgement);
    gateway.saveAcknowledgement(org, acknowledgement);
    expect(gateway.listAcknowledgements(org, candidate.candidateId)).toHaveLength(1);
    expect(() => gateway.saveAcknowledgement(org, { ...acknowledgement, context: "changed" })).toThrow("Conflicting immutable");
  });

  it("freezes attribution, candidate terminal transitions and contested evidence at the adapter boundary", () => {
    const gateway = setup();
    expect(() => gateway.saveObservation(org, { ...observation, actorId: "other" })).toThrow("immutable");
    expect(() => gateway.saveCandidate(org, { ...candidate, candidateId: "extra-candidate" })).toThrow("already has");
    expect(() => gateway.saveCompetencyEvidence(org, evidence)).toThrow("required");
    gateway.saveCandidate(org, { ...candidate, state: "CONTESTED" });
    expect(() => gateway.saveCompetencyEvidence(org, evidence)).toThrow("required");
    expect(() => gateway.saveCandidate(org, candidate)).toThrow("Invalid recognition state");
    gateway.saveCandidate(org, { ...candidate, state: "DISMISSED" });
    expect(() => gateway.saveCandidate(org, { ...candidate, state: "CONFIRMED" })).toThrow("Invalid recognition state");
    expect(() => gateway.saveCompetencyEvidence(org, evidence)).toThrow("required");
  });

  it("permits only matching confirmed synthetic demonstration evidence, with stable deduplication", () => {
    const gateway = setup();
    gateway.saveCandidate(org, { ...candidate, state: "CONFIRMED" });
    expect(() => gateway.saveCompetencyEvidence(org, { ...evidence, personId: "someone-else" })).toThrow("required");
    expect(() => gateway.saveCompetencyEvidence(org, { ...evidence, evidenceType: "LIVE_OBSERVED" })).toThrow("required");
    gateway.saveCompetencyEvidence(org, evidence);
    gateway.saveCompetencyEvidence(org, evidence);
    expect(gateway.listCompetencyEvidence(org, observation.actorId, observation.competencyId)).toHaveLength(1);
    expect(gateway.listCompetencyEvidence(org, observation.actorId, "other-competency")).toEqual([]);
  });
});
