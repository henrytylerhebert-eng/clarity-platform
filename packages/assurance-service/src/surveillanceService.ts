import type { AuthenticatedPrincipal, SurveillanceAiObservationProposal, SurveillanceEvidenceType } from "@clarity/domain-contracts";
import { SURVEILLANCE_FORBIDDEN_AI_FINAL_STATE_PHRASES } from "@clarity/domain-contracts";
import type { PrismaSurveillanceGateway } from "../../case-repository/src/surveillanceGateway.js";
import {
  SurveillanceIdempotencyConflictError,
  SurveillanceNotFoundError,
  SurveillanceStateError,
} from "../../case-repository/src/surveillanceGateway.js";
import { AssuranceConflictError, AssurancePermissionDeniedError, AssuranceServiceNotFoundError, AssuranceValidationError } from "./errors.js";
import { MEDICATION_ROOM_HANDWASHING_BLUEPRINT } from "./medicationRoomBlueprint.js";
import { assessMedicationRoomCriterion } from "./surveillanceEvaluator.js";
import { evaluateSurveillanceRule, validateSurveillanceFactNamespace, type SurveillanceFacts } from "./surveillanceRuleEngine.js";

export interface SurveillanceAiObservationPort {
  observe(input: {
    readonly criterionCode: "C1" | "C2" | "C3" | "C4";
    readonly evidence: readonly { readonly id: string; readonly payload: Readonly<Record<string, unknown>> }[];
  }): Promise<readonly SurveillanceAiObservationProposal[]>;
}

/**
 * Synthetic-only AI adapter for the vertical-slice rehearsal. It intentionally
 * consumes explicit fixture descriptors rather than pretending to run a
 * production vision model. Production model/vendor selection remains deferred.
 */
export class SyntheticMedicationRoomObservationPort implements SurveillanceAiObservationPort {
  async observe(input: {
    criterionCode: "C1" | "C2" | "C3" | "C4";
    evidence: readonly { id: string; payload: Readonly<Record<string, unknown>> }[];
  }): Promise<readonly SurveillanceAiObservationProposal[]> {
    const merged = Object.assign({}, ...input.evidence.map((item) => item.payload));
    const result: SurveillanceAiObservationProposal[] = [];
    if (input.criterionCode === "C1" && merged.binsObstructAccess === true) {
      result.push({ objectiveDescription: "Two bins appear positioned directly in front of the sink access area.", features: ["sink", "bins", "access_path", "candidate_obstruction"], detectionConfidence: 0.98, interpretationConfidence: 0.92, impactConfidence: 0.62, abstentionReason: null, evidenceIds: input.evidence.map((item) => item.id) });
    }
    if (input.criterionCode === "C2" && merged.dispenserOutOfService === true) {
      result.push({ objectiveDescription: "A hand-hygiene dispenser is visibly marked out of service.", features: ["dispenser", "out_of_service_sign", "candidate_supply_unavailable"], detectionConfidence: 0.99, interpretationConfidence: 0.96, impactConfidence: 0.66, abstentionReason: null, evidenceIds: input.evidence.map((item) => item.id) });
    }
    if (input.criterionCode === "C3" && merged.medicationPreparationNearSink === true) {
      result.push({ objectiveDescription: "Medication-preparation materials appear positioned near the sink/water source; actual preparation workflow requires qualified review.", features: ["medication_preparation_materials", "sink", "candidate_proximity"], detectionConfidence: 0.94, interpretationConfidence: 0.78, impactConfidence: 0.48, abstentionReason: "SPECIALIST_JUDGMENT_REQUIRED", evidenceIds: input.evidence.map((item) => item.id) });
    }
    if (input.criterionCode === "C4" && merged.medicationItemsNearSink === true) {
      result.push({ objectiveDescription: "Clean or medication-related items appear immediately adjacent to the sink area.", features: ["clean_items", "sink", "candidate_splash_exposure"], detectionConfidence: 0.95, interpretationConfidence: 0.84, impactConfidence: 0.58, abstentionReason: null, evidenceIds: input.evidence.map((item) => item.id) });
    }
    return result;
  }
}

