/**
 * Advisory deadline calculators for the Louisiana OPC/PEC/CEC chain.
 *
 * Per docs/legal/LEGAL_STATUS_ARCHITECTURE.md's binding non-enforcement rule,
 * these functions only report elapsed/remaining time and a status label — none
 * of them decide release, discharge, or validity. The shape mirrors
 * app/src/domain/types.ts's ComplianceClock/evaluateClock contract exactly
 * (id/caseId/label/lane/startedAt/targetMinutes/stoppedAt/counselValidationRequired)
 * so a caller can feed the result straight into the existing evaluateClock() without
 * a new UI concept — this package does not import from app/ (packages/* must not
 * depend on the app workspace), so the shape is restated here rather than imported.
 */

export type ClockLane = "Clinical" | "Financial" | "Legal";

export interface LouisianaComplianceClock {
  id: string;
  caseId: string;
  label: string;
  lane: ClockLane;
  startedAt: string;
  targetMinutes: number;
  stoppedAt?: string;
  /** Always true here — every Louisiana statutory clock is configuration pending counsel review. */
  counselValidationRequired: true;
}

const HOUR_MINUTES = 60;

function makeClock(
  caseId: string,
  idSuffix: string,
  label: string,
  startedAt: string,
  targetHours: number,
): LouisianaComplianceClock {
  return {
    id: `${caseId}-${idSuffix}`,
    caseId,
    label,
    lane: "Legal",
    startedAt,
    targetMinutes: targetHours * HOUR_MINUTES,
    counselValidationRequired: true,
  };
}

/** La. R.S. 28:53.2(D): the OPC is effective for 72 hours from issuance (confirmed on OBH-20's face too). */
export function opcValidityClock(caseId: string, issuedAt: string): LouisianaComplianceClock {
  return makeClock(caseId, "opc-validity", "OPC validity (72h from issuance)", issuedAt, 72);
}

/**
 * La. R.S. 28:53.2: transport must occur "in no event more than twelve hours
 * after being taken into protective custody" — this deadline is NOT printed on
 * OBH-20 itself (verification memo §1.2).
 */
export function opcTransportClock(caseId: string, custodyStartedAt: string): LouisianaComplianceClock {
  return makeClock(caseId, "opc-transport", "OPC transport/delivery (12h statutory)", custodyStartedAt, 12);
}

/**
 * Dual-track deadline confirmed this session: R.S. 28:53.2(D) sets a 12-hour
 * statutory examination deadline; OBH-20 (Rev. 03/2017)'s printed text says eight
 * hours. Both readings are returned — never collapse this to a single number, per
 * the review's interim-design recommendation (docs/legal/LOUISIANA_OPC_PEC_CEC_FORM_VERIFICATION.md §1.1).
 */
export function opcExaminationClocks(
  caseId: string,
  arrivalAt: string,
): { statutory: LouisianaComplianceClock; formPrinted: LouisianaComplianceClock } {
  return {
    statutory: makeClock(caseId, "opc-exam-statutory", "OPC examination deadline (12h statutory — R.S. 28:53.2(D))", arrivalAt, 12),
    formPrinted: makeClock(caseId, "opc-exam-form", "OPC examination deadline (8h — as printed on OBH-20)", arrivalAt, 8),
  };
}

/** La. R.S. 28:53(G)(2)(a)/OBH-2: independent coroner examination within 72 hours of admission. */
export function cecIndependentExamClock(caseId: string, admittedAt: string): LouisianaComplianceClock {
  return makeClock(caseId, "cec-independent-exam", "CEC independent examination deadline (72h from admission)", admittedAt, 72);
}

/**
 * La. R.S. 28:53: the examination date "shall not be more than seventy-two hours
 * prior to the date of the signature of the certificate." Unlike the other
 * functions here, this validates a closed interval rather than projecting a
 * forward-running clock, so it returns a boolean + the elapsed hours rather than
 * a ComplianceClock (there is no "remaining time" to track once both timestamps
 * are known).
 */
export function isExamWithinSignatureWindow(
  examinedAt: string,
  signedAt: string,
): { withinWindow: boolean; elapsedHours: number } {
  const elapsedMs = Date.parse(signedAt) - Date.parse(examinedAt);
  const elapsedHours = elapsedMs / (HOUR_MINUTES * 60 * 1000);
  return { withinWindow: elapsedHours >= 0 && elapsedHours <= 72, elapsedHours };
}
