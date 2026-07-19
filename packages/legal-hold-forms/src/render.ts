import { randomUUID } from "node:crypto";
import { PDFDocument, PDFTextField, PDFCheckBox, type PDFForm, type PDFPage } from "pdf-lib";
import type { LouisianaFormData, LouisianaFormKind } from "./formTypes.js";

/**
 * Renders a Louisiana OBH form to a fillable PDF by loading the unmodified
 * official PDF byte-for-byte (packages/legal-hold-forms/src/assets — see
 * PROVENANCE.md) and adding AcroForm field WIDGETS on top of it. The existing
 * page content is never redrawn or edited — only annotated with interactive
 * fields — which is what keeps the output a facsimile rather than an alteration
 * of the state's form (see docs/legal/LOUISIANA_OPC_PEC_CEC_FORM_VERIFICATION.md).
 *
 * KNOWN FIRST-PASS LIMITATION: field (x, y) placement below is estimated from
 * the visual layout inspected this session, not measured with a PDF-coordinate
 * tool. Coverage here targets the legally load-bearing fields per form (signer
 * identity/license/date, patient identity, dangerousness-criteria checkboxes,
 * certificate-type/sequence checkboxes, telehealth summary, CEC conclusion A/B) —
 * secondary demographic checkboxes (race/sex/marital/military status boxes) are
 * NOT yet placed and are a follow-up refinement, not silently dropped from scope.
 * Render one sample per form and visually compare against the source PDF before
 * treating positions as final.
 */

/** Fractional page coordinates (0–1), converted to points against the actual page size at render time. */
interface FieldPlacement {
  name: string;
  type: "text" | "checkbox" | "multiline";
  page: number; // 0-indexed
  xFrac: number;
  yFracFromTop: number;
  widthFrac: number;
  heightFrac: number;
}

const ASSET_FILENAMES: Record<LouisianaFormKind, string> = {
  OBH_19_RPC: "OBH-19_Rev2017-03.pdf",
  OBH_20_OPC: "OBH-20_Rev2017-03.pdf",
  OBH_1_PEC: "OBH-1_Rev2025-08.pdf",
  OBH_1A_PEC_PSYCH: "OBH-1A_Rev2017-05.pdf",
  OBH_2_CEC: "OBH-2_Rev2017-05.pdf",
};

