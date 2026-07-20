import { z } from "zod";
import { DOMAIN_ID_SCHEMA } from "./episode.js";
import { NETWORK_ENRICHMENT_SCHEMA_VERSION } from "./networkEnrichmentShared.js";

/**
 * Network enrichment — entity resolution, research accuracy, evidence,
 * freshness, and conflict-detection contracts.
 *
 * Reconciliation note (see the reconciliation report for the full conflict
 * map): this module is the entity-resolution / candidate-data-quality half
 * of network enrichment, carried over verbatim from the PR #29 stream
 * (originally `feat: network-enrichment Phase 1 contracts`). It is a sibling
 * to `networkEnrichmentReview.ts` (the human-review/persistence workflow
 * half, carried over from `codex/om/sync-main` packets 1-16), not a
 * replacement for it. Neither module was created after inspecting the
 * other; they were reconciled here rather than merged, because they model
 * different ends of the same pipeline:
 *
 *   resolution (this file) -> candidate enrichment package
 *     -> review and persistence (networkEnrichmentReview.ts)
 *     -> future controlled canonical promotion (out of scope here)
 *
 * Pure types, Zod schemas, deterministic normalization, entity resolution,
 * source authority, freshness, conflict detection, review-routing policy,
 * and candidate-package validation only — no I/O, no persistence, no
 * scraping, no external APIs, no canonical mutation.
 *
 * Boundary invariants encoded here (originally ADR-0014 in the PR #29
 * stream; that ADR number collides with the prescreen role-mapping ADR-0014
 * from a separate stream and needs renumbering as its own follow-up, not
 * addressed by this reconciliation):
 * - Enrichment output is candidate data. Nothing in this module can write a
 *   canonical record; promotion requires a separate authorized server command.
 * - Agent output can never carry the HUMAN_CONFIRMED review state.
 * - Every populated candidate field must cite supporting evidence, and
 *   DISCOVERY_ONLY sources can never support a populated field.
 * - Unknown scalar values are null, never the string "Unknown".
 * - Conflicting candidate values are preserved and surfaced, not collapsed.
 * - Sensitive admission/payer/transport/legal fields stay REQUIRES_REVIEW
 *   until an authorized human decision recorded elsewhere.
 *
 * Reviewer roles here (`NetworkReviewerRole`) are this stream's PROPOSED
 * review vocabulary, not the schema `UserRole` enum, and are deliberately
 * unmapped and unenforced — see the module-level note above
 * `NETWORK_REVIEWER_ROLES` for the (different, non-identical) vocabulary
 * `networkEnrichmentReview.ts` already maps and enforces at runtime. That
 * gap between "proposed, unmapped" and "mapped, enforced" is a real
 * unresolved conflict between the two streams, not something this
 * reconciliation resolves.
 */

// ---------------------------------------------------------------------------
// Vocabularies
// ---------------------------------------------------------------------------

export const NETWORK_ENTITY_RESOLUTION_STATUSES = [
  "MATCHED",
  "PROBABLE_MATCH",
  "AMBIGUOUS",
  "NO_MATCH",
  "CONFLICT",
  "INACTIVE_OR_CLOSED",
] as const;
export type NetworkEntityResolutionStatus =
  (typeof NETWORK_ENTITY_RESOLUTION_STATUSES)[number];

/**
 * Candidate-field lifecycle state, as produced by resolution/agents before a
 * package enters human review. NOT the same enum as
 * `NetworkEnrichmentReviewState` in networkEnrichmentReview.ts (that one
 * tracks a persisted review record's workflow state and uses REVIEW_PENDING
 * where this uses CANDIDATE at the equivalent lifecycle position). Both
 * names and values are kept as each stream defined them; unifying them
 * would force two different lifecycles into one type and was not
 * requested. A future stitching layer will need an explicit mapping
 * function between the two — that function does not exist yet.
 */
export const NETWORK_REVIEW_STATES = [
  "UNRESEARCHED",
  "CANDIDATE",
  "SOURCE_CONFIRMED",
  "HUMAN_CONFIRMED",
  "CONFLICT",
  "STALE",
  "REJECTED",
  "SUPERSEDED",
  "DEPRECATED",
] as const;
export type NetworkReviewState = (typeof NETWORK_REVIEW_STATES)[number];

export const NETWORK_FRESHNESS_STATES = [
  "CURRENT",
  "DUE_SOON",
  "STALE",
  "EXPIRED",
  "UNKNOWN",
] as const;
export type NetworkFreshnessState = (typeof NETWORK_FRESHNESS_STATES)[number];

export const NETWORK_SOURCE_TYPES = [
  "OFFICIAL_ORGANIZATION",
  "FEDERAL_GOVERNMENT",
  "LOUISIANA_DEPARTMENT_OF_HEALTH",
  "MEDICARE_CMS",
  "OFFICIAL_LICENSING_OR_GOVERNMENT_DIRECTORY",
  "LOCAL_GOVERNMENT",
  "ACCREDITED_DIRECTORY",
  "REPUTABLE_SECONDARY",
  "COMMERCIAL_DIRECTORY",
  "DISCOVERY_ONLY",
] as const;
export type NetworkSourceType = (typeof NETWORK_SOURCE_TYPES)[number];

