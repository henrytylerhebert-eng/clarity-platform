import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  PrismaCaseAuditWriter,
  PrismaCaseRepository,
  PrismaDocumentGateway,
  PrismaEvidenceGateway,
  type CaseAuditWriter,
} from "@clarity/case-repository";
import { DocumentCommandService } from "@clarity/document-service";
import {
  CaseNotFoundError,
  ContradictionMembershipError,
  EvidenceCommandService,
  EvidenceConcurrencyConflictError,
  EvidenceNotFoundError,
  EvidenceStateError,
  PermissionDeniedError,
  EVIDENCE_AUDIT_ACTIONS,
} from "@clarity/evidence-service";
import type { UserRole } from "@clarity/domain-contracts";
import { createHarness, tickingClock, TEST_ACTOR, type Harness } from "./helpers/harness.js";

/** Human review, concurrency/idempotency, and contradiction groups (ADR-0008). */

let h: Harness;
let caseRepo: PrismaCaseRepository;
let documents: DocumentCommandService;
let service: EvidenceCommandService;

type Actor = { actorId: string; actorType: "USER"; roles: UserRole[] };
const intake: Actor = { actorId: "syn-intake", actorType: "USER", roles: ["INTAKE_COORDINATOR"] };
const clinical: Actor = { actorId: "syn-clinical", actorType: "USER", roles: ["CLINICAL_REVIEWER"] };
const legal: Actor = { actorId: "syn-legal", actorType: "USER", roles: ["LEGAL_REVIEWER"] };
const benefits: Actor = {
  actorId: "syn-benefits",
  actorType: "USER",
  roles: ["BENEFITS_VERIFICATION_SPECIALIST"],
};

const bytes = (text: string) => new TextEncoder().encode(text);

async function fixture(suffix: string) {
  const caseKey = h.caseKey(suffix);
  await caseRepo.create(h.tenantA.organizationId, h.makeCaseData(h.tenantA, suffix), TEST_ACTOR);
  const upload = await documents.uploadDocument({
    organizationId: h.tenantA.organizationId,
    caseId: caseKey,
    actor: intake,
    documentType: "PSYCHIATRIC_EVALUATION",
    filename: "psych-eval.pdf",
    mimeType: "application/pdf",
    content: bytes(`synthetic psych eval for ${suffix}`),
  });
  return { caseKey, documentId: upload.document.documentId };
}

async function createEvidence(
  caseKey: string,
  documentId: string,
  extra: Record<string, unknown> = {},
) {
  const result = await service.createCandidateEvidence({
    organizationId: h.tenantA.organizationId,
    caseId: caseKey,
    documentId,
    actor: intake,
    category: "SUICIDE_RISK",
    originalText: "Patient denied suicidal ideation at 10:15 AM.",
    ...extra,
  });
  return result.evidence;
}

function target<T extends Record<string, unknown>>(caseKey: string, evidenceId: string, extra?: T) {
  return {
    organizationId: h.tenantA.organizationId,
    caseId: caseKey,
    evidenceId,
    actor: clinical,
    ...(extra as T),
  };
}

beforeAll(async () => {
  h = await createHarness();
  caseRepo = new PrismaCaseRepository(h.prisma, undefined, tickingClock());
  documents = new DocumentCommandService(new PrismaDocumentGateway(h.prisma, undefined, tickingClock()));
  service = new EvidenceCommandService(new PrismaEvidenceGateway(h.prisma, undefined, tickingClock()));
});
afterAll(async () => h?.dispose());

