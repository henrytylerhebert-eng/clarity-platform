import { createHash } from "node:crypto";
import { rm } from "node:fs/promises";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  PrismaCaseAuditWriter,
  PrismaCaseRepository,
  PrismaDocumentGateway,
  type CaseAuditWriter,
} from "@clarity/case-repository";
import {
  CaseNotFoundError,
  DocumentCommandService,
  DocumentValidationError,
  DocumentValidationPolicy,
  DuplicateDocumentContentError,
  InvalidStorageKeyError,
  LocalFilesystemObjectStorage,
  PermissionDeniedError,
  DOCUMENT_AUDIT_ACTIONS,
} from "@clarity/document-service";
import type { UserRole } from "@clarity/domain-contracts";
import { createHarness, tickingClock, TEST_ACTOR, type Harness } from "./helpers/harness.js";

/**
 * Phase-5 hardening coverage: filesystem storage adapter, file validation,
 * versioning, and storage/database failure compensation (ADR-0007).
 */

let h: Harness;
let caseRepo: PrismaCaseRepository;
let storage: LocalFilesystemObjectStorage;
let storageRoot: string;
let service: DocumentCommandService;

type Actor = { actorId: string; actorType: "USER"; roles: UserRole[] };
const intake: Actor = { actorId: "syn-intake", actorType: "USER", roles: ["INTAKE_COORDINATOR"] };
const auditor: Actor = { actorId: "syn-auditor", actorType: "USER", roles: ["READ_ONLY_AUDITOR"] };

const bytes = (text: string) => new TextEncoder().encode(text);
const sha256hex = (content: Uint8Array) => createHash("sha256").update(content).digest("hex");

function uploadInput(caseId: string, overrides: Record<string, unknown> = {}) {
  return {
    organizationId: h.tenantA.organizationId,
    caseId,
    actor: intake,
    documentType: "EMERGENCY_DEPARTMENT_NOTE" as const,
    filename: "ed-note.pdf",
    mimeType: "application/pdf",
    content: bytes("synthetic hardening content"),
    ...overrides,
  };
}

async function createCase(suffix: string) {
  return caseRepo.create(h.tenantA.organizationId, h.makeCaseData(h.tenantA, suffix), TEST_ACTOR);
}

beforeAll(async () => {
  h = await createHarness();
  caseRepo = new PrismaCaseRepository(h.prisma, undefined, tickingClock());
  storageRoot = path.resolve(".local-object-storage", `vitest-${h.runId}`);
  storage = new LocalFilesystemObjectStorage(storageRoot);
  service = new DocumentCommandService(new PrismaDocumentGateway(h.prisma, undefined, tickingClock()), storage);
});
afterAll(async () => {
  await rm(storageRoot, { recursive: true, force: true });
  await h?.dispose();
});

describe("local filesystem storage adapter", () => {
  it("round-trips bytes through the filesystem with an opaque content-addressed key", async () => {
    const key = h.caseKey("fs-roundtrip");
    await createCase("fs-roundtrip");
    const content = bytes("filesystem-backed synthetic content");
    const result = await service.uploadDocument(uploadInput(key, { content }));

    // Key shape: `${caseId}/${sha256}` — no user-controlled filename anywhere.
    expect(result.document.storageKey).toBe(`${key}/${sha256hex(content)}`);
    expect(result.document.fileSizeBytes).toBe(content.byteLength);
    expect(await storage.exists(result.document.storageKey)).toBe(true);

    const accessed = await service.accessDocument({
      organizationId: h.tenantA.organizationId,
      caseId: key,
      documentId: result.document.documentId,
      actor: intake,
    });
    expect(Buffer.from(accessed.content).toString()).toBe("filesystem-backed synthetic content");
  });

  it("rejects traversal-shaped and malformed storage keys outright", async () => {
    await expect(storage.get("../../etc/passwd")).rejects.toBeInstanceOf(InvalidStorageKeyError);
    await expect(storage.get("a/../b")).rejects.toBeInstanceOf(InvalidStorageKeyError);
    await expect(storage.get("/etc/passwd")).rejects.toBeInstanceOf(InvalidStorageKeyError);
    await expect(storage.get("only-one-segment")).rejects.toBeInstanceOf(InvalidStorageKeyError);
    await expect(storage.get(`case/${"z".repeat(64)}`)).rejects.toBeInstanceOf(InvalidStorageKeyError); // not hex
    await expect(storage.put("../escape", bytes("x"))).rejects.toBeInstanceOf(InvalidStorageKeyError);
  });

  it("delete is idempotent and exists reflects state", async () => {
    const stored = await storage.put("synthetic-case-adapter-test", bytes("deletable"));
    expect(await storage.exists(stored.storageKey)).toBe(true);
    await storage.delete(stored.storageKey);
    expect(await storage.exists(stored.storageKey)).toBe(false);
    await storage.delete(stored.storageKey); // second delete: no throw
  });
});

