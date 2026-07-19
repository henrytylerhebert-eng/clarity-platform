import type { FreshnessState } from "./types";

export const DEFAULT_FRESHNESS_DAYS: Record<string, number> = {
  legalIdentity: 365,
  licenseCertification: 30,
  address: 180,
  website: 90,
  generalPhone: 60,
  admissionsPhone: 30,
  operatingHours: 30,
  personnel: 45,
  serviceLines: 90,
  payerParticipation: 30,
  admissionRequirements: 30,
  transportCapability: 30,
  capacity: 7,
  activeStatus: 30
};

export function freshnessState(asOf: string | Date, verifiedAt: string | Date | null, intervalDays: number): FreshnessState {
  if (!verifiedAt || !Number.isFinite(intervalDays) || intervalDays <= 0) return "UNKNOWN";
  const now = typeof asOf === "string" ? new Date(asOf) : asOf;
  const verified = typeof verifiedAt === "string" ? new Date(verifiedAt) : verifiedAt;
  if (Number.isNaN(now.getTime()) || Number.isNaN(verified.getTime())) return "UNKNOWN";
  const ageDays = (now.getTime() - verified.getTime()) / 86_400_000;
  if (ageDays < 0) return "UNKNOWN";
  if (ageDays <= intervalDays * 0.8) return "CURRENT";
  if (ageDays <= intervalDays) return "DUE_SOON";
  if (ageDays <= intervalDays * 2) return "STALE";
  return "EXPIRED";
}

export function nextReviewAt(verifiedAt: string | Date, intervalDays: number): string | null {
  const d = typeof verifiedAt === "string" ? new Date(verifiedAt) : new Date(verifiedAt);
  if (Number.isNaN(d.getTime()) || intervalDays <= 0) return null;
  d.setUTCDate(d.getUTCDate() + intervalDays);
  return d.toISOString();
}
