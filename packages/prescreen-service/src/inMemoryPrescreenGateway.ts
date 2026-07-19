import {
  AppendOnlyAuditLog,
  assertNoRestrictedFields,
  assertPrescreenEncounterTransition,
  derivePossiblePathway,
  evaluatePacketReadiness,
  PrescreenEventEnvelopeSchema,
  type AuditEvent,
  type PacketReadinessResult,
  type PacketRequirement,
  type PrescreenAssessmentVersion,
  type PrescreenEncounter,
  type PrescreenEventEnvelope,
  type PrescreenEventType,
} from "@clarity/domain-contracts";
import { sha256Hex } from "./canonical.js";
import {
  AssessmentNotDraftError,
  AssessmentVersionRequiredError,
  PrescreenDomainValidationError,
  PrescreenIdempotencyKeyReusedError,
  PrescreenNotFoundError,
  PrescreenVersionConflictError,
} from "./errors.js";
import type {
  ParsedAttestAssessment,
  ParsedCreateAssessmentSupplement,
  ParsedEvaluateTargetReadiness,
  ParsedSaveAssessmentDraft,
  ParsedStartPrescreenEncounter,
  ParsedSubmitPrescreen,
  ParsedUpdatePacketRequirement,
  PrescreenCommandResult,
  PrescreenGateway,
  PrescreenSubmissionRecord,
} from "./gateway.js";

interface IdempotencyRecord {
  readonly requestFingerprint: string;
  readonly result: PrescreenCommandResult;
}

interface CommandEnvelope {
  readonly organizationId: string;
  readonly actor: { actorId: string; actorType: "USER" | "AGENT" | "SYSTEM"; roleCodes: string[] };
  readonly idempotencyKey: string;
  readonly correlationId?: string;
  readonly occurredAt: string;
}

const TERMINAL_ENCOUNTER_STATUSES = new Set(["HANDED_OFF", "REDIRECTED", "DECLINED", "CANCELLED"]);

/**
 * In-memory prescreen gateway. Proves the atomic command contract for
 * deterministic tests: every mutating command stages its state change,
 * audit event, and outbox envelope first (all validation happens during
 * staging), then commits them together with the idempotency record. A
 * command that fails at any point commits nothing — no state, audit,
 * outbox, or idempotency residue.
 *
 * Nothing here is durable and no delivery happens: the outbox is a
 * recorded contract, not a publication runtime.
 */
export class InMemoryPrescreenGateway implements PrescreenGateway {
  private readonly encounters = new Map<string, PrescreenEncounter>();
  /** Keyed `${organizationId}:${assessmentVersionId}` so every lookup is tenant-scoped by construction. */
  private readonly assessments = new Map<string, PrescreenAssessmentVersion>();
  private readonly assessmentIdsByEncounter = new Map<string, string[]>();
  private readonly requirements = new Map<string, Map<string, PacketRequirement>>();
  private readonly submissions = new Map<string, PrescreenSubmissionRecord>();
  private readonly idempotency = new Map<string, IdempotencyRecord>();
  private readonly audit = new AppendOnlyAuditLog();
  private readonly outbox: PrescreenEventEnvelope[] = [];
  private encounterSequence = 0;
  private eventSequence = 0;

  startEncounter(cmd: ParsedStartPrescreenEncounter): PrescreenCommandResult {
    return this.idempotent(cmd, "StartPrescreenEncounter", () => {
      this.encounterSequence += 1;
      const encounterId = `pre_syn_${this.encounterSequence}`;
      const encounter: PrescreenEncounter = {
        encounterId,
        caseId: cmd.caseId,
        organizationId: cmd.organizationId,
        status: "DRAFT",
        version: 1,
        currentLocation: cmd.currentLocation,
        presentingConcern: cmd.presentingConcern,
        possiblePathway: "UNDETERMINED",
        createdBy: cmd.actor.actorId,
        createdAt: cmd.occurredAt,
        updatedAt: cmd.occurredAt,
      };
      const commit = this.stageRecord(cmd, {
        eventType: "PRESCREEN_ENCOUNTER_STARTED",
        aggregateType: "PrescreenEncounter",
        aggregateId: encounterId,
        aggregateVersion: 1,
        caseId: cmd.caseId,
        encounterId,
        payload: {
          encounterId,
          caseId: cmd.caseId,
          currentLocationHash: sha256Hex(cmd.currentLocation),
          presentingConcernHash: sha256Hex(cmd.presentingConcern),
        },
      });
      this.encounters.set(encounterId, encounter);
      this.assessmentIdsByEncounter.set(encounterId, []);
      commit();
      return this.result(encounterId, "PrescreenEncounter", encounterId, 1, "DRAFT");
    });
  }