function requireAnyRole(principal: AuthenticatedPrincipal, roles: readonly string[]): void {
  if (!principal.roles.some((role) => roles.includes(role))) throw new AssurancePermissionDeniedError();
}

async function requireQualifiedReviewer(gateway: PrismaSurveillanceGateway, principal: AuthenticatedPrincipal): Promise<string> {
  if (!principal.roles.includes("COMPLIANCE_REVIEWER")) throw new AssurancePermissionDeniedError();
  const assignment = await gateway.findReviewerAssignment(principal.organizationId, principal.userId);
  if (!assignment?.active || !assignment.authorityBasis.trim()) throw new AssurancePermissionDeniedError();
  return assignment.authorityBasis;
}

function actor(principal: AuthenticatedPrincipal) {
  return { actorType: "USER" as const, actorId: principal.userId };
}

function translate(error: unknown): never {
  if (error instanceof SurveillanceNotFoundError) throw new AssuranceServiceNotFoundError();
  if (error instanceof SurveillanceIdempotencyConflictError) throw new AssuranceConflictError("surveillance_idempotency_key_reused");
  if (error instanceof SurveillanceStateError) throw new AssuranceConflictError("surveillance_state_conflict");
  throw error;
}

export function validateMedicationRoomBlueprintDefinition(): readonly string[] {
  const definition = MEDICATION_ROOM_HANDWASHING_BLUEPRINT;
  const issues: string[] = [];
  if (definition.criteria.length === 0) issues.push("criterion_required");
  for (const criterion of definition.criteria) {
    if (!definition.expectedStates.some((item) => item.criterionCode === criterion.code)) issues.push(`${criterion.code}:expected_state_required`);
    if (!definition.evidenceRequirements.some((item) => item.criterionCode === criterion.code)) issues.push(`${criterion.code}:evidence_requirement_required`);
    if (!definition.authorityBindings.some((item) => item.criterionCode === criterion.code) && criterion.code !== "C4") issues.push(`${criterion.code}:authority_binding_required`);
  }
  if (definition.variants.length === 0) issues.push("variant_required");
  return issues;
}

export class SurveillanceCommandService {
  constructor(
    private readonly gateway: PrismaSurveillanceGateway,
    private readonly ai: SurveillanceAiObservationPort = new SyntheticMedicationRoomObservationPort(),
  ) {}

  async installMedicationRoomBlueprint(principal: AuthenticatedPrincipal, idempotencyKey: string) {
    requireAnyRole(principal, ["SYSTEM_ADMIN", "ORGANIZATION_ADMIN", "COMPLIANCE_REVIEWER"]);
    const issues = validateMedicationRoomBlueprintDefinition();
    if (issues.length > 0) throw new AssuranceValidationError("surveillance_blueprint_activation_gate_failed");
    try {
      return await this.gateway.installMedicationRoomBlueprint(
        { organizationId: principal.organizationId, actor: actor(principal), commandType: "InstallMedicationRoomBlueprint", idempotencyKey },
        MEDICATION_ROOM_HANDWASHING_BLUEPRINT,
      );
    } catch (error) { return translate(error); }
  }

  async grantReviewer(principal: AuthenticatedPrincipal, input: { userId: string; authorityBasis: string; idempotencyKey: string }) {
    requireAnyRole(principal, ["SYSTEM_ADMIN", "ORGANIZATION_ADMIN"]);
    if (!input.authorityBasis.trim()) throw new AssuranceValidationError("surveillance_reviewer_authority_basis_required");
    try {
      return await this.gateway.grantReviewer(
        { organizationId: principal.organizationId, actor: actor(principal), commandType: "GrantSurveillanceReviewer", idempotencyKey: input.idempotencyKey },
        input.userId,
        input.authorityBasis,
      );
    } catch (error) { return translate(error); }
  }

