import type { CoverageAuthorizationReadiness } from "@clarity/domain-contracts";
import type { ClarityAuthorization, PrismaAuthorizationGateway } from "@clarity/case-repository";
import {
  AssessAuthorizationReadinessCommandSchema,
  RecordAuthorizationCommandSchema,
  TransitionAuthorizationPreparationCommandSchema,
  type AssessAuthorizationReadinessCommand,
  type RecordAuthorizationCommand,
  type TransitionAuthorizationPreparationCommand,
} from "./commands.js";
import { assertAuthorizationPermitted } from "./permissions.js";
import { RationaleRequiredError } from "./errors.js";

/** Audit action vocabulary for authorization commands (REQ-009 lineage). */
export const AUTHORIZATION_AUDIT_ACTIONS = {
  RecordAuthorization: "AUTHORIZATION_RECORDED",
  TransitionAuthorizationPreparation: "AUTHORIZATION_STATUS_CHANGED",
} as const;

/**
 * The single controlled path for authorization-readiness actions
 * (preparation phase — ADR-0010). No payer submission exists here: the
 * transition envelope cannot express SUBMITTED or any payer-decision
 * status, so the phase boundary is structural. The submission phase will
 * extend this service behind the existing assertHumanSubmitter contract.
 *
 * The initial status of an authorization record is DERIVED from the cited
 * benefit quote (authorizationRequired true → NOT_STARTED, false →
 * NOT_REQUIRED, null → rejected) — a caller can never assert it.
 *
 * Rationale rules: leaving the normal path requires a documented reason —
 * NOT_REQUIRED (contradicting or confirming payer position) and
 * UNABLE_TO_COMPLETE both demand one.
 */
export class AuthorizationCommandService {
  constructor(private readonly gateway: PrismaAuthorizationGateway) {}

  async recordAuthorization(
    input: RecordAuthorizationCommand,
  ): Promise<{ authorization: ClarityAuthorization; replayed: boolean }> {
    const cmd = RecordAuthorizationCommandSchema.parse(input);
    assertAuthorizationPermitted("RecordAuthorization", cmd.actor.roles);
    return this.gateway.recordAuthorization({
      organizationId: cmd.organizationId,
      caseId: cmd.caseId,
      coverageId: cmd.coverageId,
      benefitVerificationId: cmd.benefitVerificationId,
      requestedLevelOfCare: cmd.requestedLevelOfCare,
      envelope: this.envelope(cmd, "RecordAuthorization"),
      auditAction: AUTHORIZATION_AUDIT_ACTIONS.RecordAuthorization,
    });
  }

  async transitionAuthorizationPreparation(
    input: TransitionAuthorizationPreparationCommand,
  ): Promise<{ authorization: ClarityAuthorization; replayed: boolean }> {
    const cmd = TransitionAuthorizationPreparationCommandSchema.parse(input);
    assertAuthorizationPermitted("TransitionAuthorizationPreparation", cmd.actor.roles);
    if ((cmd.to === "NOT_REQUIRED" || cmd.to === "UNABLE_TO_COMPLETE") && !cmd.reason) {
      throw new RationaleRequiredError(`TransitionAuthorizationPreparation to ${cmd.to}`);
    }
    return this.gateway.transitionAuthorization({
      organizationId: cmd.organizationId,
      caseId: cmd.caseId,
      authorizationId: cmd.authorizationId,
      to: cmd.to,
      expectedVersion: cmd.expectedVersion,
      envelope: this.envelope(cmd, "TransitionAuthorizationPreparation"),
      auditAction: AUTHORIZATION_AUDIT_ACTIONS.TransitionAuthorizationPreparation,
    });
  }

  /** Derived, tenant-scoped, per-coverage view. Deliberately no aggregate score. */
  async assessAuthorizationReadiness(
    input: AssessAuthorizationReadinessCommand,
  ): Promise<CoverageAuthorizationReadiness[]> {
    const cmd = AssessAuthorizationReadinessCommandSchema.parse(input);
    assertAuthorizationPermitted("AssessAuthorizationReadiness", cmd.actor.roles);
    return this.gateway.assessCaseAuthorizationReadiness(cmd.organizationId, cmd.caseId);
  }

  private envelope(
    cmd: {
      actor: { actorId: string; actorType: "USER" | "AGENT" | "SYSTEM" };
      correlationId?: string;
      idempotencyKey?: string;
      reason?: string;
    },
    commandType: string,
  ) {
    return {
      actor: { actorType: cmd.actor.actorType, actorId: cmd.actor.actorId },
      commandType,
      correlationId: cmd.correlationId,
      idempotencyKey: cmd.idempotencyKey,
      reason: cmd.reason,
    };
  }
}
