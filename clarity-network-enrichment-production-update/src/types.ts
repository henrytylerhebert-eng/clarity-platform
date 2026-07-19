export const ENTITY_RESOLUTION_STATUSES = [
  "MATCHED", "PROBABLE_MATCH", "AMBIGUOUS", "NO_MATCH", "CONFLICT", "INACTIVE_OR_CLOSED"
] as const;
export type EntityResolutionStatus = typeof ENTITY_RESOLUTION_STATUSES[number];

export const REVIEW_STATES = [
  "UNRESEARCHED", "CANDIDATE", "SOURCE_CONFIRMED", "HUMAN_CONFIRMED", "CONFLICT", "STALE", "REJECTED", "SUPERSEDED", "DEPRECATED"
] as const;
export type ReviewState = typeof REVIEW_STATES[number];

export const FRESHNESS_STATES = ["CURRENT", "DUE_SOON", "STALE", "EXPIRED", "UNKNOWN"] as const;
export type FreshnessState = typeof FRESHNESS_STATES[number];

export const SOURCE_TYPES = [
  "OFFICIAL_ORGANIZATION", "FEDERAL_GOVERNMENT", "LOUISIANA_DEPARTMENT_OF_HEALTH",
  "MEDICARE_CMS", "OFFICIAL_LICENSING_OR_GOVERNMENT_DIRECTORY", "LOCAL_GOVERNMENT",
  "ACCREDITED_DIRECTORY", "REPUTABLE_SECONDARY", "COMMERCIAL_DIRECTORY", "DISCOVERY_ONLY"
] as const;
export type SourceType = typeof SOURCE_TYPES[number];

export type JsonScalar = string | number | boolean | null;
export type JsonValue = JsonScalar | JsonValue[] | { [key: string]: JsonValue };

export interface AddressInput {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
}

export interface ResolutionTarget {
  name: string;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  address?: AddressInput | null;
  phone?: string | null;
  website?: string | null;
  parentName?: string | null;
  identifiers?: Array<{ type: string; value: string }>;
}

export interface ResolutionCandidate {
  id: string;
  name: string;
  aliases?: string[];
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  address?: AddressInput | null;
  phone?: string | null;
  website?: string | null;
  parentName?: string | null;
  identifiers?: Array<{ type: string; value: string }>;
  status?: "ACTIVE" | "INACTIVE" | "CLOSED" | "UNKNOWN";
}

export interface MatchSignal {
  signal: string;
  weight: number;
  matched: boolean;
  detail: string;
}

export interface ScoredCandidate {
  candidateId: string;
  rawScore: number;
  normalizedScore: number;
  hardConflict: boolean;
  signals: MatchSignal[];
}

export interface EntityResolutionResult {
  status: EntityResolutionStatus;
  selectedCandidateId: string | null;
  confidence: number;
  margin: number;
  reason: string;
  candidates: ScoredCandidate[];
  requiresHumanReview: boolean;
}

export interface FieldEvidence {
  evidenceId: string;
  sourceType: SourceType;
  sourceTier: number;
  sourceTitle: string;
  sourceUrl: string;
  retrievedAt: string;
  publishedOrEffectiveAt: string | null;
  evidenceText: string;
  supportsFields: string[];
  scope: "ORGANIZATION" | "LOCATION" | "PROGRAM" | "CONTACT" | "PAYER" | "ADMISSION_PROFILE" | "TRANSPORT";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  contentHash?: string | null;
}

export interface CandidateField {
  candidateId: string;
  fieldPath: string;
  currentValue: JsonValue | null;
  proposedValue: JsonValue | null;
  normalizedValue: JsonValue | null;
  reviewState: ReviewState;
  operationalUseStatus: "RESEARCH_ONLY" | "REQUIRES_REVIEW" | "APPROVED_REFERENCE" | "APPROVED_OPERATIONAL" | "SUSPENDED" | "RETIRED";
  evidenceIds: string[];
  confidence: "HIGH" | "MEDIUM" | "LOW";
  sourceEffectiveAt: string | null;
  lastHumanVerifiedAt: string | null;
  nextReviewAt: string | null;
  proposedReviewerRoles: string[];
}

export interface ConflictSet {
  conflictId: string;
  fieldPath: string;
  candidateIds: string[];
  reason: string;
  recommendedReviewerRoles: string[];
}

export interface EnrichmentPackage {
  schemaVersion: "clarity.network-enrichment.v1";
  runId: string;
  organizationId: string;
  entityResolution: EntityResolutionResult;
  candidates: CandidateField[];
  evidence: FieldEvidence[];
  conflicts: ConflictSet[];
  unresolvedFields: Array<{ fieldPath: string; reason: string; recommendedAction: string }>;
  limitations: string[];
}
