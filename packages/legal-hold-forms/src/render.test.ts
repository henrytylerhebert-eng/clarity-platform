import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { renderLouisianaForm } from "./render.js";
import type { LouisianaFormData } from "./formTypes.js";

const baseFindings = {
  historyOfPresentIllness: "Patient made threats of self-harm.",
  physicalFindings: "No acute findings.",
  mentalCondition: "Oriented x3, anxious affect.",
  isCurrently: { suicidal: true, homicidal: false, violent: false },
};

const basePatient = {
  name: "Jane Doe",
  address: "123 Main St, Baton Rouge, LA",
  nearestRelative: { name: "John Doe", relationship: "Spouse" },
};

const samples: Record<LouisianaFormData["kind"], LouisianaFormData> = {
  OBH_19_RPC: {
    kind: "OBH_19_RPC",
    personNeedingTreatment: { name: "Jane Doe", address: "123 Main St", age: 34 },
    nearestRelative: { name: "John Doe" },
    statementOfFacts: "Made threats of self-harm in front of family.",
    unwillingToBeTreatedVoluntarily: true,
    requestor: { name: "Officer Smith", isPeaceOfficer: true, signedAt: "2026-01-01T00:00:00.000Z" },
  },
  OBH_20_OPC: {
    kind: "OBH_20_OPC",
    personInCustody: { name: "Jane Doe", address: "123 Main St", age: 34 },
    nearestRelative: { name: "John Doe" },
    descriptionOfActsOrThreats: "Made threats of self-harm.",
    transportDestination: "Regional Medical Center",
    issuedAt: "2026-01-01T00:00:00.000Z",
    parishOrMunicipality: "East Baton Rouge",
    issuer: { name: "Judge Roe", role: "DISTRICT_JUDGE" },
  },
  OBH_1_PEC: {
    kind: "OBH_1_PEC",
    examiner: { name: "Dr. Smith", role: "PHYSICIAN", licenseNumber: "MD-1111", licenseBoard: "LSBME", address: "1 Hospital Way" },
    examinedAt: "2026-01-01T10:00:00.000Z",
    patientData: basePatient,
    certificateType: "MENTAL_ILLNESS_OR_SUBSTANCE_ABUSE_15_DAY",
    certificateSequence: "1ST",
    findings: baseFindings,
    dangerousnessCriteria: {
      group1: { dangerousToSelf: true, dangerousToOthers: false, gravelyDisabled: false },
      group2: { unwilling: true, unableToSeekVoluntaryAdmission: false, willingToSeekVoluntaryAdmissionUponArrival: false },
    },
    signedAt: "2026-01-01T11:00:00.000Z",
    transportFacilities: ["Regional Medical Center"],
  },
  OBH_1A_PEC_PSYCH: {
    kind: "OBH_1A_PEC_PSYCH",
    examiner: { name: "Dr. Psych", role: "PSYCHOLOGIST", licenseNumber: "PSY-2222", licenseBoard: "LSBEP", address: "1 Clinic Way" },
    examinedAt: "2026-01-01T10:00:00.000Z",
    patientData: basePatient,
    certificateType: "MENTAL_ILLNESS_OR_SUBSTANCE_ABUSE_15_DAY",
    certificateSequence: "1ST",
    findings: baseFindings,
    dangerousnessCriteria: {
      group1: { dangerousToSelf: true, dangerousToOthers: false, gravelyDisabled: false },
      group2: { unwilling: true, unableToSeekVoluntaryAdmission: false },
    },
    signedAt: "2026-01-01T11:00:00.000Z",
    transportFacilities: ["Regional Medical Center"],
  },
  OBH_2_CEC: {
    kind: "OBH_2_CEC",
    examiner: { name: "Coroner X", role: "CORONER", licenseNumber: "COR-1", address: "1 Coroner Way" },
    admittedAt: "2026-01-01T00:00:00.000Z",
    examinedAt: "2026-01-02T00:00:00.000Z",
    patientData: basePatient,
    findings: baseFindings,
    conclusion: {
      type: "A",
      dangerousnessCriteria: {
        group1: { dangerousToSelf: true, dangerousToOthers: false, gravelyDisabled: false },
        group2: { unwilling: true, unableToSeekVoluntaryAdmission: false },
      },
      signedAt: "2026-01-02T01:00:00.000Z",
    },
  },
};

describe("renderLouisianaForm", () => {
  for (const [kind, data] of Object.entries(samples)) {
    it(`renders a well-formed, re-loadable PDF stamped with a formInstanceId for ${kind}`, async () => {
      const rendered = await renderLouisianaForm(data);
      expect(rendered.bytes.byteLength).toBeGreaterThan(0);
      expect(rendered.formInstanceId).toBeTruthy();

      const reloaded = await PDFDocument.load(rendered.bytes);
      const form = reloaded.getForm();
      expect(form.getFields().length).toBeGreaterThan(0);
      expect(form.getTextField("formInstanceId").getText()).toBe(rendered.formInstanceId);
    });
  }

  it("uses the caller-supplied formInstanceId when one is provided, instead of generating a new one", async () => {
    const rendered = await renderLouisianaForm(samples.OBH_1_PEC, "fixed-test-id-123");
    expect(rendered.formInstanceId).toBe("fixed-test-id-123");
    const reloaded = await PDFDocument.load(rendered.bytes);
    expect(reloaded.getForm().getTextField("formInstanceId").getText()).toBe("fixed-test-id-123");
  });
});