// Approximate placements, one row per form. Coordinates target the blank space
// immediately to the right of / below each printed label, based on the visual
// layout read from each source PDF this session.
const FIELD_PLACEMENTS: Record<LouisianaFormKind, FieldPlacement[]> = {
  OBH_19_RPC: [
    { name: "formInstanceId", type: "text", page: 0, xFrac: 0.78, yFracFromTop: 0.008, widthFrac: 0.2, heightFrac: 0.018 },
    { name: "personName", type: "text", page: 0, xFrac: 0.32, yFracFromTop: 0.185, widthFrac: 0.5, heightFrac: 0.02 },
    { name: "personAge", type: "text", page: 0, xFrac: 0.86, yFracFromTop: 0.215, widthFrac: 0.1, heightFrac: 0.02 },
    { name: "statementOfFacts", type: "multiline", page: 0, xFrac: 0.03, yFracFromTop: 0.34, widthFrac: 0.94, heightFrac: 0.14 },
    { name: "unwillingToBeTreatedVoluntarily", type: "checkbox", page: 0, xFrac: 0.55, yFracFromTop: 0.565, widthFrac: 0.02, heightFrac: 0.02 },
    { name: "requestorName", type: "text", page: 0, xFrac: 0.03, yFracFromTop: 0.94, widthFrac: 0.4, heightFrac: 0.02 },
    { name: "signedAt", type: "text", page: 0, xFrac: 0.55, yFracFromTop: 0.94, widthFrac: 0.4, heightFrac: 0.02 },
  ],
  OBH_20_OPC: [
    { name: "formInstanceId", type: "text", page: 0, xFrac: 0.78, yFracFromTop: 0.008, widthFrac: 0.2, heightFrac: 0.018 },
    { name: "personInCustodyName", type: "text", page: 0, xFrac: 0.03, yFracFromTop: 0.155, widthFrac: 0.7, heightFrac: 0.02 },
    { name: "descriptionOfActsOrThreats", type: "multiline", page: 0, xFrac: 0.03, yFracFromTop: 0.31, widthFrac: 0.94, heightFrac: 0.14 },
    { name: "transportDestination", type: "text", page: 0, xFrac: 0.55, yFracFromTop: 0.51, widthFrac: 0.42, heightFrac: 0.02 },
    { name: "issuedAt", type: "text", page: 0, xFrac: 0.03, yFracFromTop: 0.575, widthFrac: 0.4, heightFrac: 0.02 },
    { name: "parishOrMunicipality", type: "text", page: 0, xFrac: 0.55, yFracFromTop: 0.575, widthFrac: 0.42, heightFrac: 0.02 },
    { name: "custodyTakenAt", type: "text", page: 0, xFrac: 0.55, yFracFromTop: 0.86, widthFrac: 0.42, heightFrac: 0.02 },
  ],
  OBH_1_PEC: [
    { name: "formInstanceId", type: "text", page: 0, xFrac: 0.8, yFracFromTop: 0.005, widthFrac: 0.18, heightFrac: 0.015 },
    { name: "examinerName", type: "text", page: 0, xFrac: 0.19, yFracFromTop: 0.145, widthFrac: 0.32, heightFrac: 0.015 },
    { name: "examinationDate", type: "text", page: 0, xFrac: 0.53, yFracFromTop: 0.145, widthFrac: 0.15, heightFrac: 0.015 },
    { name: "examinationTime", type: "text", page: 0, xFrac: 0.7, yFracFromTop: 0.145, widthFrac: 0.15, heightFrac: 0.015 },
    { name: "patientName", type: "text", page: 0, xFrac: 0.32, yFracFromTop: 0.205, widthFrac: 0.5, heightFrac: 0.015 },
    { name: "certificateType15Day", type: "checkbox", page: 0, xFrac: 0.03, yFracFromTop: 0.35, widthFrac: 0.02, heightFrac: 0.015 },
    { name: "certificateType28Day", type: "checkbox", page: 0, xFrac: 0.28, yFracFromTop: 0.35, widthFrac: 0.02, heightFrac: 0.015 },
    { name: "certificateSequence1st", type: "checkbox", page: 0, xFrac: 0.44, yFracFromTop: 0.35, widthFrac: 0.02, heightFrac: 0.015 },
    { name: "certificateSequence2nd", type: "checkbox", page: 0, xFrac: 0.48, yFracFromTop: 0.35, widthFrac: 0.02, heightFrac: 0.015 },
    { name: "linkedOpcIssuedAt", type: "text", page: 0, xFrac: 0.78, yFracFromTop: 0.35, widthFrac: 0.2, heightFrac: 0.015 },
    { name: "historyOfPresentIllness", type: "multiline", page: 0, xFrac: 0.03, yFracFromTop: 0.375, widthFrac: 0.94, heightFrac: 0.06 },
    { name: "physicalFindings", type: "multiline", page: 0, xFrac: 0.03, yFracFromTop: 0.44, widthFrac: 0.94, heightFrac: 0.05 },
    { name: "mentalCondition", type: "multiline", page: 0, xFrac: 0.03, yFracFromTop: 0.495, widthFrac: 0.94, heightFrac: 0.05 },
    { name: "dangerousToSelf", type: "checkbox", page: 0, xFrac: 0.05, yFracFromTop: 0.635, widthFrac: 0.018, heightFrac: 0.013 },
    { name: "dangerousToOthers", type: "checkbox", page: 0, xFrac: 0.25, yFracFromTop: 0.635, widthFrac: 0.018, heightFrac: 0.013 },
    { name: "gravelyDisabled", type: "checkbox", page: 0, xFrac: 0.42, yFracFromTop: 0.635, widthFrac: 0.018, heightFrac: 0.013 },
    { name: "unwilling", type: "checkbox", page: 0, xFrac: 0.05, yFracFromTop: 0.652, widthFrac: 0.018, heightFrac: 0.013 },
    { name: "unableToSeekVoluntaryAdmission", type: "checkbox", page: 0, xFrac: 0.25, yFracFromTop: 0.652, widthFrac: 0.018, heightFrac: 0.013 },
    { name: "willingToSeekVoluntaryAdmissionUponArrival", type: "checkbox", page: 0, xFrac: 0.62, yFracFromTop: 0.652, widthFrac: 0.018, heightFrac: 0.013 },
    { name: "examinerLicenseNumber", type: "text", page: 0, xFrac: 0.4, yFracFromTop: 0.672, widthFrac: 0.25, heightFrac: 0.015 },
    { name: "signedAt", type: "text", page: 0, xFrac: 0.68, yFracFromTop: 0.672, widthFrac: 0.28, heightFrac: 0.015 },
  ],
  OBH_1A_PEC_PSYCH: [
    { name: "formInstanceId", type: "text", page: 0, xFrac: 0.8, yFracFromTop: 0.005, widthFrac: 0.18, heightFrac: 0.015 },
    { name: "examinerName", type: "text", page: 0, xFrac: 0.19, yFracFromTop: 0.145, widthFrac: 0.32, heightFrac: 0.015 },
    { name: "examinationDate", type: "text", page: 0, xFrac: 0.53, yFracFromTop: 0.145, widthFrac: 0.15, heightFrac: 0.015 },
    { name: "examinationTime", type: "text", page: 0, xFrac: 0.7, yFracFromTop: 0.145, widthFrac: 0.15, heightFrac: 0.015 },
    { name: "patientName", type: "text", page: 0, xFrac: 0.32, yFracFromTop: 0.21, widthFrac: 0.5, heightFrac: 0.015 },
    { name: "certificateType15Day", type: "checkbox", page: 0, xFrac: 0.03, yFracFromTop: 0.365, widthFrac: 0.02, heightFrac: 0.015 },
    { name: "certificateType28Day", type: "checkbox", page: 0, xFrac: 0.28, yFracFromTop: 0.365, widthFrac: 0.02, heightFrac: 0.015 },
    { name: "certificateSequence1st", type: "checkbox", page: 0, xFrac: 0.44, yFracFromTop: 0.365, widthFrac: 0.02, heightFrac: 0.015 },
    { name: "certificateSequence2nd", type: "checkbox", page: 0, xFrac: 0.48, yFracFromTop: 0.365, widthFrac: 0.02, heightFrac: 0.015 },
    { name: "linkedOpcIssuedAt", type: "text", page: 0, xFrac: 0.78, yFracFromTop: 0.365, widthFrac: 0.2, heightFrac: 0.015 },
    { name: "historyOfPresentIllness", type: "multiline", page: 0, xFrac: 0.03, yFracFromTop: 0.39, widthFrac: 0.94, heightFrac: 0.06 },
    { name: "physicalFindings", type: "multiline", page: 0, xFrac: 0.03, yFracFromTop: 0.455, widthFrac: 0.94, heightFrac: 0.05 },
    { name: "mentalCondition", type: "multiline", page: 0, xFrac: 0.03, yFracFromTop: 0.51, widthFrac: 0.94, heightFrac: 0.05 },
    { name: "dangerousToSelf", type: "checkbox", page: 0, xFrac: 0.05, yFracFromTop: 0.65, widthFrac: 0.018, heightFrac: 0.013 },
    { name: "dangerousToOthers", type: "checkbox", page: 0, xFrac: 0.25, yFracFromTop: 0.65, widthFrac: 0.018, heightFrac: 0.013 },
    { name: "gravelyDisabled", type: "checkbox", page: 0, xFrac: 0.42, yFracFromTop: 0.65, widthFrac: 0.018, heightFrac: 0.013 },
    { name: "unwilling", type: "checkbox", page: 0, xFrac: 0.05, yFracFromTop: 0.667, widthFrac: 0.018, heightFrac: 0.013 },
    { name: "unableToSeekVoluntaryAdmission", type: "checkbox", page: 0, xFrac: 0.25, yFracFromTop: 0.667, widthFrac: 0.018, heightFrac: 0.013 },
    { name: "examinerLicenseNumber", type: "text", page: 0, xFrac: 0.4, yFracFromTop: 0.687, widthFrac: 0.25, heightFrac: 0.015 },
    { name: "signedAt", type: "text", page: 0, xFrac: 0.68, yFracFromTop: 0.687, widthFrac: 0.28, heightFrac: 0.015 },
  ],
  OBH_2_CEC: [
    { name: "formInstanceId", type: "text", page: 0, xFrac: 0.78, yFracFromTop: 0.008, widthFrac: 0.2, heightFrac: 0.018 },
    { name: "examinerName", type: "text", page: 0, xFrac: 0.03, yFracFromTop: 0.135, widthFrac: 0.4, heightFrac: 0.015 },
    { name: "patientName", type: "text", page: 0, xFrac: 0.03, yFracFromTop: 0.165, widthFrac: 0.4, heightFrac: 0.015 },
    { name: "admittedAt", type: "text", page: 0, xFrac: 0.03, yFracFromTop: 0.195, widthFrac: 0.22, heightFrac: 0.015 },
    { name: "examinedAt", type: "text", page: 0, xFrac: 0.5, yFracFromTop: 0.195, widthFrac: 0.22, heightFrac: 0.015 },
    { name: "historyOfPresentIllness", type: "multiline", page: 0, xFrac: 0.03, yFracFromTop: 0.36, widthFrac: 0.94, heightFrac: 0.06 },
    { name: "physicalFindings", type: "multiline", page: 0, xFrac: 0.03, yFracFromTop: 0.425, widthFrac: 0.94, heightFrac: 0.05 },
    { name: "mentalCondition", type: "multiline", page: 0, xFrac: 0.03, yFracFromTop: 0.48, widthFrac: 0.94, heightFrac: 0.05 },
    { name: "conclusionADangerousToSelf", type: "checkbox", page: 0, xFrac: 0.05, yFracFromTop: 0.635, widthFrac: 0.018, heightFrac: 0.013 },
    { name: "conclusionADangerousToOthers", type: "checkbox", page: 0, xFrac: 0.25, yFracFromTop: 0.635, widthFrac: 0.018, heightFrac: 0.013 },
    { name: "conclusionAGravelyDisabled", type: "checkbox", page: 0, xFrac: 0.42, yFracFromTop: 0.635, widthFrac: 0.018, heightFrac: 0.013 },
    { name: "conclusionAUnwilling", type: "checkbox", page: 0, xFrac: 0.05, yFracFromTop: 0.652, widthFrac: 0.018, heightFrac: 0.013 },
    { name: "conclusionAUnableToSeekVoluntaryAdmission", type: "checkbox", page: 0, xFrac: 0.25, yFracFromTop: 0.652, widthFrac: 0.018, heightFrac: 0.013 },
    { name: "conclusionALicenseNumber", type: "text", page: 0, xFrac: 0.4, yFracFromTop: 0.675, widthFrac: 0.25, heightFrac: 0.015 },
    { name: "conclusionASignedAt", type: "text", page: 0, xFrac: 0.68, yFracFromTop: 0.675, widthFrac: 0.28, heightFrac: 0.015 },
    { name: "conclusionBLicenseNumber", type: "text", page: 0, xFrac: 0.4, yFracFromTop: 0.79, widthFrac: 0.25, heightFrac: 0.015 },
    { name: "conclusionBSignedAt", type: "text", page: 0, xFrac: 0.68, yFracFromTop: 0.79, widthFrac: 0.28, heightFrac: 0.015 },
  ],
};

