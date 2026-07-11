/**
 * PermissionDeniedError / RationaleRequiredError live in @clarity/domain-contracts
 * (shared by every command service); re-exported here for backward compatibility.
 */
export { PermissionDeniedError, RationaleRequiredError } from "@clarity/domain-contracts";

/** The case is in a terminal state; only ReopenCase may touch it. */
export class TerminalCaseError extends Error {
  constructor(caseKey: string, status: string) {
    super(`Case "${caseKey}" is ${status}; terminal cases can only be modified via ReopenCase`);
    this.name = "TerminalCaseError";
  }
}

export { CaseNotFoundError, ConcurrencyConflictError, IdempotencyConflictError } from "@clarity/case-repository";
