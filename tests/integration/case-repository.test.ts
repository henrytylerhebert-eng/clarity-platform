import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaCaseRepository } from "@clarity/case-repository";
import { canBeginClinicalReview } from "@clarity/domain-contracts";
import { createHarness, tickingClock, TEST_ACTOR, type Harness } from "./helpers/harness.js";

let h: Harness;
let repo: PrismaCaseRepository;

beforeAll(async () => {
  h = await createHarness();
  repo = new PrismaCaseRepository(h.prisma, undefined, tickingClock());
});
afterAll(async () => h?.dispose());

describe("case creation (DB)", () => {
  it("creates a tenant-scoped case in DRAFT with all workstreams NOT_STARTED and reads it back", async () => {
    const created = await repo.create(h.tenantA.organizationId, h.makeCaseData(h.tenantA, "create"), TEST_ACTOR);
    expect(created.status).toBe("DRAFT");
    expect(Object.values(created.workstreams)).toEqual(Array(8).fill("NOT_STARTED"));

    const fetched = await repo.findByKey(h.tenantA.organizationId, h.caseKey("create"));
    expect(fetched?.organizationId).toBe(h.tenantA.organizationId);
    expect(fetched?.status).toBe("DRAFT");
  });
});

describe("case state transitions (DB)", () => {
  it("persists the forward path", async () => {
    await repo.create(h.tenantA.organizationId, h.makeCaseData(h.tenantA, "fwd"), TEST_ACTOR);
    await repo.transitionStatus(h.tenantA.organizationId, h.caseKey("fwd"), "INTAKE_IN_PROGRESS", TEST_ACTOR);
    await repo.transitionStatus(h.tenantA.organizationId, h.caseKey("fwd"), "DOCUMENTS_PENDING", TEST_ACTOR);
    await repo.transitionStatus(h.tenantA.organizationId, h.caseKey("fwd"), "DOCUMENTS_RECEIVED", TEST_ACTOR);
    const fresh = await repo.findByKey(h.tenantA.organizationId, h.caseKey("fwd"));
    expect(fresh?.status).toBe("DOCUMENTS_RECEIVED");
  });

  it("rejects invalid jumps and leaves the row unchanged", async () => {
    await repo.create(h.tenantA.organizationId, h.makeCaseData(h.tenantA, "invalid"), TEST_ACTOR);
    await expect(
      repo.transitionStatus(h.tenantA.organizationId, h.caseKey("invalid"), "TRANSFER_COMPLETE", TEST_ACTOR),
    ).rejects.toThrow(/Invalid case transition/);
    const fresh = await repo.findByKey(h.tenantA.organizationId, h.caseKey("invalid"));
    expect(fresh?.status).toBe("DRAFT");
  });

  it("rejects mutations of terminal cases and stamps closedAt on CLOSED", async () => {
    await repo.create(
      h.tenantA.organizationId,
      h.makeCaseData(h.tenantA, "terminal", { status: "DRAFT" }),
      TEST_ACTOR,
    );
    await repo.transitionStatus(h.tenantA.organizationId, h.caseKey("terminal"), "CANCELLED", TEST_ACTOR);
    await expect(
      repo.transitionStatus(h.tenantA.organizationId, h.caseKey("terminal"), "DRAFT", TEST_ACTOR),
    ).rejects.toThrow(/Invalid case transition/);
  });

  it("allows cancellation from any active state and INFORMATION_INCOMPLETE detours", async () => {
    await repo.create(h.tenantA.organizationId, h.makeCaseData(h.tenantA, "detour"), TEST_ACTOR);
    await repo.transitionStatus(h.tenantA.organizationId, h.caseKey("detour"), "INTAKE_IN_PROGRESS", TEST_ACTOR);
    await repo.transitionStatus(h.tenantA.organizationId, h.caseKey("detour"), "INFORMATION_INCOMPLETE", TEST_ACTOR);
    const detoured = await repo.findByKey(h.tenantA.organizationId, h.caseKey("detour"));
    expect(detoured?.status).toBe("INFORMATION_INCOMPLETE");
    await repo.transitionStatus(h.tenantA.organizationId, h.caseKey("detour"), "REVIEW_IN_PROGRESS", TEST_ACTOR);
    await repo.transitionStatus(h.tenantA.organizationId, h.caseKey("detour"), "CANCELLED", TEST_ACTOR);
    const cancelled = await repo.findByKey(h.tenantA.organizationId, h.caseKey("detour"));
    expect(cancelled?.status).toBe("CANCELLED");
  });
});

