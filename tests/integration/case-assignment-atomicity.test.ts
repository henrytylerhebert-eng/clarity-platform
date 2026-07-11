import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  CaseNotFoundError,
  ConcurrencyConflictError,
  PrismaCaseCommandGateway,
} from "@clarity/case-repository";
import { CaseCommandService, COMMAND_AUDIT_ACTIONS, type CommandActor } from "@clarity/case-service";
import { createHarness, tickingClock, type Harness } from "./helpers/harness.js";

/**
 * ADR-0005: assignee organization validation is atomic. The assignee check
 * runs INSIDE the command transaction and is re-asserted as a predicate on
 * the conditional UPDATE itself, so no membership change can slip between a
 * pre-check and the commit.
 */

let h: Harness;
let gateway: PrismaCaseCommandGateway;
let service: CaseCommandService;

const intake: CommandActor = { actorId: "syn-intake", actorType: "USER", roles: ["INTAKE_COORDINATOR"] };

function base(suffix: string, extra: Record<string, unknown> = {}) {
  return { organizationId: h.tenantA.organizationId, caseKey: h.caseKey(suffix), actor: intake, ...extra };
}

async function createCase(suffix: string) {
  return service.createCase({
    organizationId: h.tenantA.organizationId,
    caseKey: h.caseKey(suffix),
    patientTokenId: h.tenantA.patientTokenId,
    actor: intake,
  });
}

async function createUser(suffix: string, status: "ACTIVE" | "INACTIVE" | "LOCKED" = "ACTIVE") {
  return h.prisma.user.create({
    data: {
      id: `synthetic-user-${suffix}-${h.runId}`,
      organizationId: h.tenantA.organizationId,
      email: `syn-${suffix}-${h.runId}@example.test`,
      displayName: `Synthetic ${suffix}`,
      status,
    },
  });
}

/** Snapshot of everything a failed assignment must NOT have touched. */
async function assertNothingWritten(suffix: string, idempotencyKey?: string) {
  const row = await h.prisma.behavioralHealthCase.findFirst({
    where: { id: h.caseKey(suffix), organizationId: h.tenantA.organizationId },
  });
  expect(row?.assignedUserId).toBeNull();
  expect(row?.version).toBe(0);
  const events = await h.prisma.auditEvent.count({
    where: {
      organizationId: h.tenantA.organizationId,
      caseId: h.caseKey(suffix),
      action: COMMAND_AUDIT_ACTIONS.AssignCase,
    },
  });
  expect(events).toBe(0);
  if (idempotencyKey) {
    const idem = await h.prisma.commandIdempotencyRecord.findUnique({
      where: {
        organizationId_idempotencyKey: { organizationId: h.tenantA.organizationId, idempotencyKey },
      },
    });
    expect(idem).toBeNull();
  }
}

beforeAll(async () => {
  h = await createHarness();
  gateway = new PrismaCaseCommandGateway(h.prisma, undefined, tickingClock());
  service = new CaseCommandService(gateway);
});
afterAll(async () => h?.dispose());

describe("atomic assignee validation", () => {
  it("assigns a same-tenant ACTIVE assignee and writes exactly one audit event", async () => {
    await createCase("assign-ok");
    const result = await service.assignCase({ ...base("assign-ok"), assigneeUserId: h.tenantA.userId });
    expect(result.case.assignedUserId).toBe(h.tenantA.userId);
    const events = await h.prisma.auditEvent.count({
      where: {
        organizationId: h.tenantA.organizationId,
        caseId: h.caseKey("assign-ok"),
        action: COMMAND_AUDIT_ACTIONS.AssignCase,
      },
    });
    expect(events).toBe(1);
  });

  it("rejects a cross-tenant assignee and writes nothing", async () => {
    await createCase("assign-cross");
    const key = `syn-assign-cross-${h.runId}`;
    await expect(
      service.assignCase({ ...base("assign-cross"), assigneeUserId: h.tenantB.userId, idempotencyKey: key }),
    ).rejects.toBeInstanceOf(CaseNotFoundError);
    await assertNothingWritten("assign-cross", key);
  });

  it("rejects a missing assignee and writes nothing", async () => {
    await createCase("assign-missing");
    const key = `syn-assign-missing-${h.runId}`;
    await expect(
      service.assignCase({ ...base("assign-missing"), assigneeUserId: "no-such-user", idempotencyKey: key }),
    ).rejects.toBeInstanceOf(CaseNotFoundError);
    await assertNothingWritten("assign-missing", key);
  });

  it("rejects an INACTIVE assignee and a LOCKED assignee (same non-revealing error)", async () => {
    await createCase("assign-inactive");
    const inactive = await createUser("inactive", "INACTIVE");
    const locked = await createUser("locked", "LOCKED");
    const key = `syn-assign-inactive-${h.runId}`;
    await expect(
      service.assignCase({ ...base("assign-inactive"), assigneeUserId: inactive.id, idempotencyKey: key }),
    ).rejects.toBeInstanceOf(CaseNotFoundError);
    await expect(
      service.assignCase({ ...base("assign-inactive"), assigneeUserId: locked.id }),
    ).rejects.toBeInstanceOf(CaseNotFoundError);
    await assertNothingWritten("assign-inactive", key);
  });

  it("a stale expectedVersion still fails safely on assignment", async () => {
    await createCase("assign-stale");
    await service.updateCaseLocation({ ...base("assign-stale"), currentLocation: "Synthetic Bay 3" }); // v1
    await expect(
      service.assignCase({ ...base("assign-stale"), assigneeUserId: h.tenantA.userId, expectedVersion: 0 }),
    ).rejects.toBeInstanceOf(ConcurrencyConflictError);
    const row = await h.prisma.behavioralHealthCase.findFirst({
      where: { id: h.caseKey("assign-stale"), organizationId: h.tenantA.organizationId },
    });
    expect(row?.assignedUserId).toBeNull();
    expect(row?.version).toBe(1);
  });

  it("a membership change committed DURING the transaction cannot produce an invalid assignment", async () => {
    await createCase("assign-toctou");
    const victim = await createUser("toctou", "ACTIVE");
    const key = `syn-assign-toctou-${h.runId}`;

    // Drive the gateway directly with an async decide() that commits an
    // out-of-band membership change while the assignment transaction is
    // open — AFTER the in-transaction assignee read passed, BEFORE the
    // UPDATE runs. Queries on h.prisma inside decide() use a separate pooled
    // connection, so they commit independently of the open transaction.
    // Under READ COMMITTED the UPDATE's re-asserted assignee predicate then
    // evaluates against the newly committed state and matches zero rows.
    await expect(
      gateway.executeCommand({
        organizationId: h.tenantA.organizationId,
        caseKey: h.caseKey("assign-toctou"),
        actor: { actorType: "USER", actorId: "syn-intake" },
        commandType: "AssignCase",
        idempotencyKey: key,
        requireActiveAssignee: victim.id,
        decide: async (current) => {
          await h.prisma.user.update({ where: { id: victim.id }, data: { status: "INACTIVE" } });
          return {
            changes: { assignedUserId: victim.id },
            auditAction: "CASE_ASSIGNED",
            auditMetadata: { assignedUserId: victim.id, previousAssignedUserId: current.assignedUserId ?? null },
          };
        },
      }),
    ).rejects.toBeInstanceOf(ConcurrencyConflictError);

    await assertNothingWritten("assign-toctou", key);
  });
});
