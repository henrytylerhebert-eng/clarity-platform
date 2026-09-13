import type { PrismaClient } from "@prisma/client";
import {
  assertLocalClarityDevDatabase,
  PrismaAssuranceGateway,
} from "@clarity/case-repository";

/**
 * Synthetic-only Operating Assurance fixture for TWP-OA-006.
 *
 * This module is deliberately NOT wired to an HTTP route. It may be called by
 * the local dev runner and by tests that inherit a loopback clarity_dev
 * DATABASE_URL. Replay mutations are therefore impossible through the
 * production API surface.
 */
export const ASSURANCE_DEV_ORG_ID = "synthetic-org-api-dev";

export const ASSURANCE_DEV_USERS = [
  {
    id: "synthetic-user-oa-contributor",
    email: "syn-oa-contributor@example.test",
    displayName: "Synthetic OA Evidence Contributor",
    roles: [] as const,
    assertion: "syn-assert-oa-contributor-dev",
  },
  {
    id: "synthetic-user-oa-reviewer",
    email: "syn-oa-reviewer@example.test",
    displayName: "Synthetic OA Qualified Reviewer",
    roles: ["COMPLIANCE_REVIEWER"] as const,
    assertion: "syn-assert-oa-reviewer-dev",
  },
  {
    id: "synthetic-user-oa-system-admin",
    email: "syn-oa-system-admin@example.test",
    displayName: "Synthetic OA System Admin Control",
    roles: ["SYSTEM_ADMIN"] as const,
    assertion: "syn-assert-oa-system-admin-dev",
  },
] as const;

export const ASSURANCE_DEV_FIXTURE = {
  facilityId: "synthetic-oa-facility-api-dev",
  caseId: "synthetic-oa-case-api-dev",
  caseKey: "SYN-OA-CASE-0001",
  participantContributorId: "synthetic-oa-participant-contributor",
  participantReviewerId: "synthetic-oa-participant-reviewer",
  participantSystemAdminId: "synthetic-oa-participant-system-admin",
  applicabilityId: "synthetic-oa-applicability-v1",
  primarySourceId: "synthetic-oa-source-primary",
  secondarySourceId: "synthetic-oa-source-secondary",
  policyReferenceId: "synthetic-oa-policy-v1",
  sopReferenceId: "synthetic-oa-sop-v1",
  expectationId: "synthetic-oa-expectation-rounding",
  expectationCode: "SYN_OA_ROUNDING",
  requiredKeys: ["roundDate", "owner", "followUpStatus"] as const,
  completeEvidence: {
    roundDate: "2026-09-13",
    owner: "Synthetic Environment Owner",
    followUpStatus: "COMPLETE",
  },
} as const;

export type AssuranceReplayMutation = "STALE" | "SUPERSEDED" | "CONFLICT";

function setupActor() {
  return {
    actorType: "USER" as const,
    actorId: ASSURANCE_DEV_USERS[1].id,
  };
}

/**
 * Idempotently creates the stable synthetic OA case without touching any
 * evidence/evaluation/review history that may already exist.
 */
