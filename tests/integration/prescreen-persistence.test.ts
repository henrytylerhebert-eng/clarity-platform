import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  PrismaPrescreenGateway,
  createPrismaClient,
  setTenantContext,
  type TenantContextClient,
} from "@clarity/case-repository";
import {
  PrescreenCommandService,
  PrescreenIdempotencyKeyReusedError,
  PrescreenNotFoundError,
  PrescreenVersionConflictError,
  SYNTHETIC_PRESCREEN_ROLES,
  SYNTHETIC_PRESCREEN_TEST_POLICY,
  type AssessmentDraftInput,
} from "@clarity/prescreen-service";
import { PRESCREEN_EVENT_TYPES } from "@clarity/domain-contracts";
import type { PrismaClient } from "@prisma/client";
import { createHarness, type Harness } from "./helpers/harness.js";

/**
 * Prescreen Phase 3 persistence proofs against local clarity_dev — the
 * guarantees only a real database can demonstrate:
 * - state survives a completely separate PrismaClient ("restart");
 * - idempotency replays and nested-body conflicts hold across connections;
 * - concurrent versioned writers produce exactly one winner;
 * - a failed command leaves zero rows anywhere and does not consume its key;
 * - the caseId linkage is real and its misses are non-revealing;
 * - RLS on the four prescreen tables fails closed for a NOBYPASSRLS role.
 *
 * All assertions are scoped to this run's synthetic tenants so parallel
 * test files never interfere.
 */

const RLS_ROLE = "synthetic_prescreen_runtime";
/** Shared with od6-rls.test.ts: one advisory lock for all RLS-role DDL. */
const RLS_DDL_LOCK = 48151623;
const PRESCREEN_TABLES = [
  "PrescreenEncounter",
  "PrescreenAssessmentVersion",
  "PrescreenPacketRequirement",
  "PrescreenSubmission",
] as const;

let h: Harness;
let service: PrescreenCommandService;
let gateway: PrismaPrescreenGateway;

const T = (n: number) => `2026-07-19T15:0${n}:00.000Z`;

let keySeq = 0;
const idem = (label: string) => `syn-psp-${label}-${keySeq++}-key`;

function actorFor(tenant: Harness["tenantA"]) {
  return {
    actorId: tenant.userId,
    actorType: "USER" as const,
    roleCodes: [SYNTHETIC_PRESCREEN_ROLES.fieldAssessor],
  };
}

function draft(id: string, overrides: Partial<AssessmentDraftInput> = {}): AssessmentDraftInput {
  return {
    assessmentVersionId: id,
    willingness: "WILLING",
    orientation: {
      observedAt: T(0),
      person: { status: "ORIENTED" },
      place: { status: "ORIENTED" },
      time: { status: "ORIENTED" },
      situation: { status: "ORIENTED" },
    },
    answers: [
      {
        answerId: `${id}-ans-1`,
        questionCode: "PRESENTING_CONCERN",
        valueState: "ANSWERED",
        narrative: "Synthetic persistence narrative",
        sourceIds: [`${id}-src-1`],
      },
    ],
    sources: [{ sourceId: `${id}-src-1`, sourceType: "DIRECT_OBSERVATION" }],
    ...overrides,
  };
}

function caseIdFor(tenant: "a" | "b") {
  return `synthetic-psp-case-${tenant}-${h.runId}`;
}

async function startEncounter(tenant: Harness["tenantA"], caseId: string, timeIndex = 0) {
  return service.startEncounter({
    organizationId: tenant.organizationId,
    actor: actorFor(tenant),
    idempotencyKey: idem("start"),
    occurredAt: T(timeIndex),
    caseId,
    currentLocation: "Synthetic ED",
    presentingConcern: "Synthetic persistence concern",
  });
}

interface OrgCounts {
  encounters: number;
  assessments: number;
  requirements: number;
  submissions: number;
  audit: number;
  governed: number;
  outbox: number;
  idempotency: number;
}

