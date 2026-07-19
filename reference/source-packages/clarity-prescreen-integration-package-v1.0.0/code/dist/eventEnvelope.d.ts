export interface EventActor {
    readonly actorType: "USER" | "SOURCE_SYSTEM" | "SERVICE";
    readonly actorId: string;
    readonly roleCodes: readonly string[];
}
export interface EventSource {
    readonly sourceSystem: string;
    readonly sourceObjectId?: string;
    readonly sourceVersion?: string;
    readonly mappingVersion?: string;
}
export interface PrescreenEventEnvelope<TPayload extends object> {
    readonly eventId: string;
    readonly schemaName: "clarity.prescreen.event";
    readonly schemaVersion: "1.0.0";
    readonly eventType: string;
    readonly organizationId: string;
    readonly facilityId?: string;
    readonly programId?: string;
    readonly caseId?: string;
    readonly encounterId?: string;
    readonly aggregateType: string;
    readonly aggregateId: string;
    readonly aggregateVersion: number;
    readonly eventTime: string;
    readonly recordedTime: string;
    readonly actor: EventActor;
    readonly source: EventSource;
    readonly correlationId: string;
    readonly causationId?: string;
    readonly idempotencyKey?: string;
    readonly phiClassification: "RESTRICTED_PHI" | "SENSITIVE_OPERATIONAL" | "DEIDENTIFIED_OPERATIONAL" | "PUBLIC_REFERENCE";
    readonly dataQualityState: "VALIDATED" | "PARTIAL" | "DISPUTED" | "CORRECTED" | "LATE" | "INVALID";
    readonly reviewState: "NOT_REQUIRED" | "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
    readonly supersedesEventId?: string;
    readonly payload: TPayload;
}
export interface EventEnvelopeInput<TPayload extends object> {
    readonly eventId: string;
    readonly eventType: string;
    readonly organizationId: string;
    readonly aggregateType: string;
    readonly aggregateId: string;
    readonly aggregateVersion: number;
    readonly eventTime: string;
    readonly recordedTime: string;
    readonly actor: EventActor;
    readonly source: EventSource;
    readonly correlationId: string;
    readonly payload: TPayload;
    readonly facilityId?: string;
    readonly programId?: string;
    readonly caseId?: string;
    readonly encounterId?: string;
    readonly causationId?: string;
    readonly idempotencyKey?: string;
    readonly phiClassification?: PrescreenEventEnvelope<TPayload>["phiClassification"];
    readonly dataQualityState?: PrescreenEventEnvelope<TPayload>["dataQualityState"];
    readonly reviewState?: PrescreenEventEnvelope<TPayload>["reviewState"];
    readonly supersedesEventId?: string;
}
export declare function createEventEnvelope<TPayload extends object>(input: EventEnvelopeInput<TPayload>): PrescreenEventEnvelope<TPayload>;
