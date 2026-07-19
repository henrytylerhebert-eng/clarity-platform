export type WorkspaceId =
  | "queue"
  | "command"
  | "dependency-map"
  | "journey"
  | "new"
  | "prescreen"
  | "overview"
  | "intake"
  | "evidence"
  | "medical"
  | "legal"
  | "benefits"
  | "authorization"
  | "admit"
  | "episode"
  | "packet"
  | "routing"
  | "bedboard"
  | "ledger"
  | "discharge"
  | "training"
  | "mock-admits"
  | "studio";

export const allWorkspaceIds: WorkspaceId[] = [
  "queue",
  "command",
  "dependency-map",
  "journey",
  "new",
  "prescreen",
  "overview",
  "intake",
  "evidence",
  "medical",
  "legal",
  "benefits",
  "authorization",
  "admit",
  "episode",
  "packet",
  "routing",
  "bedboard",
  "ledger",
  "discharge",
  "training",
  "mock-admits",
  "studio",
];

export type RoleId =
  | "all"
  | "field"
  | "central"
  | "clinician"
  | "facility"
  | "nurse"
  | "ur"
  | "compliance"
  | "executive";

export interface RoleDefinition {
  id: RoleId;
  label: string;
  description: string;
  mission: string;
  workspaces: WorkspaceId[];
  defaultWorkspace: WorkspaceId;
}

// Demo role modeling only — this scopes what each stakeholder segment sees.
// It is not authentication or authorization and grants no security guarantees.
// Canonical persona definitions live in docs/09-personas-and-role-ux.md.
export const roles: RoleDefinition[] = [
  {
    id: "all",
    label: "All workspaces (demo)",
    description: "Unscoped demo view showing every workspace.",
    mission: "Reviewer walkthrough of the full closed-loop journey.",
    workspaces: allWorkspaceIds,
    defaultWorkspace: "queue",
  },
  {
    id: "field",
    label: "Field responder",
    description: "Field intake capture: start a case, run field-mode assessment, hand off.",
    mission: "Capture the story once, on scene, without clinical jargon.",
    workspaces: ["new", "prescreen", "intake", "overview", "ledger", "training", "mock-admits"],
    defaultWorkspace: "new",
  },
  {
    id: "central",
    label: "Central intake coordinator",
    description: "Owns the pipeline: SLA clocks, packet completeness, routing, escalations.",
    mission: "Keep every case moving; escalate before clocks breach.",
    workspaces: ["command", "dependency-map", "journey", "queue", "new", "prescreen", "overview", "intake", "evidence", "medical", "legal", "benefits", "authorization", "admit", "episode", "packet", "routing", "discharge", "ledger", "training", "mock-admits"],
    defaultWorkspace: "command",
  },
  {
    id: "clinician",
    label: "Clinician reviewer",
    description: "Reviews assessments, risk formulations, and medical-necessity drafts.",
    mission: "Turn drafts into clinically defensible documentation.",
    workspaces: ["journey", "queue", "overview", "intake", "evidence", "medical", "legal", "admit", "discharge", "episode", "ledger", "training", "mock-admits"],
    defaultWorkspace: "queue",
  },
  {
    id: "ur",
    label: "UR / benefits specialist",
    description: "Runs the financial lane in parallel: verification, payer documentation gaps.",
    mission: "Clear the financial lane without ever blocking the clinical lane.",
    workspaces: ["command", "dependency-map", "queue", "overview", "medical", "benefits", "authorization", "admit", "episode", "ledger", "training", "mock-admits"],
    defaultWorkspace: "benefits",
  },
  {
    id: "facility",
    label: "Receiving facility",
    description: "Reviews incoming packets and responds accept, decline, or request info.",
    mission: "Respond fast with a reason the network can learn from.",
    workspaces: ["packet", "routing", "admit", "ledger", "training", "mock-admits"],
    defaultWorkspace: "routing",
  },
  {
    id: "nurse",
    label: "Charge nurse (inpatient)",
    description: "Milieu-aware bed placement; final say on accept or override with reason.",
    mission: "Place for milieu safety, not just bed availability.",
    workspaces: ["bedboard", "overview", "admit", "discharge", "ledger", "training", "mock-admits"],
    defaultWorkspace: "bedboard",
  },
  {
    id: "compliance",
    label: "Compliance / legal officer",
    description: "Watches custody integrity, counsel-validation queue, and clock breaches.",
    mission: "Prove the chain of custody; flag anything counsel has not validated.",
    workspaces: ["command", "dependency-map", "journey", "queue", "evidence", "legal", "admit", "discharge", "ledger", "training", "mock-admits"],
    defaultWorkspace: "ledger",
  },
  {
    id: "executive",
    label: "Executive / program director",
    description: "Read-focused pipeline oversight. Full metrics dashboard arrives in v0.3.",
    mission: "See throughput and risk at a glance; measure before claiming improvement.",
    workspaces: ["command", "dependency-map", "journey", "queue", "admit", "discharge", "ledger", "training", "mock-admits", "studio"],
    defaultWorkspace: "command",
  },
];

export function getRole(roleId: RoleId): RoleDefinition {
  return roles.find((role) => role.id === roleId) ?? roles[0];
}
