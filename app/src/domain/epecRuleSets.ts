/**
 * Jurisdiction rule-set configuration for the e-PEC custody lifecycle (OPC/PEC/CEC).
 *
 * Per docs/legal/LEGAL_STATUS_ARCHITECTURE.md's binding non-enforcement rule: all statutory
 * triggers, durations, and form-option lists here are configuration, not statutory truth, and
 * require counsel validation before any production use. Adding a second jurisdiction is adding a
 * new rule set below — the lifecycle logic in epec.ts and the LegalStatus workspace do not change.
 */
export interface EpecRuleSet {
  id: string;
  jurisdictionLabel: string;
  statuteRefs: { opc: string; pec: string; cec: string };
  /** Statutory windows, in minutes. 72 hours = 4320 minutes. Configuration, not statutory truth. */
  windowsMinutes: { opc: number; pec: number; cec: number };
  examinerTypes: string[];
  groundsOptions: Array<{ value: string; description: string }>;
  conditionOptions: Array<{ value: string; description: string }>;
  /** Mirrors RoutingResponse.tsx's existing decline reason codes for consistency across the app. */
  declineReasonCodes: string[];
}

export const LOUISIANA_EPEC_RULE_SET: EpecRuleSet = {
  id: "la-epec-v1",
  jurisdictionLabel: "Louisiana",
  statuteRefs: {
    opc: "La. R.S. 28:53.2",
    pec: "La. R.S. 28:53 & 28:63 (Form OBH-1)",
    cec: "La. R.S. 28:52.4 & 28:53 (Form OBH-2)",
  },
  windowsMinutes: { opc: 4320, pec: 4320, cec: 4320 },
  examinerTypes: [
    "Physician (MD/DO)",
    "Physician Assistant",
    "Psychiatric Mental Health NP",
    "Nurse Practitioner",
    "Psychologist",
  ],
  groundsOptions: [
    { value: "Dangerous to self", description: "Substantial risk of self-inflicted serious bodily harm" },
    { value: "Dangerous to others", description: "Substantial risk of serious bodily harm to another" },
    { value: "Gravely disabled", description: "Unable to provide for basic needs; harm without care" },
  ],
  conditionOptions: [
    { value: "Unwilling to seek voluntary admission", description: "" },
    { value: "Unable to seek voluntary admission", description: "" },
  ],
  declineReasonCodes: [
    "no bed available",
    "acuity too high",
    "medical exclusion",
    "age mismatch",
    "payer issue",
    "packet incomplete",
    "staffing constraint",
    "other",
  ],
};

export const EPEC_RULE_SETS: Record<string, EpecRuleSet> = {
  [LOUISIANA_EPEC_RULE_SET.id]: LOUISIANA_EPEC_RULE_SET,
};

export const DEFAULT_EPEC_RULE_SET_ID = LOUISIANA_EPEC_RULE_SET.id;

export function getEpecRuleSet(id?: string): EpecRuleSet {
  return EPEC_RULE_SETS[id ?? DEFAULT_EPEC_RULE_SET_ID] ?? LOUISIANA_EPEC_RULE_SET;
}
