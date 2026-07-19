import { TELEHEALTH_ELIGIBLE_ROLES } from "./formTypes.js";
import type {
  DangerousnessCriteria,
  Obh1PhysicianEmergencyCertificate,
  Obh1aPsychologistEmergencyCertificate,
  Obh2CoronerEmergencyCertificate,
  TelehealthDetails,
} from "./formTypes.js";

/**
 * Advisory structural validators — these surface Issue[] for a caller (UI or a
 * future workflow layer) to display; nothing here throws or blocks anything, per
 * docs/legal/LEGAL_STATUS_ARCHITECTURE.md's binding non-enforcement rule. They
 * check that the DATA IS STRUCTURALLY COMPLETE against what the statute/form
 * requires — they do not decide legal validity of a hold.
 */

export interface Issue {
  code: string;
  message: string;
  citation: string;
}

export interface FormValidationResult {
  errors: Issue[];
  warnings: Issue[];
}

function emptyResult(): FormValidationResult {
  return { errors: [], warnings: [] };
}

/**
 * The form instruction is "check where appropriate in both 1 & 2" — at least one
 * selection is required from EACH group, independently. (Corrects the original
 * review's TRC-006, which read this as "at least one selected" overall.)
 */
export function validateDangerousnessCriteria(criteria: {
  group1: DangerousnessCriteria["group1"];
  group2: Partial<DangerousnessCriteria["group2"]>;
}): FormValidationResult {
  const result = emptyResult();
  const group1Selected = criteria.group1.dangerousToSelf || criteria.group1.dangerousToOthers || criteria.group1.gravelyDisabled;
  const group2Selected =
    criteria.group2.unwilling ||
    criteria.group2.unableToSeekVoluntaryAdmission ||
    criteria.group2.willingToSeekVoluntaryAdmissionUponArrival === true;

  if (!group1Selected) {
    result.errors.push({
      code: "DANGEROUSNESS_GROUP_1_EMPTY",
      message: "At least one of Dangerous to self / Dangerous to others / Gravely disabled must be selected.",
      citation: "Form instruction: \"check where appropriate in both 1 & 2\"",
    });
  }
  if (!group2Selected) {
    result.errors.push({
      code: "DANGEROUSNESS_GROUP_2_EMPTY",
      message: "At least one selection from group 2 (Unwilling / Unable to seek voluntary admission / Willing upon arrival) must be selected.",
      citation: "Form instruction: \"check where appropriate in both 1 & 2\"",
    });
  }
  return result;
}

/**
 * La. R.S. 28:53(B)(1)/(4) (Act 148 of 2025, verified against the enrolled bill
 * text this session): telehealth examination is available only to a psychiatrist,
 * psychologist, medical psychologist, or PMHNP — NOT a physician assistant or
 * other nurse practitioner. Medical clearance and an in-room licensed professional
 * are also required.
 */
export function validateTelehealthEligibility(
  examinerRole: (typeof TELEHEALTH_ELIGIBLE_ROLES)[number] | string,
  telehealth: TelehealthDetails | undefined,
): FormValidationResult {
  const result = emptyResult();
  if (!telehealth) return result;

  if (!(TELEHEALTH_ELIGIBLE_ROLES as readonly string[]).includes(examinerRole)) {
    result.errors.push({
      code: "TELEHEALTH_ROLE_INELIGIBLE",
      message: `Role "${examinerRole}" is not eligible to conduct a telehealth examination under current law.`,
      citation: "La. R.S. 28:53(B)(1), as amended by Act 148 of 2025 (enrolled HB 137)",
    });
  }
  if (!telehealth.medicallyClearedPriorToAdmission) {
    result.errors.push({
      code: "TELEHEALTH_MEDICAL_CLEARANCE_MISSING",
      message: "A patient examined by telehealth must be medically cleared prior to admission to a mental health treatment facility.",
      citation: "La. R.S. 28:53(B)(4), as amended by Act 148 of 2025",
    });
  }
  if (!telehealth.inRoomProfessional.licenseType) {
    result.errors.push({
      code: "TELEHEALTH_IN_ROOM_PROFESSIONAL_MISSING",
      message: "A licensed healthcare professional must be documented as physically in the room with the patient during the telehealth exam.",
      citation: "La. R.S. 28:53(B)(4)",
    });
  }
  return result;
}

/** Required whenever the signer's role is "OTHER_NURSE_PRACTITIONER" (La. R.S. 28:53(B)(1)). */
export function validateNpVerbalApproval(
  examinerRole: string,
  npVerbalApproval: { collaboratingPhysicianName: string; attested: boolean } | undefined,
): FormValidationResult {
  const result = emptyResult();
  if (examinerRole !== "OTHER_NURSE_PRACTITIONER") return result;
  if (!npVerbalApproval?.attested || !npVerbalApproval.collaboratingPhysicianName) {
    result.errors.push({
      code: "NP_VERBAL_APPROVAL_MISSING",
      message: "A non-PMHNP nurse practitioner must attest to verbal approval from a collaborating physician before executing this certificate.",
      citation: "La. R.S. 28:53(B)(1)",
    });
  }
  return result;
}

/** OBH-2 requires "Complete either A or B" — exactly one, never both, never neither. */
export function validateCecConclusion(cec: Obh2CoronerEmergencyCertificate): FormValidationResult {
  const result = emptyResult();
  if (cec.conclusion.type === "A") {
    const criteriaCheck = validateDangerousnessCriteria(cec.conclusion.dangerousnessCriteria);
    result.errors.push(...criteriaCheck.errors);
  }
  return result;
}

/**
 * La. R.S. 28:53(G)(3): when the coroner executed the first (PEC) certificate,
 * the second examination — and the CEC — must be executed by a different
 * physician. Compares signer identity by license number (more reliable than
 * name matching).
 */
export function validateIndependentExaminer(
  pec: Obh1PhysicianEmergencyCertificate | Obh1aPsychologistEmergencyCertificate,
  cec: Obh2CoronerEmergencyCertificate,
): FormValidationResult {
  const result = emptyResult();
  if (pec.examiner.licenseNumber === cec.examiner.licenseNumber) {
    result.errors.push({
      code: "CEC_INDEPENDENCE_VIOLATION",
      message: "The CEC examiner must not be the same person who executed the initial PEC/PEC-A.",
      citation: "La. R.S. 28:53(G)(3)",
    });
  }
  return result;
}
