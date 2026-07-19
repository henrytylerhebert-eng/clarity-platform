import { describe, expect, it } from "vitest";
import {
  cecIndependentExamClock,
  isExamWithinSignatureWindow,
  opcExaminationClocks,
  opcTransportClock,
  opcValidityClock,
} from "./deadlines.js";

describe("deadlines", () => {
  it("opcValidityClock targets 72 hours from issuance (La. R.S. 28:53.2(D))", () => {
    const clock = opcValidityClock("case-1", "2026-01-01T00:00:00.000Z");
    expect(clock.targetMinutes).toBe(72 * 60);
    expect(clock.counselValidationRequired).toBe(true);
    expect(clock.lane).toBe("Legal");
  });

  it("opcTransportClock targets 12 hours from custody start (statutory, not printed on OBH-20)", () => {
    const clock = opcTransportClock("case-1", "2026-01-01T00:00:00.000Z");
    expect(clock.targetMinutes).toBe(12 * 60);
  });

  it("opcExaminationClocks returns BOTH the 12h statutory and 8h form-printed readings, never collapsed to one", () => {
    const { statutory, formPrinted } = opcExaminationClocks("case-1", "2026-01-01T00:00:00.000Z");
    expect(statutory.targetMinutes).toBe(12 * 60);
    expect(formPrinted.targetMinutes).toBe(8 * 60);
    expect(statutory.label).toContain("R.S. 28:53.2(D)");
    expect(formPrinted.label).toContain("OBH-20");
  });

  it("cecIndependentExamClock targets 72 hours from admission", () => {
    const clock = cecIndependentExamClock("case-1", "2026-01-01T00:00:00.000Z");
    expect(clock.targetMinutes).toBe(72 * 60);
  });

  it("isExamWithinSignatureWindow accepts exactly 72 hours and rejects 72h + 1min", () => {
    const exact = isExamWithinSignatureWindow("2026-01-01T00:00:00.000Z", "2026-01-04T00:00:00.000Z");
    expect(exact.withinWindow).toBe(true);
    expect(exact.elapsedHours).toBe(72);

    const overBy1Min = isExamWithinSignatureWindow("2026-01-01T00:00:00.000Z", "2026-01-04T00:01:00.000Z");
    expect(overBy1Min.withinWindow).toBe(false);
  });

  it("isExamWithinSignatureWindow rejects a signature dated before the examination", () => {
    const backwards = isExamWithinSignatureWindow("2026-01-04T00:00:00.000Z", "2026-01-01T00:00:00.000Z");
    expect(backwards.withinWindow).toBe(false);
  });
});
