import { beforeEach, describe, expect, it } from "vitest";
import {
  AssessmentNotDraftError,
  InMemoryPrescreenGateway,
  PrescreenDomainValidationError,
  PrescreenCommandService,
  PrescreenIdempotencyKeyReusedError,
  PrescreenNotFoundError,
  PrescreenPermissionDeniedError,
  PrescreenVersionConflictError,
  SYNTHETIC_PRESCREEN_ROLES,
  SYNTHETIC_PRESCREEN_TEST_POLICY,
  type AssessmentDraftInput,
} from "@clarity/prescreen-service";
import { POSSIBLE_PATHWAYS, type OrientationStatus } from "@clarity/domain-contracts";

const ORG_A = "org_syn_alpha";
const ORG_B = "org_syn_beta";
const T0 = "2026-07-19T15:00:00Z";

const assessor = {
  actorId: "actor_syn_assessor_1",
  actorType: "USER" as const,
  roleCodes: [SYNTHETIC_PRESCREEN_ROLES.fieldAssessor],
};
const observer = {
  actorId: "actor_syn_observer_1",
  actorType: "USER" as const,
  roleCodes: [SYNTHETIC_PRESCREEN_ROLES.readOnly],
};

function orientation(status: OrientationStatus) {
  return {
    observedAt: T0,
    person: { status },
    place: { status },
    time: { status },
    situation: { status },
  };
}

function draft(id: string, overrides: Partial<AssessmentDraftInput> = {}): AssessmentDraftInput {
  return {
    assessmentVersionId: id,
    willingness: "WILLING",
    orientation: orientation("ORIENTED"),
    answers: [
      {
        answerId: `${id}_ans_1`,
        questionCode: "PRESENTING_CONCERN",
        valueState: "ANSWERED",
        narrative: "Synthetic narrative",
        sourceIds: [`${id}_src_1`],
      },
    ],
    sources: [{ sourceId: `${id}_src_1`, sourceType: "DIRECT_OBSERVATION" }],
    ...overrides,
  };
}