  async createRound(principal: AuthenticatedPrincipal, input: { roundKey: string; facilityProfileId: string; idempotencyKey: string }) {
    requireAnyRole(principal, ["SYSTEM_ADMIN", "ORGANIZATION_ADMIN", "INTAKE_COORDINATOR", "COMPLIANCE_REVIEWER"]);
    try {
      return await this.gateway.createRound(
        { organizationId: principal.organizationId, actor: actor(principal), commandType: "CreateSurveillanceRound", idempotencyKey: input.idempotencyKey, facilityId: input.facilityProfileId },
        { roundKey: input.roundKey, facilityProfileId: input.facilityProfileId },
      );
    } catch (error) { return translate(error); }
  }

  async resolveMedicationRoomScene(principal: AuthenticatedPrincipal, input: { roundId: string; locationCode: string; facts: SurveillanceFacts; idempotencyKey: string }) {
    requireAnyRole(principal, ["SYSTEM_ADMIN", "ORGANIZATION_ADMIN", "INTAKE_COORDINATOR", "COMPLIANCE_REVIEWER"]);
    validateSurveillanceFactNamespace(input.facts);
    const definition = MEDICATION_ROOM_HANDWASHING_BLUEPRINT;
    const stored = await this.gateway.getActiveMedicationRoomBlueprint(principal.organizationId);
    if (!stored?.activeVersion) throw new AssuranceServiceNotFoundError();
    const profile = stored.activeVersion.applicabilityProfiles[0];
    if (!profile) throw new AssuranceValidationError("surveillance_applicability_profile_missing");
    const applicable = evaluateSurveillanceRule(definition.applicabilityRule, input.facts);
    const variant = definition.variants.find((item) => evaluateSurveillanceRule(item.selectionRule, input.facts));
    const storedVariant = variant ? stored.activeVersion.variants.find((item) => item.code === variant.code) : undefined;
    const criteria = stored.activeVersion.criteria.map((criterion) => {
      const definitionCriterion = definition.criteria.find((item) => item.code === criterion.code);
      if (!definitionCriterion) throw new AssuranceValidationError("surveillance_blueprint_definition_drift");
      const active = applicable && evaluateSurveillanceRule(definitionCriterion.activationRule, input.facts);
      const requirementIds = active
        ? criterion.evidenceRequirements
            .filter((requirement) => {
              if (requirement.requirementLevel !== "CONDITIONAL") return requirement.requirementLevel !== "OPTIONAL";
              const definitionRequirement = definition.evidenceRequirements.find((item) => item.code === requirement.code);
              return definitionRequirement?.conditionalRule ? evaluateSurveillanceRule(definitionRequirement.conditionalRule, input.facts) : false;
            })
            .map((requirement) => requirement.id)
        : [];
      return {
        criterionId: criterion.id,
        activationStatus: active ? ("ACTIVE" as const) : ("INACTIVE" as const),
        activationReason: active ? "Activation rule satisfied by resolved scene facts." : "Activation rule not satisfied by current scene facts.",
        evidenceRequirementIds: requirementIds,
      };
    });
    try {
      const persisted = await this.gateway.persistResolvedScene(
        { organizationId: principal.organizationId, actor: actor(principal), commandType: "ResolveSurveillanceScene", idempotencyKey: input.idempotencyKey },
        input.roundId,
        {
          blueprintVersionId: stored.activeVersion.id,
          applicabilityProfileId: profile.id,
          variantId: storedVariant?.id ?? null,
          sceneFamily: definition.sceneFamily,
          locationCode: input.locationCode,
          facts: input.facts,
          applicabilityResult: applicable ? "APPROVED" : "PENDING",
          applicabilityReason: applicable ? "Approved synthetic medication-room applicability rule satisfied." : "Required scene facts do not establish applicability.",
          criteria,
        },
      );
      return { ...persisted, scene: await this.gateway.getSceneView(principal.organizationId, persisted.sceneId) };
    } catch (error) { return translate(error); }
  }

