import { z } from "zod";

export const DOMAIN_ID_SCHEMA = z.string().min(1).max(200);

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateOnly(value: string): boolean {
  if (!DATE_ONLY_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year!, month! - 1, day!));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month! - 1 &&
    parsed.getUTCDate() === day
  );
}

export const DATE_ONLY_SCHEMA = z.string().refine(isValidDateOnly, "Expected a valid YYYY-MM-DD date");
export type DateOnly = z.infer<typeof DATE_ONLY_SCHEMA>;

export const ISO_DATETIME_SCHEMA = z.string().datetime({ offset: true });
export type IsoDateTime = z.infer<typeof ISO_DATETIME_SCHEMA>;

export const EPISODE_STATUSES = ["ACTIVE", "DISCHARGED", "CLOSED"] as const;
export type EpisodeStatus = (typeof EPISODE_STATUSES)[number];

const EPISODE_STATUS_TRANSITIONS: Record<EpisodeStatus, readonly EpisodeStatus[]> = {
  ACTIVE: ["DISCHARGED", "CLOSED"],
  DISCHARGED: ["CLOSED"],
  CLOSED: [],
};

export function canTransitionEpisodeStatus(from: EpisodeStatus, to: EpisodeStatus): boolean {
  return EPISODE_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionEpisodeStatus<T extends { status: EpisodeStatus }>(
  episode: T,
  to: EpisodeStatus,
): T {
  if (!canTransitionEpisodeStatus(episode.status, to)) {
    throw new Error(`Invalid episode transition: ${episode.status} -> ${to}`);
  }
  return { ...episode, status: to };
}

export const FACILITY_TIMEZONE_SOURCES = ["FACILITY_CONFIGURATION"] as const;
export type FacilityTimezoneSource = (typeof FACILITY_TIMEZONE_SOURCES)[number];

export const FacilityTimezoneConfigSchema = z
  .object({
    facilityTimezone: z.string().min(1).max(100),
    source: z.literal("FACILITY_CONFIGURATION"),
    sourceReferenceId: DOMAIN_ID_SCHEMA,
  })
  .strict()
  .superRefine((value, ctx) => {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: value.facilityTimezone }).format();
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["facilityTimezone"], message: "Unknown IANA timezone" });
    }
  });
export type FacilityTimezoneConfig = z.infer<typeof FacilityTimezoneConfigSchema>;

export function serviceDateForInstant(instant: string, timezone: FacilityTimezoneConfig): DateOnly {
  const parsedInstant = ISO_DATETIME_SCHEMA.parse(instant);
  const config = FacilityTimezoneConfigSchema.parse(timezone);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: config.facilityTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(parsedInstant));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return DATE_ONLY_SCHEMA.parse(`${values.year}-${values.month}-${values.day}`);
}

export const AdmissionHandoffCommandSchema = z
  .object({
    sourceCaseId: DOMAIN_ID_SCHEMA,
    acceptedFacilityResponseId: DOMAIN_ID_SCHEMA,
    facilityId: DOMAIN_ID_SCHEMA,
    programId: DOMAIN_ID_SCHEMA.nullable(),
    unitId: DOMAIN_ID_SCHEMA.nullable(),
    admittedAt: ISO_DATETIME_SCHEMA,
    facilityTimezone: FacilityTimezoneConfigSchema,
    sourcePacketVersionId: DOMAIN_ID_SCHEMA.nullable(),
    sourceCustodyEventId: DOMAIN_ID_SCHEMA.nullable(),
    attestation: z
      .object({
        code: z.literal("AUTHORIZED_ADMISSION_RECORDED"),
        method: z.literal("FACILITY_WORKFLOW"),
      })
      .strict(),
  })
  .strict();
export type AdmissionHandoffCommand = z.infer<typeof AdmissionHandoffCommandSchema>;

export const CASE_EPISODE_RELATIONSHIPS = [
  "ADMISSION_SOURCE",
  "TRANSFER_SOURCE",
  "READMISSION_SOURCE",
] as const;
export type CaseEpisodeRelationship = (typeof CASE_EPISODE_RELATIONSHIPS)[number];

export const CaseEpisodeLinkSchema = z
  .object({
    organizationId: DOMAIN_ID_SCHEMA,
    caseId: DOMAIN_ID_SCHEMA,
    episodeId: DOMAIN_ID_SCHEMA,
    relationship: z.enum(CASE_EPISODE_RELATIONSHIPS),
    linkedAt: ISO_DATETIME_SCHEMA,
    linkedByActorId: DOMAIN_ID_SCHEMA,
    sourceAcceptanceId: DOMAIN_ID_SCHEMA,
    sourcePacketVersionId: DOMAIN_ID_SCHEMA.nullable(),
    sourceCustodyEventId: DOMAIN_ID_SCHEMA.nullable(),
  })
  .strict();
export type CaseEpisodeLink = z.infer<typeof CaseEpisodeLinkSchema>;

export const EpisodeSchema = z
  .object({
    id: DOMAIN_ID_SCHEMA,
    organizationId: DOMAIN_ID_SCHEMA,
    sourceCaseId: DOMAIN_ID_SCHEMA,
    facilityId: DOMAIN_ID_SCHEMA,
    programId: DOMAIN_ID_SCHEMA.nullable(),
    unitId: DOMAIN_ID_SCHEMA.nullable(),
    facilityTimezone: FacilityTimezoneConfigSchema,
    admittedAt: ISO_DATETIME_SCHEMA,
    serviceDate: DATE_ONLY_SCHEMA,
    status: z.enum(EPISODE_STATUSES),
    version: z.number().int().positive(),
    createdAt: ISO_DATETIME_SCHEMA,
    updatedAt: ISO_DATETIME_SCHEMA,
  })
  .strict();
export type Episode = z.infer<typeof EpisodeSchema>;
