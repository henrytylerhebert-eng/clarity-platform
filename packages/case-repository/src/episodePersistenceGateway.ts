import { createHash, randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import {
  AdmissionHandoffCommandSchema,
  AdmissionRecordedEventPayloadSchema,
  AuthorizationDayDecisionRecordedEventPayloadSchema,
  DocumentationGapRecordedEventPayloadSchema,
  FacilityTimezoneConfigSchema,
  GovernedEventEnvelopeSchema,
  canTransitionDocumentationGap,
  serviceDateForInstant,
  type AdmissionHandoffCommand,
  type AuditActor,
  type AuthorizationDayOutcome,
  type AuthorizationReviewCorrectionReason,
  type AuthorizationReviewStatus,
  type AuthorizationReviewType,
  type DenialReasonCode,
  type DocumentationGapCategory,
  type DocumentationGapStatus,
  type EpisodeAuthorizationRequirement,
  type GovernedEventEnvelope,
} from "@clarity/domain-contracts";
import { CaseNotFoundError } from "./prismaCaseRepository.js";
import { ConcurrencyConflictError, IdempotencyConflictError } from "./caseCommandGateway.js";
import { PrismaCaseAuditWriter, type CaseAuditWriter, type TxClient } from "./auditWriter.js";
import { withTenantContext } from "./tenantContext.js";

/**
 * S2 persistence gateway (docs/decisions/S2_PERSISTENCE_DECISION_PACKET.md,
 * authorized by MSG-0024 and dispatched as MSG-0045). The single approved
 * Prisma adapter for episode-of-care persistence:
 *
 * - Episodes and case-to-episode links (admission handoff).
 * - Facility timezone configuration lineage (source/version/effective-date;
 *   append-only supersession — decision 3).
 * - Episode-owned authorization facts, payer reviews, and inclusive day
 *   decisions (decisions 1, 4).
 * - Append-only correction/supersession chains (decision 5): a correction
 *   inserts new rows and REVERSAL events; originals are frozen except for
 *   their supersession pointers.
 * - Governed events + transactional outbox rows written atomically with the
 *   source mutation and audit event (decisions 4, 7). Persistence only — no
 *   dispatcher or worker exists; outbox rows stay PENDING.
 * - Organization predicates on every query/write (decision 8), idempotent
 *   replay (decision 6), and optimistic concurrency via conditional updates.
 *
 * Synthetic data only. This gateway records operational facts; it makes no
 * clinical, legal, admission, discharge, placement, or payer decisions.
 */

export class EpisodeNotFoundError extends Error {
  constructor(episodeId: string) {
    super(`Episode "${episodeId}" was not found in this organization`);
    this.name = "EpisodeNotFoundError";
  }
}

export class FacilityNotFoundError extends Error {
  constructor(facilityId: string) {
    super(`Facility "${facilityId}" was not found in this organization`);
    this.name = "FacilityNotFoundError";
  }
}

export class ActiveAdmissionExistsError extends Error {
  constructor(caseId: string) {
    super(`Case "${caseId}" already has an active admission-source episode`);
    this.name = "ActiveAdmissionExistsError";
  }
}

export class TimezoneConfigurationNotFoundError extends Error {
  constructor(facilityId: string) {
    super(
      `No active facility timezone configuration matches the supplied lineage for facility "${facilityId}" — record the facility-owned configuration first`,
    );
    this.name = "TimezoneConfigurationNotFoundError";
  }
}

export class EpisodeAuthorizationNotFoundError extends Error {
  constructor(episodeAuthorizationId: string) {
    super(`Episode authorization "${episodeAuthorizationId}" was not found for this episode`);
    this.name = "EpisodeAuthorizationNotFoundError";
  }
}

export class ReviewAlreadySupersededError extends Error {
  constructor(reviewId: string) {
    super(`Authorization review "${reviewId}" is already superseded; corrections branch from the active review only`);
    this.name = "ReviewAlreadySupersededError";
  }
}

export class DocumentationGapNotFoundError extends Error {
  constructor(documentationGapId: string) {
    super(`Documentation gap "${documentationGapId}" was not found in this organization`);
    this.name = "DocumentationGapNotFoundError";
  }
}

export class InvalidDocumentationGapTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Invalid documentation-gap transition: ${from} -> ${to}`);
    this.name = "InvalidDocumentationGapTransitionError";
  }
}

function isAdmissionAcceptanceUniqueViolation(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") return false;
  const target = error.meta?.target;
  const targetName = Array.isArray(target) ? target.join("_") : String(target ?? "");
  return (
    String(error.meta?.modelName ?? "").includes("CaseEpisodeLink") &&
    targetName.includes("organizationId") &&
    targetName.includes("sourceAcceptanceId")
  );
}

function isActiveAdmissionUniqueViolation(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") return false;
  const target = error.meta?.target;
  const targetName = Array.isArray(target) ? target.join("_") : String(target ?? "");
  return (
    String(error.meta?.modelName ?? "").includes("Episode") &&
    (targetName.includes("sourceCaseId") || targetName.includes("Episode_active_source_case_key"))
  );
}

function admissionIdentityMatches(
  link: { caseId: string },
  episode: { facilityId: string; admittedAt: Date; timezoneSourceReferenceId: string },
  command: AdmissionHandoffCommand,
): boolean {
  return (
    link.caseId === command.sourceCaseId &&
    episode.facilityId === command.facilityId &&
    episode.admittedAt.getTime() === new Date(command.admittedAt).getTime() &&
    episode.timezoneSourceReferenceId === command.facilityTimezone.sourceReferenceId
  );
}

/** Deterministic key-sorted JSON so the payload hash is content-addressed. */
function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  return `{${Object.keys(value as Record<string, unknown>)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson((value as Record<string, unknown>)[key])}`)
    .join(",")}}`;
}

function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/** Envelope actor types exclude AGENT; automated actors map to SYSTEM. */
function envelopeActorType(actorType: AuditActor["actorType"]): "USER" | "SYSTEM" | "EXTERNAL_SYSTEM" {
  return actorType === "USER" ? "USER" : "SYSTEM";
}

interface EnvelopeSeed {
  eventId?: string;
  eventTypeName: string;
  aggregate: { type: GovernedEventEnvelope["aggregate"]["type"]; id: string; version: number };
  organizationId: string;
  facilityId: string | null;
  programId: string | null;
  unitId: string | null;
  caseId: string | null;
  episodeId: string | null;
  effectiveAt: Date;
  recordedAt: Date;
  actor: AuditActor;
  method: string;
  correlationId: string;
  correction: { kind: "ORIGINAL" } | { kind: "CORRECTION" | "REVERSAL"; supersedesEventId: string; reasonCode: string };
  payload: Record<string, unknown>;
}

const ENVELOPE_SCHEMA_NAME = "clarity.governed-event";
const ENVELOPE_SCHEMA_VERSION = "1.0.0";
const ADAPTER_NAME = "case-repository/episodePersistenceGateway";
const ADAPTER_VERSION = "0.1.0";

function buildEnvelope(seed: EnvelopeSeed): GovernedEventEnvelope {
  const correction =
    seed.correction.kind === "ORIGINAL"
      ? { kind: "ORIGINAL" as const, supersedesEventId: null, reasonCode: null }
      : {
          kind: seed.correction.kind,
          supersedesEventId: seed.correction.supersedesEventId,
          reasonCode: seed.correction.reasonCode,
        };
  const metricEligibility =
    seed.correction.kind === "ORIGINAL" ? ("PENDING_REVIEW" as const) : ("EXCLUDED_CORRECTED" as const);
  return GovernedEventEnvelopeSchema.parse({
    eventId: seed.eventId ?? randomUUID(),
    schema: { name: ENVELOPE_SCHEMA_NAME, version: ENVELOPE_SCHEMA_VERSION },
    eventType: { name: seed.eventTypeName, version: 1 },
    aggregate: seed.aggregate,
    tenant: {
      organizationId: seed.organizationId,
      facilityId: seed.facilityId,
      programId: seed.programId,
      unitId: seed.unitId,
    },
    subject: { caseId: seed.caseId, episodeId: seed.episodeId, episodeDayId: null, personToken: null },
    times: {
      effectiveAt: seed.effectiveAt.toISOString(),
      recordedAt: seed.recordedAt.toISOString(),
      receivedAt: null,
    },
    actor: {
      type: envelopeActorType(seed.actor.actorType),
      id: seed.actor.actorId,
      displayRole: null,
      sessionId: null,
    },
    source: {
      kind: "NATIVE_CLARITY",
      system: "clarity-platform",
      sourceTenantKey: null,
      sourceEventId: null,
      sourceEventVersion: null,
      adapterName: ADAPTER_NAME,
      adapterVersion: ADAPTER_VERSION,
      method: seed.method,
      provenanceRefs: [],
    },
    correlation: { correlationId: seed.correlationId, causationId: null, commandId: null },
    /** Synthetic-only repository boundary (SECURITY.md); no live PHI exists. */
    classification: "PUBLIC_SYNTHETIC",
    quality: { state: "VALID", issues: [] },
    review: { state: "NOT_REQUIRED", reviewedByActorId: null, reviewedAt: null, attestationCode: null },
    correction,
    metricEligibility,
    payloadHash: sha256Hex(canonicalJson(seed.payload)),
    payload: seed.payload,
  });
}

/** Persist a validated envelope plus its outbox row in the SAME transaction. */
async function writeGovernedEventWithOutbox(
  tx: TxClient,
  envelope: GovernedEventEnvelope,
): Promise<{ eventId: string; outboxId: string }> {
  await tx.governedEvent.create({
    data: {
      id: envelope.eventId,
      organizationId: envelope.tenant.organizationId,
      eventTypeName: envelope.eventType.name,
      eventTypeVersion: envelope.eventType.version,
      schemaName: envelope.schema.name,
      schemaVersion: envelope.schema.version,
      aggregateType: envelope.aggregate.type,
      aggregateId: envelope.aggregate.id,
      aggregateVersion: envelope.aggregate.version,
      caseId: envelope.subject.caseId,
      episodeId: envelope.subject.episodeId,
      correlationId: envelope.correlation.correlationId,
      causationId: envelope.correlation.causationId,
      correctionKind: envelope.correction.kind,
      supersedesEventId: envelope.correction.supersedesEventId,
      reasonCode: envelope.correction.reasonCode,
      classification: envelope.classification,
      metricEligibility: envelope.metricEligibility,
      payloadHash: envelope.payloadHash,
      envelope: envelope as unknown as Prisma.InputJsonValue,
      effectiveAt: new Date(envelope.times.effectiveAt),
      recordedAt: new Date(envelope.times.recordedAt),
    },
  });
  const outbox = await tx.outboxRecord.create({
    data: {
      organizationId: envelope.tenant.organizationId,
      governedEventId: envelope.eventId,
      eventTypeName: envelope.eventType.name,
      aggregateType: envelope.aggregate.type,
      aggregateId: envelope.aggregate.id,
    },
  });
  return { eventId: envelope.eventId, outboxId: outbox.id };
}

export interface RecordTimezoneConfigurationParams {
  organizationId: string;
  facilityProfileId: string;
  facilityTimezone: string;
  sourceReferenceId: string;
  effectiveDate: Date;
  actor: AuditActor;
  reason?: string;
}

export interface RecordAdmissionParams {
  organizationId: string;
  command: AdmissionHandoffCommand;
  actor: AuditActor;
  correlationId?: string;
  reason?: string;
}

export interface RecordAdmissionResult {
  episodeId: string;
  caseEpisodeLinkId: string;
  serviceDate: string;
  status: string;
  version: number;
  admissionEventId: string | null;
  outboxRecordId: string | null;
  replayed: boolean;
}

function replayAdmissionResult(
  link: { id: string },
  episode: { id: string; serviceDate: string; status: string; version: number },
): RecordAdmissionResult {
  return {
    episodeId: episode.id,
    caseEpisodeLinkId: link.id,
    serviceDate: episode.serviceDate,
    status: episode.status,
    version: episode.version,
    admissionEventId: null,
    outboxRecordId: null,
    replayed: true,
  };
}

export interface DayDecisionInput {
  startDate: string;
  endDate: string;
  outcome: AuthorizationDayOutcome;
  denialReasonCode: DenialReasonCode | null;
}

export interface RecordEpisodeAuthorizationParams {
  organizationId: string;
  episodeId: string;
  levelOfCare: string;
  requirement: EpisodeAuthorizationRequirement;
  effectiveStartDate: string;
  sourceCoverageId?: string | null;
  sourcePreAdmissionAuthorizationId?: string | null;
  actor: AuditActor;
  reason?: string;
}

export interface RecordAuthorizationReviewParams {
  organizationId: string;
  episodeId: string;
  episodeAuthorizationId: string;
  reviewType: AuthorizationReviewType;
  requestedStartDate: string;
  requestedEndDate: string;
  dueAt?: Date | null;
  decisionStatus: AuthorizationReviewStatus;
  payerReferenceToken?: string | null;
  dayDecisions: DayDecisionInput[];
  actor: AuditActor;
  correlationId?: string;
  reason?: string;
}

export interface RecordAuthorizationReviewResult {
  reviewId: string;
  version: number;
  dayDecisions: Array<{ id: string; sourceEventId: string; outboxRecordId: string }>;
}

export interface CorrectAuthorizationReviewParams {
  organizationId: string;
  originalReviewId: string;
  expectedVersion: number;
  reasonCode: AuthorizationReviewCorrectionReason;
  replacement: {
    reviewType: AuthorizationReviewType;
    requestedStartDate: string;
    requestedEndDate: string;
    dueAt?: Date | null;
    decisionStatus: AuthorizationReviewStatus;
    payerReferenceToken?: string | null;
    dayDecisions: DayDecisionInput[];
  };
  actor: AuditActor;
  correlationId?: string;
  reason?: string;
}

export interface CorrectAuthorizationReviewResult {
  originalReviewId: string;
  replacementReviewId: string;
  reversalEventIds: string[];
  replacementDayDecisions: Array<{ id: string; sourceEventId: string }>;
}

export interface RecordDocumentationGapParams {
  organizationId: string;
  episodeId: string;
  categoryCode: DocumentationGapCategory;
  sourceAuthorizationReviewId?: string | null;
  operationalSummary?: string | null;
  dueAt?: Date | null;
  assignedRole?: string | null;
  assignedUserId?: string | null;
  actor: AuditActor;
  correlationId?: string;
  reason?: string;
}

export interface TransitionDocumentationGapParams {
  organizationId: string;
  documentationGapId: string;
  toStatus: DocumentationGapStatus;
  expectedVersion: number;
  reasonCode?: string | null;
  actor: AuditActor;
  reason?: string;
}

function assertInclusiveRange(startDate: string, endDate: string, label: string): void {
  if (startDate > endDate) {
    throw new Error(`${label} must start on or before it ends`);
  }
}

function assertDenialReasonPairing(decision: DayDecisionInput): void {
  if (decision.outcome === "DENIED" && decision.denialReasonCode === null) {
    throw new Error("Denied day decisions require a controlled denial reason");
  }
  if (decision.outcome !== "DENIED" && decision.denialReasonCode !== null) {
    throw new Error("Only denied day decisions may include a denial reason");
  }
}

export class PrismaEpisodePersistenceGateway {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly auditWriter: CaseAuditWriter = new PrismaCaseAuditWriter(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  private async assertEpisodeOwnership(tx: TxClient, organizationId: string, episodeId: string) {
    const episode = await tx.episode.findFirst({ where: { id: episodeId, organizationId } });
    if (!episode) throw new EpisodeNotFoundError(episodeId);
    return episode;
  }

  /**
   * Append a new facility timezone configuration version (decision 3). The
   * prior active version is frozen and linked via supersededById; version
   * uniqueness makes concurrent appends fail safely instead of forking.
   */
  async recordFacilityTimezoneConfiguration(params: RecordTimezoneConfigurationParams) {
    FacilityTimezoneConfigSchema.parse({
      facilityTimezone: params.facilityTimezone,
      source: "FACILITY_CONFIGURATION",
      sourceReferenceId: params.sourceReferenceId,
    });
    const occurredAt = this.now();
    return withTenantContext(this.prisma, params.organizationId, async (tx) => {
      const facility = await tx.facilityProfile.findFirst({
        where: { id: params.facilityProfileId, organizationId: params.organizationId },
        select: { id: true },
      });
      if (!facility) throw new FacilityNotFoundError(params.facilityProfileId);

      const current = await tx.facilityTimezoneConfiguration.findFirst({
        where: { facilityProfileId: params.facilityProfileId, organizationId: params.organizationId, supersededById: null },
        orderBy: { version: "desc" },
      });
      const created = await tx.facilityTimezoneConfiguration.create({
        data: {
          organizationId: params.organizationId,
          facilityProfileId: params.facilityProfileId,
          facilityTimezone: params.facilityTimezone,
          source: "FACILITY_CONFIGURATION",
          sourceReferenceId: params.sourceReferenceId,
          version: (current?.version ?? 0) + 1,
          effectiveDate: params.effectiveDate,
        },
      });
      if (current) {
        await tx.facilityTimezoneConfiguration.update({
          where: { id: current.id },
          data: { supersededById: created.id },
        });
      }
      await this.auditWriter.write(tx, {
        organizationId: params.organizationId,
        caseId: null,
        action: "FACILITY_TIMEZONE_CONFIGURATION_RECORDED",
        actor: params.actor,
        objectType: "FacilityTimezoneConfiguration",
        objectId: created.id,
        reason: params.reason,
        metadata: {
          facilityProfileId: params.facilityProfileId,
          facilityTimezone: params.facilityTimezone,
          sourceReferenceId: params.sourceReferenceId,
          version: created.version,
          supersedesConfigurationId: current?.id ?? null,
        },
        occurredAt,
      });
      return created;
    });
  }

  /**
   * Record an admission handoff: episode + case link + governed event + audit
   * + outbox in ONE transaction. Replays idempotently on the acceptance id
   * (decision 6); enforces at most one active admission-source episode per
   * case (decision 1); requires facility-owned timezone lineage (decision 3).
   */
  async recordAdmission(params: RecordAdmissionParams): Promise<RecordAdmissionResult> {
    // Structural tenancy guard: the command schema is .strict() and carries no
    // organization/actor/role fields — those come only from the gateway params.
    const command = AdmissionHandoffCommandSchema.parse(params.command);
    const occurredAt = this.now();
    const correlationId = params.correlationId ?? randomUUID();

    try {
      return await withTenantContext(this.prisma, params.organizationId, async (tx) => {
      const caseRow = await tx.behavioralHealthCase.findFirst({
        where: { id: command.sourceCaseId, organizationId: params.organizationId },
        select: { id: true },
      });
      if (!caseRow) throw new CaseNotFoundError(command.sourceCaseId);

      const facility = await tx.facilityProfile.findFirst({
        where: { id: command.facilityId, organizationId: params.organizationId },
        select: { id: true },
      });
      if (!facility) throw new FacilityNotFoundError(command.facilityId);

      // Facility-owned timezone lineage: the active configuration must exist
      // and match the command's declared source reference — never inferred.
      const timezoneConfiguration = await tx.facilityTimezoneConfiguration.findFirst({
        where: {
          organizationId: params.organizationId,
          facilityProfileId: command.facilityId,
          supersededById: null,
          facilityTimezone: command.facilityTimezone.facilityTimezone,
          sourceReferenceId: command.facilityTimezone.sourceReferenceId,
        },
        orderBy: { version: "desc" },
      });
      if (!timezoneConfiguration) throw new TimezoneConfigurationNotFoundError(command.facilityId);

      // Idempotent replay on the natural key (organization, acceptance id).
      const existingLink = await tx.caseEpisodeLink.findUnique({
        where: {
          organizationId_sourceAcceptanceId: {
            organizationId: params.organizationId,
            sourceAcceptanceId: command.acceptedFacilityResponseId,
          },
        },
      });
      if (existingLink) {
        const existingEpisode = await tx.episode.findFirstOrThrow({
          where: { id: existingLink.episodeId, organizationId: params.organizationId },
        });
        if (!admissionIdentityMatches(existingLink, existingEpisode, command)) {
          throw new IdempotencyConflictError(command.acceptedFacilityResponseId);
        }
        return replayAdmissionResult(existingLink, existingEpisode);
      }

      const activeAdmission = await tx.caseEpisodeLink.findFirst({
        where: {
          organizationId: params.organizationId,
          caseId: command.sourceCaseId,
          relationship: "ADMISSION_SOURCE",
          episode: { status: "ACTIVE" },
        },
        select: { id: true },
      });
      if (activeAdmission) throw new ActiveAdmissionExistsError(command.sourceCaseId);

      const serviceDate = serviceDateForInstant(command.admittedAt, command.facilityTimezone);
      const episode = await tx.episode.create({
        data: {
          organizationId: params.organizationId,
          sourceCaseId: command.sourceCaseId,
          facilityId: command.facilityId,
          programId: command.programId,
          unitId: command.unitId,
          facilityTimezone: command.facilityTimezone.facilityTimezone,
          timezoneSource: command.facilityTimezone.source,
          timezoneSourceReferenceId: command.facilityTimezone.sourceReferenceId,
          timezoneConfigurationId: timezoneConfiguration.id,
          admittedAt: new Date(command.admittedAt),
          serviceDate,
          acceptedFacilityResponseId: command.acceptedFacilityResponseId,
          sourcePacketVersionId: command.sourcePacketVersionId,
          sourceCustodyEventId: command.sourceCustodyEventId,
        },
      });
      const link = await tx.caseEpisodeLink.create({
        data: {
          organizationId: params.organizationId,
          caseId: command.sourceCaseId,
          episodeId: episode.id,
          relationship: "ADMISSION_SOURCE",
          linkedAt: occurredAt,
          linkedByActorId: params.actor.actorId,
          sourceAcceptanceId: command.acceptedFacilityResponseId,
          sourcePacketVersionId: command.sourcePacketVersionId,
          sourceCustodyEventId: command.sourceCustodyEventId,
        },
      });

      const payload = AdmissionRecordedEventPayloadSchema.parse({
        episodeId: episode.id,
        sourceCaseId: command.sourceCaseId,
        admissionRecordId: link.id,
        acceptedFacilityResponseId: command.acceptedFacilityResponseId,
        facilityId: command.facilityId,
        programId: command.programId,
        unitId: command.unitId,
        facilityTimezone: command.facilityTimezone.facilityTimezone,
        admittedAt: command.admittedAt,
        serviceDate,
        sourcePacketVersionId: command.sourcePacketVersionId,
        sourceCustodyEventId: command.sourceCustodyEventId,
        attestationCode: command.attestation.code,
      });
      const envelope = buildEnvelope({
        eventTypeName: "ADMISSION_RECORDED",
        aggregate: { type: "EPISODE", id: episode.id, version: episode.version },
        organizationId: params.organizationId,
        facilityId: command.facilityId,
        programId: command.programId,
        unitId: command.unitId,
        caseId: command.sourceCaseId,
        episodeId: episode.id,
        effectiveAt: new Date(command.admittedAt),
        recordedAt: occurredAt,
        actor: params.actor,
        method: "recordAdmission",
        correlationId,
        correction: { kind: "ORIGINAL" },
        payload,
      });
      const { eventId, outboxId } = await writeGovernedEventWithOutbox(tx, envelope);

      await this.auditWriter.write(tx, {
        organizationId: params.organizationId,
        caseId: command.sourceCaseId,
        action: "EPISODE_ADMISSION_RECORDED",
        actor: params.actor,
        objectType: "Episode",
        objectId: episode.id,
        reason: params.reason,
        metadata: {
          command: "RecordAdmission",
          correlationId,
          caseEpisodeLinkId: link.id,
          acceptedFacilityResponseId: command.acceptedFacilityResponseId,
          facilityId: command.facilityId,
          serviceDate,
          governedEventId: eventId,
        },
        occurredAt,
      });

      return {
        episodeId: episode.id,
        caseEpisodeLinkId: link.id,
        serviceDate,
        status: episode.status,
        version: episode.version,
        admissionEventId: eventId,
        outboxRecordId: outboxId,
        replayed: false,
      };
      });
    } catch (error) {
      const activeAdmissionConflict =
        error instanceof ActiveAdmissionExistsError || isActiveAdmissionUniqueViolation(error);
      const acceptanceUniqueViolation = isAdmissionAcceptanceUniqueViolation(error);
      if (!activeAdmissionConflict && !acceptanceUniqueViolation) throw error;

      // A concurrent writer may commit after the first acceptance lookup but
      // before the active-admission lookup, or either database uniqueness check
      // may lose. Re-read only after this transaction has ended, then treat an
      // exact command identity as a replay and any mismatch as a conflict.
      const existingLink = await withTenantContext(this.prisma, params.organizationId, (tx) => tx.caseEpisodeLink.findUnique({
        where: {
          organizationId_sourceAcceptanceId: {
            organizationId: params.organizationId,
            sourceAcceptanceId: command.acceptedFacilityResponseId,
          },
        },
      }));
      if (!existingLink) {
        if (activeAdmissionConflict) {
          if (error instanceof ActiveAdmissionExistsError) throw error;
          throw new ActiveAdmissionExistsError(command.sourceCaseId);
        }
        throw error;
      }
      const existingEpisode = await withTenantContext(this.prisma, params.organizationId, (tx) => tx.episode.findFirst({
        where: { id: existingLink.episodeId, organizationId: params.organizationId },
      }));
      if (!existingEpisode) throw error;
      if (!admissionIdentityMatches(existingLink, existingEpisode, command)) {
        throw new IdempotencyConflictError(command.acceptedFacilityResponseId);
      }
      return replayAdmissionResult(existingLink, existingEpisode);
    }
  }

  /** Episode-owned authorization requirement fact (thin create + audit). */
  async recordEpisodeAuthorization(params: RecordEpisodeAuthorizationParams) {
    const occurredAt = this.now();
    return withTenantContext(this.prisma, params.organizationId, async (tx) => {
      await this.assertEpisodeOwnership(tx, params.organizationId, params.episodeId);
      const created = await tx.episodeAuthorization.create({
        data: {
          organizationId: params.organizationId,
          episodeId: params.episodeId,
          sourceCoverageId: params.sourceCoverageId ?? null,
          sourcePreAdmissionAuthorizationId: params.sourcePreAdmissionAuthorizationId ?? null,
          levelOfCare: params.levelOfCare,
          requirement: params.requirement,
          effectiveStartDate: params.effectiveStartDate,
        },
      });
      await this.auditWriter.write(tx, {
        organizationId: params.organizationId,
        caseId: null,
        action: "EPISODE_AUTHORIZATION_RECORDED",
        actor: params.actor,
        objectType: "EpisodeAuthorization",
        objectId: created.id,
        reason: params.reason,
        metadata: {
          episodeId: params.episodeId,
          levelOfCare: params.levelOfCare,
          requirement: params.requirement,
          effectiveStartDate: params.effectiveStartDate,
        },
        occurredAt,
      });
      return created;
    });
  }

  /**
   * Record a payer review plus its inclusive day decisions. One governed
   * event per day decision; each decision row stores its own event id.
   */
  async recordAuthorizationReview(params: RecordAuthorizationReviewParams): Promise<RecordAuthorizationReviewResult> {
    assertInclusiveRange(params.requestedStartDate, params.requestedEndDate, "Requested review range");
    for (const decision of params.dayDecisions) {
      assertInclusiveRange(decision.startDate, decision.endDate, "Day decision range");
      assertDenialReasonPairing(decision);
    }
    const occurredAt = this.now();
    const correlationId = params.correlationId ?? randomUUID();

    return withTenantContext(this.prisma, params.organizationId, async (tx) => {
      const episode = await this.assertEpisodeOwnership(tx, params.organizationId, params.episodeId);
      const authorization = await tx.episodeAuthorization.findFirst({
        where: { id: params.episodeAuthorizationId, organizationId: params.organizationId, episodeId: params.episodeId },
        select: { id: true },
      });
      if (!authorization) throw new EpisodeAuthorizationNotFoundError(params.episodeAuthorizationId);

      const review = await tx.authorizationReview.create({
        data: {
          organizationId: params.organizationId,
          episodeAuthorizationId: params.episodeAuthorizationId,
          episodeId: params.episodeId,
          reviewType: params.reviewType,
          requestedStartDate: params.requestedStartDate,
          requestedEndDate: params.requestedEndDate,
          dueAt: params.dueAt ?? null,
          decisionStatus: params.decisionStatus,
          payerReferenceToken: params.payerReferenceToken ?? null,
          recordedByActorId: params.actor.actorId,
          recordedAt: occurredAt,
        },
      });

      const persistedDecisions: RecordAuthorizationReviewResult["dayDecisions"] = [];
      for (const decision of params.dayDecisions) {
        const eventId = randomUUID();
        const row = await tx.authorizationDayDecision.create({
          data: {
            organizationId: params.organizationId,
            authorizationReviewId: review.id,
            episodeAuthorizationId: params.episodeAuthorizationId,
            episodeId: params.episodeId,
            startDate: decision.startDate,
            endDate: decision.endDate,
            outcome: decision.outcome,
            denialReasonCode: decision.denialReasonCode,
            sourceEventId: eventId,
          },
        });
        const payload = AuthorizationDayDecisionRecordedEventPayloadSchema.parse({
          authorizationDayDecisionId: row.id,
          authorizationReviewId: review.id,
          episodeAuthorizationId: params.episodeAuthorizationId,
          episodeId: params.episodeId,
          decisionRange: { startDate: decision.startDate, endDate: decision.endDate },
          outcome: decision.outcome,
          denialReasonCode: decision.denialReasonCode,
          // No review-level event type exists in the S1 vocabulary, so this
          // carries the review ROW id as the source reference — documented
          // interpretation for the verification pass.
          sourceReviewEventId: review.id,
        });
        const envelope = buildEnvelope({
          eventId,
          eventTypeName: "AUTHORIZATION_DAY_DECISION_RECORDED",
          aggregate: { type: "AUTHORIZATION_REVIEW", id: review.id, version: review.version },
          organizationId: params.organizationId,
          facilityId: episode.facilityId,
          programId: episode.programId,
          unitId: episode.unitId,
          caseId: episode.sourceCaseId,
          episodeId: params.episodeId,
          effectiveAt: occurredAt,
          recordedAt: occurredAt,
          actor: params.actor,
          method: "recordAuthorizationReview",
          correlationId,
          correction: { kind: "ORIGINAL" },
          payload,
        });
        const { outboxId } = await writeGovernedEventWithOutbox(tx, envelope);
        persistedDecisions.push({ id: row.id, sourceEventId: eventId, outboxRecordId: outboxId });
      }

      await this.auditWriter.write(tx, {
        organizationId: params.organizationId,
        caseId: episode.sourceCaseId,
        action: "AUTHORIZATION_REVIEW_RECORDED",
        actor: params.actor,
        objectType: "AuthorizationReview",
        objectId: review.id,
        reason: params.reason,
        metadata: {
          command: "RecordAuthorizationReview",
          correlationId,
          episodeId: params.episodeId,
          episodeAuthorizationId: params.episodeAuthorizationId,
          reviewType: params.reviewType,
          decisionStatus: params.decisionStatus,
          dayDecisionCount: params.dayDecisions.length,
        },
        occurredAt,
      });

      return { reviewId: review.id, version: review.version, dayDecisions: persistedDecisions };
    });
  }

  /**
   * Append-only correction (decision 5): the original review is frozen and
   * linked to a NEW replacement review; every active original day-decision
   * event is superseded by a REVERSAL event (one supersession per event —
   * enforced by the GovernedEvent.supersedesEventId unique constraint), and
   * the replacement decisions are appended as new ORIGINAL events. Optimistic
   * concurrency runs as a predicate on the conditional update itself.
   */
  async correctAuthorizationReview(params: CorrectAuthorizationReviewParams): Promise<CorrectAuthorizationReviewResult> {
    assertInclusiveRange(params.replacement.requestedStartDate, params.replacement.requestedEndDate, "Replacement review range");
    for (const decision of params.replacement.dayDecisions) {
      assertInclusiveRange(decision.startDate, decision.endDate, "Replacement day decision range");
      assertDenialReasonPairing(decision);
    }
    const occurredAt = this.now();
    const correlationId = params.correlationId ?? randomUUID();

    return withTenantContext(this.prisma, params.organizationId, async (tx) => {
      const original = await tx.authorizationReview.findFirst({
        where: { id: params.originalReviewId, organizationId: params.organizationId },
        include: { dayDecisions: true },
      });
      if (!original) throw new ReviewAlreadySupersededError(params.originalReviewId);
      if (original.supersededByReviewId) throw new ReviewAlreadySupersededError(params.originalReviewId);
      const episode = await this.assertEpisodeOwnership(tx, params.organizationId, original.episodeId);

      const replacement = await tx.authorizationReview.create({
        data: {
          organizationId: params.organizationId,
          episodeAuthorizationId: original.episodeAuthorizationId,
          episodeId: original.episodeId,
          reviewType: params.replacement.reviewType,
          requestedStartDate: params.replacement.requestedStartDate,
          requestedEndDate: params.replacement.requestedEndDate,
          dueAt: params.replacement.dueAt ?? null,
          decisionStatus: params.replacement.decisionStatus,
          payerReferenceToken: params.replacement.payerReferenceToken ?? null,
          recordedByActorId: params.actor.actorId,
          recordedAt: occurredAt,
          correctionReasonCode: params.reasonCode,
        },
      });

      // Optimistic concurrency + not-already-superseded, asserted atomically.
      const frozen = await tx.authorizationReview.updateMany({
        where: {
          id: original.id,
          organizationId: params.organizationId,
          version: params.expectedVersion,
          supersededByReviewId: null,
        },
        data: { supersededByReviewId: replacement.id, version: { increment: 1 } },
      });
      if (frozen.count !== 1) {
        throw new ConcurrencyConflictError(original.id);
      }

      // REVERSAL events wipe the original day-decision facts one-for-one.
      const reversalEventIds: string[] = [];
      for (const decision of original.dayDecisions.filter((row) => row.supersededByEventId === null)) {
        const reversalEventId = randomUUID();
        const payload = AuthorizationDayDecisionRecordedEventPayloadSchema.parse({
          authorizationDayDecisionId: decision.id,
          authorizationReviewId: original.id,
          episodeAuthorizationId: original.episodeAuthorizationId,
          episodeId: original.episodeId,
          decisionRange: { startDate: decision.startDate, endDate: decision.endDate },
          outcome: decision.outcome,
          denialReasonCode: decision.denialReasonCode,
          sourceReviewEventId: original.id,
        });
        const envelope = buildEnvelope({
          eventId: reversalEventId,
          eventTypeName: "AUTHORIZATION_DAY_DECISION_RECORDED",
          aggregate: { type: "AUTHORIZATION_REVIEW", id: original.id, version: params.expectedVersion + 1 },
          organizationId: params.organizationId,
          facilityId: episode.facilityId,
          programId: episode.programId,
          unitId: episode.unitId,
          caseId: episode.sourceCaseId,
          episodeId: original.episodeId,
          effectiveAt: occurredAt,
          recordedAt: occurredAt,
          actor: params.actor,
          method: "correctAuthorizationReview",
          correlationId,
          correction: { kind: "REVERSAL", supersedesEventId: decision.sourceEventId, reasonCode: params.reasonCode },
          payload,
        });
        await writeGovernedEventWithOutbox(tx, envelope);
        await tx.authorizationDayDecision.update({
          where: { id: decision.id },
          data: { supersededByEventId: reversalEventId },
        });
        reversalEventIds.push(reversalEventId);
      }

      const replacementDecisions: CorrectAuthorizationReviewResult["replacementDayDecisions"] = [];
      for (const decision of params.replacement.dayDecisions) {
        const eventId = randomUUID();
        const row = await tx.authorizationDayDecision.create({
          data: {
            organizationId: params.organizationId,
            authorizationReviewId: replacement.id,
            episodeAuthorizationId: original.episodeAuthorizationId,
            episodeId: original.episodeId,
            startDate: decision.startDate,
            endDate: decision.endDate,
            outcome: decision.outcome,
            denialReasonCode: decision.denialReasonCode,
            sourceEventId: eventId,
          },
        });
        const payload = AuthorizationDayDecisionRecordedEventPayloadSchema.parse({
          authorizationDayDecisionId: row.id,
          authorizationReviewId: replacement.id,
          episodeAuthorizationId: original.episodeAuthorizationId,
          episodeId: original.episodeId,
          decisionRange: { startDate: decision.startDate, endDate: decision.endDate },
          outcome: decision.outcome,
          denialReasonCode: decision.denialReasonCode,
          sourceReviewEventId: replacement.id,
        });
        const envelope = buildEnvelope({
          eventId,
          eventTypeName: "AUTHORIZATION_DAY_DECISION_RECORDED",
          aggregate: { type: "AUTHORIZATION_REVIEW", id: replacement.id, version: replacement.version },
          organizationId: params.organizationId,
          facilityId: episode.facilityId,
          programId: episode.programId,
          unitId: episode.unitId,
          caseId: episode.sourceCaseId,
          episodeId: original.episodeId,
          effectiveAt: occurredAt,
          recordedAt: occurredAt,
          actor: params.actor,
          method: "correctAuthorizationReview",
          correlationId,
          correction: { kind: "ORIGINAL" },
          payload,
        });
        await writeGovernedEventWithOutbox(tx, envelope);
        replacementDecisions.push({ id: row.id, sourceEventId: eventId });
      }

      await this.auditWriter.write(tx, {
        organizationId: params.organizationId,
        caseId: episode.sourceCaseId,
        action: "AUTHORIZATION_REVIEW_CORRECTED",
        actor: params.actor,
        objectType: "AuthorizationReview",
        objectId: replacement.id,
        reason: params.reason,
        metadata: {
          command: "CorrectAuthorizationReview",
          correlationId,
          originalReviewId: original.id,
          reasonCode: params.reasonCode,
          reversalEventCount: reversalEventIds.length,
          replacementDayDecisionCount: params.replacement.dayDecisions.length,
        },
        occurredAt,
      });

      return {
        originalReviewId: original.id,
        replacementReviewId: replacement.id,
        reversalEventIds,
        replacementDayDecisions: replacementDecisions,
      };
    });
  }

  /** Documentation gap: OPEN fact + first history row + event + outbox + audit, atomic. */
  async recordDocumentationGap(params: RecordDocumentationGapParams) {
    const occurredAt = this.now();
    const correlationId = params.correlationId ?? randomUUID();
    return withTenantContext(this.prisma, params.organizationId, async (tx) => {
      const episode = await this.assertEpisodeOwnership(tx, params.organizationId, params.episodeId);
      const gap = await tx.documentationGap.create({
        data: {
          organizationId: params.organizationId,
          episodeId: params.episodeId,
          sourceAuthorizationReviewId: params.sourceAuthorizationReviewId ?? null,
          categoryCode: params.categoryCode,
          operationalSummary: params.operationalSummary ?? null,
          dueAt: params.dueAt ?? null,
          assignedRole: params.assignedRole ?? null,
          assignedUserId: params.assignedUserId ?? null,
          recordedByActorId: params.actor.actorId,
        },
      });
      await tx.documentationGapStatusHistory.create({
        data: {
          organizationId: params.organizationId,
          documentationGapId: gap.id,
          fromStatus: null,
          toStatus: "OPEN",
          changedByActorId: params.actor.actorId,
          changedAt: occurredAt,
        },
      });
      const payload = DocumentationGapRecordedEventPayloadSchema.parse({
        documentationGapId: gap.id,
        episodeId: params.episodeId,
        sourceAuthorizationReviewId: params.sourceAuthorizationReviewId ?? null,
        categoryCode: params.categoryCode,
        status: "OPEN",
        dueAt: params.dueAt ? params.dueAt.toISOString() : null,
        assignedRole: params.assignedRole ?? null,
        assignedUserId: params.assignedUserId ?? null,
        hasOperationalSummary: Boolean(params.operationalSummary),
      });
      const envelope = buildEnvelope({
        eventTypeName: "DOCUMENTATION_GAP_RECORDED",
        aggregate: { type: "DOCUMENTATION_GAP", id: gap.id, version: gap.version },
        organizationId: params.organizationId,
        facilityId: episode.facilityId,
        programId: episode.programId,
        unitId: episode.unitId,
        caseId: episode.sourceCaseId,
        episodeId: params.episodeId,
        effectiveAt: occurredAt,
        recordedAt: occurredAt,
        actor: params.actor,
        method: "recordDocumentationGap",
        correlationId,
        correction: { kind: "ORIGINAL" },
        payload,
      });
      const { eventId } = await writeGovernedEventWithOutbox(tx, envelope);
      await this.auditWriter.write(tx, {
        organizationId: params.organizationId,
        caseId: episode.sourceCaseId,
        action: "DOCUMENTATION_GAP_RECORDED",
        actor: params.actor,
        objectType: "DocumentationGap",
        objectId: gap.id,
        reason: params.reason,
        metadata: {
          command: "RecordDocumentationGap",
          correlationId,
          episodeId: params.episodeId,
          categoryCode: params.categoryCode,
          governedEventId: eventId,
        },
        occurredAt,
      });
      return gap;
    });
  }

  /**
   * Controlled status transition with an appended history row. The transition
   * table lives in @clarity/domain-contracts (S1); the version predicate on
   * the conditional update provides optimistic concurrency. No governed event
   * is emitted: the S1 event vocabulary defines no gap-transition payload.
   */
  async transitionDocumentationGap(params: TransitionDocumentationGapParams) {
    const occurredAt = this.now();
    return withTenantContext(this.prisma, params.organizationId, async (tx) => {
      const gap = await tx.documentationGap.findFirst({
        where: { id: params.documentationGapId, organizationId: params.organizationId },
      });
      if (!gap) throw new DocumentationGapNotFoundError(params.documentationGapId);
      if (!canTransitionDocumentationGap(gap.status, params.toStatus)) {
        throw new InvalidDocumentationGapTransitionError(gap.status, params.toStatus);
      }
      const updated = await tx.documentationGap.updateMany({
        where: { id: gap.id, organizationId: params.organizationId, version: params.expectedVersion },
        data: {
          status: params.toStatus,
          version: { increment: 1 },
          ...(params.toStatus === "RESOLVED" ? { resolvedByActorId: params.actor.actorId } : {}),
        },
      });
      if (updated.count !== 1) {
        throw new ConcurrencyConflictError(gap.id);
      }
      await tx.documentationGapStatusHistory.create({
        data: {
          organizationId: params.organizationId,
          documentationGapId: gap.id,
          fromStatus: gap.status,
          toStatus: params.toStatus,
          reasonCode: params.reasonCode ?? null,
          changedByActorId: params.actor.actorId,
          changedAt: occurredAt,
        },
      });
      await this.auditWriter.write(tx, {
        organizationId: params.organizationId,
        caseId: null,
        action: "DOCUMENTATION_GAP_TRANSITIONED",
        actor: params.actor,
        objectType: "DocumentationGap",
        objectId: gap.id,
        reason: params.reason,
        metadata: {
          fromStatus: gap.status,
          toStatus: params.toStatus,
          reasonCode: params.reasonCode ?? null,
        },
        occurredAt,
      });
      return tx.documentationGap.findFirstOrThrow({ where: { id: gap.id, organizationId: params.organizationId } });
    });
  }
}
