import { describe, expect, it } from "vitest";
import {
  createPayerMemoryEntry,
  presentPayerMemory,
  assertNotUsedAsVerification,
  PAYER_MEMORY_LABEL,
} from "@clarity/domain-contracts";

describe("payer memory labeled historical and unconfirmed", () => {
  const entry = createPayerMemoryEntry({
    payerName: "Synthetic Commercial Health",
    kind: "PORTAL_INSTRUCTIONS",
    note: "Portal requires the rendering NPI on the eligibility screen.",
    observedAt: "2026-06-01",
  });

  it("stamps provenance HISTORICAL_UNCONFIRMED and freezes the entry", () => {
    expect(entry.provenance).toBe("HISTORICAL_UNCONFIRMED");
    expect(Object.isFrozen(entry)).toBe(true);
  });

  it("always presents with the unconfirmed-for-current-patient label", () => {
    const presented = presentPayerMemory(entry);
    expect(presented.label).toBe(PAYER_MEMORY_LABEL);
    expect(presented.label).toMatch(/unconfirmed for the current patient/);
  });

  it("cannot be consumed as current-patient verification evidence", () => {
    expect(() => assertNotUsedAsVerification(entry)).toThrow(/cannot be used as current-patient verification/);
  });
});
