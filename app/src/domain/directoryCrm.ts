export type DirectoryOrganizationType =
  | "law-enforcement"
  | "crisis-response"
  | "acute-hospital"
  | "behavioral-provider"
  | "resource-provider";

export type DirectoryWorkflowContext =
  | "all"
  | "prescreen"
  | "hospital"
  | "behavioral"
  | "discharge"
  | "admin";

export type DirectoryWorkflowModule =
  | "prescreen"
  | "guided-intake"
  | "packet-prep"
  | "bed-review-request"
  | "telemed-consult-request"
  | "routing-response"
  | "admission-readiness"
  | "episode-operations"
  | "ur"
  | "discharge-planning"
  | "profile-verification"
  | "custody-ledger";

export type DirectoryReviewState =
  | "source-confirmed"
  | "human-confirmed"
  | "stale"
  | "unknown"
  | "do-not-use";

export interface DirectoryLocation {
  id: string;
  name: string;
  kind: string;
  city: string;
  serviceLineIds: string[];
}

export interface DirectoryServiceLine {
  id: string;
  name: string;
  workflowContext: DirectoryWorkflowContext;
  capabilities: string[];
  requirements: string[];
  blockedActions: string[];
  capacityStatus: "Unknown" | "Synthetic only";
  reviewState: DirectoryReviewState;
}

export interface DirectoryPersonnelRole {
  id: string;
  label: string;
  peopleExample: string;
  modules: DirectoryWorkflowModule[];
  reviewState: DirectoryReviewState;
}

export interface DirectoryPartnerRelationship {
  id: string;
  targetOrganizationName: string;
  relationshipType: string;
  allowedWorkflows: DirectoryWorkflowContext[];
  reviewState: DirectoryReviewState;
}

export interface DirectoryOrganization {
  id: string;
  name: string;
  type: DirectoryOrganizationType;
  category: DirectoryWorkflowContext;
  parentName: string;
  city: string;
  summary: string;
  locations: DirectoryLocation[];
  serviceLines: DirectoryServiceLine[];
  personnel: DirectoryPersonnelRole[];
  partnerRelationships: DirectoryPartnerRelationship[];
  modules: DirectoryWorkflowModule[];
  reviewState: DirectoryReviewState;
  verificationNote: string;
  allowedIntentLabels: string[];
}

export interface DirectoryCrmFilters {
  query: string;
  organizationType: "all" | DirectoryOrganizationType;
  workflowContext: DirectoryWorkflowContext;
  reviewState: "all" | DirectoryReviewState;
}

export const directoryWorkflowLabels: Record<DirectoryWorkflowContext, string> = {
  all: "All workflows",
  prescreen: "Prescreen access",
  hospital: "Hospital / ED",
  behavioral: "Behavioral provider",
  discharge: "Discharge resources",
  admin: "Admin verification",
};

export const directoryOrganizationTypeLabels: Record<DirectoryOrganizationType, string> = {
  "law-enforcement": "Law enforcement",
  "crisis-response": "Crisis response",
  "acute-hospital": "Acute hospital / ED",
  "behavioral-provider": "Behavioral provider",
  "resource-provider": "Resource provider",
};

export const directoryReviewStateLabels: Record<DirectoryReviewState, string> = {
  "source-confirmed": "Source-confirmed",
  "human-confirmed": "Human-confirmed",
  stale: "Stale",
  unknown: "Unknown",
  "do-not-use": "Do not use",
};

export const forbiddenDirectoryIntentLabels = [
  "Send referral",
  "Reserve bed",
  "Admit patient",
  "Approve placement",
  "Verify benefits",
  "Provision user",
  "Sync EMR",
];