export const NETWORK_OPERATIONAL_USE_STATUSES = [
  "RESEARCH_ONLY",
  "REQUIRES_REVIEW",
  "APPROVED_REFERENCE",
  "APPROVED_OPERATIONAL",
  "SUSPENDED",
  "RETIRED",
] as const;
export type NetworkOperationalUseStatus =
  (typeof NETWORK_OPERATIONAL_USE_STATUSES)[number];

export const NETWORK_EVIDENCE_SCOPES = [
  "ORGANIZATION",
  "LOCATION",
  "PROGRAM",
  "CONTACT",
  "PAYER",
  "ADMISSION_PROFILE",
  "TRANSPORT",
] as const;
export type NetworkEvidenceScope = (typeof NETWORK_EVIDENCE_SCOPES)[number];

export const NETWORK_CONFIDENCE_LEVELS = ["HIGH", "MEDIUM", "LOW"] as const;
export type NetworkConfidenceLevel = (typeof NETWORK_CONFIDENCE_LEVELS)[number];

/**
 * Proposed reviewer-role vocabulary from the source package. NOT the schema
 * `UserRole` enum; the mapping is an unresolved owner decision and nothing
 * in this module's runtime authorizes against these values.
 *
 * Overlaps but is not identical to `NetworkSourceReviewRole` in
 * networkEnrichmentReview.ts: both share NETWORK_REVIEWER,
 * FACILITY_CLINICAL_GOVERNANCE, FACILITY_LEGAL_COMPLIANCE, and
 * FACILITY_OPERATIONS, but this vocabulary adds PAYER_BENEFITS_REVIEWER and
 * COMPLIANCE_REVIEWER where the review-side vocabulary instead adds
 * NETWORK_COMPLIANCE_REVIEWER. That divergence is preserved rather than
 * collapsed — the two are not truly identical, and the review-side vocabulary
 * is already runtime-enforced (mapped onto real `UserRole` values) while this
 * one deliberately is not. Reconciling them into one canonical proposed-role
 * vocabulary is a real open question for a future owner decision, not
 * resolved here.
 */
export const NETWORK_REVIEWER_ROLES = [
  "NETWORK_REVIEWER",
  "FACILITY_CLINICAL_GOVERNANCE",
  "FACILITY_LEGAL_COMPLIANCE",
  "FACILITY_OPERATIONS",
  "PAYER_BENEFITS_REVIEWER",
  "COMPLIANCE_REVIEWER",
] as const;
export type NetworkReviewerRole = (typeof NETWORK_REVIEWER_ROLES)[number];

/**
 * Re-exported for anyone importing directly from this module path rather
 * than the package root or the shared module; the canonical declaration now
 * lives in networkEnrichmentShared.ts.
 */
export { NETWORK_ENRICHMENT_SCHEMA_VERSION };

export type NetworkJsonScalar = string | number | boolean | null;
export type NetworkJsonValue =
  | NetworkJsonScalar
  | NetworkJsonValue[]
  | { [key: string]: NetworkJsonValue };

export const NETWORK_JSON_VALUE_SCHEMA: z.ZodType<NetworkJsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(NETWORK_JSON_VALUE_SCHEMA),
    z.record(NETWORK_JSON_VALUE_SCHEMA),
  ]),
);

// ---------------------------------------------------------------------------
// Normalization (deterministic, locale-free)
// ---------------------------------------------------------------------------

const LEGAL_SUFFIXES = new Set([
  "llc",
  "inc",
  "incorporated",
  "corp",
  "corporation",
  "ltd",
  "limited",
  "pllc",
  "lp",
  "llp",
]);

export function stripDiacritics(value: string): string {
  return value.normalize("NFKD").replace(/[̀-ͯ]/g, "");
}

/** Lowercased, punctuation-free entity name with trailing legal suffixes removed. */
export function normalizeEntityName(value: string | null | undefined): string {
  if (!value) return "";
  const tokens = stripDiacritics(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  while (tokens.length && LEGAL_SUFFIXES.has(tokens[tokens.length - 1]!)) tokens.pop();
  return tokens.join(" ");
}

/** Ten-digit NANP form: digits only, leading country code 1 stripped. */
export function normalizePhoneDigits(value: string | null | undefined): string {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return digits;
}

/** Lowercased registrable host with a leading www. removed; "" if unparseable. */
export function normalizeWebsiteHost(value: string | null | undefined): string {
  if (!value) return "";
  try {
    const u = new URL(value.includes("://") ? value : `https://${value}`);
    return u.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function normalizePostalCode(value: string | null | undefined): string {
  return (value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
}

export interface NetworkAddressInput {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
}

/** Pipe-joined normalized address comparison key; "" when nothing comparable. */
export function normalizeAddressKey(
  value: NetworkAddressInput | null | undefined,
): string {
  if (!value) return "";
  return [value.street, value.city, value.state, normalizePostalCode(value.postalCode)]
    .map((v) => normalizeEntityName(v ?? ""))
    .filter(Boolean)
    .join("|");
}

/** Deterministic JSON with recursively sorted object keys (comparison key, not storage). */
export function stableNetworkJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableNetworkJson).join(",")}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stableNetworkJson(obj[k])}`)
    .join(",")}}`;
}

// ---------------------------------------------------------------------------
// Source authority
// ---------------------------------------------------------------------------

