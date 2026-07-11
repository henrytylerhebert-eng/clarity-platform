import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaCaseCommandGateway } from "@clarity/case-repository";
import {
  CaseCommandService,
  CaseNotFoundError,
  PermissionDeniedError,
  RationaleRequiredError,
  TerminalCaseError,
} from "@clarity/case-service";
import type { CommandActor } from "@clarity/case-service";
import { createHarness, tickingClock, type Harness } from "./helpers/harness.js";

let h: Harness;
let service: CaseCommandService;

const actor = (roles: CommandActor["roles"], id = "synthetic-actor"): CommandActor => ({
  actorId: id,
  actorType: "USER",
  roles,
});
const intake = actor(["INTAKE_COORDINATOR"], "syn-intake");
const admin = actor(["ORGANIZATION_ADMIN"], "syn-admin");
const clinical = actor(["CLINICAL_REVIEWER"], "syn-clinical");
const legal = actor(["LEGAL_REVIEWER"], "syn-legal");
const benefits = actor(["BENEFITS_VERIFICATION_SPECIALIST"], "syn-benefits");
const compliance = actor(["COMPLIANCE_REVIEWER"], "syn-compliance");
const auditor = actor(["READ_ONLY_AUDITOR"], "syn-auditor");

function base(suffix: string, extra: Record<string, unknown> = {}) {
  return {
    organizationId: h.tenantA.organizationId,
    caseKey: h.caseKey(suffix),
    actor: intake,
    ...extra,
  };
}

async function createCase(suffix: string, extra: Record<string, unknown> = {}) {
  return service.createCase({
    organizationId: h.tenantA.organizationId,
    caseKey: h.caseKey(suffix),
    patientTokenId: h.tenantA.patientTokenId,
    actor: intake,
    ...extra,
  });
}

beforeAll(async () => {
  h = await createHarness();
  service = new CaseCommandService(new PrismaCaseCommandGateway(h.prisma, undefined, tickingClock()));
});
afterAll(async () => h?.dispose());

describe("case commands: creation, assignment, fields", () => {
  it("CreateCase produces a DRAFT case at version 0 with initial workstreams", async () => {
    const result = await createCase("cmd-create");
    expect(result.replayed).toBe(false);
    expect(result.case.status).toBe("DRAFT");
    expect(result.case.version).toBe(0);
    expect(Object.values(result.case.workstreams)).toEqual(Array(8).fill("NOT_STARTED"));
  });

  it("AssignCase assigns a same-organization user and refuses another tenant's user", async () => {
    await createCase("cmd-assign");
    const assigned = await service.assignCase({
      ...base("cmd-assign"),
      assigneeUserId: h.tenantA.userId,
    });
    expect(assigned.case.assignedUserId).toBe(h.tenantA.userId);

    await expect(
      service.assignCase({ ...base("cmd-assign"), assigneeUserId: h.tenantB.userId }),
    ).rejects.toBeInstanceOf(CaseNotFoundError);
  });

  it("UpdateCaseUrgency requires rationale and records it; UpdateCaseLocation updates the field", async () => {
    await createCase("cmd-fields");
    await expect(
      service.updateCaseUrgency({ ...base("cmd-fields"), actor: clinical, urgency: "EMERGENT" }),
    ).rejects.toBeInstanceOf(RationaleRequiredError);

    const urgent = await service.updateCaseUrgency({
      ...base("cmd-fields"),
      actor: clinical,
      urgency: "EMERGENT",
      reason: "synthetic acute risk escalation",
    });
    expect(urgent.case.urgency).toBe("EMERGENT");

    const moved = await service.updateCaseLocation({
      ...base("cmd-fields"),
      currentLocation: "Synthetic ED Bay 7",
    });
    expect(moved.case.currentLocation).toBe("Synthetic ED Bay 7");
  });
});

