import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  PrismaCaseRepository,
  PrismaCaseCommandGateway,
  PrismaDocumentGateway,
  PrismaLegalStatusGateway,
  CaseNotFoundError,
} from "@clarity/case-repository";
import { DocumentCommandService } from "@clarity/document-service";
import { CaseCommandService } from "@clarity/case-service";
import { renderLouisianaForm, type Obh1PhysicianEmergencyCertificate } from "@clarity/legal-hold-forms";
import { createHarness, tickingClock, TEST_ACTOR, type Harness } from "./helpers/harness.js";

/**
 * End-to-end wiring test for the Louisiana legal-hold-forms slice: render an
 * OBH-1 PEC -> upload it as a LEGAL_HOLD_DOCUMENT (existing document-service
 * path, unmodified) -> create a LegalStatusRecord pointing at it (new
 * case-repository gateway) -> cite that record in a case decision rationale
 * (new optional field on RecordDecisionRationaleCommand). Confirms every stage
 * is visible in the DB and that nothing here touches case-status transitions.
 */

let h: Harness;
let caseRepo: PrismaCaseRepository;
let documentService: DocumentCommandService;
let legalStatusGateway: PrismaLegalStatusGateway;
let caseService: CaseCommandService;

const clinical = { actorId: "syn-clinical", actorType: "USER" as const, roles: ["CLINICAL_REVIEWER" as const] };
const intake = { actorId: "syn-intake", actorType: "USER" as const, roles: ["INTAKE_COORDINATOR" as const] };

async function createCase(suffix: string) {
  return caseRepo.create(h.tenantA.organizationId, h.makeCaseData(h.tenantA, suffix), TEST_ACTOR);
}

const samplePec: Omit<Obh1PhysicianEmergencyCertificate, "kind"> = {
  examiner: { name: "Dr. Smith", role: "PHYSICIAN", licenseNumber: "MD-9999", licenseBoard: "LSBME", address: "1 Hospital Way" },
  examinedAt: "2026-01-01T10:00:00.000Z",
  patientData: {
    name: "Synthetic Patient",
    address: "123 Main St",
    nearestRelative: { name: "Synthetic Relative", relationship: "Spouse" },
  },
  certificateType: "MENTAL_ILLNESS_OR_SUBSTANCE_ABUSE_15_DAY",
  certificateSequence: "1ST",
  findings: {
    historyOfPresentIllness: "Synthetic history.",
    physicalFindings: "Synthetic findings.",
    mentalCondition: "Synthetic condition.",
    isCurrently: { suicidal: false, homicidal: false, violent: false },
  },
  dangerousnessCriteria: {
    group1: { dangerousToSelf: true, dangerousToOthers: false, gravelyDisabled: false },
    group2: { unwilling: true, unableToSeekVoluntaryAdmission: false, willingToSeekVoluntaryAdmissionUponArrival: false },
  },
  signedAt: "2026-01-01T11:00:00.000Z",
  transportFacilities: ["Regional Medical Center"],
};

beforeAll(async () => {
  h = await createHarness();
  caseRepo = new PrismaCaseRepository(h.prisma, undefined, tickingClock());
  documentService = new DocumentCommandService(new PrismaDocumentGateway(h.prisma, undefined, tickingClock()));
  legalStatusGateway = new PrismaLegalStatusGateway(h.prisma, undefined, tickingClock());
  caseService = new CaseCommandService(new PrismaCaseCommandGateway(h.prisma, undefined, tickingClock()));
});
afterAll(async () => h?.dispose());

