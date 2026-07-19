import type { PrescreenErrorCode } from "@clarity/domain-contracts";

/**
 * Stable prescreen command errors. Every class carries a code from the
 * Phase 1 PRESCREEN_ERROR_CODES vocabulary and a message that never
 * discloses whether an unauthorized or cross-tenant identifier exists.
 */

export class PrescreenCommandError extends Error {
  constructor(
    public readonly code: PrescreenErrorCode,
    message: string,
    public readonly details: readonly string[] = [],
  ) {
    super(message);
    this.name = new.target.name;
  }
}

/** Actor's role codes do not permit the command. Raised before any read. */
export class PrescreenPermissionDeniedError extends PrescreenCommandError {
  constructor(command: string, roleCodes: readonly string[]) {
    super(
      "PERMISSION_DENIED",
      `Role codes [${roleCodes.join(", ") || "none"}] are not permitted to execute ${command}`,
    );
  }
}

/** Resource absent or outside the actor's organization — one indistinguishable answer. */
export class PrescreenNotFoundError extends PrescreenCommandError {
  constructor(kind: "encounter" | "assessment") {
    super("RESOURCE_NOT_FOUND", `The prescreen ${kind} was not found.`);
  }
}

export class PrescreenVersionConflictError extends PrescreenCommandError {
  constructor() {
    super("PRESCREEN_VERSION_CONFLICT", "The record changed. Refresh and review before trying again.");
  }
}

export class PrescreenIdempotencyKeyReusedError extends PrescreenCommandError {
  constructor() {
    super("IDEMPOTENCY_KEY_REUSED", "The idempotency key was already used for a different command body.");
  }
}

export class AssessmentNotDraftError extends PrescreenCommandError {
  constructor() {
    super("ASSESSMENT_NOT_DRAFT", "The assessment version is not editable as a draft.");
  }
}

export class AssessmentVersionRequiredError extends PrescreenCommandError {
  constructor(message: string) {
    super("ASSESSMENT_VERSION_REQUIRED", message);
  }
}

export class PrescreenDomainValidationError extends PrescreenCommandError {
  constructor(message: string, details: readonly string[] = []) {
    super("DOMAIN_VALIDATION_FAILED", message, details);
  }
}
