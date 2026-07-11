import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  ConcurrencyConflictError,
  IdempotencyConflictError,
  PrismaCaseCommandGateway,
  type CaseAuditWriter,
} from "@clarity/case-repository";
import { CaseCommandService, COMMAND_AUDIT_ACTIONS, type CommandActor } from "@clarity/case-service";
import { createHarness, tickingClock, type Harness } from "./helpers/harness.js";

let h: Harness;
let service: CaseCommandService;

const intake: CommandActor = { actorId: "syn-intake", actorType: "USER", roles: ["INTAKE_COORDINATOR"] };

function base(suffix: string, extra: Record<string, unknown> = {}) {
  return { organizationId: h.tenantA.organizationId, caseKey: h.caseKey(suffix), actor: intake, ...extra };
}

async function createCase(suffix: string, extra: Record<string, unknown> = {}) {
  return service.createCase({
    organizationId: h.tenantA.organizationId,
    caseKey: h.caseKey(suffix),
    patientTokenId: h.tenantA.patientTokenId,
    actor: intake,
    ...extra,
  });
}

beforeAll(async () => {
  h = await createHarness();
  service = new CaseCommandService(new PrismaCaseCommandGateway(h.prisma, undefined, tickingClock()));
});
afterAll(async () => h?.dispose());

describe("optimistic concurrency", () => {
  it("a stale expectedVersion fails safely without writing", async () => {
    const created = await createCase("conc-stale");
    const staleVersion = created.case.version; // 0
    await service.transitionCase({ ...base("conc-stale"), to: "INTAKE_IN_PROGRESS" }); // now 1

    await expect(
      service.transitionCase({ ...base("conc-stale"), to: "DOCUMENTS_PENDING", expectedVersion: staleVersion }),
    ).rejects.toBeInstanceOf(ConcurrencyConflictError);
    const row = await h.prisma.behavioralHealthCase.findFirst({
      where: { id: h.caseKey("conc-stale"), organizationId: h.tenantA.organizationId },
    });
    expect(row?.status).toBe("INTAKE_IN_PROGRESS");
    expect(row?.version).toBe(1);
  });

  it("two staff acting on the same version: first wins, second gets a concurrency error", async () => {
    await createCase("conc-race");
    const current = 0;
    await service.updateCaseLocation({
      ...base("conc-race"),
      currentLocation: "Synthetic ED Bay 1",
      expectedVersion: current,
    });
    await expect(
      service.updateCaseLocation({
        ...base("conc-race"),
        currentLocation: "Synthetic ED Bay 2",
        expectedVersion: current,
      }),
    ).rejects.toBeInstanceOf(ConcurrencyConflictError);
    const row = await h.prisma.behavioralHealthCase.findFirst({
      where: { id: h.caseKey("conc-race"), organizationId: h.tenantA.organizationId },
    });
    expect(row?.currentLocation).toBe("Synthetic ED Bay 1");
  });
});

describe("idempotency", () => {
  it("replaying CreateCase with the same key returns the original case and creates no duplicate", async () => {
    const key = `syn-idem-create-${h.runId}`;
    const first = await createCase("idem-create", { idempotencyKey: key });
    const replay = await createCase("idem-create", { idempotencyKey: key });
    expect(first.replayed).toBe(false);
    expect(replay.replayed).toBe(true);
    expect(replay.case.caseKey).toBe(first.case.caseKey);
    const count = await h.prisma.behavioralHealthCase.count({
      where: { id: h.caseKey("idem-create"), organizationId: h.tenantA.organizationId },
    });
    expect(count).toBe(1);
  });

  it("replaying a transition does not re-execute it or write a second audit event", async () => {
    const key = `syn-idem-transition-${h.runId}`;
    await createCase("idem-transition");
    const first = await service.transitionCase({
      ...base("idem-transition"),
      to: "INTAKE_IN_PROGRESS",
      idempotencyKey: key,
    });
    const replay = await service.transitionCase({
      ...base("idem-transition"),
      to: "INTAKE_IN_PROGRESS",
      idempotencyKey: key,
    });
    expect(first.replayed).toBe(false);
    expect(replay.replayed).toBe(true);
    expect(replay.case.version).toBe(first.case.version); // no second bump
    const events = await h.prisma.auditEvent.count({
      where: {
        organizationId: h.tenantA.organizationId,
        caseId: h.caseKey("idem-transition"),
        action: COMMAND_AUDIT_ACTIONS.TransitionCase,
      },
    });
    expect(events).toBe(1);
  });

  it("reusing an idempotency key for a DIFFERENT command is rejected", async () => {
    const key = `syn-idem-conflict-${h.runId}`;
    await createCase("idem-conflict");
    await service.transitionCase({ ...base("idem-conflict"), to: "INTAKE_IN_PROGRESS", idempotencyKey: key });
    await expect(
      service.updateCaseLocation({ ...base("idem-conflict"), currentLocation: "Synthetic Bay", idempotencyKey: key }),
    ).rejects.toBeInstanceOf(IdempotencyConflictError);
  });
});

