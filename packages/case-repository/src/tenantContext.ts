import type { Prisma, PrismaClient } from "@prisma/client";

const TENANT_CONTEXT_SETTING = "app.current_organization_id";

export type TenantContextClient = Prisma.TransactionClient;

function assertOrganizationId(organizationId: string): void {
  if (!organizationId.trim()) {
    throw new Error("An organization id is required for a tenant-scoped transaction");
  }
}

/**
 * Set tenant context for this transaction only. The database policy reads the
 * same setting; transaction-local scope prevents pooled connections from
 * retaining a prior tenant after commit or rollback.
 */
export async function setTenantContext(tx: Prisma.TransactionClient, organizationId: string): Promise<void> {
  assertOrganizationId(organizationId);
  await tx.$executeRaw`SELECT set_config(${TENANT_CONTEXT_SETTING}, ${organizationId}, true)`;
}

// Prisma's interactive-transaction default (5000ms) is tight for gateways that
// read/write a large JSONB state blob (e.g. the operating workbook's ~28k
// records) under CI's shared-runner contention; P2028 confirmed one exceeding
// it by ~100ms. 15s keeps a bounded, fail-closed timeout with real headroom.
const TENANT_TRANSACTION_TIMEOUT_MS = 15_000;

/** Run a repository transaction with a fail-closed, transaction-local tenant context. */
export async function withTenantContext<T>(
  prisma: PrismaClient,
  organizationId: string,
  work: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  assertOrganizationId(organizationId);
  return prisma.$transaction(async (tx) => {
    await setTenantContext(tx, organizationId);
    return work(tx);
  }, { timeout: TENANT_TRANSACTION_TIMEOUT_MS });
}
