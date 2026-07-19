export const operationReviewGates = [
  "operational-review",
  "clinical-review",
  "legal-compliance-review",
  "ur-revenue-cycle-review",
  "security-privacy-review",
] as const;

export type OperationReviewGate = (typeof operationReviewGates)[number];

export const operationEventTypes = [
  "referral-missing-info",
  "accepted-handoff",
  "episode-opened",
  "ur-documentation-gap",
  "safety-incident",
  "staffing-exception",
  "training-credential-exception",
  "vendor-blocker",
  "discharge-dependency",
] as const;

export type OperationEventType = (typeof operationEventTypes)[number];
export type OperationEventStatus = "open" | "acknowledged" | "in-progress" | "resolved";
export type OperationExceptionSeverity = "watch" | "warning" | "blocked" | "urgent";
export type OperationsBackboneSourceState = "synthetic-fixture" | "source-derived" | "reviewed";

export interface OperationsFacility {
  id: string;
  name: string;
  facilityType: "behavioral-health-hospital" | "parent-company";
}

export interface OperationsDepartment {
  id: string;
  facilityId: string;
  label: string;
  bucket: "intake" | "clinical" | "quality-safety" | "personnel" | "revenue-cycle" | "ancillary" | "executive";
}

export interface OperationsRole {
  id: string;
  departmentId: string;
  label: string;
  defaultReviewGates: OperationReviewGate[];
}

export interface OperationsOwner {
  id: string;
  roleId: string;
  displayName: string;
  sourceLabel: string;
}

export interface OperationsEvent {
  id: string;
  facilityId: string;
  departmentId: string;
  roleId: string;
  ownerId: string;
  type: OperationEventType;
  summary: string;
  status: OperationEventStatus;
  severity: OperationExceptionSeverity;
  occurredAt: string;
  dueAt?: string;
  reviewGates: OperationReviewGate[];
  sourceState: OperationsBackboneSourceState;
  sourceArtifact: string;
  caseId?: string;
  episodeId?: string;
}

export interface OperationsBackbone {
  facilities: OperationsFacility[];
  departments: OperationsDepartment[];
  roles: OperationsRole[];
  owners: OperationsOwner[];
  events: OperationsEvent[];
}

export interface OperationsOwnerChain {
  facility: OperationsFacility;
  department: OperationsDepartment;
  role: OperationsRole;
  owner: OperationsOwner;
}

export interface OperationsDashboardException {
  id: string;
  sourceEventId: string;
  facilityLabel: string;
  departmentLabel: string;
  roleLabel: string;
  ownerLabel: string;
  eventType: OperationEventType;
  summary: string;
  status: Exclude<OperationEventStatus, "resolved">;
  severity: OperationExceptionSeverity;
  reviewGates: OperationReviewGate[];
  sourceArtifact: string;
  projectionStatus: "read-only-synthetic-projection";
}

