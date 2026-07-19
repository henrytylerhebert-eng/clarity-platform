import type { SourceType } from "./types";

export const SOURCE_TIER: Record<SourceType, number> = {
  OFFICIAL_ORGANIZATION: 1,
  FEDERAL_GOVERNMENT: 2,
  LOUISIANA_DEPARTMENT_OF_HEALTH: 3,
  MEDICARE_CMS: 4,
  OFFICIAL_LICENSING_OR_GOVERNMENT_DIRECTORY: 5,
  LOCAL_GOVERNMENT: 6,
  ACCREDITED_DIRECTORY: 7,
  REPUTABLE_SECONDARY: 8,
  COMMERCIAL_DIRECTORY: 9,
  DISCOVERY_ONLY: 10
};

const FIELD_RULES: Array<{ prefix: string; allowedMaxTier: number; operationalMaxTier: number }> = [
  { prefix: "organization.identifiers", allowedMaxTier: 7, operationalMaxTier: 5 },
  { prefix: "organization.license", allowedMaxTier: 7, operationalMaxTier: 5 },
  { prefix: "locations", allowedMaxTier: 9, operationalMaxTier: 6 },
  { prefix: "contactPoints", allowedMaxTier: 9, operationalMaxTier: 6 },
  { prefix: "programs", allowedMaxTier: 8, operationalMaxTier: 6 },
  { prefix: "payerParticipation", allowedMaxTier: 8, operationalMaxTier: 5 },
  { prefix: "facilityAdmissionProfiles", allowedMaxTier: 8, operationalMaxTier: 6 },
  { prefix: "transportCapabilityProfiles", allowedMaxTier: 8, operationalMaxTier: 6 }
];

export function sourceTier(type: SourceType): number {
  return SOURCE_TIER[type];
}

export function isDiscoveryOnly(type: SourceType): boolean {
  return type === "DISCOVERY_ONLY";
}

export function sourceCanSupportField(type: SourceType, fieldPath: string, operational = false): boolean {
  if (isDiscoveryOnly(type)) return false;
  const rule = FIELD_RULES.find(r => fieldPath.startsWith(r.prefix));
  if (!rule) return SOURCE_TIER[type] <= (operational ? 6 : 8);
  return SOURCE_TIER[type] <= (operational ? rule.operationalMaxTier : rule.allowedMaxTier);
}
