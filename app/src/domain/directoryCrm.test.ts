import { describe, expect, it } from "vitest";
import {
  directoryCrmOrganizations,
  filterDirectoryOrganizations,
  forbiddenDirectoryIntentLabels,
  hasForbiddenDirectoryIntentLabel,
} from "./directoryCrm";

describe("directory CRM prototype domain", () => {
  it("filters synthetic organization profiles by workflow context", () => {
    const prescreen = filterDirectoryOrganizations(directoryCrmOrganizations, {
      query: "",
      organizationType: "all",
      workflowContext: "prescreen",
      reviewState: "all",
    });

    expect(prescreen.map((item) => item.name)).toContain("Lafayette Police Department");
    expect(prescreen.map((item) => item.name)).toContain("Lafayette Community Crisis Response");
    expect(prescreen.map((item) => item.name)).not.toContain("Acadian Stepdown Nursing");
  });

  it("filters by organization type and verification state", () => {
    const staleBehavioral = filterDirectoryOrganizations(directoryCrmOrganizations, {
      query: "",
      organizationType: "behavioral-provider",
      workflowContext: "all",
      reviewState: "stale",
    });

    expect(staleBehavioral).toHaveLength(1);
    expect(staleBehavioral[0].name).toBe("Oceans Lafayette Central Intake");
  });

  it("searches across personnel, service lines, and partner relationships", () => {
    const consultMatches = filterDirectoryOrganizations(directoryCrmOrganizations, {
      query: "telemed",
      organizationType: "all",
      workflowContext: "all",
      reviewState: "all",
    });

    expect(consultMatches.map((item) => item.name)).toContain("Lafayette General Emergency Department");
  });

  it("keeps capacity unknown unless explicitly synthetic", () => {
    const liveCapacityClaims = directoryCrmOrganizations.flatMap((organization) =>
      organization.serviceLines.filter((line) => line.capacityStatus !== "Unknown" && line.capacityStatus !== "Synthetic only"),
    );

    expect(liveCapacityClaims).toEqual([]);
  });

  it("keeps prototype intent labels away from live external action language", () => {
    const allIntentLabels = directoryCrmOrganizations.flatMap((organization) => organization.allowedIntentLabels);

    expect(allIntentLabels.some(hasForbiddenDirectoryIntentLabel)).toBe(false);
    expect(forbiddenDirectoryIntentLabels).toContain("Send referral");
    expect(hasForbiddenDirectoryIntentLabel("Send referral now")).toBe(true);
  });
});