describe("file validation policy", () => {
  async function expectRejected(suffix: string, overrides: Record<string, unknown>, code: string) {
    const key = h.caseKey(suffix);
    await expect(service.uploadDocument(uploadInput(key, overrides))).rejects.toMatchObject({
      name: "DocumentValidationError",
      code,
    });
    // Rejected before any storage or database access: no rows, no audit.
    const rows = await h.prisma.sourceDocument.count({ where: { caseId: key } });
    expect(rows).toBe(0);
    const events = await h.prisma.auditEvent.count({
      where: { organizationId: h.tenantA.organizationId, caseId: key },
    });
    expect(events).toBe(0);
  }

  it("rejects an empty file", async () => {
    await expectRejected("val-empty", { content: new Uint8Array(0) }, "EMPTY_FILE");
  });

  it("rejects an oversized file (configurable limit)", async () => {
    const tiny = new DocumentCommandService(
      new PrismaDocumentGateway(h.prisma, undefined, tickingClock()),
      storage,
      new DocumentValidationPolicy({
        maxFileSizeBytes: 8,
        allowedMimeTypes: { "application/pdf": ["pdf"] },
      }),
    );
    await expect(
      tiny.uploadDocument(uploadInput(h.caseKey("val-size"), { content: bytes("way past eight bytes") })),
    ).rejects.toMatchObject({ code: "FILE_TOO_LARGE" });
  });

  it("rejects a disallowed MIME type", async () => {
    await expectRejected(
      "val-mime",
      { mimeType: "application/zip", filename: "archive.zip" },
      "MIME_TYPE_NOT_ALLOWED",
    );
  });

  it("rejects a MIME/extension mismatch", async () => {
    await expectRejected("val-ext", { mimeType: "application/pdf", filename: "note.png" }, "EXTENSION_MISMATCH");
  });

  it("rejects unsafe filenames (traversal, separators, control characters)", async () => {
    await expectRejected("val-name-1", { filename: "../../escape.pdf" }, "UNSAFE_FILENAME");
    await expectRejected("val-name-2", { filename: "dir/inside.pdf" }, "UNSAFE_FILENAME");
    await expectRejected("val-name-3", { filename: "null\u0000byte.pdf" }, "UNSAFE_FILENAME");
  });

  it("DocumentValidationError is exported and carries the machine-readable code", () => {
    const err = new DocumentValidationError("x", "EMPTY_FILE");
    expect(err.code).toBe("EMPTY_FILE");
  });
});