export const NETWORK_SOURCE_TIER: Record<NetworkSourceType, number> = {
  OFFICIAL_ORGANIZATION: 1,
  FEDERAL_GOVERNMENT: 2,
  LOUISIANA_DEPARTMENT_OF_HEALTH: 3,
  MEDICARE_CMS: 4,
  OFFICIAL_LICENSING_OR_GOVERNMENT_DIRECTORY: 5,
  LOCAL_GOVERNMENT: 6,
  ACCREDITED_DIRECTORY: 7,
  REPUTABLE_SECONDARY: 8,
  COMMERCIAL_DIRECTORY: 9,
  DISCOVERY_ONLY: 10,
};

const SOURCE_FIELD_RULES: Array<{
  prefix: string;
  allowedMaxTier: number;
  operationalMaxTier: number;
}> = [
  { prefix: "organization.identifiers", allowedMaxTier: 7, operationalMaxTier: 5 },
  { prefix: "organization.license", allowedMaxTier: 7, operationalMaxTier: 5 },
  { prefix: "locations", allowedMaxTier: 9, operationalMaxTier: 6 },
  { prefix: "contactPoints", allowedMaxTier: 9, operationalMaxTier: 6 },
  { prefix: "programs", allowedMaxTier: 8, operationalMaxTier: 6 },
  { prefix: "payerParticipation", allowedMaxTier: 8, operationalMaxTier: 5 },
  { prefix: "facilityAdmissionProfiles", allowedMaxTier: 8, operationalMaxTier: 6 },
  { prefix: "transportCapabilityProfiles", allowedMaxTier: 8, operationalMaxTier: 6 },
];

export function networkSourceTier(type: NetworkSourceType): number {
  return NETWORK_SOURCE_TIER[type];
}

export function isDiscoveryOnlySource(type: NetworkSourceType): boolean {
  return type === "DISCOVERY_ONLY";
}

/**
 * Whether a source type may support a populated value at the given field
 * path. Discovery-only sources may locate an entity but can never support a
 * populated field; operational use tightens the allowed tier further.
 */
export function networkSourceCanSupportField(
  type: NetworkSourceType,
  fieldPath: string,
  operational = false,
): boolean {
  if (isDiscoveryOnlySource(type)) return false;
  const rule = SOURCE_FIELD_RULES.find((r) => fieldPath.startsWith(r.prefix));
  if (!rule) return NETWORK_SOURCE_TIER[type] <= (operational ? 6 : 8);
  return NETWORK_SOURCE_TIER[type] <= (operational ? rule.operationalMaxTier : rule.allowedMaxTier);
}

// ---------------------------------------------------------------------------
// Freshness
// ---------------------------------------------------------------------------

export const DEFAULT_NETWORK_FRESHNESS_DAYS: Record<string, number> = {
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
  activeStatus: 30,
};

export function networkFreshnessState(
  asOf: string | Date,
  verifiedAt: string | Date | null,
  intervalDays: number,
): NetworkFreshnessState {
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

export function networkNextReviewAt(
  verifiedAt: string | Date,
  intervalDays: number,
): string | null {
  const d = typeof verifiedAt === "string" ? new Date(verifiedAt) : new Date(verifiedAt);
  if (Number.isNaN(d.getTime()) || intervalDays <= 0) return null;
  d.setUTCDate(d.getUTCDate() + intervalDays);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// Entity resolution (deterministic, explainable)
// ---------------------------------------------------------------------------

export const NetworkIdentifierSchema = z
  .object({ type: z.string().min(1).max(100), value: z.string().min(1).max(200) })
  .strict();
export type NetworkIdentifier = z.infer<typeof NetworkIdentifierSchema>;

export const NetworkAddressSchema = z
  .object({
    street: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    postalCode: z.string().nullable().optional(),
  })
  .strict();

export const NetworkResolutionTargetSchema = z
  .object({
    name: z.string().min(1),
    city: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    postalCode: z.string().nullable().optional(),
    address: NetworkAddressSchema.nullable().optional(),
    phone: z.string().nullable().optional(),
    website: z.string().nullable().optional(),
    parentName: z.string().nullable().optional(),
    identifiers: z.array(NetworkIdentifierSchema).optional(),
  })
  .strict();
export type NetworkResolutionTarget = z.infer<typeof NetworkResolutionTargetSchema>;

export const NetworkResolutionCandidateSchema = NetworkResolutionTargetSchema.extend({
  id: z.string().min(1),
  aliases: z.array(z.string()).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "CLOSED", "UNKNOWN"]).optional(),
}).strict();
export type NetworkResolutionCandidate = z.infer<typeof NetworkResolutionCandidateSchema>;

export interface NetworkMatchSignal {
  signal: string;
  weight: number;
  matched: boolean;
  detail: string;
}

export interface NetworkScoredCandidate {
  candidateId: string;
  rawScore: number;
  normalizedScore: number;
  hardConflict: boolean;
  signals: NetworkMatchSignal[];
}

export interface NetworkEntityResolutionResult {
  status: NetworkEntityResolutionStatus;
  selectedCandidateId: string | null;
  confidence: number;
  margin: number;
  reason: string;
  candidates: NetworkScoredCandidate[];
  requiresHumanReview: boolean;
}

function exact(a: string, b: string): boolean {
  return Boolean(a && b && a === b);
}

