import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BLOCKING_CLASSES,
  BLOCKING_SCOPES,
  CASE_STATUSES,
  NEXT_WORK_KINDS,
  PACKET_REQUIREMENT_STATES,
  PRESCREEN_ENCOUNTER_STATUSES,
  PRESCREEN_READINESS_TARGETS,
  WORKSTREAMS,
  WORKSTREAM_STATUSES,
  canBeginClinicalReview,
  deriveAccessGuidance,
  deriveJourneyProjection,
  evaluatePacketReadiness,
  initialWorkstreamStatuses,
  isTerminalCaseStatus,
  isTerminalPrescreenStatus,
  type AccessGuidanceInput,
  type AccessGuidanceProjection,
  type PacketRequirement,
  type WorkstreamStatuses,
} from "@clarity/domain-contracts";

const workstreams = (overrides: Partial<WorkstreamStatuses> = {}): WorkstreamStatuses => ({
  ...initialWorkstreamStatuses(),
  ...overrides,
});

const baseInput = (overrides: Partial<AccessGuidanceInput> = {}): AccessGuidanceInput => ({
  caseStatus: "REVIEW_IN_PROGRESS",
  urgency: "ROUTINE",
  workstreams: workstreams(),
  ...overrides,
});

const requirement = (overrides: Partial<PacketRequirement> = {}): PacketRequirement => ({
  requirementCode: "SYNTHETIC_REQ_A",
  label: "Synthetic requirement A",
  state: "MISSING",
  blockingTargets: ["FACILITY_ROUTING"],
  responsibleRoleCode: "SYNTHETIC_ROLE_CODE",
  resolutionWorkspace: "synthetic-workspace",
  sourceRuleId: "synthetic-rule-1",
  sourceRuleVersion: 1,
  ...overrides,
});

const signalsIn = (p: AccessGuidanceProjection, scope: string) => p.signals.filter((s) => s.scope === scope);
const kinds = (p: AccessGuidanceProjection) => p.nextWork.map((c) => c.kind);

describe("Access Guidance Projection — contract vocabulary", () => {
  it("exposes exactly the ratified enums", () => {
    expect(BLOCKING_CLASSES).toEqual([
      "HARD_BLOCKER",
      "REVIEW_GATE",
      "EXTERNAL_WAIT",
      "WARNING",
      "SATISFIED",
      "NOT_APPLICABLE",
    ]);
    expect(BLOCKING_SCOPES).toEqual(["CASE_PROGRESSION", "PRESCREEN", "PRESCREEN_TARGET", "WORKSTREAM"]);
    expect(NEXT_WORK_KINDS).toEqual([
      "RESOLVE_CASE_INFORMATION",
      "RESOLVE_PRESCREEN_INFORMATION",
      "RESOLVE_PACKET_REQUIREMENT",
      "RESOLVE_WORKSTREAM_BLOCK",
      "REVIEW_WORKSTREAM",
      "START_READY_WORKSTREAM",
    ]);
  });

  it("projects every CaseStatus x PrescreenEncounterStatus combination without throwing", () => {
    for (const caseStatus of CASE_STATUSES) {
      for (const prescreenStatus of PRESCREEN_ENCOUNTER_STATUSES) {
        expect(() => deriveAccessGuidance(baseInput({ caseStatus, prescreenStatus }))).not.toThrow();
      }
    }
  });

  it("derives terminal sets from the existing state machines (no new policy)", () => {
    expect(CASE_STATUSES.filter(isTerminalCaseStatus).sort()).toEqual(["CANCELLED", "CLOSED", "WITHDRAWN"]);
    expect(PRESCREEN_ENCOUNTER_STATUSES.filter(isTerminalPrescreenStatus).sort()).toEqual([
      "CANCELLED",
      "DECLINED",
      "HANDED_OFF",
      "REDIRECTED",
    ]);
  });
});

