import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  normalizeName, normalizePhone, normalizeWebsite, resolveEntity, freshnessState,
  detectConflicts, validateEnrichmentPackage, requiredReviewerRoles, canAgentReplace,
  calculateAccuracyMetrics, type CandidateField, type EnrichmentPackage
} from "../src/index";

test("normalizes names, phones and domains", () => {
  assert.equal(normalizeName("Acadiana Recovery Center, LLC"), "acadiana recovery center");
  assert.equal(normalizePhone("+1 (337) 555-0100"), "3375550100");
  assert.equal(normalizeWebsite("https://www.Example.org/path"), "example.org");
});

test("resolves all synthetic entity scenarios as expected", () => {
  const file = resolve(process.cwd(), "fixtures/entity-resolution-scenarios.json");
  const scenarios = JSON.parse(readFileSync(file, "utf8"));
  for (const scenario of scenarios) {
    const result = resolveEntity(scenario.target, scenario.candidates);
    assert.equal(result.status, scenario.expectedStatus, scenario.id);
    assert.equal(result.selectedCandidateId, scenario.expectedId, scenario.id);
  }
});

test("detects freshness states", () => {
  assert.equal(freshnessState("2026-07-19T00:00:00.000Z", "2026-07-01T00:00:00.000Z", 30), "CURRENT");
  assert.equal(freshnessState("2026-07-19T00:00:00.000Z", "2026-06-20T00:00:00.000Z", 30), "DUE_SOON");
  assert.equal(freshnessState("2026-07-19T00:00:00.000Z", "2026-06-01T00:00:00.000Z", 30), "STALE");
  assert.equal(freshnessState("2026-07-19T00:00:00.000Z", "2026-04-01T00:00:00.000Z", 30), "EXPIRED");
});

test("preserves conflicting field candidates", () => {
  const base: Omit<CandidateField, "candidateId" | "proposedValue" | "normalizedValue"> = {
    fieldPath: "contactPoints.admissions.phone", currentValue: null, reviewState: "CANDIDATE",
    operationalUseStatus: "REQUIRES_REVIEW", evidenceIds: ["e"], confidence: "HIGH",
    sourceEffectiveAt: null, lastHumanVerifiedAt: null, nextReviewAt: null, proposedReviewerRoles: ["NETWORK_REVIEWER"]
  };
  const conflicts = detectConflicts([
    { ...base, candidateId: "a", proposedValue: "3375550100", normalizedValue: "3375550100" },
    { ...base, candidateId: "b", proposedValue: "3375559999", normalizedValue: "3375559999" }
  ]);
  assert.equal(conflicts.length, 1);
  assert.deepEqual(conflicts[0].candidateIds, ["a", "b"]);
});

test("routes sensitive admission fields to governance review", () => {
  assert.deepEqual(requiredReviewerRoles("facilityAdmissionProfiles.labRequirements.cbc"), ["FACILITY_CLINICAL_GOVERNANCE"]);
  assert.equal(canAgentReplace("HUMAN_CONFIRMED"), false);
  assert.equal(canAgentReplace("STALE"), true);
});

test("validates evidence coverage and rejects Unknown string", () => {
  const pkg: EnrichmentPackage = {
    schemaVersion: "clarity.network-enrichment.v1", runId: "run-1", organizationId: "org-1",
    entityResolution: { status: "MATCHED", selectedCandidateId: "x", confidence: 1, margin: 1, reason: "test", candidates: [], requiresHumanReview: false },
    evidence: [{ evidenceId: "e1", sourceType: "OFFICIAL_ORGANIZATION", sourceTier: 1, sourceTitle: "Admissions", sourceUrl: "https://example.org", retrievedAt: "2026-07-19T00:00:00.000Z", publishedOrEffectiveAt: null, evidenceText: "Admissions line", supportsFields: ["contactPoints.admissions.phone"], scope: "CONTACT", confidence: "HIGH" }],
    candidates: [{ candidateId: "c1", fieldPath: "contactPoints.admissions.phone", currentValue: null, proposedValue: "Unknown", normalizedValue: "Unknown", reviewState: "CANDIDATE", operationalUseStatus: "REQUIRES_REVIEW", evidenceIds: ["e1"], confidence: "HIGH", sourceEffectiveAt: null, lastHumanVerifiedAt: null, nextReviewAt: null, proposedReviewerRoles: ["NETWORK_REVIEWER"] }],
    conflicts: [], unresolvedFields: [], limitations: []
  };
  const errors = validateEnrichmentPackage(pkg);
  assert.ok(errors.some(e => e.includes("use null")));
});

test("rejects discovery-only evidence as field support", () => {
  const pkg: EnrichmentPackage = {
    schemaVersion: "clarity.network-enrichment.v1", runId: "run-2", organizationId: "org-1",
    entityResolution: { status: "PROBABLE_MATCH", selectedCandidateId: "x", confidence: .7, margin: .2, reason: "test", candidates: [], requiresHumanReview: true },
    evidence: [{ evidenceId: "e1", sourceType: "DISCOVERY_ONLY", sourceTier: 10, sourceTitle: "Search", sourceUrl: "https://search.example", retrievedAt: "2026-07-19T00:00:00.000Z", publishedOrEffectiveAt: null, evidenceText: "Phone", supportsFields: ["contactPoints.general.phone"], scope: "CONTACT", confidence: "LOW" }],
    candidates: [{ candidateId: "c1", fieldPath: "contactPoints.general.phone", currentValue: null, proposedValue: "3375550100", normalizedValue: "3375550100", reviewState: "CANDIDATE", operationalUseStatus: "REQUIRES_REVIEW", evidenceIds: ["e1"], confidence: "LOW", sourceEffectiveAt: null, lastHumanVerifiedAt: null, nextReviewAt: null, proposedReviewerRoles: ["NETWORK_REVIEWER"] }],
    conflicts: [], unresolvedFields: [], limitations: []
  };
  assert.ok(validateEnrichmentPackage(pkg).some(e => e.includes("cannot support")));
});