  async updateMedicationRoomSceneFacts(principal: AuthenticatedPrincipal, input: { sceneId: string; facts: SurveillanceFacts; idempotencyKey: string }) {
    requireAnyRole(principal, ["SYSTEM_ADMIN", "ORGANIZATION_ADMIN", "INTAKE_COORDINATOR", "COMPLIANCE_REVIEWER"]);
    validateSurveillanceFactNamespace(input.facts);
    const scene = await this.gateway.getSceneBundle(principal.organizationId, input.sceneId);
    const definition = MEDICATION_ROOM_HANDWASHING_BLUEPRINT;
    const applicable = evaluateSurveillanceRule(definition.applicabilityRule, input.facts);
    const variant = definition.variants.find((item) => evaluateSurveillanceRule(item.selectionRule, input.facts));
    const storedVariant = variant ? scene.blueprintVersion.variants.find((item) => item.code === variant.code) : undefined;
    const criteria = scene.blueprintVersion.criteria.map((criterion) => {
      const definitionCriterion = definition.criteria.find((item) => item.code === criterion.code);
      if (!definitionCriterion) throw new AssuranceValidationError("surveillance_blueprint_definition_drift");
      const active = applicable && evaluateSurveillanceRule(definitionCriterion.activationRule, input.facts);
      const requirementIds = active
        ? criterion.evidenceRequirements
            .filter((requirement) => {
              if (requirement.requirementLevel !== "CONDITIONAL") return requirement.requirementLevel !== "OPTIONAL";
              const definitionRequirement = definition.evidenceRequirements.find((item) => item.code === requirement.code);
              return definitionRequirement?.conditionalRule ? evaluateSurveillanceRule(definitionRequirement.conditionalRule, input.facts) : false;
            })
            .map((requirement) => requirement.id)
        : [];
      return {
        criterionId: criterion.id,
        activationStatus: active ? ("ACTIVE" as const) : ("INACTIVE" as const),
        activationReason: active ? "Activation rule satisfied by updated scene facts." : "Activation rule not satisfied by updated scene facts.",
        evidenceRequirementIds: requirementIds,
      };
    });
    try {
      const updated = await this.gateway.updateSceneFacts(
        { organizationId: principal.organizationId, actor: actor(principal), commandType: "UpdateSurveillanceSceneFacts", idempotencyKey: input.idempotencyKey, facilityId: scene.round.facilityProfileId },
        input.sceneId,
        {
          variantId: storedVariant?.id ?? null,
          facts: input.facts,
          applicabilityResult: applicable ? "APPROVED" : "PENDING",
          applicabilityReason: applicable ? "Approved synthetic medication-room applicability rule satisfied." : "Required scene facts do not establish applicability.",
          criteria,
        },
      );
      return { ...updated, scene: await this.gateway.getSceneView(principal.organizationId, input.sceneId) };
    } catch (error) { return translate(error); }
  }

  async submitEvidence(principal: AuthenticatedPrincipal, input: { sceneId: string; evidenceRequestId: string; evidenceType: SurveillanceEvidenceType; payload: Readonly<Record<string, unknown>>; sourceSystem?: string; sourceIdentifier?: string; idempotencyKey: string }) {
    requireAnyRole(principal, ["SYSTEM_ADMIN", "ORGANIZATION_ADMIN", "INTAKE_COORDINATOR", "COMPLIANCE_REVIEWER"]);
    try {
      return await this.gateway.submitEvidence(
        { organizationId: principal.organizationId, actor: actor(principal), commandType: "SubmitSurveillanceEvidence", idempotencyKey: input.idempotencyKey },
        { sceneId: input.sceneId, evidenceRequestId: input.evidenceRequestId, evidenceType: input.evidenceType, payload: input.payload, sourceSystem: input.sourceSystem ?? "clarity.surveillance.synthetic", sourceIdentifier: input.sourceIdentifier },
      );
    } catch (error) { return translate(error); }
  }

  async deriveEvidence(principal: AuthenticatedPrincipal, input: { parentEvidenceId: string; transformationType: string; payload: Readonly<Record<string, unknown>>; idempotencyKey: string }) {
    requireAnyRole(principal, ["SYSTEM_ADMIN", "ORGANIZATION_ADMIN", "INTAKE_COORDINATOR", "COMPLIANCE_REVIEWER"]);
    if (!input.transformationType.trim()) throw new AssuranceValidationError("surveillance_transformation_type_required");
    try {
      return await this.gateway.deriveEvidence(
        { organizationId: principal.organizationId, actor: actor(principal), commandType: "DeriveSurveillanceEvidence", idempotencyKey: input.idempotencyKey },
        { parentEvidenceId: input.parentEvidenceId, transformationType: input.transformationType, payload: input.payload },
      );
    } catch (error) { return translate(error); }
  }