  saveAssessmentDraft(cmd: ParsedSaveAssessmentDraft): PrescreenCommandResult {
    return this.idempotent(cmd, "SaveAssessmentDraft", () => {
      const encounter = this.requireEncounter(cmd.organizationId, cmd.encounterId);
      this.assertExpectedVersion(encounter.version, cmd.expectedVersion);
      const existing = this.assessments.get(this.assessmentKey(cmd.organizationId, cmd.draft.assessmentVersionId));
      if (existing && existing.encounterId !== encounter.encounterId) throw new PrescreenNotFoundError("assessment");
      if (existing && existing.status !== "DRAFT") throw new AssessmentNotDraftError();
      if (encounter.status !== "DRAFT") {
        throw new PrescreenDomainValidationError("The prescreen encounter is not editable as a draft.");
      }

      const pathway = derivePossiblePathway({
        willingness: cmd.draft.willingness,
        orientation: cmd.draft.orientation,
        immediateMedicalStabilizationRequired: cmd.draft.immediateMedicalStabilizationRequired,
        activeEmergencyOrLegalProcess: cmd.draft.activeEmergencyOrLegalProcess,
      });
      const versionIds = this.assessmentIdsByEncounter.get(encounter.encounterId) ?? [];
      const versionNumber = existing ? existing.versionNumber : versionIds.length + 1;
      const stored: PrescreenAssessmentVersion = {
        assessmentVersionId: cmd.draft.assessmentVersionId,
        encounterId: encounter.encounterId,
        organizationId: encounter.organizationId,
        versionNumber,
        status: "DRAFT",
        createdAt: existing ? existing.createdAt : cmd.occurredAt,
        createdBy: existing ? existing.createdBy : cmd.actor.actorId,
        willingness: cmd.draft.willingness,
        orientation: cmd.draft.orientation,
        immediateMedicalStabilizationRequired: cmd.draft.immediateMedicalStabilizationRequired,
        activeEmergencyOrLegalProcess: cmd.draft.activeEmergencyOrLegalProcess,
        possiblePathway: pathway.pathway,
        answers: cmd.draft.answers.map((answer) => ({
          ...answer,
          recordedAt: cmd.occurredAt,
          recordedBy: cmd.actor.actorId,
        })),
        sources: cmd.draft.sources.map((source) => ({ ...source, recordedAt: cmd.occurredAt })),
      };
      const updated: PrescreenEncounter = {
        ...encounter,
        currentAssessmentVersionId: stored.assessmentVersionId,
        possiblePathway: pathway.pathway,
        version: encounter.version + 1,
        updatedAt: cmd.occurredAt,
      };
      const commit = this.stageRecord(cmd, {
        eventType: "ASSESSMENT_DRAFT_SAVED",
        aggregateType: "PrescreenAssessmentVersion",
        aggregateId: stored.assessmentVersionId,
        aggregateVersion: updated.version,
        caseId: encounter.caseId,
        encounterId: encounter.encounterId,
        payload: {
          assessmentVersionId: stored.assessmentVersionId,
          versionNumber,
          derivedPossiblePathway: pathway.pathway,
          contentHash: this.assessmentContentHash(stored),
        },
      });
      this.assessments.set(this.assessmentKey(cmd.organizationId, stored.assessmentVersionId), stored);
      if (!versionIds.includes(stored.assessmentVersionId)) {
        this.assessmentIdsByEncounter.set(encounter.encounterId, [...versionIds, stored.assessmentVersionId]);
      }
      this.encounters.set(encounter.encounterId, updated);
      commit();
      return this.result(stored.assessmentVersionId, "PrescreenAssessmentVersion", encounter.encounterId, updated.version, "DRAFT");
    });
  }

