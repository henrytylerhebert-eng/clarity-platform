import { describe, expect, it } from "vitest";
import {
  executeCec,
  executePec,
  isPecExamWithinWindow,
  issueOpc,
  readArrivalExamWindows,
  validateCecIndependence,
  validatePecInput,
  type PecInput,
} from "./epec";
import { LOUISIANA_EPEC_RULE_SET } from "./epecRuleSets";
import { sealLedgerEvents, verifyLedgerChain } from "./custodyLedger";
import type { CustodyLedgerEvent, PecRecord } from "./types";

const ruleSet = LOUISIANA_EPEC_RULE_SET;
const now = "2026-07-08T15:00:00.000Z";

function pecInput(overrides: Partial<PecInput> = {}): PecInput {
  return {
    examinerName: "Dr. Thibodeaux",
    examinerType: "Physician (MD/DO)",
    examinedAt: now,
    findings: ["Dangerous to self"],
    conditions: ["Unwilling to seek voluntary admission"],
    telemedicine: false,
    narrative: "Acute suicidal ideation with plan; refuses safety planning.",
    ...overrides,
  };
}

describe("validatePecInput — dangerousness criteria require a selection in BOTH groups", () => {
  it("accepts one selection from each group", () => {
    expect(validatePecInput(pecInput(), ruleSet)).toHaveLength(0);
  });

  it("rejects findings-only (group 2 empty)", () => {
    const codes = validatePecInput(pecInput({ conditions: [] }), ruleSet).map((issue) => issue.code);
    expect(codes).toContain("DANGEROUSNESS_GROUP_2_EMPTY");
  });

  it("rejects conditions-only (group 1 empty)", () => {
    const codes = validatePecInput(pecInput({ findings: [] }), ruleSet).map((issue) => issue.code);
    expect(codes).toContain("DANGEROUSNESS_GROUP_1_EMPTY");
  });
});

describe("validatePecInput — telehealth eligibility (Act 148 of 2025)", () => {
  it("rejects a physician assistant examining by telehealth", () => {
    const codes = validatePecInput(
      pecInput({ examinerType: "Physician Assistant", telemedicine: true }),
      ruleSet,
    ).map((issue) => issue.code);
    expect(codes).toContain("TELEHEALTH_ROLE_INELIGIBLE");
  });

  it("rejects a non-psychiatric nurse practitioner examining by telehealth", () => {
    const codes = validatePecInput(
      pecInput({ examinerType: "Nurse Practitioner", telemedicine: true, collaboratingPhysicianName: "Dr. Jones" }),
      ruleSet,
    ).map((issue) => issue.code);
    expect(codes).toContain("TELEHEALTH_ROLE_INELIGIBLE");
  });

  it("permits a PMHNP examining by telehealth", () => {
    const codes = validatePecInput(
      pecInput({ examinerType: "Psychiatric Mental Health NP", telemedicine: true }),
      ruleSet,
    ).map((issue) => issue.code);
    expect(codes).not.toContain("TELEHEALTH_ROLE_INELIGIBLE");
  });

  it("does not gate an in-person examination by an otherwise-ineligible role", () => {
    const codes = validatePecInput(
      pecInput({ examinerType: "Physician Assistant", telemedicine: false }),
      ruleSet,
    ).map((issue) => issue.code);
    expect(codes).not.toContain("TELEHEALTH_ROLE_INELIGIBLE");
  });
});

describe("validatePecInput — collaborating-physician verbal approval", () => {
  it("requires an attestation from a non-psychiatric nurse practitioner", () => {
    const codes = validatePecInput(pecInput({ examinerType: "Nurse Practitioner" }), ruleSet).map((i) => i.code);
    expect(codes).toContain("NP_VERBAL_APPROVAL_MISSING");
  });

  it("is satisfied once the collaborating physician is named", () => {
    const codes = validatePecInput(
      pecInput({ examinerType: "Nurse Practitioner", collaboratingPhysicianName: "Dr. Jones" }),
      ruleSet,
    ).map((issue) => issue.code);
    expect(codes).not.toContain("NP_VERBAL_APPROVAL_MISSING");
  });

  it("does not require it from a PMHNP", () => {
    const codes = validatePecInput(pecInput({ examinerType: "Psychiatric Mental Health NP" }), ruleSet).map((i) => i.code);
    expect(codes).not.toContain("NP_VERBAL_APPROVAL_MISSING");
  });
});

