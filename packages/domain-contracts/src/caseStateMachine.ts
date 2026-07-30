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
  "MEDICAL_TRANSFER_REQUIRED",
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

/**
 * Medical-stabilization diversion (ADR-0018, owner ruling 2026-07-29).
 *
 * MEDICAL_TRANSFER_REQUIRED records that a case cannot proceed toward
 * behavioral-health placement until a medical need is addressed. It is a
 * DIVERSION, not a terminal state: it may be entered from the review and
 * routing span, and it returns to the pipeline once the medical need is
 * resolved, or reaches CLOSED if placement is abandoned.
 *
 * It is deliberately NOT in ACTIVE_ORDER — it is off the linear pipeline, so
 * the one-step-forward / bounded-step-back arithmetic below must not apply
 * to it. Cancellation and withdrawal remain available from it because it is
 * not terminal.
 *
 * Medical-stabilization precedence is existing house doctrine: the prescreen
 * possible-pathway derivation already gives it precedence over placement
 * pathways (ADR-0013).
 */
const MEDICAL_DIVERSION_ENTRY: readonly CaseStatus[] = [
  "CLINICAL_REVIEW",
  "LEGAL_REVIEW",
  "BENEFITS_REVIEW",
  "AUTHORIZATION_PREPARATION",
  "PACKET_PREPARATION",
  "READY_FOR_ROUTING",
  "ROUTING_IN_PROGRESS",
  "FACILITY_RESPONSE_PENDING",
];

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
  // Medical diversion: entered only from the review/routing span, and left to
  // any pipeline state (ACTIVE_ORDER includes CLOSED) once medically resolved.
  if (to === "MEDICAL_TRANSFER_REQUIRED") return MEDICAL_DIVERSION_ENTRY.includes(from);
  if (from === "MEDICAL_TRANSFER_REQUIRED") return ACTIVE_ORDER.includes(to);
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

/**
 * Reopening is NOT a normal transition: canTransitionCase deliberately
 * rejects everything out of a terminal state. Reopen is an explicitly
 * permitted, role-gated, rationale-required exception path handled by the
 * command service. It may only land on an active (non-terminal,
 * non-exception) state.
 */
export function canReopenCase(from: CaseStatus, to: CaseStatus): boolean {
  return TERMINAL.includes(from) && ACTIVE_ORDER.includes(to) && to !== "CLOSED";
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
