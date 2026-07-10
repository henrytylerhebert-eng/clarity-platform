import { describe, expect, it } from "vitest";
import { sealLedgerEvents, verifyLedgerChain } from "./custodyLedger";

describe("hash ledger", () => {
  it("verifies untouched custody chain", async () => {
    const events = await sealLedgerEvents([
      { id: "one", caseId: "case", eventType: "CASE_CREATED", actor: "Tester", occurredAt: "2026-07-08T00:00:00.000Z", payload: { status: "created" } },
      { id: "two", caseId: "case", eventType: "PACKET_HASH_SEALED", actor: "Tester", occurredAt: "2026-07-08T00:01:00.000Z", payload: { status: "sealed" } },
    ]);
    await expect(verifyLedgerChain(events)).resolves.toEqual({ valid: true });
  });

  it("fails when payload is tampered", async () => {
    const events = await sealLedgerEvents([
      { id: "one", caseId: "case", eventType: "CASE_CREATED", actor: "Tester", occurredAt: "2026-07-08T00:00:00.000Z", payload: { status: "created" } },
    ]);
    const tampered = [{ ...events[0], payload: { status: "changed" } }];
    const result = await verifyLedgerChain(tampered);
    expect(result.valid).toBe(false);
    expect(result.brokenEventId).toBe("one");
  });
});
