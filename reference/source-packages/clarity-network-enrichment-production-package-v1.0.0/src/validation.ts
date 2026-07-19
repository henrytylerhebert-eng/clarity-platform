import { ENTITY_RESOLUTION_STATUSES, REVIEW_STATES, SOURCE_TYPES, type EnrichmentPackage } from "./types";
import { sourceCanSupportField, sourceTier } from "./source-authority";
import { enforceCandidatePolicy } from "./review-policy";

function isIso(value: string | null): boolean {
  if (value === null) return true;
  const d = new Date(value);
  return !Number.isNaN(d.getTime()) && d.toISOString() === value;
}

function isUrl(value: string): boolean {
  try { const u = new URL(value); return u.protocol === "https:" || u.protocol === "http:"; } catch { return false; }
}

export function validateEnrichmentPackage(pkg: EnrichmentPackage): string[] {
  const errors: string[] = [];
  if (pkg.schemaVersion !== "clarity.network-enrichment.v1") errors.push("Unsupported schemaVersion.");
  if (!pkg.runId) errors.push("runId is required.");
  if (!pkg.organizationId) errors.push("organizationId is required.");
  if (!ENTITY_RESOLUTION_STATUSES.includes(pkg.entityResolution.status)) errors.push("Invalid entity resolution status.");
  const evidenceById = new Map(pkg.evidence.map(e => [e.evidenceId, e]));
  for (const e of pkg.evidence) {
    if (!SOURCE_TYPES.includes(e.sourceType)) errors.push(`Evidence ${e.evidenceId}: invalid sourceType.`);
    if (sourceTier(e.sourceType) !== e.sourceTier) errors.push(`Evidence ${e.evidenceId}: sourceTier does not match sourceType.`);
    if (!isUrl(e.sourceUrl)) errors.push(`Evidence ${e.evidenceId}: invalid sourceUrl.`);
    if (!isIso(e.retrievedAt) || !isIso(e.publishedOrEffectiveAt)) errors.push(`Evidence ${e.evidenceId}: invalid ISO timestamp.`);
    if (!e.supportsFields.length) errors.push(`Evidence ${e.evidenceId}: supportsFields is required.`);
  }
  for (const c of pkg.candidates) {
    if (!REVIEW_STATES.includes(c.reviewState)) errors.push(`Candidate ${c.candidateId}: invalid reviewState.`);
    if (c.proposedValue === "Unknown" || c.normalizedValue === "Unknown") errors.push(`Candidate ${c.candidateId}: use null, not the string Unknown.`);
    if (!c.evidenceIds.length) errors.push(`Candidate ${c.candidateId}: at least one evidenceId is required.`);
    for (const id of c.evidenceIds) {
      const e = evidenceById.get(id);
      if (!e) { errors.push(`Candidate ${c.candidateId}: missing evidence ${id}.`); continue; }
      if (!e.supportsFields.includes(c.fieldPath)) errors.push(`Candidate ${c.candidateId}: evidence ${id} does not support ${c.fieldPath}.`);
      if (!sourceCanSupportField(e.sourceType, c.fieldPath, c.operationalUseStatus === "APPROVED_OPERATIONAL")) errors.push(`Candidate ${c.candidateId}: source ${e.sourceType} cannot support ${c.fieldPath}.`);
    }
    if (!isIso(c.sourceEffectiveAt) || !isIso(c.lastHumanVerifiedAt) || !isIso(c.nextReviewAt)) errors.push(`Candidate ${c.candidateId}: invalid ISO timestamp.`);
    errors.push(...enforceCandidatePolicy(c).map(x => `Candidate ${c.candidateId}: ${x}`));
  }
  return errors;
}