export async function ensureAssuranceDevFixture(prisma: PrismaClient) {
  assertLocalClarityDevDatabase();

  await prisma.facilityProfile.upsert({
    where: { id: ASSURANCE_DEV_FIXTURE.facilityId },
    update: {
      organizationId: ASSURANCE_DEV_ORG_ID,
      name: "Synthetic Operating Assurance Facility",
    },
    create: {
      id: ASSURANCE_DEV_FIXTURE.facilityId,
      organizationId: ASSURANCE_DEV_ORG_ID,
      name: "Synthetic Operating Assurance Facility",
    },
  });

  await prisma.assuranceCase.upsert({
    where: { id: ASSURANCE_DEV_FIXTURE.caseId },
    update: {
      organizationId: ASSURANCE_DEV_ORG_ID,
      facilityProfileId: ASSURANCE_DEV_FIXTURE.facilityId,
      caseKey: ASSURANCE_DEV_FIXTURE.caseKey,
      title: "Synthetic Monthly Environmental Assurance",
      assuranceStatement: "Required synthetic rounding evidence is documented and human-reviewed.",
      createdBy: ASSURANCE_DEV_USERS[1].id,
    },
    create: {
      id: ASSURANCE_DEV_FIXTURE.caseId,
      organizationId: ASSURANCE_DEV_ORG_ID,
      facilityProfileId: ASSURANCE_DEV_FIXTURE.facilityId,
      caseKey: ASSURANCE_DEV_FIXTURE.caseKey,
      title: "Synthetic Monthly Environmental Assurance",
      assuranceStatement: "Required synthetic rounding evidence is documented and human-reviewed.",
      createdBy: ASSURANCE_DEV_USERS[1].id,
    },
  });

  const participants = [
    {
      id: ASSURANCE_DEV_FIXTURE.participantContributorId,
      userId: ASSURANCE_DEV_USERS[0].id,
      role: "EVIDENCE_CONTRIBUTOR" as const,
      authorityBasis: null,
    },
    {
      id: ASSURANCE_DEV_FIXTURE.participantReviewerId,
      userId: ASSURANCE_DEV_USERS[1].id,
      role: "QUALIFIED_REVIEWER" as const,
      authorityBasis: "Synthetic Operating Assurance reviewer authority",
    },
    {
      id: ASSURANCE_DEV_FIXTURE.participantSystemAdminId,
      userId: ASSURANCE_DEV_USERS[2].id,
      role: "QUALIFIED_REVIEWER" as const,
      authorityBasis: "Synthetic scoped authority without COMPLIANCE_REVIEWER",
    },
  ];

  for (const participant of participants) {
    await prisma.assuranceParticipantAssignment.upsert({
      where: { id: participant.id },
      update: {
        organizationId: ASSURANCE_DEV_ORG_ID,
        assuranceCaseId: ASSURANCE_DEV_FIXTURE.caseId,
        userId: participant.userId,
        role: participant.role,
        authorityBasis: participant.authorityBasis,
        active: true,
        revokedAt: null,
      },
      create: {
        ...participant,
        organizationId: ASSURANCE_DEV_ORG_ID,
        assuranceCaseId: ASSURANCE_DEV_FIXTURE.caseId,
        active: true,
        grantedBy: ASSURANCE_DEV_USERS[1].id,
      },
    });
  }

  await prisma.assuranceApplicabilityDecision.upsert({
    where: { id: ASSURANCE_DEV_FIXTURE.applicabilityId },
    update: {
      organizationId: ASSURANCE_DEV_ORG_ID,
      assuranceCaseId: ASSURANCE_DEV_FIXTURE.caseId,
      status: "APPROVED",
      rationale: "Synthetic applicability approved for replay verification.",
      approvedBy: ASSURANCE_DEV_USERS[1].id,
      version: 1,
    },
    create: {
      id: ASSURANCE_DEV_FIXTURE.applicabilityId,
      organizationId: ASSURANCE_DEV_ORG_ID,
      assuranceCaseId: ASSURANCE_DEV_FIXTURE.caseId,
      status: "APPROVED",
      rationale: "Synthetic applicability approved for replay verification.",
      approvedBy: ASSURANCE_DEV_USERS[1].id,
      approvedAt: new Date("2026-09-13T00:00:00.000Z"),
      version: 1,
    },
  });

  const sources = [
    {
      id: ASSURANCE_DEV_FIXTURE.primarySourceId,
      sourceFamilyKey: "SYN-OA-PRIMARY",
      title: "Synthetic primary authority",
      citation: "SYN-OA-PRIMARY-CITATION",
    },
    {
      id: ASSURANCE_DEV_FIXTURE.secondarySourceId,
      sourceFamilyKey: "SYN-OA-CORROBORATING",
      title: "Synthetic corroborating authority",
      citation: "SYN-OA-CORROBORATING-CITATION",
    },
  ];

  for (const source of sources) {
    await prisma.assuranceSourceReference.upsert({
      where: { id: source.id },
      update: {
        organizationId: ASSURANCE_DEV_ORG_ID,
        assuranceCaseId: ASSURANCE_DEV_FIXTURE.caseId,
        sourceFamilyKey: source.sourceFamilyKey,
        versionLabel: "v1",
        title: source.title,
        authorityClass: "FEDERAL_REGULATION",
        citation: source.citation,
        currentness: "CURRENT",
        rightsStatus: "PERMITTED",
        supersededBySourceId: null,
      },
      create: {
        id: source.id,
        organizationId: ASSURANCE_DEV_ORG_ID,
        assuranceCaseId: ASSURANCE_DEV_FIXTURE.caseId,
        sourceFamilyKey: source.sourceFamilyKey,
        versionLabel: "v1",
        title: source.title,
        authorityClass: "FEDERAL_REGULATION",
        citation: source.citation,
        currentness: "CURRENT",
        rightsStatus: "PERMITTED",
      },
    });
  }

  await prisma.assuranceDocumentReference.upsert({
    where: { id: ASSURANCE_DEV_FIXTURE.policyReferenceId },
    update: {
      organizationId: ASSURANCE_DEV_ORG_ID,
      assuranceCaseId: ASSURANCE_DEV_FIXTURE.caseId,
      kind: "POLICY",
      referenceKey: "SYN-OA-POLICY",
      title: "Synthetic environmental rounds policy",
      versionLabel: "v1",
    },
    create: {
      id: ASSURANCE_DEV_FIXTURE.policyReferenceId,
      organizationId: ASSURANCE_DEV_ORG_ID,
      assuranceCaseId: ASSURANCE_DEV_FIXTURE.caseId,
      kind: "POLICY",
      referenceKey: "SYN-OA-POLICY",
      title: "Synthetic environmental rounds policy",
      versionLabel: "v1",
    },
  });

  await prisma.assuranceDocumentReference.upsert({
    where: { id: ASSURANCE_DEV_FIXTURE.sopReferenceId },
    update: {
      organizationId: ASSURANCE_DEV_ORG_ID,
      assuranceCaseId: ASSURANCE_DEV_FIXTURE.caseId,
      kind: "SOP",
      referenceKey: "SYN-OA-SOP",
      title: "Synthetic environmental rounds SOP",
      versionLabel: "v1",
    },
    create: {
      id: ASSURANCE_DEV_FIXTURE.sopReferenceId,
      organizationId: ASSURANCE_DEV_ORG_ID,
      assuranceCaseId: ASSURANCE_DEV_FIXTURE.caseId,
      kind: "SOP",
      referenceKey: "SYN-OA-SOP",
      title: "Synthetic environmental rounds SOP",
      versionLabel: "v1",
    },
  });

  await prisma.assuranceEvidenceExpectation.upsert({
    where: { id: ASSURANCE_DEV_FIXTURE.expectationId },
    update: {
      organizationId: ASSURANCE_DEV_ORG_ID,
      assuranceCaseId: ASSURANCE_DEV_FIXTURE.caseId,
      code: ASSURANCE_DEV_FIXTURE.expectationCode,
      prompt: "Provide synthetic round date, accountable owner, and follow-up status.",
      requiredKeys: [...ASSURANCE_DEV_FIXTURE.requiredKeys],
    },
    create: {
      id: ASSURANCE_DEV_FIXTURE.expectationId,
      organizationId: ASSURANCE_DEV_ORG_ID,
      assuranceCaseId: ASSURANCE_DEV_FIXTURE.caseId,
      code: ASSURANCE_DEV_FIXTURE.expectationCode,
      prompt: "Provide synthetic round date, accountable owner, and follow-up status.",
      requiredKeys: [...ASSURANCE_DEV_FIXTURE.requiredKeys],
    },
  });

  return ASSURANCE_DEV_FIXTURE;
}

