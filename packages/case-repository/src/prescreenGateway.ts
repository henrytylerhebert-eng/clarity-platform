import { createHash, randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import type {
  PrescreenAssessmentVersion as PrescreenAssessmentVersionRow,
  PrescreenEncounter as PrescreenEncounterRow,
  PrescreenPacketRequirement as PrescreenPacketRequirementRow,
  PrescreenSubmission as PrescreenSubmissionRow,
} from "@prisma/client";
import {
  AssessmentNotDraftError,
  AssessmentVersionRequiredError,
  PRESCREEN_EVENT_TYPES,
  PrescreenDomainValidationError,
  PrescreenEventEnvelopeSchema,
  PrescreenIdempotencyKeyReusedError,
  PrescreenNotFoundError,
  PrescreenVersionConflictError,
  assertPrescreenEncounterTransition,
  canonicalStringify,
  derivePossiblePathway,
  evaluatePacketReadiness,
  prescreenFingerprintBody,
  type AuditEvent,
  type PacketReadinessResult,
  type PacketRequirement,
  type ParsedAttestAssessment,
  type ParsedCreateAssessmentSupplement,
  type ParsedEvaluateTargetReadiness,
  type ParsedSaveAssessmentDraft,
  type ParsedStartPrescreenEncounter,
  type ParsedSubmitPrescreen,
  type ParsedUpdatePacketRequirement,
  type PrescreenAssessmentVersion,
  type PrescreenCommandResult,
  type PrescreenEncounter,
  type PrescreenEventEnvelope,
  type PrescreenEventType,
  type PrescreenSubmissionRecord,
} from "@clarity/domain-contracts";
import { PrismaCaseAuditWriter, type CaseAuditWriter, type TxClient } from "./auditWriter.js";
import { withTenantContext } from "./tenantContext.js";

/**
 * The single approved Prisma adapter for prescreen commands (Phase 3 —
 * local clarity_dev slice; provider-backed verification remains separately
 * gated). Mirrors the in-memory gateway's decision logic branch for branch;
 * every mutating command runs in ONE tenant-context transaction:
 *
 *   namespaced idempotency lookup (fingerprint replay/conflict, ADR-0014 §5)
 *   → tenant-scoped fresh read → state machine on the fresh row
 *   → conditional versioned UPDATE → prescreen event envelope persisted as a
 *     governed-event row + outbox row (storage reuse, not event-vocabulary
 *     expansion) → append-only audit event → idempotency record.
 *
 * A command that fails at any point commits nothing. Submission records
 * intent only; nothing here can express acknowledgement, review,
 * acceptance, admission, transport authority, or cross-organization access.
 */

const TERMINAL_ENCOUNTER_STATUSES = new Set(["HANDED_OFF", "REDIRECTED", "DECLINED", "CANCELLED"]);
const PRESCREEN_SCHEMA_NAME = "clarity.prescreen.event";
const PRESCREEN_KEY_NAMESPACE = "prescreen";

interface CommandEnvelope {
  readonly organizationId: string;
  readonly actor: { actorId: string; actorType: "USER" | "AGENT" | "SYSTEM"; roleCodes: string[] };
  readonly idempotencyKey: string;
  readonly correlationId?: string;
  readonly occurredAt: string;
}

type PrescreenCommandName =
  | "StartPrescreenEncounter"
  | "SaveAssessmentDraft"
  | "AttestAssessment"
  | "CreateAssessmentSupplement"
  | "SubmitPrescreen"
  | "UpdatePacketRequirement";

function sha256HexOfCanonical(value: unknown): string {
  return createHash("sha256").update(canonicalStringify(value)).digest("hex");
}

/** Same bytes as the in-memory gateway's fingerprint: SHA-256 of the shared canonical body. */
function requestFingerprint(cmd: Record<string, unknown>): string {
  return createHash("sha256").update(prescreenFingerprintBody(cmd)).digest("hex");
}

/**
 * The stored idempotency key embeds command name and actor so the Phase 2
 * key-scoping semantics (`org × actor × command × key`) survive the shared
 * table's (organizationId, idempotencyKey) uniqueness unchanged.
 */
function namespacedKey(commandName: PrescreenCommandName, cmd: CommandEnvelope): string {
  return `${PRESCREEN_KEY_NAMESPACE}/${commandName}/${cmd.actor.actorId}/${cmd.idempotencyKey}`;
}

function isIdempotencyUniqueViolation(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError &&
    e.code === "P2002" &&
    String(e.meta?.modelName ?? "").includes("CommandIdempotencyRecord")
  );
}

function isAssessmentIdUniqueViolation(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError &&
    e.code === "P2002" &&
    String(e.meta?.modelName ?? "").includes("PrescreenAssessmentVersion")
  );
}

function iso(value: Date): string {
  return value.toISOString();
}

