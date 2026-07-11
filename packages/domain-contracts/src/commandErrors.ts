/**
 * Generic command-service error vocabulary shared by every command service.
 * Command-specific errors (e.g. TerminalCaseError) stay in their own package.
 */

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
