import { type Actor, type AssessmentVersion, type CommandMeta, type PrescreenEncounter } from "./domain.js";
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
export declare class InMemoryPrescreenService {
    private readonly encounters;
    private readonly assessments;
    private readonly encounterAssessmentIds;
    private readonly idempotency;
    private sequence;
    start(actor: Actor, meta: CommandMeta, input: StartPrescreenInput): CommandResult;
    saveDraft(actor: Actor, meta: CommandMeta, input: SaveDraftInput): CommandResult;
    attest(actor: Actor, meta: CommandMeta, input: AttestInput): CommandResult;
    supplement(actor: Actor, meta: CommandMeta, input: SupplementInput, draft: AssessmentVersion): CommandResult;
    transition(actor: Actor, meta: CommandMeta, encounterId: string, to: PrescreenEncounter["status"], occurredAt: string): CommandResult;
    getEncounter(actor: Actor, encounterId: string): PrescreenEncounter;
    getAssessment(actor: Actor, assessmentVersionId: string): AssessmentVersion;
    listAssessmentVersions(actor: Actor, encounterId: string): readonly AssessmentVersion[];
    private requireEncounter;
    private requireAssessment;
    private assertExpectedVersion;
    private idempotent;
}