export const operationsBackboneFixture: OperationsBackbone = {
  facilities: [
    {
      id: "bayou-vista-behavioral",
      name: "Bayou Vista Behavioral (synthetic)",
      facilityType: "behavioral-health-hospital",
    },
  ],
  departments: [
    { id: "central-intake", facilityId: "bayou-vista-behavioral", label: "Central Intake", bucket: "intake" },
    { id: "nursing", facilityId: "bayou-vista-behavioral", label: "Nursing", bucket: "clinical" },
    { id: "utilization-review", facilityId: "bayou-vista-behavioral", label: "Utilization Review", bucket: "revenue-cycle" },
    { id: "quality-safety", facilityId: "bayou-vista-behavioral", label: "Quality and Safety", bucket: "quality-safety" },
    { id: "personnel-training", facilityId: "bayou-vista-behavioral", label: "Personnel and Training", bucket: "personnel" },
    { id: "ancillary-vendors", facilityId: "bayou-vista-behavioral", label: "Ancillary and Vendors", bucket: "ancillary" },
  ],
  roles: [
    {
      id: "lead-rn",
      departmentId: "central-intake",
      label: "Lead RN",
      defaultReviewGates: ["operational-review", "clinical-review"],
    },
    {
      id: "nurse-manager",
      departmentId: "nursing",
      label: "Nurse Manager",
      defaultReviewGates: ["operational-review", "clinical-review"],
    },
    {
      id: "ur-specialist",
      departmentId: "utilization-review",
      label: "UR specialist",
      defaultReviewGates: ["ur-revenue-cycle-review", "operational-review"],
    },
    {
      id: "patient-safety-specialist",
      departmentId: "quality-safety",
      label: "Patient Safety Specialist",
      defaultReviewGates: ["clinical-review", "legal-compliance-review", "operational-review"],
    },
    {
      id: "credentialing-coordinator",
      departmentId: "personnel-training",
      label: "Credentialing Coordinator",
      defaultReviewGates: ["legal-compliance-review", "operational-review"],
    },
    {
      id: "transportation-coordinator",
      departmentId: "ancillary-vendors",
      label: "Transportation Coordinator",
      defaultReviewGates: ["operational-review", "security-privacy-review"],
    },
  ],
  owners: [
    { id: "owner-lead-rn", roleId: "lead-rn", displayName: "Lead RN on duty", sourceLabel: "Synthetic intake owner" },
    { id: "owner-nurse-manager", roleId: "nurse-manager", displayName: "Unit nurse manager", sourceLabel: "Synthetic nursing owner" },
    { id: "owner-ur", roleId: "ur-specialist", displayName: "Victor Bermudez, LCSW / UR reviewer", sourceLabel: "Synthetic UR owner" },
    { id: "owner-safety", roleId: "patient-safety-specialist", displayName: "Patient safety lead", sourceLabel: "Synthetic safety owner" },
    { id: "owner-credentialing", roleId: "credentialing-coordinator", displayName: "Credentialing coordinator", sourceLabel: "Synthetic personnel owner" },
    { id: "owner-transport", roleId: "transportation-coordinator", displayName: "Transportation coordinator", sourceLabel: "Synthetic vendor owner" },
  ],
  events: [
    {
      id: "ops-event-referral-missing-info",
      facilityId: "bayou-vista-behavioral",
      departmentId: "central-intake",
      roleId: "lead-rn",
      ownerId: "owner-lead-rn",
      type: "referral-missing-info",
      summary: "Referral packet is missing collateral contact and current medication list.",
      status: "open",
      severity: "blocked",
      occurredAt: "2026-07-19T08:15:00-05:00",
      dueAt: "2026-07-19T10:00:00-05:00",
      reviewGates: ["operational-review", "clinical-review"],
      sourceState: "source-derived",
      sourceArtifact: "INPATIENT_BEHAVIORAL_HOSPITAL_OPERATIONS_PARKING_LOT.md",
      caseId: "case-004",
    },
    {
      id: "ops-event-ur-gap",
      facilityId: "bayou-vista-behavioral",
      departmentId: "utilization-review",
      roleId: "ur-specialist",
      ownerId: "owner-ur",
      type: "ur-documentation-gap",
      summary: "Concurrent review needs the daily progress note before the denied day can be reconciled.",
      status: "in-progress",
      severity: "urgent",
      occurredAt: "2026-07-19T09:30:00-05:00",
      dueAt: "2026-07-19T17:00:00-05:00",
      reviewGates: ["ur-revenue-cycle-review", "clinical-review"],
      sourceState: "synthetic-fixture",
      sourceArtifact: "EpisodeOperations synthetic projection",
      caseId: "case-004",
      episodeId: "episode-case-004",
    },
    {
      id: "ops-event-safety",
      facilityId: "bayou-vista-behavioral",
      departmentId: "quality-safety",
      roleId: "patient-safety-specialist",
      ownerId: "owner-safety",
      type: "safety-incident",
      summary: "Patient safety follow-up remains open after a unit incident report.",
      status: "acknowledged",
      severity: "warning",
      occurredAt: "2026-07-19T11:20:00-05:00",
      reviewGates: ["clinical-review", "legal-compliance-review", "operational-review"],
      sourceState: "source-derived",
      sourceArtifact: "INPATIENT_BEHAVIORAL_HOSPITAL_OPERATIONS_PARKING_LOT.md",
    },
    {
      id: "ops-event-training",
      facilityId: "bayou-vista-behavioral",
      departmentId: "personnel-training",
      roleId: "credentialing-coordinator",
      ownerId: "owner-credentialing",
      type: "training-credential-exception",
      summary: "Credentialing file needs supervisor review before role access should be expanded.",
      status: "open",
      severity: "watch",
      occurredAt: "2026-07-19T12:00:00-05:00",
      reviewGates: ["legal-compliance-review", "operational-review"],
      sourceState: "source-derived",
      sourceArtifact: "INPATIENT_BEHAVIORAL_HOSPITAL_OPERATIONS_PARKING_LOT.md",
    },
    {
      id: "ops-event-transport-resolved",
      facilityId: "bayou-vista-behavioral",
      departmentId: "ancillary-vendors",
      roleId: "transportation-coordinator",
      ownerId: "owner-transport",
      type: "vendor-blocker",
      summary: "Transport vendor delay was resolved and should not appear as an active exception.",
      status: "resolved",
      severity: "watch",
      occurredAt: "2026-07-19T07:00:00-05:00",
      reviewGates: ["operational-review", "security-privacy-review"],
      sourceState: "source-derived",
      sourceArtifact: "INPATIENT_BEHAVIORAL_HOSPITAL_OPERATIONS_PARKING_LOT.md",
    },
  ],
};

