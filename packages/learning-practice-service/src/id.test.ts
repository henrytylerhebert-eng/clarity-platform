import { describe, expect, it } from "vitest";
import { stableId } from "./id.js";

describe("deterministic CLPR identities", () => {
  it("keeps identical evidence stable without conflating tuple boundaries", () => {
    expect(stableId("obs", ["org", "event"])).toBe(stableId("obs", ["org", "event"]));
    expect(stableId("obs", ["a|b", "c"])).not.toBe(stableId("obs", ["a", "b|c"]));
    expect(stableId("obs", ["a", "b"])).not.toBe(stableId("obs", ["b", "a"]));
    expect(stableId("obs", ["a"])).not.toBe(stableId("candidate", ["a"]));
  });
});
