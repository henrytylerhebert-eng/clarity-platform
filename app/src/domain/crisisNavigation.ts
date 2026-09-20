import type { WorkspaceId } from "./roles";

export type CrisisNavSectionId = "home" | "cases" | "intake" | "review" | "placement" | "more";

export interface CrisisNavSection {
  readonly id: CrisisNavSectionId;
  readonly label: string;
  readonly workspaces: readonly WorkspaceId[];
}

export const CRISIS_NAV_SECTIONS: readonly CrisisNavSection[] = [
  { id: "home", label: "Home", workspaces: ["command"] },
  { id: "cases", label: "Cases", workspaces: ["queue", "access", "overview"] },
  { id: "intake", label: "Intake", workspaces: ["new", "intake", "evidence"] },
  { id: "review", label: "Review", workspaces: ["medical", "legal", "benefits", "authorization"] },
  { id: "placement", label: "Placement", workspaces: ["packet", "routing", "bedboard"] },
  { id: "more", label: "More", workspaces: ["ledger", "iop-reconciliation", "training", "mock-admits", "studio"] },
] as const;

export const WORKSPACE_LABELS: Readonly<Record<WorkspaceId, string>> = {
  queue: "Case queue",
  command: "Command center",
  new: "New case",
  overview: "Case overview",
  intake: "Guided intake",
  evidence: "Evidence review",
  medical: "Medical necessity",
  legal: "Legal status",
  benefits: "Benefits verification",
  authorization: "Authorization readiness",
  packet: "Packet",
  routing: "Routing",
  bedboard: "Bedboard",
  ledger: "History & custody",
  training: "Training & SOPs",
  "mock-admits": "Mock admit lab",
  studio: "Product studio",
  "iop-reconciliation": "IOP reconciliation",
  access: "Case status",
};

export function navSectionForWorkspace(workspace: WorkspaceId): CrisisNavSection {
  return CRISIS_NAV_SECTIONS.find((section) => section.workspaces.includes(workspace)) ?? CRISIS_NAV_SECTIONS[1];
}

export function visibleNavSections(allowedWorkspaces: readonly WorkspaceId[]): CrisisNavSection[] {
  return CRISIS_NAV_SECTIONS.filter((section) =>
    section.workspaces.some((workspace) => allowedWorkspaces.includes(workspace)),
  );
}

export function visibleWorkspacesForSection(
  section: CrisisNavSection,
  allowedWorkspaces: readonly WorkspaceId[],
): WorkspaceId[] {
  return section.workspaces.filter((workspace) => allowedWorkspaces.includes(workspace));
}