function identifierState(
  target: NetworkResolutionTarget,
  candidate: NetworkResolutionCandidate,
): { comparable: boolean; match: boolean; conflict: boolean; detail: string } {
  const t = new Map((target.identifiers ?? []).map((x) => [x.type.toLowerCase(), x.value.toLowerCase()]));
  const c = new Map((candidate.identifiers ?? []).map((x) => [x.type.toLowerCase(), x.value.toLowerCase()]));
  let comparable = false;
  let match = false;
  for (const [type, value] of t) {
    const other = c.get(type);
    if (!other) continue;
    comparable = true;
    if (other !== value) {
      return { comparable, match: false, conflict: true, detail: `Conflicting ${type} identifiers.` };
    }
    match = true;
  }
  return {
    comparable,
    match,
    conflict: false,
    detail: match ? "Official identifier matched." : "No comparable official identifier.",
  };
}

/**
 * Internal on purpose: the readiness doctrine bans score-named exports from
 * this package (see tests/unit/readiness.test.ts). Entity-match scoring is
 * organization identity matching, not patient/referral prioritization, and
 * its per-candidate scores are exposed as explainable data on the
 * `resolveNetworkEntity` result rather than as a callable scorer.
 */
function scoreNetworkResolutionCandidate(
  target: NetworkResolutionTarget,
  candidate: NetworkResolutionCandidate,
): NetworkScoredCandidate {
  const signals: NetworkMatchSignal[] = [];
  let possibleScore = 0;
  let rawScore = 0;
  const add = (
    signal: string,
    weight: number,
    comparable: boolean,
    matched: boolean,
    detail: string,
  ) => {
    signals.push({ signal, weight, matched, detail });
    if (comparable) possibleScore += weight;
    if (comparable && matched) rawScore += weight;
  };

  const ids = identifierState(target, candidate);
  add("official_identifier", 100, ids.comparable, ids.match, ids.detail);

  const targetName = normalizeEntityName(target.name);
  const candidateName = normalizeEntityName(candidate.name);
  const aliasMatch = (candidate.aliases ?? []).some((a) => exact(targetName, normalizeEntityName(a)));
  const nameMatched = exact(targetName, candidateName);
  add(
    "name_or_alias",
    30,
    Boolean(targetName && (candidateName || (candidate.aliases ?? []).length)),
    nameMatched || aliasMatch,
    nameMatched
      ? "Normalized legal/public name matched."
      : aliasMatch
        ? "Target matched an evidenced alias."
        : `${targetName} vs ${candidateName}`,
  );

  const tw = normalizeWebsiteHost(target.website);
  const cw = normalizeWebsiteHost(candidate.website);
  add("domain", 30, Boolean(tw && cw), exact(tw, cw), "Normalized website host comparison.");
  const ta = normalizeAddressKey(target.address);
  const ca = normalizeAddressKey(candidate.address);
  add("address", 25, Boolean(ta && ca), exact(ta, ca), "Normalized address comparison.");
  const tp = normalizePhoneDigits(target.phone);
  const cp = normalizePhoneDigits(candidate.phone);
  add("phone", 15, Boolean(tp && cp), exact(tp, cp), "Normalized phone comparison.");
  const tcity = normalizeEntityName(target.city);
  const ccity = normalizeEntityName(candidate.city);
  add("city", 10, Boolean(tcity && ccity), exact(tcity, ccity), "City comparison.");
  const tstate = normalizeEntityName(target.state);
  const cstate = normalizeEntityName(candidate.state);
  add("state", 5, Boolean(tstate && cstate), exact(tstate, cstate), "State comparison.");
  const tz = normalizePostalCode(target.postalCode);
  const cz = normalizePostalCode(candidate.postalCode);
  add("postal", 8, Boolean(tz && cz), exact(tz, cz), "Postal comparison.");
  const tparent = normalizeEntityName(target.parentName);
  const cparent = normalizeEntityName(candidate.parentName);
  add("parent", 8, Boolean(tparent && cparent), exact(tparent, cparent), "Parent organization comparison.");

  if (candidate.status === "INACTIVE" || candidate.status === "CLOSED") {
    rawScore -= Math.min(15, possibleScore * 0.15);
  }
  const normalizedScore = possibleScore ? Math.max(0, Math.min(1, rawScore / possibleScore)) : 0;
  return { candidateId: candidate.id, rawScore, normalizedScore, hardConflict: ids.conflict, signals };
}

/**
 * Deterministic resolution over pre-fetched candidates. Thresholds are the
 * package-proposed values: MATCHED needs score >= 0.80, margin >= 0.15, and
 * at least one strong signal; everything weaker requires human review.
 */
