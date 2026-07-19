import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  PrismaEpisodePersistenceGateway,
  SyntheticOutboxConsumer,
  SyntheticOutboxDispatcher,
  type OutboxConsumer,
} from "@clarity/case-repository";
import type { AdmissionHandoffCommand } from "@clarity/domain-contracts";
import { createHarness, type Harness } from "./helpers/harness.js";

let h: Harness;
let gateway: PrismaEpisodePersistenceGateway;
let facilityA: string;
let facilityB: string;
let timezoneRefA: string;
let timezoneRefB: string;

async function createAdmission(
  tenant: Harness["tenantA"],
  facilityId: string,
  timezoneReferenceId: string,
  suffix: string,
): Promise<string> {
  const caseId = `synthetic-outbox-case-${suffix}-${h.runId}`;
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
    acceptedFacilityResponseId: `synthetic-outbox-acceptance-${suffix}-${h.runId}`,
    facilityId,
    programId: "synthetic-program-outbox",
    unitId: null,
    admittedAt: "2026-07-19T03:30:00.000Z",
    facilityTimezone: {
      facilityTimezone: "America/Chicago",
      source: "FACILITY_CONFIGURATION",
      sourceReferenceId: timezoneReferenceId,
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
  if (!result.outboxRecordId) throw new Error("Synthetic admission did not create an outbox record");
  return result.outboxRecordId;
}

class FailingConsumer implements OutboxConsumer {
  async consume(): Promise<void> {
    throw new Error("synthetic delivery failure");
  }
}

class DelayedConsumer implements OutboxConsumer {
  readonly messages: string[] = [];

  async consume(message: { outbox: { id: string } }): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    this.messages.push(message.outbox.id);
  }
}

beforeAll(async () => {
  h = await createHarness();
  gateway = new PrismaEpisodePersistenceGateway(h.prisma);
  facilityA = `synthetic-outbox-facility-a-${h.runId}`;
  facilityB = `synthetic-outbox-facility-b-${h.runId}`;
  timezoneRefA = `synthetic-outbox-timezone-a-${h.runId}`;
  timezoneRefB = `synthetic-outbox-timezone-b-${h.runId}`;

  await h.prisma.facilityProfile.create({
    data: { id: facilityA, organizationId: h.tenantA.organizationId, name: "Synthetic Outbox Facility A" },
  });
  await h.prisma.facilityProfile.create({
    data: { id: facilityB, organizationId: h.tenantB.organizationId, name: "Synthetic Outbox Facility B" },
  });
  await gateway.recordFacilityTimezoneConfiguration({
    organizationId: h.tenantA.organizationId,
    facilityProfileId: facilityA,
    facilityTimezone: "America/Chicago",
    sourceReferenceId: timezoneRefA,
    effectiveDate: new Date("2026-01-01T00:00:00.000Z"),
    actor: { actorType: "USER", actorId: h.tenantA.userId },
  });
  await gateway.recordFacilityTimezoneConfiguration({
    organizationId: h.tenantB.organizationId,
    facilityProfileId: facilityB,
    facilityTimezone: "America/Chicago",
    sourceReferenceId: timezoneRefB,
    effectiveDate: new Date("2026-01-01T00:00:00.000Z"),
    actor: { actorType: "USER", actorId: h.tenantB.userId },
  });
});

afterAll(async () => h?.dispose());

describe("synthetic outbox delivery boundary", () => {
  it("delivers only the requested tenant and marks successful rows delivered", async () => {
    const outboxA = await createAdmission(h.tenantA, facilityA, timezoneRefA, "tenant-a");
    const outboxB = await createAdmission(h.tenantB, facilityB, timezoneRefB, "tenant-b");
    const consumer = new SyntheticOutboxConsumer();
    const dispatcher = new SyntheticOutboxDispatcher(h.prisma, consumer);

    expect(await dispatcher.dispatchPending(h.tenantA.organizationId)).toEqual({ deliveredIds: [outboxA] });
    expect(consumer.messages).toHaveLength(1);
    expect(consumer.messages[0]?.outbox.governedEventId).toBeTruthy();
    expect(await dispatcher.dispatchPending(h.tenantA.organizationId)).toEqual({ deliveredIds: [] });

    const rowA = await h.prisma.outboxRecord.findUniqueOrThrow({ where: { id: outboxA } });
    const rowB = await h.prisma.outboxRecord.findUniqueOrThrow({ where: { id: outboxB } });
    expect(rowA.status).toBe("DELIVERED");
    expect(rowB.status).toBe("PENDING");
    expect(await new SyntheticOutboxDispatcher(h.prisma, new SyntheticOutboxConsumer()).dispatchPending(h.tenantB.organizationId)).toEqual({
      deliveredIds: [outboxB],
    });
  });

  it("leaves a row pending when the consumer fails", async () => {
    const outboxId = await createAdmission(h.tenantA, facilityA, timezoneRefA, "failure");
    const dispatcher = new SyntheticOutboxDispatcher(h.prisma, new FailingConsumer());

    await expect(dispatcher.dispatchPending(h.tenantA.organizationId)).rejects.toThrow("synthetic delivery failure");
    expect((await h.prisma.outboxRecord.findUniqueOrThrow({ where: { id: outboxId } })).status).toBe("PENDING");
  });

  it("uses row locks so concurrent synthetic dispatchers do not deliver the same row", async () => {
    const outboxId = await createAdmission(h.tenantB, facilityB, timezoneRefB, "concurrent");
    const consumerA = new DelayedConsumer();
    const consumerB = new DelayedConsumer();
    const [resultA, resultB] = await Promise.all([
      new SyntheticOutboxDispatcher(h.prisma, consumerA).dispatchPending(h.tenantB.organizationId),
      new SyntheticOutboxDispatcher(h.prisma, consumerB).dispatchPending(h.tenantB.organizationId),
    ]);

    expect([resultA.deliveredIds, resultB.deliveredIds].filter((ids) => ids.length === 1)).toHaveLength(1);
    expect(consumerA.messages.concat(consumerB.messages)).toEqual([outboxId]);
    expect((await h.prisma.outboxRecord.findUniqueOrThrow({ where: { id: outboxId } })).status).toBe("DELIVERED");
  });
});