export const directoryCrmOrganizations: DirectoryOrganization[] = [
  {
    id: "lafayette-police",
    name: "Lafayette Police Department",
    type: "law-enforcement",
    category: "prescreen",
    parentName: "Municipal agency",
    city: "Lafayette",
    summary: "Agency profile for officer prescreen, source capture, custody context, and handoff work.",
    reviewState: "source-confirmed",
    verificationNote: "Synthetic organization profile. Demo role scoping is not authentication.",
    modules: ["prescreen", "guided-intake", "custody-ledger"],
    allowedIntentLabels: ["Prepare prescreen handoff", "Queue profile verification"],
    locations: [
      { id: "lpd-field", name: "Field response", kind: "Operational unit", city: "Lafayette", serviceLineIds: ["lpd-prescreen"] },
    ],
    serviceLines: [
      {
        id: "lpd-prescreen",
        name: "Field prescreen and custody handoff",
        workflowContext: "prescreen",
        capabilities: ["Start referral", "Capture source facts", "Record custody context"],
        requirements: ["Officer identity", "Source/custody facts", "Handoff destination"],
        blockedActions: ["No clinical determination", "No placement decision", "No payer access"],
        capacityStatus: "Unknown",
        reviewState: "source-confirmed",
      },
    ],
    personnel: [
      {
        id: "lpd-officer",
        label: "Officer",
        peopleExample: "Patrol officer or field supervisor",
        modules: ["prescreen", "guided-intake", "custody-ledger"],
        reviewState: "source-confirmed",
      },
    ],
    partnerRelationships: [
      {
        id: "lpd-crisis",
        targetOrganizationName: "Lafayette Community Crisis Response",
        relationshipType: "Prescreen handoff",
        allowedWorkflows: ["prescreen"],
        reviewState: "unknown",
      },
    ],
  },
  {
    id: "lafayette-crisis-response",
    name: "Lafayette Community Crisis Response",
    type: "crisis-response",
    category: "prescreen",
    parentName: "Community response organization",
    city: "Lafayette",
    summary: "Mobile triage profile for de-escalation, prescreen support, and warm handoff.",
    reviewState: "unknown",
    verificationNote: "Proposed profile type. Operational review required before production use.",
    modules: ["prescreen", "guided-intake", "packet-prep"],
    allowedIntentLabels: ["Prepare prescreen handoff", "Prepare ED referral", "Queue profile verification"],
    locations: [
      { id: "lcr-mobile", name: "Mobile response", kind: "Response team", city: "Lafayette", serviceLineIds: ["lcr-triage"] },
    ],
    serviceLines: [
      {
        id: "lcr-triage",
        name: "Community triage and warm handoff",
        workflowContext: "prescreen",
        capabilities: ["Assist triage", "Document observed facts", "Coordinate handoff"],
        requirements: ["Safety context", "Collateral status", "Receiving handoff"],
        blockedActions: ["No legal-status validation", "No autonomous disposition"],
        capacityStatus: "Unknown",
        reviewState: "unknown",
      },
    ],
    personnel: [
      {
        id: "lcr-responder",
        label: "Crisis responder",
        peopleExample: "Responder or triage coordinator",
        modules: ["prescreen", "guided-intake", "packet-prep"],
        reviewState: "unknown",
      },
    ],
    partnerRelationships: [
      {
        id: "lcr-ed",
        targetOrganizationName: "Lafayette General Emergency Department",
        relationshipType: "ED handoff",
        allowedWorkflows: ["prescreen", "hospital"],
        reviewState: "unknown",
      },
    ],
  },
  {
    id: "lafayette-general-ed",
    name: "Lafayette General Emergency Department",
    type: "acute-hospital",
    category: "hospital",
    parentName: "Acute care hospital",
    city: "Lafayette",
    summary: "ED profile for behavioral-health referral, bed-review request, packet prep, consult request, and discharge resources.",
    reviewState: "source-confirmed",
    verificationNote: "Synthetic hospital profile. EMR integration is not implemented.",
    modules: ["prescreen", "packet-prep", "bed-review-request", "telemed-consult-request", "discharge-planning"],
    allowedIntentLabels: ["Prepare ED referral", "Prepare bed review request", "Prepare telemed consult request", "Add discharge candidate"],
    locations: [
      { id: "lge-ed", name: "Emergency department", kind: "ED campus", city: "Lafayette", serviceLineIds: ["lge-referral", "lge-consult"] },
    ],
    serviceLines: [
      {
        id: "lge-referral",
        name: "ED behavioral-health referral",
        workflowContext: "hospital",
        capabilities: ["Prepare referral", "Prepare bed review request", "Prepare packet"],
        requirements: ["Medical clearance", "Referral packet", "Handoff contact"],
        blockedActions: ["No live referral send", "No live bed reservation"],
        capacityStatus: "Unknown",
        reviewState: "source-confirmed",
      },
      {
        id: "lge-consult",
        name: "Telemed psychiatric consult request",
        workflowContext: "hospital",
        capabilities: ["Prepare consult request", "Summarize reason", "Attach review need"],
        requirements: ["Consult reason", "Risk context", "Medical status"],
        blockedActions: ["No EMR sync", "No live consult routing"],
        capacityStatus: "Unknown",
        reviewState: "unknown",
      },
    ],
    personnel: [
      {
        id: "lge-case-manager",
        label: "ED case manager",
        peopleExample: "Case manager or behavioral health liaison",
        modules: ["packet-prep", "bed-review-request", "telemed-consult-request", "discharge-planning"],
        reviewState: "source-confirmed",
      },
    ],
    partnerRelationships: [
      {
        id: "lge-oceans-intake",
        targetOrganizationName: "Oceans Lafayette Central Intake",
        relationshipType: "Central intake referral path",
        allowedWorkflows: ["hospital", "behavioral"],
        reviewState: "stale",
      },
    ],
  },
  {
    id: "oceans-parent",
    name: "Oceans Behavioral Health Parent Company",
    type: "behavioral-provider",
    category: "admin",
    parentName: "Parent company",
    city: "Louisiana",
    summary: "Parent profile for child locations, service-line setup, personnel access, central intake, admitted operations, UR, and discharge planning.",
    reviewState: "source-confirmed",
    verificationNote: "Synthetic parent profile. Production account provisioning remains blocked.",
    modules: ["profile-verification", "routing-response", "admission-readiness", "episode-operations", "ur", "discharge-planning"],
    allowedIntentLabels: ["Queue profile verification"],
    locations: [
      { id: "oceans-lafayette", name: "Oceans Lafayette", kind: "Child location", city: "Lafayette", serviceLineIds: ["oceans-intake", "oceans-episode"] },
    ],
    serviceLines: [
      {
        id: "oceans-intake",
        name: "Central intake administration",
        workflowContext: "admin",
        capabilities: ["Configure child locations", "Manage service lines", "Review personnel access"],
        requirements: ["Approved service lines", "Location profiles", "Personnel roles"],
        blockedActions: ["No production user provisioning", "No automatic acceptance"],
        capacityStatus: "Unknown",
        reviewState: "source-confirmed",
      },
      {
        id: "oceans-episode",
        name: "Admitted operations and UR oversight",
        workflowContext: "behavioral",
        capabilities: ["Monitor episode operations", "Track UR", "Track discharge planning"],
        requirements: ["Accepted source handoff", "Facility timezone lineage", "Human review"],
        blockedActions: ["No clinical decisioning", "No payer guarantee"],
        capacityStatus: "Unknown",
        reviewState: "source-confirmed",
      },
    ],
    personnel: [
      {
        id: "oceans-admin",
        label: "Parent company admin",
        peopleExample: "Regional operator or compliance owner",
        modules: ["profile-verification", "episode-operations", "ur", "discharge-planning"],
        reviewState: "source-confirmed",
      },
    ],
    partnerRelationships: [
      {
        id: "parent-child",
        targetOrganizationName: "Oceans Lafayette Central Intake",
        relationshipType: "Parent to child location",
        allowedWorkflows: ["admin", "behavioral"],
        reviewState: "source-confirmed",
      },
    ],
  },
  {
    id: "oceans-lafayette-central-intake",
    name: "Oceans Lafayette Central Intake",
    type: "behavioral-provider",
    category: "behavioral",
    parentName: "Oceans Behavioral Health Parent Company",
    city: "Lafayette",
    summary: "Central intake profile for packet review, routing response, admission readiness, episode operations, UR, and discharge planning.",
    reviewState: "stale",
    verificationNote: "Stale synthetic verification. Capacity is not live.",
    modules: ["packet-prep", "routing-response", "admission-readiness", "episode-operations", "ur", "discharge-planning"],
    allowedIntentLabels: ["Prepare ED referral", "Prepare bed review request", "Queue profile verification"],
    locations: [
      { id: "oli-central", name: "Central intake hub", kind: "Intake location", city: "Lafayette", serviceLineIds: ["oli-intake"] },
    ],
    serviceLines: [
      {
        id: "oli-intake",
        name: "Central intake and routing response",
        workflowContext: "behavioral",
        capabilities: ["Receive packets", "Record routing response", "Start admission readiness"],
        requirements: ["Packet preview", "Medical clearance", "Legal status source"],
        blockedActions: ["No automatic acceptance", "No live capacity claim"],
        capacityStatus: "Unknown",
        reviewState: "stale",
      },
    ],
    personnel: [
      {
        id: "oli-coordinator",
        label: "Intake coordinator",
        peopleExample: "Central intake coordinator or review clinician",
        modules: ["packet-prep", "routing-response", "admission-readiness", "episode-operations"],
        reviewState: "stale",
      },
    ],
    partnerRelationships: [
      {
        id: "oli-lge",
        targetOrganizationName: "Lafayette General Emergency Department",
        relationshipType: "ED referral partnership",
        allowedWorkflows: ["hospital", "behavioral"],
        reviewState: "stale",
      },
    ],
  },
  {
    id: "acadian-stepdown",
    name: "Acadian Stepdown Nursing",
    type: "resource-provider",
    category: "discharge",
    parentName: "Independent resource provider",
    city: "New Iberia",
    summary: "Discharge resource profile for skilled nursing, rehab, medication support, and functional assessment requirements.",
    reviewState: "unknown",
    verificationNote: "Unknown review state. Resource profile is synthetic only.",
    modules: ["discharge-planning", "profile-verification"],
    allowedIntentLabels: ["Add discharge candidate", "Queue profile verification"],
    locations: [
      { id: "asn-main", name: "Main resource profile", kind: "Skilled nursing", city: "New Iberia", serviceLineIds: ["asn-snf"] },
    ],
    serviceLines: [
      {
        id: "asn-snf",
        name: "Skilled nursing and rehab",
        workflowContext: "discharge",
        capabilities: ["Skilled nursing", "Medication support", "Mobility support"],
        requirements: ["Discharge plan", "Medication list", "Functional assessment"],
        blockedActions: ["Behavioral acuity needs review", "No live availability claim"],
        capacityStatus: "Unknown",
        reviewState: "unknown",
      },
    ],
    personnel: [
      {
        id: "asn-admissions",
        label: "Admissions coordinator",
        peopleExample: "Admissions coordinator or nursing contact",
        modules: ["discharge-planning", "profile-verification"],
        reviewState: "unknown",
      },
    ],
    partnerRelationships: [],
  },
  {
    id: "teche-primary",
    name: "Teche Primary Care Clinic",
    type: "resource-provider",
    category: "discharge",
    parentName: "Independent resource provider",
    city: "Abbeville",
    summary: "Primary care follow-up profile for discharge continuity and medication follow-up.",
    reviewState: "source-confirmed",
    verificationNote: "Synthetic source-confirmed baseline. No scheduling integration.",
    modules: ["discharge-planning", "profile-verification"],
    allowedIntentLabels: ["Add discharge candidate", "Queue profile verification"],
    locations: [
      { id: "tpc-clinic", name: "Primary care clinic", kind: "Clinic", city: "Abbeville", serviceLineIds: ["tpc-primary"] },
    ],
    serviceLines: [
      {
        id: "tpc-primary",
        name: "Primary care follow-up",
        workflowContext: "discharge",
        capabilities: ["Primary care follow-up", "Medication continuity"],
        requirements: ["Discharge summary", "Follow-up need"],
        blockedActions: ["Not an acute placement destination", "No schedule claim"],
        capacityStatus: "Unknown",
        reviewState: "source-confirmed",
      },
    ],
    personnel: [
      {
        id: "tpc-scheduler",
        label: "Clinic scheduler",
        peopleExample: "Scheduler or provider panel admin",
        modules: ["discharge-planning", "profile-verification"],
        reviewState: "source-confirmed",
      },
    ],
    partnerRelationships: [],
  },
  {
    id: "gulf-south-cardiology",
    name: "Gulf South Cardiology Group",
    type: "resource-provider",
    category: "discharge",
    parentName: "Independent specialist group",
    city: "Lafayette",
    summary: "Specialist profile for cardiology consult and medication-risk review after discharge.",
    reviewState: "stale",
    verificationNote: "Stale synthetic verification. No live scheduling or referral send.",
    modules: ["discharge-planning", "profile-verification"],
    allowedIntentLabels: ["Add discharge candidate", "Queue profile verification"],
    locations: [
      { id: "gsc-clinic", name: "Specialty clinic", kind: "Specialist", city: "Lafayette", serviceLineIds: ["gsc-cardiology"] },
    ],
    serviceLines: [
      {
        id: "gsc-cardiology",
        name: "Cardiology consult",
        workflowContext: "discharge",
        capabilities: ["Specialist consult", "Medication-risk review"],
        requirements: ["Consult reason", "Medication list", "Recent vitals"],
        blockedActions: ["Not a receiving psychiatric facility", "No live scheduling"],
        capacityStatus: "Unknown",
        reviewState: "stale",
      },
    ],
    personnel: [
      {
        id: "gsc-referral",
        label: "Referral coordinator",
        peopleExample: "Referral coordinator or specialist office admin",
        modules: ["discharge-planning", "profile-verification"],
        reviewState: "stale",
      },
    ],
    partnerRelationships: [],
  },
];

