import {
  canReopenCase,
  canTransitionCase,
  canTransitionWorkstream,
  initialWorkstreamStatuses,
  type CaseStatus,
} from "@clarity/domain-contracts";
import type { CommandResult, PersistedCase, PrismaCaseCommandGateway } from "@clarity/case-repository";
import {
  AssignCaseCommandSchema,
  CloseCaseCommandSchema,
  CreateCaseCommandSchema,
  RATIONALE_REQUIRED_TRANSITIONS,
  RecordDecisionRationaleCommandSchema,
  ReopenCaseCommandSchema,
  TransitionCaseCommandSchema,
  UpdateCaseLocationCommandSchema,
  UpdateCaseUrgencyCommandSchema,
  UpdateWorkstreamStatusCommandSchema,
  type AssignCaseCommand,
  type CloseCaseCommand,
  type CreateCaseCommand,
  type RecordDecisionRationaleCommand,
  type ReopenCaseCommand,
  type TransitionCaseCommand,
  type UpdateCaseLocationCommand,
  type UpdateCaseUrgencyCommand,
  type UpdateWorkstreamStatusCommand,
} from "./commands.js";
import { assertPermitted, assertWorkstreamPermitted } from "./permissions.js";
import { CaseNotFoundError, RationaleRequiredError, TerminalCaseError } from "./errors.js";

/**
 * Audit action vocabulary. CASE_STATUS_CHANGED / CASE_WORKSTREAM_CHANGED keep
 * the established REQ-matrix names (REQUIREMENTS_TRACEABILITY.md) rather than
 * introducing synonyms; the remaining actions are new commands.
 */
export const COMMAND_AUDIT_ACTIONS = {
  CreateCase: "CASE_CREATED",
  AssignCase: "CASE_ASSIGNED",
  UpdateCaseUrgency: "CASE_URGENCY_CHANGED",
  UpdateCaseLocation: "CASE_LOCATION_CHANGED",
  TransitionCase: "CASE_STATUS_CHANGED",
  UpdateWorkstreamStatus: "CASE_WORKSTREAM_CHANGED",
  RecordDecisionRationale: "DECISION_RATIONALE_RECORDED",
  CloseCase: "CASE_CLOSED",
  ReopenCase: "CASE_REOPENED",
} as const;

const TERMINAL_STATUSES: readonly CaseStatus[] = ["CLOSED", "CANCELLED", "WITHDRAWN"];

function assertNotTerminal(current: PersistedCase): void {
  if (TERMINAL_STATUSES.includes(current.status)) {
    throw new TerminalCaseError(current.caseKey, current.status);
  }
}

/**
 * The single controlled path for every case action.
 *
 * Order of enforcement for every command:
 *   1. envelope validation (Zod, strict)
 *   2. role permission check      — before any database access
 *   3. rationale requirement      — before any database access
 *   4. gateway transaction: tenant-scoped versioned read → state-machine
 *      validation against the FRESH row → conditional write → atomic audit
 *      event (with previous/new state hashes, command name, correlation id)
 *      → idempotency record
 *
 * This service never touches Prisma; all persistence goes through the
 * approved PrismaCaseCommandGateway adapter.
 *
 * Fairness invariant (GOVERNANCE.md #5): no command consults benefits,
 * authorization, or any financial state when acting on the clinical
 * workstream or clinical transitions — verified by test.
 */
export class CaseCommandService {
  constructor(private readonly gateway: PrismaCaseCommandGateway) {}

  async createCase(input: CreateCaseCommand): Promise<CommandResult> {
    const cmd = CreateCaseCommandSchema.parse(input);
    assertPermitted("CreateCase", cmd.actor.roles);
    return this.gateway.executeCreate({
      organizationId: cmd.organizationId,
      data: {
        caseKey: cmd.caseKey,
        organizationId: cmd.organizationId,
        patientTokenId: cmd.patientTokenId,
        status: "DRAFT",
        urgency: cmd.urgency,
        currentLocation: cmd.currentLocation ?? null,
        workstreams: initialWorkstreamStatuses(),
      },
      actor: cmd.actor,
      commandType: "CreateCase",
      correlationId: cmd.correlationId,
      idempotencyKey: cmd.idempotencyKey,
      reason: cmd.reason,
      auditAction: COMMAND_AUDIT_ACTIONS.CreateCase,
    });
  }