/** Flattens the structured form data into { fieldName: string | boolean } matching FIELD_PLACEMENTS names. */
function flattenFieldValues(data: LouisianaFormData): Record<string, string | boolean | undefined> {
  switch (data.kind) {
    case "OBH_19_RPC":
      return {
        personName: data.personNeedingTreatment.name,
        personAge: String(data.personNeedingTreatment.age),
        statementOfFacts: data.statementOfFacts,
        unwillingToBeTreatedVoluntarily: data.unwillingToBeTreatedVoluntarily,
        requestorName: data.requestor.name,
        signedAt: data.requestor.signedAt,
      };
    case "OBH_20_OPC":
      return {
        personInCustodyName: data.personInCustody.name,
        descriptionOfActsOrThreats: data.descriptionOfActsOrThreats,
        transportDestination: data.transportDestination,
        issuedAt: data.issuedAt,
        parishOrMunicipality: data.parishOrMunicipality,
        custodyTakenAt: data.custody?.takenIntoCustodyAt,
      };
    case "OBH_1_PEC":
      return {
        examinerName: data.examiner.name,
        examinationDate: data.examinedAt,
        examinationTime: data.examinedAt,
        patientName: data.patientData.name,
        certificateType15Day: data.certificateType === "MENTAL_ILLNESS_OR_SUBSTANCE_ABUSE_15_DAY",
        certificateType28Day: data.certificateType === "SUBSTANCE_ABUSE_28_DAY",
        certificateSequence1st: data.certificateSequence === "1ST",
        certificateSequence2nd: data.certificateSequence === "2ND",
        linkedOpcIssuedAt: data.linkedOpcIssuedAt,
        historyOfPresentIllness: data.findings.historyOfPresentIllness,
        physicalFindings: data.findings.physicalFindings,
        mentalCondition: data.findings.mentalCondition,
        dangerousToSelf: data.dangerousnessCriteria.group1.dangerousToSelf,
        dangerousToOthers: data.dangerousnessCriteria.group1.dangerousToOthers,
        gravelyDisabled: data.dangerousnessCriteria.group1.gravelyDisabled,
        unwilling: data.dangerousnessCriteria.group2.unwilling,
        unableToSeekVoluntaryAdmission: data.dangerousnessCriteria.group2.unableToSeekVoluntaryAdmission,
        willingToSeekVoluntaryAdmissionUponArrival: data.dangerousnessCriteria.group2.willingToSeekVoluntaryAdmissionUponArrival,
        examinerLicenseNumber: data.examiner.licenseNumber,
        signedAt: data.signedAt,
      };
    case "OBH_1A_PEC_PSYCH":
      return {
        examinerName: data.examiner.name,
        examinationDate: data.examinedAt,
        examinationTime: data.examinedAt,
        patientName: data.patientData.name,
        certificateType15Day: data.certificateType === "MENTAL_ILLNESS_OR_SUBSTANCE_ABUSE_15_DAY",
        certificateType28Day: data.certificateType === "SUBSTANCE_ABUSE_28_DAY",
        certificateSequence1st: data.certificateSequence === "1ST",
        certificateSequence2nd: data.certificateSequence === "2ND",
        linkedOpcIssuedAt: data.linkedOpcIssuedAt,
        historyOfPresentIllness: data.findings.historyOfPresentIllness,
        physicalFindings: data.findings.physicalFindings,
        mentalCondition: data.findings.mentalCondition,
        dangerousToSelf: data.dangerousnessCriteria.group1.dangerousToSelf,
        dangerousToOthers: data.dangerousnessCriteria.group1.dangerousToOthers,
        gravelyDisabled: data.dangerousnessCriteria.group1.gravelyDisabled,
        unwilling: data.dangerousnessCriteria.group2.unwilling,
        unableToSeekVoluntaryAdmission: data.dangerousnessCriteria.group2.unableToSeekVoluntaryAdmission,
        examinerLicenseNumber: data.examiner.licenseNumber,
        signedAt: data.signedAt,
      };
    case "OBH_2_CEC": {
      const base: Record<string, string | boolean | undefined> = {
        examinerName: data.examiner.name,
        patientName: data.patientData.name,
        admittedAt: data.admittedAt,
        examinedAt: data.examinedAt,
        historyOfPresentIllness: data.findings.historyOfPresentIllness,
        physicalFindings: data.findings.physicalFindings,
        mentalCondition: data.findings.mentalCondition,
      };
      if (data.conclusion.type === "A") {
        base.conclusionADangerousToSelf = data.conclusion.dangerousnessCriteria.group1.dangerousToSelf;
        base.conclusionADangerousToOthers = data.conclusion.dangerousnessCriteria.group1.dangerousToOthers;
        base.conclusionAGravelyDisabled = data.conclusion.dangerousnessCriteria.group1.gravelyDisabled;
        base.conclusionAUnwilling = data.conclusion.dangerousnessCriteria.group2.unwilling;
        base.conclusionAUnableToSeekVoluntaryAdmission = data.conclusion.dangerousnessCriteria.group2.unableToSeekVoluntaryAdmission;
        base.conclusionALicenseNumber = data.examiner.licenseNumber;
        base.conclusionASignedAt = data.conclusion.signedAt;
      } else {
        base.conclusionBLicenseNumber = data.examiner.licenseNumber;
        base.conclusionBSignedAt = data.conclusion.signedAt;
      }
      return base;
    }
  }
}