describe("case progression signals", () => {
  it("case information incomplete → CASE_PROGRESSION HARD_BLOCKER + RESOLVE_CASE_INFORMATION without a role", () => {
    const p = deriveAccessGuidance(baseInput({ caseStatus: "INFORMATION_INCOMPLETE" }));
    expect(p.journey.disposition).toBe("BLOCKED");
    expect(signalsIn(p, "CASE_PROGRESSION")).toEqual([
      {
        signalId: "CASE_PROGRESSION|CASE_STATUS|INFORMATION_INCOMPLETE",
        scope: "CASE_PROGRESSION",
        blockingClass: "HARD_BLOCKER",
        source: { kind: "CASE_STATUS", value: "INFORMATION_INCOMPLETE" },
      },
    ]);
    expect(p.nextWork).toEqual([
      {
        candidateId: "RESOLVE_CASE_INFORMATION",
        kind: "RESOLVE_CASE_INFORMATION",
        scope: "CASE_PROGRESSION",
        nonBinding: true,
        signalIds: ["CASE_PROGRESSION|CASE_STATUS|INFORMATION_INCOMPLETE"],
      },
    ]);
  });

  it("medical diversion is reported through JourneyPhase only — no blocker and no next-work assignment", () => {
    const p = deriveAccessGuidance(baseInput({ caseStatus: "MEDICAL_TRANSFER_REQUIRED" }));
    expect(p.journey.disposition).toBe("DIVERTED");
    expect(signalsIn(p, "CASE_PROGRESSION")).toEqual([]);
    expect(p.nextWork).toEqual([]);
    expect(p.suppressed).toEqual([]);
  });

  it("other diversion / exception statuses produce no case signal and no candidate", () => {
    for (const caseStatus of ["REFERRED_TO_ALTERNATIVE_LEVEL", "NO_PLACEMENT_FOUND"] as const) {
      const p = deriveAccessGuidance(baseInput({ caseStatus }));
      expect(signalsIn(p, "CASE_PROGRESSION")).toEqual([]);
      expect(p.nextWork).toEqual([]);
    }
  });

  it("facility response pending → EXTERNAL_WAIT with no candidate (no timing, SLA, or escalation)", () => {
    const p = deriveAccessGuidance(baseInput({ caseStatus: "FACILITY_RESPONSE_PENDING" }));
    expect(signalsIn(p, "CASE_PROGRESSION").map((s) => s.blockingClass)).toEqual(["EXTERNAL_WAIT"]);
    expect(p.journey.disposition).toBe("ON_TRACK");
    expect(p.nextWork).toEqual([]);
  });

  it("only INFORMATION_INCOMPLETE and FACILITY_RESPONSE_PENDING emit case-level signals", () => {
    const emitting = CASE_STATUSES.filter(
      (caseStatus) => signalsIn(deriveAccessGuidance(baseInput({ caseStatus })), "CASE_PROGRESSION").length > 0,
    );
    expect(emitting.sort()).toEqual(["FACILITY_RESPONSE_PENDING", "INFORMATION_INCOMPLETE"]);
  });
});

describe("prescreen signals", () => {
  it("prescreen needs information blocks the prescreen, not the whole case", () => {
    const p = deriveAccessGuidance(baseInput({ caseStatus: "REVIEW_IN_PROGRESS", prescreenStatus: "NEEDS_INFORMATION" }));
    expect(signalsIn(p, "PRESCREEN")).toEqual([
      {
        signalId: "PRESCREEN|PRESCREEN_STATUS|NEEDS_INFORMATION",
        scope: "PRESCREEN",
        blockingClass: "HARD_BLOCKER",
        source: { kind: "PRESCREEN_STATUS", value: "NEEDS_INFORMATION" },
      },
    ]);
    expect(signalsIn(p, "CASE_PROGRESSION")).toEqual([]);
    expect(p.journey.disposition).toBe("ON_TRACK");
    expect(p.nextWork).toEqual([
      {
        candidateId: "RESOLVE_PRESCREEN_INFORMATION",
        kind: "RESOLVE_PRESCREEN_INFORMATION",
        scope: "PRESCREEN",
        nonBinding: true,
        signalIds: ["PRESCREEN|PRESCREEN_STATUS|NEEDS_INFORMATION"],
      },
    ]);
  });

  it("case-level and prescreen-level information gaps stay distinct, not merged", () => {
    const p = deriveAccessGuidance(
      baseInput({ caseStatus: "INFORMATION_INCOMPLETE", prescreenStatus: "NEEDS_INFORMATION" }),
    );
    expect(kinds(p)).toEqual(["RESOLVE_CASE_INFORMATION", "RESOLVE_PRESCREEN_INFORMATION"]);
  });
});