  async assignCase(input: AssignCaseCommand): Promise<CommandResult> {
    const cmd = AssignCaseCommandSchema.parse(input);
    assertPermitted("AssignCase", cmd.actor.roles);
    // Assignee must exist in the SAME organization (FK alone would allow cross-org users).
    const assignee = await this.gateway.findOrganizationUser(cmd.organizationId, cmd.assigneeUserId);
    if (!assignee) throw new CaseNotFoundError(cmd.assigneeUserId); // non-revealing miss semantics
    return this.gateway.executeCommand({
      ...this.envelope(cmd, "AssignCase"),
      decide: (current) => {
        assertNotTerminal(current);
        return {
          changes: { assignedUserId: cmd.assigneeUserId },
          auditAction: COMMAND_AUDIT_ACTIONS.AssignCase,
          auditMetadata: {
            assignedUserId: cmd.assigneeUserId,
            previousAssignedUserId: current.assignedUserId ?? null,
          },
        };
      },
    });
  }

  async updateCaseUrgency(input: UpdateCaseUrgencyCommand): Promise<CommandResult> {
    const cmd = UpdateCaseUrgencyCommandSchema.parse(input);
    assertPermitted("UpdateCaseUrgency", cmd.actor.roles);
    if (!cmd.reason) throw new RationaleRequiredError("UpdateCaseUrgency");
    return this.gateway.executeCommand({
      ...this.envelope(cmd, "UpdateCaseUrgency"),
      decide: (current) => {
        assertNotTerminal(current);
        return {
          changes: { urgency: cmd.urgency },
          auditAction: COMMAND_AUDIT_ACTIONS.UpdateCaseUrgency,
          auditMetadata: { from: current.urgency, to: cmd.urgency },
        };
      },
    });
  }

  async updateCaseLocation(input: UpdateCaseLocationCommand): Promise<CommandResult> {
    const cmd = UpdateCaseLocationCommandSchema.parse(input);
    assertPermitted("UpdateCaseLocation", cmd.actor.roles);
    return this.gateway.executeCommand({
      ...this.envelope(cmd, "UpdateCaseLocation"),
      decide: (current) => {
        assertNotTerminal(current);
        return {
          changes: { currentLocation: cmd.currentLocation },
          auditAction: COMMAND_AUDIT_ACTIONS.UpdateCaseLocation,
          auditMetadata: { from: current.currentLocation ?? null, to: cmd.currentLocation },
        };
      },
    });
  }

  async transitionCase(input: TransitionCaseCommand): Promise<CommandResult> {
    const cmd = TransitionCaseCommandSchema.parse(input);
    assertPermitted("TransitionCase", cmd.actor.roles);
    if ((RATIONALE_REQUIRED_TRANSITIONS as readonly string[]).includes(cmd.to) && !cmd.reason) {
      throw new RationaleRequiredError(`TransitionCase to ${cmd.to}`);
    }
    return this.gateway.executeCommand({
      ...this.envelope(cmd, "TransitionCase"),
      decide: (current) => {
        if (!canTransitionCase(current.status, cmd.to)) {
          if (TERMINAL_STATUSES.includes(current.status)) {
            throw new TerminalCaseError(current.caseKey, current.status);
          }
          throw new Error(`Invalid case transition: ${current.status} -> ${cmd.to}`);
        }
        return {
          changes: { status: cmd.to },
          auditAction: COMMAND_AUDIT_ACTIONS.TransitionCase,
          auditMetadata: { from: current.status, to: cmd.to },
        };
      },
    });
  }

