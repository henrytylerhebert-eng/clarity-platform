import { describe, expect, it } from "vitest";
import { AppendOnlyAuditLog } from "@clarity/domain-contracts";

describe("append-only audit events", () => {
  it("appends sequenced, frozen events", () => {
    const log = new AppendOnlyAuditLog();
    const e1 = log.append({
      action: "CASE_CREATED",
      actorType: "USER",
      actorId: "user-1",
      organizationId: "org-1",
      caseKey: "synthetic-test-case",
      occurredAt: "2026-07-10T12:00:00Z",
    });
    const e2 = log.append({
      action: "DOCUMENT_UPLOADED",
      actorType: "USER",
      actorId: "user-1",
      organizationId: "org-1",
      occurredAt: "2026-07-10T12:01:00Z",
    });
    expect(e1.sequence).toBe(1);
    expect(e2.sequence).toBe(2);
    expect(Object.isFrozen(e1)).toBe(true);
  });

  it("exposes only snapshots — mutating the listing does not alter the log", () => {
    const log = new AppendOnlyAuditLog();
    log.append({
      action: "CASE_CREATED",
      actorType: "SYSTEM",
      actorId: "sys",
      organizationId: "org-1",
      occurredAt: "2026-07-10T12:00:00Z",
    });
    const listed = log.list() as unknown[];
    listed.pop();
    expect(log.length).toBe(1);
    expect(log.list()).toHaveLength(1);
  });
});
