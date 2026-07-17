import type { CecRecord, LegalInstrument, OpcRecord, PecRecord } from "./types";
import { canonicalJson, sha256 } from "./hashLedger";
import type { EpecRuleSet } from "./epecRuleSets";

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
}

export interface CecInput {
  examinerName: string;
  findings: string[];
  conditions: string[];
  outcome: "Continued" | "Discharged";
  dischargeReason?: string;
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
  const pec: PecRecord = {
    examinerName: input.examinerName,
    examinerType: input.examinerType,
    examinedAt: input.examinedAt,
    findings: input.findings,
    conditions: input.conditions,
    telemedicine: input.telemedicine,
    narrative: input.narrative,
    executedAt: nowIso,
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
