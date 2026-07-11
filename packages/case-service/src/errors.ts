/** Actor's roles do not permit the command. */
export class PermissionDeniedError extends Error {
  constructor(command: string, roles: readonly string[]) {
    super(`Roles [${roles.join(", ") || "none"}] are not permitted to execute ${command}`);
    this.name = "PermissionDeniedError";
  }
}

/** A high-impact command was issued without the required rationale. */
export class RationaleRequiredError extends Error {
  constructor(command: string) {
    super(`${command} requires a reason/rationale`);
    this.name = "RationaleRequiredError";
  }
}

/** The case is in a terminal state; only ReopenCase may touch it. */
export class TerminalCaseError extends Error {
  constructor(caseKey: string, status: string) {
    super(`Case "${caseKey}" is ${status}; terminal cases can only be modified via ReopenCase`);
    this.name = "TerminalCaseError";
  }
}

export { CaseNotFoundError, ConcurrencyConflictError, IdempotencyConflictError } from "@clarity/case-repository";
