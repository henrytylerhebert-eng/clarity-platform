/**
 * Jurisdiction rule-set configuration for the e-PEC custody lifecycle (OPC/PEC/CEC).
 *
 * Per docs/legal/LEGAL_STATUS_ARCHITECTURE.md's binding non-enforcement rule: all statutory
 * triggers, durations, and form-option lists here are configuration, not statutory truth, and
 * require counsel validation before any production use. Adding a second jurisdiction is adding a
 * new rule set below — the lifecycle logic in epec.ts and the LegalStatus workspace do not change.
 *
 * Values below were reconciled against the official OBH form PDFs and current statute text in
 * docs/legal/LOUISIANA_OPC_PEC_CEC_FORM_VERIFICATION.md. Where the printed form and the statute
 * disagree, BOTH are represented here rather than silently picking one — see
 * `custodyWindowsMinutes` and `DEADLINE_CONFLICTS`.
 */

/** Which OBH form a given signer executes. */
export type ObhFormId = "OBH-1" | "OBH-1A" | "OBH-2" | "OBH-19" | "OBH-20";

export interface ExaminerType {
  /** Stable identifier persisted on PecRecord.examinerType — do not rename casually. */
  value: string;
  /**
   * La. R.S. 28:53(B)(1) as amended by Act 148 of 2025 (enrolled HB 137): the telehealth
   * sentence names only a psychiatrist, psychologist, medical psychologist, or PMHNP.
   * Physician assistants and non-psychiatric nurse practitioners are NOT included.
   */
  telehealthEligible: boolean;
  /**
   * La. R.S. 28:53(B)(1): a non-psychiatric nurse practitioner acts under a collaborative
   * practice agreement AND must receive verbal approval from the collaborating physician
   * before executing the certificate. OBH-1 has no printed field for this.
   */
  requiresCollaboratingPhysicianApproval: boolean;
  /** Board that issues this role's license — drives the license-number helper text. */
  licenseBoard: "LSBME" | "LSBN" | "LSBEP";
  /** Psychologists execute the OBH-1A variant; everyone else executes OBH-1. */
  form: Extract<ObhFormId, "OBH-1" | "OBH-1A">;
}

export interface EpecRuleSet {
  id: string;
  jurisdictionLabel: string;
  statuteRefs: { opc: string; pec: string; pecPsychologist: string; cec: string; requestForCustody: string };
  /**
   * Legacy window keys retained for existing consumers (seed clocks, App.tsx, epec tests).
   * 72 hours = 4320 minutes. Configuration, not statutory truth.
   */
  windowsMinutes: { opc: number; pec: number; cec: number };
  /**
   * Custody-clock windows introduced from the form-verification memo. Kept separate from
   * `windowsMinutes` so existing consumers are unaffected.
   */
  custodyWindowsMinutes: {
    /** La. R.S. 28:53.2 — delivery to facility/coroner. Statute only; NOT printed on OBH-20. */
    transportDelivery: number;
    /** La. R.S. 28:53.2(D) — examination after arrival. The controlling statutory figure. */
    examOnArrivalStatutory: number;
    /** As printed on OBH-20 (Rev. 03/2017): "examined within eight hours of his/her arrival". */
    examOnArrivalFormPrinted: number;
  };
  examinerTypes: ExaminerType[];
  groundsOptions: Array<{ value: string; description: string }>;
  conditionOptions: Array<{ value: string; description: string }>;
  /** OBH-1 / OBH-1A print "1st" and "2nd" checkboxes for the certificate sequence. */
  certificateSequenceOptions: Array<{ value: "1st" | "2nd"; description: string }>;
  /** Mirrors RoutingResponse.tsx's existing decline reason codes for consistency across the app. */
  declineReasonCodes: string[];
}

/**
 * Known form-vs-statute conflicts surfaced in the UI rather than resolved in software.
 * Displaying both figures is deliberate: silently enforcing one would either over-detain
 * (if the 8-hour form condition governs) or prematurely release (if it does not).
 */