/**
 * Test-only deterministic reset. Historical OA records for the fixed synthetic
 * case are removed, then the seed metadata is restored to its initial trust
 * state. This function is never exposed over HTTP.
 */
export async function resetAssuranceDevFixture(prisma: PrismaClient) {
  assertLocalClarityDevDatabase();
  await ensureAssuranceDevFixture(prisma);

  await prisma.$transaction([
    prisma.assuranceReviewDecision.deleteMany({
      where: { organizationId: ASSURANCE_DEV_ORG_ID, assuranceCaseId: ASSURANCE_DEV_FIXTURE.caseId },
    }),
    prisma.assuranceEvaluation.deleteMany({
      where: { organizationId: ASSURANCE_DEV_ORG_ID, assuranceCaseId: ASSURANCE_DEV_FIXTURE.caseId },
    }),
    prisma.assuranceSourceConflict.deleteMany({
      where: { organizationId: ASSURANCE_DEV_ORG_ID, assuranceCaseId: ASSURANCE_DEV_FIXTURE.caseId },
    }),
    prisma.assuranceEvidenceSubmission.deleteMany({
      where: { organizationId: ASSURANCE_DEV_ORG_ID, assuranceCaseId: ASSURANCE_DEV_FIXTURE.caseId },
    }),
    prisma.assuranceSourceReference.update({
      where: { id: ASSURANCE_DEV_FIXTURE.primarySourceId },
      data: { currentness: "CURRENT", rightsStatus: "PERMITTED", supersededBySourceId: null, version: 1 },
    }),
    prisma.assuranceSourceReference.update({
      where: { id: ASSURANCE_DEV_FIXTURE.secondarySourceId },
      data: { currentness: "CURRENT", rightsStatus: "PERMITTED", supersededBySourceId: null, version: 1 },
    }),
  ]);

  return ASSURANCE_DEV_FIXTURE;
}

/**
 * Applies only the source-state mutations needed by replay verification.
 * Attribution flows through PrismaAssuranceGateway so the change is audited.
 */
export async function applyAssuranceDevReplayMutation(
  prisma: PrismaClient,
  mutation: AssuranceReplayMutation,
) {
  assertLocalClarityDevDatabase();
  await ensureAssuranceDevFixture(prisma);
  const gateway = new PrismaAssuranceGateway(prisma);
  const actor = setupActor();

  if (mutation === "CONFLICT") {
    return gateway.createSourceConflict(
      ASSURANCE_DEV_ORG_ID,
      {
        assuranceCaseId: ASSURANCE_DEV_FIXTURE.caseId,
        leftSourceId: ASSURANCE_DEV_FIXTURE.primarySourceId,
        rightSourceId: ASSURANCE_DEV_FIXTURE.secondarySourceId,
        status: "OPEN",
        note: "Synthetic unresolved conflict for deterministic replay verification.",
      },
      actor,
    );
  }

  return gateway.setSourceCurrentness(
    ASSURANCE_DEV_ORG_ID,
    ASSURANCE_DEV_FIXTURE.primarySourceId,
    mutation,
    actor,
  );
}