describe("packet readiness", () => {
  it("absent packet requirements claim nothing; empty requirements report every target ready", () => {
    const absent = deriveAccessGuidance(baseInput());
    expect(absent.packetReadiness).toBeNull();
    expect(signalsIn(absent, "PRESCREEN_TARGET")).toEqual([]);

    const empty = deriveAccessGuidance(baseInput({ packetRequirements: [] }));
    expect(empty.packetReadiness).toEqual(
      PRESCREEN_READINESS_TARGETS.map((target) => ({ target, ready: true, blockers: [], warnings: [] })),
    );
    expect(signalsIn(empty, "PRESCREEN_TARGET")).toEqual([]);
    expect(empty.nextWork).toEqual([]);
  });

  it("packet blockers and warnings map through evaluatePacketReadiness and preserve role/workspace", () => {
    const reqs = [
      requirement({ requirementCode: "SYNTHETIC_REQ_BLOCK", state: "MISSING", blockingTargets: ["FACILITY_ROUTING"] }),
      requirement({
        requirementCode: "SYNTHETIC_REQ_WARN",
        state: "UNDER_REVIEW",
        blockingTargets: ["FACILITY_ROUTING"],
        responsibleRoleCode: "SYNTHETIC_OTHER_ROLE",
        resolutionWorkspace: "synthetic-other-workspace",
      }),
    ];
    const p = deriveAccessGuidance(baseInput({ packetRequirements: reqs }));
    const facility = p.packetReadiness?.find((r) => r.target === "FACILITY_ROUTING");
    expect(facility).toEqual(evaluatePacketReadiness("FACILITY_ROUTING", reqs));

    const target = signalsIn(p, "PRESCREEN_TARGET");
    expect(target.map((s) => [s.target, s.blockingClass, s.source.kind === "PACKET_REQUIREMENT" && s.source.requirementCode])).toEqual([
      ["FACILITY_ROUTING", "HARD_BLOCKER", "SYNTHETIC_REQ_BLOCK"],
      ["FACILITY_ROUTING", "WARNING", "SYNTHETIC_REQ_WARN"],
    ]);

    // Warnings are reported, never turned into work.
    expect(p.nextWork).toEqual([
      {
        candidateId: "RESOLVE_PACKET_REQUIREMENT|SYNTHETIC_REQ_BLOCK|synthetic-rule-1|v1",
        kind: "RESOLVE_PACKET_REQUIREMENT",
        scope: "PRESCREEN_TARGET",
        nonBinding: true,
        requirementCode: "SYNTHETIC_REQ_BLOCK",
        sourceRuleId: "synthetic-rule-1",
        sourceRuleVersion: 1,
        targets: ["FACILITY_ROUTING"],
        responsibleRoleCode: "SYNTHETIC_ROLE_CODE",
        resolutionWorkspace: "synthetic-workspace",
        signalIds: ["PRESCREEN_TARGET|FACILITY_ROUTING|PACKET_REQUIREMENT|SYNTHETIC_REQ_BLOCK|synthetic-rule-1|v1|MISSING"],
      },
    ]);
  });

  it("a requirement without a responsible role yields a candidate without a role (never invented)", () => {
    const { responsibleRoleCode: _omit, ...noRole } = requirement();
    const p = deriveAccessGuidance(baseInput({ packetRequirements: [noRole] }));
    expect(p.nextWork).toHaveLength(1);
    expect(p.nextWork[0]).not.toHaveProperty("responsibleRoleCode");
    expect(p.nextWork[0]?.resolutionWorkspace).toBe("synthetic-workspace");
  });

  it("classifies every PacketRequirementState exactly as evaluatePacketReadiness does", () => {
    for (const state of PACKET_REQUIREMENT_STATES) {
      const reqs = [requirement({ state })];
      const readiness = evaluatePacketReadiness("FACILITY_ROUTING", reqs);
      const [signal] = signalsIn(deriveAccessGuidance(baseInput({ packetRequirements: reqs })), "PRESCREEN_TARGET");
      const expected =
        readiness.blockers.length > 0
          ? "HARD_BLOCKER"
          : readiness.warnings.length > 0
            ? "WARNING"
            : state === "NOT_APPLICABLE_WITH_AUTHORITY"
              ? "NOT_APPLICABLE"
              : "SATISFIED";
      expect([state, signal?.blockingClass]).toEqual([state, expected]);
    }
  });

  it("packet blockers never block case progression or change JourneyPhase", () => {
    const input = baseInput({ packetRequirements: [requirement({ blockingTargets: [...PRESCREEN_READINESS_TARGETS] })] });
    const p = deriveAccessGuidance(input);
    expect(signalsIn(p, "CASE_PROGRESSION")).toEqual([]);
    expect(p.journey).toEqual(deriveJourneyProjection({ caseStatus: input.caseStatus }));
  });

  it("terminal prescreen keeps readiness signals but suppresses packet and prescreen work", () => {
    for (const prescreenStatus of PRESCREEN_ENCOUNTER_STATUSES.filter(isTerminalPrescreenStatus)) {
      const p = deriveAccessGuidance(baseInput({ prescreenStatus, packetRequirements: [requirement()] }));
      expect(signalsIn(p, "PRESCREEN_TARGET").map((s) => s.blockingClass)).toEqual(["HARD_BLOCKER"]);
      expect(p.nextWork).toEqual([]);
      expect(p.suppressed).toEqual([
        {
          kind: "RESOLVE_PACKET_REQUIREMENT",
          signalId: "PRESCREEN_TARGET|FACILITY_ROUTING|PACKET_REQUIREMENT|SYNTHETIC_REQ_A|synthetic-rule-1|v1|MISSING",
          reason: "PRESCREEN_TERMINAL",
        },
      ]);
    }
  });
});

