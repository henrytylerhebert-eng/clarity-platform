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
  await prisma.assuranceReviewDecision.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.assuranceEvaluation.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.assuranceSourceConflict.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.assuranceEvidenceSubmission.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.assuranceEvidenceExpectation.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.assuranceDocumentReference.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.assuranceSourceReference.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.assuranceApplicabilityDecision.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.assuranceParticipantAssignment.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.assuranceCase.deleteMany({ where: { organizationId: { in: organizationIds } } });

  await prisma.iopReconciliationCloseReceipt.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.iopReconciliationExceptionReview.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.iopReconciliationImport.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.iopSourceIntegration.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.revOpsChange.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.revOpsWorkspace.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.outboxRecord.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.governedEvent.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.documentationGapStatusHistory.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.documentationGap.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.authorizationDayDecision.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.authorizationReview.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.episodeAuthorization.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.caseEpisodeLink.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.episode.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.facilityTimezoneConfiguration.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.facilityProfile.deleteMany({ where: { organizationId: { in: organizationIds } } });

  // PrescreenSubmission is owned by TWO tenants: the sending organizationId and the
  // receivingOrganizationId. Deleting by organizationId alone leaves a submission behind
  // when the tenant being cleaned is only its receiver.
  await prisma.prescreenSubmission.deleteMany({
    where: {
      OR: [
        { organizationId: { in: organizationIds } },
        { receivingOrganizationId: { in: organizationIds } },
      ],
    },
  });
  await prisma.prescreenPacketRequirement.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.prescreenAssessmentVersion.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.prescreenEncounter.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.commandIdempotencyRecord.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.auditEvent.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.evidenceItem.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.contradictionGroup.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.authorization.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.insuranceCoverage.deleteMany({ where: { organizationId: { in: organizationIds } } });
  // PayerProfile's Organization relation has no onDelete, so Prisma defaults to Restrict:
  // leaving one behind makes the organization delete below throw and leaks the whole tenant.
  // PlanProfile cascades from PayerProfile, so it needs no explicit delete.
  await prisma.payerProfile.deleteMany({ where: { organizationId: { in: organizationIds } } });
  // RevOpsRateRelease is tenant-owned through recordedByOrganizationId, not organizationId,
  // and has no foreign key to Organization — it never blocks the delete, it just leaks.
  await prisma.revOpsRateRelease.deleteMany({ where: { recordedByOrganizationId: { in: organizationIds } } });
  await prisma.authSession.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.behavioralHealthCase.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.patientToken.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.user.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prisma.organization.deleteMany({ where: { id: { in: organizationIds } } });
}

/**
 * Integration tests write tenant data. They must never do that to a persistent
 * developer database: that is how issue #24's residue accumulated, and how issue
 * #31's migration ledger became contended across parallel worktrees.
 *
 * Both the ephemeral runner (scripts/with-ephemeral-database.ts) and CI, whose
 * PostgreSQL service is created and destroyed per run, set this marker.
 */
function assertDisposableDatabase(): void {
  if (process.env.CLARITY_DISPOSABLE_DATABASE === "1") return;
  throw new Error(
    "Refusing to run database tests against a database that is not marked disposable.\n" +
      "Run integration tests through the ephemeral runner instead:\n" +
      "    npm run test:integration      (integration suite on a throwaway database)\n" +
      "    npm run verify                (unit + integration, the full local gate)\n" +
      "If you are certain this database is disposable, set CLARITY_DISPOSABLE_DATABASE=1.",
  );
}

export async function createHarness(): Promise<Harness> {
  assertLocalClarityDevDatabase();
  assertDisposableDatabase();
  const prisma = createPrismaClient();
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
