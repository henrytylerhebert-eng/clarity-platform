import { describe, expect, it } from "vitest";
import {
  validateCecConclusion,
  validateDangerousnessCriteria,
  validateIndependentExaminer,
  validateNpVerbalApproval,
  validateTelehealthEligibility,
} from "./validation.js";
import type { Obh1PhysicianEmergencyCertificate, Obh2CoronerEmergencyCertificate } from "./formTypes.js";

const baseFindings = {
  historyOfPresentIllness: "x",
  physicalFindings: "x",
  mentalCondition: "x",
  isCurrently: { suicidal: false, homicidal: false, violent: false },
};

const basePatient = {
  name: "Jane Doe",
  address: "123 Main St",
  nearestRelative: { name: "John Doe", relationship: "Spouse" },
};

function makePec(overrides: Partial<Obh1PhysicianEmergencyCertificate> = {}): Obh1PhysicianEmergencyCertificate {
  return {
    kind: "OBH_1_PEC",
    examiner: {
      name: "Dr. Smith",
      role: "PHYSICIAN",
      licenseNumber: "MD-1111",
      licenseBoard: "LSBME",
      address: "1 Hospital Way",
    },
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
    transportFacilities: ["Facility A"],
    ...overrides,
  };
}

function makeCec(overrides: Partial<Obh2CoronerEmergencyCertificate> = {}): Obh2CoronerEmergencyCertificate {
  return {
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
    ...overrides,
  };
}

describe("validateDangerousnessCriteria", () => {
  it("passes when both group 1 and group 2 each have a selection", () => {
    const result = validateDangerousnessCriteria(makePec().dangerousnessCriteria);
    expect(result.errors).toHaveLength(0);
  });

  it("fails when group 1 has no selection, even if group 2 does (fixes original TRC-006)", () => {
    const result = validateDangerousnessCriteria({
      group1: { dangerousToSelf: false, dangerousToOthers: false, gravelyDisabled: false },
      group2: { unwilling: true, unableToSeekVoluntaryAdmission: false },
    });
    expect(result.errors.map((e) => e.code)).toContain("DANGEROUSNESS_GROUP_1_EMPTY");
  });

  it("fails when group 2 has no selection, even if group 1 does", () => {
    const result = validateDangerousnessCriteria({
      group1: { dangerousToSelf: true, dangerousToOthers: false, gravelyDisabled: false },
      group2: { unwilling: false, unableToSeekVoluntaryAdmission: false },
    });
    expect(result.errors.map((e) => e.code)).toContain("DANGEROUSNESS_GROUP_2_EMPTY");
  });
});

describe("validateTelehealthEligibility", () => {
  it("is a no-op when telehealth was not conducted", () => {
    expect(validateTelehealthEligibility("PHYSICIAN_ASSISTANT", undefined).errors).toHaveLength(0);
  });

  it("rejects a physician assistant conducting a telehealth exam (Act 148 excludes PAs)", () => {
    const result = validateTelehealthEligibility("PHYSICIAN_ASSISTANT", {
      conducted: true,
      medicallyClearedPriorToAdmission: true,
      inRoomProfessional: { name: "Nurse A", licenseType: "RN" },
      startTime: "2026-01-01T00:00:00.000Z",
      endTime: "2026-01-01T00:30:00.000Z",
      patientPhysicalAddress: "A",
      examinerPhysicalAddress: "B",
    });
    expect(result.errors.map((e) => e.code)).toContain("TELEHEALTH_ROLE_INELIGIBLE");
  });

  it("accepts a PMHNP conducting a telehealth exam with clearance and in-room professional", () => {
    const result = validateTelehealthEligibility("PSYCHIATRIC_MENTAL_HEALTH_NURSE_PRACTITIONER", {
      conducted: true,
      medicallyClearedPriorToAdmission: true,
      inRoomProfessional: { name: "Nurse A", licenseType: "RN" },
      startTime: "2026-01-01T00:00:00.000Z",
      endTime: "2026-01-01T00:30:00.000Z",
      patientPhysicalAddress: "A",
      examinerPhysicalAddress: "B",
    });
    expect(result.errors).toHaveLength(0);
  });

  it("requires medical clearance even for an eligible role", () => {
    const result = validateTelehealthEligibility("PSYCHOLOGIST", {
      conducted: true,
      medicallyClearedPriorToAdmission: false,
      inRoomProfessional: { name: "Nurse A", licenseType: "RN" },
      startTime: "2026-01-01T00:00:00.000Z",
      endTime: "2026-01-01T00:30:00.000Z",
      patientPhysicalAddress: "A",
      examinerPhysicalAddress: "B",
    });
    expect(result.errors.map((e) => e.code)).toContain("TELEHEALTH_MEDICAL_CLEARANCE_MISSING");
  });
});

describe("validateNpVerbalApproval", () => {
  it("is a no-op for a PMHNP", () => {
    expect(validateNpVerbalApproval("PSYCHIATRIC_MENTAL_HEALTH_NURSE_PRACTITIONER", undefined).errors).toHaveLength(0);
  });

  it("requires attestation for a general nurse practitioner", () => {
    const result = validateNpVerbalApproval("OTHER_NURSE_PRACTITIONER", undefined);
    expect(result.errors.map((e) => e.code)).toContain("NP_VERBAL_APPROVAL_MISSING");
  });

  it("passes when a general NP has a complete attestation", () => {
    const result = validateNpVerbalApproval("OTHER_NURSE_PRACTITIONER", {
      collaboratingPhysicianName: "Dr. Jones",
      attested: true,
    });
    expect(result.errors).toHaveLength(0);
  });
});

describe("validateCecConclusion", () => {
  it("applies the both-groups dangerousness rule when Conclusion A is selected", () => {
    const cec = makeCec({
      conclusion: {
        type: "A",
        dangerousnessCriteria: {
          group1: { dangerousToSelf: false, dangerousToOthers: false, gravelyDisabled: false },
          group2: { unwilling: true, unableToSeekVoluntaryAdmission: false },
        },
        signedAt: "2026-01-02T01:00:00.000Z",
      },
    });
    expect(validateCecConclusion(cec).errors.length).toBeGreaterThan(0);
  });

  it("has no dangerousness-criteria errors for Conclusion B (not a proper subject for admission)", () => {
    const cec = makeCec({ conclusion: { type: "B", signedAt: "2026-01-02T01:00:00.000Z" } });
    expect(validateCecConclusion(cec).errors).toHaveLength(0);
  });
});

describe("validateIndependentExaminer", () => {
  it("flags when the CEC examiner is the same person who signed the PEC (La. R.S. 28:53(G)(3))", () => {
    const pec = makePec({ examiner: { name: "Dr. Smith", role: "PHYSICIAN", licenseNumber: "SAME-1", licenseBoard: "LSBME", address: "x" } });
    const cec = makeCec({ examiner: { name: "Dr. Smith", role: "CORONER", licenseNumber: "SAME-1", address: "x" } });
    const result = validateIndependentExaminer(pec, cec);
    expect(result.errors.map((e) => e.code)).toContain("CEC_INDEPENDENCE_VIOLATION");
  });

  it("passes when the CEC examiner differs from the PEC signer", () => {
    const pec = makePec();
    const cec = makeCec();
    expect(validateIndependentExaminer(pec, cec).errors).toHaveLength(0);
  });
});
