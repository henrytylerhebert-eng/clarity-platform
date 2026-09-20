import { describe, expect, it } from "vitest";
import { allWorkspaceIds, roles } from "./roles";
import {
  CRISIS_NAV_SECTIONS,
  navSectionForWorkspace,
  visibleNavSections,
  visibleWorkspacesForSection,
} from "./crisisNavigation";

describe("Crisis Ops grouped navigation", () => {
  it("places every workspace in exactly one primary section", () => {
    const grouped = CRISIS_NAV_SECTIONS.flatMap((section) => section.workspaces);
    expect(grouped.slice().sort()).toEqual(allWorkspaceIds.slice().sort());
    expect(new Set(grouped).size).toBe(grouped.length);
  });

  it("keeps case discovery and governed case status together", () => {
    const cases = CRISIS_NAV_SECTIONS.find((section) => section.id === "cases");
    expect(cases?.workspaces).toEqual(["queue", "access", "overview"]);
    expect(navSectionForWorkspace("access").id).toBe("cases");
  });

  it("gives every demo persona at least one reachable primary section", () => {
    for (const role of roles) {
      const sections = visibleNavSections(role.workspaces);
      expect(sections.length).toBeGreaterThan(0);
      for (const section of sections) {
        expect(visibleWorkspacesForSection(section, role.workspaces).length).toBeGreaterThan(0);
      }
    }
  });
});
