import { z } from "zod";
import type { AuthenticatedPrincipal } from "./authentication.js";

/**
 * ADR-0021: only the Louisiana Medicaid release family is persisted so far.
 * A future release family is a new literal here, not a schema/enum change.
 */
export const REV_OPS_RATE_RELEASE_PROGRAM_METHODS = [
  "LA_MEDICAID_INPATIENT_PER_DIEM",
] as const;
export type RevOpsRateReleaseProgramMethod =
  (typeof REV_OPS_RATE_RELEASE_PROGRAM_METHODS)[number];

const text = z.string().trim().min(1).max(500);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timestamp = z.string().datetime();

const RevOpsMedicaidRowRequestSchema = z
  .object({
    providerId: z.string().trim().min(1).max(40),
    facilityName: z.string().trim().min(1).max(200),
    hospitalType: z.string().trim().min(1).max(80),
    rateType: z.string().trim().min(1).max(120),
    perDiemCents: z.number().int().min(0).max(100_000_000_000).nullable(),
    rowEffectiveFrom: isoDate.nullable(),
    medicareNumber: z.string().trim().max(40).nullable(),
    sourceRow: z.number().int().positive(),
  })
  .strict();

export const RecordRateReleaseRequestSchema = z
  .object({
    programMethod: z.enum(REV_OPS_RATE_RELEASE_PROGRAM_METHODS),
    releaseId: z.string().trim().min(3).max(120),
    publisher: text,
    sourceUrl: z.string().url().max(500),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    retrievedAt: timestamp,
    effectiveFrom: isoDate,
    effectiveThrough: isoDate,
    sheet: text,
    rows: z.array(RevOpsMedicaidRowRequestSchema).min(1).max(5000),
    supersedesReleaseId: z.string().trim().min(3).max(120).optional(),
  })
  .strict()
  .refine((request) => request.effectiveFrom <= request.effectiveThrough, {
    message: "effectiveFrom must be on or before effectiveThrough",
    path: ["effectiveFrom"],
  });

export type RecordRateReleaseRequest = z.infer<
  typeof RecordRateReleaseRequestSchema
>;

export type RevOpsRateReleasePermission = "view" | "record";

/** Public reference data: any authenticated principal may view it. Recording
 * or correcting a release is restricted the same way other RevOps
 * administrative actions are (ORGANIZATION_ADMIN only). */
export function revOpsRateReleasePermissionsFor(
  principal: AuthenticatedPrincipal,
): readonly RevOpsRateReleasePermission[] {
  if (principal.roles.includes("ORGANIZATION_ADMIN")) return ["view", "record"];
  return ["view"];
}
