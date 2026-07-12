import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { assertLocalClarityDevDatabase, createPrismaClient } from "@clarity/case-repository";
import { initialWorkstreamStatuses } from "@clarity/domain-contracts";
import type { PersistedCase } from "@clarity/case-repository";

/**
 * Database test harness.
 *
 * Isolation model: namespaced synthetic records with deterministic cleanup.
 * Every test file creates its own tenants whose ids embed a per-run UUID, so
 * parallel test files and repeated runs never collide, and cleanup deletes
 * ONLY records belonging to those tenant ids.
 */

export interface TenantFixture {
  organizationId: string;
  userId: string;
  patientTokenId: string;
}

export interface Harness {
  prisma: PrismaClient;
  runId: string;
  tenantA: TenantFixture;
  tenantB: TenantFixture;
  caseKey(suffix: string): string;
  makeCaseData(tenant: TenantFixture, suffix: string, overrides?: Partial<PersistedCase>): PersistedCase;
  createTenant(label: string): Promise<TenantFixture>;
  cleanupTenants(organizationIds: string[]): Promise<void>;
  dispose(): Promise<void>;
}

async function createTenantRecords(prisma: PrismaClient, runId: string, label: string): Promise<TenantFixture> {
  const organizationId = `synthetic-org-${label}-${runId}`;
  await prisma.organization.create({
    data: {
      id: organizationId,
      name: `Synthetic Test Org ${label.toUpperCase()} ${runId}`,
      type: "SENDING_FACILITY",
      jurisdictionCodes: ["SYN"],
    },
  });
  const user = await prisma.user.create({
    data: {
      id: `synthetic-user-${label}-${runId}`,
      organizationId,
      email: `syn-${label}-${runId}@example.test`,
      displayName: `Synthetic User ${label.toUpperCase()}`,
    },
  });
  const token = await prisma.patientToken.create({
    data: {
      id: `synthetic-pt-${label}-${runId}`,
      organizationId,
      externalPatientReference: `SYN-${label.toUpperCase()}-${runId.slice(0, 8)}`,
      privacyFlags: ["SYNTHETIC_ONLY"],
    },
  });
  return { organizationId, userId: user.id, patientTokenId: token.id };
}

async function deleteTenantRecords(prisma: PrismaClient, organizationIds: string[]): Promise<void> {
  // FK-safe order; every delete is scoped to the given organization ids only.
  await prisma.commandIdempotencyRecord.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.auditEvent.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.evidenceItem.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.contradictionGroup.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.behavioralHealthCase.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.patientToken.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.user.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.organization.deleteMany({ where: { id: { in: organizationIds } } });
}

export async function createHarness(): Promise<Harness> {
  assertLocalClarityDevDatabase();
  const prisma = createPrismaClient();
  // Migration check: the foundation migration must be applied and not failed.
  const applied = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT count(*)::bigint AS count FROM _prisma_migrations
     WHERE migration_name = '20260710233252_initial_clarity_foundation' AND finished_at IS NOT NULL`,
  );
  if (!applied[0] || applied[0].count < 1n) {
    await prisma.$disconnect();
    throw new Error("clarity_dev is missing the applied initial_clarity_foundation migration");
  }
  const runId = randomUUID();
  const extraTenants: string[] = [];
  const tenantA = await createTenantRecords(prisma, runId, "a");
  const tenantB = await createTenantRecords(prisma, runId, "b");

  return {
    prisma,
    runId,
    tenantA,
    tenantB,
    caseKey: (suffix) => `synthetic-case-${suffix}-${runId}`,
    makeCaseData: (tenant, suffix, overrides = {}) => ({
      caseKey: `synthetic-case-${suffix}-${runId}`,
      organizationId: tenant.organizationId,
      patientTokenId: tenant.patientTokenId,
      status: "DRAFT",
      urgency: "ROUTINE",
      workstreams: initialWorkstreamStatuses(),
      ...overrides,
    }),
    createTenant: async (label) => {
      const t = await createTenantRecords(prisma, runId, label);
      extraTenants.push(t.organizationId);
      return t;
    },
    cleanupTenants: (organizationIds) => deleteTenantRecords(prisma, organizationIds),
    dispose: async () => {
      await deleteTenantRecords(prisma, [
        tenantA.organizationId,
        tenantB.organizationId,
        ...extraTenants,
      ]);
      await prisma.$disconnect();
    },
  };
}

/** Deterministic ticking clock so audit ordering is stable in assertions. */
export function tickingClock(startMs = Date.parse("2026-07-10T12:00:00Z")): () => Date {
  let t = startMs;
  return () => new Date((t += 1000));
}

export const TEST_ACTOR = { actorType: "USER" as const, actorId: "synthetic-test-user" };
