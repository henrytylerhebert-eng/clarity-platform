import type { CecRecord, LegalInstrument, OpcRecord, PecRecord } from "./types";
import { canonicalJson, sha256 } from "./hashLedger";
import { getExaminerType, type EpecRuleSet } from "./epecRuleSets";

/**
 * Pure, framework-free e-PEC (OPC/PEC/CEC) lifecycle logic. No React, no app state — takes the
 * current instrument (if any) plus form input and a jurisdiction rule set, and returns the next
 * instrument plus the fields the caller needs to append a CustodyLedgerEvent. Mirrors the existing
 * packets.ts/bedboard.ts pattern of pure domain builders invoked from App.tsx.
 */

export interface OpcInput {
  requestor: string;
  relation: string;
  observed: string;
  grounds: string[];
}

export interface PecInput {
  examinerName: string;
  examinerType: string;
  examinedAt: string;
  findings: string[];
  conditions: string[];
  telemedicine: boolean;
  narrative: string;
  certificateSequence?: "1st" | "2nd";
  collaboratingPhysicianName?: string;
  examinerLicenseNumber?: string;
}

export interface CecInput {
  examinerName: string;
  findings: string[];
  conditions: string[];
  outcome: "Continued" | "Discharged";
  dischargeReason?: string;
  examinerLicenseNumber?: string;
}

/**
 * A structural completeness problem with proposed instrument input. Advisory by design: per
 * docs/legal/LEGAL_STATUS_ARCHITECTURE.md nothing here decides whether a hold is legally valid,
 * it only reports whether the record is complete against the printed form and cited statute.
 */
export interface LegalValidationIssue {
  code: string;
  message: string;
  citation: string;
}

export interface LifecycleResult {
  instrument: LegalInstrument;
  ledgerEventType: string;
  ledgerDetail: string;
  ledgerPayload: Record<string, unknown>;
}

function baseInstrument(caseId: string, ruleSetId: string, draftText: string): LegalInstrument {
  return {
    id: `legal-${caseId}`,
    caseId,
    legalStatus: "Unknown",
    requiredFactsComplete: false,
    clockStatus: "Active",
    draftText,
    reviewStatus: "Counsel validation required",
    ruleSetId,
  };
}

export function isPecExamWithinWindow(examinedAtIso: string, nowIso: string, windowMinutes: number): boolean {
  const examinedAt = Date.parse(examinedAtIso);
  const now = Date.parse(nowIso);
  if (Number.isNaN(examinedAt) || Number.isNaN(now)) return false;
  if (examinedAt > now) return false;
  const elapsedMinutes = (now - examinedAt) / 60000;
  return elapsedMinutes <= windowMinutes;
}

