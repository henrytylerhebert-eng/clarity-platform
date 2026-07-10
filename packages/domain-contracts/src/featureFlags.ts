/**
 * Required feature flags (INTEGRATION_PLAN; integration prompt Phase 8).
 * All payer-stack functionality ships dark until explicitly enabled.
 */
export const FEATURE_FLAGS = [
  "benefits_verification",
  "payer_memory",
  "authorization_management",
  "patient_financial_education",
  "referral_prioritization",
  "contract_rate_intelligence",
] as const;
export type FeatureFlag = (typeof FEATURE_FLAGS)[number];

export type FeatureFlagState = Record<FeatureFlag, boolean>;

export function defaultFeatureFlags(): FeatureFlagState {
  return Object.fromEntries(FEATURE_FLAGS.map((f) => [f, false])) as FeatureFlagState;
}

export function isEnabled(flags: FeatureFlagState, flag: FeatureFlag): boolean {
  return flags[flag] === true;
}
