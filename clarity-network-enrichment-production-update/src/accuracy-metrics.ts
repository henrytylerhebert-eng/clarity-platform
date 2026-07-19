export interface EvaluationObservation {
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

export interface AccuracyMetrics {
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

function safe(n: number, d: number): number { return d ? n / d : 0; }

export function calculateAccuracyMetrics(rows: EvaluationObservation[]): AccuracyMetrics {
  let tp = 0, fp = 0, fn = 0, falseMerges = 0, conflictTp = 0, conflictExpected = 0, staleTp = 0, staleExpected = 0;
  let totalFields = 0, supportedFields = 0, unsupported = 0, authoritative = 0, evidence = 0, escalated = 0;
  for (const r of rows) {
    if (r.predictedMatchId && r.predictedMatchId === r.expectedMatchId) tp++;
    if (r.predictedMatchId && r.predictedMatchId !== r.expectedMatchId) { fp++; falseMerges++; }
    if (r.expectedMatchId && r.predictedMatchId !== r.expectedMatchId) fn++;
    if (r.expectedConflict) { conflictExpected++; if (r.predictedConflict) conflictTp++; }
    if (r.expectedStale) { staleExpected++; if (r.predictedStale) staleTp++; }
    totalFields += r.totalCandidateFields; supportedFields += r.supportedCandidateFields; unsupported += r.acceptedUnsupportedFields;
    authoritative += r.authoritativeEvidenceCount; evidence += r.evidenceCount; if (r.requiredHumanReview) escalated++;
  }
  return {
    entityPrecision: safe(tp, tp + fp),
    entityRecall: safe(tp, tp + fn),
    falseMergeRate: safe(falseMerges, rows.length),
    conflictDetectionRate: safe(conflictTp, conflictExpected),
    staleDetectionRate: safe(staleTp, staleExpected),
    evidenceCoverageRate: safe(supportedFields, totalFields),
    unsupportedFieldRate: safe(unsupported, totalFields),
    authoritativeSourceUtilizationRate: safe(authoritative, evidence),
    humanReviewEscalationRate: safe(escalated, rows.length)
  };
}