test("calculates deterministic evaluation metrics", () => {
  const metrics = calculateAccuracyMetrics([
    { expectedMatchId: "a", predictedMatchId: "a", expectedConflict: true, predictedConflict: true, expectedStale: true, predictedStale: true, totalCandidateFields: 2, supportedCandidateFields: 2, acceptedUnsupportedFields: 0, authoritativeEvidenceCount: 2, evidenceCount: 2, requiredHumanReview: true },
    { expectedMatchId: null, predictedMatchId: null, expectedConflict: false, predictedConflict: false, expectedStale: false, predictedStale: false, totalCandidateFields: 1, supportedCandidateFields: 1, acceptedUnsupportedFields: 0, authoritativeEvidenceCount: 1, evidenceCount: 1, requiredHumanReview: false }
  ]);
  assert.equal(metrics.entityPrecision, 1);
  assert.equal(metrics.entityRecall, 1);
  assert.equal(metrics.evidenceCoverageRate, 1);
  assert.equal(metrics.conflictDetectionRate, 1);
});

import { validateOutboundUrl, InMemoryNetworkEnrichmentStore, NetworkEnrichmentService, DomainError, type CandidateRecord } from "../src/index";

test("blocks private and non-allowlisted outbound URLs", () => {
  assert.ok(validateOutboundUrl("http://127.0.0.1/admin").length >= 1);
  assert.ok(validateOutboundUrl("https://example.org", { allowedDomainSuffixes: ["cms.gov"] }).some(e => e.includes("allowlisted")));
  assert.deepEqual(validateOutboundUrl("https://data.cms.gov/path", { allowedDomainSuffixes: ["cms.gov"] }), []);
});

function candidateRecord(fieldPath = "contactPoints.admissions.phone"): CandidateRecord {
  return {
    candidateId: "cand-service", fieldPath, currentValue: null, proposedValue: "3375550100", normalizedValue: "3375550100",
    reviewState: "CANDIDATE", operationalUseStatus: "REQUIRES_REVIEW", evidenceIds: ["ev"], confidence: "HIGH",
    sourceEffectiveAt: null, lastHumanVerifiedAt: null, nextReviewAt: null,
    proposedReviewerRoles: fieldPath.startsWith("facilityAdmissionProfiles.acceptanceAuthority") ? ["FACILITY_CLINICAL_GOVERNANCE", "FACILITY_LEGAL_COMPLIANCE"] : ["NETWORK_REVIEWER"],
    organizationId: "org-a", runId: "run", version: 1, approvals: []
  };
}

test("review service enforces tenant scope, versioning and idempotency", () => {
  const store = new InMemoryNetworkEnrichmentStore();
  store.seedCandidate(candidateRecord());
  const service = new NetworkEnrichmentService(store, () => "2026-07-19T00:00:00.000Z");
  const command = { commandId: "cmd-1", idempotencyKey: "idem-1", correlationId: "corr-1", expectedVersion: 1, payload: { candidateId: "cand-service" } };
  const actor = { actorId: "reviewer", organizationId: "org-a", roles: ["NETWORK_REVIEWER"] };
  const first = service.approveCandidate(actor, command);
  const replay = service.approveCandidate(actor, command);
  assert.equal(first.reviewState, "HUMAN_CONFIRMED");
  assert.deepEqual(replay, first);
  assert.equal(store.audits.length, 1);
  assert.throws(() => service.approveCandidate({ ...actor, organizationId: "org-b" }, { ...command, commandId: "cmd-2", idempotencyKey: "idem-2", expectedVersion: 2 }), (e: unknown) => e instanceof DomainError && e.code === "NOT_FOUND");
});

test("sensitive acceptance authority requires distinct clinical and legal approvals", () => {
  const store = new InMemoryNetworkEnrichmentStore();
  store.seedCandidate(candidateRecord("facilityAdmissionProfiles.acceptanceAuthority.role"));
  const service = new NetworkEnrichmentService(store, () => "2026-07-19T00:00:00.000Z");
  const clinical = service.approveCandidate(
    { actorId: "clin", organizationId: "org-a", roles: ["FACILITY_CLINICAL_GOVERNANCE"] },
    { commandId: "cmd-c", idempotencyKey: "idem-c", correlationId: "corr", expectedVersion: 1, payload: { candidateId: "cand-service" } }
  );
  assert.equal(clinical.reviewState, "SOURCE_CONFIRMED");
  const legal = service.approveCandidate(
    { actorId: "legal", organizationId: "org-a", roles: ["FACILITY_LEGAL_COMPLIANCE"] },
    { commandId: "cmd-l", idempotencyKey: "idem-l", correlationId: "corr", expectedVersion: 2, payload: { candidateId: "cand-service" } }
  );
  assert.equal(legal.reviewState, "HUMAN_CONFIRMED");
  assert.equal(legal.approvals.length, 2);
  assert.equal(legal.operationalUseStatus, "APPROVED_OPERATIONAL");
});
