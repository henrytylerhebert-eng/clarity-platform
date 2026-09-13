import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { USER_ROLES } from "./roles.js";
import { centralIntakePathway, contradictionRule, contradictionScenario, learningModule } from "@clarity/learning-practice-service";

const FixtureSchema = z.object({
  fixtureVersion: z.literal("1.0.0"), syntheticOnly: z.literal(true), scenarioId: z.literal("SCN-EI-03"),
  caseRef: z.string().startsWith("case-synthetic-"), roleFamily: z.enum(USER_ROLES),
  learner: z.object({ actorId: z.string().min(1), displayName: z.string().min(1) }).strict(),
  facts: z.array(z.object({ factId: z.string(), source: z.string().startsWith("Synthetic "), statement: z.string().min(1) }).strict()).length(2),
  expectedBehavior: z.array(z.enum(["IDENTIFY_CONTRADICTION", "PRESERVE_BOTH_SOURCES", "ESCALATE_FOR_REVIEW"])),
  criticalError: z.literal("SILENTLY_RESOLVE_CONTRADICTION"),
}).strict();
const fixtureText = readFileSync(new URL("../../../data/synthetic-practice-scenarios/clpr-central-intake-contradiction-v1.json", import.meta.url), "utf8");

describe("CLPR synthetic fixture and seed contracts", () => {
  it("validates the relocated fixture and keeps the seeded scenario and canonical role aligned", () => {
    const fixture = FixtureSchema.parse(JSON.parse(fixtureText));
    expect(fixture.roleFamily).toBe("INTAKE_COORDINATOR");
    expect(contradictionScenario.scenarioId).toBe(fixture.scenarioId);
    expect(contradictionScenario.syntheticFixtureVersion).toBe(fixture.fixtureVersion);
    expect(contradictionScenario.roleFamily).toBe(fixture.roleFamily);
    expect(centralIntakePathway.roleFamily).toBe(fixture.roleFamily);
    expect(learningModule.audienceRoles).toContain(fixture.roleFamily);
    expect(contradictionScenario.initialFacts.map(({ factId, sourceLabel, statement }) => ({ factId, source: sourceLabel, statement }))).toEqual(fixture.facts);
    expect(contradictionScenario.expectedActions).toEqual([...fixture.expectedBehavior, "COMPLETE_SCENARIO"]);
    expect(contradictionScenario.criticalErrors).toEqual([fixture.criticalError]);
    expect(contradictionRule.requiredEvidence).toEqual(["CONTRADICTION_IDENTIFIED", "CONTRADICTION_PRESERVED", "CONTRADICTION_ESCALATED"]);
  });

  it("does not contain realistic SSN or Medicare identifier shapes", () => {
    expect(fixtureText).not.toMatch(/\b\d{3}-\d{2}-\d{4}\b/);
    expect(fixtureText).not.toMatch(/\b\d[A-Z]{2}\d[A-Z]{2}\d[A-Z]{2}\d{2}\b/);
  });

  it("rejects a fixture without the synthetic boundary or canonical role", () => {
    const fixture: unknown = JSON.parse(fixtureText);
    expect(FixtureSchema.safeParse({ ...(fixture as object), syntheticOnly: false }).success).toBe(false);
    expect(FixtureSchema.safeParse({ ...(fixture as object), roleFamily: "CENTRAL_INTAKE_COORDINATOR" }).success).toBe(false);
  });
});