export function resolveNetworkEntity(
  target: NetworkResolutionTarget,
  candidates: NetworkResolutionCandidate[],
): NetworkEntityResolutionResult {
  const scored = candidates
    .map((c) => scoreNetworkResolutionCandidate(target, c))
    .sort((a, b) => b.normalizedScore - a.normalizedScore);
  if (!scored.length) {
    return {
      status: "NO_MATCH",
      selectedCandidateId: null,
      confidence: 0,
      margin: 0,
      reason: "No candidates supplied.",
      candidates: [],
      requiresHumanReview: true,
    };
  }
  const best = scored[0]!;
  const second = scored[1];
  const margin = best.normalizedScore - (second?.normalizedScore ?? 0);
  if (best.hardConflict) {
    return {
      status: "CONFLICT",
      selectedCandidateId: null,
      confidence: best.normalizedScore,
      margin,
      reason: "Official identifiers conflict.",
      candidates: scored,
      requiresHumanReview: true,
    };
  }
  const selected = candidates.find((c) => c.id === best.candidateId)!;
  if (best.normalizedScore < 0.45) {
    return {
      status: "NO_MATCH",
      selectedCandidateId: null,
      confidence: best.normalizedScore,
      margin,
      reason: "No candidate met the proposed minimum score.",
      candidates: scored,
      requiresHumanReview: true,
    };
  }
  if (second && second.normalizedScore >= 0.45 && margin < 0.15) {
    return {
      status: "AMBIGUOUS",
      selectedCandidateId: null,
      confidence: best.normalizedScore,
      margin,
      reason: "Multiple plausible candidates require human resolution.",
      candidates: scored,
      requiresHumanReview: true,
    };
  }
  if (selected.status === "INACTIVE" || selected.status === "CLOSED") {
    return {
      status: "INACTIVE_OR_CLOSED",
      selectedCandidateId: selected.id,
      confidence: best.normalizedScore,
      margin,
      reason: "Entity matched but is marked inactive or closed.",
      candidates: scored,
      requiresHumanReview: true,
    };
  }
  const hasStrongSignal = best.signals.some(
    (s) => s.matched && ["official_identifier", "domain", "address", "phone"].includes(s.signal),
  );
  if (best.normalizedScore >= 0.8 && margin >= 0.15 && hasStrongSignal) {
    return {
      status: "MATCHED",
      selectedCandidateId: selected.id,
      confidence: best.normalizedScore,
      margin,
      reason: "Candidate met the proposed match, separation, and strong-signal thresholds.",
      candidates: scored,
      requiresHumanReview: false,
    };
  }
  return {
    status: "PROBABLE_MATCH",
    selectedCandidateId: selected.id,
    confidence: best.normalizedScore,
    margin,
    reason: "Candidate is plausible but requires human confirmation.",
    candidates: scored,
    requiresHumanReview: true,
  };
}

// ---------------------------------------------------------------------------
// Enrichment package envelope
// ---------------------------------------------------------------------------

export const NetworkFieldEvidenceSchema = z
  .object({
    evidenceId: DOMAIN_ID_SCHEMA,
    sourceType: z.enum(NETWORK_SOURCE_TYPES),
    sourceTier: z.number().int().min(1).max(10),
    sourceTitle: z.string().min(1).max(500),
    sourceUrl: z.string().min(1).max(2000),
    retrievedAt: z.string(),
    publishedOrEffectiveAt: z.string().nullable(),
    evidenceText: z.string().min(1).max(10_000),
    supportsFields: z.array(z.string().min(1)),
    scope: z.enum(NETWORK_EVIDENCE_SCOPES),
    confidence: z.enum(NETWORK_CONFIDENCE_LEVELS),
    contentHash: z.string().nullable().optional(),
  })
  .strict();
export type NetworkFieldEvidence = z.infer<typeof NetworkFieldEvidenceSchema>;

export const NetworkCandidateFieldSchema = z
  .object({
    candidateId: DOMAIN_ID_SCHEMA,
    fieldPath: z.string().min(1).max(500),
    currentValue: NETWORK_JSON_VALUE_SCHEMA.nullable(),
    proposedValue: NETWORK_JSON_VALUE_SCHEMA.nullable(),
    normalizedValue: NETWORK_JSON_VALUE_SCHEMA.nullable(),
    reviewState: z.enum(NETWORK_REVIEW_STATES),
    operationalUseStatus: z.enum(NETWORK_OPERATIONAL_USE_STATUSES),
    evidenceIds: z.array(DOMAIN_ID_SCHEMA),
    confidence: z.enum(NETWORK_CONFIDENCE_LEVELS),
    sourceEffectiveAt: z.string().nullable(),
    lastHumanVerifiedAt: z.string().nullable(),
    nextReviewAt: z.string().nullable(),
    proposedReviewerRoles: z.array(z.string().min(1)),
  })
  .strict();
export type NetworkCandidateField = z.infer<typeof NetworkCandidateFieldSchema>;

export const NetworkConflictSetSchema = z
  .object({
    conflictId: DOMAIN_ID_SCHEMA,
    fieldPath: z.string().min(1).max(500),
    candidateIds: z.array(DOMAIN_ID_SCHEMA).min(2),
    reason: z.string().min(1).max(2000),
    recommendedReviewerRoles: z.array(z.string().min(1)),
  })
  .strict();
export type NetworkConflictSet = z.infer<typeof NetworkConflictSetSchema>;

export const NetworkEntityResolutionResultSchema = z
  .object({
    status: z.enum(NETWORK_ENTITY_RESOLUTION_STATUSES),
    selectedCandidateId: z.string().nullable(),
    confidence: z.number().min(0).max(1),
    margin: z.number(),
    reason: z.string().min(1),
    candidates: z.array(
      z
        .object({
          candidateId: z.string().min(1),
          rawScore: z.number(),
          normalizedScore: z.number(),
          hardConflict: z.boolean(),
          signals: z.array(
            z
              .object({
                signal: z.string(),
                weight: z.number(),
                matched: z.boolean(),
                detail: z.string(),
              })
              .strict(),
          ),
        })
        .strict(),
    ),
    requiresHumanReview: z.boolean(),
  })
  .strict();