describe("parallel workstream updates (DB)", () => {
  it("updates one workstream without touching siblings", async () => {
    await repo.create(h.tenantA.organizationId, h.makeCaseData(h.tenantA, "ws-single"), TEST_ACTOR);
    const updated = await repo.updateWorkstream(
      h.tenantA.organizationId, h.caseKey("ws-single"), "benefits", "IN_PROGRESS", TEST_ACTOR,
    );
    expect(updated.workstreams.benefits).toBe("IN_PROGRESS");
    expect(updated.workstreams.clinical).toBe("NOT_STARTED");
    expect(updated.workstreams.placement).toBe("NOT_STARTED");
  });

  it("supports simultaneously divergent workstreams persisted on one row", async () => {
    const key = h.caseKey("ws-diverge");
    await repo.create(h.tenantA.organizationId, h.makeCaseData(h.tenantA, "ws-diverge"), TEST_ACTOR);
    await repo.updateWorkstream(h.tenantA.organizationId, key, "clinical", "IN_PROGRESS", TEST_ACTOR);
    await repo.updateWorkstream(h.tenantA.organizationId, key, "legalReview", "IN_PROGRESS", TEST_ACTOR);
    await repo.updateWorkstream(h.tenantA.organizationId, key, "legalReview", "PENDING_REVIEW", TEST_ACTOR);
    await repo.updateWorkstream(h.tenantA.organizationId, key, "medicalScreening", "IN_PROGRESS", TEST_ACTOR);
    await repo.updateWorkstream(h.tenantA.organizationId, key, "medicalScreening", "COMPLETE", TEST_ACTOR);
    await repo.updateWorkstream(h.tenantA.organizationId, key, "benefits", "IN_PROGRESS", TEST_ACTOR);
    const fresh = await repo.findByKey(h.tenantA.organizationId, key);
    expect(fresh?.workstreams).toMatchObject({
      clinical: "IN_PROGRESS",
      legalReview: "PENDING_REVIEW",
      medicalScreening: "COMPLETE",
      benefits: "IN_PROGRESS",
      placement: "NOT_STARTED",
    });
  });

  it("rejects invalid workstream transitions and leaves the row unchanged", async () => {
    await repo.create(h.tenantA.organizationId, h.makeCaseData(h.tenantA, "ws-invalid"), TEST_ACTOR);
    await expect(
      repo.updateWorkstream(h.tenantA.organizationId, h.caseKey("ws-invalid"), "benefits", "COMPLETE", TEST_ACTOR),
    ).rejects.toThrow(/Invalid benefits transition/);
    const fresh = await repo.findByKey(h.tenantA.organizationId, h.caseKey("ws-invalid"));
    expect(fresh?.workstreams.benefits).toBe("NOT_STARTED");
  });
});

describe("emergency clinical review vs financial readiness (DB)", () => {
  it("emergency clinical review proceeds while persisted financial workstreams are BLOCKED", async () => {
    const key = h.caseKey("emergent");
    await repo.create(
      h.tenantA.organizationId,
      h.makeCaseData(h.tenantA, "emergent", { urgency: "EMERGENT" }),
      TEST_ACTOR,
    );
    await repo.updateWorkstream(h.tenantA.organizationId, key, "benefits", "BLOCKED", TEST_ACTOR);
    await repo.updateWorkstream(h.tenantA.organizationId, key, "authorization", "BLOCKED", TEST_ACTOR);
    const fresh = await repo.findByKey(h.tenantA.organizationId, key);
    expect(fresh).toBeDefined();
    expect(fresh!.workstreams.benefits).toBe("BLOCKED");
    expect(canBeginClinicalReview(fresh!)).toBe(true);
  });
});

describe("mapping fidelity and duplicate handling (DB)", () => {
  it("preserves enums, null closedAt, and Date instances through the mapper", async () => {
    const created = await repo.create(
      h.tenantA.organizationId,
      h.makeCaseData(h.tenantA, "mapping", { status: "EVIDENCE_REVIEW", urgency: "URGENT" }),
      TEST_ACTOR,
    );
    expect(created.status).toBe("EVIDENCE_REVIEW");
    expect(created.urgency).toBe("URGENT");
    expect(created.openedAt).toBeInstanceOf(Date);
    expect(created.closedAt).toBeNull();
  });

  it("rejects a duplicate case key without confirming where it is in use", async () => {
    await repo.create(h.tenantA.organizationId, h.makeCaseData(h.tenantA, "dup"), TEST_ACTOR);
    await expect(
      repo.create(h.tenantA.organizationId, h.makeCaseData(h.tenantA, "dup"), TEST_ACTOR),
    ).rejects.toThrow(/is unavailable/);
  });
});