describe("state machine through commands", () => {
  it("valid transitions succeed", async () => {
    await createCase("cmd-valid");
    await service.transitionCase({ ...base("cmd-valid"), to: "INTAKE_IN_PROGRESS" });
    await service.transitionCase({ ...base("cmd-valid"), to: "DOCUMENTS_PENDING" });
    const result = await service.transitionCase({ ...base("cmd-valid"), to: "DOCUMENTS_RECEIVED" });
    expect(result.case.status).toBe("DOCUMENTS_RECEIVED");
    expect(result.case.version).toBe(3);
  });

  it("invalid transitions fail and change nothing", async () => {
    await createCase("cmd-invalid");
    await expect(
      service.transitionCase({ ...base("cmd-invalid"), to: "TRANSFER_COMPLETE" }),
    ).rejects.toThrow(/Invalid case transition/);
    const row = await h.prisma.behavioralHealthCase.findFirst({
      where: { id: h.caseKey("cmd-invalid"), organizationId: h.tenantA.organizationId },
    });
    expect(row?.status).toBe("DRAFT");
    expect(row?.version).toBe(0);
  });

  it("exception-path transitions require rationale", async () => {
    await createCase("cmd-exception");
    await expect(
      service.transitionCase({ ...base("cmd-exception"), to: "CANCELLED" }),
    ).rejects.toBeInstanceOf(RationaleRequiredError);
    const cancelled = await service.transitionCase({
      ...base("cmd-exception"),
      to: "CANCELLED",
      reason: "synthetic duplicate referral",
    });
    expect(cancelled.case.status).toBe("CANCELLED");
  });
});

describe("tenant isolation through commands", () => {
  it("tenant A cannot command tenant B's case, and B's case is untouched", async () => {
    const bGateway = new PrismaCaseCommandGateway(h.prisma, undefined, tickingClock());
    const bService = new CaseCommandService(bGateway);
    await bService.createCase({
      organizationId: h.tenantB.organizationId,
      caseKey: h.caseKey("cmd-b-case"),
      patientTokenId: h.tenantB.patientTokenId,
      actor: intake,
    });

    await expect(
      service.transitionCase({ ...base("cmd-b-case"), to: "INTAKE_IN_PROGRESS" }),
    ).rejects.toBeInstanceOf(CaseNotFoundError);
    await expect(
      service.updateWorkstreamStatus({
        ...base("cmd-b-case"),
        actor: benefits,
        workstream: "benefits",
        to: "IN_PROGRESS",
      }),
    ).rejects.toBeInstanceOf(CaseNotFoundError);

    const row = await h.prisma.behavioralHealthCase.findFirst({
      where: { id: h.caseKey("cmd-b-case"), organizationId: h.tenantB.organizationId },
    });
    expect(row?.status).toBe("DRAFT");
    expect(row?.version).toBe(0);
  });
});