describe("validateCecIndependence", () => {
  const pec = { examinerName: "Dr. Smith", examinerLicenseNumber: "MD-1111" } as PecRecord;

  it("flags the same examiner signing both certificates, matched by license", () => {
    const codes = validateCecIndependence(pec, {
      examinerName: "Someone Else",
      examinerLicenseNumber: "MD-1111",
      findings: [],
      conditions: [],
      outcome: "Continued",
    }).map((issue) => issue.code);
    expect(codes).toContain("CEC_INDEPENDENCE_VIOLATION");
  });

  it("flags the same examiner matched by name when no license is recorded", () => {
    const codes = validateCecIndependence({ examinerName: "Dr. Smith" } as PecRecord, {
      examinerName: "  dr. smith ",
      findings: [],
      conditions: [],
      outcome: "Continued",
    }).map((issue) => issue.code);
    expect(codes).toContain("CEC_INDEPENDENCE_VIOLATION");
  });

  it("permits a genuinely independent examiner", () => {
    expect(
      validateCecIndependence(pec, {
        examinerName: "Dr. Boudreaux",
        examinerLicenseNumber: "MD-2222",
        findings: [],
        conditions: [],
        outcome: "Continued",
      }),
    ).toHaveLength(0);
  });
});

describe("readArrivalExamWindows", () => {
  it("returns the 8-hour form figure and the 12-hour statutory figure without collapsing them", () => {
    const windows = readArrivalExamWindows("2026-07-08T14:00:00.000Z", now, ruleSet);
    expect(windows.map((window) => window.targetMinutes)).toEqual([480, 720]);
    expect(windows.every((window) => window.elapsedMinutes === 60)).toBe(true);
    expect(windows.every((window) => !window.breached)).toBe(true);
  });

  it("breaches the printed 8-hour figure before the statutory 12-hour one", () => {
    const windows = readArrivalExamWindows("2026-07-08T05:30:00.000Z", now, ruleSet);
    expect(windows[0].breached).toBe(true);
    expect(windows[1].breached).toBe(false);
  });
});

describe("isPecExamWithinWindow", () => {
  it("accepts an exam just under the window", () => {
    expect(isPecExamWithinWindow("2026-07-05T15:01:00.000Z", now, ruleSet.windowsMinutes.pec)).toBe(true);
  });

  it("rejects an exam older than the window", () => {
    expect(isPecExamWithinWindow("2026-07-05T14:00:00.000Z", now, ruleSet.windowsMinutes.pec)).toBe(false);
  });

  it("rejects an exam recorded in the future", () => {
    expect(isPecExamWithinWindow("2026-07-08T16:00:00.000Z", now, ruleSet.windowsMinutes.pec)).toBe(false);
  });
});

describe("issueOpc", () => {
  it("creates a new instrument with an OPC record and expiry from the rule set window", () => {
    const result = issueOpc(undefined, "case-test", {
      requestor: "Sgt. Broussard",
      relation: "Responding officer",
      observed: "Subject stated intent to harm self; refused voluntary transport.",
      grounds: ["Dangerous to self"],
    }, ruleSet, now);

    expect(result.instrument.legalStatus).toBe("OPC");
    expect(result.instrument.opc?.expiresAt).toBe("2026-07-11T15:00:00.000Z");
    expect(result.instrument.requiredFactsComplete).toBe(true);
    expect(result.ledgerEventType).toBe("OPC_ISSUED");
  });
});