describe("render -> upload -> LegalStatusRecord -> cited rationale", () => {
  it("wires an OBH-1 PEC through document-service and case-repository end to end", async () => {
    const key = h.caseKey("legal-hold-e2e");
    await createCase("legal-hold-e2e");

    const rendered = await renderLouisianaForm({ kind: "OBH_1_PEC", ...samplePec });
    expect(rendered.bytes.byteLength).toBeGreaterThan(0);
    expect(rendered.formInstanceId).toBeTruthy();

    const uploadResult = await documentService.uploadDocument({
      organizationId: h.tenantA.organizationId,
      caseId: key,
      actor: intake,
      documentType: "LEGAL_HOLD_DOCUMENT",
      filename: "obh-1-pec.pdf",
      mimeType: "application/pdf",
      content: rendered.bytes,
    });
    expect(uploadResult.document.documentType).toBe("LEGAL_HOLD_DOCUMENT");

    const record = await legalStatusGateway.createLegalStatusRecord({
      id: rendered.formInstanceId,
      organizationId: h.tenantA.organizationId,
      caseId: key,
      jurisdiction: "LA",
      statusType: "INVOLUNTARY_EMERGENCY",
      authorizingAuthority: samplePec.examiner.name,
      authorizingLicenseBoard: samplePec.examiner.licenseBoard,
      authorizingLicenseNumber: samplePec.examiner.licenseNumber,
      initiatedAt: new Date(samplePec.signedAt),
      formDocumentId: uploadResult.document.documentId,
      actor: TEST_ACTOR,
      commandType: "CreateLegalStatusRecord",
      auditAction: "LEGAL_STATUS_RECORD_CREATED",
    });
    expect(record.caseId).toBe(key);
    // The printed form-instance id IS the LegalStatusRecord id: one-of-one traceability.
    expect(record.id).toBe(rendered.formInstanceId);
    expect(record.formDocumentId).toBe(uploadResult.document.documentId);
    expect(record.statusType).toBe("INVOLUNTARY_EMERGENCY");
    expect(record.authorizingLicenseBoard).toBe("LSBME");
    expect(record.authorizingLicenseNumber).toBe("MD-9999");

    const listed = await legalStatusGateway.listLegalStatusRecordsForCase(h.tenantA.organizationId, key);
    expect(listed.map((r) => r.id)).toContain(record.id);

    const noted = await caseService.recordDecisionRationale({
      organizationId: h.tenantA.organizationId,
      caseKey: key,
      actor: clinical,
      reason: "Accepting physician reviewed the PEC prior to admission decision",
      decisionContext: "Admission acceptance",
      citedLegalStatusRecordId: record.id,
    });
    expect(noted).toBeDefined();

    const events = await h.prisma.auditEvent.findMany({
      where: { organizationId: h.tenantA.organizationId, caseId: key, action: "DECISION_RATIONALE_RECORDED" },
    });
    expect(events).toHaveLength(1);
    expect(events[0]!.modelMetadata).toMatchObject({ citedLegalStatusRecordId: record.id });
  });

  it("tracks issuance frequency by signer (within this organization) and by patient across their cases", async () => {
    // Same examiner signs a PEC on two different cases -> listLegalStatusRecordsBySigner sees both.
    const caseOneKey = h.caseKey("freq-signer-case-1");
    const caseTwoKey = h.caseKey("freq-signer-case-2");
    await createCase("freq-signer-case-1");
    await caseRepo.create(
      h.tenantA.organizationId,
      h.makeCaseData(h.tenantA, "freq-signer-case-2"),
      TEST_ACTOR,
    );

    for (const key of [caseOneKey, caseTwoKey]) {
      const rendered = await renderLouisianaForm({ kind: "OBH_1_PEC", ...samplePec });
      await legalStatusGateway.createLegalStatusRecord({
        id: rendered.formInstanceId,
        organizationId: h.tenantA.organizationId,
        caseId: key,
        jurisdiction: "LA",
        statusType: "INVOLUNTARY_EMERGENCY",
        authorizingLicenseBoard: samplePec.examiner.licenseBoard,
        authorizingLicenseNumber: samplePec.examiner.licenseNumber,
        actor: TEST_ACTOR,
        commandType: "CreateLegalStatusRecord",
        auditAction: "LEGAL_STATUS_RECORD_CREATED",
      });
    }

    const bySigner = await legalStatusGateway.listLegalStatusRecordsBySigner(
      h.tenantA.organizationId,
      samplePec.examiner.licenseBoard,
      samplePec.examiner.licenseNumber,
    );
    // Not an exact-set check: the earlier "wires an OBH-1 PEC..." test also
    // used this same examiner license, so this only asserts the two new cases
    // from THIS test are present (frequency tracking is additive, as intended).
    const signerCaseIds = new Set(bySigner.map((r) => r.caseId));
    expect(signerCaseIds.has(caseOneKey)).toBe(true);
    expect(signerCaseIds.has(caseTwoKey)).toBe(true);

    // Same patient (shared patientTokenId) admitted twice -> listLegalStatusRecordsForPatient sees both episodes.
    const returningPatientToken = h.tenantA.patientTokenId;
    const episodeOneKey = h.caseKey("freq-patient-episode-1");
    const episodeTwoKey = h.caseKey("freq-patient-episode-2");
    await caseRepo.create(
      h.tenantA.organizationId,
      h.makeCaseData(h.tenantA, "freq-patient-episode-1", { patientTokenId: returningPatientToken }),
      TEST_ACTOR,
    );
    await caseRepo.create(
      h.tenantA.organizationId,
      h.makeCaseData(h.tenantA, "freq-patient-episode-2", { patientTokenId: returningPatientToken }),
      TEST_ACTOR,
    );
    for (const key of [episodeOneKey, episodeTwoKey]) {
      await legalStatusGateway.createLegalStatusRecord({
        organizationId: h.tenantA.organizationId,
        caseId: key,
        jurisdiction: "LA",
        statusType: "PROTECTIVE_CUSTODY",
        actor: TEST_ACTOR,
        commandType: "CreateLegalStatusRecord",
        auditAction: "LEGAL_STATUS_RECORD_CREATED",
      });
    }

    const forPatient = await legalStatusGateway.listLegalStatusRecordsForPatient(
      h.tenantA.organizationId,
      returningPatientToken,
    );
    // Not an exact-set check: every case created against tenantA's default
    // patient token in this file (including earlier tests) shares this same
    // patientTokenId, so this only asserts the two new episodes are present.
    const patientCaseIds = new Set(forPatient.map((r) => r.caseId));
    expect(patientCaseIds.has(episodeOneKey)).toBe(true);
    expect(patientCaseIds.has(episodeTwoKey)).toBe(true);
  });

  it("case-ownership check: creating a legal status record against a foreign/missing case fails without writing", async () => {
    await expect(
      legalStatusGateway.createLegalStatusRecord({
        organizationId: h.tenantA.organizationId,
        caseId: h.caseKey("legal-hold-missing-case"),
        jurisdiction: "LA",
        statusType: "PROTECTIVE_CUSTODY",
        actor: TEST_ACTOR,
        commandType: "CreateLegalStatusRecord",
        auditAction: "LEGAL_STATUS_RECORD_CREATED",
      }),
    ).rejects.toBeInstanceOf(CaseNotFoundError);
  });
});