export const NetworkEnrichmentPackageSchema = z
  .object({
    schemaVersion: z.literal(NETWORK_ENRICHMENT_SCHEMA_VERSION),
    runId: DOMAIN_ID_SCHEMA,
    organizationId: DOMAIN_ID_SCHEMA,
    entityResolution: NetworkEntityResolutionResultSchema,
    candidates: z.array(NetworkCandidateFieldSchema),
    evidence: z.array(NetworkFieldEvidenceSchema),
    conflicts: z.array(NetworkConflictSetSchema),
    unresolvedFields: z.array(
      z
        .object({
          fieldPath: z.string().min(1),
          reason: z.string().min(1),
          recommendedAction: z.string().min(1),
        })
        .strict(),
    ),
    limitations: z.array(z.string()),
  })
  .strict();
export type NetworkEnrichmentPackage = z.infer<typeof NetworkEnrichmentPackageSchema>;

// ---------------------------------------------------------------------------
// Conflict detection
// ---------------------------------------------------------------------------

function comparableValueKey(value: NetworkJsonValue | null): string {
  if (typeof value === "string") return value.trim().toLowerCase().replace(/\s+/g, " ");
  return stableNetworkJson(value);
}

/**
 * Groups candidate fields by fieldPath and reports every path with more than
 * one distinct normalized value. Conflicts are preserved for human review —
 * never auto-resolved, never collapsed to a winner.
 *
 * NOT the same concept as `NetworkReviewConflictRecord` in
 * networkEnrichmentReview.ts: this is the raw multi-candidate disagreement
 * detected during resolution, before any package enters human review; the
 * review-side record additionally tracks a persisted resolution status,
 * resolver, and workflow version once a human has acted on it. A bridge from
 * this shape to that one does not exist yet.
 */
export function detectNetworkFieldConflicts(
  candidates: NetworkCandidateField[],
): NetworkConflictSet[] {
  const byField = new Map<string, NetworkCandidateField[]>();
  for (const candidate of candidates) {
    const list = byField.get(candidate.fieldPath) ?? [];
    list.push(candidate);
    byField.set(candidate.fieldPath, list);
  }
  const conflicts: NetworkConflictSet[] = [];
  for (const [fieldPath, list] of byField) {
    const values = new Map<string, NetworkCandidateField[]>();
    for (const item of list) {
      const key = comparableValueKey(item.normalizedValue ?? item.proposedValue);
      const group = values.get(key) ?? [];
      group.push(item);
      values.set(key, group);
    }
    if (values.size > 1) {
      conflicts.push({
        conflictId: `conflict:${fieldPath}`,
        fieldPath,
        candidateIds: list.map((x) => x.candidateId),
        reason: "Multiple distinct candidate values are supported for the same field path.",
        recommendedReviewerRoles: Array.from(new Set(list.flatMap((x) => x.proposedReviewerRoles))),
      });
    }
  }
  return conflicts;
}

// ---------------------------------------------------------------------------
// Review-routing policy
// ---------------------------------------------------------------------------

export interface NetworkReviewRequirement {
  roles: NetworkReviewerRole[];
  mode: "ANY" | "ALL_DISTINCT";
}

const SENSITIVE_REVIEW_ROUTES: Array<{ prefix: string; requirement: NetworkReviewRequirement }> = [
  {
    prefix: "facilityAdmissionProfiles.acceptanceAuthority",
    requirement: { roles: ["FACILITY_CLINICAL_GOVERNANCE", "FACILITY_LEGAL_COMPLIANCE"], mode: "ALL_DISTINCT" },
  },
  {
    prefix: "facilityAdmissionProfiles.labRequirements",
    requirement: { roles: ["FACILITY_CLINICAL_GOVERNANCE"], mode: "ANY" },
  },
  {
    prefix: "facilityAdmissionProfiles.inclusionCriteria",
    requirement: { roles: ["FACILITY_CLINICAL_GOVERNANCE"], mode: "ANY" },
  },
  {
    prefix: "facilityAdmissionProfiles.exclusionCriteria",
    requirement: { roles: ["FACILITY_CLINICAL_GOVERNANCE"], mode: "ANY" },
  },
  {
    prefix: "facilityAdmissionProfiles.legalStatuses",
    requirement: { roles: ["FACILITY_LEGAL_COMPLIANCE"], mode: "ANY" },
  },
  {
    prefix: "facilityAdmissionProfiles.guardianRequirements",
    requirement: { roles: ["FACILITY_LEGAL_COMPLIANCE"], mode: "ANY" },
  },
  {
    prefix: "transportCapabilityProfiles",
    requirement: { roles: ["FACILITY_OPERATIONS", "FACILITY_LEGAL_COMPLIANCE"], mode: "ALL_DISTINCT" },
  },
  {
    prefix: "payerParticipation",
    requirement: { roles: ["PAYER_BENEFITS_REVIEWER"], mode: "ANY" },
  },
  {
    prefix: "organization.license",
    requirement: { roles: ["COMPLIANCE_REVIEWER"], mode: "ANY" },
  },
];