describe("executePec", () => {
  it("seals a PEC record with a fingerprint chained to the ledger tail", async () => {
    const result = await executePec(undefined, "case-test", {
      examinerName: "Dr. Thibodeaux",
      examinerType: "Physician (MD/DO)",
      examinedAt: "2026-07-08T13:00:00.000Z",
      findings: ["Dangerous to self"],
      conditions: ["Unwilling to seek voluntary admission"],
      telemedicine: false,
      narrative: "Acute suicidal ideation with plan; refuses safety planning; requires inpatient stabilization.",
    }, ruleSet, "previous-hash-abc", now);

    expect(result.instrument.legalStatus).toBe("PEC");
    expect(result.instrument.pec?.sealHash).toBe(result.sealHash);
    expect(result.sealHash).toHaveLength(64);
    expect(result.ledgerEventType).toBe("PEC_EXECUTED");
  });

  it("produces a different fingerprint when chained to a different ledger tail", async () => {
    const input = {
      examinerName: "Dr. Thibodeaux",
      examinerType: "Physician (MD/DO)",
      examinedAt: "2026-07-08T13:00:00.000Z",
      findings: ["Dangerous to self"],
      conditions: ["Unwilling to seek voluntary admission"],
      telemedicine: false,
      narrative: "Acute suicidal ideation with plan.",
    };
    const a = await executePec(undefined, "case-test", input, ruleSet, "hash-a", now);
    const b = await executePec(undefined, "case-test", input, ruleSet, "hash-b", now);
    expect(a.sealHash).not.toBe(b.sealHash);
  });
});

describe("executeCec", () => {
  const sealedInstrument = {
    id: "legal-case-test",
    caseId: "case-test",
    legalStatus: "PEC" as const,
    requiredFactsComplete: true,
    clockStatus: "Active" as const,
    draftText: "Draft PEC scaffold.",
    reviewStatus: "Counsel validation required" as const,
    ruleSetId: ruleSet.id,
  };

  it("authorizes continued confinement", () => {
    const result = executeCec(sealedInstrument, ruleSet, {
      examinerName: "Dr. Melancon (Deputy Coroner)",
      findings: ["Dangerous to self"],
      conditions: ["Unwilling to seek voluntary admission"],
      outcome: "Continued",
    }, now);

    expect(result.instrument.legalStatus).toBe("CEC");
    expect(result.instrument.cec?.outcome).toBe("Continued");
    expect(result.ledgerEventType).toBe("CEC_EXECUTED");
  });

  it("routes a discharge-forthwith outcome to a distinct ledger event", () => {
    const result = executeCec(sealedInstrument, ruleSet, {
      examinerName: "Dr. Melancon (Deputy Coroner)",
      findings: [],
      conditions: [],
      outcome: "Discharged",
      dischargeReason: "Criteria no longer met on independent exam.",
    }, now);

    expect(result.instrument.cec?.outcome).toBe("Discharged");
    expect(result.ledgerEventType).toBe("CEC_DISCHARGE");
  });
});

describe("e-PEC ledger events chain and verify", () => {
  it("seals a full OPC -> PEC -> CEC event sequence and verifies clean", async () => {
    const raw: Array<Omit<CustodyLedgerEvent, "eventHash" | "previousHash">> = [
      { id: "e1", caseId: "case-test", eventType: "OPC_ISSUED", actor: "Parish Coroner", occurredAt: "2026-07-08T13:00:00.000Z", payload: { grounds: ["Dangerous to self"] } },
      { id: "e2", caseId: "case-test", eventType: "PEC_EXECUTED", actor: "Dr. Thibodeaux", occurredAt: "2026-07-08T13:20:00.000Z", payload: { findings: ["Dangerous to self"] } },
      { id: "e3", caseId: "case-test", eventType: "CEC_EXECUTED", actor: "Dr. Melancon", occurredAt: "2026-07-08T16:00:00.000Z", payload: { outcome: "Continued" } },
    ];
    const sealed = await sealLedgerEvents(raw);
    await expect(verifyLedgerChain(sealed)).resolves.toEqual({ valid: true });
  });
});
