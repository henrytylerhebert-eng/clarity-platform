import { createHash } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaCaseRepository, PrismaDocumentGateway } from "@clarity/case-repository";
import {
  CaseNotFoundError,
  DocumentCommandService,
  DocumentConcurrencyConflictError,
  DocumentNotFoundError,
  PermissionDeniedError,
  RationaleRequiredError,
} from "@clarity/document-service";
import { DOCUMENT_AUDIT_ACTIONS } from "@clarity/document-service";
import type { UserRole } from "@clarity/domain-contracts";
import { createHarness, tickingClock, TEST_ACTOR, type Harness } from "./helpers/harness.js";

let h: Harness;
let caseRepo: PrismaCaseRepository;
let service: DocumentCommandService;

type Actor = { actorId: string; actorType: "USER"; roles: UserRole[] };

const actor = (roles: UserRole[], id = "synthetic-actor"): Actor => ({
  actorId: id,
  actorType: "USER",
  roles,
});
const intake = actor(["INTAKE_COORDINATOR"], "syn-intake");
const clinical = actor(["CLINICAL_REVIEWER"], "syn-clinical");
const auditor = actor(["READ_ONLY_AUDITOR"], "syn-auditor");
const sysAdmin = actor(["SYSTEM_ADMIN"], "syn-sysadmin");

function bytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function sha256(content: Uint8Array): string {
  return createHash("sha256").update(content).digest("hex");
}

async function createCase(suffix: string) {
  return caseRepo.create(h.tenantA.organizationId, h.makeCaseData(h.tenantA, suffix), TEST_ACTOR);
}

function uploadInput(caseId: string, overrides: Record<string, unknown> = {}) {
  return {
    organizationId: h.tenantA.organizationId,
    caseId,
    actor: intake,
    documentType: "EMERGENCY_DEPARTMENT_NOTE" as const,
    filename: "ed-note.pdf",
    mimeType: "application/pdf",
    content: bytes("synthetic ED note content"),
    ...overrides,
  };
}

beforeAll(async () => {
  h = await createHarness();
  caseRepo = new PrismaCaseRepository(h.prisma, undefined, tickingClock());
  service = new DocumentCommandService(new PrismaDocumentGateway(h.prisma, undefined, tickingClock()));
});
afterAll(async () => h?.dispose());