function normalizeIdentity(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

/**
 * One-of-one control number for a generated instrument. Printed on the form face and carried
 * on the record so a physical/PDF copy and its stored instance resolve to each other.
 */
export function newFormInstanceId(): string {
  const cryptoRef = globalThis.crypto;
  if (cryptoRef && typeof cryptoRef.randomUUID === "function") return cryptoRef.randomUUID();
  return `inst-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Structural validation for a proposed PEC, reconciled against the official OBH-1 / OBH-1A
 * forms and current statute in docs/legal/LOUISIANA_OPC_PEC_CEC_FORM_VERIFICATION.md.
 */
export function validatePecInput(input: PecInput, ruleSet: EpecRuleSet): LegalValidationIssue[] {
  const issues: LegalValidationIssue[] = [];
  const examinerType = getExaminerType(ruleSet, input.examinerType);

  // The form instructs "check where appropriate in BOTH 1 & 2" — each group needs a selection,
  // not just one selection overall.
  if (input.findings.length === 0) {
    issues.push({
      code: "DANGEROUSNESS_GROUP_1_EMPTY",
      message: "Select at least one finding from group 1 (dangerous to self / to others / gravely disabled).",
      citation: 'OBH-1 / OBH-1A / OBH-2: "check where appropriate in both 1 & 2"',
    });
  }
  if (input.conditions.length === 0) {
    issues.push({
      code: "DANGEROUSNESS_GROUP_2_EMPTY",
      message: "Select at least one condition from group 2 (unwilling / unable / willing upon arrival).",
      citation: 'OBH-1 / OBH-1A / OBH-2: "check where appropriate in both 1 & 2"',
    });
  }

  if (input.telemedicine && examinerType && !examinerType.telehealthEligible) {
    issues.push({
      code: "TELEHEALTH_ROLE_INELIGIBLE",
      message: `${input.examinerType} may not conduct the examination by telehealth; an in-person examination is required for this role.`,
      citation: "La. R.S. 28:53(B)(1), as amended by Act 148 of 2025",
    });
  }

  if (examinerType?.requiresCollaboratingPhysicianApproval && !input.collaboratingPhysicianName?.trim()) {
    issues.push({
      code: "NP_VERBAL_APPROVAL_MISSING",
      message:
        "A non-psychiatric nurse practitioner must record the collaborating physician who gave verbal approval to execute this certificate.",
      citation: "La. R.S. 28:53(B)(1)",
    });
  }

  if (!input.narrative.trim()) {
    issues.push({
      code: "NARRATIVE_MISSING",
      message: "Record the observed behavior supporting the findings.",
      citation: "OBH-1 / OBH-1A: History of Present Illness",
    });
  }

  return issues;
}

/**
 * La. R.S. 28:53(G)(3): where the coroner executed the initial certificate, the independent
 * examination must be performed by a different examiner. Compares license number when both
 * sides carry one, falling back to name.
 */
export function validateCecIndependence(pec: PecRecord | undefined, input: CecInput): LegalValidationIssue[] {
  if (!pec) return [];
  const sameLicense =
    Boolean(pec.examinerLicenseNumber?.trim()) &&
    normalizeIdentity(pec.examinerLicenseNumber) === normalizeIdentity(input.examinerLicenseNumber);
  const sameName = normalizeIdentity(pec.examinerName) === normalizeIdentity(input.examinerName);
  if (!sameLicense && !sameName) return [];
  return [
    {
      code: "CEC_INDEPENDENCE_VIOLATION",
      message: `The CEC must be executed by an examiner independent of the one who signed the PEC (${pec.examinerName}).`,
      citation: "La. R.S. 28:53(G)(3)",
    },
  ];
}

/**
 * Elapsed-hour readings for the custody clocks that start when the person arrives at the
 * facility or coroner's office. Both the statutory and printed-form figures are returned —
 * see DEADLINE_CONFLICTS. Never collapse these to one number.
 */
export function readArrivalExamWindows(
  arrivalIso: string,
  nowIso: string,
  ruleSet: EpecRuleSet,
): Array<{ id: string; label: string; targetMinutes: number; elapsedMinutes: number; remainingMinutes: number; breached: boolean }> {
  const arrival = Date.parse(arrivalIso);
  const now = Date.parse(nowIso);
  const elapsedMinutes = Number.isNaN(arrival) || Number.isNaN(now) ? 0 : Math.max(0, Math.round((now - arrival) / 60000));
  const { examOnArrivalFormPrinted, examOnArrivalStatutory } = ruleSet.custodyWindowsMinutes;
  return [
    { id: "form-printed", label: "8h — as printed on OBH-20", targetMinutes: examOnArrivalFormPrinted },
    { id: "statutory", label: "12h — La. R.S. 28:53.2(D)", targetMinutes: examOnArrivalStatutory },
  ].map((window) => ({
    ...window,
    elapsedMinutes,
    remainingMinutes: window.targetMinutes - elapsedMinutes,
    breached: elapsedMinutes > window.targetMinutes,
  }));
}

export function issueOpc(
  existing: LegalInstrument | undefined,
  caseId: string,
  input: OpcInput,
  ruleSet: EpecRuleSet,
  nowIso: string,
): LifecycleResult {
  const expiresAt = new Date(Date.parse(nowIso) + ruleSet.windowsMinutes.opc * 60000).toISOString();
  const opc: OpcRecord = {
    issuedAt: nowIso,
    requestor: input.requestor,
    relation: input.relation,
    observed: input.observed,
    grounds: input.grounds,
    expiresAt,
  };
  const base = existing ?? baseInstrument(caseId, ruleSet.id, "Draft OPC scaffold. Louisiana statutory language and timing require counsel validation.");
  const instrument: LegalInstrument = {
    ...base,
    legalStatus: "OPC",
    ruleSetId: ruleSet.id,
    requiredFactsComplete: input.grounds.length > 0 && input.observed.trim().length > 0,
    opc,
  };
  const windowHours = Math.round(ruleSet.windowsMinutes.opc / 60);
  return {
    instrument,
    ledgerEventType: "OPC_ISSUED",
    ledgerDetail: `Order for Protective Custody issued under ${ruleSet.statuteRefs.opc}. Directs peace-officer transport to the nearest treatment facility for examination; valid ${windowHours} hours. Grounds: ${input.grounds.join("; ") || "Unknown"}.`,
    ledgerPayload: { statuteRef: ruleSet.statuteRefs.opc, grounds: input.grounds, expiresAt, containsPhi: false },
  };
}

export async function executePec(
  existing: LegalInstrument | undefined,
  caseId: string,
  input: PecInput,
  ruleSet: EpecRuleSet,
  previousLedgerHash: string | null,
  nowIso: string,
): Promise<LifecycleResult & { sealHash: string }> {
  const examinerType = getExaminerType(ruleSet, input.examinerType);
  const pec: PecRecord = {
    examinerName: input.examinerName,
    examinerType: input.examinerType,
    examinedAt: input.examinedAt,
    findings: input.findings,
    conditions: input.conditions,
    telemedicine: input.telemedicine,
    narrative: input.narrative,
    executedAt: nowIso,
    form: examinerType?.form ?? "OBH-1",
    certificateSequence: input.certificateSequence ?? "1st",
    collaboratingPhysicianName: input.collaboratingPhysicianName?.trim() || undefined,
    examinerLicenseNumber: input.examinerLicenseNumber?.trim() || undefined,
    formInstanceId: newFormInstanceId(),
  };
  const sealHash = await sha256(canonicalJson({ caseId, pec }) + (previousLedgerHash ?? ""));
  pec.sealHash = sealHash;
  const base = existing ?? baseInstrument(caseId, ruleSet.id, "Draft PEC scaffold (Form OBH-1). Louisiana statutory language and timing require counsel validation.");
  const instrument: LegalInstrument = {
    ...base,
    legalStatus: "PEC",
    ruleSetId: ruleSet.id,
    requiredFactsComplete: true,
    pec,
  };
  return {
    instrument,
    sealHash,
    ledgerEventType: "PEC_EXECUTED",
    ledgerDetail: `Physician's Emergency Certificate executed (Form OBH-1, ${ruleSet.statuteRefs.pec}) by ${input.examinerType} ${input.examinerName}. Findings: ${input.findings.join(", ") || "Unknown"}; ${input.conditions.join(", ") || "Unknown"}.${input.telemedicine ? " Examination conducted by telemedicine." : ""} Sealed fingerprint ${sealHash.slice(0, 16)}...`,
    ledgerPayload: { statuteRef: ruleSet.statuteRefs.pec, findings: input.findings, conditions: input.conditions, sealHash, containsPhi: false },
  };
}

