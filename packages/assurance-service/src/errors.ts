export class AssuranceServiceError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
  ) {
    super(code);
    this.name = "AssuranceServiceError";
  }
}

export class AssurancePermissionDeniedError extends AssuranceServiceError {
  constructor() {
    super("assurance_permission_denied", 403);
    this.name = "AssurancePermissionDeniedError";
  }
}

export class AssuranceServiceNotFoundError extends AssuranceServiceError {
  constructor() {
    super("assurance_resource_not_found", 404);
    this.name = "AssuranceServiceNotFoundError";
  }
}

export class AssuranceValidationError extends AssuranceServiceError {
  constructor(code: string) {
    super(code, 400);
    this.name = "AssuranceValidationError";
  }
}

export class AssuranceConflictError extends AssuranceServiceError {
  constructor(code = "assurance_state_conflict") {
    super(code, 409);
    this.name = "AssuranceConflictError";
  }
}