  async assessScene(principal: AuthenticatedPrincipal, input: { sceneId: string; idempotencyKey: string }) {
    requireAnyRole(principal, ["SYSTEM_ADMIN", "ORGANIZATION_ADMIN", "INTAKE_COORDINATOR", "COMPLIANCE_REVIEWER"]);
    const scene = await this.gateway.getSceneBundle(principal.organizationId, input.sceneId);
    const facts = scene.facts as SurveillanceFacts;
    const proposals = scene.criterionRuntimes
      .filter((runtime) => runtime.activationStatus === "ACTIVE")
      .map((runtime) => {
        const criterionCode = runtime.criterion.code as "C1" | "C2" | "C3" | "C4";
        const requests = runtime.evidenceRequests.map((request) => ({ requestId: request.id, criterionCode, requirementCode: request.evidenceRequirement.code, evidenceType: request.evidenceRequirement.evidenceType, verificationMode: request.evidenceRequirement.verificationMode, status: request.status }));
        const evidence = runtime.evidenceRequests.flatMap((request) => request.artifacts.map((artifact) => ({ requestId: request.id, requirementCode: request.evidenceRequirement.code, evidenceType: artifact.evidenceType, verificationMode: request.evidenceRequirement.verificationMode, status: artifact.status, payload: artifact.payload as Record<string, unknown> })));
        const base = assessMedicationRoomCriterion(MEDICATION_ROOM_HANDWASHING_BLUEPRINT, criterionCode, facts, requests, evidence);
        if ((criterionCode === "C3" || criterionCode === "C4") && facts["scene.policy_source_conflict"] === true) {
          return { criterionCode, result: "CONFLICT" as const, reasonCodes: ["SOURCE_CONFLICT_OPEN"], missingRequirementCodes: base.missingRequirementCodes };
        }
        return base;
      });
    try {
      const persisted = await this.gateway.recordAssessments(
        { organizationId: principal.organizationId, actor: actor(principal), commandType: "AssessSurveillanceScene", idempotencyKey: input.idempotencyKey, facilityId: scene.round.facilityProfileId },
        input.sceneId,
        proposals,
      );
      return { ...persisted, proposals, scene: await this.gateway.getSceneView(principal.organizationId, input.sceneId) };
    } catch (error) { return translate(error); }
  }

