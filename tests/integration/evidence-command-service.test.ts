import { createHash } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  PrismaCaseRepository,
  PrismaDocumentGateway,
  PrismaEvidenceGateway,
} from "@clarity/case-repository";
import { DocumentCommandService } from "@clarity/document-service";
import {
  CaseNotFoundError,
  DocumentNotFoundError,
  EvidenceCommandService,
  EvidenceNotFoundError,
  PermissionDeniedError,
  RejectedSourceDocumentError,
  EVIDENCE_AUDIT_ACTIONS,
} from "@clarity/evidence-service";
import type { UserRole } from "@clarity/domain-contracts";
import { createHarness, tickingClock, TEST_ACTOR, type Harness } from "./helpers/harness.js";

/**
 * Evidence creation, source integrity, and tenant isolation (ADR-0008).
 * Everything is human-driven synthetic data against local clarity_dev.
 */

let h: Harness;
let caseRepo: PrismaCaseRepository;
let documents: DocumentCommandService;
let service: EvidenceCommandService;

type Actor = { actorId: string; actorType: "USER"; roles: UserRole[] };
const intake: Actor = { actorId: "syn-intake", actorType: "USER", roles: ["INTAKE_COORDINATOR"] };
const clinical: Actor = { actorId: "syn-clinical", actorType: "USER", roles: ["CLINICAL_REVIEWER"] };
const auditor: Actor = { actorId: "syn-auditor", actorType: "USER", roles: ["READ_ONLY_AUDITOR"] };
const sysAdmin: Actor = { actorId: "syn-sys-admin", actorType: "USER", roles: ["SYSTEM_ADMIN"] };

const bytes = (text: string) => new TextEncoder().encode(text);
const sha256hex = (text: string) => createHash("sha256").update(text).digest("hex");

/** Creates a case + one PENDING document in the given tenant; returns ids. */
async function fixture(suffix: string, tenant = h.tenantA) {
  const caseKey = h.caseKey(suffix);
  await caseRepo.create(tenant.organizationId, h.makeCaseData(tenant, suffix), TEST_ACTOR);
  const upload = await documents.uploadDocument({
    organizationId: tenant.organizationId,
    caseId: caseKey,
    actor: intake,
    documentType: "EMERGENCY_DEPARTMENT_NOTE",
    filename: "ed-note.pdf",
    mimeType: "application/pdf",
    content: bytes(`synthetic ed note for ${suffix}`),
  });
  return { caseKey, documentId: upload.document.documentId };
}

function createInput(caseKey: string, documentId: string, extra: Record<string, unknown> = {}) {
  return {
    organizationId: h.tenantA.organizationId,
    caseId: caseKey,
    documentId,
    actor: intake,
    category: "SUICIDE_RISK" as const,
    originalText: "Patient reports no sleep for approximately four nights.",
    pageNumber: 2,
    sectionLabel: "Nursing narrative",
    ...extra,
  };
}

beforeAll(async () => {
  h = await createHarness();
  caseRepo = new PrismaCaseRepository(h.prisma, undefined, tickingClock());
  documents = new DocumentCommandService(new PrismaDocumentGateway(h.prisma, undefined, tickingClock()));
  service = new EvidenceCommandService(new PrismaEvidenceGateway(h.prisma, undefined, tickingClock()));
});
afterAll(async () => h?.dispose());

