import type { AuthenticatedPrincipal, AssuranceReviewDecision } from "@clarity/domain-contracts";
import { principalToActor } from "@clarity/domain-contracts";
import {
  AssuranceNotFoundError,
  AssuranceStateError,
  PrismaAssuranceGateway,
} from "@clarity/case-repository";
import { evaluateAssurance } from "./evaluator.js";
import {
  AssuranceConflictError,
  AssuranceServiceNotFoundError,
  AssuranceValidationError,
} from "./errors.js";
import {
  requireAssignedParticipant,
  requireEvidenceContributor,
  requireQualifiedReviewer,
} from "./permissions.js";
import type {
  EvaluateAssuranceCommand,
  ReviseAssuranceEvidenceCommand,
  ReviewAssuranceEvaluationCommand,
  SubmitAssuranceEvidenceCommand,
} from "./commands.js";

const RATIONALE_REQUIRED = new Set<AssuranceReviewDecision>([
  "REJECT",
  "REQUEST_MORE_EVIDENCE",
  "REVIEW_REQUIRED",
]);

function translatePersistenceError(error: unknown): never {
  if (error instanceof AssuranceNotFoundError) throw new AssuranceServiceNotFoundError();
  if (error instanceof AssuranceStateError) throw new AssuranceConflictError(error.message);
  throw error;
}

async function requireCase(gateway: PrismaAssuranceGateway, principal: AuthenticatedPrincipal, caseKey: string) {
  const assuranceCase = await gateway.findCaseByKey(principal.organizationId, caseKey);
  if (!assuranceCase) throw new AssuranceServiceNotFoundError();
  return assuranceCase;
}

export class AssuranceCommandService {
  constructor(private readonly gateway: PrismaAssuranceGateway) {}

  async submitEvidence(principal: AuthenticatedPrincipal, command: SubmitAssuranceEvidenceCommand) {
    const assuranceCase = await requireCase(this.gateway, principal, command.caseKey);
    await requireEvidenceContributor(this.gateway, principal, assuranceCase.id);
    try {
      return await this.gateway.submitEvidence(
        principal.organizationId,
        {
          assuranceCaseId: assuranceCase.id,
          expectationId: command.expectationId,
          payload: command.payload,
        },
        principalToActor(principal),
      );
    } catch (error) {
      return translatePersistenceError(error);
    }
  }

  async reviseEvidence(principal: AuthenticatedPrincipal, command: ReviseAssuranceEvidenceCommand) {
    const assuranceCase = await requireCase(this.gateway, principal, command.caseKey);
    await requireEvidenceContributor(this.gateway, principal, assuranceCase.id);
    try {
      const prior = await this.gateway.findEvidenceSubmission(
        principal.organizationId,
        command.priorSubmissionId,
      );
      if (!prior || prior.assuranceCaseId !== assuranceCase.id) {
        throw new AssuranceServiceNotFoundError();
      }
      return await this.gateway.reviseEvidence(
        principal.organizationId,
        prior.id,
        command.payload,
        principalToActor(principal),
      );
    } catch (error) {
      if (error instanceof AssuranceServiceNotFoundError) throw error;
      return translatePersistenceError(error);
    }
  }

  async evaluate(principal: AuthenticatedPrincipal, command: EvaluateAssuranceCommand) {
    const assuranceCase = await requireCase(this.gateway, principal, command.caseKey);
    await requireAssignedParticipant(this.gateway, principal, assuranceCase.id);
    try {
      return await this.gateway.evaluateCurrentState(
        principal.organizationId,
        assuranceCase.id,
        command.expectationId,
        principalToActor(principal),
        evaluateAssurance,
      );
    } catch (error) {
      return translatePersistenceError(error);
    }
  }

  async review(principal: AuthenticatedPrincipal, command: ReviewAssuranceEvaluationCommand) {
    const assuranceCase = await requireCase(this.gateway, principal, command.caseKey);
    await requireQualifiedReviewer(this.gateway, principal, assuranceCase.id);

    if (RATIONALE_REQUIRED.has(command.decision) && !command.rationale?.trim()) {
      throw new AssuranceValidationError("review_rationale_required");
    }

    try {
      return await this.gateway.recordReviewDecisionWithEvidenceEffect(
        principal.organizationId,
        {
          assuranceCaseId: assuranceCase.id,
          evaluationId: command.evaluationId,
          decision: command.decision,
          rationale: command.rationale?.trim(),
          reviewerUserId: principal.userId,
        },
        principalToActor(principal),
      );
    } catch (error) {
      return translatePersistenceError(error);
    }
  }
}