  async runAiAssistance(principal: AuthenticatedPrincipal, input: { sceneId: string; idempotencyKey: string }) {
    requireAnyRole(principal, ["SYSTEM_ADMIN", "ORGANIZATION_ADMIN", "INTAKE_COORDINATOR", "COMPLIANCE_REVIEWER"]);
    const scene = await this.gateway.getSceneBundle(principal.organizationId, input.sceneId);
    const created: Array<{ observationId: string; candidateId?: string; criterionCode: string }> = [];
    for (const runtime of scene.criterionRuntimes.filter((item) => item.activationStatus === "ACTIVE")) {
      const criterionCode = runtime.criterion.code as "C1" | "C2" | "C3" | "C4";
      const evidence = runtime.evidenceRequests.flatMap((request) => request.artifacts.map((artifact) => ({ id: artifact.id, payload: artifact.payload as Record<string, unknown> })));
      const proposals = await this.ai.observe({ criterionCode, evidence });
      for (let i = 0; i < proposals.length; i += 1) {
        const proposal = proposals[i]!;
        this.assertAiCandidateLanguage(proposal.objectiveDescription);
        const observation = await this.gateway.recordObservation(
          { organizationId: principal.organizationId, actor: { actorType: "AGENT", actorId: "sr02-synthetic-observer" }, commandType: "CreateSurveillanceAiObservation", idempotencyKey: `${input.idempotencyKey}:${criterionCode}:${i}:obs`, facilityId: scene.round.facilityProfileId },
          {
            sceneId: scene.id,
            criterionId: runtime.criterionId,
            source: "AI",
            objectiveDescription: proposal.objectiveDescription,
            structuredFeatures: { features: proposal.features, evidenceIds: proposal.evidenceIds },
            detectionConfidence: proposal.detectionConfidence,
            interpretationConfidence: proposal.interpretationConfidence,
            impactConfidence: proposal.impactConfidence,
            abstentionReason: proposal.abstentionReason,
            modelMetadata: { provider: "synthetic-fixture", model: "sr02-deterministic-observer", contractVersion: "0.1" },
          },
        );
        const latestAssessment = [...scene.assessments].reverse().find((assessment) => assessment.criterionId === runtime.criterionId);
        if (!latestAssessment) {
          created.push({ observationId: observation.observationId, criterionCode });
          continue;
        }
        const candidateText = this.candidateTextFor(criterionCode, proposal.features);
        if (!candidateText) {
          created.push({ observationId: observation.observationId, criterionCode });
          continue;
        }
        this.assertAiCandidateLanguage(candidateText);
        const candidate = await this.gateway.createCandidateVariance(
          { organizationId: principal.organizationId, actor: { actorType: "AGENT", actorId: "sr02-synthetic-observer" }, commandType: "CreateSurveillanceAiCandidate", idempotencyKey: `${input.idempotencyKey}:${criterionCode}:${i}:candidate`, facilityId: scene.round.facilityProfileId },
          { sceneId: scene.id, criterionId: runtime.criterionId, observationId: observation.observationId, evidenceAssessmentId: latestAssessment.id, candidateDescription: candidateText, createdByType: "AI" },
        );
        created.push({ observationId: observation.observationId, candidateId: candidate.candidateId, criterionCode });
      }
    }
    return { created };
  }

  async recordHumanObservation(principal: AuthenticatedPrincipal, input: { sceneId: string; criterionId: string; objectiveDescription: string; idempotencyKey: string }) {
    requireAnyRole(principal, ["SYSTEM_ADMIN", "ORGANIZATION_ADMIN", "INTAKE_COORDINATOR", "COMPLIANCE_REVIEWER"]);
    if (!input.objectiveDescription.trim()) throw new AssuranceValidationError("surveillance_observation_required");
    try {
      return await this.gateway.recordObservation(
        { organizationId: principal.organizationId, actor: actor(principal), commandType: "CreateSurveillanceHumanObservation", idempotencyKey: input.idempotencyKey },
        { sceneId: input.sceneId, criterionId: input.criterionId, source: "HUMAN", objectiveDescription: input.objectiveDescription },
      );
    } catch (error) { return translate(error); }
  }

  async createHumanCandidate(principal: AuthenticatedPrincipal, input: { sceneId: string; criterionId: string; observationId: string; evidenceAssessmentId: string; candidateDescription: string; idempotencyKey: string }) {
    requireAnyRole(principal, ["SYSTEM_ADMIN", "ORGANIZATION_ADMIN", "INTAKE_COORDINATOR", "COMPLIANCE_REVIEWER"]);
    if (!input.candidateDescription.trim()) throw new AssuranceValidationError("surveillance_candidate_description_required");
    try {
      return await this.gateway.createCandidateVariance(
        { organizationId: principal.organizationId, actor: actor(principal), commandType: "CreateSurveillanceHumanCandidate", idempotencyKey: input.idempotencyKey },
        { sceneId: input.sceneId, criterionId: input.criterionId, observationId: input.observationId, evidenceAssessmentId: input.evidenceAssessmentId, candidateDescription: input.candidateDescription, createdByType: "HUMAN" },
      );
    } catch (error) { return translate(error); }
  }