export function executeCec(existing: LegalInstrument, ruleSet: EpecRuleSet, input: CecInput, nowIso: string): LifecycleResult {
  const cec: CecRecord = {
    examinerName: input.examinerName,
    findings: input.findings,
    conditions: input.conditions,
    outcome: input.outcome,
    dischargeReason: input.dischargeReason,
    executedAt: nowIso,
    recordFrozenAt: nowIso,
    examinerLicenseNumber: input.examinerLicenseNumber?.trim() || undefined,
    formInstanceId: newFormInstanceId(),
  };
  const instrument: LegalInstrument = {
    ...existing,
    legalStatus: "CEC",
    clockStatus: "Display only",
    cec,
  };
  const detail = input.outcome === "Continued"
    ? `Coroner's Emergency Certificate executed (Form OBH-2, ${ruleSet.statuteRefs.cec}) by ${input.examinerName}. Findings: ${input.findings.join(", ") || "Unknown"}; ${input.conditions.join(", ") || "Unknown"}. Continued confinement authorized as a precondition to further detention.`
    : `Coroner (${input.examinerName}) finds the subject not a proper candidate for emergency admission under ${ruleSet.statuteRefs.cec}. Subject shall not be further detained; discharge forthwith.${input.dischargeReason ? ` Reason: ${input.dischargeReason}.` : ""}`;
  return {
    instrument,
    ledgerEventType: input.outcome === "Continued" ? "CEC_EXECUTED" : "CEC_DISCHARGE",
    ledgerDetail: detail,
    ledgerPayload: { outcome: input.outcome, findings: input.findings, conditions: input.conditions, dischargeReason: input.dischargeReason ?? null, containsPhi: false },
  };
}