describe("upload", () => {
  it("creates a PENDING document at version 1 and records DOCUMENT_UPLOADED", async () => {
    const key = h.caseKey("doc-upload");
    await createCase("doc-upload");
    const content = bytes("synthetic referral form content");
    const result = await service.uploadDocument(uploadInput(key, { content, documentType: "REFERRAL_FORM" }));

    expect(result.duplicate).toBe(false);
    expect(result.document.classificationStatus).toBe("PENDING");
    expect(result.document.version).toBe(1);
    expect(result.document.sha256).toBe(sha256(content));
    expect(result.document.caseId).toBe(key);
    expect(result.document.organizationId).toBe(h.tenantA.organizationId);

    const events = await h.prisma.auditEvent.findMany({
      where: { organizationId: h.tenantA.organizationId, caseId: key, action: DOCUMENT_AUDIT_ACTIONS.UploadDocument },
    });
    expect(events).toHaveLength(1);
    expect(events[0]!.objectId).toBe(result.document.documentId);
    expect(events[0]!.objectType).toBe("SourceDocument");
    expect(events[0]!.modelMetadata).toMatchObject({ command: "UploadDocument", duplicate: false });
  });

  it("case-ownership check: uploading against a nonexistent or foreign case fails without writing", async () => {
    await expect(
      service.uploadDocument(uploadInput(h.caseKey("doc-missing-case"))),
    ).rejects.toBeInstanceOf(CaseNotFoundError);

    const bTenant = await h.createTenant("doc-b");
    const bCase = await caseRepo.create(bTenant.organizationId, h.makeCaseData(bTenant, "doc-cross-tenant"), TEST_ACTOR);
    await expect(
      service.uploadDocument(uploadInput(bCase.caseKey)), // organizationId is tenant A, case belongs to tenant B
    ).rejects.toBeInstanceOf(CaseNotFoundError);
    const count = await h.prisma.sourceDocument.count({ where: { caseId: bCase.caseKey } });
    expect(count).toBe(0);
  });

  it("detects a duplicate by SHA-256: identical bytes reuse the existing row and audit the attempt", async () => {
    const key = h.caseKey("doc-dup");
    await createCase("doc-dup");
    const content = bytes("synthetic duplicate-prone content");
    const first = await service.uploadDocument(uploadInput(key, { content }));
    const second = await service.uploadDocument(uploadInput(key, { content, filename: "resubmitted.pdf" }));

    expect(second.duplicate).toBe(true);
    expect(second.document.documentId).toBe(first.document.documentId);
    const rowCount = await h.prisma.sourceDocument.count({ where: { caseId: key } });
    expect(rowCount).toBe(1);

    const events = await h.prisma.auditEvent.findMany({
      where: { organizationId: h.tenantA.organizationId, caseId: key, action: DOCUMENT_AUDIT_ACTIONS.UploadDocument },
      orderBy: [{ timestamp: "asc" }, { id: "asc" }],
    });
    expect(events).toHaveLength(2);
    expect(events[1]!.modelMetadata).toMatchObject({ duplicate: true, existingDocumentId: first.document.documentId });
  });

  it("different content for the same case produces a second distinct document", async () => {
    const key = h.caseKey("doc-distinct");
    await createCase("doc-distinct");
    const a = await service.uploadDocument(uploadInput(key, { content: bytes("content A") }));
    const b = await service.uploadDocument(uploadInput(key, { content: bytes("content B") }));
    expect(a.document.documentId).not.toBe(b.document.documentId);
    const rowCount = await h.prisma.sourceDocument.count({ where: { caseId: key } });
    expect(rowCount).toBe(2);
  });

  it("permission enforcement: read-only auditors and platform admins cannot upload", async () => {
    const key = h.caseKey("doc-perm-upload");
    await createCase("doc-perm-upload");
    await expect(
      service.uploadDocument(uploadInput(key, { actor: auditor })),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    await expect(
      service.uploadDocument(uploadInput(key, { actor: sysAdmin })),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});

describe("classification", () => {
  async function uploadFixture(suffix: string) {
    const key = h.caseKey(suffix);
    await createCase(suffix);
    const uploaded = await service.uploadDocument(uploadInput(key, { content: bytes(`content-${suffix}`) }));
    return { key, documentId: uploaded.document.documentId };
  }

  it("valid transitions succeed and record DOCUMENT_CLASSIFIED", async () => {
    const { key, documentId } = await uploadFixture("doc-classify-valid");
    const classified = await service.classifyDocument({
      organizationId: h.tenantA.organizationId,
      caseId: key,
      documentId,
      actor: clinical,
      to: "CLASSIFIED",
    });
    expect(classified.classificationStatus).toBe("CLASSIFIED");

    const events = await h.prisma.auditEvent.findMany({
      where: { organizationId: h.tenantA.organizationId, caseId: key, action: DOCUMENT_AUDIT_ACTIONS.ClassifyDocument },
    });
    expect(events).toHaveLength(1);
    expect(events[0]!.modelMetadata).toMatchObject({ from: "PENDING", to: "CLASSIFIED" });
  });

  it("invalid transitions are rejected and change nothing", async () => {
    const { key, documentId } = await uploadFixture("doc-classify-invalid");
    await expect(
      service.classifyDocument({
        organizationId: h.tenantA.organizationId,
        caseId: key,
        documentId,
        actor: clinical,
        to: "CLASSIFIED",
      }),
    ).resolves.toMatchObject({ classificationStatus: "CLASSIFIED" });
    // CLASSIFIED cannot jump straight back to PENDING.
    await expect(
      service.classifyDocument({
        organizationId: h.tenantA.organizationId,
        caseId: key,
        documentId,
        actor: clinical,
        to: "PENDING",
      }),
    ).rejects.toThrow(/Invalid document classification transition/);
    const row = await h.prisma.sourceDocument.findUnique({ where: { id: documentId } });
    expect(row?.classificationStatus).toBe("CLASSIFIED");
  });

  it("REJECTED requires rationale and is terminal", async () => {
    const { key, documentId } = await uploadFixture("doc-classify-rejected");
    await expect(
      service.classifyDocument({
        organizationId: h.tenantA.organizationId,
        caseId: key,
        documentId,
        actor: clinical,
        to: "REJECTED",
      }),
    ).rejects.toBeInstanceOf(RationaleRequiredError);

    const rejected = await service.classifyDocument({
      organizationId: h.tenantA.organizationId,
      caseId: key,
      documentId,
      actor: clinical,
      to: "REJECTED",
      reason: "synthetic illegible scan",
    });
    expect(rejected.classificationStatus).toBe("REJECTED");

    await expect(
      service.classifyDocument({
        organizationId: h.tenantA.organizationId,
        caseId: key,
        documentId,
        actor: clinical,
        to: "NEEDS_REVIEW",
      }),
    ).rejects.toThrow(/Invalid document classification transition/);
  });

  it("a stale expectedClassificationStatus fails safely; first writer wins", async () => {
    const { key, documentId } = await uploadFixture("doc-classify-race");
    await service.classifyDocument({
      organizationId: h.tenantA.organizationId,
      caseId: key,
      documentId,
      actor: clinical,
      to: "NEEDS_REVIEW",
      expectedClassificationStatus: "PENDING",
    });
    await expect(
      service.classifyDocument({
        organizationId: h.tenantA.organizationId,
        caseId: key,
        documentId,
        actor: clinical,
        to: "CLASSIFIED",
        expectedClassificationStatus: "PENDING", // stale: it's NEEDS_REVIEW now
      }),
    ).rejects.toBeInstanceOf(DocumentConcurrencyConflictError);
    const row = await h.prisma.sourceDocument.findUnique({ where: { id: documentId } });
    expect(row?.classificationStatus).toBe("NEEDS_REVIEW");
  });

  it("permission enforcement: read-only auditors cannot classify", async () => {
    const { key, documentId } = await uploadFixture("doc-classify-perm");
    await expect(
      service.classifyDocument({
        organizationId: h.tenantA.organizationId,
        caseId: key,
        documentId,
        actor: auditor,
        to: "CLASSIFIED",
      }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
  });

  it("classifying a document that does not exist for the case fails without revealing more", async () => {
    const key = h.caseKey("doc-classify-missing");
    await createCase("doc-classify-missing");
    await expect(
      service.classifyDocument({
        organizationId: h.tenantA.organizationId,
        caseId: key,
        documentId: "nonexistent-doc-id",
        actor: clinical,
        to: "CLASSIFIED",
      }),
    ).rejects.toBeInstanceOf(DocumentNotFoundError);
  });
});

describe("access", () => {
  it("returns the original bytes and records DOCUMENT_ACCESSED, even for a read-only auditor", async () => {
    const key = h.caseKey("doc-access");
    await createCase("doc-access");
    const content = bytes("synthetic access-tracked content");
    const uploaded = await service.uploadDocument(uploadInput(key, { content }));

    const accessed = await service.accessDocument({
      organizationId: h.tenantA.organizationId,
      caseId: key,
      documentId: uploaded.document.documentId,
      actor: auditor,
      reason: "synthetic compliance spot-check",
    });
    expect(Buffer.from(accessed.content).toString()).toBe("synthetic access-tracked content");

    const events = await h.prisma.auditEvent.findMany({
      where: { organizationId: h.tenantA.organizationId, caseId: key, action: DOCUMENT_AUDIT_ACTIONS.AccessDocument },
    });
    expect(events).toHaveLength(1);
    expect(events[0]!.actorId).toBe("syn-auditor");
    expect(events[0]!.reason).toBe("synthetic compliance spot-check");
  });

  it("permission enforcement: platform admins cannot access document content", async () => {
    const key = h.caseKey("doc-access-perm");
    await createCase("doc-access-perm");
    const uploaded = await service.uploadDocument(uploadInput(key));
    await expect(
      service.accessDocument({
        organizationId: h.tenantA.organizationId,
        caseId: key,
        documentId: uploaded.document.documentId,
        actor: sysAdmin,
      }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
  });

  it("tenant B cannot access tenant A's document", async () => {
    const key = h.caseKey("doc-access-tenant");
    await createCase("doc-access-tenant");
    const uploaded = await service.uploadDocument(uploadInput(key));
    await expect(
      service.accessDocument({
        organizationId: h.tenantB.organizationId,
        caseId: key,
        documentId: uploaded.document.documentId,
        actor: intake,
      }),
    ).rejects.toBeInstanceOf(CaseNotFoundError);
  });
});
