import type { BehavioralHealthCase as CaseRow, Prisma } from "@prisma/client";
import {
  CASE_STATUSES,
  URGENCY_LEVELS,
  WORKSTREAM_STATUSES,
  WORKSTREAMS,
  type CaseStatus,
  type ClarityCase,
  type UrgencyLevel,
  type Workstream,
  type WorkstreamStatus,
  type WorkstreamStatuses,
} from "@clarity/domain-contracts";

/**
 * Domain shape persisted by this package: the contract ClarityCase plus the
 * schema-required patient token FK and the row-owned timestamps.
 *
 * caseKey maps onto the row primary key `id` (client-supplied cuid-compatible
 * string). The migrated schema has no separate caseKey column; adding one
 * would require a migration this issue does not need. Consequence: caseKey is
 * globally unique, not per-organization unique — documented limitation.
 */
export interface PersistedCase extends ClarityCase {
  readonly patientTokenId: string;
  readonly openedAt?: Date;
  readonly closedAt?: Date | null;
}

/** Column names for the eight parallel workstreams, in contract order. */
export const WORKSTREAM_COLUMNS = {
  clinical: "clinicalStatus",
  legalReview: "legalReviewStatus",
  medicalScreening: "medicalScreeningStatus",
  benefits: "benefitsStatus",
  authorization: "authorizationStatus",
  placement: "placementStatus",
  transportation: "transportationStatus",
  patientEducation: "patientEducationStatus",
} as const satisfies Record<Workstream, keyof CaseRow>;

function parseEnum<T extends string>(value: string, allowed: readonly T[], field: string): T {
  if ((allowed as readonly string[]).includes(value)) return value as T;
  throw new Error(`Row field ${field} has value "${value}" outside the domain contract`);
}

export function rowToDomain(row: CaseRow): PersistedCase {
  const workstreams = Object.fromEntries(
    WORKSTREAMS.map((w) => [
      w,
      parseEnum<WorkstreamStatus>(row[WORKSTREAM_COLUMNS[w]] as string, WORKSTREAM_STATUSES, WORKSTREAM_COLUMNS[w]),
    ]),
  ) as WorkstreamStatuses;
  return {
    caseKey: row.id,
    organizationId: row.organizationId,
    patientTokenId: row.patientTokenId,
    status: parseEnum<CaseStatus>(row.status, CASE_STATUSES, "status"),
    urgency: parseEnum<UrgencyLevel>(row.urgency, URGENCY_LEVELS, "urgency"),
    workstreams,
    openedAt: row.openedAt,
    closedAt: row.closedAt,
  };
}

export function domainToCreateRow(
  organizationId: string,
  data: PersistedCase,
): Prisma.BehavioralHealthCaseUncheckedCreateInput {
  parseEnum<CaseStatus>(data.status, CASE_STATUSES, "status");
  parseEnum<UrgencyLevel>(data.urgency, URGENCY_LEVELS, "urgency");
  const workstreamColumns = Object.fromEntries(
    WORKSTREAMS.map((w) => [
      WORKSTREAM_COLUMNS[w],
      parseEnum<WorkstreamStatus>(data.workstreams[w], WORKSTREAM_STATUSES, w),
    ]),
  );
  return {
    id: data.caseKey,
    organizationId,
    patientTokenId: data.patientTokenId,
    status: data.status,
    urgency: data.urgency,
    ...workstreamColumns,
  };
}