  attestAssessment(cmd: ParsedAttestAssessment): PrescreenCommandResult {
    return this.idempotent(cmd, "AttestAssessment", () => {
      const encounter = this.requireEncounter(cmd.organizationId, cmd.encounterId);
      this.assertExpectedVersion(encounter.version, cmd.expectedVersion);
      const assessment = this.requireAssessment(cmd.organizationId, cmd.assessmentVersionId);
      if (assessment.encounterId !== encounter.encounterId) throw new PrescreenNotFoundError("assessment");
      if (assessment.status !== "DRAFT") throw new AssessmentNotDraftError();
      assertPrescreenEncounterTransition(encounter.status, "ATTESTED");

      const attested: PrescreenAssessmentVersion = {
        ...assessment,
        status: "ATTESTED",
        attestedAt: cmd.occurredAt,
        attestedBy: cmd.actor.actorId,
        contentHash: this.assessmentContentHash(assessment),
      };
      const updated: PrescreenEncounter = {
        ...encounter,
        status: "ATTESTED",
        version: encounter.version + 1,
        updatedAt: cmd.occurredAt,
      };
      const commit = this.stageRecord(cmd, {
        eventType: "ASSESSMENT_ATTESTED",
        aggregateType: "PrescreenAssessmentVersion",
        aggregateId: attested.assessmentVersionId,
        aggregateVersion: updated.version,
        caseId: encounter.caseId,
        encounterId: encounter.encounterId,
        payload: {
          assessmentVersionId: attested.assessmentVersionId,
          attestedBy: cmd.actor.actorId,
          attestedAt: cmd.occurredAt,
          contentHash: attested.contentHash,
        },
      });
      this.assessments.set(this.assessmentKey(cmd.organizationId, attested.assessmentVersionId), attested);
      this.encounters.set(encounter.encounterId, updated);
      commit();
      return this.result(attested.assessmentVersionId, "PrescreenAssessmentVersion", encounter.encounterId, updated.version, "ATTESTED");
    });
  }

  createAssessmentSupplement(cmd: ParsedCreateAssessmentSupplement): PrescreenCommandResult {
    return this.idempotent(cmd, "CreateAssessmentSupplement", () => {
      const encounter = this.requireEncounter(cmd.organizationId, cmd.encounterId);
      this.assertExpectedVersion(encounter.version, cmd.expectedVersion);
      if (encounter.status !== "ATTESTED" && encounter.status !== "SUBMITTED") {
        throw new PrescreenDomainValidationError(
          "A supplement requires an attested prescreen encounter.",
        );
      }
      const parent = this.requireAssessment(cmd.organizationId, cmd.parentAssessmentVersionId);
      if (parent.encounterId !== encounter.encounterId) throw new PrescreenNotFoundError("assessment");
      if (parent.status === "DRAFT") {
        throw new AssessmentVersionRequiredError("A supplement requires an attested parent assessment version.");
      }
      // Tenant-scoped check: another organization's use of the same id is
      // invisible here, so this discloses nothing across tenants.
      if (this.assessments.has(this.assessmentKey(cmd.organizationId, cmd.draft.assessmentVersionId))) {
        throw new PrescreenDomainValidationError("The supplement assessment version id is already in use.");
      }

      const pathway = derivePossiblePathway({
        willingness: cmd.draft.willingness,
        orientation: cmd.draft.orientation,
        immediateMedicalStabilizationRequired: cmd.draft.immediateMedicalStabilizationRequired,
        activeEmergencyOrLegalProcess: cmd.draft.activeEmergencyOrLegalProcess,
      });
      const versionIds = this.assessmentIdsByEncounter.get(encounter.encounterId) ?? [];
      const supplementBase: PrescreenAssessmentVersion = {
        assessmentVersionId: cmd.draft.assessmentVersionId,
        encounterId: encounter.encounterId,
        organizationId: encounter.organizationId,
        versionNumber: versionIds.length + 1,
        status: "CORRECTED",
        createdAt: cmd.occurredAt,
        createdBy: cmd.actor.actorId,
        attestedAt: cmd.occurredAt,
        attestedBy: cmd.actor.actorId,
        parentVersionId: parent.assessmentVersionId,
        changeReason: cmd.reason,
        willingness: cmd.draft.willingness,
        orientation: cmd.draft.orientation,
        immediateMedicalStabilizationRequired: cmd.draft.immediateMedicalStabilizationRequired,
        activeEmergencyOrLegalProcess: cmd.draft.activeEmergencyOrLegalProcess,
        possiblePathway: pathway.pathway,
        answers: cmd.draft.answers.map((answer) => ({
          ...answer,
          recordedAt: cmd.occurredAt,
          recordedBy: cmd.actor.actorId,
        })),
        sources: cmd.draft.sources.map((source) => ({ ...source, recordedAt: cmd.occurredAt })),
      };
      const supplement: PrescreenAssessmentVersion = {
        ...supplementBase,
        contentHash: this.assessmentContentHash(supplementBase),
      };
      const updated: PrescreenEncounter = {
        ...encounter,
        currentAssessmentVersionId: supplement.assessmentVersionId,
        possiblePathway: supplement.possiblePathway,
        version: encounter.version + 1,
        updatedAt: cmd.occurredAt,
      };
      const commit = this.stageRecord(cmd, {
        eventType: "ASSESSMENT_SUPPLEMENTED",
        aggregateType: "PrescreenAssessmentVersion",
        aggregateId: supplement.assessmentVersionId,
        aggregateVersion: updated.version,
        caseId: encounter.caseId,
        encounterId: encounter.encounterId,
        payload: {
          parentVersionId: parent.assessmentVersionId,
          supplementVersionId: supplement.assessmentVersionId,
          reasonHash: sha256Hex(cmd.reason),
          contentHash: supplement.contentHash,
        },
      });
      this.assessments.set(this.assessmentKey(cmd.organizationId, supplement.assessmentVersionId), supplement);
      this.assessmentIdsByEncounter.set(encounter.encounterId, [...versionIds, supplement.assessmentVersionId]);
      this.encounters.set(encounter.encounterId, updated);
      commit();
      return this.result(supplement.assessmentVersionId, "PrescreenAssessmentVersion", encounter.encounterId, updated.version, "CORRECTED");
    });
  }