export const DEADLINE_CONFLICTS = [
  {
    id: "opc-exam-window",
    label: "OPC examination deadline",
    formSays: "8 hours (OBH-20, Rev. 03/2017, printed text)",
    statuteSays: "12 hours (La. R.S. 28:53.2(D))",
    guidance:
      "Treat the 8-hour figure as the operative condition of the signed order and the 12-hour figure as the statutory ceiling. Escalate before 8 hours; do not rely on software to choose. Pending written LDH clarification.",
  },
  {
    id: "substance-28-day",
    label: "Substance-related detention period",
    formSays: "28 days (OBH-1 / OBH-1A printed checkbox, citing Title 28:52.4)",
    statuteSays: "a medically necessary period (La. R.S. 28:52.4, as amended by Act 369 of 2017)",
    guidance:
      "The 28-day cap was removed from the statute but remains printed on the form. Never run an automated 28-day release timer. Pending written LDH clarification.",
  },
] as const;

export const LOUISIANA_EPEC_RULE_SET: EpecRuleSet = {
  id: "la-epec-v1",
  jurisdictionLabel: "Louisiana",
  statuteRefs: {
    // Pure statute citations — the form number is rendered separately by each heading,
    // so embedding it here would duplicate it on screen.
    opc: "La. R.S. 28:53.2",
    pec: "La. R.S. 28:53 & 28:63",
    pecPsychologist: "La. R.S. 28:53 & 28:63",
    cec: "La. R.S. 28:52.4 & 28:53",
    requestForCustody: "La. R.S. 28:53.2",
  },
  windowsMinutes: { opc: 4320, pec: 4320, cec: 4320 },
  custodyWindowsMinutes: {
    transportDelivery: 720,
    examOnArrivalStatutory: 720,
    examOnArrivalFormPrinted: 480,
  },
  examinerTypes: [
    {
      value: "Physician (MD/DO)",
      telehealthEligible: true,
      requiresCollaboratingPhysicianApproval: false,
      licenseBoard: "LSBME",
      form: "OBH-1",
    },
    {
      value: "Physician Assistant",
      telehealthEligible: false,
      requiresCollaboratingPhysicianApproval: false,
      licenseBoard: "LSBME",
      form: "OBH-1",
    },
    {
      value: "Psychiatric Mental Health NP",
      telehealthEligible: true,
      requiresCollaboratingPhysicianApproval: false,
      licenseBoard: "LSBN",
      form: "OBH-1",
    },
    {
      value: "Nurse Practitioner",
      telehealthEligible: false,
      requiresCollaboratingPhysicianApproval: true,
      licenseBoard: "LSBN",
      form: "OBH-1",
    },
    {
      value: "Psychologist",
      telehealthEligible: true,
      requiresCollaboratingPhysicianApproval: false,
      licenseBoard: "LSBEP",
      form: "OBH-1A",
    },
    {
      value: "Medical Psychologist",
      telehealthEligible: true,
      requiresCollaboratingPhysicianApproval: false,
      licenseBoard: "LSBME",
      form: "OBH-1A",
    },
  ],
  groundsOptions: [
    { value: "Dangerous to self", description: "Substantial risk of self-inflicted serious bodily harm" },
    { value: "Dangerous to others", description: "Substantial risk of serious bodily harm to another" },
    { value: "Gravely disabled", description: "Unable to provide for basic needs; harm without care" },
  ],
  conditionOptions: [
    { value: "Unwilling to seek voluntary admission", description: "" },
    { value: "Unable to seek voluntary admission", description: "" },
    {
      value: "Willing to seek voluntary admission upon arrival at the treating facility",
      description: "Printed on OBH-1 (Rev. 08/2025); not present on the older OBH-1A or OBH-2",
    },
  ],
  certificateSequenceOptions: [
    { value: "1st", description: "Initial emergency certificate for this episode" },
    {
      value: "2nd",
      description:
        "Second certificate — substance-disorder extension (R.S. 28:53(A)(2)) or inter-parish transfer continuation (R.S. 28:53(G)(7)-(8))",
    },
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

export function getExaminerType(ruleSet: EpecRuleSet, value: string): ExaminerType | undefined {
  return ruleSet.examinerTypes.find((type) => type.value === value);
}

/** The third condition option exists only on OBH-1 (Rev. 08/2025); OBH-1A and OBH-2 omit it. */
export function conditionOptionsForForm(ruleSet: EpecRuleSet, form: ObhFormId) {
  if (form === "OBH-1") return ruleSet.conditionOptions;
  return ruleSet.conditionOptions.filter(
    (option) => option.value !== "Willing to seek voluntary admission upon arrival at the treating facility",
  );
}