describe("workstream attention", () => {
  it("BLOCKED / PENDING_REVIEW / READY map to their candidates with no role assigned", () => {
    const p = deriveAccessGuidance(
      baseInput({ workstreams: workstreams({ benefits: "BLOCKED", legalReview: "PENDING_REVIEW", placement: "READY" }) }),
    );
    expect(signalsIn(p, "WORKSTREAM").map((s) => [s.workstream, s.blockingClass])).toEqual([
      ["legalReview", "REVIEW_GATE"],
      ["benefits", "HARD_BLOCKER"],
      ["placement", "SATISFIED"],
    ]);
    expect(p.nextWork.map((c) => [c.kind, c.workstream])).toEqual([
      ["RESOLVE_WORKSTREAM_BLOCK", "benefits"],
      ["REVIEW_WORKSTREAM", "legalReview"],
      ["START_READY_WORKSTREAM", "placement"],
    ]);
    for (const candidate of p.nextWork) {
      expect(candidate).not.toHaveProperty("responsibleRoleCode");
      expect(candidate).not.toHaveProperty("resolutionWorkspace");
    }
  });

  it("a blocked workstream is not a blocked patient journey", () => {
    const blockedAll = Object.fromEntries(WORKSTREAMS.map((w) => [w, "BLOCKED"])) as WorkstreamStatuses;
    const p = deriveAccessGuidance(baseInput({ workstreams: blockedAll }));
    expect(signalsIn(p, "CASE_PROGRESSION")).toEqual([]);
    expect(p.journey.disposition).toBe("ON_TRACK");
  });

  it("NOT_STARTED, IN_PROGRESS, COMPLETE and NOT_APPLICABLE produce no candidates", () => {
    for (const status of ["NOT_STARTED", "IN_PROGRESS", "COMPLETE", "NOT_APPLICABLE"] as const) {
      const all = Object.fromEntries(WORKSTREAMS.map((w) => [w, status])) as WorkstreamStatuses;
      const p = deriveAccessGuidance(baseInput({ workstreams: all }));
      expect([status, p.nextWork]).toEqual([status, []]);
    }
  });

  it("every WorkstreamStatus is classified", () => {
    for (const status of WORKSTREAM_STATUSES) {
      expect(() => deriveAccessGuidance(baseInput({ workstreams: workstreams({ clinical: status }) }))).not.toThrow();
    }
  });

  it("terminal case keeps workstream signals but suppresses workstream candidates", () => {
    for (const caseStatus of CASE_STATUSES.filter(isTerminalCaseStatus)) {
      const p = deriveAccessGuidance(baseInput({ caseStatus, workstreams: workstreams({ placement: "READY" }) }));
      expect(signalsIn(p, "WORKSTREAM").map((s) => s.blockingClass)).toEqual(["SATISFIED"]);
      expect(p.nextWork).toEqual([]);
      expect(p.suppressed).toEqual([
        { kind: "START_READY_WORKSTREAM", signalId: "WORKSTREAM|placement|WORKSTREAM_STATUS|READY", reason: "CASE_TERMINAL" },
      ]);
    }
  });
});

