export const PRESCREEN_CONTRACT_ERROR_CODES = [
  "INVALID_ENCOUNTER_TRANSITION",
  "ASSESSMENT_VERSION_REQUIRED",
  "ASSESSMENT_VERSION_CONFLICT",
] as const;

export type PrescreenContractErrorCode = (typeof PRESCREEN_CONTRACT_ERROR_CODES)[number];

export class PrescreenContractError extends Error {
  constructor(
    public readonly code: PrescreenContractErrorCode,
    message: string,
    public readonly details: readonly string[] = [],
  ) {
    super(message);
    this.name = "PrescreenContractError";
  }
}