export function networkReviewRequirement(fieldPath: string): NetworkReviewRequirement {
  return (
    SENSITIVE_REVIEW_ROUTES.find((x) => fieldPath.startsWith(x.prefix))?.requirement ?? {
      roles: ["NETWORK_REVIEWER"],
      mode: "ANY",
    }
  );
}

export function requiredNetworkReviewerRoles(fieldPath: string): NetworkReviewerRole[] {
  return networkReviewRequirement(fieldPath).roles;
}

/** Human-confirmed values are never agent-replaceable. */
export function canAgentReplaceNetworkField(reviewState: NetworkReviewState): boolean {
  return reviewState !== "HUMAN_CONFIRMED";
}

/**
 * Policy errors for a single agent-produced candidate field. Agents can never
 * emit HUMAN_CONFIRMED, must carry every required reviewer role, and must
 * leave sensitive fields REQUIRES_REVIEW.
 */
export function enforceNetworkCandidatePolicy(candidate: NetworkCandidateField): string[] {
  const errors: string[] = [];
  if (candidate.reviewState === "HUMAN_CONFIRMED") {
    errors.push("Agents cannot create HUMAN_CONFIRMED candidate fields.");
  }
  const required = requiredNetworkReviewerRoles(candidate.fieldPath);
  for (const role of required) {
    if (!candidate.proposedReviewerRoles.includes(role)) {
      errors.push(`Missing required reviewer role ${role}.`);
    }
  }
  if (
    required.some((r) => r !== "NETWORK_REVIEWER") &&
    candidate.operationalUseStatus !== "REQUIRES_REVIEW"
  ) {
    errors.push("Sensitive fields must remain REQUIRES_REVIEW until an authorized human decision.");
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Candidate-package validation
// ---------------------------------------------------------------------------

function isCanonicalIsoOrNull(value: string | null): boolean {
  if (value === null) return true;
  const d = new Date(value);
  return !Number.isNaN(d.getTime()) && d.toISOString() === value;
}

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Cross-field validation of a structurally parsed enrichment package. Returns
 * every violation (empty array means valid): evidence linkage and field
 * support, source-authority limits, canonical UTC ISO timestamps, the
 * null-not-"Unknown" rule, and the agent candidate policy.
 */
export function validateNetworkEnrichmentPackage(pkg: NetworkEnrichmentPackage): string[] {
  const errors: string[] = [];
  if (pkg.schemaVersion !== NETWORK_ENRICHMENT_SCHEMA_VERSION) errors.push("Unsupported schemaVersion.");
  if (!pkg.runId) errors.push("runId is required.");
  if (!pkg.organizationId) errors.push("organizationId is required.");
  if (!NETWORK_ENTITY_RESOLUTION_STATUSES.includes(pkg.entityResolution.status)) {
    errors.push("Invalid entity resolution status.");
  }
  const evidenceById = new Map(pkg.evidence.map((e) => [e.evidenceId, e]));
  for (const e of pkg.evidence) {
    if (!NETWORK_SOURCE_TYPES.includes(e.sourceType)) errors.push(`Evidence ${e.evidenceId}: invalid sourceType.`);
    if (networkSourceTier(e.sourceType) !== e.sourceTier) {
      errors.push(`Evidence ${e.evidenceId}: sourceTier does not match sourceType.`);
    }
    if (!isHttpUrl(e.sourceUrl)) errors.push(`Evidence ${e.evidenceId}: invalid sourceUrl.`);
    if (!isCanonicalIsoOrNull(e.retrievedAt) || !isCanonicalIsoOrNull(e.publishedOrEffectiveAt)) {
      errors.push(`Evidence ${e.evidenceId}: invalid ISO timestamp.`);
    }
    if (!e.supportsFields.length) errors.push(`Evidence ${e.evidenceId}: supportsFields is required.`);
  }
  for (const c of pkg.candidates) {
    if (!NETWORK_REVIEW_STATES.includes(c.reviewState)) {
      errors.push(`Candidate ${c.candidateId}: invalid reviewState.`);
    }
    if (c.proposedValue === "Unknown" || c.normalizedValue === "Unknown") {
      errors.push(`Candidate ${c.candidateId}: use null, not the string Unknown.`);
    }
    if (!c.evidenceIds.length) errors.push(`Candidate ${c.candidateId}: at least one evidenceId is required.`);
    for (const id of c.evidenceIds) {
      const e = evidenceById.get(id);
      if (!e) {
        errors.push(`Candidate ${c.candidateId}: missing evidence ${id}.`);
        continue;
      }
      if (!e.supportsFields.includes(c.fieldPath)) {
        errors.push(`Candidate ${c.candidateId}: evidence ${id} does not support ${c.fieldPath}.`);
      }
      if (
        !networkSourceCanSupportField(
          e.sourceType,
          c.fieldPath,
          c.operationalUseStatus === "APPROVED_OPERATIONAL",
        )
      ) {
        errors.push(`Candidate ${c.candidateId}: source ${e.sourceType} cannot support ${c.fieldPath}.`);
      }
    }
    if (
      !isCanonicalIsoOrNull(c.sourceEffectiveAt) ||
      !isCanonicalIsoOrNull(c.lastHumanVerifiedAt) ||
      !isCanonicalIsoOrNull(c.nextReviewAt)
    ) {
      errors.push(`Candidate ${c.candidateId}: invalid ISO timestamp.`);
    }
    errors.push(...enforceNetworkCandidatePolicy(c).map((x) => `Candidate ${c.candidateId}: ${x}`));
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Outbound URL safety (pure validation; no fetching exists in this slice)
// ---------------------------------------------------------------------------

export interface NetworkUrlSafetyPolicy {
  allowedDomainSuffixes?: string[];
  allowHttp?: boolean;
}

function isPrivateIpv4(host: string): boolean {
  const parts = host.split(".").map(Number);
  if (parts.length !== 4 || parts.some((x) => !Number.isInteger(x) || x < 0 || x > 255)) return false;
  const [a = -1, b = -1] = parts;
  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a === 0
  );
}

function isUnsafeHostname(host: string): boolean {
  const normalized = host.toLowerCase().replace(/\.$/, "");
  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal") ||
    isPrivateIpv4(normalized) ||
    normalized === "::1" ||
    normalized.startsWith("fe80:") ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd")
  );
}

/**
 * Validates a URL a future enrichment worker would be allowed to touch:
 * HTTPS-only by default, no embedded credentials, no private/loopback/
 * link-local/internal hosts, optional domain allowlist. This slice ships the
 * validator only — no code here performs any network access.
 */
export function validateNetworkOutboundUrl(
  value: string,
  policy: NetworkUrlSafetyPolicy = {},
): string[] {
  const errors: string[] = [];
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return ["URL is invalid."];
  }
  if (!policy.allowHttp && url.protocol !== "https:") errors.push("Only HTTPS URLs are allowed.");
  if (policy.allowHttp && !["https:", "http:"].includes(url.protocol)) {
    errors.push("Only HTTP(S) URLs are allowed.");
  }
  if (url.username || url.password) errors.push("URLs containing credentials are prohibited.");
  if (isUnsafeHostname(url.hostname)) {
    errors.push("Private, loopback, link-local, or internal hosts are prohibited.");
  }
  if (policy.allowedDomainSuffixes?.length) {
    const host = url.hostname.toLowerCase();
    const allowed = policy.allowedDomainSuffixes.some(
      (suffix) => host === suffix.toLowerCase() || host.endsWith(`.${suffix.toLowerCase()}`),
    );
    if (!allowed) errors.push("Domain is not allowlisted.");
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Deterministic evaluation metrics (synthetic-fixture accuracy measurement)
// ---------------------------------------------------------------------------

export interface NetworkEvaluationObservation {
  expectedMatchId: string | null;
  predictedMatchId: string | null;
  expectedConflict: boolean;
  predictedConflict: boolean;
  expectedStale: boolean;
  predictedStale: boolean;
  totalCandidateFields: number;
  supportedCandidateFields: number;
  acceptedUnsupportedFields: number;
  authoritativeEvidenceCount: number;
  evidenceCount: number;
  requiredHumanReview: boolean;
}

export interface NetworkAccuracyMetrics {
  entityPrecision: number;
  entityRecall: number;
  falseMergeRate: number;
  conflictDetectionRate: number;
  staleDetectionRate: number;
  evidenceCoverageRate: number;
  unsupportedFieldRate: number;
  authoritativeSourceUtilizationRate: number;
  humanReviewEscalationRate: number;
}

function safeRatio(n: number, d: number): number {
  return d ? n / d : 0;
}

export function calculateNetworkAccuracyMetrics(
  rows: NetworkEvaluationObservation[],
): NetworkAccuracyMetrics {
  let tp = 0,
    fp = 0,
    fn = 0,
    falseMerges = 0,
    conflictTp = 0,
    conflictExpected = 0,
    staleTp = 0,
    staleExpected = 0;
  let totalFields = 0,
    supportedFields = 0,
    unsupported = 0,
    authoritative = 0,
    evidence = 0,
    escalated = 0;
  for (const r of rows) {
    if (r.predictedMatchId && r.predictedMatchId === r.expectedMatchId) tp++;
    if (r.predictedMatchId && r.predictedMatchId !== r.expectedMatchId) {
      fp++;
      falseMerges++;
    }
    if (r.expectedMatchId && r.predictedMatchId !== r.expectedMatchId) fn++;
    if (r.expectedConflict) {
      conflictExpected++;
      if (r.predictedConflict) conflictTp++;
    }
    if (r.expectedStale) {
      staleExpected++;
      if (r.predictedStale) staleTp++;
    }
    totalFields += r.totalCandidateFields;
    supportedFields += r.supportedCandidateFields;
    unsupported += r.acceptedUnsupportedFields;
    authoritative += r.authoritativeEvidenceCount;
    evidence += r.evidenceCount;
    if (r.requiredHumanReview) escalated++;
  }
  return {
    entityPrecision: safeRatio(tp, tp + fp),
    entityRecall: safeRatio(tp, tp + fn),
    falseMergeRate: safeRatio(falseMerges, rows.length),
    conflictDetectionRate: safeRatio(conflictTp, conflictExpected),
    staleDetectionRate: safeRatio(staleTp, staleExpected),
    evidenceCoverageRate: safeRatio(supportedFields, totalFields),
    unsupportedFieldRate: safeRatio(unsupported, totalFields),
    authoritativeSourceUtilizationRate: safeRatio(authoritative, evidence),
    humanReviewEscalationRate: safeRatio(escalated, rows.length),
  };
}