async function orgCounts(prisma: PrismaClient, organizationId: string): Promise<OrgCounts> {
  const where = { organizationId };
  return {
    encounters: await prisma.prescreenEncounter.count({ where }),
    assessments: await prisma.prescreenAssessmentVersion.count({ where }),
    requirements: await prisma.prescreenPacketRequirement.count({ where }),
    submissions: await prisma.prescreenSubmission.count({ where }),
    audit: await prisma.auditEvent.count({
      where: { ...where, action: { in: [...PRESCREEN_EVENT_TYPES] } },
    }),
    governed: await prisma.governedEvent.count({
      where: { ...where, schemaName: "clarity.prescreen.event" },
    }),
    outbox: await prisma.outboxRecord.count({
      where: { ...where, eventTypeName: { in: [...PRESCREEN_EVENT_TYPES] } },
    }),
    idempotency: await prisma.commandIdempotencyRecord.count({
      where: { ...where, idempotencyKey: { startsWith: "prescreen/" } },
    }),
  };
}

beforeAll(async () => {
  h = await createHarness();
  gateway = new PrismaPrescreenGateway(h.prisma);
  service = new PrescreenCommandService(gateway, SYNTHETIC_PRESCREEN_TEST_POLICY);

  for (const [tenant, label] of [
    [h.tenantA, "a"],
    [h.tenantB, "b"],
  ] as const) {
    await h.prisma.behavioralHealthCase.create({
      data: {
        id: caseIdFor(label),
        organizationId: tenant.organizationId,
        patientTokenId: tenant.patientTokenId,
      },
    });
  }

  // Role/grant DDL from parallel test files touches shared catalog rows
  // (e.g. GRANT ... ON SCHEMA public), which Postgres rejects with "tuple
  // concurrently updated". RLS_DDL_LOCK serializes it across files.
  await h.prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${RLS_DDL_LOCK})`);
    await tx.$executeRawUnsafe(`
      DO $$
      BEGIN
        CREATE ROLE "${RLS_ROLE}" NOLOGIN NOSUPERUSER NOBYPASSRLS;
      EXCEPTION WHEN duplicate_object THEN
        NULL;
      END
      $$;
    `);
    await tx.$executeRawUnsafe(`ALTER ROLE "${RLS_ROLE}" NOLOGIN NOSUPERUSER NOBYPASSRLS`);
    await tx.$executeRawUnsafe(`GRANT USAGE ON SCHEMA public TO "${RLS_ROLE}"`);
    for (const table of PRESCREEN_TABLES) {
      await tx.$executeRawUnsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "${table}" TO "${RLS_ROLE}"`);
    }
  });
});