  async updateWorkstreamStatus(input: UpdateWorkstreamStatusCommand): Promise<CommandResult> {
    const cmd = UpdateWorkstreamStatusCommandSchema.parse(input);
    assertWorkstreamPermitted(cmd.workstream, cmd.actor.roles);
    return this.gateway.executeCommand({
      ...this.envelope(cmd, "UpdateWorkstreamStatus"),
      decide: (current) => {
        assertNotTerminal(current);
        const from = current.workstreams[cmd.workstream];
        if (!canTransitionWorkstream(from, cmd.to)) {
          throw new Error(`Invalid ${cmd.workstream} transition: ${from} -> ${cmd.to}`);
        }
        return {
          changes: { workstream: { workstream: cmd.workstream, to: cmd.to } },
          auditAction: COMMAND_AUDIT_ACTIONS.UpdateWorkstreamStatus,
          auditMetadata: { workstream: cmd.workstream, from, to: cmd.to },
        };
      },
    });
  }

  async recordDecisionRationale(input: RecordDecisionRationaleCommand): Promise<CommandResult> {
    const cmd = RecordDecisionRationaleCommandSchema.parse(input);
    assertPermitted("RecordDecisionRationale", cmd.actor.roles);
    return this.gateway.executeCommand({
      ...this.envelope(cmd, "RecordDecisionRationale"),
      decide: (current) => {
        assertNotTerminal(current);
        return {
          changes: {}, // audit-only: no column changes; version still increments
          auditAction: COMMAND_AUDIT_ACTIONS.RecordDecisionRationale,
          auditMetadata: { decisionContext: cmd.decisionContext },
        };
      },
    });
  }

  async closeCase(input: CloseCaseCommand): Promise<CommandResult> {
    const cmd = CloseCaseCommandSchema.parse(input);
    assertPermitted("CloseCase", cmd.actor.roles);
    if (!cmd.reason) throw new RationaleRequiredError("CloseCase");
    return this.gateway.executeCommand({
      ...this.envelope(cmd, "CloseCase"),
      decide: (current) => {
        if (!canTransitionCase(current.status, "CLOSED")) {
          if (TERMINAL_STATUSES.includes(current.status)) {
            throw new TerminalCaseError(current.caseKey, current.status);
          }
          throw new Error(`Invalid case transition: ${current.status} -> CLOSED`);
        }
        return {
          changes: { status: "CLOSED" },
          auditAction: COMMAND_AUDIT_ACTIONS.CloseCase,
          auditMetadata: { from: current.status, to: "CLOSED" },
        };
      },
    });
  }

  async reopenCase(input: ReopenCaseCommand): Promise<CommandResult> {
    const cmd = ReopenCaseCommandSchema.parse(input);
    assertPermitted("ReopenCase", cmd.actor.roles);
    if (!cmd.reason) throw new RationaleRequiredError("ReopenCase");
    return this.gateway.executeCommand({
      ...this.envelope(cmd, "ReopenCase"),
      decide: (current) => {
        if (!canReopenCase(current.status, cmd.reopenTo)) {
          throw new Error(`Cannot reopen case from ${current.status} to ${cmd.reopenTo}`);
        }
        return {
          changes: { status: cmd.reopenTo, closedAt: null },
          auditAction: COMMAND_AUDIT_ACTIONS.ReopenCase,
          auditMetadata: { from: current.status, to: cmd.reopenTo },
        };
      },
    });
  }

  private envelope(
    cmd: {
      organizationId: string;
      caseKey: string;
      expectedVersion?: number;
      actor: { actorId: string; actorType: "USER" | "AGENT" | "SYSTEM" };
      correlationId?: string;
      idempotencyKey?: string;
      reason?: string;
    },
    commandType: string,
  ) {
    return {
      organizationId: cmd.organizationId,
      caseKey: cmd.caseKey,
      expectedVersion: cmd.expectedVersion,
      actor: { actorType: cmd.actor.actorType, actorId: cmd.actor.actorId },
      commandType,
      correlationId: cmd.correlationId,
      idempotencyKey: cmd.idempotencyKey,
      reason: cmd.reason,
    };
  }
}