  submitPrescreen(cmd: ParsedSubmitPrescreen): PrescreenCommandResult {
    return this.idempotent(cmd, "SubmitPrescreen", () => {
      const encounter = this.requireEncounter(cmd.organizationId, cmd.encounterId);
      this.assertExpectedVersion(encounter.version, cmd.expectedVersion);
      const assessment = this.requireAssessment(cmd.organizationId, cmd.assessmentVersionId);
      if (assessment.encounterId !== encounter.encounterId) throw new PrescreenNotFoundError("assessment");
      if (assessment.status === "DRAFT") {
        throw new AssessmentVersionRequiredError("Submission requires an immutable (attested) assessment version.");
      }
      if (assessment.assessmentVersionId !== encounter.currentAssessmentVersionId) {
        throw new AssessmentVersionRequiredError(
          "Submission must reference the encounter's current assessment version.",
        );
      }
      assertPrescreenEncounterTransition(encounter.status, "SUBMITTED");

      const submission: PrescreenSubmissionRecord = {
        encounterId: encounter.encounterId,
        organizationId: encounter.organizationId,
        assessmentVersionId: assessment.assessmentVersionId,
        target: cmd.target,
        receivingOrganizationId: cmd.receivingOrganizationId,
        submittedAt: cmd.occurredAt,
        submittedBy: cmd.actor.actorId,
      };
      const updated: PrescreenEncounter = {
        ...encounter,
        status: "SUBMITTED",
        version: encounter.version + 1,
        updatedAt: cmd.occurredAt,
      };
      const commit = this.stageRecord(cmd, {
        eventType: "PRESCREEN_SUBMITTED",
        aggregateType: "PrescreenEncounter",
        aggregateId: encounter.encounterId,
        aggregateVersion: updated.version,
        caseId: encounter.caseId,
        encounterId: encounter.encounterId,
        payload: {
          assessmentVersionId: assessment.assessmentVersionId,
          target: cmd.target,
          receivingOrganizationId: cmd.receivingOrganizationId,
          contentHash: assessment.contentHash ?? this.assessmentContentHash(assessment),
        },
      });
      this.submissions.set(encounter.encounterId, submission);
      this.encounters.set(encounter.encounterId, updated);
      commit();
      return this.result(encounter.encounterId, "PrescreenEncounter", encounter.encounterId, updated.version, "SUBMITTED");
    });
  }