describe("human review lifecycle", () => {
  it("domain reviewer approves; approval stamps reviewer and is audited exactly once", async () => {
    const { caseKey, documentId } = await fixture("rv-approve");
    const e = await createEvidence(caseKey, documentId);
    const approved = await service.approveEvidence(
      target(caseKey, e.evidenceId, { reviewerNote: "consistent with nursing narrative" }),
    );
    expect(approved.evidence.status).toBe("APPROVED");
    expect(approved.evidence.reviewedBy).toBe("syn-clinical");
    expect(approved.evidence.reviewedAt).not.toBeNull();
    expect(approved.evidence.originalText).toBe(e.originalText); // untouched by review
    const events = await h.prisma.auditEvent.count({
      where: { caseId: caseKey, action: EVIDENCE_AUDIT_ACTIONS.ApproveEvidence },
    });
    expect(events).toBe(1);
  });

  it("approval is domain-scoped: wrong-domain reviewers and non-reviewers are rejected", async () => {
    const { caseKey, documentId } = await fixture("rv-domain");
    const clinicalItem = await createEvidence(caseKey, documentId); // SUICIDE_RISK
    // Legal reviewer cannot approve clinical evidence; benefits cannot either; intake cannot.
    for (const actor of [legal, benefits, intake]) {
      await expect(
        service.approveEvidence(target(caseKey, clinicalItem.evidenceId, { actor })),
      ).rejects.toBeInstanceOf(PermissionDeniedError);
    }
    // And a clinical reviewer cannot approve INSURANCE evidence.
    const insuranceItem = await createEvidence(caseKey, documentId, {
      category: "INSURANCE",
      originalText: "Member card lists synthetic payer group 001.",
      actor: benefits,
    });
    await expect(
      service.approveEvidence(target(caseKey, insuranceItem.evidenceId, { actor: clinical })),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    const ok = await service.approveEvidence(
      target(caseKey, insuranceItem.evidenceId, { actor: benefits }),
    );
    expect(ok.evidence.status).toBe("APPROVED");
  });

  it("rejection requires rationale; clarification requires a note; both audited with status flow", async () => {
    const { caseKey, documentId } = await fixture("rv-reject");
    const e1 = await createEvidence(caseKey, documentId);
    await expect(
      service.rejectEvidence(target(caseKey, e1.evidenceId) as never), // missing reason: schema rejects
    ).rejects.toThrow();
    const rejected = await service.rejectEvidence(
      target(caseKey, e1.evidenceId, { reason: "synthetic: not supported by the cited page" }),
    );
    expect(rejected.evidence.status).toBe("REJECTED");

    const e2 = await createEvidence(caseKey, documentId);
    await expect(
      service.requestEvidenceClarification(target(caseKey, e2.evidenceId) as never),
    ).rejects.toThrow();
    const clarify = await service.requestEvidenceClarification(
      target(caseKey, e2.evidenceId, { note: "which nursing shift documented this?" }),
    );
    expect(clarify.evidence.status).toBe("NEEDS_CLARIFICATION");
    expect(clarify.evidence.reviewerNote).toBe("which nursing shift documented this?");
  });

  it("correction updates interpretation only, returns clarification items to CANDIDATE, and cannot touch approved evidence", async () => {
    const { caseKey, documentId } = await fixture("rv-correct");
    const e = await createEvidence(caseKey, documentId, {
      normalizedValue: { sleepDurationHoursPerNight: { min: 4, max: 6 } },
    });
    await service.requestEvidenceClarification(
      target(caseKey, e.evidenceId, { note: "narrative says four nights without sleep" }),
    );
    const corrected = await service.correctCandidateEvidence({
      ...target(caseKey, e.evidenceId, { actor: intake }),
      normalizedValue: { sleepDurationHoursPerNight: { min: 0, max: 2 } },
      reviewerNote: "approximate value derived from narrative; source does not give exact hours",
    });
    expect(corrected.evidence.status).toBe("CANDIDATE"); // back in the review queue
    expect(corrected.evidence.normalizedValue).toEqual({
      sleepDurationHoursPerNight: { min: 0, max: 2 },
    });
    // Source fact vs. interpretation: the original text is byte-identical.
    expect(corrected.evidence.originalText).toBe("Patient denied suicidal ideation at 10:15 AM.");

    const correctionEvents = await h.prisma.auditEvent.findMany({
      where: { caseId: caseKey, action: EVIDENCE_AUDIT_ACTIONS.CorrectCandidateEvidence },
    });
    expect(correctionEvents).toHaveLength(1);
    expect(correctionEvents[0]!.modelMetadata).toMatchObject({
      changedFields: ["normalizedValue", "reviewerNote"],
      fromStatus: "NEEDS_CLARIFICATION",
    });

    // Approved evidence rejects correction outright.
    await service.approveEvidence(target(caseKey, e.evidenceId));
    await expect(
      service.correctCandidateEvidence({
        ...target(caseKey, e.evidenceId, { actor: intake }),
        normalizedValue: { anything: true },
      }),
    ).rejects.toBeInstanceOf(EvidenceStateError);
  });

  it("supersession freezes the approved original, creates a linked CANDIDATE in the same family, and audits both", async () => {
    const { caseKey, documentId } = await fixture("rv-supersede");
    const e = await createEvidence(caseKey, documentId);
    await service.approveEvidence(target(caseKey, e.evidenceId));

    const result = await service.supersedeEvidence(
      target(caseKey, e.evidenceId, {
        reason: "later documentation contradicts the morning denial",
        replacement: {
          documentId,
          category: "SUICIDE_RISK",
          originalText: "Patient reported active suicidal intent at 12:40 PM.",
        },
      }),
    );
    expect(result.superseded.status).toBe("SUPERSEDED");
    expect(result.superseded.supersededById).toBe(result.replacement.evidenceId);
    expect(result.superseded.originalText).toBe("Patient denied suicidal ideation at 10:15 AM."); // frozen
    expect(result.replacement.status).toBe("CANDIDATE"); // supersession never grants approval
    expect(result.replacement.evidenceFamilyId).toBe(e.evidenceFamilyId); // correction chain

    const supersededEvents = await h.prisma.auditEvent.count({
      where: { caseId: caseKey, action: EVIDENCE_AUDIT_ACTIONS.SupersedeEvidence },
    });
    expect(supersededEvents).toBe(1);

    // The frozen record stays retrievable and terminal.
    await expect(
      service.approveEvidence(target(caseKey, e.evidenceId)),
    ).rejects.toBeInstanceOf(EvidenceStateError);

    // Superseding requires the domain reviewer, not just any creator.
    await expect(
      service.supersedeEvidence(
        target(caseKey, result.replacement.evidenceId, {
          actor: intake,
          reason: "x",
          replacement: { documentId, category: "SUICIDE_RISK", originalText: "y" },
        }),
      ),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});

describe("concurrency and idempotency", () => {
  it("a stale expectedVersion fails safely; the row is unchanged", async () => {
    const { caseKey, documentId } = await fixture("cc-stale");
    const e = await createEvidence(caseKey, documentId);
    await service.correctCandidateEvidence({
      ...target(caseKey, e.evidenceId, { actor: intake }),
      reviewerNote: "first pass",
    }); // v1
    await expect(
      service.approveEvidence(target(caseKey, e.evidenceId, { expectedVersion: 0 })),
    ).rejects.toBeInstanceOf(EvidenceConcurrencyConflictError);
    const row = await h.prisma.evidenceItem.findUnique({ where: { id: e.evidenceId } });
    expect(row?.status).toBe("CANDIDATE");
    expect(row?.version).toBe(1);
  });

  it("same-version race: exactly one writer wins", async () => {
    const { caseKey, documentId } = await fixture("cc-race");
    const e = await createEvidence(caseKey, documentId);
    const results = await Promise.allSettled([
      service.approveEvidence(target(caseKey, e.evidenceId, { expectedVersion: 0 })),
      service.rejectEvidence(
        target(caseKey, e.evidenceId, { expectedVersion: 0, reason: "synthetic race" }),
      ),
    ]);
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    const row = await h.prisma.evidenceItem.findUnique({ where: { id: e.evidenceId } });
    expect(row?.version).toBe(1); // exactly one mutation landed
  });

  it("idempotent approval replays without a second audit event or version bump", async () => {
    const { caseKey, documentId } = await fixture("cc-idem-approve");
    const e = await createEvidence(caseKey, documentId);
    const key = `syn-ev-approve-${h.runId}`;
    const first = await service.approveEvidence(
      target(caseKey, e.evidenceId, { idempotencyKey: key }),
    );
    const replay = await service.approveEvidence(
      target(caseKey, e.evidenceId, { idempotencyKey: key }),
    );
    expect(replay.replayed).toBe(true);
    expect(replay.evidence.version).toBe(first.evidence.version);
    expect(
      await h.prisma.auditEvent.count({
        where: { caseId: caseKey, action: EVIDENCE_AUDIT_ACTIONS.ApproveEvidence },
      }),
    ).toBe(1);
  });

  it("a failed audit write rolls back the evidence mutation and the idempotency record; retry succeeds", async () => {
    const { caseKey, documentId } = await fixture("cc-rollback");
    const e = await createEvidence(caseKey, documentId);
    const key = `syn-ev-rollback-${h.runId}`;

    const real = new PrismaCaseAuditWriter();
    let failNext = true;
    const flaky: CaseAuditWriter = {
      write: async (tx, record) => {
        if (failNext && record.action === EVIDENCE_AUDIT_ACTIONS.ApproveEvidence) {
          failNext = false;
          throw new Error("synthetic audit outage");
        }
        return real.write(tx, record);
      },
    };
    const flakyService = new EvidenceCommandService(
      new PrismaEvidenceGateway(h.prisma, flaky, tickingClock()),
    );
    await expect(
      flakyService.approveEvidence(target(caseKey, e.evidenceId, { idempotencyKey: key })),
    ).rejects.toThrow(/synthetic audit outage/);

    const row = await h.prisma.evidenceItem.findUnique({ where: { id: e.evidenceId } });
    expect(row?.status).toBe("CANDIDATE"); // mutation rolled back
    expect(row?.version).toBe(0);
    const idem = await h.prisma.commandIdempotencyRecord.findUnique({
      where: {
        organizationId_idempotencyKey: { organizationId: h.tenantA.organizationId, idempotencyKey: key },
      },
    });
    expect(idem).toBeNull(); // rolled back too — a real retry re-executes

    const retry = await flakyService.approveEvidence(
      target(caseKey, e.evidenceId, { idempotencyKey: key }),
    );
    expect(retry.replayed).toBe(false);
    expect(retry.evidence.status).toBe("APPROVED");
  });
});

describe("contradiction groups", () => {
  it("groups same-case evidence, classifies as a temporal change, and changes NO member's status", async () => {
    const { caseKey, documentId } = await fixture("cg-basic");
    const a = await createEvidence(caseKey, documentId); // "denied at 10:15 AM"
    const b = await createEvidence(caseKey, documentId, {
      originalText: "Patient reported active suicidal intent at 12:40 PM.",
    });
    await service.approveEvidence(target(caseKey, a.evidenceId));

    const group = await service.createContradictionGroup({
      organizationId: h.tenantA.organizationId,
      caseId: caseKey,
      actor: clinical,
      evidenceIds: [a.evidenceId, b.evidenceId],
    });
    expect([...group.evidenceIds].sort()).toEqual([a.evidenceId, b.evidenceId].sort());
    expect(group.classification).toBeNull(); // grouping records the conflict, not a verdict

    const resolved = await service.resolveContradictionReview({
      organizationId: h.tenantA.organizationId,
      caseId: caseKey,
      groupId: group.groupId,
      actor: clinical,
      classification: "TEMPORAL_CHANGE",
      reviewNote: "risk state changed between morning and midday assessments",
    });
    expect(resolved.classification).toBe("TEMPORAL_CHANGE");

    // Neither item was approved, rejected, or erased by grouping/classification.
    const rows = await h.prisma.evidenceItem.findMany({
      where: { id: { in: [a.evidenceId, b.evidenceId] } },
    });
    expect(rows.map((r) => r.status).sort()).toEqual(["APPROVED", "CANDIDATE"]);

    const auditActions = (
      await h.prisma.auditEvent.findMany({
        where: { caseId: caseKey, objectType: "ContradictionGroup" },
        orderBy: [{ timestamp: "asc" }],
      })
    ).map((event) => event.action);
    expect(auditActions).toEqual([
      EVIDENCE_AUDIT_ACTIONS.CreateContradictionGroup,
      EVIDENCE_AUDIT_ACTIONS.ResolveContradictionReview,
    ]);
  });

  it("membership can grow via the audited add command; double-membership is rejected", async () => {
    const { caseKey, documentId } = await fixture("cg-add");
    const a = await createEvidence(caseKey, documentId);
    const b = await createEvidence(caseKey, documentId, { originalText: "conflicting statement B" });
    const c = await createEvidence(caseKey, documentId, { originalText: "conflicting statement C" });
    const group = await service.createContradictionGroup({
      organizationId: h.tenantA.organizationId,
      caseId: caseKey,
      actor: clinical,
      evidenceIds: [a.evidenceId, b.evidenceId],
    });
    const grown = await service.addEvidenceToContradictionGroup({
      organizationId: h.tenantA.organizationId,
      caseId: caseKey,
      groupId: group.groupId,
      evidenceId: c.evidenceId,
      actor: clinical,
    });
    expect(grown.evidenceIds).toHaveLength(3);
    await expect(
      service.addEvidenceToContradictionGroup({
        organizationId: h.tenantA.organizationId,
        caseId: caseKey,
        groupId: group.groupId,
        evidenceId: c.evidenceId,
        actor: clinical,
      }),
    ).rejects.toBeInstanceOf(ContradictionMembershipError);
    expect(
      await h.prisma.auditEvent.count({
        where: { caseId: caseKey, action: EVIDENCE_AUDIT_ACTIONS.AddEvidenceToContradictionGroup },
      }),
    ).toBe(1);
  });

  it("rejects duplicate evidence ids: a one-member 'contradiction' cannot be created", async () => {
    const { caseKey, documentId } = await fixture("cg-dup-ids");
    const a = await createEvidence(caseKey, documentId);
    await expect(
      service.createContradictionGroup({
        organizationId: h.tenantA.organizationId,
        caseId: caseKey,
        actor: clinical,
        evidenceIds: [a.evidenceId, a.evidenceId],
      }),
    ).rejects.toThrow(/must be distinct/);
    expect(await h.prisma.contradictionGroup.count({ where: { caseId: caseKey } })).toBe(0);
  });

  it("concurrent group creations over the same item produce exactly one group", async () => {
    const { caseKey, documentId } = await fixture("cg-race");
    const shared = await createEvidence(caseKey, documentId);
    const b = await createEvidence(caseKey, documentId, { originalText: "statement B" });
    const c = await createEvidence(caseKey, documentId, { originalText: "statement C" });

    const groupCmd = (other: string) =>
      service.createContradictionGroup({
        organizationId: h.tenantA.organizationId,
        caseId: caseKey,
        actor: clinical,
        evidenceIds: [shared.evidenceId, other],
      });
    const results = await Promise.allSettled([groupCmd(b.evidenceId), groupCmd(c.evidenceId)]);
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    expect(fulfilled).toHaveLength(1); // exactly one winner; the loser rolled back entirely

    // No orphaned group row from the losing transaction, and the shared item
    // belongs to exactly the winner's group.
    expect(await h.prisma.contradictionGroup.count({ where: { caseId: caseKey } })).toBe(1);
    const sharedRow = await h.prisma.evidenceItem.findUnique({ where: { id: shared.evidenceId } });
    expect(sharedRow?.contradictionGroupId).not.toBeNull();
    const groupedCount = await h.prisma.evidenceItem.count({
      where: { caseId: caseKey, contradictionGroupId: { not: null } },
    });
    expect(groupedCount).toBe(2); // winner's pair only; loser's partner untouched
  });

  it("cross-case and cross-tenant grouping fail without revealing existence", async () => {
    const one = await fixture("cg-cross-1");
    const two = await fixture("cg-cross-2");
    const e1 = await createEvidence(one.caseKey, one.documentId);
    const e2 = await createEvidence(two.caseKey, two.documentId);
    // Same tenant, different case: the foreign item is a non-revealing miss.
    await expect(
      service.createContradictionGroup({
        organizationId: h.tenantA.organizationId,
        caseId: one.caseKey,
        actor: clinical,
        evidenceIds: [e1.evidenceId, e2.evidenceId],
      }),
    ).rejects.toBeInstanceOf(EvidenceNotFoundError);

    // Tenant B's reviewer cannot group tenant A's evidence.
    await expect(
      service.createContradictionGroup({
        organizationId: h.tenantB.organizationId,
        caseId: one.caseKey,
        actor: clinical,
        evidenceIds: [e1.evidenceId, e2.evidenceId],
      }),
    ).rejects.toBeInstanceOf(CaseNotFoundError);
    expect(await h.prisma.contradictionGroup.count({ where: { caseId: one.caseKey } })).toBe(0);
  });
});