describe("permission enforcement", () => {
  it("read-only auditors can execute no command", async () => {
    await expect(
      service.createCase({
        organizationId: h.tenantA.organizationId,
        caseKey: h.caseKey("cmd-auditor"),
        patientTokenId: h.tenantA.patientTokenId,
        actor: auditor,
      }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
  });

  it("workstream policy: benefits specialist cannot move clinical; clinical reviewer can", async () => {
    await createCase("cmd-perms");
    await expect(
      service.updateWorkstreamStatus({
        ...base("cmd-perms"),
        actor: benefits,
        workstream: "clinical",
        to: "IN_PROGRESS",
      }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    const ok = await service.updateWorkstreamStatus({
      ...base("cmd-perms"),
      actor: clinical,
      workstream: "clinical",
      to: "IN_PROGRESS",
    });
    expect(ok.case.workstreams.clinical).toBe("IN_PROGRESS");
  });

  it("compliance reviewers may record rationale but not alter case state", async () => {
    await createCase("cmd-compliance");
    await expect(
      service.transitionCase({ ...base("cmd-compliance"), actor: compliance, to: "INTAKE_IN_PROGRESS" }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    await expect(
      service.updateWorkstreamStatus({
        ...base("cmd-compliance"),
        actor: compliance,
        workstream: "clinical",
        to: "IN_PROGRESS",
      }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    const noted = await service.recordDecisionRationale({
      ...base("cmd-compliance"),
      actor: compliance,
      reason: "synthetic compliance observation",
      decisionContext: "intake documentation completeness",
    });
    expect(noted.case.status).toBe("DRAFT"); // state unchanged
  });
});

describe("parallel workstreams through commands", () => {
  it("role-appropriate actors move their workstreams independently", async () => {
    const key = h.caseKey("cmd-parallel");
    await createCase("cmd-parallel");
    await service.updateWorkstreamStatus({ ...base("cmd-parallel"), actor: clinical, workstream: "clinical", to: "IN_PROGRESS" });
    await service.updateWorkstreamStatus({ ...base("cmd-parallel"), actor: legal, workstream: "legalReview", to: "IN_PROGRESS" });
    await service.updateWorkstreamStatus({ ...base("cmd-parallel"), actor: legal, workstream: "legalReview", to: "PENDING_REVIEW" });
    await service.updateWorkstreamStatus({ ...base("cmd-parallel"), actor: benefits, workstream: "benefits", to: "IN_PROGRESS" });
    const row = await h.prisma.behavioralHealthCase.findFirst({
      where: { id: key, organizationId: h.tenantA.organizationId },
    });
    expect(row).toMatchObject({
      clinicalStatus: "IN_PROGRESS",
      legalReviewStatus: "PENDING_REVIEW",
      benefitsStatus: "IN_PROGRESS",
      placementStatus: "NOT_STARTED",
      status: "DRAFT", // overall status not erased by workstream detail
    });
  });

  it("financial readiness cannot block emergency clinical review", async () => {
    await createCase("cmd-emergency", { urgency: "EMERGENT" });
    await service.updateWorkstreamStatus({ ...base("cmd-emergency"), actor: benefits, workstream: "benefits", to: "BLOCKED" });
    // Clinical work proceeds with financial workstreams blocked:
    const clinicalMoved = await service.updateWorkstreamStatus({
      ...base("cmd-emergency"),
      actor: clinical,
      workstream: "clinical",
      to: "IN_PROGRESS",
    });
    expect(clinicalMoved.case.workstreams.clinical).toBe("IN_PROGRESS");
    // And the case can advance toward clinical review regardless of benefits state:
    await service.transitionCase({ ...base("cmd-emergency"), to: "INTAKE_IN_PROGRESS" });
    await service.transitionCase({ ...base("cmd-emergency"), to: "DOCUMENTS_PENDING" });
    await service.transitionCase({ ...base("cmd-emergency"), to: "DOCUMENTS_RECEIVED" });
    await service.transitionCase({ ...base("cmd-emergency"), to: "EVIDENCE_PROCESSING" });
    await service.transitionCase({ ...base("cmd-emergency"), to: "EVIDENCE_REVIEW" });
    const advanced = await service.transitionCase({ ...base("cmd-emergency"), to: "CLINICAL_REVIEW" });
    expect(advanced.case.status).toBe("CLINICAL_REVIEW");
    expect(advanced.case.workstreams.benefits).toBe("BLOCKED");
  });
});

describe("terminal cases and reopen", () => {
  it("a terminal case rejects every command except a permitted reopen", async () => {
    const key = h.caseKey("cmd-terminal");
    await createCase("cmd-terminal");
    await service.transitionCase({ ...base("cmd-terminal"), to: "CANCELLED", reason: "synthetic withdrawal" });

    await expect(service.assignCase({ ...base("cmd-terminal"), assigneeUserId: h.tenantA.userId })).rejects.toBeInstanceOf(TerminalCaseError);
    await expect(
      service.updateCaseUrgency({ ...base("cmd-terminal"), actor: clinical, urgency: "URGENT", reason: "x" }),
    ).rejects.toBeInstanceOf(TerminalCaseError);
    await expect(
      service.updateWorkstreamStatus({ ...base("cmd-terminal"), actor: clinical, workstream: "clinical", to: "IN_PROGRESS" }),
    ).rejects.toBeInstanceOf(TerminalCaseError);
    await expect(
      service.transitionCase({ ...base("cmd-terminal"), to: "INTAKE_IN_PROGRESS" }),
    ).rejects.toBeInstanceOf(TerminalCaseError);

    // Reopen: intake coordinator lacks the role; admin without reason fails; admin with reason succeeds.
    await expect(
      service.reopenCase({ ...base("cmd-terminal"), reopenTo: "INTAKE_IN_PROGRESS", reason: "x" }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    await expect(
      service.reopenCase({ ...base("cmd-terminal"), actor: admin, reopenTo: "INTAKE_IN_PROGRESS" }),
    ).rejects.toBeInstanceOf(RationaleRequiredError);
    const reopened = await service.reopenCase({
      ...base("cmd-terminal"),
      actor: admin,
      reopenTo: "INTAKE_IN_PROGRESS",
      reason: "synthetic reopen after withdrawal reversal",
    });
    expect(reopened.case.status).toBe("INTAKE_IN_PROGRESS");
    expect(reopened.case.closedAt).toBeNull();

    const events = await h.prisma.auditEvent.findMany({
      where: { organizationId: h.tenantA.organizationId, caseId: key, action: "CASE_REOPENED" },
    });
    expect(events).toHaveLength(1);
  });

  it("CloseCase requires rationale and follows the state machine", async () => {
    await createCase("cmd-close");
    await expect(service.closeCase({ ...base("cmd-close") })).rejects.toBeInstanceOf(RationaleRequiredError);
    await expect(
      service.closeCase({ ...base("cmd-close"), reason: "synthetic" }),
    ).rejects.toThrow(/Invalid case transition/); // DRAFT cannot close directly
  });
});
