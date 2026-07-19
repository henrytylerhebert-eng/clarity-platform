import { DomainError, } from "./domain.js";
import { assertEncounterTransition, derivePossiblePathway } from "./stateMachines.js";
function stableFingerprint(value) {
    const text = JSON.stringify(value, Object.keys(value).sort());
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
}
function contentHash(value) {
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
    encounters = new Map();
    assessments = new Map();
    encounterAssessmentIds = new Map();
    idempotency = new Map();
    sequence = 0;
    start(actor, meta, input) {
        return this.idempotent(actor, "StartPrescreen", meta, input, () => {
            this.sequence += 1;
            const encounterId = `pre_${this.sequence}`;
            const encounter = {
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
    saveDraft(actor, meta, input) {
        return this.idempotent(actor, "SaveAssessmentDraft", meta, input, () => {
            const encounter = this.requireEncounter(actor, input.encounterId);
            this.assertExpectedVersion(encounter.version, meta.expectedVersion);
            if (encounter.status !== "DRAFT")
                throw new DomainError("ASSESSMENT_NOT_DRAFT", "The current prescreen is not editable as a draft.");
            if (input.assessment.organizationId !== actor.organizationId || input.assessment.encounterId !== encounter.encounterId) {
                throw new DomainError("DOMAIN_VALIDATION_FAILED", "Assessment scope does not match the prescreen encounter.");
            }
            if (input.assessment.status !== "DRAFT")
                throw new DomainError("DOMAIN_VALIDATION_FAILED", "Only a draft assessment may be saved.");
            const pathway = derivePossiblePathway({ willingness: input.assessment.willingness, orientation: input.assessment.orientation });
            const stored = { ...input.assessment, possiblePathway: pathway.pathway };
            this.assessments.set(stored.assessmentVersionId, stored);
            const ids = this.encounterAssessmentIds.get(encounter.encounterId) ?? [];
            if (!ids.includes(stored.assessmentVersionId))
                ids.push(stored.assessmentVersionId);
            this.encounterAssessmentIds.set(encounter.encounterId, ids);
            const updated = {
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
    attest(actor, meta, input) {
        return this.idempotent(actor, "AttestAssessment", meta, input, () => {
            const encounter = this.requireEncounter(actor, input.encounterId);
            this.assertExpectedVersion(encounter.version, meta.expectedVersion);
            const assessment = this.requireAssessment(actor, input.assessmentVersionId);
            if (assessment.encounterId !== encounter.encounterId)
                throw new DomainError("RESOURCE_NOT_FOUND", "The assessment was not found.");
            if (assessment.status !== "DRAFT")
                throw new DomainError("ASSESSMENT_NOT_DRAFT", "Only a draft assessment can be attested.");
            const attested = {
                ...assessment,
                status: "ATTESTED",
                attestedAt: input.occurredAt,
                attestedBy: actor.actorId,
                contentHash: contentHash(assessment),
            };
            this.assessments.set(attested.assessmentVersionId, attested);
            assertEncounterTransition(encounter.status, "ATTESTED");
            const updated = { ...encounter, status: "ATTESTED", version: encounter.version + 1, updatedAt: input.occurredAt };
            this.encounters.set(encounter.encounterId, updated);
            return { objectId: attested.assessmentVersionId, version: updated.version, status: attested.status, correlationId: meta.correlationId, replayed: false };
        });
    }
    supplement(actor, meta, input, draft) {
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
            const supplement = {
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
            const updated = {
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
    transition(actor, meta, encounterId, to, occurredAt) {
        return this.idempotent(actor, `Transition:${to}`, meta, { encounterId, to, occurredAt }, () => {
            const encounter = this.requireEncounter(actor, encounterId);
            this.assertExpectedVersion(encounter.version, meta.expectedVersion);
            assertEncounterTransition(encounter.status, to);
            const updated = { ...encounter, status: to, version: encounter.version + 1, updatedAt: occurredAt };
            this.encounters.set(encounterId, updated);
            return { objectId: encounterId, version: updated.version, status: to, correlationId: meta.correlationId, replayed: false };
        });
    }
    getEncounter(actor, encounterId) {
        return this.requireEncounter(actor, encounterId);
    }
    getAssessment(actor, assessmentVersionId) {
        return this.requireAssessment(actor, assessmentVersionId);
    }
    listAssessmentVersions(actor, encounterId) {
        this.requireEncounter(actor, encounterId);
        return (this.encounterAssessmentIds.get(encounterId) ?? []).map((id) => this.requireAssessment(actor, id));
    }
    requireEncounter(actor, encounterId) {
        const encounter = this.encounters.get(encounterId);
        if (!encounter || encounter.organizationId !== actor.organizationId)
            throw new DomainError("RESOURCE_NOT_FOUND", "The prescreen was not found.");
        return encounter;
    }
    requireAssessment(actor, assessmentVersionId) {
        const assessment = this.assessments.get(assessmentVersionId);
        if (!assessment || assessment.organizationId !== actor.organizationId)
            throw new DomainError("RESOURCE_NOT_FOUND", "The assessment was not found.");
        return assessment;
    }
    assertExpectedVersion(actual, expected) {
        if (expected !== undefined && actual !== expected)
            throw new DomainError("PRESCREEN_VERSION_CONFLICT", "The record changed. Refresh and review before trying again.");
    }
    idempotent(actor, commandName, meta, request, execute) {
        if (meta.idempotencyKey.length < 8)
            throw new DomainError("INVALID_COMMAND", "Idempotency key must contain at least 8 characters.");
        const key = `${actor.organizationId}:${actor.actorId}:${commandName}:${meta.idempotencyKey}`;
        const fingerprint = stableFingerprint(request);
        const prior = this.idempotency.get(key);
        if (prior) {
            if (prior.requestFingerprint !== fingerprint)
                throw new DomainError("IDEMPOTENCY_KEY_REUSED", "The idempotency key was already used for a different command body.");
            return { ...prior.result, replayed: true };
        }
        const result = execute();
        this.idempotency.set(key, { requestFingerprint: fingerprint, result });
        return result;
    }
}
