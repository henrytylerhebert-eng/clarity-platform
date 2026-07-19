import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  PrismaEpisodePersistenceGateway,
  setTenantContext,
  type TenantContextClient,
} from "@clarity/case-repository";
import type { AdmissionHandoffCommand } from "@clarity/domain-contracts";
import { createHarness, type Harness } from "./helpers/harness.js";

const RLS_ROLE = "synthetic_od6_runtime";
const PROTECTED_TABLES = [
  "FacilityTimezoneConfiguration",
  "Episode",
  "CaseEpisodeLink",
  "EpisodeAuthorization",
  "AuthorizationReview",
  "AuthorizationDayDecision",
  "DocumentationGap",
  "DocumentationGapStatusHistory",
  "GovernedEvent",
  "OutboxRecord",
] as const;

let h: Harness;
let episodeA: string;
let episodeB: string;

async function createEpisode(
  tenant: Harness["tenantA"],
  facilityId: string,
  sourceReferenceId: string,
  suffix: string,
): Promise<string> {
  await h.prisma.facilityProfile.create({
    data: { id: facilityId, organizationId: tenant.organizationId, name: `Synthetic RLS Facility ${suffix}` },
  });
  const timezoneSourceReferenceId = `${sourceReferenceId}-timezone`;
  const gateway = new PrismaEpisodePersistenceGateway(h.prisma);
  await gateway.recordFacilityTimezoneConfiguration({
    organizationId: tenant.organizationId,
    facilityProfileId: facilityId,
    facilityTimezone: "America/Chicago",
    sourceReferenceId: timezoneSourceReferenceId,
    effectiveDate: new Date("2026-01-01T00:00:00.000Z"),
    actor: { actorType: "USER", actorId: tenant.userId },
  });

  const caseId = `synthetic-rls-case-${suffix}-${h.runId}`;
  await h.prisma.behavioralHealthCase.create({
    data: {
      id: caseId,
      organizationId: tenant.organizationId,
      patientTokenId: tenant.patientTokenId,
      status: "DRAFT",
      urgency: "ROUTINE",
    },
  });

  const command: AdmissionHandoffCommand = {
    sourceCaseId: caseId,
    acceptedFacilityResponseId: `synthetic-rls-acceptance-${suffix}-${h.runId}`,
    facilityId,
    programId: "synthetic-program-rls",
    unitId: null,
    admittedAt: "2026-07-19T03:30:00.000Z",
    facilityTimezone: {
      facilityTimezone: "America/Chicago",
      source: "FACILITY_CONFIGURATION",
      sourceReferenceId: timezoneSourceReferenceId,
    },
    sourcePacketVersionId: null,
    sourceCustodyEventId: null,
    attestation: { code: "AUTHORIZED_ADMISSION_RECORDED", method: "FACILITY_WORKFLOW" },
  };
  const result = await gateway.recordAdmission({
    organizationId: tenant.organizationId,
    command,
    actor: { actorType: "USER", actorId: tenant.userId },
  });
  return result.episodeId;
}

async function asRuntimeRole<T>(work: (tx: TenantContextClient) => Promise<T>): Promise<T> {
  return h.prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL ROLE "${RLS_ROLE}"`);
    return work(tx);
  });
}

async function asRuntimeTenant<T>(organizationId: string, work: (tx: TenantContextClient) => Promise<T>): Promise<T> {
  return asRuntimeRole(async (tx) => {
    await setTenantContext(tx, organizationId);
    return work(tx);
  });
}

beforeAll(async () => {
  h = await createHarness();
  const migration = await h.prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT count(*)::bigint AS count FROM _prisma_migrations
     WHERE migration_name = '20260719123000_od6_episode_persistence_rls' AND finished_at IS NOT NULL`,
  );
  expect(migration[0]?.count).toBe(1n);

  await h.prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      CREATE ROLE "${RLS_ROLE}" NOLOGIN NOSUPERUSER NOBYPASSRLS;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END
    $$;
  `);
  await h.prisma.$executeRawUnsafe(`ALTER ROLE "${RLS_ROLE}" NOLOGIN NOSUPERUSER NOBYPASSRLS`);
  await h.prisma.$executeRawUnsafe(`GRANT USAGE ON SCHEMA public TO "${RLS_ROLE}"`);
  for (const table of PROTECTED_TABLES) {
    await h.prisma.$executeRawUnsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "${table}" TO "${RLS_ROLE}"`);
  }

  episodeA = await createEpisode(h.tenantA, `synthetic-rls-facility-a-${h.runId}`, "synthetic-rls-source-a", "a");
  episodeB = await createEpisode(h.tenantB, `synthetic-rls-facility-b-${h.runId}`, "synthetic-rls-source-b", "b");
});

afterAll(async () => {
  for (const table of PROTECTED_TABLES) {
    await h?.prisma.$executeRawUnsafe(`REVOKE ALL PRIVILEGES ON TABLE "${table}" FROM "${RLS_ROLE}"`);
  }
  await h?.prisma.$executeRawUnsafe(`REVOKE ALL PRIVILEGES ON SCHEMA public FROM "${RLS_ROLE}"`);
  await h?.prisma.$executeRawUnsafe(`DROP ROLE IF EXISTS "${RLS_ROLE}"`);
  await h?.dispose();
});

describe("OD-6 bounded episode-persistence RLS", () => {
  it("fails closed when a runtime transaction has no tenant context", async () => {
    const rows = await asRuntimeRole((tx) => tx.episode.findMany());
    expect(rows).toEqual([]);
  });

  it("isolates reads and writes to the transaction-local tenant", async () => {
    const tenantRows = await asRuntimeTenant(h.tenantA.organizationId, (tx) => tx.episode.findMany());
    expect(tenantRows.map((row) => row.id)).toEqual([episodeA]);

    const crossTenantUpdate = await asRuntimeTenant(h.tenantA.organizationId, (tx) =>
      tx.episode.updateMany({ where: { id: episodeB }, data: { version: { increment: 1 } } }),
    );
    expect(crossTenantUpdate.count).toBe(0);

    const episodeBVersion = await h.prisma.episode.findUniqueOrThrow({ where: { id: episodeB } });
    expect(episodeBVersion.version).toBe(1);
  });

  it("clears context after rollback and reports the runtime role cannot bypass RLS", async () => {
    await expect(
      asRuntimeTenant(h.tenantA.organizationId, async (tx) => {
        await tx.episode.findUnique({ where: { id: episodeA } });
        throw new Error("synthetic rollback");
      }),
    ).rejects.toThrow("synthetic rollback");

    const rowsAfterRollback = await asRuntimeRole((tx) => tx.episode.findMany());
    expect(rowsAfterRollback).toEqual([]);

    const role = await asRuntimeRole((tx) =>
      tx.$queryRawUnsafe<Array<{ rolsuper: boolean; rolbypassrls: boolean }>>(
        `SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = '${RLS_ROLE}'`,
      ),
    );
    expect(role).toEqual([{ rolsuper: false, rolbypassrls: false }]);
  });

  it("keeps separate concurrent transactions on their own tenant contexts", async () => {
    const [rowsA, rowsB] = await Promise.all([
      asRuntimeTenant(h.tenantA.organizationId, (tx) => tx.episode.findMany()),
      asRuntimeTenant(h.tenantB.organizationId, (tx) => tx.episode.findMany()),
    ]);
    expect(rowsA.map((row) => row.id)).toEqual([episodeA]);
    expect(rowsB.map((row) => row.id)).toEqual([episodeB]);
  });
});