afterAll(async () => {
  await h?.prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${RLS_DDL_LOCK})`);
    for (const table of PRESCREEN_TABLES) {
      await tx.$executeRawUnsafe(`REVOKE ALL PRIVILEGES ON TABLE "${table}" FROM "${RLS_ROLE}"`);
    }
    await tx.$executeRawUnsafe(`REVOKE ALL PRIVILEGES ON SCHEMA public FROM "${RLS_ROLE}"`);
    await tx.$executeRawUnsafe(`DROP ROLE IF EXISTS "${RLS_ROLE}"`);
  });
  await h?.dispose();
});

describe("durability", () => {
  it("state written through one client is fully visible to a separate client — a restart loses nothing", async () => {
    const started = await startEncounter(h.tenantA, caseIdFor("a"));
    await service.saveAssessmentDraft({
      organizationId: h.tenantA.organizationId,
      actor: actorFor(h.tenantA),
      idempotencyKey: idem("draft"),
      occurredAt: T(1),
      encounterId: started.encounterId,
      draft: draft(`syn-psp-asv-durable-${h.runId}`),
    });
    await service.attestAssessment({
      organizationId: h.tenantA.organizationId,
      actor: actorFor(h.tenantA),
      idempotencyKey: idem("attest"),
      occurredAt: T(2),
      encounterId: started.encounterId,
      assessmentVersionId: `syn-psp-asv-durable-${h.runId}`,
    });

    // A brand-new client is a brand-new connection pool: nothing in-process
    // survives from the writes above except what the database holds.
    const secondClient = createPrismaClient();
    try {
      const secondGateway = new PrismaPrescreenGateway(secondClient);
      const encounter = await secondGateway.getEncounter(h.tenantA.organizationId, started.encounterId);
      expect(encounter.status).toBe("ATTESTED");
      expect(encounter.version).toBe(3);
      expect(encounter.caseId).toBe(caseIdFor("a"));
      const assessment = await secondGateway.getAssessmentVersion(
        h.tenantA.organizationId,
        `syn-psp-asv-durable-${h.runId}`,
      );
      expect(assessment.status).toBe("ATTESTED");
      expect(assessment.contentHash).toBeTruthy();
      expect(assessment.answers).toHaveLength(1);
    } finally {
      await secondClient.$disconnect();
    }
  });
});

describe("idempotency across connections (ADR-0014 §5)", () => {
  it("a retry with the same body but a later occurredAt replays through a different connection", async () => {
    const key = idem("xconn");
    const body = {
      organizationId: h.tenantA.organizationId,
      actor: actorFor(h.tenantA),
      idempotencyKey: key,
      caseId: caseIdFor("a"),
      currentLocation: "Synthetic ED",
      presentingConcern: "Cross-connection replay",
    };
    const first = await service.startEncounter({ ...body, occurredAt: T(0) });
    expect(first.replayed).toBe(false);

    const secondClient = createPrismaClient();
    try {
      const retryService = new PrescreenCommandService(
        new PrismaPrescreenGateway(secondClient),
        SYNTHETIC_PRESCREEN_TEST_POLICY,
      );
      const replay = await retryService.startEncounter({ ...body, occurredAt: T(5) });
      expect(replay.replayed).toBe(true);
      expect(replay.objectId).toBe(first.objectId);
      expect(replay.encounterVersion).toBe(first.encounterVersion);
      // First write wins: the stored encounter keeps the original timestamp.
      const stored = await gateway.getEncounter(h.tenantA.organizationId, first.encounterId);
      expect(stored.createdAt).toBe(T(0));
    } finally {
      await secondClient.$disconnect();
    }
  });

  it("a replay writes nothing new; a nested-only body change under the same key is a conflict", async () => {
    const started = await startEncounter(h.tenantA, caseIdFor("a"));
    const key = idem("nested");
    const command = {
      organizationId: h.tenantA.organizationId,
      actor: actorFor(h.tenantA),
      idempotencyKey: key,
      occurredAt: T(1),
      encounterId: started.encounterId,
    };
    await service.saveAssessmentDraft({ ...command, draft: draft(`syn-psp-asv-nested-${h.runId}`) });
    const before = await orgCounts(h.prisma, h.tenantA.organizationId);

    const replay = await service.saveAssessmentDraft({
      ...command,
      draft: draft(`syn-psp-asv-nested-${h.runId}`),
    });
    expect(replay.replayed).toBe(true);
    expect(await orgCounts(h.prisma, h.tenantA.organizationId)).toEqual(before);

    // Change only a deeply nested field; every top-level key stays identical.
    await expect(
      service.saveAssessmentDraft({
        ...command,
        draft: draft(`syn-psp-asv-nested-${h.runId}`, {
          orientation: {
            observedAt: T(0),
            person: { status: "NOT_ORIENTED" },
            place: { status: "ORIENTED" },
            time: { status: "ORIENTED" },
            situation: { status: "ORIENTED" },
          },
        }),
      }),
    ).rejects.toThrow(PrescreenIdempotencyKeyReusedError);
    expect(await orgCounts(h.prisma, h.tenantA.organizationId)).toEqual(before);
  });
});

describe("concurrency", () => {
  it("two concurrent versioned writers produce exactly one winner and one version conflict", async () => {
    const started = await startEncounter(h.tenantA, caseIdFor("a"));
    const base = {
      organizationId: h.tenantA.organizationId,
      actor: actorFor(h.tenantA),
      occurredAt: T(1),
      encounterId: started.encounterId,
      expectedVersion: started.encounterVersion,
    };
    const results = await Promise.allSettled([
      service.saveAssessmentDraft({
        ...base,
        idempotencyKey: idem("race-1"),
        draft: draft(`syn-psp-asv-race1-${h.runId}`),
      }),
      service.saveAssessmentDraft({
        ...base,
        idempotencyKey: idem("race-2"),
        draft: draft(`syn-psp-asv-race2-${h.runId}`),
      }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(PrescreenVersionConflictError);

    const encounter = await gateway.getEncounter(h.tenantA.organizationId, started.encounterId);
    expect(encounter.version).toBe(started.encounterVersion + 1);
  });
});

describe("failure atomicity", () => {
  it("a failed command leaves zero residue in any table and does not consume its key", async () => {
    const started = await startEncounter(h.tenantA, caseIdFor("a"));
    const before = await orgCounts(h.prisma, h.tenantA.organizationId);
    const encounterBefore = await gateway.getEncounter(h.tenantA.organizationId, started.encounterId);

    const failingKey = idem("fail-attest");
    await expect(
      service.attestAssessment({
        organizationId: h.tenantA.organizationId,
        actor: actorFor(h.tenantA),
        idempotencyKey: failingKey,
        occurredAt: T(1),
        encounterId: started.encounterId,
        assessmentVersionId: `syn-psp-asv-never-saved-${h.runId}`,
      }),
    ).rejects.toThrow(PrescreenNotFoundError);

    expect(await orgCounts(h.prisma, h.tenantA.organizationId)).toEqual(before);
    expect(await gateway.getEncounter(h.tenantA.organizationId, started.encounterId)).toEqual(encounterBefore);

    // The failed key was not consumed: the same key succeeds once the draft exists.
    await service.saveAssessmentDraft({
      organizationId: h.tenantA.organizationId,
      actor: actorFor(h.tenantA),
      idempotencyKey: idem("fail-draft"),
      occurredAt: T(2),
      encounterId: started.encounterId,
      draft: draft(`syn-psp-asv-fail-${h.runId}`),
    });
    const attested = await service.attestAssessment({
      organizationId: h.tenantA.organizationId,
      actor: actorFor(h.tenantA),
      idempotencyKey: failingKey,
      occurredAt: T(3),
      encounterId: started.encounterId,
      assessmentVersionId: `syn-psp-asv-fail-${h.runId}`,
    });
    expect(attested.replayed).toBe(false);
    expect(attested.status).toBe("ATTESTED");
  });
});

describe("real case linkage (Phase 3 ruling)", () => {
  it("an absent case and another tenant's case fail with the same non-revealing error", async () => {
    const attempts = [
      `synthetic-psp-case-absent-${h.runId}`, // never created
      caseIdFor("b"), // exists, but belongs to tenant B
    ];
    const errors: unknown[] = [];
    for (const caseId of attempts) {
      try {
        await startEncounter(h.tenantA, caseId);
        expect.unreachable("start must fail without a same-organization case");
      } catch (error) {
        errors.push(error);
      }
    }
    expect(errors[0]).toBeInstanceOf(PrescreenNotFoundError);
    expect(errors[1]).toBeInstanceOf(PrescreenNotFoundError);
    expect((errors[0] as Error).message).toBe((errors[1] as Error).message);
  });

  it("keeps assessment ids tenant-scoped: organization B reuses A's id without collision or disclosure", async () => {
    const sharedId = `syn-psp-asv-shared-${h.runId}`;
    const startedA = await startEncounter(h.tenantA, caseIdFor("a"));
    await service.saveAssessmentDraft({
      organizationId: h.tenantA.organizationId,
      actor: actorFor(h.tenantA),
      idempotencyKey: idem("shared-a"),
      occurredAt: T(1),
      encounterId: startedA.encounterId,
      draft: draft(sharedId),
    });

    const startedB = await startEncounter(h.tenantB, caseIdFor("b"));
    const savedB = await service.saveAssessmentDraft({
      organizationId: h.tenantB.organizationId,
      actor: actorFor(h.tenantB),
      idempotencyKey: idem("shared-b"),
      occurredAt: T(1),
      encounterId: startedB.encounterId,
      draft: draft(sharedId),
    });
    expect(savedB.status).toBe("DRAFT");
    const a = await gateway.getAssessmentVersion(h.tenantA.organizationId, sharedId);
    const b = await gateway.getAssessmentVersion(h.tenantB.organizationId, sharedId);
    expect(a.encounterId).toBe(startedA.encounterId);
    expect(b.encounterId).toBe(startedB.encounterId);
  });
});

describe("audit, outbox, and restricted fields", () => {
  it("every successful command writes its audit event, governed-event row, outbox row, and idempotency record in lockstep", async () => {
    const before = await orgCounts(h.prisma, h.tenantA.organizationId);
    const started = await startEncounter(h.tenantA, caseIdFor("a"));
    await service.updatePacketRequirement({
      organizationId: h.tenantA.organizationId,
      actor: actorFor(h.tenantA),
      idempotencyKey: idem("req"),
      occurredAt: T(1),
      encounterId: started.encounterId,
      requirementCode: "DEMOGRAPHICS",
      label: "Demographics",
      state: "MISSING",
      blockingTargets: ["CENTRAL_INTAKE_REVIEW"],
      resolutionWorkspace: "Packet",
      sourceRuleId: "synthetic-facility-rule",
      sourceRuleVersion: 1,
    });
    const after = await orgCounts(h.prisma, h.tenantA.organizationId);
    expect(after.audit).toBe(before.audit + 2);
    expect(after.governed).toBe(before.governed + 2);
    expect(after.outbox).toBe(before.outbox + 2);
    expect(after.idempotency).toBe(before.idempotency + 2);
    expect(after.requirements).toBe(before.requirements + 1);

    const readiness = await service.evaluateTargetReadiness({
      organizationId: h.tenantA.organizationId,
      actor: actorFor(h.tenantA),
      encounterId: started.encounterId,
      target: "CENTRAL_INTAKE_REVIEW",
    });
    expect(readiness.ready).toBe(false);
    expect(readiness.blockers[0]?.requirementCode).toBe("DEMOGRAPHICS");
  });

  it("persisted audit metadata and envelopes carry hashes, never assessment source text", async () => {
    const started = await startEncounter(h.tenantA, caseIdFor("a"));
    await service.saveAssessmentDraft({
      organizationId: h.tenantA.organizationId,
      actor: actorFor(h.tenantA),
      idempotencyKey: idem("noleak"),
      occurredAt: T(1),
      encounterId: started.encounterId,
      draft: draft(`syn-psp-asv-noleak-${h.runId}`),
    });
    const audit = await h.prisma.auditEvent.findMany({
      where: {
        organizationId: h.tenantA.organizationId,
        action: { in: [...PRESCREEN_EVENT_TYPES] },
      },
    });
    const governed = await h.prisma.governedEvent.findMany({
      where: { organizationId: h.tenantA.organizationId, schemaName: "clarity.prescreen.event" },
    });
    const serialized = JSON.stringify([
      audit.map((row) => row.modelMetadata),
      governed.map((row) => row.envelope),
    ]);
    expect(serialized).not.toContain("Synthetic persistence narrative");
    expect(serialized).not.toContain("Synthetic persistence concern");
    expect(serialized).not.toContain("Synthetic ED");
  });
});

describe("prescreen RLS (fail closed, defense in depth)", () => {
  async function asRuntimeRole<T>(work: (tx: TenantContextClient) => Promise<T>): Promise<T> {
    return h.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL ROLE "${RLS_ROLE}"`);
      return work(tx);
    });
  }

  it("returns nothing without a tenant context and cannot touch another tenant's rows with one", async () => {
    const migration = await h.prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT count(*)::bigint AS count FROM _prisma_migrations
       WHERE migration_name LIKE '%prescreen_persistence_rls' AND finished_at IS NOT NULL`,
    );
    expect(migration[0]?.count).toBe(1n);

    const startedA = await startEncounter(h.tenantA, caseIdFor("a"));

    const noContext = await asRuntimeRole((tx) => tx.prescreenEncounter.findMany());
    expect(noContext).toEqual([]);

    const wrongTenant = await asRuntimeRole(async (tx) => {
      await setTenantContext(tx, h.tenantB.organizationId);
      return tx.prescreenEncounter.updateMany({
        where: { id: startedA.encounterId },
        data: { version: { increment: 1 } },
      });
    });
    expect(wrongTenant.count).toBe(0);

    const rightTenant = await asRuntimeRole(async (tx) => {
      await setTenantContext(tx, h.tenantA.organizationId);
      return tx.prescreenEncounter.findMany({ where: { id: startedA.encounterId } });
    });
    expect(rightTenant.map((row) => row.id)).toEqual([startedA.encounterId]);
  });
});
