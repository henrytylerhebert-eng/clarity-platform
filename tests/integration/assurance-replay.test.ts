import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AuthenticatedPrincipal, UserRole } from "@clarity/domain-contracts";
import { PrismaAssuranceGateway } from "@clarity/case-repository";
import {
  AssuranceCommandService,
  AssuranceQueryService,
} from "../../packages/assurance-service/src/index.js";
import { createHarness, tickingClock, type Harness } from "./helpers/harness.js";

let h: Harness;
let gateway: PrismaAssuranceGateway;
let commands: AssuranceCommandService;
let queries: AssuranceQueryService;

interface ReplayUser {
  id: string;
  displayName: string;
  roles: readonly UserRole[];
}

interface ReplayFixture {
  caseKey: string;
  assuranceCaseId: string;
  expectationId: string;
  primarySourceId: string;
  secondarySourceId: string;
  contributor: ReplayUser;
  reviewer: ReplayUser;
}

function principal(user: ReplayUser): AuthenticatedPrincipal {
  return {
    userId: user.id,
    organizationId: h.tenantA.organizationId,
    displayName: user.displayName,
    roles: user.roles,
    sessionId: `replay-session-${user.id}`,
    expiresAt: new Date("2026-09-14T00:00:00.000Z"),
  };
}

async function createUser(label: string, roles: readonly UserRole[] = []): Promise<ReplayUser> {
  const id = `oa-replay-${label}-${h.runId}`;
  const displayName = `OA Replay ${label}`;
  await h.prisma.user.create({
    data: {
      id,
      organizationId: h.tenantA.organizationId,
      email: `${label}-${h.runId}@example.test`,
      displayName,
      roles: [...roles],
      status: "ACTIVE",
    },
  });
  return { id, displayName, roles };
}

async function buildFixture(label: string): Promise<ReplayFixture> {
  const actor = { actorType: "USER" as const, actorId: h.tenantA.userId };
  const facility = await h.prisma.facilityProfile.create({
    data: {
      organizationId: h.tenantA.organizationId,
      name: `Replay facility ${label} ${h.runId}`,
    },
  });
  const contributor = await createUser(`${label}-contributor`);
  const reviewer = await createUser(`${label}-reviewer`, ["COMPLIANCE_REVIEWER"]);

  const assuranceCase = await gateway.createCase(
    h.tenantA.organizationId,
    {
      facilityProfileId: facility.id,
      caseKey: `oa-replay-${label}-${h.runId}`,
      title: `Replay ${label}`,
      assuranceStatement: "Synthetic replay evidence remains historically attributable.",
    },
    actor,
  );
  await gateway.addParticipant(
    h.tenantA.organizationId,
    { assuranceCaseId: assuranceCase.id, userId: contributor.id, role: "EVIDENCE_CONTRIBUTOR" },
    actor,
  );
  await gateway.addParticipant(
    h.tenantA.organizationId,
    {
      assuranceCaseId: assuranceCase.id,
      userId: reviewer.id,
      role: "QUALIFIED_REVIEWER",
      authorityBasis: "Synthetic replay reviewer authority",
    },
    actor,
  );
  await gateway.recordApplicabilityDecision(
    h.tenantA.organizationId,
    {
      assuranceCaseId: assuranceCase.id,
      status: "APPROVED",
      rationale: "Synthetic replay applicability approved.",
    },
    actor,
  );
  const primary = await gateway.addSourceReference(
    h.tenantA.organizationId,
    {
      assuranceCaseId: assuranceCase.id,
      sourceFamilyKey: `SYN-REPLAY-${label}-PRIMARY`,
      versionLabel: "v1",
      title: "Synthetic replay primary authority",
      authorityClass: "FEDERAL_REGULATION",
      citation: `SYN-REPLAY-${label}-PRIMARY-CITATION`,
      currentness: "CURRENT",
      rightsStatus: "PERMITTED",
    },
    actor,
  );
  const secondary = await gateway.addSourceReference(
    h.tenantA.organizationId,
    {
      assuranceCaseId: assuranceCase.id,
      sourceFamilyKey: `SYN-REPLAY-${label}-SECONDARY`,
      versionLabel: "v1",
      title: "Synthetic replay secondary authority",
      authorityClass: "STATE_LICENSING",
      citation: `SYN-REPLAY-${label}-SECONDARY-CITATION`,
      currentness: "CURRENT",
      rightsStatus: "PERMITTED",
    },
    actor,
  );
  await gateway.addDocumentReference(
    h.tenantA.organizationId,
    {
      assuranceCaseId: assuranceCase.id,
      kind: "POLICY",
      referenceKey: `SYN-REPLAY-${label}-POLICY`,
      title: "Synthetic replay policy",
      versionLabel: "v1",
    },
    actor,
  );
  await gateway.addDocumentReference(
    h.tenantA.organizationId,
    {
      assuranceCaseId: assuranceCase.id,
      kind: "SOP",
      referenceKey: `SYN-REPLAY-${label}-SOP`,
      title: "Synthetic replay SOP",
      versionLabel: "v1",
    },
    actor,
  );
  const expectation = await gateway.addEvidenceExpectation(
    h.tenantA.organizationId,
    {
      assuranceCaseId: assuranceCase.id,
      code: `REPLAY_${label.toUpperCase().replaceAll("-", "_")}`,
      prompt: "Provide synthetic date, owner, and follow-up status.",
      requiredKeys: ["roundDate", "owner", "followUpStatus"],
    },
    actor,
  );

  return {
    caseKey: assuranceCase.caseKey,
    assuranceCaseId: assuranceCase.id,
    expectationId: expectation.id,
    primarySourceId: primary.id,
    secondarySourceId: secondary.id,
    contributor,
    reviewer,
  };
}