  async assembleReviewPacket(principal: AuthenticatedPrincipal, input: { candidateId: string; idempotencyKey: string }) {
    requireAnyRole(principal, ["SYSTEM_ADMIN", "ORGANIZATION_ADMIN", "INTAKE_COORDINATOR", "COMPLIANCE_REVIEWER"]);
    const snapshot = await this.gateway.buildReviewPacketSnapshot(principal.organizationId, input.candidateId);
    try {
      return await this.gateway.assembleReviewPacket(
        { organizationId: principal.organizationId, actor: actor(principal), commandType: "AssembleSurveillanceReviewPacket", idempotencyKey: input.idempotencyKey },
        input.candidateId,
        snapshot,
      );
    } catch (error) { return translate(error); }
  }

  async confirmFinding(principal: AuthenticatedPrincipal, input: { reviewPacketId: string; expectedState: string; objectiveEvidence: string; observedVariance: string; scope: string; reason: string; idempotencyKey: string }) {
    const authorityBasis = await requireQualifiedReviewer(this.gateway, principal);
    const packet = await this.gateway.getReviewPacket(principal.organizationId, input.reviewPacketId);
    const snapshot = packet.snapshot as Record<string, unknown>;
    const assessment = snapshot.evidenceAssessment as { result?: string } | undefined;
    if (!assessment?.result || ["MISSING_EVIDENCE", "UNKNOWN", "APPLICABILITY_PENDING", "RIGHTS_RESTRICTED", "STALE_SOURCE"].includes(assessment.result)) {
      throw new AssuranceValidationError("surveillance_finding_evidence_not_review_ready");
    }
    try {
      return await this.gateway.confirmFinding(
        { organizationId: principal.organizationId, actor: actor(principal), commandType: "ConfirmSurveillanceFinding", idempotencyKey: input.idempotencyKey },
        { reviewPacketId: input.reviewPacketId, expectedState: input.expectedState, objectiveEvidence: input.objectiveEvidence, observedVariance: input.observedVariance, scope: input.scope, reason: input.reason, authorityBasis },
      );
    } catch (error) { return translate(error); }
  }

  async approveCitation(principal: AuthenticatedPrincipal, input: { findingId: string; authorityBindingId: string; reason: string; idempotencyKey: string }) {
    const authorityBasis = await requireQualifiedReviewer(this.gateway, principal);
    try {
      return await this.gateway.approveCitation(
        { organizationId: principal.organizationId, actor: actor(principal), commandType: "ApproveSurveillanceCitation", idempotencyKey: input.idempotencyKey },
        { findingId: input.findingId, authorityBindingId: input.authorityBindingId, reason: input.reason, authorityBasis },
      );
    } catch (error) { return translate(error); }
  }

  async recordImmediateCorrection(principal: AuthenticatedPrincipal, input: { findingId: string; description: string; idempotencyKey: string }) {
    requireAnyRole(principal, ["SYSTEM_ADMIN", "ORGANIZATION_ADMIN", "INTAKE_COORDINATOR", "COMPLIANCE_REVIEWER"]);
    try {
      return await this.gateway.recordImmediateCorrection(
        { organizationId: principal.organizationId, actor: actor(principal), commandType: "RecordSurveillanceImmediateCorrection", idempotencyKey: input.idempotencyKey },
        { findingId: input.findingId, description: input.description },
      );
    } catch (error) { return translate(error); }
  }

  async createCorrectiveAction(principal: AuthenticatedPrincipal, input: { findingId: string; ownerUserId: string; requiredAction: string; dueDate?: string; idempotencyKey: string }) {
    requireAnyRole(principal, ["SYSTEM_ADMIN", "ORGANIZATION_ADMIN", "COMPLIANCE_REVIEWER"]);
    try {
      return await this.gateway.createCorrectiveAction(
        { organizationId: principal.organizationId, actor: actor(principal), commandType: "CreateSurveillanceCorrectiveAction", idempotencyKey: input.idempotencyKey },
        { findingId: input.findingId, ownerUserId: input.ownerUserId, requiredAction: input.requiredAction, dueDate: input.dueDate },
      );
    } catch (error) { return translate(error); }
  }