const severityRank: Record<OperationExceptionSeverity, number> = {
  urgent: 4,
  blocked: 3,
  warning: 2,
  watch: 1,
};

function getById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find((item) => item.id === id);
}

export function getOperationsOwnerChain(backbone: OperationsBackbone, event: OperationsEvent): OperationsOwnerChain | undefined {
  const facility = getById(backbone.facilities, event.facilityId);
  const department = getById(backbone.departments, event.departmentId);
  const role = getById(backbone.roles, event.roleId);
  const owner = getById(backbone.owners, event.ownerId);
  if (!facility || !department || !role || !owner) return undefined;
  if (department.facilityId !== facility.id || role.departmentId !== department.id || owner.roleId !== role.id) return undefined;
  return { facility, department, role, owner };
}

export function validateOperationsBackbone(backbone: OperationsBackbone): string[] {
  return backbone.events.flatMap((event) => {
    const chain = getOperationsOwnerChain(backbone, event);
    return chain ? [] : [`${event.id} has an invalid facility -> department -> role -> owner chain`];
  });
}

export function buildOperationsDashboardExceptions(backbone: OperationsBackbone): OperationsDashboardException[] {
  return backbone.events
    .filter((event): event is OperationsEvent & { status: Exclude<OperationEventStatus, "resolved"> } => event.status !== "resolved")
    .map((event) => {
      const chain = getOperationsOwnerChain(backbone, event);
      if (!chain) return undefined;
      const reviewGates = event.reviewGates.length ? event.reviewGates : chain.role.defaultReviewGates;
      return {
        id: `dashboard-exception-${event.id}`,
        sourceEventId: event.id,
        facilityLabel: chain.facility.name,
        departmentLabel: chain.department.label,
        roleLabel: chain.role.label,
        ownerLabel: chain.owner.displayName,
        eventType: event.type,
        summary: event.summary,
        status: event.status,
        severity: event.severity,
        reviewGates,
        sourceArtifact: event.sourceArtifact,
        projectionStatus: "read-only-synthetic-projection",
      };
    })
    .filter((item): item is OperationsDashboardException => Boolean(item))
    .sort((left, right) => severityRank[right.severity] - severityRank[left.severity] || left.departmentLabel.localeCompare(right.departmentLabel));
}

export function filterOperationsExceptionsByGate(
  exceptions: OperationsDashboardException[],
  gate: OperationReviewGate,
): OperationsDashboardException[] {
  return exceptions.filter((exception) => exception.reviewGates.includes(gate));
}
