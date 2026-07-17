import { describe, expect, it } from "vitest";
import { executeCec, executePec, isPecExamWithinWindow, issueOpc } from "./epec";
import { LOUISIANA_EPEC_RULE_SET } from "./epecRuleSets";
import { sealLedgerEvents, verifyLedgerChain } from "./custodyLedger";
import type { CustodyLedgerEvent } from "./types";

const ruleSet = LOUISIANA_EPEC_RULE_SET;
const now = "2026-07-08T15:00:00.000Z";

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
