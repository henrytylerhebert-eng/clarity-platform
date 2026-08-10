import type { PacketReadinessResult } from "@clarity/domain-contracts";
import {
  AttestAssessmentCommandSchema,
  CreateAssessmentSupplementCommandSchema,
  EvaluateTargetReadinessCommandSchema,
  SaveAssessmentDraftCommandSchema,
  StartPrescreenEncounterCommandSchema,
  SubmitPrescreenCommandSchema,
  UpdatePacketRequirementCommandSchema,
  type AttestAssessmentCommand,
  type CreateAssessmentSupplementCommand,
  type EvaluateTargetReadinessCommand,
  type SaveAssessmentDraftCommand,
  type StartPrescreenEncounterCommand,
  type SubmitPrescreenCommand,
  type UpdatePacketRequirementCommand,
} from "./commands.js";
import type { PrescreenCommandResult, PrescreenGateway } from "./gateway.js";
import { assertPrescreenPermitted, type PrescreenRolePolicy } from "./permissions.js";

/**
 * The single controlled path for prescreen commands (Phase 2 — approved
 * scope: in-memory gateway only). Order of enforcement for every command:
 * strict envelope parse → explicit role policy (before any read, so
 * authorization failures disclose nothing) → atomic gateway execution
 * (tenant-scoped reads, state machine on the fresh row, versioned update,
 * audit + outbox staging, idempotency record).
 *
 * What this service cannot express, by construction: legal status
 * selection, admission or placement decisions, transport authority,
 * Central Intake acknowledgement, facility acceptance, or any grant of
 * cross-organization access. Submission is a recorded intent only.
 */
export class PrescreenCommandService {
  constructor(
    private readonly gateway: PrescreenGateway,
    private readonly policy: PrescreenRolePolicy,
  ) {}

  async startEncounter(input: StartPrescreenEncounterCommand): Promise<PrescreenCommandResult> {
    const cmd = StartPrescreenEncounterCommandSchema.parse(input);
    assertPrescreenPermitted(this.policy, "StartPrescreenEncounter", cmd.actor.roleCodes);
    return this.gateway.startEncounter(cmd);
  }

  async saveAssessmentDraft(input: SaveAssessmentDraftCommand): Promise<PrescreenCommandResult> {
    const cmd = SaveAssessmentDraftCommandSchema.parse(input);
    assertPrescreenPermitted(this.policy, "SaveAssessmentDraft", cmd.actor.roleCodes);
    return this.gateway.saveAssessmentDraft(cmd);
  }

  async attestAssessment(input: AttestAssessmentCommand): Promise<PrescreenCommandResult> {
    const cmd = AttestAssessmentCommandSchema.parse(input);
    assertPrescreenPermitted(this.policy, "AttestAssessment", cmd.actor.roleCodes);
    return this.gateway.attestAssessment(cmd);
  }

  async createAssessmentSupplement(input: CreateAssessmentSupplementCommand): Promise<PrescreenCommandResult> {
    const cmd = CreateAssessmentSupplementCommandSchema.parse(input);
    assertPrescreenPermitted(this.policy, "CreateAssessmentSupplement", cmd.actor.roleCodes);
    return this.gateway.createAssessmentSupplement(cmd);
  }

  async submitPrescreen(input: SubmitPrescreenCommand): Promise<PrescreenCommandResult> {
    const cmd = SubmitPrescreenCommandSchema.parse(input);
    assertPrescreenPermitted(this.policy, "SubmitPrescreen", cmd.actor.roleCodes);
    return this.gateway.submitPrescreen(cmd);
  }

  async updatePacketRequirement(input: UpdatePacketRequirementCommand): Promise<PrescreenCommandResult> {
    const cmd = UpdatePacketRequirementCommandSchema.parse(input);
    assertPrescreenPermitted(this.policy, "UpdatePacketRequirement", cmd.actor.roleCodes);
    return this.gateway.updatePacketRequirement(cmd);
  }

  /** Read-only derived view; deliberately no aggregate score (readiness doctrine). */
  async evaluateTargetReadiness(input: EvaluateTargetReadinessCommand): Promise<PacketReadinessResult> {
    const cmd = EvaluateTargetReadinessCommandSchema.parse(input);
    assertPrescreenPermitted(this.policy, "EvaluateTargetReadiness", cmd.actor.roleCodes);
    return this.gateway.evaluateTargetReadiness(cmd);
  }
}
