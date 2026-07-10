import { describe, expect, it } from "vitest";
import { AppendOnlyAuditLog } from "@clarity/domain-contracts";

const base = {
  action: "INSURANCE_DATA_EXTRACTED",
  actorType: "AGENT" as const,
  actorId: "agent-insurance-extraction",
  organizationId: "org-1",
  occurredAt: "2026-07-10T12:00:00Z",
};

describe("no sensitive insurance identifiers in audit logs", () => {
  it.each(["memberId", "medicareNumber", "policyNumber", "ssn"])(
    "rejects a payload containing %s at the top level",
    (field) => {
      const log = new AppendOnlyAuditLog();
      expect(() => log.append({ ...base, payload: { [field]: "SYN-VALUE" } })).toThrow(
        /Restricted identifier/,
      );
      expect(log.length).toBe(0);
    },
  );

  it("rejects restricted identifiers nested at depth", () => {
    const log = new AppendOnlyAuditLog();
    expect(() =>
      log.append({ ...base, payload: { coverage: { subscriber: { memberId: "SYN-123" } } } }),
    ).toThrow(/Restricted identifier/);
  });

  it("accepts payloads that reference coverage without raw identifiers", () => {
    const log = new AppendOnlyAuditLog();
    const e = log.append({
      ...base,
      payload: { coverageOrder: "PRIMARY", payerNameRaw: "Synthetic Commercial Health", fieldsExtracted: 6 },
    });
    expect(e.sequence).toBe(1);
  });
});
