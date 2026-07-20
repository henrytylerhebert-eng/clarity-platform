import {
  DomainError,
  type Actor,
  type AssessmentVersion,
  type CommandMeta,
  type PrescreenEncounter,
} from "./domain.js";
import { assertEncounterTransition, derivePossiblePathway } from "./stateMachines.js";

export interface StartPrescreenInput {
  readonly caseId: string;
  readonly currentLocation: string;
  readonly presentingConcern: string;
  readonly occurredAt: string;
}

export interface SaveDraftInput {
  readonly encounterId: string;
  readonly assessment: AssessmentVersion;
}

export interface AttestInput {
  readonly encounterId: string;
  readonly assessmentVersionId: string;
  readonly occurredAt: string;
}

export interface SupplementInput {
  readonly encounterId: string;
  readonly parentAssessmentVersionId: string;
  readonly supplementAssessmentVersionId: string;
  readonly reason: string;
  readonly occurredAt: string;
}

export interface CommandResult {
  readonly objectId: string;
  readonly version: number;
  readonly status: string;
  readonly correlationId: string;
  readonly replayed: boolean;
}

interface StoredIdempotency {
  readonly requestFingerprint: string;
  readonly result: CommandResult;
}

function stableFingerprint(value: unknown): string {
  const text = JSON.stringify(value, Object.keys(value as object).sort());
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function contentHash(value: unknown): string {
  const text = JSON.stringify(value);
  let a = 0x811c9dc5;
  let b = 0x01000193;
  for (let i = 0; i < text.length; i += 1) {
    a = Math.imul(a ^ text.charCodeAt(i), 16777619);
    b = Math.imul(b + text.charCodeAt(i), 2246822519);
  }
  return `${(a >>> 0).toString(16).padStart(8, "0")}${(b >>> 0).toString(16).padStart(8, "0")}`;
}

export class InMemoryPrescreenService {
  private readonly encounters = new Map<string, PrescreenEncounter>();
  private readonly assessments = new Map<string, AssessmentVersion>();
  private readonly encounterAssessmentIds = new Map<string, string[]>();
  private readonly idempotency = new Map<string, StoredIdempotency>();
  private sequence = 0;

  start(actor: Actor, meta: CommandMeta, input: StartPrescreenInput): CommandResult {
    return this.idempotent(actor, "StartPrescreen", meta, input, () => {
      this.sequence += 1;
      const encounterId = `pre_${this.sequence}`;
      const encounter: PrescreenEncounter = {
        encounterId,
        caseId: input.caseId,
        organizationId: actor.organizationId,
        status: "DRAFT",
        version: 1,
        currentLocation: input.currentLocation,
        presentingConcern: input.presentingConcern,
        possiblePathway: "UNDETERMINED",
        createdBy: actor.actorId,
        createdAt: input.occurredAt,
        updatedAt: input.occurredAt,
      };
      this.encounters.set(encounterId, encounter);
      this.encounterAssessmentIds.set(encounterId, []);
      return { objectId: encounterId, version: 1, status: encounter.status, correlationId: meta.correlationId, replayed: false };
    });
  }

  saveDraft(actor: Actor, meta: CommandMeta, input: SaveDraftInput): CommandResult {
    return this.idempotent(actor, "SaveAssessmentDraft", meta, input, () => {
      const encounter = this.requireEncounter(actor, input.encounterId);
      this.assertExpectedVersion(encounter.version, meta.expectedVersion);
      if (encounter.status !== "DRAFT") throw new DomainError("ASSESSMENT_NOT_DRAFT", "The current prescreen is not editable as a draft.");
      if (input.assessment.organizationId !== actor.organizationId || input.assessment.encounterId !== encounter.encounterId) {
        throw new DomainError("DOMAIN_VALIDATION_FAILED", "Assessment scope does not match the prescreen encounter.");
      }
      if (input.assessment.status !== "DRAFT") throw new DomainError("DOMAIN_VALIDATION_FAILED", "Only a draft assessment may be saved.");
      const pathway = derivePossiblePathway({ willingness: input.assessment.willingness, orientation: input.assessment.orientation });
      const stored: AssessmentVersion = { ...input.assessment, possiblePathway: pathway.pathway };
      this.assessments.set(stored.assessmentVersionId, stored);
      const ids = this.encounterAssessmentIds.get(encounter.encounterId) ?? [];
      if (!ids.includes(stored.assessmentVersionId)) ids.push(stored.assessmentVersionId);
      this.encounterAssessmentIds.set(encounter.encounterId, ids);
      const updated: PrescreenEncounter = {
        ...encounter,
        currentAssessmentVersionId: stored.assessmentVersionId,
        possiblePathway: pathway.pathway,
        version: encounter.version + 1,
        updatedAt: stored.createdAt,
      };
      this.encounters.set(encounter.encounterId, updated);
      return { objectId: stored.assessmentVersionId, version: updated.version, status: stored.status, correlationId: meta.correlationId, replayed: false };
    });
  }

  attest(actor: Actor, meta: CommandMeta, input: AttestInput): CommandResult {
    return this.idempotent(actor, "AttestAssessment", meta, input, () => {
      const encounter = this.requireEncounter(actor, input.encounterId);
      this.assertExpectedVersion(encounter.version, meta.expectedVersion);
      const assessment = this.requireAssessment(actor, input.assessmentVersionId);
      if (assessment.encounterId !== encounter.encounterId) throw new DomainError("RESOURCE_NOT_FOUND", "The assessment was not found.");
      if (assessment.status !== "DRAFT") throw new DomainError("ASSESSMENT_NOT_DRAFT", "Only a draft assessment can be attested.");
      const attested: AssessmentVersion = {
        ...assessment,
        status: "ATTESTED",
        attestedAt: input.occurredAt,
        attestedBy: actor.actorId,
        contentHash: contentHash(assessment),
      };
      this.assessments.set(attested.assessmentVersionId, attested);
      assertEncounterTransition(encounter.status, "ATTESTED");
      const updated: PrescreenEncounter = { ...encounter, status: "ATTESTED", version: encounter.version + 1, updatedAt: input.occurredAt };
      this.encounters.set(encounter.encounterId, updated);
      return { objectId: attested.assessmentVersionId, version: updated.version, status: attested.status, correlationId: meta.correlationId, replayed: false };
    });
  }

  supplement(actor: Actor, meta: CommandMeta, input: SupplementInput, draft: AssessmentVersion): CommandResult {
    return this.idempotent(actor, "SupplementAssessment", meta, { input, draft }, () => {
      const encounter = this.requireEncounter(actor, input.encounterId);
      this.assertExpectedVersion(encounter.version, meta.expectedVersion);
      const parent = this.requireAssessment(actor, input.parentAssessmentVersionId);
      if (parent.encounterId !== encounter.encounterId || parent.status === "DRAFT") {
        throw new DomainError("ASSESSMENT_VERSION_REQUIRED", "A supplement requires an attested parent assessment.");
      }
      if (draft.assessmentVersionId !== input.supplementAssessmentVersionId || draft.parentVersionId !== parent.assessmentVersionId) {
        throw new DomainError("DOMAIN_VALIDATION_FAILED", "Supplement identifiers do not match the parent version.");
      }
      const pathway = derivePossiblePathway({ willingness: draft.willingness, orientation: draft.orientation });
      const supplement: AssessmentVersion = {
        ...draft,
        status: "CORRECTED",
        changeReason: input.reason,
        possiblePathway: pathway.pathway,
        attestedAt: input.occurredAt,
        attestedBy: actor.actorId,
        contentHash: contentHash(draft),
      };
      this.assessments.set(supplement.assessmentVersionId, supplement);
      const ids = this.encounterAssessmentIds.get(encounter.encounterId) ?? [];
      ids.push(supplement.assessmentVersionId);
      this.encounterAssessmentIds.set(encounter.encounterId, ids);
      const updated: PrescreenEncounter = {
        ...encounter,
        currentAssessmentVersionId: supplement.assessmentVersionId,
        possiblePathway: supplement.possiblePathway,
        version: encounter.version + 1,
        updatedAt: input.occurredAt,
      };
      this.encounters.set(encounter.encounterId, updated);
      return { objectId: supplement.assessmentVersionId, version: updated.version, status: supplement.status, correlationId: meta.correlationId, replayed: false };
    });
  }

  transition(actor: Actor, meta: CommandMeta, encounterId: string, to: PrescreenEncounter["status"], occurredAt: string): CommandResult {
    return this.idempotent(actor, `Transition:${to}`, meta, { encounterId, to, occurredAt }, () => {
      const encounter = this.requireEncounter(actor, encounterId);
      this.assertExpectedVersion(encounter.version, meta.expectedVersion);
      assertEncounterTransition(encounter.status, to);
      const updated: PrescreenEncounter = { ...encounter, status: to, version: encounter.version + 1, updatedAt: occurredAt };
      this.encounters.set(encounterId, updated);
      return { objectId: encounterId, version: updated.version, status: to, correlationId: meta.correlationId, replayed: false };
    });
  }

  getEncounter(actor: Actor, encounterId: string): PrescreenEncounter {
    return this.requireEncounter(actor, encounterId);
  }

  getAssessment(actor: Actor, assessmentVersionId: string): AssessmentVersion {
    return this.requireAssessment(actor, assessmentVersionId);
  }

  listAssessmentVersions(actor: Actor, encounterId: string): readonly AssessmentVersion[] {
    this.requireEncounter(actor, encounterId);
    return (this.encounterAssessmentIds.get(encounterId) ?? []).map((id) => this.requireAssessment(actor, id));
  }

  private requireEncounter(actor: Actor, encounterId: string): PrescreenEncounter {
    const encounter = this.encounters.get(encounterId);
    if (!encounter || encounter.organizationId !== actor.organizationId) throw new DomainError("RESOURCE_NOT_FOUND", "The prescreen was not found.");
    return encounter;
  }

  private requireAssessment(actor: Actor, assessmentVersionId: string): AssessmentVersion {
    const assessment = this.assessments.get(assessmentVersionId);
    if (!assessment || assessment.organizationId !== actor.organizationId) throw new DomainError("RESOURCE_NOT_FOUND", "The assessment was not found.");
    return assessment;
  }

  private assertExpectedVersion(actual: number, expected: number | undefined): void {
    if (expected !== undefined && actual !== expected) throw new DomainError("PRESCREEN_VERSION_CONFLICT", "The record changed. Refresh and review before trying again.");
  }

  private idempotent(
    actor: Actor,
    commandName: string,
    meta: CommandMeta,
    request: unknown,
    execute: () => CommandResult,
  ): CommandResult {
    if (meta.idempotencyKey.length < 8) throw new DomainError("INVALID_COMMAND", "Idempotency key must contain at least 8 characters.");
    const key = `${actor.organizationId}:${actor.actorId}:${commandName}:${meta.idempotencyKey}`;
    const fingerprint = stableFingerprint(request);
    const prior = this.idempotency.get(key);
    if (prior) {
      if (prior.requestFingerprint !== fingerprint) throw new DomainError("IDEMPOTENCY_KEY_REUSED", "The idempotency key was already used for a different command body.");
      return { ...prior.result, replayed: true };
    }
    const result = execute();
    this.idempotency.set(key, { requestFingerprint: fingerprint, result });
    return result;
  }
}