describe("audit atomicity and event shape", () => {
  it("every successful command writes exactly one audit event with command, correlation id, and state hashes", async () => {
    const correlationId = `syn-corr-${h.runId}`;
    await createCase("audit-shape", { correlationId });
    await service.transitionCase({ ...base("audit-shape"), to: "INTAKE_IN_PROGRESS", correlationId });
    const events = await h.prisma.auditEvent.findMany({
      where: { organizationId: h.tenantA.organizationId, caseId: h.caseKey("audit-shape") },
      orderBy: [{ timestamp: "asc" }, { id: "asc" }],
    });
    expect(events.map((e) => e.action)).toEqual([
      COMMAND_AUDIT_ACTIONS.CreateCase,
      COMMAND_AUDIT_ACTIONS.TransitionCase,
    ]);
    const transition = events[1]!;
    expect(transition.modelMetadata).toMatchObject({
      command: "TransitionCase",
      correlationId,
      from: "DRAFT",
      to: "INTAKE_IN_PROGRESS",
    });
    expect(transition.previousStateHash).toMatch(/^[a-f0-9]{64}$/);
    expect(transition.newStateHash).toMatch(/^[a-f0-9]{64}$/);
    expect(transition.previousStateHash).not.toBe(transition.newStateHash);
    expect(transition.actorId).toBe("syn-intake");
  });

  it("a failed audit write rolls back the whole command", async () => {
    const failingWriter: CaseAuditWriter = {
      write: async () => {
        throw new Error("synthetic audit outage");
      },
    };
    const failingService = new CaseCommandService(
      new PrismaCaseCommandGateway(h.prisma, failingWriter, tickingClock()),
    );
    await expect(
      failingService.createCase({
        organizationId: h.tenantA.organizationId,
        caseKey: h.caseKey("audit-outage-cmd"),
        patientTokenId: h.tenantA.patientTokenId,
        actor: intake,
        idempotencyKey: `syn-outage-${h.runId}`,
      }),
    ).rejects.toThrow(/synthetic audit outage/);

    const row = await h.prisma.behavioralHealthCase.findFirst({
      where: { id: h.caseKey("audit-outage-cmd"), organizationId: h.tenantA.organizationId },
    });
    expect(row).toBeNull();
    // The idempotency record must also have rolled back — a retry can succeed.
    const idem = await h.prisma.commandIdempotencyRecord.findUnique({
      where: {
        organizationId_idempotencyKey: {
          organizationId: h.tenantA.organizationId,
          idempotencyKey: `syn-outage-${h.runId}`,
        },
      },
    });
    expect(idem).toBeNull();
    // Retry with the same key on a healthy service succeeds (not a false replay).
    const retried = await createCase("audit-outage-cmd", { idempotencyKey: `syn-outage-${h.runId}` });
    expect(retried.replayed).toBe(false);
  });

  it("RecordDecisionRationale writes an audit-only event and bumps the version", async () => {
    const created = await createCase("rationale");
    const noted = await service.recordDecisionRationale({
      ...base("rationale"),
      reason: "synthetic disposition rationale",
      decisionContext: "urgency assessment",
    });
    expect(noted.case.version).toBe((created.case.version ?? 0) + 1);
    expect(noted.case.status).toBe("DRAFT");
    const events = await h.prisma.auditEvent.findMany({
      where: {
        organizationId: h.tenantA.organizationId,
        caseId: h.caseKey("rationale"),
        action: COMMAND_AUDIT_ACTIONS.RecordDecisionRationale,
      },
    });
    expect(events).toHaveLength(1);
    expect(events[0]!.reason).toBe("synthetic disposition rationale");
  });
});