describe("candidate evidence creation", () => {
  it("creates CANDIDATE evidence linked to the exact document version, preserving source text, audited", async () => {
    const { caseKey, documentId } = await fixture("ev-create");
    const result = await service.createCandidateEvidence(
      createInput(caseKey, documentId, {
        normalizedValue: { sleepDurationHoursPerNight: { min: 0, max: 2 } },
      }),
    );
    expect(result.replayed).toBe(false);
    const e = result.evidence;
    expect(e.status).toBe("CANDIDATE"); // never approved at creation
    expect(e.version).toBe(0);
    expect(e.documentId).toBe(documentId); // exact SourceDocument row = exact version
    expect(e.originalText).toBe("Patient reports no sleep for approximately four nights.");
    expect(e.creationMethod).toBe("HUMAN_ENTRY");
    expect(e.extractionConfidence).toBeNull(); // reserved for future automation
    expect(e.createdBy).toBe("syn-intake");
    expect(e.evidenceFamilyId).toBe(e.evidenceId); // own family root

    const events = await h.prisma.auditEvent.findMany({
      where: {
        organizationId: h.tenantA.organizationId,
        caseId: caseKey,
        action: EVIDENCE_AUDIT_ACTIONS.CreateCandidateEvidence,
      },
    });
    expect(events).toHaveLength(1);
    expect(events[0]!.objectType).toBe("EvidenceItem");
    // Audit carries a hash reference, never the source text itself.
    expect(events[0]!.modelMetadata).toMatchObject({
      category: "SUICIDE_RISK",
      originalTextSha256: sha256hex("Patient reports no sleep for approximately four nights."),
    });
    expect(JSON.stringify(events[0]!.modelMetadata)).not.toContain("four nights");
  });

  it("unauthorized roles cannot create; auditor, compliance-style, and platform admin all rejected", async () => {
    const { caseKey, documentId } = await fixture("ev-create-perm");
    for (const actor of [auditor, sysAdmin]) {
      await expect(
        service.createCandidateEvidence(createInput(caseKey, documentId, { actor })),
      ).rejects.toBeInstanceOf(PermissionDeniedError);
    }
    expect(await h.prisma.evidenceItem.count({ where: { caseId: caseKey } })).toBe(0);
  });

  it("evidence cannot cite a REJECTED-classification document", async () => {
    const { caseKey, documentId } = await fixture("ev-rejected-doc");
    await documents.classifyDocument({
      organizationId: h.tenantA.organizationId,
      caseId: caseKey,
      documentId,
      actor: intake,
      to: "REJECTED",
      reason: "synthetic illegible upload",
    });
    await expect(
      service.createCandidateEvidence(createInput(caseKey, documentId)),
    ).rejects.toBeInstanceOf(RejectedSourceDocumentError);
  });

  it("evidence cannot reference a document belonging to a DIFFERENT case in the same tenant", async () => {
    const a = await fixture("ev-doc-case-a");
    const b = await fixture("ev-doc-case-b");
    await expect(
      service.createCandidateEvidence(createInput(a.caseKey, b.documentId)),
    ).rejects.toBeInstanceOf(DocumentNotFoundError);
  });

  it("idempotent replay returns the same item without a second row or audit event", async () => {
    const { caseKey, documentId } = await fixture("ev-idem");
    const key = `syn-ev-idem-${h.runId}`;
    const first = await service.createCandidateEvidence(
      createInput(caseKey, documentId, { idempotencyKey: key }),
    );
    const replay = await service.createCandidateEvidence(
      createInput(caseKey, documentId, { idempotencyKey: key }),
    );
    expect(replay.replayed).toBe(true);
    expect(replay.evidence.evidenceId).toBe(first.evidence.evidenceId);
    expect(await h.prisma.evidenceItem.count({ where: { caseId: caseKey } })).toBe(1);
    expect(
      await h.prisma.auditEvent.count({
        where: { caseId: caseKey, action: EVIDENCE_AUDIT_ACTIONS.CreateCandidateEvidence },
      }),
    ).toBe(1);
  });
});

describe("tenant isolation", () => {
  it("tenant A cannot create evidence on tenant B's case or against tenant B's document", async () => {
    const b = await fixture("ev-iso-b", h.tenantB);
    // A's caller identity against B's case: scoped case read fails.
    await expect(
      service.createCandidateEvidence(createInput(b.caseKey, b.documentId)),
    ).rejects.toBeInstanceOf(CaseNotFoundError);

    // A's own case, but B's document attached: scoped document read fails.
    const a = await fixture("ev-iso-a");
    await expect(
      service.createCandidateEvidence(createInput(a.caseKey, b.documentId)),
    ).rejects.toBeInstanceOf(DocumentNotFoundError);
    expect(await h.prisma.evidenceItem.count({ where: { caseId: b.caseKey } })).toBe(0);
  });

  it("cross-tenant read, approval, and supersession are non-revealing misses; B's evidence untouched", async () => {
    const b = await fixture("ev-iso-target", h.tenantB);
    const created = await service.createCandidateEvidence({
      ...createInput(b.caseKey, b.documentId),
      organizationId: h.tenantB.organizationId,
    });
    const evidenceId = created.evidence.evidenceId;

    const asTenantA = {
      organizationId: h.tenantA.organizationId,
      caseId: b.caseKey,
      evidenceId,
    };
    await expect(
      service.approveEvidence({ ...asTenantA, actor: clinical }),
    ).rejects.toBeInstanceOf(EvidenceNotFoundError);
    await expect(
      service.rejectEvidence({ ...asTenantA, actor: clinical, reason: "x" }),
    ).rejects.toBeInstanceOf(EvidenceNotFoundError);
    await expect(
      service.supersedeEvidence({
        ...asTenantA,
        actor: clinical,
        reason: "x",
        replacement: {
          documentId: b.documentId,
          category: "SUICIDE_RISK",
          originalText: "attempted cross-tenant replacement",
        },
      }),
    ).rejects.toBeInstanceOf(EvidenceNotFoundError);

    const row = await h.prisma.evidenceItem.findUnique({ where: { id: evidenceId } });
    expect(row?.status).toBe("CANDIDATE");
    expect(row?.version).toBe(0);
  });
});