describe("versioning", () => {
  it("a new version preserves the prior version, increments, keeps per-version checksums, and is audited", async () => {
    const key = h.caseKey("ver-basic");
    await createCase("ver-basic");
    const v1Content = bytes("original synthetic report");
    const v1 = await service.uploadDocument(uploadInput(key, { content: v1Content }));

    const v2Content = bytes("corrected synthetic report");
    const v2 = await service.createDocumentVersion({
      organizationId: h.tenantA.organizationId,
      caseId: key,
      documentId: v1.document.documentId,
      filename: "ed-note-corrected.pdf",
      mimeType: "application/pdf",
      content: v2Content,
      actor: intake,
      reason: "synthetic correction of transcription error",
    });

    expect(v2.version).toBe(2);
    expect(v2.documentFamilyId).toBe(v1.document.documentFamilyId);
    expect(v2.documentId).not.toBe(v1.document.documentId);
    expect(v2.sha256).toBe(sha256hex(v2Content));

    // Prior version row and bytes are intact.
    const v1Row = await h.prisma.sourceDocument.findUnique({ where: { id: v1.document.documentId } });
    expect(v1Row?.version).toBe(1);
    expect(v1Row?.sha256).toBe(sha256hex(v1Content));
    expect(Buffer.from(await storage.get(v1.document.storageKey)).toString()).toBe(
      "original synthetic report",
    );

    const events = await h.prisma.auditEvent.findMany({
      where: {
        organizationId: h.tenantA.organizationId,
        caseId: key,
        action: DOCUMENT_AUDIT_ACTIONS.CreateDocumentVersion,
      },
    });
    expect(events).toHaveLength(1);
    expect(events[0]!.modelMetadata).toMatchObject({
      previousDocumentId: v1.document.documentId,
      previousVersion: 1,
      version: 2,
      documentFamilyId: v1.document.documentFamilyId,
    });
    expect(events[0]!.reason).toBe("synthetic correction of transcription error");
  });

  it("a new version with identical bytes is rejected and the family is unchanged", async () => {
    const key = h.caseKey("ver-dup");
    await createCase("ver-dup");
    const content = bytes("identical bytes");
    const v1 = await service.uploadDocument(uploadInput(key, { content }));
    await expect(
      service.createDocumentVersion({
        organizationId: h.tenantA.organizationId,
        caseId: key,
        documentId: v1.document.documentId,
        filename: "same.pdf",
        mimeType: "application/pdf",
        content,
        actor: intake,
        reason: "synthetic no-op",
      }),
    ).rejects.toBeInstanceOf(DuplicateDocumentContentError);
    const rows = await h.prisma.sourceDocument.count({ where: { caseId: key } });
    expect(rows).toBe(1);
  });

  it("versioning requires a rationale (schema) and upload roles (policy)", async () => {
    const key = h.caseKey("ver-guards");
    await createCase("ver-guards");
    const v1 = await service.uploadDocument(uploadInput(key));
    const versionCmd = {
      organizationId: h.tenantA.organizationId,
      caseId: key,
      documentId: v1.document.documentId,
      filename: "fix.pdf",
      mimeType: "application/pdf",
      content: bytes("different bytes"),
    };
    await expect(
      service.createDocumentVersion({ ...versionCmd, actor: intake } as never),
    ).rejects.toThrow(); // Zod: missing reason
    await expect(
      service.createDocumentVersion({ ...versionCmd, actor: auditor, reason: "x" }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
  });

  it("tenant B cannot version tenant A's document; prior version intact", async () => {
    const key = h.caseKey("ver-tenant");
    await createCase("ver-tenant");
    const v1 = await service.uploadDocument(uploadInput(key));
    await expect(
      service.createDocumentVersion({
        organizationId: h.tenantB.organizationId,
        caseId: key,
        documentId: v1.document.documentId,
        filename: "steal.pdf",
        mimeType: "application/pdf",
        content: bytes("cross tenant bytes"),
        actor: intake,
        reason: "x",
      }),
    ).rejects.toBeInstanceOf(CaseNotFoundError);
    const rows = await h.prisma.sourceDocument.count({ where: { caseId: key } });
    expect(rows).toBe(1);
  });
});

describe("failure compensation", () => {
  /** Audit writer that fails only the named actions, passing others through. */
  function failingFor(...actions: string[]): CaseAuditWriter {
    const real = new PrismaCaseAuditWriter();
    return {
      write: async (tx, record) => {
        if (actions.includes(record.action)) throw new Error("synthetic audit outage");
        return real.write(tx, record);
      },
    };
  }

  /** Storage adapter whose put always fails after the base adapter is bypassed. */
  const brokenStorage = {
    put: async () => {
      throw new Error("synthetic storage outage");
    },
    get: (k: string) => storage.get(k),
    delete: (k: string) => storage.delete(k),
    exists: (k: string) => storage.exists(k),
  };

  it("a storage failure writes no metadata and no success audit event", async () => {
    const key = h.caseKey("comp-storage");
    await createCase("comp-storage");
    const broken = new DocumentCommandService(
      new PrismaDocumentGateway(h.prisma, undefined, tickingClock()),
      brokenStorage,
    );
    await expect(broken.uploadDocument(uploadInput(key))).rejects.toThrow(/synthetic storage outage/);
    expect(await h.prisma.sourceDocument.count({ where: { caseId: key } })).toBe(0);
    expect(
      await h.prisma.auditEvent.count({
        // CASE_CREATED from the fixture is expected; no DOCUMENT_* event may exist.
        where: { organizationId: h.tenantA.organizationId, caseId: key, action: { startsWith: "DOCUMENT_" } },
      }),
    ).toBe(0);
  });

  it("a failed metadata/audit transaction deletes the stored object and audits the failure + cleanup", async () => {
    const key = h.caseKey("comp-metadata");
    await createCase("comp-metadata");
    const failing = new DocumentCommandService(
      new PrismaDocumentGateway(h.prisma, failingFor(DOCUMENT_AUDIT_ACTIONS.UploadDocument), tickingClock()),
      storage,
    );
    const content = bytes("bytes that must not survive");
    await expect(failing.uploadDocument(uploadInput(key, { content }))).rejects.toThrow(
      /synthetic audit outage/,
    );

    expect(await h.prisma.sourceDocument.count({ where: { caseId: key } })).toBe(0);
    expect(await storage.exists(`${key}/${sha256hex(content)}`)).toBe(false);

    const actions = (
      await h.prisma.auditEvent.findMany({
        where: { organizationId: h.tenantA.organizationId, caseId: key, action: { startsWith: "DOCUMENT_" } },
        orderBy: [{ timestamp: "asc" }, { id: "asc" }],
      })
    ).map((e) => e.action);
    expect(actions).toEqual([
      DOCUMENT_AUDIT_ACTIONS.UploadFailed,
      DOCUMENT_AUDIT_ACTIONS.StorageCleanupCompleted,
    ]);
  });

  it("compensation never deletes an object a committed row still references", async () => {
    const key = h.caseKey("comp-shared");
    await createCase("comp-shared");
    const content = bytes("shared duplicate bytes");
    const original = await service.uploadDocument(uploadInput(key, { content })); // committed row

    // Retry of the same bytes whose duplicate-audit write fails: the tx rolls
    // back, but the object is shared with the committed original row.
    const failing = new DocumentCommandService(
      new PrismaDocumentGateway(h.prisma, failingFor(DOCUMENT_AUDIT_ACTIONS.UploadDocument), tickingClock()),
      storage,
    );
    await expect(failing.uploadDocument(uploadInput(key, { content }))).rejects.toThrow(
      /synthetic audit outage/,
    );

    expect(await storage.exists(original.document.storageKey)).toBe(true); // bytes survived
    const accessed = await service.accessDocument({
      organizationId: h.tenantA.organizationId,
      caseId: key,
      documentId: original.document.documentId,
      actor: intake,
    });
    expect(Buffer.from(accessed.content).toString()).toBe("shared duplicate bytes");
  });

  it("a cross-tenant upload attempt cleans its own object, writes no audit rows, and cannot touch the victim's bytes", async () => {
    // Victim (tenant B, via its own service) owns a document.
    const bCase = await caseRepo.create(
      h.tenantB.organizationId,
      h.makeCaseData(h.tenantB, "comp-victim"),
      TEST_ACTOR,
    );
    const victimContent = bytes("victim tenant bytes");
    const victim = await service.uploadDocument({
      ...uploadInput(bCase.caseKey, { content: victimContent }),
      organizationId: h.tenantB.organizationId,
    });

    // Attacker (tenant A) tries to upload the SAME bytes to the victim's case.
    await expect(
      service.uploadDocument(uploadInput(bCase.caseKey, { content: victimContent })),
    ).rejects.toBeInstanceOf(CaseNotFoundError);

    // The victim's object survived (it is referenced by a committed row) and
    // no audit rows were attached to the foreign case by the failed attempt
    // beyond the victim's own upload event.
    expect(await storage.exists(victim.document.storageKey)).toBe(true);
    const events = await h.prisma.auditEvent.findMany({
      where: { caseId: bCase.caseKey, action: { startsWith: "DOCUMENT_" } },
    });
    expect(events.map((e) => e.action)).toEqual([DOCUMENT_AUDIT_ACTIONS.UploadDocument]);
  });
});

describe("audit safety", () => {
  it("audit metadata sanitizes filenames and never contains bytes or classification text", async () => {
    const key = h.caseKey("audit-safety");
    await createCase("audit-safety");
    const content = bytes("PRIVATE-SYNTHETIC-BYTES-SHOULD-NOT-APPEAR");
    const uploaded = await service.uploadDocument(
      uploadInput(key, { content, filename: "doe jane dob 1990.pdf" }),
    );
    await service.accessDocument({
      organizationId: h.tenantA.organizationId,
      caseId: key,
      documentId: uploaded.document.documentId,
      actor: intake,
      accessMode: "DOWNLOAD",
    });

    const events = await h.prisma.auditEvent.findMany({
      where: { organizationId: h.tenantA.organizationId, caseId: key },
    });
    expect(events.length).toBeGreaterThanOrEqual(2);
    for (const event of events) {
      const flat = JSON.stringify(event.modelMetadata ?? {});
      expect(flat).not.toContain("PRIVATE-SYNTHETIC-BYTES");
      expect(flat).not.toContain("doe jane dob 1990.pdf"); // raw filename never appears
    }
    const access = events.find((e) => e.action === DOCUMENT_AUDIT_ACTIONS.AccessDocument)!;
    expect(access.modelMetadata).toMatchObject({ accessMode: "DOWNLOAD", filename: "doe_jane_dob_1990.pdf" });
  });
});