  async submitClosureEvidence(principal: AuthenticatedPrincipal, input: { actionId: string; payload: Readonly<Record<string, unknown>>; idempotencyKey: string }) {
    requireAnyRole(principal, ["SYSTEM_ADMIN", "ORGANIZATION_ADMIN", "INTAKE_COORDINATOR", "COMPLIANCE_REVIEWER"]);
    try {
      return await this.gateway.submitClosureEvidence(
        { organizationId: principal.organizationId, actor: actor(principal), commandType: "SubmitSurveillanceClosureEvidence", idempotencyKey: input.idempotencyKey },
        { actionId: input.actionId, payload: input.payload },
      );
    } catch (error) { return translate(error); }
  }

  async closeFinding(principal: AuthenticatedPrincipal, input: { findingId: string; reason: string; idempotencyKey: string }) {
    const authorityBasis = await requireQualifiedReviewer(this.gateway, principal);
    try {
      return await this.gateway.closeFinding(
        { organizationId: principal.organizationId, actor: actor(principal), commandType: "CloseSurveillanceFinding", idempotencyKey: input.idempotencyKey },
        { findingId: input.findingId, reason: input.reason, authorityBasis },
      );
    } catch (error) { return translate(error); }
  }

  async reopenFinding(principal: AuthenticatedPrincipal, input: { findingId: string; reason: string; idempotencyKey: string }) {
    const authorityBasis = await requireQualifiedReviewer(this.gateway, principal);
    try {
      return await this.gateway.reopenFinding(
        { organizationId: principal.organizationId, actor: actor(principal), commandType: "ReopenSurveillanceFinding", idempotencyKey: input.idempotencyKey },
        { findingId: input.findingId, reason: input.reason, authorityBasis },
      );
    } catch (error) { return translate(error); }
  }

  private assertAiCandidateLanguage(text: string): void {
    const lower = text.toLowerCase();
    if (SURVEILLANCE_FORBIDDEN_AI_FINAL_STATE_PHRASES.some((phrase) => lower.includes(phrase))) {
      throw new AssuranceValidationError("surveillance_ai_final_state_language_forbidden");
    }
  }

  private candidateTextFor(criterionCode: "C1" | "C2" | "C3" | "C4", features: readonly string[]): string | null {
    if (criterionCode === "C1" && features.includes("candidate_obstruction")) return "Candidate variance: sink access appears materially obstructed by stored bins; qualified review is required.";
    if (criterionCode === "C2" && features.includes("candidate_supply_unavailable")) return "Candidate variance: a required hand-hygiene dispenser appears unavailable; confirm alternate resources and local process before final determination.";
    if (criterionCode === "C3" && features.includes("candidate_proximity")) return "Candidate variance: medication-preparation materials appear near a sink/water source; actual preparation workflow and applicable source require qualified review.";
    if (criterionCode === "C4" && features.includes("candidate_splash_exposure")) return "Candidate variance: clean or medication-related items appear positioned in a potential sink splash relationship; qualified review is required.";
    return null;
  }
}

export class SurveillanceQueryService {
  constructor(private readonly gateway: PrismaSurveillanceGateway) {}

  async getScene(principal: AuthenticatedPrincipal, sceneId: string) {
    requireAnyRole(principal, ["SYSTEM_ADMIN", "ORGANIZATION_ADMIN", "INTAKE_COORDINATOR", "COMPLIANCE_REVIEWER", "READ_ONLY_AUDITOR"]);
    try { return await this.gateway.getSceneView(principal.organizationId, sceneId); } catch (error) { return translate(error); }
  }

  async getReviewPacket(principal: AuthenticatedPrincipal, packetId: string) {
    requireAnyRole(principal, ["SYSTEM_ADMIN", "ORGANIZATION_ADMIN", "COMPLIANCE_REVIEWER", "READ_ONLY_AUDITOR"]);
    try { return await this.gateway.getReviewPacket(principal.organizationId, packetId); } catch (error) { return translate(error); }
  }

  async getFinding(principal: AuthenticatedPrincipal, findingId: string) {
    requireAnyRole(principal, ["SYSTEM_ADMIN", "ORGANIZATION_ADMIN", "COMPLIANCE_REVIEWER", "READ_ONLY_AUDITOR"]);
    try { return await this.gateway.getFinding(principal.organizationId, findingId); } catch (error) { return translate(error); }
  }
}
