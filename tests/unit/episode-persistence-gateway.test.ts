import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import {
  EpisodeNotFoundError,
  PrismaEpisodePersistenceGateway,
} from "@clarity/case-repository";
import type { AdmissionHandoffCommand, AuditActor } from "@clarity/domain-contracts";

function command(): AdmissionHandoffCommand {
  return {
    sourceCaseId: "synthetic-case-admission-replay",
    acceptedFacilityResponseId: "synthetic-acceptance-id",
    facilityId: "synthetic-facility-a",
    programId: "synthetic-program-adult-inpatient",
    unitId: null,
    admittedAt: "2026-07-19T03:30:00.000Z",
    facilityTimezone: {
      facilityTimezone: "America/Chicago",
      source: "FACILITY_CONFIGURATION",
      sourceReferenceId: "synthetic-tz-source",
    },
    sourcePacketVersionId: null,
    sourceCustodyEventId: null,
    attestation: { code: "AUTHORIZED_ADMISSION_RECORDED", method: "FACILITY_WORKFLOW" },
  };
}

function txWithTenantContext(overrides: Record<string, unknown>) {
  return {
    $executeRaw: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe("PrismaEpisodePersistenceGateway admission replay fallback", () => {
  it("reports a dangling replay link as EpisodeNotFoundError", async () => {
    const danglingEpisodeId = "synthetic-missing-episode";
    const transactions = [
      txWithTenantContext({
        behavioralHealthCase: { findFirst: vi.fn(async () => ({ id: "synthetic-case-admission-replay" })) },
        facilityProfile: { findFirst: vi.fn(async () => ({ id: "synthetic-facility-a" })) },
        facilityTimezoneConfiguration: { findFirst: vi.fn(async () => ({ id: "synthetic-timezone-config" })) },
        caseEpisodeLink: {
          findUnique: vi.fn(async () => null),
          findFirst: vi.fn(async () => ({ id: "synthetic-active-admission-link" })),
        },
      }),
      txWithTenantContext({
        caseEpisodeLink: {
          findUnique: vi.fn(async () => ({
            id: "synthetic-replay-link",
            episodeId: danglingEpisodeId,
          })),
        },
      }),
      txWithTenantContext({
        episode: { findFirst: vi.fn(async () => null) },
      }),
    ];
    const prisma = {
      $transaction: vi.fn(async (work: (tx: unknown) => Promise<unknown>) => {
        const tx = transactions.shift();
        if (!tx) throw new Error("Unexpected transaction");
        return work(tx);
      }),
    } as unknown as PrismaClient;
    const actor: AuditActor = { actorType: "USER", actorId: "synthetic-user" };
    const gateway = new PrismaEpisodePersistenceGateway(
      prisma,
      undefined,
      () => new Date("2026-07-19T04:00:00.000Z"),
    );

    let error: unknown;
    try {
      await gateway.recordAdmission({
        organizationId: "synthetic-org",
        command: command(),
        actor,
      });
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(EpisodeNotFoundError);
    expect(error).toMatchObject({
      name: "EpisodeNotFoundError",
      message: expect.stringContaining(danglingEpisodeId),
    });
  });
});
