import { type WorkstreamStatuses } from "./workstreams.js";

/**
 * Overall case status. Values mirror prisma/schema.prisma enum CaseStatus — keep in sync.
 */
export const CASE_STATUSES = [
  "DRAFT",
  "INTAKE_IN_PROGRESS",
  "DOCUMENTS_PENDING",
  "DOCUMENTS_RECEIVED",
  "EVIDENCE_PROCESSING",
  "EVIDENCE_REVIEW",
  "INFORMATION_INCOMPLETE",
  "CLINICAL_REVIEW",
  "LEGAL_REVIEW",
  "BENEFITS_REVIEW",
  "AUTHORIZATION_PREPARATION",
  "PACKET_PREPARATION",
  "READY_FOR_ROUTING",
  "ROUTING_IN_PROGRESS",
  "FACILITY_RESPONSE_PENDING",
  "ACCEPTED",
  "TRANSPORT_PENDING",
  "HANDOFF_IN_PROGRESS",
  "TRANSFER_COMPLETE",
  "CLOSED",
  "CANCELLED",
  "WITHDRAWN",
  "NO_PLACEMENT_FOUND",
  "REFERRED_TO_ALTERNATIVE_LEVEL",
] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export const URGENCY_LEVELS = ["ROUTINE", "URGENT", "EMERGENT"] as const;
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

/**
 * Forward transitions plus explicit terminal/exception paths.
 * INFORMATION_INCOMPLETE is reachable from any active review state and returns to it.
 */
const ACTIVE_ORDER: readonly CaseStatus[] = [
  "DRAFT",
  "INTAKE_IN_PROGRESS",
  "DOCUMENTS_PENDING",
  "DOCUMENTS_RECEIVED",
  "EVIDENCE_PROCESSING",
  "EVIDENCE_REVIEW",
  "CLINICAL_REVIEW",
  "LEGAL_REVIEW",
  "BENEFITS_REVIEW",
  "AUTHORIZATION_PREPARATION",
  "PACKET_PREPARATION",
  "READY_FOR_ROUTING",
  "ROUTING_IN_PROGRESS",
  "FACILITY_RESPONSE_PENDING",
  "ACCEPTED",
  "TRANSPORT_PENDING",
  "HANDOFF_IN_PROGRESS",
  "TRANSFER_COMPLETE",
  "CLOSED",
];

const EXIT_STATES: readonly CaseStatus[] = ["CANCELLED", "WITHDRAWN"];
const ROUTING_EXCEPTIONS: readonly CaseStatus[] = [
  "NO_PLACEMENT_FOUND",
  "REFERRED_TO_ALTERNATIVE_LEVEL",
];
const TERMINAL: readonly CaseStatus[] = ["CLOSED", "CANCELLED", "WITHDRAWN"];

export function canTransitionCase(from: CaseStatus, to: CaseStatus): boolean {
  if (from === to) return false;
  if (TERMINAL.includes(from)) return false; // append-only history; reopen = new case decision
  if (EXIT_STATES.includes(to)) return true; // any active case can be cancelled/withdrawn
  if (to === "INFORMATION_INCOMPLETE") return !TERMINAL.includes(from);
  if (from === "INFORMATION_INCOMPLETE") return ACTIVE_ORDER.includes(to);
  if (ROUTING_EXCEPTIONS.includes(to))
    return ["ROUTING_IN_PROGRESS", "FACILITY_RESPONSE_PENDING"].includes(from);
  if (ROUTING_EXCEPTIONS.includes(from))
    return ["READY_FOR_ROUTING", "ROUTING_IN_PROGRESS", "CLOSED"].includes(to);
  const fi = ACTIVE_ORDER.indexOf(from);
  const ti = ACTIVE_ORDER.indexOf(to);
  if (fi === -1 || ti === -1) return false;
  // one step forward, or a bounded step back for rework
  return ti === fi + 1 || (ti < fi && fi - ti <= 3);
}

export interface ClarityCase {
  caseKey: string;
  organizationId: string;
  status: CaseStatus;
  urgency: UrgencyLevel;
  workstreams: WorkstreamStatuses;
}

export function transitionCase(c: ClarityCase, to: CaseStatus): ClarityCase {
  if (!canTransitionCase(c.status, to)) {
    throw new Error(`Invalid case transition: ${c.status} -> ${to}`);
  }
  return { ...c, status: to };
}

/**
 * Emergency and fairness rule (MASTER_ARCHITECTURE §8; MASTER_BUILD_PROMPT rule 10):
 * clinical review of an emergent case proceeds regardless of financial workstreams.
 * Only clinically relevant blockers may hold emergency clinical review.
 */
export function canBeginClinicalReview(c: ClarityCase): boolean {
  if (c.urgency === "EMERGENT") {
    // benefits/authorization/placement state is irrelevant to emergency clinical review
    return c.workstreams.clinical !== "NOT_APPLICABLE";
  }
  return c.workstreams.clinical === "READY" || c.workstreams.clinical === "IN_PROGRESS"
    || c.workstreams.clinical === "NOT_STARTED";
}