  updatePacketRequirement(cmd: ParsedUpdatePacketRequirement): PrescreenCommandResult {
    return this.idempotent(cmd, "UpdatePacketRequirement", () => {
      const encounter = this.requireEncounter(cmd.organizationId, cmd.encounterId);
      this.assertExpectedVersion(encounter.version, cmd.expectedVersion);
      if (TERMINAL_ENCOUNTER_STATUSES.has(encounter.status)) {
        throw new PrescreenDomainValidationError("Packet requirements cannot change on a terminal encounter.");
      }
      const byCode = this.requirements.get(encounter.encounterId) ?? new Map<string, PacketRequirement>();
      const previous = byCode.get(cmd.requirementCode);
      const requirement: PacketRequirement = {
        requirementCode: cmd.requirementCode,
        label: cmd.label,
        state: cmd.state,
        blockingTargets: cmd.blockingTargets,
        ...(cmd.responsibleRoleCode === undefined ? {} : { responsibleRoleCode: cmd.responsibleRoleCode }),
        resolutionWorkspace: cmd.resolutionWorkspace,
        sourceRuleId: cmd.sourceRuleId,
        sourceRuleVersion: cmd.sourceRuleVersion,
      };
      const updated: PrescreenEncounter = {
        ...encounter,
        version: encounter.version + 1,
        updatedAt: cmd.occurredAt,
      };
      const commit = this.stageRecord(cmd, {
        eventType: "PACKET_REQUIREMENT_STATE_CHANGED",
        aggregateType: "PacketRequirement",
        aggregateId: `${encounter.encounterId}:${cmd.requirementCode}`,
        aggregateVersion: updated.version,
        caseId: encounter.caseId,
        encounterId: encounter.encounterId,
        payload: {
          requirementCode: cmd.requirementCode,
          previousState: previous?.state ?? null,
          newState: cmd.state,
          sourceRuleId: cmd.sourceRuleId,
          sourceRuleVersion: cmd.sourceRuleVersion,
        },
      });
      byCode.set(cmd.requirementCode, requirement);
      this.requirements.set(encounter.encounterId, byCode);
      this.encounters.set(encounter.encounterId, updated);
      commit();
      return this.result(`${encounter.encounterId}:${cmd.requirementCode}`, "PacketRequirement", encounter.encounterId, updated.version, cmd.state);
    });
  }

  evaluateTargetReadiness(cmd: ParsedEvaluateTargetReadiness): PacketReadinessResult {
    const encounter = this.requireEncounter(cmd.organizationId, cmd.encounterId);
    const requirements = [...(this.requirements.get(encounter.encounterId)?.values() ?? [])];
    return evaluatePacketReadiness(cmd.target, requirements);
  }

  getEncounter(organizationId: string, encounterId: string): PrescreenEncounter {
    return structuredClone(this.requireEncounter(organizationId, encounterId));
  }

  getAssessmentVersion(organizationId: string, assessmentVersionId: string): PrescreenAssessmentVersion {
    return structuredClone(this.requireAssessment(organizationId, assessmentVersionId));
  }

  getSubmission(organizationId: string, encounterId: string): PrescreenSubmissionRecord | undefined {
    const submission = this.submissions.get(encounterId);
    if (!submission || submission.organizationId !== organizationId) return undefined;
    return structuredClone(submission);
  }

  listPacketRequirements(organizationId: string, encounterId: string): readonly PacketRequirement[] {
    this.requireEncounter(organizationId, encounterId);
    return structuredClone([...(this.requirements.get(encounterId)?.values() ?? [])]);
  }

  auditEvents(): readonly AuditEvent[] {
    return this.audit.list();
  }

  outboxEnvelopes(): readonly PrescreenEventEnvelope[] {
    return [...this.outbox];
  }

  idempotencyRecordCount(): number {
    return this.idempotency.size;
  }

  // -------------------------------------------------------------------------

  private requireEncounter(organizationId: string, encounterId: string): PrescreenEncounter {
    const encounter = this.encounters.get(encounterId);
    if (!encounter || encounter.organizationId !== organizationId) throw new PrescreenNotFoundError("encounter");
    return encounter;
  }

  private assessmentKey(organizationId: string, assessmentVersionId: string): string {
    return `${organizationId}:${assessmentVersionId}`;
  }

  private requireAssessment(organizationId: string, assessmentVersionId: string): PrescreenAssessmentVersion {
    const assessment = this.assessments.get(this.assessmentKey(organizationId, assessmentVersionId));
    if (!assessment) throw new PrescreenNotFoundError("assessment");
    return assessment;
  }

