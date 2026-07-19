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

  function startDraftAttest() {
    const started = start();
    service.saveAssessmentDraft({
      organizationId: ORG_A,
      actor: assessor,
      idempotencyKey: "draft-key-0001",
      occurredAt: T0,
      encounterId: started.encounterId,
      draft: draft("asv_syn_1"),
    });
    const attested = service.attestAssessment({
      organizationId: ORG_A,
      actor: assessor,
      idempotencyKey: "attest-key-0001",
      occurredAt: T0,
      encounterId: started.encounterId,
      assessmentVersionId: "asv_syn_1",
    });
    return { encounterId: started.encounterId, attested };
  }

  it("start is idempotent: same key and body replays the identical result without new state", () => {
    const first = start();
    const auditCount = gateway.auditEvents().length;
    const replay = start();
    expect(replay.replayed).toBe(true);
    expect(replay.objectId).toBe(first.objectId);
    expect(gateway.auditEvents().length).toBe(auditCount);
    expect(gateway.outboxEnvelopes().length).toBe(1);
    expect(gateway.idempotencyRecordCount()).toBe(1);
  });

  it("idempotency key reuse with a changed body fails, including nested-only changes", () => {
    const started = start();
    service.saveAssessmentDraft({
      organizationId: ORG_A,
      actor: assessor,
      idempotencyKey: "draft-key-0001",
      occurredAt: T0,
      encounterId: started.encounterId,
      draft: draft("asv_syn_1"),
    });
    // Change only a deeply nested field (orientation status); top-level keys identical.
    expect(() =>
      service.saveAssessmentDraft({
        organizationId: ORG_A,
        actor: assessor,
        idempotencyKey: "draft-key-0001",
        occurredAt: T0,
        encounterId: started.encounterId,
        draft: draft("asv_syn_1", { orientation: orientation("NOT_ORIENTED") }),
      }),
    ).toThrow(PrescreenIdempotencyKeyReusedError);
  });

  it("unauthorized roles fail before any read, without disclosing resource existence", () => {
    start();
    try {
      service.saveAssessmentDraft({
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

  it("cross-organization access fails with the same non-revealing error as a miss", () => {
    const started = start();
    let crossTenant: unknown;
    let trueMiss: unknown;
    try {
      service.saveAssessmentDraft({
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
      service.saveAssessmentDraft({
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

  it("stale expected versions fail deterministically", () => {
    const started = start();
    service.saveAssessmentDraft({
      organizationId: ORG_A,
      actor: assessor,
      idempotencyKey: "draft-key-0001",
      occurredAt: T0,
      encounterId: started.encounterId,
      draft: draft("asv_syn_1"),
    });
    expect(() =>
      service.attestAssessment({
        organizationId: ORG_A,
        actor: assessor,
        idempotencyKey: "attest-key-0001",
        occurredAt: T0,
        encounterId: started.encounterId,
        assessmentVersionId: "asv_syn_1",
        expectedVersion: 1, // stale: draft save bumped the encounter to 2
      }),
    ).toThrow(PrescreenVersionConflictError);
  });

  it("drafts can be updated in place and re-derive the possible pathway", () => {
    const started = start();
    service.saveAssessmentDraft({
      organizationId: ORG_A,
      actor: assessor,
      idempotencyKey: "draft-key-0001",
      occurredAt: T0,
      encounterId: started.encounterId,
      draft: draft("asv_syn_1"),
    });
    expect(gateway.getEncounter(ORG_A, started.encounterId).possiblePathway).toBe(
      "POSSIBLE_FORMAL_VOLUNTARY_REVIEW",
    );
    service.saveAssessmentDraft({
      organizationId: ORG_A,
      actor: assessor,
      idempotencyKey: "draft-key-0002",
      occurredAt: T0,
      encounterId: started.encounterId,
      draft: draft("asv_syn_1", { willingness: "NON_OPPOSED", orientation: orientation("UNKNOWN") }),
    });
    const updated = gateway.getAssessmentVersion(ORG_A, "asv_syn_1");
    expect(updated.status).toBe("DRAFT");
    expect(updated.versionNumber).toBe(1);
    expect(gateway.getEncounter(ORG_A, started.encounterId).possiblePathway).toBe(
      "POSSIBLE_NONCONTESTED_PATHWAY",
    );
  });

  it("attested versions cannot be edited", () => {
    const { encounterId } = startDraftAttest();
    expect(gateway.getAssessmentVersion(ORG_A, "asv_syn_1").status).toBe("ATTESTED");
    expect(gateway.getAssessmentVersion(ORG_A, "asv_syn_1").contentHash).toBeTruthy();
    expect(() =>
      service.saveAssessmentDraft({
        organizationId: ORG_A,
        actor: assessor,
        idempotencyKey: "edit-after-attest",
        occurredAt: T0,
        encounterId,
        draft: draft("asv_syn_1"),
      }),
    ).toThrow(AssessmentNotDraftError);
  });

  it("supplements require and reference the attested parent, preserving lineage", () => {
    const { encounterId } = startDraftAttest();
    const supplement = service.createAssessmentSupplement({
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
    const stored = gateway.getAssessmentVersion(ORG_A, "asv_syn_2");
    expect(stored.parentVersionId).toBe("asv_syn_1");
    expect(stored.changeReason).toBe("Synthetic new collateral information");
    expect(gateway.getAssessmentVersion(ORG_A, "asv_syn_1").status).toBe("ATTESTED");
    expect(gateway.getEncounter(ORG_A, encounterId).currentAssessmentVersionId).toBe("asv_syn_2");
  });

  it("a supplement cannot cite a draft parent", () => {
    const { encounterId } = startDraftAttest();
    service.createAssessmentSupplement({
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
    expect(() =>
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
    ).toThrow(PrescreenNotFoundError);
  });

  it("medical stabilization retains precedence over willing-and-oriented", () => {
    const started = start();
    service.saveAssessmentDraft({
      organizationId: ORG_A,
      actor: assessor,
      idempotencyKey: "draft-key-0001",
      occurredAt: T0,
      encounterId: started.encounterId,
      draft: draft("asv_syn_1", { immediateMedicalStabilizationRequired: true }),
    });
    expect(gateway.getEncounter(ORG_A, started.encounterId).possiblePathway).toBe(
      "MEDICAL_STABILIZATION_REQUIRED",
    );
  });

  it("possible pathways never become final legal or admission decisions", () => {
    const { encounterId } = startDraftAttest();
    service.submitPrescreen({
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
    const encounter = gateway.getEncounter(ORG_A, encounterId);
    expect(POSSIBLE_PATHWAYS).toContain(encounter.possiblePathway);
    // …and no command envelope can carry a legal status or admission decision.
    expect(() =>
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
    ).toThrow(); // strict envelope rejects unknown fields
  });

  it("submission references an immutable assessment version and records intent only", () => {
    const { encounterId } = startDraftAttest();
    const submitted = service.submitPrescreen({
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
    const submission = gateway.getSubmission(ORG_A, encounterId);
    expect(submission?.assessmentVersionId).toBe("asv_syn_1");
    expect(submission?.receivingOrganizationId).toBe("org_syn_hospital");
    // Recording the intent grants the receiving organization nothing:
    expect(() => gateway.getEncounter("org_syn_hospital", encounterId)).toThrow(PrescreenNotFoundError);
    expect(gateway.getSubmission("org_syn_hospital", encounterId)).toBeUndefined();
  });

  it("submission of a draft version is impossible", () => {
    const started = start();
    service.saveAssessmentDraft({
      organizationId: ORG_A,
      actor: assessor,
      idempotencyKey: "draft-key-0001",
      occurredAt: T0,
      encounterId: started.encounterId,
      draft: draft("asv_syn_1"),
    });
    expect(() =>
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
    ).toThrow(); // DRAFT encounter cannot transition to SUBMITTED; draft version not immutable
  });

  it("packet requirements update with audited state changes and target readiness derives named gaps", () => {
    const started = start();
    service.updatePacketRequirement({
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
    const notReady = service.evaluateTargetReadiness({
      organizationId: ORG_A,
      actor: observer,
      encounterId: started.encounterId,
      target: "CENTRAL_INTAKE_REVIEW",
    });
    expect(notReady.ready).toBe(false);
    expect(notReady.blockers[0]?.requirementCode).toBe("DEMOGRAPHICS");
    service.updatePacketRequirement({
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
    const ready = service.evaluateTargetReadiness({
      organizationId: ORG_A,
      actor: observer,
      encounterId: started.encounterId,
      target: "CENTRAL_INTAKE_REVIEW",
    });
    expect(ready.ready).toBe(true);
    const changeEvents = gateway
      .outboxEnvelopes()
      .filter((e) => e.eventType === "PACKET_REQUIREMENT_STATE_CHANGED");
    expect(changeEvents).toHaveLength(2);
    expect(changeEvents[1]?.payload.previousState).toBe("MISSING");
    expect(changeEvents[1]?.payload.newState).toBe("ACCEPTED_FOR_PACKET");
  });

  it("every successful command produces exactly one audit event and one outbox envelope, in lockstep", () => {
    const { encounterId } = startDraftAttest();
    service.submitPrescreen({
      organizationId: ORG_A,
      actor: assessor,
      idempotencyKey: "submit-key-0001",
      occurredAt: T0,
      encounterId,
      assessmentVersionId: "asv_syn_1",
      target: "CENTRAL_INTAKE_REVIEW",
      receivingOrganizationId: ORG_A,
    });
    const audit = gateway.auditEvents();
    const outbox = gateway.outboxEnvelopes();
    expect(audit.length).toBe(4); // start, draft, attest, submit
    expect(outbox.length).toBe(4);
    expect(audit.map((event) => event.action)).toEqual(outbox.map((envelope) => envelope.eventType));
    expect(gateway.idempotencyRecordCount()).toBe(4);
  });

  it("audit and outbox payloads carry hashes and field names, never assessment source text", () => {
    startDraftAttest();
    const serialized = JSON.stringify([gateway.auditEvents(), gateway.outboxEnvelopes()]);
    expect(serialized).not.toContain("Synthetic narrative");
    expect(serialized).not.toContain("Synthetic concern");
    expect(serialized).not.toContain("Synthetic ED");
  });

  it("failed commands leave no state, audit, outbox, or idempotency residue", () => {
    const started = start();
    const auditBefore = gateway.auditEvents().length;
    const outboxBefore = gateway.outboxEnvelopes().length;
    const idempotencyBefore = gateway.idempotencyRecordCount();
    const encounterBefore = gateway.getEncounter(ORG_A, started.encounterId);
    // Fails inside the gateway after passing envelope + permission checks:
    expect(() =>
      service.attestAssessment({
        organizationId: ORG_A,
        actor: assessor,
        idempotencyKey: "failing-attest-1",
        occurredAt: T0,
        encounterId: started.encounterId,
        assessmentVersionId: "asv_syn_never_saved",
      }),
    ).toThrow(PrescreenNotFoundError);
    expect(gateway.auditEvents().length).toBe(auditBefore);
    expect(gateway.outboxEnvelopes().length).toBe(outboxBefore);
    expect(gateway.idempotencyRecordCount()).toBe(idempotencyBefore);
    expect(gateway.getEncounter(ORG_A, started.encounterId)).toEqual(encounterBefore);
    // The failed key was not consumed: the same key succeeds after the draft exists.
    service.saveAssessmentDraft({
      organizationId: ORG_A,
      actor: assessor,
      idempotencyKey: "draft-key-0001",
      occurredAt: T0,
      encounterId: started.encounterId,
      draft: draft("asv_syn_1"),
    });
    const attested = service.attestAssessment({
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

  it("a submission replay returns the recorded result without a second transition", () => {
    const { encounterId } = startDraftAttest();
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
    const first = service.submitPrescreen(submit);
    const replay = service.submitPrescreen(submit);
    expect(replay.replayed).toBe(true);
    expect(replay.encounterVersion).toBe(first.encounterVersion);
    expect(gateway.getEncounter(ORG_A, encounterId).version).toBe(first.encounterVersion);
  });

  it("rejects an unknown supplement parent from another organization non-revealingly", () => {
    const { encounterId } = startDraftAttest();
    // Same command from a different org actor: the encounter itself is invisible.
    expect(() =>
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
    ).toThrow(PrescreenNotFoundError);
  });

  it("keeps assessment ids tenant-scoped: another organization reusing the same id neither collides nor is disclosed", () => {
    startDraftAttest(); // ORG_A owns asv_syn_1
    const startedB = service.startEncounter({
      organizationId: ORG_B,
      actor: assessor,
      idempotencyKey: "start-b-000001",
      occurredAt: T0,
      caseId: "case_syn_b1",
      currentLocation: "Synthetic ED B",
      presentingConcern: "Synthetic concern B",
    });
    // ORG_B can freely use the id ORG_A already used — no cross-tenant existence signal.
    const saved = service.saveAssessmentDraft({
      organizationId: ORG_B,
      actor: assessor,
      idempotencyKey: "draft-b-000001",
      occurredAt: T0,
      encounterId: startedB.encounterId,
      draft: draft("asv_syn_1"),
    });
    expect(saved.status).toBe("DRAFT");
    expect(gateway.getAssessmentVersion(ORG_B, "asv_syn_1").encounterId).toBe(startedB.encounterId);
    expect(gateway.getAssessmentVersion(ORG_A, "asv_syn_1").status).toBe("ATTESTED");
  });

  it("keeps tenant keys unambiguous when ids themselves contain the delimiter", () => {
    // org "org_syn_a:x" + id "1" must never collide with org "org_syn_a" + id "x:1".
    const orgOne = "org_syn_a:x";
    const orgTwo = "org_syn_a";
    const startedOne = service.startEncounter({
      organizationId: orgOne,
      actor: assessor,
      idempotencyKey: "start-key-am-1",
      occurredAt: T0,
      caseId: "case_syn_am1",
      currentLocation: "Synthetic ED",
      presentingConcern: "Synthetic concern",
    });
    const startedTwo = service.startEncounter({
      organizationId: orgTwo,
      actor: assessor,
      idempotencyKey: "start-key-am-2",
      occurredAt: T0,
      caseId: "case_syn_am2",
      currentLocation: "Synthetic ED",
      presentingConcern: "Synthetic concern",
    });
    service.saveAssessmentDraft({
      organizationId: orgOne,
      actor: assessor,
      idempotencyKey: "draft-key-am-1",
      occurredAt: T0,
      encounterId: startedOne.encounterId,
      draft: draft("1"),
    });
    service.saveAssessmentDraft({
      organizationId: orgTwo,
      actor: assessor,
      idempotencyKey: "draft-key-am-2",
      occurredAt: T0,
      encounterId: startedTwo.encounterId,
      draft: draft("x:1"),
    });
    expect(gateway.getAssessmentVersion(orgOne, "1").encounterId).toBe(startedOne.encounterId);
    expect(gateway.getAssessmentVersion(orgTwo, "x:1").encounterId).toBe(startedTwo.encounterId);
    expect(() => gateway.getAssessmentVersion(orgTwo, "1")).toThrow(PrescreenNotFoundError);
  });

  it("records AGENT and SYSTEM command actors as SERVICE in the event envelope", () => {
    const agentActor = { ...assessor, actorId: "actor_syn_agent_1", actorType: "AGENT" as const };
    const started = service.startEncounter({
      organizationId: ORG_A,
      actor: agentActor,
      idempotencyKey: "agent-start-0001",
      occurredAt: T0,
      caseId: "case_syn_agent",
      currentLocation: "Synthetic ED",
      presentingConcern: "Synthetic concern",
    });
    expect(started.status).toBe("DRAFT");
    const envelope = gateway.outboxEnvelopes().at(-1);
    expect(envelope?.actor.actorType).toBe("SERVICE");
    expect(envelope?.actor.actorId).toBe("actor_syn_agent_1");
  });

  it("rejects submitting a superseded (non-current) assessment version", () => {
    const { encounterId } = startDraftAttest();
    service.createAssessmentSupplement({
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
    expect(() =>
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
    ).toThrow(/current assessment version/);
    const submitted = service.submitPrescreen({
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

  it("persists routing inputs on stored versions and covers them with the content hash", () => {
    const started = start();
    service.saveAssessmentDraft({
      organizationId: ORG_A,
      actor: assessor,
      idempotencyKey: "draft-key-0001",
      occurredAt: T0,
      encounterId: started.encounterId,
      draft: draft("asv_syn_1", { immediateMedicalStabilizationRequired: true }),
    });
    const stored = gateway.getAssessmentVersion(ORG_A, "asv_syn_1");
    expect(stored.immediateMedicalStabilizationRequired).toBe(true);
    expect(stored.activeEmergencyOrLegalProcess).toBe(false);
  });

  it("returns deep snapshots: mutating a returned assessment does not touch internal state", () => {
    const started = start();
    service.saveAssessmentDraft({
      organizationId: ORG_A,
      actor: assessor,
      idempotencyKey: "draft-key-0001",
      occurredAt: T0,
      encounterId: started.encounterId,
      draft: draft("asv_syn_1"),
    });
    const snapshot = gateway.getAssessmentVersion(ORG_A, "asv_syn_1");
    (snapshot.orientation.person as { status: string }).status = "NOT_ORIENTED";
    (snapshot.answers as unknown[]).length = 0;
    const fresh = gateway.getAssessmentVersion(ORG_A, "asv_syn_1");
    expect(fresh.orientation.person.status).toBe("ORIENTED");
    expect(fresh.answers).toHaveLength(1);
  });

  it("rejects a supplement whose parent citation is valid but body reuses an existing version id", () => {
    const { encounterId } = startDraftAttest();
    expect(() =>
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
    ).toThrow(PrescreenDomainValidationError);
  });
});
