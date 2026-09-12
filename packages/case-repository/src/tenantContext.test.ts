import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { withTenantContext } from "./tenantContext.js";

type TransactionOptions = { maxWait?: number; timeout?: number };

/**
 * Confirms the fix for a real CI failure: a Prisma interactive transaction
 * writing a large JSONB state blob (the operating workbook, ~28k records)
 * exceeded Prisma's default 5000ms interactive-transaction timeout under
 * CI's shared-runner contention (P2028 "Transaction already closed... The
 * timeout for this transaction was 5000 ms, however 5101 ms passed").
 * withTenantContext must request a timeout with real headroom above that
 * default for every gateway that shares it, not just the operating workbook.
 */
describe("withTenantContext", () => {
  it("requests an interactive-transaction timeout well above Prisma's 5000ms default", async () => {
    let capturedOptions: TransactionOptions | undefined;
    const fakePrisma = {
      $transaction: vi.fn((work: (tx: unknown) => Promise<unknown>, options?: TransactionOptions) => {
        capturedOptions = options;
        return work({ $executeRaw: vi.fn().mockResolvedValue(undefined) });
      }),
    } as unknown as PrismaClient;

    const result = await withTenantContext(fakePrisma, "org-1", async () => "done");

    expect(result).toBe("done");
    expect(capturedOptions?.timeout).toBeGreaterThanOrEqual(15_000);
  });

  it("still rejects a missing organization id before touching Prisma", async () => {
    const fakePrisma = { $transaction: vi.fn() } as unknown as PrismaClient;
    await expect(withTenantContext(fakePrisma, "", async () => "unreached")).rejects.toThrow(
      "An organization id is required for a tenant-scoped transaction",
    );
    expect(fakePrisma.$transaction).not.toHaveBeenCalled();
  });
});