describe("emergency / fairness protection", () => {
  it("blocked benefits and authorization never block emergent clinical progression", () => {
    const ws = workstreams({ clinical: "READY", benefits: "BLOCKED", authorization: "BLOCKED" });
    const p = deriveAccessGuidance(baseInput({ urgency: "EMERGENT", workstreams: ws }));

    // Existing rule is unchanged and still satisfied for this state.
    expect(
      canBeginClinicalReview({ caseKey: "synthetic-case", organizationId: "synthetic-org", status: "REVIEW_IN_PROGRESS", urgency: "EMERGENT", workstreams: ws }),
    ).toBe(true);
    // Financial blocks stay scoped to their workstreams.
    expect(signalsIn(p, "CASE_PROGRESSION")).toEqual([]);
    expect(p.journey.disposition).toBe("ON_TRACK");
    // Clinical work is still offered, and it is not held behind the financial blocks.
    expect(p.nextWork.map((c) => [c.kind, c.workstream])).toEqual([
      ["RESOLVE_WORKSTREAM_BLOCK", "benefits"],
      ["RESOLVE_WORKSTREAM_BLOCK", "authorization"],
      ["START_READY_WORKSTREAM", "clinical"],
    ]);
    expect(p.nextWork.find((c) => c.workstream === "clinical")?.signalIds).toEqual([
      "WORKSTREAM|clinical|WORKSTREAM_STATUS|READY",
    ]);
  });

  it("urgency changes nothing in signals or candidates (no invented priority)", () => {
    const ws = workstreams({ clinical: "READY", benefits: "BLOCKED", authorization: "BLOCKED" });
    const results = (["ROUTINE", "URGENT", "EMERGENT"] as const).map((urgency) => {
      const { signals, nextWork, suppressed, journey } = deriveAccessGuidance(baseInput({ urgency, workstreams: ws }));
      return { signals, nextWork, suppressed, journey };
    });
    expect(results[1]).toEqual(results[0]);
    expect(results[2]).toEqual(results[0]);
  });
});

describe("JourneyPhase isolation", () => {
  it("journey equals deriveJourneyProjection for every case status, regardless of guidance inputs", () => {
    const noisy = {
      workstreams: Object.fromEntries(WORKSTREAMS.map((w) => [w, "BLOCKED"])) as WorkstreamStatuses,
      packetRequirements: [requirement({ blockingTargets: [...PRESCREEN_READINESS_TARGETS] })],
      episodeRelationships: ["ADMISSION_SOURCE"] as const,
    };
    for (const caseStatus of CASE_STATUSES) {
      for (const prescreenStatus of [undefined, ...PRESCREEN_ENCOUNTER_STATUSES]) {
        const input = baseInput({
          caseStatus,
          ...(prescreenStatus === undefined ? {} : { prescreenStatus }),
          ...noisy,
          episodeRelationships: [...noisy.episodeRelationships],
        });
        expect(deriveAccessGuidance(input).journey).toEqual(
          deriveJourneyProjection({
            caseStatus,
            ...(prescreenStatus === undefined ? {} : { prescreenStatus }),
            episodeRelationships: [...noisy.episodeRelationships],
          }),
        );
      }
    }
  });
});