export function filterDirectoryOrganizations(
  organizations: DirectoryOrganization[],
  filters: DirectoryCrmFilters,
): DirectoryOrganization[] {
  const query = filters.query.trim().toLowerCase();
  return organizations.filter((organization) => {
    const matchesType = filters.organizationType === "all" || organization.type === filters.organizationType;
    const matchesReview = filters.reviewState === "all" || organization.reviewState === filters.reviewState;
    const matchesWorkflow =
      filters.workflowContext === "all" ||
      organization.category === filters.workflowContext ||
      organization.serviceLines.some((line) => line.workflowContext === filters.workflowContext) ||
      organization.partnerRelationships.some((relationship) => relationship.allowedWorkflows.includes(filters.workflowContext));

    const searchable = [
      organization.name,
      organization.type,
      organization.category,
      organization.parentName,
      organization.city,
      organization.summary,
      ...organization.modules,
      ...organization.locations.flatMap((location) => [location.name, location.kind, location.city]),
      ...organization.serviceLines.flatMap((line) => [
        line.name,
        line.workflowContext,
        ...line.capabilities,
        ...line.requirements,
        ...line.blockedActions,
      ]),
      ...organization.personnel.flatMap((person) => [person.label, person.peopleExample, ...person.modules]),
      ...organization.partnerRelationships.flatMap((relationship) => [
        relationship.targetOrganizationName,
        relationship.relationshipType,
        ...relationship.allowedWorkflows,
      ]),
    ]
      .join(" ")
      .toLowerCase();

    const matchesQuery = !query || searchable.includes(query);
    return matchesType && matchesReview && matchesWorkflow && matchesQuery;
  });
}

export function getDirectoryOrganization(id: string): DirectoryOrganization | undefined {
  return directoryCrmOrganizations.find((organization) => organization.id === id);
}

export function hasForbiddenDirectoryIntentLabel(label: string): boolean {
  return forbiddenDirectoryIntentLabels.some((forbidden) => label.toLowerCase().includes(forbidden.toLowerCase()));
}