function addField(
  form: PDFForm,
  placement: FieldPlacement,
  pageWidth: number,
  pageHeight: number,
  page: PDFPage,
  value: string | boolean | undefined,
) {
  const x = placement.xFrac * pageWidth;
  const width = placement.widthFrac * pageWidth;
  const height = placement.heightFrac * pageHeight;
  // pdf-lib's y origin is bottom-left; our placements are authored top-down.
  const y = pageHeight - placement.yFracFromTop * pageHeight - height;

  if (placement.type === "checkbox") {
    const checkbox: PDFCheckBox = form.createCheckBox(placement.name);
    checkbox.addToPage(page, { x, y, width, height });
    if (value === true) checkbox.check();
    return;
  }
  const field: PDFTextField = form.createTextField(placement.name);
  if (placement.type === "multiline") field.enableMultiline();
  field.addToPage(page, { x, y, width, height });
  // pdf-lib's default (auto-size) picks a size scaled to field HEIGHT alone,
  // which overflows badly for the narrow rows on these forms — fix a small size instead.
  field.setFontSize(placement.type === "multiline" ? 8 : 9);
  if (typeof value === "string" && value.length > 0) field.setText(value);
}

export interface RenderedLouisianaForm {
  bytes: Uint8Array;
  /**
   * Printed on the form's face AND intended as the LegalStatusRecord's own id
   * (pass it as CreateLegalStatusRecordParams.id) — this is the "one of one"
   * control number: the physical/PDF instance and its database record share
   * the same identifier, so either can be traced to the other.
   */
  formInstanceId: string;
}