async function establishAcceptedBaseline(f: ReplayFixture) {
  const contributor = principal(f.contributor);
  const reviewer = principal(f.reviewer);
  const evidence = await commands.submitEvidence(contributor, {
    caseKey: f.caseKey,
    expectationId: f.expectationId,
    payload: {
      roundDate: "2026-09-13",
      owner: "Synthetic Replay Owner",
      followUpStatus: "COMPLETE",
    },
  });
  const evaluation = await commands.evaluate(contributor, {
    caseKey: f.caseKey,
    expectationId: f.expectationId,
  });
  expect(evaluation.result).toBe("SUPPORTED");
  expect(evaluation.requiresHumanReview).toBe(true);
  const review = await commands.review(reviewer, {
    caseKey: f.caseKey,
    evaluationId: evaluation.id,
    decision: "ACCEPT",
  });
  expect(review.decision).toBe("ACCEPT");
  return { contributor, reviewer, evidence, evaluation, review };
}

beforeAll(async () => {
  h = await createHarness();
  gateway = new PrismaAssuranceGateway(h.prisma, undefined, tickingClock());
  commands = new AssuranceCommandService(gateway);
  queries = new AssuranceQueryService(gateway);
});

afterAll(async () => {
  await h.dispose();
});

describe("Operating Assurance deterministic replay", () => {
  it.each(["STALE", "SUPERSEDED"] as const)(
    "preserves accepted evidence and historical snapshots when a source becomes %s",
    async (currentness) => {
      const f = await buildFixture(`currentness-${currentness.toLowerCase()}`);
      const baseline = await establishAcceptedBaseline(f);
      const originalEvaluation = await h.prisma.assuranceEvaluation.findUniqueOrThrow({
        where: { id: baseline.evaluation.id },
      });
      const originalSnapshot = structuredClone(originalEvaluation.sourceStateSnapshot);

      await gateway.setSourceCurrentness(
        h.tenantA.organizationId,
        f.primarySourceId,
        currentness,
        { actorType: "USER", actorId: h.tenantA.userId },
      );

      const replay = await commands.evaluate(baseline.contributor, {
        caseKey: f.caseKey,
        expectationId: f.expectationId,
      });
      expect(replay.result).toBe("STALE_SOURCE");
      expect(replay.requiresHumanReview).toBe(true);
      expect(replay.id).not.toBe(baseline.evaluation.id);

      const history = await queries.getCaseHistory(baseline.contributor, f.caseKey);
      expect(history.filter((entry) => entry.kind === "EVALUATION").map((entry) => entry.id)).toEqual(
        expect.arrayContaining([baseline.evaluation.id, replay.id]),
      );
      expect(history.some((entry) => entry.kind === "REVIEW" && entry.id === baseline.review.id && entry.state === "ACCEPT")).toBe(true);
      expect(history.some((entry) => entry.kind === "EVIDENCE" && entry.id === baseline.evidence.id && entry.state === "ACCEPTED")).toBe(true);

      const originalAfterReplay = await h.prisma.assuranceEvaluation.findUniqueOrThrow({
        where: { id: baseline.evaluation.id },
      });
      expect(originalAfterReplay.result).toBe("SUPPORTED");
      expect(originalAfterReplay.sourceStateSnapshot).toEqual(originalSnapshot);
      expect((await gateway.findEvidenceSubmission(h.tenantA.organizationId, baseline.evidence.id))?.status).toBe("ACCEPTED");
    },
  );

  it("preserves the prior accepted record when an unresolved source conflict changes current trust state", async () => {
    const f = await buildFixture("conflict");
    const baseline = await establishAcceptedBaseline(f);
    const originalEvaluation = await h.prisma.assuranceEvaluation.findUniqueOrThrow({
      where: { id: baseline.evaluation.id },
    });
    const originalSnapshot = structuredClone(originalEvaluation.sourceStateSnapshot);

    await gateway.createSourceConflict(
      h.tenantA.organizationId,
      {
        assuranceCaseId: f.assuranceCaseId,
        leftSourceId: f.primarySourceId,
        rightSourceId: f.secondarySourceId,
        status: "OPEN",
        note: "Synthetic replay conflict",
      },
      { actorType: "USER", actorId: h.tenantA.userId },
    );

    const replay = await commands.evaluate(baseline.reviewer, {
      caseKey: f.caseKey,
      expectationId: f.expectationId,
    });
    expect(replay.result).toBe("CONFLICT");
    expect(replay.requiresHumanReview).toBe(true);

    const view = await queries.getCaseView(baseline.reviewer, f.caseKey);
    expect(view.sourceConflicts.some((conflict) => conflict.status === "OPEN")).toBe(true);
    const history = await queries.getCaseHistory(baseline.reviewer, f.caseKey);
    expect(history.some((entry) => entry.kind === "REVIEW" && entry.id === baseline.review.id && entry.state === "ACCEPT")).toBe(true);
    expect(history.filter((entry) => entry.kind === "EVALUATION").map((entry) => entry.id)).toEqual(
      expect.arrayContaining([baseline.evaluation.id, replay.id]),
    );

    const originalAfterReplay = await h.prisma.assuranceEvaluation.findUniqueOrThrow({
      where: { id: baseline.evaluation.id },
    });
    expect(originalAfterReplay.result).toBe("SUPPORTED");
    expect(originalAfterReplay.sourceStateSnapshot).toEqual(originalSnapshot);
    expect((await gateway.findEvidenceSubmission(h.tenantA.organizationId, baseline.evidence.id))?.status).toBe("ACCEPTED");
  });
});
