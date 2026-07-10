import { describe, expect, it } from "vitest";
import { canTransitionAuthorization, assertHumanSubmitter } from "@clarity/domain-contracts";

describe("authorization transitions", () => {
  it("follows preparation -> submission -> outcome", () => {
    expect(canTransitionAuthorization("NOT_STARTED", "PREPARING")).toBe(true);
    expect(canTransitionAuthorization("PREPARING", "SUBMITTED")).toBe(true);
    expect(canTransitionAuthorization("SUBMITTED", "PENDING")).toBe(true);
    expect(canTransitionAuthorization("PENDING", "PARTIALLY_APPROVED")).toBe(true);
  });

  it("supports appeal and concurrent-review reopenings", () => {
    expect(canTransitionAuthorization("DENIED", "PENDING")).toBe(true);
    expect(canTransitionAuthorization("APPROVED", "PENDING")).toBe(true);
  });

  it("rejects skipping preparation or resurrecting from nothing", () => {
    expect(canTransitionAuthorization("NOT_STARTED", "APPROVED")).toBe(false);
    expect(canTransitionAuthorization("NOT_STARTED", "SUBMITTED")).toBe(false);
    expect(canTransitionAuthorization("DENIED", "APPROVED")).toBe(false);
  });

  it("only a human actor may submit externally", () => {
    expect(() => assertHumanSubmitter("AGENT")).toThrow(/authorized human/);
    expect(() => assertHumanSubmitter("SYSTEM")).toThrow(/authorized human/);
    expect(() => assertHumanSubmitter("USER")).not.toThrow();
  });
});