function encounterRowToDomain(row: PrescreenEncounterRow): PrescreenEncounter {
  return {
    encounterId: row.id,
    caseId: row.caseId,
    organizationId: row.organizationId,
    status: row.status,
    version: row.version,
    currentLocation: row.currentLocation,
    presentingConcern: row.presentingConcern,
    ...(row.currentAssessmentVersionId === null
      ? {}
      : { currentAssessmentVersionId: row.currentAssessmentVersionId }),
    possiblePathway: row.possiblePathway,
    createdBy: row.createdBy,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

function assessmentRowToDomain(row: PrescreenAssessmentVersionRow): PrescreenAssessmentVersion {
  return {
    assessmentVersionId: row.assessmentVersionId,
    encounterId: row.encounterId,
    organizationId: row.organizationId,
    versionNumber: row.versionNumber,
    status: row.status,
    createdAt: iso(row.createdAt),
    createdBy: row.createdBy,
    ...(row.attestedAt === null ? {} : { attestedAt: iso(row.attestedAt) }),
    ...(row.attestedBy === null ? {} : { attestedBy: row.attestedBy }),
    ...(row.parentVersionId === null ? {} : { parentVersionId: row.parentVersionId }),
    ...(row.changeReason === null ? {} : { changeReason: row.changeReason }),
    willingness: row.willingness,
    orientation: row.orientation as PrescreenAssessmentVersion["orientation"],
    immediateMedicalStabilizationRequired: row.immediateMedicalStabilizationRequired,
    activeEmergencyOrLegalProcess: row.activeEmergencyOrLegalProcess,
    possiblePathway: row.possiblePathway,
    answers: row.answers as PrescreenAssessmentVersion["answers"],
    sources: row.sources as PrescreenAssessmentVersion["sources"],
    ...(row.contentHash === null ? {} : { contentHash: row.contentHash }),
  };
}

function requirementRowToDomain(row: PrescreenPacketRequirementRow): PacketRequirement {
  return {
    requirementCode: row.requirementCode,
    label: row.label,
    state: row.state,
    blockingTargets: row.blockingTargets,
    ...(row.responsibleRoleCode === null ? {} : { responsibleRoleCode: row.responsibleRoleCode }),
    resolutionWorkspace: row.resolutionWorkspace,
    sourceRuleId: row.sourceRuleId,
    sourceRuleVersion: row.sourceRuleVersion,
  };
}

function submissionRowToDomain(row: PrescreenSubmissionRow): PrescreenSubmissionRecord {
  return {
    encounterId: row.encounterId,
    organizationId: row.organizationId,
    assessmentVersionId: row.assessmentVersionId,
    target: row.target,
    receivingOrganizationId: row.receivingOrganizationId,
    submittedAt: iso(row.submittedAt),
    submittedBy: row.submittedBy,
  };
}

/** The exact fields the in-memory gateway hashes, in the exact same shape. */
function assessmentContentHash(assessment: PrescreenAssessmentVersion): string {
  return sha256HexOfCanonical({
    willingness: assessment.willingness,
    orientation: assessment.orientation,
    immediateMedicalStabilizationRequired: assessment.immediateMedicalStabilizationRequired,
    activeEmergencyOrLegalProcess: assessment.activeEmergencyOrLegalProcess,
    answers: assessment.answers,
    sources: assessment.sources,
    parentVersionId: assessment.parentVersionId ?? null,
  });
}

export class PrismaPrescreenGateway {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly auditWriter: CaseAuditWriter = new PrismaCaseAuditWriter(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  // -------------------------------------------------------------------------
  // Commands
  // -------------------------------------------------------------------------

  async startEncounter(cmd: ParsedStartPrescreenEncounter): Promise<PrescreenCommandResult> {
    return this.idempotent(cmd, "StartPrescreenEncounter", async (tx) => {
      // Real tenant-checked case linkage (Phase 3 ruling): the miss is the
      // same non-revealing answer whether the case is absent or cross-tenant.
      const linkedCase = await tx.behavioralHealthCase.findFirst({
        where: { id: cmd.caseId, organizationId: cmd.organizationId },
        select: { id: true },
      });
      if (!linkedCase) throw new PrescreenNotFoundError("case");

      const occurredAt = new Date(cmd.occurredAt);
      const row = await tx.prescreenEncounter.create({
        data: {
          organizationId: cmd.organizationId,
          caseId: cmd.caseId,
          status: "DRAFT",
          version: 1,
          currentLocation: cmd.currentLocation,
          presentingConcern: cmd.presentingConcern,
          possiblePathway: "UNDETERMINED",
          createdBy: cmd.actor.actorId,
          createdAt: occurredAt,
          updatedAt: occurredAt,
        },
      });
      await this.recordEventAndAudit(tx, cmd, {
        eventType: "PRESCREEN_ENCOUNTER_STARTED",
        aggregateType: "PrescreenEncounter",
        aggregateId: row.id,
        aggregateVersion: 1,
        caseId: cmd.caseId,
        encounterId: row.id,
        payload: {
          encounterId: row.id,
          caseId: cmd.caseId,
          currentLocationHash: sha256HexOfCanonical(cmd.currentLocation),
          presentingConcernHash: sha256HexOfCanonical(cmd.presentingConcern),
        },
      });
      return {
        result: this.result(row.id, "PrescreenEncounter", row.id, 1, "DRAFT"),
        caseId: cmd.caseId,
      };
    });
  }

  async saveAssessmentDraft(cmd: ParsedSaveAssessmentDraft): Promise<PrescreenCommandResult> {
    return this.idempotent(cmd, "SaveAssessmentDraft", async (tx) => {
      const encounter = await this.requireEncounterTx(tx, cmd.organizationId, cmd.encounterId);
      this.assertExpectedVersion(encounter.version, cmd.expectedVersion);
      const existing = await tx.prescreenAssessmentVersion.findUnique({
        where: {
          organizationId_assessmentVersionId: {
            organizationId: cmd.organizationId,
            assessmentVersionId: cmd.draft.assessmentVersionId,
          },
        },
      });
      if (existing && existing.encounterId !== encounter.id) throw new PrescreenNotFoundError("assessment");
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
      const versionNumber = existing
        ? existing.versionNumber
        : (await tx.prescreenAssessmentVersion.count({
            where: { organizationId: cmd.organizationId, encounterId: encounter.id },
          })) + 1;
      const answers = cmd.draft.answers.map((answer) => ({
        ...answer,
        recordedAt: cmd.occurredAt,
        recordedBy: cmd.actor.actorId,
      }));
      const sources = cmd.draft.sources.map((source) => ({ ...source, recordedAt: cmd.occurredAt }));
      const domainShape: PrescreenAssessmentVersion = {
        assessmentVersionId: cmd.draft.assessmentVersionId,
        encounterId: encounter.id,
        organizationId: encounter.organizationId,
        versionNumber,
        status: "DRAFT",
        createdAt: existing ? iso(existing.createdAt) : cmd.occurredAt,
        createdBy: existing ? existing.createdBy : cmd.actor.actorId,
        willingness: cmd.draft.willingness,
        orientation: cmd.draft.orientation,
        immediateMedicalStabilizationRequired: cmd.draft.immediateMedicalStabilizationRequired,
        activeEmergencyOrLegalProcess: cmd.draft.activeEmergencyOrLegalProcess,
        possiblePathway: pathway.pathway,
        answers,
        sources,
      };
      const data = {
        versionNumber,
        status: "DRAFT" as const,
        willingness: cmd.draft.willingness,
        orientation: cmd.draft.orientation as unknown as Prisma.InputJsonValue,
        immediateMedicalStabilizationRequired: cmd.draft.immediateMedicalStabilizationRequired,
        activeEmergencyOrLegalProcess: cmd.draft.activeEmergencyOrLegalProcess,
        possiblePathway: pathway.pathway,
        answers: answers as unknown as Prisma.InputJsonValue,
        sources: sources as unknown as Prisma.InputJsonValue,
      };
      if (existing) {
        await tx.prescreenAssessmentVersion.update({ where: { id: existing.id }, data });
      } else {
        await tx.prescreenAssessmentVersion.create({
          data: {
            ...data,
            organizationId: cmd.organizationId,
            assessmentVersionId: cmd.draft.assessmentVersionId,
            encounterId: encounter.id,
            createdAt: new Date(cmd.occurredAt),
            createdBy: cmd.actor.actorId,
          },
        });
      }
      const newVersion = await this.versionedEncounterUpdate(tx, encounter, {
        currentAssessmentVersionId: cmd.draft.assessmentVersionId,
        possiblePathway: pathway.pathway,
        updatedAt: new Date(cmd.occurredAt),
      });
      await this.recordEventAndAudit(tx, cmd, {
        eventType: "ASSESSMENT_DRAFT_SAVED",
        aggregateType: "PrescreenAssessmentVersion",
        aggregateId: cmd.draft.assessmentVersionId,
        aggregateVersion: newVersion,
        caseId: encounter.caseId,
        encounterId: encounter.id,
        payload: {
          assessmentVersionId: cmd.draft.assessmentVersionId,
          versionNumber,
          derivedPossiblePathway: pathway.pathway,
          contentHash: assessmentContentHash(domainShape),
        },
      });
      return {
        result: this.result(
          cmd.draft.assessmentVersionId,
          "PrescreenAssessmentVersion",
          encounter.id,
          newVersion,
          "DRAFT",
        ),
        caseId: encounter.caseId,
      };
    });
  }

  async attestAssessment(cmd: ParsedAttestAssessment): Promise<PrescreenCommandResult> {
    return this.idempotent(cmd, "AttestAssessment", async (tx) => {
      const encounter = await this.requireEncounterTx(tx, cmd.organizationId, cmd.encounterId);
      this.assertExpectedVersion(encounter.version, cmd.expectedVersion);
      const assessment = await this.requireAssessmentTx(tx, cmd.organizationId, cmd.assessmentVersionId);
      if (assessment.encounterId !== encounter.id) throw new PrescreenNotFoundError("assessment");
      if (assessment.status !== "DRAFT") throw new AssessmentNotDraftError();
      assertPrescreenEncounterTransition(encounter.status, "ATTESTED");

      const contentHash = assessmentContentHash(assessmentRowToDomain(assessment));
      await tx.prescreenAssessmentVersion.update({
        where: { id: assessment.id },
        data: {
          status: "ATTESTED",
          attestedAt: new Date(cmd.occurredAt),
          attestedBy: cmd.actor.actorId,
          contentHash,
        },
      });
      const newVersion = await this.versionedEncounterUpdate(tx, encounter, {
        status: "ATTESTED",
        updatedAt: new Date(cmd.occurredAt),
      });
      await this.recordEventAndAudit(tx, cmd, {
        eventType: "ASSESSMENT_ATTESTED",
        aggregateType: "PrescreenAssessmentVersion",
        aggregateId: assessment.assessmentVersionId,
        aggregateVersion: newVersion,
        caseId: encounter.caseId,
        encounterId: encounter.id,
        payload: {
          assessmentVersionId: assessment.assessmentVersionId,
          attestedBy: cmd.actor.actorId,
          attestedAt: cmd.occurredAt,
          contentHash,
        },
      });
      return {
        result: this.result(
          assessment.assessmentVersionId,
          "PrescreenAssessmentVersion",
          encounter.id,
          newVersion,
          "ATTESTED",
        ),
        caseId: encounter.caseId,
      };
    });
  }

  async createAssessmentSupplement(cmd: ParsedCreateAssessmentSupplement): Promise<PrescreenCommandResult> {
    try {
      return await this.idempotent(cmd, "CreateAssessmentSupplement", async (tx) => {
        const encounter = await this.requireEncounterTx(tx, cmd.organizationId, cmd.encounterId);
        this.assertExpectedVersion(encounter.version, cmd.expectedVersion);
        if (encounter.status !== "ATTESTED" && encounter.status !== "SUBMITTED") {
          throw new PrescreenDomainValidationError("A supplement requires an attested prescreen encounter.");
        }
        const parent = await this.requireAssessmentTx(tx, cmd.organizationId, cmd.parentAssessmentVersionId);
        if (parent.encounterId !== encounter.id) throw new PrescreenNotFoundError("assessment");
        if (parent.status === "DRAFT") {
          throw new AssessmentVersionRequiredError("A supplement requires an attested parent assessment version.");
        }
        // Tenant-scoped check: another organization's use of the same id is
        // invisible here, so this discloses nothing across tenants. The DB
        // unique (organizationId, assessmentVersionId) backstops the race.
        const duplicate = await tx.prescreenAssessmentVersion.findUnique({
          where: {
            organizationId_assessmentVersionId: {
              organizationId: cmd.organizationId,
              assessmentVersionId: cmd.draft.assessmentVersionId,
            },
          },
          select: { id: true },
        });
        if (duplicate) {
          throw new PrescreenDomainValidationError("The supplement assessment version id is already in use.");
        }

        const pathway = derivePossiblePathway({
          willingness: cmd.draft.willingness,
          orientation: cmd.draft.orientation,
          immediateMedicalStabilizationRequired: cmd.draft.immediateMedicalStabilizationRequired,
          activeEmergencyOrLegalProcess: cmd.draft.activeEmergencyOrLegalProcess,
        });
        const versionNumber =
          (await tx.prescreenAssessmentVersion.count({
            where: { organizationId: cmd.organizationId, encounterId: encounter.id },
          })) + 1;
        const answers = cmd.draft.answers.map((answer) => ({
          ...answer,
          recordedAt: cmd.occurredAt,
          recordedBy: cmd.actor.actorId,
        }));
        const sources = cmd.draft.sources.map((source) => ({ ...source, recordedAt: cmd.occurredAt }));
        const supplementBase: PrescreenAssessmentVersion = {
          assessmentVersionId: cmd.draft.assessmentVersionId,
          encounterId: encounter.id,
          organizationId: encounter.organizationId,
          versionNumber,
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
          answers,
          sources,
        };
        const contentHash = assessmentContentHash(supplementBase);
        await tx.prescreenAssessmentVersion.create({
          data: {
            organizationId: cmd.organizationId,
            assessmentVersionId: cmd.draft.assessmentVersionId,
            encounterId: encounter.id,
            versionNumber,
            status: "CORRECTED",
            createdAt: new Date(cmd.occurredAt),
            createdBy: cmd.actor.actorId,
            attestedAt: new Date(cmd.occurredAt),
            attestedBy: cmd.actor.actorId,
            parentVersionId: parent.assessmentVersionId,
            changeReason: cmd.reason,
            willingness: cmd.draft.willingness,
            orientation: cmd.draft.orientation as unknown as Prisma.InputJsonValue,
            immediateMedicalStabilizationRequired: cmd.draft.immediateMedicalStabilizationRequired,
            activeEmergencyOrLegalProcess: cmd.draft.activeEmergencyOrLegalProcess,
            possiblePathway: pathway.pathway,
            answers: answers as unknown as Prisma.InputJsonValue,
            sources: sources as unknown as Prisma.InputJsonValue,
            contentHash,
          },
        });
        const newVersion = await this.versionedEncounterUpdate(tx, encounter, {
          currentAssessmentVersionId: cmd.draft.assessmentVersionId,
          possiblePathway: pathway.pathway,
          updatedAt: new Date(cmd.occurredAt),
        });
        await this.recordEventAndAudit(tx, cmd, {
          eventType: "ASSESSMENT_SUPPLEMENTED",
          aggregateType: "PrescreenAssessmentVersion",
          aggregateId: cmd.draft.assessmentVersionId,
          aggregateVersion: newVersion,
          caseId: encounter.caseId,
          encounterId: encounter.id,
          payload: {
            parentVersionId: parent.assessmentVersionId,
            supplementVersionId: cmd.draft.assessmentVersionId,
            reasonHash: sha256HexOfCanonical(cmd.reason),
            contentHash,
          },
        });
        return {
          result: this.result(
            cmd.draft.assessmentVersionId,
            "PrescreenAssessmentVersion",
            encounter.id,
            newVersion,
            "CORRECTED",
          ),
          caseId: encounter.caseId,
        };
      });
    } catch (error) {
      if (isAssessmentIdUniqueViolation(error)) {
        throw new PrescreenDomainValidationError("The supplement assessment version id is already in use.");
      }
      throw error;
    }
  }

  async submitPrescreen(cmd: ParsedSubmitPrescreen): Promise<PrescreenCommandResult> {
    return this.idempotent(cmd, "SubmitPrescreen", async (tx) => {
      const encounter = await this.requireEncounterTx(tx, cmd.organizationId, cmd.encounterId);
      this.assertExpectedVersion(encounter.version, cmd.expectedVersion);
      const assessment = await this.requireAssessmentTx(tx, cmd.organizationId, cmd.assessmentVersionId);
      if (assessment.encounterId !== encounter.id) throw new PrescreenNotFoundError("assessment");
      if (assessment.status === "DRAFT") {
        throw new AssessmentVersionRequiredError("Submission requires an immutable (attested) assessment version.");
      }
      if (assessment.assessmentVersionId !== encounter.currentAssessmentVersionId) {
        throw new AssessmentVersionRequiredError(
          "Submission must reference the encounter's current assessment version.",
        );
      }
      assertPrescreenEncounterTransition(encounter.status, "SUBMITTED");

      await tx.prescreenSubmission.create({
        data: {
          organizationId: encounter.organizationId,
          encounterId: encounter.id,
          assessmentVersionId: assessment.assessmentVersionId,
          target: cmd.target,
          receivingOrganizationId: cmd.receivingOrganizationId,
          submittedAt: new Date(cmd.occurredAt),
          submittedBy: cmd.actor.actorId,
        },
      });
      const newVersion = await this.versionedEncounterUpdate(tx, encounter, {
        status: "SUBMITTED",
        updatedAt: new Date(cmd.occurredAt),
      });
      await this.recordEventAndAudit(tx, cmd, {
        eventType: "PRESCREEN_SUBMITTED",
        aggregateType: "PrescreenEncounter",
        aggregateId: encounter.id,
        aggregateVersion: newVersion,
        caseId: encounter.caseId,
        encounterId: encounter.id,
        payload: {
          assessmentVersionId: assessment.assessmentVersionId,
          target: cmd.target,
          receivingOrganizationId: cmd.receivingOrganizationId,
          contentHash: assessment.contentHash ?? assessmentContentHash(assessmentRowToDomain(assessment)),
        },
      });
      return {
        result: this.result(encounter.id, "PrescreenEncounter", encounter.id, newVersion, "SUBMITTED"),
        caseId: encounter.caseId,
      };
    });
  }

  async updatePacketRequirement(cmd: ParsedUpdatePacketRequirement): Promise<PrescreenCommandResult> {
    return this.idempotent(cmd, "UpdatePacketRequirement", async (tx) => {
      const encounter = await this.requireEncounterTx(tx, cmd.organizationId, cmd.encounterId);
      this.assertExpectedVersion(encounter.version, cmd.expectedVersion);
      if (TERMINAL_ENCOUNTER_STATUSES.has(encounter.status)) {
        throw new PrescreenDomainValidationError("Packet requirements cannot change on a terminal encounter.");
      }
      const previous = await tx.prescreenPacketRequirement.findUnique({
        where: {
          organizationId_encounterId_requirementCode: {
            organizationId: cmd.organizationId,
            encounterId: encounter.id,
            requirementCode: cmd.requirementCode,
          },
        },
      });
      const requirementData = {
        label: cmd.label,
        state: cmd.state,
        blockingTargets: cmd.blockingTargets,
        responsibleRoleCode: cmd.responsibleRoleCode ?? null,
        resolutionWorkspace: cmd.resolutionWorkspace,
        sourceRuleId: cmd.sourceRuleId,
        sourceRuleVersion: cmd.sourceRuleVersion,
      };
      if (previous) {
        await tx.prescreenPacketRequirement.update({ where: { id: previous.id }, data: requirementData });
      } else {
        await tx.prescreenPacketRequirement.create({
          data: {
            ...requirementData,
            organizationId: cmd.organizationId,
            encounterId: encounter.id,
            requirementCode: cmd.requirementCode,
          },
        });
      }
      const newVersion = await this.versionedEncounterUpdate(tx, encounter, {
        updatedAt: new Date(cmd.occurredAt),
      });
      const objectId = `${encounter.id}:${cmd.requirementCode}`;
      await this.recordEventAndAudit(tx, cmd, {
        eventType: "PACKET_REQUIREMENT_STATE_CHANGED",
        aggregateType: "PacketRequirement",
        aggregateId: objectId,
        aggregateVersion: newVersion,
        caseId: encounter.caseId,
        encounterId: encounter.id,
        payload: {
          requirementCode: cmd.requirementCode,
          previousState: previous?.state ?? null,
          newState: cmd.state,
          sourceRuleId: cmd.sourceRuleId,
          sourceRuleVersion: cmd.sourceRuleVersion,
        },
      });
      return {
        result: this.result(objectId, "PacketRequirement", encounter.id, newVersion, cmd.state),
        caseId: encounter.caseId,
      };
    });
  }

  // -------------------------------------------------------------------------
  // Read-only derived view and tenant-scoped snapshots
  // -------------------------------------------------------------------------

  async evaluateTargetReadiness(cmd: ParsedEvaluateTargetReadiness): Promise<PacketReadinessResult> {
    return withTenantContext(this.prisma, cmd.organizationId, async (tx) => {
      const encounter = await this.requireEncounterTx(tx, cmd.organizationId, cmd.encounterId);
      const rows = await tx.prescreenPacketRequirement.findMany({
        where: { organizationId: cmd.organizationId, encounterId: encounter.id },
        orderBy: { createdAt: "asc" },
      });
      return evaluatePacketReadiness(cmd.target, rows.map(requirementRowToDomain));
    });
  }

  async getEncounter(organizationId: string, encounterId: string): Promise<PrescreenEncounter> {
    return withTenantContext(this.prisma, organizationId, async (tx) => {
      const row = await this.requireEncounterTx(tx, organizationId, encounterId);
      return encounterRowToDomain(row);
    });
  }

  async getAssessmentVersion(
    organizationId: string,
    assessmentVersionId: string,
  ): Promise<PrescreenAssessmentVersion> {
    return withTenantContext(this.prisma, organizationId, async (tx) => {
      const row = await this.requireAssessmentTx(tx, organizationId, assessmentVersionId);
      return assessmentRowToDomain(row);
    });
  }

  async getSubmission(
    organizationId: string,
    encounterId: string,
  ): Promise<PrescreenSubmissionRecord | undefined> {
    return withTenantContext(this.prisma, organizationId, async (tx) => {
      const row = await tx.prescreenSubmission.findFirst({
        where: { encounterId, organizationId },
      });
      return row ? submissionRowToDomain(row) : undefined;
    });
  }

  async listPacketRequirements(
    organizationId: string,
    encounterId: string,
  ): Promise<readonly PacketRequirement[]> {
    return withTenantContext(this.prisma, organizationId, async (tx) => {
      await this.requireEncounterTx(tx, organizationId, encounterId);
      const rows = await tx.prescreenPacketRequirement.findMany({
        where: { organizationId, encounterId },
        orderBy: { createdAt: "asc" },
      });
      return rows.map(requirementRowToDomain);
    });
  }

  // -------------------------------------------------------------------------
  // Test/verification inspection of the audit, outbox, and idempotency
  // contracts. Deliberately global (not tenant-scoped) like the in-memory
  // gateway's inspection surface; not exposed through any API route.
  // -------------------------------------------------------------------------

  async auditEvents(): Promise<readonly AuditEvent[]> {
    const rows = await this.prisma.auditEvent.findMany({
      where: { action: { in: [...PRESCREEN_EVENT_TYPES] } },
      orderBy: [{ timestamp: "asc" }, { id: "asc" }],
    });
    return rows.map((row, index) => ({
      sequence: index + 1,
      action: row.action,
      actorType: row.actorType as AuditEvent["actorType"],
      actorId: row.actorId,
      organizationId: row.organizationId,
      ...(row.caseId === null ? {} : { caseKey: row.caseId }),
      occurredAt: iso(row.timestamp),
      ...(row.modelMetadata === null
        ? {}
        : { payload: row.modelMetadata as Readonly<Record<string, unknown>> }),
    }));
  }

  async outboxEnvelopes(): Promise<readonly PrescreenEventEnvelope[]> {
    const rows = await this.prisma.governedEvent.findMany({
      where: { schemaName: PRESCREEN_SCHEMA_NAME },
      orderBy: [{ effectiveAt: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    });
    return rows.map((row) => PrescreenEventEnvelopeSchema.parse(row.envelope));
  }

  async idempotencyRecordCount(): Promise<number> {
    return this.prisma.commandIdempotencyRecord.count({
      where: { idempotencyKey: { startsWith: `${PRESCREEN_KEY_NAMESPACE}/` } },
    });
  }

  // -------------------------------------------------------------------------

  private async requireEncounterTx(
    tx: TxClient,
    organizationId: string,
    encounterId: string,
  ): Promise<PrescreenEncounterRow> {
    const row = await tx.prescreenEncounter.findFirst({ where: { id: encounterId, organizationId } });
    if (!row) throw new PrescreenNotFoundError("encounter");
    return row;
  }

  private async requireAssessmentTx(
    tx: TxClient,
    organizationId: string,
    assessmentVersionId: string,
  ): Promise<PrescreenAssessmentVersionRow> {
    const row = await tx.prescreenAssessmentVersion.findUnique({
      where: { organizationId_assessmentVersionId: { organizationId, assessmentVersionId } },
    });
    if (!row) throw new PrescreenNotFoundError("assessment");
    return row;
  }

  private assertExpectedVersion(actual: number, expected: number | undefined): void {
    if (expected !== undefined && actual !== expected) throw new PrescreenVersionConflictError();
  }

  /**
   * Conditional versioned UPDATE: the predicate re-asserts id, tenant, and
   * the version read earlier in this transaction, so a concurrent committed
   * writer surfaces as a conflict instead of a lost update.
   */
  private async versionedEncounterUpdate(
    tx: TxClient,
    encounter: PrescreenEncounterRow,
    data: Record<string, unknown>,
  ): Promise<number> {
    const newVersion = encounter.version + 1;
    const updated = await tx.prescreenEncounter.updateMany({
      where: { id: encounter.id, organizationId: encounter.organizationId, version: encounter.version },
      data: { ...data, version: newVersion },
    });
    if (updated.count === 0) throw new PrescreenVersionConflictError();
    return newVersion;
  }

  /**
   * Persist the prescreen event envelope as a governed-event row plus its
   * outbox row, and the append-only audit event, all inside the command's
   * transaction. Storage reuse of the S2 tables per the Phase 3 ruling —
   * correction/metric columns take explicit not-applicable values; the
   * full prescreen envelope is the stored contract.
   */
  private async recordEventAndAudit(
    tx: TxClient,
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
  ): Promise<void> {
    const recordedTime = this.now();
    const envelope = PrescreenEventEnvelopeSchema.parse({
      eventId: `evt_prescreen_${randomUUID()}`,
      schemaName: PRESCREEN_SCHEMA_NAME,
      schemaVersion: "1.0.0",
      eventType: record.eventType,
      organizationId: cmd.organizationId,
      caseId: record.caseId,
      encounterId: record.encounterId,
      aggregateType: record.aggregateType,
      aggregateId: record.aggregateId,
      aggregateVersion: record.aggregateVersion,
      eventTime: cmd.occurredAt,
      recordedTime: recordedTime.toISOString(),
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
    await tx.governedEvent.create({
      data: {
        id: envelope.eventId,
        organizationId: cmd.organizationId,
        eventTypeName: record.eventType,
        eventTypeVersion: 1,
        schemaName: PRESCREEN_SCHEMA_NAME,
        schemaVersion: "1.0.0",
        aggregateType: record.aggregateType,
        aggregateId: record.aggregateId,
        aggregateVersion: record.aggregateVersion,
        caseId: record.caseId,
        episodeId: null,
        correlationId: envelope.correlationId,
        causationId: null,
        correctionKind: "NONE",
        supersedesEventId: null,
        reasonCode: null,
        classification: envelope.phiClassification,
        metricEligibility: "NOT_APPLICABLE",
        payloadHash: sha256HexOfCanonical(record.payload),
        envelope: envelope as unknown as Prisma.InputJsonValue,
        effectiveAt: new Date(cmd.occurredAt),
        recordedAt: recordedTime,
      },
    });
    await tx.outboxRecord.create({
      data: {
        organizationId: cmd.organizationId,
        governedEventId: envelope.eventId,
        eventTypeName: record.eventType,
        aggregateType: record.aggregateType,
        aggregateId: record.aggregateId,
      },
    });
    await this.auditWriter.write(tx, {
      organizationId: cmd.organizationId,
      caseId: record.caseId,
      action: record.eventType,
      actor: { actorType: cmd.actor.actorType, actorId: cmd.actor.actorId },
      objectType: record.aggregateType,
      objectId: record.aggregateId,
      metadata: record.payload,
      occurredAt: new Date(cmd.occurredAt),
    });
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

  /**
   * Replay reconstruction: fingerprint equality guarantees the retried body
   * is byte-identical to the original, so the original result is fully
   * determined by (commandType, stored objectId, stored resultVersion, cmd).
   * No live row is consulted — a replay reports the ORIGINAL outcome even if
   * the encounter has since moved on.
   */
  private replayResult(
    commandName: PrescreenCommandName,
    record: { objectId: string | null; resultVersion: number | null },
    cmd: CommandEnvelope & Record<string, unknown>,
  ): PrescreenCommandResult {
    if (!record.objectId || record.resultVersion === null) {
      // A prescreen record is always written with both; absence means the
      // key collided with a non-prescreen record — a reuse conflict.
      throw new PrescreenIdempotencyKeyReusedError();
    }
    const base = { encounterVersion: record.resultVersion, replayed: true } as const;
    switch (commandName) {
      case "StartPrescreenEncounter":
        return {
          ...base,
          objectId: record.objectId,
          objectType: "PrescreenEncounter",
          encounterId: record.objectId,
          status: "DRAFT",
        };
      case "SaveAssessmentDraft":
        return {
          ...base,
          objectId: record.objectId,
          objectType: "PrescreenAssessmentVersion",
          encounterId: String(cmd.encounterId),
          status: "DRAFT",
        };
      case "AttestAssessment":
        return {
          ...base,
          objectId: record.objectId,
          objectType: "PrescreenAssessmentVersion",
          encounterId: String(cmd.encounterId),
          status: "ATTESTED",
        };
      case "CreateAssessmentSupplement":
        return {
          ...base,
          objectId: record.objectId,
          objectType: "PrescreenAssessmentVersion",
          encounterId: String(cmd.encounterId),
          status: "CORRECTED",
        };
      case "SubmitPrescreen":
        return {
          ...base,
          objectId: record.objectId,
          objectType: "PrescreenEncounter",
          encounterId: String(cmd.encounterId),
          status: "SUBMITTED",
        };
      case "UpdatePacketRequirement":
        return {
          ...base,
          objectId: record.objectId,
          objectType: "PacketRequirement",
          encounterId: String(cmd.encounterId),
          status: String(cmd.state),
        };
    }
  }

  /**
   * One transaction per command: replay/conflict on the namespaced key,
   * execute, then write the idempotency record — atomically with the
   * mutation, so a failed command never consumes its key. A concurrent
   * duplicate that loses the unique-index race is re-read and classified
   * with the same fingerprint rules.
   */
  private async idempotent(
    cmd: CommandEnvelope & Record<string, unknown>,
    commandName: PrescreenCommandName,
    execute: (tx: TxClient) => Promise<{ result: PrescreenCommandResult; caseId: string }>,
  ): Promise<PrescreenCommandResult> {
    const key = namespacedKey(commandName, cmd);
    const fingerprint = requestFingerprint(cmd);
    try {
      return await withTenantContext(this.prisma, cmd.organizationId, async (tx) => {
        const prior = await tx.commandIdempotencyRecord.findUnique({
          where: {
            organizationId_idempotencyKey: { organizationId: cmd.organizationId, idempotencyKey: key },
          },
        });
        if (prior) {
          if (prior.requestFingerprint !== fingerprint) throw new PrescreenIdempotencyKeyReusedError();
          return this.replayResult(commandName, prior, cmd);
        }
        const { result, caseId } = await execute(tx);
        await tx.commandIdempotencyRecord.create({
          data: {
            organizationId: cmd.organizationId,
            idempotencyKey: key,
            commandType: commandName,
            caseId,
            objectId: result.objectId,
            resultVersion: result.encounterVersion,
            requestFingerprint: fingerprint,
          },
        });
        return result;
      });
    } catch (error) {
      if (!isIdempotencyUniqueViolation(error)) throw error;
      // Lost the insert race to an identical concurrent command: the whole
      // transaction rolled back, so classify against the winner's record.
      const winner = await this.prisma.commandIdempotencyRecord.findUnique({
        where: {
          organizationId_idempotencyKey: { organizationId: cmd.organizationId, idempotencyKey: key },
        },
      });
      if (!winner || winner.requestFingerprint !== fingerprint) {
        throw new PrescreenIdempotencyKeyReusedError();
      }
      return this.replayResult(commandName, winner, cmd);
    }
  }
}