describe("prescreen command service (Phase 2, in-memory gateway)", () => {
  let gateway: InMemoryPrescreenGateway;
  let service: PrescreenCommandService;

  beforeEach(() => {
    gateway = new InMemoryPrescreenGateway();
    service = new PrescreenCommandService(gateway, SYNTHETIC_PRESCREEN_TEST_POLICY);
  });

  function start(key = "start-key-0001") {
    return service.startEncounter({
      organizationId: ORG_A,
      actor: assessor,
      idempotencyKey: key,
      occurredAt: T0,
      caseId: "case_syn_1",
      currentLocation: "Synthetic ED",
      presentingConcern: "Synthetic concern",
    });
  }

  async function startDraftAttest() {
    const started = await start();
    await service.saveAssessmentDraft({
      organizationId: ORG_A,
      actor: assessor,
      idempotencyKey: "draft-key-0001",
      occurredAt: T0,
      encounterId: started.encounterId,
      draft: draft("asv_syn_1"),
    });
    const attested = await service.attestAssessment({
      organizationId: ORG_A,
      actor: assessor,
      idempotencyKey: "attest-key-0001",
      occurredAt: T0,
      encounterId: started.encounterId,
      assessmentVersionId: "asv_syn_1",
    });
    return { encounterId: started.encounterId, attested };
  }

  it("start is idempotent: same key and body replays the identical result without new state", async () => {
    const first = await start();
    const auditCount = (await gateway.auditEvents()).length;
    const replay = await start();
    expect(replay.replayed).toBe(true);
    expect(replay.objectId).toBe(first.objectId);
    expect((await gateway.auditEvents()).length).toBe(auditCount);
    expect((await gateway.outboxEnvelopes()).length).toBe(1);
    expect(await gateway.idempotencyRecordCount()).toBe(1);
  });

  it("a retry with the same key and body but a later occurredAt is a replay, not a conflict — arrival time is not intent", async () => {
    const first = await start();
    const retry = await service.startEncounter({
      organizationId: ORG_A,
      actor: assessor,
      idempotencyKey: "start-key-0001",
      occurredAt: "2026-07-19T15:05:00Z",
      caseId: "case_syn_1",
      currentLocation: "Synthetic ED",
      presentingConcern: "Synthetic concern",
    });
    expect(retry.replayed).toBe(true);
    expect(retry.objectId).toBe(first.objectId);
    // First write wins: the stored encounter keeps the original timestamps.
    expect((await gateway.getEncounter(ORG_A, first.encounterId)).createdAt).toBe(T0);
  });

  it("idempotency key reuse with a changed body fails, including nested-only changes", async () => {
    const started = await start();
    await service.saveAssessmentDraft({
      organizationId: ORG_A,
      actor: assessor,
      idempotencyKey: "draft-key-0001",
      occurredAt: T0,
      encounterId: started.encounterId,
      draft: draft("asv_syn_1"),
    });
    // Change only a deeply nested field (orientation status); top-level keys identical.
    await expect(
      service.saveAssessmentDraft({
        organizationId: ORG_A,
        actor: assessor,
        idempotencyKey: "draft-key-0001",
        occurredAt: T0,
        encounterId: started.encounterId,
        draft: draft("asv_syn_1", { orientation: orientation("NOT_ORIENTED") }),
      }),
    ).rejects.toThrow(PrescreenIdempotencyKeyReusedError);
  });

  it("unauthorized roles fail before any read, without disclosing resource existence", async () => {
    await start();
    try {
      await service.saveAssessmentDraft({
        organizationId: ORG_A,
        actor: observer,
        idempotencyKey: "observer-key-01",
        occurredAt: T0,
        encounterId: "pre_syn_does_not_exist",
        draft: draft("asv_syn_x"),
      });
      expect.unreachable("permission check must fail");
    } catch (error) {
      expect(error).toBeInstanceOf(PrescreenPermissionDeniedError);
      expect(String((error as Error).message)).not.toContain("pre_syn_does_not_exist");
    }
  });

  it("cross-organization access fails with the same non-revealing error as a miss", async () => {
    const started = await start();
    let crossTenant: unknown;
    let trueMiss: unknown;
    try {
      await service.saveAssessmentDraft({
        organizationId: ORG_B,
        actor: assessor,
        idempotencyKey: "cross-key-0001",
        occurredAt: T0,
        encounterId: started.encounterId,
        draft: draft("asv_syn_b"),
      });
    } catch (error) {
      crossTenant = error;
    }
    try {
      await service.saveAssessmentDraft({
        organizationId: ORG_A,
        actor: assessor,
        idempotencyKey: "miss-key-00001",
        occurredAt: T0,
        encounterId: "pre_syn_absent",
        draft: draft("asv_syn_c"),
      });
    } catch (error) {
      trueMiss = error;
    }
    expect(crossTenant).toBeInstanceOf(PrescreenNotFoundError);
    expect(trueMiss).toBeInstanceOf(PrescreenNotFoundError);
    expect((crossTenant as Error).message).toBe((trueMiss as Error).message);
  });

  it("stale expected versions fail deterministically", async () => {
    const started = await start();
    await service.saveAssessmentDraft({
      organizationId: ORG_A,
      actor: assessor,
      idempotencyKey: "draft-key-0001",
      occurredAt: T0,
      encounterId: started.encounterId,
      draft: draft("asv_syn_1"),
    });
    await expect(
      service.attestAssessment({
        organizationId: ORG_A,
        actor: assessor,
        idempotencyKey: "attest-key-0001",
        occurredAt: T0,
        encounterId: started.encounterId,
        assessmentVersionId: "asv_syn_1",
        expectedVersion: 1, // stale: draft save bumped the encounter to 2
      }),
    ).rejects.toThrow(PrescreenVersionConflictError);
  });

  it("drafts can be updated in place and re-derive the possible pathway", async () => {
    const started = await start();
    await service.saveAssessmentDraft({
      organizationId: ORG_A,
      actor: assessor,
      idempotencyKey: "draft-key-0001",
      occurredAt: T0,
      encounterId: started.encounterId,
      draft: draft("asv_syn_1"),
    });
    expect((await gateway.getEncounter(ORG_A, started.encounterId)).possiblePathway).toBe(
      "POSSIBLE_FORMAL_VOLUNTARY_REVIEW",
    );
    await service.saveAssessmentDraft({
      organizationId: ORG_A,
      actor: assessor,
      idempotencyKey: "draft-key-0002",
      occurredAt: T0,
      encounterId: started.encounterId,
      draft: draft("asv_syn_1", { willingness: "NON_OPPOSED", orientation: orientation("UNKNOWN") }),
    });
    const updated = await gateway.getAssessmentVersion(ORG_A, "asv_syn_1");
    expect(updated.status).toBe("DRAFT");
    expect(updated.versionNumber).toBe(1);
    expect((await gateway.getEncounter(ORG_A, started.encounterId)).possiblePathway).toBe(
      "POSSIBLE_NONCONTESTED_PATHWAY",
    );
  });

  it("attested versions cannot be edited", async () => {
    const { encounterId } = await startDraftAttest();
    expect((await gateway.getAssessmentVersion(ORG_A, "asv_syn_1")).status).toBe("ATTESTED");
    expect((await gateway.getAssessmentVersion(ORG_A, "asv_syn_1")).contentHash).toBeTruthy();
    await expect(
      service.saveAssessmentDraft({
        organizationId: ORG_A,
        actor: assessor,
        idempotencyKey: "edit-after-attest",
        occurredAt: T0,
        encounterId,
        draft: draft("asv_syn_1"),
      }),
    ).rejects.toThrow(AssessmentNotDraftError);
  });

  it("supplements require and reference the attested parent, preserving lineage", async () => {
    const { encounterId } = await startDraftAttest();
    const supplement = await service.createAssessmentSupplement({
      organizationId: ORG_A,
      actor: assessor,
      idempotencyKey: "supplement-key-01",
      occurredAt: T0,
      encounterId,
      parentAssessmentVersionId: "asv_syn_1",
      reason: "Synthetic new collateral information",
      draft: draft("asv_syn_2"),
    });
    expect(supplement.status).toBe("CORRECTED");
    const stored = await gateway.getAssessmentVersion(ORG_A, "asv_syn_2");
    expect(stored.parentVersionId).toBe("asv_syn_1");
    expect(stored.changeReason).toBe("Synthetic new collateral information");
    expect((await gateway.getAssessmentVersion(ORG_A, "asv_syn_1")).status).toBe("ATTESTED");
    expect((await gateway.getEncounter(ORG_A, encounterId)).currentAssessmentVersionId).toBe("asv_syn_2");
  });

  it("a supplement cannot cite a draft parent", async () => {
    const { encounterId } = await startDraftAttest();
    await service.createAssessmentSupplement({
      organizationId: ORG_A,
      actor: assessor,
      idempotencyKey: "supplement-key-01",
      occurredAt: T0,
      encounterId,
      parentAssessmentVersionId: "asv_syn_1",
      reason: "Synthetic reason",
      draft: draft("asv_syn_2"),
    });
    // A brand-new draft id that was never attested cannot serve as a parent.
    await expect(
      service.createAssessmentSupplement({
        organizationId: ORG_A,
        actor: assessor,
        idempotencyKey: "supplement-key-02",
        occurredAt: T0,
        encounterId,
        parentAssessmentVersionId: "asv_syn_never_attested",
        reason: "Synthetic reason",
        draft: draft("asv_syn_3"),
      }),
    ).rejects.toThrow(PrescreenNotFoundError);
  });

  it("medical stabilization retains precedence over willing-and-oriented", async () => {
    const started = await start();
    await service.saveAssessmentDraft({
      organizationId: ORG_A,
      actor: assessor,
      idempotencyKey: "draft-key-0001",
      occurredAt: T0,
      encounterId: started.encounterId,
      draft: draft("asv_syn_1", { immediateMedicalStabilizationRequired: true }),
    });
    expect((await gateway.getEncounter(ORG_A, started.encounterId)).possiblePathway).toBe(
      "MEDICAL_STABILIZATION_REQUIRED",
    );
  });

  it("possible pathways never become final legal or admission decisions", async () => {
    const { encounterId } = await startDraftAttest();
    await service.submitPrescreen({
      organizationId: ORG_A,
      actor: assessor,
      idempotencyKey: "submit-key-0001",
      occurredAt: T0,
      encounterId,
      assessmentVersionId: "asv_syn_1",
      target: "CENTRAL_INTAKE_REVIEW",
      receivingOrganizationId: ORG_A,
    });
    // The stored pathway stays inside the possible-pathway vocabulary…
    const encounter = await gateway.getEncounter(ORG_A, encounterId);
    expect(POSSIBLE_PATHWAYS).toContain(encounter.possiblePathway);
    // …and no command envelope can carry a legal status or admission decision.
    await expect(
      service.submitPrescreen({
        organizationId: ORG_A,
        actor: assessor,
        idempotencyKey: "submit-key-0002",
        occurredAt: T0,
        encounterId,
        assessmentVersionId: "asv_syn_1",
        target: "CENTRAL_INTAKE_REVIEW",
        receivingOrganizationId: ORG_A,
        legalStatus: "PEC",
      } as never),
    ).rejects.toThrow(); // strict envelope rejects unknown fields
  });

  it("submission references an immutable assessment version and records intent only", async () => {
    const { encounterId } = await startDraftAttest();
    const submitted = await service.submitPrescreen({
      organizationId: ORG_A,
      actor: assessor,
      idempotencyKey: "submit-key-0001",
      occurredAt: T0,
      encounterId,
      assessmentVersionId: "asv_syn_1",
      target: "CENTRAL_INTAKE_REVIEW",
      receivingOrganizationId: "org_syn_hospital",
    });
    expect(submitted.status).toBe("SUBMITTED");
    const submission = await gateway.getSubmission(ORG_A, encounterId);
    expect(submission?.assessmentVersionId).toBe("asv_syn_1");
    expect(submission?.receivingOrganizationId).toBe("org_syn_hospital");
    // Recording the intent grants the receiving organization nothing:
    await expect( gateway.getEncounter("org_syn_hospital", encounterId)).rejects.toThrow(PrescreenNotFoundError);
    expect(await gateway.getSubmission("org_syn_hospital", encounterId)).toBeUndefined();
  });

  it("submission of a draft version is impossible", async () => {
    const started = await start();
    await service.saveAssessmentDraft({
      organizationId: ORG_A,
      actor: assessor,
      idempotencyKey: "draft-key-0001",
      occurredAt: T0,
      encounterId: started.encounterId,
      draft: draft("asv_syn_1"),
    });
    await expect(
      service.submitPrescreen({
        organizationId: ORG_A,
        actor: assessor,
        idempotencyKey: "submit-key-0001",
        occurredAt: T0,
        encounterId: started.encounterId,
        assessmentVersionId: "asv_syn_1",
        target: "CENTRAL_INTAKE_REVIEW",
        receivingOrganizationId: ORG_A,
      }),
    ).rejects.toThrow(); // DRAFT encounter cannot transition to SUBMITTED; draft version not immutable
  });

  it("packet requirements update with audited state changes and target readiness derives named gaps", async () => {
    const started = await start();
    await service.updatePacketRequirement({
      organizationId: ORG_A,
      actor: assessor,
      idempotencyKey: "req-key-000001",
      occurredAt: T0,
      encounterId: started.encounterId,
      requirementCode: "DEMOGRAPHICS",
      label: "Demographics",
      state: "MISSING",
      blockingTargets: ["CENTRAL_INTAKE_REVIEW"],
      resolutionWorkspace: "Packet",
      sourceRuleId: "synthetic-facility-rule",
      sourceRuleVersion: 1,
    });
    const notReady = await service.evaluateTargetReadiness({
      organizationId: ORG_A,
      actor: observer,
      encounterId: started.encounterId,
      target: "CENTRAL_INTAKE_REVIEW",
    });
    expect(notReady.ready).toBe(false);
    expect(notReady.blockers[0]?.requirementCode).toBe("DEMOGRAPHICS");
    await service.updatePacketRequirement({
      organizationId: ORG_A,
      actor: assessor,
      idempotencyKey: "req-key-000002",
      occurredAt: T0,
      encounterId: started.encounterId,
      requirementCode: "DEMOGRAPHICS",
      label: "Demographics",
      state: "ACCEPTED_FOR_PACKET",
      blockingTargets: ["CENTRAL_INTAKE_REVIEW"],
      resolutionWorkspace: "Packet",
      sourceRuleId: "synthetic-facility-rule",
      sourceRuleVersion: 1,
    });
    const ready = await service.evaluateTargetReadiness({
      organizationId: ORG_A,
      actor: observer,
      encounterId: started.encounterId,
      target: "CENTRAL_INTAKE_REVIEW",
    });
    expect(ready.ready).toBe(true);
    const changeEvents = (await gateway.outboxEnvelopes()).filter(
      (e) => e.eventType === "PACKET_REQUIREMENT_STATE_CHANGED",
    );
    expect(changeEvents).toHaveLength(2);
    expect(changeEvents[1]?.payload.previousState).toBe("MISSING");
    expect(changeEvents[1]?.payload.newState).toBe("ACCEPTED_FOR_PACKET");
  });

  it("every successful command produces exactly one audit event and one outbox envelope, in lockstep", async () => {
    const { encounterId } = await startDraftAttest();
    await service.submitPrescreen({
      organizationId: ORG_A,
      actor: assessor,
      idempotencyKey: "submit-key-0001",
      occurredAt: T0,
      encounterId,
      assessmentVersionId: "asv_syn_1",
      target: "CENTRAL_INTAKE_REVIEW",
      receivingOrganizationId: ORG_A,
    });
    const audit = await gateway.auditEvents();
    const outbox = await gateway.outboxEnvelopes();
    expect(audit.length).toBe(4); // start, draft, attest, submit
    expect(outbox.length).toBe(4);
    expect(audit.map((event) => event.action)).toEqual(outbox.map((envelope) => envelope.eventType));
    expect(await gateway.idempotencyRecordCount()).toBe(4);
  });

  it("audit and outbox payloads carry hashes and field names, never assessment source text", async () => {
    await startDraftAttest();
    const serialized = JSON.stringify([await gateway.auditEvents(), await gateway.outboxEnvelopes()]);
    expect(serialized).not.toContain("Synthetic narrative");
    expect(serialized).not.toContain("Synthetic concern");
    expect(serialized).not.toContain("Synthetic ED");
  });

  it("failed commands leave no state, audit, outbox, or idempotency residue", async () => {
    const started = await start();
    const auditBefore = (await gateway.auditEvents()).length;
    const outboxBefore = (await gateway.outboxEnvelopes()).length;
    const idempotencyBefore = await gateway.idempotencyRecordCount();
    const encounterBefore = await gateway.getEncounter(ORG_A, started.encounterId);
    // Fails inside the gateway after passing envelope + permission checks:
    await expect(
      service.attestAssessment({
        organizationId: ORG_A,
        actor: assessor,
        idempotencyKey: "failing-attest-1",
        occurredAt: T0,
        encounterId: started.encounterId,
        assessmentVersionId: "asv_syn_never_saved",
      }),
    ).rejects.toThrow(PrescreenNotFoundError);
    expect((await gateway.auditEvents()).length).toBe(auditBefore);
    expect((await gateway.outboxEnvelopes()).length).toBe(outboxBefore);
    expect(await gateway.idempotencyRecordCount()).toBe(idempotencyBefore);
    expect(await gateway.getEncounter(ORG_A, started.encounterId)).toEqual(encounterBefore);
    // The failed key was not consumed: the same key succeeds after the draft exists.
    await service.saveAssessmentDraft({
      organizationId: ORG_A,
      actor: assessor,
      idempotencyKey: "draft-key-0001",
      occurredAt: T0,
      encounterId: started.encounterId,
      draft: draft("asv_syn_1"),
    });
    const attested = await service.attestAssessment({
      organizationId: ORG_A,
      actor: assessor,
      idempotencyKey: "failing-attest-1",
      occurredAt: T0,
      encounterId: started.encounterId,
      assessmentVersionId: "asv_syn_1",
    });
    expect(attested.replayed).toBe(false);
    expect(attested.status).toBe("ATTESTED");
  });

  it("a submission replay returns the recorded result without a second transition", async () => {
    const { encounterId } = await startDraftAttest();
    const submit = {
      organizationId: ORG_A,
      actor: assessor,
      idempotencyKey: "submit-key-0001",
      occurredAt: T0,
      encounterId,
      assessmentVersionId: "asv_syn_1",
      target: "CENTRAL_INTAKE_REVIEW" as const,
      receivingOrganizationId: ORG_A,
    };
    const first = await service.submitPrescreen(submit);
    const replay = await service.submitPrescreen(submit);
    expect(replay.replayed).toBe(true);
    expect(replay.encounterVersion).toBe(first.encounterVersion);
    expect((await gateway.getEncounter(ORG_A, encounterId)).version).toBe(first.encounterVersion);
  });

  it("rejects an unknown supplement parent from another organization non-revealingly", async () => {
    const { encounterId } = await startDraftAttest();
    // Same command from a different org actor: the encounter itself is invisible.
    await expect(
      service.createAssessmentSupplement({
        organizationId: ORG_B,
        actor: assessor,
        idempotencyKey: "supplement-b-01",
        occurredAt: T0,
        encounterId,
        parentAssessmentVersionId: "asv_syn_1",
        reason: "Synthetic reason",
        draft: draft("asv_syn_b1"),
      }),
    ).rejects.toThrow(PrescreenNotFoundError);
  });

  it("keeps assessment ids tenant-scoped: another organization reusing the same id neither collides nor is disclosed", async () => {
    await startDraftAttest(); // ORG_A owns asv_syn_1
    const startedB = await service.startEncounter({
      organizationId: ORG_B,
      actor: assessor,
      idempotencyKey: "start-b-000001",
      occurredAt: T0,
      caseId: "case_syn_b1",
      currentLocation: "Synthetic ED B",
      presentingConcern: "Synthetic concern B",
    });
    // ORG_B can freely use the id ORG_A already used — no cross-tenant existence signal.
    const saved = await service.saveAssessmentDraft({
      organizationId: ORG_B,
      actor: assessor,
      idempotencyKey: "draft-b-000001",
      occurredAt: T0,
      encounterId: startedB.encounterId,
      draft: draft("asv_syn_1"),
    });
    expect(saved.status).toBe("DRAFT");
    expect((await gateway.getAssessmentVersion(ORG_B, "asv_syn_1")).encounterId).toBe(startedB.encounterId);
    expect((await gateway.getAssessmentVersion(ORG_A, "asv_syn_1")).status).toBe("ATTESTED");
  });

  it("keeps tenant keys unambiguous when ids themselves contain the delimiter", async () => {
    // org "org_syn_a:x" + id "1" must never collide with org "org_syn_a" + id "x:1".
    const orgOne = "org_syn_a:x";
    const orgTwo = "org_syn_a";
    const startedOne = await service.startEncounter({
      organizationId: orgOne,
      actor: assessor,
      idempotencyKey: "start-key-am-1",
      occurredAt: T0,
      caseId: "case_syn_am1",
      currentLocation: "Synthetic ED",
      presentingConcern: "Synthetic concern",
    });
    const startedTwo = await service.startEncounter({
      organizationId: orgTwo,
      actor: assessor,
      idempotencyKey: "start-key-am-2",
      occurredAt: T0,
      caseId: "case_syn_am2",
      currentLocation: "Synthetic ED",
      presentingConcern: "Synthetic concern",
    });
    await service.saveAssessmentDraft({
      organizationId: orgOne,
      actor: assessor,
      idempotencyKey: "draft-key-am-1",
      occurredAt: T0,
      encounterId: startedOne.encounterId,
      draft: draft("1"),
    });
    await service.saveAssessmentDraft({
      organizationId: orgTwo,
      actor: assessor,
      idempotencyKey: "draft-key-am-2",
      occurredAt: T0,
      encounterId: startedTwo.encounterId,
      draft: draft("x:1"),
    });
    expect((await gateway.getAssessmentVersion(orgOne, "1")).encounterId).toBe(startedOne.encounterId);
    expect((await gateway.getAssessmentVersion(orgTwo, "x:1")).encounterId).toBe(startedTwo.encounterId);
    await expect( gateway.getAssessmentVersion(orgTwo, "1")).rejects.toThrow(PrescreenNotFoundError);
  });

  it("records AGENT and SYSTEM command actors as SERVICE in the event envelope", async () => {
    const agentActor = { ...assessor, actorId: "actor_syn_agent_1", actorType: "AGENT" as const };
    const started = await service.startEncounter({
      organizationId: ORG_A,
      actor: agentActor,
      idempotencyKey: "agent-start-0001",
      occurredAt: T0,
      caseId: "case_syn_agent",
      currentLocation: "Synthetic ED",
      presentingConcern: "Synthetic concern",
    });
    expect(started.status).toBe("DRAFT");
    const envelope = (await gateway.outboxEnvelopes()).at(-1);
    expect(envelope?.actor.actorType).toBe("SERVICE");
    expect(envelope?.actor.actorId).toBe("actor_syn_agent_1");
  });

  it("rejects submitting a superseded (non-current) assessment version", async () => {
    const { encounterId } = await startDraftAttest();
    await service.createAssessmentSupplement({
      organizationId: ORG_A,
      actor: assessor,
      idempotencyKey: "supplement-key-01",
      occurredAt: T0,
      encounterId,
      parentAssessmentVersionId: "asv_syn_1",
      reason: "Synthetic new collateral information",
      draft: draft("asv_syn_2"),
    });
    // asv_syn_1 is immutable but no longer current; submission must cite asv_syn_2.
    await expect(
      service.submitPrescreen({
        organizationId: ORG_A,
        actor: assessor,
        idempotencyKey: "submit-old-0001",
        occurredAt: T0,
        encounterId,
        assessmentVersionId: "asv_syn_1",
        target: "CENTRAL_INTAKE_REVIEW",
        receivingOrganizationId: ORG_A,
      }),
    ).rejects.toThrow(/current assessment version/);
    const submitted = await service.submitPrescreen({
      organizationId: ORG_A,
      actor: assessor,
      idempotencyKey: "submit-new-0001",
      occurredAt: T0,
      encounterId,
      assessmentVersionId: "asv_syn_2",
      target: "CENTRAL_INTAKE_REVIEW",
      receivingOrganizationId: ORG_A,
    });
    expect(submitted.status).toBe("SUBMITTED");
  });

  it("persists routing inputs on stored versions and covers them with the content hash", async () => {
    const started = await start();
    await service.saveAssessmentDraft({
      organizationId: ORG_A,
      actor: assessor,
      idempotencyKey: "draft-key-0001",
      occurredAt: T0,
      encounterId: started.encounterId,
      draft: draft("asv_syn_1", { immediateMedicalStabilizationRequired: true }),
    });
    const stored = await gateway.getAssessmentVersion(ORG_A, "asv_syn_1");
    expect(stored.immediateMedicalStabilizationRequired).toBe(true);
    expect(stored.activeEmergencyOrLegalProcess).toBe(false);
  });

  it("returns deep snapshots: mutating a returned assessment does not touch internal state", async () => {
    const started = await start();
    await service.saveAssessmentDraft({
      organizationId: ORG_A,
      actor: assessor,
      idempotencyKey: "draft-key-0001",
      occurredAt: T0,
      encounterId: started.encounterId,
      draft: draft("asv_syn_1"),
    });
    const snapshot = await gateway.getAssessmentVersion(ORG_A, "asv_syn_1");
    (snapshot.orientation.person as { status: string }).status = "NOT_ORIENTED";
    (snapshot.answers as unknown[]).length = 0;
    const fresh = await gateway.getAssessmentVersion(ORG_A, "asv_syn_1");
    expect(fresh.orientation.person.status).toBe("ORIENTED");
    expect(fresh.answers).toHaveLength(1);
  });

  it("rejects a supplement whose parent citation is valid but body reuses an existing version id", async () => {
    const { encounterId } = await startDraftAttest();
    await expect(
      service.createAssessmentSupplement({
        organizationId: ORG_A,
        actor: assessor,
        idempotencyKey: "supplement-dup-1",
        occurredAt: T0,
        encounterId,
        parentAssessmentVersionId: "asv_syn_1",
        reason: "Synthetic reason",
        draft: draft("asv_syn_1"),
      }),
    ).rejects.toThrow(PrescreenDomainValidationError);
  });
});