describe("determinism, deduplication and traceability", () => {
  const reqA = requirement({ requirementCode: "SYNTHETIC_REQ_A", blockingTargets: ["FACILITY_ROUTING", "CENTRAL_INTAKE_REVIEW"] });
  const reqB = requirement({ requirementCode: "SYNTHETIC_REQ_B", state: "RECEIVED", blockingTargets: ["TRANSPORT_PLANNING"] });
  const reqC = requirement({ requirementCode: "SYNTHETIC_REQ_C", state: "STALE", blockingTargets: ["RECEIVING_HANDOFF", "FACILITY_ROUTING"] });
  const input = (packetRequirements: PacketRequirement[]) =>
    baseInput({
      caseStatus: "INFORMATION_INCOMPLETE",
      prescreenStatus: "NEEDS_INFORMATION",
      workstreams: workstreams({ benefits: "BLOCKED", clinical: "PENDING_REVIEW", placement: "READY" }),
      packetRequirements,
    });

  it("output is identical for any input order of packet requirements (including nested readiness)", () => {
    const forward = deriveAccessGuidance(input([reqA, reqB, reqC]));
    const reversed = deriveAccessGuidance(input([reqC, reqB, reqA]));
    const shuffled = deriveAccessGuidance(input([reqB, reqA, reqC]));
    expect(JSON.stringify(reversed)).toBe(JSON.stringify(forward));
    expect(JSON.stringify(shuffled)).toBe(JSON.stringify(forward));
  });

  it("repeated calls are identical and the input is not mutated", () => {
    const i = input([reqA, reqB, reqC]);
    const snapshot = JSON.stringify(i);
    expect(deriveAccessGuidance(i)).toEqual(deriveAccessGuidance(i));
    expect(JSON.stringify(i)).toBe(snapshot);
  });

  it("duplicate requirements collapse to one signal per target and one candidate per requirement", () => {
    const p = deriveAccessGuidance(input([reqA, reqA, { ...reqA }]));
    const ids = p.signals.map((s) => s.signalId);
    expect(new Set(ids).size).toBe(ids.length);
    const packetCandidates = p.nextWork.filter((c) => c.kind === "RESOLVE_PACKET_REQUIREMENT");
    expect(packetCandidates).toHaveLength(1);
    expect(packetCandidates[0]?.targets).toEqual(["CENTRAL_INTAKE_REVIEW", "FACILITY_ROUTING"]);
    expect(packetCandidates[0]?.signalIds).toHaveLength(2);
    for (const readiness of p.packetReadiness ?? []) {
      const codes = readiness.blockers.map((b) => b.requirementCode);
      expect(new Set(codes).size).toBe(codes.length);
    }
    const candidateIds = p.nextWork.map((c) => c.candidateId);
    expect(new Set(candidateIds).size).toBe(candidateIds.length);
  });

  it("every candidate and suppression traces to emitted signals; every actionable signal is accounted for", () => {
    const withTerminal = deriveAccessGuidance({ ...input([reqA, reqB, reqC]), prescreenStatus: "DECLINED" });
    for (const p of [deriveAccessGuidance(input([reqA, reqB, reqC])), withTerminal]) {
      const signalIds = new Set(p.signals.map((s) => s.signalId));
      for (const c of p.nextWork) {
        expect(c.nonBinding).toBe(true);
        expect(c.signalIds.length).toBeGreaterThan(0);
        for (const id of c.signalIds) expect(signalIds.has(id)).toBe(true);
      }
      for (const s of p.suppressed) expect(signalIds.has(s.signalId)).toBe(true);

      const accounted = new Set([...p.nextWork.flatMap((c) => c.signalIds), ...p.suppressed.map((s) => s.signalId)]);
      const actionable = p.signals.filter(
        (s) =>
          s.blockingClass === "HARD_BLOCKER" ||
          s.blockingClass === "REVIEW_GATE" ||
          (s.scope === "WORKSTREAM" && s.source.kind === "WORKSTREAM_STATUS" && s.source.value === "READY"),
      );
      for (const s of actionable) expect(accounted.has(s.signalId)).toBe(true);
    }
  });

  it("there is no global primary blocker field", () => {
    const p = deriveAccessGuidance(input([reqA]));
    expect(Object.keys(p).sort()).toEqual(["journey", "nextWork", "packetReadiness", "signals", "suppressed"]);
  });
});

describe("no persistence / API dependency", () => {
  it("the module imports only sibling pure contracts", () => {
    const source = readFileSync(
      resolve(__dirname, "../../packages/domain-contracts/src/accessGuidance.ts"),
      "utf8",
    );
    const imports = [...source.matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1]).sort();
    expect(imports).toEqual(["./caseStateMachine.js", "./episode.js", "./journeyPhase.js", "./prescreen.js", "./workstreams.js"]);
    expect(source).not.toMatch(/prisma|fetch\(|localStorage|WorkItem\b(?! engine)/i);
  });
});
