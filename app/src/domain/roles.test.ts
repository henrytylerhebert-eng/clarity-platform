import { describe, expect, it } from "vitest";
import { allWorkspaceIds, getRole, roles } from "./roles";

describe("role definitions", () => {
  it("gives every role a valid default workspace within its own workspace list", () => {
    for (const role of roles) {
      expect(role.workspaces).toContain(role.defaultWorkspace);
      for (const workspace of role.workspaces) {
        expect(allWorkspaceIds).toContain(workspace);
      }
    }
  });

  it("has unique role ids", () => {
    const ids = roles.map((role) => role.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("scopes segmented roles below the full workspace set", () => {
    for (const role of roles.filter((item) => item.id !== "all")) {
      expect(role.workspaces.length).toBeLessThan(allWorkspaceIds.length);
    }
  });

  it("keeps the custody ledger visible to every stakeholder segment", () => {
    for (const role of roles) {
      expect(role.workspaces).toContain("ledger");
    }
  });

  it("keeps the Directory CRM visible to every stakeholder segment", () => {
    for (const role of roles) {
      expect(role.workspaces).toContain("directory-crm");
    }
  });

  it("falls back to the demo role for unknown ids", () => {
    expect(getRole("nope" as never).id).toBe("all");
  });

  it("routes case-creating roles to a workspace that exists after creation", () => {
    for (const role of roles.filter((item) => item.workspaces.includes("new"))) {
      expect(role.workspaces).toContain("overview");
    }
  });
});