  private assertExpectedVersion(actual: number, expected: number | undefined): void {
    if (expected !== undefined && actual !== expected) throw new PrescreenVersionConflictError();
  }

  private assessmentContentHash(assessment: PrescreenAssessmentVersion): string {
    return sha256Hex({
      willingness: assessment.willingness,
      orientation: assessment.orientation,
      immediateMedicalStabilizationRequired: assessment.immediateMedicalStabilizationRequired,
      activeEmergencyOrLegalProcess: assessment.activeEmergencyOrLegalProcess,
      answers: assessment.answers,
      sources: assessment.sources,
      parentVersionId: assessment.parentVersionId ?? null,
    });
  }

  /**
   * Stage the audit event and outbox envelope for a command. All validation
   * (restricted-field guard, envelope schema) runs here, before the caller
   * mutates any state; the returned closure only appends, so a staged
   * commit cannot fail halfway.
   */
  private stageRecord(
    cmd: CommandEnvelope,
    record: {
      eventType: PrescreenEventType;
      aggregateType: string;
      aggregateId: string;
      aggregateVersion: number;
      caseId: string;
      encounterId: string;
      payload: Record<string, unknown>;
    },
  ): () => void {
    assertNoRestrictedFields(record.payload);
    this.eventSequence += 1;
    const envelope = PrescreenEventEnvelopeSchema.parse({
      eventId: `evt_prescreen_syn_${this.eventSequence}`,
      schemaName: "clarity.prescreen.event",
      schemaVersion: "1.0.0",
      eventType: record.eventType,
      organizationId: cmd.organizationId,
      caseId: record.caseId,
      encounterId: record.encounterId,
      aggregateType: record.aggregateType,
      aggregateId: record.aggregateId,
      aggregateVersion: record.aggregateVersion,
      eventTime: cmd.occurredAt,
      // In-memory slice: recordedTime mirrors the command's occurredAt so
      // tests stay deterministic; a persistence adapter stamps server time.
      recordedTime: cmd.occurredAt,
      // Envelope vocabulary is USER | SOURCE_SYSTEM | SERVICE (package
      // contract); command AGENT/SYSTEM actors both record as SERVICE.
      actor: {
        actorType: cmd.actor.actorType === "USER" ? "USER" : "SERVICE",
        actorId: cmd.actor.actorId,
        roleCodes: cmd.actor.roleCodes,
      },
      source: { sourceSystem: "clarity.prescreen-service" },
      correlationId: cmd.correlationId ?? cmd.idempotencyKey,
      idempotencyKey: cmd.idempotencyKey,
      phiClassification: "RESTRICTED_PHI",
      dataQualityState: "VALIDATED",
      reviewState: "NOT_REQUIRED",
      payload: record.payload,
    });
    const auditEvent: Omit<AuditEvent, "sequence"> = {
      action: record.eventType,
      actorType: cmd.actor.actorType,
      actorId: cmd.actor.actorId,
      organizationId: cmd.organizationId,
      caseKey: record.caseId,
      occurredAt: cmd.occurredAt,
      payload: record.payload,
    };
    return () => {
      this.audit.append(auditEvent);
      this.outbox.push(envelope);
    };
  }

  private result(
    objectId: string,
    objectType: PrescreenCommandResult["objectType"],
    encounterId: string,
    encounterVersion: number,
    status: string,
  ): PrescreenCommandResult {
    return { objectId, objectType, encounterId, encounterVersion, status, replayed: false };
  }

  private idempotent(
    cmd: CommandEnvelope & Record<string, unknown>,
    commandName: string,
    execute: () => PrescreenCommandResult,
  ): PrescreenCommandResult {
    const key = `${cmd.organizationId}:${cmd.actor.actorId}:${commandName}:${cmd.idempotencyKey}`;
    const { correlationId: _correlationId, idempotencyKey: _idempotencyKey, ...body } = cmd;
    const fingerprint = sha256Hex(body);
    const prior = this.idempotency.get(key);
    if (prior) {
      if (prior.requestFingerprint !== fingerprint) throw new PrescreenIdempotencyKeyReusedError();
      return { ...prior.result, replayed: true };
    }
    const result = execute();
    this.idempotency.set(key, { requestFingerprint: fingerprint, result });
    return result;
  }
}
