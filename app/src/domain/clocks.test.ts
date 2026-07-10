import { describe, expect, it } from "vitest";
import { evaluateClock } from "./clocks";
import type { ComplianceClock } from "./types";

const base: ComplianceClock = {
  id: "clock-test",
  caseId: "case-test",
  label: "Referral to screening",
  lane: "Clinical",
  startedAt: "2026-07-08T12:00:00.000Z",
  targetMinutes: 60,
  counselValidationRequired: false,
};

describe("evaluateClock", () => {
  it("reports running when elapsed is under the due-soon threshold", () => {
    const reading = evaluateClock(base, "2026-07-08T12:30:00.000Z");
    expect(reading.status).toBe("Running");
    expect(reading.elapsedMinutes).toBe(30);
    expect(reading.remainingMinutes).toBe(30);
  });

  it("reports due soon at 80 percent of the target", () => {
    const reading = evaluateClock(base, "2026-07-08T12:48:00.000Z");
    expect(reading.status).toBe("Due soon");
  });

  it("reports breached when the target is exceeded", () => {
    const reading = evaluateClock(base, "2026-07-08T13:35:00.000Z");
    expect(reading.status).toBe("Breached");
    expect(reading.remainingMinutes).toBeLessThan(0);
  });

  it("reports stopped and freezes elapsed at stoppedAt", () => {
    const reading = evaluateClock(
      { ...base, stoppedAt: "2026-07-08T12:20:00.000Z" },
      "2026-07-08T18:00:00.000Z",
    );
    expect(reading.status).toBe("Stopped");
    expect(reading.elapsedMinutes).toBe(20);
  });
});
