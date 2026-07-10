/**
 * Parallel workstream contract.
 * Values mirror prisma/schema.prisma enum ParallelWorkstreamStatus — keep in sync.
 */
export const WORKSTREAM_STATUSES = [
  "NOT_STARTED",
  "READY",
  "IN_PROGRESS",
  "PENDING_REVIEW",
  "COMPLETE",
  "BLOCKED",
  "NOT_APPLICABLE",
] as const;
export type WorkstreamStatus = (typeof WORKSTREAM_STATUSES)[number];

export const WORKSTREAMS = [
  "clinical",
  "legalReview",
  "medicalScreening",
  "benefits",
  "authorization",
  "placement",
  "transportation",
  "patientEducation",
] as const;
export type Workstream = (typeof WORKSTREAMS)[number];

export type WorkstreamStatuses = Record<Workstream, WorkstreamStatus>;

export function initialWorkstreamStatuses(): WorkstreamStatuses {
  return Object.fromEntries(WORKSTREAMS.map((w) => [w, "NOT_STARTED"])) as WorkstreamStatuses;
}

const WORKSTREAM_TRANSITIONS: Record<WorkstreamStatus, readonly WorkstreamStatus[]> = {
  NOT_STARTED: ["READY", "IN_PROGRESS", "NOT_APPLICABLE", "BLOCKED"],
  READY: ["IN_PROGRESS", "BLOCKED", "NOT_APPLICABLE"],
  IN_PROGRESS: ["PENDING_REVIEW", "COMPLETE", "BLOCKED"],
  PENDING_REVIEW: ["IN_PROGRESS", "COMPLETE", "BLOCKED"],
  COMPLETE: ["IN_PROGRESS"], // reopening is allowed but audited
  BLOCKED: ["READY", "IN_PROGRESS", "NOT_APPLICABLE"],
  NOT_APPLICABLE: ["READY"],
};

export function canTransitionWorkstream(from: WorkstreamStatus, to: WorkstreamStatus): boolean {
  return WORKSTREAM_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Update one workstream independently of the others.
 * Throws on an invalid transition; never touches sibling workstreams.
 */
export function updateWorkstream(
  statuses: WorkstreamStatuses,
  workstream: Workstream,
  to: WorkstreamStatus,
): WorkstreamStatuses {
  const from = statuses[workstream];
  if (!canTransitionWorkstream(from, to)) {
    throw new Error(`Invalid ${workstream} transition: ${from} -> ${to}`);
  }
  return { ...statuses, [workstream]: to };
}