/**
 * Renders `data` onto the matching official OBH PDF as fillable AcroForm fields,
 * stamped with a unique form-instance identifier. No storage/audit side effects —
 * the caller is responsible for persisting the returned bytes (e.g. via the
 * existing DocumentCommandService.uploadDocument as documentType
 * "LEGAL_HOLD_DOCUMENT") and for using the same formInstanceId as the
 * LegalStatusRecord's id.
 */
export async function renderLouisianaForm(
  data: LouisianaFormData,
  formInstanceId: string = randomUUID(),
): Promise<RenderedLouisianaForm> {
  const assetUrl = new URL(`./assets/${ASSET_FILENAMES[data.kind]}`, import.meta.url);
  const assetBytes = await readAsset(assetUrl);
  const pdfDoc = await PDFDocument.load(assetBytes);
  const form = pdfDoc.getForm();
  const page = pdfDoc.getPage(0);
  const { width, height } = page.getSize();
  const values: Record<string, string | boolean | undefined> = { ...flattenFieldValues(data), formInstanceId };

  for (const placement of FIELD_PLACEMENTS[data.kind]) {
    addField(form, placement, width, height, page, values[placement.name]);
  }

  const bytes = await pdfDoc.save();
  return { bytes, formInstanceId };
}

async function readAsset(url: URL): Promise<Uint8Array> {
  const { readFile } = await import("node:fs/promises");
  return readFile(url);
}
